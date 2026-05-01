// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ERC20ToERC7984Wrapper} from "@iexec-nox/nox-confidential-contracts/contracts/token/extensions/ERC20ToERC7984Wrapper.sol";
import {ERC7984} from "@iexec-nox/nox-confidential-contracts/contracts/token/ERC7984.sol";

/**
 * @title ConfPayToken
 * @dev Confidential Payroll Token — wraps an ERC-20 into an ERC-7984 confidential token.
 * Full ERC-7984 compliance is inherited from ERC20ToERC7984Wrapper → ERC7984 → ERC7984Base.
 */
contract ConfPayToken is ERC20ToERC7984Wrapper {
    constructor(
        IERC20 underlying_
    ) ERC7984("ConfPayToken", "CPAY", "") ERC20ToERC7984Wrapper(underlying_) {}
}
