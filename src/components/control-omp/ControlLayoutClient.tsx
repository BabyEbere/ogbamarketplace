'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import AdminAuthGuard, { getAdminSession } from './AdminAuthGuard';

export default function ControlLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/control-omp/login';
  const [adminName, setAdminName] = useState('Emmanuel Oreke (Super Admin)');

  useEffect(() => {
    const session = getAdminSession();
    if (session && session.name) {
      setAdminName(session.name);
    }
  }, [pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-body text-slate-800 antialiased">
        <Sidebar role="admin" userName={adminName} />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </main>
      </div>
    </AdminAuthGuard>
  );
}
