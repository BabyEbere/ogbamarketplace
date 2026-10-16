import { NextRequest, NextResponse } from 'next/server';
import { uploadBufferToR2 } from '@/lib/r2';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'brands';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided in form data' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call Cloudflare R2 upload helper
    const result = await uploadBufferToR2({
      buffer,
      fileName: file.name,
      contentType: file.type || 'image/webp',
      folder,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: 'Please check your Cloudflare R2 credentials in Control-OMP Settings -> Cloudflare R2 Storage.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
      size: buffer.length,
    });
  } catch (error: any) {
    console.error('API /api/upload/r2 Exception:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Server error while uploading image to Cloudflare R2',
      },
      { status: 500 }
    );
  }
}
