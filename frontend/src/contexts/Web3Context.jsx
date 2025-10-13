import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

console.log('Web3Context.jsx loading...');

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  console.log('Web3Provider rendering...');
  
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [network, setNetwork] = useState(null);
  const [balance, setBalance] = useState(null);
  const [ensName, setEnsName] = useState(null);
  const [ensAvatar, setEnsAvatar] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const targetChainId = import.meta.env.VITE_CHAIN_ID || '11155111'; // Sepolia
  const targetNetworkName = import.meta.env.VITE_NETWORK_NAME || 'Sepolia';

  // Check if any wallet is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Get provider based on wallet type
  const getWalletProvider = (walletType = 'metamask') => {
    if (typeof window === 'undefined' || !window.ethereum) return null;

    // If only one provider, return it
    if (!window.ethereum.providers) {
      return window.ethereum;
    }

    // Multiple providers detected
    const providers = window.ethereum.providers;
    
    switch (walletType) {
      case 'metamask':
        return providers.find(p => p.isMetaMask) || window.ethereum;
      case 'coinbase':
        return providers.find(p => p.isCoinbaseWallet) || window.ethereum;
      case 'trust':
        return providers.find(p => p.isTrust) || window.ethereum;
      default:
        return window.ethereum;
    }
  };

  // Fetch ENS name and avatar for an address
  const fetchENS = async (address, provider) => {
    try {
      // ENS is only available on Ethereum mainnet
      // For other networks, we need to use a mainnet provider
      const mainnetProvider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
      
      const ensName = await mainnetProvider.lookupAddress(address);
      if (ensName) {
        setEnsName(ensName);
        
        // Try to get ENS avatar
        const resolver = await mainnetProvider.getResolver(ensName);
        if (resolver) {
          const avatar = await resolver.getAvatar();
          if (avatar) {
            setEnsAvatar(avatar.url);
          }
        }
      } else {
        setEnsName(null);
        setEnsAvatar(null);
      }
    } catch (err) {
      console.error('Error fetching ENS:', err);
      setEnsName(null);
      setEnsAvatar(null);
    }
  };

  // Fetch wallet balance
  const fetchBalance = async (address, provider) => {
    try {
      const balance = await provider.getBalance(address);
      setBalance(ethers.formatEther(balance));
    } catch (err) {
      console.error('Error fetching balance:', err);
      setBalance(null);
    }
  };

  // Connect wallet with specific wallet type
  const connectWallet = async (walletType = 'metamask') => {
    if (!isMetaMaskInstalled()) {
      setError('Please install a Web3 wallet to use this application');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Get the specific wallet provider
      const walletProvider = getWalletProvider(walletType);
      if (!walletProvider) {
        throw new Error(`${walletType} wallet not found`);
      }

      const provider = new ethers.BrowserProvider(walletProvider);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      
      setProvider(provider);
      setSigner(signer);
      setAccount(accounts[0]);
      setNetwork({
        chainId: network.chainId.toString(),
        name: network.name,
      });

      // Fetch balance and ENS
      await fetchBalance(accounts[0], provider);
      await fetchENS(accounts[0], provider);

      // Check if on correct network
      if (network.chainId.toString() !== targetChainId) {
        await switchNetwork();
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setNetwork(null);
    setBalance(null);
    setEnsName(null);
    setEnsAvatar(null);
    setError(null);
  };

  // Switch to target network
  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${parseInt(targetChainId).toString(16)}` }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${parseInt(targetChainId).toString(16)}`,
                chainName: targetNetworkName,
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        // Refresh signer, balance, and ENS
        if (provider) {
          provider.getSigner().then(setSigner);
          fetchBalance(accounts[0], provider);
          fetchENS(accounts[0], provider);
        }
      }
    };

    const handleChainChanged = (chainId) => {
      // Reload the page on network change as recommended by MetaMask
      window.location.reload();
    };

    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    window.ethereum?.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [account, provider]);

  // Auto-connect if previously connected
  useEffect(() => {
    if (isMetaMaskInstalled()) {
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts) => {
          if (accounts.length > 0) {
            connectWallet();
          }
        })
        .catch((err) => {
          console.error('Error checking accounts:', err);
        });
    }
  }, []);

  const value = {
    account,
    provider,
    signer,
    network,
    balance,
    ensName,
    ensAvatar,
    isConnecting,
    error,
    isConnected: !!account,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    connectWallet,
    disconnectWallet,
    switchNetwork,
    targetChainId,
    targetNetworkName,
    refreshBalance: () => account && provider && fetchBalance(account, provider),
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
