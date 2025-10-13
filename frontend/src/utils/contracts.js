import { ethers } from 'ethers';
import { 
  TOKENIZATION_MANAGER_ABI, 
  PROPERTY_DEED_ABI, 
  PROPERTY_FRACTIONS_ABI,
  ADDRESSES 
} from '../contracts/abis';

/**
 * Get contract instance
 */
export const getContract = (contractName, signerOrProvider) => {
  const address = ADDRESSES[contractName];
  let abi;

  switch (contractName) {
    case 'TOKENIZATION_MANAGER':
      abi = TOKENIZATION_MANAGER_ABI;
      break;
    case 'PROPERTY_DEED':
      abi = PROPERTY_DEED_ABI;
      break;
    case 'PROPERTY_FRACTIONS':
      abi = PROPERTY_FRACTIONS_ABI;
      break;
    default:
      throw new Error(`Unknown contract: ${contractName}`);
  }

  return new ethers.Contract(address, abi, signerOrProvider);
};

/**
 * Tokenize a new property
 * @param {Object} signer - Ethers signer
 * @param {string} propertyAddress - Physical property address
 * @param {string} metadataURI - IPFS metadata URI
 */
export const tokenizeProperty = async (signer, propertyAddress, metadataURI) => {
  try {
    const contract = getContract('TOKENIZATION_MANAGER', signer);
    const tx = await contract.tokenizeProperty(propertyAddress, metadataURI);
    const receipt = await tx.wait();
    
    // Extract PropertyTokenized event
    const event = receipt.logs.find(
      log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'PropertyTokenized';
        } catch {
          return false;
        }
      }
    );

    if (event) {
      const parsed = contract.interface.parseLog(event);
      return {
        propertyId: parsed.args.propertyId.toString(),
        fractionsContract: parsed.args.fractionsContract,
        transactionHash: receipt.hash,
      };
    }

    throw new Error('PropertyTokenized event not found');
  } catch (error) {
    console.error('Error tokenizing property:', error);
    throw error;
  }
};

/**
 * Start distribution of property fractions
 * This function approves the TokenizationManager to spend PropertyFractions tokens,
 * then initiates the distribution process
 */
export const startDistribution = async (signer, propertyId, pricePerFraction) => {
  try {
    // Step 1: Get the property details to find the fractions contract
    const managerContract = getContract('TOKENIZATION_MANAGER', signer);
    const property = await managerContract.getTokenizedProperty(propertyId);
    
    // Step 2: Get PropertyFractions contract
    const fractionsContract = new ethers.Contract(
      property.fractionsContract,
      PROPERTY_FRACTIONS_ABI,
      signer
    );
    
    // Step 3: Get owner's balance
    const ownerAddress = await signer.getAddress();
    const ownerBalance = await fractionsContract.balanceOf(ownerAddress);
    
    console.log('Owner balance:', ethers.formatUnits(ownerBalance, 18), 'fractions');
    
    // Step 4: Approve TokenizationManager to spend ALL owner's fractions
    console.log('Approving TokenizationManager to spend PropertyFractions...');
    const tokenizationManagerAddress = ADDRESSES.TOKENIZATION_MANAGER;
    const approvalTx = await fractionsContract.approve(tokenizationManagerAddress, ownerBalance);
    await approvalTx.wait();
    console.log('Approval granted for', ethers.formatUnits(ownerBalance, 18), 'fractions');
    
    // Step 5: Start distribution
    const priceInWei = ethers.parseEther(pricePerFraction.toString());
    console.log('Starting distribution...');
    const tx = await managerContract.startDistribution(propertyId, priceInWei);
    const receipt = await tx.wait();
    console.log('Distribution started successfully');
    return receipt;
  } catch (error) {
    console.error('Error starting distribution:', error);
    throw error;
  }
};

/**
 * Buy property fractions
 */
export const buyFractions = async (signer, propertyId, numberOfFractions, pricePerFraction) => {
  try {
    const contract = getContract('TOKENIZATION_MANAGER', signer);
    const totalPrice = ethers.parseEther((numberOfFractions * pricePerFraction).toString());
    const tx = await contract.buyFractions(propertyId, numberOfFractions, {
      value: totalPrice,
    });
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error('Error buying fractions:', error);
    throw error;
  }
};

/**
 * Get property details
 */
export const getPropertyDetails = async (provider, propertyId) => {
  try {
    const contract = getContract('TOKENIZATION_MANAGER', provider);
    const details = await contract.getTokenizedProperty(propertyId);
    
    // Get total fractions and owner's available balance from PropertyFractions contract
    let totalFractions = BigInt(0);
    let availableFractions = BigInt(0);
    
    if (details.fractionsContract && details.fractionsContract !== ethers.ZeroAddress) {
      const fractionsContract = new ethers.Contract(
        details.fractionsContract,
        PROPERTY_FRACTIONS_ABI,
        provider
      );
      
      // Get total supply (1M fractions)
      totalFractions = await fractionsContract.totalSupply();
      
      // Get owner's current balance (what's available for sale)
      const ownerBalance = await fractionsContract.balanceOf(details.owner);
      availableFractions = ownerBalance;
    }
    
    return {
      owner: details.owner,
      pricePerFraction: details.pricePerFraction,
      isDistributing: details.isDistributing,
      totalFractions: totalFractions,
      fractionsAvailable: availableFractions,
      fractionsSold: details.totalFractionsSold,
      fractionsContract: details.fractionsContract,
    };
  } catch (error) {
    console.error('Error getting property details:', error);
    throw error;
  }
};

