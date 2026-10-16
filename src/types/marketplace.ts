export type UserRole = 'customer' | 'vendor' | 'rider' | 'admin';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  avatarUrl?: string;
  address?: string;
  locationArea: 'Omoku' | 'Egi' | 'Obrikom' | 'Erema' | 'Ahoada' | 'Other';
  walletBalance: number;
}

export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  marketLocation: string; // e.g. "Omoku Main Market, Line 4"
  area: 'Omoku' | 'Egi' | 'Obrikom' | 'Erema';
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  avatar: string;
  bannerImage?: string;
  phone: string;
  whatsapp?: string;
  joinedDate: string;
  totalSales: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  websiteUrl?: string;
  description?: string;
  isActive: boolean;
  categoryIds?: string[];
  categories?: { id: string; name: string; slug: string }[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  itemCount: number;
  featured?: boolean;
}

export interface Product {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorLocation: string;
  vendorVerified: boolean;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  categoryId?: string;
  categorySlug: string;
  categoryName: string;
  brandId?: string;
  brandName?: string;
  brandSlug?: string;
  brandLogo?: string;
  images: string[];
  stock: number;
  unit: string; // e.g., "50kg Bag", "Painter Bucket", "Piece", "Kg"
  isDealOfDay?: boolean;
  isFreshProduce?: boolean;
  isJustArrived?: boolean;
  isFeatured?: boolean;
  rating: number;
  reviewCount: number;
  sku: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CommunityNotice {
  id: string;
  title: string;
  date: string;
  category: 'Market Update' | 'Event' | 'Notice' | 'Logistics Notice' | 'Finance';
  excerpt?: string;
  content?: string;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  date: string;
  status: 'successful' | 'pending' | 'failed';
}
