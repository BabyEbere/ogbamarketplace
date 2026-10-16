'use client';

import React from 'react';
import Image from 'next/image';
import { Star, CheckCircle, MapPin, ExternalLink } from 'lucide-react';
import { Vendor } from '@/types/marketplace';

interface VendorShowcaseProps {
  vendors: Vendor[];
}

export default function VendorShowcase({ vendors }: VendorShowcaseProps) {
  return (
    <div className="widget-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          Top Rated Local Vendors
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--primary-green)', fontWeight: 700, cursor: 'pointer' }}>
          Explore
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {vendors.map((vendor) => (
          <a
            key={vendor.id}
            href={`/vendors/${vendor.slug || vendor.id}`}
            className="vendor-item-row"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{ position: 'relative', width: 44, height: 44 }}>
              <Image
                src={vendor.avatar}
                alt={vendor.businessName}
                fill
                sizes="44px"
                className="vendor-avatar"
              />
            </div>
            <div className="vendor-info-box">
              <div className="vendor-name-title">
                <span>{vendor.businessName}</span>
                {vendor.isVerified && (
                  <CheckCircle size={14} color="var(--primary-green)" />
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <MapPin size={11} color="var(--primary-green)" />
                  {vendor.marketLocation}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                  <Star size={11} fill="currentColor" />
                  {vendor.rating.toFixed(1)}
                </span>
              </div>
            </div>
            <div 
              style={{ background: 'var(--primary-light)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-green)' }}
              title="Visit Store"
            >
              <ExternalLink size={13} />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
