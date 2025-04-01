// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./interfaces/IJobSecureGovernance.sol";
import "./interfaces/IJobSecureTreasury.sol";
import "./interfaces/IJobSecureVerification.sol";
import "./CircuitBreaker.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";

contract JobSecureCore is ReentrancyGuard, CircuitBreaker, Initializable, ReentrancyGuardUpgradeable, AccessControlUpgradeable {
    using SafeERC20Upgradeable for IERC20MetadataUpgradeable;
    using SafeMath for uint256;

    // Contract dependencies
    IJobSecureGovernance public governance;
    IJobSecureTreasury public treasury;
    IJobSecureVerification public verification;


    // Token instances with metadata
    IERC20MetadataUpgradeable public jsdaoToken;
    IERC20MetadataUpgradeable public stablecoin;

    uint256 public minContribution; // In JSDAO token units
    uint256 public maxWeeklyBenefit; // In stablecoin units


    // Member data structure
    struct Member {
        uint256 totalContributions;
        uint256 lastContributionTime;
        uint256 claimStartTime;
        uint256 claimedWeeks;
        uint256 benefitMultiplier; // Based on contribution history
        bool isUnemployed;
        bool isActive;
    }

    // System state
    mapping(address => Member) public members;
    uint256 public totalActiveMembers;
    uint256 public totalPoolBalance;
    uint256 public totalClaimsPaid;
    
    // Constants
    uint256 public constant MIN_CONTRIBUTION_PERIOD = 90 days;
    uint256 public constant MAX_BENEFIT_PERIOD = 26 weeks;
    uint256 public constant BENEFIT_CALCULATION_INTERVAL = 1 weeks;
    uint256 public constant EARLY_EMPLOYMENT_BONUS = 10; // 10% of remaining benefits
    
    // Define feature identifiers for CircuitBreaker.sol implementation
    bytes32 public constant FEATURE_CONTRIBUTIONS = keccak256("CONTRIBUTIONS");
    bytes32 public constant FEATURE_CLAIMS = keccak256("CLAIMS");
    bytes32 public constant FEATURE_BENEFITS = keccak256("BENEFITS");

    // Events
    event MembershipUpdated(address indexed member, bool isActive);
    event ContributionMade(address indexed member, uint256 amount);
    event ClaimSubmitted(address indexed member);
    event BenefitPaid(address indexed member, uint256 amount);
    event ClaimEnded(address indexed member, uint256 bonusAmount);
    event BenefitParametersAdjusted(uint256 newBaseRate, uint256 regionalAdjustment);

    // Modifiers
    modifier onlyGovernance() {
        require(msg.sender == address(governance), "Caller is not governance");
        _;
    }

    modifier onlyActiveMember() {
        require(members[msg.sender].isActive, "Not an active member");
        _;
    }

    function initialize(
        address _governance,
        address _treasury,
        address _verification,
        address _jsdaoToken,
        address _stablecoin,
        uint256 _minContribution,
        uint256 _maxWeeklyBenefit
    ) public initializer {
        __ReentrancyGuard_init();
        __AccessControl_init();


        governance = IJobSecureGovernance(_governance);
        treasury = IJobSecureTreasury(_treasury);
        verification = IJobSecureVerification(_verification);
        jsdaoToken = IERC20MetadataUpgradeable(_jsdaoToken);
        stablecoin = IERC20MetadataUpgradeable(_stablecoin);

        minContribution = _minContribution * (10 ** jsdaoToken.decimals());
        maxWeeklyBenefit = _maxWeeklyBenefit * (10 ** stablecoin.decimals());

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}




    /**
     * @dev Join the DAO and make initial contribution
     * @param contributionAmount Amount of JSDAO tokens to stake
     */
    function joinDAO(uint256 contributionAmount) external nonReentrant {
        require(!members[msg.sender].isActive, "Already a member");
        require(contributionAmount >= governance.minimumContribution(), "Contribution too low");

        // Transfer and stake tokens
        jsdaoToken.safeTransferFrom(msg.sender, address(this), contributionAmount);
        
        // Initialize member
        members[msg.sender] = Member({
            totalContributions: contributionAmount,
            lastContributionTime: block.timestamp,
            claimStartTime: 0,
            claimedWeeks: 0,
            benefitMultiplier: 100, // Base 100% multiplier
            isUnemployed: false,
            isActive: true
        });

        totalActiveMembers++;
        totalPoolBalance += contributionAmount;

        // Delegate voting power to member
        governance.delegateVotingPower(msg.sender, contributionAmount);

        emit MembershipUpdated(msg.sender, true);
        emit ContributionMade(msg.sender, contributionAmount);
    }

    /**
     * Decimal-aware contribution function
     * @dev Make regular contribution to the insurance pool
     * @param amount Amount to contribute
     */
    function contribute(uint256 tokenAmount) external onlyActiveMember nonReentrant whenNotPaused whenFeatureNotPaused(FEATURE_CONTRIBUTIONS){
        require(amount > 0, "Amount must be positive");
        require(!members[msg.sender].isUnemployed, "Cannot contribute while claiming");

        uint256 amount = tokenAmount * (10 ** jsdaoToken.decimals());
        jsdaoToken.safeTransferFrom(msg.sender, address(this), amount);
        
        Member storage member = members[msg.sender];
        member.totalContributions += amount;
        member.lastContributionTime = block.timestamp;
        
        // Increase benefit multiplier for long-term contributors
        uint256 membershipDuration = block.timestamp - member.lastContributionTime;
        if (membershipDuration > 365 days) {
            member.benefitMultiplier = Math.min(150, member.benefitMultiplier + 1);
        }

        totalPoolBalance += amount;
        governance.increaseVotingPower(msg.sender, amount);

        emit ContributionMade(msg.sender, amount);
    }

    /**
     * @dev Submit unemployment claim
     */
    function submitClaim() external onlyActiveMember nonReentrant whenNotPaused whenFeatureNotPaused {
        Member storage member = members[msg.sender];
        
        require(!member.isUnemployed, "Claim already active");
        require(block.timestamp - member.lastContributionTime >= MIN_CONTRIBUTION_PERIOD, "Insufficient contribution history");
        require(verification.verifyInitialClaim(msg.sender), "Claim verification failed");

        member.isUnemployed = true;
        member.claimStartTime = block.timestamp;
        member.claimedWeeks = 0;

        emit ClaimSubmitted(msg.sender);
    }

    /**
     * @dev Distribute weekly benefit payment
     */
    function claimBenefit() external onlyActiveMember nonReentrant whenNotPaused whenFeatureNotPaused{
        Member storage member = members[msg.sender];
        
        require(member.isUnemployed, "No active claim");
        require(verification.verifyOngoingClaim(msg.sender), "Ongoing verification failed");
        
        uint256 weeksSinceClaim = (block.timestamp - member.claimStartTime) / BENEFIT_CALCULATION_INTERVAL;
        require(weeksSinceClaim > member.claimedWeeks, "Benefit already paid for this period");
        require(weeksSinceClaim <= MAX_BENEFIT_PERIOD, "Max benefit period reached");

        uint256 baseWeeklyBenefit = calculateBaseWeeklyBenefit(msg.sender);
        uint256 adjustedBenefit = applyRegionalAdjustments(baseWeeklyBenefit, msg.sender);
        uint256 totalBenefit = adjustedBenefit.mul(member.benefitMultiplier).div(100);

        require(totalBenefit <= treasury.availableLiquidity(), "Insufficient pool liquidity");

        // Update member state
        member.claimedWeeks = weeksSinceClaim;
        totalClaimsPaid += totalBenefit;

        // Transfer benefit
        treasury.distributeBenefit(msg.sender, totalBenefit);

        emit BenefitPaid(msg.sender, totalBenefit);
    }

    /**
     * @dev End claim when member finds employment
     */
    function endClaim() external onlyActiveMember nonReentrant {
        Member storage member = members[msg.sender];
        require(member.isUnemployed, "No active claim");

        // Verify employment status
        require(verification.verifyEmployment(msg.sender), "Employment verification failed");

        // Calculate remaining benefits
        uint256 remainingWeeks = MAX_BENEFIT_PERIOD - ((block.timestamp - member.claimStartTime) / BENEFIT_CALCULATION_INTERVAL);
        uint256 baseWeeklyBenefit = calculateBaseWeeklyBenefit(msg.sender);
        uint256 bonusAmount = baseWeeklyBenefit.mul(remainingWeeks).mul(EARLY_EMPLOYMENT_BONUS).div(100);

        // Update member state
        member.isUnemployed = false;
        member.claimStartTime = 0;
        member.claimedWeeks = 0;

        // Pay early employment bonus if applicable
        if (bonusAmount > 0 && bonusAmount <= treasury.availableLiquidity()) {
            treasury.distributeBenefit(msg.sender, bonusAmount);
        }

        emit ClaimEnded(msg.sender, bonusAmount);
    }

    /**
     * @dev Calculate base weekly benefit amount
     */
    function calculateBaseWeeklyBenefit(address member) internal view returns (uint256) {
        uint256 averageContribution = members[member].totalContributions.div(52); // Weekly average over 1 year
        return Math.min(
            averageContribution.mul(governance.baseBenefitRate()).div(100),
            governance.maxWeeklyBenefit()
        );
    }

    /**
     * @dev Apply regional adjustments to benefits
     */
    function applyRegionalAdjustments(uint256 baseAmount, address member) internal view returns (uint256) {
        (uint256 regionalMultiplier, ) = governance.getRegionalParameters(member);
        return baseAmount.mul(regionalMultiplier).div(100);
    }

    // Governance-controlled parameter updates
    function updateDependencies(
        address _governance,
        address _treasury,
        address _verification
    ) external onlyGovernance {
        governance = IJobSecureGovernance(_governance);
        treasury = IJobSecureTreasury(_treasury);
        verification = IJobSecureVerification(_verification);
    }
}