# 🏠 RealEstate3.0 - Blockchain Property Tokenization Platform

![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

A decentralized application (dApp) that revolutionizes real estate investment through blockchain technology. Buy, sell, and trade fractional ownership of properties with complete transparency and instant liquidity.

## ✨ Features

- 🏘️ **Property Tokenization** - Convert real estate into fractional NFTs
- 💎 **Fractional Ownership** - Own property fractions starting from 0.001 ETH
- 🔄 **Instant Trading** - Buy and sell fractions 24/7 with instant settlements
- 🔒 **Blockchain Security** - Ethereum smart contracts ensure transparent, immutable ownership
- 🌍 **Global Access** - Invest in properties worldwide from anywhere
- 📊 **Real-time Portfolio** - Track your holdings and transactions in real-time
- 🔗 **Multi-Wallet Support** - MetaMask, WalletConnect, Coinbase Wallet
- 🖼️ **IPFS Integration** - Decentralized metadata and image storage

## �� Live Demo

**Sepolia Testnet Deployment:**
- TokenizationManager: `0xcE5938311925624E9FE619cc493AF5eA16bc46E2`
- PropertyDeed NFT: `0x414AbAbf01976f66757a3bF3a603adB95b97fDe6`

[View on Etherscan](https://sepolia.etherscan.io/address/0xcE5938311925624E9FE619cc493AF5eA16bc46E2)

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Lightning-fast build tool
- **Ethers.js v6** - Ethereum wallet integration
- **TailwindCSS** - Utility-first styling
- **Web3Modal** - Wallet connection management

### Smart Contracts
- **Solidity 0.8.20** - Smart contract language
- **Hardhat** - Development environment
- **OpenZeppelin** - Secure contract libraries
- **ERC721 & ERC20** - Token standards

### Storage
- **IPFS** - Decentralized metadata storage
- **Multiple Gateway Fallbacks** - Reliable content delivery

## 📋 Prerequisites

- Node.js v16 or higher
- npm or yarn
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH ([Get from faucet](https://sepoliafaucet.com/))

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/mdimran29/Real-Estate.git
cd Real-Estate
```

### 2. Install Dependencies

#### Backend (Smart Contracts)
```bash
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 3. Configure Environment

Create `frontend/.env`:
```env
VITE_TOKENIZATION_MANAGER_ADDRESS=0xcE5938311925624E9FE619cc493AF5eA16bc46E2
VITE_PROPERTY_DEED_ADDRESS=0x414AbAbf01976f66757a3bF3a603adB95b97fDe6
VITE_CHAIN_ID=11155111
```

### 4. Run Development Server
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173/`

## 📁 Project Structure

```
Real-Estate/
├── contracts/                  # Solidity smart contracts
│   ├── TokenizationManager.sol # Main orchestration contract
│   ├── PropertyDeed.sol        # ERC721 NFT for properties
│   └── PropertyFractions.sol   # ERC20 tokens for fractions
├── frontend/                   # React dApp
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── contexts/           # React context providers
│   │   ├── hooks/              # Custom React hooks
│   │   └── utils/              # Utility functions & ABIs
│   └── public/                 # Static assets
├── scripts/                    # Deployment scripts
│   └── deploy-updated.js       # Contract deployment
├── hardhat.config.js           # Hardhat configuration
└── README.md                   # This file
```

## 🎮 How to Use

### For Property Owners

1. **Add Property**
   - Navigate to "Tokenize Property" tab
   - Fill in property details
   - Upload metadata JSON with image URL
   - Submit transaction

2. **Start Distribution**
   - Go to "My Portfolio"
   - Set price per fraction
   - Approve token spending
   - Enable fraction sales

### For Investors

1. **Browse Properties**
   - Visit "Marketplace" tab
   - View available properties
   - Check details, price, and availability

2. **Buy Fractions**
   - Select a property
   - Enter number of fractions
   - Confirm transaction
   - Fractions appear in your portfolio

3. **Manage Portfolio**
   - View "My Portfolio"
   - See all owned fractions
   - Transfer to other addresses

## 🔐 Smart Contracts

### TokenizationManager.sol
Main orchestration contract that:
- Manages property registration
- Controls fraction distribution
- Handles buy/sell transactions
- Validates ownership and balances

### PropertyDeed.sol (ERC721)
NFT representing property ownership:
- One NFT per property
- Locked in contract during distribution
- Stores property metadata URI

### PropertyFractions.sol (ERC20)
Fungible tokens representing property fractions:
- Deployed per property
- Tradeable between users
- 18 decimal precision

## 🌐 Deployment

### Deploy Smart Contracts

1. **Configure Hardhat**
```javascript
// hardhat.config.js
module.exports = {
  networks: {
    sepolia: {
      url: "YOUR_ALCHEMY_URL",
      accounts: ["YOUR_PRIVATE_KEY"]
    }
  }
};
```

2. **Deploy**
```bash
npx hardhat run scripts/deploy-updated.js --network sepolia
```

### Deploy Frontend

#### Vercel (Recommended)
```bash
cd frontend
npm run build
vercel --prod
```

#### Netlify
```bash
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

## 🖼️ Image Hosting

For best performance, use direct image hosting instead of IPFS:

### Recommended: Imgur
1. Upload image to [Imgur](https://imgur.com/upload)
2. Copy direct link: `https://i.imgur.com/XXXXX.jpg`
3. Use in metadata JSON

### Metadata JSON Example
```json
{
  "name": "Luxury Penthouse NYC",
  "description": "3BR penthouse with city views",
  "image": "https://i.imgur.com/XXXXX.jpg",
  "propertyAddress": "123 Park Ave, New York, NY",
  "propertyType": "Residential",
  "location": "Manhattan, New York"
}
```

## 🐛 Troubleshooting

### Wallet Connection Issues
- Ensure you're on Sepolia testnet (Chain ID: 11155111)
- Clear browser cache and reconnect
- Try different wallet provider

### Transaction Failures
- Check sufficient Sepolia ETH balance
- Approve token spending before buying
- Verify contract addresses in `.env`

### Images Not Loading
- Use Imgur or Cloudinary for reliable hosting
- Multiple IPFS gateway fallbacks available
- Placeholder shows if all sources fail

## 📊 Key Metrics

- **Min Investment**: 0.001 ETH
- **Trading Hours**: 24/7
- **Settlement Time**: Instant
- **Transaction Fee**: Gas only
- **Transparency**: 100%

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

**Md Imran**
- GitHub: [@mdimran29](https://github.com/mdimran29)
- Twitter: [@itz_Imran29](https://x.com/itz_Imran29)
- LinkedIn: [mdimran29](https://www.linkedin.com/in/mdimran29/)
- Email: dev.mdimran@gmail.com

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Ethereum community for development tools
- React and Vite teams for amazing frameworks
- IPFS for decentralized storage

## ⚠️ Disclaimer

This platform is currently deployed on Sepolia testnet for demonstration purposes. Real estate tokenization involves regulatory considerations and risks. This is not financial advice. Always do your own research before investing.

---

**Built with ❤️ using Ethereum, React, and Web3**

![Ethereum](https://ethereum.org/static/a183661dd70e0e5c70689a0ec95ef0ba/13c43/eth-diamond-purple.png)
