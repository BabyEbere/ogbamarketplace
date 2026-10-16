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

      <main className="container" style={{ paddingBottom: '4rem', paddingTop: '1.25rem' }}>
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
        <div className="product-page-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
          {/* Left Column: Image Gallery */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', border: '1px solid var(--border-light)', position: 'relative' }}>
            <div style={{ position: 'relative', width: '100%', height: '380px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#F1F5F9' }}>
              <Image
                src={product.images[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'}
                alt={product.title}
                fill
                priority
                style={{ objectFit: 'cover' }}
              />
              {discountPercentage > 0 && (
                <div style={{ position: 'absolute', top: 12, left: 12, background: 'var(--accent-red)', color: 'white', fontWeight: 800, fontSize: '0.78rem', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
                  -{discountPercentage}% OFF
                </div>
              )}
            </div>

            {/* Thumbnails if multiple images exist */}
            {product.images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {product.images.map((img, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '60px',
                      height: '60px',
                      position: 'relative',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: idx === 0 ? '2px solid var(--primary-green)' : '1px solid var(--border-light)',
                      cursor: 'pointer',
                    }}
                  >
                    <Image src={img} alt={`${product.title} preview ${idx + 1}`} fill style={{ objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Information & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '1.5rem', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {product.categoryName}
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  SKU: {product.sku}
                </span>
              </div>

              <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.3, marginBottom: '0.75rem' }}>
                {product.title}
              </h1>

              {/* Ratings and Merchant Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#F59E0B' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={15} fill="currentColor" />
                  ))}
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)' }}>{product.rating}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({product.reviewCount} verified reviews)</span>
                <span style={{ marginLeft: 'auto', background: 'var(--primary-light)', color: 'var(--primary-green)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.74rem', fontWeight: 700 }}>
                  {product.stock > 0 ? `${product.stock} In Stock` : 'Out of Stock'}
                </span>
              </div>

              {/* Just Merchant's Name (No Profile Card or Address) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                <Store size={15} color="var(--primary-green)" />
                <span>Sold by: <strong style={{ color: 'var(--text-main)' }}>{product.vendorName}</strong></span>
              </div>

              {/* Price Row (Without Unit) */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--primary-green)' }}>
                  ₦{product.price.toLocaleString()}
                </span>
                {product.compareAtPrice && (
                  <span style={{ fontSize: '1.05rem', color: 'var(--text-muted)', textDecorationLine: 'line-through' }}>
                    ₦{product.compareAtPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Client Interactive Actions: Quantity + Add to Cart + Buy Now */}
              <ProductClientActions product={product} />
            </div>

            {/* Trust & Guarantee Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--bg-card)', padding: '0.85rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
                <ShieldCheck size={20} color="var(--primary-green)" />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800 }}>Paystack Escrow</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Funds safe until delivery</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--bg-card)', padding: '0.85rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
                <Truck size={20} color="var(--accent-orange)" />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800 }}>Same-Day Dispatch</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Direct across Omoku & Egi</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description & Specifications */}
        <section style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '1.75rem', border: '1px solid var(--border-light)', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
            Product Description & Specifications
          </h2>
          <div style={{ color: 'var(--text-subtle)', lineHeight: 1.7, fontSize: '0.92rem', whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
            {product.description || 'Authentic local product sourced directly from verified merchants in Omoku, Egi, Obrikom and neighboring communities in Rivers State. Backed by full warranty and same-day delivery.'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Brand</div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>{product.brandName || 'Verified Brand'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Department</div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>{product.categoryName}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Condition</div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>Brand New / Authentic</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Escrow Protection</div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>Protected by Paystack</div>
            </div>
          </div>
        </section>

        {/* Verified Customer Reviews */}
        <section style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '1.75rem', border: '1px solid var(--border-light)', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Verified Customer Reviews
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
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
    </div>
  );
}
