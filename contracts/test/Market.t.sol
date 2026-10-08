// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Base} from "./Base.t.sol";
import {SimStock} from "../src/SimStock.sol";
import {VillageMarket} from "../src/VillageMarket.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract MarketTest is Base {
    event StarterClaimed(address indexed player);

    // ---- listing
    function test_list_registersStocks() public view {
        assertEq(market.stockCount(), 3);
        assertEq(address(market.stockAt(0)), address(aapl));
        assertEq(address(market.stockAt(2)), address(ko));
        assertTrue(market.isListed(address(msft)));
        assertEq(market.sectorCount(), 2);
    }

    function test_list_sectorCountGrowsWithHighestSector() public {
        _newStock("Gold", "NEM", 5);
        assertEq(market.sectorCount(), 6);
        _newStock("Late", "LATE", 2); // lower id does not shrink it
        assertEq(market.sectorCount(), 6);
    }

    function test_list_revertsAlreadyListed() public {
        vm.expectRevert(VillageMarket.AlreadyListed.selector);
        market.listStock(aapl);
    }

    function test_list_revertsWrongMarket() public {
        SimStock foreign = new SimStock("x", "x", "X", 0, address(1));
        vm.expectRevert(VillageMarket.WrongMarket.selector);
        market.listStock(foreign);
    }

    function test_list_revertsNotAdmin() public {
        SimStock s = new SimStock("x", "x", "X", 0, address(market));
        bytes32 role = market.DEFAULT_ADMIN_ROLE();
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, role));
        market.listStock(s);
    }

    // ---- starter
    function test_starter_mintsOnce() public {
        vm.expectEmit(true, false, false, false);
        emit StarterClaimed(alice);
        vm.prank(alice);
        market.claimStarter();
        assertEq(koin.balanceOf(alice), 1000 ether);
        assertTrue(market.starterClaimed(alice));
    }

    function test_starter_revertsSecondClaim() public {
        vm.startPrank(alice);
        market.claimStarter();
        vm.expectRevert(VillageMarket.AlreadyClaimed.selector);
        market.claimStarter();
        vm.stopPrank();
        assertEq(koin.balanceOf(alice), 1000 ether);
    }

    function test_starter_perAddress() public {
        vm.prank(alice);
        market.claimStarter();
        vm.prank(bob);
        market.claimStarter();
        assertEq(koin.totalSupply(), 2000 ether);
    }

    // ---- buy
    function test_buy_burnsKoinMintsShares() public {
        uint256 shares = _buy(alice, aapl, 1000 ether);
        assertEq(shares, 10 ether);
        assertEq(aapl.balanceOf(alice), 10 ether);
        assertEq(koin.balanceOf(alice), 0);
    }

    function test_buy_roundsDown() public {
        _setPrice(aapl, 300e8); // 100 / 300 = 0.333...
        uint256 shares = _buy(alice, aapl, 100 ether);
        assertEq(shares, 333333333333333333);
    }

    function test_buy_revertsNotListed() public {
        SimStock stranger = new SimStock("x", "x", "X", 0, address(market));
        vm.expectRevert(VillageMarket.NotListed.selector);
        market.buy(stranger, 1 ether);
    }

    function test_buy_revertsPriceNotSet() public {
        SimStock fresh = _newStock("Fresh", "FRESH", 0);
        koin.mint(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert(VillageMarket.InvalidPrice.selector);
        market.buy(fresh, 1 ether);
    }

    function test_buy_revertsNegativePrice() public {
        _setPrice(aapl, -1);
        koin.mint(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert(VillageMarket.InvalidPrice.selector);
        market.buy(aapl, 1 ether);
    }

    function test_buy_revertsZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(VillageMarket.ZeroAmount.selector);
        market.buy(aapl, 0);
    }

    function test_buy_revertsWhenSharesRoundToZero() public {
        _setPrice(aapl, 100e8);
        koin.mint(alice, 1);
        vm.prank(alice);
        vm.expectRevert(VillageMarket.ZeroAmount.selector); // 1 wei * 1e8 / 100e8 = 0
        market.buy(aapl, 1);
    }

    function test_buy_revertsInsufficientKoin() public {
        koin.mint(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, alice, 1 ether, 2 ether));
        market.buy(aapl, 2 ether);
    }

    function test_buy_staleBoundary() public {
        koin.mint(alice, 2 ether);
        vm.warp(block.timestamp + 1 hours); // age == 1h: still fine
        vm.prank(alice);
        market.buy(aapl, 1 ether);
        vm.warp(block.timestamp + 1); // age == 1h + 1s: stale
        vm.prank(alice);
        vm.expectRevert(VillageMarket.StalePrice.selector);
        market.buy(aapl, 1 ether);
    }

    // ---- sell
    function test_sell_burnsSharesMintsKoin() public {
        _buy(alice, aapl, 1000 ether);
        vm.prank(alice);
        uint256 out = market.sell(aapl, 4 ether);
        assertEq(out, 400 ether);
        assertEq(koin.balanceOf(alice), 400 ether);
        assertEq(aapl.balanceOf(alice), 6 ether);
    }

    function test_sell_usesCurrentPrice() public {
        _buy(alice, aapl, 1000 ether);
        _setPrice(aapl, 150e8);
        vm.prank(alice);
        assertEq(market.sell(aapl, 10 ether), 1500 ether);
    }

    function test_sell_dustPaysZeroButSucceeds() public {
        _buy(alice, aapl, 1000 ether);
        _setPrice(aapl, 1); // $0.00000001
        vm.prank(alice);
        uint256 out = market.sell(aapl, 1);
        assertEq(out, 0);
        assertEq(aapl.balanceOf(alice), 10 ether - 1);
    }

    function test_sell_revertsZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(VillageMarket.ZeroAmount.selector);
        market.sell(aapl, 0);
    }

    function test_sell_revertsNotListed() public {
        SimStock stranger = new SimStock("x", "x", "X", 0, address(market));
        vm.expectRevert(VillageMarket.NotListed.selector);
        market.sell(stranger, 1);
    }

    function test_sell_revertsInsufficientShares() public {
        _buy(alice, aapl, 100 ether);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, alice, 1 ether, 2 ether));
        market.sell(aapl, 2 ether);
    }

    function test_sell_revertsStale() public {
        _buy(alice, aapl, 100 ether);
        vm.warp(block.timestamp + 1 hours + 1);
        vm.prank(alice);
        vm.expectRevert(VillageMarket.StalePrice.selector);
        market.sell(aapl, 1 ether);
    }

    function test_sell_revertsInvalidPrice() public {
        _buy(alice, aapl, 100 ether);
        _setPrice(aapl, 0);
        vm.prank(alice);
        vm.expectRevert(VillageMarket.InvalidPrice.selector);
        market.sell(aapl, 1 ether);
    }

    // ---- cost basis
    function test_costBasis_accumulatesOnBuy() public {
        _buy(alice, aapl, 1000 ether);
        _buy(alice, aapl, 500 ether);
        assertEq(market.costBasis(alice, address(aapl)), 1500 ether);
    }

    function test_costBasis_reducesProportionallyOnSell() public {
        _buy(alice, aapl, 1000 ether); // 10 shares
        vm.prank(alice);
        market.sell(aapl, 2.5 ether);
        assertEq(market.costBasis(alice, address(aapl)), 750 ether);
        vm.prank(alice);
        market.sell(aapl, 7.5 ether);
        assertEq(market.costBasis(alice, address(aapl)), 0);
    }

    function test_costBasis_isAverageCost() public {
        _buy(alice, aapl, 1000 ether); // 10 @ 100
        _setPrice(aapl, 200e8);
        _buy(alice, aapl, 1000 ether); // 5 @ 200 -> basis 2000 for 15
        vm.prank(alice);
        market.sell(aapl, 7.5 ether); // half
        assertEq(market.costBasis(alice, address(aapl)), 1000 ether);
    }

    function test_costBasis_unchangedByBankDeposit() public {
        _buy(alice, aapl, 1000 ether);
        _deposit(alice, aapl, 10 ether);
        assertEq(market.costBasis(alice, address(aapl)), 1000 ether);
        vm.prank(alice);
        bank.withdraw(aapl, 4 ether);
        assertEq(market.costBasis(alice, address(aapl)), 1000 ether);
        vm.prank(alice);
        market.sell(aapl, 4 ether); // 4 of 10 tracked shares
        assertEq(market.costBasis(alice, address(aapl)), 600 ether);
    }

    function test_costBasis_perStockAndPerPlayer() public {
        _buy(alice, aapl, 100 ether);
        _buy(alice, ko, 50 ether);
        _buy(bob, aapl, 10 ether);
        assertEq(market.costBasis(alice, address(aapl)), 100 ether);
        assertEq(market.costBasis(alice, address(ko)), 50 ether);
        assertEq(market.costBasis(bob, address(aapl)), 10 ether);
    }

    function test_costBasis_sellingUntrackedSharesClearsBasis() public {
        // bob receives shares without buying them (e.g. a liquidation payout) and has a small own position.
        _buy(bob, aapl, 100 ether); // 1 share, basis 100
        _buy(alice, aapl, 500 ether);
        vm.prank(alice);
        aapl.transfer(bob, 5 ether); // bob now holds 6, tracked 1
        vm.prank(bob);
        market.sell(aapl, 3 ether); // more than tracked: basis clears, no underflow
        assertEq(market.costBasis(bob, address(aapl)), 0);
    }

    // ---- dividends
    function _credit(SimStock s, address who, uint256 amount) internal {
        address[] memory players = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        players[0] = who;
        amounts[0] = amount;
        market.creditDividends(s, players, amounts);
    }

    function test_credit_accumulates() public {
        _credit(aapl, alice, 5 ether);
        _credit(aapl, alice, 2 ether);
        assertEq(market.pendingHarvest(alice, address(aapl)), 7 ether);
    }

    function test_credit_manyPlayers() public {
        address[] memory players = new address[](2);
        uint256[] memory amounts = new uint256[](2);
        players[0] = alice;
        players[1] = bob;
        amounts[0] = 1 ether;
        amounts[1] = 2 ether;
        market.creditDividends(ko, players, amounts);
        assertEq(market.pendingHarvest(alice, address(ko)), 1 ether);
        assertEq(market.pendingHarvest(bob, address(ko)), 2 ether);
    }

    function test_credit_revertsNotAdmin() public {
        address[] memory players = new address[](0);
        uint256[] memory amounts = new uint256[](0);
        bytes32 role = market.DIVIDEND_ADMIN();
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, role));
        market.creditDividends(aapl, players, amounts);
    }

    function test_credit_revertsLengthMismatch() public {
        address[] memory players = new address[](2);
        uint256[] memory amounts = new uint256[](1);
        vm.expectRevert(VillageMarket.LengthMismatch.selector);
        market.creditDividends(aapl, players, amounts);
    }

    function test_credit_revertsNotListed() public {
        SimStock stranger = new SimStock("x", "x", "X", 0, address(market));
        address[] memory players = new address[](0);
        uint256[] memory amounts = new uint256[](0);
        vm.expectRevert(VillageMarket.NotListed.selector);
        market.creditDividends(stranger, players, amounts);
    }

    function test_harvest_paysAndZeroes() public {
        _credit(aapl, alice, 5 ether);
        vm.prank(alice);
        uint256 got = market.harvest(aapl);
        assertEq(got, 5 ether);
        assertEq(koin.balanceOf(alice), 5 ether);
        assertEq(market.pendingHarvest(alice, address(aapl)), 0);
    }

    function test_harvest_revertsNothing() public {
        vm.prank(alice);
        vm.expectRevert(VillageMarket.NothingToHarvest.selector);
        market.harvest(aapl);
    }

    function test_harvest_revertsOnSecondCall() public {
        _credit(aapl, alice, 1 ether);
        vm.startPrank(alice);
        market.harvest(aapl);
        vm.expectRevert(VillageMarket.NothingToHarvest.selector);
        market.harvest(aapl);
        vm.stopPrank();
    }

    function test_harvest_revertsNotListed() public {
        SimStock stranger = new SimStock("x", "x", "X", 0, address(market));
        vm.expectRevert(VillageMarket.NotListed.selector);
        market.harvest(stranger);
    }

    function test_harvest_worksWithStalePrice() public {
        _credit(aapl, alice, 1 ether);
        vm.warp(block.timestamp + 2 hours);
        vm.prank(alice);
        market.harvest(aapl);
        assertEq(koin.balanceOf(alice), 1 ether);
    }

    function test_harvestAll_collectsEveryStock() public {
        _credit(aapl, alice, 1 ether);
        _credit(msft, alice, 2 ether);
        _credit(ko, alice, 3 ether);
        assertEq(market.totalPendingHarvest(alice), 6 ether);
        vm.prank(alice);
        uint256 total = market.harvestAll();
        assertEq(total, 6 ether);
        assertEq(koin.balanceOf(alice), 6 ether);
        assertEq(market.totalPendingHarvest(alice), 0);
        assertEq(market.pendingHarvest(alice, address(ko)), 0);
    }

    function test_harvestAll_revertsNothing() public {
        vm.prank(alice);
        vm.expectRevert(VillageMarket.NothingToHarvest.selector);
        market.harvestAll();
    }

    function test_harvestAll_doesNotTouchOthers() public {
        _credit(aapl, alice, 1 ether);
        _credit(aapl, bob, 4 ether);
        vm.prank(alice);
        market.harvestAll();
        assertEq(market.pendingHarvest(bob, address(aapl)), 4 ether);
    }

    // ---- fuzz
    function testFuzz_buySellRoundTripNeverCreatesKoin(uint256 koinIn, uint256 price) public {
        price = bound(price, 1e6, 1e14);
        koinIn = bound(koinIn, 1e6, 1e30);
        _setPrice(aapl, int128(int256(price)));
        uint256 shares = _buy(alice, aapl, koinIn);
        vm.prank(alice);
        uint256 out = market.sell(aapl, shares);
        assertLe(out, koinIn);
        assertEq(koin.balanceOf(alice), out);
        assertEq(aapl.totalSupply(), 0);
    }
}
