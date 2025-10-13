// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./PropertyDeed.sol";
import "./PropertyFractions.sol";

/**
 * @title TokenizationManager
 * @dev FIXED VERSION: Removed NFT transfer from startDistribution since NFT is already locked during tokenization
 * 
 * Key Fix: The PropertyDeed NFT is minted directly to this contract and stays locked.
 * Owners only need to approve their PropertyFractions ERC20 tokens for sale.
 */
contract TokenizationManager is Ownable, ReentrancyGuard, IERC721Receiver {
    
    // Reference to the PropertyDeed NFT contract
    PropertyDeed public immutable propertyDeedContract;
    
    /**
     * @dev Structure representing a tokenized property
     */
    struct TokenizedProperty {
        uint256 propertyId;
        address fractionsContract;
        bool isLocked;
        bool isDistributing;
        uint256 pricePerFraction;
        address owner;
        uint256 totalFractionsSold;
    }
    
    // Mapping from property ID to tokenized property details
    mapping(uint256 => TokenizedProperty) public tokenizedProperties;
    
    // Array to track all tokenized property IDs
    uint256[] public allPropertyIds;
    
    // Mapping to check if a property has been tokenized
    mapping(uint256 => bool) public isPropertyTokenized;
    
    /**
     * @dev Events
     */
    event PropertyTokenized(
        uint256 indexed propertyId,
        address indexed owner,
        address fractionsContract,
        uint256 timestamp
    );
    
    event DistributionStarted(
        uint256 indexed propertyId,
        uint256 pricePerFraction,
        uint256 timestamp
    );
    
    event DistributionStopped(
        uint256 indexed propertyId,
        uint256 timestamp
    );
    
    event FractionsPurchased(
        uint256 indexed propertyId,
        address indexed buyer,
        uint256 numberOfFractions,
        uint256 totalCost,
        uint256 timestamp
    );
    
    event PropertyDeedLocked(
        uint256 indexed propertyId,
        address indexed owner,
        uint256 timestamp
    );
    
    /**
     * @dev Constructor deploys the PropertyDeed contract
     */
    constructor() Ownable(msg.sender) {
        propertyDeedContract = new PropertyDeed();
    }
    
    /**
     * @dev Allows the contract to receive ETH
     */
    receive() external payable {}
    
    /**
     * @dev Tokenizes a property - PropertyDeed is minted to THIS contract and locked immediately
     */
    function tokenizeProperty(
        string memory propertyAddress,
        string memory metadataURI
    ) external nonReentrant returns (uint256 propertyId, address fractionsContract) {
        require(bytes(propertyAddress).length > 0, "TokenizationManager: Property address required");
        
        // Step 1: Mint PropertyDeed NFT to THIS CONTRACT (already locked)
        propertyId = propertyDeedContract.mintPropertyDeed(
            address(this),
            propertyAddress,
            metadataURI
        );
        
        // Step 2: Deploy new PropertyFractions contract
        PropertyFractions fractions = new PropertyFractions(
            propertyId,
            address(this)
        );
        fractionsContract = address(fractions);
        
        // Step 3: Mint total supply of fractions to the CALLER (property owner)
        fractions.mintInitialSupply(msg.sender);
        
        // Step 4: Record the tokenized property
        tokenizedProperties[propertyId] = TokenizedProperty({
            propertyId: propertyId,
            fractionsContract: fractionsContract,
            isLocked: true,
            isDistributing: false,
            pricePerFraction: 0,
            owner: msg.sender,
            totalFractionsSold: 0
        });
        
        isPropertyTokenized[propertyId] = true;
        allPropertyIds.push(propertyId);
        
        emit PropertyTokenized(propertyId, msg.sender, fractionsContract, block.timestamp);
        emit PropertyDeedLocked(propertyId, msg.sender, block.timestamp);
        
        return (propertyId, fractionsContract);
    }
    
    /**
     * @dev Starts distribution - Owner must approve THIS contract to spend their PropertyFractions tokens
     * 
     * IMPORTANT: Before calling this, owner must call:
     * PropertyFractions(fractionsContract).approve(address(TokenizationManager), amount);
     */
    function startDistribution(
        uint256 propertyId,
        uint256 pricePerFractionInWei
    ) external {
        TokenizedProperty storage property = tokenizedProperties[propertyId];
        
        require(isPropertyTokenized[propertyId], "TokenizationManager: Property not tokenized");
        require(msg.sender == property.owner, "TokenizationManager: Only property owner");
        require(!property.isDistributing, "TokenizationManager: Distribution already active");
        require(pricePerFractionInWei > 0, "TokenizationManager: Price must be greater than zero");
        
        // Verify owner has fractions to sell
        PropertyFractions fractions = PropertyFractions(property.fractionsContract);
        uint256 ownerBalance = fractions.balanceOf(msg.sender);
        require(ownerBalance > 0, "TokenizationManager: Owner has no fractions to sell");
        
        // Verify owner has approved this contract to spend their fractions
        uint256 allowance = fractions.allowance(msg.sender, address(this));
        require(allowance > 0, "TokenizationManager: Owner must approve fractions for sale first");
        
        property.isDistributing = true;
        property.pricePerFraction = pricePerFractionInWei;
        
        emit DistributionStarted(propertyId, pricePerFractionInWei, block.timestamp);
    }
    
    /**
     * @dev Stops the distribution phase
     */
    function stopDistribution(uint256 propertyId) external {
        TokenizedProperty storage property = tokenizedProperties[propertyId];
        
        require(isPropertyTokenized[propertyId], "TokenizationManager: Property not tokenized");
        require(msg.sender == property.owner, "TokenizationManager: Only property owner");
        require(property.isDistributing, "TokenizationManager: Distribution not active");
        
        property.isDistributing = false;
        
        emit DistributionStopped(propertyId, block.timestamp);
    }
    
    /**
     * @dev Allows users to purchase fractions with ETH
     */
    function buyFractions(
        uint256 propertyId,
        uint256 numberOfFractions
    ) external payable nonReentrant {
        TokenizedProperty storage property = tokenizedProperties[propertyId];
        
        require(isPropertyTokenized[propertyId], "TokenizationManager: Property not tokenized");
        require(property.isDistributing, "TokenizationManager: Distribution not active");
        require(msg.sender != property.owner, "TokenizationManager: Owner cannot buy own fractions");
        require(numberOfFractions > 0, "TokenizationManager: Must buy at least one fraction");
        
        // Convert to 18 decimals
        uint256 fractionsInWei = numberOfFractions * 1e18;
        
        // Calculate total cost
        uint256 totalCost = (property.pricePerFraction * numberOfFractions);
        require(msg.value >= totalCost, "TokenizationManager: Insufficient ETH sent");
        
        PropertyFractions fractions = PropertyFractions(property.fractionsContract);
        
        // Check owner has enough fractions
        require(
            fractions.balanceOf(property.owner) >= fractionsInWei,
            "TokenizationManager: Owner has insufficient fractions"
        );
        
        // Check allowance
        require(
            fractions.allowance(property.owner, address(this)) >= fractionsInWei,
            "TokenizationManager: Insufficient allowance from owner"
        );
        
        // Transfer fractions from owner to buyer
        require(
            fractions.transferFrom(property.owner, msg.sender, fractionsInWei),
            "TokenizationManager: Fraction transfer failed"
        );
        
        // Transfer ETH to property owner
        (bool success, ) = payable(property.owner).call{value: totalCost}("");
        require(success, "TokenizationManager: ETH transfer failed");
        
        // Update total fractions sold
        property.totalFractionsSold += fractionsInWei;
        
        // Refund excess ETH
        if (msg.value > totalCost) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - totalCost}("");
            require(refundSuccess, "TokenizationManager: Refund failed");
        }
        
        emit FractionsPurchased(propertyId, msg.sender, fractionsInWei, totalCost, block.timestamp);
    }
    
    /**
     * @dev Updates the price per fraction
     */
    function updateFractionPrice(
        uint256 propertyId,
        uint256 newPricePerFractionInWei
    ) external {
        TokenizedProperty storage property = tokenizedProperties[propertyId];
        
        require(isPropertyTokenized[propertyId], "TokenizationManager: Property not tokenized");
        require(msg.sender == property.owner, "TokenizationManager: Only property owner");
        require(newPricePerFractionInWei > 0, "TokenizationManager: Price must be greater than zero");
        
        property.pricePerFraction = newPricePerFractionInWei;
    }
    
    /**
     * @dev Returns details of a tokenized property
     */
    function getTokenizedProperty(uint256 propertyId) external view returns (TokenizedProperty memory) {
        require(isPropertyTokenized[propertyId], "TokenizationManager: Property not tokenized");
        return tokenizedProperties[propertyId];
    }
    
    /**
     * @dev Returns all tokenized property IDs
     */
    function getAllPropertyIds() external view returns (uint256[] memory) {
        return allPropertyIds;
    }
    
    /**
     * @dev Returns the total number of tokenized properties
     */
    function getTotalTokenizedProperties() external view returns (uint256) {
        return allPropertyIds.length;
    }
    
    /**
     * @dev Required for receiving ERC721 tokens
     */
    function onERC721Received(
        address /* operator */,
        address /* from */,
        uint256 /* tokenId */,
        bytes calldata /* data */
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
    
    /**
     * @dev Emergency withdraw function
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "TokenizationManager: No balance to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "TokenizationManager: Withdrawal failed");
    }
}
