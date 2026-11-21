'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  Bike,
  Search,
  RefreshCw,
} from 'lucide-react';
import { getAdminRidersFromDB, AdminRiderRecord } from '@/actions/admin';
import { getActiveCommunitiesAction } from '@/actions/communities';

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<AdminRiderRecord[]>([]);
  const [communities, setCommunities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');

  const loadRiders = useCallback(async () => {
    setLoading(true);
    try {
      const [ridersData, commData] = await Promise.all([
        getAdminRidersFromDB(),
        getActiveCommunitiesAction(),
      ]);
      setRiders(ridersData);
      setCommunities(commData.map((c) => c.name));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRiders();
  }, [loadRiders]);

  const filteredRiders = riders.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.bikeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone.includes(searchTerm);
    const matchesZone = zoneFilter === 'all' || r.zone.toLowerCase().includes(zoneFilter.toLowerCase());
    return matchesSearch && matchesZone;
  });

  const onlineCount = riders.filter((r) => r.status !== 'Offline').length;
  const totalDeliveries = riders.reduce((sum, r) => sum + r.totalDeliveries, 0);
  const totalBalances = riders.reduce((sum, r) => sum + r.balance, 0);
  const avgRating =
    riders.length > 0
      ? (riders.reduce((sum, r) => sum + r.rating, 0) / riders.length).toFixed(1)
      : '0.0';

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Riders & Fleets Dispatch"
        subtitle="Registered dispatch riders, assigned community zones, and delivery metrics."
        liveStats={{ label: 'Riders Online', value: `${onlineCount} On Duty` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Fleet Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fleet On-Duty</span>
            <div className="mt-2 text-3xl font-black text-slate-900">{onlineCount}</div>
            <p className="text-xs text-emerald-700 font-semibold mt-1">{riders.length} total registered</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Deliveries</span>
            <div className="mt-2 text-3xl font-black text-forest-850">{totalDeliveries}</div>
            <p className="text-xs text-slate-500 mt-1">Completed trips across fleet</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Riders Wallet Balances</span>
            <div className="mt-2 text-3xl font-black text-slate-900">₦{totalBalances.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Current unpaid rider earnings</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fleet Avg Rating</span>
            <div className="mt-2 text-3xl font-black text-amber-600">{avgRating} ★</div>
            <p className="text-xs text-slate-500 mt-1">Across {riders.length} rider(s)</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search rider name, phone, bike number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-800 w-full sm:w-auto"
            >
              <option value="all">All Communities</option>
              {communities.map((c) => (
                <option key={c} value={c.toLowerCase()}>
                  {c}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={loadRiders}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Riders Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Rider & Bike</th>
                  <th className="px-5 py-3.5">Contact Phone</th>
                  <th className="px-5 py-3.5">Assigned Zone</th>
                  <th className="px-5 py-3.5">Live Status</th>
                  <th className="px-5 py-3.5">Deliveries</th>
                  <th className="px-5 py-3.5">Balance</th>
                  <th className="px-5 py-3.5">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRiders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-xs text-slate-500">
                      {loading ? 'Loading riders from database...' : 'No riders registered in the database yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredRiders.map((rider) => (
                    <tr key={rider.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-forest-50 text-forest-850 font-bold flex items-center justify-center shrink-0 border border-forest-100">
                            <Bike className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{rider.name}</div>
                            <div className="text-xs text-slate-500 font-medium">{rider.bikeNo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">{rider.phone}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-700 font-semibold">{rider.zone}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${rider.status === 'Available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rider.status === 'In Transit'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                          {rider.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-slate-900">{rider.totalDeliveries} trips</td>
                      <td className="px-5 py-3.5 text-xs font-black text-forest-850">₦{rider.balance.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-xs font-bold text-amber-600">{rider.rating.toFixed(1)} ★</td>
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
