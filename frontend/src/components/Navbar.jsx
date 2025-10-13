import { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { formatAddress } from '../utils/contracts';
import WalletModal from './WalletModal';
import { useToast } from './Toast';

const Navbar = () => {
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

  const handleConnectClick = () => {
    setIsWalletModalOpen(true);
  };

  const handleWalletConnect = async (walletType) => {
    try {
      await connectWallet(walletType);
      setIsWalletModalOpen(false);
      showToast('Wallet connected successfully!', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to connect wallet', 'error');
    }
  };

  const handleChangeWallet = () => {
    setIsDropdownOpen(false);
    setIsWalletModalOpen(true);
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setIsDropdownOpen(false);
    showToast('Wallet disconnected', 'info');
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(account);
    showToast('Address copied to clipboard!', 'success');
  };

  const displayName = ensName || (account ? formatAddress(account) : '');
  const displayBalance = balance ? `${parseFloat(balance).toFixed(4)} ETH` : '0 ETH';

  return (
    <>
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary-600">
                  🏠 PropToken
                </h1>
              </div>
              <div className="hidden md:block ml-10">
                <p className="text-sm text-gray-500">
                  Real Estate Tokenization Platform
                </p>
              </div>
            </div>

            {/* Wallet Connection */}
            <div className="flex items-center space-x-4">
              {isConnected ? (
                <>
                  {/* Network Info */}
                  <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-700">
                      {network?.name || targetNetworkName}
                    </span>
                  </div>

                  {/* Balance Display */}
                  <div className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border border-primary-200">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-700">
                      {displayBalance}
                    </span>
                  </div>

                  {/* Account Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                    >
                      {ensAvatar ? (
                        <img 
                          src={ensAvatar} 
                          alt="ENS Avatar" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {account?.substring(2, 4).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-gray-700">
                          {displayName}
                        </span>
                        <span className="text-xs text-gray-500 lg:hidden">
                          {displayBalance}
                        </span>
                      </div>
                      <svg 
                        className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsDropdownOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                          {/* Account Info */}
                          <div className="px-4 py-3 border-b border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Connected Account</p>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {ensName || formatAddress(account)}
                              </p>
                              <button
                                onClick={handleCopyAddress}
                                className="text-primary-600 hover:text-primary-700"
                                title="Copy address"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                            {ensName && (
                              <p className="text-xs text-gray-400 mt-1">
                                {formatAddress(account)}
                              </p>
                            )}
                          </div>

                          {/* Balance */}
                          <div className="px-4 py-3 border-b border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Balance</p>
                            <p className="text-lg font-bold text-gray-900">
                              {displayBalance}
                            </p>
                          </div>

                          {/* Network */}
                          <div className="px-4 py-3 border-b border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Network</p>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <p className="text-sm font-medium text-gray-900">
                                {network?.name || targetNetworkName}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="px-2 py-2">
                            <a
                              href={`https://sepolia.etherscan.io/address/${account}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span>View on Etherscan</span>
                            </a>
                            <button
                              onClick={handleChangeWallet}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                              <span>Change Wallet</span>
                            </button>
                            <button
                              onClick={handleDisconnect}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                  onClick={handleConnectClick}
                  disabled={isConnecting}
                  className="btn-primary flex items-center space-x-2"
                >
                  {isConnecting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Connect Wallet</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Wallet Modal */}
      <WalletModal 
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={handleWalletConnect}
      />
    </>
  );
};

export default Navbar;
