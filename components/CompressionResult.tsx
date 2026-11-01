import React, { useState } from 'react';
import {
  Download,
  RotateCcw,
  Sliders,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Check,
} from 'lucide-react';
import { CompressionResultData } from '@/types/image';
import { formatBytes, getCleanFormatName } from '@/lib/utilities/format';
import { verifyBlobValidity } from '@/lib/image-engine/compressor';

interface CompressionResultProps {
  result: CompressionResultData;
  onReset: () => void;
  onChangeTarget: () => void;
}

export const CompressionResult: React.FC<CompressionResultProps> = ({
  result,
  onReset,
  onChangeTarget,
}) => {
  const [downloadTriggered, setDownloadTriggered] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  const handleDownload = async () => {
    const link = document.createElement('a');
    link.href = result.previewUrl;
    link.download = result.downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadTriggered(true);

    // Auto-verify downloaded file validity
    const isValid = await verifyBlobValidity(result.compressed.blob);
    if (isValid) {
      setVerificationStatus(
        `✓ Downloaded "${result.downloadName}" (${result.compressed.size.toLocaleString()} bytes) — Verified 100% valid decodable image.`
      );
    } else {
      setVerificationStatus(`⚠ Downloaded candidate failed image bitmap decode test.`);
    }
  };

  const handleVerifyDecodable = async () => {
    setVerificationStatus('Verifying blob decode...');
    const isValid = await verifyBlobValidity(result.compressed.blob);
    if (isValid) {
      setVerificationStatus(
        `✓ VALID: Browser successfully decoded image bitmap (${result.compressed.width} × ${result.compressed.height} px, ${result.compressed.size.toLocaleString()} bytes).`
      );
    } else {
      setVerificationStatus('INVALID: Browser failed to decode this image candidate.');
    }
  };

  const isPass = result.passed;

  return (
    <div className="bg-white border border-surface-border rounded-xl p-6 sm:p-8 shadow-sm">
      {/* Top Banner Status */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 ${
          isPass
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : 'bg-amber-50/80 border-amber-200 text-amber-950'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isPass ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
            }`}
          >
            {isPass ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">
                {isPass ? 'Status: PASS — Target achieved' : 'Status: FAIL — Target not achieved'}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                  isPass ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                }`}
              >
                {isPass ? 'Pass' : 'Target Exceeded'}
              </span>
            </div>
            <p className="text-xs text-subText mt-0.5">
              {isPass
                ? `Actual size is ${formatBytes(result.compressed.size)}, safely under your maximum target of ${result.targetKB} KB.`
                : result.errorReason ||
                  `Actual candidate is ${formatBytes(result.compressed.size)}, which exceeds ${result.targetKB} KB.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-navy hover:bg-navy-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download Image</span>
          </button>
        </div>
      </div>

      {/* Side by Side Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* A. Original Image */}
        <div className="border border-surface-border rounded-xl p-5 bg-surface-light/40">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-4">
            <h3 className="text-sm font-bold text-navy flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-subText"></span>
              Original Image
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-surface-border text-navy">
              {getCleanFormatName(result.original.format)}
            </span>
          </div>

          <div className="w-full h-56 bg-white rounded-lg border border-surface-border overflow-hidden flex items-center justify-center p-2 mb-4">
            <img
              src={result.original.previewUrl}
              alt="Original"
              className="max-w-full max-h-full object-contain"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-surface-border">
              <span className="text-subText block">Original Size</span>
              <span className="font-bold text-navy text-sm mt-0.5 block">
                {formatBytes(result.original.size)}
              </span>
              <span className="text-[11px] text-subText font-mono">
                {result.original.size.toLocaleString()} bytes
              </span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-surface-border">
              <span className="text-subText block">Dimensions</span>
              <span className="font-bold text-navy text-sm mt-0.5 block">
                {result.original.width} × {result.original.height} px
              </span>
              <span className="text-[11px] text-subText">100% scale</span>
            </div>
          </div>
        </div>

        {/* B. Compressed Image */}
        <div className="border border-surface-border rounded-xl p-5 bg-surface-light/40">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-4">
            <h3 className="text-sm font-bold text-navy flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${isPass ? 'bg-emerald-500' : 'bg-amber-500'}`}
              ></span>
              Compressed Candidate
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-surface-border text-navy">
              {getCleanFormatName(result.compressed.mimeType)}
            </span>
          </div>

          <div className="w-full h-56 bg-white rounded-lg border border-surface-border overflow-hidden flex items-center justify-center p-2 mb-4 relative">
            <img
              src={result.previewUrl}
              alt="Compressed Result"
              className="max-w-full max-h-full object-contain"
            />
            {result.compressed.scale < 1.0 && (
              <span className="absolute top-2 right-2 bg-navy text-white text-[11px] font-medium px-2 py-0.5 rounded shadow">
                Rescaled: {Math.round(result.compressed.scale * 100)}%
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-surface-border">
              <span className="text-subText block">Actual Output Size</span>
              <span
                className={`font-bold text-sm mt-0.5 block ${
                  isPass ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {formatBytes(result.compressed.size)}
              </span>
              <span className="text-[11px] text-subText font-mono">
                {result.compressed.size.toLocaleString()} bytes
              </span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-surface-border">
              <span className="text-subText block">Final Dimensions</span>
              <span className="font-bold text-navy text-sm mt-0.5 block">
                {result.compressed.width} × {result.compressed.height} px
              </span>
              <span className="text-[11px] text-subText">
                {result.compressed.scale < 1.0
                  ? `${Math.round(result.compressed.scale * 100)}% of original`
                  : 'Original preserved'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* C. Compression Statistics Card */}
      <div className="bg-surface-light border border-surface-border rounded-xl p-5 mb-8">
        <h4 className="text-xs font-bold uppercase tracking-wider text-navy mb-4">
          Compression Statistics & Compliance Verification
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-white rounded-lg border border-surface-border">
            <span className="text-subText block font-medium">Original File Size</span>
            <span className="text-sm font-bold text-navy mt-1 block">
              {formatBytes(result.original.size)}
            </span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-surface-border">
            <span className="text-subText block font-medium">Final Output Size</span>
            <span
              className={`text-sm font-bold mt-1 block ${
                isPass ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {formatBytes(result.compressed.size)}
            </span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-surface-border">
            <span className="text-subText block font-medium">Size Reduction</span>
            <span className="text-sm font-bold text-emerald-700 mt-1 block">
              -{result.reductionPercentage.toFixed(1)}%
            </span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-surface-border">
            <span className="text-subText block font-medium">Maximum Target</span>
            <span className="text-sm font-bold text-navy mt-1 block">
              ≤ {result.targetKB} KB
            </span>
          </div>
        </div>

        {/* Engine Processing Notes */}
        {result.notes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-surface-border/80">
            <span className="text-[11px] font-bold text-navy uppercase tracking-wider block mb-2">
              Optimization Decisions & Notes
            </span>
            <ul className="space-y-1 text-xs text-bodyText">
              {result.notes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-navy font-bold">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested Action for FAILED target */}
        {!isPass && result.suggestedAction && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Suggested Alternative:</p>
              <p className="mt-0.5">{result.suggestedAction}</p>
            </div>
          </div>
        )}
      </div>

      {/* Blob Verification & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-surface-border">
        <div className="flex items-center gap-3">
          <button
            onClick={handleVerifyDecodable}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-navy bg-white hover:bg-surface-light border border-surface-border px-3 py-2 rounded-lg transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verify Image Validity</span>
          </button>
          {verificationStatus && (
            <span className="text-xs font-medium text-bodyText">
              {verificationStatus}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onChangeTarget}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-navy bg-surface-light hover:bg-surface-light/80 border border-surface-border transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Change Target</span>
          </button>

          <button
            onClick={onReset}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-navy bg-surface-light hover:bg-surface-light/80 border border-surface-border transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Compress Another Image</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-navy hover:bg-navy-700 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};

