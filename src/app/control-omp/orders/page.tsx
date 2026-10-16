'use client';

import React, { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Bike,
  Phone,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export default function AdminOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const orders = [
    { id: 'ORD-9821', customer: 'Chinedu Eze', phone: '+234 803 219 4432', vendor: 'Mama Peace Kitchen', items: '2x Egusi Soup & Semo', amount: '₦5,600', deliveryFee: '₦1,000', rider: 'Emeka (Bike 04)', address: '12 Ahia Ogba Street, Omoku', status: 'In Transit', time: '10:42 AM', paymentMethod: 'Card / Online' },
    { id: 'ORD-9820', customer: 'Blessing Jumbo', phone: '+234 902 443 1290', vendor: 'De-Kings Farm Fresh', items: '1x Live Local Fowl + Snails', amount: '₦18,500', deliveryFee: '₦1,500', rider: 'Tari (Bike 11)', address: 'Opposite Total Gas, Erema Rd', status: 'Delivered', time: '10:25 AM', paymentMethod: 'Bank Transfer' },
    { id: 'ORD-9819', customer: 'Engr. Nnamdi', phone: '+234 701 992 0012', vendor: 'Ogba Prime Electronics', items: '1x 20,000mAh Powerbank', amount: '₦14,000', deliveryFee: '₦1,200', rider: 'Unassigned', address: 'GRA Phase 2, Near Police Station', status: 'Pending Assignment', time: '10:14 AM', paymentMethod: 'Card / Online' },
    { id: 'ORD-9818', customer: 'Ifeoma Clark', phone: '+234 802 771 9902', vendor: 'Sweet Tooth Bakery', items: 'Custom Birthday Cake', amount: '₦22,000', deliveryFee: '₦1,200', rider: 'Lucky (Bike 02)', address: 'Ahoada Road, Omoku', status: 'In Transit', time: '09:55 AM', paymentMethod: 'Card / Online' },
    { id: 'ORD-9817', customer: 'Dr. Kelechi', phone: '+234 805 334 1120', vendor: 'Obrikom Mega Pharmacy', items: 'Essential First Aid & Vitamins', amount: '₦9,800', deliveryFee: '₦1,500', rider: 'Uche (Bike 09)', address: 'Obrikom Doctors Quarters', status: 'Delivered', time: '09:30 AM', paymentMethod: 'Bank Transfer' },
    { id: 'ORD-9816', customer: 'Sampson W.', phone: '+234 811 002 9931', vendor: 'Erema Palm Oil Mills', items: '2x 25L Red Palm Oil Kegs', amount: '₦58,000', deliveryFee: '₦2,500', rider: 'Stanley (Bike 14)', address: 'Commercial Ave, Omoku', status: 'Delivered', time: '08:50 AM', paymentMethod: 'Bank Transfer' },
  ];

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || o.status.toLowerCase().replace(' ', '-') === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Live Orders & Dispatch Desk"
        subtitle="Manage end-to-end order fulfillments, vendor kitchen dispatches, and rider assignments."
        liveStats={{ label: 'Active Today', value: '186 Orders' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Order ID, customer, vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-800"
            >
              <option value="all">All Statuses</option>
              <option value="pending-assignment">Pending Dispatch</option>
              <option value="in-transit">In Transit</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Order ID & Time</th>
                  <th className="px-5 py-3.5">Customer & Phone</th>
                  <th className="px-5 py-3.5">Vendor & Items</th>
                  <th className="px-5 py-3.5">Amount + Fee</th>
                  <th className="px-5 py-3.5">Assigned Rider</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-forest-850">{order.id}</div>
                      <div className="text-xs text-slate-500 font-medium">{order.time}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{order.customer}</div>
                      <div className="text-xs text-slate-500">{order.phone}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{order.address}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{order.vendor}</div>
                      <div className="text-xs text-slate-500">{order.items}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-black text-slate-900">{order.amount}</div>
                      <div className="text-[11px] text-emerald-700 font-semibold">+{order.deliveryFee} Deliv.</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">
                      {order.rider === 'Unassigned' ? (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                          Assign Rider
                        </span>
                      ) : (
                        order.rider
                      )}
                    </td>
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
                    <td className="px-5 py-3.5 text-right">
                      <button className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-forest-50 hover:text-forest-850 text-xs font-bold text-slate-700 transition-colors">
                        View Details
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
