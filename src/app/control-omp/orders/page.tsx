'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  Search,
  RefreshCw,
} from 'lucide-react';
import { getAdminOrders, updateAdminOrderStatusAction } from '@/actions/admin';
import { AdminOrder } from '@/types/admin';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminOrders();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const res = await updateAdminOrderStatusAction({ orderId, status: newStatus });
    if (res.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as AdminOrder['status'] } : o))
      );
    }
    setUpdatingId(null);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.deliveryArea.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Live Orders & Dispatch Desk"
        subtitle="Manage real-time customer orders, escrow statuses, and dispatch updates."
        liveStats={{ label: 'Total Orders', value: `${orders.length} Orders` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Order Ref, customer, area..."
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
              <option value="paid_in_escrow">Paid in Escrow</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Order Ref & Time</th>
                  <th className="px-5 py-3.5">Customer & Phone</th>
                  <th className="px-5 py-3.5">Zone & Items</th>
                  <th className="px-5 py-3.5">Amount + Fee</th>
                  <th className="px-5 py-3.5">Assigned Rider</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-xs text-slate-500">
                      {loading ? 'Loading orders from database...' : 'No orders found matching your filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-forest-850">{order.reference}</div>
                        <div className="text-xs text-slate-500 font-medium">{order.createdAt}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{order.customerName}</div>
                        <div className="text-xs text-slate-500">{order.customerPhone}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{order.deliveryAddress}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-800">{order.deliveryArea}</div>
                        <div className="text-xs text-slate-500">
                          {order.items.length > 0
                            ? `${order.items.length} item(s)`
                            : 'Order items recorded'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-black text-slate-900">₦{order.totalAmount.toLocaleString()}</div>
                        <div className="text-[11px] text-emerald-700 font-semibold">
                          +₦{order.deliveryFee.toLocaleString()} Deliv.
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">
                        {order.riderName || (
                          <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            order.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'in_transit'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700"
                        >
                          <option value="paid_in_escrow">Paid in Escrow</option>
                          <option value="in_transit">In Transit</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
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
