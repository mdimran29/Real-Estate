const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * Test suite for the PropertyPriceOracle contract
 *
 * Uses a minimal mock AggregatorV3Interface (deployed inline via a Hardhat
 * test-only contract factory) so the suite doesn't depend on a live
 * Chainlink feed.
 */
describe("PropertyPriceOracle Contract", function () {
    async function deployFixture() {
        const [owner] = await ethers.getSigners();

        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
        // 8 decimals, $3000.00000000 per ETH
        const mockFeed = await MockV3Aggregator.deploy(8, 300000000000n);

        const PropertyPriceOracle = await ethers.getContractFactory("PropertyPriceOracle");
        const oracle = await PropertyPriceOracle.deploy(await mockFeed.getAddress());

        return { oracle, mockFeed, owner };
    }

    describe("Deployment", function () {
        it("Should reject zero address feed", async function () {
            const PropertyPriceOracle = await ethers.getContractFactory("PropertyPriceOracle");
            await expect(
                PropertyPriceOracle.deploy(ethers.ZeroAddress)
            ).to.be.revertedWith("PropertyPriceOracle: Invalid feed address");
        });

        it("Should link to the correct feed", async function () {
            const { oracle, mockFeed } = await loadFixture(deployFixture);
            expect(await oracle.priceFeed()).to.equal(await mockFeed.getAddress());
        });
    });

    describe("getLatestPrice", function () {
        it("Should return the mocked price and decimals", async function () {
            const { oracle } = await loadFixture(deployFixture);
            const [price, decimals] = await oracle.getLatestPrice();

            expect(price).to.equal(300000000000n);
            expect(decimals).to.equal(8);
        });

        it("Should revert if the feed reports a non-positive price", async function () {
            const { oracle, mockFeed } = await loadFixture(deployFixture);
            await mockFeed.updateAnswer(0);

            await expect(oracle.getLatestPrice()).to.be.revertedWith(
                "PropertyPriceOracle: Invalid price from feed"
            );
        });
    });

    describe("weiToUsd", function () {
        it("Should convert 1 ETH to $3000 (18-decimal USD)", async function () {
            const { oracle } = await loadFixture(deployFixture);

            const oneEth = ethers.parseEther("1");
            const usd = await oracle.weiToUsd(oneEth);

            expect(usd).to.equal(ethers.parseEther("3000"));
        });

        it("Should convert 0.5 ETH to $1500", async function () {
            const { oracle } = await loadFixture(deployFixture);

            const halfEth = ethers.parseEther("0.5");
            const usd = await oracle.weiToUsd(halfEth);

            expect(usd).to.equal(ethers.parseEther("1500"));
        });
    });

    describe("fractionPriceInUsd", function () {
        it("Should convert a fraction price in wei to USD", async function () {
            const { oracle } = await loadFixture(deployFixture);

            const pricePerFraction = ethers.parseEther("0.001"); // 0.001 ETH
            const usd = await oracle.fractionPriceInUsd(pricePerFraction);

            expect(usd).to.equal(ethers.parseEther("3")); // 0.001 * 3000 = 3
        });
    });
});