/**
 * Get all properties
 */
export const getAllProperties = async (provider) => {
  try {
    const contract = getContract('TOKENIZATION_MANAGER', provider);
    const propertyIds = await contract.getAllPropertyIds();
    return propertyIds.map(id => id.toString());
  } catch (error) {
    console.error('Error getting all properties:', error);
    throw error;
  }
};

/**
 * Get properties by owner
 */
export const getPropertiesByOwner = async (provider, ownerAddress) => {
  try {
    // Get all property IDs first
    const allPropertyIds = await getAllProperties(provider);
    
    // Filter properties owned by the address
    const ownedProperties = [];
    for (const id of allPropertyIds) {
      const details = await getPropertyDetails(provider, id);
      if (details.owner.toLowerCase() === ownerAddress.toLowerCase()) {
        ownedProperties.push(id);
      }
    }
    
    return ownedProperties;
  } catch (error) {
    console.error('Error getting properties by owner:', error);
    throw error;
  }
};

/**
 * Convert IPFS URI to HTTP gateway URL
 */
const convertIpfsToHttp = (uri) => {
  if (!uri) return uri;
  
  // Extract IPFS hash from various formats
  let hash = uri;
  
  // If it's already an HTTP URL, extract the hash and rebuild
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    // Fix broken cloudflare-ipfs.com URLs (DNS doesn't resolve)
    if (uri.includes('cloudflare-ipfs.com')) {
      // Extract hash from URL
      const match = uri.match(/\/ipfs\/([^?#]+)/);
      if (match) {
        hash = match[1];
      }
    } else {
      // Other HTTP URLs are fine
      return uri;
    }
  } else if (uri.startsWith('ipfs://')) {
    hash = uri.replace('ipfs://', '');
  }
  
  // Use reliable public IPFS gateway (no CORS issues, fast)
  return `https://ipfs.io/ipfs/${hash}`;
};

/**
 * Fetch from IPFS with multiple gateway fallbacks and timeout
 */
const fetchFromIPFS = async (uri) => {
  const gateways = [
    'https://ipfs.io/ipfs/',              // Most reliable, widely used
    'https://dweb.link/ipfs/',            // Fast and reliable
    'https://gateway.pinata.cloud/ipfs/', // Good for pinned content
    'https://nftstorage.link/ipfs/',      // NFT-focused gateway
    'https://w3s.link/ipfs/',             // Web3.Storage gateway
    'https://cf-ipfs.com/ipfs/'           // Cloudflare's actual IPFS domain
  ];
  
  // Extract hash from URI
  let hash = uri;
  if (uri.startsWith('ipfs://')) {
    hash = uri.replace('ipfs://', '');
  } else if (uri.startsWith('http')) {
    // Extract hash from URL
    const match = uri.match(/\/ipfs\/([^/?]+)/);
    if (match) hash = match[1];
    else return {}; // Can't extract hash
  }
  
  // Helper function to fetch with timeout
  const fetchWithTimeout = async (url, timeout = 10000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };
  
  // Try each gateway with timeout
  for (const gateway of gateways) {
    try {
      const url = `${gateway}${hash}`;
      console.log('Trying IPFS gateway:', gateway);
      const data = await fetchWithTimeout(url, 8000); // 8 second timeout per gateway
      console.log('✅ Successfully fetched from:', gateway);
      return data;
    } catch (error) {
      console.warn(`Gateway ${gateway} failed:`, error.message);
      continue;
    }
  }
  
  console.error('All IPFS gateways failed for hash:', hash);
  throw new Error('Failed to fetch from all IPFS gateways');
};

/**
 * Get property deed NFT metadata
 */
export const getPropertyMetadata = async (provider, propertyId) => {
  try {
    // Get property details first
    const managerContract = getContract('TOKENIZATION_MANAGER', provider);
    const property = await managerContract.getTokenizedProperty(propertyId);
    
    // The propertyId IS the deedId (they're the same in the contract)
    const deedId = propertyId;
    
    // Get token URI from PropertyDeed contract
    const deedContract = getContract('PROPERTY_DEED', provider);
    const propertyInfo = await deedContract.getPropertyInfo(deedId);
    
    // Default metadata in case IPFS fails
    const defaultMetadata = {
      name: `Property #${propertyId}`,
      description: 'Tokenized Real Estate Property',
      propertyAddress: propertyInfo.propertyAddress || 'N/A',
      creationTimestamp: propertyInfo.creationTimestamp?.toString() || 'N/A',
    };
    
    // Fetch metadata from IPFS with timeout
    if (propertyInfo.metadataURI) {
      try {
        console.log('Fetching metadata for property', propertyId);
        
        const metadata = await fetchFromIPFS(propertyInfo.metadataURI);
        
        // Fix all image URLs (including broken cloudflare-ipfs.com URLs)
        if (metadata.image) {
          const fixedImage = convertIpfsToHttp(metadata.image);
          metadata.image = fixedImage;
          console.log('✅ Image URL fixed:', fixedImage);
        }
        
        // Also fix any other image properties that might exist
        if (metadata.propertyImage) {
          metadata.propertyImage = convertIpfsToHttp(metadata.propertyImage);
        }
        
        return {
          ...metadata,
          propertyAddress: propertyInfo.propertyAddress,
          creationTimestamp: propertyInfo.creationTimestamp.toString(),
        };
      } catch (ipfsError) {
        console.warn('IPFS fetch failed for property', propertyId, '- using default metadata');
        return defaultMetadata;
      }
    }
    
    return defaultMetadata;
  } catch (error) {
    console.error('Error getting property metadata:', error);
    return {
      name: `Property #${propertyId}`,
      description: 'Tokenized Real Estate Property (Metadata unavailable)',
      propertyAddress: 'N/A',
    };
  }
};

/**
 * Get fraction balance for a user
 */
export const getFractionBalance = async (provider, userAddress, propertyId) => {
  try {
    // Get the property details to get the fractions contract address
    const managerContract = getContract('TOKENIZATION_MANAGER', provider);
    const property = await managerContract.getTokenizedProperty(propertyId);
    
    // If no fractions contract exists, return 0
    if (!property.fractionsContract || property.fractionsContract === ethers.ZeroAddress) {
      return '0';
    }
    
    // Create instance of the property's fraction token contract
    const fractionsContract = new ethers.Contract(
      property.fractionsContract,
      PROPERTY_FRACTIONS_ABI,
      provider
    );
    
    // ERC20 balanceOf only takes the address parameter
    const balance = await fractionsContract.balanceOf(userAddress);
    return balance.toString();
  } catch (error) {
    console.error('Error getting fraction balance:', error);
    return '0'; // Return 0 instead of throwing to prevent UI crashes
  }
};

/**
 * Get all property NFTs owned by user
 */
export const getUserPropertyNFTs = async (provider, userAddress) => {
  try {
    const propertyIds = await getPropertiesByOwner(provider, userAddress);
    
    const properties = await Promise.all(
      propertyIds.map(async (id) => {
        const metadata = await getPropertyMetadata(provider, id);
        const details = await getPropertyDetails(provider, id);
        
        return {
          id,
          metadata,
          details,
        };
      })
    );
    
    return properties;
  } catch (error) {
    console.error('Error getting user property NFTs:', error);
    throw error;
  }
};

/**
 * Get all fractional holdings for a user
 */
export const getUserFractionalHoldings = async (provider, userAddress) => {
  try {
    const allPropertyIds = await getAllProperties(provider);
    
    const holdings = await Promise.all(
      allPropertyIds.map(async (id) => {
        const balance = await getFractionBalance(provider, userAddress, id);
        
        if (balance !== '0') {
          const metadata = await getPropertyMetadata(provider, id);
          const details = await getPropertyDetails(provider, id);
          
          return {
            propertyId: id,
            balance,
            metadata,
            details,
          };
        }
        return null;
      })
    );
    
    return holdings.filter(h => h !== null);
  } catch (error) {
    console.error('Error getting user fractional holdings:', error);
    throw error;
  }
};

/**
 * Transfer fractions to another user
 */
export const transferFractions = async (signer, propertyId, recipientAddress, amount) => {
  try {
    // Get the property details to get the fractions contract address
    const managerContract = getContract('TOKENIZATION_MANAGER', signer);
    const property = await managerContract.getTokenizedProperty(propertyId);
    
    if (!property.fractionsContract || property.fractionsContract === ethers.ZeroAddress) {
      throw new Error('Property fractions contract not found');
    }
    
    // Create fractions contract instance
    const fractionsContract = new ethers.Contract(
      property.fractionsContract,
      PROPERTY_FRACTIONS_ABI,
      signer
    );
    
    // Transfer tokens to recipient
    const tx = await fractionsContract.transfer(recipientAddress, amount);
    await tx.wait();
    
    return tx;
  } catch (error) {
    console.error('Error transferring fractions:', error);
    throw error;
  }
};

/**
 * Format address for display
 */
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Format ether value
 */
export const formatEther = (value) => {
  return ethers.formatEther(value);
};

/**
 * Parse ether value
 */
export const parseEther = (value) => {
  return ethers.parseEther(value.toString());
};

/**
 * Format fractions from wei to readable number
 * Converts "1000000000000000000000000" to "1000000" (1M fractions)
 */
export const formatFractions = (fractionsInWei) => {
  if (!fractionsInWei) return '0';
  
  try {
    // Convert from wei (18 decimals) to whole number
    const formatted = ethers.formatUnits(fractionsInWei, 18);
    
    // Remove decimal places and format with commas
    const wholeNumber = parseFloat(formatted);
    return wholeNumber.toLocaleString('en-US', { maximumFractionDigits: 0 });
  } catch (error) {
    console.error('Error formatting fractions:', error);
    return '0';
  }
};
