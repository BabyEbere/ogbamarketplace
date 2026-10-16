'use client';

import React, { useState, useEffect } from 'react';
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
  Lock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { getCurrentVendorProfile, VendorProfileData } from '@/actions/vendors';
import { createClient } from '@/lib/supabase/client';

export default function VendorOverviewPage() {
  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [productsCount, setProductsCount] = useState<number>(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getCurrentVendorProfile();
        setProfile(data);

        if (data?.id) {
          const supabase = createClient();

          // Live product count
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', data.id);
          setProductsCount(count || 0);

          // Live sub-orders / orders for this vendor
          const { data: subOrders } = await supabase
            .from('sub_orders')
            .select('id, order_id, vendor_payout_amount, status, created_at, orders(customer_name, customer_phone, delivery_address)')
            .eq('vendor_id', data.id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (subOrders) {
            setOrders(subOrders);
          }
        }
      } catch (err) {
        console.error('Error loading vendor dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const isApproved = profile?.isApprovedToSell ?? false;
  const isVerified = profile?.isVerified ?? false;

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title={profile ? profile.businessName : 'Merchant Dashboard'}
        subtitle={`Storefront management for ${profile?.marketLocation || 'ONELGA, Rivers State'}`}
        liveStats={{
          label: 'Store Status',
          value: isApproved ? 'Approved to Sell' : 'Pending Approval',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Banner: If store is not approved to sell yet */}
        {!loading && !isApproved && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-amber-900">Store Approval Pending</h4>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Your store is currently under review by the Ogba Marketplace Admin. Once approved, you can start listing products and apply for Tier-2 KYC verification.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-200/70 text-amber-900 border border-amber-300">
                Awaiting Admin Clearance
              </span>
            </div>
          </div>
        )}

        {/* Metric Cards from Live DB */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Sales</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-forest-850 tracking-tight">
                ₦{profile ? profile.totalSales.toLocaleString() : '0'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <span>{profile?.reviewCount || 0} customer reviews</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Available Wallet</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                ₦{profile ? profile.walletBalance.toLocaleString() : '0'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {profile?.accountNumber ? 'Payout Address Set' : 'No Payout Address'}
              </span>
              <Link href="/vendor/wallet" className="text-forest-850 font-bold hover:underline">
                Wallet →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Store Verification</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className={`text-xl sm:text-2xl font-black tracking-tight ${isVerified ? 'text-emerald-700' : 'text-slate-700'}`}>
                {isVerified ? 'Verified' : profile?.kycStatus === 'pending' ? 'Reviewing' : 'Unverified'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs flex items-center justify-between">
              <span className="text-slate-500">{isApproved ? 'Approved to Sell' : 'Pending Approval'}</span>
              <Link href="/vendor/kyc" className="text-forest-850 font-bold hover:underline">
                KYC →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Catalog Items</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{productsCount}</span>
              <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-850 flex items-center justify-center font-bold">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <Link href="/vendor/products" className="text-forest-850 font-bold hover:underline">
                Manage Products →
              </Link>
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
                  <span>Add New Product to Store</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Link>

              <Link
                href="/vendor/wallet"
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-600" />
                  <span>Manage Payout Address & Withdraw</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Link>

              <Link
                href="/vendor/kyc"
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Apply for Tier-2 KYC Verification</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Incoming Orders Feed */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Recent Customer Orders</h3>
                <p className="text-xs text-slate-500">Live order tickets for {profile?.businessName || 'Store'}</p>
              </div>
              <Link href="/vendor/orders" className="text-xs font-bold text-forest-850 hover:underline">
                View All Orders →
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">No customer orders placed yet.</p>
                <p className="text-[11px] text-slate-400">
                  When shoppers place orders for your products, they will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-forest-850 text-sm">#{order.id.substring(0, 8)}</span>
                        <span className="text-xs text-slate-500">• {order.orders?.customer_name || 'Customer'}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-1">
                        Delivery to: {order.orders?.delivery_address || 'Omoku'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className="font-black text-slate-900 text-sm">
                        ₦{Number(order.vendor_payout_amount || 0).toLocaleString()}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {order.status || 'Active'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
