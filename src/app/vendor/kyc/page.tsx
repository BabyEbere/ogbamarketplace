'use client';

import React, { useState, useEffect } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  ShieldCheck,
  CheckCircle,
  FileText,
  Building,
  UploadCloud,
  Check,
  Lock,
  AlertTriangle,
  Clock,
  RefreshCw,
  Send,
  HelpCircle,
} from 'lucide-react';
import {
  getCurrentVendorProfile,
  submitVendorKYCAction,
  VendorProfileData,
} from '@/actions/vendors';
import { getPlatformSettingsAction, PlatformConfig } from '@/actions/settings';

export default function VendorKycPage() {
  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Application form fields
  const [idType, setIdType] = useState('National Identity (NIN)');
  const [idNumber, setIdNumber] = useState('');
  const [storeProof, setStoreProof] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [data, config] = await Promise.all([
        getCurrentVendorProfile(),
        getPlatformSettingsAction(),
      ]);
      if (data) {
        setProfile(data);
        setStoreProof(data.marketLocation || '');
      }
      if (config) {
        setPlatformConfig(config);
      }
    } catch (err) {
      console.error('Failed to load profile for KYC:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSubmitKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!profile.isApprovedToSell) {
      showToast(
        'Store approval required: Your store must first be approved to sell by the admin before applying for verification.',
        'error'
      );
      return;
    }

    if (!idNumber.trim()) {
      showToast('Please enter your official identification number.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitVendorKYCAction({
        vendorId: profile.id,
        idType,
        idNumber: idNumber.trim(),
        businessProofUrl: storeProof.trim(),
      });

      if (res.success) {
        showToast(res.message);
        setProfile((prev) => (prev ? { ...prev, kycStatus: 'pending' } : null));
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isApprovedToSell = profile?.isApprovedToSell ?? false;
  const isVerified = profile?.isVerified ?? false;
  const isPendingReview = profile?.kycStatus === 'pending';

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="KYC & Store Verification"
        subtitle="Apply for official merchant verification, unlock same-day settlements, and receive your verified store badge."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-6">
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

        {/* CONDITION 1: Store NOT approved to sell yet */}
        {!loading && !isApprovedToSell && (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-amber-900">
                  Store Approval Required First
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  Your store must first be approved to sell by the Ogba Marketplace Admin before you can apply for Tier-2 KYC Verification.
                </p>
              </div>
            </div>

            <div className="p-3 bg-white/70 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
              <div><strong>Current Store Status: </strong> Pending Administrator Approval to Sell</div>
              <div><strong>Store Name: </strong> {profile?.businessName}</div>
              <div><strong>Registered Location: </strong> {profile?.marketLocation}</div>
              <p className="pt-1 text-[11px] text-amber-900 font-semibold">
                Once our Omoku market administrator verifies your storefront application in the Control Center, this KYC application form will unlock automatically.
              </p>
            </div>
          </div>
        )}

        {/* CONDITION 2: Store is already verified */}
        {!loading && isVerified && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-slate-900">Verified Merchant Account</h3>
                  <span className="text-xs bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Tier 2 Active</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your business has completed physical verification in Omoku / ONELGA.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500 font-bold uppercase text-[10px]">National Identity (NIN)</div>
                <div className="text-slate-900 font-bold mt-0.5 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified by Admin</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500 font-bold uppercase text-[10px]">Physical Store Proof</div>
                <div className="text-slate-900 font-bold mt-0.5 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{profile?.marketLocation || 'Omoku Outlet'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONDITION 3: Application submitted and under review */}
        {!loading && !isVerified && isPendingReview && (
          <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-blue-900">
                  Verification Application Under Review
                </h3>
                <p className="text-xs text-blue-700 mt-0.5">
                  Your Tier-2 KYC documents have been submitted to the Ogba Marketplace Admin.
                </p>
              </div>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-blue-200 text-xs text-blue-800 space-y-1">
              <div><strong>Status: </strong> Awaiting Admin Document Review</div>
              <div><strong>Store: </strong> {profile?.businessName}</div>
              <div><strong>Submitted Location: </strong> {profile?.marketLocation}</div>
              <p className="pt-1 text-[11px] text-blue-900 font-semibold">
                Reviews take 12 - 24 hours. Once approved, the green verification badge will appear next to your store name.
              </p>
            </div>
          </div>
        )}

        {/* CONDITION 4: Store approved to sell, and KYC is unsubmitted or rejected -> Render Application Form */}
        {!loading && isApprovedToSell && !isVerified && !isPendingReview && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-forest-850" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Apply for Tier-2 KYC Merchant Verification
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Your store is approved to sell! Complete identity verification to earn the green verified badge and priority courier dispatch.
              </p>
            </div>

            <form onSubmit={handleSubmitKYC} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    Select Government ID Type
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                  >
                    <option value="National Identity (NIN)">National Identity Number (NIN)</option>
                    <option value="Driver's License">FRSC Driver's License</option>
                    <option value="Voter's Card">INEC Voter's Card</option>
                    <option value="International Passport">Nigerian International Passport</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    Government ID Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12345678901"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                  Physical Store Address / Market Line
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Omoku Main Market, Line 2, Shop 14"
                  value={storeProof}
                  onChange={(e) => setStoreProof(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                />
                <p className="text-[11px] text-slate-500 mt-1">Our field logistics team verifies physical shop presence</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div>
                  <strong>Store Name: </strong> {profile?.businessName}
                </div>
                <div>
                  <strong>Payout Account: </strong> {profile?.bankName || 'Not Set'} ({profile?.accountNumber || 'Add in Wallet'})
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-forest-850 hover:bg-forest-900 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Verification Application</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Benefits Card */}
        <div className="bg-forest-50/80 rounded-2xl p-6 border border-forest-100 space-y-3">
          <h4 className="font-extrabold text-forest-900 text-sm">Verified Merchant Privileges:</h4>
          <ul className="text-xs text-forest-800 space-y-2 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Green Verified Badge displayed next to your store name on all product pages and in search.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Priority settlement processing for your sales earnings.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Priority dispatch rider allocation for instant order fulfillment in Omoku, Egi & Obrikom.</span>
            </li>
          </ul>
        </div>

        {/* Monetary Verification Badge Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Official Merchant Verification Badge (Credibility Checkmark)
                </h4>
                <p className="text-xs text-slate-500">
                  Paid trust subscription granting a verified badge across all your products.
                </p>
              </div>
            </div>

            <span
              className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                isVerified
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {isVerified ? 'Badge Active' : 'Badge Inactive'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Badge Fee & Validity</span>
              <div className="font-black text-slate-900 text-sm">
                ₦{Number(platformConfig?.verificationBadgePrice || 15000).toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-500">
                  / {platformConfig?.verificationBadgePeriod || 'Annual'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Official price set by Ogba Marketplace Administration.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Eligibility Criteria</span>
              <p className="text-slate-700 whitespace-pre-line text-[11px] leading-relaxed">
                {platformConfig?.verificationBadgeRequirements ||
                  '1. Approved vendor store\n2. Valid NIN or CAC registration\n3. Minimum 5 verified deliveries'}
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
            <strong>Payment & Activation Instructions:</strong>
            <p className="text-[11px] leading-relaxed">
              {platformConfig?.verificationBadgeInstructions ||
                'Pay badge verification fee into Ogba Marketplace designated settlement account or Paystack badge gateway, and notify our market desk with payment receipt.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
