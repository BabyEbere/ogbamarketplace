import type { Metadata } from 'next';
import './globals.css';
import SeoSchema from '@/components/SeoSchema';

export const metadata: Metadata = {
  title: 'OGBA MARKET PLACE | Omoku, Egi & Local Community Commerce',
  description: 'Buy & sell farm produce, cassava garri, palm oil, building materials, electronics and daily groceries directly from verified local merchants in Omoku, Egi, Obrikom & Erema, Rivers State.',
  keywords: [
    'Ogba Marketplace',
    'Omoku Market',
    'Egi Community Marketplace',
    'Rivers State ecommerce',
    'Omoku garri',
    'Egi palm oil',
    'Buy electronics Omoku',
    'Building materials Obrikom',
    'Hyperlocal Nigerian marketplace'
  ],
  authors: [{ name: 'Ogba Marketplace Initiative' }],
  creator: 'Ogba Market Place',
  publisher: 'Ogba Market Place',
  metadataBase: new URL('https://ogbamarketplace.com'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/Favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.png' },
    ],
    shortcut: '/favicon.svg',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'OGBA MARKET PLACE | Local Community Marketplace',
    description: 'Shop fresh local produce, electronics, fashion and building materials with fast same-day delivery across Ogba & Egi.',
    url: 'https://ogbamarketplace.com',
    siteName: 'OGBA MARKET PLACE',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'Ogba Market Place Local Goods',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OGBA MARKET PLACE - Support Local Ogba & Egi Businesses',
    description: 'Fresh farm produce, unadulterated palm oil, garri, electronics & more delivered in Omoku & Egi.',
    images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import Providers from '@/components/Providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <SeoSchema />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
