import { NextRequest, NextResponse } from 'next/server';
import { trackUserHeartbeat } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || 'anon_' + Math.random().toString(36).substring(2, 9);
    const role = body.role || 'buyer';
    const platform = body.platform || 'web';

    await trackUserHeartbeat(userId, role, platform);

    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Telemetry track failed' }, { status: 500 });
  }
}
