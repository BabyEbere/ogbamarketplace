'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  ShoppingCart, 
  Tag, 
  Sparkles
} from 'lucide-react';
import { Product } from '@/types/marketplace';

interface HeroBannerProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export default function HeroBanner({ products, onAddToCart }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeProducts = products.length > 0 ? products.slice(0, 5) : [];

  useEffect(() => {
    if (isPaused || activeProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeProducts.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, activeProducts.length]);

  if (activeProducts.length === 0) return null;

  const currentProduct = activeProducts[currentIndex] || activeProducts[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? activeProducts.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeProducts.length);
  };

  const discountPercentage = currentProduct.compareAtPrice
    ? Math.round(((currentProduct.compareAtPrice - currentProduct.price) / currentProduct.compareAtPrice) * 100)
    : 0;

  return (
    <section className="hero-section">
      <div className="container">
        <div 
          className="hero-ad-carousel"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Main Content Layout */}
          <div className="ad-carousel-grid">
            {/* Left: Product Image Showcase */}
            <div className="ad-image-container">
              <Link 
                href={`/products/${currentProduct.slug || currentProduct.id}`} 
                className="ad-image-box"
              >
                <Image
                  src={currentProduct.images[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                  alt={currentProduct.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 140px, 400px"
                  style={{ objectFit: 'cover' }}
                />
                {discountPercentage > 0 && (
                  <div className="ad-discount-pill">
                    -{discountPercentage}%
                  </div>
                )}
                <div className="ad-price-pill mobile-hidden">
                  <Tag size={12} />
                  <span>₦{currentProduct.price.toLocaleString()}</span>
                </div>
              </Link>
            </div>

            {/* Right: Product Name, Details & Action */}
            <div className="ad-content-container">
              <div className="ad-badge-row">
                <span className="ad-badge-tag">
                  <Sparkles size={11} />
                  TOP VERIFIED DEAL
                </span>
                {currentProduct.brandName && (
                  <span className="ad-brand-tag">
                    {currentProduct.brandName}
                  </span>
                )}
              </div>

              <Link 
                href={`/products/${currentProduct.slug || currentProduct.id}`} 
                className="ad-title-link"
              >
                <h2 className="ad-product-title">
                  {currentProduct.title}
                </h2>
              </Link>

              <p className="ad-product-description mobile-hidden">
                {currentProduct.description || 'Quality guaranteed local item sourced directly from verified community merchants.'}
              </p>

              <div className="ad-price-details-row">
                <div className="ad-price-stack">
                  <span className="ad-current-price">
                    ₦{currentProduct.price.toLocaleString()}
                  </span>
                  {currentProduct.compareAtPrice && (
                    <span className="ad-old-price">
                      ₦{currentProduct.compareAtPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="ad-actions-stack">
                  <button 
                    className="ad-shop-now-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      onAddToCart(currentProduct);
                    }}
                  >
                    <ShoppingCart size={13} />
                    <span>Shop Now</span>
                  </button>
                </div>
              </div>

              <div className="ad-trust-footer mobile-hidden">
                <span style={{ color: '#A7F3D0', fontSize: '0.74rem' }}>
                  Sold by <strong>{currentProduct.vendorName}</strong> (Verified Merchant)
                </span>
              </div>
            </div>
          </div>

          {/* Carousel Arrows */}
          {activeProducts.length > 1 && (
            <>
              <button 
                className="carousel-arrow carousel-arrow-left" 
                onClick={handlePrev}
                aria-label="Previous Slide"
              >
                <ChevronLeft size={16} />
              </button>
              
              <button 
                className="carousel-arrow carousel-arrow-right" 
                onClick={handleNext}
                aria-label="Next Slide"
              >
                <ChevronRight size={16} />
              </button>

              {/* Pagination Indicators */}
              <div className="carousel-dots-wrap">
                {activeProducts.map((p, idx) => (
                  <button
                    key={p.id}
                    className={`carousel-dot ${currentIndex === idx ? 'active' : ''}`}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
