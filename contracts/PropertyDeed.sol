// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PropertyDeed
 * @dev ERC-721 compliant smart contract representing legal deeds of properties.
 * 
 * This contract manages unique property deeds as Non-Fungible Tokens (NFTs).
 * Each token represents one unique real estate property and contains metadata
 * about the property's address and details.
 * 
 * Key Features:
 * - Only the contract owner (typically the TokenizationManager) can mint new deeds
 * - Each deed is uniquely identified by a token ID
 * - Deeds can be transferred between addresses
 * - Property metadata is stored on-chain for transparency
 * 
 * Security Considerations:
 * - Uses OpenZeppelin's battle-tested ERC721 implementation
 * - Access control via Ownable pattern ensures only authorized minting
 * - Simple counter prevents token ID collisions
 */
contract PropertyDeed is ERC721, Ownable {
    
    // Counter to track the next token ID to be minted
    // Starts at 1 (0 is typically reserved as invalid/null)
    uint256 private _nextTokenId = 1;
    
    /**
     * @dev Structure to store property information
     * @param propertyAddress Physical address of the property
     * @param metadataURI URI pointing to additional property metadata (e.g., IPFS link)
     * @param creationTimestamp When the property deed was minted
     */
    struct PropertyInfo {
        string propertyAddress;
        string metadataURI;
        uint256 creationTimestamp;
    }
    
    // Mapping from token ID to property information
    mapping(uint256 => PropertyInfo) private _propertyInfo;
    
    /**
     * @dev Emitted when a new property deed is minted
     * @param tokenId The unique identifier of the minted deed
     * @param owner The address that received the deed
     * @param propertyAddress The physical address of the property
     */
    event PropertyMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string propertyAddress
    );
    
    /**
     * @dev Constructor initializes the ERC721 token with name and symbol
     * Sets the deployer as the initial owner
     */
    constructor() ERC721("PropertyDeed", "DEED") Ownable(msg.sender) {
        // Token IDs start at 1 (already initialized)
    }
    
    /**
     * @dev Mints a new property deed NFT
     * 
     * This function can only be called by the contract owner (TokenizationManager).
     * It creates a new unique token and assigns it to the specified address.
     * 
     * @param to The address that will receive the newly minted deed
     * @param propertyAddress The physical address of the property
     * @param metadataURI URI pointing to additional property metadata
     * @return tokenId The ID of the newly minted token
     * 
     * Requirements:
     * - Caller must be the contract owner
     * - `to` address cannot be the zero address
     * - `propertyAddress` cannot be empty
     * 
     * Emits a {PropertyMinted} event
     */
    function mintPropertyDeed(
        address to,
        string memory propertyAddress,
        string memory metadataURI
    ) external onlyOwner returns (uint256) {
        // Validate input parameters
        require(to != address(0), "PropertyDeed: Cannot mint to zero address");
        require(bytes(propertyAddress).length > 0, "PropertyDeed: Property address cannot be empty");
        
        // Get the current token ID and increment for next use
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        
        // Mint the NFT to the specified address
        _safeMint(to, tokenId);
        
        // Store property information
        _propertyInfo[tokenId] = PropertyInfo({
            propertyAddress: propertyAddress,
            metadataURI: metadataURI,
            creationTimestamp: block.timestamp
        });
        
        // Emit event for off-chain tracking
        emit PropertyMinted(tokenId, to, propertyAddress);
        
        return tokenId;
    }
    
    /**
     * @dev Returns property information for a given token ID
     * @param tokenId The ID of the property deed token
     * @return PropertyInfo struct containing property details
     * 
     * Requirements:
     * - Token must exist
     */
    function getPropertyInfo(uint256 tokenId) external view returns (PropertyInfo memory) {
        require(_ownerOf(tokenId) != address(0), "PropertyDeed: Property does not exist");
        return _propertyInfo[tokenId];
    }
    
    /**
     * @dev Returns the total number of properties that have been minted
     * @return The total count of minted property deeds
     */
    function totalSupply() external view returns (uint256) {
        // Subtract 1 because counter starts at 1
        return _nextTokenId - 1;
    }
    
    /**
     * @dev Override of tokenURI to return property-specific metadata
     * @param tokenId The ID of the property deed token
     * @return The metadata URI for the property
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "PropertyDeed: URI query for nonexistent token");
        return _propertyInfo[tokenId].metadataURI;
    }
}
