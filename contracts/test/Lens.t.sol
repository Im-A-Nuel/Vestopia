// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Base} from "./Base.t.sol";
import {VillageLens} from "../src/VillageLens.sol";
import {SimStock} from "../src/SimStock.sol";
import {IPriceOracle} from "../src/interfaces/IPriceOracle.sol";
import {PlainOracle} from "./mocks/PlainOracle.sol";

contract LensTest is Base {
    function _view(address user) internal view returns (VillageLens.PlayerView memory) {
        return lens.getPlayer(user);
    }

    function test_new_playerIsEmpty() public view {
        VillageLens.PlayerView memory v = _view(alice);
        assertEq(v.koin, 0);
        assertEq(v.debt, 0);
        assertEq(v.healthFactor, type(uint256).max);
        assertEq(v.weather, 0);
        assertFalse(v.starterClaimed);
        assertEq(v.totalPendingHarvest, 0);
        assertEq(v.collateralValue, 0);
        assertEq(v.borrowLimit, 0);
        assertEq(v.borrowable, 0);
        assertEq(v.portfolioValue, 0);
        assertEq(v.stocks.length, 3);
        assertEq(v.sectors.length, 2);
        for (uint256 i = 0; i < 3; i++) {
            assertEq(v.stocks[i].level, 0);
            assertEq(v.stocks[i].value, 0);
        }
        assertFalse(v.sectors[0].unlocked);
    }

    function test_stockViewFields() public {
        _buy(alice, aapl, 1000 ether);
        _deposit(alice, aapl, 4 ether);
        VillageLens.StockView memory s = _view(alice).stocks[0];
        assertEq(s.token, address(aapl));
        assertEq(s.ticker, "AAPL");
        assertEq(s.sector, 0);
        assertEq(s.price, 100e8);
        assertEq(s.walletBal, 6 ether);
        assertEq(s.collateralBal, 4 ether);
        assertEq(s.value, 1000 ether);
        assertEq(s.collateralValue, 400 ether);
        assertEq(s.level, 3);
        assertEq(s.costBasis, 1000 ether);
    }

    function test_playerSummaryAfterLoan() public {
        market_claim(alice);
        _aliceMaxLoan();
        VillageLens.PlayerView memory v = _view(alice);
        assertEq(v.koin, 1750 ether);
        assertEq(v.debt, 750 ether);
        assertEq(v.healthFactor, 1.6e18);
        assertEq(v.collateralValue, 1500 ether);
        assertEq(v.borrowLimit, 750 ether);
        assertEq(v.borrowable, 0);
        assertEq(v.portfolioValue, 1500 ether);
        assertTrue(v.starterClaimed);
    }

    function market_claim(address who) internal {
        vm.prank(who);
        market.claimStarter();
    }

    function test_borrowable_isLimitMinusDebt() public {
        _buy(alice, aapl, 1000 ether);
        _deposit(alice, aapl, 10 ether);
        vm.prank(alice);
        bank.borrow(200 ether);
        assertEq(_view(alice).borrowable, 300 ether);
    }

    function test_borrowable_floorsAtZeroWhenOverLimit() public {
        _aliceMaxLoan();
        _setPrice(aapl, 80e8); // limit 600 < debt 750
        VillageLens.PlayerView memory v = _view(alice);
        assertEq(v.borrowLimit, 600 ether);
        assertEq(v.borrowable, 0);
    }

    // ---- level thresholds
    function _levelFor(uint256 koinValue) internal returns (uint8) {
        address who = makeAddr(string.concat("lvl", vm.toString(koinValue)));
        _buy(who, aapl, koinValue);
        return _view(who).stocks[0].level;
    }

    function test_level_boundaries() public {
        assertEq(_levelFor(1 ether), 1);
        assertEq(_levelFor(249 ether), 1);
        assertEq(_levelFor(250 ether), 2);
        assertEq(_levelFor(999 ether), 2);
        assertEq(_levelFor(1000 ether), 3);
        assertEq(_levelFor(50_000 ether), 3);
    }

    function test_level_countsWalletPlusCollateral() public {
        _buy(alice, aapl, 250 ether); // 2.5 shares
        _deposit(alice, aapl, 1 ether);
        assertEq(_view(alice).stocks[0].level, 2);
    }

    function test_level_tracksPriceAndIsNotStored() public {
        _buy(alice, aapl, 250 ether);
        assertEq(_view(alice).stocks[0].level, 2);
        _setPrice(aapl, 99e8); // value 247.5
        assertEq(_view(alice).stocks[0].level, 1);
        _setPrice(aapl, 400e8);
        assertEq(_view(alice).stocks[0].level, 3);
    }

    function test_level_dustSharesWorthZeroAreEmpty() public {
        _buy(alice, aapl, 100 ether);
        vm.prank(alice);
        market.sell(aapl, 1 ether - 1);
        _setPrice(aapl, 1); // 1 wei of shares * 1e-8 -> value rounds to 0
        assertEq(_view(alice).stocks[0].level, 0);
    }

    // ---- sectors
    function test_sector_unlockBoundary() public {
        _buy(alice, aapl, 99 ether);
        VillageLens.PlayerView memory v = _view(alice);
        assertEq(v.sectors[0].value, 99 ether);
        assertFalse(v.sectors[0].unlocked);

        _buy(alice, aapl, 1 ether);
        v = _view(alice);
        assertEq(v.sectors[0].value, 100 ether);
        assertTrue(v.sectors[0].unlocked);
    }

    function test_sector_sumsStocksAndIsolatesSectors() public {
        _buy(alice, aapl, 60 ether);
        _buy(alice, msft, 40 ether);
        _buy(alice, ko, 99 ether);
        VillageLens.PlayerView memory v = _view(alice);
        assertEq(v.sectors[0].value, 100 ether);
        assertTrue(v.sectors[0].unlocked);
        assertEq(v.sectors[1].value, 99 ether);
        assertFalse(v.sectors[1].unlocked);
        assertEq(v.portfolioValue, 199 ether);
    }

    function test_sector_relocksWhenPriceFalls() public {
        _buy(alice, aapl, 100 ether);
        assertTrue(_view(alice).sectors[0].unlocked);
        _setPrice(aapl, 99e8);
        assertFalse(_view(alice).sectors[0].unlocked);
        assertEq(_view(alice).stocks[0].level, 1); // shares are kept
    }

    function test_sector_arrayIsDynamic() public {
        _newStock("Gold", "NEM", 5);
        assertEq(_view(alice).sectors.length, 6);
        assertEq(_view(alice).stocks.length, 4);
    }

    // ---- bad prices never revert the view
    function test_unpricedStockHasZeroValue() public {
        SimStock fresh = _newStock("Fresh", "FRESH", 0);
        VillageLens.StockView memory s = _view(alice).stocks[3];
        assertEq(s.token, address(fresh));
        assertEq(s.price, 0);
        assertEq(s.value, 0);
        assertEq(s.level, 0);
    }

    function test_staleOrNegativePriceDoesNotRevert() public {
        _buy(alice, aapl, 100 ether);
        vm.warp(block.timestamp + 30 days);
        assertEq(_view(alice).stocks[0].value, 100 ether); // stale price is shown, not rejected
        _setPrice(aapl, -5);
        assertEq(_view(alice).stocks[0].value, 0);
    }

    // ---- harvest
    function test_pendingHarvestPerStockAndTotal() public {
        address[] memory players = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        players[0] = alice;
        amounts[0] = 3 ether;
        market.creditDividends(aapl, players, amounts);
        amounts[0] = 2 ether;
        market.creditDividends(ko, players, amounts);
        VillageLens.PlayerView memory v = _view(alice);
        assertEq(v.stocks[0].pendingHarvest, 3 ether);
        assertEq(v.stocks[2].pendingHarvest, 2 ether);
        assertEq(v.totalPendingHarvest, 5 ether);
    }

    // ---- previous price + fallback
    function test_previousPrice() public {
        assertEq(_view(alice).stocks[0].previousPrice, 100e8); // first set: same as current
        _setPrice(aapl, 130e8);
        VillageLens.StockView memory s = _view(alice).stocks[0];
        assertEq(s.price, 130e8);
        assertEq(s.previousPrice, 100e8);
    }

    function test_lensFallbackWhenOracleLacksPreviousPrice() public {
        PlainOracle plain = new PlainOracle();
        plain.set(aapl.priceId(), 77e8);
        VillageLens plainLens = new VillageLens(koin, market, bank, IPriceOracle(address(plain)));
        VillageLens.StockView memory s = plainLens.getPlayer(alice).stocks[0];
        assertEq(s.price, 77e8);
        assertEq(s.previousPrice, 0);
    }

    // ---- batch
    function test_getPlayersMatchesGetPlayer() public {
        _buy(alice, aapl, 300 ether);
        _buy(bob, ko, 120 ether);
        address[] memory users = new address[](2);
        users[0] = alice;
        users[1] = bob;
        VillageLens.PlayerView[] memory all = lens.getPlayers(users);
        assertEq(all.length, 2);
        assertEq(all[0].portfolioValue, 300 ether);
        assertEq(all[1].portfolioValue, 120 ether);
        assertEq(all[1].stocks[2].level, 1);
    }

    function test_getPlayersEmpty() public view {
        assertEq(lens.getPlayers(new address[](0)).length, 0);
    }
}
