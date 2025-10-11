const { ethers } = require("hardhat");

/**
 * Deployment script for the PropToken Real Estate Tokenization System
 * 
 * This script deploys the TokenizationManager contract, which automatically
 * deploys the PropertyDeed contract during its constructor.
 * 
 * Usage:
 * - Local: npx hardhat run scripts/deploy.js --network localhost
 * - Testnet: npx hardhat run scripts/deploy.js --network sepolia
 * - Mainnet: npx hardhat run scripts/deploy.js --network mainnet
 */

async function main() {
    console.log("Starting deployment of PropToken Real Estate Tokenization System...\n");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    
    // Check deployer balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH\n");
    
    // Deploy TokenizationManager (this also deploys PropertyDeed internally)
    console.log("Deploying TokenizationManager...");
    const TokenizationManager = await ethers.getContractFactory("TokenizationManager");
    const tokenizationManager = await TokenizationManager.deploy();
    
    await tokenizationManager.waitForDeployment();
    const managerAddress = await tokenizationManager.getAddress();
    console.log("✅ TokenizationManager deployed to:", managerAddress);
    
    // Get the PropertyDeed contract address
    const propertyDeedAddress = await tokenizationManager.propertyDeedContract();
    console.log("✅ PropertyDeed deployed to:", propertyDeedAddress);
    
    // Summary
    console.log("\n" + "=".repeat(70));
    console.log("DEPLOYMENT SUMMARY");
    console.log("=".repeat(70));
    console.log("Network:", (await ethers.provider.getNetwork()).name);
    console.log("Deployer:", deployer.address);
    console.log("\nDeployed Contracts:");
    console.log("  TokenizationManager:", managerAddress);
    console.log("  PropertyDeed:", propertyDeedAddress);
    console.log("=".repeat(70) + "\n");
    
    // Save deployment info to file
    const fs = require('fs');
    const deploymentInfo = {
        network: (await ethers.provider.getNetwork()).name,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            TokenizationManager: managerAddress,
            PropertyDeed: propertyDeedAddress
        }
    };
    
    fs.writeFileSync(
        'deployment-info.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("📄 Deployment info saved to deployment-info.json\n");
    
    // Verification instructions
    if ((await ethers.provider.getNetwork()).name !== "hardhat" && 
        (await ethers.provider.getNetwork()).name !== "localhost") {
        console.log("To verify contracts on Etherscan, run:");
        console.log(`npx hardhat verify --network ${(await ethers.provider.getNetwork()).name} ${managerAddress}`);
        console.log(`npx hardhat verify --network ${(await ethers.provider.getNetwork()).name} ${propertyDeedAddress}\n`);
    }
    
    console.log("✨ Deployment completed successfully!\n");
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
