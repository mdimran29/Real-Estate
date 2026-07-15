import { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useProperties } from '../hooks/useProperties';
import { buyFractions, startDistribution } from '../utils/contracts';
import PropertyCard from './PropertyCard';
import SecondaryMarket from './SecondaryMarket';

const Marketplace = ({ showOnlyAvailable = false }) => {
  const { signer, isConnected } = useWeb3();
  const { properties, loading, error, refetch } = useProperties();
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState('');
  const [transactionError, setTransactionError] = useState('');

  // Filter properties if showOnlyAvailable is true
  const displayProperties = showOnlyAvailable 
    ? properties.filter(p => p.details?.fractionsAvailable > 0 && p.details?.isDistributing)
    : properties;

  const handleBuyFractions = async (propertyId, numberOfFractions, pricePerFraction) => {
    if (!isConnected) {
      setTransactionError('Please connect your wallet first');
      return;
    }

    try {
      setTransactionLoading(true);
      setTransactionError('');
      setTransactionStatus('Processing transaction...');

      await buyFractions(signer, propertyId, numberOfFractions, pricePerFraction);
      
      setTransactionStatus('Fractions purchased successfully!');
      
      // Refetch properties to update UI
      setTimeout(() => {
        refetch();
        setTransactionStatus('');
      }, 2000);
    } catch (err) {
      console.error('Error buying fractions:', err);
      setTransactionError(err.message || 'Failed to buy fractions');
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleStartDistribution = async (propertyId, pricePerFraction) => {
    if (!isConnected) {
      setTransactionError('Please connect your wallet first');
      return;
    }

    try {
      setTransactionLoading(true);
      setTransactionError('');
      setTransactionStatus('Step 1/2: Approving PropertyFractions for sale...');

      await startDistribution(signer, propertyId, pricePerFraction);
      
      setTransactionStatus('Distribution started successfully!');
      
      // Refetch properties to update UI
      setTimeout(() => {
        refetch();
        setTransactionStatus('');
      }, 2000);
    } catch (err) {
      console.error('Error starting distribution:', err);
      setTransactionError(err.message || 'Failed to start distribution');
    } finally {
      setTransactionLoading(false);
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
          Please connect your wallet to view and trade property fractions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            {showOnlyAvailable ? 'Buy Property Fractions' : 'Property Marketplace'}
          </h2>
          <p className="text-gray-600 mt-1">
            {showOnlyAvailable 
              ? 'Purchase fractional ownership of available properties' 
              : 'Browse and purchase fractional ownership'}
          </p>
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

      {/* Info Banner - How to Buy Fractions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              How to Buy Property Fractions
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p className="flex items-center space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span><strong>Property Owners:</strong> Click "Start Distribution" on your property to list it for sale</span>
              </p>
              <p className="flex items-center space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span><strong>Buyers:</strong> Properties with "Available" badge can be purchased</span>
              </p>
              <p className="flex items-center space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span><strong>Purchase:</strong> Click "Buy Fractions" on any available property and specify the amount</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {transactionStatus && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">{transactionStatus}</p>
        </div>
      )}

      {transactionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{transactionError}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && properties.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="w-full h-48 bg-gray-300 rounded-lg mb-4"></div>
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="card text-center">
          <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Properties</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={refetch} className="btn-primary">
            Try Again
          </button>
        </div>
      )}

      {/* Properties Grid */}
      {!loading && !error && displayProperties.length === 0 && (
        <div className="card text-center">
          <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {showOnlyAvailable ? 'No Properties Available for Purchase' : 'No Properties Available'}
          </h3>
          <p className="text-gray-600">
            {showOnlyAvailable 
              ? 'Check back later or browse the marketplace to see all properties.' 
              : 'Be the first to tokenize a property!'}
          </p>
        </div>
      )}

      {!loading && !error && displayProperties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onBuyFractions={handleBuyFractions}
              onStartDistribution={handleStartDistribution}
              showActions={!transactionLoading}
            />
          ))}
        </div>
      )}

      {/* Secondary Market - resales from other fraction holders */}
      <SecondaryMarket />

      {/* Transaction Loading Overlay */}
      {transactionLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm mx-4">
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-12 w-12 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Transaction in Progress</h3>
              <p className="text-gray-600 text-center">Please confirm the transaction in your wallet...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
