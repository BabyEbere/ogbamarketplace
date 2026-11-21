import { NextResponse } from 'next/server';
import { verifyPaystackReference } from '@/lib/paystack';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.json({ success: false, message: 'Reference is required' }, { status: 400 });
  }

  const result = await verifyPaystackReference(reference);
  return NextResponse.json(result);
}

