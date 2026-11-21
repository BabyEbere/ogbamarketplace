'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Compass,
  LayoutGrid,
  ShoppingBag,
  Heart,
  CircleUser,
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useFavorites } from '@/context/FavoritesContext';

interface MobileBottomNavProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenCart?: () => void;
}

export default function MobileBottomNav({
  activeTab: propActiveTab,
  onSelectTab,
}: MobileBottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const { favoritesCount } = useFavorites();

  const derivedActiveTab =
    propActiveTab ||
    (pathname.startsWith('/orders')
      ? 'orders'
      : pathname.startsWith('/favorites')
      ? 'favorites'
      : pathname.startsWith('/account') || pathname.startsWith('/login')
      ? 'account'
      : 'home');

  const tabs = [
    { id: 'home', label: 'Explore', icon: Compass },
    { id: 'categories', label: 'Categories', icon: LayoutGrid },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'favorites', label: 'Saved', icon: Heart, badge: favoritesCount },
    { id: 'account', label: user ? 'Account' : 'Sign In', icon: CircleUser },
  ];

  const handleTabClick = (tabId: string) => {
    if (onSelectTab) {
      onSelectTab(tabId);
    }

    if (tabId === 'home') {
      if (pathname !== '/') {
        router.push('/');
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (tabId === 'categories') {
      if (pathname !== '/') {
        router.push('/#categories');
      } else {
        const el = document.querySelector('.category-icon-cards');
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (tabId === 'orders') {
      router.push('/orders');
    } else if (tabId === 'favorites') {
      router.push('/favorites');
    } else if (tabId === 'account') {
      router.push(user ? '/account' : '/login');
    }
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = derivedActiveTab === tab.id;

        return (
          <button
            type="button"
            key={tab.id}
            className={`nav-bottom-item ${isActive ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
            aria-label={tab.label}
          >
            <div className={`nav-icon-bubble ${isActive ? 'active' : ''}`} style={{ position: 'relative' }}>
              <Icon
                size={18}
                strokeWidth={isActive ? 2.2 : 1.7}
                className="transition-transform duration-200"
              />
              {tab.badge && tab.badge > 0 ? (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-2px',
                    background: '#DC2626',
                    color: '#FFFFFF',
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    minWidth: '14px',
                    height: '14px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid #FFFFFF',
                  }}
                >
                  {tab.badge}
                </span>
              ) : null}
            </div>
            <span className="nav-label-text">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
