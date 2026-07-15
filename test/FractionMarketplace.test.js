const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * Test suite for the FractionMarketplace contract
 *
 * This suite tests:
 * - Deployment
 * - Creating listings
 * - Cancelling listings
 * - Buying listings (full and partial fills)
 * - Fee accounting and withdrawal
 * - Access control and edge cases
 */
describe("FractionMarketplace Contract", function () {
    async function deployFixture() {
        const [owner, propertyOwner, seller, buyer, stranger] = await ethers.getSigners();

        const TokenizationManager = await ethers.getContractFactory("TokenizationManager");
        const tokenizationManager = await TokenizationManager.deploy();

        const FractionMarketplace = await ethers.getContractFactory("FractionMarketplace");
        const marketplace = await FractionMarketplace.deploy(await tokenizationManager.getAddress());

        await tokenizationManager.connect(propertyOwner).tokenizeProperty("123 Main St", "ipfs://meta");
        const property = await tokenizationManager.getTokenizedProperty(1);

        const PropertyFractions = await ethers.getContractFactory("PropertyFractions");
        const fractions = PropertyFractions.attach(property.fractionsContract);

        const totalSupply = await fractions.totalSupply();
        await fractions.connect(propertyOwner).approve(await tokenizationManager.getAddress(), totalSupply);

        const pricePerFraction = ethers.parseEther("0.001");
        await tokenizationManager.connect(propertyOwner).startDistribution(1, pricePerFraction);

        // seller buys 100,000 fractions on the primary market, then resells on the secondary market
        await tokenizationManager.connect(seller).buyFractions(1, 100000, {
            value: pricePerFraction * 100000n,
        });

        return { tokenizationManager, marketplace, fractions, owner, propertyOwner, seller, buyer, stranger };
    }

    const FRACTION_UNIT = ethers.parseEther("1"); // 1 whole fraction, 18 decimals

    describe("Deployment", function () {
        it("Should link to the correct TokenizationManager", async function () {
            const { marketplace, tokenizationManager } = await loadFixture(deployFixture);
            expect(await marketplace.tokenizationManager()).to.equal(await tokenizationManager.getAddress());
        });

        it("Should default to 2.5% fee", async function () {
            const { marketplace } = await loadFixture(deployFixture);
            expect(await marketplace.feeBps()).to.equal(250);
        });
    });

    describe("Creating listings", function () {
        it("Should create a listing after approval", async function () {
            const { marketplace, fractions, seller } = await loadFixture(deployFixture);

            const amount = 1000n * FRACTION_UNIT;
            await fractions.connect(seller).approve(await marketplace.getAddress(), amount);

            await expect(
                marketplace.connect(seller).createListing(1, amount, ethers.parseEther("0.002"))
            ).to.emit(marketplace, "Listed").withArgs(1, 1, seller.address, amount, ethers.parseEther("0.002"));

            const listing = await marketplace.listings(1);
            expect(listing.seller).to.equal(seller.address);
            expect(listing.active).to.be.true;
        });

        it("Should reject listing without sufficient allowance", async function () {
            const { marketplace, seller } = await loadFixture(deployFixture);

            await expect(
                marketplace.connect(seller).createListing(1, 1000n * FRACTION_UNIT, ethers.parseEther("0.002"))
            ).to.be.revertedWith("FractionMarketplace: Insufficient allowance");
        });

        it("Should reject listing more than balance", async function () {
            const { marketplace, fractions, seller } = await loadFixture(deployFixture);

            const hugeAmount = 999999999n * FRACTION_UNIT;
            await fractions.connect(seller).approve(await marketplace.getAddress(), hugeAmount);

            await expect(
                marketplace.connect(seller).createListing(1, hugeAmount, ethers.parseEther("0.002"))
            ).to.be.revertedWith("FractionMarketplace: Insufficient balance");
        });

        it("Should reject zero amount or zero price", async function () {
            const { marketplace, fractions, seller } = await loadFixture(deployFixture);
            await fractions.connect(seller).approve(await marketplace.getAddress(), 1000n * FRACTION_UNIT);

            await expect(
                marketplace.connect(seller).createListing(1, 0, ethers.parseEther("0.002"))
            ).to.be.revertedWith("FractionMarketplace: Amount must be greater than zero");

            await expect(
                marketplace.connect(seller).createListing(1, 1000n * FRACTION_UNIT, 0)
            ).to.be.revertedWith("FractionMarketplace: Price must be greater than zero");
        });
    });

    describe("Cancelling listings", function () {
        async function listedFixture() {
            const fixture = await deployFixture();
            const amount = 1000n * FRACTION_UNIT;
            await fixture.fractions.connect(fixture.seller).approve(await fixture.marketplace.getAddress(), amount);
            await fixture.marketplace.connect(fixture.seller).createListing(1, amount, ethers.parseEther("0.002"));
            return fixture;
        }

        it("Should let the seller cancel their listing", async function () {
            const { marketplace, seller } = await loadFixture(listedFixture);

            await expect(marketplace.connect(seller).cancelListing(1))
                .to.emit(marketplace, "ListingCancelled")
                .withArgs(1);

            const listing = await marketplace.listings(1);
            expect(listing.active).to.be.false;
        });

        it("Should reject cancellation from non-seller", async function () {
            const { marketplace, stranger } = await loadFixture(listedFixture);

            await expect(
                marketplace.connect(stranger).cancelListing(1)
            ).to.be.revertedWith("FractionMarketplace: Only seller");
        });
    });

    describe("Buying listings", function () {
        async function listedFixture() {
            const fixture = await deployFixture();
            const amount = 1000n * FRACTION_UNIT;
            const pricePerFraction = ethers.parseEther("0.002");
            await fixture.fractions.connect(fixture.seller).approve(await fixture.marketplace.getAddress(), amount);
            await fixture.marketplace.connect(fixture.seller).createListing(1, amount, pricePerFraction);
            return { ...fixture, listedAmount: amount, pricePerFraction };
        }

        it("Should let a buyer fully purchase a listing", async function () {
            const { marketplace, fractions, seller, buyer, listedAmount, pricePerFraction } = await loadFixture(listedFixture);

            const totalCost = (pricePerFraction * listedAmount) / FRACTION_UNIT;

            await expect(
                marketplace.connect(buyer).buyListing(1, listedAmount, { value: totalCost })
            ).to.emit(marketplace, "ListingPurchased");

            expect(await fractions.balanceOf(buyer.address)).to.equal(listedAmount);

            const listing = await marketplace.listings(1);
            expect(listing.active).to.be.false;
            expect(listing.amount).to.equal(0);
        });

        it("Should support partial fills and keep listing active", async function () {
            const { marketplace, fractions, buyer, pricePerFraction } = await loadFixture(listedFixture);

            const partialAmount = 400n * FRACTION_UNIT;
            const totalCost = (pricePerFraction * partialAmount) / FRACTION_UNIT;

            await marketplace.connect(buyer).buyListing(1, partialAmount, { value: totalCost });

            expect(await fractions.balanceOf(buyer.address)).to.equal(partialAmount);

            const listing = await marketplace.listings(1);
            expect(listing.active).to.be.true;
            expect(listing.amount).to.equal(600n * FRACTION_UNIT);
        });

        it("Should take the marketplace fee and pay the seller the remainder", async function () {
            const { marketplace, seller, buyer, listedAmount, pricePerFraction } = await loadFixture(listedFixture);

            const totalCost = (pricePerFraction * listedAmount) / FRACTION_UNIT;
            const expectedFee = (totalCost * 250n) / 10000n;
            const expectedSellerProceeds = totalCost - expectedFee;

            await expect(
                marketplace.connect(buyer).buyListing(1, listedAmount, { value: totalCost })
            ).to.changeEtherBalance(seller, expectedSellerProceeds);

            expect(await marketplace.accruedFees()).to.equal(expectedFee);
        });

        it("Should refund excess ETH sent", async function () {
            const { marketplace, buyer, listedAmount, pricePerFraction } = await loadFixture(listedFixture);

            const totalCost = (pricePerFraction * listedAmount) / FRACTION_UNIT;
            const overpay = totalCost + ethers.parseEther("1");

            await expect(
                marketplace.connect(buyer).buyListing(1, listedAmount, { value: overpay })
            ).to.changeEtherBalance(buyer, -totalCost, { includeFee: false });
        });

        it("Should reject insufficient payment", async function () {
            const { marketplace, buyer, listedAmount, pricePerFraction } = await loadFixture(listedFixture);

            const totalCost = (pricePerFraction * listedAmount) / FRACTION_UNIT;

            await expect(
                marketplace.connect(buyer).buyListing(1, listedAmount, { value: totalCost - 1n })
            ).to.be.revertedWith("FractionMarketplace: Insufficient ETH sent");
        });

        it("Should reject the seller buying their own listing", async function () {
            const { marketplace, seller, listedAmount, pricePerFraction } = await loadFixture(listedFixture);

            const totalCost = (pricePerFraction * listedAmount) / FRACTION_UNIT;

            await expect(
                marketplace.connect(seller).buyListing(1, listedAmount, { value: totalCost })
            ).to.be.revertedWith("FractionMarketplace: Cannot buy own listing");
        });

        it("Should reject buying from a cancelled listing", async function () {
            const { marketplace, seller, buyer, listedAmount, pricePerFraction } = await loadFixture(listedFixture);

            await marketplace.connect(seller).cancelListing(1);
            const totalCost = (pricePerFraction * listedAmount) / FRACTION_UNIT;

            await expect(
                marketplace.connect(buyer).buyListing(1, listedAmount, { value: totalCost })
            ).to.be.revertedWith("FractionMarketplace: Listing not active");
        });
    });

    describe("Fee management", function () {
        it("Should let the owner update the fee within cap", async function () {
            const { marketplace, owner } = await loadFixture(deployFixture);

            await expect(marketplace.connect(owner).setFeeBps(500))
                .to.emit(marketplace, "FeeUpdated")
                .withArgs(500);

            expect(await marketplace.feeBps()).to.equal(500);
        });

        it("Should reject fee above the hard cap", async function () {
            const { marketplace, owner } = await loadFixture(deployFixture);

            await expect(
                marketplace.connect(owner).setFeeBps(1001)
            ).to.be.revertedWith("FractionMarketplace: Fee too high");
        });

        it("Should reject non-owner fee updates", async function () {
            const { marketplace, stranger } = await loadFixture(deployFixture);

            await expect(
                marketplace.connect(stranger).setFeeBps(500)
            ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
        });

        it("Should let the owner withdraw accrued fees", async function () {
            const { marketplace, fractions, owner, seller, buyer } = await loadFixture(deployFixture);

            const amount = 1000n * FRACTION_UNIT;
            const pricePerFraction = ethers.parseEther("0.002");
            await fractions.connect(seller).approve(await marketplace.getAddress(), amount);
            await marketplace.connect(seller).createListing(1, amount, pricePerFraction);

            const totalCost = (pricePerFraction * amount) / FRACTION_UNIT;
            await marketplace.connect(buyer).buyListing(1, amount, { value: totalCost });

            const accrued = await marketplace.accruedFees();
            expect(accrued).to.be.gt(0);

            await expect(marketplace.connect(owner).withdrawFees()).to.changeEtherBalance(owner, accrued);
            expect(await marketplace.accruedFees()).to.equal(0);
        });

        it("Should reject withdrawal when there are no fees", async function () {
            const { marketplace, owner } = await loadFixture(deployFixture);

            await expect(
                marketplace.connect(owner).withdrawFees()
            ).to.be.revertedWith("FractionMarketplace: No fees to withdraw");
        });
    });
});
