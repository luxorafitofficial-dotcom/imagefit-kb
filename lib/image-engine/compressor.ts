import {
  CompressionCandidate,
  CompressionResultData,
  CompressionSettings,
  ImageFileDetails,
  SupportedImageFormat,
} from '@/types/image';

export interface ProgressCallbackData {
  stage: string;
  iteration: number;
  currentSize: number;
  currentQuality: number;
  currentScale: number;
}

export type ProgressCallback = (progress: ProgressCallbackData) => void;

interface CandidateAttempt {
  blob: Blob;
  size: number;
  width: number;
  height: number;
  quality: number;
  scale: number;
  mimeType: SupportedImageFormat;
}

export async function compressImage(
  imageDetails: ImageFileDetails,
  settings: CompressionSettings,
  onProgress?: ProgressCallback,
  abortSignal?: AbortSignal
): Promise<CompressionResultData> {
  const startTime = performance.now();
  const targetBytes = settings.targetKB * 1024;
  const notes: string[] = [];

  // Step 1: Decode source image
  const sourceImage = await loadDecodedImage(imageDetails.file);
  const origWidth = imageDetails.width;
  const origHeight = imageDetails.height;

  // Step 2: Determine output format
  let chosenFormat: SupportedImageFormat;
  if (settings.outputFormat === 'auto') {
    if (imageDetails.hasAlpha) {
      // Check if WebP is supported and preserves transparency
      chosenFormat = 'image/webp';
      notes.push('Detected transparency: WebP selected to preserve alpha channel with modern compression.');
    } else {
      chosenFormat = 'image/webp';
      notes.push('Auto format selected WebP for optimal compression efficiency.');
    }
  } else {
    chosenFormat = settings.outputFormat;
    if (chosenFormat === 'image/jpeg' && imageDetails.hasAlpha) {
      notes.push('Warning: JPEG does not support transparency. Transparent areas will render with a solid white background.');
    }
  }

  // Step 3: Handle PNG vs Lossy (JPEG / WebP)
  let bestCandidate: CandidateAttempt | null = null;
  let iterations = 0;

  if (chosenFormat === 'image/png') {
    // Lossless PNG handling
    const result = await processPngCandidate(
      sourceImage,
      origWidth,
      origHeight,
      targetBytes,
      settings.allowDimensionReduction,
      (data) => {
        iterations++;
        onProgress?.({ ...data, iteration: iterations });
      },
      abortSignal
    );

    bestCandidate = result.candidate;
    iterations = result.iterations;
    notes.push(...result.notes);
  } else {
    // Lossy (JPEG / WebP) bounded quality search
    const result = await processLossyCandidate(
      sourceImage,
      origWidth,
      origHeight,
      chosenFormat,
      targetBytes,
      settings.allowDimensionReduction,
      (data) => {
        iterations++;
        onProgress?.({ ...data, iteration: iterations });
      },
      abortSignal
    );

    bestCandidate = result.candidate;
    iterations = result.iterations;
    notes.push(...result.notes);
  }

  // Check cancellation
  if (abortSignal?.aborted) {
    throw new Error('Compression operation was cancelled by the user.');
  }

  if (!bestCandidate) {
    throw new Error('Failed to generate any valid compression candidate.');
  }

  // Step 4: Validate output blob
  const isValidDecodable = await verifyBlobValidity(bestCandidate.blob);
  if (!isValidDecodable) {
    throw new Error('Output validation failed: generated image blob cannot be decoded.');
  }

  const durationMs = Math.round(performance.now() - startTime);
  const passed = bestCandidate.size <= targetBytes;
  const reductionPercentage = Math.max(
    0,
    ((imageDetails.size - bestCandidate.size) / imageDetails.size) * 100
  );

  let errorReason: string | undefined;
  let suggestedAction: string | undefined;

  if (!passed) {
    if (!settings.allowDimensionReduction) {
      errorReason = `Output size (${(bestCandidate.size / 1024).toFixed(1)} KB) exceeds the maximum target of ${settings.targetKB} KB at original dimensions (${origWidth} × ${origHeight}px).`;
      suggestedAction = "Enable 'Allow automatic dimension reduction' or choose a higher target size.";
    } else {
      errorReason = `Target of ${settings.targetKB} KB is too restrictive even after progressive dimension and quality reduction.`;
      suggestedAction = 'Increase the target size in KB.';
    }
  }

  // Generate downloadable preview URL
  const previewUrl = URL.createObjectURL(bestCandidate.blob);

  // Formulate filename
  const baseName = imageDetails.name.substring(0, imageDetails.name.lastIndexOf('.')) || imageDetails.name;
  const ext = chosenFormat === 'image/jpeg' ? 'jpg' : chosenFormat === 'image/png' ? 'png' : 'webp';
  const downloadName = `${baseName}_${Math.round(bestCandidate.size / 1024)}KB.${ext}`;

  const candidateData: CompressionCandidate = {
    blob: bestCandidate.blob,
    size: bestCandidate.size,
    width: bestCandidate.width,
    height: bestCandidate.height,
    mimeType: chosenFormat,
    quality: bestCandidate.quality,
    scale: bestCandidate.scale,
    iterations,
    durationMs,
  };

  return {
    original: imageDetails,
    compressed: candidateData,
    passed,
    targetKB: settings.targetKB,
    targetBytes,
    reductionPercentage,
    notes,
    previewUrl,
    downloadName,
    errorReason,
    suggestedAction,
  };
}

