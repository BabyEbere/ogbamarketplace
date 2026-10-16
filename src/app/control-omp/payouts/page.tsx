'use client';

import React, { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  CreditCard,
  Search,
  CheckCircle,
  Clock,
  Send,
  Building,
  ArrowDownRight,
  TrendingUp,
} from 'lucide-react';

export default function AdminPayoutsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const payouts = [
    { id: 'PAY-401', recipient: 'Mama Peace Fresh Kitchen', type: 'Vendor', amount: '₦145,000', bank: 'Access Bank (0123984812)', requestedDate: '24 Sep 2026', status: 'Pending Transfer' },
    { id: 'PAY-402', recipient: 'De-Kings Farm Fresh', type: 'Vendor', amount: '₦195,000', bank: 'First Bank (3089124401)', requestedDate: '24 Sep 2026', status: 'Pending Transfer' },
    { id: 'PAY-403', recipient: 'Emeka Sunday (Rider 04)', type: 'Rider', amount: '₦42,000', bank: 'OPay (8093328841)', requestedDate: '23 Sep 2026', status: 'Completed' },
    { id: 'PAY-404', recipient: 'Tari Douglas (Rider 11)', type: 'Rider', amount: '₦56,000', bank: 'Moniepoint (8124415567)', requestedDate: '23 Sep 2026', status: 'Completed' },
    { id: 'PAY-405', recipient: 'Obrikom Mega Pharmacy', type: 'Vendor', amount: '₦320,000', bank: 'Zenith Bank (2018449910)', requestedDate: '22 Sep 2026', status: 'Completed' },
  ];

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Payouts & Banking Ledger"
        subtitle="Manage merchant settlements, rider earnings disbursements, and automated payout logs."
        liveStats={{ label: 'Pending Payouts', value: '₦340,000' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Disbursements</span>
            <div className="mt-2 text-3xl font-black text-amber-600">₦340,000</div>
            <p className="text-xs text-slate-500 mt-1">2 requests awaiting bank wire</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Settled This Month</span>
            <div className="mt-2 text-3xl font-black text-forest-850">₦14,850,000</div>
            <p className="text-xs text-emerald-700 font-semibold mt-1">Paid to ONELGA merchants</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Platform Commission Retained</span>
            <div className="mt-2 text-3xl font-black text-slate-900">₦782,500</div>
            <p className="text-xs text-slate-500 mt-1">5% fee automatically deducted</p>
          </div>
        </div>

        {/* Payouts Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">Withdrawal & Settlement Queue</h3>
            <button className="px-4 py-2 bg-forest-850 hover:bg-forest-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors">
              Process Batch Transfer
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Payout ID</th>
                  <th className="px-5 py-3.5">Recipient & Type</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Bank Details</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-forest-850">{p.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{p.recipient}</div>
                      <span className="text-xs text-slate-500 font-medium">{p.type}</span>
                    </td>
                    <td className="px-5 py-3.5 font-black text-slate-900">{p.amount}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-700 font-medium">{p.bank}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{p.requestedDate}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          p.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {p.status === 'Pending Transfer' ? (
                        <button className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors">
                          Mark Paid
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
