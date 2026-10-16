'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface PlatformConfig {
  brevoApiKey: string;
  brevoSenderEmail: string;
  brevoSenderName: string;
  commissionRate: string;
  baseDeliveryFee: string;
  // Cloudflare R2 Storage
  r2AccountId: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2BucketName: string;
  r2PublicDomain: string;
  // Monetary Verification Badge Settings
  verificationBadgePrice: string;
  verificationBadgePeriod: string;
  verificationBadgeRequirements: string;
  verificationBadgeInstructions: string;
}

/**
 * Get Platform settings from DB (with environment variables as fallback)
 */
export async function getPlatformSettingsAction(): Promise<PlatformConfig> {
  const config: PlatformConfig = {
    brevoApiKey: process.env.BREVO_API_KEY || '',
    brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || 'support@ogbamarketplace.com',
    brevoSenderName: process.env.BREVO_SENDER_NAME || 'OGBA MARKET PLACE',
    commissionRate: '7.5',
    baseDeliveryFee: '1000',
    r2AccountId: '',
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    r2BucketName: process.env.R2_BUCKET_NAME || 'ogbamarketplace',
    r2PublicDomain: process.env.R2_PUBLIC_DOMAIN || '',
    verificationBadgePrice: '15000',
    verificationBadgePeriod: 'Annual (12 Months)',
    verificationBadgeRequirements: '1. Active approved vendor store in ONELGA\n2. Valid National ID (NIN) or CAC registration\n3. Minimum 5 successful deliveries with 4.5+ star rating',
    verificationBadgeInstructions: 'Pay badge verification fee into Ogba Marketplace designated settlement account or Paystack badge gateway.',
  };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('platform_settings').select('*');

    if (!error && data && data.length > 0) {
      data.forEach((row: { key: string; value: string }) => {
        if (row.key === 'brevo_api_key' && row.value) config.brevoApiKey = row.value;
        if (row.key === 'brevo_sender_email' && row.value) config.brevoSenderEmail = row.value;
        if (row.key === 'brevo_sender_name' && row.value) config.brevoSenderName = row.value;
        if (row.key === 'commission_rate' && row.value) config.commissionRate = row.value;
        if (row.key === 'base_delivery_fee' && row.value) config.baseDeliveryFee = row.value;
        if (row.key === 'r2_account_id' && row.value) config.r2AccountId = row.value;
        if (row.key === 'r2_access_key_id' && row.value) config.r2AccessKeyId = row.value;
        if (row.key === 'r2_secret_access_key' && row.value) config.r2SecretAccessKey = row.value;
        if (row.key === 'r2_bucket_name' && row.value) config.r2BucketName = row.value;
        if (row.key === 'r2_public_domain' && row.value) config.r2PublicDomain = row.value;
        if (row.key === 'badge_price' && row.value) config.verificationBadgePrice = row.value;
        if (row.key === 'badge_period' && row.value) config.verificationBadgePeriod = row.value;
        if (row.key === 'badge_requirements' && row.value) config.verificationBadgeRequirements = row.value;
        if (row.key === 'badge_instructions' && row.value) config.verificationBadgeInstructions = row.value;
      });
    }
  } catch (err) {
    console.error('Error fetching settings from DB:', err);
  }

  return config;
}

/**
 * Save Brevo, R2 & Platform settings into database table `platform_settings`
 */
export async function savePlatformSettingsAction(params: {
  brevoApiKey?: string;
  brevoSenderEmail?: string;
  brevoSenderName?: string;
  commissionRate?: string;
  baseDeliveryFee?: string;
  r2AccountId?: string;
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  r2BucketName?: string;
  r2PublicDomain?: string;
  verificationBadgePrice?: string;
  verificationBadgePeriod?: string;
  verificationBadgeRequirements?: string;
  verificationBadgeInstructions?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const rowsToUpsert: { key: string; value: string; updated_at: string }[] = [];
    const now = new Date().toISOString();

    if (params.brevoApiKey !== undefined) {
      rowsToUpsert.push({ key: 'brevo_api_key', value: params.brevoApiKey.trim(), updated_at: now });
    }
    if (params.brevoSenderEmail !== undefined) {
      rowsToUpsert.push({ key: 'brevo_sender_email', value: params.brevoSenderEmail.trim(), updated_at: now });
    }
    if (params.brevoSenderName !== undefined) {
      rowsToUpsert.push({ key: 'brevo_sender_name', value: params.brevoSenderName.trim(), updated_at: now });
    }
    if (params.commissionRate !== undefined) {
      rowsToUpsert.push({ key: 'commission_rate', value: params.commissionRate.trim(), updated_at: now });
    }
    if (params.baseDeliveryFee !== undefined) {
      rowsToUpsert.push({ key: 'base_delivery_fee', value: params.baseDeliveryFee.trim(), updated_at: now });
    }
    if (params.r2AccountId !== undefined) {
      rowsToUpsert.push({ key: 'r2_account_id', value: params.r2AccountId.trim(), updated_at: now });
    }
    if (params.r2AccessKeyId !== undefined) {
      rowsToUpsert.push({ key: 'r2_access_key_id', value: params.r2AccessKeyId.trim(), updated_at: now });
    }
    if (params.r2SecretAccessKey !== undefined) {
      rowsToUpsert.push({ key: 'r2_secret_access_key', value: params.r2SecretAccessKey.trim(), updated_at: now });
    }
    if (params.r2BucketName !== undefined) {
      rowsToUpsert.push({ key: 'r2_bucket_name', value: params.r2BucketName.trim(), updated_at: now });
    }
    if (params.r2PublicDomain !== undefined) {
      rowsToUpsert.push({ key: 'r2_public_domain', value: params.r2PublicDomain.trim(), updated_at: now });
    }
    if (params.verificationBadgePrice !== undefined) {
      rowsToUpsert.push({ key: 'badge_price', value: params.verificationBadgePrice.trim(), updated_at: now });
    }
    if (params.verificationBadgePeriod !== undefined) {
      rowsToUpsert.push({ key: 'badge_period', value: params.verificationBadgePeriod.trim(), updated_at: now });
    }
    if (params.verificationBadgeRequirements !== undefined) {
      rowsToUpsert.push({ key: 'badge_requirements', value: params.verificationBadgeRequirements.trim(), updated_at: now });
    }
    if (params.verificationBadgeInstructions !== undefined) {
      rowsToUpsert.push({ key: 'badge_instructions', value: params.verificationBadgeInstructions.trim(), updated_at: now });
    }

    if (rowsToUpsert.length > 0) {
      const { error } = await supabase
        .from('platform_settings')
        .upsert(rowsToUpsert, { onConflict: 'key' });

      if (error) {
        console.error('Error saving settings to DB:', error);
        return { success: false, error: error.message };
      }
    }

    revalidatePath('/control-omp/settings');
    return { success: true };
  } catch (err: any) {
    console.error('Exception in savePlatformSettingsAction:', err);
    return { success: false, error: err.message };
  }
}
