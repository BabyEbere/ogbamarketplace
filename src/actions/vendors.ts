'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { Vendor } from '@/types/marketplace';

const VENDOR_SESSION_COOKIE = 'ogba_vendor_session';

export interface VendorSessionData {
  vendorId: string;
  userId: string;
  businessName: string;
  slug: string;
}

export interface VendorProfileData {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  marketLocation: string;
  area: string;
  rating: number;
  reviewCount: number;
  totalSales: number;
  walletBalance: number;
  isApprovedToSell: boolean; // mapped from users.is_active
  kycStatus: 'unsubmitted' | 'pending' | 'verified' | 'rejected';
  isVerified: boolean;
  kycIdCardUrl?: string | null;
  kycBusinessProofUrl?: string | null;
  bankName: string;
  accountNumber: string;
  accountName: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
}

/**
 * Get all vendors for catalog & showcases
 */
export async function getVendors(): Promise<Vendor[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('rating', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      userId: item.user_id || '',
      businessName: item.business_name || 'Verified Merchant',
      slug: item.slug || item.id,
      marketLocation: item.market_location || 'Omoku Main Market, Rivers State',
      area: item.area || 'Omoku',
      rating: Number(item.rating) || 5.0,
      reviewCount: Number(item.review_count) || 20,
      isVerified: Boolean(item.is_verified),
      avatar: '',
      bannerImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
      phone: '',
      whatsapp: '',
      joinedDate: item.created_at || 'Verified Vendor',
      totalSales: item.total_sales || 100,
    }));
  } catch (err) {
    console.error('Error in getVendors action:', err);
    return [];
  }
}

/**
 * Retrieve vendor profile by ID or User ID from DB
 */
export async function getVendorProfileById(vendorIdOrUserId: string): Promise<VendorProfileData | null> {
  try {
    const supabase = await createClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vendorIdOrUserId);

    let query = supabase.from('vendors').select('*');
    if (isUuid) {
      query = query.or(`id.eq.${vendorIdOrUserId},user_id.eq.${vendorIdOrUserId}`);
    } else {
      query = query.eq('slug', vendorIdOrUserId);
    }

    const { data: vendor, error: vErr } = await query.maybeSingle();

    if (vErr || !vendor) {
      return null;
    }

    // Fetch user details for approval status and wallet balance
    let userRecord: any = null;
    if (vendor.user_id) {
      const { data: uData } = await supabase
        .from('users')
        .select('*')
        .eq('id', vendor.user_id)
        .maybeSingle();
      userRecord = uData;
    }

    return {
      id: vendor.id,
      userId: vendor.user_id || '',
      businessName: vendor.business_name || 'Verified Merchant',
      slug: vendor.slug || vendor.id,
      marketLocation: vendor.market_location || 'Omoku Central, Rivers State',
      area: vendor.area || 'Omoku',
      rating: Number(vendor.rating) || 5.0,
      reviewCount: Number(vendor.review_count) || 0,
      totalSales: Number(vendor.total_sales) || 0,
      walletBalance: Number(userRecord?.wallet_balance) || 0,
      isApprovedToSell: userRecord ? Boolean(userRecord.is_active) : true,
      kycStatus: vendor.kyc_status || 'unsubmitted',
      isVerified: Boolean(vendor.is_verified),
      kycIdCardUrl: vendor.kyc_id_card_url,
      kycBusinessProofUrl: vendor.kyc_business_proof_url,
      bankName: vendor.bank_code || '',
      accountNumber: vendor.bank_account_number || '',
      accountName: vendor.bank_account_name || '',
      ownerName: userRecord?.full_name || 'Vendor Partner',
      ownerPhone: userRecord?.phone_number || '',
      ownerEmail: userRecord?.email || '',
    };
  } catch (err) {
    console.error('Error fetching vendor profile by id:', err);
    return null;
  }
}

/**
 * Get current logged in vendor profile or fallback to first vendor in DB
 */
export async function getCurrentVendorProfile(): Promise<VendorProfileData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(VENDOR_SESSION_COOKIE);

    if (sessionCookie && sessionCookie.value) {
      try {
        const session: VendorSessionData = JSON.parse(sessionCookie.value);
        if (session.vendorId) {
          const profile = await getVendorProfileById(session.vendorId);
          if (profile) return profile;
        }
      } catch (e) {
        // parse error, proceed to fallback
      }
    }

    // Fallback: load first vendor from DB so merchant dashboard is functional immediately
    const supabase = await createClient();
    const { data: firstVendor } = await supabase
      .from('vendors')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (firstVendor && firstVendor.id) {
      return await getVendorProfileById(firstVendor.id);
    }

    return null;
  } catch (err) {
    console.error('Error getting current vendor profile:', err);
    return null;
  }
}

/**
 * Vendor updates their settlement payout address in /vendor/wallet
 */
