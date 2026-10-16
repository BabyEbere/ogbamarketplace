import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  MapPin, 
  Star, 
  CheckCircle, 
  ChevronRight, 
  ArrowLeft,
  ShieldCheck,
  Package
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { getVendorById, getVendorProducts } from '@/actions/products';

interface VendorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: VendorPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const vendor = await getVendorById(resolvedParams.slug);

  if (!vendor) {
    return {
      title: 'Merchant Store | OGBA MARKET PLACE',
      description: 'Verified Merchant Store on OGBA MARKET PLACE.',
    };
  }

  return {
    title: `${vendor.businessName} - Official Store | OGBA MARKET PLACE`,
    description: `Shop genuine products directly from verified merchant ${vendor.businessName} located in ${vendor.marketLocation}. Fast same-day local delivery across Omoku & Egi.`,
    alternates: {
      canonical: `https://ogbamarketplace.com/vendors/${vendor.slug || vendor.id}`,
    },
    openGraph: {
      title: `${vendor.businessName} - Store & Inventory | OGBA MARKET PLACE`,
      description: `Browse verified stocks from ${vendor.businessName} in Omoku & Egi.`,
      url: `https://ogbamarketplace.com/vendors/${vendor.slug || vendor.id}`,
      siteName: 'OGBA MARKET PLACE',
      locale: 'en_NG',
      type: 'website',
    },
  };
}

export default async function VendorStorePage({ params }: VendorPageProps) {
  const resolvedParams = await params;
  const vendor = await getVendorById(resolvedParams.slug);

  if (!vendor) {
    notFound();
  }

  const products = await getVendorProducts(vendor.id || vendor.slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: vendor.businessName,
    description: `Official store of ${vendor.businessName} on OGBA MARKET PLACE in ${vendor.marketLocation}`,
    url: `https://ogbamarketplace.com/vendors/${vendor.slug || vendor.id}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: vendor.marketLocation,
      addressRegion: 'Rivers State',
      addressCountry: 'NG',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: vendor.rating || 4.9,
      reviewCount: vendor.reviewCount || 30,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://ogbamarketplace.com/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Merchants',
        item: 'https://ogbamarketplace.com/#vendors',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: vendor.businessName,
        item: `https://ogbamarketplace.com/vendors/${vendor.slug || vendor.id}`,
      },
    ],
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Navbar />

      <main className="container" style={{ paddingBottom: '4rem', paddingTop: '1.25rem' }}>
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/" style={{ color: 'var(--text-subtle)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <ArrowLeft size={14} /> Home
          </Link>
          <ChevronRight size={14} color="var(--border-strong)" />
          <Link href="/#vendors" style={{ color: 'var(--text-subtle)', textDecoration: 'none' }}>
            Verified Merchants
          </Link>
          <ChevronRight size={14} color="var(--border-strong)" />
          <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{vendor.businessName}</span>
        </nav>

        {/* Vendor Profile Header Card */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          border: '1px solid var(--border-light)',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 900,
                fontSize: '1.8rem',
                boxShadow: '0 6px 16px rgba(5, 150, 105, 0.25)'
              }}>
                {vendor.businessName.charAt(0)}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                    {vendor.businessName}
                  </h1>
                  {vendor.isVerified && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#ECFDF5', color: '#059669', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', fontSize: '0.76rem', fontWeight: 800 }}>
                      <CheckCircle size={13} /> KYC Verified Merchant
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={14} color="var(--primary-green)" />
                    <span>{vendor.marketLocation}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#F59E0B' }}>
                    <Star size={14} fill="currentColor" />
                    <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{vendor.rating}</span>
                    <span style={{ color: 'var(--text-muted)' }}>({vendor.reviewCount} store reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Merchant Guarantee Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'var(--bg-main)',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)'
            }}>
              <ShieldCheck size={28} color="var(--primary-green)" />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-main)' }}>Paystack Escrow Protected</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Funds held safe until you receive items</div>
              </div>
            </div>
          </div>
        </div>

        {/* Vendor Products Section */}
        <section>
          <div className="section-title-wrap">
            <div>
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={20} color="var(--primary-green)" />
                <span>Available Stocks & Products ({products.length})</span>
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                All items in stock at {vendor.businessName} with direct same-day dispatch in Omoku & Egi.
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)' }}>
              <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>No products currently listed</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>This merchant has not added products yet or items are temporarily out of stock.</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
