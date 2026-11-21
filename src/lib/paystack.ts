import { getPlatformSettingsAction } from '@/actions/settings';

// Paystack Node SDK
const Paystack = require('paystack');

/**
 * Get active Paystack secret key from DB (fallback to environment variable)
 */
export async function getPaystackSecretKey(): Promise<string> {
  try {
    const config = await getPlatformSettingsAction();
    if (config.paystackSecretKey?.trim()) {
      return config.paystackSecretKey.trim();
    }
  } catch (err) {
    console.error('Error fetching Paystack secret key from settings:', err);
  }
  return process.env.PAYSTACK_SECRET_KEY || '';
}

/**
 * Get active Paystack public key from DB (fallback to environment variable)
 */
export async function getPaystackPublicKey(): Promise<string> {
  try {
    const config = await getPlatformSettingsAction();
    if (config.paystackPublicKey?.trim()) {
      return config.paystackPublicKey.trim();
    }
  } catch (err) {
    console.error('Error fetching Paystack public key from settings:', err);
  }
  return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
}

/**
 * Initialize Paystack Client instance
 */
export async function getPaystackClient() {
  const secretKey = await getPaystackSecretKey();
  if (!secretKey) {
    throw new Error('Paystack Secret Key is not configured. Please set it in Admin Settings.');
  }
  return Paystack(secretKey);
}

/**
 * Verify transaction reference with Paystack
 */
export async function verifyPaystackReference(reference: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const secretKey = await getPaystackSecretKey();
    if (!secretKey) {
      return { success: false, error: 'Paystack secret key is missing in Admin Settings.' };
    }

    // Direct HTTP call to Paystack REST API for maximum reliability
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const result = await response.json();
    if (result.status && result.data && result.data.status === 'success') {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      error: result.message || 'Payment verification failed or status is not successful.',
      data: result.data,
    };
  } catch (err: any) {
    console.error('Exception during Paystack verification:', err);
    return {
      success: false,
      error: err.message || 'Network error while contacting Paystack.',
    };
  }
}
