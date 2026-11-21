import React from 'react';
import VendorLayoutClient from '@/components/vendor/VendorLayoutClient';

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
  return <VendorLayoutClient>{children}</VendorLayoutClient>;
}
