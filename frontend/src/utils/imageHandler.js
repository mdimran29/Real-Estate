/**
 * BULLETPROOF IMAGE HANDLER
 * Guarantees images ALWAYS show with multiple fallback layers
 */

// Placeholder image as base64 (always works, no network required)
const PLACEHOLDER_BASE64 = '/placeholder-property.svg';

// Multiple image hosting services for redundancy
const IMAGE_SERVICES = {
  imgur: 'https://i.imgur.com/',
  cloudinary: 'https://res.cloudinary.com/',
  github: 'https://raw.githubusercontent.com/',
  ipfs: 'https://ipfs.io/ipfs/',
};

/**
 * Try to load image from multiple sources with timeout
 * @param {string} primaryUrl - Main image URL
 * @param {Array<string>} fallbackUrls - Backup URLs to try
 * @param {number} timeout - Timeout per attempt (ms)
 * @returns {Promise<string>} Working image URL
 */
export const loadImageWithFallback = async (primaryUrl, fallbackUrls = [], timeout = 5000) => {
  const allUrls = [primaryUrl, ...fallbackUrls, PLACEHOLDER_BASE64].filter(Boolean);
  
  console.log('🖼️ Attempting to load image from', allUrls.length, 'sources');
  
  for (let i = 0; i < allUrls.length; i++) {
    const url = allUrls[i];
    
    try {
      console.log(`📡 Trying source ${i + 1}/${allUrls.length}:`, url);
      
      const isImageAccessible = await checkImageExists(url, timeout);
      
      if (isImageAccessible) {
        console.log('✅ Image loaded successfully from:', url);
        return url;
      }
      
      console.warn(`❌ Source ${i + 1} failed:`, url);
    } catch (error) {
      console.warn(`❌ Error loading from source ${i + 1}:`, error.message);
      continue;
    }
  }
  
  // If all else fails, return placeholder
  console.warn('⚠️ All image sources failed, using placeholder');
  return PLACEHOLDER_BASE64;
};

/**
 * Check if an image URL is accessible
 * @param {string} url - Image URL to check
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} True if image is accessible
 */
const checkImageExists = (url, timeout = 5000) => {
  return new Promise((resolve) => {
    // For local placeholder, always return true
    if (url.startsWith('/') || url.startsWith('data:')) {
      resolve(true);
      return;
    }
    
    const img = new Image();
    const timer = setTimeout(() => {
      img.src = ''; // Cancel loading
      resolve(false);
    }, timeout);
    
    img.onload = () => {
      clearTimeout(timer);
      resolve(true);
    };
    
    img.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
    
    img.src = url;
  });
};

/**
 * Convert IPFS URL to multiple gateway URLs for redundancy
 * @param {string} ipfsUrl - IPFS URL or hash
 * @returns {Array<string>} Array of gateway URLs
 */
export const convertIpfsToMultipleGateways = (ipfsUrl) => {
  if (!ipfsUrl) return [];
  
  // Extract IPFS hash
  let hash = ipfsUrl;
  
  if (ipfsUrl.startsWith('ipfs://')) {
    hash = ipfsUrl.replace('ipfs://', '');
  } else if (ipfsUrl.includes('/ipfs/')) {
    const match = ipfsUrl.match(/\/ipfs\/([^?#/]+)/);
    if (match) hash = match[1];
  }
  
  // Return multiple gateway URLs
  return [
    `https://ipfs.io/ipfs/${hash}`,
    `https://dweb.link/ipfs/${hash}`,
    `https://gateway.pinata.cloud/ipfs/${hash}`,
    `https://cloudflare-ipfs.com/ipfs/${hash}`,
  ];
};

/**
 * Smart image URL resolver with multiple strategies
 * @param {Object} metadata - Property metadata object
 * @returns {Promise<string>} Best available image URL
 */
export const resolvePropertyImage = async (metadata) => {
  console.log('🔍 Resolving property image from metadata:', metadata);
  
  const imageSources = [];
  
  // Strategy 1: Direct HTTP/HTTPS URLs (fastest)
  if (metadata.image && (metadata.image.startsWith('http://') || metadata.image.startsWith('https://'))) {
    // Skip known broken domains
    if (!metadata.image.includes('cloudflare-ipfs.com')) {
      imageSources.push(metadata.image);
    }
  }
  
  // Strategy 2: Alternative image properties
  if (metadata.propertyImage) {
    imageSources.push(metadata.propertyImage);
  }
  if (metadata.imageUrl) {
    imageSources.push(metadata.imageUrl);
  }
  if (metadata.thumbnail) {
    imageSources.push(metadata.thumbnail);
  }
  
  // Strategy 3: IPFS URLs (convert to multiple gateways)
  if (metadata.image && (metadata.image.startsWith('ipfs://') || metadata.image.includes('/ipfs/'))) {
    const ipfsGateways = convertIpfsToMultipleGateways(metadata.image);
    imageSources.push(...ipfsGateways);
  }
  
  // Strategy 4: Try to load from each source
  const workingUrl = await loadImageWithFallback(imageSources[0], imageSources.slice(1));
  
  return workingUrl;
};

/**
 * Get placeholder image URL
 * @returns {string} Placeholder image URL
 */
export const getPlaceholderImage = () => {
  return PLACEHOLDER_BASE64;
};

/**
 * Preload image and return a promise
 * @param {string} url - Image URL to preload
 * @returns {Promise<string>} Resolves with URL when loaded
 */
export const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    if (!url || url === PLACEHOLDER_BASE64) {
      resolve(url);
      return;
    }
    
    const img = new Image();
    
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error('Failed to load image'));
    
    img.src = url;
  });
};

export default {
  loadImageWithFallback,
  convertIpfsToMultipleGateways,
  resolvePropertyImage,
  getPlaceholderImage,
  preloadImage,
};
