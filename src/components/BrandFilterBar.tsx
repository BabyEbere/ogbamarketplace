'use client';

import React from 'react';
import { Brand } from '@/types/marketplace';
import { Tag, X, Check } from 'lucide-react';

interface BrandFilterBarProps {
  brands: Brand[];
  selectedBrand: string;
  onSelectBrand: (brandSlug: string) => void;
  categoryName?: string;
  loading?: boolean;
}

export default function BrandFilterBar({
  brands,
  selectedBrand,
  onSelectBrand,
  categoryName,
  loading = false,
}: BrandFilterBarProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto py-2.5 px-1 scrollbar-none">
        <div className="h-9 w-24 bg-slate-100 rounded-full animate-pulse" />
        <div className="h-9 w-28 bg-slate-100 rounded-full animate-pulse" />
        <div className="h-9 w-24 bg-slate-100 rounded-full animate-pulse" />
        <div className="h-9 w-32 bg-slate-100 rounded-full animate-pulse" />
      </div>
    );
  }

  if (!brands || brands.length === 0) {
    return null;
  }

  const activeBrandObj = brands.find((b) => b.slug === selectedBrand);

  return (
    <div className="w-full my-2 p-2 sm:p-3 sm:my-3 bg-white/80 backdrop-blur-xs rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Tag className="w-3.5 h-3.5 text-forest-850" />
          <span className="text-[11px] sm:text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            Filter by Brand {categoryName ? `in ${categoryName}` : ''}
          </span>
        </div>

        {selectedBrand !== 'all' && (
          <button
            onClick={() => onSelectBrand('all')}
            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full transition-colors"
          >
            <span>Clear Filter ({activeBrandObj?.name})</span>
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {/* All Brands Pill */}
        <button
          onClick={() => onSelectBrand('all')}
          className={`shrink-0 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedBrand === 'all'
              ? 'bg-forest-850 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
          }`}
        >
          {selectedBrand === 'all' && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-300" />}
          <span>All Brands ({brands.length})</span>
        </button>

        {/* Brand Chips */}
        {brands.map((brand) => {
          const isSelected = selectedBrand === brand.slug;
          return (
            <button
              key={brand.id}
              onClick={() => onSelectBrand(isSelected ? 'all' : brand.slug)}
              className={`shrink-0 pl-1.5 pr-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-2 border ${
                isSelected
                  ? 'bg-forest-850 text-white border-forest-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {/* Brand Logo or Initial */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center p-0.5 overflow-hidden ${
                  isSelected ? 'bg-white' : 'bg-slate-100'
                }`}
              >
                {brand.logoUrl ? (
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className={`text-[10px] font-black ${isSelected ? 'text-forest-850' : 'text-slate-500'}`}>
                    {brand.name.charAt(0)}
                  </span>
                )}
              </div>

              <span>{brand.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