/**
 * Lossy compression (JPEG, WebP) with bounded binary search on quality
 * and optional progressive dimension downscaling if needed.
 */
async function processLossyCandidate(
  sourceImage: ImageBitmap | HTMLImageElement,
  origWidth: number,
  origHeight: number,
  format: SupportedImageFormat,
  targetBytes: number,
  allowDimensionReduction: boolean,
  onProgress: ProgressCallback,
  abortSignal?: AbortSignal
): Promise<{ candidate: CandidateAttempt; iterations: number; notes: string[] }> {
  const notes: string[] = [];
  let totalIterations = 0;

  // Progressive scales to test if dimension reduction is enabled
  const scales = allowDimensionReduction
    ? [1.0, 0.85, 0.7, 0.55, 0.4, 0.3, 0.2, 0.15]
    : [1.0];

  let bestUnderTarget: CandidateAttempt | null = null;
  let absoluteLowestSizeCandidate: CandidateAttempt | null = null;

  for (const scale of scales) {
    if (abortSignal?.aborted) throw new Error('Operation cancelled.');

    const targetWidth = Math.max(16, Math.round(origWidth * scale));
    const targetHeight = Math.max(16, Math.round(origHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to create canvas 2D context.');

    // If JPEG, fill background with white (since JPEG has no alpha)
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    // High quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceImage, 0, 0, targetWidth, targetHeight);

    // Test quality bounds: [minQuality, maxQuality]
    let lowQ = 0.05;
    let highQ = 0.95;
    const maxQualityIterations = 7;

    let scaleBestUnder: CandidateAttempt | null = null;

    for (let iter = 0; iter < maxQualityIterations; iter++) {
      if (abortSignal?.aborted) throw new Error('Operation cancelled.');

      const currentQ = Number(((lowQ + highQ) / 2).toFixed(3));
      const blob = await canvasToBlob(canvas, format, currentQ);
      totalIterations++;

      const attempt: CandidateAttempt = {
        blob,
        size: blob.size,
        width: targetWidth,
        height: targetHeight,
        quality: currentQ,
        scale,
        mimeType: format,
      };

      if (!absoluteLowestSizeCandidate || attempt.size < absoluteLowestSizeCandidate.size) {
        absoluteLowestSizeCandidate = attempt;
      }

      onProgress({
        stage: `Evaluating quality ${(currentQ * 100).toFixed(0)}% at ${scale * 100}% scale`,
        iteration: totalIterations,
        currentSize: attempt.size,
        currentQuality: currentQ,
        currentScale: scale,
      });

      if (attempt.size <= targetBytes) {
        scaleBestUnder = attempt;
        // Try higher quality to get closer to the target without exceeding it
        lowQ = currentQ;
      } else {
        // Exceeded target, try lower quality
        highQ = currentQ;
      }

      // If quality interval is sufficiently narrow, break early
      if (highQ - lowQ < 0.04) {
        break;
      }
    }

    if (scaleBestUnder) {
      bestUnderTarget = scaleBestUnder;
      if (scale < 1.0) {
        notes.push(
          `Target achieved by reducing dimensions to ${targetWidth} × ${targetHeight}px (${Math.round(scale * 100)}% of original).`
        );
      }
      // Target met within this scale
      break;
    } else {
      if (!allowDimensionReduction) {
        notes.push(
          `At original dimensions (${origWidth} × ${origHeight}px), lowest quality achieved ${((absoluteLowestSizeCandidate?.size || 0) / 1024).toFixed(1)} KB, which exceeds target.`
        );
        break; // Do not check other scales since dimension reduction is OFF
      }
    }
  }

  const chosenCandidate = bestUnderTarget || absoluteLowestSizeCandidate!;
  return {
    candidate: chosenCandidate,
    iterations: totalIterations,
    notes,
  };
}

/**
 * Lossless PNG handling
 */
async function processPngCandidate(
  sourceImage: ImageBitmap | HTMLImageElement,
  origWidth: number,
  origHeight: number,
  targetBytes: number,
  allowDimensionReduction: boolean,
  onProgress: ProgressCallback,
  abortSignal?: AbortSignal
): Promise<{ candidate: CandidateAttempt; iterations: number; notes: string[] }> {
  const notes: string[] = [];
  let iterations = 0;

  const scales = allowDimensionReduction
    ? [1.0, 0.85, 0.7, 0.55, 0.4, 0.3, 0.2, 0.15]
    : [1.0];

  let bestCandidate: CandidateAttempt | null = null;

  for (const scale of scales) {
    if (abortSignal?.aborted) throw new Error('Operation cancelled.');

    const targetWidth = Math.max(16, Math.round(origWidth * scale));
    const targetHeight = Math.max(16, Math.round(origHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to create canvas 2D context.');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceImage, 0, 0, targetWidth, targetHeight);

    const blob = await canvasToBlob(canvas, 'image/png');
    iterations++;

    const attempt: CandidateAttempt = {
      blob,
      size: blob.size,
      width: targetWidth,
      height: targetHeight,
      quality: 1.0,
      scale,
      mimeType: 'image/png',
    };

    onProgress({
      stage: `Rendering PNG at ${scale * 100}% scale`,
      iteration: iterations,
      currentSize: attempt.size,
      currentQuality: 1.0,
      currentScale: scale,
    });

    if (!bestCandidate || attempt.size < bestCandidate.size) {
      bestCandidate = attempt;
    }

    if (attempt.size <= targetBytes) {
      bestCandidate = attempt;
      if (scale < 1.0) {
        notes.push(
          `Target achieved by reducing PNG dimensions to ${targetWidth} × ${targetHeight}px.`
        );
      }
      break;
    }

    if (!allowDimensionReduction) {
      notes.push(
        'PNG is a lossless format and browser canvas cannot compress pixels further without dimension reduction. Consider selecting WebP to maintain transparency with lossy compression.'
      );
      break;
    }
  }

  return {
    candidate: bestCandidate!,
    iterations,
    notes,
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error(`Browser failed to generate Blob for format ${format}.`));
        }
      },
      format,
      quality
    );
  });
}

async function loadDecodedImage(fileOrBlob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      return await createImageBitmap(fileOrBlob, { imageOrientation: 'from-image' });
    } catch {
      // Fallback to HTMLImageElement
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode source image.'));
    };
    img.src = url;
  });
}

export async function verifyBlobValidity(blob: Blob): Promise<boolean> {
  if (!blob || blob.size === 0) return false;
  try {
    if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
      const bmp = await createImageBitmap(blob);
      const ok = bmp.width > 0 && bmp.height > 0;
      bmp.close();
      return ok;
    }
  } catch {
    // Fallback
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const ok = (img.naturalWidth || img.width) > 0;
      URL.revokeObjectURL(url);
      resolve(ok);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    img.src = url;
  });
}

