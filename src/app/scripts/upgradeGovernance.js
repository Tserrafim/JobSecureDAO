const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
    const proxyAddress = process.env.GOVERNANCE_PROXY_ADDRESS;
    
    const GovernanceV2 = await ethers.getContractFactory("JobSecureGovernanceV2");

    console.log("╔══════════════════════════════════╗");
    console.log("║    Governance Upgrade Script     ║");
    console.log("╚══════════════════════════════════╝");
    
    console.log("[1/3] Checking storage layout...");
    await upgrades.validateImplementation(GovernanceV2);
    
    console.log("[2/3] Deploying new implementation...");
    const implAddress = await upgrades.prepareUpgrade(proxyAddress, GovernanceV2);
    console.log("Implementation deployed to:", implAddress);
    
    console.log("[3/3] Upgrading proxy...");
    const governance = await upgrades.upgradeProxy(proxyAddress, GovernanceV2);
    await governance.deployed();
    
    console.log("Governance upgraded:");
    console.log(`- Proxy: ${proxyAddress}`);
    console.log(`- Implementation: ${implAddress}`);
    console.log(`- Version: ${await governance.version()}`);
}

main().catch((error) => {
    console.error("Upgrade failed:", error);
    process.exitCode = 1;
});