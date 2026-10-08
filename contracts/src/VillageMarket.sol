// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {Koin} from "./Koin.sol";
import {SimStock} from "./SimStock.sol";
import {IPriceOracle} from "./interfaces/IPriceOracle.sol";

/// @notice Mints starter Koin, trades Koin <-> simulated stocks at oracle price, and pays out dividends.
/// @dev Dividends are NOT computed on-chain: a server holding DIVIDEND_ADMIN calls `creditDividends`.
contract VillageMarket is AccessControl {
    bytes32 public constant DIVIDEND_ADMIN = keccak256("DIVIDEND_ADMIN");

    uint256 public constant STARTER_KOIN = 1_000 ether;
    uint256 public constant MAX_PRICE_AGE = 1 hours;
    uint256 public constant PRICE_SCALE = 1e8;

    Koin public immutable koin;
    IPriceOracle public immutable oracle;

    SimStock[] private _stocks;
    mapping(address => bool) public isListed;
    /// @notice Number of sector ids in use (highest listed sector id + 1).
    uint256 public sectorCount;

    mapping(address => bool) public starterClaimed;
    mapping(address => mapping(address => uint256)) public pendingHarvest;

    /// @notice Koin the player spent on shares still held (average-cost basis), per stock.
    mapping(address => mapping(address => uint256)) public costBasis;
    /// @dev Shares bought through `buy` that `costBasis` still covers. Deposits/withdrawals to the Bank do not
    ///      change it, so the basis follows the whole position (wallet + collateral).
    mapping(address => mapping(address => uint256)) private _costShares;

    error AlreadyClaimed();
    error NotListed();
    error AlreadyListed();
    error WrongMarket();
    error InvalidPrice();
    error StalePrice();
    error ZeroAmount();
    error LengthMismatch();
    error NothingToHarvest();

    event StarterClaimed(address indexed player);
    event StockListed(address indexed stock, uint8 sector, bytes32 priceId);
    event Bought(address indexed player, address indexed stock, uint256 koinIn, uint256 sharesOut);
    event Sold(address indexed player, address indexed stock, uint256 sharesIn, uint256 koinOut);
    event DividendCredited(address indexed player, address indexed stock, uint256 amount);
    event Harvested(address indexed player, address indexed stock, uint256 amount);

    constructor(Koin koin_, IPriceOracle oracle_, address admin) {
        koin = koin_;
        oracle = oracle_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ---------------------------------------------------------------- listing

    function listStock(SimStock stock) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (isListed[address(stock)]) revert AlreadyListed();
        if (stock.market() != address(this)) revert WrongMarket();
        isListed[address(stock)] = true;
        _stocks.push(stock);
        uint8 sector = stock.sector();
        if (uint256(sector) + 1 > sectorCount) sectorCount = uint256(sector) + 1;
        emit StockListed(address(stock), sector, stock.priceId());
    }

    function stockCount() external view returns (uint256) {
        return _stocks.length;
    }

    function stockAt(uint256 index) external view returns (SimStock) {
        return _stocks[index];
    }

    // ---------------------------------------------------------------- trading

    function claimStarter() external {
        if (starterClaimed[msg.sender]) revert AlreadyClaimed();
        starterClaimed[msg.sender] = true;
        koin.mint(msg.sender, STARTER_KOIN);
        emit StarterClaimed(msg.sender);
    }

    /// @notice Burn `koinIn` Koin, mint shares at the oracle price (rounded down).
    function buy(SimStock stock, uint256 koinIn) external returns (uint256 sharesOut) {
        uint256 price = _price(stock);
        sharesOut = (koinIn * PRICE_SCALE) / price;
        if (sharesOut == 0) revert ZeroAmount();
        koin.burn(msg.sender, koinIn);
        stock.mint(msg.sender, sharesOut);
        costBasis[msg.sender][address(stock)] += koinIn;
        _costShares[msg.sender][address(stock)] += sharesOut;
        emit Bought(msg.sender, address(stock), koinIn, sharesOut);
    }

    /// @notice Burn `shares`, mint Koin at the oracle price (rounded down; dust shares may pay 0).
    function sell(SimStock stock, uint256 shares) external returns (uint256 koinOut) {
        if (shares == 0) revert ZeroAmount();
        uint256 price = _price(stock);
        koinOut = (shares * price) / PRICE_SCALE;
        stock.burn(msg.sender, shares);
        _reduceBasis(address(stock), shares);
        if (koinOut > 0) koin.mint(msg.sender, koinOut);
        emit Sold(msg.sender, address(stock), shares, koinOut);
    }

    // -------------------------------------------------------------- dividends

    function creditDividends(SimStock stock, address[] calldata players, uint256[] calldata amounts)
        external
        onlyRole(DIVIDEND_ADMIN)
    {
        if (!isListed[address(stock)]) revert NotListed();
        if (players.length != amounts.length) revert LengthMismatch();
        for (uint256 i = 0; i < players.length; i++) {
            pendingHarvest[players[i]][address(stock)] += amounts[i];
            emit DividendCredited(players[i], address(stock), amounts[i]);
        }
    }

    function harvest(SimStock stock) external returns (uint256 amount) {
        if (!isListed[address(stock)]) revert NotListed();
        amount = _collect(address(stock));
        if (amount == 0) revert NothingToHarvest();
        koin.mint(msg.sender, amount);
    }

    function harvestAll() external returns (uint256 total) {
        uint256 n = _stocks.length;
        for (uint256 i = 0; i < n; i++) {
            total += _collect(address(_stocks[i]));
        }
        if (total == 0) revert NothingToHarvest();
        koin.mint(msg.sender, total);
    }

    function totalPendingHarvest(address player) external view returns (uint256 total) {
        uint256 n = _stocks.length;
        for (uint256 i = 0; i < n; i++) {
            total += pendingHarvest[player][address(_stocks[i])];
        }
    }

    // --------------------------------------------------------------- internal

    /// @dev Removes the sold fraction of the basis. Selling shares that were not bought here (e.g. won in a
    ///      liquidation) clears the remaining basis rather than underflowing.
    function _reduceBasis(address stock, uint256 sold) private {
        uint256 tracked = _costShares[msg.sender][stock];
        if (sold >= tracked) {
            costBasis[msg.sender][stock] = 0;
            _costShares[msg.sender][stock] = 0;
            return;
        }
        uint256 basis = costBasis[msg.sender][stock];
        costBasis[msg.sender][stock] = basis - (basis * sold) / tracked;
        _costShares[msg.sender][stock] = tracked - sold;
    }

    function _collect(address stock) private returns (uint256 amount) {
        amount = pendingHarvest[msg.sender][stock];
        if (amount == 0) return 0;
        pendingHarvest[msg.sender][stock] = 0;
        emit Harvested(msg.sender, stock, amount);
    }

    function _price(SimStock stock) private view returns (uint256) {
        if (!isListed[address(stock)]) revert NotListed();
        (int128 price, uint64 updatedAt,) = oracle.getPrice(stock.priceId());
        if (price <= 0) revert InvalidPrice();
        if (block.timestamp - updatedAt > MAX_PRICE_AGE) revert StalePrice();
        return SafeCast.toUint256(int256(price));
    }
}
