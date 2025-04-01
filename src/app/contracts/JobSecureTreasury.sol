// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.21;

//import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IJobSecureCore.sol";
import "./interfaces/IJobSecureGovernance.sol";
import "./interfaces/IYieldStrategy.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";

contract JobSecureTreasury is Initializable, ReentrancyGuardUpgradeable, AccessControlUpgradeable {
    using SafeERC20Upgradeable for IERC20MetadataUpgradeable;

    bytes32 public constant FUND_MANAGER_ROLE = keccak256("FUND_MANAGER_ROLE");

    // External contracts
    IJobSecureCore public core;
    IJobSecureGovernance public governance;

    IERC20MetadataUpgradeable public stablecoin;
    uint256 public rebalanceInterval;
    
    // Yield strategies
    IYieldStrategy[] public strategies;
    uint256[] public strategyAllocations;

    // Treasury state
    uint256 public totalAssets;
    uint256 public totalYieldGenerated;
    uint256 public lastRebalanceTime;
    uint256 public rebalanceInterval = 30 days;

    // Events
    event FundsDeposited(uint256 amount);
    event FundsInvested(uint256 amount, address strategy);
    event BenefitDistributed(address recipient, uint256 amount);
    event YieldHarvested(uint256 amount);
    event Rebalanced();

    constructor(address _core, address _governance, address _stablecoin) public initializer {
        __ReentrancyGuard_init();
        __AccessControl_init();

        core = IJobSecureCore(_core);
        governance = IJobSecureGovernance(_governance);
        stablecoin = IERC20MetadataUpgradeable(_stablecoin);
        rebalanceInterval = _rebalanceDays * 1 days;

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(FUND_MANAGER_ROLE, msg.sender);
    }

    // Fund management
    function depositFunds(uint256 tokenAmount) external nonReentrant {
        uint256 amount = tokenAmount * (10 ** stablecoin.decimals());
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);
        totalAssets += amount;
        emit FundsDeposited(amount);
    }

    function distributeBenefit(address recipient, uint256 tokenAmount) external nonReentrant {
        require(msg.sender == address(core), "Caller not authorized");
        require(amount <= availableLiquidity(), "Insufficient liquidity");
        
        uint256 amount = tokenAmount * (10 ** stablecoin.decimals());
        stablecoin.safeTransfer(recipient, amount);
        totalAssets -= amount;
        emit BenefitDistributed(recipient, amount);
    }

    // Investment functions
    function investFunds() external onlyRole(FUND_MANAGER_ROLE) {
        require(block.timestamp - lastRebalanceTime >= rebalanceInterval, "Rebalance cooldown");
        
        uint256 totalToInvest = totalAssets.mul(governance.investmentRatio()).div(100);
        uint256 remaining = totalToInvest;
        
        for (uint i = 0; i < strategies.length; i++) {
            uint256 allocation = totalToInvest.mul(strategyAllocations[i]).div(100);
            allocation = Math.min(allocation, remaining);
            
            if (allocation > 0) {
                stablecoin.safeIncreaseAllowance(address(strategies[i]), allocation);
                strategies[i].deposit(allocation);
                remaining -= allocation;
                emit FundsInvested(allocation, address(strategies[i]));
            }
        }
        
        lastRebalanceTime = block.timestamp;
        emit Rebalanced();
    }

    function harvestYield() external onlyRole(FUND_MANAGER_ROLE) returns (uint256 totalHarvested) {
        totalHarvested = 0;
        
        for (uint i = 0; i < strategies.length; i++) {
            uint256 harvested = strategies[i].harvest();
            totalHarvested += harvested;
        }
        
        totalYieldGenerated += totalHarvested;
        totalAssets += totalHarvested;
        emit YieldHarvested(totalHarvested);
    }

    // View functions
    function availableLiquidity() public view returns (uint256) {
        return stablecoin.balanceOf(address(this));
    }

    function totalInvested() public view returns (uint256) {
        uint256 total = 0;
        for (uint i = 0; i < strategies.length; i++) {
            total += strategies[i].balance();
        }
        return total;
    }

    // Strategy management
    function addStrategy(address strategy, uint256 allocation) external onlyRole(DEFAULT_ADMIN_ROLE) {
        strategies.push(IYieldStrategy(strategy));
        strategyAllocations.push(allocation);
    }

    function updateStrategyAllocation(uint256 index, uint256 newAllocation) external onlyRole(FUND_MANAGER_ROLE) {
        require(index < strategies.length, "Invalid strategy index");
        strategyAllocations[index] = newAllocation;
    }
}