'use client';

import React from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  ShieldCheck,
  CheckCircle,
  FileText,
  Building,
  UploadCloud,
  Check,
} from 'lucide-react';

export default function VendorKycPage() {
  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="KYC & Store Verification"
        subtitle="Verification status and official business identity badge on Ogba Marketplace."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Verification Status Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900">Verified Merchant Account</h3>
                <span className="text-xs bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                  Tier 2 Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Your business has completed physical verification in Omoku.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-500 font-bold uppercase text-[10px]">National Identity (NIN)</div>
              <div className="text-slate-900 font-bold mt-0.5 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>•••••••••4812 (Verified)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-500 font-bold uppercase text-[10px]">Physical Store Proof</div>
              <div className="text-slate-900 font-bold mt-0.5 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Omoku Market Road Outlet</span>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Card */}
        <div className="bg-forest-50/80 rounded-2xl p-6 border border-forest-100 space-y-3">
          <h4 className="font-extrabold text-forest-900 text-sm">Your Verified Merchant Privileges:</h4>
          <ul className="text-xs text-forest-800 space-y-2 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Green Verified Badge displayed next to your store name in search results.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Instant same-day payouts without approval delays.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Priority dispatch rider routing for your cooked orders.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
