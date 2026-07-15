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
    <div className="panel p-5 sm:p-6 animate-fadeUp">
      <div className="flex items-center justify-between mb-5 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-accent-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Secondary Market</h3>
            <p className="text-xs text-slate-400">Buy fractions resold by other holders</p>
          </div>
        </div>
        <button onClick={refresh} disabled={loading} className="btn-ghost text-xs">
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {otherListings.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          No secondary market listings available right now.
        </div>
      ) : (
        <div className="space-y-3">
          {otherListings.map((listing) => (
            <div key={listing.id} className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="flex items-center justify-between p-4 gap-3 flex-wrap">
                <div>
                  <p className="font-semibold text-slate-100 text-sm">Property #{listing.propertyId}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatFractions(listing.amount)} fractions @ {formatEther(listing.pricePerFraction)} ETH each
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Seller: {formatAddress(listing.seller)}</p>
                </div>
                <button
                  onClick={() => setBuyForm({ listingId: listing.id, amount: '' })}
                  className="btn-accent text-xs py-2 px-4"
                  disabled={buying}
                >
                  Buy
                </button>
              </div>

              {buyForm.listingId === listing.id && (
                <div className="border-t border-white/[0.06] p-4 bg-ink-900/40 space-y-3 animate-fadeIn">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Amount (Max: {formatFractions(listing.amount)})
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={formatFractions(listing.amount)}
                      placeholder="Number of fractions"
                      value={buyForm.amount}
                      onChange={(e) => setBuyForm({ ...buyForm, amount: e.target.value })}
                      className="input-field text-sm py-2"
                      disabled={buying}
                    />
                  </div>
                  {buyForm.amount && !isNaN(parseFloat(buyForm.amount)) && (
                    <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.06] flex justify-between items-center text-sm">
                      <span className="text-slate-400">Total Cost</span>
                      <span className="font-bold text-accent-300">
                        {(parseFloat(buyForm.amount) * parseFloat(formatEther(listing.pricePerFraction))).toFixed(6)} ETH
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => handleBuy(listing)} disabled={buying} className="flex-1 btn-accent text-xs py-2">
                      {buying ? 'Buying…' : 'Confirm Purchase'}
                    </button>
                    <button
                      onClick={() => setBuyForm({ listingId: null, amount: '' })}
                      disabled={buying}
                      className="flex-1 btn-secondary text-xs py-2"
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
