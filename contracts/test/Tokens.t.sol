// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Base} from "./Base.t.sol";
import {SimStock} from "../src/SimStock.sol";
import {SimOracle} from "../src/SimOracle.sol";
import {IPriceOracle} from "../src/interfaces/IPriceOracle.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TokensTest is Base {
    // ---- Koin
    function test_koin_metadata() public view {
        assertEq(koin.name(), "Koin");
        assertEq(koin.symbol(), "KOIN");
        assertEq(koin.decimals(), 18);
    }

    function test_koin_mintBurnByMinter() public {
        koin.mint(alice, 5 ether);
        assertEq(koin.balanceOf(alice), 5 ether);
        koin.burn(alice, 2 ether);
        assertEq(koin.balanceOf(alice), 3 ether);
    }

    function test_koin_mintReverts_notMinter() public {
        bytes32 role = koin.MINTER_ROLE();
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, role)
        );
        koin.mint(alice, 1);
    }

    function test_koin_burnReverts_notMinter() public {
        koin.mint(alice, 1);
        bytes32 role = koin.MINTER_ROLE();
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, role)
        );
        koin.burn(alice, 1);
    }

    function test_koin_roleGrantRequiresAdmin() public {
        bytes32 role = koin.MINTER_ROLE();
        vm.prank(alice);
        vm.expectRevert();
        koin.grantRole(role, alice);
    }

    // ---- SimStock
    function test_stock_metadata() public view {
        assertEq(aapl.name(), "Simulated Apple");
        assertEq(aapl.symbol(), "sAAPL");
        assertEq(aapl.ticker(), "AAPL");
        assertEq(aapl.decimals(), 18);
        assertEq(aapl.sector(), 0);
        assertEq(ko.sector(), 1);
        assertEq(aapl.market(), address(market));
        assertEq(aapl.priceId(), keccak256(bytes("AAPL")));
    }

    function test_stock_mintBurnOnlyMarket() public {
        vm.startPrank(address(market));
        aapl.mint(alice, 3);
        aapl.burn(alice, 1);
        vm.stopPrank();
        assertEq(aapl.balanceOf(alice), 2);
    }

    function test_stock_mintReverts_notMarket() public {
        vm.expectRevert(SimStock.NotMarket.selector);
        aapl.mint(alice, 1);
    }

    function test_stock_burnReverts_notMarket() public {
        vm.expectRevert(SimStock.NotMarket.selector);
        aapl.burn(alice, 1);
    }

    function test_stock_constructorRejectsZeroMarket() public {
        vm.expectRevert(SimStock.ZeroAddress.selector);
        new SimStock("x", "x", "X", 0, address(0));
    }

    // ---- SimOracle
    function test_oracle_unknownIdIsZero() public view {
        (int128 p, uint64 t, IPriceOracle.Session s) = oracle.getPrice(keccak256("NOPE"));
        assertEq(p, 0);
        assertEq(t, 0);
        assertEq(uint8(s), uint8(IPriceOracle.Session.UNKNOWN));
    }

    function test_oracle_setPricesStoresPriceTimeSession() public view {
        (int128 p, uint64 t, IPriceOracle.Session s) = oracle.getPrice(aapl.priceId());
        assertEq(p, 100e8);
        assertEq(t, block.timestamp);
        assertEq(uint8(s), uint8(IPriceOracle.Session.REGULAR));
    }

    function test_oracle_setPricesReverts_notOwner() public {
        bytes32[] memory ids = new bytes32[](0);
        int128[] memory prices = new int128[](0);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        oracle.setPrices(ids, prices);
    }

    function test_oracle_setPricesReverts_lengthMismatch() public {
        bytes32[] memory ids = new bytes32[](1);
        int128[] memory prices = new int128[](2);
        vm.expectRevert(SimOracle.LengthMismatch.selector);
        oracle.setPrices(ids, prices);
    }

    function test_oracle_previousPrice() public {
        // First set: previous == current.
        assertEq(oracle.getPreviousPrice(aapl.priceId()), 100e8);
        _setPrice(aapl, 120e8);
        assertEq(oracle.getPreviousPrice(aapl.priceId()), 100e8);
        _setPrice(aapl, 90e8);
        assertEq(oracle.getPreviousPrice(aapl.priceId()), 120e8);
        assertEq(oracle.getPreviousPrice(keccak256("NOPE")), 0);
    }

    function test_oracle_setPricesUpdatesTimestamp() public {
        vm.warp(block.timestamp + 500);
        _setPrice(aapl, 101e8);
        (, uint64 t,) = oracle.getPrice(aapl.priceId());
        assertEq(t, block.timestamp);
    }
}
