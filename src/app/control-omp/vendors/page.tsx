'use client';

import React, { useState, useEffect } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  Store,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  ShieldCheck,
  RefreshCw,
  Eye,
  Building,
  UserCheck,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import {
  getAdminVendorsFromDB,
  toggleVendorApprovalToSellAction,
  reviewVendorKYCAction,
  AdminVendorRecord,
} from '@/actions/admin';

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<AdminVendorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Review KYC Modal State
  const [selectedVendorForKYC, setSelectedVendorForKYC] = useState<AdminVendorRecord | null>(null);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const data = await getAdminVendorsFromDB();
      setVendors(data);
    } catch (err) {
      console.error('Failed to load vendors from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Toggle approval to sell
  const handleToggleApproval = async (vendor: AdminVendorRecord) => {
    const nextApproved = !vendor.isApprovedToSell;
    setActionLoadingId(vendor.id);
    try {
      const res = await toggleVendorApprovalToSellAction({
        vendorId: vendor.id,
        userId: vendor.userId,
        approved: nextApproved,
      });

      if (res.success) {
        showToast(res.message);
        setVendors((prev) =>
          prev.map((v) => (v.id === vendor.id ? { ...v, isApprovedToSell: nextApproved } : v))
        );
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Grant or revoke verified badge
  const handleReviewKYC = async (vendorId: string, status: 'verified' | 'rejected') => {
    setActionLoadingId(vendorId);
    try {
      const res = await reviewVendorKYCAction({
        vendorId,
        status,
      });

      if (res.success) {
        showToast(
          status === 'verified'
            ? 'Vendor KYC Approved! Green verification badge is now visible on their products.'
            : 'Vendor verification rejected/revoked.'
        );
        setVendors((prev) =>
          prev.map((v) =>
            v.id === vendorId
              ? {
                  ...v,
                  kycStatus: status,
                  isVerified: status === 'verified',
                }
              : v
          )
        );
        setSelectedVendorForKYC(null);
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'KYC review failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.phone.includes(searchTerm)
  );

  const totalSales = vendors.reduce((acc, v) => acc + v.totalSalesNum, 0);
  const totalCommission = Math.round(totalSales * 0.05);
  const pendingApprovalsCount = vendors.filter((v) => !v.isApprovedToSell).length;
  const pendingKYCCount = vendors.filter((v) => v.kycStatus === 'pending').length;

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Vendors & Merchants HQ"
        subtitle="Live Supabase Database: manage merchant store approval to sell, KYC document reviews, and verified badges."
        liveStats={{ label: 'Stores in DB', value: `${vendors.length} Registered` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Toast Alert */}
        {notification && (
          <div
            className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border shadow-sm transition-all ${
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

        {/* Top Vendor Metrics from Live DB */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Stores</span>
            <div className="mt-2 text-3xl font-black text-slate-900">{vendors.length}</div>
            <p className="text-xs text-slate-500 mt-1">Fetched directly from Supabase</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Platform Commission</span>
            <div className="mt-2 text-3xl font-black text-forest-850">₦{totalCommission.toLocaleString()}</div>
            <p className="text-xs text-emerald-700 font-semibold mt-1">5% retained from vendor gross volume</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Awaiting Sell Approval</span>
            <div className="mt-2 text-3xl font-black text-amber-600">{pendingApprovalsCount} Stores</div>
            <p className="text-xs text-slate-500 mt-1">Needs admin approval to activate store</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending KYC Reviews</span>
            <div className="mt-2 text-3xl font-black text-blue-600">{pendingKYCCount} Documents</div>
            <p className="text-xs text-slate-500 mt-1">Awaiting verification badge check</p>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search store name, owner, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadVendors}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh DB</span>
            </button>
          </div>
        </div>

        {/* Vendors Live Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Store / Merchant</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Sales / Fee</th>
                  <th className="px-5 py-3.5">Approval to Sell</th>
                  <th className="px-5 py-3.5">Verified Badge (KYC)</th>
                  <th className="px-5 py-3.5">Payout Address</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 text-xs font-bold">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-forest-850" />
                        <span>Querying Supabase vendors table...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                      No vendors found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => {
                    const isBusy = actionLoadingId === vendor.id;

                    return (
                      <tr key={vendor.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Store Info */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-forest-850 text-white font-black text-sm flex items-center justify-center shrink-0">
                              {vendor.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{vendor.name}</span>
                                {vendor.isVerified && (
                                  <span title="Admin Verified Store">
                                    <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 font-medium">
                                Owner: {vendor.owner} • {vendor.phone}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-5 py-3.5 text-xs text-slate-600">
                          <div className="font-semibold text-slate-800">{vendor.location}</div>
                          <div className="text-[11px] text-slate-400">{vendor.productsCount} items listed</div>
                        </td>

                        {/* Sales / Commission */}
                        <td className="px-5 py-3.5 text-xs">
                          <div className="font-black text-forest-850">{vendor.totalRevenue}</div>
                          <div className="text-emerald-700 font-semibold text-[11px]">Fee: {vendor.commissionPaid}</div>
                        </td>

                        {/* Approval to Sell */}
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => handleToggleApproval(vendor)}
                            disabled={isBusy}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                              vendor.isApprovedToSell
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }`}
                            title="Click to toggle approval to sell"
                          >
                            {vendor.isApprovedToSell ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Approved to Sell</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Pending Approval</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* KYC & Verification Badge */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                vendor.isVerified
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : vendor.kycStatus === 'pending'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {vendor.isVerified ? (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Verified Badge Active</span>
                                </>
                              ) : vendor.kycStatus === 'pending' ? (
                                <>
                                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                                  <span>KYC Review Needed</span>
                                </>
                              ) : (
                                <span>Unverified (No KYC)</span>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Settlement Bank / Payout Address */}
                        <td className="px-5 py-3.5 text-xs text-slate-700">
                          <div className="font-semibold text-slate-900">{vendor.bankName}</div>
                          <div className="font-mono text-[11px] text-slate-500">{vendor.accountNumber}</div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Approval Button */}
                            <button
                              onClick={() => handleToggleApproval(vendor)}
                              disabled={isBusy}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                vendor.isApprovedToSell
                                  ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700'
                                  : 'bg-forest-850 hover:bg-forest-900 text-white shadow-xs'
                              }`}
                            >
                              {vendor.isApprovedToSell ? 'Suspend' : 'Approve to Sell'}
                            </button>

                            {/* KYC Review / Badge Button */}
                            <button
                              onClick={() => setSelectedVendorForKYC(vendor)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>KYC</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* KYC Review Modal */}
        {selectedVendorForKYC && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-forest-850" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Review Merchant KYC Verification
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedVendorForKYC(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{selectedVendorForKYC.name}</div>
                  <div className="text-slate-600">Owner: {selectedVendorForKYC.owner} ({selectedVendorForKYC.phone})</div>
                  <div className="text-slate-600">Physical Location: {selectedVendorForKYC.location}</div>
                  <div className="text-slate-600">
                    Approval to Sell:{' '}
                    <strong className={selectedVendorForKYC.isApprovedToSell ? 'text-emerald-700' : 'text-amber-700'}>
                      {selectedVendorForKYC.isApprovedToSell ? 'Approved' : 'Not Approved'}
                    </strong>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1.5">
                  <div className="font-bold text-blue-900 uppercase text-[10px] tracking-wider">Submitted Verification Info</div>
                  <div>
                    <strong>ID Document / Number: </strong>
                    <span className="font-mono">{selectedVendorForKYC.kycIdCardUrl || 'NIN / Government ID Submitted'}</span>
                  </div>
                  <div>
                    <strong>Storefront Verification: </strong>
                    <span>{selectedVendorForKYC.kycBusinessProofUrl || selectedVendorForKYC.location}</span>
                  </div>
                  <div>
                    <strong>Payout Bank Account: </strong>
                    <span>{selectedVendorForKYC.bankName} • {selectedVendorForKYC.accountNumber} ({selectedVendorForKYC.accountName})</span>
                  </div>
                </div>

                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Approving KYC will permanently assign the <strong>Verified Merchant Badge (Green Checkmark)</strong> to {selectedVendorForKYC.name} across search results and on all product detail pages.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedVendorForKYC(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>

                {selectedVendorForKYC.isVerified ? (
                  <button
                    onClick={() => handleReviewKYC(selectedVendorForKYC.id, 'rejected')}
                    disabled={actionLoadingId === selectedVendorForKYC.id}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Revoke Verified Badge
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleReviewKYC(selectedVendorForKYC.id, 'rejected')}
                      disabled={actionLoadingId === selectedVendorForKYC.id}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      Reject KYC
                    </button>
                    <button
                      onClick={() => handleReviewKYC(selectedVendorForKYC.id, 'verified')}
                      disabled={actionLoadingId === selectedVendorForKYC.id}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve & Grant Badge</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
