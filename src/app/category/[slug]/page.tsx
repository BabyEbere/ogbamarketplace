import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import MobileBottomNav from '@/components/MobileBottomNav';
import { getCategories } from '@/actions/categories';
import { getProducts } from '@/actions/products';
import { CATEGORIES } from '@/constants/categories';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cats = await getCategories().catch(() => CATEGORIES);
  const category = cats.find((c) => c.slug === slug) || CATEGORIES.find((c) => c.slug === slug);

  if (!category) {
    return {
      title: 'Category Not Found | OGBA MARKET PLACE',
    };
  }

  return {
    title: `${category.name} in Omoku & Egi | OGBA MARKET PLACE`,
    description: `Shop ${category.name} directly from verified local vendors in Omoku, Egi, Obrikom & Erema with fast same-day delivery and Paystack escrow protection.`,
    alternates: {
      canonical: `https://ogbamarketplace.com.ng/category/${category.slug}`,
    },
    openGraph: {
      title: `${category.name} | OGBA MARKET PLACE`,
      description: `Browse ${category.name} from trusted local merchants across ONELGA, Rivers State.`,
      url: `https://ogbamarketplace.com.ng/category/${category.slug}`,
      siteName: 'OGBA MARKET PLACE',
      locale: 'en_NG',
      type: 'website',
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const [cats, products] = await Promise.all([
    getCategories().catch(() => CATEGORIES),
    getProducts({ categorySlug: slug }).catch(() => []),
  ]);

  const category = cats.find((c) => c.slug === slug) || CATEGORIES.find((c) => c.slug === slug);
  if (!category) {
    notFound();
  }

  const categoryProducts = products.filter((p) => p.categorySlug === slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} - OGBA MARKET PLACE`,
    url: `https://ogbamarketplace.com.ng/category/${category.slug}`,
    description: `Verified ${category.name} listings from local merchants in Omoku, Egi, Obrikom & Erema.`,
    numberOfItems: categoryProducts.length,
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar selectedCategory={slug} />

      <main className="container" style={{ flex: 1, padding: '1.25rem 1rem 5rem' }}>
        <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          <Link href="/" style={{ color: 'var(--primary-green)', fontWeight: 600 }}>Home</Link>
          <ChevronRight size={13} />
          <span>{category.name}</span>
        </nav>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{category.name}</h1>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {categoryProducts.length} verified items available across Omoku & Egi
            </p>
          </div>
          <Link href="/" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-green)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <ArrowLeft size={14} />
            <span>All Categories</span>
          </Link>
        </div>

        {categoryProducts.length === 0 ? (
          <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', padding: '3rem 1.5rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.35rem' }}>No items in {category.name} yet</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Check back soon or browse other marketplace categories.
            </p>
            <Link href="/" style={{ background: 'var(--primary-green)', color: '#FFFFFF', padding: '0.65rem 1.35rem', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.85rem' }}>
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="products-grid" style={{ marginBottom: '2.5rem' }}>
            {categoryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Interlink Other Categories for SEO & Discovery */}
        <section style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Explore Other Departments</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {cats
              .filter((c) => c.slug !== slug)
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--border-light)',
                    padding: '0.45rem 0.9rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                  }}
                >
                  {c.name}
                </Link>
              ))}
          </div>
        </section>
      </main>

      <MobileBottomNav />
    </div>
  );
}

