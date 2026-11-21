'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import ProductCard from '@/components/ProductCard';
import { useFavorites } from '@/context/FavoritesContext';

export default function FavoritesPage() {
  const { favorites } = useFavorites();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      <Navbar />

      <main className="container" style={{ flex: 1, padding: '1.5rem 1rem 5rem' }}>
        <Link href="/" style={{ fontSize: '0.8rem', color: 'var(--primary-green)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
          <ArrowLeft size={14} />
          <span>Back to Marketplace</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>Saved Favorites</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Products you saved for quick access ({favorites.length})
            </p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', padding: '3rem 1.5rem', textAlign: 'center', maxWidth: '520px', margin: '1rem auto' }}>
            <div style={{ width: 60, height: 60, borderRadius: '9999px', background: '#FEE2E2', color: '#DC2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Heart size={28} />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.35rem' }}>No saved items yet</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Tap the heart icon on any product card to save it to your favorites list.
            </p>
            <Link
              href="/"
              style={{ display: 'inline-block', background: 'var(--primary-green)', color: '#FFFFFF', padding: '0.7rem 1.4rem', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.86rem' }}
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="products-grid">
            {favorites.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <MobileBottomNav activeTab="favorites" />
    </div>
  );
}

