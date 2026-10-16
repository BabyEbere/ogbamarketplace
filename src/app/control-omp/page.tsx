'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  Users,
  Store,
  Bike,
  ShoppingBag,
  TrendingUp,
  Smartphone,
  Globe,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  DollarSign,
  ChevronRight,
  Activity,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const [timeframe, setTimeframe] = useState('today');

  // Real-time metrics
  const liveStats = {
    usersOnlineNow: 142,
    usersActiveToday: 1894,
    ridersOnlineNow: 28,
    ridersActiveToday: 45,
    vendorsActiveNow: 62,
    vendorsRegistered: 118,
    appUsersPercent: 68,
    webUsersPercent: 32,
    todayOrders: 186,
    todayRevenue: '₦1,842,500',
    pendingPayouts: '₦340,000',
    kycPending: 3,
  };

  const recentOrders = [
    { id: 'ORD-9821', customer: 'Chinedu Eze', vendor: 'Mama Peace Kitchen', items: '2x Egusi Soup & Semo', amount: '₦5,600', rider: 'Emeka (Bike 04)', status: 'In Transit', time: '4 mins ago', channel: 'Mobile App' },
    { id: 'ORD-9820', customer: 'Blessing Jumbo', vendor: 'De-Kings Farm Fresh', items: '1x Live Local Fowl + Snails', amount: '₦18,500', rider: 'Tari (Bike 11)', status: 'Delivered', time: '12 mins ago', channel: 'Mobile App' },
    { id: 'ORD-9819', customer: 'Engr. Nnamdi', vendor: 'Ogba Prime Electronics', items: '1x 20,000mAh Powerbank', amount: '₦14,000', rider: 'Pending Assignment', status: 'Pending Dispatch', time: '19 mins ago', channel: 'Web Browser' },
    { id: 'ORD-9818', customer: 'Ifeoma Clark', vendor: 'Sweet Tooth Bakery', items: 'Custom Birthday Cake', amount: '₦22,000', rider: 'Lucky (Bike 02)', status: 'In Transit', time: '28 mins ago', channel: 'Mobile App' },
    { id: 'ORD-9817', customer: 'Dr. Kelechi', vendor: 'Obrikom Mega Pharmacy', items: 'Essential First Aid & Vitamins', amount: '₦9,800', rider: 'Uche (Bike 09)', status: 'Delivered', time: '41 mins ago', channel: 'Web Browser' },
  ];

  const zoneRiders = [
    { zone: 'Omoku Central Market', active: 14, total: 18, status: 'High Demand' },
    { zone: 'Egi Oil Gate & Obagi', active: 6, total: 8, status: 'Normal' },
    { zone: 'Obrikom Gas Plant Rd', active: 5, total: 7, status: 'Normal' },
    { zone: 'Erema & Ahoada Link', active: 3, total: 5, status: 'Moderate' },
  ];

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Admin Control Center"
        subtitle="Live telemetry and market activity across Omoku, Egi, and ONELGA communities."
        liveStats={{ label: 'Total Live Users', value: `${liveStats.usersOnlineNow} Active Now` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Live Pulse Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Users Pulse */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-forest-700/50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Shoppers</span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Realtime
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black text-slate-900 tracking-tight">{liveStats.usersOnlineNow}</span>
                <span className="text-xs text-slate-500 font-medium ml-1.5">online now</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Active today:</span>
              <strong className="text-slate-900 font-bold">{liveStats.usersActiveToday.toLocaleString()} users</strong>
            </div>
          </div>

          {/* Card 2: Riders Pulse */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-forest-700/50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Delivery Fleet</span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Riders
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black text-slate-900 tracking-tight">{liveStats.ridersOnlineNow}</span>
                <span className="text-xs text-slate-500 font-medium ml-1.5">on duty now</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold">
                <Bike className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Active today:</span>
              <strong className="text-slate-900 font-bold">{liveStats.ridersActiveToday} / 50 fleet</strong>
            </div>
          </div>

          {/* Card 3: Active Vendors */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-forest-700/50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Open Vendors</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Stores
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black text-slate-900 tracking-tight">{liveStats.vendorsActiveNow}</span>
                <span className="text-xs text-slate-500 font-medium ml-1.5">taking orders</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold">
                <Store className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Total registered:</span>
              <strong className="text-slate-900 font-bold">{liveStats.vendorsRegistered} merchants</strong>
            </div>
          </div>

          {/* Card 4: Daily Volume & GMV */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-forest-700/50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's GMV</span>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                Revenue
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-forest-850 tracking-tight">{liveStats.todayRevenue}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Completed orders:</span>
              <strong className="text-slate-900 font-bold">{liveStats.todayOrders} orders</strong>
            </div>
          </div>
        </div>

        {/* Platform Breakdown & Quick Governance Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Platform Device Analytics: App vs Web */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Traffic by Platform</h3>
                <p className="text-xs text-slate-500">Breakdown of active users accessing OM</p>
              </div>
              <Activity className="w-5 h-5 text-forest-800" />
            </div>

            <div className="space-y-4 my-6">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    Android / iOS Mobile App
                  </span>
                  <span className="text-emerald-700 font-extrabold">{liveStats.appUsersPercent}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-forest-800 rounded-full transition-all duration-500"
                    style={{ width: `${liveStats.appUsersPercent}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-600" />
                    Web Browser / PWA
                  </span>
                  <span className="text-slate-600 font-extrabold">{liveStats.webUsersPercent}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full transition-all duration-500"
                    style={{ width: `${liveStats.webUsersPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-forest-50/80 rounded-xl border border-forest-100 text-xs text-forest-900 flex items-start gap-2.5">
              <span className="font-bold text-forest-800">💡 Note:</span>
              <span>Mobile app downloads increased by 24% after the Omoku street flyer campaign.</span>
            </div>
          </div>

          {/* Quick Action Station */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Admin Action Quick-Desk</h3>
                <p className="text-xs text-slate-500">High priority pending tasks requiring immediate approval</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <Link
                href="/control-omp/kyc"
                className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    {liveStats.kycPending} Pending
                  </span>
                </div>
                <div className="mt-3">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                    KYC Verifications
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">2 Vendor IDs, 1 Rider Bike paper waiting</p>
                </div>
              </Link>

              <Link
                href="/control-omp/payouts"
                className="p-4 rounded-xl border border-forest-200 bg-forest-50/50 hover:bg-forest-50 transition-colors flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-forest-800 text-white flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-extrabold bg-forest-200 text-forest-900 px-2 py-0.5 rounded-full">
                    {liveStats.pendingPayouts}
                  </span>
                </div>
                <div className="mt-3">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-forest-800 transition-colors">
                    Pending Payouts
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Ready for batch transfer to local banks</p>
                </div>
              </Link>

              <Link
                href="/control-omp/orders"
                className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-extrabold bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full">
                    Live Dispatch
                  </span>
                </div>
                <div className="mt-3">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-800 transition-colors">
                    Dispatch Control
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Monitor real-time pickup & rider routing</p>
                </div>
              </Link>
            </div>

            {/* Zone Coverage status */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                Active Zone Coverage (ONELGA)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {zoneRiders.map((z) => (
                  <div key={z.zone} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-800 truncate">{z.zone}</div>
                    <div className="text-xs font-extrabold text-forest-800 mt-0.5">{z.active} active riders</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Real-time Order Feed</h3>
              <p className="text-xs text-slate-500">Latest customer purchases flowing through the platform</p>
            </div>
            <Link
              href="/control-omp/orders"
              className="text-xs font-bold text-forest-850 hover:text-forest-900 flex items-center gap-1 hover:underline"
            >
              View Full Dispatch Log
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Vendor / Store</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Assigned Rider</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-forest-850">{order.id}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{order.customer}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{order.vendor}</td>
                    <td className="px-5 py-3.5 font-extrabold text-slate-900">{order.amount}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{order.rider}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          order.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'In Transit'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{order.channel}</td>
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
