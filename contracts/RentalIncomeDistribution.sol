// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PropertyFractions.sol";
import "./TokenizationManager.sol";

/**
 * @title RentalIncomeDistribution
 * @dev Lets a property owner deposit rental income (in ETH) for a tokenized
 * property, and lets PropertyFractions holders claim their pro-rata share.
 *
 * Distribution model: pull-payment, snapshot-based.
 * - The property owner calls depositRentalIncome(propertyId) with ETH attached.
 *   This opens a new "period" and snapshots the fractions total supply at that
 *   moment (the fixed supply never changes after initial mint, so this is
 *   just a sanity check, not a real snapshot mechanism).
 * - Each period's payout-per-fraction is fixed at deposit time:
 *   payoutPerFraction = msg.value / totalSupply
 * - A holder's claimable amount for a period is based on their CURRENT balance
 *   at claim time. This is intentionally simple (no ERC20Votes/Snapshot
 *   dependency) and is safe against double-claiming because each (period,
 *   holder) claim is tracked, but it means a holder who buys fractions after
 *   a period was deposited can also claim that period if they haven't yet -
 *   acceptable for a demo distribution mechanism, not intended for
 *   high-frequency secondary trading.
 */
contract RentalIncomeDistribution is Ownable, ReentrancyGuard {
    TokenizationManager public immutable tokenizationManager;

    struct RentalPeriod {
        uint256 totalDeposited;
        uint256 payoutPerFraction; // scaled by 1e18 (fraction decimals)
        uint256 timestamp;
    }

    // propertyId => array of rental periods
    mapping(uint256 => RentalPeriod[]) private _rentalPeriods;

    // propertyId => holder => period index => claimed
    mapping(uint256 => mapping(address => mapping(uint256 => bool))) private _claimed;

    event RentalIncomeDeposited(
        uint256 indexed propertyId,
        uint256 indexed periodIndex,
        uint256 amount,
        uint256 payoutPerFraction,
        uint256 timestamp
    );

    event RentalIncomeClaimed(
        uint256 indexed propertyId,
        uint256 indexed periodIndex,
        address indexed holder,
        uint256 amount
    );

    constructor(address _tokenizationManager) Ownable(msg.sender) {
        require(_tokenizationManager != address(0), "RentalIncomeDistribution: Invalid manager address");
        tokenizationManager = TokenizationManager(payable(_tokenizationManager));
    }

    /**
     * @dev Property owner deposits rental income for a property they own.
     * Opens a new rental period priced against the fraction contract's fixed
     * total supply.
     */
    function depositRentalIncome(uint256 propertyId) external payable nonReentrant {
        require(msg.value > 0, "RentalIncomeDistribution: No ETH sent");

        TokenizationManager.TokenizedProperty memory property =
            tokenizationManager.getTokenizedProperty(propertyId);

        require(msg.sender == property.owner, "RentalIncomeDistribution: Only property owner");
        require(property.fractionsContract != address(0), "RentalIncomeDistribution: No fractions contract");

        PropertyFractions fractions = PropertyFractions(property.fractionsContract);
        uint256 totalSupply = fractions.totalSupply();
        require(totalSupply > 0, "RentalIncomeDistribution: Zero fraction supply");

        uint256 payoutPerFraction = (msg.value * 1e18) / totalSupply;

        _rentalPeriods[propertyId].push(RentalPeriod({
            totalDeposited: msg.value,
            payoutPerFraction: payoutPerFraction,
            timestamp: block.timestamp
        }));

        uint256 periodIndex = _rentalPeriods[propertyId].length - 1;

        emit RentalIncomeDeposited(propertyId, periodIndex, msg.value, payoutPerFraction, block.timestamp);
    }

    /**
     * @dev Claim the caller's share of a specific rental period, based on
     * their current fraction balance for that property.
     */
    function claimRentalIncome(uint256 propertyId, uint256 periodIndex) external nonReentrant {
        uint256 amount = _claimInternal(propertyId, periodIndex, msg.sender);
        require(amount > 0, "RentalIncomeDistribution: Nothing to claim");

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "RentalIncomeDistribution: Transfer failed");
    }

    /**
     * @dev Claim across every unclaimed period for a property in one transaction.
     */
    function claimAllRentalIncome(uint256 propertyId) external nonReentrant {
        uint256 periodCount = _rentalPeriods[propertyId].length;
        uint256 totalAmount = 0;

        for (uint256 i = 0; i < periodCount; i++) {
            totalAmount += _claimInternal(propertyId, i, msg.sender);
        }

        require(totalAmount > 0, "RentalIncomeDistribution: Nothing to claim");

        (bool success, ) = payable(msg.sender).call{value: totalAmount}("");
        require(success, "RentalIncomeDistribution: Transfer failed");
    }

    function _claimInternal(uint256 propertyId, uint256 periodIndex, address holder) private returns (uint256) {
        require(periodIndex < _rentalPeriods[propertyId].length, "RentalIncomeDistribution: Invalid period");

        if (_claimed[propertyId][holder][periodIndex]) {
            return 0;
        }

        TokenizationManager.TokenizedProperty memory property =
            tokenizationManager.getTokenizedProperty(propertyId);
        PropertyFractions fractions = PropertyFractions(property.fractionsContract);
        uint256 holderBalance = fractions.balanceOf(holder);

        if (holderBalance == 0) {
            return 0;
        }

        RentalPeriod memory period = _rentalPeriods[propertyId][periodIndex];
        uint256 amount = (holderBalance * period.payoutPerFraction) / 1e18;

        if (amount == 0) {
            return 0;
        }

        _claimed[propertyId][holder][periodIndex] = true;

        emit RentalIncomeClaimed(propertyId, periodIndex, holder, amount);

        return amount;
    }

    function getRentalPeriodCount(uint256 propertyId) external view returns (uint256) {
        return _rentalPeriods[propertyId].length;
    }

    function getRentalPeriod(uint256 propertyId, uint256 periodIndex) external view returns (RentalPeriod memory) {
        require(periodIndex < _rentalPeriods[propertyId].length, "RentalIncomeDistribution: Invalid period");
        return _rentalPeriods[propertyId][periodIndex];
    }

    function isClaimed(uint256 propertyId, address holder, uint256 periodIndex) external view returns (bool) {
        return _claimed[propertyId][holder][periodIndex];
    }

    /**
     * @dev Returns the total claimable amount across all periods for a holder.
     */
    function getClaimableAmount(uint256 propertyId, address holder) external view returns (uint256) {
        uint256 periodCount = _rentalPeriods[propertyId].length;
        if (periodCount == 0) return 0;

        TokenizationManager.TokenizedProperty memory property =
            tokenizationManager.getTokenizedProperty(propertyId);

        if (property.fractionsContract == address(0)) return 0;

        PropertyFractions fractions = PropertyFractions(property.fractionsContract);
        uint256 holderBalance = fractions.balanceOf(holder);
        if (holderBalance == 0) return 0;

        uint256 totalClaimable = 0;
        for (uint256 i = 0; i < periodCount; i++) {
            if (!_claimed[propertyId][holder][i]) {
                totalClaimable += (holderBalance * _rentalPeriods[propertyId][i].payoutPerFraction) / 1e18;
            }
        }

        return totalClaimable;
    }

    receive() external payable {}
}
