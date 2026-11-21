'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  sendPlatformEmail,
  renderCampaignEmailHtml,
  CampaignProductDetails,
  CampaignEmailTemplateId,
  EmailRecipient,
} from '@/lib/email/mailer';

export type CampaignAudience =
  | 'all'
  | 'customers'
  | 'vendors'
  | 'select_customers'
  | 'select_vendors'
  | 'custom';

export type CampaignType = 'product_promotion' | 'marketing' | 'professional';

export interface CampaignCustomerRecord {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  area?: string;
  role: string;
}

export interface CampaignVendorRecord {
  id: string;
  userId?: string;
  businessName: string;
  marketLocation: string;
  ownerName: string;
  email: string;
  phoneNumber?: string;
  isVerified?: boolean;
}

export interface AudienceQueryParams {
  audience: CampaignAudience;
  selectedCustomerIds?: string[];
  selectedVendorIds?: string[];
  customEmail?: string;
  customName?: string;
}

export interface CampaignHistoryRecord {
  id: string;
  subject: string;
  headline: string;
  campaignType: CampaignType;
  templateId?: CampaignEmailTemplateId;
  audience: CampaignAudience;
  recipientCount: number;
  recipientSample?: string[];
  productId?: string;
  productTitle?: string;
  productCount?: number;
  productTitles?: string[];
  ctaText?: string;
  ctaUrl?: string;
  sentAt: string;
  isSimulated?: boolean;
}

/**
 * Fetch all registered customers for granular audience selection
 */
export async function getAllCustomersForAudienceAction(): Promise<CampaignCustomerRecord[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, phone_number, role, area')
      .not('email', 'is', null)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data
      .filter((u: any) => u.email && typeof u.email === 'string' && u.email.includes('@'))
      .map((u: any) => ({
        id: u.id,
        fullName: u.full_name || 'Community Customer',
        email: u.email.trim(),
        phoneNumber: u.phone_number || undefined,
        area: u.area || 'ONELGA',
        role: u.role || 'customer',
      }));
  } catch (e) {
    console.error('Error fetching customers for audience action:', e);
    return [];
  }
}

/**
 * Fetch all registered vendors for granular audience selection
 */
export async function getAllVendorsForAudienceAction(): Promise<CampaignVendorRecord[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('vendors')
      .select('id, business_name, market_location, is_verified, user_id, user:users(id, full_name, email, phone_number)')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((v: any) => ({
      id: v.id,
      userId: v.user_id,
      businessName: v.business_name || 'Merchant Stall',
      marketLocation: v.market_location || 'Omoku, Rivers State',
      ownerName: v.user?.full_name || 'Store Owner',
      email: v.user?.email || `store.${v.id.substring(0, 8)}@ogbamarketplace.com.ng`,
      phoneNumber: v.user?.phone_number || undefined,
      isVerified: Boolean(v.is_verified),
    }));
  } catch (e) {
    console.error('Error fetching vendors for audience action:', e);
    return [];
  }
}

/**
 * Fetch candidate recipients based on target audience segment or granular selection
 */
