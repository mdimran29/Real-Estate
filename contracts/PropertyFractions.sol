// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PropertyFractions
 * @dev ERC-20 compliant smart contract representing fractional ownership shares of a single property.
 * 
 * This contract represents divisible shares of ownership in a specific real estate property.
 * Each instance of this contract is linked to a unique PropertyDeed NFT and represents
 * the fractional ownership rights to that property.
 * 
 * Key Features:
 * - Each contract instance represents fractions of ONE specific property
 * - Fixed total supply minted at creation (default: 1,000,000 tokens)
 * - Linked to a specific PropertyDeed NFT via property ID
 * - Only the TokenizationManager can mint the initial supply
 * - Standard ERC-20 functionality for transfers and approvals
 * 
 * Security Considerations:
 * - Uses OpenZeppelin's battle-tested ERC20 implementation
 * - Single mint operation at deployment prevents inflation
 * - Immutable property ID ensures permanent link to PropertyDeed
 * - Access control prevents unauthorized minting
 */
contract PropertyFractions is ERC20, Ownable {
    
    // The ID of the PropertyDeed NFT that this contract represents fractions of
    // This is immutable and set at deployment, creating a permanent link
    uint256 public immutable propertyId;
    
    // Address of the TokenizationManager contract that deployed this contract
    address public immutable tokenizationManager;
    
    // Flag to ensure minting happens only once
    bool private _initialMintComplete;
    
    // Fixed total supply of fractions (1 million tokens with 18 decimals)
    uint256 public constant TOTAL_FRACTIONS = 1_000_000 * 10**18;
    
    /**
     * @dev Emitted when the initial supply of fractions is minted
     * @param propertyId The ID of the property these fractions represent
     * @param initialOwner The address that received all initial fractions
     * @param amount The total amount of fractions minted
     */
    event FractionsMinted(
        uint256 indexed propertyId,
        address indexed initialOwner,
        uint256 amount
    );
    
    /**
     * @dev Constructor initializes the ERC20 token for a specific property
     * 
     * @param _propertyId The ID of the PropertyDeed NFT this contract represents
     * @param _tokenizationManager Address of the TokenizationManager contract
     * 
     * The token name and symbol are derived from the property ID for uniqueness.
     * Example: Property ID 1 → "Property Fraction 1" (PROP1)
     */
    constructor(
        uint256 _propertyId,
        address _tokenizationManager
    ) ERC20(
        string(abi.encodePacked("Property Fraction ", _uint2str(_propertyId))),
        string(abi.encodePacked("PROP", _uint2str(_propertyId)))
    ) Ownable(_tokenizationManager) {
        require(_tokenizationManager != address(0), "PropertyFractions: Invalid manager address");
        
        propertyId = _propertyId;
        tokenizationManager = _tokenizationManager;
        _initialMintComplete = false;
    }
    
    /**
     * @dev Mints the total supply of fractions to the initial owner
     * 
     * This function can only be called once by the TokenizationManager.
     * It mints the entire fixed supply of 1,000,000 tokens to the property owner.
     * After this initial mint, no more tokens can ever be created.
     * 
     * @param initialOwner The address that will receive all fractions (property deed owner)
     * 
     * Requirements:
     * - Can only be called by the contract owner (TokenizationManager)
     * - Can only be called once
     * - `initialOwner` cannot be the zero address
     * 
     * Emits a {FractionsMinted} event
     */
    function mintInitialSupply(address initialOwner) external onlyOwner {
        require(!_initialMintComplete, "PropertyFractions: Initial mint already completed");
        require(initialOwner != address(0), "PropertyFractions: Cannot mint to zero address");
        
        _initialMintComplete = true;
        
        // Mint the entire fixed supply to the initial owner
        _mint(initialOwner, TOTAL_FRACTIONS);
        
        emit FractionsMinted(propertyId, initialOwner, TOTAL_FRACTIONS);
    }
    
    /**
     * @dev Returns whether the initial mint has been completed
     * @return bool True if initial supply has been minted, false otherwise
     */
    function isInitialMintComplete() external view returns (bool) {
        return _initialMintComplete;
    }
    
    /**
     * @dev Returns detailed information about this fractional ownership contract
     * @return _propertyId The property ID these fractions represent
     * @return _totalSupply The total supply of fraction tokens
     * @return _tokenizationManager The address of the TokenizationManager
     * @return _mintComplete Whether the initial mint is complete
     */
    function getFractionInfo() external view returns (
        uint256 _propertyId,
        uint256 _totalSupply,
        address _tokenizationManager,
        bool _mintComplete
    ) {
        return (
            propertyId,
            totalSupply(),
            tokenizationManager,
            _initialMintComplete
        );
    }
    
    /**
     * @dev Internal helper function to convert uint256 to string
     * Used for generating unique token names and symbols
     * @param value The number to convert
     * @return The string representation of the number
     */
    function _uint2str(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        
        uint256 temp = value;
        uint256 digits;
        
        // Count the number of digits
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        // Create byte array and populate with digits
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
}
