'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, Building, Phone, User, MapPin, CreditCard, ArrowRight, RefreshCw, CheckCircle } from 'lucide-react';
import { registerVendorWebAction } from '@/actions/vendors';
import { getActiveCommunitiesAction, CommunityRecord } from '@/actions/communities';

const NIGERIAN_BANKS = [
  'Access Bank PLC',
  'First Bank of Nigeria',
  'Zenith Bank PLC',
  'Guaranty Trust Bank (GTBank)',
  'United Bank for Africa (UBA)',
  'OPay Digital Services',
  'Moniepoint Microfinance Bank',
  'PalmPay',
  'Kuda Microfinance Bank',
  'Fidelity Bank PLC',
  'Stanbic IBTC Bank',
  'Union Bank of Nigeria',
];

export default function VendorRegisterPage() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [marketLocation, setMarketLocation] = useState('');
  const [area, setArea] = useState('Omoku');
  const [communities, setCommunities] = useState<CommunityRecord[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [bankName, setBankName] = useState(NIGERIAN_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadCommunities() {
      try {
        const commList = await getActiveCommunitiesAction();
        if (commList && commList.length > 0) {
          setCommunities(commList);
          setArea(commList[0].name);
        } else {
          // Fallback if table not populated yet
          setCommunities([
            { id: '1', name: 'Omoku', lga: 'Ogba/Egbema/Ndoni', is_active: true },
            { id: '2', name: 'Egi', lga: 'Ogba/Egbema/Ndoni', is_active: true },
            { id: '3', name: 'Obrikom', lga: 'Ogba/Egbema/Ndoni', is_active: true },
            { id: '4', name: 'Erema', lga: 'Ogba/Egbema/Ndoni', is_active: true },
            { id: '5', name: 'Ahoada', lga: 'Ahoada East', is_active: true },
          ]);
        }
      } catch (e) {
        console.error('Failed to load communities:', e);
      } finally {
        setLoadingCommunities(false);
      }
    }
    loadCommunities();
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

    setLoading(true);
    try {
      const res = await registerVendorWebAction({
        businessName: businessName.trim(),
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        marketLocation: marketLocation.trim(),
        area,
        bankName,
        accountNumber: accountNumber.trim() || undefined,
        accountName: accountName.trim() || fullName.trim(),
      });

      if (res.success) {
        router.push('/vendor');
      } else {
        setErrorMsg(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

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
          Start selling your goods to customers in Omoku, Egi, Obrikom and across Rivers State with guaranteed escrow protection.
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

            {/* Payout Details Section */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Settlement Bank Account (For Your Daily Payouts)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                  >
                    {NIGERIAN_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="10-digit NUBAN Account Number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-forest-850 hover:bg-forest-900 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Registering Storefront...</span>
                </>
              ) : (
                <>
                  <span>Complete Store Registration</span>
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
