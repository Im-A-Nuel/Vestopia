// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPriceOracle} from "../../src/interfaces/IPriceOracle.sol";

/// @dev Anchored-style oracle: only `getPrice`, no `getPreviousPrice`.
contract PlainOracle is IPriceOracle {
    mapping(bytes32 => int128) public prices;

    function set(bytes32 id, int128 price) external {
        prices[id] = price;
    }

    function getPrice(bytes32 id) external view returns (int128, uint64, Session) {
        return (prices[id], uint64(block.timestamp), Session.REGULAR);
    }
}
