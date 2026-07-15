const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * Test suite for the RentalIncomeDistribution contract
 *
 * This suite tests:
 * - Deployment and linkage to TokenizationManager
 * - Depositing rental income
 * - Claiming rental income (single period, all periods)
 * - Access control and edge cases
 */
describe("RentalIncomeDistribution Contract", function () {
    async function deployFixture() {
        const [owner, propertyOwner, buyer1, buyer2, stranger] = await ethers.getSigners();

        const TokenizationManager = await ethers.getContractFactory("TokenizationManager");
        const tokenizationManager = await TokenizationManager.deploy();

        const RentalIncomeDistribution = await ethers.getContractFactory("RentalIncomeDistribution");
        const rentalIncomeDistribution = await RentalIncomeDistribution.deploy(
            await tokenizationManager.getAddress()
        );

        // Tokenize a property and sell some fractions so buyers hold a stake
        await tokenizationManager.connect(propertyOwner).tokenizeProperty("123 Main St", "ipfs://meta");
        const property = await tokenizationManager.getTokenizedProperty(1);

        const PropertyFractions = await ethers.getContractFactory("PropertyFractions");
        const fractions = PropertyFractions.attach(property.fractionsContract);

        const totalSupply = await fractions.totalSupply();
        await fractions.connect(propertyOwner).approve(await tokenizationManager.getAddress(), totalSupply);

        const pricePerFraction = ethers.parseEther("0.001");
        await tokenizationManager.connect(propertyOwner).startDistribution(1, pricePerFraction);

        // buyer1 buys 400,000 fractions (40%), buyer2 buys 100,000 (10%), owner keeps 50%
        await tokenizationManager.connect(buyer1).buyFractions(1, 400000, {
            value: pricePerFraction * 400000n,
        });
        await tokenizationManager.connect(buyer2).buyFractions(1, 100000, {
            value: pricePerFraction * 100000n,
        });

        return { tokenizationManager, rentalIncomeDistribution, fractions, owner, propertyOwner, buyer1, buyer2, stranger };
    }

    describe("Deployment", function () {
        it("Should link to the correct TokenizationManager", async function () {
            const { rentalIncomeDistribution, tokenizationManager } = await loadFixture(deployFixture);
            expect(await rentalIncomeDistribution.tokenizationManager()).to.equal(
                await tokenizationManager.getAddress()
            );
        });

        it("Should reject zero address manager", async function () {
            const RentalIncomeDistribution = await ethers.getContractFactory("RentalIncomeDistribution");
            await expect(
                RentalIncomeDistribution.deploy(ethers.ZeroAddress)
            ).to.be.revertedWith("RentalIncomeDistribution: Invalid manager address");
        });
    });

    describe("Depositing rental income", function () {
        it("Should allow the property owner to deposit rental income", async function () {
            const { rentalIncomeDistribution, propertyOwner } = await loadFixture(deployFixture);

            const depositAmount = ethers.parseEther("1");
            await expect(
                rentalIncomeDistribution.connect(propertyOwner).depositRentalIncome(1, { value: depositAmount })
            ).to.emit(rentalIncomeDistribution, "RentalIncomeDeposited");

            expect(await rentalIncomeDistribution.getRentalPeriodCount(1)).to.equal(1);
        });

        it("Should reject deposits from non-owners", async function () {
            const { rentalIncomeDistribution, stranger } = await loadFixture(deployFixture);

            await expect(
                rentalIncomeDistribution.connect(stranger).depositRentalIncome(1, { value: ethers.parseEther("1") })
            ).to.be.revertedWith("RentalIncomeDistribution: Only property owner");
        });

        it("Should reject zero-value deposits", async function () {
            const { rentalIncomeDistribution, propertyOwner } = await loadFixture(deployFixture);

            await expect(
                rentalIncomeDistribution.connect(propertyOwner).depositRentalIncome(1, { value: 0 })
            ).to.be.revertedWith("RentalIncomeDistribution: No ETH sent");
        });

        it("Should compute payoutPerFraction correctly", async function () {
            const { rentalIncomeDistribution, propertyOwner } = await loadFixture(deployFixture);

            const depositAmount = ethers.parseEther("1");
            await rentalIncomeDistribution.connect(propertyOwner).depositRentalIncome(1, { value: depositAmount });

            const period = await rentalIncomeDistribution.getRentalPeriod(1, 0);
            const totalSupply = ethers.parseEther("1000000");
            const expectedPayoutPerFraction = (depositAmount * ethers.parseEther("1")) / totalSupply;

            expect(period.payoutPerFraction).to.equal(expectedPayoutPerFraction);
            expect(period.totalDeposited).to.equal(depositAmount);
        });
    });

    describe("Claiming rental income", function () {
        it("Should let a fraction holder claim their pro-rata share", async function () {
            const { rentalIncomeDistribution, propertyOwner, buyer1 } = await loadFixture(deployFixture);

            const depositAmount = ethers.parseEther("1");
            await rentalIncomeDistribution.connect(propertyOwner).depositRentalIncome(1, { value: depositAmount });

            const balanceBefore = await ethers.provider.getBalance(buyer1.address);

            const tx = await rentalIncomeDistribution.connect(buyer1).claimRentalIncome(1, 0);
            const receipt = await tx.wait();
            const gasCost = receipt.gasUsed * receipt.gasPrice;

            const balanceAfter = await ethers.provider.getBalance(buyer1.address);

            // buyer1 holds 40% of supply => should receive 40% of deposit
            const expectedShare = (depositAmount * 400000n) / 1000000n;

            expect(balanceAfter - balanceBefore + gasCost).to.equal(expectedShare);
        });

        it("Should revert on double-claim", async function () {
            const { rentalIncomeDistribution, propertyOwner, buyer1 } = await loadFixture(deployFixture);

            await rentalIncomeDistribution.connect(propertyOwner).depositRentalIncome(1, { value: ethers.parseEther("1") });
            await rentalIncomeDistribution.connect(buyer1).claimRentalIncome(1, 0);

            await expect(
                rentalIncomeDistribution.connect(buyer1).claimRentalIncome(1, 0)
            ).to.be.revertedWith("RentalIncomeDistribution: Nothing to claim");
        });

        it("Should return zero claimable for a holder with no fractions", async function () {
            const { rentalIncomeDistribution, propertyOwner, stranger } = await loadFixture(deployFixture);

            await rentalIncomeDistribution.connect(propertyOwner).depositRentalIncome(1, { value: ethers.parseEther("1") });

            await expect(
                rentalIncomeDistribution.connect(stranger).claimRentalIncome(1, 0)
            ).to.be.revertedWith("RentalIncomeDistribution: Nothing to claim");
        });

        it("Should let a holder claim across multiple periods at once", async function () {
            const { rentalIncomeDistribution, propertyOwner, buyer2 } = await loadFixture(deployFixture);

            await rentalIncomeDistribution.connect(propertyOwner).depositRentalIncome(1, { value: ethers.parseEther("1") });
            await rentalIncomeDistribution.connect(propertyOwner).depositRentalIncome(1, { value: ethers.parseEther("2") });

            const balanceBefore = await ethers.provider.getBalance(buyer2.address);
            const tx = await rentalIncomeDistribution.connect(buyer2).claimAllRentalIncome(1);
            const receipt = await tx.wait();
            const gasCost = receipt.gasUsed * receipt.gasPrice;
            const balanceAfter = await ethers.provider.getBalance(buyer2.address);

            // buyer2 holds 10% of supply across 3 ETH total deposited => 0.3 ETH
            const expectedShare = (ethers.parseEther("3") * 100000n) / 1000000n;

            expect(balanceAfter - balanceBefore + gasCost).to.equal(expectedShare);
        });

        it("Should report correct getClaimableAmount before claiming", async function () {
            const { rentalIncomeDistribution, propertyOwner, buyer1 } = await loadFixture(deployFixture);

            await rentalIncomeDistribution.connect(propertyOwner).depositRentalIncome(1, { value: ethers.parseEther("1") });

            const claimable = await rentalIncomeDistribution.getClaimableAmount(1, buyer1.address);
            const expectedShare = (ethers.parseEther("1") * 400000n) / 1000000n;

            expect(claimable).to.equal(expectedShare);
        });
    });
});
