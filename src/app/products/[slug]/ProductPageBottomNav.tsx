'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MobileBottomNav from '@/components/MobileBottomNav';

export default function ProductPageBottomNav() {
  const router = useRouter();

  const handleSelectTab = (tab: string) => {
    if (tab === 'home') {
      router.push('/');
    } else if (tab === 'categories') {
      router.push('/#categories');
    } else if (tab === 'orders') {
      router.push('/vendor/orders');
    } else if (tab === 'wallet') {
      router.push('/vendor/wallet');
    } else if (tab === 'account') {
      router.push('/vendor');
    }
  };

  return <MobileBottomNav activeTab="home" onSelectTab={handleSelectTab} />;
}
