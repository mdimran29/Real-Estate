/**
 * Upload image to IPFS via Pinata
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} - IPFS hash
 */
export const uploadImageToIPFS = async (file) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB. Please upload a smaller image');
    }

    const formData = new FormData();
    formData.append('file', file);

    const pinataApiKey = import.meta.env.VITE_PINATA_API_KEY;
    const pinataSecretApiKey = import.meta.env.VITE_PINATA_SECRET_API_KEY;

    if (!pinataApiKey || !pinataSecretApiKey) {
      throw new Error('Pinata API keys not configured. Please add them to your .env file');
    }

    console.log('Uploading image to IPFS via Pinata...');

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretApiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata API error:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(errorData.error?.details || errorData.error || `Failed to upload image: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Image uploaded successfully:', data.IpfsHash);
    return data.IpfsHash;
  } catch (error) {
    console.error('Error uploading image to IPFS:', error);
    throw error;
  }
};

/**
 * Upload JSON metadata to IPFS via Pinata
 * @param {Object} metadata - Property metadata object
 * @returns {Promise<string>} - IPFS hash
 */
export const uploadMetadataToIPFS = async (metadata) => {
  try {
    const pinataApiKey = import.meta.env.VITE_PINATA_API_KEY;
    const pinataSecretApiKey = import.meta.env.VITE_PINATA_SECRET_API_KEY;

    if (!pinataApiKey || !pinataSecretApiKey) {
      throw new Error('Pinata API keys not configured. Please add them to your .env file');
    }

    console.log('Uploading metadata to IPFS via Pinata...');

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretApiKey,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `${metadata.name || 'property'}-metadata.json`,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata API error:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(errorData.error?.details || errorData.error || `Failed to upload metadata: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Metadata uploaded successfully:', data.IpfsHash);
    return data.IpfsHash;
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    throw error;
  }
};

/**
 * Get IPFS URL from hash
 * @param {string} hash - IPFS hash
 * @returns {string} - Full IPFS URL
 */
export const getIPFSUrl = (hash) => {
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
};

/**
 * Upload property with image and metadata
 * @param {Object} propertyData - { name, description, location, imageFile }
 * @returns {Promise<string>} - Metadata IPFS URI
 */
export const uploadPropertyToIPFS = async (propertyData) => {
  try {
    let imageHash = null;

    // Upload image if provided
    if (propertyData.imageFile) {
      imageHash = await uploadImageToIPFS(propertyData.imageFile);
    }

    // Create metadata object
    const metadata = {
      name: propertyData.name,
      description: propertyData.description,
      image: imageHash ? getIPFSUrl(imageHash) : '',
      attributes: [
        {
          trait_type: 'Location',
          value: propertyData.location || 'N/A',
        },
        {
          trait_type: 'Property Type',
          value: propertyData.propertyType || 'Residential',
        },
        {
          trait_type: 'Tokenization Date',
          value: new Date().toISOString(),
        },
      ],
    };

    // Upload metadata
    const metadataHash = await uploadMetadataToIPFS(metadata);
    return getIPFSUrl(metadataHash);
  } catch (error) {
    console.error('Error uploading property to IPFS:', error);
    throw error;
  }
};

/**
 * Fetch metadata from IPFS
 * @param {string} uri - IPFS URI
 * @returns {Promise<Object>} - Metadata object
 */
export const fetchMetadataFromIPFS = async (uri) => {
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error('Failed to fetch metadata');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching metadata from IPFS:', error);
    throw error;
  }
};
