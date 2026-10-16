'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Star, Check } from 'lucide-react';
import { Product } from '@/types/marketplace';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart, onSelectProduct }: ProductCardProps) {
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const discountPercentage = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addToCart(product, 1);
    }
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <Link
      href={`/products/${product.slug || product.id}`}
      className="product-card group"
      style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
      onClick={() => {
        if (onSelectProduct) {
          onSelectProduct(product);
        }
      }}
    >
      <div className="product-image-wrapper relative">
        <Image
          src={product.images[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          style={{ objectFit: 'cover' }}
          className="group-hover:scale-105 transition-transform duration-300"
        />
        {discountPercentage > 0 && (
          <div className="product-badge-discount">
            -{discountPercentage}%
          </div>
        )}
      </div>

      <div className="product-details" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {product.brandName && (
          <span className="product-brand-tag">
            {product.brandName}
          </span>
        )}

        <h3 className="product-title" title={product.title}>
          {product.title}
        </h3>

        <div className="product-rating-row">
          <Star size={11} fill="currentColor" className="product-rating-star" />
          <span className="product-rating-value">{product.rating.toFixed(1)}</span>
          <span className="product-rating-count">({product.reviewCount})</span>
        </div>

        <div className="product-price-row">
          <span className="product-price-current">
            ₦{product.price.toLocaleString()}
          </span>
          {product.compareAtPrice && (
            <span className="product-price-old">
              ₦{product.compareAtPrice.toLocaleString()}
            </span>
          )}
        </div>

        <button
          className="add-cart-btn"
          onClick={handleAdd}
          style={{
            background: justAdded ? '#059669' : undefined,
            transition: 'all 0.2s ease',
          }}
        >
          {justAdded ? (
            <>
              <Check size={13} />
              <span>Added!</span>
            </>
          ) : (
            <>
              <ShoppingCart size={13} />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </Link>
  );
}
