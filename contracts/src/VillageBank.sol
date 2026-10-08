// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Koin} from "./Koin.sol";
import {SimStock} from "./SimStock.sol";
import {VillageMarket} from "./VillageMarket.sol";
import {IPriceOracle} from "./interfaces/IPriceOracle.sol";

/// @notice Collateralised Koin loans (0% interest). Collateral is any stock listed on the Market.
/// @dev Koin amounts have 18 decimals, prices 8 decimals, health factor is 1e18-scaled.
contract VillageBank is ReentrancyGuard {
    using SafeERC20 for SimStock;

    uint256 public constant BPS = 10_000;
    uint256 public constant MAX_LTV_BPS = 5_000;
    uint256 public constant LIQUIDATION_THRESHOLD_BPS = 8_000;
    uint256 public constant CLOSE_FACTOR_BPS = 5_000;
    uint256 public constant LIQUIDATION_BONUS_BPS = 500;
    uint256 public constant MAX_PRICE_AGE = 1 hours;
    uint256 public constant PRICE_SCALE = 1e8;
    uint256 public constant HF_ONE = 1e18;

    Koin public immutable koin;
    VillageMarket public immutable market;
    IPriceOracle public immutable oracle;

    mapping(address => mapping(address => uint256)) public collateralOf;
    mapping(address => uint256) public debtOf;

    error NotListed();
    error ZeroAmount();
    error InsufficientCollateral();
    error ExceedsBorrowLimit();
    error UnsafeWithdraw();
    error NoDebt();
    error NotLiquidatable();
    error RepayTooLarge();
    error InvalidPrice();
    error StalePrice();

    event Deposited(address indexed user, address indexed stock, uint256 amount);
    event Withdrawn(address indexed user, address indexed stock, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);
    event Liquidated(
        address indexed user, address indexed liquidator, address indexed stock, uint256 repaid, uint256 seized
    );

    constructor(Koin koin_, VillageMarket market_, IPriceOracle oracle_) {
        koin = koin_;
        market = market_;
        oracle = oracle_;
    }

    // ------------------------------------------------------------ collateral

    function deposit(SimStock stock, uint256 amount) external nonReentrant {
        if (!market.isListed(address(stock))) revert NotListed();
        if (amount == 0) revert ZeroAmount();
        collateralOf[msg.sender][address(stock)] += amount;
        stock.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, address(stock), amount);
    }

    /// @dev With debt, prices must be fresh and the remaining position must stay within the LTV cap.
    ///      With no debt the price is irrelevant, so stale prices never trap collateral.
    function withdraw(SimStock stock, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        uint256 bal = collateralOf[msg.sender][address(stock)];
        if (amount > bal) revert InsufficientCollateral();
        collateralOf[msg.sender][address(stock)] = bal - amount;

        uint256 debt = debtOf[msg.sender];
        if (debt > 0) {
            uint256 value = _collateralValue(msg.sender, true);
            if (debt * BPS > value * MAX_LTV_BPS || _healthFactor(value, debt) < HF_ONE) revert UnsafeWithdraw();
        }
        stock.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, address(stock), amount);
    }

    // ----------------------------------------------------------------- loans

    function borrow(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        uint256 newDebt = debtOf[msg.sender] + amount;
        uint256 value = _collateralValue(msg.sender, true);
        if (newDebt * BPS > value * MAX_LTV_BPS) revert ExceedsBorrowLimit();
        debtOf[msg.sender] = newDebt;
        koin.mint(msg.sender, amount);
        emit Borrowed(msg.sender, amount);
    }

    /// @notice Repays up to `amount`; anything above the outstanding debt is ignored (so "max" never reverts).
    function repay(uint256 amount) external nonReentrant returns (uint256 repaid) {
        uint256 debt = debtOf[msg.sender];
        if (debt == 0) revert NoDebt();
        if (amount == 0) revert ZeroAmount();
        repaid = amount > debt ? debt : amount;
        debtOf[msg.sender] = debt - repaid;
        koin.burn(msg.sender, repaid);
        emit Repaid(msg.sender, repaid);
    }

    /// @notice Repay up to 50% of `user`'s debt and seize `stock` worth repayAmt * 1.05. Needs fresh prices.
    function liquidate(address user, SimStock stock, uint256 repayAmt) external nonReentrant {
        if (repayAmt == 0) revert ZeroAmount();
        uint256 debt = debtOf[user];
        if (debt == 0) revert NoDebt();
        if (_healthFactor(_collateralValue(user, true), debt) >= HF_ONE) revert NotLiquidatable();
        if (repayAmt * BPS > debt * CLOSE_FACTOR_BPS) revert RepayTooLarge();

        uint256 seized = (repayAmt * (BPS + LIQUIDATION_BONUS_BPS) * PRICE_SCALE) / (BPS * _price(stock, true));
        uint256 bal = collateralOf[user][address(stock)];
        if (seized > bal) revert InsufficientCollateral();

        debtOf[user] = debt - repayAmt;
        collateralOf[user][address(stock)] = bal - seized;
        koin.burn(msg.sender, repayAmt);
        stock.safeTransfer(msg.sender, seized);
        emit Liquidated(user, msg.sender, address(stock), repayAmt, seized);
    }

    // ----------------------------------------------------------------- views

    /// @notice Value of deposited collateral in Koin. Unpriced stocks count as 0 (views never revert).
    function collateralValue(address user) external view returns (uint256) {
        return _collateralValue(user, false);
    }

    /// @notice (collateral * 80%) / debt, 1e18-scaled. No debt = type(uint256).max.
    function healthFactor(address user) external view returns (uint256) {
        return _healthFactor(_collateralValue(user, false), debtOf[user]);
    }

    // -------------------------------------------------------------- internal

    function _healthFactor(uint256 value, uint256 debt) private pure returns (uint256) {
        if (debt == 0) return type(uint256).max;
        return (value * LIQUIDATION_THRESHOLD_BPS * HF_ONE) / (BPS * debt);
    }

    function _collateralValue(address user, bool strict) private view returns (uint256 total) {
        uint256 n = market.stockCount();
        for (uint256 i = 0; i < n; i++) {
            SimStock stock = market.stockAt(i);
            uint256 bal = collateralOf[user][address(stock)];
            if (bal == 0) continue;
            total += (bal * _price(stock, strict)) / PRICE_SCALE;
        }
    }

    /// @dev strict: revert on price <= 0 or older than 1 hour. Non-strict: unusable price counts as 0.
    function _price(SimStock stock, bool strict) private view returns (uint256) {
        (int128 price, uint64 updatedAt,) = oracle.getPrice(stock.priceId());
        if (price <= 0) {
            if (strict) revert InvalidPrice();
            return 0;
        }
        if (strict && block.timestamp - updatedAt > MAX_PRICE_AGE) revert StalePrice();
        return SafeCast.toUint256(int256(price));
    }
}
