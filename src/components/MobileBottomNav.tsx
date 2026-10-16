'use client';

import React from 'react';
import {
  Compass,
  LayoutGrid,
  ShoppingBag,
  Wallet2,
  CircleUser,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCart?: () => void;
}

export default function MobileBottomNav({
  activeTab,
  onSelectTab,
}: MobileBottomNavProps) {
  const tabs = [
    { id: 'home', label: 'Explore', icon: Compass },
    { id: 'categories', label: 'Categories', icon: LayoutGrid },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'wallet', label: 'Wallet', icon: Wallet2 },
    { id: 'account', label: 'Account', icon: CircleUser },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            className={`nav-bottom-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
            aria-label={tab.label}
          >
            <div className={`nav-icon-bubble ${isActive ? 'active' : ''}`}>
              <Icon
                size={18}
                strokeWidth={isActive ? 2.2 : 1.7}
                className="transition-transform duration-200"
              />
            </div>
            <span className="nav-label-text">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
