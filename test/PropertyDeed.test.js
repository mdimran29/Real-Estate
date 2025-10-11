const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * Comprehensive test suite for the PropertyDeed NFT contract
 * 
 * This suite tests:
 * - Contract deployment and initialization
 * - Property deed minting functionality
 * - Access control (only owner can mint)
 * - Property information retrieval
 * - Token URI functionality
 * - Edge cases and error conditions
 */
describe("PropertyDeed Contract", function () {
    
    /**
     * Fixture to deploy the PropertyDeed contract
     * This is called before each test to ensure a clean state
     */
    async function deployPropertyDeedFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        
        const PropertyDeed = await ethers.getContractFactory("PropertyDeed");
        const propertyDeed = await PropertyDeed.deploy();
        
        return { propertyDeed, owner, addr1, addr2 };
    }
    
    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            const { propertyDeed } = await loadFixture(deployPropertyDeedFixture);
            
            expect(await propertyDeed.name()).to.equal("PropertyDeed");
            expect(await propertyDeed.symbol()).to.equal("DEED");
        });
        
        it("Should set the deployer as owner", async function () {
            const { propertyDeed, owner } = await loadFixture(deployPropertyDeedFixture);
            
            expect(await propertyDeed.owner()).to.equal(owner.address);
        });
        
        it("Should start with zero total supply", async function () {
            const { propertyDeed } = await loadFixture(deployPropertyDeedFixture);
            
            expect(await propertyDeed.totalSupply()).to.equal(0);
        });
    });
    
    describe("Minting", function () {
        it("Should mint a property deed successfully", async function () {
            const { propertyDeed, owner, addr1 } = await loadFixture(deployPropertyDeedFixture);
            
            const propertyAddress = "123 Main St, City, Country";
            const metadataURI = "ipfs://QmTest123";
            
            const tx = await propertyDeed.mintPropertyDeed(addr1.address, propertyAddress, metadataURI);
            await tx.wait();
            
            // Check that the token was minted
            expect(await propertyDeed.ownerOf(1)).to.equal(addr1.address);
            expect(await propertyDeed.totalSupply()).to.equal(1);
        });
        
        it("Should emit PropertyMinted event", async function () {
            const { propertyDeed, addr1 } = await loadFixture(deployPropertyDeedFixture);
            
            const propertyAddress = "123 Main St";
            const metadataURI = "ipfs://QmTest";
            
            await expect(propertyDeed.mintPropertyDeed(addr1.address, propertyAddress, metadataURI))
                .to.emit(propertyDeed, "PropertyMinted")
                .withArgs(1, addr1.address, propertyAddress);
        });
        
        it("Should store property information correctly", async function () {
            const { propertyDeed, addr1 } = await loadFixture(deployPropertyDeedFixture);
            
            const propertyAddress = "456 Oak Ave";
            const metadataURI = "ipfs://QmTest456";
            
            await propertyDeed.mintPropertyDeed(addr1.address, propertyAddress, metadataURI);
            
            const propertyInfo = await propertyDeed.getPropertyInfo(1);
            expect(propertyInfo.propertyAddress).to.equal(propertyAddress);
            expect(propertyInfo.metadataURI).to.equal(metadataURI);
            expect(propertyInfo.creationTimestamp).to.be.gt(0);
        });
        
        it("Should increment token IDs correctly", async function () {
            const { propertyDeed, addr1, addr2 } = await loadFixture(deployPropertyDeedFixture);
            
            await propertyDeed.mintPropertyDeed(addr1.address, "Property 1", "uri1");
            await propertyDeed.mintPropertyDeed(addr2.address, "Property 2", "uri2");
            await propertyDeed.mintPropertyDeed(addr1.address, "Property 3", "uri3");
            
            expect(await propertyDeed.ownerOf(1)).to.equal(addr1.address);
            expect(await propertyDeed.ownerOf(2)).to.equal(addr2.address);
            expect(await propertyDeed.ownerOf(3)).to.equal(addr1.address);
            expect(await propertyDeed.totalSupply()).to.equal(3);
        });
        
        it("Should return correct tokenURI", async function () {
            const { propertyDeed, addr1 } = await loadFixture(deployPropertyDeedFixture);
            
            const metadataURI = "ipfs://QmTestURI";
            await propertyDeed.mintPropertyDeed(addr1.address, "Property 1", metadataURI);
            
            expect(await propertyDeed.tokenURI(1)).to.equal(metadataURI);
        });
    });
    
    describe("Access Control", function () {
        it("Should only allow owner to mint", async function () {
            const { propertyDeed, addr1 } = await loadFixture(deployPropertyDeedFixture);
            
            await expect(
                propertyDeed.connect(addr1).mintPropertyDeed(addr1.address, "Property", "uri")
            ).to.be.revertedWithCustomError(propertyDeed, "OwnableUnauthorizedAccount");
        });
    });
    
    describe("Edge Cases and Validations", function () {
        it("Should reject minting to zero address", async function () {
            const { propertyDeed } = await loadFixture(deployPropertyDeedFixture);
            
            await expect(
                propertyDeed.mintPropertyDeed(ethers.ZeroAddress, "Property", "uri")
            ).to.be.revertedWith("PropertyDeed: Cannot mint to zero address");
        });
        
        it("Should reject empty property address", async function () {
            const { propertyDeed, addr1 } = await loadFixture(deployPropertyDeedFixture);
            
            await expect(
                propertyDeed.mintPropertyDeed(addr1.address, "", "uri")
            ).to.be.revertedWith("PropertyDeed: Property address cannot be empty");
        });
        
        it("Should revert when querying non-existent token", async function () {
            const { propertyDeed } = await loadFixture(deployPropertyDeedFixture);
            
            await expect(
                propertyDeed.getPropertyInfo(999)
            ).to.be.revertedWith("PropertyDeed: Property does not exist");
        });
        
        it("Should revert tokenURI for non-existent token", async function () {
            const { propertyDeed } = await loadFixture(deployPropertyDeedFixture);
            
            await expect(
                propertyDeed.tokenURI(999)
            ).to.be.revertedWith("PropertyDeed: URI query for nonexistent token");
        });
    });
    
    describe("Transfer Functionality", function () {
        it("Should allow token transfers", async function () {
            const { propertyDeed, addr1, addr2 } = await loadFixture(deployPropertyDeedFixture);
            
            await propertyDeed.mintPropertyDeed(addr1.address, "Property 1", "uri");
            
            // Transfer from addr1 to addr2
            await propertyDeed.connect(addr1).transferFrom(addr1.address, addr2.address, 1);
            
            expect(await propertyDeed.ownerOf(1)).to.equal(addr2.address);
        });
        
        it("Should maintain property info after transfer", async function () {
            const { propertyDeed, addr1, addr2 } = await loadFixture(deployPropertyDeedFixture);
            
            const propertyAddress = "123 Main St";
            const metadataURI = "ipfs://QmTest";
            
            await propertyDeed.mintPropertyDeed(addr1.address, propertyAddress, metadataURI);
            await propertyDeed.connect(addr1).transferFrom(addr1.address, addr2.address, 1);
            
            const propertyInfo = await propertyDeed.getPropertyInfo(1);
            expect(propertyInfo.propertyAddress).to.equal(propertyAddress);
            expect(propertyInfo.metadataURI).to.equal(metadataURI);
        });
    });
});
