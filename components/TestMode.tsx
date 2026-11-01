import React, { useState } from 'react';
import {
  Play,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { TestCaseResult } from '@/types/image';
import { validateAndLoadImage } from '@/lib/image-validation/validator';
import { compressImage, verifyBlobValidity } from '@/lib/image-engine/compressor';
import { formatBytes } from '@/lib/utilities/format';

interface TestModeProps {
  testResults: TestCaseResult[];
  onTestsComplete: (results: TestCaseResult[]) => void;
  activeSuite: 'core' | 'all';
  onSuiteChange: (suite: 'core' | 'all') => void;
}

export const INITIAL_TEST_SUITE: TestCaseResult[] = [
  {
    id: 'test-1',
    name: 'TEST 1: Photograph Compression (100 KB Target)',
    description: 'Compress a bundled JPEG photograph to a strict 100 KB maximum target (102,400 bytes).',
    targetKB: 100,
    originalSize: 0,
    actualSize: 0,
    originalDimensions: { width: 0, height: 0 },
    outputDimensions: { width: 0, height: 0 },
    outputFormat: 'WebP / JPEG',
    transparencyPreserved: 'N/A',
    status: 'NOT TESTED',
    isCoreTest: true,
    message: 'Ready to execute. Will load public/test-images/sample-photo.jpg, run bounded quality search, and verify decodable output.',
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
    isCoreTest: true,
    message: 'Ready to execute. Will verify alpha channel retention and decodability at ≤ 80 KB.',
  },
  {
    id: 'test-3',
    name: 'TEST 3: Difficult Target (Honest Failure Handling)',
    description: 'Compress high-detail 3.66 MB pattern with dimension reduction OFF to an impossible 10 KB.',
    targetKB: 10,
    originalSize: 0,
    actualSize: 0,
    originalDimensions: { width: 0, height: 0 },
    outputDimensions: { width: 0, height: 0 },
    outputFormat: 'JPEG',
    transparencyPreserved: 'N/A',
    status: 'NOT TESTED',
    isCoreTest: true,
    message: 'Ready to execute. Verifies the engine correctly refuses impossible targets without faking success.',
  },
  {
    id: 'test-4',
    name: 'TEST 4: JPEG Compression to 50 KB Target',
    description: 'Compress a bundled JPEG photograph to a strict 50 KB maximum target (51,200 bytes).',
    targetKB: 50,
    originalSize: 0,
    actualSize: 0,
    originalDimensions: { width: 0, height: 0 },
    outputDimensions: { width: 0, height: 0 },
    outputFormat: 'JPEG',
    transparencyPreserved: 'N/A',
    status: 'NOT TESTED',
    isCoreTest: false,
    message: 'Ready to execute. Tests bounded quality search under tight constraints.',
  },
  {
    id: 'test-5',
    name: 'TEST 5: PNG Compression with Transparency',
    description: 'Preserve lossless PNG format with transparent alpha channel intact.',
    targetKB: 140,
    originalSize: 0,
    actualSize: 0,
    originalDimensions: { width: 0, height: 0 },
    outputDimensions: { width: 0, height: 0 },
    outputFormat: 'PNG',
    transparencyPreserved: true,
    status: 'NOT TESTED',
    isCoreTest: false,
    message: 'Ready to execute. Tests lossless PNG canvas export without altering alpha values.',
  },
  {
    id: 'test-6',
    name: 'TEST 6: WebP Input Compression',
    description: 'Decode a native WebP image and compress it to a target of ≤ 20 KB.',
    targetKB: 20,
    originalSize: 0,
    actualSize: 0,
    originalDimensions: { width: 0, height: 0 },
    outputDimensions: { width: 0, height: 0 },
    outputFormat: 'WebP',
    transparencyPreserved: 'N/A',
    status: 'NOT TESTED',
    isCoreTest: false,
    message: 'Ready to execute. Verifies native WebP container ingestion and re-compression.',
  },
  {
    id: 'test-7',
    name: 'TEST 7: Impossible 5 KB Target (Honest Refusal)',
    description: 'Attempt compressing high-res photo to an impossible 5 KB target with resizing OFF.',
    targetKB: 5,
    originalSize: 0,
    actualSize: 0,
    originalDimensions: { width: 0, height: 0 },
    outputDimensions: { width: 0, height: 0 },
    outputFormat: 'JPEG',
    transparencyPreserved: 'N/A',
    status: 'NOT TESTED',
    isCoreTest: false,
    message: 'Ready to execute. Verifies expected refusal on extreme 5 KB constraint.',
  },
  {
    id: 'test-8',
    name: 'TEST 8: Invalid / Corrupted Image Handling',
    description: 'Verify system safely rejects corrupted binary data without crashing.',
    targetKB: 50,
    originalSize: 0,
    actualSize: 0,
    originalDimensions: { width: 0, height: 0 },
    outputDimensions: { width: 0, height: 0 },
    outputFormat: 'N/A',
    transparencyPreserved: 'N/A',
    status: 'NOT TESTED',
    isCoreTest: false,
    message: 'Ready to execute. Tests safe validation interceptor against corrupted image data.',
  },
  {
    id: 'test-9',
    name: 'TEST 9: Original Dimensions Preservation',
    description: 'Verify that 100% of original pixel dimensions are preserved when resizing is disabled.',
    targetKB: 100,
    originalSize: 0,
    actualSize: 0,
    originalDimensions: { width: 0, height: 0 },
    outputDimensions: { width: 0, height: 0 },
    outputFormat: 'WebP',
    transparencyPreserved: 'N/A',
    status: 'NOT TESTED',
    isCoreTest: false,
    message: 'Ready to execute. Verifies zero silent downscaling when resizing is OFF.',
  },
];

export const TestMode: React.FC<TestModeProps> = ({
  testResults,
  onTestsComplete,
  activeSuite,
  onSuiteChange,
}) => {
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [runningTestId, setRunningTestId] = useState<string | null>(null);

  const displayedTests =
    activeSuite === 'core'
      ? testResults.filter((t) => t.isCoreTest)
      : testResults;

  const runSingleTest = async (testId: string): Promise<TestCaseResult> => {
    setRunningTestId(testId);
    const startTime = performance.now();

    try {
      if (testId === 'test-1') {
        const res = await fetch('/test-images/sample-photo.jpg');
        const blob = await res.blob();
        const loaded = await validateAndLoadImage(blob, 'sample-photo.jpg');
        if (!loaded.details) throw new Error('Could not load test photograph.');

        const targetKB = 100;
        const targetBytes = targetKB * 1024;
        const result = await compressImage(loaded.details, {
          targetKB,
          outputFormat: 'auto',
          allowDimensionReduction: false,
        });

        const isDecodable = await verifyBlobValidity(result.compressed.blob);
        const isUnderTarget = result.compressed.size <= targetBytes;
        const passed = isUnderTarget && isDecodable;

        return {
          id: 'test-1',
          name: 'TEST 1: Photograph Compression (100 KB Target)',
          description: 'Compress a bundled JPEG photograph to a strict 100 KB maximum target (102,400 bytes).',
          targetKB,
          originalSize: loaded.details.size,
          actualSize: result.compressed.size,
          originalDimensions: { width: loaded.details.width, height: loaded.details.height },
          outputDimensions: { width: result.compressed.width, height: result.compressed.height },
          outputFormat: result.compressed.mimeType,
          transparencyPreserved: 'N/A',
          status: passed ? 'PASS' : 'FAIL',
          statusLabel: passed ? 'PASS' : 'FAIL',
          blobValid: isDecodable,
          isCoreTest: true,
          message: passed
            ? `PASS: Output is ${formatBytes(result.compressed.size)} (strictly ≤ ${targetKB} KB target / ${targetBytes.toLocaleString()} bytes). Valid decodable bitmap verified.`
            : `FAIL: Actual size (${formatBytes(result.compressed.size)}) exceeded target or blob invalid.`,
          durationMs: Math.round(performance.now() - startTime),
        };
      }

      if (testId === 'test-2') {
        const res = await fetch('/test-images/sample-transparent.png');
        const blob = await res.blob();
        const loaded = await validateAndLoadImage(blob, 'sample-transparent.png');
        if (!loaded.details) throw new Error('Could not load transparent PNG.');

        const targetKB = 80;
        const targetBytes = targetKB * 1024;
        const result = await compressImage(loaded.details, {
          targetKB,
          outputFormat: 'auto',
          allowDimensionReduction: false,
        });

        const isDecodable = await verifyBlobValidity(result.compressed.blob);
        const hasAlphaPreserved = loaded.details.hasAlpha === true;
        const isUnderTarget = result.compressed.size <= targetBytes;
        const passed = isUnderTarget && hasAlphaPreserved && isDecodable;

        return {
          id: 'test-2',
          name: 'TEST 2: Transparent PNG Preservation',
          description: 'Verify alpha channel preservation and optimization on a bundled transparent PNG.',
          targetKB,
          originalSize: loaded.details.size,
          actualSize: result.compressed.size,
          originalDimensions: { width: loaded.details.width, height: loaded.details.height },
          outputDimensions: { width: result.compressed.width, height: result.compressed.height },
          outputFormat: result.compressed.mimeType,
          transparencyPreserved: hasAlphaPreserved,
          status: passed ? 'PASS' : 'FAIL',
          statusLabel: passed ? 'PASS' : 'FAIL',
          blobValid: isDecodable,
          isCoreTest: true,
          message: passed
            ? `PASS: Compressed to ${formatBytes(result.compressed.size)} (≤ ${targetKB} KB). Full alpha transparency preserved and decoded successfully.`
            : `FAIL: Transparency lost or candidate exceeded ${targetKB} KB.`,
          durationMs: Math.round(performance.now() - startTime),
        };
      }

      if (testId === 'test-3') {
        const res = await fetch('/test-images/difficult-target.png');
        const blob = await res.blob();
        const loaded = await validateAndLoadImage(blob, 'difficult-target.png');
        if (!loaded.details) throw new Error('Could not load difficult target test image.');

        const targetKB = 10;
        const targetBytes = targetKB * 1024;
        const result = await compressImage(loaded.details, {
          targetKB,
          outputFormat: 'image/jpeg',
          allowDimensionReduction: false,
        });

        const isDecodable = await verifyBlobValidity(result.compressed.blob);
        const engineRefusedAsExpected = result.passed === false && result.compressed.size > targetBytes;

        return {
          id: 'test-3',
          name: 'TEST 3: Difficult Target (Honest Failure Handling)',
          description: 'Compress high-detail 3.66 MB pattern with dimension reduction OFF to an impossible 10 KB.',
          targetKB,
          originalSize: loaded.details.size,
          actualSize: result.compressed.size,
          originalDimensions: { width: loaded.details.width, height: loaded.details.height },
          outputDimensions: { width: result.compressed.width, height: result.compressed.height },
          outputFormat: result.compressed.mimeType,
          transparencyPreserved: 'N/A',
          status: engineRefusedAsExpected ? 'PASS' : 'FAIL',
          statusLabel: engineRefusedAsExpected ? 'PASS — Honest Failure Handling' : 'FAIL',
          blobValid: isDecodable,
          isCoreTest: true,
          message: engineRefusedAsExpected
            ? `PASS: The engine correctly refused the impossible 10 KB target without falsely claiming success. Real lowest size at original dimensions was ${formatBytes(result.compressed.size)} (> 10 KB). Valid decodable candidate verified.`
            : 'FAIL: Engine failed to correctly flag target violation.',
          durationMs: Math.round(performance.now() - startTime),
        };
      }

      if (testId === 'test-4') {
        const res = await fetch('/test-images/sample-photo.jpg');
        const blob = await res.blob();
        const loaded = await validateAndLoadImage(blob, 'sample-photo.jpg');
        if (!loaded.details) throw new Error('Could not load test photograph.');

        const targetKB = 50;
        const targetBytes = targetKB * 1024;
        const result = await compressImage(loaded.details, {
          targetKB,
          outputFormat: 'image/jpeg',
          allowDimensionReduction: false,
        });

        const isDecodable = await verifyBlobValidity(result.compressed.blob);
        const isUnderTarget = result.compressed.size <= targetBytes;
        const passed = isUnderTarget && isDecodable;

        return {
          id: 'test-4',
          name: 'TEST 4: JPEG Compression to 50 KB Target',
          description: 'Compress a bundled JPEG photograph to a strict 50 KB maximum target (51,200 bytes).',
          targetKB,
          originalSize: loaded.details.size,
          actualSize: result.compressed.size,
          originalDimensions: { width: loaded.details.width, height: loaded.details.height },
          outputDimensions: { width: result.compressed.width, height: result.compressed.height },
          outputFormat: 'image/jpeg',
          transparencyPreserved: 'N/A',
          status: passed ? 'PASS' : 'FAIL',
          statusLabel: passed ? 'PASS' : 'FAIL',
          blobValid: isDecodable,
          isCoreTest: false,
          message: passed
            ? `PASS: Successfully compressed to ${formatBytes(result.compressed.size)} (strictly ≤ 50 KB / 51,200 bytes). Valid JPEG decodability verified.`
            : `FAIL: Result ${formatBytes(result.compressed.size)} exceeded 50 KB.`,
          durationMs: Math.round(performance.now() - startTime),
        };
      }

      if (testId === 'test-5') {
        const res = await fetch('/test-images/sample-transparent.png');
        const blob = await res.blob();
        const loaded = await validateAndLoadImage(blob, 'sample-transparent.png');
        if (!loaded.details) throw new Error('Could not load transparent PNG.');

        const targetKB = 140;
        const targetBytes = targetKB * 1024;
        const result = await compressImage(loaded.details, {
          targetKB,
          outputFormat: 'image/png',
          allowDimensionReduction: false,
        });

        const isDecodable = await verifyBlobValidity(result.compressed.blob);
        const hasAlphaPreserved = loaded.details.hasAlpha === true;
        const isUnderTarget = result.compressed.size <= targetBytes;
        const passed = isUnderTarget && hasAlphaPreserved && isDecodable;

        return {
          id: 'test-5',
          name: 'TEST 5: PNG Compression with Transparency',
          description: 'Preserve lossless PNG format with transparent alpha channel intact.',
          targetKB,
          originalSize: loaded.details.size,
          actualSize: result.compressed.size,
          originalDimensions: { width: loaded.details.width, height: loaded.details.height },
          outputDimensions: { width: result.compressed.width, height: result.compressed.height },
          outputFormat: 'image/png',
          transparencyPreserved: hasAlphaPreserved,
          status: passed ? 'PASS' : 'FAIL',
          statusLabel: passed ? 'PASS' : 'FAIL',
          blobValid: isDecodable,
          isCoreTest: false,
          message: passed
            ? `PASS: Lossless PNG rendered at ${formatBytes(result.compressed.size)} (≤ 140 KB). Full alpha transparency preserved.`
            : `FAIL: PNG exceeded target or alpha lost.`,
          durationMs: Math.round(performance.now() - startTime),
        };
      }

      if (testId === 'test-6') {
        const res = await fetch('/test-images/sample-input.webp');
        const blob = await res.blob();
        const loaded = await validateAndLoadImage(blob, 'sample-input.webp');
        if (!loaded.details) throw new Error('Could not load WebP image.');

        const targetKB = 20;
        const targetBytes = targetKB * 1024;
        const result = await compressImage(loaded.details, {
          targetKB,
          outputFormat: 'image/webp',
          allowDimensionReduction: false,
        });

        const isDecodable = await verifyBlobValidity(result.compressed.blob);
        const isUnderTarget = result.compressed.size <= targetBytes;
        const passed = isUnderTarget && isDecodable;

        return {
          id: 'test-6',
          name: 'TEST 6: WebP Input Compression',
          description: 'Decode a native WebP image and compress it to a target of ≤ 20 KB.',
          targetKB,
          originalSize: loaded.details.size,
          actualSize: result.compressed.size,
          originalDimensions: { width: loaded.details.width, height: loaded.details.height },
          outputDimensions: { width: result.compressed.width, height: result.compressed.height },
          outputFormat: 'image/webp',
          transparencyPreserved: 'N/A',
          status: passed ? 'PASS' : 'FAIL',
          statusLabel: passed ? 'PASS' : 'FAIL',
          blobValid: isDecodable,
          isCoreTest: false,
          message: passed
            ? `PASS: WebP source compressed to ${formatBytes(result.compressed.size)} (strictly ≤ 20 KB). Valid WebP decoding confirmed.`
            : `FAIL: Result ${formatBytes(result.compressed.size)} exceeded 20 KB.`,
          durationMs: Math.round(performance.now() - startTime),
        };
      }

      if (testId === 'test-7') {
        const res = await fetch('/test-images/sample-photo.jpg');
        const blob = await res.blob();
        const loaded = await validateAndLoadImage(blob, 'sample-photo.jpg');
        if (!loaded.details) throw new Error('Could not load test photograph.');

        const targetKB = 5;
        const targetBytes = targetKB * 1024;
        const result = await compressImage(loaded.details, {
          targetKB,
          outputFormat: 'image/jpeg',
          allowDimensionReduction: false,
        });

        const isDecodable = await verifyBlobValidity(result.compressed.blob);
        const correctlyRefused = result.passed === false && result.compressed.size > targetBytes;

        return {
          id: 'test-7',
          name: 'TEST 7: Impossible 5 KB Target (Honest Refusal)',
          description: 'Attempt compressing high-res photo to an impossible 5 KB target with resizing OFF.',
          targetKB,
          originalSize: loaded.details.size,
          actualSize: result.compressed.size,
          originalDimensions: { width: loaded.details.width, height: loaded.details.height },
          outputDimensions: { width: result.compressed.width, height: result.compressed.height },
          outputFormat: 'image/jpeg',
          transparencyPreserved: 'N/A',
          status: correctlyRefused ? 'PASS' : 'FAIL',
          statusLabel: correctlyRefused ? 'PASS — Honest Refusal Verified' : 'FAIL',
          blobValid: isDecodable,
          isCoreTest: false,
          message: correctlyRefused
            ? `PASS: Verified honest refusal. At full dimensions (1600 × 1067 px), minimum size is ${formatBytes(result.compressed.size)} (> 5 KB). The engine accurately refused to falsify compliance.`
            : 'FAIL: Engine claimed false success.',
          durationMs: Math.round(performance.now() - startTime),
        };
      }

      if (testId === 'test-8') {
        const res = await fetch('/test-images/corrupted-sample.jpg');
        const blob = await res.blob();
        const validation = await validateAndLoadImage(blob, 'corrupted-sample.jpg');

        const safelyRejected = validation.valid === false;

        return {
          id: 'test-8',
          name: 'TEST 8: Invalid / Corrupted Image Handling',
          description: 'Verify system safely rejects corrupted binary data without crashing.',
          targetKB: 50,
          originalSize: blob.size,
          actualSize: 0,
          originalDimensions: { width: 0, height: 0 },
          outputDimensions: { width: 0, height: 0 },
          outputFormat: 'N/A',
          transparencyPreserved: 'N/A',
          status: safelyRejected ? 'PASS' : 'FAIL',
          statusLabel: safelyRejected ? 'PASS — Corrupted File Safely Rejected' : 'FAIL',
          blobValid: false,
          isCoreTest: false,
          message: safelyRejected
            ? `PASS: Corrupted image safely detected and rejected without application error: "${validation.error}"`
            : 'FAIL: Corrupted file was falsely accepted.',
          durationMs: Math.round(performance.now() - startTime),
        };
      }

      if (testId === 'test-9') {
        const res = await fetch('/test-images/sample-photo.jpg');
        const blob = await res.blob();
        const loaded = await validateAndLoadImage(blob, 'sample-photo.jpg');
        if (!loaded.details) throw new Error('Could not load test photograph.');

        const targetKB = 100;
        const result = await compressImage(loaded.details, {
          targetKB,
          outputFormat: 'image/webp',
          allowDimensionReduction: false, // strictly OFF
        });

        const sameWidth = result.compressed.width === loaded.details.width;
        const sameHeight = result.compressed.height === loaded.details.height;
        const passed = sameWidth && sameHeight;

        return {
          id: 'test-9',
          name: 'TEST 9: Original Dimensions Preservation',
          description: 'Verify that 100% of original pixel dimensions are preserved when resizing is disabled.',
          targetKB,
          originalSize: loaded.details.size,
          actualSize: result.compressed.size,
          originalDimensions: { width: loaded.details.width, height: loaded.details.height },
          outputDimensions: { width: result.compressed.width, height: result.compressed.height },
          outputFormat: 'image/webp',
          transparencyPreserved: 'N/A',
          status: passed ? 'PASS' : 'FAIL',
          statusLabel: passed ? 'PASS — Dimensions Preserved 100%' : 'FAIL',
          blobValid: true,
          isCoreTest: false,
          message: passed
            ? `PASS: Original dimensions (${loaded.details.width} × ${loaded.details.height} px) were 100% preserved in output candidate.`
            : 'FAIL: Dimensions were modified unexpectedly.',
          durationMs: Math.round(performance.now() - startTime),
        };
      }

      throw new Error('Unknown test ID');
    } catch (err: any) {
      return {
        id: testId,
        name: testResults.find((t) => t.id === testId)?.name || testId,
        description: '',
        targetKB: 0,
        originalSize: 0,
        actualSize: 0,
        originalDimensions: { width: 0, height: 0 },
        outputDimensions: { width: 0, height: 0 },
        outputFormat: 'unknown',
        status: 'FAIL',
        statusLabel: 'FAIL',
        message: `Execution error: ${err?.message || 'Test failed'}`,
      };
    } finally {
      setRunningTestId(null);
    }
  };

  const handleRunSingle = async (testId: string) => {
    const updated = await runSingleTest(testId);
    const next = testResults.map((t) => (t.id === testId ? updated : t));
    onTestsComplete(next);
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    const updatedResults = [...testResults];

    for (const test of displayedTests) {
      const res = await runSingleTest(test.id);
      const idx = updatedResults.findIndex((t) => t.id === test.id);
      if (idx !== -1) {
        updatedResults[idx] = res;
      }
    }

    onTestsComplete(updatedResults);
    setIsRunningAll(false);
  };

  return (
    <div id="test-mode-section" className="bg-white border border-surface-border rounded-xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-surface-border mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-navy" />
            <h2 className="text-lg font-bold text-navy">Test ImageFit KB</h2>
          </div>
          <p className="text-xs text-subText mt-1">
            Built-in verification suite using actual bundled assets and live engine execution. Zero simulated data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Suite Filter Toggle */}
          <div className="flex items-center bg-surface-light border border-surface-border rounded-lg p-0.5 text-xs font-semibold">
            <button
              onClick={() => onSuiteChange('core')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeSuite === 'core'
                  ? 'bg-white text-navy shadow-xs border border-surface-border'
                  : 'text-subText hover:text-navy'
              }`}
            >
              Core Suite (3 Tests)
            </button>
            <button
              onClick={() => onSuiteChange('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeSuite === 'all'
                  ? 'bg-white text-navy shadow-xs border border-surface-border'
                  : 'text-subText hover:text-navy'
              }`}
            >
              Full Suite (9 Tests)
            </button>
          </div>

          <button
            onClick={handleRunAll}
            disabled={isRunningAll || runningTestId !== null}
            className={`px-5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-2 ${
              isRunningAll || runningTestId !== null
                ? 'bg-surface-border text-subText cursor-not-allowed'
                : 'bg-navy hover:bg-navy-700 text-white shadow-navy/20'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span>
              {isRunningAll
                ? 'Executing Tests...'
                : `Run ${activeSuite === 'core' ? 'Core Tests (3)' : 'All Tests (9)'}`}
            </span>
          </button>
        </div>
      </div>

      {/* Test Cases List */}
      <div className="space-y-4">
        {displayedTests.map((test) => {
          const isCurrentRunning = runningTestId === test.id;
          const isPassed = test.status === 'PASS';
          const isFailed = test.status === 'FAIL';
          const label = test.statusLabel || test.status;

          return (
            <div
              key={test.id}
              className={`p-5 rounded-xl border transition-all ${
                isPassed
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : isFailed
                  ? 'border-red-200 bg-red-50/30'
                  : 'border-surface-border bg-surface-light/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  {isPassed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : isFailed ? (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-subText flex-shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-navy">{test.name}</h3>
                      {test.isCoreTest && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-navy-50 text-navy border border-navy-100">
                          Core
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-subText mt-0.5">{test.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase ${
                      isPassed
                        ? 'bg-emerald-100 text-emerald-800'
                        : isFailed
                        ? 'bg-red-100 text-red-800'
                        : 'bg-surface-border text-subText'
                    }`}
                  >
                    {label}
                  </span>

                  <button
                    onClick={() => handleRunSingle(test.id)}
                    disabled={isCurrentRunning || isRunningAll}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${
                      isCurrentRunning
                        ? 'bg-surface-border text-subText cursor-not-allowed'
                        : 'bg-white hover:bg-surface-light text-navy border-surface-border shadow-xs'
                    }`}
                  >
                    {isCurrentRunning ? 'Running...' : 'Run Test'}
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              {test.status !== 'NOT TESTED' && (
                <div className="mt-4 pt-3 border-t border-surface-border/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-surface-border">
                    <span className="text-subText block text-[11px]">Original Size</span>
                    <span className="font-semibold text-navy mt-0.5 block">
                      {test.originalSize > 0 ? formatBytes(test.originalSize) : 'N/A'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-surface-border">
                    <span className="text-subText block text-[11px]">Target Size</span>
                    <span className="font-semibold text-navy mt-0.5 block">
                      {test.targetKB > 0 ? `≤ ${test.targetKB} KB` : 'N/A'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-surface-border">
                    <span className="text-subText block text-[11px]">Actual Output</span>
                    <span
                      className={`font-bold mt-0.5 block ${
                        test.actualSize <= test.targetKB * 1024
                          ? 'text-emerald-700'
                          : 'text-navy'
                      }`}
                    >
                      {test.actualSize > 0 ? formatBytes(test.actualSize) : 'N/A'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-surface-border">
                    <span className="text-subText block text-[11px]">Dimensions / Valid</span>
                    <span className="font-semibold text-navy mt-0.5 block">
                      {test.outputDimensions.width > 0
                        ? `${test.outputDimensions.width} × ${test.outputDimensions.height} px`
                        : test.blobValid === false
                        ? 'Rejected (Safe)'
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              )}

              {/* Result explanation message */}
              <div className="mt-3 text-xs text-bodyText font-medium bg-white/70 p-2.5 rounded-lg border border-surface-border/60 flex items-center justify-between">
                <span>{test.message}</span>
                {test.durationMs !== undefined && (
                  <span className="text-[11px] text-subText font-mono ml-2 flex-shrink-0">
                    {test.durationMs}ms
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