export async function getAudienceRecipientsAction(
  audienceOrParams: CampaignAudience | AudienceQueryParams,
  legacyCustomEmail?: string
): Promise<{
  count: number;
  sample: { name: string; email: string; role: string }[];
  recipients: EmailRecipient[];
}> {
  try {
    const params: AudienceQueryParams =
      typeof audienceOrParams === 'string'
        ? { audience: audienceOrParams, customEmail: legacyCustomEmail }
        : audienceOrParams;

    // 1. Direct / External Custom Recipients (Supports 1 or multiple comma/newline-separated emails)
    if (params.audience === 'custom') {
      const rawText = params.customEmail?.trim() || '';
      if (!rawText) return { count: 0, sample: [], recipients: [] };

      const emails = rawText
        .split(/[,;\n]/)
        .map((e) => e.trim())
        .filter((e) => e.includes('@'));

      if (emails.length === 0) {
        return { count: 0, sample: [], recipients: [] };
      }

      const recipients: EmailRecipient[] = emails.map((email) => ({
        email,
        name: emails.length === 1 && params.customName ? params.customName.trim() : email.split('@')[0],
      }));

      const sample = recipients.slice(0, 5).map((r) => ({
        name: r.name || 'Recipient',
        email: r.email,
        role: 'external / custom',
      }));

      return { count: recipients.length, sample, recipients };
    }

    const supabase = await createClient();

    // 2. Select Specific Customers
    if (params.audience === 'select_customers') {
      const ids = params.selectedCustomerIds || [];
      if (ids.length === 0) return { count: 0, sample: [], recipients: [] };

      const { data: users, error } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .in('id', ids);

      if (error || !users) return { count: 0, sample: [], recipients: [] };

      const validUsers = users.filter((u: any) => u.email && u.email.includes('@'));
      const recipients: EmailRecipient[] = validUsers.map((u: any) => ({
        email: u.email.trim(),
        name: u.full_name || 'Valued Customer',
      }));

      const sample = validUsers.slice(0, 5).map((u: any) => ({
        name: u.full_name || 'Customer',
        email: u.email,
        role: u.role || 'customer',
      }));

      return { count: validUsers.length, sample, recipients };
    }

    // 3. Select Specific Vendors
    if (params.audience === 'select_vendors') {
      const ids = params.selectedVendorIds || [];
      if (ids.length === 0) return { count: 0, sample: [], recipients: [] };

      const { data: vendors, error } = await supabase
        .from('vendors')
        .select('id, business_name, market_location, user_id, user:users(id, full_name, email)')
        .in('id', ids);

      if (error || !vendors) return { count: 0, sample: [], recipients: [] };

      const recipients: EmailRecipient[] = vendors
        .map((v: any) => {
          const email = v.user?.email || `store.${v.id.substring(0, 8)}@ogbamarketplace.com.ng`;
          return {
            email: email.trim(),
            name: v.business_name || v.user?.full_name || 'Merchant',
          };
        })
        .filter((r) => r.email && r.email.includes('@'));

      const sample = vendors.slice(0, 5).map((v: any) => ({
        name: v.business_name || 'Merchant',
        email: v.user?.email || 'Vendor Store',
        role: 'vendor',
      }));

      return { count: recipients.length, sample, recipients };
    }

    // 4. Broad Segments (All, Customers, Vendors)
    let query = supabase
      .from('users')
      .select('id, full_name, email, role')
      .not('email', 'is', null);

    if (params.audience === 'customers') {
      query = query.eq('role', 'customer');
    } else if (params.audience === 'vendors') {
      query = query.eq('role', 'vendor');
    } else {
      query = query.in('role', ['customer', 'vendor']);
    }

    const { data: users, error } = await query;

    if (error || !users) {
      console.error('Error fetching audience recipients:', error);
      return { count: 0, sample: [], recipients: [] };
    }

    const validUsers = users.filter((u: any) => u.email && typeof u.email === 'string' && u.email.includes('@'));

    const recipients: EmailRecipient[] = validUsers.map((u: any) => ({
      email: u.email.trim(),
      name: u.full_name || 'Valued Member',
    }));

    const sample = validUsers.slice(0, 5).map((u: any) => ({
      name: u.full_name || 'Member',
      email: u.email,
      role: u.role || 'customer',
    }));

    return {
      count: validUsers.length,
      sample,
      recipients,
    };
  } catch (err) {
    console.error('Exception in getAudienceRecipientsAction:', err);
    return { count: 0, sample: [], recipients: [] };
  }
}

/**
 * Fetch approved products available for promotion in email campaigns
 */
export async function getMarketplaceProductsForPromotionAction(): Promise<
  {
    id: string;
    title: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    imageUrl?: string;
    vendorName: string;
    vendorLocation: string;
    category: string;
    descriptionSnippet: string;
  }[]
> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        title,
        slug,
        price,
        compare_at_price,
        images,
        description,
        approval_status,
        is_active,
        vendor:vendors(business_name, market_location),
        category:categories(name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) {
      console.error('Error fetching products for promotion:', error);
      return [];
    }

    return data.map((p: any) => {
      const v = p.vendor;
      const c = p.category;
      const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '';
      const snippet = p.description
        ? p.description.replace(/<[^>]*>?/gm, '').substring(0, 140) + '...'
        : '';

      return {
        id: p.id,
        title: p.title,
        slug: p.slug || p.id,
        price: Number(p.price) || 0,
        compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : undefined,
        imageUrl: img,
        vendorName: v?.business_name || 'Verified Merchant',
        vendorLocation: v?.market_location || 'Omoku, Rivers State',
        category: c?.name || 'Marketplace',
        descriptionSnippet: snippet,
      };
    });
  } catch (err) {
    console.error('Exception in getMarketplaceProductsForPromotionAction:', err);
    return [];
  }
}

/**
 * Send an email broadcast campaign to customers, vendors, or custom test recipient
 */
