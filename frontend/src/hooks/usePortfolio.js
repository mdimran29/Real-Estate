import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { getUserPropertyNFTs, getUserFractionalHoldings } from '../utils/contracts';

/**
 * Hook to fetch user's portfolio (NFTs and fractional holdings)
 */
export const usePortfolio = () => {
  const { provider, account, isConnected } = useWeb3();
  const [nfts, setNfts] = useState([]);
  const [fractions, setFractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPortfolio = async () => {
    if (!provider || !account || !isConnected) return;

    try {
      setLoading(true);
      setError(null);

      const [userNFTs, userFractions] = await Promise.all([
        getUserPropertyNFTs(provider, account),
        getUserFractionalHoldings(provider, account),
      ]);

      setNfts(userNFTs);
      setFractions(userFractions);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [provider, account, isConnected]);

  return { nfts, fractions, loading, error, refetch: fetchPortfolio };
};
