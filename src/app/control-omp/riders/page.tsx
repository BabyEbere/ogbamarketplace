'use client';

import React, { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  Bike,
  Search,
  MapPin,
  Phone,
  CheckCircle,
  Clock,
  Activity,
  Award,
  Navigation,
  Shield,
} from 'lucide-react';

export default function AdminRidersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');

  const riders = [
    { id: 'RDR-001', name: 'Emeka Sunday', bikeNo: 'Bike #04 (Bajaj Boxer)', phone: '+234 809 332 8841', zone: 'Omoku Central', status: 'In Transit', currentOrder: 'ORD-9821', todayTrips: 9, totalEarnings: '₦18,500', rating: 4.9 },
    { id: 'RDR-002', name: 'Tari Douglas', bikeNo: 'Bike #11 (TVS HLX)', phone: '+234 812 441 5567', zone: 'Omoku Market & GRA', status: 'Available', currentOrder: 'None', todayTrips: 12, totalEarnings: '₦24,000', rating: 5.0 },
    { id: 'RDR-003', name: 'Lucky Eke', bikeNo: 'Bike #02 (Haojue 125)', phone: '+234 803 991 2284', zone: 'Egi Oil Gate & Obagi', status: 'In Transit', currentOrder: 'ORD-9818', todayTrips: 7, totalEarnings: '₦14,000', rating: 4.8 },
    { id: 'RDR-004', name: 'Uche Kalu', bikeNo: 'Bike #09 (Daylong 110)', phone: '+234 701 553 9081', zone: 'Obrikom Gas Plant', status: 'Available', currentOrder: 'None', todayTrips: 11, totalEarnings: '₦22,000', rating: 4.7 },
    { id: 'RDR-005', name: 'Stanley Jumbo', bikeNo: 'Bike #14 (Bajaj Boxer)', phone: '+234 814 662 1009', zone: 'Erema & Ahoada Link', status: 'Offline', currentOrder: 'None', todayTrips: 4, totalEarnings: '₦8,000', rating: 4.9 },
  ];

  const filteredRiders = riders.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.bikeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone.includes(searchTerm);
    const matchesZone = zoneFilter === 'all' || r.zone.toLowerCase().includes(zoneFilter.toLowerCase());
    return matchesSearch && matchesZone;
  });

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Riders & Fleets Dispatch"
        subtitle="Live GPS tracking, trip dispatching, and performance metrics across local zones."
        liveStats={{ label: 'Riders Active Now', value: '28 On Duty' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Fleet Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fleet On-Duty</span>
            <div className="mt-2 text-3xl font-black text-slate-900">28</div>
            <p className="text-xs text-emerald-700 font-semibold mt-1">Available & In Transit</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Deliveries Completed Today</span>
            <div className="mt-2 text-3xl font-black text-forest-850">142</div>
            <p className="text-xs text-slate-500 mt-1">Avg delivery time: 24 mins</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Riders Total Payout Today</span>
            <div className="mt-2 text-3xl font-black text-slate-900">₦284,000</div>
            <p className="text-xs text-slate-500 mt-1">Direct rider delivery earnings</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer Satisfaction</span>
            <div className="mt-2 text-3xl font-black text-amber-600">4.9 ★</div>
            <p className="text-xs text-slate-500 mt-1">Based on 320 trip ratings</p>
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

          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-800 w-full sm:w-auto"
          >
            <option value="all">All Zones</option>
            <option value="omoku">Omoku Central</option>
            <option value="egi">Egi Oil Gate</option>
            <option value="obrikom">Obrikom</option>
            <option value="erema">Erema</option>
          </select>
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
                  <th className="px-5 py-3.5">Today Trips</th>
                  <th className="px-5 py-3.5">Today Earnings</th>
                  <th className="px-5 py-3.5">Rating</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRiders.map((rider) => (
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
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          rider.status === 'Available'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rider.status === 'In Transit'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rider.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-900">{rider.todayTrips} trips</td>
                    <td className="px-5 py-3.5 text-xs font-black text-forest-850">{rider.totalEarnings}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-amber-600">{rider.rating} ★</td>
                    <td className="px-5 py-3.5 text-right">
                      <button className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-forest-50 hover:text-forest-850 text-xs font-bold text-slate-700 transition-colors">
                        Call / Dispatch
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
