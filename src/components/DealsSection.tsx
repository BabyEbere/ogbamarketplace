'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Clock } from 'lucide-react';
import { Product } from '@/types/marketplace';
import ProductCard from './ProductCard';

interface DealsSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export default function DealsSection({ products, onAddToCart }: DealsSectionProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 6, minutes: 42, seconds: 19 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const dealProducts = products.filter((p) => p.isDealOfDay);
  if (dealProducts.length === 0) return null;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <section className="container">
      <div className="deals-container">
        <div className="deals-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: '#DC2626', color: 'white', padding: '6px', borderRadius: '8px', display: 'flex' }}>
              <Flame size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                Deals of the Day
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#92400E' }}>
                Exclusive discounts from Omoku & Egi vendors
              </div>
            </div>
          </div>

          <div className="countdown-box">
            <Clock size={16} />
            <span>Ends in:</span>
            <span className="countdown-digit">{pad(timeLeft.hours)}</span>
            <span>:</span>
            <span className="countdown-digit">{pad(timeLeft.minutes)}</span>
            <span>:</span>
            <span className="countdown-digit">{pad(timeLeft.seconds)}</span>
          </div>
        </div>

        <div className="products-grid" style={{ marginBottom: 0 }}>
          {dealProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} onAddToCart={onAddToCart} />
          ))}
        </div>
      </div>
    </section>
  );
}
