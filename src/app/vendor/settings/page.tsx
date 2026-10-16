'use client';

import React, { useState, useEffect } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  Store,
  MapPin,
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Building,
  Phone,
} from 'lucide-react';
import {
  getCurrentVendorProfile,
  updateVendorStoreProfileAction,
  VendorProfileData,
} from '@/actions/vendors';
import { getActiveCommunitiesAction } from '@/actions/communities';

export default function VendorSettingsPage() {
  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [communities, setCommunities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [area, setArea] = useState('');
  const [marketLocation, setMarketLocation] = useState('');

  // Action status
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [vendorProf, activeComms] = await Promise.all([
        getCurrentVendorProfile(),
        getActiveCommunitiesAction(),
      ]);

      setProfile(vendorProf);
      const commNames = activeComms.map((c) => c.name);
      setCommunities(commNames);

      if (vendorProf) {
        setBusinessName(vendorProf.businessName);
        setArea(vendorProf.area || (commNames[0] || 'Omoku'));
        setMarketLocation(vendorProf.marketLocation);
      } else if (commNames.length > 0) {
        setArea(commNames[0]);
      }
    } catch (err) {
      console.error('Error loading vendor settings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    if (!businessName.trim()) {
      showToast('Store name is required.', 'error');
      return;
    }

    if (!area.trim()) {
      showToast('Please select your community from the dropdown.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await updateVendorStoreProfileAction({
        vendorId: profile.id,
        businessName: businessName.trim(),
        area: area.trim(),
        marketLocation: marketLocation.trim(),
      });

      if (res.success) {
        showToast(res.message);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                businessName: businessName.trim(),
                area: area.trim(),
                marketLocation: marketLocation.trim(),
              }
            : null
        );
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update store settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Store Profile & Operations"
        subtitle="Update your storefront branding, physical location, and select your operating community (managed in admin control settings)."
        liveStats={{ label: 'Current Community', value: area || 'Omoku' }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {notification && (
          <div
            className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border shadow-sm ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 font-bold">
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-forest-850" />
              <h3 className="text-base font-extrabold text-slate-900">Storefront Identity</h3>
            </div>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="text-xs font-bold text-slate-500 hover:text-forest-850 flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Store / Business Name *
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Mama Peace Kitchen & Groceries"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dynamic Community Dropdown from Control Site Settings */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Community / Operational Zone *
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800"
              >
                {communities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Community names are managed in Control Site Settings.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Physical Market Stall / Address *
              </label>
              <input
                type="text"
                required
                value={marketLocation}
                onChange={(e) => setMarketLocation(e.target.value)}
                placeholder="e.g. Omoku Main Market, Line 4, Stall 22"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-forest-50 border border-forest-100 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-forest-900 block">Owner / Merchant Contact</span>
              <span className="text-forest-700">{profile?.ownerName} • {profile?.ownerPhone}</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-600 block">KYC Status</span>
              <span className="font-extrabold capitalize text-forest-850">{profile?.kycStatus || 'Pending'}</span>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-forest-850 hover:bg-forest-900 text-white rounded-xl text-sm font-bold shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Store Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
