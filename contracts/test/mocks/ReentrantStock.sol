// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {VillageBank} from "../../src/VillageBank.sol";
import {SimStock} from "../../src/SimStock.sol";

/// @dev Malicious "stock" that mimics the SimStock surface and calls back into the Bank during transfers.
contract ReentrantStock {
    address public market;
    VillageBank public bank;
    uint8 public sector = 0;
    string public ticker = "EVIL";
    bytes32 public priceId = keccak256("EVIL");
    bool public armed;
    uint8 public mode; // 0 deposit, 1 withdraw, 2 borrow, 3 repay, 4 liquidate

    constructor(address market_) {
        market = market_;
    }

    function setBank(VillageBank bank_, uint8 mode_, bool armed_) external {
        bank = bank_;
        mode = mode_;
        armed = armed_;
    }

    function balanceOf(address) external pure returns (uint256) {
        return 0;
    }

    function transferFrom(address, address, uint256) external returns (bool) {
        _reenter();
        return true;
    }

    function transfer(address, uint256) external returns (bool) {
        _reenter();
        return true;
    }

    function _reenter() internal {
        if (!armed) return;
        if (mode == 0) bank.deposit(SimStock(address(this)), 1);
        else if (mode == 1) bank.withdraw(SimStock(address(this)), 1);
        else if (mode == 2) bank.borrow(1);
        else if (mode == 3) bank.repay(1);
        else bank.liquidate(address(this), SimStock(address(this)), 1);
    }
}
