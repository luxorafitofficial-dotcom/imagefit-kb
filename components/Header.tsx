import React from 'react';
import { Layers, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onScrollToTests?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onScrollToTests }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-surface-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-navy flex items-center justify-center text-white shadow-sm">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-navy tracking-tight">ImageFit KB</span>
              <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-light text-navy border border-surface-border">
                Image Compressor
              </span>
            </div>
            <p className="text-xs text-subText hidden sm:block">Your Image. Your Size. Your Control.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onScrollToTests}
            className="flex items-center gap-1.5 text-xs font-medium text-navy hover:text-navy-600 bg-surface-light hover:bg-navy-50 border border-surface-border px-3 py-1.5 rounded-md transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-navy" />
            <span>Built-in Test Mode</span>
          </button>
        </div>
      </div>
    </header>
  );
};

