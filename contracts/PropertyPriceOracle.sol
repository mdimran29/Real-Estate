// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title PropertyPriceOracle
 * @dev Reads the ETH/USD Chainlink price feed and exposes helpers to convert
 * wei-denominated fraction prices into USD, so the frontend can show
 * property/fraction values in USD instead of only ETH.
 *
 * This contract does not hold funds or gate any purchase - it is a pure
 * read-only pricing helper that TokenizationManager/FractionMarketplace
 * prices can be converted through off-chain (via the frontend) or on-chain
 * by any consumer contract.
 */
contract PropertyPriceOracle {
    AggregatorV3Interface public immutable priceFeed;

    /**
     * @param _priceFeedAddress Chainlink ETH/USD aggregator address for the
     * target network (e.g. Sepolia ETH/USD feed).
     */
    constructor(address _priceFeedAddress) {
        require(_priceFeedAddress != address(0), "PropertyPriceOracle: Invalid feed address");
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
    }

    /**
     * @dev Returns the latest ETH/USD price and the feed's decimals.
     * Chainlink ETH/USD feeds are typically 8 decimals (e.g. 300000000000 = $3,000.00000000).
     */
    function getLatestPrice() public view returns (int256 price, uint8 decimals) {
        (, int256 answer, , uint256 updatedAt, ) = priceFeed.latestRoundData();
        require(answer > 0, "PropertyPriceOracle: Invalid price from feed");
        require(updatedAt > 0, "PropertyPriceOracle: Round not complete");

        price = answer;
        decimals = priceFeed.decimals();
    }

    /**
     * @dev Converts a wei amount (18 decimals) into a USD amount scaled to
     * 18 decimals, using the latest ETH/USD price.
     */
    function weiToUsd(uint256 weiAmount) external view returns (uint256 usdAmount18Decimals) {
        (int256 price, uint8 feedDecimals) = getLatestPrice();

        // usd = weiAmount * price / 10^feedDecimals, kept in 18-decimal precision throughout
        usdAmount18Decimals = (weiAmount * uint256(price)) / (10 ** feedDecimals);
    }

    /**
     * @dev Convenience view returning the property fraction price (wei per
     * fraction) converted to USD (18 decimals) for frontend display.
     */
    function fractionPriceInUsd(uint256 pricePerFractionInWei) external view returns (uint256) {
        (int256 price, uint8 feedDecimals) = getLatestPrice();
        return (pricePerFractionInWei * uint256(price)) / (10 ** feedDecimals);
    }
}
