// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;

interface IYieldStrategy {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external returns (uint256);
    function harvest() external returns (uint256);
    function balance() external view returns (uint256);
}