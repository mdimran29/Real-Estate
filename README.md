# PropToken - Real Estate Tokenization System

A comprehensive blockchain-based solution for tokenizing real estate properties into fractional ownership shares, enabling democratized property investment through NFTs and fungible tokens.

## 🎯 Project Overview

PropToken is a smart contract system that transforms real estate properties into tradeable digital assets. The system uses ERC-721 NFTs to represent property deeds and ERC-20 tokens for fractional ownership shares, allowing multiple investors to own portions of a single property.

## 📋 Table of Contents

- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Usage Guide](#usage-guide)
- [Security](#security)

## 🏗️ Architecture

The system consists of three main smart contracts that work together:

### 1. PropertyDeed.sol (ERC-721)
The master contract representing legal property ownership. Each NFT minted represents one unique property.

**Key Features:**
- ERC-721 compliant NFT implementation
- Only contract owner can mint new property deeds
- Stores metadata for each property
- Integrated with TokenizationManager for locking mechanism

**Architectural Decision:** We chose ERC-721 because each property is unique and non-fungible. The locking mechanism ensures that once a property is fractionalized, the master deed cannot be transferred until all fractions are consolidated.

### 2. PropertyFractions.sol (ERC-20)
Represents fractional ownership shares of a specific property.

**Key Features:**
- ERC-20 compliant fungible token
- Fixed supply of 1,000,000 tokens per property
- Each contract instance is linked to a specific PropertyDeed NFT
- Tokens are initially minted to the property owner
- Standard transfer and approval mechanisms

**Architectural Decision:** ERC-20 provides the perfect standard for fractional shares since all fractions of the same property are interchangeable. The fixed supply ensures clear ownership percentages (1 token = 0.0001% of property).

### 3. TokenizationManager.sol (Core Orchestrator)
The main contract coordinating the entire tokenization process.

**Key Features:**
- Orchestrates property tokenization workflow
- Manages PropertyDeed NFT locking
- Facilitates fraction distribution and trading
- Handles price setting and fraction sales
- Prevents owner from buying own fractions

**Architectural Decision:** The manager pattern centralizes complex logic and provides a single entry point for all tokenization operations. This improves security, maintainability, and upgradability.

### Contract Interaction Flow

```
1. Tokenization:
   User → TokenizationManager.tokenizeProperty()
   ├─→ Mints PropertyDeed NFT
   ├─→ Deploys new PropertyFractions contract
   ├─→ Mints 1M fractions to property owner
   └─→ Locks NFT in TokenizationManager

2. Distribution:
   Owner → TokenizationManager.startDistribution(propertyId, price)
   ├─→ Sets price per fraction
   ├─→ Owner approves fractions to manager
   └─→ Opens property for public sale

3. Purchase:
   Buyer → TokenizationManager.buyFractions(propertyId, amount)
   ├─→ Sends ETH payment
   ├─→ Receives fractions from owner
   └─→ ETH transferred to property owner
```

## 📜 Smart Contracts

### TokenizationManager.sol

**Main Functions:**

```solidity
// Tokenize a new property
function tokenizeProperty(
    string memory propertyAddress,
    string memory metadataURI
) external returns (uint256 propertyId, address fractionsContract)

// Start fraction distribution
function startDistribution(
    uint256 propertyId,
    uint256 pricePerFraction
) external

// Stop fraction distribution
function stopDistribution(uint256 propertyId) external

// Buy fractions (simplified interface)
function buyFractions(
    uint256 propertyId,
    uint256 numberOfFractions
) external payable

// Sell fractions back
function sellFractions(
    uint256 propertyId,
    uint256 numberOfFractions
) external

// Get property details
function getTokenizedProperty(uint256 propertyId)
    external view returns (TokenizedProperty memory)
```

### PropertyDeed.sol

**Main Functions:**

```solidity
// Mint new property NFT (owner only)
function safeMint(address to, string memory uri)
    external onlyOwner returns (uint256)

// Standard ERC-721 functions
function tokenURI(uint256 tokenId) public view returns (string memory)
function ownerOf(uint256 tokenId) public view returns (address)
function transferFrom(address from, address to, uint256 tokenId) public
```

### PropertyFractions.sol

**Main Functions:**

```solidity
// Standard ERC-20 functions
function balanceOf(address account) public view returns (uint256)
function transfer(address to, uint256 amount) public returns (bool)
function approve(address spender, uint256 amount) public returns (bool)
function transferFrom(address from, address to, uint256 amount) public returns (bool)
```

## ✨ Features

### Core Functionality
- ✅ **Property Tokenization**: Convert real estate into NFTs
- ✅ **Fractional Ownership**: Divide properties into 1,000,000 tradeable shares
- ✅ **NFT Locking**: Secure master deed while fractions circulate
- ✅ **Price Setting**: Property owners control fraction pricing
- ✅ **Public Sale**: Open market for buying/selling fractions
- ✅ **User-Friendly Interface**: Simple numbers instead of 18 decimals
- ✅ **Access Control**: Owner-only functions protected
- ✅ **Event Emissions**: Complete audit trail

### Security Features
- ✅ **OpenZeppelin Integration**: Battle-tested contract libraries
- ✅ **Reentrancy Protection**: Guards against reentrancy attacks
- ✅ **Ownable Pattern**: Controlled administrative access
- ✅ **Input Validation**: Comprehensive checks on all functions
- ✅ **Safe Math**: Overflow/underflow protection (Solidity 0.8+)

### User Experience
- ✅ **Simplified Interface**: Enter "10" instead of "10000000000000000000"
- ✅ **Clear Error Messages**: Descriptive revert reasons
- ✅ **Gas Optimized**: Efficient code patterns
- ✅ **Event Tracking**: Monitor all transactions

## 🛠️ Technology Stack

- **Solidity**: ^0.8.20
- **Hardhat**: ^2.22.0
- **OpenZeppelin Contracts**: ^5.4.0
- **Ethers.js**: ^6.0.0
- **Chai**: ^4.3.10
- **Mocha**: Testing framework
- **Hardhat Etherscan**: Contract verification

## 📥 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm (v7 or higher)
- Git

### Step-by-Step Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd Real_Estate
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

4. **Verify installation**
```bash
npx hardhat --version
```

## 🧪 Testing

The project includes a comprehensive test suite with 77 tests covering all functionality.

### Run All Tests
```bash
npx hardhat test
```

### Run Tests with Gas Reporting
```bash
REPORT_GAS=true npx hardhat test
```

### Test Coverage
```bash
npx hardhat coverage
```

### Test Structure

```
test/
├── TokenizationManager.test.js (77 tests)
    ├── Deployment (2 tests)
    ├── Property Tokenization (8 tests)
    ├── Distribution Management (8 tests)
    ├── Buying Fractions (15 tests)
    ├── Selling Fractions (12 tests)
    ├── Edge Cases (12 tests)
    ├── Access Control (10 tests)
    └── Integration Tests (10 tests)
```

### Test Results
```
✅ 77 passing tests
✅ 0 failing tests
✅ 100% success rate
✅ Gas usage optimized
```

## 🚀 Deployment

### Local Network (Hardhat)

1. **Start local node**
```bash
npx hardhat node
```

2. **Deploy contracts**
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Sepolia Testnet

1. **Get Sepolia ETH**
   - Visit [Sepolia Faucet](https://sepoliafaucet.com/)
   - Get test ETH for your wallet

2. **Deploy to Sepolia**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

3. **Verify contracts**
```bash
npx hardhat verify --network sepolia <TOKENIZATION_MANAGER_ADDRESS>
npx hardhat verify --network sepolia <PROPERTY_DEED_ADDRESS>
```

### Current Deployment (Sepolia)

**Latest Deployment:**
- **TokenizationManager**: `0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3`
- **PropertyDeed**: `0xbD88BDF7cB52f972DE2727A7584e38704045eb4C`
- **PropertyFractions #1**: `0xD9ac7da67BB998744e43EdA383dC5E7f2860FBf0` (123 Luxury Ave, Dubai Marina)
- **Network**: Sepolia Testnet
- **Verified**: ✅ Yes

**View on Etherscan:**
- [TokenizationManager](https://sepolia.etherscan.io/address/0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3#code)
- [PropertyDeed](https://sepolia.etherscan.io/address/0xbD88BDF7cB52f972DE2727A7584e38704045eb4C#code)
- [PropertyFractions #1](https://sepolia.etherscan.io/address/0xD9ac7da67BB998744e43EdA383dC5E7f2860FBf0)
- [NFT Transfers Tab](https://sepolia.etherscan.io/address/0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3#nfttransfers)

## 📖 Usage Guide

### For Property Owners

#### 1. Tokenize Your Property

```javascript
// Call tokenizeProperty on TokenizationManager
tokenizationManager.tokenizeProperty(
    "123 Main Street, Dubai Marina",  // propertyAddress
    "ipfs://QmPropertyMetadata"        // metadataURI
);
```

**What happens:**
- PropertyDeed NFT minted and locked in TokenizationManager
- PropertyFractions contract deployed
- 1,000,000 fractions minted to your wallet
- Property ready for distribution

#### 2. Start Distribution

```javascript
// Set price and open for sale
tokenizationManager.startDistribution(
    1,                        // propertyId
    ethers.parseEther("0.001") // 0.001 ETH per fraction
);

// Approve fractions for sale
fractionsContract.approve(
    tokenizationManagerAddress,
    ethers.parseEther("1000000")  // 1M fractions
);
```

#### 3. Stop Distribution (Optional)

```javascript
tokenizationManager.stopDistribution(1);
```

### For Buyers

#### 1. Check Property Details

```javascript
const property = await tokenizationManager.getTokenizedProperty(1);
console.log("Price per fraction:", property.pricePerFraction);
console.log("Is distributing:", property.isDistributing);
```

#### 2. Buy Fractions

**On Etherscan:**
1. Go to TokenizationManager contract
2. Connect your wallet
3. Find `buyFractions` function
4. Enter:
   - `propertyId`: 1
   - `numberOfFractions`: 10 (for 10 fractions)
   - `payableAmount`: 0.01 ETH (if price is 0.001 per fraction)

**Using ethers.js:**
```javascript
await tokenizationManager.buyFractions(
    1,    // propertyId
    10,   // numberOfFractions (simple number!)
    { value: ethers.parseEther("0.01") }
);
```

#### 3. Sell Fractions Back

```javascript
// First approve
await fractionsContract.approve(
    tokenizationManagerAddress,
    ethers.parseEther("10")
);

// Then sell
await tokenizationManager.sellFractions(1, 10);
```

### Using the Master Script

We provide a comprehensive script for complete workflow:

```bash
# Run complete setup
npx hardhat run scripts/master-script.js --network sepolia
```

This script:
1. ✅ Tokenizes a property (creates PropertyDeed NFT)
2. ✅ Starts distribution at 0.001 ETH per fraction
3. ✅ Approves fractions for sale
4. ✅ Displays buy instructions
5. ✅ Makes "NFT Transfers" tab appear on Etherscan
2. ✅ Tokenizes a property
3. ✅ Starts distribution
4. ✅ Tests buying fractions
5. ✅ Tests selling fractions
6. ✅ Displays all results

## 🔒 Security

### Implemented Security Measures

1. **OpenZeppelin Contracts**
   - Battle-tested ERC-721 and ERC-20 implementations
   - Ownable access control
   - ReentrancyGuard protection

2. **Access Control**
   - Owner-only functions protected
   - Property owner validation
   - Distribution control checks

3. **Input Validation**
   - Non-zero address checks
   - Amount validations
   - Property existence verification
   - Distribution status checks

4. **Reentrancy Protection**
   - ReentrancyGuard on all payable functions
   - Checks-effects-interactions pattern
   - State updates before external calls

5. **Safe Transfers**
   - ERC-20 SafeERC20 library usage
   - ETH transfer validation
   - Approval checks before transfers

### Security Considerations

⚠️ **Important Notes:**
- This is a demonstration project for educational purposes
- Full security audit recommended before mainnet deployment
- Consider adding:
  - Time locks for critical functions
  - Multi-signature requirements
  - Emergency pause functionality
  - Upgrade mechanisms (if needed)

### Audit Recommendations

Before production deployment:
1. Professional security audit by certified firm
2. Bug bounty program
3. Testnet deployment for extended period
4. Community testing and feedback
5. Insurance coverage consideration

## 📊 Gas Usage

Average gas costs on Sepolia testnet:

| Function | Gas Used |
|----------|----------|
| tokenizeProperty | ~1,116,000 |
| startDistribution | ~50,000 |
| buyFractions | ~91,000-115,000 |
| sellFractions | ~87,000-110,000 |
| stopDistribution | ~48,000 |

## 🎓 Educational Value

This project demonstrates:

1. **Smart Contract Architecture**: Multi-contract systems and orchestration
2. **Token Standards**: ERC-721 (NFT) and ERC-20 (Fungible) implementation
3. **DeFi Mechanics**: Fractional ownership and DEX-like functionality
4. **Testing Best Practices**: Comprehensive test coverage
5. **Security Patterns**: OpenZeppelin integration and best practices
6. **Gas Optimization**: Efficient code patterns
7. **User Experience**: Simplified interfaces for Web3 applications

## 🤝 Contributing

This is a demonstration project. For production use, please:
1. Conduct thorough security audits
2. Implement additional safety features
3. Add comprehensive monitoring
4. Consider legal and regulatory requirements

## 📄 License

MIT License - See LICENSE file for details

## 👥 Contact

For questions, improvements, or security concerns, please open an issue.

---

## 🎯 Challenge Requirements Checklist

### ✅ Smart Contracts
- [x] PropertyDeed.sol (ERC-721) - Master property NFT
- [x] PropertyFractions.sol (ERC-20) - Fractional ownership shares
- [x] TokenizationManager.sol - Core orchestration contract

### ✅ Functionality
- [x] tokenizeProperty() - Mints NFT, deploys fractions, locks deed
- [x] startDistribution() - Sets price and opens for sale
- [x] buyFractions() - Purchase fractions with ETH
- [x] sellFractions() - Sell fractions back
- [x] Access control with OpenZeppelin Ownable
- [x] NFT locking mechanism

### ✅ Security & Testing
- [x] OpenZeppelin contracts integration
- [x] Comprehensive test suite (77 tests)
- [x] Edge cases and failure scenarios covered
- [x] Access control implemented
- [x] Reentrancy protection

### ✅ Documentation
- [x] README.md with architecture explanation
- [x] Compilation instructions
- [x] Testing instructions
- [x] Deployment guide
- [x] Usage examples

### ✅ Deployment
- [x] Hardhat project setup
- [x] Deployed to Sepolia testnet
- [x] Verified on Etherscan
- [x] All functions tested live

---

**Built with ❤️ for the Property Search Platform**
