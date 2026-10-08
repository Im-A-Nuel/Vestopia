// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {Koin} from "./Koin.sol";
import {SimStock} from "./SimStock.sol";
import {VillageMarket} from "./VillageMarket.sol";
import {VillageBank} from "./VillageBank.sol";
import {IPriceOracle} from "./interfaces/IPriceOracle.sol";

interface ISimOraclePrevious {
    function getPreviousPrice(bytes32 priceId) external view returns (int128);
}

/// @notice Read-only aggregator: everything the UI needs for one player in a single call.
/// @dev Level and sector unlock are computed here on every read and never stored.
contract VillageLens {
    uint256 public constant SECTOR_UNLOCK_VALUE = 100 ether;
    uint256 public constant LEVEL_TWO_VALUE = 250 ether;
    uint256 public constant LEVEL_THREE_VALUE = 1_000 ether;
    uint256 public constant CLOUDY_HF = 1.5e18;
    uint256 public constant STORMY_HF = 1.1e18;
    uint256 public constant PRICE_SCALE = 1e8;

    Koin public immutable koin;
    VillageMarket public immutable market;
    VillageBank public immutable bank;
    IPriceOracle public immutable oracle;

    struct StockView {
        address token;
        string ticker;
        uint8 sector;
        int128 price; // 8 decimals, raw oracle value
        int128 previousPrice; // price before the last update; 0 if the oracle cannot tell
        uint256 walletBal;
        uint256 collateralBal;
        uint256 value; // (walletBal + collateralBal) * price, in Koin
        uint256 collateralValue; // collateralBal * price, in Koin
        uint8 level; // 0 = empty lot, 1-3
        uint256 pendingHarvest;
        uint256 costBasis; // Koin spent on the shares still held
    }

    struct SectorView {
        uint256 value;
        bool unlocked;
    }

    struct PlayerView {
        uint256 koin;
        uint256 debt;
        uint256 healthFactor; // 1e18-scaled, max uint256 when no debt
        uint8 weather; // 0 sunny, 1 cloudy, 2 stormy
        bool starterClaimed;
        uint256 totalPendingHarvest;
        uint256 collateralValue;
        uint256 borrowLimit; // 50% of collateral value
        uint256 borrowable; // borrowLimit - debt, floored at 0
        uint256 portfolioValue;
        StockView[] stocks; // same order as Market.stockAt
        SectorView[] sectors; // index = sector id, length = Market.sectorCount
    }

    constructor(Koin koin_, VillageMarket market_, VillageBank bank_, IPriceOracle oracle_) {
        koin = koin_;
        market = market_;
        bank = bank_;
        oracle = oracle_;
    }

    function getPlayer(address user) public view returns (PlayerView memory v) {
        uint256 n = market.stockCount();
        v.stocks = new StockView[](n);
        v.sectors = new SectorView[](market.sectorCount());

        for (uint256 i = 0; i < n; i++) {
            StockView memory s = _stockView(market.stockAt(i), user);
            v.stocks[i] = s;
            v.sectors[s.sector].value += s.value;
            v.portfolioValue += s.value;
            v.totalPendingHarvest += s.pendingHarvest;
        }
        for (uint256 j = 0; j < v.sectors.length; j++) {
            v.sectors[j].unlocked = v.sectors[j].value >= SECTOR_UNLOCK_VALUE;
        }

        v.koin = koin.balanceOf(user);
        v.debt = bank.debtOf(user);
        v.healthFactor = bank.healthFactor(user);
        v.weather = _weather(v.healthFactor);
        v.starterClaimed = market.starterClaimed(user);
        v.collateralValue = bank.collateralValue(user);
        v.borrowLimit = (v.collateralValue * bank.MAX_LTV_BPS()) / bank.BPS();
        v.borrowable = v.borrowLimit > v.debt ? v.borrowLimit - v.debt : 0;
    }

    function getPlayers(address[] calldata users) external view returns (PlayerView[] memory out) {
        out = new PlayerView[](users.length);
        for (uint256 i = 0; i < users.length; i++) {
            out[i] = getPlayer(users[i]);
        }
    }

    function _stockView(SimStock token, address user) private view returns (StockView memory s) {
        s.token = address(token);
        s.ticker = token.ticker();
        s.sector = token.sector();
        (int128 price,,) = oracle.getPrice(token.priceId());
        s.price = price;
        try ISimOraclePrevious(address(oracle)).getPreviousPrice(token.priceId()) returns (int128 prev) {
            s.previousPrice = prev;
        } catch {}
        s.walletBal = token.balanceOf(user);
        s.collateralBal = bank.collateralOf(user, address(token));
        if (price > 0) {
            uint256 p = SafeCast.toUint256(int256(price));
            s.value = ((s.walletBal + s.collateralBal) * p) / PRICE_SCALE;
            s.collateralValue = (s.collateralBal * p) / PRICE_SCALE;
        }
        s.level = _level(s.value);
        s.pendingHarvest = market.pendingHarvest(user, address(token));
        s.costBasis = market.costBasis(user, address(token));
    }

    function _level(uint256 value) private pure returns (uint8) {
        if (value >= LEVEL_THREE_VALUE) return 3;
        if (value >= LEVEL_TWO_VALUE) return 2;
        return value > 0 ? 1 : 0;
    }

    function _weather(uint256 hf) private pure returns (uint8) {
        if (hf >= CLOUDY_HF) return 0;
        if (hf >= STORMY_HF) return 1;
        return 2;
    }
}
