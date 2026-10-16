'use client';

import React, { useState, useEffect } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Store,
  Eye,
  RefreshCw,
  AlertTriangle,
  Award,
  ExternalLink,
  MapPin,
  Building,
} from 'lucide-react';
import {
  getAdminVendorsFromDB,
  reviewVendorKYCAction,
  toggleVendorApprovalToSellAction,
  toggleVendorBadgeAction,
  AdminVendorRecord,
} from '@/actions/admin';

export default function AdminKycPage() {
  const [vendors, setVendors] = useState<AdminVendorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'pending' | 'approved' | 'badge' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<AdminVendorRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAdminVendorsFromDB();
      setVendors(data);
    } catch (err) {
      console.error('Failed to load KYC vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filtered vendors
  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.phone.includes(searchTerm) ||
      v.location.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'pending') {
      return v.kycStatus === 'pending' || !v.isApprovedToSell;
    }
    if (filterTab === 'approved') {
      return v.isApprovedToSell;
    }
    if (filterTab === 'badge') {
      return v.isVerified;
    }
    return true;
  });

  const pendingCount = vendors.filter((v) => v.kycStatus === 'pending' || !v.isApprovedToSell).length;
  const approvedCount = vendors.filter((v) => v.isApprovedToSell).length;
  const badgeCount = vendors.filter((v) => v.isVerified).length;

  const handleApproveStore = async (vendor: AdminVendorRecord) => {
    try {
      setActionLoadingId(vendor.id);
      // 1. Approve KYC status in vendors table
      const resKyc = await reviewVendorKYCAction({
        vendorId: vendor.id,
        vendorEmail: vendor.email,
        vendorName: vendor.owner,
        businessName: vendor.name,
        status: 'verified',
      });

      // 2. Grant approval to sell in users table
      await toggleVendorApprovalToSellAction({
        vendorId: vendor.id,
        userId: vendor.userId,
        approved: true,
      });

      if (resKyc.success) {
        showToast(`Store "${vendor.name}" approved to sell on Ogba Marketplace!`);
        await loadData();
        setSelectedVendor(null);
      } else {
        showToast(resKyc.message || 'Failed to approve store.', 'error');
      }
    } catch (err) {
      showToast('Server error while approving store.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectKYC = async () => {
    if (!selectedVendor) return;
    try {
      setActionLoadingId(selectedVendor.id);
      const res = await reviewVendorKYCAction({
        vendorId: selectedVendor.id,
        vendorEmail: selectedVendor.email,
        vendorName: selectedVendor.owner,
        businessName: selectedVendor.name,
        status: 'rejected',
        reason: rejectReason.trim() || 'Incomplete store documentation or invalid credentials provided.',
      });

      if (res.success) {
        showToast(`KYC submission for "${selectedVendor.name}" has been rejected.`);
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedVendor(null);
        await loadData();
      } else {
        showToast(res.message || 'Failed to reject KYC.', 'error');
      }
    } catch (err) {
      showToast('Server error while rejecting KYC.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleBadge = async (vendor: AdminVendorRecord) => {
    try {
      setActionLoadingId(vendor.id);
      const res = await toggleVendorBadgeAction({
        vendorId: vendor.id,
        isVerified: !vendor.isVerified,
      });

      if (res.success) {
        showToast(res.message);
        await loadData();
      } else {
        showToast(res.message || 'Failed to toggle badge.', 'error');
      }
    } catch (err) {
      showToast('Server error toggling badge.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Vendor KYC & Store Approvals"
        subtitle="Review vendor registration proofs, approve stores to sell, and manage paid verified merchant badges."
        liveStats={{ label: 'Pending Stores', value: `${pendingCount} Applications`, badge: 'Live DB' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {notification && (
          <div
            className={`p-4 rounded-xl border font-bold text-xs flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Live Metrics Grid from Database */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Review</span>
            <div className="mt-2 text-3xl font-black text-amber-600">{pendingCount}</div>
            <p className="text-xs text-slate-500 mt-1">Awaiting approval to sell</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Approved to Sell</span>
            <div className="mt-2 text-3xl font-black text-forest-850">{approvedCount}</div>
            <p className="text-xs text-emerald-700 font-semibold mt-1">Authorized merchant stores</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Paid Verified Badges</span>
            <div className="mt-2 text-3xl font-black text-emerald-600">{badgeCount}</div>
            <p className="text-xs text-slate-500 mt-1">Trust checkmark granted</p>
          </div>
        </div>

        {/* Filter Tabs and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterTab === 'pending'
                  ? 'bg-forest-850 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Pending Approval ({pendingCount})
            </button>
            <button
              onClick={() => setFilterTab('approved')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterTab === 'approved'
                  ? 'bg-forest-850 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Approved Stores ({approvedCount})
            </button>
            <button
              onClick={() => setFilterTab('badge')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterTab === 'badge'
                  ? 'bg-forest-850 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Verified Badges ({badgeCount})
            </button>
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterTab === 'all'
                  ? 'bg-forest-850 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Vendors ({vendors.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search vendor or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
              />
            </div>
            <button
              onClick={loadData}
              className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-forest-850 rounded-xl transition-colors"
              title="Refresh from DB"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Vendors KYC Submissions List */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-xs text-slate-400">
              Loading merchant applications from Supabase database...
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-2">
              <Store className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No vendor applications in this queue</p>
              <p className="text-xs text-slate-400">
                Registered merchant stores and submitted KYC documents will appear here.
              </p>
            </div>
          ) : (
            filteredVendors.map((vendor) => {
              const isBusy = actionLoadingId === vendor.id;

              return (
                <div
                  key={vendor.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-forest-850 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                      {vendor.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                          {vendor.name}
                        </span>
                        {/* Approval Status */}
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            vendor.isApprovedToSell
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {vendor.isApprovedToSell ? 'Approved to Sell' : 'Awaiting Approval'}
                        </span>
                        {/* Verification Badge */}
                        {vendor.isVerified && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-blue-600" />
                            Verified Badge
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                        <span><strong>Owner:</strong> {vendor.owner}</span>
                        <span>•</span>
                        <span><strong>Phone:</strong> {vendor.phone}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-forest-600" />
                          {vendor.location}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        <strong>KYC Details:</strong>{' '}
                        {vendor.kycIdCardUrl || 'Physical stall verification pending review'}
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
                    <button
                      onClick={() => setSelectedVendor(vendor)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-4 h-4 text-slate-500" />
                      <span>Inspect Docs</span>
                    </button>

                    {!vendor.isApprovedToSell ? (
                      <button
                        onClick={() => handleApproveStore(vendor)}
                        disabled={isBusy}
                        className="px-4 py-2 rounded-xl bg-forest-850 hover:bg-forest-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>Approve to Sell</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleBadge(vendor)}
                        disabled={isBusy}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                          vendor.isVerified
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                      >
                        <Award className="w-4 h-4" />
                        <span>{vendor.isVerified ? 'Revoke Badge' : 'Grant Verified Badge'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal: Inspect Documents & Full Review */}
        {selectedVendor && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-forest-850" />
                  <h3 className="font-extrabold text-base text-slate-900">
                    Vendor KYC & Store Review
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{selectedVendor.name}</div>
                  <div className="text-slate-600">Owner: {selectedVendor.owner}</div>
                  <div className="text-slate-600">Phone: {selectedVendor.phone}</div>
                  <div className="text-slate-600">Physical Location: {selectedVendor.location}</div>
                  <div className="text-slate-600">
                    Selling Permission:{' '}
                    <strong className={selectedVendor.isApprovedToSell ? 'text-emerald-700' : 'text-amber-700'}>
                      {selectedVendor.isApprovedToSell ? 'Approved to Sell' : 'Pending Administrative Approval'}
                    </strong>
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1.5">
                  <div className="font-bold text-blue-900 uppercase text-[10px] tracking-wider">
                    Submitted Identity & Business Proof
                  </div>
                  <div>
                    <strong>Government ID / Proof: </strong>
                    <span className="font-mono text-slate-800">
                      {selectedVendor.kycIdCardUrl || 'Physical Stall Inspection Verified'}
                    </span>
                  </div>
                  <div>
                    <strong>Settlement Bank Account: </strong>
                    <span className="text-slate-800">
                      {selectedVendor.bankName} • {selectedVendor.accountNumber} ({selectedVendor.accountName})
                    </span>
                  </div>
                  <div>
                    <strong>Paid Verification Badge: </strong>
                    <span className={selectedVendor.isVerified ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                      {selectedVendor.isVerified ? 'Active (Trust Badge Issued)' : 'Not Issued (Unpaid)'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                  <strong>Notice:</strong> Approving this application grants the store permission to list products and sell on Ogba Marketplace. The <strong>Verified Badge (Checkmark)</strong> should only be granted once the vendor pays the badge verification fee.
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2">
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Reject with Reason
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedVendor(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Close
                  </button>
                  {!selectedVendor.isApprovedToSell ? (
                    <button
                      onClick={() => handleApproveStore(selectedVendor)}
                      disabled={actionLoadingId === selectedVendor.id}
                      className="px-5 py-2 bg-forest-850 hover:bg-forest-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Approve to Sell</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleBadge(selectedVendor)}
                      disabled={actionLoadingId === selectedVendor.id}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        selectedVendor.isVerified
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      <Award className="w-4 h-4" />
                      <span>{selectedVendor.isVerified ? 'Revoke Badge' : 'Grant Verified Badge'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Decline KYC with Reason */}
        {showRejectModal && selectedVendor && (
          <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  Decline KYC Application
                </h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Please provide the specific reason for rejecting <strong>{selectedVendor.name}</strong>. This explanation will be sent to the merchant.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Identity document submitted is expired or blurry. Please upload a clear NIN slip or voter card."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectKYC}
                  disabled={actionLoadingId === selectedVendor.id}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
