const { ethers } = require("hardhat");
require('dotenv').config();

/**
 * PropToken - Master Script (All-in-One)
 * Complete workflow for Real Estate Tokenization Platform
 * 
 * Usage:
 *   npx hardhat run scripts/master-script.js --network sepolia
 * 
 * This script will:
 *   1. Tokenize a property (creates NFT, makes NFT Transfers tab appear on Etherscan)
 *   2. Start distribution at 0.001 ETH per fraction
 *   3. Approve fractions for sale
 *   4. Display instructions for buying
 */

// Current deployed contract addresses
const TOKENIZATION_MANAGER_ADDRESS = "0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3";

async function main() {
    console.log("\n" + "╔" + "═".repeat(68) + "╗");
    console.log("║" + " ".repeat(68) + "║");
    console.log("║" + " ".repeat(18) + "PropToken - Complete Setup" + " ".repeat(24) + "║");
    console.log("║" + " ".repeat(15) + "Real Estate Tokenization Platform" + " ".repeat(20) + "║");
    console.log("║" + " ".repeat(68) + "║");
    console.log("╚" + "═".repeat(68) + "╝\n");

    const [owner] = await ethers.getSigners();
    console.log("🔑 Owner Wallet:", owner.address);
    
    const balance = await ethers.provider.getBalance(owner.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "ETH\n");

    // Connect to TokenizationManager
    const tokenizationManager = await ethers.getContractAt(
        "TokenizationManager",
        TOKENIZATION_MANAGER_ADDRESS
    );

    console.log("═".repeat(70));
    console.log("STEP 1: TOKENIZE A PROPERTY");
    console.log("═".repeat(70) + "\n");

    console.log("Creating a new property...");
    console.log("  Property Address: 123 Luxury Ave, Dubai Marina");
    console.log("  Metadata: ipfs://QmPropertyMetadata\n");

    // Tokenize property (propertyAddress, metadataURI)
    const tokenizeTx = await tokenizationManager.tokenizeProperty(
        "123 Luxury Ave, Dubai Marina",
        "ipfs://QmPropertyMetadata"
    );

    console.log("⏳ Transaction sent:", tokenizeTx.hash);
    console.log("   Waiting for confirmation...");

    const tokenizeReceipt = await tokenizeTx.wait();

    console.log("\n✅ Property tokenized successfully!");
    console.log("   Block:", tokenizeReceipt.blockNumber);
    console.log("   Gas used:", tokenizeReceipt.gasUsed.toString());

    // Get the property ID (should be 1 if this is the first)
    const propertyId = 1;
    
    // Get property details
    const property = await tokenizationManager.getTokenizedProperty(propertyId);
    
    console.log("\n📊 Property Details:");
    console.log("   Property ID:", propertyId);
    console.log("   Fractions Contract:", property.fractionsContract);
    console.log("   Owner:", property.owner);
    console.log("   Is Locked:", property.isLocked);
    console.log("   Is Distributing:", property.isDistributing);

    // Get fraction balance
    const fractions = await ethers.getContractAt(
        "PropertyFractions",
        property.fractionsContract
    );
    
    const ownerBalance = await fractions.balanceOf(owner.address);
    console.log("   Owner Fraction Balance:", ethers.formatEther(ownerBalance), "fractions");

    console.log("\n✅ NFT TRANSFERS TAB WILL NOW APPEAR ON ETHERSCAN!");
    console.log("   Check: https://sepolia.etherscan.io/address/" + TOKENIZATION_MANAGER_ADDRESS + "#nfttransfers");
    console.log("   (Wait 1-2 minutes and refresh if not visible yet)");

    console.log("\n═".repeat(70));
    console.log("STEP 2: START DISTRIBUTION");
    console.log("═".repeat(70) + "\n");

    const pricePerFraction = ethers.parseEther("0.001"); // 0.001 ETH per fraction
    console.log("Setting price to:", ethers.formatEther(pricePerFraction), "ETH per fraction");

    const startDistTx = await tokenizationManager.startDistribution(
        propertyId,
        pricePerFraction
    );

    console.log("⏳ Transaction sent:", startDistTx.hash);
    await startDistTx.wait();

    console.log("✅ Distribution started!\n");

    console.log("═".repeat(70));
    console.log("STEP 3: APPROVE FRACTIONS FOR SALE");
    console.log("═".repeat(70) + "\n");

    console.log("Approving TokenizationManager to transfer fractions...");

    const approveAmount = ethers.parseEther("1000000"); // Approve all 1M fractions
    const approveTx = await fractions.approve(
        TOKENIZATION_MANAGER_ADDRESS,
        approveAmount
    );

    console.log("⏳ Transaction sent:", approveTx.hash);
    await approveTx.wait();

    console.log("✅ Approval confirmed!");
    console.log("   Allowance set to:", ethers.formatEther(approveAmount), "fractions\n");

    // Final property status
    const updatedProperty = await tokenizationManager.getTokenizedProperty(propertyId);
    
    console.log("═".repeat(70));
    console.log("✅ SETUP COMPLETE - READY FOR TRADING!");
    console.log("═".repeat(70) + "\n");

    console.log("📊 FINAL PROPERTY STATUS:");
    console.log("   Property ID:", propertyId);
    console.log("   Fractions Contract:", updatedProperty.fractionsContract);
    console.log("   Is Distributing:", updatedProperty.isDistributing ? "✅ YES" : "❌ NO");
    console.log("   Price Per Fraction:", ethers.formatEther(updatedProperty.pricePerFraction), "ETH");
    console.log("   Owner Balance:", ethers.formatEther(await fractions.balanceOf(owner.address)), "fractions");
    
    const allowance = await fractions.allowance(owner.address, TOKENIZATION_MANAGER_ADDRESS);
    console.log("   Allowance:", ethers.formatEther(allowance), "fractions");

    console.log("\n═".repeat(70));
    console.log("📝 HOW TO BUY FRACTIONS");
    console.log("═".repeat(70) + "\n");

    console.log("1. Go to TokenizationManager on Etherscan:");
    console.log("   https://sepolia.etherscan.io/address/" + TOKENIZATION_MANAGER_ADDRESS + "#writeContract\n");

    console.log("2. Connect your BUYER wallet (NOT the owner wallet)\n");

    console.log("3. Call buyFractions() with these inputs:");
    console.log("   ┌─────────────────────────────────────────┐");
    console.log("   │ propertyId: 1                           │");
    console.log("   │ numberOfFractions: 10                   │");
    console.log("   │ payableAmount: 0.01 ETH                 │");
    console.log("   └─────────────────────────────────────────┘");

    console.log("\n💡 REMEMBER:");
    console.log("   - Enter simple numbers (10, not 10000000000000000000)");
    console.log("   - Price: 0.001 ETH per fraction");
    console.log("   - 10 fractions = 10 × 0.001 = 0.01 ETH");
    console.log("   - Owner CANNOT buy own fractions");
    console.log("   - Use a different wallet for buying\n");

    console.log("═".repeat(70));
    console.log("📌 ETHERSCAN TABS");
    console.log("═".repeat(70) + "\n");

    console.log("Visit TokenizationManager on Etherscan and check these tabs:\n");
    console.log("✅ Transactions - All function calls");
    console.log("✅ Internal Transactions - ETH transfers");
    console.log("✅ Token Transfers (ERC-20) - Fraction purchases");
    console.log("✅ NFT Transfers - PropertyDeed NFT locked in contract ← NEW!");
    console.log("✅ Contract - Source code");
    console.log("✅ Events - All emitted events\n");

    console.log("🔗 Quick Link:");
    console.log("   https://sepolia.etherscan.io/address/" + TOKENIZATION_MANAGER_ADDRESS + "\n");

    console.log("═".repeat(70));
    console.log("✅ SCRIPT COMPLETE");
    console.log("═".repeat(70) + "\n");

    console.log("Property is now live and ready for fraction trading! 🎉\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error:", error.message);
        console.error(error);
        process.exit(1);
    });
