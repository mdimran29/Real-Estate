const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * Comprehensive test suite for the PropertyFractions ERC-20 contract
 * 
 * This suite tests:
 * - Contract deployment and initialization
 * - Initial supply minting
 * - ERC-20 functionality (transfer, approve, etc.)
 * - Access control
 * - Property linkage
 * - Edge cases and error conditions
 */
describe("PropertyFractions Contract", function () {
    
    /**
     * Fixture to deploy the PropertyFractions contract
     */
    async function deployPropertyFractionsFixture() {
        const [owner, manager, addr1, addr2] = await ethers.getSigners();
        
        const propertyId = 1;
        const PropertyFractions = await ethers.getContractFactory("PropertyFractions");
        const propertyFractions = await PropertyFractions.deploy(propertyId, manager.address);
        
        return { propertyFractions, owner, manager, addr1, addr2, propertyId };
    }
    
    describe("Deployment", function () {
        it("Should set the correct name and symbol based on property ID", async function () {
            const { propertyFractions, propertyId } = await loadFixture(deployPropertyFractionsFixture);
            
            expect(await propertyFractions.name()).to.equal(`Property Fraction ${propertyId}`);
            expect(await propertyFractions.symbol()).to.equal(`PROP${propertyId}`);
        });
        
        it("Should set the property ID correctly", async function () {
            const { propertyFractions, propertyId } = await loadFixture(deployPropertyFractionsFixture);
            
            expect(await propertyFractions.propertyId()).to.equal(propertyId);
        });
        
        it("Should set the tokenization manager correctly", async function () {
            const { propertyFractions, manager } = await loadFixture(deployPropertyFractionsFixture);
            
            expect(await propertyFractions.tokenizationManager()).to.equal(manager.address);
        });
        
        it("Should set manager as owner", async function () {
            const { propertyFractions, manager } = await loadFixture(deployPropertyFractionsFixture);
            
            expect(await propertyFractions.owner()).to.equal(manager.address);
        });
        
        it("Should have initial mint not completed", async function () {
            const { propertyFractions } = await loadFixture(deployPropertyFractionsFixture);
            
            expect(await propertyFractions.isInitialMintComplete()).to.be.false;
        });
        
        it("Should start with zero total supply", async function () {
            const { propertyFractions } = await loadFixture(deployPropertyFractionsFixture);
            
            expect(await propertyFractions.totalSupply()).to.equal(0);
        });
        
        it("Should reject zero address for tokenization manager", async function () {
            const PropertyFractions = await ethers.getContractFactory("PropertyFractions");
            
            // OpenZeppelin Ownable prevents zero address initialization
            await expect(
                PropertyFractions.deploy(1, ethers.ZeroAddress)
            ).to.be.reverted;
        });
    });
    
    describe("Initial Minting", function () {
        it("Should mint initial supply successfully", async function () {
            const { propertyFractions, manager, addr1 } = await loadFixture(deployPropertyFractionsFixture);
            
            await propertyFractions.connect(manager).mintInitialSupply(addr1.address);
            
            const expectedSupply = ethers.parseEther("1000000"); // 1 million tokens
            expect(await propertyFractions.balanceOf(addr1.address)).to.equal(expectedSupply);
            expect(await propertyFractions.totalSupply()).to.equal(expectedSupply);
        });
        
        it("Should emit FractionsMinted event", async function () {
            const { propertyFractions, manager, addr1, propertyId } = await loadFixture(deployPropertyFractionsFixture);
            
            const expectedSupply = ethers.parseEther("1000000");
            
            await expect(propertyFractions.connect(manager).mintInitialSupply(addr1.address))
                .to.emit(propertyFractions, "FractionsMinted")
                .withArgs(propertyId, addr1.address, expectedSupply);
        });
        
        it("Should set initial mint as completed", async function () {
            const { propertyFractions, manager, addr1 } = await loadFixture(deployPropertyFractionsFixture);
            
            await propertyFractions.connect(manager).mintInitialSupply(addr1.address);
            
            expect(await propertyFractions.isInitialMintComplete()).to.be.true;
        });
        
        it("Should only allow owner to mint initial supply", async function () {
            const { propertyFractions, addr1 } = await loadFixture(deployPropertyFractionsFixture);
            
            await expect(
                propertyFractions.connect(addr1).mintInitialSupply(addr1.address)
            ).to.be.revertedWithCustomError(propertyFractions, "OwnableUnauthorizedAccount");
        });
        
        it("Should only allow minting once", async function () {
            const { propertyFractions, manager, addr1, addr2 } = await loadFixture(deployPropertyFractionsFixture);
            
            await propertyFractions.connect(manager).mintInitialSupply(addr1.address);
            
            await expect(
                propertyFractions.connect(manager).mintInitialSupply(addr2.address)
            ).to.be.revertedWith("PropertyFractions: Initial mint already completed");
        });
        
        it("Should reject minting to zero address", async function () {
            const { propertyFractions, manager } = await loadFixture(deployPropertyFractionsFixture);
            
            await expect(
                propertyFractions.connect(manager).mintInitialSupply(ethers.ZeroAddress)
            ).to.be.revertedWith("PropertyFractions: Cannot mint to zero address");
        });
    });
    
    describe("ERC-20 Functionality", function () {
        async function mintedFractionsFixture() {
            const fixture = await deployPropertyFractionsFixture();
            await fixture.propertyFractions.connect(fixture.manager).mintInitialSupply(fixture.addr1.address);
            return fixture;
        }
        
        it("Should allow token transfers", async function () {
            const { propertyFractions, addr1, addr2 } = await loadFixture(mintedFractionsFixture);
            
            const transferAmount = ethers.parseEther("1000");
            await propertyFractions.connect(addr1).transfer(addr2.address, transferAmount);
            
            expect(await propertyFractions.balanceOf(addr2.address)).to.equal(transferAmount);
        });
        
        it("Should allow approvals and transferFrom", async function () {
            const { propertyFractions, addr1, addr2 } = await loadFixture(mintedFractionsFixture);
            
            const approvalAmount = ethers.parseEther("5000");
            await propertyFractions.connect(addr1).approve(addr2.address, approvalAmount);
            
            expect(await propertyFractions.allowance(addr1.address, addr2.address)).to.equal(approvalAmount);
            
            const transferAmount = ethers.parseEther("2000");
            await propertyFractions.connect(addr2).transferFrom(addr1.address, addr2.address, transferAmount);
            
            expect(await propertyFractions.balanceOf(addr2.address)).to.equal(transferAmount);
        });
        
        it("Should reject transfers with insufficient balance", async function () {
            const { propertyFractions, addr1, addr2 } = await loadFixture(mintedFractionsFixture);
            
            const excessiveAmount = ethers.parseEther("2000000"); // More than total supply
            
            await expect(
                propertyFractions.connect(addr1).transfer(addr2.address, excessiveAmount)
            ).to.be.revertedWithCustomError(propertyFractions, "ERC20InsufficientBalance");
        });
        
        it("Should reject transferFrom with insufficient allowance", async function () {
            const { propertyFractions, addr1, addr2 } = await loadFixture(mintedFractionsFixture);
            
            const approvalAmount = ethers.parseEther("1000");
            await propertyFractions.connect(addr1).approve(addr2.address, approvalAmount);
            
            const excessiveTransfer = ethers.parseEther("2000");
            
            await expect(
                propertyFractions.connect(addr2).transferFrom(addr1.address, addr2.address, excessiveTransfer)
            ).to.be.revertedWithCustomError(propertyFractions, "ERC20InsufficientAllowance");
        });
    });
    
    describe("Fraction Info", function () {
        it("Should return correct fraction info before minting", async function () {
            const { propertyFractions, manager, propertyId } = await loadFixture(deployPropertyFractionsFixture);
            
            const info = await propertyFractions.getFractionInfo();
            
            expect(info[0]).to.equal(propertyId); // propertyId
            expect(info[1]).to.equal(0); // totalSupply
            expect(info[2]).to.equal(manager.address); // tokenizationManager
            expect(info[3]).to.be.false; // mintComplete
        });
        
        it("Should return correct fraction info after minting", async function () {
            const { propertyFractions, manager, addr1, propertyId } = await loadFixture(deployPropertyFractionsFixture);
            
            await propertyFractions.connect(manager).mintInitialSupply(addr1.address);
            
            const info = await propertyFractions.getFractionInfo();
            const expectedSupply = ethers.parseEther("1000000");
            
            expect(info[0]).to.equal(propertyId);
            expect(info[1]).to.equal(expectedSupply);
            expect(info[2]).to.equal(manager.address);
            expect(info[3]).to.be.true;
        });
    });
    
    describe("Multiple Property Deployments", function () {
        it("Should deploy separate contracts for different properties", async function () {
            const [owner, manager] = await ethers.getSigners();
            
            const PropertyFractions = await ethers.getContractFactory("PropertyFractions");
            
            const fractions1 = await PropertyFractions.deploy(1, manager.address);
            const fractions2 = await PropertyFractions.deploy(2, manager.address);
            const fractions3 = await PropertyFractions.deploy(3, manager.address);
            
            expect(await fractions1.propertyId()).to.equal(1);
            expect(await fractions1.symbol()).to.equal("PROP1");
            
            expect(await fractions2.propertyId()).to.equal(2);
            expect(await fractions2.symbol()).to.equal("PROP2");
            
            expect(await fractions3.propertyId()).to.equal(3);
            expect(await fractions3.symbol()).to.equal("PROP3");
        });
    });
    
    describe("Constants", function () {
        it("Should have correct TOTAL_FRACTIONS constant", async function () {
            const { propertyFractions } = await loadFixture(deployPropertyFractionsFixture);
            
            const expectedTotal = ethers.parseEther("1000000");
            expect(await propertyFractions.TOTAL_FRACTIONS()).to.equal(expectedTotal);
        });
    });
});
