'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store,
  Building,
  Phone,
  User,
  MapPin,
  CreditCard,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  Tag,
  ShieldCheck,
  Check,
  Clock,
  Layers,
} from 'lucide-react';
import { registerVendorWebAction } from '@/actions/vendors';
import { getActiveCommunitiesAction, CommunityRecord } from '@/actions/communities';
import { getCategories } from '@/actions/categories';
import { getPayoutBanksAction, PayoutBank } from '@/actions/banks';
import { Category } from '@/types/marketplace';

export default function VendorRegisterPage() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [marketLocation, setMarketLocation] = useState('');
  const [area, setArea] = useState('Omoku');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Dynamic Options from DB
  const [communities, setCommunities] = useState<CommunityRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banks, setBanks] = useState<PayoutBank[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredSlug, setRegisteredSlug] = useState('');

  useEffect(() => {
    async function loadFormOptions() {
      try {
        setLoadingData(true);
        const [commList, catList, bankList] = await Promise.all([
          getActiveCommunitiesAction(),
          getCategories(),
          getPayoutBanksAction(),
        ]);

        if (commList && commList.length > 0) {
          setCommunities(commList);
          setArea(commList[0].name);
        }

        if (catList && catList.length > 0) {
          setCategories(catList);
          setSelectedCategoryId(catList[0].id);
        }

        if (bankList && bankList.length > 0) {
          setBanks(bankList);
          setBankName(bankList[0].name);
        }
      } catch (e) {
        console.error('Failed to load dynamic vendor registration options:', e);
      } finally {
        setLoadingData(false);
      }
    }
    loadFormOptions();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!businessName.trim()) {
      setErrorMsg('Please enter your business or store name.');
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name as store owner.');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMsg('Please enter your active phone number.');
      return;
    }
    if (!marketLocation.trim()) {
      setErrorMsg('Please specify your physical market location or shop number.');
      return;
    }
    if (!selectedCategoryId) {
      setErrorMsg('Please select your primary merchandise category.');
      return;
    }

    setLoading(true);
    try {
      const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

      const res = await registerVendorWebAction({
        businessName: businessName.trim(),
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        marketLocation: marketLocation.trim(),
        area,
        categoryId: selectedCategoryId,
        categoryName: selectedCategory?.name,
        idNumber: idNumber.trim() || undefined,
        bankName: bankName.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        accountName: accountName.trim() || fullName.trim(),
      });

      if (res.success) {
        setIsSuccess(true);
        setRegisteredSlug(res.vendorSlug || '');
      } else {
        setErrorMsg(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-10 px-6 sm:px-10 shadow-lg rounded-3xl border border-slate-200 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 mb-2">
                Under Admin Review
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Store Registration Submitted!
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Welcome to Ogba Marketplace! In accordance with platform security rules, all new vendor stores must be verified and approved by the Ogba Marketplace Administration before listing goods live.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Store Name:</span>
                <span className="font-extrabold text-slate-900">{businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Community Zone:</span>
                <span className="font-extrabold text-slate-900">{area}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-extrabold text-slate-900">
                  {categories.find((c) => c.id === selectedCategoryId)?.name || 'General Retail'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Approval Status:</span>
                <span className="font-extrabold text-amber-700">Pending Review</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Link
                href="/vendor"
                className="w-full py-3.5 bg-forest-850 hover:bg-forest-900 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Enter Store Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors text-center"
              >
                Return to Marketplace Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-forest-850 text-white flex items-center justify-center font-black text-xl shadow-md">
            <Store className="w-6 h-6" />
          </div>
        </Link>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Register Store on Ogba Marketplace
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-medium max-w-sm mx-auto">
          Start selling to customers in Omoku, Egi, Obrikom, Erema and across Rivers State with guaranteed escrow protection.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 shadow-md rounded-2xl border border-slate-200 sm:px-10 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Business / Store Name *
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mama Peace Fresh Food"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Owner Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Peace Okoro"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Phone Number (SMS & WhatsApp) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 08029991122"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. store@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
              </div>
            </div>

            {/* Dynamic Community & Market Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Community / Area in ONELGA *
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                >
                  {communities.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} {c.lga ? `(${c.lga})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Configured from Live Site Settings</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Market Location / Shop Number *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Omoku Main Market, Line 2, Shop 14"
                    value={marketLocation}
                    onChange={(e) => setMarketLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Primary Merchandise Category (Dynamic from DB) */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                <span>Primary Merchandise Department *</span>
                <span className="text-[10px] text-forest-800 font-bold lowercase">from database categories</span>
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ID / NIN Verification Reference */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                National ID Number (NIN) / Voter's Card No (For Verification Clearance)
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. 11-digit NIN or Voter ID"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Admin reviews your identity before approving store to sell.</p>
            </div>

            {/* Payout Details Section (Dynamic Banks from DB) */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Settlement Bank Account (For Your Daily Payouts)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Select Bank (Supported by Admin)
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                  >
                    {banks.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    10-digit NUBAN Account Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0123456789"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || loadingData}
              className="w-full py-3.5 bg-forest-850 hover:bg-forest-900 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting Store Registration...</span>
                </>
              ) : (
                <>
                  <span>Submit Store For Admin Approval</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already have a store account?{' '}
              <Link href="/vendor/login" className="font-extrabold text-forest-850 hover:underline">
                Sign In Here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
