'use client';

import React, { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  Store,
  Clock,
  Phone,
  MapPin,
  Save,
  CheckCircle,
} from 'lucide-react';

export default function VendorSettingsPage() {
  const [storeName, setStoreName] = useState('Mama Peace Fresh Kitchen');
  const [phone, setPhone] = useState('+234 814 902 1120');
  const [address, setAddress] = useState('14 Omoku Market Road, Opposite Union Bank');
  const [openTime, setOpenTime] = useState('07:30');
  const [closeTime, setCloseTime] = useState('21:00');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Store Profile & Operations"
        subtitle="Update your storefront branding, customer contact line, and opening hours."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {saved && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>Store settings successfully updated!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Store / Business Name</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp & Call Line</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Physical Location / Landmark</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Opening Time</label>
              <input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Closing Time</label>
              <input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-800"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-forest-850 hover:bg-forest-900 text-white rounded-xl text-sm font-bold shadow-xs flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Store Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
