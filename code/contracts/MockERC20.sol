// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev Simple ERC-20 token with public mint for testing.
 * Used as the underlying token for the ERC-7984 wrapper.
 */
contract MockERC20 is ERC20 {
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

    /**
     * @dev Public mint — anyone can mint for testing purposes.
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
