const { ethers, upgrades } = require("hardhat");
const chalk = require("chalk");

async function main() {
    const contracts = [
        { name: "Core", proxy: process.env.CORE_PROXY, version: "V2" },
        { name: "Governance", proxy: process.env.GOVERNANCE_PROXY, version: "V2" },
        { name: "Treasury", proxy: process.env.TREASURY_PROXY, version: "V2" },
        { name: "Verification", proxy: process.env.VERIFICATION_PROXY, version: "V2" }
    ];


    console.log("╔══════════════════════════════════╗");
    console.log("║       Batch Upgrade Script       ║");
    console.log("╚══════════════════════════════════╝");

    for (const contract of contracts) {
        try {
            console.log(chalk.yellow(`\n▶ Upgrading ${contract.name}...`));
            const Factory = await ethers.getContractFactory(`JobSecure${contract.name}${contract.version}`);
            
            console.log(chalk.blue("[1/3] Checking storage layout..."));
            await upgrades.validateUpgrade(contract.proxy, Factory);
            
            console.log(chalk.blue("  [2/3] Preparing upgrade..."));
            const impl = await upgrades.prepareUpgrade(contract.proxy, Factory);
            
            console.log(chalk.blue("  [3/3] Executing upgrade..."));
            await upgrades.upgradeProxy(contract.proxy, Factory);
            
            console.log(chalk.green(`${contract.name} upgraded successfully`));
            console.log(`   Proxy: ${contract.proxy}`);
            console.log(`   Impl:  ${impl}\n`);
        } catch (error) {
            console.log(chalk.red(`${contract.name} upgrade failed:`));
            console.error(error);
            process.exit(1);
        }
    }
}

main();