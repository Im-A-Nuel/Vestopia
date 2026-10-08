// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Base} from "./Base.t.sol";
import {Koin} from "../src/Koin.sol";
import {SimStock} from "../src/SimStock.sol";
import {SimOracle} from "../src/SimOracle.sol";
import {VillageMarket} from "../src/VillageMarket.sol";
import {VillageBank} from "../src/VillageBank.sol";

/// @dev Random walk over every player action. Ghost variables record what the protocol should have minted/lent.
contract Handler is Test {
    Koin internal koin;
    VillageMarket internal market;
    VillageBank internal bank;
    SimOracle internal oracle;
    address internal oracleOwner;

    address[] internal actors;
    SimStock[] internal stocks;

    uint256 public ghostKoinSupply;
    uint256 public ghostDebt;
    uint256 public okCalls;

    constructor(
        Koin koin_,
        VillageMarket market_,
        VillageBank bank_,
        SimOracle oracle_,
        address oracleOwner_,
        SimStock[] memory stocks_
    ) {
        koin = koin_;
        market = market_;
        bank = bank_;
        oracle = oracle_;
        oracleOwner = oracleOwner_;
        for (uint256 i = 0; i < stocks_.length; i++) {
            stocks.push(stocks_[i]);
        }
        for (uint256 i = 0; i < 4; i++) {
            actors.push(makeAddr(string.concat("actor", vm.toString(i))));
        }
    }

    function actorCount() external view returns (uint256) {
        return actors.length;
    }

    function actorAt(uint256 i) external view returns (address) {
        return actors[i];
    }

    function _actor(uint256 seed) internal view returns (address) {
        return actors[seed % actors.length];
    }

    function _stock(uint256 seed) internal view returns (SimStock) {
        return stocks[seed % stocks.length];
    }

    function claim(uint256 a) external {
        address who = _actor(a);
        vm.prank(who);
        try market.claimStarter() {
            ghostKoinSupply += 1000 ether;
            okCalls++;
        } catch {}
    }

    function buy(uint256 a, uint256 s, uint256 amt) external {
        address who = _actor(a);
        amt = bound(amt, 0, koin.balanceOf(who));
        vm.prank(who);
        try market.buy(_stock(s), amt) {
            ghostKoinSupply -= amt;
            okCalls++;
        } catch {}
    }

    function sell(uint256 a, uint256 s, uint256 amt) external {
        address who = _actor(a);
        SimStock st = _stock(s);
        amt = bound(amt, 0, st.balanceOf(who));
        vm.prank(who);
        try market.sell(st, amt) returns (uint256 out) {
            ghostKoinSupply += out;
            okCalls++;
        } catch {}
    }

    function deposit(uint256 a, uint256 s, uint256 amt) external {
        address who = _actor(a);
        SimStock st = _stock(s);
        amt = bound(amt, 0, st.balanceOf(who));
        vm.startPrank(who);
        st.approve(address(bank), amt);
        try bank.deposit(st, amt) {
            okCalls++;
        } catch {}
        vm.stopPrank();
    }

    function withdraw(uint256 a, uint256 s, uint256 amt) external {
        address who = _actor(a);
        SimStock st = _stock(s);
        amt = bound(amt, 0, bank.collateralOf(who, address(st)));
        vm.prank(who);
        try bank.withdraw(st, amt) {
            okCalls++;
        } catch {}
    }

    function borrow(uint256 a, uint256 amt) external {
        address who = _actor(a);
        amt = bound(amt, 0, 5_000 ether);
        vm.prank(who);
        try bank.borrow(amt) {
            ghostKoinSupply += amt;
            ghostDebt += amt;
            okCalls++;
        } catch {}
    }

    function repay(uint256 a, uint256 amt) external {
        address who = _actor(a);
        amt = bound(amt, 0, koin.balanceOf(who));
        vm.prank(who);
        try bank.repay(amt) returns (uint256 repaid) {
            ghostKoinSupply -= repaid;
            ghostDebt -= repaid;
            okCalls++;
        } catch {}
    }

    function liquidate(uint256 liq, uint256 victim, uint256 s, uint256 amt) external {
        address by = _actor(liq);
        address user = _actor(victim);
        amt = bound(amt, 0, koin.balanceOf(by));
        vm.prank(by);
        try bank.liquidate(user, _stock(s), amt) {
            ghostKoinSupply -= amt;
            ghostDebt -= amt;
            okCalls++;
        } catch {}
    }

    function dividendAndHarvest(uint256 a, uint256 s, uint256 amt) external {
        address who = _actor(a);
        amt = bound(amt, 1, 500 ether);
        address[] memory players = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        players[0] = who;
        amounts[0] = amt;
        market.creditDividends(_stock(s), players, amounts); // handler holds DIVIDEND_ADMIN
        vm.prank(who);
        market.harvest(_stock(s));
        ghostKoinSupply += amt;
        okCalls++;
    }

    function movePrice(uint256 s, uint256 price) external {
        price = bound(price, 5e8, 500e8);
        bytes32[] memory ids = new bytes32[](1);
        int128[] memory prices = new int128[](1);
        ids[0] = _stock(s).priceId();
        prices[0] = int128(int256(price));
        vm.prank(oracleOwner);
        oracle.setPrices(ids, prices);
    }
}

contract InvariantsTest is Base {
    Handler internal handler;

    function setUp() public override {
        super.setUp();
        SimStock[] memory list = new SimStock[](3);
        list[0] = aapl;
        list[1] = msft;
        list[2] = ko;
        handler = new Handler(koin, market, bank, oracle, address(this), list);
        market.grantRole(market.DIVIDEND_ADMIN(), address(handler));
        targetContract(address(handler));
    }

    /// Koin only enters via starter/borrow/sell/harvest and leaves via buy/repay/liquidate.
    function invariant_koinSupplyMatchesAccounting() public view {
        assertEq(koin.totalSupply(), handler.ghostKoinSupply());
    }

    /// Total debt equals borrowed minus repaid.
    function invariant_debtMatchesAccounting() public view {
        uint256 sum;
        for (uint256 i = 0; i < handler.actorCount(); i++) {
            sum += bank.debtOf(handler.actorAt(i));
        }
        assertEq(sum, handler.ghostDebt());
    }

    /// The Bank holds exactly the sum of what users deposited, per stock.
    function invariant_bankHoldsSumOfDeposits() public view {
        SimStock[3] memory list = [aapl, msft, ko];
        for (uint256 s = 0; s < 3; s++) {
            uint256 sum;
            for (uint256 i = 0; i < handler.actorCount(); i++) {
                sum += bank.collateralOf(handler.actorAt(i), address(list[s]));
            }
            assertEq(list[s].balanceOf(address(bank)), sum);
        }
    }

    /// Stock supply is fully held by players and the Bank.
    function invariant_stockSupplyIsHeldByPlayersAndBank() public view {
        SimStock[3] memory list = [aapl, msft, ko];
        for (uint256 s = 0; s < 3; s++) {
            uint256 sum = list[s].balanceOf(address(bank));
            for (uint256 i = 0; i < handler.actorCount(); i++) {
                sum += list[s].balanceOf(handler.actorAt(i));
            }
            assertEq(list[s].totalSupply(), sum);
        }
    }
}
