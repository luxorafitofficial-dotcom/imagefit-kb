const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const outDir = path.join(__dirname, '..', 'public', 'test-images');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Minimal pure Node PNG generator using built-in zlib
function createPNG(width, height, getPixelRGBA) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit per channel
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk (scanlines with filter byte 0)
  const rowBytes = width * 4;
  const rawData = Buffer.alloc((rowBytes + 1) * height);
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixelRGBA(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crc ^ buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.slice(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// 1. Transparent PNG (800x600) with circle, gradient, and alpha
console.log('Generating sample-transparent.png...');
const transparentPng = createPNG(800, 600, (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  const radius = 220;
  
  if (dist > radius) {
    // Completely transparent border
    return [0, 0, 0, 0];
  }

  // Smooth circular alpha edge
  const edgeDist = radius - dist;
  let alpha = 255;
  if (edgeDist < 20) {
    alpha = Math.round((edgeDist / 20) * 255);
  }

  // Radial color inside
  const r = Math.round(24 + (x / w) * 100);
  const g = Math.round(52 + (y / h) * 120);
  const b = Math.round(90 + ((x + y) / (w + h)) * 140);
  return [r, g, b, alpha];
});
fs.writeFileSync(path.join(outDir, 'sample-transparent.png'), transparentPng);
console.log(`sample-transparent.png: ${transparentPng.length} bytes`);

// 2. High-detail complex image for difficult target (1200x900 detailed patterns)
console.log('Generating difficult-target.png...');
const difficultPng = createPNG(1200, 900, (x, y, w, h) => {
  // Complex high frequency pattern with noise and checkerboard
  const checker = (Math.floor(x / 16) + Math.floor(y / 16)) % 2 === 0;
  const sine1 = Math.sin(x / 10) * Math.cos(y / 10);
  const sine2 = Math.sin((x + y) / 7);
  const val = Math.floor(((sine1 + sine2 + 2) / 4) * 200 + (checker ? 40 : 0));
  const r = (val * 3) % 256;
  const g = (val * 5 + x) % 256;
  const b = (val * 7 + y) % 256;
  return [r, g, b, 255];
});
fs.writeFileSync(path.join(outDir, 'difficult-target.png'), difficultPng);
console.log(`difficult-target.png: ${difficultPng.length} bytes`);

