import { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { uploadPropertyToIPFS } from '../utils/ipfs';
import { tokenizeProperty } from '../utils/contracts';
import { useToast } from './Toast';

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Industrial', 'Land', 'Mixed Use'];

const TokenizeProperty = ({ onSuccess }) => {
  const { signer, isConnected } = useWeb3();
  const { showToast } = useToast();

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
  const [propertyId, setPropertyId] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, imageFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      showToast('Please connect your wallet first', 'error');
      return;
    }

    if (!formData.name || !formData.description || !formData.location) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (!formData.imageFile) {
      showToast('Please upload a property image', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      setPropertyId(null);

      setStatus('Uploading to IPFS…');
      const metadataURI = await uploadPropertyToIPFS(formData);

      setStatus('Waiting for transaction confirmation…');
      const result = await tokenizeProperty(signer, formData.location, metadataURI);

      setStatus('');
      setPropertyId(result.propertyId);
      showToast('Property tokenized successfully!', 'success');

      setFormData({ name: '', description: '', location: '', propertyType: 'Residential', imageFile: null });
      setImagePreview(null);

      if (onSuccess) onSuccess(result);

      setTimeout(() => setPropertyId(null), 6000);
    } catch (err) {
      console.error('Error tokenizing property:', err);
      showToast(err.message || 'Failed to tokenize property', 'error');
      setStatus('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fadeUp">
      <div className="panel p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Tokenize New Property</h2>
            <p className="text-xs text-slate-400 mt-0.5">Mint an on-chain deed and prepare it for fractional sale</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="label">Property Name *</label>
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

          <div>
            <label htmlFor="description" className="label">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Detailed description of the property…"
              rows={4}
              className="input-field resize-none"
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="location" className="label">Location *</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="123 Main St, New York, NY"
                className="input-field"
                required
              />
            </div>

            <div>
              <label htmlFor="propertyType" className="label">Property Type</label>
              <select
                id="propertyType"
                name="propertyType"
                value={formData.propertyType}
                onChange={handleInputChange}
                className="input-field"
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type} className="bg-ink-800">{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="image" className="label">Property Image *</label>
            <label
              htmlFor="image"
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/10 hover:border-brand-400/40 rounded-xl px-4 py-6 cursor-pointer transition-colors bg-white/[0.02]"
            >
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm text-slate-400">
                <span className="text-brand-400 font-semibold">Click to upload</span> or drag and drop
              </span>
              <span className="text-[11px] text-slate-600">JPEG, PNG, GIF, WebP · max 10MB</span>
              <input
                type="file"
                id="image"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                required
                className="hidden"
              />
            </label>

            {imagePreview && (
              <div className="mt-3 relative animate-scaleIn">
                <img src={imagePreview} alt="Property preview" className="w-full h-56 object-cover rounded-xl border border-white/10" />
                <div className="absolute top-2.5 right-2.5 badge-success">Ready</div>
              </div>
            )}
          </div>

          {status && (
            <div className="p-3.5 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center gap-2.5">
              <svg className="animate-spin h-4 w-4 text-brand-300 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-brand-200">{status}</p>
            </div>
          )}

          {propertyId && (
            <div className="p-3.5 bg-accent-500/10 border border-accent-500/20 rounded-xl">
              <p className="text-sm text-accent-300 font-medium">Property NFT minted! Token ID #{propertyId}</p>
            </div>
          )}

          <button type="submit" disabled={!isConnected || isSubmitting} className="w-full btn-primary py-3">
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing…</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Tokenize Property</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TokenizeProperty;
