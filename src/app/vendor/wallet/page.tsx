'use client';

import React, { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  Building,
  Clock,
  ShieldCheck,
  Send,
} from 'lucide-react';

export default function VendorWalletPage() {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const wallet = {
    balance: '₦145,000',
    pendingSettlement: '₦28,000',
    totalWithdrawn: '₦1,850,000',
    bankName: 'Access Bank PLC',
    accountNumber: '0123984812',
    accountName: 'PEACE OKORO',
  };

  const transactions = [
    { id: 'TXN-991', desc: 'Payout Transfer to Access Bank', amount: '-₦120,000', date: '21 Sep 2026', type: 'debit', status: 'Completed' },
    { id: 'TXN-990', desc: 'Order Settlement #ORD-9820', amount: '+₦18,500', date: '20 Sep 2026', type: 'credit', status: 'Settled' },
    { id: 'TXN-989', desc: 'Order Settlement #ORD-9818', amount: '+₦22,000', date: '20 Sep 2026', type: 'credit', status: 'Settled' },
    { id: 'TXN-988', desc: 'Order Settlement #ORD-9812', amount: '+₦12,000', date: '19 Sep 2026', type: 'credit', status: 'Settled' },
  ];

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setShowWithdrawModal(false);
      setSubmitted(false);
      setWithdrawAmount('');
    }, 2000);
  };

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Earnings & Merchant Wallet"
        subtitle="Manage your marketplace revenues, view daily settlements, and withdraw directly to your Nigerian bank account."
        liveStats={{ label: 'Available for Withdrawal', value: wallet.balance }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Wallet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-gradient-to-br from-forest-900 to-forest-800 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Available Balance</span>
              <div className="text-3xl font-black mt-2 tracking-tight">{wallet.balance}</div>
              <p className="text-xs text-emerald-300/80 mt-1">Ready for same-day bank transfer</p>
            </div>

            <button
              onClick={() => setShowWithdrawModal(true)}
              className="mt-5 w-full py-2.5 bg-white text-forest-900 font-extrabold text-xs rounded-xl shadow-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Withdraw Funds</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Settlement Bank</span>
              <div className="text-base font-extrabold text-slate-900 mt-2 flex items-center gap-2">
                <Building className="w-4 h-4 text-forest-850" />
                {wallet.bankName}
              </div>
              <p className="text-xs font-mono font-bold text-slate-700 mt-1">{wallet.accountNumber}</p>
              <p className="text-xs text-slate-500">{wallet.accountName}</p>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Merchant Account</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lifetime Revenue</span>
              <div className="text-3xl font-black text-slate-900 mt-2">{wallet.totalWithdrawn}</div>
              <p className="text-xs text-slate-500 mt-1">Successfully disbursed to your account</p>
            </div>

            <div className="mt-4 text-xs text-slate-600">
              <span>Merchant Fee: </span>
              <strong className="text-slate-900 font-bold">5% automatically deducted</strong>
            </div>
          </div>
        </div>

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">Withdraw to Bank</h3>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {submitted ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="font-extrabold text-slate-900 text-base">Withdrawal Queued!</h4>
                  <p className="text-xs text-slate-500">
                    Your payout request has been sent to the admin settlement queue.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleWithdraw} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                      Amount to Withdraw (₦)
                    </label>
                    <input
                      type="number"
                      required
                      max={145000}
                      min={1000}
                      placeholder="e.g. 50000"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Available: {wallet.balance}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                    <div><strong>Destination:</strong> {wallet.bankName}</div>
                    <div><strong>Account:</strong> {wallet.accountNumber} ({wallet.accountName})</div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowWithdrawModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-forest-850 hover:bg-forest-900 text-white rounded-xl text-xs font-bold shadow-xs"
                    >
                      Confirm Withdrawal
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">Wallet Transaction Ledger</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Transaction ID</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-700">{t.id}</td>
                    <td className="px-5 py-3.5 text-xs font-medium text-slate-800">{t.desc}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{t.date}</td>
                    <td className="px-5 py-3.5 font-black text-sm">
                      <span className={t.type === 'credit' ? 'text-emerald-700' : 'text-slate-900'}>
                        {t.amount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {t.status}
                      </span>
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
