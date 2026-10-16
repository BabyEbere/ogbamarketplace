'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export const ADMIN_AUTH_KEY = 'control_omp_auth_session';

export function getAdminSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function logoutAdmin() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    document.cookie = 'control_omp_session=; path=/; max-age=0;';
    window.location.href = '/control-omp/login';
  }
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // If we're on the login page, no guard needed
    if (pathname === '/control-omp/login') {
      setIsAuthenticated(true);
      return;
    }

    const session = getAdminSession();
    if (!session || !session.email) {
      setIsAuthenticated(false);
      router.replace('/control-omp/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  if (pathname === '/control-omp/login') {
    return <>{children}</>;
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-100">Verifying Control-OMP Access</h3>
            <p className="text-xs text-slate-400 mt-1">Checking encrypted supervisor permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
