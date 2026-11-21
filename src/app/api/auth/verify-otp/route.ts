import { NextResponse } from 'next/server';
import { cacheGet, cacheDel } from '@/lib/redis';

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
    const { phoneNumber, email, code } = await req.json();

    if ((!phoneNumber && !email) || !code) {
      return NextResponse.json(
        { success: false, message: 'Phone number or email and verification code are required' },
        { status: 400 }
      );
    }

    const normalizedPhone = phoneNumber ? normalizeNigerianPhone(phoneNumber) : '';
    const targetEmail = email ? email.trim().toLowerCase() : '';
    const key = normalizedPhone || targetEmail;
    const trimmed = String(code).trim();

    if (!/^\d{6}$/.test(trimmed)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid 6-digit verification code' },
        { status: 400 }
      );
    }

    const stored = await cacheGet<{ code: string; expiresAt: number }>(`otp:${key}`);

    if (!stored) {
      return NextResponse.json(
        { success: false, message: 'Verification code has expired or was not requested. Please request a new code.' },
        { status: 400 }
      );
    }

    if (Date.now() > stored.expiresAt) {
      await cacheDel(`otp:${key}`);
      return NextResponse.json(
        { success: false, message: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    if (stored.code !== trimmed) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification code. Please check and try again.' },
        { status: 400 }
      );
    }

    await cacheDel(`otp:${key}`);
    return NextResponse.json({ success: true, message: 'Verification successful' });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ success: false, message: 'Verification error' }, { status: 500 });
  }
}
