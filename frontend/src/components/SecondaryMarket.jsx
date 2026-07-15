import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { useToast } from './Toast';
import {
  isFeatureAvailable,
  getAllActiveListings,
  buyFractionListing,
  formatEther,
  formatFractions,
  formatAddress,
} from '../utils/contracts';

/**
 * Browse and buy secondary-market fraction listings from other holders
 * (as opposed to Marketplace.jsx's primary sale flow from the original
 * property owner via TokenizationManager).
 */
const SecondaryMarket = () => {
  const { account, signer, provider, isConnected } = useWeb3();
  const { showToast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buyForm, setBuyForm] = useState({ listingId: null, amount: '' });
  const [buying, setBuying] = useState(false);

  const featureAvailable = isFeatureAvailable('FRACTION_MARKETPLACE');

  const refresh = useCallback(async () => {
    if (!featureAvailable || !provider || !isConnected) return;

    try {
      setLoading(true);
      const all = await getAllActiveListings(provider);
      setListings(all);
    } finally {
      setLoading(false);
    }
  }, [featureAvailable, provider, isConnected]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!featureAvailable || !isConnected) {
    return null;
  }

  const otherListings = listings.filter(
    (listing) => listing.seller.toLowerCase() !== (account || '').toLowerCase()
  );

  const handleBuy = async (listing) => {
    const amountNum = parseInt(buyForm.amount);
    const maxAmount = parseFloat(formatFractions(listing.amount));

    if (!amountNum || amountNum <= 0 || amountNum > maxAmount) {
      showToast(`Enter a valid amount (max ${maxAmount})`, 'error');
      return;
    }

    try {
      setBuying(true);
      const amountInWei = ethers.parseUnits(amountNum.toString(), 18);

      await buyFractionListing(signer, listing.id, amountInWei, listing.pricePerFraction);

      showToast('Fractions purchased successfully!', 'success');
      setBuyForm({ listingId: null, amount: '' });
      await refresh();
    } catch (err) {
      console.error('Error buying listing:', err);
      showToast(err.message || 'Failed to buy listing', 'error');
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <svg className="w-8 h-8 mr-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Secondary Market</h3>
            <p className="text-sm text-gray-600">Buy fractions resold by other holders, at their own price</p>
          </div>
        </div>
        <button onClick={refresh} disabled={loading} className="btn-secondary text-sm py-2 px-4">
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {otherListings.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          No secondary market listings available right now.
        </div>
      ) : (
        <div className="space-y-3">
          {otherListings.map((listing) => (
            <div key={listing.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold text-gray-800">Property #{listing.propertyId}</p>
                  <p className="text-sm text-gray-600">
                    {formatFractions(listing.amount)} fractions available @ {formatEther(listing.pricePerFraction)} ETH each
                  </p>
                  <p className="text-xs text-gray-500">Seller: {formatAddress(listing.seller)}</p>
                </div>
                <button
                  onClick={() => setBuyForm({ listingId: listing.id, amount: '' })}
                  className="btn-primary text-sm py-2 px-4"
                  disabled={buying}
                >
                  Buy
                </button>
              </div>

              {buyForm.listingId === listing.id && (
                <div className="border-t border-gray-200 p-4 bg-white space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Amount (Max: {formatFractions(listing.amount)})
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={formatFractions(listing.amount)}
                      placeholder="Number of fractions"
                      value={buyForm.amount}
                      onChange={(e) => setBuyForm({ ...buyForm, amount: e.target.value })}
                      className="input-field text-sm"
                      disabled={buying}
                    />
                  </div>
                  {buyForm.amount && !isNaN(parseFloat(buyForm.amount)) && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Total Cost:</span>
                        <span className="font-bold text-primary-600">
                          {(parseFloat(buyForm.amount) * parseFloat(formatEther(listing.pricePerFraction))).toFixed(6)} ETH
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleBuy(listing)}
                      disabled={buying}
                      className="flex-1 btn-primary text-sm py-2"
                    >
                      {buying ? 'Buying...' : 'Confirm Purchase'}
                    </button>
                    <button
                      onClick={() => setBuyForm({ listingId: null, amount: '' })}
                      disabled={buying}
                      className="flex-1 btn-secondary text-sm py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SecondaryMarket;
