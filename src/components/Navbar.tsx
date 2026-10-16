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
          <div className="top-bar-vendor-link">
            <Link href="/vendor" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#D1FAE5' }}>
              <Store size={13} />
              <span>Sell on Ogba Marketplace (Vendor Portal)</span>
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
          <div className="header-actions">
            <button className="header-btn header-btn-account" title="Account">
              <User size={18} color="var(--primary-green)" />
              <span className="header-btn-text">Account</span>
              <ChevronDown size={14} color="var(--text-muted)" className="header-btn-chevron" />
            </button>

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
