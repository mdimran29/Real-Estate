import { useState, useEffect } from 'react';
import { formatEther, formatAddress, formatFractions, getFractionPriceInUsd, isFeatureAvailable } from '../utils/contracts';
import { useWeb3 } from '../contexts/Web3Context';
import { resolvePropertyImage, getPlaceholderImage } from '../utils/imageHandler';

const PropertyCard = ({ property, onBuyFractions, onStartDistribution, showActions = true }) => {
  const { account, provider } = useWeb3();
  const [numberOfFractions, setNumberOfFractions] = useState(1);
  const [pricePerFraction, setPricePerFraction] = useState('');
  const [showDistributionForm, setShowDistributionForm] = useState(false);
  const [showBuyForm, setShowBuyForm] = useState(false);
  const [imageUrl, setImageUrl] = useState(getPlaceholderImage());
  const [imageLoading, setImageLoading] = useState(true);
  const [usdPrice, setUsdPrice] = useState(null);

  const { id, details, metadata } = property;
  const isOwner = account && details.owner.toLowerCase() === account.toLowerCase();
  const priceInEther = details.pricePerFraction ? formatEther(details.pricePerFraction) : '0';
  const totalPrice = (parseFloat(priceInEther) * numberOfFractions).toFixed(4);

  const totalFractionsFormatted = formatFractions(details.totalFractions);
  const availableFractionsFormatted = formatFractions(details.fractionsAvailable);

  useEffect(() => {
    const loadUsdPrice = async () => {
      if (!provider || !details.isDistributing || !details.pricePerFraction || !isFeatureAvailable('PROPERTY_PRICE_ORACLE')) {
        setUsdPrice(null);
        return;
      }
      const usd = await getFractionPriceInUsd(provider, details.pricePerFraction);
      setUsdPrice(usd);
    };

    loadUsdPrice();
  }, [provider, details.isDistributing, details.pricePerFraction]);

  useEffect(() => {
    const loadImage = async () => {
      if (metadata) {
        setImageLoading(true);
        try {
          const resolvedUrl = await resolvePropertyImage(metadata);
          setImageUrl(resolvedUrl);
        } catch (error) {
          console.error('Failed to load property image:', error);
          setImageUrl(getPlaceholderImage());
        } finally {
          setImageLoading(false);
        }
      }
    };

    loadImage();
  }, [metadata]);

  const handleStartDistribution = () => {
    if (pricePerFraction && parseFloat(pricePerFraction) > 0) {
      onStartDistribution(id, pricePerFraction);
      setShowDistributionForm(false);
      setPricePerFraction('');
    }
  };

  const handleBuyFractions = () => {
    if (numberOfFractions > 0) {
      onBuyFractions(id, numberOfFractions, parseFloat(priceInEther));
      setShowBuyForm(false);
      setNumberOfFractions(1);
    }
  };

  return (
    <div className="panel panel-hover overflow-hidden flex flex-col group">
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-ink-900">
        <img
          src={imageUrl}
          alt={metadata?.name || 'Property'}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onError={(e) => {
            e.target.src = getPlaceholderImage();
          }}
        />
        {imageLoading && (
          <div className="absolute inset-0 skeleton" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-transparent to-transparent" />

        <div className="absolute top-3 right-3">
          {isOwner ? (
            <span className="badge-info bg-brand-500/25">Your Property</span>
          ) : details.isDistributing ? (
            <span className="badge-success">Available</span>
          ) : (
            <span className="badge-neutral">Not Listed</span>
          )}
        </div>

        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-base font-bold text-white truncate drop-shadow-sm">{metadata?.name || `Property #${id}`}</h3>
          <p className="text-[11px] text-slate-300/90">Token ID #{id}</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {metadata?.location && (
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{metadata.location}</span>
          </p>
        )}

        {metadata?.description && (
          <p className="text-sm text-slate-400 line-clamp-2">{metadata.description}</p>
        )}

        <div className="space-y-2 pt-3 mt-auto border-t border-white/5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Owner</span>
            <span className="font-medium text-slate-300">{formatAddress(details.owner)}</span>
          </div>

          {details.isDistributing && (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Price / fraction</span>
                <span className="font-semibold text-brand-300">
                  {priceInEther} ETH
                  {usdPrice !== null && (
                    <span className="text-slate-500 font-normal"> (~${parseFloat(usdPrice).toFixed(2)})</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Available</span>
                <span className="font-medium text-slate-300">
                  {availableFractionsFormatted} / {totalFractionsFormatted}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400"
                  style={{
                    width: `${Math.min(100, (1 - Number(details.fractionsAvailable) / Math.max(1, Number(details.totalFractions))) * 100)}%`,
                  }}
                />
              </div>
            </>
          )}
        </div>

        {showActions && (
          <div className="pt-1">
            {isOwner && !details.isDistributing ? (
              !showDistributionForm ? (
                <button onClick={() => setShowDistributionForm(true)} className="w-full btn-primary">
                  Start Distribution
                </button>
              ) : (
                <div className="space-y-2 animate-fadeIn">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="Price per fraction (ETH)"
                    value={pricePerFraction}
                    onChange={(e) => setPricePerFraction(e.target.value)}
                    className="input-field text-sm py-2"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleStartDistribution} className="flex-1 btn-primary text-xs py-2">
                      Confirm
                    </button>
                    <button onClick={() => setShowDistributionForm(false)} className="flex-1 btn-secondary text-xs py-2">
                      Cancel
                    </button>
                  </div>
                </div>
              )
            ) : details.isDistributing && !isOwner && Number(details.fractionsAvailable) > 0 ? (
              !showBuyForm ? (
                <button onClick={() => setShowBuyForm(true)} className="w-full btn-primary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Buy Fractions</span>
                </button>
              ) : (
                <div className="space-y-3 bg-brand-500/[0.06] p-4 rounded-xl border border-brand-500/20 animate-fadeIn">
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1.5 text-center">Number of fractions</p>
                    <input
                      type="number"
                      min="1"
                      max={details.fractionsAvailable?.toString()}
                      value={numberOfFractions}
                      onChange={(e) => setNumberOfFractions(parseInt(e.target.value) || 1)}
                      className="input-field text-center text-lg font-bold py-2"
                    />
                    <p className="text-[11px] text-slate-500 mt-1 text-center">
                      Max: {details.fractionsAvailable?.toString()}
                    </p>
                  </div>
                  <div className="bg-ink-900/60 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                    <span className="text-xs text-slate-400">Total Cost</span>
                    <span className="text-lg font-bold text-brand-300">{totalPrice} ETH</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleBuyFractions} className="flex-1 btn-primary text-xs py-2.5">
                      Confirm Purchase
                    </button>
                    <button onClick={() => setShowBuyForm(false)} className="flex-1 btn-secondary text-xs py-2.5">
                      Cancel
                    </button>
                  </div>
                </div>
              )
            ) : details.isDistributing && Number(details.fractionsAvailable) === 0 ? (
              <div className="text-center py-2 text-xs text-slate-500 font-medium">All fractions sold</div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;
