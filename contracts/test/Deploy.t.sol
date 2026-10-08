// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Deploy} from "../script/Deploy.s.sol";
import {VillageMarket} from "../src/VillageMarket.sol";
import {SimOracle} from "../src/SimOracle.sol";
import {VillageLens} from "../src/VillageLens.sol";

/// @dev Runs the real deploy script against config/*.json and checks the result.
contract DeployTest is Test {
    uint256 internal constant KEY = 0xA11CE;

    function test_deployWiresEverything() public {
        vm.setEnv("PRIVATE_KEY", vm.toString(bytes32(KEY)));
        address admin = makeAddr("admin");
        vm.setEnv("ADMIN_ADDRESS", vm.toString(admin));

        Deploy.Addresses memory a = new Deploy().run();

        assertEq(a.market.stockCount(), 31);
        assertEq(a.market.sectorCount(), 6);
        assertTrue(a.market.hasRole(a.market.DIVIDEND_ADMIN(), admin));
        assertTrue(a.market.hasRole(a.market.DEFAULT_ADMIN_ROLE(), admin));
        assertFalse(a.market.hasRole(a.market.DEFAULT_ADMIN_ROLE(), vm.addr(KEY)));
        assertTrue(a.koin.hasRole(a.koin.MINTER_ROLE(), address(a.market)));
        assertTrue(a.koin.hasRole(a.koin.MINTER_ROLE(), address(a.bank)));
        assertEq(a.oracle.owner(), admin);

        VillageLens.PlayerView memory v = a.lens.getPlayer(address(1));
        assertEq(v.stocks.length, 31);
        assertEq(v.stocks[0].ticker, "AAPL");
        assertEq(v.stocks[0].price, 230e8);
        for (uint256 i = 0; i < v.stocks.length; i++) {
            assertGt(v.stocks[i].price, 0);
        }
    }
}
