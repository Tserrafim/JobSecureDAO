// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;

interface IJobSecureGovernance {
    function baseBenefitRate() external view returns (uint256);
    function maxWeeklyBenefit() external view returns (uint256);
    function minimumContribution() external view returns (uint256);
    function getRegionalParameters(address member) external view returns (uint256, uint256);
    function delegateVotingPower(address delegatee, uint256 amount) external;
    function increaseVotingPower(address member, uint256 amount) external;
    function investmentRatio() external view returns (uint256);
}