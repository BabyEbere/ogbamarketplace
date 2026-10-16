'use client';

import React, { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  User,
  Bike,
  Store,
  Eye,
} from 'lucide-react';

export default function AdminKycPage() {
  const [activeTab, setActiveTab] = useState('pending');

  const verifications = [
    {
      id: 'KYC-801',
      name: 'Erema Palm Oil Mills (Chief Nwosu)',
      type: 'Vendor Store',
      docType: 'CAC Registration & NIN Slip',
      submittedDate: '24 Sep 2026',
      status: 'Pending Review',
      phone: '+234 811 002 9931',
      details: 'Physical warehouse located along Erema central road, commercial extraction setup.',
    },
    {
      id: 'KYC-802',
      name: 'Stanley Jumbo',
      type: 'Dispatch Rider',
      docType: 'Driver License & Bike Proof of Ownership',
      submittedDate: '24 Sep 2026',
      status: 'Pending Review',
      phone: '+234 814 662 1009',
      details: 'Bajaj Boxer 150cc, Plate: RIV-842-OM, valid rider permit.',
    },
    {
      id: 'KYC-803',
      name: 'Obagi Organic Poultry',
      type: 'Vendor Store',
      docType: 'Voter ID & Local Council Farm Permit',
      submittedDate: '23 Sep 2026',
      status: 'Pending Review',
      phone: '+234 803 119 5542',
      details: 'Poultry egg wholesale farm in Egi clan.',
    },
  ];

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="KYC & Identity Verifications"
        subtitle="Review government IDs, CAC registrations, and bike ownership documents for trust & safety."
        liveStats={{ label: 'Pending Review', value: '3 Applications', badge: 'Action Required' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Review</span>
            <div className="mt-2 text-3xl font-black text-amber-600">3</div>
            <p className="text-xs text-slate-500 mt-1">Requires manual document verification</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Verified Vendors</span>
            <div className="mt-2 text-3xl font-black text-forest-850">116</div>
            <p className="text-xs text-emerald-700 font-semibold mt-1">Approved & badge granted</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Verified Riders</span>
            <div className="mt-2 text-3xl font-black text-forest-850">48</div>
            <p className="text-xs text-emerald-700 font-semibold mt-1">Road safety cleared</p>
          </div>
        </div>

        {/* Verification Queue Cards */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
            Pending Document Submissions
          </h3>

          {verifications.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                  {item.type === 'Dispatch Rider' ? (
                    <Bike className="w-5 h-5" />
                  ) : (
                    <Store className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-base">{item.name}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    <strong className="text-slate-800">Documents:</strong> {item.docType} • Submitted: {item.submittedDate}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.details}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
                <button className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors">
                  <Eye className="w-4 h-4" />
                  <span>Inspect Docs</span>
                </button>
                <button className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors">
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve & Verify</span>
                </button>
                <button className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center gap-1.5 transition-colors">
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
