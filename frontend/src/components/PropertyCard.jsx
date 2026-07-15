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

  // Format fractions for display (convert from wei to readable numbers)
  const totalFractionsFormatted = formatFractions(details.totalFractions);
  const availableFractionsFormatted = formatFractions(details.fractionsAvailable);

  // Fetch USD price via the Chainlink oracle, if deployed on this network
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

  // Load image with fallbacks
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
    <div className="card hover:shadow-xl transition-shadow duration-300">
      {/* Property Image with Loading State */}
      <div className="relative">
        <img
          src={imageUrl}
          alt={metadata?.name || 'Property'}
          className={`w-full h-48 object-cover rounded-lg mb-4 transition-opacity duration-300 ${
            imageLoading ? 'opacity-50' : 'opacity-100'
          }`}
          onError={(e) => {
            console.warn('Image failed to load, using placeholder');
            e.target.src = getPlaceholderImage();
          }}
        />
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}
        
        {/* Badge */}
        <div className="absolute top-2 right-2">
          {isOwner ? (
            <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
              Your Property
            </span>
          ) : details.isDistributing ? (
            <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
              Available
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-500 text-white text-xs font-semibold rounded-full">
              Not Listed
            </span>
          )}
        </div>
      </div>

      {/* Property Info */}
      <div className="space-y-3">
        <div>
          <h3 className="text-xl font-bold text-gray-800">{metadata?.name || `Property #${id}`}</h3>
          <p className="text-sm text-gray-500 mt-1">Token ID: #{id}</p>
          {metadata?.location && (
            <p className="text-sm text-gray-600 mt-1 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {metadata.location}
            </p>
          )}
          {metadata?.propertyType && (
            <p className="text-xs text-gray-500 mt-1">
              Type: {metadata.propertyType}
            </p>
          )}
        </div>

        {metadata?.description && (
          <p className="text-gray-600 text-sm line-clamp-2">{metadata.description}</p>
        )}

        {/* Property Details */}
        <div className="space-y-2 pt-3 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Owner:</span>
            <span className="font-medium text-gray-800">{formatAddress(details.owner)}</span>
          </div>
          
          {details.isDistributing && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Price per Fraction:</span>
                <span className="font-medium text-primary-600">
                  {priceInEther} ETH
                  {usdPrice !== null && (
                    <span className="text-gray-500 font-normal"> (~${parseFloat(usdPrice).toFixed(2)})</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available Fractions:</span>
                <span className="font-medium text-gray-800">
                  {availableFractionsFormatted} / {totalFractionsFormatted}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="pt-4 space-y-2">
            {isOwner && !details.isDistributing ? (
              // Owner can start distribution
              <div>
                {!showDistributionForm ? (
                  <button
                    onClick={() => setShowDistributionForm(true)}
                    className="w-full btn-primary"
                  >
                    Start Distribution
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="Price per fraction (ETH)"
                      value={pricePerFraction}
                      onChange={(e) => setPricePerFraction(e.target.value)}
                      className="input-field text-sm"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleStartDistribution}
                        className="flex-1 btn-primary text-sm py-2"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setShowDistributionForm(false)}
                        className="flex-1 btn-secondary text-sm py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : details.isDistributing && !isOwner && Number(details.fractionsAvailable) > 0 ? (
              // Non-owners can buy fractions
              <div>
                {!showBuyForm ? (
                  <button
                    onClick={() => setShowBuyForm(true)}
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Buy Fractions</span>
                  </button>
                ) : (
                  <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-2">Number of fractions</p>
                      <input
                        type="number"
                        min="1"
                        max={details.fractionsAvailable?.toString()}
                        value={numberOfFractions}
                        onChange={(e) => setNumberOfFractions(parseInt(e.target.value) || 1)}
                        className="input-field text-center text-lg font-semibold"
                        placeholder="1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Max: {details.fractionsAvailable?.toString()} fractions
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Cost:</span>
                        <span className="text-xl font-bold text-primary-600">{totalPrice} ETH</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleBuyFractions}
                        className="flex-1 btn-primary text-sm py-3"
                      >
                        💳 Confirm Purchase
                      </button>
                      <button
                        onClick={() => setShowBuyForm(false)}
                        className="flex-1 btn-secondary text-sm py-3"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : details.isDistributing && Number(details.fractionsAvailable) === 0 ? (
              <div className="text-center py-2 text-sm text-gray-500">
                All fractions sold
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;
