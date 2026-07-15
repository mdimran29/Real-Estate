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

  if (!featureAvailable) return null;

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
    <div className="panel p-5 sm:p-6 animate-fadeUp">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">My Secondary Market Listings</h3>
          <p className="text-xs text-slate-400">Fractions you've listed for resale</p>
        </div>
        <span className="text-xl font-bold text-brand-300">{listings.length}</span>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500 text-sm">Loading your listings…</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          You haven't listed any fractions for resale yet. Use "List for Resale" in your
          Fractional Holdings above to sell at your own price.
        </div>
      ) : (
        <div className="space-y-2.5">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/[0.06] gap-3 flex-wrap"
            >
              <div>
                <p className="font-semibold text-slate-100 text-sm">Property #{listing.propertyId}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatFractions(listing.amount)} fractions @ {formatEther(listing.pricePerFraction)} ETH each
                </p>
              </div>
              <button
                onClick={() => handleCancel(listing.id)}
                disabled={cancelling === listing.id}
                className="btn-danger text-xs py-2 px-4"
              >
                {cancelling === listing.id ? 'Cancelling…' : 'Cancel Listing'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyListings;
