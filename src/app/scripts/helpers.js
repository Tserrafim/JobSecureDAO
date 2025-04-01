const { run } = require("hardhat");

async function verifyOnEtherscan(address, args = []) {
    try {
        console.log(`🔍 Verifying contract at ${address}...`);
        await run("verify:verify", {
            address: address,
            constructorArguments: args
        });
        console.log("✅ Verification submitted successfully");
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log("ℹ️ Contract already verified");
        } else {
            console.error("Verification failed:", error);
        }
    }
}

module.exports = {
    verifyOnEtherscan
};