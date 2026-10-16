import React from 'react';
import ControlLayoutClient from '@/components/control-omp/ControlLayoutClient';

export const metadata = {
  title: 'Control Center | OGBA Marketplace Administration',
  description: 'Executive admin dashboard for managing users, vendors, riders, and platform commerce.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ControlLayoutClient>{children}</ControlLayoutClient>;
}
