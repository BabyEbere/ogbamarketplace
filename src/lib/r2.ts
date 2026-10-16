import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getPlatformSettingsAction } from '@/actions/settings';

/**
 * Creates and returns an S3Client configured for Cloudflare R2
 */
export async function getR2Config() {
  const settings = await getPlatformSettingsAction();
  return {
    accountId: settings.r2AccountId,
    accessKeyId: settings.r2AccessKeyId,
    secretAccessKey: settings.r2SecretAccessKey,
    bucketName: settings.r2BucketName || 'ogbamarketplace',
    publicDomain: settings.r2PublicDomain,
  };
}

export async function createR2Client() {
  const config = await getR2Config();
  if (!config.accountId || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error('Cloudflare R2 credentials (Account ID, Access Key ID, or Secret Access Key) are not configured in Admin Settings.');
  }

  return {
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }),
    bucketName: config.bucketName,
    publicDomain: config.publicDomain,
    accountId: config.accountId,
  };
}

/**
 * Upload a file buffer or uint8array to Cloudflare R2
 */
export async function uploadBufferToR2({
  buffer,
  fileName,
  contentType,
  folder = 'brands',
}: {
  buffer: Buffer | Uint8Array;
  fileName: string;
  contentType: string;
  folder?: string;
}): Promise<{ success: boolean; url?: string; key?: string; error?: string }> {
  try {
    const { client, bucketName, publicDomain, accountId } = await createR2Client();

    // Clean filename and ensure uniqueness
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const key = `${folder}/${timestamp}-${cleanFileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await client.send(command);

    // Build public URL
    let publicUrl = '';
    if (publicDomain && publicDomain.trim().length > 0) {
      const base = publicDomain.trim().replace(/\/+$/, '');
      publicUrl = `${base.startsWith('http') ? base : `https://${base}`}/${key}`;
    } else {
      // Fallback default Cloudflare R2 public URL format or dev domain
      publicUrl = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;
    }

    return {
      success: true,
      url: publicUrl,
      key,
    };
  } catch (err: any) {
    console.error('Cloudflare R2 Upload Error:', err);
    return {
      success: false,
      error: err.message || 'Failed to upload file to Cloudflare R2.',
    };
  }
}
