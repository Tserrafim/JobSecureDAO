const { ethers, upgrades } = require("hardhat");
const { verifyOnEtherscan } = require("./helpers");

async function main() {
    const [deployer] = await ethers.getSigners();
    const proxyAddress = "0x..."; // Your verification proxy address
    
    console.log(`Upgrading with account: ${deployer.address}`);
    
    const VerificationV2 = await ethers.getContractFactory("JobSecureVerificationV2");

    console.log("╔══════════════════════════════════╗");
    console.log("║    Verification Upgrade Script   ║");
    console.log("╚══════════════════════════════════╝");
    

    console.log("[1/3] Checking storage layout...");
    await upgrades.validateUpgrade(proxyAddress, VerificationV2);
    
    console.log("[2/3] Preparing upgrade...");
    const implAddress = await upgrades.prepareUpgrade(proxyAddress, VerificationV2, {
        timeout: 0 // Disable timeout for large contracts
    });
    
    console.log("[3/3] Executing upgrade...");
    const tx = await upgrades.upgradeProxy(proxyAddress, VerificationV2);
    await tx.deployTransaction.wait(3); // Wait for 3 confirmations
    
    console.log("Upgrade completed successfully!");
    console.log(`New implementation: ${implAddress}`);
    
    // Optional: Verify on Etherscan
    await verifyOnEtherscan(implAddress);
}

main().catch((error) => {
    console.error("Upgrade failed:", error);
    process.exit(1);
});