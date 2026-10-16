'use client';

import React from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  ShoppingBag,
  Package,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ChevronRight,
  Store,
  Plus,
} from 'lucide-react';

export default function VendorOverviewPage() {
  const storeStats = {
    todaySales: '₦48,500',
    todayOrders: 9,
    pendingOrders: 3,
    walletBalance: '₦145,000',
    totalProducts: 24,
    rating: '4.9 ★ (124 reviews)',
  };

  const incomingOrders = [
    { id: 'ORD-9821', customer: 'Chinedu Eze', items: '2x Egusi Soup & Semo', amount: '₦5,600', status: 'Ready for Pickup', time: '10 mins ago', rider: 'Emeka (Bike 04)' },
    { id: 'ORD-9812', customer: 'Joy N.', items: '1x Fisherman Soup Bowl (Large)', amount: '₦12,000', status: 'Preparing Meal', time: '25 mins ago', rider: 'Assigned (Tari)' },
    { id: 'ORD-9804', customer: 'Emmanuel O.', items: '3x Fried Rice & Chicken', amount: '₦9,000', status: 'Delivered', time: '1 hr ago', rider: 'Lucky (Bike 02)' },
  ];

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Mama Peace Fresh Kitchen"
        subtitle="Manage your live kitchen orders, menu items, and sales earnings in Omoku."
        liveStats={{ label: 'Store Status', value: 'Open & Taking Orders' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Sales</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-forest-850 tracking-tight">{storeStats.todaySales}</span>
              <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <span>{storeStats.todayOrders} orders fulfilled today</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Available Wallet</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{storeStats.walletBalance}</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Ready to withdraw</span>
              <Link href="/vendor/wallet" className="text-forest-850 font-bold hover:underline">
                Withdraw →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Kitchen Orders</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-black text-amber-600 tracking-tight">{storeStats.pendingOrders}</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <span>Awaiting preparation or pickup</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Listed Menu Items</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{storeStats.totalProducts}</span>
              <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-850 flex items-center justify-center font-bold">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <span className="text-emerald-700 font-bold">{storeStats.rating}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Store Quick Desk</h3>
            <div className="space-y-2.5">
              <Link
                href="/vendor/products"
                className="w-full py-3 px-4 rounded-xl bg-forest-850 hover:bg-forest-900 text-white font-bold text-xs flex items-center justify-between transition-colors shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Add New Product / Menu Item</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Link>

              <Link
                href="/vendor/orders"
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-forest-850" />
                  <span>Manage Active Orders ({storeStats.pendingOrders})</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Link>

              <Link
                href="/vendor/wallet"
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-600" />
                  <span>Request Bank Withdrawal</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Incoming Orders Feed */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Incoming Orders</h3>
                <p className="text-xs text-slate-500">Live order tickets for Mama Peace Kitchen</p>
              </div>
              <Link href="/vendor/orders" className="text-xs font-bold text-forest-850 hover:underline">
                View All Orders →
              </Link>
            </div>

            <div className="space-y-3">
              {incomingOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-forest-850 text-sm">{order.id}</span>
                      <span className="text-xs text-slate-500">• {order.customer}</span>
                      <span className="text-xs text-slate-400">({order.time})</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mt-1">{order.items}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Rider: {order.rider}</p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="font-black text-slate-900 text-sm">{order.amount}</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        order.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
