'use client';

import React, { useState, useEffect } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  CreditCard,
  Search,
  CheckCircle,
  Clock,
  Send,
  Building,
  ArrowDownRight,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  Plus,
  Upload,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Layers,
} from 'lucide-react';
import {
  getAdminPayoutsFromDB,
  settleVendorPayoutAction,
  AdminPayoutRecord,
} from '@/actions/admin';
import {
  getPayoutBanksAction,
  createPayoutBankAction,
  bulkUploadPayoutBanksAction,
  togglePayoutBankStatusAction,
  deletePayoutBankAction,
  PayoutBank,
} from '@/actions/banks';

export default function AdminPayoutsPage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'banks'>('queue');
  const [payouts, setPayouts] = useState<AdminPayoutRecord[]>([]);
  const [banks, setBanks] = useState<PayoutBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [banksLoading, setBanksLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Bank Form State
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankCode, setNewBankCode] = useState('');
  const [bulkBanksText, setBulkBanksText] = useState('');
  const [savingBank, setSavingBank] = useState(false);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const data = await getAdminPayoutsFromDB();
      setPayouts(data);
    } catch (err) {
      console.error('Failed to load payouts from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBanks = async () => {
    try {
      setBanksLoading(true);
      const data = await getPayoutBanksAction({ includeInactive: true });
      setBanks(data);
    } catch (err) {
      console.error('Failed to load banks:', err);
    } finally {
      setBanksLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
    loadBanks();
  }, []);

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim()) return;

    setSavingBank(true);
    try {
      const res = await createPayoutBankAction({
        name: newBankName.trim(),
        code: newBankCode.trim() || undefined,
      });

      if (res.success) {
        showToast(`Bank "${newBankName.trim()}" added successfully!`);
        setNewBankName('');
        setNewBankCode('');
        setShowAddBankModal(false);
        loadBanks();
      } else {
        showToast(res.error || 'Failed to add bank.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating bank.', 'error');
    } finally {
      setSavingBank(false);
    }
  };

  const handleBulkUploadBanks = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkBanksText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      showToast('Please enter at least one bank name.', 'error');
      return;
    }

    setSavingBank(true);
    try {
      const parsedBanks = lines.map((line) => {
        // Support format: "Bank Name, 123" or "Bank Name"
        const parts = line.split(',');
        return {
          name: parts[0].trim(),
          code: parts[1] ? parts[1].trim() : undefined,
        };
      });

      const res = await bulkUploadPayoutBanksAction(parsedBanks);
      if (res.success) {
        showToast(`Successfully uploaded ${res.insertedCount} banks to database!`);
        setBulkBanksText('');
        setShowBulkUploadModal(false);
        loadBanks();
      } else {
        showToast(res.error || 'Bulk upload failed.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error processing bulk upload.', 'error');
    } finally {
      setSavingBank(false);
    }
  };

  const handleToggleBank = async (bank: PayoutBank) => {
    try {
      const res = await togglePayoutBankStatusAction({
        id: bank.id,
        isActive: !bank.isActive,
      });

      if (res.success) {
        setBanks((prev) =>
          prev.map((b) => (b.id === bank.id ? { ...b, isActive: !b.isActive } : b))
        );
        showToast(`Bank "${bank.name}" status updated.`);
      } else {
        showToast(res.error || 'Failed to update bank.', 'error');
      }
    } catch (err) {
      showToast('Error toggling bank status.', 'error');
    }
  };

  const handleDeleteBank = async (bank: PayoutBank) => {
    if (!confirm(`Are you sure you want to remove "${bank.name}" from supported payout banks?`)) {
      return;
    }

    try {
      const res = await deletePayoutBankAction(bank.id);
      if (res.success) {
        setBanks((prev) => prev.filter((b) => b.id !== bank.id));
        showToast(`Bank "${bank.name}" removed from database.`);
      } else {
        showToast(res.error || 'Failed to remove bank.', 'error');
      }
    } catch (err) {
      showToast('Error deleting bank.', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSettlePayout = async (payout: AdminPayoutRecord) => {
    setActionLoadingId(payout.id);
    try {
      const res = await settleVendorPayoutAction({
        vendorId: payout.vendorId,
        userId: payout.userId,
        amount: payout.rawAmount,
      });

      if (res.success) {
        showToast(`Payout for ${payout.recipient} marked as settled.`);
        setPayouts((prev) =>
          prev.map((p) => (p.id === payout.id ? { ...p, status: 'Completed' } : p))
        );
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Settlement failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredPayouts = payouts.filter((p) =>
    p.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.accountNumber.includes(searchTerm)
  );

  const pendingList = payouts.filter((p) => p.status !== 'Completed');
  const totalPendingAmount = pendingList.reduce((acc, p) => acc + p.rawAmount, 0);

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Payouts & Banking Ledger"
        subtitle="Live merchant settlement queue: review vendors awaiting payout, verify their settlement payout address, and disburse bank transfers."
        liveStats={{ label: 'Pending Payouts', value: `₦${totalPendingAmount.toLocaleString()}` }}
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

        {/* View Switcher Tabs */}
        <div className="flex border-b border-slate-200 gap-4">
          <button
            onClick={() => setActiveTab('queue')}
            className={`pb-3 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'queue'
                ? 'border-forest-850 text-forest-850'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Merchant Payout Queue</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
              {pendingList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('banks')}
            className={`pb-3 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'banks'
                ? 'border-forest-850 text-forest-850'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Supported Settlement Banks</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-forest-100 text-forest-850">
              {banks.length}
            </span>
          </button>
        </div>

        {activeTab === 'queue' ? (
          <>
            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Disbursements</span>
                <div className="mt-2 text-3xl font-black text-amber-600">₦{totalPendingAmount.toLocaleString()}</div>
                <p className="text-xs text-slate-500 mt-1">{pendingList.length} vendors awaiting payout transfer</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Vendors with Payout Address</span>
                <div className="mt-2 text-3xl font-black text-forest-850">
                  {payouts.filter((p) => p.hasPayoutAddress).length} Stores
                </div>
                <p className="text-xs text-emerald-700 font-semibold mt-1">Bank account verified and ready for wire</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Settled Disbursements</span>
                <div className="mt-2 text-3xl font-black text-slate-900">
                  ₦{payouts.filter((p) => p.status === 'Completed').reduce((acc, p) => acc + p.rawAmount, 0).toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {payouts.filter((p) => p.status === 'Completed').length} transfers marked as completed
                </p>
              </div>
            </div>

            {/* Search & Actions Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search vendor, bank, account number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadPayouts}
                  disabled={loading}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh Payouts</span>
                </button>
              </div>
            </div>

            {/* Payouts Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Vendors Awaiting Payouts</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Displays recipient vendor names, earnings balance, and their saved payout address / bank account.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5">Payout ID</th>
                      <th className="px-5 py-3.5">Vendor Recipient</th>
                      <th className="px-5 py-3.5">Amount Awaiting</th>
                      <th className="px-5 py-3.5">Vendor Payout Address (Bank Details)</th>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400 text-xs font-bold">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-forest-850" />
                            <span>Querying vendors awaiting payouts...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredPayouts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                          No vendors currently in the payout queue.
                        </td>
                      </tr>
                    ) : (
                      filteredPayouts.map((p) => {
                        const isBusy = actionLoadingId === p.id;

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-3.5 font-bold text-forest-850 text-xs">{p.id}</td>

                            {/* Recipient */}
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-900">{p.recipient}</div>
                              <div className="text-xs text-slate-500 font-medium">
                                {p.owner} • {p.phone}
                              </div>
                            </td>

                            {/* Amount */}
                            <td className="px-5 py-3.5 font-black text-slate-900 text-sm">{p.amount}</td>

                            {/* Payout Address */}
                            <td className="px-5 py-3.5 text-xs">
                              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5 max-w-sm">
                                <div className="font-bold text-slate-900 flex items-center justify-between gap-2">
                                  <span className="flex items-center gap-1.5">
                                    <Building className="w-3.5 h-3.5 text-forest-850 shrink-0" />
                                    {p.bankName}
                                  </span>
                                  <button
                                    onClick={() => handleCopy(`${p.bankName} - ${p.accountNumber} - ${p.accountName}`, p.id)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                    title="Copy bank account details"
                                  >
                                    {copiedId === p.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                                <div className="font-mono font-bold text-forest-900 text-xs tracking-wider">
                                  {p.accountNumber}
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium uppercase">
                                  {p.accountName}
                                </div>
                              </div>
                            </td>

                            {/* Date */}
                            <td className="px-5 py-3.5 text-xs text-slate-500">{p.requestedDate}</td>

                            {/* Status */}
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                  p.status === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : p.status === 'Pending Transfer'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {p.status === 'Completed' ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span>Completed</span>
                                  </>
                                ) : p.status === 'Pending Transfer' ? (
                                  <>
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span>Awaiting Transfer</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="w-3 h-3 text-rose-600" />
                                    <span>Needs Address</span>
                                  </>
                                )}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3.5 text-right">
                              {p.status === 'Completed' ? (
                                <span className="text-xs text-slate-400 font-semibold">Settled</span>
                              ) : (
                                <button
                                  onClick={() => handleSettlePayout(p)}
                                  disabled={isBusy}
                                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 ml-auto"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>{isBusy ? 'Processing...' : 'Mark Settled'}</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Supported Banks Tab */
          <div className="space-y-5">
            {/* Controls Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter supported banks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setShowBulkUploadModal(true)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Bulk Upload Banks</span>
                </button>

                <button
                  onClick={() => setShowAddBankModal(true)}
                  className="px-4 py-2 bg-forest-850 hover:bg-forest-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Bank</span>
                </button>
              </div>
            </div>

            {/* Banks Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Supported Payout Banks</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Merchants pick from this live database list when setting their settlement payout address.
                  </p>
                </div>
                <span className="text-xs font-bold bg-forest-50 text-forest-850 border border-forest-100 px-3 py-1 rounded-full">
                  {banks.filter((b) => b.name.toLowerCase().includes(searchTerm.toLowerCase())).length} Available
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5">Bank Name</th>
                      <th className="px-5 py-3.5">NIP / CBN Code</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {banksLoading ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-slate-400 text-xs font-bold">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-forest-850" />
                            <span>Loading banks from database...</span>
                          </div>
                        </td>
                      </tr>
                    ) : banks.filter((b) => b.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-slate-500 text-xs">
                          No banks found matching your search.
                        </td>
                      </tr>
                    ) : (
                      banks
                        .filter((b) => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((bank) => (
                          <tr key={bank.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                <Building className="w-4 h-4 text-forest-850" />
                                <span>{bank.name}</span>
                              </div>
                            </td>

                            <td className="px-5 py-3.5 font-mono text-xs text-slate-600 font-semibold">
                              {bank.code || <span className="text-slate-400 italic">None</span>}
                            </td>

                            <td className="px-5 py-3.5">
                              <button
                                onClick={() => handleToggleBank(bank)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                                  bank.isActive
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {bank.isActive ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span>Active</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>Disabled</span>
                                  </>
                                )}
                              </button>
                            </td>

                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => handleDeleteBank(bank)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Bank"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Single Bank */}
        {showAddBankModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-forest-850" />
                  <h3 className="text-base font-extrabold text-slate-900">Add Settlement Bank</h3>
                </div>
                <button
                  onClick={() => setShowAddBankModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateBank} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Bank Official Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Chartered Bank"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">CBN / NIP Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 068"
                    value={newBankCode}
                    onChange={(e) => setNewBankCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddBankModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingBank}
                    className="px-5 py-2 bg-forest-850 hover:bg-forest-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    {savingBank ? 'Saving...' : 'Add Bank to Catalog'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Bulk Upload Banks */}
        {showBulkUploadModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-forest-850" />
                  <h3 className="text-base font-extrabold text-slate-900">Bulk Upload Supported Banks</h3>
                </div>
                <button
                  onClick={() => setShowBulkUploadModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Paste a list of bank names below (one per line). Optionally include the bank code separated by a comma.
              </p>

              <form onSubmit={handleBulkUploadBanks} className="space-y-3.5">
                <div>
                  <textarea
                    rows={6}
                    required
                    placeholder={`Titan Trust Bank, 102\nFairMoney Microfinance Bank, 51318\nRubies Bank, 125`}
                    value={bulkBanksText}
                    onChange={(e) => setBulkBanksText(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowBulkUploadModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingBank}
                    className="px-5 py-2 bg-forest-850 hover:bg-forest-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    {savingBank ? 'Uploading...' : 'Save All Banks to DB'}
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
