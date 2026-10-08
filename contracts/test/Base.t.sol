// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Koin} from "../src/Koin.sol";
import {SimStock} from "../src/SimStock.sol";
import {SimOracle} from "../src/SimOracle.sol";
import {VillageMarket} from "../src/VillageMarket.sol";
import {VillageBank} from "../src/VillageBank.sol";
import {VillageLens} from "../src/VillageLens.sol";
import {IPriceOracle} from "../src/interfaces/IPriceOracle.sol";

/// @dev Shared fixture. Test contract is admin, oracle owner, DIVIDEND_ADMIN and a Koin minter.
///      Prices: AAPL $100 and MSFT $200 (sector 0), KO $50 (sector 1). All amounts are exact at these prices.
abstract contract Base is Test {
    Koin internal koin;
    SimOracle internal oracle;
    VillageMarket internal market;
    VillageBank internal bank;
    VillageLens internal lens;
    SimStock internal aapl;
    SimStock internal msft;
    SimStock internal ko;

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");

    function setUp() public virtual {
        vm.warp(1_000_000);
        koin = new Koin(address(this));
        oracle = new SimOracle(address(this));
        market = new VillageMarket(koin, IPriceOracle(address(oracle)), address(this));
        bank = new VillageBank(koin, market, IPriceOracle(address(oracle)));
        lens = new VillageLens(koin, market, bank, IPriceOracle(address(oracle)));

        koin.grantRole(koin.MINTER_ROLE(), address(market));
        koin.grantRole(koin.MINTER_ROLE(), address(bank));
        koin.grantRole(koin.MINTER_ROLE(), address(this)); // test helper only
        market.grantRole(market.DIVIDEND_ADMIN(), address(this));

        aapl = _newStock("Apple", "AAPL", 0);
        msft = _newStock("Microsoft", "MSFT", 0);
        ko = _newStock("Coca-Cola", "KO", 1);
        _setPrice(aapl, 100e8);
        _setPrice(msft, 200e8);
        _setPrice(ko, 50e8);
    }

    function _newStock(string memory name, string memory ticker, uint8 sector) internal returns (SimStock s) {
        s = new SimStock(string.concat("Simulated ", name), string.concat("s", ticker), ticker, sector, address(market));
        market.listStock(s);
    }

    function _setPrice(SimStock s, int128 price) internal {
        bytes32[] memory ids = new bytes32[](1);
        int128[] memory prices = new int128[](1);
        ids[0] = s.priceId();
        prices[0] = price;
        oracle.setPrices(ids, prices);
    }

    /// @dev Funds `user` with Koin and buys `s` with it. Returns shares received.
    function _buy(address user, SimStock s, uint256 koinIn) internal returns (uint256) {
        koin.mint(user, koinIn);
        vm.prank(user);
        return market.buy(s, koinIn);
    }

    function _deposit(address user, SimStock s, uint256 shares) internal {
        vm.startPrank(user);
        s.approve(address(bank), shares);
        bank.deposit(s, shares);
        vm.stopPrank();
    }

    /// @dev alice holds 15 AAPL as collateral ($1,500 at $100) and borrows 750 (the 50% cap).
    function _aliceMaxLoan() internal {
        _buy(alice, aapl, 1500 ether);
        _deposit(alice, aapl, 15 ether);
        vm.prank(alice);
        bank.borrow(750 ether);
    }
}
