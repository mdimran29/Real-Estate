const { ethers } = require("hardhat");

/**
 * Verify PropertyFractions Contract on Etherscan
 * 
 * This script verifies the PropertyFractions contract that was deployed
 * by TokenizationManager when tokenizing a property.
 * 
 * Usage:
 *   npx hardhat run scripts/verify-fractions.js --network sepolia
 */

async function main() {
    console.log("\n" + "═".repeat(70));
    console.log("Verifying PropertyFractions Contract on Etherscan");
    console.log("═".repeat(70) + "\n");

    // PropertyFractions contract details
    const PROPERTY_FRACTIONS_ADDRESS = "0xD9ac7da67BB998744e43EdA383dC5E7f2860FBf0";
    const PROPERTY_ID = 1;
    const TOKENIZATION_MANAGER = "0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3";

    console.log("Contract Address:", PROPERTY_FRACTIONS_ADDRESS);
    console.log("Property ID:", PROPERTY_ID);
    console.log("TokenizationManager:", TOKENIZATION_MANAGER);
    console.log();

    console.log("⏳ Verifying contract on Etherscan...\n");

    try {
        // Verify the PropertyFractions contract
        // Constructor arguments: propertyId, tokenizationManager
        await hre.run("verify:verify", {
            address: PROPERTY_FRACTIONS_ADDRESS,
            constructorArguments: [
                PROPERTY_ID,
                TOKENIZATION_MANAGER
            ],
        });

        console.log("\n✅ PropertyFractions contract verified successfully!");
        console.log("View at: https://sepolia.etherscan.io/address/" + PROPERTY_FRACTIONS_ADDRESS + "#code");
        
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log("\n✅ Contract is already verified!");
            console.log("View at: https://sepolia.etherscan.io/address/" + PROPERTY_FRACTIONS_ADDRESS + "#code");
        } else {
            console.error("\n❌ Verification failed:");
            console.error(error.message);
            
            console.log("\n💡 Manual Verification:");
            console.log("1. Go to: https://sepolia.etherscan.io/address/" + PROPERTY_FRACTIONS_ADDRESS + "#code");
            console.log("2. Click 'Verify and Publish'");
            console.log("3. Select:");
            console.log("   - Compiler Type: Solidity (Single file)");
            console.log("   - Compiler Version: v0.8.20+commit.a1b79de6");
            console.log("   - License Type: MIT");
            console.log("4. Copy contract code from: contracts/PropertyFractions.sol");
            console.log("5. Constructor Arguments (ABI-encoded):");
            console.log("   propertyId:", PROPERTY_ID);
            console.log("   tokenizationManager:", TOKENIZATION_MANAGER);
        }
    }

    console.log("\n" + "═".repeat(70));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
