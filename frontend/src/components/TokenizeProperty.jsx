import { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { uploadPropertyToIPFS } from '../utils/ipfs';
import { tokenizeProperty } from '../utils/contracts';

const TokenizeProperty = ({ onSuccess }) => {
  const { signer, isConnected } = useWeb3();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    propertyType: 'Residential',
    imageFile: null,
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [propertyId, setPropertyId] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!formData.name || !formData.description || !formData.location) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.imageFile) {
      setError('Please upload a property image');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setPropertyId(null);

      // Step 1: Upload to IPFS
      setStatus('Uploading to IPFS...');
      const metadataURI = await uploadPropertyToIPFS(formData);
      
      // Step 2: Call smart contract
      setStatus('Waiting for transaction confirmation...');
      const result = await tokenizeProperty(signer, formData.location, metadataURI);
      
      setStatus('Property tokenized successfully!');
      setPropertyId(result.propertyId);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        location: '',
        propertyType: 'Residential',
        imageFile: null,
      });
      setImagePreview(null);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

      // Clear status after 5 seconds
      setTimeout(() => {
        setStatus('');
        setPropertyId(null);
      }, 5000);
    } catch (err) {
      console.error('Error tokenizing property:', err);
      setError(err.message || 'Failed to tokenize property');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <svg className="w-8 h-8 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Tokenize New Property
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Property Name */}
        <div>
          <label htmlFor="name" className="label">
            Property Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Luxury Villa in Manhattan"
            className="input-field"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="label">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Detailed description of the property..."
            rows={4}
            className="input-field"
            required
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="label">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="e.g., 123 Main St, New York, NY 10001"
            className="input-field"
            required
          />
        </div>

        {/* Property Type */}
        <div>
          <label htmlFor="propertyType" className="label">
            Property Type
          </label>
          <select
            id="propertyType"
            name="propertyType"
            value={formData.propertyType}
            onChange={handleInputChange}
            className="input-field"
          >
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Industrial">Industrial</option>
            <option value="Land">Land</option>
            <option value="Mixed">Mixed Use</option>
          </select>
        </div>

        {/* Image Upload */}
        <div>
          <label htmlFor="image" className="label">
            Property Image <span className="text-red-500">*</span>
          </label>
          <div className="mt-2">
            <input
              type="file"
              id="image"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              required
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100
                cursor-pointer"
            />
            <p className="mt-1 text-xs text-gray-500">
              Supported: JPEG, PNG, GIF, WebP (max 10MB)
            </p>
          </div>
          
          {imagePreview && (
            <div className="mt-4 relative">
              <img
                src={imagePreview}
                alt="Property preview"
                className="w-full h-64 object-cover rounded-lg border-2 border-primary-200"
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                ✓ Image Ready
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {status && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">{status}</p>
          </div>
        )}

        {propertyId && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm font-medium">
              Property NFT Minted! Token ID: #{propertyId}
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isConnected || isSubmitting}
          className="w-full btn-primary flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Tokenize Property</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TokenizeProperty;
