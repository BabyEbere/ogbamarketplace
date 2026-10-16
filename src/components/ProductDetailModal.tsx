'use client';

import React from 'react';
import Image from 'next/image';
import {
  X,
  ShoppingCart,
  CheckCircle,
  MapPin,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { Product } from '@/types/marketplace';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col md:flex-row relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-slate-900 transition-colors"
          aria-label="Close details"
        >
          <X size={18} />
        </button>

        {/* Product Image Section */}
        <div className="relative w-full md:w-1/2 h-64 md:h-auto min-h-[260px] bg-slate-100">
          <Image
            src={product.images[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
            alt={product.title}
            fill
            style={{ objectFit: 'cover' }}
          />
          <div className="absolute bottom-3 left-3 bg-forest-850 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
            {product.categoryName}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 md:w-1/2 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            {/* Vendor Tag */}
            <div className="flex items-center gap-1.5 text-xs text-forest-850 font-bold bg-forest-50 px-2.5 py-1 rounded-lg border border-forest-100 w-fit">
              <ShieldCheck size={14} className="text-forest-850" />
              <span>Sold by: {product.vendorName}</span>
            </div>

            <h2 className="text-lg font-black text-slate-900 leading-snug">
              {product.title}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 text-amber-600 font-bold">
                <Star size={13} fill="currentColor" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-slate-400">({product.reviewCount} verified reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-2xl font-black text-forest-850">
                ₦{product.price.toLocaleString()}
              </span>
              {product.compareAtPrice && (
                <span className="text-sm text-slate-400 line-through font-medium">
                  ₦{product.compareAtPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
              <strong className="block text-slate-800 font-bold mb-1">Product Details:</strong>
              {product.description}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <Truck size={13} className="text-forest-850" />
                <span>Same-day Rider Dispatch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RotateCcw size={13} className="text-forest-850" />
                <span>Verified Local Quality</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-5 mt-4 border-t border-slate-100 flex gap-2">
            <button
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="flex-1 py-3 bg-forest-850 hover:bg-forest-900 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingCart size={16} />
              <span>Add to Cart (₦{product.price.toLocaleString()})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
