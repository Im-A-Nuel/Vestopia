// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Base} from "./Base.t.sol";
import {SimStock} from "../src/SimStock.sol";
import {VillageBank} from "../src/VillageBank.sol";
import {ReentrantStock} from "./mocks/ReentrantStock.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract BankTest is Base {
    uint256 internal constant HF_ONE = 1e18;

    // ---- deposit
    function test_deposit_movesSharesToBank() public {
        _buy(alice, aapl, 1000 ether);
        _deposit(alice, aapl, 4 ether);
        assertEq(bank.collateralOf(alice, address(aapl)), 4 ether);
        assertEq(aapl.balanceOf(alice), 6 ether);
        assertEq(aapl.balanceOf(address(bank)), 4 ether);
        assertEq(bank.collateralValue(alice), 400 ether);
    }

    function test_deposit_revertsNotListed() public {
        SimStock stranger = new SimStock("x", "x", "X", 0, address(market));
        vm.expectRevert(VillageBank.NotListed.selector);
        bank.deposit(stranger, 1);
    }

    function test_deposit_revertsZero() public {
        vm.expectRevert(VillageBank.ZeroAmount.selector);
        bank.deposit(aapl, 0);
    }

    function test_deposit_revertsWithoutAllowance() public {
        _buy(alice, aapl, 100 ether);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientAllowance.selector, address(bank), 0, 1 ether));
        bank.deposit(aapl, 1 ether);
    }

    function test_deposit_revertsInsufficientBalance() public {
        vm.startPrank(alice);
        aapl.approve(address(bank), 1 ether);
        vm.expectRevert();
        bank.deposit(aapl, 1 ether);
        vm.stopPrank();
    }

    // ---- withdraw
    function test_withdraw_noDebt() public {
        _buy(alice, aapl, 1000 ether);
        _deposit(alice, aapl, 10 ether);
        vm.prank(alice);
        bank.withdraw(aapl, 10 ether);
        assertEq(aapl.balanceOf(alice), 10 ether);
        assertEq(bank.collateralOf(alice, address(aapl)), 0);
    }

    function test_withdraw_noDebtWorksWithStalePrice() public {
        _buy(alice, aapl, 1000 ether);
        _deposit(alice, aapl, 10 ether);
        vm.warp(block.timestamp + 10 hours);
        vm.prank(alice);
        bank.withdraw(aapl, 10 ether);
        assertEq(aapl.balanceOf(alice), 10 ether);
    }

    function test_withdraw_revertsZero() public {
        vm.expectRevert(VillageBank.ZeroAmount.selector);
        bank.withdraw(aapl, 0);
    }

    function test_withdraw_revertsMoreThanDeposited() public {
        _buy(alice, aapl, 1000 ether);
        _deposit(alice, aapl, 5 ether);
        vm.prank(alice);
        vm.expectRevert(VillageBank.InsufficientCollateral.selector);
        bank.withdraw(aapl, 5 ether + 1);
    }

    function test_withdraw_exactlyAtLtvCapIsAllowed() public {
        _buy(alice, aapl, 1100 ether);
        _deposit(alice, aapl, 11 ether);
        vm.prank(alice);
        bank.borrow(500 ether);
        vm.prank(alice);
        bank.withdraw(aapl, 1 ether); // leaves $1000 collateral, debt 500 = exactly 50%
        assertEq(bank.collateralValue(alice), 1000 ether);
    }

    function test_withdraw_revertsJustOverLtvCap() public {
        _buy(alice, aapl, 1100 ether);
        _deposit(alice, aapl, 11 ether);
        vm.startPrank(alice);
        bank.borrow(500 ether);
        vm.expectRevert(VillageBank.UnsafeWithdraw.selector);
        bank.withdraw(aapl, 1 ether + 1);
        vm.stopPrank();
    }

    function test_withdraw_revertsWithDebtWhenStale() public {
        _aliceMaxLoan();
        vm.warp(block.timestamp + 1 hours + 1);
        vm.prank(alice);
        vm.expectRevert(VillageBank.StalePrice.selector);
        bank.withdraw(aapl, 1);
    }

    function test_withdraw_withDebtAtExactlyOneHourStillWorks() public {
        _buy(alice, aapl, 1100 ether);
        _deposit(alice, aapl, 11 ether);
        vm.prank(alice);
        bank.borrow(500 ether);
        vm.warp(block.timestamp + 1 hours);
        vm.prank(alice);
        bank.withdraw(aapl, 1 ether);
    }

    function test_withdraw_allAfterFullRepay() public {
        _aliceMaxLoan();
        vm.startPrank(alice);
        bank.repay(750 ether);
        bank.withdraw(aapl, 15 ether);
        vm.stopPrank();
        assertEq(aapl.balanceOf(alice), 15 ether);
    }

    // ---- borrow
    function test_borrow_mintsKoinAndRecordsDebt() public {
        _aliceMaxLoan();
        assertEq(bank.debtOf(alice), 750 ether);
        assertEq(koin.balanceOf(alice), 750 ether);
    }

    function test_borrow_capIsExactly50Percent() public {
        _buy(alice, aapl, 1000 ether);
        _deposit(alice, aapl, 10 ether);
        vm.startPrank(alice);
        vm.expectRevert(VillageBank.ExceedsBorrowLimit.selector);
        bank.borrow(500 ether + 1);
        bank.borrow(500 ether);
        vm.expectRevert(VillageBank.ExceedsBorrowLimit.selector);
        bank.borrow(1);
        vm.stopPrank();
    }

    function test_borrow_multipleBorrowsAccumulate() public {
        _buy(alice, aapl, 1000 ether);
        _deposit(alice, aapl, 10 ether);
        vm.startPrank(alice);
        bank.borrow(200 ether);
        bank.borrow(300 ether);
        vm.stopPrank();
        assertEq(bank.debtOf(alice), 500 ether);
    }

    function test_borrow_countsAllStocks() public {
        _buy(alice, aapl, 500 ether);
        _buy(alice, ko, 500 ether);
        _deposit(alice, aapl, 5 ether);
        _deposit(alice, ko, 10 ether);
        assertEq(bank.collateralValue(alice), 1000 ether);
        vm.prank(alice);
        bank.borrow(500 ether);
    }

    function test_borrow_revertsZero() public {
        vm.expectRevert(VillageBank.ZeroAmount.selector);
        bank.borrow(0);
    }

    function test_borrow_revertsWithoutCollateral() public {
        vm.prank(alice);
        vm.expectRevert(VillageBank.ExceedsBorrowLimit.selector);
        bank.borrow(1);
    }

    function test_borrow_walletSharesDoNotCount() public {
        _buy(alice, aapl, 1000 ether);
        vm.prank(alice);
        vm.expectRevert(VillageBank.ExceedsBorrowLimit.selector);
        bank.borrow(1);
    }

    function test_borrow_staleBoundary() public {
        _buy(alice, aapl, 1000 ether);
        _deposit(alice, aapl, 10 ether);
        vm.warp(block.timestamp + 1 hours);
        vm.prank(alice);
        bank.borrow(100 ether); // age == 1h
        vm.warp(block.timestamp + 1);
        vm.prank(alice);
        vm.expectRevert(VillageBank.StalePrice.selector);
        bank.borrow(1 ether); // age == 1h + 1s
    }

    function test_borrow_revertsInvalidPrice() public {
        _buy(alice, aapl, 1000 ether);
        _deposit(alice, aapl, 10 ether);
        _setPrice(aapl, 0);
        vm.prank(alice);
        vm.expectRevert(VillageBank.InvalidPrice.selector);
        bank.borrow(1);
    }

    // ---- repay
    function test_repay_partial() public {
        _aliceMaxLoan();
        vm.prank(alice);
        uint256 repaid = bank.repay(250 ether);
        assertEq(repaid, 250 ether);
        assertEq(bank.debtOf(alice), 500 ether);
        assertEq(koin.balanceOf(alice), 500 ether);
    }

    function test_repay_overpayIsCappedAtDebt() public {
        _aliceMaxLoan();
        koin.mint(alice, 1000 ether);
        vm.prank(alice);
        uint256 repaid = bank.repay(type(uint256).max);
        assertEq(repaid, 750 ether);
        assertEq(bank.debtOf(alice), 0);
        assertEq(koin.balanceOf(alice), 1000 ether); // only the debt was burned
    }

    function test_repay_revertsNoDebt() public {
        vm.prank(alice);
        vm.expectRevert(VillageBank.NoDebt.selector);
        bank.repay(1);
    }

    function test_repay_revertsZero() public {
        _aliceMaxLoan();
        vm.prank(alice);
        vm.expectRevert(VillageBank.ZeroAmount.selector);
        bank.repay(0);
    }

    function test_repay_revertsInsufficientKoin() public {
        _aliceMaxLoan();
        vm.startPrank(alice);
        koin.transfer(bob, 700 ether);
        vm.expectRevert();
        bank.repay(750 ether);
        vm.stopPrank();
    }

    function test_repay_worksWithStalePrice() public {
        _aliceMaxLoan();
        vm.warp(block.timestamp + 5 hours);
        vm.prank(alice);
        bank.repay(750 ether);
        assertEq(bank.debtOf(alice), 0);
    }

    // ---- health factor and weather boundaries (15 AAPL, debt 750)
    function _hfAt(int128 price) internal returns (uint256 hf, uint8 weather) {
        _aliceMaxLoan();
        _setPrice(aapl, price);
        hf = bank.healthFactor(alice);
        weather = lens.getPlayer(alice).weather;
    }

    function test_hf_noDebtIsMax() public {
        assertEq(bank.healthFactor(alice), type(uint256).max);
        _buy(alice, aapl, 1000 ether);
        _deposit(alice, aapl, 10 ether);
        assertEq(bank.healthFactor(alice), type(uint256).max);
        assertEq(lens.getPlayer(alice).weather, 0);
    }

    function test_hf_atMaxBorrowIs1point6() public {
        (uint256 hf, uint8 w) = _hfAt(100e8);
        assertEq(hf, 1.6e18);
        assertEq(w, 0);
    }

    function test_hf_exactly1point5IsSunny() public {
        (uint256 hf, uint8 w) = _hfAt(93.75e8);
        assertEq(hf, 1.5e18);
        assertEq(w, 0);
    }

    function test_hf_justBelow1point5IsCloudy() public {
        (uint256 hf, uint8 w) = _hfAt(93.74e8);
        assertLt(hf, 1.5e18);
        assertEq(w, 1);
    }

    function test_hf_exactly1point1IsCloudy() public {
        (uint256 hf, uint8 w) = _hfAt(68.75e8);
        assertEq(hf, 1.1e18);
        assertEq(w, 1);
    }

    function test_hf_justBelow1point1IsStormy() public {
        (uint256 hf, uint8 w) = _hfAt(68.74e8);
        assertLt(hf, 1.1e18);
        assertEq(w, 2);
    }

    function test_hf_exactlyOneIsStormyButNotLiquidatable() public {
        (uint256 hf, uint8 w) = _hfAt(62.5e8);
        assertEq(hf, HF_ONE);
        assertEq(w, 2);
        koin.mint(carol, 375 ether);
        vm.prank(carol);
        vm.expectRevert(VillageBank.NotLiquidatable.selector);
        bank.liquidate(alice, aapl, 375 ether);
    }

    function test_views_doNotRevertOnBadPrice() public {
        _aliceMaxLoan();
        _setPrice(aapl, 0);
        assertEq(bank.collateralValue(alice), 0);
        assertEq(bank.healthFactor(alice), 0);
        vm.warp(block.timestamp + 9 hours); // stale also fine for views
        _setPrice(aapl, 100e8);
        vm.warp(block.timestamp + 9 hours);
        assertEq(bank.collateralValue(alice), 1500 ether);
    }

    // ---- liquidation
    function _crash(int128 price) internal {
        _aliceMaxLoan();
        _setPrice(aapl, price);
        koin.mint(carol, 1000 ether);
    }

    function test_liquidate_halfDebtWith5PercentBonus() public {
        _crash(62.49e8); // C = 937.35, HF just under 1
        uint256 px = 62.49e8;
        uint256 seizedExpected = (375 ether * 10_500 * 1e8) / (10_000 * px);
        vm.prank(carol);
        bank.liquidate(alice, aapl, 375 ether);

        assertEq(bank.debtOf(alice), 375 ether);
        assertEq(koin.balanceOf(carol), 1000 ether - 375 ether);
        assertEq(aapl.balanceOf(carol), seizedExpected);
        assertEq(bank.collateralOf(alice, address(aapl)), 15 ether - seizedExpected);
        // seized value is repay * 1.05 (to within rounding of 1 wei of shares)
        uint256 seizedValue = (seizedExpected * 62.49e8) / 1e8;
        assertApproxEqAbs(seizedValue, 393.75 ether, 1e12);
    }

    function test_liquidate_bonusIsExactAtRoundPrice() public {
        _crash(50e8); // C = 750; HF = 0.8
        vm.prank(carol);
        bank.liquidate(alice, aapl, 300 ether);
        // 300 * 1.05 / 50 = 6.3 shares
        assertEq(aapl.balanceOf(carol), 6.3 ether);
        assertEq(bank.debtOf(alice), 450 ether);
    }

    function test_liquidate_revertsOverFiftyPercent() public {
        _crash(62.49e8);
        vm.prank(carol);
        vm.expectRevert(VillageBank.RepayTooLarge.selector);
        bank.liquidate(alice, aapl, 375 ether + 1);
    }

    function test_liquidate_revertsWhenHealthy() public {
        _aliceMaxLoan();
        koin.mint(carol, 100 ether);
        vm.prank(carol);
        vm.expectRevert(VillageBank.NotLiquidatable.selector);
        bank.liquidate(alice, aapl, 100 ether);
    }

    function test_liquidate_revertsNoDebt() public {
        vm.prank(carol);
        vm.expectRevert(VillageBank.NoDebt.selector);
        bank.liquidate(alice, aapl, 1);
    }

    function test_liquidate_revertsZero() public {
        vm.prank(carol);
        vm.expectRevert(VillageBank.ZeroAmount.selector);
        bank.liquidate(alice, aapl, 0);
    }

    function test_liquidate_revertsStalePrice() public {
        _crash(50e8);
        vm.warp(block.timestamp + 1 hours + 1);
        vm.prank(carol);
        vm.expectRevert(VillageBank.StalePrice.selector);
        bank.liquidate(alice, aapl, 100 ether);
    }

    function test_liquidate_collateralShortfallReverts() public {
        _crash(5e8); // 15 shares worth $75; 375 * 1.05 / 5 = 78.75 shares needed
        vm.prank(carol);
        vm.expectRevert(VillageBank.InsufficientCollateral.selector);
        bank.liquidate(alice, aapl, 375 ether);
    }

    function test_liquidate_smallerRepayCoversShortfall() public {
        _crash(5e8);
        vm.prank(carol);
        bank.liquidate(alice, aapl, 70 ether); // needs 14.7 shares, alice has 15
        assertEq(aapl.balanceOf(carol), 14.7 ether);
        assertEq(bank.collateralOf(alice, address(aapl)), 0.3 ether);
    }

    function test_liquidate_stockWithNoCollateralReverts() public {
        _crash(50e8);
        vm.prank(carol);
        vm.expectRevert(VillageBank.InsufficientCollateral.selector);
        bank.liquidate(alice, ko, 100 ether);
    }

    function test_liquidate_revertsLiquidatorWithoutKoin() public {
        _crash(50e8);
        vm.prank(bob);
        vm.expectRevert();
        bank.liquidate(alice, aapl, 100 ether);
    }

    function test_liquidate_canRepeatUntilHealthy() public {
        _crash(50e8);
        vm.startPrank(carol);
        bank.liquidate(alice, aapl, 375 ether);
        bank.liquidate(alice, aapl, 187 ether);
        vm.stopPrank();
        assertEq(bank.debtOf(alice), 188 ether);
    }

    // ---- reentrancy
    function _evil() internal returns (ReentrantStock evil) {
        evil = new ReentrantStock(address(market));
        market.listStock(SimStock(address(evil)));
        evil.setBank(bank, 0, false);
    }

    function test_reentrancy_depositBlocked() public {
        ReentrantStock evil = _evil();
        evil.setBank(bank, 0, true);
        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        bank.deposit(SimStock(address(evil)), 1);
    }

    function test_reentrancy_withdrawBlocked() public {
        ReentrantStock evil = _evil();
        bank.deposit(SimStock(address(evil)), 1); // unarmed: credited
        evil.setBank(bank, 0, true);
        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        bank.withdraw(SimStock(address(evil)), 1);
    }

    function test_reentrancy_borrowRepayLiquidateBlocked() public {
        ReentrantStock evil = _evil();
        for (uint8 mode = 1; mode <= 4; mode++) {
            evil.setBank(bank, mode, true);
            vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
            bank.deposit(SimStock(address(evil)), 1);
        }
    }

    // ---- fuzz
    function testFuzz_borrowNeverExceedsLtv(uint256 shares, uint256 amount) public {
        shares = bound(shares, 1, 1e24);
        amount = bound(amount, 1, 1e27);
        _buy(alice, aapl, (shares * 100e8) / 1e8 + 1e6);
        uint256 held = aapl.balanceOf(alice);
        shares = shares > held ? held : shares;
        _deposit(alice, aapl, shares);
        vm.prank(alice);
        try bank.borrow(amount) {
            assertLe(bank.debtOf(alice) * 2, bank.collateralValue(alice));
        } catch {
            assertGt(amount * 2, bank.collateralValue(alice));
        }
    }

    function testFuzz_withdrawNeverLeavesHfBelowOne(uint256 borrowAmt, uint256 withdrawAmt, int128 newPrice) public {
        _buy(alice, aapl, 1000 ether);
        _deposit(alice, aapl, 10 ether);
        borrowAmt = bound(borrowAmt, 1, 500 ether);
        vm.prank(alice);
        bank.borrow(borrowAmt);
        newPrice = int128(int256(bound(uint256(int256(newPrice)), 10e8, 1000e8)));
        _setPrice(aapl, newPrice);
        withdrawAmt = bound(withdrawAmt, 1, 10 ether);
        vm.prank(alice);
        try bank.withdraw(aapl, withdrawAmt) {
            uint256 debt = bank.debtOf(alice);
            if (debt > 0) assertGe(bank.healthFactor(alice), HF_ONE);
        } catch {}
    }

    function testFuzz_liquidationNeverExceedsCloseFactor(uint256 price, uint256 repay) public {
        price = bound(price, 1e8, 62e8);
        _crash(int128(int256(price)));
        repay = bound(repay, 1, 750 ether);
        vm.prank(carol);
        try bank.liquidate(alice, aapl, repay) {
            assertLe(repay, 375 ether);
        } catch {}
    }
}
