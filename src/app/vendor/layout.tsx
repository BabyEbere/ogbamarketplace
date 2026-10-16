import React from 'react';
import Sidebar from '@/components/dashboard/Sidebar';

export const metadata = {
  title: 'Merchant Center | OGBA Marketplace Vendor',
  description: 'Manage your store, products, orders, and earnings on Ogba Marketplace.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-body text-slate-800 antialiased">
      <Sidebar role="vendor" userName="Mama Peace Kitchen" storeName="Mama Peace Kitchen" />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
