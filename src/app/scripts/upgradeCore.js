const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
    const proxyAddress = process.env.CORE_PROXY_ADDRESS;
    
    const CoreV2 = await ethers.getContractFactory("JobSecureCoreV2");
    
    console.log("╔══════════════════════════════════╗");
    console.log("║        Core Upgrade Script       ║");
    console.log("╚══════════════════════════════════╝");

    console.log("[1/3] Preparing upgrade...");
    const implAddress = await upgrades.prepareUpgrade(proxyAddress, CoreV2);
    console.log("New implementation deployed to:", implAddress);
    
    console.log("[2/3] Verifying upgrade...");
    await upgrades.validateUpgrade(proxyAddress, CoreV2);
    
    console.log("[3/3] Executing upgrade...");
    await upgrades.upgradeProxy(proxyAddress, CoreV2);
    console.log("Core contract upgraded successfully");
    console.log(`Proxy address: ${proxyAddress}`);
    console.log(`Implementation: ${implAddress}`);
}

main().catch((error) => {
    console.error("Upgrade failed:", error);
    process.exit(1);
});