import { detectImageFormat } from '../format-detection/detector';
import { ImageFileDetails, SupportedImageFormat } from '@/types/image';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB safety limit

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: ImageFileDetails;
}

export async function validateAndLoadImage(file: File | Blob, originalFileName?: string): Promise<ValidationResult> {
  // 1. Check size
  if (!file || file.size === 0) {
    return {
      valid: false,
      error: 'The selected file is empty (0 bytes). Please choose a valid image file.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'The file exceeds the 50 MB safety limit. Please select a smaller image.',
    };
  }

  // 2. Format detection via magic bytes
  const { format, mimeType } = await detectImageFormat(file);

  if (format === 'unknown') {
    return {
      valid: false,
      error: `Unsupported or invalid file format (${file.type || 'unknown'}). Supported formats are JPEG, PNG, and WebP.`,
    };
  }

  // 3. Decode verification & Dimension extraction
  try {
    const dimensions = await extractDimensionsAndAlpha(file);
    const fileName = (file instanceof File ? file.name : originalFileName) || `image.${format === 'jpeg' ? 'jpg' : format}`;
    const previewUrl = URL.createObjectURL(file);

    const details: ImageFileDetails = {
      file,
      name: fileName,
      size: file.size,
      width: dimensions.width,
      height: dimensions.height,
      format,
      mimeType: mimeType as SupportedImageFormat,
      previewUrl,
      hasAlpha: dimensions.hasAlpha,
    };

    return {
      valid: true,
      details,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Unable to decode image: ${err?.message || 'The image data may be corrupted or unreadable.'}`,
    };
  }
}

async function extractDimensionsAndAlpha(
  blob: Blob
): Promise<{ width: number; height: number; hasAlpha: boolean }> {
  // Attempt with createImageBitmap first
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
      const width = bitmap.width;
      const height = bitmap.height;

      let hasAlpha = false;
      // Sample alpha if format could contain transparency
      try {
        hasAlpha = checkBitmapAlpha(bitmap, width, height);
      } catch (e) {
        // Fallback or ignore
      } finally {
        bitmap.close();
      }

      return { width, height, hasAlpha };
    } catch {
      // Fallback to HTMLImageElement
    }
  }

  // HTMLImageElement fallback
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      let hasAlpha = false;
      try {
        hasAlpha = checkImageElementAlpha(img, width, height);
      } catch (e) {
        // Ignore
      }
      URL.revokeObjectURL(url);
      resolve({ width, height, hasAlpha });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Corrupted or unreadable image file.'));
    };
    img.src = url;
  });
}

function checkBitmapAlpha(bitmap: ImageBitmap, width: number, height: number): boolean {
  // Sample on a smaller offscreen canvas for performance
  const sampleW = Math.min(width, 100);
  const sampleH = Math.min(height, 100);
  const canvas = document.createElement('canvas');
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;

  ctx.drawImage(bitmap, 0, 0, sampleW, sampleH);
  const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;
  // Check every 4th byte (alpha)
  for (let i = 3; i < imgData.length; i += 4) {
    if (imgData[i] < 250) {
      return true;
    }
  }
  return false;
}

function checkImageElementAlpha(img: HTMLImageElement, width: number, height: number): boolean {
  const sampleW = Math.min(width, 100);
  const sampleH = Math.min(height, 100);
  const canvas = document.createElement('canvas');
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;

  ctx.drawImage(img, 0, 0, sampleW, sampleH);
  const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;
  for (let i = 3; i < imgData.length; i += 4) {
    if (imgData[i] < 250) {
      return true;
    }
  }
  return false;
}

