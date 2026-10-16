import { Category } from '@/types/marketplace';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Groceries & Fresh Food', slug: 'groceries-fresh-food', iconName: 'Apple', itemCount: 120, featured: true },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Electronics & Phones', slug: 'electronics-phones', iconName: 'Smartphone', itemCount: 45, featured: true },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Fashion & Wears', slug: 'fashion-wears', iconName: 'Shirt', itemCount: 68, featured: true },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Home & Kitchen', slug: 'home-kitchen', iconName: 'Home', itemCount: 32, featured: true },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Building & Tools', slug: 'building-tools', iconName: 'Wrench', itemCount: 28, featured: true },
  { id: '77777777-7777-7777-7777-777777777777', name: "Mama's Market", slug: 'mamas-market', iconName: 'ShoppingBag', itemCount: 95, featured: true },
];

export const CATEGORIES = DEFAULT_CATEGORIES;
