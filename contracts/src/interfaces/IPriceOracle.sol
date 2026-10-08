// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Subset of the Anchored `StockOracle` interface. Prices have 8 decimals.
interface IPriceOracle {
    enum Session {
        UNKNOWN,
        PRE_MARKET,
        REGULAR,
        POST_MARKET,
        OVERNIGHT,
        CLOSED
    }

    function getPrice(bytes32 priceId) external view returns (int128 price, uint64 updatedAt, Session session);
}
