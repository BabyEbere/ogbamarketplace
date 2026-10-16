'use client';

import React, { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  ShoppingBag,
  Search,
  CheckCircle,
  Clock,
  Bike,
  Phone,
  ChefHat,
} from 'lucide-react';

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState([
    { id: 'ORD-9821', customer: 'Chinedu Eze', phone: '+234 803 219 4432', items: '2x Egusi Soup & Semo', amount: '₦5,600', status: 'Ready for Pickup', time: '10:42 AM', rider: 'Emeka (Bike 04)' },
    { id: 'ORD-9812', customer: 'Joy N.', phone: '+234 814 990 1120', items: '1x Fisherman Soup Bowl (Large)', amount: '₦12,000', status: 'Preparing Meal', time: '10:15 AM', rider: 'Assigned (Tari)' },
    { id: 'ORD-9804', customer: 'Emmanuel O.', phone: '+234 809 554 3211', items: '3x Fried Rice & Chicken', amount: '₦9,000', status: 'Delivered', time: '09:30 AM', rider: 'Lucky (Bike 02)' },
    { id: 'ORD-9799', customer: 'Dr. Kelechi', phone: '+234 805 334 1120', items: '1x Ofe Ogba Pot + Plantain', amount: '₦7,500', status: 'Delivered', time: '08:45 AM', rider: 'Uche (Bike 09)' },
  ]);

  const updateStatus = (id: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
  };

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Store Orders & Kitchen Queue"
        subtitle="Manage incoming meal and grocery orders, update kitchen preparation stages, and hand off to riders."
        liveStats={{ label: 'Pending Kitchen Orders', value: '2 Orders' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Order ID & Time</th>
                  <th className="px-5 py-3.5">Customer & Contact</th>
                  <th className="px-5 py-3.5">Items Ordered</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Rider</th>
                  <th className="px-5 py-3.5">Current Status</th>
                  <th className="px-5 py-3.5 text-right">Kitchen Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-forest-850">{order.id}</div>
                      <div className="text-xs text-slate-500">{order.time}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{order.customer}</div>
                      <div className="text-xs text-slate-500">{order.phone}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">{order.items}</td>
                    <td className="px-5 py-3.5 font-black text-slate-900">{order.amount}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">{order.rider}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          order.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'Ready for Pickup'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {order.status === 'Preparing Meal' && (
                        <button
                          onClick={() => updateStatus(order.id, 'Ready for Pickup')}
                          className="px-3 py-1.5 rounded-lg bg-forest-850 hover:bg-forest-900 text-white text-xs font-bold transition-colors"
                        >
                          Mark Ready for Rider
                        </button>
                      )}
                      {order.status === 'Ready for Pickup' && (
                        <span className="text-xs text-blue-700 font-bold">Waiting for Rider</span>
                      )}
                      {order.status === 'Delivered' && (
                        <span className="text-xs text-slate-400 font-medium">Completed</span>
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
