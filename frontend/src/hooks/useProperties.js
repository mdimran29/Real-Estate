import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { 
  getAllProperties, 
  getPropertyDetails, 
  getPropertyMetadata 
} from '../utils/contracts';

/**
 * Hook to fetch all properties with their details
 */
export const useProperties = () => {
  const { provider, isConnected } = useWeb3();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProperties = async () => {
    if (!provider || !isConnected) return;

    try {
      setLoading(true);
      setError(null);

      const propertyIds = await getAllProperties(provider);
      
      const propertiesData = await Promise.all(
        propertyIds.map(async (id) => {
          try {
            const details = await getPropertyDetails(provider, id);
            const metadata = await getPropertyMetadata(provider, id);
            
            return {
              id,
              details,
              metadata,
            };
          } catch (err) {
            console.error(`Error fetching property ${id}:`, err);
            return null;
          }
        })
      );

      setProperties(propertiesData.filter(p => p !== null));
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [provider, isConnected]);

  return { properties, loading, error, refetch: fetchProperties };
};
