import { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useProperties } from '../hooks/useProperties';
import { buyFractions, startDistribution } from '../utils/contracts';
import { useToast } from './Toast';
import PropertyCard from './PropertyCard';
import SecondaryMarket from './SecondaryMarket';

const ConnectPrompt = () => (
  <div className="panel max-w-lg mx-auto text-center p-10 animate-fadeUp">
    <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-5">
      <svg className="w-8 h-8 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    </div>
    <h3 className="text-lg font-bold text-white mb-2">Connect your wallet</h3>
    <p className="text-sm text-slate-400">Connect a wallet to browse and trade fractional real estate.</p>
  </div>
);

const CardSkeleton = () => (
  <div className="panel overflow-hidden">
    <div className="h-44 skeleton" />
    <div className="p-5 space-y-3">
      <div className="h-4 w-2/3 skeleton rounded" />
      <div className="h-3 w-1/2 skeleton rounded" />
      <div className="h-3 w-full skeleton rounded" />
      <div className="h-9 w-full skeleton rounded-xl mt-2" />
    </div>
  </div>
);

const Marketplace = ({ showOnlyAvailable = false }) => {
  const { signer, isConnected } = useWeb3();
  const { showToast } = useToast();
  const { properties, loading, error, refetch } = useProperties();
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState('');

  const displayProperties = showOnlyAvailable
    ? properties.filter((p) => p.details?.fractionsAvailable > 0 && p.details?.isDistributing)
    : properties;

  const handleBuyFractions = async (propertyId, numberOfFractions, pricePerFraction) => {
    if (!isConnected) {
      showToast('Please connect your wallet first', 'error');
      return;
    }

    try {
      setTransactionLoading(true);
      setTransactionStatus('Processing transaction…');

      await buyFractions(signer, propertyId, numberOfFractions, pricePerFraction);

      showToast('Fractions purchased successfully!', 'success');
      refetch();
    } catch (err) {
      console.error('Error buying fractions:', err);
      showToast(err.message || 'Failed to buy fractions', 'error');
    } finally {
      setTransactionLoading(false);
      setTransactionStatus('');
    }
  };

  const handleStartDistribution = async (propertyId, pricePerFraction) => {
    if (!isConnected) {
      showToast('Please connect your wallet first', 'error');
      return;
    }

    try {
      setTransactionLoading(true);
      setTransactionStatus('Step 1/2: Approving fractions for sale…');

      await startDistribution(signer, propertyId, pricePerFraction);

      showToast('Distribution started successfully!', 'success');
      refetch();
    } catch (err) {
      console.error('Error starting distribution:', err);
      showToast(err.message || 'Failed to start distribution', 'error');
    } finally {
      setTransactionLoading(false);
      setTransactionStatus('');
    }
  };

  if (!isConnected) return <ConnectPrompt />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeUp">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {showOnlyAvailable ? 'Buy Property Fractions' : 'Property Marketplace'}
          </h2>
          <p className="text-slate-400 mt-1 text-sm">
            {showOnlyAvailable
              ? 'Purchase fractional ownership of available properties'
              : 'Browse and purchase fractional ownership of tokenized real estate'}
          </p>
        </div>
        <button onClick={refetch} disabled={loading} className="btn-secondary self-start sm:self-auto">
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* How it works */}
      <div className="panel p-5 sm:p-6 bg-gradient-to-br from-brand-500/[0.08] to-accent-500/[0.04] border-brand-500/10 animate-fadeUp animate-delay-1">
        <div className="flex items-start gap-4">
          <svg className="w-7 h-7 text-brand-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white mb-3">How to buy property fractions</h3>
            <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                <span><strong className="text-white">Owners</strong> click "Start Distribution" to list their property</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Properties marked <strong className="text-white">"Available"</strong> are open for purchase</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                <span>Click <strong className="text-white">"Buy Fractions"</strong> and choose an amount</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && properties.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {error && !loading && (
        <div className="panel text-center p-10">
          <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-bold text-white mb-2">Error loading properties</h3>
          <p className="text-slate-400 mb-5 text-sm">{error}</p>
          <button onClick={refetch} className="btn-primary">Try Again</button>
        </div>
      )}

      {!loading && !error && displayProperties.length === 0 && (
        <div className="panel text-center p-12">
          <svg className="w-14 h-14 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-bold text-white mb-2">
            {showOnlyAvailable ? 'Nothing available to buy yet' : 'No properties tokenized yet'}
          </h3>
          <p className="text-slate-400 text-sm">
            {showOnlyAvailable
              ? 'Check back later or browse the full marketplace.'
              : 'Be the first to tokenize a property!'}
          </p>
        </div>
      )}

      {!loading && !error && displayProperties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayProperties.map((property, i) => (
            <div key={property.id} className="animate-fadeUp" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
              <PropertyCard
                property={property}
                onBuyFractions={handleBuyFractions}
                onStartDistribution={handleStartDistribution}
                showActions={!transactionLoading}
              />
            </div>
          ))}
        </div>
      )}

      <SecondaryMarket />

      {transactionLoading && (
        <div className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="panel p-8 max-w-sm w-full text-center animate-scaleIn">
            <svg className="animate-spin h-10 w-10 text-brand-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <h3 className="text-base font-bold text-white mb-1.5">Transaction in progress</h3>
            <p className="text-slate-400 text-sm">{transactionStatus || 'Please confirm the transaction in your wallet…'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
