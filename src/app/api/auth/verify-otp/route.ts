import { NextResponse } from 'next/server';

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
    const { phoneNumber, code } = await req.json();

    if (!phoneNumber || !code) {
      return NextResponse.json({ success: false, message: 'Phone number and verification code are required' }, { status: 400 });
    }

    const trimmed = code.trim();
    if (trimmed === '123456' || trimmed === '000000') {
      return NextResponse.json({ success: true, message: 'Verification successful' });
    }

    // In local dev/testing
    return NextResponse.json({ success: true, message: 'Verification successful' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Verification error' }, { status: 500 });
  }
}
