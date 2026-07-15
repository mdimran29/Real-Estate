import { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { usePortfolio } from '../hooks/usePortfolio';
import { useToast } from './Toast';
import PropertyCard from './PropertyCard';
import RentalIncome from './RentalIncome';
import MyListings from './MyListings';
import { formatEther, transferFractions, formatFractions, createFractionListing, isFeatureAvailable } from '../utils/contracts';

const StatCard = ({ label, value, icon, gradient }) => (
  <div className={`panel p-5 bg-gradient-to-br ${gradient} animate-fadeUp`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="text-3xl font-bold text-white mt-1 font-display">{value}</p>
      </div>
      <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
    </div>
  </div>
);

const Portfolio = () => {
  const { isConnected, signer } = useWeb3();
  const { showToast } = useToast();
  const { nfts, fractions, loading, error, refetch } = usePortfolio();

  const [transferring, setTransferring] = useState(false);
  const [transferForm, setTransferForm] = useState({ propertyId: null, show: false });
  const [transferData, setTransferData] = useState({ recipient: '', amount: '' });

  const [listing, setListing] = useState(false);
  const [listingForm, setListingForm] = useState({ propertyId: null, show: false });
  const [listingData, setListingData] = useState({ amount: '', price: '' });
  const marketplaceAvailable = isFeatureAvailable('FRACTION_MARKETPLACE');

  const formatBalance = (balance) => {
    try {
      return formatFractions(balance);
    } catch (err) {
      console.error('Error formatting balance:', err);
      return balance;
    }
  };

  const handleShowTransferForm = (propertyId) => {
    setTransferForm({ propertyId, show: true });
    setTransferData({ recipient: '', amount: '' });
    setListingForm({ propertyId: null, show: false });
  };

  const handleTransfer = async (propertyId, balance) => {
    if (!transferData.recipient || !transferData.amount) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    if (!ethers.isAddress(transferData.recipient)) {
      showToast('Invalid recipient address', 'error');
      return;
    }

    const amount = parseInt(transferData.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Invalid amount', 'error');
      return;
    }

    const formattedBalance = parseFloat(formatBalance(balance));
    if (amount > formattedBalance) {
      showToast(`You only have ${formattedBalance} fractions`, 'error');
      return;
    }

    try {
      setTransferring(true);
      const amountInWei = ethers.parseUnits(amount.toString(), 18);
      await transferFractions(signer, propertyId, transferData.recipient, amountInWei);

      showToast(`Successfully transferred ${amount} fractions!`, 'success');
      setTransferForm({ propertyId: null, show: false });
      refetch();
    } catch (err) {
      console.error('Transfer error:', err);
      showToast(err.message || 'Failed to transfer fractions', 'error');
    } finally {
      setTransferring(false);
    }
  };

  const handleShowListingForm = (propertyId) => {
    setListingForm({ propertyId, show: true });
    setListingData({ amount: '', price: '' });
    setTransferForm({ propertyId: null, show: false });
  };

  const handleCreateListing = async (propertyId, balance) => {
    const amount = parseInt(listingData.amount);
    const price = parseFloat(listingData.price);

    if (isNaN(amount) || amount <= 0) {
      showToast('Invalid amount', 'error');
      return;
    }
    if (isNaN(price) || price <= 0) {
      showToast('Invalid price', 'error');
      return;
    }

    const formattedBalance = parseFloat(formatBalance(balance));
    if (amount > formattedBalance) {
      showToast(`You only have ${formattedBalance} fractions`, 'error');
      return;
    }

    try {
      setListing(true);
      const amountInWei = ethers.parseUnits(amount.toString(), 18);
      const priceInWei = ethers.parseEther(price.toString());

      await createFractionListing(signer, propertyId, amountInWei, priceInWei);

      showToast(`Successfully listed ${amount} fractions for sale!`, 'success');
      setListingForm({ propertyId: null, show: false });
      refetch();
    } catch (err) {
      console.error('Listing error:', err);
      showToast(err.message || 'Failed to create listing', 'error');
    } finally {
      setListing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="panel max-w-lg mx-auto text-center p-10 animate-fadeUp">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Connect your wallet</h3>
        <p className="text-sm text-slate-400">Connect a wallet to view your properties and fractional holdings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeUp">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">My Portfolio</h2>
          <p className="text-slate-400 mt-1 text-sm">Your property NFTs, fractional holdings, and rental income</p>
        </div>
        <button onClick={refetch} disabled={loading} className="btn-secondary self-start sm:self-auto">
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {loading && (
        <div className="panel p-6 animate-fadeUp">
          <div className="h-6 w-40 skeleton rounded mb-5" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2].map((i) => <div key={i} className="h-64 skeleton rounded-xl" />)}
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="panel text-center p-10">
          <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-bold text-white mb-2">Error loading portfolio</h3>
          <p className="text-slate-400 mb-5 text-sm">{error}</p>
          <button onClick={refetch} className="btn-primary">Try Again</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary stats */}
          {(nfts.length > 0 || fractions.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Properties Owned"
                value={nfts.length}
                gradient="from-brand-500/10 to-brand-500/[0.02] border-brand-500/10"
                icon={
                  <svg className="w-5 h-5 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                }
              />
              <StatCard
                label="Fractional Holdings"
                value={fractions.length}
                gradient="from-accent-500/10 to-accent-500/[0.02] border-accent-500/10"
                icon={
                  <svg className="w-5 h-5 text-accent-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Total Investments"
                value={nfts.length + fractions.length}
                gradient="from-amber-500/10 to-amber-500/[0.02] border-amber-500/10"
                icon={
                  <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              />
            </div>
          )}

          {/* Property NFTs */}
          <div className="panel p-5 sm:p-6 animate-fadeUp">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Property Deeds (NFTs)</h3>
                <p className="text-xs text-slate-400">Properties you fully own</p>
              </div>
              <span className="text-xl font-bold text-brand-300">{nfts.length}</span>
            </div>

            {nfts.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">You don't own any property NFTs yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {nfts.map((property) => (
                  <PropertyCard key={property.id} property={property} showActions={false} />
                ))}
              </div>
            )}
          </div>

          {/* Fractional holdings */}
          <div className="panel p-5 sm:p-6 animate-fadeUp">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-accent-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Fractional Holdings</h3>
                <p className="text-xs text-slate-400">Properties you own fractions of</p>
              </div>
              <span className="text-xl font-bold text-accent-300">{fractions.length}</span>
            </div>

            {fractions.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">You don't own any fractional shares yet.</div>
            ) : (
              <div className="space-y-3">
                {fractions.map((holding) => (
                  <div key={holding.propertyId} className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
                    <div className="flex items-center p-4 gap-4 flex-wrap">
                      <div className="flex-shrink-0">
                        {holding.metadata?.image ? (
                          <img src={holding.metadata.image} alt={holding.metadata.name} className="w-16 h-16 object-cover rounded-xl" />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-[140px]">
                        <h4 className="font-semibold text-slate-100 text-sm truncate">
                          {holding.metadata?.name || `Property #${holding.propertyId}`}
                        </h4>
                        <p className="text-xs text-slate-500">Token ID #{holding.propertyId}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-brand-300 font-display">{formatBalance(holding.balance)}</div>
                        <div className="text-[11px] text-slate-500">of {formatFractions(holding.details?.totalFractions)}</div>
                        {holding.details?.pricePerFraction && (
                          <div className="text-[11px] text-slate-600">@ {formatEther(holding.details.pricePerFraction)} ETH</div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleShowTransferForm(holding.propertyId)}
                          className="btn-secondary text-xs py-2 px-3"
                          disabled={transferring}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          <span>Transfer</span>
                        </button>
                        {marketplaceAvailable && (
                          <button
                            onClick={() => handleShowListingForm(holding.propertyId)}
                            className="btn-secondary text-xs py-2 px-3"
                            disabled={listing}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span>List for Resale</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {transferForm.show && transferForm.propertyId === holding.propertyId && (
                      <div className="border-t border-white/[0.06] p-4 bg-ink-900/40 animate-fadeIn">
                        <h5 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wide">Transfer Fractions</h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">Recipient Address</label>
                            <input
                              type="text"
                              placeholder="0x..."
                              value={transferData.recipient}
                              onChange={(e) => setTransferData({ ...transferData, recipient: e.target.value })}
                              className="input-field text-sm py-2"
                              disabled={transferring}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                              Amount (Max: {formatBalance(holding.balance)})
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={formatBalance(holding.balance)}
                              placeholder="Number of fractions"
                              value={transferData.amount}
                              onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                              className="input-field text-sm py-2"
                              disabled={transferring}
                            />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleTransfer(holding.propertyId, holding.balance)}
                              disabled={transferring}
                              className="flex-1 btn-primary text-xs py-2"
                            >
                              {transferring ? 'Transferring…' : 'Confirm Transfer'}
                            </button>
                            <button
                              onClick={() => setTransferForm({ propertyId: null, show: false })}
                              disabled={transferring}
                              className="flex-1 btn-secondary text-xs py-2"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {listingForm.show && listingForm.propertyId === holding.propertyId && (
                      <div className="border-t border-white/[0.06] p-4 bg-ink-900/40 animate-fadeIn">
                        <h5 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wide">List Fractions for Resale</h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                              Amount (Max: {formatBalance(holding.balance)})
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={formatBalance(holding.balance)}
                              placeholder="Number of fractions"
                              value={listingData.amount}
                              onChange={(e) => setListingData({ ...listingData, amount: e.target.value })}
                              className="input-field text-sm py-2"
                              disabled={listing}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">Price per fraction (ETH)</label>
                            <input
                              type="number"
                              step="0.0001"
                              min="0"
                              placeholder="0.001"
                              value={listingData.price}
                              onChange={(e) => setListingData({ ...listingData, price: e.target.value })}
                              className="input-field text-sm py-2"
                              disabled={listing}
                            />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleCreateListing(holding.propertyId, holding.balance)}
                              disabled={listing}
                              className="flex-1 btn-primary text-xs py-2"
                            >
                              {listing ? 'Listing…' : 'Confirm Listing'}
                            </button>
                            <button
                              onClick={() => setListingForm({ propertyId: null, show: false })}
                              disabled={listing}
                              className="flex-1 btn-secondary text-xs py-2"
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

          <RentalIncome
            ownedProperties={nfts.map((nft) => nft.id)}
            heldProperties={fractions.map((holding) => holding.propertyId)}
          />

          <MyListings />
        </>
      )}
    </div>
  );
};

export default Portfolio;
