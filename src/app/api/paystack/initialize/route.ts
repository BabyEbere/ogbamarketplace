import { NextResponse } from 'next/server';
import { getPaystackSecretKey } from '@/lib/paystack';

export async function POST(req: Request) {
  try {
    const { email, amountNaira, reference, callbackUrl, metadata } = await req.json();

    if (!amountNaira || amountNaira <= 0) {
      return NextResponse.json({ success: false, message: 'Valid amount is required' }, { status: 400 });
    }

    const secretKey = await getPaystackSecretKey();
    if (!secretKey || secretKey.includes('placeholder') || secretKey.includes('your_')) {
      return NextResponse.json({
        success: false,
        configured: false,
        message: 'Paystack live key is not configured yet.',
      });
    }

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email || 'customer@ogbamarketplace.com.ng',
        amount: Math.round(Number(amountNaira) * 100), // Paystack expects kobo
        reference,
        callback_url: callbackUrl,
        metadata,
      }),
    });

    const data = await res.json();
    if (res.ok && data.status && data.data?.authorization_url) {
      return NextResponse.json({
        success: true,
        configured: true,
        authorizationUrl: data.data.authorization_url,
        reference: data.data.reference,
      });
    }

    return NextResponse.json({
      success: false,
      configured: true,
      message: data.message || 'Could not initialize Paystack payment.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Paystack initialization error.' },
      { status: 500 }
    );
  }
}

