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

const RentalIncome = ({ ownedProperties, heldProperties }) => {
  const { account, signer, provider } = useWeb3();
  const { showToast } = useToast();

  const [claimable, setClaimable] = useState({});
  const [claiming, setClaiming] = useState(null);
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

  if (!featureAvailable) return null;

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
    <div className="space-y-6">
      <div className="panel p-5 sm:p-6 animate-fadeUp">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-accent-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Rental Income</h3>
            <p className="text-xs text-slate-400">Claim your pro-rata share from properties you hold fractions of</p>
          </div>
        </div>

        {claimableEntries.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">No unclaimed rental income right now.</div>
        ) : (
          <div className="space-y-2.5">
            {claimableEntries.map(({ propertyId, amount }) => (
              <div
                key={propertyId}
                className="flex items-center justify-between p-4 bg-accent-500/[0.07] border border-accent-500/20 rounded-xl gap-3 flex-wrap"
              >
                <div>
                  <p className="font-semibold text-slate-100 text-sm">Property #{propertyId}</p>
                  <p className="text-xs text-accent-300 mt-0.5">{formatEther(amount)} ETH claimable</p>
                </div>
                <button
                  onClick={() => handleClaim(propertyId)}
                  disabled={claiming === propertyId}
                  className="btn-accent text-xs py-2 px-4"
                >
                  {claiming === propertyId ? 'Claiming…' : 'Claim'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {ownedProperties.length > 0 && (
        <div className="panel p-5 sm:p-6 animate-fadeUp">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Deposit Rental Income</h3>
              <p className="text-xs text-slate-400">As the owner, deposit income for fraction holders to claim</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {ownedProperties.map((propertyId) => (
              <div key={propertyId} className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                <p className="font-semibold text-slate-100 text-sm mb-3">Property #{propertyId}</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="Amount in ETH"
                    value={depositForm.propertyId === propertyId ? depositForm.amount : ''}
                    onChange={(e) => setDepositForm({ propertyId, amount: e.target.value })}
                    className="input-field text-sm py-2 flex-1"
                    disabled={depositing}
                  />
                  <button
                    onClick={() => handleDeposit(propertyId)}
                    disabled={depositing || depositForm.propertyId !== propertyId || !depositForm.amount}
                    className="btn-primary text-xs py-2 px-4 whitespace-nowrap"
                  >
                    {depositing && depositForm.propertyId === propertyId ? 'Depositing…' : 'Deposit'}
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