export async function sendBroadcastCampaignAction(params: {
  campaignType: CampaignType;
  templateId?: CampaignEmailTemplateId;
  audience: CampaignAudience;
  customEmail?: string;
  customName?: string;
  selectedCustomerIds?: string[];
  selectedVendorIds?: string[];
  subject: string;
  headline: string;
  preheader?: string;
  bodyHtml: string;
  products?: CampaignProductDetails[];
  product?: CampaignProductDetails;
  ctaText?: string;
  ctaUrl?: string;
}): Promise<{
  success: boolean;
  count: number;
  simulated?: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    if (!params.subject.trim()) {
      return { success: false, count: 0, error: 'Email subject is required.' };
    }
    if (!params.headline.trim()) {
      return { success: false, count: 0, error: 'Campaign title/headline is required.' };
    }
    if (!params.bodyHtml.trim()) {
      return { success: false, count: 0, error: 'Email body content cannot be empty.' };
    }

    // 1. Resolve recipients
    const { recipients, count } = await getAudienceRecipientsAction({
      audience: params.audience,
      customEmail: params.customEmail,
      customName: params.customName,
      selectedCustomerIds: params.selectedCustomerIds,
      selectedVendorIds: params.selectedVendorIds,
    });

    if (count === 0 || recipients.length === 0) {
      return {
        success: false,
        count: 0,
        error: params.audience === 'custom'
          ? 'Invalid or missing custom test email address.'
          : 'No recipients with registered email addresses found in this audience segment.',
      };
    }

    const effectiveProducts = params.products && params.products.length > 0
      ? params.products
      : params.product
      ? [params.product]
      : [];

    // 2. Render final branded responsive HTML
    const emailHtml = renderCampaignEmailHtml({
      campaignType: params.campaignType,
      templateId: params.templateId,
      headline: params.headline.trim(),
      preheader: params.preheader?.trim(),
      bodyHtml: params.bodyHtml,
      products: effectiveProducts,
      ctaText: params.ctaText?.trim(),
      ctaUrl: params.ctaUrl?.trim(),
    });

    // 3. Dispatch through platform mailer
    const mailResult = await sendPlatformEmail({
      to: recipients,
      replyTo: {
        email: 'support@ogbamarketplace.com.ng',
        name: 'OGBA MARKET PLACE',
      },
      subject: params.subject.trim(),
      html: emailHtml,
      tags: ['campaign', params.campaignType, params.audience, params.templateId || 'default'],
    });

    if (!mailResult.success && !mailResult.simulated) {
      return {
        success: false,
        count: 0,
        error: mailResult.error ? JSON.stringify(mailResult.error) : 'Failed to dispatch emails through Brevo.',
      };
    }

    // 4. Save campaign record to platform_settings history
    try {
      const supabase = await createClient();
      const now = new Date().toISOString();
      const newRecord: CampaignHistoryRecord = {
        id: `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        subject: params.subject.trim(),
        headline: params.headline.trim(),
        campaignType: params.campaignType,
        templateId: params.templateId,
        audience: params.audience,
        recipientCount: count,
        recipientSample: recipients.slice(0, 3).map((r) => r.email),
        productId: effectiveProducts[0]?.id,
        productTitle: effectiveProducts.length > 0
          ? effectiveProducts.length === 1
            ? effectiveProducts[0].title
            : `${effectiveProducts[0].title} (+${effectiveProducts.length - 1} more items)`
          : undefined,
        productCount: effectiveProducts.length,
        productTitles: effectiveProducts.map((p) => p.title),
        ctaText: params.ctaText?.trim(),
        ctaUrl: params.ctaUrl?.trim(),
        sentAt: now,
        isSimulated: Boolean(mailResult.simulated),
      };

      // Read existing history
      const { data: historyRow } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'broadcast_campaign_history')
        .maybeSingle();

      let currentHistory: CampaignHistoryRecord[] = [];
      if (historyRow?.value) {
        try {
          currentHistory = JSON.parse(historyRow.value);
        } catch (e) {}
      }

      const updatedHistory = [newRecord, ...currentHistory].slice(0, 50); // Keep last 50 campaigns

      await supabase.from('platform_settings').upsert({
        key: 'broadcast_campaign_history',
        value: JSON.stringify(updatedHistory),
        updated_at: now,
      });
    } catch (saveErr) {
      console.warn('Could not record campaign to platform_settings history:', saveErr);
    }

    revalidatePath('/control-omp/marketing');

    return {
      success: true,
      count,
      simulated: mailResult.simulated,
      messageId: mailResult.messageId,
    };
  } catch (err: any) {
    console.error('Exception in sendBroadcastCampaignAction:', err);
    return {
      success: false,
      count: 0,
      error: err.message || 'An unexpected exception occurred while broadcasting campaign.',
    };
  }
}

/**
 * Fetch campaign history logs
 */
export async function getCampaignHistoryAction(): Promise<CampaignHistoryRecord[]> {
  try {
    const supabase = await createClient();
    const { data: historyRow, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'broadcast_campaign_history')
      .maybeSingle();

    if (error || !historyRow?.value) {
      return [];
    }

    const parsed: CampaignHistoryRecord[] = JSON.parse(historyRow.value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Exception in getCampaignHistoryAction:', err);
    return [];
  }
}
