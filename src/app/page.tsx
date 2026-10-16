'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { 
  Sparkles, 
  Store, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  HelpCircle,
  Check
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import HeroBanner from '@/components/HeroBanner';
import CategoryGrid from '@/components/CategoryGrid';
import DealsSection from '@/components/DealsSection';
import ProductCard from '@/components/ProductCard';
import VendorShowcase from '@/components/VendorShowcase';
import CommunityNoticeBoard from '@/components/CommunityNoticeBoard';
import MobileBottomNav from '@/components/MobileBottomNav';
import AppLoader from '@/components/AppLoader';
import { Product, Brand } from '@/types/marketplace';
import { CATEGORIES } from '@/constants/categories';
import { getProducts } from '@/actions/products';
import { getBrandsByCategoryAction } from '@/actions/brands';
import BrandFilterBar from '@/components/BrandFilterBar';
import { useCart } from '@/context/CartContext';

function HomePageContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [vendorsList, setVendorsList] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [loadingBrands, setLoadingBrands] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [activeMobileTab, setActiveMobileTab] = useState<string>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { addToCart, totalCartCount, openCart } = useCart();

  // Sync params if they change
  useEffect(() => {
    const cat = searchParams.get('category');
    const q = searchParams.get('search');
    if (cat) setSelectedCategory(cat);
    if (q) setSearchQuery(q);
  }, [searchParams]);

  // Load products & vendors directly from database (Supabase)
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [dbProducts, dbVendors] = await Promise.all([
          getProducts(),
          import('@/actions/vendors').then((m) => m.getVendors()).catch(() => []),
        ]);
        setProductsList(dbProducts || []);
        setVendorsList(dbVendors || []);
      } catch (err) {
        console.error('Failed to load live data from Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Load brands associated with the selected category (100% dynamic from DB)
  useEffect(() => {
    async function loadBrands() {
      try {
        setLoadingBrands(true);
        const data = await getBrandsByCategoryAction(selectedCategory);
        setBrandsList(data || []);
      } catch (err) {
        console.error('Failed to load brands:', err);
      } finally {
        setLoadingBrands(false);
      }
    }
    setSelectedBrand('all');
    loadBrands();
  }, [selectedCategory]);

  // Filtered Products by Category AND Brand
  const filteredProducts = useMemo(() => {
    return productsList.filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' || product.categorySlug === selectedCategory;

      const matchesBrand =
        selectedBrand === 'all' ||
        product.brandSlug === selectedBrand ||
        (product.brandName && product.brandName.toLowerCase() === selectedBrand.toLowerCase()) ||
        product.title.toLowerCase().includes(selectedBrand.toLowerCase());

      const matchesSearch =
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.brandName && product.brandName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesBrand && matchesSearch;
    });
  }, [productsList, selectedCategory, selectedBrand, searchQuery]);

  const justArrivedProducts = useMemo(() => {
    return productsList.filter((p) => p.isDealOfDay || p.isFeatured);
  }, [productsList]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    showToast(`Added "${product.title.substring(0, 24)}..." to cart!`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'var(--primary-dark)',
          color: 'white',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-float)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.86rem',
          fontWeight: 600,
          animation: 'fadeIn 0.2s ease',
          border: '1px solid #059669'
        }}>
          <Check size={16} color="#34D399" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={openCart}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main style={{ flex: 1 }}>
        {/* Hero Ad Carousel */}
        {selectedCategory === 'all' && !searchQuery && (
          <HeroBanner products={productsList} onAddToCart={handleAddToCart} />
        )}

        {/* Categories Bar (Directly below Hero on Mobile & Desktop) */}
        <section className="container" style={{ margin: '0.5rem auto 1rem' }}>
          <CategoryGrid
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </section>

        {/* Feature Highlights (Desktop Only) */}
        <section className="container desktop-only" style={{ margin: '1rem auto 1.5rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            background: 'var(--bg-card)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'var(--primary-light)', padding: '0.6rem', borderRadius: 'var(--radius-md)', color: 'var(--primary-green)' }}>
                <Truck size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>Same-Day Dispatch</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Direct across Omoku & Egi</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'var(--primary-light)', padding: '0.6rem', borderRadius: 'var(--radius-md)', color: 'var(--primary-green)' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>Verified KYC Vendors</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Community trusted traders</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'var(--primary-light)', padding: '0.6rem', borderRadius: 'var(--radius-md)', color: 'var(--primary-green)' }}>
                <CreditCard size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>Paystack Escrow</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Funds secure until receipt</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'var(--primary-light)', padding: '0.6rem', borderRadius: 'var(--radius-md)', color: 'var(--primary-green)' }}>
                <HelpCircle size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>Local Support</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Ahia Ogba & Egi desk</div>
              </div>
            </div>
          </div>
        </section>

        {/* Flash Deals / Daily Deals Section */}
        {selectedCategory === 'all' && !searchQuery && (
          <DealsSection products={productsList} onAddToCart={handleAddToCart} />
        )}

        {/* Main Products Grid */}
        <section className="container main-products-section">
          <div className="section-title-wrap">
            <div>
              <h2 className="section-title">
                {selectedCategory === 'all'
                  ? searchQuery
                    ? `Search Results for "${searchQuery}"`
                    : 'Explore All Marketplace Products'
                  : CATEGORIES.find((c) => c.slug === selectedCategory)?.name || 'Category Items'}
              </h2>
              <p className="desktop-only" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Tap on any product to view full specifications, ratings, verified buyer reviews, and merchant stock.
              </p>
            </div>
            <span className="section-item-count" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {filteredProducts.length} items
            </span>
          </div>

          {/* Brand Filter Bar for Selected Category */}
          <BrandFilterBar
            brands={brandsList}
            selectedBrand={selectedBrand}
            onSelectBrand={setSelectedBrand}
            categoryName={
              selectedCategory === 'all'
                ? undefined
                : CATEGORIES.find((c) => c.slug === selectedCategory)?.name
            }
            loading={loadingBrands}
          />

          {loading ? (
            <div style={{ padding: '3rem 0', display: 'flex', justifyContent: 'center' }}>
              <AppLoader message="Loading marketplace catalog..." />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)' }}>
              <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>No products found</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Try clearing filters or search terms</p>
              <button 
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                style={{ background: 'var(--primary-green)', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-full)', fontWeight: 700, cursor: 'pointer' }}
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recommended for You Section */}
        {selectedCategory === 'all' && !searchQuery && (
          <section className="container" style={{ marginTop: '1rem' }}>
            <div className="section-title-wrap">
              <h2 className="section-title">
                <Sparkles size={18} color="var(--primary-green)" />
                <span>Recommended for You</span>
              </h2>
            </div>
            <div className="products-grid">
              {justArrivedProducts.map((product) => (
                <ProductCard
                  key={`rec-${product.id}`}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </section>
        )}

        {/* Vendors and Community Notices Split Section */}
        <section id="vendors" className="container">
          <div className="layout-split-grid">
            <VendorShowcase vendors={vendorsList} />
            <CommunityNoticeBoard />
          </div>
        </section>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeMobileTab}
        onSelectTab={(tab) => {
          setActiveMobileTab(tab);
          if (tab === 'home') setSelectedCategory('all');
          if (tab === 'categories') {
            const el = document.querySelector('.category-icon-cards');
            el?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* SEO-Rich Footer with Interlinking */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div style={{ marginBottom: '1rem', backgroundColor: '#FFFFFF', padding: '6px 12px', borderRadius: '10px', display: 'inline-block' }}>
                <Image
                  src="/logo.png"
                  alt="OGBA MARKET PLACE"
                  width={150}
                  height={38}
                  style={{ objectFit: 'contain', height: 32, width: 'auto' }}
                />
              </div>
              <p style={{ fontSize: '0.82rem', lineHeight: 1.6, maxWidth: '340px', marginBottom: '1rem' }}>
                The official localized marketplace platform for Omoku, Egi, Obrikom, and Erema communities in Rivers State. Connecting local farmers, artisans, and retailers directly to customers.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#6EE7B7' }}>
                <ShieldCheck size={16} />
                <span>Secure Escrow by Paystack & Flutterwave</span>
              </div>
            </div>

            <div>
              <h4 className="footer-title">Browse Categories</h4>
              <ul className="footer-links">
                {CATEGORIES.slice(0, 5).map((cat) => (
                  <li key={cat.id}>
                    <button 
                      onClick={() => {
                        setSelectedCategory(cat.slug);
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                      }}
                      style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', textAlign: 'left', font: 'inherit', padding: 0 }}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="footer-title">Community Zones</h4>
              <ul className="footer-links">
                <li><Link href="#vendors">Omoku Main Market Zone</Link></li>
                <li><Link href="#vendors">Egi & Erema Central Hub</Link></li>
                <li><Link href="#vendors">Obrikom Commercial Axis</Link></li>
                <li><Link href="#vendors">Ahoada Link Route</Link></li>
                <li><Link href="#vendors">Dispatch Riders Network</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-title">Help & Trust</h4>
              <ul className="footer-links">
                <li><Link href="/vendor">Vendor Portal & Store Manager</Link></li>
                <li><Link href="#">How Paystack Escrow Works</Link></li>
                <li><Link href="#">Vendor Verification (KYC)</Link></li>
                <li><Link href="#">Dispatch & Pickup Points</Link></li>
                <li><Link href="#">Contact Community Helpdesk</Link></li>
              </ul>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1F2937', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.78rem' }}>
            <div>
              © {new Date().getFullYear()} OGBA MARKET PLACE. All rights reserved. Built for Ogba & Egi People.
            </div>
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <Link href="#">Privacy Policy</Link>
              <Link href="#">Terms of Service</Link>
              <Link href="#">Sitemap</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AppLoader message="Loading..." /></div>}>
      <HomePageContent />
    </Suspense>
  );
}
