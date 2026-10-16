import { MetadataRoute } from 'next';
import { getCategories } from '@/actions/categories';
import { getProducts } from '@/actions/products';
import { getVendors } from '@/actions/vendors';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ogbamarketplace.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/deals`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/vendors`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/notices`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  try {
    const [categories, products, vendors] = await Promise.all([
      getCategories().catch(() => []),
      getProducts().catch(() => []),
      getVendors().catch(() => []),
    ]);

    const categoryRoutes: MetadataRoute.Sitemap = (categories || []).map((cat) => ({
      url: `${baseUrl}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    }));

    const productRoutes: MetadataRoute.Sitemap = (products || []).map((prod) => ({
      url: `${baseUrl}/products/${prod.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    const vendorRoutes: MetadataRoute.Sitemap = (vendors || []).map((v) => ({
      url: `${baseUrl}/vendors/${v.slug || v.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...vendorRoutes];
  } catch (err) {
    return staticRoutes;
  }
}
