// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Re-export Chainlink's official test mock so Hardhat compiles it locally.
// Used only by the PropertyPriceOracle test suite - never deployed to a
// real network (real deployments point at the live Chainlink ETH/USD feed).
import "@chainlink/contracts/src/v0.8/shared/mocks/MockV3Aggregator.sol";
