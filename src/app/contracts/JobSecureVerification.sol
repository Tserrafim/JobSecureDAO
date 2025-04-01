// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./interfaces/IJobSecureCore.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";

contract JobSecureVerification is Initializable, AccessControlUpgradeable {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    // External contracts
    IJobSecureCore public core;
    AggregatorV3Interface public employmentOracle;
    AggregatorV3Interface public identityOracle;

    // Claim verification parameters
        address rewardToken,
        uint256 validationReward,
        uint256 minValidations

    // Claim tracking
    struct Claim {
        address member;
        uint256 submissionTime;
        uint256 approvals;
        uint256 rejections;
        bool resolved;
        mapping(address => bool) validators;
    }

    mapping(uint256 => Claim) public claims;
    uint256 public claimCount;
    mapping(address => uint256) public lastClaimTime;

    // Events
    event ClaimSubmitted(uint256 claimId, address member);
    event ClaimValidated(uint256 claimId, address validator, bool approved);
    event ClaimResolved(uint256 claimId, bool approved);

    function initialize(
        address _core, 
        address _employmentOracle, 
        address _identityOracle, 
        address _rewardToken, 
        uint256 _validationReward, 
        uint256 _minValidations ) public initializer {

        __AccessControl_init();

        core = IJobSecureCore(_core);
        employmentOracle = AggregatorV3Interface(_employmentOracle);
        identityOracle = AggregatorV3Interface(_identityOracle);

        rewardToken = IERC20MetadataUpgradeable(_rewardToken);
        validationReward = _validationReward * (10 ** rewardToken.decimals());
        minValidations = _minValidations;

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // Verification functions
    function verifyInitialClaim(address member) external returns (bool) {
        require(msg.sender == address(core), "Caller not authorized");
        require(block.timestamp - lastClaimTime[member] > cooldownPeriod, "Cooldown active");

        // Create new claim
        uint256 claimId = claimCount++;
        Claim storage newClaim = claims[claimId];
        newClaim.member = member;
        newClaim.submissionTime = block.timestamp;
        
        emit ClaimSubmitted(claimId, member);
        return true;
    }

    function validateClaim(uint256 claimId, bool approved) external onlyRole(VALIDATOR_ROLE) {
        Claim storage claim = claims[claimId];
        require(!claim.resolved, "Claim already resolved");
        require(!claim.validators[msg.sender], "Already validated");

        claim.validators[msg.sender] = true;
        
        if (approved) {
            claim.approvals++;
        } else {
            claim.rejections++;
        }

        emit ClaimValidated(claimId, msg.sender, approved);

        // Check if claim can be resolved
        if (claim.approvals >= minimumValidations) {
            _resolveClaim(claimId, true);
        } else if (claim.rejections >= minimumValidations) {
            _resolveClaim(claimId, false);
        }
    }

    function verifyOngoingClaim(address member) external view returns (bool) {
        require(msg.sender == address(core), "Caller not authorized");
        
        // Check with employment oracle
        (, int employmentStatus, , ,) = employmentOracle.latestRoundData();
        return employmentStatus == 0; // 0 means unemployed
    }

    function verifyEmployment(address member) external view returns (bool) {
        require(msg.sender == address(core), "Caller not authorized");
        
        // Check with employment oracle
        (, int employmentStatus, , ,) = employmentOracle.latestRoundData();
        return employmentStatus == 1; // 1 means employed
    }


    function distributeReward(address validator) external {
        rewardToken.safeTransfer(validator, validationReward);
    }
    // Internal functions
    function _resolveClaim(uint256 claimId, bool approved, address validator) internal {
        Claim storage claim = claims[claimId];
        claim.resolved = approved;
        lastClaimTime[claim.member] = block.timestamp;

        distributeReward(validator);


        emit ClaimResolved(claimId, approved);
    }
}