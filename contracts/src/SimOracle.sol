// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {IPriceOracle} from "./interfaces/IPriceOracle.sol";

/// @notice Owner-controlled price feed for simulated stocks. Replace with the Anchored oracle for real tokens.
contract SimOracle is IPriceOracle, Ownable {
    struct Price {
        int128 price;
        uint64 updatedAt;
    }

    mapping(bytes32 => Price) private _prices;

    error LengthMismatch();

    event PriceSet(bytes32 indexed priceId, int128 price);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Unknown ids return (0, 0, UNKNOWN); consumers must reject price <= 0.
    function getPrice(bytes32 priceId) external view returns (int128 price, uint64 updatedAt, Session session) {
        Price memory p = _prices[priceId];
        return (p.price, p.updatedAt, p.updatedAt == 0 ? Session.UNKNOWN : Session.REGULAR);
    }

    function setPrices(bytes32[] calldata ids, int128[] calldata prices) external onlyOwner {
        if (ids.length != prices.length) revert LengthMismatch();
        for (uint256 i = 0; i < ids.length; i++) {
            _prices[ids[i]] = Price(prices[i], SafeCast.toUint64(block.timestamp));
            emit PriceSet(ids[i], prices[i]);
        }
    }
}
