// Corrupted file generator
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'test-images', 'corrupted-sample.jpg');
// Starts with JPEG magic bytes FF D8 FF but garbage payload
const corruptedData = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x00, 0x99, 0x88, 0x77, 0x66, 0x55]);
fs.writeFileSync(filePath, corruptedData);
console.log('Created corrupted-sample.jpg:', corruptedData.length, 'bytes');
