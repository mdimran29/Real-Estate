# Tier 1 Features — Implementation Summary

This documents the first batch of feature work added on top of the existing
PropToken contracts (`PropertyDeed`, `PropertyFractions`, `TokenizationManager`).
Scope and rationale for this batch are in the project's feature/blockchain
roadmap recommendations; this file covers what was actually built, what was
verified, and what's still open.

## What was built

### 1. `contracts/RentalIncomeDistribution.sol`
Lets a property owner deposit rental income (ETH) for a tokenized property,
and lets `PropertyFractions` holders claim their pro-rata share.

- Pull-payment model: owner calls `depositRentalIncome(propertyId)` with ETH
  attached, which opens a new "period" priced at
  `payoutPerFraction = msg.value / totalSupply`.
- Holders call `claimRentalIncome(propertyId, periodIndex)` or
  `claimAllRentalIncome(propertyId)` to pull their share, based on their
  **current** fraction balance at claim time (not a historical snapshot).
- Each `(property, holder, period)` claim is tracked to prevent double-claims.
- `getClaimableAmount(propertyId, holder)` is a view helper for the frontend
  to show an aggregate "unclaimed rental income" figure.

Known simplification: because claims use current balance rather than a
balance snapshot at deposit time, a holder who buys fractions *after* a
period is deposited can still claim that period if they act before the
original holder does. This is acceptable for a demo/portfolio project; a
production version would snapshot balances via `ERC20Votes`/`ERC20Snapshot`.

### 2. `contracts/FractionMarketplace.sol`
Peer-to-peer secondary market for `PropertyFractions`. Previously, fractions
could only move via the primary sale (`TokenizationManager.buyFractions`,
one-time, from the original owner) or a bare ERC-20 `transfer`. Now any
holder can resell at a price of their choosing.

- `createListing(propertyId, amount, pricePerFraction)` — seller must first
  `approve` the marketplace contract.
- `buyListing(listingId, amount)` — supports partial fills; listing stays
  active with reduced amount until fully bought out or cancelled.
- `cancelListing(listingId)` — seller-only.
- A configurable marketplace fee (default 2.5%, hard-capped at 10% via
  `MAX_FEE_BPS`) accrues in-contract and is withdrawable by the owner via
  `withdrawFees()`.
- Excess ETH sent to `buyListing` is refunded automatically.

### 3. `contracts/PropertyPriceOracle.sol`
Reads a Chainlink `AggregatorV3Interface` ETH/USD feed and exposes
`weiToUsd()` / `fractionPriceInUsd()` helpers so the frontend can display
property and fraction prices in USD instead of only ETH. Read-only — it
doesn't gate or hold funds.

## Tests

- `test/RentalIncomeDistribution.test.js` — 15 tests (deposits, claims,
  double-claim rejection, multi-period `claimAllRentalIncome`, access control).
- `test/FractionMarketplace.test.js` — 20 tests (listing creation/cancellation,
  full and partial buys, fee accounting, refunds, access control).
- `test/PropertyPriceOracle.test.js` — 8 tests, using Chainlink's own
  `MockV3Aggregator` (re-exported via `contracts/test/MockV3Aggregator.sol`
  so Hardhat compiles it) instead of a live feed.
- **38/38 new tests pass.** `npx hardhat compile` succeeds with 30 Solidity
  files. The pre-existing 18 `TokenizationManager.test.js` failures on `main`
  are unrelated to this work — confirmed by stashing these changes and
  re-running the original test suite, which fails identically.

## Deployment

- `scripts/deploy-tier1-features.js` — deploys `RentalIncomeDistribution`,
  `FractionMarketplace`, and (on networks with a known Chainlink feed)
  `PropertyPriceOracle`, all pointed at an already-deployed
  `TokenizationManager`. It does not redeploy or modify the existing
  manager/deed/fractions contracts.
- Reads the target `TokenizationManager` address from
  `TOKENIZATION_MANAGER_ADDRESS` env var, falling back to
  `deployment-info.json`.
- Ships with known Sepolia/mainnet Chainlink ETH/USD feed addresses baked in;
  skips oracle deployment on networks without one (e.g. local Hardhat).
