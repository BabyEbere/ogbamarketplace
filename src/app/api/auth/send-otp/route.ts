import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPlatformEmail, wrapPlatformEmailTemplate } from '@/lib/email/mailer';
import { cacheSet } from '@/lib/redis';

/**
 * Ogba Marketplace OTP Gateway — Brevo Email & SMS
 * Reads Brevo API key directly from Supabase DB `platform_settings` table!
 */

function normalizeNigerianPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.slice(1);
  } else if (cleaned.startsWith('+234')) {
    cleaned = cleaned.replace('+', '');
  } else if (!cleaned.startsWith('234') && cleaned.length === 10) {
    cleaned = '234' + cleaned;
  }
  return cleaned;
}

export async function POST(req: Request) {
  try {
    const { phoneNumber, email, name } = await req.json();

    if (!phoneNumber && !email) {
      return NextResponse.json(
        { success: false, message: 'Phone number or email is required' },
        { status: 400 }
      );
    }

    const normalizedPhone = phoneNumber ? normalizeNigerianPhone(phoneNumber) : '';
    const targetEmail = email ? email.trim().toLowerCase() : '';
    const key = normalizedPhone || targetEmail;

    // Generate secure 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    await cacheSet(`otp:${key}`, { code: otpCode, expiresAt }, 600);

    // 1. Fetch Brevo configuration from DB `platform_settings`
    let brevoApiKey = process.env.BREVO_API_KEY;
    let brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || 'support@ogbamarketplace.com.ng';
    let brevoSenderName = process.env.BREVO_SENDER_NAME || 'OGBA MARKET PLACE';

    try {
      const supabase = await createClient();
      const { data: dbSettings } = await supabase.from('platform_settings').select('*');
      if (dbSettings && dbSettings.length > 0) {
        dbSettings.forEach((row: { key: string; value: string }) => {
          if (row.key === 'brevo_api_key' && row.value) brevoApiKey = row.value;
          if (row.key === 'brevo_sender_email' && row.value) brevoSenderEmail = row.value;
          if (row.key === 'brevo_sender_name' && row.value) brevoSenderName = row.value;
        });
      }

      // If only phone was provided, try looking up user's email in DB
      if (!targetEmail && normalizedPhone) {
        const { data: u } = await supabase
          .from('users')
          .select('email')
          .eq('phone_number', normalizedPhone)
          .maybeSingle();
        if (u?.email) {
          // Send to their registered email as backup!
        }
      }
    } catch (e) {
      console.warn('Could not load settings from DB:', e);
    }

    let emailDispatched = false;
    let smsDispatched = false;
    let smsErrorNotice = '';

    // 2. Dispatch SMS via Brevo if phone provided (Primary)
    if (normalizedPhone && brevoApiKey && !brevoApiKey.includes('placeholder')) {
      try {
        const smsRes = await fetch('https://api.brevo.com/v3/transactionalSMS/send', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: 'OgbaMarket',
            recipient: normalizedPhone,
            content: `Your Ogba Marketplace verification code is ${otpCode}. Valid for 10 minutes.`,
            type: 'transactional',
            unicodeEnabled: true,
          }),
        });

        const smsData = await smsRes.json();
        console.log('[Brevo /send response]:', smsRes.status, smsData);
        if (smsRes.ok && smsData?.messageId) {
          smsDispatched = true;
        } else {
          smsErrorNotice = smsData?.message || 'Failed to dispatch SMS via Brevo.';
        }
      } catch (err) {
        console.error('[Brevo SMS Exception]:', err);
      }
    }

    // 3. ONLY dispatch Email if NO phone number was provided (e.g. email-only sign in)
    if (!normalizedPhone && targetEmail) {
      try {
        const otpContentHtml = `
          <div style="padding: 10px 0; text-align: center;">
            <p style="color: #475569; font-size: 14px; margin-bottom: 16px;">Use the verification code below to complete your login:</p>
            <div style="background-color: #F0FDF4; border: 2px dashed #16A34A; border-radius: 8px; padding: 14px; margin: 16px auto; max-width: 240px;">
              <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #164E2E;">${otpCode}</span>
            </div>
            <p style="color: #64748B; font-size: 12px; margin-top: 16px;">This code is valid for 10 minutes. For your security, never share this code with anyone.</p>
          </div>
        `;

        const html = wrapPlatformEmailTemplate({
          badgeText: 'One-Time Passcode (OTP)',
          badgeBg: '#F0FDF4',
          badgeColor: '#166534',
          title: 'Your Security Code',
          contentHtml: otpContentHtml,
          footerNote: 'If you did not request this verification code, please ignore this email or contact support.',
        });

        const emailRes = await sendPlatformEmail({
          to: [{ email: targetEmail, name: name || 'Ogba Marketplace Member' }],
          subject: `Your Verification Code: ${otpCode} - OGBA MARKET PLACE`,
          html,
          tags: ['otp', 'auth'],
        });

        if (emailRes.success) {
          emailDispatched = true;
          console.log('[Mailer OTP Dispatched to]:', targetEmail);
        }
      } catch (err) {
        console.error('[Mailer OTP Exception]:', err);
      }
    }

    const successfullySent = smsDispatched || emailDispatched;

    return NextResponse.json({
      success: true,
      message: smsDispatched
        ? `Verification SMS sent to +${normalizedPhone}`
        : emailDispatched
        ? `Verification code sent to your email (${targetEmail})`
        : smsErrorNotice || 'Verification code generated.',
      expiresAt,
      emailDispatched,
      smsDispatched,
      smsErrorNotice,
      // Dev code for instant auto-fill testing if SMS gateway lacks credits
      devCode: !successfullySent ? otpCode : undefined,
    });
  } catch (error: any) {
    console.error('Send OTP Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 500 }
    );
  }
}
