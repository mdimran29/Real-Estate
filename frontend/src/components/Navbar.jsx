import { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { formatAddress } from '../utils/contracts';
import WalletModal from './WalletModal';
import { useToast } from './Toast';

const NAV_ITEMS = [
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'tokenize', label: 'Tokenize' },
  { id: 'buy', label: 'Buy Fractions' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'about', label: 'About' },
];

const Navbar = ({ activeTab, onNavigate }) => {
  const {
    account,
    network,
    balance,
    ensName,
    ensAvatar,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    targetNetworkName,
  } = useWeb3();

  const { showToast } = useToast();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleWalletConnect = async (walletType) => {
    try {
      await connectWallet(walletType);
      setIsWalletModalOpen(false);
      showToast('Wallet connected successfully', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to connect wallet', 'error');
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setIsDropdownOpen(false);
    showToast('Wallet disconnected', 'info');
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(account);
    showToast('Address copied to clipboard', 'success');
  };

  const handleNav = (tab) => {
    onNavigate(tab);
    setIsMobileMenuOpen(false);
  };

  const displayName = ensName || (account ? formatAddress(account) : '');
  const displayBalance = balance ? `${parseFloat(balance).toFixed(4)} ETH` : '0 ETH';

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => handleNav('marketplace')}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
                <svg className="w-4.5 h-4.5 text-white" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-lg font-bold font-display text-white tracking-tight">
                Prop<span className="gradient-text">Token</span>
              </span>
            </button>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={activeTab === item.id ? 'tab-pill-active' : 'tab-pill-inactive'}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Wallet + mobile toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              {isConnected ? (
                <>
                  <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-glowPulse" />
                    <span className="text-xs font-medium text-slate-300">{network?.name || targetNetworkName}</span>
                  </div>

                  <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20">
                    <svg className="w-4 h-4 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-xs font-semibold text-slate-200">{displayBalance}</span>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 rounded-full transition-colors"
                    >
                      {ensAvatar ? (
                        <img src={ensAvatar} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold">{account?.substring(2, 4).toUpperCase()}</span>
                        </div>
                      )}
                      <span className="hidden sm:inline text-xs font-medium text-slate-200">{displayName}</span>
                      <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                        <div className="absolute right-0 mt-2 w-64 bg-ink-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-card py-2 z-20 animate-slideDown">
                          <div className="px-4 py-3 border-b border-white/5">
                            <p className="text-[11px] text-slate-500 mb-1 uppercase tracking-wide">Connected</p>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-slate-100">{ensName || formatAddress(account)}</p>
                              <button onClick={handleCopyAddress} className="text-brand-400 hover:text-brand-300">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                            <div>
                              <p className="text-[11px] text-slate-500 mb-1 uppercase tracking-wide">Balance</p>
                              <p className="text-base font-bold text-slate-100">{displayBalance}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-400" />
                              <p className="text-xs font-medium text-slate-400">{network?.name || targetNetworkName}</p>
                            </div>
                          </div>

                          <div className="px-2 py-2">
                            <a
                              href={`https://sepolia.etherscan.io/address/${account}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.06] rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span>View on Etherscan</span>
                            </a>
                            <button
                              onClick={() => { setIsDropdownOpen(false); setIsWalletModalOpen(true); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.06] rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                              <span>Change Wallet</span>
                            </button>
                            <button
                              onClick={handleDisconnect}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              <span>Disconnect</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setIsWalletModalOpen(true)}
                  disabled={isConnecting}
                  className="btn-primary"
                >
                  {isConnecting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="hidden sm:inline">Connecting…</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Connect Wallet</span>
                    </>
                  )}
                </button>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 -mr-2 text-slate-300 hover:text-white transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-white/[0.06] bg-ink-950/95 backdrop-blur-xl animate-slideDown">
            <div className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    activeTab === item.id ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {isConnected && (
                <div className="flex items-center justify-between px-4 py-2.5 mt-1 border-t border-white/5 pt-3">
                  <span className="text-xs text-slate-500">{network?.name || targetNetworkName}</span>
                  <span className="text-xs font-semibold text-slate-300">{displayBalance}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={handleWalletConnect}
      />
    </>
  );
};

export default Navbar;
