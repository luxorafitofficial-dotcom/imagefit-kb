import React from 'react';
import { Loader2, XCircle } from 'lucide-react';
import { ProgressCallbackData } from '@/lib/image-engine/compressor';
import { formatBytes } from '@/lib/utilities/format';

interface CompressionProgressProps {
  progressData: ProgressCallbackData | null;
  targetKB: number;
  onCancel: () => void;
}

export const CompressionProgress: React.FC<CompressionProgressProps> = ({
  progressData,
  targetKB,
  onCancel,
}) => {
  return (
    <div className="bg-white border border-surface-border rounded-xl p-8 shadow-sm text-center">
      <div className="max-w-md mx-auto flex flex-col items-center">
        <div className="w-14 h-14 rounded-full bg-navy-50 flex items-center justify-center text-navy mb-4 relative">
          <Loader2 className="w-8 h-8 text-navy animate-spin" />
        </div>

        <h3 className="text-lg font-bold text-navy">Compressing your image...</h3>
        <p className="text-xs text-subText mt-1 mb-6">
          Running bounded iterative optimization to meet the maximum target of {targetKB} KB ({targetKB * 1024} bytes).
        </p>

        {/* Real measurable progress stats */}
        {progressData ? (
          <div className="w-full bg-surface-light border border-surface-border rounded-lg p-4 text-left space-y-2 mb-6">
            <div className="flex items-center justify-between text-xs">
              <span className="text-subText font-medium">Current Evaluation:</span>
              <span className="font-semibold text-navy">
                {progressData.stage}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-subText font-medium">Search Iteration:</span>
              <span className="font-mono font-semibold text-navy">
                Pass #{progressData.iteration}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-subText font-medium">Candidate Output Size:</span>
              <span className="font-mono font-bold text-navy">
                {formatBytes(progressData.currentSize)} ({progressData.currentSize.toLocaleString()} bytes)
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-subText font-medium">Target Compliance:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                  progressData.currentSize <= targetKB * 1024
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {progressData.currentSize <= targetKB * 1024 ? 'Within Target' : 'Exceeds Target (Tuning)'}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full py-4 text-xs text-subText">
            Initializing browser canvas and image decoders...
          </div>
        )}

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
        >
          <XCircle className="w-4 h-4" />
          <span>Cancel Compression</span>
        </button>
      </div>
    </div>
  );
};

