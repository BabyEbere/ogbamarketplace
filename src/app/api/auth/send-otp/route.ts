import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Ogba Marketplace OTP Gateway — Brevo Email & SMS
 * Reads Brevo API key directly from Supabase DB `platform_settings` table!
 */

const globalOtpStore: Record<string, { code: string; expiresAt: number }> = {};

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

export { globalOtpStore };

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

    globalOtpStore[key] = { code: otpCode, expiresAt };

    // 1. Fetch Brevo configuration from DB `platform_settings`
    let brevoApiKey = process.env.BREVO_API_KEY;
    let brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || 'support@ogbamarketplace.com';
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
    if (!normalizedPhone && targetEmail && brevoApiKey && !brevoApiKey.includes('placeholder')) {
      try {
        const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: brevoSenderName, email: brevoSenderEmail },
            to: [{ email: targetEmail, name: name || 'Ogba Marketplace Member' }],
            subject: `Your Verification Code: ${otpCode} - OGBA MARKET PLACE`,
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px;">
                <div style="background-color: #164E2E; padding: 14px; border-radius: 8px; text-align: center; color: white;">
                  <h2 style="margin: 0; font-size: 20px;">OGBA MARKET PLACE</h2>
                </div>
                <div style="padding: 20px 0; text-align: center;">
                  <p style="color: #475569; font-size: 14px;">Your verification code is:</p>
                  <div style="background-color: #F0FDF4; border: 2px dashed #16A34A; border-radius: 8px; padding: 12px; margin: 16px 0;">
                    <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #164E2E;">${otpCode}</span>
                  </div>
                  <p style="color: #64748B; font-size: 12px;">This code expires in 10 minutes. Do not share with anyone.</p>
                </div>
              </div>
            `,
          }),
        });

        if (emailRes.ok) {
          emailDispatched = true;
          console.log('[Brevo Email Dispatched to]:', targetEmail);
        }
      } catch (err) {
        console.error('[Brevo Email Exception]:', err);
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
