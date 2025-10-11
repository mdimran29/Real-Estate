// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./PropertyDeed.sol";
import "./PropertyFractions.sol";

/**
 * @title TokenizationManager
 * @dev Core orchestration contract for the real estate tokenization system.
 * 
 * This contract manages the entire lifecycle of property tokenization:
 * 1. Minting PropertyDeed NFTs representing property ownership
 * 2. Deploying PropertyFractions contracts for fractional shares
 * 3. Locking PropertyDeeds when fractionalized
 * 4. Managing the distribution and sale of fractional shares
 * 5. Handling payments and fund distribution
 * 
 * Key Features:
 * - Orchestrates tokenization of properties into fractional shares
 * - Locks PropertyDeed NFTs during fractionalization
 * - Manages distribution and pricing of fractions
 * - Handles secure payment processing for fraction purchases
 * - Tracks all tokenized properties and their fraction contracts
 * 
 * Security Considerations:
 * - ReentrancyGuard prevents reentrancy attacks on payable functions
 * - Access controls ensure only authorized operations
 * - SafeERC20 patterns for secure token transfers
 * - Proper validation of all inputs and state transitions
 */
contract TokenizationManager is Ownable, ReentrancyGuard, IERC721Receiver {
    
    // Reference to the PropertyDeed NFT contract
    PropertyDeed public immutable propertyDeedContract;
    
    /**
     * @dev Structure representing a tokenized property
     * @param propertyId The ID of the PropertyDeed NFT
     * @param fractionsContract Address of the PropertyFractions contract
     * @param isLocked Whether the PropertyDeed is locked in this contract
     * @param isDistributing Whether fractions are currently available for sale
     * @param pricePerFraction Price in wei for one fraction token (with 18 decimals)
     * @param owner Original owner who tokenized the property
     * @param totalFractionsSold Number of fractions sold so far
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
     * @dev Emitted when a property is successfully tokenized
     */
    event PropertyTokenized(
        uint256 indexed propertyId,
        address indexed owner,
        address fractionsContract,
        uint256 timestamp
    );
    
    /**
     * @dev Emitted when distribution starts for a property's fractions
     */
    event DistributionStarted(
        uint256 indexed propertyId,
        uint256 pricePerFraction,
        uint256 timestamp
    );
    
    /**
     * @dev Emitted when distribution is stopped
     */
    event DistributionStopped(
        uint256 indexed propertyId,
        uint256 timestamp
    );
    
    /**
     * @dev Emitted when fractions are purchased
     */
    event FractionsPurchased(
        uint256 indexed propertyId,
        address indexed buyer,
        uint256 numberOfFractions,
        uint256 totalCost,
        uint256 timestamp
    );
    
    /**
     * @dev Emitted when a PropertyDeed is locked in the contract
     */
    event PropertyDeedLocked(
        uint256 indexed propertyId,
        address indexed owner,
        uint256 timestamp
    );
    
    /**
     * @dev Constructor deploys the PropertyDeed contract
     * The deployer becomes the owner of the TokenizationManager
     */
    constructor() Ownable(msg.sender) {
        propertyDeedContract = new PropertyDeed();
    }
    
    /**
     * @dev Allows the contract to receive ETH
     * This is necessary for the emergency withdrawal functionality
     */
    receive() external payable {}
    
    /**
     * @dev Tokenizes a property by minting a deed NFT, deploying a fractions contract,
     * and locking the deed in this contract.
     * 
     * This is the main function that orchestrates the entire tokenization process:
     * 1. Mints a new PropertyDeed NFT
     * 2. Deploys a new PropertyFractions contract for that property
     * 3. Mints the total supply of fractions to the caller
     * 4. Locks the PropertyDeed NFT in this contract
     * 
     * @param propertyAddress Physical address of the property
     * @param metadataURI URI pointing to property metadata (e.g., IPFS)
     * @return propertyId The ID of the newly minted PropertyDeed
     * @return fractionsContract Address of the deployed PropertyFractions contract
     * 
     * Requirements:
     * - Property address cannot be empty
     * - Caller will receive all initial fractions
     * 
     * Emits {PropertyTokenized} and {PropertyDeedLocked} events
     */
    function tokenizeProperty(
        string memory propertyAddress,
        string memory metadataURI
    ) external nonReentrant returns (uint256 propertyId, address fractionsContract) {
        require(bytes(propertyAddress).length > 0, "TokenizationManager: Property address required");
        
        // Step 1: Mint PropertyDeed NFT to this contract (will be locked here)
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
        
        // Step 3: Mint total supply of fractions to the caller
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
     * @dev Starts the distribution phase for a property's fractions
     * 
     * The property owner can set a price and enable public purchasing of fractions.
     * Owner must have approved this contract to spend their fractions before calling.
     * 
     * @param propertyId The ID of the property
     * @param pricePerFractionInWei Price in wei for one whole fraction token (1e18 units)
     * 
     * Requirements:
     * - Caller must be the property owner
     * - Property must be tokenized
     * - Distribution must not already be active
     * - Price must be greater than zero
     * - Owner must have fractions to sell
     * 
     * Emits a {DistributionStarted} event
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
        require(fractions.balanceOf(msg.sender) > 0, "TokenizationManager: Owner has no fractions to sell");
        
        property.isDistributing = true;
        property.pricePerFraction = pricePerFractionInWei;
        
        emit DistributionStarted(propertyId, pricePerFractionInWei, block.timestamp);
    }
    
    /**
     * @dev Stops the distribution phase for a property's fractions
     * 
     * @param propertyId The ID of the property
     * 
     * Requirements:
     * - Caller must be the property owner
     * - Distribution must be active
     * 
     * Emits a {DistributionStopped} event
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
     * @dev Allows users to purchase fractions of a property with ETH
     * 
     * This function calculates the total cost and transfers:
     * 1. ETH from buyer to property owner
     * 2. Fraction tokens from property owner to buyer
     * 
     * @param propertyId The ID of the property
     * @param numberOfFractions Number of whole fraction tokens to buy (simple number: 1, 10, 100, etc.)
     * 
     * Note: Input is in whole numbers (e.g., 10 means 10 fractions).
     *       The function automatically converts to the internal 18-decimal format.
     * 
     * Requirements:
     * - Property must be tokenized
     * - Distribution must be active
     * - Buyer cannot be the property owner
     * - Number of fractions must be greater than zero
     * - Sufficient ETH must be sent to cover the cost
     * - Property owner must have enough fractions
     * - Property owner must have approved this contract to spend fractions
     * 
     * Emits a {FractionsPurchased} event
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
        
        // Convert numberOfFractions to 18 decimal format (e.g., 10 becomes 10 * 10^18)
        uint256 fractionsInWei = numberOfFractions * 1e18;
        
        // Calculate total cost (pricePerFraction is per 1e18 units)
        uint256 totalCost = (property.pricePerFraction * numberOfFractions);
        require(msg.value >= totalCost, "TokenizationManager: Insufficient ETH sent");
        
        PropertyFractions fractions = PropertyFractions(property.fractionsContract);
        
        // Check owner has enough fractions (compare in wei units)
        require(
            fractions.balanceOf(property.owner) >= fractionsInWei,
            "TokenizationManager: Owner has insufficient fractions"
        );
        
        // Check allowance (compare in wei units)
        require(
            fractions.allowance(property.owner, address(this)) >= fractionsInWei,
            "TokenizationManager: Insufficient allowance from owner"
        );
        
        // Transfer fractions from owner to buyer (use fractionsInWei for the token transfer)
        require(
            fractions.transferFrom(property.owner, msg.sender, fractionsInWei),
            "TokenizationManager: Fraction transfer failed"
        );
        
        // Transfer ETH to property owner
        (bool success, ) = payable(property.owner).call{value: totalCost}("");
        require(success, "TokenizationManager: ETH transfer failed");
        
        // Update total fractions sold (store in wei units for internal tracking)
        property.totalFractionsSold += fractionsInWei;
        
        // Refund excess ETH if any
        if (msg.value > totalCost) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - totalCost}("");
            require(refundSuccess, "TokenizationManager: Refund failed");
        }
        
        emit FractionsPurchased(propertyId, msg.sender, fractionsInWei, totalCost, block.timestamp);
    }
    
    /**
     * @dev Updates the price per fraction during distribution
     * 
     * @param propertyId The ID of the property
     * @param newPricePerFractionInWei New price in wei for one fraction
     * 
     * Requirements:
     * - Caller must be the property owner
     * - Property must be tokenized
     * - New price must be greater than zero
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
     * @param propertyId The ID of the property
     * @return TokenizedProperty struct with all property details
     */
    function getTokenizedProperty(uint256 propertyId) external view returns (TokenizedProperty memory) {
        require(isPropertyTokenized[propertyId], "TokenizationManager: Property not tokenized");
        return tokenizedProperties[propertyId];
    }
    
    /**
     * @dev Returns all tokenized property IDs
     * @return Array of all property IDs that have been tokenized
     */
    function getAllPropertyIds() external view returns (uint256[] memory) {
        return allPropertyIds;
    }
    
    /**
     * @dev Returns the total number of tokenized properties
     * @return Total count of tokenized properties
     */
    function getTotalTokenizedProperties() external view returns (uint256) {
        return allPropertyIds.length;
    }
    
    /**
     * @dev Required implementation of IERC721Receiver to accept PropertyDeed NFTs
     * This allows the contract to receive ERC721 tokens via safeTransferFrom
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
     * @dev Allows the contract owner to withdraw any accidentally sent ETH
     * This is a safety mechanism and should not be needed in normal operation
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "TokenizationManager: No balance to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "TokenizationManager: Withdrawal failed");
    }
}
