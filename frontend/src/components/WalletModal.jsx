import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const WalletModal = ({ isOpen, onClose, onConnect }) => {
  const { isWalletConnectConfigured } = useWeb3();
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const wallets = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using MetaMask wallet',
      isInstalled: typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' && (
        window.ethereum.isMetaMask ||
        (window.ethereum.providers && window.ethereum.providers.some((p) => p.isMetaMask))
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
        (window.ethereum.providers && window.ethereum.providers.some((p) => p.isCoinbaseWallet))
      ),
      downloadUrl: 'https://www.coinbase.com/wallet/downloads',
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      icon: '🛡️',
      description: 'Connect using Trust Wallet',
      isInstalled: typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' && (
        window.ethereum.isTrust ||
        (window.ethereum.providers && window.ethereum.providers.some((p) => p.isTrust))
      ),
      downloadUrl: 'https://trustwallet.com/download',
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔗',
      description: isWalletConnectConfigured
        ? 'Scan with your mobile wallet'
        : 'Not configured (missing project ID)',
      isInstalled: true,
      downloadUrl: 'https://walletconnect.com/',
    },
  ];

  const handleConnect = async (wallet) => {
    if (wallet.id !== 'walletconnect' && !wallet.isInstalled) {
      window.open(wallet.downloadUrl, '_blank');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      setSelectedWallet(wallet.id);

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

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div
        className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-ink-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-card p-6 animate-scaleIn">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-500 hover:text-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mb-4 shadow-glow">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Connect a wallet</h2>
            <p className="text-sm text-slate-400">Choose how you'd like to connect to PropToken</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="space-y-2.5">
            {wallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet)}
                disabled={isConnecting && selectedWallet !== wallet.id}
                className={`w-full p-3.5 rounded-xl border transition-all duration-200 text-left ${
                  wallet.isInstalled
                    ? 'border-white/10 bg-white/[0.03] hover:border-brand-400/40 hover:bg-brand-500/[0.07]'
                    : 'border-white/5 bg-white/[0.01]'
                } ${isConnecting && selectedWallet === wallet.id ? 'opacity-75 cursor-wait' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl leading-none">{wallet.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-100 text-sm">{wallet.name}</p>
                      <p className="text-xs text-slate-500">{wallet.description}</p>
                    </div>
                  </div>

                  {isConnecting && selectedWallet === wallet.id ? (
                    <svg className="animate-spin h-5 w-5 text-brand-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : wallet.isInstalled ? (
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  ) : (
                    <span className="text-xs text-brand-400 font-semibold">Install</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <p className="mt-6 pt-4 border-t border-white/5 text-[11px] text-center text-slate-500">
            By connecting a wallet, you agree to the Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
