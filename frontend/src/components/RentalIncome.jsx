import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useToast } from './Toast';
import {
  isFeatureAvailable,
  getClaimableRentalIncome,
  claimAllRentalIncome,
  depositRentalIncome,
  formatEther,
} from '../utils/contracts';

/**
 * Rental income section for the Portfolio page.
 * - Owners of a tokenized property can deposit rental income (ETH) for it.
 * - Fraction holders can see and claim their pro-rata share of any
 *   deposited rental income.
 */
const RentalIncome = ({ ownedProperties, heldProperties }) => {
  const { account, signer, provider } = useWeb3();
  const { showToast } = useToast();

  const [claimable, setClaimable] = useState({}); // propertyId -> wei string
  const [claiming, setClaiming] = useState(null); // propertyId currently claiming
  const [depositForm, setDepositForm] = useState({ propertyId: null, amount: '' });
  const [depositing, setDepositing] = useState(false);

  const featureAvailable = isFeatureAvailable('RENTAL_INCOME_DISTRIBUTION');

  const refreshClaimable = useCallback(async () => {
    if (!featureAvailable || !provider || !account || heldProperties.length === 0) return;

    const entries = await Promise.all(
      heldProperties.map(async (propertyId) => {
        const amount = await getClaimableRentalIncome(provider, propertyId, account);
        return [propertyId, amount];
      })
    );

    setClaimable(Object.fromEntries(entries));
  }, [featureAvailable, provider, account, heldProperties]);

  useEffect(() => {
    refreshClaimable();
  }, [refreshClaimable]);

  if (!featureAvailable) {
    return null;
  }

  const handleClaim = async (propertyId) => {
    try {
      setClaiming(propertyId);
      await claimAllRentalIncome(signer, propertyId);
      showToast('Rental income claimed successfully!', 'success');
      await refreshClaimable();
    } catch (err) {
      console.error('Error claiming rental income:', err);
      showToast(err.message || 'Failed to claim rental income', 'error');
    } finally {
      setClaiming(null);
    }
  };

  const handleDeposit = async (propertyId) => {
    const amount = parseFloat(depositForm.amount);
    if (!amount || amount <= 0) {
      showToast('Enter a valid ETH amount', 'error');
      return;
    }

    try {
      setDepositing(true);
      await depositRentalIncome(signer, propertyId, amount);
      showToast('Rental income deposited successfully!', 'success');
      setDepositForm({ propertyId: null, amount: '' });
      await refreshClaimable();
    } catch (err) {
      console.error('Error depositing rental income:', err);
      showToast(err.message || 'Failed to deposit rental income', 'error');
    } finally {
      setDepositing(false);
    }
  };

  const claimableEntries = heldProperties
    .map((propertyId) => ({ propertyId, amount: claimable[propertyId] || '0' }))
    .filter((entry) => entry.amount !== '0');

  return (
    <div className="space-y-8">
      {/* Claimable rental income */}
      <div className="card">
        <div className="flex items-center mb-6">
          <svg className="w-8 h-8 mr-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Rental Income</h3>
            <p className="text-sm text-gray-600">Claim your share of rental income from properties you hold fractions of</p>
          </div>
        </div>

        {claimableEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No unclaimed rental income right now.
          </div>
        ) : (
          <div className="space-y-3">
            {claimableEntries.map(({ propertyId, amount }) => (
              <div
                key={propertyId}
                className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-800">Property #{propertyId}</p>
                  <p className="text-sm text-green-700">{formatEther(amount)} ETH claimable</p>
                </div>
                <button
                  onClick={() => handleClaim(propertyId)}
                  disabled={claiming === propertyId}
                  className="btn-primary text-sm py-2 px-4"
                >
                  {claiming === propertyId ? 'Claiming...' : 'Claim'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deposit rental income (property owners) */}
      {ownedProperties.length > 0 && (
        <div className="card">
          <div className="flex items-center mb-6">
            <svg className="w-8 h-8 mr-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Deposit Rental Income</h3>
              <p className="text-sm text-gray-600">As the property owner, deposit rental income for fraction holders to claim</p>
            </div>
          </div>

          <div className="space-y-3">
            {ownedProperties.map((propertyId) => (
              <div key={propertyId} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-gray-800">Property #{propertyId}</p>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="Amount in ETH"
                    value={depositForm.propertyId === propertyId ? depositForm.amount : ''}
                    onChange={(e) => setDepositForm({ propertyId, amount: e.target.value })}
                    className="input-field text-sm flex-1"
                    disabled={depositing}
                  />
                  <button
                    onClick={() => handleDeposit(propertyId)}
                    disabled={depositing || depositForm.propertyId !== propertyId || !depositForm.amount}
                    className="btn-primary text-sm py-2 px-4 whitespace-nowrap"
                  >
                    {depositing && depositForm.propertyId === propertyId ? 'Depositing...' : 'Deposit'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalIncome;
