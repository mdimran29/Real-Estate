import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletModal = ({ isOpen, onClose, onConnect }) => {
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Wallet options with detection
  const wallets = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using MetaMask wallet',
      isInstalled: typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' && (
        window.ethereum.isMetaMask || 
        (window.ethereum.providers && window.ethereum.providers.some(p => p.isMetaMask))
      ),
      downloadUrl: 'https://metamask.io/download/',
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🔷',
      description: 'Connect using Coinbase Wallet',
      isInstalled: typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' && (
        window.ethereum.isCoinbaseWallet || 
        (window.ethereum.providers && window.ethereum.providers.some(p => p.isCoinbaseWallet))
      ),
      downloadUrl: 'https://www.coinbase.com/wallet/downloads',
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      icon: '�️',
      description: 'Connect using Trust Wallet',
      isInstalled: typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' && (
        window.ethereum.isTrust || 
        (window.ethereum.providers && window.ethereum.providers.some(p => p.isTrust))
      ),
      downloadUrl: 'https://trustwallet.com/download',
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '�',
      description: 'Connect using WalletConnect',
      isInstalled: true, // WalletConnect doesn't require installation
      downloadUrl: 'https://walletconnect.com/',
    },
  ];

  const handleConnect = async (wallet) => {
    if (!wallet.isInstalled) {
      window.open(wallet.downloadUrl, '_blank');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      setSelectedWallet(wallet.id);

      if (wallet.id === 'walletconnect') {
        // WalletConnect implementation would go here
        // For now, show a message that it's coming soon
        setError('WalletConnect integration coming soon!');
        setIsConnecting(false);
        return;
      }

      // For other wallets, call onConnect with wallet type
      await onConnect(wallet.id);
      onClose();
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
      setSelectedWallet(null);
    }
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-sm text-gray-600">
              Choose your preferred wallet to connect
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Wallet options */}
          <div className="space-y-3">
            {wallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet)}
                disabled={isConnecting && selectedWallet !== wallet.id}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  wallet.isInstalled
                    ? 'border-gray-200 hover:border-primary-500 hover:bg-primary-50'
                    : 'border-gray-100 bg-gray-50'
                } ${
                  isConnecting && selectedWallet === wallet.id
                    ? 'opacity-75 cursor-wait'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{wallet.icon}</span>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{wallet.name}</p>
                      <p className="text-xs text-gray-500">{wallet.description}</p>
                    </div>
                  </div>
                  
                  {isConnecting && selectedWallet === wallet.id ? (
                    <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : wallet.isInstalled ? (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  ) : (
                    <span className="text-xs text-primary-600 font-medium">Install</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              By connecting a wallet, you agree to our Terms of Service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
