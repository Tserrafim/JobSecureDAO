// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;


import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract JobSecureGovernance is ERC20VotesUpgradeable, 
    AccessControlUpgradeable, 
    UUPSUpgradeable  {
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 public constant PARAMETER_SETTER_ROLE = keccak256("PARAMETER_SETTER_ROLE");
    bytes32 public constant TREASURY_MANAGER_ROLE = keccak256("TREASURY_MANAGER_ROLE");

    // Governance parameters
    uint256 public baseBenefitRate; // Percentage (60 = 60%)
    uint256 public minContribution; // In token units
    uint256 public maxWeeklyBenefit; // In stablecoin units

    uint256 public claimVerificationThreshold;
    uint256 public regionalAdjustmentGracePeriod;

    // Regional parameters
    struct Region {
        uint256 benefitMultiplier;
        uint256 unemploymentThreshold;
        uint256 lastUpdated;
    }
    
    mapping(bytes32 => Region) public regions;
    mapping(address => bytes32) public memberRegions;

    // Voting sets
    EnumerableSet.AddressSet private validators;
    EnumerableSet.AddressSet private auditors;

    // Events
    event ParameterUpdated(string parameter, uint256 newValue);
    event RegionUpdated(bytes32 regionId, uint256 multiplier, uint256 threshold);
    event VoteDelegated(address indexed delegator, address indexed delegatee);
    event ProposalCreated(uint256 proposalId, string description);

    function initialize() public initializer {
        __ERC20_init("JobSecure DAO Token", "JSDAO");
        __ERC20Permit_init("JobSecure DAO Token");
        __AccessControl_init();
        __UUPSUpgradeable_init();

        baseBenefitRate = 60; // 60%
        minContribution = _minContribution;
        maxWeeklyBenefit = _maxWeeklyBenefit;
        claimVerificationThreshold = 500;
        regionalAdjustmentGracePeriod = 30 days;

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PARAMETER_SETTER_ROLE, msg.sender);
        _setupRole(TREASURY_MANAGER_ROLE, msg.sender);
        _setupRole(UPGRADER_ROLE, msg.sender);
    }


    function _authorizeUpgrade(address) internal override onlyRole(UPGRADER_ROLE)  {}

    // Decimal-aware token minting
    function mintTokens(address to, uint256 tokenAmount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _mint(to, tokenAmount * (10 ** decimals()));
    }

    // Governance functions
    function setBaseBenefitRate(uint256 newRate) external onlyRole(PARAMETER_SETTER_ROLE) {
        require(newRate >= 30 && newRate <= 80, "Rate out of bounds");
        baseBenefitRate = newRate;
        emit ParameterUpdated("baseBenefitRate", newRate);
        
    }

    function setRegionalParameters(
        bytes32 regionId,
        uint256 multiplier,
        uint256 threshold
    ) external onlyRole(PARAMETER_SETTER_ROLE) {
        require(multiplier >= 50 && multiplier <= 150, "Multiplier out of bounds");
        require(threshold <= 2000, "Threshold too high"); // 20% max
        
        regions[regionId] = Region({
            benefitMultiplier: multiplier,
            unemploymentThreshold: threshold,
            lastUpdated: block.timestamp
        });
        
        emit RegionUpdated(regionId, multiplier, threshold);
    }

    function getRegionalParameters(address member) external view returns (uint256, uint256) {
        bytes32 region = memberRegions[member];
        return (regions[region].benefitMultiplier, regions[region].unemploymentThreshold);
    }

    // Token delegation
    function delegateVotingPower(address delegatee, uint256 amount) external {
        _delegate(msg.sender, delegatee);
        _mint(delegatee, amount);
    }

    function increaseVotingPower(address member, uint256 amount) external {
        _mint(member, amount);
    }

    // Validator management
    function addValidator(address validator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        validators.add(validator);
    }

    function isValidator(address account) external view returns (bool) {
        return validators.contains(account);
    }
}