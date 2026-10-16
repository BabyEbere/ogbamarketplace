import React from 'react';
import { DEFAULT_CATEGORIES } from '@/constants/categories';

export default function SeoSchema() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'OnlineStore',
        '@id': 'https://ogbamarketplace.com/#store',
        name: 'OGBA MARKET PLACE',
        description: 'Hyper-local e-commerce marketplace connecting verified farmers, traders, and artisans in Ogba and Egi communities in Rivers State, Nigeria.',
        url: 'https://ogbamarketplace.com',
        areaServed: [
          {
            '@type': 'Place',
            name: 'Omoku, Rivers State, Nigeria'
          },
          {
            '@type': 'Place',
            name: 'Egi Community, Rivers State, Nigeria'
          },
          {
            '@type': 'Place',
            name: 'Obrikom, Rivers State, Nigeria'
          },
          {
            '@type': 'Place',
            name: 'Erema, Rivers State, Nigeria'
          }
        ],
        currenciesAccepted: 'NGN',
        paymentAccepted: 'Cash, Credit Card, Bank Transfer, USSD, Paystack, Flutterwave'
      },
      {
        '@type': 'ItemList',
        name: 'Featured Local Categories on Ogba Marketplace',
        itemListElement: DEFAULT_CATEGORIES.map((cat, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: cat.name,
          url: `https://ogbamarketplace.com/category/${cat.slug}`
        }))
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
