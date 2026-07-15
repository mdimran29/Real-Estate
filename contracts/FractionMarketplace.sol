// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PropertyFractions.sol";
import "./TokenizationManager.sol";

/**
 * @title FractionMarketplace
 * @dev Peer-to-peer secondary market for PropertyFractions tokens.
 *
 * TokenizationManager only supports a one-time primary sale from the
 * original property owner at a fixed price. This contract lets ANY holder
 * of PropertyFractions list some of their tokens for resale at a price of
 * their choosing, and lets any buyer purchase a listing (in full or in
 * part) directly with ETH. A small marketplace fee (in basis points) is
 * taken on each sale and held here for the contract owner to withdraw.
 */
contract FractionMarketplace is Ownable, ReentrancyGuard {
    TokenizationManager public immutable tokenizationManager;

    uint256 public constant MAX_FEE_BPS = 1000; // 10% hard cap
    uint256 public feeBps = 250; // 2.5% default

    struct Listing {
        uint256 propertyId;
        address seller;
        uint256 amount; // remaining fraction amount (wei, 18 decimals)
        uint256 pricePerFraction; // in wei, per whole fraction unit (1e18)
        bool active;
    }

    // listingId => Listing
    mapping(uint256 => Listing) public listings;
    uint256 public nextListingId = 1;

    // propertyId => array of listing ids (including inactive/filled ones)
    mapping(uint256 => uint256[]) private _listingsByProperty;

    uint256 public accruedFees;

    event Listed(
        uint256 indexed listingId,
        uint256 indexed propertyId,
        address indexed seller,
        uint256 amount,
        uint256 pricePerFraction
    );

    event ListingCancelled(uint256 indexed listingId);

    event ListingPurchased(
        uint256 indexed listingId,
        uint256 indexed propertyId,
        address indexed buyer,
        address seller,
        uint256 amount,
        uint256 totalPaid,
        uint256 fee
    );

    event FeeUpdated(uint256 newFeeBps);

    constructor(address _tokenizationManager) Ownable(msg.sender) {
        require(_tokenizationManager != address(0), "FractionMarketplace: Invalid manager address");
        tokenizationManager = TokenizationManager(payable(_tokenizationManager));
    }

    function _getFractionsContract(uint256 propertyId) private view returns (PropertyFractions) {
        TokenizationManager.TokenizedProperty memory property =
            tokenizationManager.getTokenizedProperty(propertyId);
        require(property.fractionsContract != address(0), "FractionMarketplace: No fractions contract");
        return PropertyFractions(property.fractionsContract);
    }

    /**
     * @dev Lists `amount` fractions of `propertyId` for sale at `pricePerFraction`
     * wei per whole fraction unit. Caller must first approve this contract to
     * spend at least `amount` of their PropertyFractions tokens.
     */
    function createListing(
        uint256 propertyId,
        uint256 amount,
        uint256 pricePerFraction
    ) external nonReentrant returns (uint256 listingId) {
        require(amount > 0, "FractionMarketplace: Amount must be greater than zero");
        require(pricePerFraction > 0, "FractionMarketplace: Price must be greater than zero");

        PropertyFractions fractions = _getFractionsContract(propertyId);

        require(fractions.balanceOf(msg.sender) >= amount, "FractionMarketplace: Insufficient balance");
        require(
            fractions.allowance(msg.sender, address(this)) >= amount,
            "FractionMarketplace: Insufficient allowance"
        );

        listingId = nextListingId++;

        listings[listingId] = Listing({
            propertyId: propertyId,
            seller: msg.sender,
            amount: amount,
            pricePerFraction: pricePerFraction,
            active: true
        });

        _listingsByProperty[propertyId].push(listingId);

        emit Listed(listingId, propertyId, msg.sender, amount, pricePerFraction);
    }

    /**
     * @dev Cancels an active listing. Only the seller can cancel.
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "FractionMarketplace: Listing not active");
        require(listing.seller == msg.sender, "FractionMarketplace: Only seller");

        listing.active = false;

        emit ListingCancelled(listingId);
    }

    /**
     * @dev Buys `amount` fractions from a listing. Supports partial fills -
     * the listing stays active with reduced amount if not fully bought out.
     */
    function buyListing(uint256 listingId, uint256 amount) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "FractionMarketplace: Listing not active");
        require(amount > 0 && amount <= listing.amount, "FractionMarketplace: Invalid amount");
        require(msg.sender != listing.seller, "FractionMarketplace: Cannot buy own listing");

        uint256 totalCost = (listing.pricePerFraction * amount) / 1e18;
        require(msg.value >= totalCost, "FractionMarketplace: Insufficient ETH sent");

        PropertyFractions fractions = _getFractionsContract(listing.propertyId);

        require(
            fractions.allowance(listing.seller, address(this)) >= amount,
            "FractionMarketplace: Seller allowance revoked"
        );
        require(fractions.balanceOf(listing.seller) >= amount, "FractionMarketplace: Seller balance too low");

        uint256 fee = (totalCost * feeBps) / 10000;
        uint256 sellerProceeds = totalCost - fee;

        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.active = false;
        }

        accruedFees += fee;

        require(
            fractions.transferFrom(listing.seller, msg.sender, amount),
            "FractionMarketplace: Fraction transfer failed"
        );

        (bool success, ) = payable(listing.seller).call{value: sellerProceeds}("");
        require(success, "FractionMarketplace: Seller payment failed");

        if (msg.value > totalCost) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - totalCost}("");
            require(refundSuccess, "FractionMarketplace: Refund failed");
        }

        emit ListingPurchased(
            listingId,
            listing.propertyId,
            msg.sender,
            listing.seller,
            amount,
            totalCost,
            fee
        );
    }

    function getListingsByProperty(uint256 propertyId) external view returns (uint256[] memory) {
        return _listingsByProperty[propertyId];
    }

    function setFeeBps(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "FractionMarketplace: Fee too high");
        feeBps = newFeeBps;
        emit FeeUpdated(newFeeBps);
    }

    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = accruedFees;
        require(amount > 0, "FractionMarketplace: No fees to withdraw");
        accruedFees = 0;

        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "FractionMarketplace: Withdrawal failed");
    }
}
