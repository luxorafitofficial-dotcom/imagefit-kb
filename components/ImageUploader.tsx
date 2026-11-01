import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, AlertCircle, FileCheck2 } from 'lucide-react';
import { ImageFileDetails } from '@/types/image';
import { validateAndLoadImage } from '@/lib/image-validation/validator';
import { formatBytes, getCleanFormatName } from '@/lib/utilities/format';

interface ImageUploaderProps {
  imageDetails: ImageFileDetails | null;
  onImageSelected: (details: ImageFileDetails) => void;
  onImageRemoved: () => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageDetails,
  onImageSelected,
  onImageRemoved,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);
    setIsValidating(true);

    try {
      const result = await validateAndLoadImage(file);
      if (!result.valid || !result.details) {
        setErrorMessage(result.error || 'Failed to read image.');
      } else {
        onImageSelected(result.details);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred while validating the image.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await handleFileProcess(file);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await handleFileProcess(file);
      // Reset input value so re-selecting same file works
      e.target.value = '';
    }
  };

  const handleRemove = () => {
    if (imageDetails?.previewUrl) {
      URL.revokeObjectURL(imageDetails.previewUrl);
    }
    setErrorMessage(null);
    onImageRemoved();
  };

  return (
    <div className="w-full">
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-red-800">
            <p className="font-semibold">Validation Error</p>
            <p className="text-red-700 mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {!imageDetails ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer bg-white ${
            isDragging
              ? 'border-navy bg-navy-50/40 shadow-sm'
              : 'border-surface-border hover:border-navy/40 hover:bg-surface-light/50'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            onChange={handleInputChange}
            disabled={disabled}
            className="hidden"
          />

          <div className="max-w-md mx-auto flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-surface-light border border-surface-border flex items-center justify-center text-navy mb-4 shadow-sm">
              <UploadCloud className="w-7 h-7 text-navy" />
            </div>

            <p className="text-base sm:text-lg font-semibold text-navy">
              {isValidating ? 'Validating image...' : 'Drop your image here'}
            </p>
            <p className="text-sm text-subText mt-1 mb-5">
              or browse files from your device
            </p>

            <button
              type="button"
              disabled={disabled || isValidating}
              className="px-5 py-2.5 rounded-lg bg-navy hover:bg-navy-700 text-white text-sm font-medium shadow-sm transition-colors inline-flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Choose Image</span>
            </button>

            <div className="mt-6 pt-5 border-t border-surface-border/70 flex flex-wrap items-center justify-center gap-2 text-xs text-subText">
              <span>Supported formats:</span>
              <span className="font-semibold text-bodyText bg-surface-light px-2 py-0.5 rounded border border-surface-border">JPG</span>
              <span className="font-semibold text-bodyText bg-surface-light px-2 py-0.5 rounded border border-surface-border">JPEG</span>
              <span className="font-semibold text-bodyText bg-surface-light px-2 py-0.5 rounded border border-surface-border">PNG</span>
              <span className="font-semibold text-bodyText bg-surface-light px-2 py-0.5 rounded border border-surface-border">WebP</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-surface-border rounded-xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-semibold text-navy">Selected Image Ready</span>
            </div>
            <button
              onClick={handleRemove}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-subText hover:text-red-600 transition-colors px-2.5 py-1.5 rounded-md hover:bg-red-50 border border-transparent hover:border-red-200"
            >
              <X className="w-4 h-4" />
              <span>Remove image</span>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Image Preview Thumbnail */}
            <div className="md:col-span-4 flex justify-center">
              <div className="relative w-full max-w-[240px] h-48 bg-surface-light rounded-lg border border-surface-border overflow-hidden flex items-center justify-center p-2">
                <img
                  src={imageDetails.previewUrl}
                  alt={imageDetails.name}
                  className="max-w-full max-h-full object-contain rounded"
                />
                {imageDetails.hasAlpha && (
                  <span className="absolute bottom-2 left-2 bg-navy/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded shadow-xs">
                    Alpha Transparency
                  </span>
                )}
              </div>
            </div>

            {/* Metadata Information Cards */}
            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-surface-light rounded-lg border border-surface-border">
                <p className="text-xs text-subText font-medium">File Name</p>
                <p className="text-sm font-semibold text-navy mt-1 truncate" title={imageDetails.name}>
                  {imageDetails.name}
                </p>
              </div>

              <div className="p-3 bg-surface-light rounded-lg border border-surface-border">
                <p className="text-xs text-subText font-medium">Original File Size</p>
                <p className="text-sm font-bold text-navy mt-1">
                  {formatBytes(imageDetails.size)}
                </p>
              </div>

              <div className="p-3 bg-surface-light rounded-lg border border-surface-border">
                <p className="text-xs text-subText font-medium">Original Dimensions</p>
                <p className="text-sm font-semibold text-navy mt-1">
                  {imageDetails.width} × {imageDetails.height} px
                </p>
              </div>

              <div className="p-3 bg-surface-light rounded-lg border border-surface-border">
                <p className="text-xs text-subText font-medium">Detected Format</p>
                <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 bg-white border border-surface-border rounded text-navy">
                  {getCleanFormatName(imageDetails.format)}
                </span>
              </div>

              <div className="p-3 bg-surface-light rounded-lg border border-surface-border">
                <p className="text-xs text-subText font-medium">Transparency</p>
                <p className="text-sm font-medium text-bodyText mt-1">
                  {imageDetails.hasAlpha ? 'Preserved (Alpha)' : 'None (Opaque)'}
                </p>
              </div>

              <div className="p-3 bg-surface-light rounded-lg border border-surface-border">
                <p className="text-xs text-subText font-medium">Status</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Ready to Compress
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