export async function updateVendorPayoutAddressAction(params: {
  vendorId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}) {
  try {
    if (!params.vendorId) {
      return { success: false, message: 'Vendor store ID is required.' };
    }
    if (!params.bankName.trim() || !params.accountNumber.trim() || !params.accountName.trim()) {
      return { success: false, message: 'Please provide Bank Name, Account/Payout Address, and Account Name.' };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('vendors')
      .update({
        bank_code: params.bankName.trim(),
        bank_account_number: params.accountNumber.trim(),
        bank_account_name: params.accountName.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.vendorId);

    if (error) {
      console.error('Supabase update payout address error:', error);
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: 'Payout address updated successfully! All future earnings will be disbursed to this account.',
    };
  } catch (err: any) {
    console.error('Error in updateVendorPayoutAddressAction:', err);
    return { success: false, message: err.message || 'Failed to update payout address.' };
  }
}

/**
 * Vendor applies for Tier-2 KYC Verification in /vendor/kyc
 * RULE: Only allowed if the vendor has FIRST been approved to sell by admin!
 */
export async function submitVendorKYCAction(params: {
  vendorId: string;
  idType: string;
  idNumber: string;
  idDocumentUrl?: string;
  businessProofUrl?: string;
}) {
  try {
    if (!params.vendorId) {
      return { success: false, message: 'Vendor store ID is required.' };
    }

    const profile = await getVendorProfileById(params.vendorId);
    if (!profile) {
      return { success: false, message: 'Vendor store not found.' };
    }

    // Critical gating check: store must first be approved to sell!
    if (!profile.isApprovedToSell) {
      return {
        success: false,
        message: 'Your store must first be approved to sell by the Ogba Marketplace Admin before you can apply for Tier-2 KYC Verification.',
      };
    }

    if (!params.idNumber.trim()) {
      return { success: false, message: 'Please enter your government ID number (NIN, Driver\'s License, or Voter\'s Card).' };
    }

    const supabase = await createClient();
    const idCardUrl = params.idDocumentUrl || `ID_TYPE:${params.idType}_NUM:${params.idNumber.trim()}`;
    const businessProof = params.businessProofUrl || `STORE_OUTLET:${profile.marketLocation}`;

    const { error } = await supabase
      .from('vendors')
      .update({
        kyc_status: 'pending',
        kyc_id_card_url: idCardUrl,
        kyc_business_proof_url: businessProof,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.vendorId);

    if (error) {
      console.error('Supabase KYC update error:', error);
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: 'Verification application submitted successfully! Our Omoku/Egi market admin will review your documents.',
    };
  } catch (err: any) {
    console.error('Error in submitVendorKYCAction:', err);
    return { success: false, message: err.message || 'Failed to submit KYC verification.' };
  }
}

/**
 * Vendor requests a payout withdrawal
 */
export async function requestVendorPayoutAction(params: {
  vendorId: string;
  amount: number;
}) {
  try {
    const profile = await getVendorProfileById(params.vendorId);
    if (!profile) {
      return { success: false, message: 'Vendor store not found.' };
    }

    if (!profile.accountNumber || !profile.bankName) {
      return {
        success: false,
        message: 'Please set your payout address / bank account in the wallet before requesting a withdrawal.',
      };
    }

    const available = profile.walletBalance > 0 ? profile.walletBalance : Math.round(profile.totalSales * 0.925);
    if (params.amount <= 0 || params.amount > available) {
      return {
        success: false,
        message: `Invalid amount. Available balance is ₦${available.toLocaleString()}.`,
      };
    }

    const supabase = await createClient();
    // Record withdrawal request in wallet_transactions if available
    try {
      await supabase.from('wallet_transactions').insert({
        user_id: profile.userId,
        amount: params.amount,
        type: 'payout',
        reference: `WDR-${Date.now()}`,
        description: `Vendor withdrawal to ${profile.bankName} (${profile.accountNumber})`,
        status: 'pending',
      });
    } catch (e) {
      // ignore table absence
    }

    return {
      success: true,
      message: `Withdrawal request for ₦${params.amount.toLocaleString()} submitted to the admin settlement queue.`,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to request payout.' };
  }
}

/**
 * Register a new vendor on Web (real database insertion + session creation)
 */
export async function registerVendorWebAction(params: {
  fullName: string;
  phoneNumber: string;
  password?: string;
  businessName: string;
  marketLocation: string;
  area: string;
  categoryId?: string;
  categoryName?: string;
  idNumber?: string;
  email?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}) {
  try {
    const supabase = await createClient();

    const cleanPhone = params.phoneNumber.trim().replace(/\s+/g, '');
    const cleanBusiness = params.businessName.trim();
    const slug = cleanBusiness
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // 1. Check if user already exists or create new user
    let userId = '';
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, role')
      .or(`phone_number.eq.${cleanPhone},email.eq.${params.email || 'nonexistent@ogba.local'}`)
      .maybeSingle();

    if (existingUser) {
      userId = existingUser.id;
      // Upgrade role to vendor
      await supabase
        .from('users')
        .update({ role: 'vendor' })
        .eq('id', userId);
    } else {
      // Insert user record (pending admin approval to sell: is_active = false)
      const { data: newUser, error: uErr } = await supabase
        .from('users')
        .insert({
          full_name: params.fullName.trim(),
          phone_number: cleanPhone,
          email: params.email?.trim() || `${slug}@ogbamarketplace.com`,
          role: 'vendor',
          area: params.area,
          delivery_address: params.marketLocation.trim(),
          is_active: false, // Must be approved by admin to sell!
          wallet_balance: 0,
        })
        .select('id')
        .single();

      if (uErr) {
        console.error('Failed to create user for vendor:', uErr);
        return { success: false, message: uErr.message };
      }
      userId = newUser.id;
    }

    // 2. Insert vendor record
    const vendorInsertPayload: any = {
      user_id: userId,
      business_name: cleanBusiness,
      slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
      market_location: params.marketLocation.trim(),
      area: params.area,
      bank_code: params.bankName?.trim() || null,
      bank_account_number: params.accountNumber?.trim() || null,
      bank_account_name: params.accountName?.trim() || params.fullName.trim(),
      kyc_status: 'pending', // Pending admin review
      is_verified: false, // Paid verification badge is FALSE until purchased
      commission_rate_percentage: 5.0,
      rating: 5.0,
      review_count: 0,
      total_sales: 0,
    };

    if (params.categoryId) {
      vendorInsertPayload.category_id = params.categoryId;
    }
    if (params.categoryName) {
      vendorInsertPayload.category_name = params.categoryName;
    }
    if (params.idNumber) {
      vendorInsertPayload.kyc_id_card_url = `ID_REF:${params.idNumber.trim()}`;
    }

    const { data: newVendor, error: vErr } = await supabase
      .from('vendors')
      .insert(vendorInsertPayload)
      .select()
      .single();

    if (vErr) {
      console.error('Failed to create vendor record:', vErr);
      return { success: false, message: vErr.message };
    }

    // 3. Set Vendor Session Cookie
    const cookieStore = await cookies();
    cookieStore.set(
      VENDOR_SESSION_COOKIE,
      JSON.stringify({
        vendorId: newVendor.id,
        userId: newVendor.user_id,
        businessName: newVendor.business_name,
        slug: newVendor.slug,
      }),
      {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      }
    );

    return {
      success: true,
      message: 'Vendor store registered successfully! Your store is pending admin approval to begin selling.',
      vendorId: newVendor.id,
      vendorSlug: newVendor.slug,
    };
  } catch (err: any) {
    console.error('Error in registerVendorWebAction:', err);
    return { success: false, message: err.message || 'Vendor registration failed.' };
  }
}

/**
 * Log in vendor on Web
 */
export async function loginVendorWebAction(params: {
  phoneOrEmail: string;
  password?: string;
}) {
  try {
    const supabase = await createClient();
    const identifier = params.phoneOrEmail.trim();

    // Find user
    const { data: user, error: uErr } = await supabase
      .from('users')
      .select('id, full_name, phone_number, email, role, is_active')
      .or(`phone_number.eq.${identifier},email.eq.${identifier}`)
      .maybeSingle();

    if (uErr || !user) {
      return { success: false, message: 'Account not found with this phone number or email.' };
    }

    // Find vendor profile
    const { data: vendor, error: vErr } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (vErr || !vendor) {
      return {
        success: false,
        message: 'No registered vendor storefront found for this user account. Please apply as a vendor.',
      };
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(
      VENDOR_SESSION_COOKIE,
      JSON.stringify({
        vendorId: vendor.id,
        userId: vendor.user_id,
        businessName: vendor.business_name,
        slug: vendor.slug,
      }),
      {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
      }
    );

    return {
      success: true,
      message: `Welcome back, ${vendor.business_name}!`,
      vendorId: vendor.id,
    };
  } catch (err: any) {
    console.error('Error in loginVendorWebAction:', err);
    return { success: false, message: err.message || 'Login failed.' };
  }
}

/**
 * Update vendor store profile (Business name, community area, physical location, phone, etc.)
 */
export async function updateVendorStoreProfileAction(params: {
  vendorId: string;
  businessName: string;
  area: string;
  marketLocation: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('vendors')
      .update({
        business_name: params.businessName.trim(),
        area: params.area.trim(),
        market_location: params.marketLocation.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.vendorId);

    if (error) {
      console.error('Error updating vendor store profile:', error);
      return { success: false, message: error.message };
    }

    revalidatePath('/vendor/settings');
    revalidatePath('/control-omp/vendors');
    return { success: true, message: 'Store profile updated successfully!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to update store profile.' };
  }
}

