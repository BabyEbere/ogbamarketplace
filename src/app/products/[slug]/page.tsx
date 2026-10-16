import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { 
  ShieldCheck, 
  Truck, 
  MapPin, 
  Star, 
  CheckCircle, 
  ChevronRight, 
  Store, 
  ArrowLeft
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import ProductClientActions from './ProductClientActions';
import ProductPageBottomNav from './ProductPageBottomNav';
import { getProductBySlug, getSimilarProducts } from '@/actions/products';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);

  if (!product) {
    return {
      title: 'Product Not Found | OGBA MARKET PLACE',
      description: 'The requested product is not available on OGBA MARKET PLACE.',
    };
  }

  const primaryImage = product.images[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80';

  return {
    title: `${product.title} - ₦${product.price.toLocaleString()} | OGBA MARKET PLACE`,
    description: product.description || `Buy ${product.title} from verified merchant ${product.vendorName} in ${product.vendorLocation}. Fast same-day dispatch across Omoku & Egi.`,
    keywords: [
      product.title,
      product.categoryName,
      product.vendorName,
      'Omoku Market',
      'Egi Community Marketplace',
      'Rivers State ecommerce',
      'Local Nigerian goods',
    ],
    alternates: {
      canonical: `https://ogbamarketplace.com/products/${product.slug}`,
    },
    openGraph: {
      title: `${product.title} - ₦${product.price.toLocaleString()}`,
      description: product.description || `Available from ${product.vendorName} with fast delivery in Omoku & Egi.`,
      url: `https://ogbamarketplace.com/products/${product.slug}`,
      images: [
        {
          url: primaryImage,
          width: 800,
          height: 800,
          alt: product.title,
        },
      ],
      siteName: 'OGBA MARKET PLACE',
      locale: 'en_NG',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} | OGBA MARKET PLACE`,
      description: `Shop ${product.title} in Omoku & Egi with Paystack escrow protection.`,
      images: [primaryImage],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);

  if (!product) {
    notFound();
  }

  const similarProducts = await getSimilarProducts(product.categorySlug, product.slug);

  const discountPercentage = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  // JSON-LD Structured Data for Google Indexing & SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images,
    description: product.description,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.vendorName,
    },
    offers: {
      '@type': 'Offer',
      url: `https://ogbamarketplace.com/products/${product.slug}`,
      priceCurrency: 'NGN',
      price: product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: product.vendorName,
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
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
        name: product.categoryName || 'Catalog',
        item: `https://ogbamarketplace.com/?category=${product.categorySlug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.title,
        item: `https://ogbamarketplace.com/products/${product.slug}`,
      },
    ],
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Inject SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Navbar />

      <main className="container" style={{ paddingBottom: '5.5rem', paddingTop: '1rem' }}>
        {/* Breadcrumb Navigation */}
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
          <Link
            href={`/?category=${product.categorySlug}`}
            style={{ color: 'var(--text-subtle)', textDecoration: 'none' }}
          >
            {product.categoryName}
          </Link>
          <ChevronRight size={14} color="var(--border-strong)" />
          <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{product.title}</span>
        </nav>

        {/* Product Details Layout */}
        <div className="product-page-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {/* Left Column: Image Gallery (Strictly Square 300px Container) */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '0.85rem', border: '1px solid var(--border-light)', position: 'relative', maxWidth: '320px', margin: '0 auto', width: '100%' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#F8FAFC' }}>
              <Image
                src={product.images[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                alt={product.title}
                fill
                priority
                sizes="(max-width: 640px) 290px, 320px"
                style={{ objectFit: 'cover' }}
              />
              {discountPercentage > 0 && (
                <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--accent-red)', color: 'white', fontWeight: 800, fontSize: '0.7rem', padding: '0.2rem 0.45rem', borderRadius: 'var(--radius-md)', zIndex: 2 }}>
                  -{discountPercentage}%
                </div>
              )}
            </div>

            {/* Thumbnails if multiple images exist */}
            {product.images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                {product.images.map((img, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '48px',
                      height: '48px',
                      position: 'relative',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: idx === 0 ? '2px solid var(--primary-green)' : '1px solid var(--border-light)',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <Image src={img} alt={`${product.title} preview ${idx + 1}`} fill style={{ objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Information & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '1.15rem 1.25rem', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-green)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {product.categoryName}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  SKU: {product.sku}
                </span>
              </div>

              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.35, marginBottom: '0.5rem' }}>
                {product.title}
              </h1>

              {/* Ratings and Merchant Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', color: '#F59E0B' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={13} fill="currentColor" />
                  ))}
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-main)' }}>{product.rating}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({product.reviewCount})</span>
                <span style={{ marginLeft: 'auto', background: 'var(--primary-light)', color: 'var(--primary-green)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 700 }}>
                  {product.stock > 0 ? `${product.stock} In Stock` : 'Out of Stock'}
                </span>
              </div>

              {/* Merchant's Name + Admin Verification Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                <Store size={14} color="var(--primary-green)" />
                <span>Sold by: <strong style={{ color: 'var(--text-main)' }}>{product.vendorName}</strong></span>
                {product.vendorVerified && (
                  <span 
                    title="Verified Merchant on Ogba Marketplace" 
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.2rem', 
                      background: '#ECFDF5', 
                      color: '#059669', 
                      fontSize: '0.7rem', 
                      fontWeight: 800, 
                      padding: '0.12rem 0.45rem', 
                      borderRadius: '9999px',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <CheckCircle size={11} />
                    <span>Verified</span>
                  </span>
                )}
              </div>

              {/* Price Row */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '1rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--primary-green)' }}>
                  ₦{product.price.toLocaleString()}
                </span>
                {product.compareAtPrice && (
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textDecorationLine: 'line-through' }}>
                    ₦{product.compareAtPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Client Interactive Actions: Quantity + Add to Cart + Buy Now */}
              <ProductClientActions product={product} />
            </div>

            {/* Trust & Guarantee Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.7rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
                <ShieldCheck size={18} color="var(--primary-green)" />
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800 }}>Paystack Escrow</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Protected funds</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.7rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
                <Truck size={18} color="var(--accent-orange)" />
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800 }}>Same-Day Dispatch</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Across Omoku & Egi</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description & Specifications */}
        <section style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '1.15rem 1.25rem', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
            Product Description & Specifications
          </h2>
          <div style={{ color: 'var(--text-subtle)', lineHeight: 1.6, fontSize: '0.86rem', whiteSpace: 'pre-line', marginBottom: '1rem' }}>
            {product.description || 'Authentic local product sourced directly from verified merchants in Omoku, Egi, Obrikom and neighboring communities in Rivers State. Backed by full warranty and same-day delivery.'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Brand</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{product.brandName || 'Verified Brand'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Department</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{product.categoryName}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Condition</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>Brand New / Authentic</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Escrow Protection</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>Protected by Paystack</div>
            </div>
          </div>
        </section>

        {/* Verified Customer Reviews */}
        <section style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '1.15rem 1.25rem', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Verified Customer Reviews
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Real feedback from purchasers in Omoku, Egi and Obrikom
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>Chidubem O.</span>
                  <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', background: 'var(--primary-light)', color: 'var(--primary-green)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                    Verified Buyer
                  </span>
                </div>
                <div style={{ display: 'flex', color: '#F59E0B' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={13} fill="currentColor" />
                  ))}
                </div>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-subtle)', lineHeight: 1.5 }}>
                "Ordered in the morning and received it before 2pm at Ahia Ogba. Quality is 100% original as described."
              </p>
            </div>

            <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>Eberechi W.</span>
                  <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', background: 'var(--primary-light)', color: 'var(--primary-green)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                    Verified Buyer (Egi)
                  </span>
                </div>
                <div style={{ display: 'flex', color: '#F59E0B' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={13} fill="currentColor" />
                  ))}
                </div>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-subtle)', lineHeight: 1.5 }}>
                "Seller is honest and trustworthy. Tested product before payment release. Great service!"
              </p>
            </div>
          </div>
        </section>

        {/* Pro Similar Stocks Section */}
        {similarProducts.length > 0 && (
          <section style={{ marginTop: '2rem' }}>
            <div className="section-title-wrap" style={{ marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--primary-light)', color: 'var(--primary-green)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Similar Stocks & Alternatives
                </div>
                <h2 className="section-title" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  More in {product.categoryName}
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                  Verified inventory available for fast dispatch in Omoku, Egi & Obrikom
                </p>
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--primary-green)', fontWeight: 700 }}>
                {similarProducts.length} items in stock
              </span>
            </div>

            <div className="products-grid">
              {similarProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Floating Mobile Bottom Navigation */}
      <ProductPageBottomNav />
    </div>
  );
}
