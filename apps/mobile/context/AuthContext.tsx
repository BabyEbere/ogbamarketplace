import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CacheStorage } from '@/lib/cache';
import { normalizePhoneNumber } from '@/lib/otp';

export interface MobileUser {
  id: string;
  phoneNumber: string;
  fullName: string;
  email?: string;
  role: 'customer' | 'vendor' | 'rider' | 'admin';
  area: string;
  deliveryAddress?: string;
  walletBalance: number;
  isActive: boolean;
}

export interface MobileVendor {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  marketLocation: string;
  area: string;
  kycStatus: 'unsubmitted' | 'pending' | 'verified' | 'rejected';
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  totalSales: number;
}

export interface RegisterParams {
  fullName: string;
  email: string;
  phoneNumber: string;
  community: string;
  deliveryAddress: string;
}

interface AuthContextType {
  user: MobileUser | null;
  vendor: MobileVendor | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  loginWithIdentifier: (identifier: string) => Promise<{ success: boolean; message?: string; user?: MobileUser }>;
  registerWithDetails: (params: RegisterParams) => Promise<{ success: boolean; message?: string }>;
  loginWithOtp: (phoneNumber: string, fullName?: string, area?: string) => Promise<boolean>;
  submitVendorKyc: (kycData: {
    businessName: string;
    marketLocation: string;
    area: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    category?: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_SESSION_KEY = 'ogba_mobile_auth_user';
const VENDOR_SESSION_KEY = 'ogba_mobile_auth_vendor';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [vendor, setVendor] = useState<MobileVendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from cache on app startup
  useEffect(() => {
    async function restoreSession() {
      try {
        const cachedUser = await CacheStorage.get<MobileUser>(USER_SESSION_KEY);
        const cachedVendor = await CacheStorage.get<MobileVendor>(VENDOR_SESSION_KEY);

        if (cachedUser) {
          setUser(cachedUser);
        }
        if (cachedVendor) {
          setVendor(cachedVendor);
        }

        // Revalidate from Supabase in the background
        if (cachedUser) {
          await fetchUserProfile(cachedUser.id, cachedUser.phoneNumber);
        }
      } catch (err) {
        console.warn('Session restoration error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function fetchUserProfile(userId: string, phone: string) {
    try {
      // 1. Fetch User Record
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .or(`id.eq.${userId},phone_number.eq.${phone}`)
        .maybeSingle();

      if (userData) {
        const parsedUser: MobileUser = {
          id: userData.id,
          phoneNumber: userData.phone_number,
          fullName: userData.full_name || 'Community Member',
          email: userData.email,
          role: userData.role || 'customer',
          area: userData.area || 'Omoku',
          deliveryAddress: userData.delivery_address,
          walletBalance: Number(userData.wallet_balance) || 0,
          isActive: userData.is_active ?? true,
        };

        setUser(parsedUser);
        await CacheStorage.set(USER_SESSION_KEY, parsedUser);

        // 2. Fetch Vendor Profile if exists
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', userData.id)
          .maybeSingle();

        if (vendorData) {
          const parsedVendor: MobileVendor = {
            id: vendorData.id,
            userId: vendorData.user_id,
            businessName: vendorData.business_name,
            slug: vendorData.slug,
            marketLocation: vendorData.market_location,
            area: vendorData.area || 'Omoku',
            kycStatus: vendorData.kyc_status || 'pending',
            isVerified: Boolean(vendorData.is_verified),
            rating: Number(vendorData.rating) || 5.0,
            reviewCount: Number(vendorData.review_count) || 0,
            totalSales: Number(vendorData.total_sales) || 0,
          };

          setVendor(parsedVendor);
          await CacheStorage.set(VENDOR_SESSION_KEY, parsedVendor);
        }
      }
    } catch (e) {
      console.warn('Error fetching user profile from database:', e);
    }
  }

  /**
   * Login with either Email address OR Phone number
   */
  async function loginWithIdentifier(identifier: string): Promise<{ success: boolean; message?: string; user?: MobileUser }> {
    try {
      setIsLoading(true);
      const cleaned = identifier.trim();
      const isEmail = cleaned.includes('@');

      let query = supabase.from('users').select('*');
      if (isEmail) {
        query = query.ilike('email', cleaned.toLowerCase());
      } else {
        const normalized = normalizePhoneNumber(cleaned);
        query = query.or(`phone_number.eq.${normalized},phone_number.eq.${cleaned}`);
      }

      const { data: existingUser, error } = await query.maybeSingle();

      if (error) {
        return { success: false, message: error.message };
      }

      if (!existingUser) {
        return {
          success: false,
          message: `No account found with this ${isEmail ? 'email address' : 'phone number'}. Please switch to "New Account" to register.`,
        };
      }

      if (existingUser.is_active === false) {
        return {
          success: false,
          message: 'This account has been deactivated by the admin. Please contact support.',
        };
      }

      const targetUser: MobileUser = {
        id: existingUser.id,
        phoneNumber: existingUser.phone_number,
        fullName: existingUser.full_name || 'Community Member',
        email: existingUser.email,
        role: existingUser.role || 'customer',
        area: existingUser.area || 'Omoku',
        deliveryAddress: existingUser.delivery_address,
        walletBalance: Number(existingUser.wallet_balance) || 0,
        isActive: true,
      };

      setUser(targetUser);
      await CacheStorage.set(USER_SESSION_KEY, targetUser);
      await fetchUserProfile(targetUser.id, targetUser.phoneNumber);

      return { success: true, user: targetUser };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, message: err.message || 'Login failed. Please check your connection.' };
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Register new user with: Full Name, Email, Phone, Community, and Delivery Address
   */
  async function registerWithDetails(params: RegisterParams): Promise<{ success: boolean; message?: string }> {
    try {
      setIsLoading(true);
      const normalizedPhone = normalizePhoneNumber(params.phoneNumber);
      const cleanEmail = params.email.trim().toLowerCase();

      // Check if phone or email already registered
      const { data: existing } = await supabase
        .from('users')
        .select('id, phone_number, email')
        .or(`phone_number.eq.${normalizedPhone},email.eq.${cleanEmail}`)
        .maybeSingle();

      if (existing) {
        if (existing.phone_number === normalizedPhone) {
          return {
            success: false,
            message: 'This phone number is already registered. Please sign in instead.',
          };
        }
        if (existing.email === cleanEmail) {
          return {
            success: false,
            message: 'This email address is already registered. Please sign in instead.',
          };
        }
      }

      // Insert directly into Supabase DB
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          phone_number: normalizedPhone,
          full_name: params.fullName.trim(),
          email: cleanEmail,
          area: params.community.trim(),
          delivery_address: params.deliveryAddress.trim(),
          role: 'customer',
          wallet_balance: 0,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Registration DB insert error:', insertError);
        return {
          success: false,
          message: insertError.message || 'Database error creating your account.',
        };
      }

      const targetUser: MobileUser = {
        id: newUser.id,
        phoneNumber: newUser.phone_number,
        fullName: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        area: newUser.area,
        deliveryAddress: newUser.delivery_address,
        walletBalance: Number(newUser.wallet_balance) || 0,
        isActive: true,
      };

      setUser(targetUser);
      await CacheStorage.set(USER_SESSION_KEY, targetUser);

      return { success: true };
    } catch (err: any) {
      console.error('Registration exception:', err);
      return { success: false, message: err.message || 'Registration failed.' };
    } finally {
      setIsLoading(false);
    }
  }

  // Backward compatible loginWithOtp
  async function loginWithOtp(phoneNumber: string, fullName: string = 'Ogba Community Buyer', area: string = 'Omoku'): Promise<boolean> {
    const res = await loginWithIdentifier(phoneNumber);
    if (res.success) return true;

    // If account doesn't exist, register with defaults
    const regRes = await registerWithDetails({
      fullName,
      email: `${normalizePhoneNumber(phoneNumber)}@ogbamarketplace.com`,
      phoneNumber,
      community: area,
      deliveryAddress: `${area} Central`,
    });
    return regRes.success;
  }

  async function submitVendorKyc(kycData: {
    businessName: string;
    marketLocation: string;
    area: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    category?: string;
  }): Promise<{ success: boolean; message: string }> {
    if (!user) {
      return { success: false, message: 'Please log in to submit your KYC vendor application.' };
    }

    try {
      const slug = kycData.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .upsert(
          {
            user_id: user.id,
            business_name: kycData.businessName,
            slug,
            market_location: kycData.marketLocation,
            area: kycData.area,
            bank_code: kycData.bankName,
            bank_account_number: kycData.bankAccountNumber,
            bank_account_name: kycData.bankAccountName,
            kyc_status: 'pending',
            is_verified: true,
            rating: 5.0,
            review_count: 1,
            total_sales: 0,
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      await supabase.from('users').update({ role: 'vendor' }).eq('id', user.id);

      const updatedUser: MobileUser = { ...user, role: 'vendor' };
      setUser(updatedUser);
      await CacheStorage.set(USER_SESSION_KEY, updatedUser);

      const newVendor: MobileVendor = {
        id: vendorData?.id || 'vnd_' + Date.now(),
        userId: user.id,
        businessName: kycData.businessName,
        slug,
        marketLocation: kycData.marketLocation,
        area: kycData.area,
        kycStatus: 'verified',
        isVerified: true,
        rating: 5.0,
        reviewCount: 1,
        totalSales: 0,
      };

      setVendor(newVendor);
      await CacheStorage.set(VENDOR_SESSION_KEY, newVendor);

      return {
        success: true,
        message: 'Congratulations! Your Store Profile has been created and verified.',
      };
    } catch (err: any) {
      console.error('Vendor KYC submission error:', err);
      return {
        success: false,
        message: err.message || 'Failed to create vendor profile.',
      };
    }
  }

  async function logout() {
    setUser(null);
    setVendor(null);
    await CacheStorage.remove(USER_SESSION_KEY);
    await CacheStorage.remove(VENDOR_SESSION_KEY);
  }

  async function refreshProfile() {
    if (user) {
      await fetchUserProfile(user.id, user.phoneNumber);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        vendor,
        isLoading,
        isLoggedIn: !!user,
        loginWithIdentifier,
        registerWithDetails,
        loginWithOtp,
        submitVendorKyc,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
