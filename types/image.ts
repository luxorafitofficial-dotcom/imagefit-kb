export type SupportedImageFormat = 'image/jpeg' | 'image/png' | 'image/webp';
export type OutputFormatOption = 'auto' | SupportedImageFormat;

export interface ImageFileDetails {
  file: File | Blob;
  name: string;
  size: number; // in bytes
  width: number;
  height: number;
  format: 'jpeg' | 'png' | 'webp' | 'unknown';
  mimeType: string;
  previewUrl: string;
  hasAlpha?: boolean;
}

export interface CompressionSettings {
  targetKB: number;
  outputFormat: OutputFormatOption;
  allowDimensionReduction: boolean;
  minQuality?: number;
  maxQuality?: number;
}

export interface CompressionCandidate {
  blob: Blob;
  size: number; // in bytes
  width: number;
  height: number;
  mimeType: SupportedImageFormat;
  quality: number;
  scale: number;
  iterations: number;
  durationMs: number;
}

export interface CompressionResultData {
  original: ImageFileDetails;
  compressed: CompressionCandidate;
  passed: boolean;
  targetKB: number;
  targetBytes: number;
  reductionPercentage: number;
  notes: string[];
  previewUrl: string;
  downloadName: string;
  errorReason?: string;
  suggestedAction?: string;
}

export type ProcessingState =
  | 'idle'
  | 'selected'
  | 'ready'
  | 'compressing'
  | 'success'
  | 'failed'
  | 'error';

export interface TestCaseResult {
  id: string;
  name: string;
  description: string;
  targetKB: number;
  originalSize: number;
  actualSize: number;
  originalDimensions: { width: number; height: number };
  outputDimensions: { width: number; height: number };
  outputFormat: string;
  transparencyPreserved?: boolean | 'N/A';
  status: 'PASS' | 'FAIL' | 'NOT TESTED';
  statusLabel?: string;
  blobValid?: boolean;
  isCoreTest?: boolean;
  message: string;
  durationMs?: number;
}

