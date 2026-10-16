'use client';

import React, { useState, useEffect } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Smartphone,
  Globe,
  MoreVertical,
  Mail,
  Phone,
  Shield,
  RefreshCw,
  Download,
  Store,
  ShoppingBag,
  Bike,
  ShieldAlert,
} from 'lucide-react';
import { getAdminUsers, toggleUserStatusAction } from '@/actions/admin';
import { AdminDirectoryUser } from '@/types/admin';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminDirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await getAdminUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load users from DB:', err);
    } finally {
      setLoading(false);
    }
  }

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleToggleStatus = async (user: AdminDirectoryUser) => {
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    setUpdatingId(user.id);

    try {
      const result = await toggleUserStatusAction({
        userId: user.id,
        vendorId: user.vendorId,
        targetStatus: newStatus,
      });

      if (result.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
        );
        showToast(`User "${user.name}" status updated to ${newStatus}.`);
      } else {
        showToast(result.message || 'Failed to update status.');
      }
    } catch (e: any) {
      showToast('Error updating status in database.');
    } finally {
      setUpdatingId(null);
    }
  };

  const exportCSV = () => {
    if (users.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Platform', 'Location', 'Status', 'Orders', 'Joined'];
    const rows = users.map((u) => [
      `"${u.id}"`,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.phone}"`,
      `"${u.role}"`,
      `"${u.platform}"`,
      `"${u.location.replace(/"/g, '""')}"`,
      `"${u.status}"`,
      u.ordersCount,
      `"${u.joined}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ogba_marketplace_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm) ||
      u.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role.toLowerCase() === filterRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const totalRegistered = users.length;
  const buyersCount = users.filter((u) => u.role === 'Buyer').length;
  const vendorsCount = users.filter((u) => u.role === 'Vendor').length;
  const activeCount = users.filter((u) => u.status === 'Active').length;

  return (
    <div className="flex-1 pb-16 bg-slate-50 min-h-screen">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-forest-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-forest-700 animate-in fade-in slide-in-from-top-2">
          <span>{toastMsg}</span>
        </div>
      )}

      <DashboardHeader
        title="Users Directory"
        subtitle="Live registry of all shoppers, verified vendors, and dispatch riders queried directly from Supabase."
        liveStats={{ label: 'Total in DB', value: `${totalRegistered} Users` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Metric Quick Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Users</div>
              <div className="text-xl font-black text-slate-900">{totalRegistered}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Store Merchants</div>
              <div className="text-xl font-black text-slate-900">{vendorsCount}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Shoppers & Buyers</div>
              <div className="text-xl font-black text-slate-900">{buyersCount}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Status</div>
              <div className="text-xl font-black text-slate-900">{activeCount}</div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search live DB by name, phone, area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-800"
            >
              <option value="all">All Roles ({totalRegistered})</option>
              <option value="buyer">Buyers / Shoppers</option>
              <option value="vendor">Vendors & Stores ({vendorsCount})</option>
              <option value="rider">Dispatch Riders</option>
              <option value="admin">Platform Admins</option>
            </select>

            <button
              onClick={loadUsers}
              disabled={loading}
              title="Refresh from Supabase"
              className="p-2 text-slate-500 hover:text-forest-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-forest-800' : ''}`} />
            </button>

            <button
              onClick={exportCSV}
              disabled={users.length === 0}
              className="px-3.5 py-2 bg-forest-850 hover:bg-forest-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">User & Contact</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Platform</th>
                  <th className="px-5 py-3.5">Location / Community</th>
                  <th className="px-5 py-3.5">Orders Activity</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-forest-800" />
                        <span className="text-xs font-semibold">Querying live users from Supabase...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <span className="text-sm font-bold text-slate-700">No users match your filter</span>
                        <span className="text-xs text-slate-400">
                          {searchTerm ? `No records found for "${searchTerm}"` : 'No registered users in the database yet.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full font-black text-sm flex items-center justify-center shrink-0 border ${
                              user.role === 'Admin'
                                ? 'bg-purple-100 text-purple-900 border-purple-200'
                                : user.role === 'Vendor'
                                ? 'bg-amber-100 text-amber-900 border-amber-200'
                                : user.role === 'Rider'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                                : 'bg-forest-100 text-forest-850 border-forest-200'
                            }`}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {user.role === 'Admin' && (
                                <Shield className="w-3.5 h-3.5 text-purple-600 inline" />
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                              <span>{user.email}</span>
                              <span>•</span>
                              <span className="font-semibold text-slate-700">{user.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            user.role === 'Vendor'
                              ? 'bg-amber-100 text-amber-900'
                              : user.role === 'Rider'
                              ? 'bg-emerald-100 text-emerald-900'
                              : user.role === 'Admin'
                              ? 'bg-purple-100 text-purple-900'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        <span className="flex items-center gap-1.5 font-medium">
                          {user.platform === 'Mobile App' ? (
                            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Globe className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          {user.platform}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
                        {user.location}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-slate-900">
                        {user.ordersCount} completed
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            user.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`mailto:${user.email}`}
                            title={`Send email to ${user.email}`}
                            className="p-1.5 text-slate-400 hover:text-forest-800 hover:bg-forest-50 rounded-lg transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                          </a>

                          {user.role !== 'Admin' && (
                            <button
                              disabled={updatingId === user.id}
                              onClick={() => handleToggleStatus(user)}
                              title={user.status === 'Active' ? 'Suspend User in Database' : 'Reactivate User in Database'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                user.status === 'Active'
                                  ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {updatingId === user.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                              ) : user.status === 'Active' ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
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
