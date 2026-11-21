'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  Users,
  Store,
  Bike,
  ShoppingBag,
  Smartphone,
  Globe,
  ShieldCheck,
  CreditCard,
  DollarSign,
  ChevronRight,
  Activity,
  RefreshCw,
} from 'lucide-react';
import {
  getControlDashboardSnapshotAction,
  ControlDashboardSnapshot,
} from '@/actions/admin';

const EMPTY_SNAPSHOT: ControlDashboardSnapshot = {
  usersCount: 0,
  usersActiveToday: 0,
  ridersOnlineNow: 0,
  ridersTotal: 0,
  vendorsActiveNow: 0,
  vendorsRegistered: 0,
  appUsersPercent: 0,
  webUsersPercent: 0,
  totalOrders: 0,
  totalRevenue: 0,
  pendingPayoutsAmount: 0,
  kycPendingCount: 0,
  pendingProductApprovalsCount: 0,
  zoneCoverage: [],
  recentOrders: [],
};

export default function AdminOverviewPage() {
  const [snapshot, setSnapshot] = useState<ControlDashboardSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getControlDashboardSnapshotAction();
      setSnapshot(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Admin Control Center"
        subtitle="Live database metrics and market activity across ONELGA communities."
        liveStats={{ label: 'Registered Users', value: `${snapshot.usersCount} Total` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={loadSnapshot}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh Live Data'}</span>
          </button>
        </div>

        {/* Live Pulse Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Users */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-forest-700/50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered Users</span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live DB
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black text-slate-900 tracking-tight">{snapshot.usersCount}</span>
                <span className="text-xs text-slate-500 font-medium ml-1.5">accounts</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Active today:</span>
              <strong className="text-slate-900 font-bold">{snapshot.usersActiveToday} users</strong>
            </div>
          </div>

          {/* Card 2: Riders */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-forest-700/50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Delivery Fleet</span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Riders
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black text-slate-900 tracking-tight">{snapshot.ridersOnlineNow}</span>
                <span className="text-xs text-slate-500 font-medium ml-1.5">online now</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold">
                <Bike className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Total registered:</span>
              <strong className="text-slate-900 font-bold">{snapshot.ridersTotal} riders</strong>
            </div>
          </div>

          {/* Card 3: Vendors */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-forest-700/50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Open Vendors</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Stores
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black text-slate-900 tracking-tight">{snapshot.vendorsActiveNow}</span>
                <span className="text-xs text-slate-500 font-medium ml-1.5">taking orders</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold">
                <Store className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Total registered:</span>
              <strong className="text-slate-900 font-bold">{snapshot.vendorsRegistered} merchants</strong>
            </div>
          </div>

          {/* Card 4: GMV */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-forest-700/50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Order Volume</span>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                Revenue
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-forest-850 tracking-tight">
                  ₦{snapshot.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Recorded orders:</span>
              <strong className="text-slate-900 font-bold">{snapshot.totalOrders} orders</strong>
            </div>
          </div>
        </div>

        {/* Platform Breakdown & Quick Governance Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Platform Device Analytics: App vs Web */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Users by Platform</h3>
                <p className="text-xs text-slate-500">Breakdown from registered user records</p>
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
                  <span className="text-emerald-700 font-extrabold">{snapshot.appUsersPercent}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-forest-800 rounded-full transition-all duration-500"
                    style={{ width: `${snapshot.appUsersPercent}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-600" />
                    Web Browser / PWA
                  </span>
                  <span className="text-slate-600 font-extrabold">{snapshot.webUsersPercent}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full transition-all duration-500"
                    style={{ width: `${snapshot.webUsersPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-forest-50/80 rounded-xl border border-forest-100 text-xs text-forest-900 flex items-start gap-2.5">
              <span className="font-bold text-forest-800">Info:</span>
              <span>
                {snapshot.pendingProductApprovalsCount} product listing(s) currently awaiting admin approval.
              </span>
            </div>
          </div>

          {/* Quick Action Station */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Admin Action Quick-Desk</h3>
                <p className="text-xs text-slate-500">Live pending tasks requiring admin review</p>
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
                    {snapshot.kycPendingCount} Pending
                  </span>
                </div>
                <div className="mt-3">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                    KYC Verifications
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {snapshot.kycPendingCount} vendor submission(s) waiting
                  </p>
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
                    ₦{snapshot.pendingPayoutsAmount.toLocaleString()}
                  </span>
                </div>
                <div className="mt-3">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-forest-800 transition-colors">
                    Pending Payouts
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Pending settlement requests</p>
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
                    {snapshot.totalOrders} Orders
                  </span>
                </div>
                <div className="mt-3">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-800 transition-colors">
                    Dispatch Control
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Monitor real-time orders & rider routing</p>
                </div>
              </Link>
            </div>

            {/* Active Community Zone Coverage (from Control DB) */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                Active Communities (From Control Settings)
              </div>
              {snapshot.zoneCoverage.length === 0 ? (
                <p className="text-xs text-slate-400">No active communities configured yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {snapshot.zoneCoverage.map((z) => (
                    <div key={z.zone} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-[11px] font-bold text-slate-800 truncate">{z.zone}</div>
                      <div className="text-xs font-extrabold text-forest-800 mt-0.5">
                        {z.activeRiders} / {z.totalRiders} riders
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Real-time Order Feed</h3>
              <p className="text-xs text-slate-500">Latest customer purchases recorded in Supabase</p>
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
                  <th className="px-5 py-3">Order Ref</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Zone</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Assigned Rider</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {snapshot.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-xs text-slate-500">
                      {loading ? 'Loading live orders from database...' : 'No orders recorded in the database yet.'}
                    </td>
                  </tr>
                ) : (
                  snapshot.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-forest-850">{order.reference}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{order.customer}</td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium">{order.vendor}</td>
                      <td className="px-5 py-3.5 font-extrabold text-slate-900">₦{order.amount.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{order.rider}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            order.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'in_transit'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">{order.channel}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
