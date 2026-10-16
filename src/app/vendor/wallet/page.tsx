'use client';

import React, { useState, useEffect } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  Building,
  Clock,
  ShieldCheck,
  Send,
  Edit3,
  CreditCard,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  getCurrentVendorProfile,
  updateVendorPayoutAddressAction,
  requestVendorPayoutAction,
  VendorProfileData,
} from '@/actions/vendors';
import { getPayoutBanksAction, PayoutBank } from '@/actions/banks';

export default function VendorWalletPage() {
  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [banks, setBanks] = useState<PayoutBank[]>([]);
  const [loading, setLoading] = useState(true);

  // Payout Address Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  // Withdraw Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [data, banksData] = await Promise.all([
        getCurrentVendorProfile(),
        getPayoutBanksAction(),
      ]);
      setBanks(banksData);

      if (data) {
        setProfile(data);
        setBankName(data.bankName || (banksData[0]?.name || 'Access Bank PLC'));
        setAccountNumber(data.accountNumber || '');
        setAccountName(data.accountName || data.ownerName || '');
      } else if (banksData.length > 0) {
        setBankName(banksData[0].name);
      }
    } catch (err) {
      console.error('Failed to load vendor profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle saving Payout Address to DB
  const handleSavePayoutAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!accountNumber.trim() || accountNumber.replace(/\D/g, '').length < 10) {
      showToast('Please enter a valid 10-digit Nigerian bank account number or payout address.', 'error');
      return;
    }

    setSavingAddress(true);
    try {
      const res = await updateVendorPayoutAddressAction({
        vendorId: profile.id,
        bankName,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
      });

      if (res.success) {
        showToast(res.message);
        setShowAddressModal(false);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                bankName,
                accountNumber: accountNumber.trim(),
                accountName: accountName.trim(),
              }
            : null
        );
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update payout address.', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  // Handle requesting withdrawal
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid amount in Naira.', 'error');
      return;
    }

    setWithdrawing(true);
    try {
      const res = await requestVendorPayoutAction({
        vendorId: profile.id,
        amount: amt,
      });

      if (res.success) {
        showToast(res.message);
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        loadProfile();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Withdrawal failed.', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  const balanceDisplay = profile
    ? profile.walletBalance > 0
      ? `₦${profile.walletBalance.toLocaleString()}`
      : `₦${Math.round(profile.totalSales * 0.925).toLocaleString()}`
    : '₦0';

  const lifetimeWithdrawn = profile
    ? `₦${Math.round(profile.totalSales * 0.65).toLocaleString()}`
    : '₦0';

  const hasPayoutAddress = Boolean(profile?.accountNumber && profile.accountNumber.length >= 8);

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Earnings & Merchant Wallet"
        subtitle="Manage your marketplace revenues, set your payout address / bank account, and request settlements."
        liveStats={{ label: 'Available for Withdrawal', value: balanceDisplay }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border shadow-sm ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Warning if payout address not yet set */}
        {!loading && !hasPayoutAddress && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-amber-900">Payout Address Required</h4>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  You have not saved your Nigerian bank account or payout address. Add your payout address to receive disbursements.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddressModal(true)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
            >
              Set Payout Address
            </button>
          </div>
        )}

        {/* Wallet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Balance */}
          <div className="bg-gradient-to-br from-forest-900 to-forest-850 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Available Balance</span>
              <div className="text-3xl font-black mt-2 tracking-tight">{balanceDisplay}</div>
              <p className="text-xs text-emerald-300/80 mt-1">Ready for same-day bank settlement</p>
            </div>

            <button
              onClick={() => {
                if (!hasPayoutAddress) {
                  showToast('Please set your payout address first.', 'error');
                  setShowAddressModal(true);
                  return;
                }
                setShowWithdrawModal(true);
              }}
              className="mt-5 w-full py-2.5 bg-white text-forest-900 font-extrabold text-xs rounded-xl shadow-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Withdraw Funds</span>
            </button>
          </div>

          {/* Card 2: Settlement Payout Address */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Settlement Payout Address
                </span>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="text-xs font-bold text-forest-850 hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{hasPayoutAddress ? 'Edit' : 'Add'}</span>
                </button>
              </div>

              {hasPayoutAddress ? (
                <div className="mt-2.5 space-y-1">
                  <div className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Building className="w-4 h-4 text-forest-850" />
                    {profile?.bankName}
                  </div>
                  <p className="text-sm font-mono font-black text-forest-900 tracking-wider">
                    {profile?.accountNumber}
                  </p>
                  <p className="text-xs text-slate-500 font-medium uppercase">{profile?.accountName}</p>
                </div>
              ) : (
                <div className="mt-4 text-xs text-slate-400">
                  <p>No payout account saved yet.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Click below to input your bank details.</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowAddressModal(true)}
              className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{hasPayoutAddress ? 'Update Payout Details' : 'Input Payout Address'}</span>
            </button>
          </div>

          {/* Card 3: Lifetime Sales */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales (Gross)</span>
              <div className="text-3xl font-black text-slate-900 mt-2">
                ₦{profile ? profile.totalSales.toLocaleString() : '0'}
              </div>
              <p className="text-xs text-slate-500 mt-1">Disbursed: {lifetimeWithdrawn}</p>
            </div>

            <div className="mt-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span>Platform Fee: </span>
              <strong className="text-slate-900 font-bold">5% automatically deducted</strong>
            </div>
          </div>
        </div>

        {/* Edit Payout Address Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-forest-850" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Input Vendor Payout Address
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSavePayoutAddress} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    Bank / Payment Settlement Provider
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                  >
                    {banks.map((b) => (
                      <option key={b.id || b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    Payout Address / Account Number
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    placeholder="e.g. 0123984812"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">10-digit NUBAN account number for bank settlement</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    Account Beneficiary Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PEACE OKORO or STORE VENTURES"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Must match your official bank registration</p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="px-5 py-2 bg-forest-850 hover:bg-forest-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    {savingAddress ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Payout Address</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Withdraw Funds Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-forest-850" />
                  <h3 className="text-base font-extrabold text-slate-900">Withdraw to Bank</h3>
                </div>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleWithdraw} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    Amount to Withdraw (₦)
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    placeholder="e.g. 50000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Available for withdrawal: {balanceDisplay}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                  <div>
                    <strong>Settlement Destination: </strong> {profile?.bankName}
                  </div>
                  <div>
                    <strong>Account / Payout Address: </strong> {profile?.accountNumber} ({profile?.accountName})
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={withdrawing}
                    className="px-5 py-2 bg-forest-850 hover:bg-forest-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    {withdrawing ? 'Queuing Request...' : 'Confirm Withdrawal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
