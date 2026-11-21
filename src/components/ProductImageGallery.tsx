'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface ProductImageGalleryProps {
  images: string[];
  title: string;
  discountPercentage?: number;
}

export default function ProductImageGallery({
  images,
  title,
  discountPercentage = 0,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const validImages = images && images.length > 0 
    ? images 
    : ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'];

  const currentImage = validImages[selectedIndex] || validImages[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div 
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        padding: '0.85rem',
        border: '1px solid var(--border-light)',
        position: 'relative',
        maxWidth: '340px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Main Square Stage */}
      <div 
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: '#F8FAFC',
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
        }}
        className="group"
      >
        <Image
          src={currentImage}
          alt={`${title} - view ${selectedIndex + 1}`}
          fill
          priority
          sizes="(max-width: 640px) 300px, 340px"
          style={{ objectFit: 'contain', padding: '6px' }}
          className="transition-transform duration-300 group-hover:scale-105"
        />

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div 
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: 'var(--accent-red)',
              color: 'white',
              fontWeight: 800,
              fontSize: '0.7rem',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-md)',
              zIndex: 2,
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
          >
            -{discountPercentage}%
          </div>
        )}

        {/* Image Counter Badge */}
        {validImages.length > 1 && (
          <div 
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              color: '#FFFFFF',
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              zIndex: 2,
            }}
          >
            {selectedIndex + 1} / {validImages.length}
          </div>
        )}

        {/* Navigation Arrows for Multiple Images */}
        {validImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              style={{
                position: 'absolute',
                top: '50%',
                left: 6,
                transform: 'translateY(-50%)',
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1E293B',
                cursor: 'pointer',
                zIndex: 3,
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              style={{
                position: 'absolute',
                top: '50%',
                right: 6,
                transform: 'translateY(-50%)',
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1E293B',
                cursor: 'pointer',
                zIndex: 3,
              }}
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Strip */}
      {validImages.length > 1 && (
        <div 
          style={{
            display: 'flex',
            gap: '0.45rem',
            marginTop: '0.75rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem',
            scrollbarWidth: 'thin',
          }}
        >
          {validImages.map((img, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                aria-label={`Select photo ${idx + 1}`}
                style={{
                  width: '46px',
                  height: '46px',
                  position: 'relative',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: isSelected 
                    ? '2px solid var(--primary-green)' 
                    : '1px solid var(--border-light)',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  flexShrink: 0,
                  opacity: isSelected ? 1 : 0.65,
                  transform: isSelected ? 'scale(1.02)' : 'none',
                  transition: 'all 0.15s ease',
                  padding: 0,
                }}
              >
                <Image
                  src={img}
                  alt={`${title} thumbnail ${idx + 1}`}
                  fill
                  sizes="46px"
                  style={{ objectFit: 'contain', padding: '2px' }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
