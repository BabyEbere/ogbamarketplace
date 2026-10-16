/**
 * Browser-side Image Optimizer for Brand Logos and Media
 * Resizes images and converts them to optimized WebP format to minimize disk & bandwidth usage.
 */

export interface OptimizedImageResult {
  file: File;
  originalSize: number;
  optimizedSize: number;
  savingsPercent: number;
  previewUrl: string;
}

export async function optimizeBrandLogo(
  file: File,
  maxDimension = 400,
  quality = 0.82
): Promise<OptimizedImageResult> {
  const originalSize = file.size;

  // If already an SVG, SVGs are lightweight vector graphics
  if (file.type === 'image/svg+xml') {
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      savingsPercent: 0,
      previewUrl: URL.createObjectURL(file),
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calculate constrained dimensions preserving aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not supported'));
        return;
      }

      // Smooth resizing algorithm
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Export as modern WebP
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image to WebP'));
            return;
          }

          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const optimizedFileName = `${baseName}.webp`;

          const optimizedFile = new File([blob], optimizedFileName, {
            type: 'image/webp',
            lastModified: Date.now(),
          });

          const optimizedSize = optimizedFile.size;
          const savingsPercent = Math.max(
            0,
            Math.round(((originalSize - optimizedSize) / originalSize) * 100)
          );

          resolve({
            file: optimizedFile,
            originalSize,
            optimizedSize,
            savingsPercent,
            previewUrl: URL.createObjectURL(optimizedFile),
          });
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for optimization'));
    };

    img.src = objectUrl;
  });
}

/**
 * Utility to format byte sizes into readable KB / MB
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
