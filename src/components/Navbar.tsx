'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Heart, 
  MapPin, 
  Mic, 
  Store, 
  ChevronDown 
} from 'lucide-react';
import { Category } from '@/types/marketplace';
import { getCategories } from '@/actions/categories';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';

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
  const [selectedLocation, setSelectedLocation] = useState('Omoku Central');
  const [localSearch, setLocalSearch] = useState(propSearchQuery);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      const cats = await getCategories();
      if (cats && cats.length > 0) {
        setCategoriesList(cats);
      }
    }
    loadCategories();
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
    if (onSelectCategory) {
      onSelectCategory(slug);
    } else {
      router.push(`/?category=${slug}`);
    }
  };

  return (
    <header className="site-header">
      {/* Top Banner Bar */}
      <div className="top-bar">
        <div className="container top-bar-inner">
          <div className="top-bar-location">
            <MapPin size={14} color="#6EE7B7" />
            <span>Serving: <strong>{selectedLocation}</strong>, Egi, Obrikom & Erema Communities</span>
          </div>
          <div className="top-bar-vendor-link" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link href="/vendor" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#D1FAE5' }}>
              <Store size={13} />
              <span>Vendor Portal</span>
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>|</span>
            <Link href="/vendor/login" style={{ color: '#A7F3D0', fontWeight: 600, fontSize: '0.75rem', textDecoration: 'none' }}>
              Vendor Sign In
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
                placeholder="Search products..."
                value={onSearchChange ? propSearchQuery : localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  if (onSearchChange) {
                    onSearchChange(e.target.value);
                  }
                }}
              />
              <button 
                type="button" 
                title="Voice Search"
                className="search-mic-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', color: 'var(--text-muted)' }}
              >
                <Mic size={15} />
              </button>
              <button type="submit" className="search-submit-btn" title="Search">
                <Search size={14} />
              </button>
            </form>
          </div>

          {/* Header Action Buttons */}
          <div className="header-actions" style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <button 
                className="header-btn header-btn-account" 
                title="Account & Merchant Portal"
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              >
                <User size={18} color="var(--primary-green)" />
                <span className="header-btn-text">Account</span>
                <ChevronDown size={14} color="var(--text-muted)" className="header-btn-chevron" />
              </button>

              {/* Account Dropdown Menu */}
              {isAccountMenuOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '210px',
                    background: '#FFFFFF',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-light)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                    zIndex: 1050,
                    padding: '0.4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <Link
                    href="/vendor"
                    onClick={() => setIsAccountMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 0.75rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      textDecoration: 'none',
                      borderRadius: 'var(--radius-md)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-main)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Store size={15} color="var(--primary-green)" />
                    <span>Vendor Dashboard</span>
                  </Link>

                  <Link
                    href="/vendor/login"
                    onClick={() => setIsAccountMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 0.75rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--text-subtle)',
                      textDecoration: 'none',
                      borderRadius: 'var(--radius-md)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-main)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <User size={15} />
                    <span>Vendor Login</span>
                  </Link>

                  <Link
                    href="/vendor/register"
                    onClick={() => setIsAccountMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 0.75rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--text-subtle)',
                      textDecoration: 'none',
                      borderRadius: 'var(--radius-md)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-main)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Store size={15} />
                    <span>Register Store</span>
                  </Link>
                </div>
              )}
            </div>

            <button className="header-btn header-btn-fav" title="Favorites" aria-label="Favorites">
              <Heart size={18} color="var(--text-muted)" />
              <span className="header-btn-text">Favorites</span>
            </button>

            <button 
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

      {/* Categories Sub Navigation */}
      <div className="category-nav-bar">
        <div className="container category-nav-inner">
          <button
            onClick={() => handleCategoryClick('all')}
            className={`category-nav-link ${selectedCategory === 'all' ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            All Categories
          </button>
          {categoriesList.map((cat) => (
            <button
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
  );
}
