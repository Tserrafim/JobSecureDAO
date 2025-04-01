// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;

interface IJobSecureVerification {
    function verifyInitialClaim(address member) external returns (bool);
    function verifyOngoingClaim(address member) external view returns (bool);
    function verifyEmployment(address member) external view returns (bool);
}