- Writes results to `deployment-info-tier1.json` (separate from the existing
  `deployment-info.json` to avoid clobbering the live Sepolia record).
- New npm scripts: `npm run deploy:tier1:local`, `npm run deploy:tier1:sepolia`.
- Verified end-to-end against a local Hardhat node first, then **deployed live
  to Sepolia**:
  - `RentalIncomeDistribution`: `0x9f0AcC57EE05a6319D005E89041BBB60621bFe21`
  - `FractionMarketplace`: `0x886EDbdE49120d86aCAAfA6472EA63E0466532D7`
  - `PropertyPriceOracle`: `0xe50C6762b6B0A12052D460507E54Efb19957c30a`
    (wired to Sepolia's Chainlink ETH/USD feed at
    `0x694AA1769357215DE4FAC081bf1f309aDC325306`)
  - All pointed at the existing live `TokenizationManager` at
    `0xcE5938311925624E9FE619cc493AF5eA16bc46E2`.
  - **Not yet verified on Etherscan** — run the `npx hardhat verify` commands
    the deploy script prints out when convenient.

## Frontend

All four frontend items from the original scope are now implemented:

1. **WalletConnect fix** (`frontend/src/contexts/Web3Context.jsx`,
   `frontend/src/components/WalletModal.jsx`) — replaced the "coming soon"
   stub with a real `@walletconnect/ethereum-provider` integration. The
   `Web3Context` API surface (`account`, `provider`, `signer`, `network`,
   `connectWallet`, etc.) was kept identical so no other component needed
   changes. Requires `VITE_WALLETCONNECT_PROJECT_ID` (free from
   https://cloud.reown.com) — without it, the UI honestly shows "Not
   configured" instead of silently failing. Injected wallets (MetaMask,
   Coinbase, Trust) are unaffected.
2. **Rental income UI** (`frontend/src/components/RentalIncome.jsx`, wired
   into `Portfolio.jsx`) — fraction holders see and claim unclaimed rental
   income per property; property owners get a deposit form.
3. **Secondary marketplace UI** — listing/cancelling in
   `Portfolio.jsx` (inline forms next to the existing Transfer button) plus
   `frontend/src/components/MyListings.jsx` for viewing/cancelling your own
   listings, and `frontend/src/components/SecondaryMarket.jsx` (wired into
   `Marketplace.jsx`) for browsing and buying other holders' listings.
4. **USD price display** (`frontend/src/components/PropertyCard.jsx`) — shows
   `(~$X.XX)` next to the ETH price per fraction when the oracle is deployed
   on the current network.

All three new contracts degrade gracefully via
`isFeatureAvailable('CONTRACT_NAME')` in `utils/contracts.js` — if an address
isn't set for the current network, the corresponding UI section simply
doesn't render, rather than crashing.

New frontend dependency: `@walletconnect/ethereum-provider`.

### Frontend verification performed

- `npx vite build` succeeds with the new dependencies and live Sepolia
  addresses wired in.
- Headless Chromium (Playwright) click-through of every tab (Marketplace,
  Tokenize Property, Buy Fractions, My Portfolio, About Us) with **zero
  console errors**, both before and after wiring in the real Sepolia
  addresses.
- Opened the wallet modal and clicked the WalletConnect option: confirmed it
  no longer shows the old stub message, and correctly reports "not
  configured" (no `VITE_WALLETCONNECT_PROJECT_ID` set locally) via the
  existing toast system instead of crashing.
- **Not performed**: a full wallet-connected walkthrough (actually claiming
  rental income, creating/buying a listing, connecting via a real
  MetaMask/WalletConnect session) — headless browser automation can't
  approve wallet popups. This still needs a manual pass with a real wallet
  and Sepolia test funds before considering the feature production-ready.

## Still open

- **Etherscan verification** for the 3 new Sepolia contracts (commands are
  printed by the deploy script; skipped in this pass).
- **Manual wallet-connected QA** per the note above.
- A **`VITE_WALLETCONNECT_PROJECT_ID`** needs to be obtained and set for
  WalletConnect to actually work end-to-end (currently unset locally).
