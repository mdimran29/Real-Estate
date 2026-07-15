import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';

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

  // Holds the raw EIP-1193 provider currently in use (window.ethereum for
  // injected wallets, or the WalletConnect EthereumProvider instance for
  // WalletConnect sessions). Needed so switchNetwork/disconnect/event
  // listeners work correctly regardless of which wallet type is active.
  const rawProviderRef = useRef(null);

  const targetChainId = import.meta.env.VITE_CHAIN_ID || '11155111'; // Sepolia
  const targetNetworkName = import.meta.env.VITE_NETWORK_NAME || 'Sepolia';
  const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

  // Check if any injected wallet is installed
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

  // Bind accountsChanged/chainChanged/disconnect listeners to whichever
  // raw EIP-1193 provider is currently active (injected or WalletConnect)
  const bindProviderEvents = (rawProvider) => {
    const handleAccountsChanged = (accounts) => {
      if (!accounts || accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      // Reload the page on network change as recommended by MetaMask/WalletConnect
      window.location.reload();
    };

    const handleDisconnect = () => {
      disconnectWallet();
    };

    rawProvider.on('accountsChanged', handleAccountsChanged);
    rawProvider.on('chainChanged', handleChainChanged);
    rawProvider.on('disconnect', handleDisconnect);

    return () => {
      rawProvider.removeListener?.('accountsChanged', handleAccountsChanged);
      rawProvider.removeListener?.('chainChanged', handleChainChanged);
      rawProvider.removeListener?.('disconnect', handleDisconnect);
    };
  };

  // Connect via an injected wallet (MetaMask, Coinbase Wallet, Trust Wallet)
  const connectInjectedWallet = async (walletType) => {
    if (!isMetaMaskInstalled()) {
      throw new Error('Please install a Web3 wallet to use this application');
    }

    const walletProvider = getWalletProvider(walletType);
    if (!walletProvider) {
      throw new Error(`${walletType} wallet not found`);
    }

    rawProviderRef.current = walletProvider;

    const ethersProvider = new ethers.BrowserProvider(walletProvider);
    const accounts = await ethersProvider.send('eth_requestAccounts', []);

    if (accounts.length === 0) {
      throw new Error('No accounts found');
    }

    return { ethersProvider, accounts };
  };

  // Connect via WalletConnect (QR code / mobile wallet deep link)
  const connectWalletConnect = async () => {
    if (!walletConnectProjectId) {
      throw new Error(
        'WalletConnect is not configured. Set VITE_WALLETCONNECT_PROJECT_ID in your .env (get one free at https://cloud.reown.com).'
      );
    }

    const wcProvider = await EthereumProvider.init({
      projectId: walletConnectProjectId,
      chains: [parseInt(targetChainId)],
      showQrModal: true,
      metadata: {
        name: 'PropToken',
        description: 'Real Estate Tokenization Platform',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://proptoken.app',
        icons: [],
      },
    });

    await wcProvider.connect();

    rawProviderRef.current = wcProvider;

    const ethersProvider = new ethers.BrowserProvider(wcProvider);
    const accounts = wcProvider.accounts;

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    return { ethersProvider, accounts };
  };

  // Connect wallet with specific wallet type
  const connectWallet = async (walletType = 'metamask') => {
    try {
      setIsConnecting(true);
      setError(null);

      const { ethersProvider, accounts } =
        walletType === 'walletconnect'
          ? await connectWalletConnect()
          : await connectInjectedWallet(walletType);

      const signer = await ethersProvider.getSigner();
      const network = await ethersProvider.getNetwork();

      setProvider(ethersProvider);
      setSigner(signer);
      setAccount(accounts[0]);
      setNetwork({
        chainId: network.chainId.toString(),
        name: network.name,
      });

      bindProviderEvents(rawProviderRef.current);

      // Fetch balance and ENS
      await fetchBalance(accounts[0], ethersProvider);
      await fetchENS(accounts[0], ethersProvider);

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
    // WalletConnect sessions need an explicit disconnect to close the pairing
    if (rawProviderRef.current?.disconnect) {
      rawProviderRef.current.disconnect().catch((err) => {
        console.error('Error disconnecting WalletConnect session:', err);
      });
    }
    rawProviderRef.current = null;

    setAccount(null);
    setProvider(null);
    setSigner(null);
    setNetwork(null);
    setBalance(null);
    setEnsName(null);
    setEnsAvatar(null);
    setError(null);
  };

  // Switch to target network (works for both injected and WalletConnect providers)
  const switchNetwork = async () => {
    const rawProvider = rawProviderRef.current || window.ethereum;
    if (!rawProvider) return;

    try {
      await rawProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${parseInt(targetChainId).toString(16)}` }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to the wallet
      if (switchError.code === 4902) {
        try {
          await rawProvider.request({
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

  // Listen for account changes on the injected wallet before any connection
  // is made (post-connection listeners are bound via bindProviderEvents)
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        if (provider) {
          provider.getSigner().then(setSigner);
          fetchBalance(accounts[0], provider);
          fetchENS(accounts[0], provider);
        }
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    window.ethereum?.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [account, provider]);

  // Auto-connect if previously connected via an injected wallet.
  // (WalletConnect sessions require the QR/approval flow, so they are not auto-resumed here.)
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
    isWalletConnectConfigured: !!walletConnectProjectId,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    targetChainId,
    targetNetworkName,
    refreshBalance: () => account && provider && fetchBalance(account, provider),
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
