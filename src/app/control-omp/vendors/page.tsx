'use client';

import React, { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  Store,
  Search,
  CheckCircle,
  Clock,
  Ban,
  DollarSign,
  Package,
  TrendingUp,
  MapPin,
  Sparkles,
} from 'lucide-react';

export default function AdminVendorsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const vendors = [
    { id: 'VND-001', name: 'Mama Peace Fresh Kitchen', owner: 'Peace Okoro', category: 'Food & Cooked Meals', location: 'Omoku Market Rd', productsCount: 24, totalRevenue: '₦3,450,000', commissionPaid: '₦172,500', kycStatus: 'Verified', status: 'Open', rating: '4.9 (124 reviews)' },
    { id: 'VND-002', name: 'De-Kings Farm Fresh Livestock', owner: 'Kingsley O.', category: 'Agro & Live Animals', location: 'Obagi / Egi Junction', productsCount: 16, totalRevenue: '₦5,200,000', commissionPaid: '₦260,000', kycStatus: 'Verified', status: 'Open', rating: '4.8 (89 reviews)' },
    { id: 'VND-003', name: 'Ogba Prime Electronics & Phones', owner: 'Emeka Prime', category: 'Gadgets & Power', location: 'Omoku GRA Bypass', productsCount: 42, totalRevenue: '₦8,100,000', commissionPaid: '₦405,000', kycStatus: 'Verified', status: 'Open', rating: '4.7 (210 reviews)' },
    { id: 'VND-004', name: 'Sweet Tooth Bakery & Treats', owner: 'Ifeoma Clark', category: 'Cakes & Bakery', location: 'Ahoada Road', productsCount: 18, totalRevenue: '₦2,300,000', commissionPaid: '₦115,000', kycStatus: 'Verified', status: 'Open', rating: '4.9 (54 reviews)' },
    { id: 'VND-005', name: 'Obrikom Mega Pharmacy', owner: 'Pharm. Kalu', category: 'Health & Pharmacy', location: 'Gas Plant Gate, Obrikom', productsCount: 88, totalRevenue: '₦4,600,000', commissionPaid: '₦230,000', kycStatus: 'Verified', status: 'Open', rating: '5.0 (310 reviews)' },
    { id: 'VND-006', name: 'Erema Palm Oil Mills', owner: 'Chief Nwosu', category: 'Wholesale Farm Produce', location: 'Erema Village Square', productsCount: 8, totalRevenue: '₦1,900,000', commissionPaid: '₦95,000', kycStatus: 'Pending Review', status: 'Under Review', rating: 'New' },
  ];

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Vendors & Merchants HQ"
        subtitle="Review vendor storefronts, commissions, catalog sizes, and merchant verifications."
        liveStats={{ label: 'Active Stores Now', value: '62 Open' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Top Vendor Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Registered Stores</span>
            <div className="mt-2 text-3xl font-black text-slate-900">118</div>
            <p className="text-xs text-slate-500 mt-1">Across 8 ONELGA districts</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Platform Commission Earned</span>
            <div className="mt-2 text-3xl font-black text-forest-850">₦1,272,500</div>
            <p className="text-xs text-emerald-700 font-semibold mt-1">5% flat merchant commission rate</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Verification</span>
            <div className="mt-2 text-3xl font-black text-amber-600">2 Stores</div>
            <p className="text-xs text-slate-500 mt-1">Submitted documents waiting for check</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search store name, category, owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
            />
          </div>
        </div>

        {/* Vendors Grid / Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Store / Vendor</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Products</th>
                  <th className="px-5 py-3.5">Total Sales</th>
                  <th className="px-5 py-3.5">5% Fee Paid</th>
                  <th className="px-5 py-3.5">KYC Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-forest-850 text-white font-black text-sm flex items-center justify-center shrink-0">
                          {vendor.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {vendor.name}
                            {vendor.kycStatus === 'Verified' && (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-medium">Owner: {vendor.owner}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{vendor.category}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{vendor.location}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-900">{vendor.productsCount} items</td>
                    <td className="px-5 py-3.5 text-xs font-black text-forest-850">{vendor.totalRevenue}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-emerald-700">{vendor.commissionPaid}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          vendor.kycStatus === 'Verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {vendor.kycStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-forest-50 hover:text-forest-850 text-xs font-bold text-slate-700 transition-colors">
                        Manage
                      </button>
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
