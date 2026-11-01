import React, { useState } from 'react';
import { Target, Sliders, AlertTriangle, Info, Check } from 'lucide-react';
import { CompressionSettings, OutputFormatOption, ImageFileDetails } from '@/types/image';
import { formatBytes } from '@/lib/utilities/format';

interface CompressionSettingsProps {
  settings: CompressionSettings;
  imageDetails: ImageFileDetails | null;
  onSettingsChange: (newSettings: CompressionSettings) => void;
  onStartCompress: () => void;
  isProcessing: boolean;
}

const PRESET_TARGETS = [20, 50, 100, 200];

export const CompressionSettingsPanel: React.FC<CompressionSettingsProps> = ({
  settings,
  imageDetails,
  onSettingsChange,
  onStartCompress,
  isProcessing,
}) => {
  const [customInputValue, setCustomInputValue] = useState<string>(
    PRESET_TARGETS.includes(settings.targetKB) ? '' : String(settings.targetKB)
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const handlePresetSelect = (kb: number) => {
    setValidationError(null);
    setCustomInputValue('');
    onSettingsChange({
      ...settings,
      targetKB: kb,
    });
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomInputValue(val);

    if (val.trim() === '') {
      setValidationError('Please specify a target size.');
      return;
    }

    const num = Number(val);
    if (isNaN(num)) {
      setValidationError('Please enter a valid number.');
      return;
    }

    if (num <= 0) {
      setValidationError('Target size must be greater than zero.');
      return;
    }

    if (num > 25000) {
      setValidationError('Target size exceeds the maximum limit of 25,000 KB.');
      return;
    }

    setValidationError(null);
    onSettingsChange({
      ...settings,
      targetKB: Math.round(num),
    });
  };

  const handleFormatChange = (format: OutputFormatOption) => {
    onSettingsChange({
      ...settings,
      outputFormat: format,
    });
  };

  const handleToggleDimensionReduction = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...settings,
      allowDimensionReduction: e.target.checked,
    });
  };

  // Check if chosen format drops transparency
  const hasTransparencyConflict =
    imageDetails?.hasAlpha && settings.outputFormat === 'image/jpeg';

  const targetBytes = settings.targetKB * 1024;

  return (
    <div className="bg-white border border-surface-border rounded-xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2 pb-4 border-b border-surface-border mb-6">
        <Sliders className="w-5 h-5 text-navy" />
        <h2 className="text-base font-semibold text-navy">Compression Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Target Size Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-navy flex items-center gap-1.5">
              <Target className="w-4 h-4 text-navy" />
              <span>Target File Size</span>
            </label>
            <span className="text-xs text-subText">
              Binary standard (1 KB = 1,024 B)
            </span>
          </div>

          <p className="text-xs text-subText mb-4">
            Select a preset maximum target or enter a custom KB limit.
          </p>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {PRESET_TARGETS.map((preset) => {
              const isSelected = settings.targetKB === preset && customInputValue === '';
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  disabled={isProcessing}
                  className={`py-2.5 px-3 rounded-lg text-sm font-semibold transition-all border ${
                    isSelected
                      ? 'bg-navy text-white border-navy shadow-sm'
                      : 'bg-surface-light hover:bg-surface-light/80 text-navy border-surface-border'
                  }`}
                >
                  {preset} KB
                </button>
              );
            })}
          </div>

          {/* Custom Input */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-bodyText mb-1.5">
              Enter maximum size in KB
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="25000"
                step="1"
                placeholder="e.g. 75"
                value={customInputValue}
                onChange={handleCustomInputChange}
                disabled={isProcessing}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy text-navy pr-12 font-medium"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-subText">
                KB
              </span>
            </div>
            {validationError && (
              <p className="text-xs text-red-600 mt-1 font-medium">{validationError}</p>
            )}
          </div>

          {/* Active Target Summary Badge */}
          <div className="p-3 bg-surface-light rounded-lg border border-surface-border flex items-center justify-between">
            <div>
              <span className="text-xs text-subText block font-medium">Selected Constraint:</span>
              <span className="text-sm font-bold text-navy">
                Maximum file size: {settings.targetKB} KB
              </span>
            </div>
            <span className="text-xs font-mono font-semibold text-subText bg-white px-2 py-1 rounded border border-surface-border">
              {targetBytes.toLocaleString()} bytes
            </span>
          </div>
        </div>

        {/* Right Column: Output Format & Dimension Control */}
        <div>
          <label className="block text-sm font-semibold text-navy mb-1.5">
            Output Format
          </label>
          <p className="text-xs text-subText mb-4">
            Control the destination container and compression characteristics.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { id: 'auto', label: 'Auto (Recommended)', desc: 'Detects best format' },
              { id: 'image/webp', label: 'WebP', desc: 'Superior lossy compression' },
              { id: 'image/jpeg', label: 'JPEG', desc: 'Universal compatibility' },
              { id: 'image/png', label: 'PNG', desc: 'Lossless preservation' },
            ].map((fmt) => {
              const isSelected = settings.outputFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => handleFormatChange(fmt.id as OutputFormatOption)}
                  disabled={isProcessing}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-navy bg-navy/5 text-navy ring-1 ring-navy'
                      : 'border-surface-border bg-white hover:bg-surface-light text-bodyText'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{fmt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-navy" />}
                  </div>
                  <span className="text-[11px] text-subText mt-0.5 block">{fmt.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Transparency Warning if user picked JPEG for a transparent image */}
          {hasTransparencyConflict && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Transparency Warning</p>
                <p className="mt-0.5">
                  JPEG does not support transparency. Transparent areas will be converted to a solid white background. To preserve transparency, choose <strong>WebP</strong> or <strong>Auto</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Dimension Reduction Setting */}
          <div className="pt-4 border-t border-surface-border">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={settings.allowDimensionReduction}
                onChange={handleToggleDimensionReduction}
                disabled={isProcessing}
                className="mt-1 h-4 w-4 rounded border-surface-border text-navy focus:ring-navy transition"
              />
              <div className="flex-1">
                <span className="text-sm font-semibold text-navy group-hover:text-navy-600 transition-colors">
                  Allow automatic dimension reduction if needed
                </span>
                <p className="text-xs text-subText mt-0.5">
                  Default: <strong>OFF</strong>. When disabled, original pixel dimensions are strictly preserved. When enabled, the engine may progressively downscale image dimensions if quality compression alone cannot satisfy the target KB.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Main Compress Button */}
      <div className="mt-8 pt-6 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-subText">
          <Info className="w-4 h-4 text-navy flex-shrink-0" />
          <span>
            Real iterative canvas compression will execute directly in your browser.
          </span>
        </div>

        <button
          type="button"
          onClick={onStartCompress}
          disabled={isProcessing || !imageDetails || !!validationError}
          className={`w-full sm:w-auto px-8 py-3 rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 ${
            isProcessing || !imageDetails || !!validationError
              ? 'bg-surface-border text-subText cursor-not-allowed'
              : 'bg-navy hover:bg-navy-700 text-white shadow-navy/20 hover:shadow-md'
          }`}
        >
          <span>Compress to ≤ {settings.targetKB} KB</span>
        </button>
      </div>
    </div>
  );
};

