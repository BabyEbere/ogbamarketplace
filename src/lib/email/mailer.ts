import { createClient } from '@/lib/supabase/server';

/**
 * OGBA MARKET PLACE - Centralized Platform Mailer
 * 
 * ALL outgoing platform emails must pass through this mailer service.
 * It dynamically loads configuration (Brevo API key, sender email, sender name)
 * from the database platform_settings table (with environment variable fallbacks),
 * provides rich branded responsive HTML email layouts, and handles both live
 * API dispatch and local simulation logging.
 */

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface PlatformEmailOptions {
  to: EmailRecipient | EmailRecipient[] | string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: EmailRecipient | string;
  tags?: string[];
}

export interface PlatformEmailResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: any;
}

/**
 * Dynamically resolves current Mailer configuration from database platform_settings
 * with environment variable fallback.
 */
export async function getMailerConfig(): Promise<{
  apiKey: string;
  senderEmail: string;
  senderName: string;
}> {
  let apiKey = process.env.BREVO_API_KEY || '';
  let senderEmail = process.env.BREVO_SENDER_EMAIL || 'support@ogbamarketplace.com.ng';
  let senderName = process.env.BREVO_SENDER_NAME || 'OGBA MARKET PLACE';

  try {
    const supabase = await createClient();
    const { data: dbSettings, error } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['brevo_api_key', 'brevo_sender_email', 'brevo_sender_name']);

    if (!error && dbSettings && dbSettings.length > 0) {
      dbSettings.forEach((row: { key: string; value: string }) => {
        if (row.key === 'brevo_api_key' && row.value?.trim()) apiKey = row.value.trim();
        if (row.key === 'brevo_sender_email' && row.value?.trim()) senderEmail = row.value.trim();
        if (row.key === 'brevo_sender_name' && row.value?.trim()) senderName = row.value.trim();
      });
    }
  } catch (err) {
    console.warn('[Mailer] Could not query platform_settings from DB, using fallback env variables:', err);
  }

  return { apiKey, senderEmail, senderName };
}

/**
 * Normalize recipient input into standard Brevo recipient array
 */
function normalizeRecipients(input: EmailRecipient | EmailRecipient[] | string | string[]): EmailRecipient[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => (typeof item === 'string' ? { email: item.trim() } : { email: item.email.trim(), name: item.name?.trim() }))
      .filter((item) => item.email && item.email.includes('@'));
  }
  if (typeof input === 'string') {
    return input.includes('@') ? [{ email: input.trim() }] : [];
  }
  if (input && typeof input === 'object' && input.email && input.email.includes('@')) {
    return [{ email: input.email.trim(), name: input.name?.trim() }];
  }
  return [];
}

/**
 * Primary Platform Email Sender
 * All outgoing emails in the system pass through this function.
 */
export async function sendPlatformEmail(options: PlatformEmailOptions): Promise<PlatformEmailResult> {
  const recipients = normalizeRecipients(options.to);
  if (recipients.length === 0) {
    console.warn('[Mailer Error] Cannot send email: No valid recipient email address provided.');
    return { success: false, error: 'No valid recipient email address provided.' };
  }

  const { apiKey, senderEmail, senderName } = await getMailerConfig();

  // If API key is absent or a dummy placeholder, execute in safe simulation mode
  const isDummyKey = !apiKey || apiKey === 'your_brevo_api_key_here' || apiKey.includes('placeholder') || apiKey.length < 15;

  if (isDummyKey) {
    console.log(`\n================== [PLATFORM MAILER SIMULATION] ==================`);
    console.log(`From:    ${senderName} <${senderEmail}>`);
    console.log(`To:      ${recipients.map((r) => (r.name ? `"${r.name}" <${r.email}>` : r.email)).join(', ')}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Date:    ${new Date().toISOString()}`);
    console.log(`Status:  [SIMULATED - Brevo API key not yet configured in Admin Settings]`);
    console.log(`==================================================================\n`);

    return {
      success: true,
      simulated: true,
      messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    };
  }

  try {
    // 1. Resolve replyTo - NEVER leak personal admin emails, default strictly to official support address
    let resolvedReplyTo: EmailRecipient = {
      email: 'support@ogbamarketplace.com.ng',
      name: senderName || 'OGBA MARKET PLACE Support',
    };

    if (options.replyTo) {
      if (typeof options.replyTo === 'string' && options.replyTo.includes('@')) {
        resolvedReplyTo = { email: options.replyTo.trim(), name: senderName };
      } else if (typeof options.replyTo === 'object' && options.replyTo.email && options.replyTo.email.includes('@')) {
        resolvedReplyTo = {
          email: options.replyTo.email.trim(),
          name: options.replyTo.name?.trim() || senderName,
        };
      }
    }

    const basePayload: Record<string, any> = {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      replyTo: resolvedReplyTo,
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text || options.subject,
    };

    if (options.tags && options.tags.length > 0) {
      basePayload.tags = options.tags;
    }

    // 2. Single Recipient: Direct standard dispatch
    if (recipients.length === 1) {
      const payload = {
        ...basePayload,
        to: recipients,
      };

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error('[Mailer Brevo Error]', response.status, data);
        return {
          success: false,
          error: data || `HTTP error ${response.status}`,
        };
      }

      console.log(`[Mailer Sent] Successfully dispatched email to 1 recipient. MessageId:`, data?.messageId);
      return {
        success: true,
        messageId: data?.messageId,
      };
    }

    // 3. Multiple Recipients (Marketing Broadcasts / Platform Mass Mail):
    // PRIVACY PROTECTION: Use Brevo's messageVersions so each recipient receives their OWN private copy.
    // No recipient will ever see other customers' or vendors' email addresses or names in the "To:" header!
    const CHUNK_SIZE = 500;
    const collectedMessageIds: string[] = [];

    for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
      const chunk = recipients.slice(i, i + CHUNK_SIZE);
      const batchPayload = {
        ...basePayload,
        messageVersions: chunk.map((r) => ({
          to: [r],
        })),
      };

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(batchPayload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error('[Mailer Brevo Batch Error]', response.status, data);
        return {
          success: false,
          error: data || `HTTP error ${response.status}`,
        };
      }

      if (Array.isArray(data?.messageIds)) {
        collectedMessageIds.push(...data.messageIds);
      } else if (data?.messageId) {
        collectedMessageIds.push(data.messageId);
      }
    }

    console.log(`[Mailer Sent Batch] Successfully dispatched ${recipients.length} private individualized emails. Count:`, collectedMessageIds.length);
    return {
      success: true,
      messageId: collectedMessageIds[0],
    };
  } catch (error: any) {
    console.error('[Mailer Exception]', error);
    return {
      success: false,
      error: error?.message || 'Network exception while dispatching platform email.',
    };
  }
}

