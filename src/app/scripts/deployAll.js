// scripts/deployAll.js
const { ethers, upgrades } = require("hardhat");

async function main() {
    // Deploy Governance
    const Governance = await ethers.getContractFactory("JobSecureGovernance");
    const governance = await upgrades.deployProxy(Governance, [], {
        initializer: "initialize"
    });
    await governance.deployed();
    
    // Deploy Verification
    const Verification = await ethers.getContractFactory("JobSecureVerification");
    const verification = await upgrades.deployProxy(Verification, [
        /* core address will be set later */ 
        ethers.constants.AddressZero,
        "0x...", // employment oracle address
        "0x..."  // identity oracle address
    ], { initializer: "initialize" });
    
    // Deploy Treasury
    const Treasury = await ethers.getContractFactory("JobSecureTreasury");
    const treasury = await upgrades.deployProxy(Treasury, [
        /* core address will be set later */
        governance.address,
        "0x..." // stablecoin address
    ], { initializer: "initialize" });
    
    // Deploy Core (needs other contracts' addresses)
    const Core = await ethers.getContractFactory("JobSecureCore");
    const core = await upgrades.deployProxy(Core, [
        governance.address,
        treasury.address,
        verification.address,
        "0x...", // jsdao token address
        "0x..."  // stablecoin address
    ], { initializer: "initialize" });
    
    // Initialize cross-references
    await verification.updateDependencies(core.address);
    await treasury.updateDependencies(core.address);
    
    console.log("Governance:", governance.address);
    console.log("Verification:", verification.address);
    console.log("Treasury:", treasury.address);
    console.log("Core:", core.address);
}

main();