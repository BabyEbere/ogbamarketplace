import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/control-omp/', '/checkout/success/'],
    },
    sitemap: 'https://ogbamarketplace.com/sitemap.xml',
  };
}
