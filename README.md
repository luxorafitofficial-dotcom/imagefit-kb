# ImageFit KB — Image Compressor Prototype

> **Your Image. Your Size. Your Control.**
> 
> A client-side image compression engine designed to hit strict maximum file-size targets (in KB) with actual byte-level validation.

---

## 🚀 Quick Run Instructions

The development server is already active on your local machine:
- **Local URL:** [http://localhost:3000](http://localhost:3000)

If you ever stop and need to re-launch the application, run:
```bash
npm run dev
```
Then open your browser at `http://localhost:3000`.

---

## 🌟 Key Features & Engine Architecture

### 1. Real Bounded Optimization Engine (No Simulation)
Unlike tools that simply fake size estimates or alter file extensions, ImageFit KB runs **real client-side image processing**:
- **Decoding & EXIF Correction:** Uses `createImageBitmap` and native canvas rendering with EXIF orientation preservation.
- **Bounded Binary Search:** Automatically bisects quality intervals between `minQuality` and `maxQuality` to discover the candidate image with the highest possible visual fidelity that still satisfies `outputBlob.size <= targetBytes`.
- **Actual Byte Measurement:** Measures physical Blob memory buffers using binary calculations (`targetBytes = targetKB * 1024`).
- **Validity Check:** Validates that every generated blob can be decoded into an image bitmap before reporting PASS.

### 2. Format & Transparency Handling
- **Auto Selection (Recommended):** Automatically detects whether your source file contains transparent pixels (alpha channel) and preserves it using WebP.
- **Explicit Options:** Supports WebP, JPEG, and PNG.
- **Transparency Protection:** If a transparent image is targeted for JPEG, the interface surfaces an explicit warning that JPEG replaces transparency with white pixels.

### 3. Dimension Preservation & Safety
- **Strict Default (Dimension Reduction OFF):** By default, dimensions are 100% preserved. If an image cannot fit into the specified KB target at its original resolution, the engine reports an honest **FAIL** with an explanation.
- **Optional Progressive Rescaling:** When "Allow automatic dimension reduction if needed" is turned ON, the engine progressively downscales candidate dimensions if quality reduction alone cannot satisfy the target KB.

---

## 🧪 Built-in Test Mode

A dedicated test suite is built directly into the page:
1. **TEST 1: Photograph Compression:** Compresses a real bundled landscape photograph (`sample-photo.jpg`, 280 KB) to a strict maximum of 100 KB.
2. **TEST 2: Transparent PNG Preservation:** Compresses a real transparent PNG (`sample-transparent.png`) while verifying alpha channel retention.
3. **TEST 3: Difficult Target (Honest Failure):** Runs a 3.66 MB detailed graphic against a 10 KB target with dimension reduction disabled, demonstrating that the system refuses to falsify success when mathematical constraints cannot be met.

You can click **"Run All Tests"** or execute any test individually to see the real-time PASS/FAIL report and metrics.

---

## 📁 Project Structure

```
├── app/
│   ├── layout.tsx              # Root HTML & metadata
│   ├── page.tsx                # Main compressor application page
│   └── globals.css             # Tailwind styles & theme variables
├── components/
│   ├── Header.tsx              # Brand header & navigation
│   ├── ImageUploader.tsx       # Drag & drop upload & validation
│   ├── CompressionSettings.tsx # KB target & format selection panel
│   ├── CompressionProgress.tsx # Real-time iterative progress indicator
│   ├── CompressionResult.tsx   # Side-by-side results, statistics & download
│   ├── TestMode.tsx            # Built-in verification test suite
│   └── TestReport.tsx          # Real PASS/FAIL compliance matrix
├── lib/
│   ├── format-detection/       # Magic-byte file format identification
│   ├── image-engine/           # Bounded binary search compressor
│   ├── image-validation/       # Alpha detection & file safety checks
│   └── utilities/              # Byte formatting & conversions
├── public/
│   └── test-images/            # Bundled test photographs & PNG assets
└── types/
    └── image.ts                # TypeScript interfaces & types
```

