const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
    const proxyAddress = process.env.TREASURY_PROXY_ADDRESS;
    const TreasuryV2 = await ethers.getContractFactory("JobSecureTreasuryV2");

    console.log("╔══════════════════════════════════╗");
    console.log("║      Treasury Upgrade Script     ║");
    console.log("╚══════════════════════════════════╝");
    
    console.log("[1/3] Checking storage layout...");
    await upgrades.validateUpgrade(proxyAddress, TreasuryV2, {
        kind: "uups"
    });

    console.log("[2/3] Preparing upgrade...");
    const implAddress = await upgrades.prepareUpgrade(proxyAddress, TreasuryV2);
    console.log(`New implementation: ${implAddress}`);

    console.log("[3/3] Executing upgrade...");
    const treasury = await upgrades.upgradeProxy(proxyAddress, TreasuryV2);
    await treasury.deployed();

    console.log("Upgrade complete!");
    console.table({
        Proxy: proxyAddress,
        Implementation: implAddress,
        Block: await ethers.provider.getBlockNumber()
    });
}

main().catch((error) => {
    console.error("Upgrade failed with error:", error.message);
    process.exitCode = 1;
});