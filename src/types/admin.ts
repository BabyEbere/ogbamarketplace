import { UserRole } from './marketplace';

export type DevicePlatform = 'web' | 'android_app' | 'ios_app';

export interface LivePresenceUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  platform: 'Web' | 'Android App' | 'iOS App';
  locationArea: string;
  lastActive: string;
  status: 'online' | 'idle';
}

export interface PlatformAnalytics {
  activeNow: {
    total: number;
    customers: number;
    vendors: number;
    riders: number;
  };
  activeToday: {
    total: number;
    customers: number;
    vendors: number;
    riders: number;
  };
  appVsWeb: {
    webUsers: number;
    androidAppUsers: number;
    iosAppUsers: number;
    webPercentage: number;
    appPercentage: number;
  };
  financials: {
    grossVolumeToday: number;
    platformCommissionToday: number; // 7.5%
    escrowHeldBalance: number;
    payoutsPending: number;
    totalOrdersToday: number;
  };
  recentPresence: LivePresenceUser[];
}

export interface AdminOrder {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryArea: string;
  totalAmount: number;
  subtotalAmount: number;
  deliveryFee: number;
  platformFee: number;
  status: 'paid_in_escrow' | 'vendor_accepted' | 'ready_for_pickup' | 'rider_assigned' | 'in_transit' | 'delivered' | 'disputed' | 'cancelled';
  paymentStatus: 'successful' | 'pending' | 'refunded';
  riderName?: string;
  riderPhone?: string;
  createdAt: string;
  items: {
    title: string;
    quantity: number;
    price: number;
    vendorName: string;
  }[];
}

export interface AdminVendorKYC {
  id: string;
  userId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  marketLocation: string;
  area: 'Omoku' | 'Egi' | 'Obrikom' | 'Erema';
  bankName: string;
  bankAccountNumber: string;
  status: 'pending' | 'verified' | 'rejected';
  submittedAt: string;
  productsCount: number;
  totalSales: number;
  rating: number;
}

export interface AdminDirectoryUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Buyer' | 'Vendor' | 'Rider' | 'Admin';
  platform: 'Mobile App' | 'Web Browser';
  location: string;
  status: 'Active' | 'Suspended';
  ordersCount: number;
  joined: string;
  vendorId?: string;
}

