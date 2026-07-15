const { ethers, network } = require("hardhat");
const fs = require("fs");

/**
 * Deployment script for the Tier 1 feature contracts:
 * - RentalIncomeDistribution
 * - FractionMarketplace
 * - PropertyPriceOracle
 *
 * These are additive contracts that read/reference an already-deployed
 * TokenizationManager - they do not replace or redeploy it.
 *
 * Usage:
 * - Local: npx hardhat run scripts/deploy-tier1-features.js --network localhost
 * - Testnet: npx hardhat run scripts/deploy-tier1-features.js --network sepolia
 *
 * Requires TOKENIZATION_MANAGER_ADDRESS to be set (env var, or read from
 * deployment-info.json if present).
 */

// Well-known public Chainlink ETH/USD feed addresses.
// Source: https://docs.chain.link/data-feeds/price-feeds/addresses
const ETH_USD_PRICE_FEEDS = {
    sepolia: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    mainnet: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
};

function getTokenizationManagerAddress() {
    if (process.env.TOKENIZATION_MANAGER_ADDRESS) {
        return process.env.TOKENIZATION_MANAGER_ADDRESS;
    }

    if (fs.existsSync("deployment-info.json")) {
        const info = JSON.parse(fs.readFileSync("deployment-info.json", "utf8"));
        if (info.contracts && info.contracts.TokenizationManager) {
            return info.contracts.TokenizationManager;
        }
    }

    throw new Error(
        "TokenizationManager address not found. Set TOKENIZATION_MANAGER_ADDRESS env var " +
        "or ensure deployment-info.json exists with a TokenizationManager address."
    );
}

async function main() {
    console.log("Starting deployment of PropToken Tier 1 feature contracts...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

    const tokenizationManagerAddress = getTokenizationManagerAddress();
    console.log("Using TokenizationManager at:", tokenizationManagerAddress, "\n");

    // 1. RentalIncomeDistribution
    console.log("Deploying RentalIncomeDistribution...");
    const RentalIncomeDistribution = await ethers.getContractFactory("RentalIncomeDistribution");
    const rentalIncomeDistribution = await RentalIncomeDistribution.deploy(tokenizationManagerAddress);
    await rentalIncomeDistribution.waitForDeployment();
    const rentalAddress = await rentalIncomeDistribution.getAddress();
    console.log("RentalIncomeDistribution deployed to:", rentalAddress);

    // 2. FractionMarketplace
    console.log("\nDeploying FractionMarketplace...");
    const FractionMarketplace = await ethers.getContractFactory("FractionMarketplace");
    const fractionMarketplace = await FractionMarketplace.deploy(tokenizationManagerAddress);
    await fractionMarketplace.waitForDeployment();
    const marketplaceAddress = await fractionMarketplace.getAddress();
    console.log("FractionMarketplace deployed to:", marketplaceAddress);

    // 3. PropertyPriceOracle (only on networks with a known Chainlink feed)
    let oracleAddress = null;
    const priceFeedAddress = ETH_USD_PRICE_FEEDS[network.name];

    if (priceFeedAddress) {
        console.log("\nDeploying PropertyPriceOracle...");
        console.log("Using Chainlink ETH/USD feed:", priceFeedAddress);
        const PropertyPriceOracle = await ethers.getContractFactory("PropertyPriceOracle");
        const oracle = await PropertyPriceOracle.deploy(priceFeedAddress);
        await oracle.waitForDeployment();
        oracleAddress = await oracle.getAddress();
        console.log("PropertyPriceOracle deployed to:", oracleAddress);
    } else {
        console.log(
            `\nSkipping PropertyPriceOracle deployment - no known Chainlink ETH/USD feed for network "${network.name}".`
        );
    }

    console.log("\n" + "=".repeat(70));
    console.log("TIER 1 FEATURE DEPLOYMENT SUMMARY");
    console.log("=".repeat(70));
    console.log("Network:", network.name);
    console.log("Deployer:", deployer.address);
    console.log("\nDeployed Contracts:");
    console.log("  TokenizationManager (existing):", tokenizationManagerAddress);
    console.log("  RentalIncomeDistribution:", rentalAddress);
    console.log("  FractionMarketplace:", marketplaceAddress);
    if (oracleAddress) {
        console.log("  PropertyPriceOracle:", oracleAddress);
    }
    console.log("=".repeat(70) + "\n");

    const outputPath = "deployment-info-tier1.json";
    const deploymentInfo = {
        network: network.name,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            TokenizationManager: tokenizationManagerAddress,
            RentalIncomeDistribution: rentalAddress,
            FractionMarketplace: marketplaceAddress,
            ...(oracleAddress ? { PropertyPriceOracle: oracleAddress } : {}),
        },
    };

    fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`Deployment info saved to ${outputPath}\n`);

    if (network.name !== "hardhat" && network.name !== "localhost") {
        console.log("To verify contracts on Etherscan, run:");
        console.log(`npx hardhat verify --network ${network.name} ${rentalAddress} ${tokenizationManagerAddress}`);
        console.log(`npx hardhat verify --network ${network.name} ${marketplaceAddress} ${tokenizationManagerAddress}`);
        if (oracleAddress) {
            console.log(`npx hardhat verify --network ${network.name} ${oracleAddress} ${priceFeedAddress}`);
        }
        console.log();
    }

    console.log("Tier 1 feature deployment completed successfully!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