/**
 * Standard branded responsive HTML template wrapper for all Ogba Marketplace emails
 */
export function wrapPlatformEmailTemplate(params: {
  badgeText?: string;
  badgeBg?: string;
  badgeColor?: string;
  title: string;
  subtitle?: string;
  contentHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const currentYear = new Date().getFullYear();
  const badgeHtml = params.badgeText
    ? `<span style="display: inline-block; padding: 4px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 9999px; background-color: ${params.badgeBg || '#ECFDF5'}; color: ${params.badgeColor || '#065F46'}; margin-bottom: 12px;">${params.badgeText}</span>`
    : '';

  const ctaButtonHtml =
    params.ctaText && params.ctaUrl
      ? `<div style="text-align: center; margin: 28px 0 12px 0;">
          <a href="${params.ctaUrl}" style="display: inline-block; background-color: #164E2E; color: #FFFFFF; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">${params.ctaText} &rarr;</a>
        </div>`
      : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F1F5F9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 14px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #164E2E; padding: 24px; text-align: center; border-bottom: 3px solid #10B981;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1.5px; color: #FFFFFF; text-transform: uppercase;">OGBA MARKET PLACE</h1>
                    <p style="margin: 6px 0 0 0; font-size: 12px; color: #A7F3D0; font-weight: 500;">Connecting Omoku, Egi & ONELGA Local Commerce</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 28px 24px;">
              ${badgeHtml}
              <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 800; color: #0F172A; line-height: 1.3;">${params.title}</h2>
              ${params.subtitle ? `<p style="margin: 0 0 20px 0; font-size: 14px; color: #64748B; line-height: 1.5;">${params.subtitle}</p>` : '<div style="margin-bottom: 16px;"></div>'}

              ${params.contentHtml}

              ${ctaButtonHtml}

              ${params.footerNote ? `<div style="margin-top: 24px; padding: 12px 16px; background-color: #F8FAFC; border-left: 3px solid #94A3B8; border-radius: 4px; font-size: 12px; color: #64748B; line-height: 1.5;">${params.footerNote}</div>` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 20px 24px; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #475569;">OGBA MARKET PLACE • Official Hyperlocal E-commerce</p>
              <p style="margin: 0 0 10px 0; font-size: 11px; color: #94A3B8; line-height: 1.4;">
                Omoku Central Market & Egi Delivery Hub • Rivers State, Nigeria<br/>
                For support, inquiries or escrow questions, contact <a href="mailto:support@ogbamarketplace.com.ng" style="color: #164E2E; text-decoration: none; font-weight: 600;">support@ogbamarketplace.com.ng</a>
              </p>
              <p style="margin: 0; font-size: 10px; color: #CBD5E1;">&copy; ${currentYear} Ogba Market Place Initiative. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// =========================================================================
// HIGH-LEVEL TRANSACTIONAL PLATFORM EMAILS
// =========================================================================

/**
 * 1. Vendor Email: Sent to vendor when they make payment to promote a Deal of the Day
 */
export async function sendDealPaymentVendorEmail(params: {
  vendorEmail: string;
  vendorName: string;
  businessName: string;
  productId: string;
  productSlug?: string;
  productTitle: string;
  productPrice: number;
  productImageUrl?: string;
  durationDays: number;
  dailyRate: number;
  totalAmountPaid: number;
  paymentMethod: 'wallet' | 'paystack';
  paystackReference?: string;
  activatedAt: string;
  expiresAt: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://ogbamarketplace.com.ng';
  const productViewUrl = `${baseUrl}/products/${params.productSlug || params.productId}`;
  const vendorDashboardUrl = `${baseUrl}/vendor/products`;

  const formattedStartDate = new Date(params.activatedAt).toLocaleDateString('en-NG', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedExpiryDate = new Date(params.expiresAt).toLocaleDateString('en-NG', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentLabel = params.paymentMethod === 'wallet' ? 'Vendor Wallet Balance' : 'Paystack Online Checkout';

  const productThumbnailHtml = params.productImageUrl
    ? `<img src="${params.productImageUrl}" alt="${params.productTitle}" style="width: 72px; height: 72px; object-fit: cover; border-radius: 8px; border: 1px solid #E2E8F0; margin-right: 14px;" />`
    : '';

  const contentHtml = `
    <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 14px; color: #065F46; line-height: 1.5;">
        Hello <strong>${params.vendorName || params.businessName}</strong>,<br/>
        Your payment was received successfully! Your product is now live as a <strong>Featured Deal of the Day</strong> on Ogba Market Place.
      </p>
    </div>

    <!-- Product Card -->
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px; margin-bottom: 20px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          ${productThumbnailHtml ? `<td width="86" valign="middle">${productThumbnailHtml}</td>` : ''}
          <td valign="middle">
            <span style="display: inline-block; background-color: #FEF3C7; color: #92400E; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; margin-bottom: 4px;">Deal of the Day</span>
            <h3 style="margin: 2px 0 4px 0; font-size: 15px; color: #0F172A;">${params.productTitle}</h3>
            <p style="margin: 0; font-size: 13px; font-weight: 700; color: #164E2E;">₦${params.productPrice.toLocaleString()}</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Payment & Promotion Receipt Table -->
    <div style="border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
      <div style="background-color: #F1F5F9; padding: 10px 14px; font-weight: 700; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
        Promotion Receipt & Coverage
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; color: #64748B;">Duration:</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; font-weight: 700; color: #0F172A;">${params.durationDays} Days</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; color: #64748B;">Daily Promotion Rate:</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; font-weight: 600; color: #0F172A;">₦${params.dailyRate.toLocaleString()} / day</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; color: #64748B;">Payment Method:</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; font-weight: 600; color: #0F172A;">${paymentLabel}</td>
        </tr>
        ${
          params.paystackReference
            ? `<tr>
                <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; color: #64748B;">Transaction Ref:</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; font-family: monospace; font-size: 12px; color: #0F172A;">${params.paystackReference}</td>
              </tr>`
            : ''
        }
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; color: #64748B;">Activation Date:</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; color: #0F172A;">${formattedStartDate}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; color: #64748B;">Expires On:</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; font-weight: 600; color: #DC2626;">${formattedExpiryDate}</td>
        </tr>
        <tr style="background-color: #F8FAFC;">
          <td style="padding: 12px 14px; font-weight: 800; font-size: 14px; color: #164E2E;">Total Paid:</td>
          <td style="padding: 12px 14px; text-align: right; font-weight: 900; font-size: 16px; color: #164E2E;">₦${params.totalAmountPaid.toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <!-- Promotion Benefits -->
    <div style="background-color: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 8px; padding: 14px; font-size: 12px; color: #475569; line-height: 1.5;">
      <strong>🎯 Promotion Placement:</strong> Your product is now pinned to the top of the homepage deals section, tagged with a prominent "Deal of the Day" badge, and highlighted to active shoppers across Omoku and Egi.
    </div>
  `;

  const html = wrapPlatformEmailTemplate({
    badgeText: 'Payment Confirmed ✅',
    badgeBg: '#ECFDF5',
    badgeColor: '#065F46',
    title: `Deal of the Day Promotion Activated!`,
    subtitle: `"${params.productTitle}" is now live on the homepage deals section.`,
    contentHtml,
    ctaText: 'View Your Live Product',
    ctaUrl: productViewUrl,
    footerNote: `Need to manage your inventory or pause this promotion? Log into your <a href="${vendorDashboardUrl}" style="color: #164E2E; font-weight: 600;">Vendor Dashboard</a> at any time.`,
  });

  return sendPlatformEmail({
    to: [{ email: params.vendorEmail, name: params.vendorName || params.businessName }],
    subject: `🔥 Promotion Confirmed: "${params.productTitle}" is now Deal of the Day!`,
    html,
    tags: ['deal-promotion', 'vendor-payment'],
  });
}

/**
 * 2. Admin Email: Sent to all platform administrators when a vendor pays for Deal of the Day
 */
export async function sendDealPromotionAdminNotificationEmail(params: {
  adminRecipients: EmailRecipient[];
  vendorName: string;
  vendorEmail: string;
  vendorPhone?: string;
  businessName: string;
  marketLocation?: string;
  productId: string;
  productSlug?: string;
  productTitle: string;
  productPrice: number;
  productImageUrl?: string;
  durationDays: number;
  dailyRate: number;
  totalAmountPaid: number;
  paymentMethod: 'wallet' | 'paystack';
  paystackReference?: string;
  activatedAt: string;
  expiresAt: string;
}) {
  if (!params.adminRecipients || params.adminRecipients.length === 0) {
    console.warn('[Mailer Notice] No admin recipients found to notify about Deal of the Day promotion.');
    return { success: true, simulated: true, error: 'No admin recipients' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://ogbamarketplace.com.ng';
  const adminProductUrl = `${baseUrl}/control-omp/products`;
  const liveProductUrl = `${baseUrl}/products/${params.productSlug || params.productId}`;

  const formattedStartDate = new Date(params.activatedAt).toLocaleDateString('en-NG', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedExpiryDate = new Date(params.expiresAt).toLocaleDateString('en-NG', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentLabel = params.paymentMethod === 'wallet' ? 'Vendor Wallet Balance' : 'Paystack Gateway';

  const productThumbnailHtml = params.productImageUrl
    ? `<img src="${params.productImageUrl}" alt="${params.productTitle}" style="width: 72px; height: 72px; object-fit: cover; border-radius: 8px; border: 1px solid #E2E8F0; margin-right: 14px;" />`
    : '';

  const contentHtml = `
    <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 14px; font-weight: 700; color: #92400E;">
        💰 Revenue Received: ₦${params.totalAmountPaid.toLocaleString()}
      </p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #78350F; line-height: 1.4;">
        Vendor <strong>${params.businessName}</strong> just paid to feature <strong>"${params.productTitle}"</strong> for <strong>${params.durationDays} days</strong> on the homepage.
      </p>
    </div>

    <!-- Product Details -->
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px; margin-bottom: 20px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          ${productThumbnailHtml ? `<td width="86" valign="middle">${productThumbnailHtml}</td>` : ''}
          <td valign="middle">
            <span style="display: inline-block; background-color: #164E2E; color: #A7F3D0; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; margin-bottom: 4px;">Deal of the Day</span>
            <h3 style="margin: 2px 0 4px 0; font-size: 15px; color: #0F172A;">${params.productTitle}</h3>
            <p style="margin: 0; font-size: 13px; font-weight: 700; color: #164E2E;">Retail Price: ₦${params.productPrice.toLocaleString()}</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Vendor Information Card -->
    <div style="border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
      <div style="background-color: #F1F5F9; padding: 10px 14px; font-weight: 700; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
        Vendor Details
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px; border-collapse: collapse;">
        <tr>
          <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; color: #64748B;">Store Name:</td>
          <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; font-weight: 700; color: #0F172A;">${params.businessName}</td>
        </tr>
        <tr>
          <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; color: #64748B;">Owner Name:</td>
          <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; color: #0F172A;">${params.vendorName || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; color: #64748B;">Email Address:</td>
          <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; color: #0F172A;"><a href="mailto:${params.vendorEmail}" style="color: #164E2E; text-decoration: none;">${params.vendorEmail}</a></td>
        </tr>
        ${
          params.vendorPhone
            ? `<tr>
                <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; color: #64748B;">Phone:</td>
                <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; color: #0F172A;">${params.vendorPhone}</td>
              </tr>`
            : ''
        }
        ${
          params.marketLocation
            ? `<tr>
                <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; color: #64748B;">Location:</td>
                <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; color: #0F172A;">${params.marketLocation}</td>
              </tr>`
            : ''
        }
      </table>
    </div>

    <!-- Promotion Breakdown Table -->
    <div style="border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
      <div style="background-color: #F1F5F9; padding: 10px 14px; font-weight: 700; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
        Promotion & Financial Breakdown
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px; border-collapse: collapse;">
        <tr>
          <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; color: #64748B;">Promotion Duration:</td>
          <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; font-weight: 700; color: #0F172A;">${params.durationDays} Days</td>
        </tr>
        <tr>
          <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; color: #64748B;">Payment Source:</td>
          <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; font-weight: 600; color: #0F172A;">${paymentLabel}</td>
        </tr>
        ${
          params.paystackReference
            ? `<tr>
                <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; color: #64748B;">Paystack Reference:</td>
                <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; font-family: monospace; font-size: 12px; color: #0F172A;">${params.paystackReference}</td>
              </tr>`
            : ''
        }
        <tr>
          <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; color: #64748B;">Activation Timestamp:</td>
          <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; color: #0F172A;">${formattedStartDate}</td>
        </tr>
        <tr>
          <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; color: #64748B;">Expiration Date:</td>
          <td style="padding: 9px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; font-weight: 600; color: #DC2626;">${formattedExpiryDate}</td>
        </tr>
        <tr style="background-color: #F8FAFC;">
          <td style="padding: 12px 14px; font-weight: 800; font-size: 14px; color: #164E2E;">Amount Credited:</td>
          <td style="padding: 12px 14px; text-align: right; font-weight: 900; font-size: 16px; color: #164E2E;">₦${params.totalAmountPaid.toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${liveProductUrl}" style="display: inline-block; margin-right: 12px; font-size: 13px; color: #164E2E; font-weight: 700; text-decoration: underline;">View Live Product Page &rarr;</a>
    </div>
  `;

  const html = wrapPlatformEmailTemplate({
    badgeText: 'Admin Notification 📢',
    badgeBg: '#EFF6FF',
    badgeColor: '#1E40AF',
    title: `New Deal of the Day Promotion Activated`,
    subtitle: `${params.businessName} has promoted "${params.productTitle}" for ${params.durationDays} days.`,
    contentHtml,
    ctaText: 'Open Admin Products Panel',
    ctaUrl: adminProductUrl,
    footerNote: `This alert was delivered to all registered platform administrators of OGBA MARKET PLACE.`,
  });

  return sendPlatformEmail({
    to: params.adminRecipients,
    subject: `📢 [Admin Alert] New Deal of the Day: "${params.productTitle}" by ${params.businessName}`,
    html,
    tags: ['admin-alert', 'deal-promotion'],
  });
}

/**
 * 3. Customer Order Confirmation Email
 */
export async function sendOrderConfirmationEmail(params: {
  customerEmail: string;
  customerName: string;
  orderReference: string;
  totalAmount: number;
  deliveryAddress: string;
  items: { title: string; quantity: number; price: number }[];
}) {
  const itemsHtml = params.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0;">${item.title} (x${item.quantity})</td>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: bold;">₦${(item.price * item.quantity).toLocaleString()}</td>
        </tr>`
    )
    .join('');

  const contentHtml = `
    <p style="color: #4B5563; font-size: 14px; line-height: 1.5;">
      Hello <strong>${params.customerName}</strong>,<br/>
      Thank you for shopping on <strong>OGBA MARKET PLACE</strong>! Your order <strong>#${params.orderReference}</strong> has been received and is secured in Paystack Escrow.
    </p>

    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; margin: 16px 0;">
      <h4 style="margin: 0 0 10px 0; color: #164E2E;">Order Summary</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        ${itemsHtml}
        <tr>
          <td style="padding: 10px 8px; font-weight: bold; font-size: 15px;">Total Paid (Held in Escrow):</td>
          <td style="padding: 10px 8px; font-weight: bold; font-size: 16px; text-align: right; color: #164E2E;">₦${params.totalAmount.toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #64748B; line-height: 1.5;">
      <strong>Delivery Location:</strong> ${params.deliveryAddress}<br/>
      <strong>Rider Dispatch:</strong> A verified local bike rider will be assigned to pick up your items from the vendor stalls in Omoku/Egi.
    </p>
  `;

  const html = wrapPlatformEmailTemplate({
    badgeText: 'Order Placed in Escrow 🛡️',
    badgeBg: '#ECFDF5',
    badgeColor: '#065F46',
    title: `Order Confirmation #${params.orderReference}`,
    subtitle: `Your order is securely held in escrow until safe delivery.`,
    contentHtml,
    ctaText: 'Track Your Order',
    ctaUrl: `https://ogbamarketplace.com.ng/orders/${params.orderReference}`,
  });

  return sendPlatformEmail({
    to: [{ email: params.customerEmail, name: params.customerName }],
    subject: `Order Confirmation #${params.orderReference} - OGBA MARKET PLACE`,
    html,
    tags: ['order-confirmation'],
  });
}

/**
 * 4. Vendor KYC Status Email
 */
export async function sendVendorKYCStatusEmail(params: {
  vendorEmail: string;
  vendorName: string;
  businessName: string;
  status: 'verified' | 'rejected';
  reason?: string;
}) {
  const isApproved = params.status === 'verified';

  const contentHtml = `
    <p style="color: #4B5563; font-size: 14px; line-height: 1.5;">
      Hello <strong>${params.vendorName}</strong>,<br/>
      ${
        isApproved
          ? `Congratulations! Your vendor store <strong>${params.businessName}</strong> has been officially <strong>VERIFIED</strong> by the Ogba Market Place Administration.`
          : `Your KYC verification request for <strong>${params.businessName}</strong> was reviewed and could not be approved at this time.`
      }
    </p>

    ${
      isApproved
        ? `<div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 14px; margin: 16px 0; color: #065F46; font-size: 13px; line-height: 1.5;">
            <strong>Next Steps:</strong> You can now start adding products, managing stock, and accepting orders with automated escrow payouts!
          </div>`
        : `<div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 14px; margin: 16px 0; color: #991B1B; font-size: 13px; line-height: 1.5;">
            <strong>Reason / Required Update:</strong> ${params.reason || 'Please re-upload a clear copy of your valid government ID or Market Stall registration.'}
          </div>`
    }
  `;

  const html = wrapPlatformEmailTemplate({
    badgeText: isApproved ? 'KYC Approved ✅' : 'KYC Attention Required ⚠️',
    badgeBg: isApproved ? '#ECFDF5' : '#FEF2F2',
    badgeColor: isApproved ? '#065F46' : '#991B1B',
    title: isApproved ? 'Vendor Store Verified!' : 'KYC Verification Update',
    subtitle: params.businessName,
    contentHtml,
    ctaText: isApproved ? 'Go to Vendor Dashboard' : 'Update KYC Documents',
    ctaUrl: isApproved ? 'https://ogbamarketplace.com.ng/vendor' : 'https://ogbamarketplace.com.ng/vendor/kyc',
  });

  return sendPlatformEmail({
    to: [{ email: params.vendorEmail, name: params.vendorName }],
    subject: `KYC ${isApproved ? 'Approved ✅' : 'Update Required ⚠️'} - ${params.businessName}`,
    html,
    tags: ['kyc-status'],
  });
}

// =========================================================================
// CAMPAIGN & MARKETING BROADCAST TEMPLATES
// =========================================================================

export type CampaignEmailTemplateId =
  | 'multi_product_showcase'
  | 'hero_deal_grid'
  | 'flash_sale_flyer'
  | 'community_newsletter'
  | 'official_letterhead';

export interface CampaignProductDetails {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  url: string;
  vendorName?: string;
  vendorLocation?: string;
  category?: string;
  descriptionSnippet?: string;
}

export interface RenderCampaignEmailParams {
  campaignType: 'product_promotion' | 'marketing' | 'professional';
  templateId?: CampaignEmailTemplateId;
  headline: string;
  preheader?: string;
  bodyHtml: string;
  products?: CampaignProductDetails[];
  product?: CampaignProductDetails;
  ctaText?: string;
  ctaUrl?: string;
}

/**
 * Render single product card for email grids
 */
function renderProductCardHtml(
  p: CampaignProductDetails,
  styleVariant: 'standard' | 'flash' | 'hero' = 'standard'
): string {
  const hasDiscount = p.compareAtPrice && p.compareAtPrice > p.price;
  const discountPercent = hasDiscount
    ? Math.round(((p.compareAtPrice! - p.price) / p.compareAtPrice!) * 100)
    : null;

  const btnBg = styleVariant === 'flash' ? '#DC2626' : '#164E2E';
  const priceColor = styleVariant === 'flash' ? '#DC2626' : '#164E2E';
  const btnLabel = styleVariant === 'flash' ? 'Claim Deal &rarr;' : 'Order Now &rarr;';

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; height: 100%;">
      ${
        p.imageUrl
          ? `<tr>
              <td style="padding: 0; text-align: center; background-color: #F8FAFC;">
                <a href="${p.url}" target="_blank" style="text-decoration: none; display: block;">
                  <img src="${p.imageUrl}" alt="${p.title}" style="width: 100%; height: 140px; object-fit: cover; display: block; border-bottom: 1px solid #F1F5F9;" />
                </a>
              </td>
            </tr>`
          : ''
      }
      <tr>
        <td style="padding: 12px 14px; text-align: left;">
          ${
            p.category
              ? `<span style="display: inline-block; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 6px; border-radius: 4px; background-color: #F1F5F9; color: #475569; margin-bottom: 4px;">${p.category}</span>`
              : ''
          }
          <h4 style="margin: 2px 0 6px 0; font-size: 13px; font-weight: 800; color: #0F172A; line-height: 1.3; min-height: 34px;">
            <a href="${p.url}" target="_blank" style="color: #0F172A; text-decoration: none;">${p.title}</a>
          </h4>
          <div style="margin-bottom: 8px;">
            <span style="font-size: 15px; font-weight: 900; color: ${priceColor};">₦${p.price.toLocaleString()}</span>
            ${
              p.compareAtPrice && p.compareAtPrice > p.price
                ? `<span style="font-size: 11px; color: #94A3B8; text-decoration: line-through; margin-left: 4px;">₦${p.compareAtPrice.toLocaleString()}</span>`
                : ''
            }
            ${
              discountPercent
                ? `<span style="display: inline-block; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px; background-color: #DC2626; color: white; margin-left: 4px;">-${discountPercent}%</span>`
                : ''
            }
          </div>
          ${
            p.vendorName
              ? `<div style="font-size: 10px; color: #64748B; margin-bottom: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  By: <strong style="color: #334155;">${p.vendorName}</strong>
                </div>`
              : ''
          }
          <div style="text-align: center;">
            <a href="${p.url}" target="_blank" style="display: block; background-color: ${btnBg}; color: #FFFFFF; font-size: 11px; font-weight: 800; padding: 7px 12px; border-radius: 6px; text-decoration: none; text-align: center;">
              ${btnLabel}
            </a>
          </div>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Render multi-product 2-column responsive table grid
 */
function renderProductsGridHtml(
  products: CampaignProductDetails[],
  styleVariant: 'standard' | 'flash' = 'standard'
): string {
  if (!products || products.length === 0) return '';

  const rows: string[] = [];
  for (let i = 0; i < products.length; i += 2) {
    const p1 = products[i];
    const p2 = products[i + 1];

    if (p2) {
      rows.push(`
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 14px;">
          <tr>
            <td width="48%" valign="top">
              ${renderProductCardHtml(p1, styleVariant)}
            </td>
            <td width="4%"></td>
            <td width="48%" valign="top">
              ${renderProductCardHtml(p2, styleVariant)}
            </td>
          </tr>
        </table>
      `);
    } else {
      rows.push(`
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 14px;">
          <tr>
            <td width="48%" valign="top">
              ${renderProductCardHtml(p1, styleVariant)}
            </td>
            <td width="52%"></td>
          </tr>
        </table>
      `);
    }
  }

  return rows.join('');
}

/**
 * Render Spotlight / Hero Product banner
 */
function renderHeroProductHtml(p: CampaignProductDetails): string {
  const hasDiscount = p.compareAtPrice && p.compareAtPrice > p.price;
  const discountPercent = hasDiscount
    ? Math.round(((p.compareAtPrice! - p.price) / p.compareAtPrice!) * 100)
    : null;

  return `
    <div style="background-color: #F8FAFC; border: 2px solid #10B981; border-radius: 14px; overflow: hidden; margin: 20px 0 24px 0; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08);">
      <div style="background-color: #164E2E; color: #FFFFFF; padding: 8px 16px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
        🔥 Featured Spotlight Deal of the Week
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          ${
            p.imageUrl
              ? `<td width="160" valign="top" style="padding: 16px 0 16px 16px;">
                  <a href="${p.url}" target="_blank" style="text-decoration: none;">
                    <img src="${p.imageUrl}" alt="${p.title}" style="width: 150px; height: 150px; object-fit: cover; border-radius: 10px; border: 1px solid #CBD5E1; display: block;" />
                  </a>
                </td>`
              : ''
          }
          <td valign="top" style="padding: 16px 18px;">
            ${
              p.category
                ? `<span style="display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 8px; border-radius: 4px; background-color: #E2E8F0; color: #475569; margin-bottom: 6px;">${p.category}</span>`
                : ''
            }
            <h3 style="margin: 0 0 6px 0; font-size: 17px; font-weight: 900; color: #0F172A; line-height: 1.3;">
              <a href="${p.url}" target="_blank" style="color: #0F172A; text-decoration: none;">${p.title}</a>
            </h3>

            <div style="margin-bottom: 8px;">
              <span style="font-size: 20px; font-weight: 900; color: #164E2E;">₦${p.price.toLocaleString()}</span>
              ${
                p.compareAtPrice
                  ? `<span style="font-size: 13px; color: #94A3B8; text-decoration: line-through; margin-left: 8px;">₦${p.compareAtPrice.toLocaleString()}</span>`
                  : ''
              }
              ${
                discountPercent
                  ? `<span style="display: inline-block; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 4px; background-color: #DC2626; color: white; margin-left: 8px;">Save ${discountPercent}%</span>`
                  : ''
              }
            </div>

            ${
              p.vendorName
                ? `<div style="font-size: 11px; color: #64748B; margin-bottom: 8px;">
                    Merchant: <strong style="color: #1E293B;">${p.vendorName}</strong>
                    ${p.vendorLocation ? ` • <span>${p.vendorLocation}</span>` : ''}
                  </div>`
                : ''
            }

            ${
              p.descriptionSnippet
                ? `<p style="margin: 0 0 14px 0; font-size: 12px; color: #475569; line-height: 1.4;">${p.descriptionSnippet}</p>`
                : ''
            }

            <div>
              <a href="${p.url}" target="_blank" style="display: inline-block; background-color: #164E2E; color: #FFFFFF; font-size: 13px; font-weight: 800; padding: 10px 22px; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                View & Buy Spotlight Deal &rarr;
              </a>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Primary Campaign Email Renderer supporting multi-product & templates
 */
export function renderCampaignEmailHtml(params: RenderCampaignEmailParams): string {
  // Normalize products array
  const products: CampaignProductDetails[] = params.products && params.products.length > 0
    ? params.products
    : params.product
    ? [params.product]
    : [];

  // Determine effective template ID
  let templateId: CampaignEmailTemplateId = params.templateId || 'multi_product_showcase';
  if (!params.templateId) {
    if (params.campaignType === 'professional') {
      templateId = 'official_letterhead';
    } else if (params.campaignType === 'marketing') {
      templateId = 'flash_sale_flyer';
    } else {
      templateId = products.length > 1 ? 'multi_product_showcase' : 'hero_deal_grid';
    }
  }

  // --- TEMPLATE 1: MULTI-PRODUCT SHOWCASE GRID ---
  if (templateId === 'multi_product_showcase') {
    const productsGridHtml = renderProductsGridHtml(products, 'standard');

    const contentHtml = `
      <div style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        ${params.bodyHtml}
      </div>

      ${
        products.length > 0
          ? `
            <div style="margin: 24px 0 16px 0; border-top: 1px solid #E2E8F0; padding-top: 18px;">
              <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #164E2E; margin-bottom: 14px;">
                🛍️ Featured Marketplace Selection (${products.length} Items)
              </div>
              ${productsGridHtml}
            </div>
          `
          : ''
      }
    `;

    return wrapPlatformEmailTemplate({
      badgeText: '🛍️ Featured Marketplace Deals',
      badgeBg: '#ECFDF5',
      badgeColor: '#065F46',
      title: params.headline,
      subtitle: params.preheader,
      contentHtml,
      ctaText: params.ctaText || 'Browse All Products on Ogba Marketplace',
      ctaUrl: params.ctaUrl || 'https://ogbamarketplace.com.ng',
      footerNote: 'All orders on Ogba Market Place are backed by Paystack Escrow. Sellers get paid only after you safely receive your order.',
    });
  }

  // --- TEMPLATE 2: HERO DEAL + SUPPORTING GRID ---
  if (templateId === 'hero_deal_grid') {
    const heroProduct = products[0];
    const supportingProducts = products.slice(1);
    const heroHtml = heroProduct ? renderHeroProductHtml(heroProduct) : '';
    const supportingGridHtml = renderProductsGridHtml(supportingProducts, 'standard');

    const contentHtml = `
      <div style="font-size: 14px; line-height: 1.6; color: #334155;">
        ${params.bodyHtml}
      </div>

      ${heroHtml}

      ${
        supportingProducts.length > 0
          ? `
            <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #E2E8F0;">
              <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin-bottom: 14px;">
                More Handpicked Deals from Local Merchants
              </div>
              ${supportingGridHtml}
            </div>
          `
          : ''
      }
    `;

    return wrapPlatformEmailTemplate({
      badgeText: '⭐ Spotlight Deal & Community Offers',
      badgeBg: '#FEF3C7',
      badgeColor: '#92400E',
      title: params.headline,
      subtitle: params.preheader,
      contentHtml,
      ctaText: params.ctaText || (heroProduct ? 'Order Spotlight Deal Now' : 'Visit Marketplace'),
      ctaUrl: params.ctaUrl || (heroProduct ? heroProduct.url : 'https://ogbamarketplace.com.ng'),
      footerNote: 'Escrow protection guaranteed. 100% money back if goods delivered do not match description.',
    });
  }

  // --- TEMPLATE 3: FLASH SALE FLYER ---
  if (templateId === 'flash_sale_flyer') {
    const flashGridHtml = renderProductsGridHtml(products, 'flash');

    const contentHtml = `
      <div style="background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); color: #FFFFFF; border-radius: 12px; padding: 18px 20px; text-align: center; margin-bottom: 22px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.2);">
        <span style="display: inline-block; background-color: #FEF08A; color: #854D0E; font-size: 11px; font-weight: 900; padding: 3px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
          ⚡ LIMITED TIME FLASH DISCOUNTS
        </span>
        <h2 style="margin: 4px 0 6px 0; font-size: 20px; font-weight: 900; color: #FFFFFF;">${params.headline}</h2>
        <p style="margin: 0; font-size: 13px; color: #FECACA;">${params.preheader || 'Unbeatable prices on verified items in Omoku & Egi. While stocks last!'}</p>
      </div>

      <div style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        ${params.bodyHtml}
      </div>

      ${
        products.length > 0
          ? `
            <div style="margin: 20px 0 16px 0;">
              <div style="font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #DC2626; margin-bottom: 12px;">
                🔥 Flash Sale Items (${products.length} Discounted Deals)
              </div>
              ${flashGridHtml}
            </div>
          `
          : ''
      }

      <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 12px 16px; margin: 20px 0; font-size: 12px; color: #92400E; text-align: center;">
        ⏳ Flash sale promotional rates are set directly by verified merchants and are subject to immediate stock depletion.
      </div>
    `;

    return wrapPlatformEmailTemplate({
      badgeText: '🔥 Flash Sale Alert',
      badgeBg: '#FEF2F2',
      badgeColor: '#991B1B',
      title: params.headline,
      subtitle: params.preheader,
      contentHtml,
      ctaText: params.ctaText || 'Shop Flash Sale Before Stock Ends',
      ctaUrl: params.ctaUrl || 'https://ogbamarketplace.com.ng/deals',
      footerNote: 'All orders protected by Paystack Escrow. Safe local delivery to Omoku, Egi, and surrounding communities.',
    });
  }

  // --- TEMPLATE 4: COMMUNITY NEWSLETTER ---
  if (templateId === 'community_newsletter') {
    const productsGridHtml = renderProductsGridHtml(products, 'standard');

    const contentHtml = `
      <div style="border-bottom: 2px solid #164E2E; padding-bottom: 12px; margin-bottom: 18px;">
        <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #164E2E;">
          📰 COMMUNITY DISPATCH • OGBA MARKET DIGEST
        </span>
      </div>

      <div style="font-size: 14px; line-height: 1.7; color: #334155; margin-bottom: 24px;">
        ${params.bodyHtml}
      </div>

      ${
        products.length > 0
          ? `
            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin: 24px 0 16px 0;">
              <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0F172A; margin-bottom: 14px;">
                ⭐ Trending Picks & Community Favorites
              </div>
              ${productsGridHtml}
            </div>
          `
          : ''
      }
    `;

    return wrapPlatformEmailTemplate({
      badgeText: '📰 Community Newsletter',
      badgeBg: '#EFF6FF',
      badgeColor: '#1E40AF',
      title: params.headline,
      subtitle: params.preheader,
      contentHtml,
      ctaText: params.ctaText || 'Read More on Ogba Marketplace',
      ctaUrl: params.ctaUrl || 'https://ogbamarketplace.com.ng',
      footerNote: 'You received this community update because you are a registered member of Ogba Market Place.',
    });
  }

  // --- TEMPLATE 5: OFFICIAL LETTERHEAD / DIRECT NOTICE ---
  // (templateId === 'official_letterhead' or default)
  const contentHtml = `
    <div style="border-bottom: 2px solid #0F172A; padding-bottom: 14px; margin-bottom: 20px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td valign="top">
            <div style="font-size: 11px; font-weight: 900; letter-spacing: 1.5px; color: #164E2E; text-transform: uppercase;">
              OGBA MARKET PLACE INITIATIVE
            </div>
            <div style="font-size: 10px; color: #64748B; margin-top: 2px;">
              Central Commerce Registry • ONELGA Directorate
            </div>
          </td>
          <td align="right" valign="top" style="font-size: 11px; color: #64748B; font-family: monospace;">
            REF: OMP/ADM/${new Date().getFullYear()}<br/>
            DATE: ${new Date().toLocaleDateString('en-GB')}
          </td>
        </tr>
      </table>
    </div>

    <div style="background-color: #F8FAFC; border-left: 3px solid #164E2E; padding: 10px 14px; margin-bottom: 20px; font-size: 12px; color: #334155;">
      <strong>MEMORANDUM TO:</strong> Valued Community Members, Shoppers & Merchant Partners
    </div>

    <div style="font-size: 14px; line-height: 1.7; color: #334155;">
      ${params.bodyHtml}
    </div>

    ${
      products.length > 0
        ? `
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #CBD5E1;">
            <div style="font-size: 12px; font-weight: 800; color: #0F172A; text-transform: uppercase; margin-bottom: 12px;">
              Attached Reference Products (${products.length})
            </div>
            ${renderProductsGridHtml(products, 'standard')}
          </div>
        `
        : ''
    }

    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #CBD5E1;">
      <div style="font-size: 12px; font-weight: 800; color: #0F172A; text-transform: uppercase;">
        Office of Platform Operations & Verification
      </div>
      <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
        OGBA MARKET PLACE • Omoku, Rivers State, Nigeria
      </div>
      <div style="font-size: 10px; color: #94A3B8; margin-top: 6px;">
        Official Digital Communication • All Platform Escrow & Buyer Protection Terms Apply
      </div>
    </div>
  `;

  return wrapPlatformEmailTemplate({
    badgeText: '🏛️ Official Platform Notice',
    badgeBg: '#F1F5F9',
    badgeColor: '#1E293B',
    title: params.headline,
    subtitle: params.preheader,
    contentHtml,
    ctaText: params.ctaText,
    ctaUrl: params.ctaUrl,
  });
}

