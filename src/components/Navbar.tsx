'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  MapPin,
  Store,
  ChevronDown,
  Menu,
  X,
  Package,
  LogIn,
  LogOut,
  LayoutGrid,
} from 'lucide-react';
import { Category } from '@/types/marketplace';
import { getCategories } from '@/actions/categories';
import { getActiveCommunitiesAction } from '@/actions/communities';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import { useFavorites } from '@/context/FavoritesContext';
import Image from 'next/image';

const FALLBACK_COMMUNITIES = ['Omoku'];

interface NavbarProps {
  cartCount?: number;
  onOpenCart?: () => void;
  selectedCategory?: string;
  onSelectCategory?: (slug: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function Navbar({
  cartCount: propCartCount,
  onOpenCart: propOnOpenCart,
  selectedCategory = 'all',
  onSelectCategory,
  searchQuery: propSearchQuery = '',
  onSearchChange,
}: NavbarProps) {
  const router = useRouter();
  const { totalCartCount, openCart } = useCart();
  const { user, logout } = useUser();
  const { favoritesCount } = useFavorites();

  const [communities, setCommunities] = useState<string[]>(FALLBACK_COMMUNITIES);
  const [selectedLocation, setSelectedLocation] = useState('Omoku');
  const [localSearch, setLocalSearch] = useState(propSearchQuery);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const cached = sessionStorage.getItem('ogba_cached_categories_v1');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCategoriesList(parsed);
            return;
          }
        }
      } catch {
        // ignore storage errors
      }
      const cats = await getCategories();
      if (cats && cats.length > 0) {
        setCategoriesList(cats);
        try {
          sessionStorage.setItem('ogba_cached_categories_v1', JSON.stringify(cats));
        } catch {
          // ignore storage errors
        }
      }
    }
    loadCategories();

    async function loadCommunities() {
      try {
        const cached = sessionStorage.getItem('ogba_cached_communities_v1');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCommunities(parsed);
            if (!user?.community) setSelectedLocation(parsed[0]);
            return;
          }
        }
      } catch {
        // ignore storage errors
      }
      const list = await getActiveCommunitiesAction();
      if (list && list.length > 0) {
        const names = list.map((c) => c.name);
        setCommunities(names);
        if (!user?.community) setSelectedLocation(names[0]);
        try {
          sessionStorage.setItem('ogba_cached_communities_v1', JSON.stringify(names));
        } catch {
          // ignore storage errors
        }
      }
    }
    loadCommunities();
  }, [user?.community]);

  useEffect(() => {
    if (user?.community) {
      setSelectedLocation(user.community);
    }
  }, [user?.community]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeCartCount = propCartCount !== undefined ? propCartCount : totalCartCount;
  const handleOpenCart = propOnOpenCart || openCart;

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onSearchChange) {
      onSearchChange(localSearch);
    } else {
      router.push(`/?search=${encodeURIComponent(localSearch)}`);
    }
  };

  const handleCategoryClick = (slug: string) => {
    setIsMobileDrawerOpen(false);
    if (onSelectCategory) {
      onSelectCategory(slug);
    } else {
      router.push(slug === 'all' ? '/' : `/?category=${slug}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsAccountMenuOpen(false);
    setIsMobileDrawerOpen(false);
    router.refresh();
  };

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : null;

  return (
    <>
      <header className="site-header">
        {/* Top Banner Bar */}
        <div className="top-bar">
          <div className="container top-bar-inner">
            <div className="top-bar-location">
              <MapPin size={14} color="#6EE7B7" />
              <span>Serving:</span>
              <select
                aria-label="Select community zone"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                style={{
                  background: 'transparent',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 'inherit',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {communities.map((c) => (
                  <option key={c} value={c} style={{ color: '#111827' }}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="top-bar-vendor-link" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link href="/orders" style={{ color: '#D1FAE5', fontSize: '0.75rem', fontWeight: 600 }}>
                Track Orders
              </Link>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>|</span>
              <Link href="/vendor" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#D1FAE5' }}>
                <Store size={13} />
                <span>Vendor Portal</span>
              </Link>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>|</span>
              <Link href="/vendor/register" style={{ color: '#FCD34D', fontWeight: 700, fontSize: '0.75rem', textDecoration: 'none' }}>
                Register Store
              </Link>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="container">
          <div className="header-main">
            {/* Mobile Menu Button */}
            <button
              type="button"
              className="mobile-menu-trigger"
              onClick={() => setIsMobileDrawerOpen(true)}
              aria-label="Open menu and categories"
              title="Menu & Categories"
            >
              <Menu size={18} />
            </button>

            {/* Brand Logo */}
            <Link href="/" className="brand-logo" onClick={() => handleCategoryClick('all')} style={{ display: 'flex', alignItems: 'center' }}>
              <Image
                src="/logo.png"
                alt="OGBA MARKET PLACE"
                width={165}
                height={46}
                priority
                className="brand-logo-img"
                style={{ objectFit: 'contain' }}
              />
            </Link>

            {/* Search Box */}
            <div className="search-box-wrapper">
              <form onSubmit={handleSearchSubmit} className="search-bar">
                <Search size={16} color="var(--text-muted)" className="search-icon-left shrink-0" />
                <input
                  type="text"
                  placeholder="Search products, brands, vendors..."
                  value={onSearchChange ? propSearchQuery : localSearch}
                  onChange={(e) => {
                    setLocalSearch(e.target.value);
                    if (onSearchChange) {
                      onSearchChange(e.target.value);
                    }
                  }}
                />
                {(onSearchChange ? propSearchQuery : localSearch) && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setLocalSearch('');
                      if (onSearchChange) onSearchChange('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      display: 'flex',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
                <button type="submit" className="search-submit-btn" title="Search" aria-label="Search">
                  <Search size={14} />
                </button>
              </form>
            </div>

            {/* Header Action Buttons */}
            <div className="header-actions" style={{ position: 'relative' }}>
              <div ref={accountMenuRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="header-btn header-btn-account"
                  title="Account & Portal"
                  onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                >
                  <User size={18} color="var(--primary-green)" />
                  <span className="header-btn-text">{firstName ? `Hi, ${firstName}` : 'Account'}</span>
                  <ChevronDown size={14} color="var(--text-muted)" className="header-btn-chevron" />
                </button>

                {/* Account Dropdown Menu */}
                {isAccountMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '230px',
                      background: '#FFFFFF',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-light)',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                      zIndex: 1050,
                      padding: '0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    {user ? (
                      <>
                        <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-light)', marginBottom: '0.25rem' }}>
                          <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {user.fullName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {user.phone || user.email}
                          </div>
                        </div>
                        <Link
                          href="/account"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="account-menu-link"
                        >
                          <User size={15} color="var(--primary-green)" />
                          <span>My Account</span>
                        </Link>
                        <Link
                          href="/orders"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="account-menu-link"
                        >
                          <Package size={15} color="var(--primary-green)" />
                          <span>My Orders</span>
                        </Link>
                        <Link
                          href="/favorites"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="account-menu-link"
                        >
                          <Heart size={15} color="#DC2626" />
                          <span>Saved Favorites ({favoritesCount})</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="account-menu-link"
                          style={{ background: 'var(--primary-light)', color: 'var(--primary-green)', fontWeight: 700 }}
                        >
                          <LogIn size={15} />
                          <span>Customer Sign In / Register</span>
                        </Link>
                        <Link
                          href="/orders"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="account-menu-link"
                        >
                          <Package size={15} />
                          <span>Track Orders</span>
                        </Link>
                        <Link
                          href="/favorites"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="account-menu-link"
                        >
                          <Heart size={15} />
                          <span>Saved Favorites ({favoritesCount})</span>
                        </Link>
                      </>
                    )}

                    <div style={{ height: '1px', background: 'var(--border-light)', margin: '0.3rem 0' }} />

                    <Link
                      href="/vendor"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="account-menu-link"
                    >
                      <Store size={15} color="var(--primary-green)" />
                      <span>Vendor Dashboard</span>
                    </Link>

                    <Link
                      href="/vendor/login"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="account-menu-link"
                    >
                      <User size={15} />
                      <span>Vendor Login</span>
                    </Link>

                    <Link
                      href="/vendor/register"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="account-menu-link"
                    >
                      <Store size={15} />
                      <span>Register Store</span>
                    </Link>

                    {user && (
                      <>
                        <div style={{ height: '1px', background: 'var(--border-light)', margin: '0.3rem 0' }} />
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="account-menu-link"
                          style={{ color: '#DC2626', border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                        >
                          <LogOut size={15} />
                          <span>Sign Out</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="header-btn header-btn-fav cart-icon-badge"
                onClick={() => router.push('/favorites')}
                title="Saved Favorites"
                aria-label="Saved Favorites"
              >
                <Heart size={18} color={favoritesCount > 0 ? '#DC2626' : 'var(--text-muted)'} fill={favoritesCount > 0 ? '#FEE2E2' : 'none'} />
                <span className="header-btn-text">Favorites</span>
                {favoritesCount > 0 && (
                  <span className="cart-badge-count" style={{ background: '#DC2626' }}>
                    {favoritesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                className="header-btn header-btn-cart cart-icon-badge"
                onClick={handleOpenCart}
                title="Shopping Cart"
                aria-label="Shopping Cart"
                style={{ background: 'var(--primary-light)', color: 'var(--primary-green)' }}
              >
                <ShoppingCart size={20} />
                <span className="header-btn-text">Cart</span>
                {activeCartCount > 0 && (
                  <span className="cart-badge-count">{activeCartCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Categories Sub Navigation (Desktop) */}
        <div className="category-nav-bar">
          <div className="container category-nav-inner">
            <button
              type="button"
              onClick={() => handleCategoryClick('all')}
              className={`category-nav-link ${selectedCategory === 'all' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              All Categories
            </button>
            {categoriesList.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`category-nav-link ${selectedCategory === cat.slug ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Mobile Navigation & Categories Drawer */}
      {isMobileDrawerOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setIsMobileDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 1100,
            display: 'flex',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '82%',
              maxWidth: '320px',
              height: '100%',
              background: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
            }}
          >
            <div
              style={{
                padding: '1rem',
                background: 'var(--primary-dark)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                  {user ? `Hi, ${user.fullName}` : 'OGBA MARKET PLACE'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#A7F3D0' }}>
                  {user ? user.community : 'Omoku, Egi, Obrikom & Erema'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                aria-label="Close menu"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#FFFFFF',
                  width: '32px',
                  height: '32px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Shopper Quick Links */}
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {user ? (
                <Link href="/account" onClick={() => setIsMobileDrawerOpen(false)} className="account-menu-link">
                  <User size={16} color="var(--primary-green)" />
                  <span>My Account</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="account-menu-link"
                  style={{ background: 'var(--primary-light)', color: 'var(--primary-green)', fontWeight: 700 }}
                >
                  <LogIn size={16} />
                  <span>Sign In / Create Account</span>
                </Link>
              )}
              <Link href="/orders" onClick={() => setIsMobileDrawerOpen(false)} className="account-menu-link">
                <Package size={16} color="var(--primary-green)" />
                <span>My Orders & Tracking</span>
              </Link>
              <Link href="/favorites" onClick={() => setIsMobileDrawerOpen(false)} className="account-menu-link">
                <Heart size={16} color="#DC2626" />
                <span>Saved Favorites ({favoritesCount})</span>
              </Link>
              <Link href="/checkout" onClick={() => setIsMobileDrawerOpen(false)} className="account-menu-link">
                <ShoppingCart size={16} color="var(--primary-green)" />
                <span>Checkout ({activeCartCount})</span>
              </Link>
            </div>

            {/* Browse Categories */}
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <LayoutGrid size={13} />
                <span>Shop Categories</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <button
                  type="button"
                  onClick={() => handleCategoryClick('all')}
                  className="account-menu-link"
                  style={{
                    border: 'none',
                    background: selectedCategory === 'all' ? 'var(--primary-light)' : 'transparent',
                    color: selectedCategory === 'all' ? 'var(--primary-green)' : 'var(--text-main)',
                    fontWeight: selectedCategory === 'all' ? 700 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  All Categories
                </button>
                {categoriesList.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.slug)}
                    className="account-menu-link"
                    style={{
                      border: 'none',
                      background: selectedCategory === cat.slug ? 'var(--primary-light)' : 'transparent',
                      color: selectedCategory === cat.slug ? 'var(--primary-green)' : 'var(--text-main)',
                      fontWeight: selectedCategory === cat.slug ? 700 : 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Vendor Links */}
            <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Sell on Ogba Marketplace
              </div>
              <Link href="/vendor" onClick={() => setIsMobileDrawerOpen(false)} className="account-menu-link">
                <Store size={15} color="var(--primary-green)" />
                <span>Vendor Portal</span>
              </Link>
              <Link href="/vendor/login" onClick={() => setIsMobileDrawerOpen(false)} className="account-menu-link">
                <User size={15} />
                <span>Vendor Sign In</span>
              </Link>
              <Link href="/vendor/register" onClick={() => setIsMobileDrawerOpen(false)} className="account-menu-link">
                <Store size={15} />
                <span>Register Store</span>
              </Link>
              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="account-menu-link"
                  style={{ color: '#DC2626', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', marginTop: '0.4rem' }}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
