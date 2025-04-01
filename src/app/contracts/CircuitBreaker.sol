// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/AccessControl.sol";

abstract contract CircuitBreaker is AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // System pause status
    bool public systemPaused;
    
    // Feature-specific pause status
    mapping(bytes32 => bool) public featurePaused;
    
    // Events
    event SystemPaused(address pauser, string reason);
    event SystemUnpaused(address unpauser);
    event FeaturePaused(bytes32 indexed feature, address pauser, string reason);
    event FeatureUnpaused(bytes32 indexed feature, address unpauser);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);
    }

    // Modifiers
    modifier whenNotPaused() {
        require(!systemPaused, "System is paused");
        _;
    }

    modifier whenFeatureNotPaused(bytes32 feature) {
        require(!featurePaused[feature], "Feature is paused");
        _;
    }

    // Pause functions
    function pauseSystem(string calldata reason) external onlyRole(PAUSER_ROLE) {
        systemPaused = true;
        emit SystemPaused(msg.sender, reason);
    }

    function unpauseSystem() external onlyRole(PAUSER_ROLE) {
        systemPaused = false;
        emit SystemUnpaused(msg.sender);
    }

    function pauseFeature(bytes32 feature, string calldata reason) external onlyRole(PAUSER_ROLE) {
        featurePaused[feature] = true;
        emit FeaturePaused(feature, msg.sender, reason);
    }

    function unpauseFeature(bytes32 feature) external onlyRole(PAUSER_ROLE) {
        featurePaused[feature] = false;
        emit FeatureUnpaused(feature, msg.sender);
    }
}