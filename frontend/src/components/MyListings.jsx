import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useToast } from './Toast';
import {
  isFeatureAvailable,
  getAllActiveListings,
  cancelFractionListing,
  formatEther,
  formatFractions,
} from '../utils/contracts';

/**
 * Shows the connected account's own active secondary-market listings, with
 * a Cancel action for each.
 */
const MyListings = () => {
  const { account, signer, provider, isConnected } = useWeb3();
  const { showToast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  const featureAvailable = isFeatureAvailable('FRACTION_MARKETPLACE');

  const refresh = useCallback(async () => {
    if (!featureAvailable || !provider || !account || !isConnected) return;

    try {
      setLoading(true);
      const all = await getAllActiveListings(provider);
      setListings(all.filter((l) => l.seller.toLowerCase() === account.toLowerCase()));
    } finally {
      setLoading(false);
    }
  }, [featureAvailable, provider, account, isConnected]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!featureAvailable || listings.length === 0) {
    return null;
  }

  const handleCancel = async (listingId) => {
    try {
      setCancelling(listingId);
      await cancelFractionListing(signer, listingId);
      showToast('Listing cancelled', 'success');
      await refresh();
    } catch (err) {
      console.error('Error cancelling listing:', err);
      showToast(err.message || 'Failed to cancel listing', 'error');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center mb-6">
        <svg className="w-8 h-8 mr-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <div>
          <h3 className="text-2xl font-bold text-gray-800">My Secondary Market Listings</h3>
          <p className="text-sm text-gray-600">Fractions you've listed for resale</p>
        </div>
        <span className="ml-auto text-2xl font-bold text-primary-600">{listings.length}</span>
      </div>

      <div className="space-y-3">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div>
              <p className="font-semibold text-gray-800">Property #{listing.propertyId}</p>
              <p className="text-sm text-gray-600">
                {formatFractions(listing.amount)} fractions @ {formatEther(listing.pricePerFraction)} ETH each
              </p>
            </div>
            <button
              onClick={() => handleCancel(listing.id)}
              disabled={cancelling === listing.id}
              className="btn-secondary text-sm py-2 px-4 text-red-600 hover:bg-red-50"
            >
              {cancelling === listing.id ? 'Cancelling...' : 'Cancel Listing'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyListings;
