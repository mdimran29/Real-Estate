# 📋 PropToken - Contract Addresses

**Network**: Sepolia Testnet  
**Deployment Date**: October 11, 2025  
**Status**: Live & Active ✅

---

## 🏗️ Main Contracts

### TokenizationManager (Core Contract)
```
0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3
```
- **Purpose**: Main orchestration contract
- **Status**: ✅ Active (1 property tokenized)
- **Verified**: ✅ Yes
- **View Contract**: https://sepolia.etherscan.io/address/0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3#code
- **Write Functions**: https://sepolia.etherscan.io/address/0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3#writeContract
- **NFT Transfers**: https://sepolia.etherscan.io/address/0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3#nfttransfers

### PropertyDeed (ERC-721 NFT)
```
0xbD88BDF7cB52f972DE2727A7584e38704045eb4C
```
- **Purpose**: Represents property ownership NFTs
- **Status**: ✅ Active (1 NFT minted)
- **Verified**: ✅ Yes
- **View Contract**: https://sepolia.etherscan.io/address/0xbD88BDF7cB52f972DE2727A7584e38704045eb4C#code
- **Read Functions**: https://sepolia.etherscan.io/address/0xbD88BDF7cB52f972DE2727A7584e38704045eb4C#readContract

---

## 🏢 Tokenized Properties

### Property #1: 123 Luxury Ave, Dubai Marina

**PropertyFractions Contract (ERC-20)**
```
0xD9ac7da67BB998744e43EdA383dC5E7f2860FBf0
```

**Property Details:**
- **Property ID**: 1
- **Location**: 123 Luxury Ave, Dubai Marina
- **Total Supply**: 1,000,000 fractions
- **Price**: 0.001 ETH per fraction
- **Status**: ✅ Distributing
- **Owner**: 0xc92060cE977fC0b3430eB29195b3dBA4808440e2

**Links:**
- **View Contract**: https://sepolia.etherscan.io/address/0xD9ac7da67BB998744e43EdA383dC5E7f2860FBf0
- **Token Info**: https://sepolia.etherscan.io/token/0xD9ac7da67BB998744e43EdA383dC5E7f2860FBf0
- **Holders**: https://sepolia.etherscan.io/token/0xD9ac7da67BB998744e43EdA383dC5E7f2860FBf0#balances

---

## 📝 Quick Copy Format

### For Scripts/Code:
```javascript
const TOKENIZATION_MANAGER = "0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3";
const PROPERTY_DEED = "0xbD88BDF7cB52f972DE2727A7584e38704045eb4C";
const PROPERTY_FRACTIONS_1 = "0xD9ac7da67BB998744e43EdA383dC5E7f2860FBf0";
```

### For Documentation:
```
TokenizationManager:  0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3
PropertyDeed:         0xbD88BDF7cB52f972DE2727A7584e38704045eb4C
PropertyFractions #1: 0xD9ac7da67BB998744e43EdA383dC5E7f2860FBf0
```

### For Terminal Commands:
```bash
export TOKENIZATION_MANAGER="0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3"
export PROPERTY_DEED="0xbD88BDF7cB52f972DE2727A7584e38704045eb4C"
export PROPERTY_FRACTIONS_1="0xD9ac7da67BB998744e43EdA383dC5E7f2860FBf0"
```

---

## 🔗 Important Links

### TokenizationManager
- **Source Code**: https://sepolia.etherscan.io/address/0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3#code
- **Read Contract**: https://sepolia.etherscan.io/address/0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3#readContract
- **Write Contract**: https://sepolia.etherscan.io/address/0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3#writeContract
- **Events**: https://sepolia.etherscan.io/address/0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3#events
- **NFT Transfers**: https://sepolia.etherscan.io/address/0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3#nfttransfers

### PropertyDeed
- **Source Code**: https://sepolia.etherscan.io/address/0xbD88BDF7cB52f972DE2727A7584e38704045eb4C#code
- **Read Contract**: https://sepolia.etherscan.io/address/0xbD88BDF7cB52f972DE2727A7584e38704045eb4C#readContract
- **NFT Inventory**: https://sepolia.etherscan.io/token/0xbD88BDF7cB52f972DE2727A7584e38704045eb4C

### PropertyFractions #1
- **Token Info**: https://sepolia.etherscan.io/token/0xD9ac7da67BB998744e43EdA383dC5E7f2860FBf0
- **Holders**: https://sepolia.etherscan.io/token/0xD9ac7da67BB998744e43EdA383dC5E7f2860FBf0#balances
- **Transfers**: https://sepolia.etherscan.io/token/0xD9ac7da67BB998744e43EdA383dC5E7f2860FBf0#tokenTrade

---

## 🎯 How to Interact

### Buy Fractions (Property #1)

1. Go to TokenizationManager Write Contract:
   https://sepolia.etherscan.io/address/0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3#writeContract

2. Connect your wallet

3. Call `buyFractions()` with:
   ```
   propertyId: 1
   numberOfFractions: 10
   payableAmount: 0.01 ETH
   ```

### Check Property Status

1. Go to TokenizationManager Read Contract:
   https://sepolia.etherscan.io/address/0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3#readContract

2. Call `getTokenizedProperty(1)` to see:
   - Is distributing
   - Price per fraction
   - Fractions sold
   - Owner address

### Check Your Fraction Balance

1. Go to PropertyFractions #1:
   https://sepolia.etherscan.io/token/0xD9ac7da67BB998744e43EdA383dC5E7f2860FBf0

2. Enter your wallet address in "Balance Checker"

---

## 📊 Contract Statistics

| Metric | Value |
|--------|-------|
| Total Contracts Deployed | 3 |
| Properties Tokenized | 1 |
| Total NFTs Minted | 1 |
| Total Fractions Created | 1,000,000 |
| Fractions Available | 1,000,000 |
| Current Price | 0.001 ETH per fraction |
| All Contracts Verified | ✅ Yes |

---

## 🔐 Security

- ✅ All contracts verified on Etherscan
- ✅ OpenZeppelin security standards
- ✅ ReentrancyGuard protection
- ✅ Access control implemented
- ✅ 77 comprehensive tests (100% passing)

---

## 📅 Deployment History

| Date | Event | Transaction |
|------|-------|-------------|
| Oct 11, 2025 | TokenizationManager Deployed | [View](https://sepolia.etherscan.io/address/0x3A00350f92F3a7dEFCB72347Ea4Ce49BD5A9b0e3) |
| Oct 11, 2025 | PropertyDeed Deployed | [View](https://sepolia.etherscan.io/address/0xbD88BDF7cB52f972DE2727A7584e38704045eb4C) |
| Oct 11, 2025 | Property #1 Tokenized | [View](https://sepolia.etherscan.io/tx/0xe5dc3ee2b5e82a5b5766e76f3b7f50d87cf63dfedd566a756d91abb87a780259) |
| Oct 11, 2025 | PropertyFractions #1 Deployed | [View](https://sepolia.etherscan.io/address/0xD9ac7da67BB998744e43EdA383dC5E7f2860FBf0) |
| Oct 11, 2025 | Distribution Started | ✅ Complete |

---

**Last Updated**: October 11, 2025  
**Network**: Sepolia Testnet  
**All Systems**: ✅ Operational
