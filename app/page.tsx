'use client';

import React, { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { ImageUploader } from '@/components/ImageUploader';
import { CompressionSettingsPanel } from '@/components/CompressionSettings';
import { CompressionProgress } from '@/components/CompressionProgress';
import { CompressionResult } from '@/components/CompressionResult';
import { TestMode } from '@/components/TestMode';
import { TestReport } from '@/components/TestReport';
import {
  ImageFileDetails,
  CompressionSettings,
  CompressionResultData,
  TestCaseResult,
  ProcessingState,
} from '@/types/image';
import { compressImage, ProgressCallbackData } from '@/lib/image-engine/compressor';
import { Sparkles, Shield, Cpu, Zap, CheckCircle } from 'lucide-react';

export default function Home() {
  const [imageDetails, setImageDetails] = useState<ImageFileDetails | null>(null);
  const [settings, setSettings] = useState<CompressionSettings>({
    targetKB: 100,
    outputFormat: 'auto',
    allowDimensionReduction: false,
  });

  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [progressData, setProgressData] = useState<ProgressCallbackData | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressionResultData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [testResults, setTestResults] = useState<TestCaseResult[]>([
    {
      id: 'test-1',
      name: 'TEST 1: Photograph Compression',
      description: 'Compress a bundled JPEG photograph to a strict 100 KB maximum target.',
      targetKB: 100,
      originalSize: 0,
      actualSize: 0,
      originalDimensions: { width: 0, height: 0 },
      outputDimensions: { width: 0, height: 0 },
      outputFormat: 'WebP / JPEG',
      transparencyPreserved: 'N/A',
      status: 'NOT TESTED',
      message: 'Ready to execute.',
    },
    {
      id: 'test-2',
      name: 'TEST 2: Transparent PNG Preservation',
      description: 'Verify alpha channel preservation and optimization on a bundled transparent PNG.',
      targetKB: 80,
      originalSize: 0,
      actualSize: 0,
      originalDimensions: { width: 0, height: 0 },
      outputDimensions: { width: 0, height: 0 },
      outputFormat: 'WebP',
      transparencyPreserved: true,
      status: 'NOT TESTED',
      message: 'Ready to execute.',
    },
    {
      id: 'test-3',
      name: 'TEST 3: Difficult Target (Honest Failure Handling)',
      description: 'Compress high-detail 3.6 MB pattern with dimension reduction OFF to an impossible 10 KB.',
      targetKB: 10,
      originalSize: 0,
      actualSize: 0,
      originalDimensions: { width: 0, height: 0 },
      outputDimensions: { width: 0, height: 0 },
      outputFormat: 'JPEG',
      transparencyPreserved: 'N/A',
      status: 'NOT TESTED',
      message: 'Ready to execute.',
    },
  ]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleImageSelected = (details: ImageFileDetails) => {
    // If we had a previous previewUrl, clean it up
    if (imageDetails?.previewUrl && imageDetails.previewUrl !== details.previewUrl) {
      URL.revokeObjectURL(imageDetails.previewUrl);
    }
    setImageDetails(details);
    setCompressionResult(null);
    setProcessingState('ready');
    setErrorMessage(null);
  };

  const handleImageRemoved = () => {
    if (imageDetails?.previewUrl) {
      URL.revokeObjectURL(imageDetails.previewUrl);
    }
    setImageDetails(null);
    setCompressionResult(null);
    setProcessingState('idle');
    setErrorMessage(null);
  };

  const handleStartCompress = async () => {
    if (!imageDetails) return;

    setProcessingState('compressing');
    setProgressData(null);
    setErrorMessage(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await compressImage(
        imageDetails,
        settings,
        (progress) => {
          setProgressData(progress);
        },
        controller.signal
      );

      setCompressionResult(result);
      setProcessingState(result.passed ? 'success' : 'failed');
    } catch (err: any) {
      if (controller.signal.aborted) {
        setProcessingState('ready');
      } else {
        setProcessingState('error');
        setErrorMessage(err?.message || 'Compression failed.');
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelCompress = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setProcessingState('ready');
  };

  const handleReset = () => {
    handleImageRemoved();
  };

  const handleChangeTarget = () => {
    setCompressionResult(null);
    setProcessingState('ready');
  };

  const scrollToTests = () => {
    const el = document.getElementById('test-mode-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header onScrollToTests={scrollToTests} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-50 border border-navy-100 text-navy text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5 text-navy" />
            <span>Deterministic Browser Compression Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
            Compress Images to Your Exact KB Size
          </h1>
          <p className="mt-3 text-sm sm:text-base text-subText">
            Reduce your image size to meet upload requirements. Choose your target, compress and download.
          </p>
        </div>

        {/* Error Alert if any general failure occurs */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
            <p className="font-bold">Error during processing</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        )}

        {/* Main Compressor Workflow Card */}
        <div className="space-y-6">
          {processingState === 'compressing' ? (
            <CompressionProgress
              progressData={progressData}
              targetKB={settings.targetKB}
              onCancel={handleCancelCompress}
            />
          ) : compressionResult ? (
            <CompressionResult
              result={compressionResult}
              onReset={handleReset}
              onChangeTarget={handleChangeTarget}
            />
          ) : (
            <div className="space-y-6">
              <ImageUploader
                imageDetails={imageDetails}
                onImageSelected={handleImageSelected}
                onImageRemoved={handleImageRemoved}
                disabled={false}
              />

              {imageDetails && (
                <CompressionSettingsPanel
                  settings={settings}
                  imageDetails={imageDetails}
                  onSettingsChange={setSettings}
                  onStartCompress={handleStartCompress}
                  isProcessing={false}
                />
              )}
            </div>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-4 rounded-xl bg-white border border-surface-border flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center text-navy flex-shrink-0">
              <Shield className="w-4 h-4 text-navy" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy">100% Client-Side Privacy</h4>
              <p className="text-[11px] text-subText mt-0.5">
                Images never leave your machine. Processed directly in your browser canvas.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-surface-border flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center text-navy flex-shrink-0">
              <Cpu className="w-4 h-4 text-navy" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy">Bounded Binary Optimization</h4>
              <p className="text-[11px] text-subText mt-0.5">
                Mathematical bisection search guarantees the highest quality below your KB target.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-surface-border flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center text-navy flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-navy" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy">Actual Byte Validation</h4>
              <p className="text-[11px] text-subText mt-0.5">
                No simulated sizes. Every generated Blob is measured and decoded before marking PASS.
              </p>
            </div>
          </div>
        </div>

        {/* Built-in Test Mode Section */}
        <TestMode onTestsComplete={setTestResults} />

        {/* Test Report Section */}
        <TestReport testResults={testResults} />
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border bg-white py-6 mt-12 text-center text-xs text-subText">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy">ImageFit KB</span>
            <span>—</span>
            <span>Your Image. Your Size. Your Control.</span>
          </div>
          <div>
            <span>Target Calculation: 1 KB = 1,024 Bytes &bull; In-Browser Native Canvas Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
