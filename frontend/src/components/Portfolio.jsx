import { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { usePortfolio } from '../hooks/usePortfolio';
import PropertyCard from './PropertyCard';
import RentalIncome from './RentalIncome';
import MyListings from './MyListings';
import { formatEther, transferFractions, formatFractions, createFractionListing, isFeatureAvailable } from '../utils/contracts';

const Portfolio = () => {
  const { isConnected, account, signer } = useWeb3();
  const { nfts, fractions, loading, error, refetch } = usePortfolio();
  const [transferring, setTransferring] = useState(false);
  const [transferForm, setTransferForm] = useState({ propertyId: null, show: false });
  const [transferData, setTransferData] = useState({ recipient: '', amount: '' });
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');

  const [listing, setListing] = useState(false);
  const [listingForm, setListingForm] = useState({ propertyId: null, show: false });
  const [listingData, setListingData] = useState({ amount: '', price: '' });
  const [listingError, setListingError] = useState('');
  const [listingSuccess, setListingSuccess] = useState('');
  const marketplaceAvailable = isFeatureAvailable('FRACTION_MARKETPLACE');

  // Helper function to format balance from wei to readable number
  const formatBalance = (balance) => {
    try {
      // Use the formatFractions utility function
      return formatFractions(balance);
    } catch (err) {
      console.error('Error formatting balance:', err);
      return balance;
    }
  };

  const handleShowTransferForm = (propertyId) => {
    setTransferForm({ propertyId, show: true });
    setTransferData({ recipient: '', amount: '' });
    setTransferError('');
    setTransferSuccess('');
  };

  const handleCancelTransfer = () => {
    setTransferForm({ propertyId: null, show: false });
    setTransferData({ recipient: '', amount: '' });
    setTransferError('');
  };

  const handleTransfer = async (propertyId, balance) => {
    if (!transferData.recipient || !transferData.amount) {
      setTransferError('Please fill in all fields');
      return;
    }

    if (!ethers.isAddress(transferData.recipient)) {
      setTransferError('Invalid recipient address');
      return;
    }

    const amount = parseInt(transferData.amount);
    if (isNaN(amount) || amount <= 0) {
      setTransferError('Invalid amount');
      return;
    }

    const formattedBalance = parseFloat(formatBalance(balance));
    if (amount > formattedBalance) {
      setTransferError(`You only have ${formattedBalance} fractions`);
      return;
    }

    try {
      setTransferring(true);
      setTransferError('');
      
      // Convert amount to wei (18 decimals) for the contract
      const amountInWei = ethers.parseUnits(amount.toString(), 18);
      
      await transferFractions(signer, propertyId, transferData.recipient, amountInWei);
      
      setTransferSuccess(`Successfully transferred ${amount} fractions!`);
      setTimeout(() => {
        setTransferForm({ propertyId: null, show: false });
        setTransferSuccess('');
        refetch();
      }, 2000);
    } catch (err) {
      console.error('Transfer error:', err);
      setTransferError(err.message || 'Failed to transfer fractions');
    } finally {
      setTransferring(false);
    }
  };

  const handleShowListingForm = (propertyId) => {
    setListingForm({ propertyId, show: true });
    setListingData({ amount: '', price: '' });
    setListingError('');
    setListingSuccess('');
  };

  const handleCancelListing = () => {
    setListingForm({ propertyId: null, show: false });
    setListingData({ amount: '', price: '' });
    setListingError('');
  };

  const handleCreateListing = async (propertyId, balance) => {
    if (!listingData.amount || !listingData.price) {
      setListingError('Please fill in all fields');
      return;
    }

    const amount = parseInt(listingData.amount);
    if (isNaN(amount) || amount <= 0) {
      setListingError('Invalid amount');
      return;
    }

    const price = parseFloat(listingData.price);
    if (isNaN(price) || price <= 0) {
      setListingError('Invalid price');
      return;
    }

    const formattedBalance = parseFloat(formatBalance(balance));
    if (amount > formattedBalance) {
      setListingError(`You only have ${formattedBalance} fractions`);
      return;
    }

    try {
      setListing(true);
      setListingError('');

      const amountInWei = ethers.parseUnits(amount.toString(), 18);
      const priceInWei = ethers.parseEther(price.toString());

      await createFractionListing(signer, propertyId, amountInWei, priceInWei);

      setListingSuccess(`Successfully listed ${amount} fractions for sale!`);
      setTimeout(() => {
        setListingForm({ propertyId: null, show: false });
        setListingSuccess('');
        refetch();
      }, 2000);
    } catch (err) {
      console.error('Listing error:', err);
      setListingError(err.message || 'Failed to create listing');
    } finally {
      setListing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="card max-w-2xl mx-auto text-center">
        <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-gray-600">
          Please connect your wallet to view your portfolio
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">My Portfolio</h2>
          <p className="text-gray-600 mt-1">View your property NFTs and fractional holdings</p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="btn-secondary flex items-center space-x-2"
        >
          <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-8">
          <div className="card animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-64 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="card text-center">
          <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Portfolio</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={refetch} className="btn-primary">
            Try Again
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Property NFTs Section */}
          <div className="card">
            <div className="flex items-center mb-6">
              <svg className="w-8 h-8 mr-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Property Deeds (NFTs)</h3>
                <p className="text-sm text-gray-600">Properties you fully own as NFTs</p>
              </div>
              <span className="ml-auto text-2xl font-bold text-primary-600">
                {nfts.length}
              </span>
            </div>

            {nfts.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-gray-600">You don't own any property NFTs yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nfts.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    showActions={false}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Fractional Holdings Section */}
          <div className="card">
            <div className="flex items-center mb-6">
              <svg className="w-8 h-8 mr-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Fractional Holdings</h3>
                <p className="text-sm text-gray-600">Properties you own fractions of</p>
              </div>
              <span className="ml-auto text-2xl font-bold text-primary-600">
                {fractions.length}
              </span>
            </div>

            {fractions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600">You don't own any fractional shares yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fractions.map((holding) => (
                  <div key={holding.propertyId} className="bg-gray-50 rounded-lg overflow-hidden">
                    <div className="flex items-center p-4 hover:bg-gray-100 transition-colors">
                      {/* Property Image */}
                      <div className="flex-shrink-0 mr-4">
                        {holding.metadata?.image ? (
                          <img
                            src={holding.metadata.image}
                            alt={holding.metadata.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Property Info */}
                      <div className="flex-grow">
                        <h4 className="font-semibold text-gray-800">
                          {holding.metadata?.name || `Property #${holding.propertyId}`}
                        </h4>
                        <p className="text-sm text-gray-600">Token ID: #{holding.propertyId}</p>
                      </div>

                      {/* Fraction Count */}
                      <div className="text-right mr-4">
                        <div className="text-2xl font-bold text-primary-600">
                          {formatBalance(holding.balance)}
                        </div>
                        <div className="text-sm text-gray-600">
                          out of {formatFractions(holding.details?.totalFractions)}
                        </div>
                        <div className="text-xs text-gray-500">
                          fractions owned
                        </div>
                        {holding.details?.pricePerFraction && (
                          <div className="text-xs text-gray-500 mt-1">
                            @ {formatEther(holding.details.pricePerFraction)} ETH each
                          </div>
                        )}
                      </div>

                      {/* Transfer / List for Resale Buttons */}
                      <div className="flex-shrink-0 flex items-center space-x-2">
                        <button
                          onClick={() => handleShowTransferForm(holding.propertyId)}
                          className="btn-secondary text-sm py-2 px-4 flex items-center space-x-2"
                          disabled={transferring}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          <span>Transfer</span>
                        </button>
                        {marketplaceAvailable && (
                          <button
                            onClick={() => handleShowListingForm(holding.propertyId)}
                            className="btn-secondary text-sm py-2 px-4 flex items-center space-x-2"
                            disabled={listing}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span>List for Resale</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Transfer Form */}
                    {transferForm.show && transferForm.propertyId === holding.propertyId && (
                      <div className="border-t border-gray-200 p-4 bg-white">
                        <h5 className="text-sm font-semibold text-gray-800 mb-3">Transfer Fractions</h5>
                        
                        {transferError && (
                          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                            {transferError}
                          </div>
                        )}

                        {transferSuccess && (
                          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                            {transferSuccess}
                          </div>
                        )}

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Recipient Address</label>
                            <input
                              type="text"
                              placeholder="0x..."
                              value={transferData.recipient}
                              onChange={(e) => setTransferData({ ...transferData, recipient: e.target.value })}
                              className="input-field text-sm"
                              disabled={transferring}
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Amount (Max: {formatBalance(holding.balance)})
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={formatBalance(holding.balance)}
                              placeholder="Number of fractions"
                              value={transferData.amount}
                              onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                              className="input-field text-sm"
                              disabled={transferring}
                            />
                          </div>

                          <div className="flex space-x-2 pt-2">
                            <button
                              onClick={() => handleTransfer(holding.propertyId, holding.balance)}
                              disabled={transferring}
                              className="flex-1 btn-primary text-sm py-2 flex items-center justify-center space-x-2"
                            >
                              {transferring ? (
                                <>
                                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Transferring...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>Confirm Transfer</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleCancelTransfer}
                              disabled={transferring}
                              className="flex-1 btn-secondary text-sm py-2"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Listing Form */}
                    {listingForm.show && listingForm.propertyId === holding.propertyId && (
                      <div className="border-t border-gray-200 p-4 bg-white">
                        <h5 className="text-sm font-semibold text-gray-800 mb-3">List Fractions for Resale</h5>

                        {listingError && (
                          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                            {listingError}
                          </div>
                        )}

                        {listingSuccess && (
                          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                            {listingSuccess}
                          </div>
                        )}

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Amount (Max: {formatBalance(holding.balance)})
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={formatBalance(holding.balance)}
                              placeholder="Number of fractions"
                              value={listingData.amount}
                              onChange={(e) => setListingData({ ...listingData, amount: e.target.value })}
                              className="input-field text-sm"
                              disabled={listing}
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Price per fraction (ETH)</label>
                            <input
                              type="number"
                              step="0.0001"
                              min="0"
                              placeholder="0.001"
                              value={listingData.price}
                              onChange={(e) => setListingData({ ...listingData, price: e.target.value })}
                              className="input-field text-sm"
                              disabled={listing}
                            />
                          </div>

                          <div className="flex space-x-2 pt-2">
                            <button
                              onClick={() => handleCreateListing(holding.propertyId, holding.balance)}
                              disabled={listing}
                              className="flex-1 btn-primary text-sm py-2 flex items-center justify-center space-x-2"
                            >
                              {listing ? (
                                <>
                                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Listing...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>Confirm Listing</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleCancelListing}
                              disabled={listing}
                              className="flex-1 btn-secondary text-sm py-2"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rental Income */}
          <RentalIncome
            ownedProperties={nfts.map((nft) => nft.id)}
            heldProperties={fractions.map((holding) => holding.propertyId)}
          />

          {/* My Secondary Market Listings */}
          <MyListings />

          {/* Summary Stats */}
          {(nfts.length > 0 || fractions.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-primary-600 font-medium">Total Properties</p>
                    <p className="text-3xl font-bold text-primary-900 mt-1">{nfts.length}</p>
                  </div>
                  <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Fractional Holdings</p>
                    <p className="text-3xl font-bold text-green-900 mt-1">{fractions.length}</p>
                  </div>
                  <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Total Investments</p>
                    <p className="text-3xl font-bold text-purple-900 mt-1">{nfts.length + fractions.length}</p>
                  </div>
                  <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Portfolio;
