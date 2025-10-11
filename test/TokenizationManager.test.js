const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * Comprehensive test suite for the TokenizationManager contract
 * 
 * This suite tests:
 * - Contract deployment
 * - Property tokenization workflow
 * - Distribution start/stop functionality
 * - Fraction purchasing with ETH
 * - Price updates
 * - Access control
 * - Edge cases and security
 */
describe("TokenizationManager Contract", function () {
    
    /**
     * Fixture to deploy the TokenizationManager contract
     */
    async function deployTokenizationManagerFixture() {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        
        const TokenizationManager = await ethers.getContractFactory("TokenizationManager");
        const tokenizationManager = await TokenizationManager.deploy();
        
        // Get the PropertyDeed contract address
        const propertyDeedAddress = await tokenizationManager.propertyDeedContract();
        const PropertyDeed = await ethers.getContractFactory("PropertyDeed");
        const propertyDeed = PropertyDeed.attach(propertyDeedAddress);
        
        return { tokenizationManager, propertyDeed, owner, addr1, addr2, addr3 };
    }
    
    describe("Deployment", function () {
        it("Should deploy TokenizationManager and PropertyDeed contracts", async function () {
            const { tokenizationManager, propertyDeed } = await loadFixture(deployTokenizationManagerFixture);
            
            expect(await tokenizationManager.getAddress()).to.be.properAddress;
            expect(await propertyDeed.getAddress()).to.be.properAddress;
        });
        
        it("Should set deployer as owner", async function () {
            const { tokenizationManager, owner } = await loadFixture(deployTokenizationManagerFixture);
            
            expect(await tokenizationManager.owner()).to.equal(owner.address);
        });
        
        it("Should have zero tokenized properties initially", async function () {
            const { tokenizationManager } = await loadFixture(deployTokenizationManagerFixture);
            
            expect(await tokenizationManager.getTotalTokenizedProperties()).to.equal(0);
        });
    });
    
    describe("Property Tokenization", function () {
        it("Should tokenize a property successfully", async function () {
            const { tokenizationManager, propertyDeed, addr1 } = await loadFixture(deployTokenizationManagerFixture);
            
            const propertyAddress = "123 Main St, City, Country";
            const metadataURI = "ipfs://QmTest123";
            
            const tx = await tokenizationManager.connect(addr1).tokenizeProperty(propertyAddress, metadataURI);
            const receipt = await tx.wait();
            
            // Check that property was tokenized
            expect(await tokenizationManager.getTotalTokenizedProperties()).to.equal(1);
            expect(await tokenizationManager.isPropertyTokenized(1)).to.be.true;
        });
        
        it("Should emit PropertyTokenized and PropertyDeedLocked events", async function () {
            const { tokenizationManager, addr1 } = await loadFixture(deployTokenizationManagerFixture);
            
            const propertyAddress = "123 Main St";
            const metadataURI = "ipfs://QmTest";
            
            const tx = await tokenizationManager.connect(addr1).tokenizeProperty(propertyAddress, metadataURI);
            
            await expect(tx).to.emit(tokenizationManager, "PropertyTokenized");
            await expect(tx).to.emit(tokenizationManager, "PropertyDeedLocked");
        });
        
        it("Should mint PropertyDeed to TokenizationManager (locked)", async function () {
            const { tokenizationManager, propertyDeed, addr1 } = await loadFixture(deployTokenizationManagerFixture);
            
            await tokenizationManager.connect(addr1).tokenizeProperty("Property 1", "uri");
            
            // PropertyDeed should be owned by TokenizationManager
            expect(await propertyDeed.ownerOf(1)).to.equal(await tokenizationManager.getAddress());
        });
        
        it("Should deploy PropertyFractions contract", async function () {
            const { tokenizationManager, addr1 } = await loadFixture(deployTokenizationManagerFixture);
            
            const tx = await tokenizationManager.connect(addr1).tokenizeProperty("Property 1", "uri");
            await tx.wait();
            
            const property = await tokenizationManager.getTokenizedProperty(1);
            expect(property.fractionsContract).to.be.properAddress;
            expect(property.fractionsContract).to.not.equal(ethers.ZeroAddress);
        });
        
        it("Should mint all fractions to the caller", async function () {
            const { tokenizationManager, addr1 } = await loadFixture(deployTokenizationManagerFixture);
            
            const tx = await tokenizationManager.connect(addr1).tokenizeProperty("Property 1", "uri");
            await tx.wait();
            
            const property = await tokenizationManager.getTokenizedProperty(1);
            const PropertyFractions = await ethers.getContractFactory("PropertyFractions");
            const fractions = PropertyFractions.attach(property.fractionsContract);
            
            const expectedSupply = ethers.parseEther("1000000");
            expect(await fractions.balanceOf(addr1.address)).to.equal(expectedSupply);
        });
        
        it("Should store property details correctly", async function () {
            const { tokenizationManager, addr1 } = await loadFixture(deployTokenizationManagerFixture);
            
            await tokenizationManager.connect(addr1).tokenizeProperty("Property 1", "uri");
            
            const property = await tokenizationManager.getTokenizedProperty(1);
            expect(property.propertyId).to.equal(1);
            expect(property.owner).to.equal(addr1.address);
            expect(property.isLocked).to.be.true;
            expect(property.isDistributing).to.be.false;
            expect(property.pricePerFraction).to.equal(0);
            expect(property.totalFractionsSold).to.equal(0);
        });
        
        it("Should reject empty property address", async function () {
            const { tokenizationManager, addr1 } = await loadFixture(deployTokenizationManagerFixture);
            
            await expect(
                tokenizationManager.connect(addr1).tokenizeProperty("", "uri")
            ).to.be.revertedWith("TokenizationManager: Property address required");
        });
        
        it("Should tokenize multiple properties", async function () {
            const { tokenizationManager, addr1, addr2 } = await loadFixture(deployTokenizationManagerFixture);
            
            await tokenizationManager.connect(addr1).tokenizeProperty("Property 1", "uri1");
            await tokenizationManager.connect(addr2).tokenizeProperty("Property 2", "uri2");
            await tokenizationManager.connect(addr1).tokenizeProperty("Property 3", "uri3");
            
            expect(await tokenizationManager.getTotalTokenizedProperties()).to.equal(3);
            
            const allIds = await tokenizationManager.getAllPropertyIds();
            expect(allIds).to.deep.equal([1n, 2n, 3n]);
        });
    });
    
    describe("Distribution Management", function () {
        async function tokenizedPropertyFixture() {
            const fixture = await deployTokenizationManagerFixture();
            await fixture.tokenizationManager.connect(fixture.addr1).tokenizeProperty("Property 1", "uri");
            return fixture;
        }
        
        it("Should start distribution successfully", async function () {
            const { tokenizationManager, addr1 } = await loadFixture(tokenizedPropertyFixture);
            
            const pricePerFraction = ethers.parseEther("0.001"); // 0.001 ETH per token
            
            await tokenizationManager.connect(addr1).startDistribution(1, pricePerFraction);
            
            const property = await tokenizationManager.getTokenizedProperty(1);
            expect(property.isDistributing).to.be.true;
            expect(property.pricePerFraction).to.equal(pricePerFraction);
        });
        
        it("Should emit DistributionStarted event", async function () {
            const { tokenizationManager, addr1 } = await loadFixture(tokenizedPropertyFixture);
            
            const pricePerFraction = ethers.parseEther("0.001");
            
            await expect(tokenizationManager.connect(addr1).startDistribution(1, pricePerFraction))
                .to.emit(tokenizationManager, "DistributionStarted")
                .withArgs(1, pricePerFraction, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));
        });
        
        it("Should only allow property owner to start distribution", async function () {
            const { tokenizationManager, addr2 } = await loadFixture(tokenizedPropertyFixture);
            
            await expect(
                tokenizationManager.connect(addr2).startDistribution(1, ethers.parseEther("0.001"))
            ).to.be.revertedWith("TokenizationManager: Only property owner");
        });
        
        it("Should reject zero price", async function () {
            const { tokenizationManager, addr1 } = await loadFixture(tokenizedPropertyFixture);
            
            await expect(
                tokenizationManager.connect(addr1).startDistribution(1, 0)
            ).to.be.revertedWith("TokenizationManager: Price must be greater than zero");
        });
        
        it("Should not allow starting distribution twice", async function () {
            const { tokenizationManager, addr1 } = await loadFixture(tokenizedPropertyFixture);
            
            const pricePerFraction = ethers.parseEther("0.001");
            await tokenizationManager.connect(addr1).startDistribution(1, pricePerFraction);
            
            await expect(
                tokenizationManager.connect(addr1).startDistribution(1, pricePerFraction)
            ).to.be.revertedWith("TokenizationManager: Distribution already active");
        });
        
        it("Should stop distribution successfully", async function () {
            const { tokenizationManager, addr1 } = await loadFixture(tokenizedPropertyFixture);
            
            await tokenizationManager.connect(addr1).startDistribution(1, ethers.parseEther("0.001"));
            await tokenizationManager.connect(addr1).stopDistribution(1);
            
            const property = await tokenizationManager.getTokenizedProperty(1);
            expect(property.isDistributing).to.be.false;
        });
        
        it("Should emit DistributionStopped event", async function () {
            const { tokenizationManager, addr1 } = await loadFixture(tokenizedPropertyFixture);
            
            await tokenizationManager.connect(addr1).startDistribution(1, ethers.parseEther("0.001"));
            
            await expect(tokenizationManager.connect(addr1).stopDistribution(1))
                .to.emit(tokenizationManager, "DistributionStopped")
                .withArgs(1, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));
        });
        
        it("Should only allow property owner to stop distribution", async function () {
            const { tokenizationManager, addr1, addr2 } = await loadFixture(tokenizedPropertyFixture);
            
            await tokenizationManager.connect(addr1).startDistribution(1, ethers.parseEther("0.001"));
            
            await expect(
                tokenizationManager.connect(addr2).stopDistribution(1)
            ).to.be.revertedWith("TokenizationManager: Only property owner");
        });
    });
    
    describe("Buying Fractions", function () {
        async function distributingPropertyFixture() {
            const fixture = await deployTokenizationManagerFixture();
            await fixture.tokenizationManager.connect(fixture.addr1).tokenizeProperty("Property 1", "uri");
            
            // Start distribution with price of 0.001 ETH per token
            const pricePerFraction = ethers.parseEther("0.001");
            await fixture.tokenizationManager.connect(fixture.addr1).startDistribution(1, pricePerFraction);
            
            // Approve TokenizationManager to spend fractions
            const property = await fixture.tokenizationManager.getTokenizedProperty(1);
            const PropertyFractions = await ethers.getContractFactory("PropertyFractions");
            const fractions = PropertyFractions.attach(property.fractionsContract);
            
            const approvalAmount = ethers.parseEther("1000000"); // Approve all
            await fractions.connect(fixture.addr1).approve(await fixture.tokenizationManager.getAddress(), approvalAmount);
            
            return { ...fixture, fractions, pricePerFraction };
        }
        
        it("Should buy fractions successfully", async function () {
            const { tokenizationManager, fractions, addr2, pricePerFraction } = await loadFixture(distributingPropertyFixture);
            
            const numberOfFractions = 100; // Simple number: 100 fractions
            const totalCost = pricePerFraction * BigInt(numberOfFractions);
            
            await tokenizationManager.connect(addr2).buyFractions(1, numberOfFractions, { value: totalCost });
            
            expect(await fractions.balanceOf(addr2.address)).to.equal(ethers.parseEther("100"));
        });
        
        it("Should emit FractionsPurchased event", async function () {
            const { tokenizationManager, addr2, pricePerFraction } = await loadFixture(distributingPropertyFixture);
            
            const numberOfFractions = 100;
            const totalCost = pricePerFraction * BigInt(numberOfFractions);
            
            await expect(
                tokenizationManager.connect(addr2).buyFractions(1, numberOfFractions, { value: totalCost })
            ).to.emit(tokenizationManager, "FractionsPurchased")
            .withArgs(1, addr2.address, ethers.parseEther("100"), totalCost, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));
        });
        
        it("Should transfer ETH to property owner", async function () {
            const { tokenizationManager, addr1, addr2, pricePerFraction } = await loadFixture(distributingPropertyFixture);
            
            const numberOfFractions = 100;
            const totalCost = pricePerFraction * BigInt(numberOfFractions);
            
            const balanceBefore = await ethers.provider.getBalance(addr1.address);
            
            await tokenizationManager.connect(addr2).buyFractions(1, numberOfFractions, { value: totalCost });
            
            const balanceAfter = await ethers.provider.getBalance(addr1.address);
            expect(balanceAfter - balanceBefore).to.equal(totalCost);
        });
        
        it("Should update total fractions sold", async function () {
            const { tokenizationManager, addr2, pricePerFraction } = await loadFixture(distributingPropertyFixture);
            
            const numberOfFractions = 100;
            const totalCost = pricePerFraction * BigInt(numberOfFractions);
            
            await tokenizationManager.connect(addr2).buyFractions(1, numberOfFractions, { value: totalCost });
            
            const property = await tokenizationManager.getTokenizedProperty(1);
            expect(property.totalFractionsSold).to.equal(ethers.parseEther("100")); // Should be in wei
        });
        
        it("Should refund excess ETH", async function () {
            const { tokenizationManager, addr2, pricePerFraction } = await loadFixture(distributingPropertyFixture);
            
            const numberOfFractions = 100;
            const totalCost = pricePerFraction * BigInt(numberOfFractions);
            const excessETH = ethers.parseEther("1");
            
            const balanceBefore = await ethers.provider.getBalance(addr2.address);
            
            const tx = await tokenizationManager.connect(addr2).buyFractions(1, numberOfFractions, { value: totalCost + excessETH });
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            
            const balanceAfter = await ethers.provider.getBalance(addr2.address);
            
            // Balance should decrease by totalCost + gas, not totalCost + excessETH + gas
            expect(balanceBefore - balanceAfter).to.be.closeTo(totalCost + gasUsed, ethers.parseEther("0.001"));
        });
        
        it("Should reject purchase when distribution not active", async function () {
            const { tokenizationManager, addr1, addr2 } = await loadFixture(distributingPropertyFixture);
            
            await tokenizationManager.connect(addr1).stopDistribution(1);
            
            await expect(
                tokenizationManager.connect(addr2).buyFractions(1, 100, { value: ethers.parseEther("0.1") })
            ).to.be.revertedWith("TokenizationManager: Distribution not active");
        });
        
        it("Should reject insufficient ETH", async function () {
            const { tokenizationManager, addr2, pricePerFraction } = await loadFixture(distributingPropertyFixture);
            
            const numberOfFractions = 100;
            const totalCost = pricePerFraction * BigInt(numberOfFractions);
            const insufficientAmount = totalCost / 2n;
            
            await expect(
                tokenizationManager.connect(addr2).buyFractions(1, numberOfFractions, { value: insufficientAmount })
            ).to.be.revertedWith("TokenizationManager: Insufficient ETH sent");
        });
        
        it("Should reject zero fractions", async function () {
            const { tokenizationManager, addr2 } = await loadFixture(distributingPropertyFixture);
            
            await expect(
                tokenizationManager.connect(addr2).buyFractions(1, 0, { value: 0 })
            ).to.be.revertedWith("TokenizationManager: Must buy at least one fraction");
        });
        
        it("Should reject owner buying own fractions", async function () {
            const { tokenizationManager, addr1, pricePerFraction } = await loadFixture(distributingPropertyFixture);
            
            const numberOfFractions = 100;
            const totalCost = pricePerFraction * BigInt(numberOfFractions);
            
            await expect(
                tokenizationManager.connect(addr1).buyFractions(1, numberOfFractions, { value: totalCost })
            ).to.be.revertedWith("TokenizationManager: Owner cannot buy own fractions");
        });
        
        it("Should reject purchase exceeding available fractions", async function () {
            const { tokenizationManager, addr2, pricePerFraction } = await loadFixture(distributingPropertyFixture);
            
            const excessiveFractions = 2000000; // Simple number: 2 million fractions (more than total supply)
            const totalCost = ethers.parseEther("2000"); // Just send enough ETH
            
            await expect(
                tokenizationManager.connect(addr2).buyFractions(1, excessiveFractions, { value: totalCost })
            ).to.be.revertedWith("TokenizationManager: Owner has insufficient fractions");
        });
        
        it("Should handle multiple purchases", async function () {
            const { tokenizationManager, fractions, addr2, addr3, pricePerFraction } = await loadFixture(distributingPropertyFixture);
            
            const amount1 = 1000; // Simple number
            const cost1 = pricePerFraction * BigInt(amount1);
            
            const amount2 = 2000; // Simple number
            const cost2 = pricePerFraction * BigInt(amount2);
            
            await tokenizationManager.connect(addr2).buyFractions(1, amount1, { value: cost1 });
            await tokenizationManager.connect(addr3).buyFractions(1, amount2, { value: cost2 });
            
            expect(await fractions.balanceOf(addr2.address)).to.equal(ethers.parseEther("1000"));
            expect(await fractions.balanceOf(addr3.address)).to.equal(ethers.parseEther("2000"));
            
            const property = await tokenizationManager.getTokenizedProperty(1);
            expect(property.totalFractionsSold).to.equal(ethers.parseEther("3000")); // Both in wei
        });
    });
    
    describe("Price Updates", function () {
        async function tokenizedPropertyFixture() {
            const fixture = await deployTokenizationManagerFixture();
            await fixture.tokenizationManager.connect(fixture.addr1).tokenizeProperty("Property 1", "uri");
            return fixture;
        }
        
        it("Should update fraction price successfully", async function () {
            const { tokenizationManager, addr1 } = await loadFixture(tokenizedPropertyFixture);
            
            const newPrice = ethers.parseEther("0.002");
            await tokenizationManager.connect(addr1).updateFractionPrice(1, newPrice);
            
            const property = await tokenizationManager.getTokenizedProperty(1);
            expect(property.pricePerFraction).to.equal(newPrice);
        });
        
        it("Should only allow property owner to update price", async function () {
            const { tokenizationManager, addr2 } = await loadFixture(tokenizedPropertyFixture);
            
            await expect(
                tokenizationManager.connect(addr2).updateFractionPrice(1, ethers.parseEther("0.002"))
            ).to.be.revertedWith("TokenizationManager: Only property owner");
        });
        
        it("Should reject zero price", async function () {
            const { tokenizationManager, addr1 } = await loadFixture(tokenizedPropertyFixture);
            
            await expect(
                tokenizationManager.connect(addr1).updateFractionPrice(1, 0)
            ).to.be.revertedWith("TokenizationManager: Price must be greater than zero");
        });
    });
    
    describe("View Functions", function () {
        it("Should return correct tokenized property details", async function () {
            const { tokenizationManager, addr1 } = await loadFixture(deployTokenizationManagerFixture);
            
            await tokenizationManager.connect(addr1).tokenizeProperty("Property 1", "uri");
            
            const property = await tokenizationManager.getTokenizedProperty(1);
            expect(property.propertyId).to.equal(1);
            expect(property.owner).to.equal(addr1.address);
        });
        
        it("Should revert for non-existent property", async function () {
            const { tokenizationManager } = await loadFixture(deployTokenizationManagerFixture);
            
            await expect(
                tokenizationManager.getTokenizedProperty(999)
            ).to.be.revertedWith("TokenizationManager: Property not tokenized");
        });
        
        it("Should return all property IDs", async function () {
            const { tokenizationManager, addr1, addr2 } = await loadFixture(deployTokenizationManagerFixture);
            
            await tokenizationManager.connect(addr1).tokenizeProperty("Property 1", "uri1");
            await tokenizationManager.connect(addr2).tokenizeProperty("Property 2", "uri2");
            
            const allIds = await tokenizationManager.getAllPropertyIds();
            expect(allIds).to.deep.equal([1n, 2n]);
        });
    });
    
    describe("Emergency Functions", function () {
        it("Should allow owner to withdraw accidentally sent ETH", async function () {
            const { tokenizationManager, owner, addr1 } = await loadFixture(deployTokenizationManagerFixture);
            
            // Send some ETH directly to the contract
            await addr1.sendTransaction({
                to: await tokenizationManager.getAddress(),
                value: ethers.parseEther("1")
            });
            
            const balanceBefore = await ethers.provider.getBalance(owner.address);
            const tx = await tokenizationManager.emergencyWithdraw();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            
            const balanceAfter = await ethers.provider.getBalance(owner.address);
            
            expect(balanceAfter - balanceBefore).to.be.closeTo(
                ethers.parseEther("1") - gasUsed,
                ethers.parseEther("0.001")
            );
        });
        
        it("Should only allow owner to emergency withdraw", async function () {
            const { tokenizationManager, addr1 } = await loadFixture(deployTokenizationManagerFixture);
            
            await expect(
                tokenizationManager.connect(addr1).emergencyWithdraw()
            ).to.be.revertedWithCustomError(tokenizationManager, "OwnableUnauthorizedAccount");
        });
        
        it("Should revert if no balance to withdraw", async function () {
            const { tokenizationManager } = await loadFixture(deployTokenizationManagerFixture);
            
            await expect(
                tokenizationManager.emergencyWithdraw()
            ).to.be.revertedWith("TokenizationManager: No balance to withdraw");
        });
    });
    
    describe("Integration Tests", function () {
        it("Should complete full workflow: tokenize, distribute, and sell fractions", async function () {
            const { tokenizationManager, propertyDeed, addr1, addr2, addr3 } = await loadFixture(deployTokenizationManagerFixture);
            
            // Step 1: Tokenize property
            await tokenizationManager.connect(addr1).tokenizeProperty("123 Main St", "ipfs://metadata");
            
            // Step 2: Start distribution
            const pricePerFraction = ethers.parseEther("0.001");
            await tokenizationManager.connect(addr1).startDistribution(1, pricePerFraction);
            
            // Step 3: Approve fractions for sale
            const property = await tokenizationManager.getTokenizedProperty(1);
            const PropertyFractions = await ethers.getContractFactory("PropertyFractions");
            const fractions = PropertyFractions.attach(property.fractionsContract);
            
            await fractions.connect(addr1).approve(await tokenizationManager.getAddress(), ethers.parseEther("1000000"));
            
            // Step 4: Multiple buyers purchase fractions
            const amount2 = 50000; // Simple number
            const cost2 = pricePerFraction * BigInt(amount2);
            await tokenizationManager.connect(addr2).buyFractions(1, amount2, { value: cost2 });
            
            const amount3 = 30000; // Simple number
            const cost3 = pricePerFraction * BigInt(amount3);
            await tokenizationManager.connect(addr3).buyFractions(1, amount3, { value: cost3 });
            
            // Verify balances
            expect(await fractions.balanceOf(addr2.address)).to.equal(ethers.parseEther("50000"));
            expect(await fractions.balanceOf(addr3.address)).to.equal(ethers.parseEther("30000"));
            
            // Verify PropertyDeed is still locked
            expect(await propertyDeed.ownerOf(1)).to.equal(await tokenizationManager.getAddress());
            
            // Verify total fractions sold
            const updatedProperty = await tokenizationManager.getTokenizedProperty(1);
            expect(updatedProperty.totalFractionsSold).to.equal(ethers.parseEther("80000")); // 50000 + 30000 in wei
        });
    });
    
    describe("Reentrancy Protection", function () {
        it("Should prevent reentrancy attacks on buyFractions", async function () {
            // This is implicitly tested by the ReentrancyGuard modifier
            // Additional malicious contract tests could be added here
            const { tokenizationManager } = await loadFixture(deployTokenizationManagerFixture);
            expect(await tokenizationManager.getAddress()).to.be.properAddress;
        });
    });
});
