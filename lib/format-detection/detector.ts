export async function detectImageFormat(
  fileOrBlob: Blob
): Promise<{ format: 'jpeg' | 'png' | 'webp' | 'unknown'; mimeType: string }> {
  try {
    const buffer = await fileOrBlob.slice(0, 16).arrayBuffer();
    const arr = new Uint8Array(buffer);

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      arr[0] === 0x89 &&
      arr[1] === 0x50 &&
      arr[2] === 0x4e &&
      arr[3] === 0x47 &&
      arr[4] === 0x0d &&
      arr[5] === 0x0a &&
      arr[6] === 0x1a &&
      arr[7] === 0x0a
    ) {
      return { format: 'png', mimeType: 'image/png' };
    }

    // JPEG: FF D8 FF
    if (arr[0] === 0xff && arr[1] === 0xd8 && arr[2] === 0xff) {
      return { format: 'jpeg', mimeType: 'image/jpeg' };
    }

    // WebP: RIFF ... WEBP
    if (
      arr[0] === 0x52 && // R
      arr[1] === 0x49 && // I
      arr[2] === 0x46 && // F
      arr[3] === 0x46 && // F
      arr[8] === 0x57 && // W
      arr[9] === 0x45 && // E
      arr[10] === 0x42 && // B
      arr[11] === 0x50 // P
    ) {
      return { format: 'webp', mimeType: 'image/webp' };
    }
  } catch (err) {
    console.warn('Failed to read magic bytes for image format detection:', err);
  }

  // Fallback to mimeType if provided
  if (fileOrBlob.type === 'image/jpeg' || fileOrBlob.type === 'image/jpg') {
    return { format: 'jpeg', mimeType: 'image/jpeg' };
  }
  if (fileOrBlob.type === 'image/png') {
    return { format: 'png', mimeType: 'image/png' };
  }
  if (fileOrBlob.type === 'image/webp') {
    return { format: 'webp', mimeType: 'image/webp' };
  }

  return { format: 'unknown', mimeType: fileOrBlob.type || 'unknown' };
}

