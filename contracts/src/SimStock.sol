// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Simulated stock token (18 decimals). One deploy per stock. Only the Market mints and burns.
contract SimStock is ERC20 {
    string public ticker;
    address public immutable market;
    uint8 public immutable sector;
    bytes32 public immutable priceId;

    error NotMarket();
    error ZeroAddress();

    constructor(string memory name_, string memory symbol_, string memory ticker_, uint8 sector_, address market_)
        ERC20(name_, symbol_)
    {
        if (market_ == address(0)) revert ZeroAddress();
        ticker = ticker_;
        market = market_;
        sector = sector_;
        priceId = keccak256(bytes(ticker_));
    }

    function mint(address to, uint256 amount) external {
        if (msg.sender != market) revert NotMarket();
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        if (msg.sender != market) revert NotMarket();
        _burn(from, amount);
    }
}
