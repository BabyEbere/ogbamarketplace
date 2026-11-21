'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import { getCurrentVendorProfile, logoutVendorWebAction, VendorProfileData } from '@/actions/vendors';
import { Store, RefreshCw, LogOut } from 'lucide-react';

interface VendorLayoutClientProps {
  children: React.ReactNode;
}

export default function VendorLayoutClient({ children }: VendorLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === '/vendor/login' || pathname === '/vendor/register';

  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [loading, setLoading] = useState(!isAuthPage);

  useEffect(() => {
    if (isAuthPage) {
      setLoading(false);
      return;
    }

    async function checkAuth() {
      try {
        setLoading(true);
        const data = await getCurrentVendorProfile();
        if (!data) {
          router.replace('/vendor/login');
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error('Vendor auth verification failed:', err);
        router.replace('/vendor/login');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [pathname, isAuthPage, router]);

  // Auth pages (login / register) render standalone without dashboard sidebar
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-forest-850 flex items-center justify-center text-white shadow-lg">
            <Store className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-slate-100">Verifying Merchant Access</h3>
          <p className="text-xs text-slate-400">Loading your store dashboard...</p>
          <RefreshCw className="w-4 h-4 text-forest-500 animate-spin mt-2" />
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-body text-slate-800 antialiased">
      <Sidebar
        role="vendor"
        userName={profile.ownerName || 'Store Owner'}
        storeName={profile.businessName || 'Verified Storefront'}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
