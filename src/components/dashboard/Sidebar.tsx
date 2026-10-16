'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Store,
  Bike,
  ShoppingBag,
  Package,
  ShieldCheck,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Wallet,
  Sparkles,
  Tag,
  CheckCircle,
} from 'lucide-react';

import Image from 'next/image';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const adminNavItems: NavItem[] = [
  { name: 'Overview', href: '/control-omp', icon: LayoutDashboard },
  { name: 'Users', href: '/control-omp/users', icon: Users, badge: 'Live' },
  { name: 'Vendors', href: '/control-omp/vendors', icon: Store },
  { name: 'Riders & Fleets', href: '/control-omp/riders', icon: Bike },
  { name: 'Orders Dispatch', href: '/control-omp/orders', icon: ShoppingBag, badge: 'Active' },
  { name: 'Products Catalog', href: '/control-omp/products', icon: Package },
  { name: 'Product Approvals', href: '/control-omp/products/approvals', icon: CheckCircle, badgeColor: 'bg-amber-500' },
  { name: 'Market Categories', href: '/control-omp/categories', icon: Sparkles },
  { name: 'Brands Directory', href: '/control-omp/brands', icon: Tag, badge: 'R2' },
  { name: 'KYC & Verifications', href: '/control-omp/kyc', icon: ShieldCheck, badgeColor: 'bg-amber-500' },
  { name: 'Payouts & Ledger', href: '/control-omp/payouts', icon: CreditCard },
  { name: 'Platform Settings', href: '/control-omp/settings', icon: Settings },
];

const vendorNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/vendor', icon: LayoutDashboard },
  { name: 'Store Orders', href: '/vendor/orders', icon: ShoppingBag, badge: '5 New' },
  { name: 'My Products', href: '/vendor/products', icon: Package },
  { name: 'Earnings & Wallet', href: '/vendor/wallet', icon: Wallet },
  { name: 'KYC Verification', href: '/vendor/kyc', icon: ShieldCheck },
  { name: 'Store Profile', href: '/vendor/settings', icon: Settings },
];

interface SidebarProps {
  role: 'admin' | 'vendor';
  userName?: string;
  storeName?: string;
}

export default function Sidebar({ role, userName = 'Admin Supervisor', storeName }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  useEffect(() => {
    if (role === 'admin') {
      import('@/actions/products').then(({ getPendingProductsCountAction }) => {
        getPendingProductsCountAction().then((count) => setPendingApprovalsCount(count));
      });
    }
  }, [role, pathname]);

  const navItems = role === 'admin'
    ? adminNavItems.map((item) => {
        if (item.href === '/control-omp/products/approvals') {
          return {
            ...item,
            badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} Pending` : undefined,
          };
        }
        return item;
      })
    : vendorNavItems;

  const isActive = (href: string) => {
    if (href === '/control-omp' || href === '/vendor') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-forest-800"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="OGBA MARKET PLACE"
                width={130}
                height={34}
                style={{ objectFit: 'contain', height: 28, width: 'auto' }}
              />
            </Link>
          </div>
        </div>

        <Link
          href="/"
          target="_blank"
          className="text-xs font-semibold text-forest-800 bg-forest-50 px-2.5 py-1.5 rounded-full border border-forest-200 flex items-center gap-1"
        >
          <span>Store</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </header>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="OGBA MARKET PLACE"
              width={160}
              height={42}
              priority
              style={{ objectFit: 'contain', height: 38, width: 'auto' }}
            />
          </Link>

          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status indicator */}
        <div className="px-5 py-2.5 bg-forest-50/70 border-b border-forest-100 flex items-center justify-between text-xs font-semibold text-forest-900">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Omoku Network Online</span>
          </div>
          <span className="text-[11px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">v1.0</span>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            {role === 'admin' ? 'Control & Governance' : 'Store Management'}
          </div>

          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 ${
                  active
                    ? 'bg-forest-850 text-white shadow-sm shadow-forest-900/20'
                    : 'text-slate-700 hover:text-forest-900 hover:bg-forest-50/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      active ? 'text-emerald-300' : 'text-slate-400 group-hover:text-forest-800'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        active
                          ? 'bg-white/20 text-white'
                          : item.badgeColor
                          ? `${item.badgeColor} text-white`
                          : 'bg-forest-100 text-forest-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {active && <ChevronRight className="w-4 h-4 text-emerald-300" />}
                </div>
              </Link>
            );
          })}
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-forest-100 text-forest-850 font-black text-sm flex items-center justify-center shrink-0 border border-forest-200">
                {userName.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 truncate">{userName}</p>
                <p className="text-[10px] font-medium text-emerald-700 truncate">
                  {role === 'admin' ? 'Super Admin' : 'Verified Vendor'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                href="/"
                title="Visit Marketplace"
                className="p-1.5 text-slate-400 hover:text-forest-850 hover:bg-forest-50 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              {role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('control_omp_auth_session');
                      document.cookie = 'control_omp_session=; path=/; max-age=0;';
                      window.location.href = '/control-omp/login';
                    }
                  }}
                  title="Log out of Control-OMP"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
