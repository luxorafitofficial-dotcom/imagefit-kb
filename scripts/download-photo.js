const fs = require('fs');
const path = require('path');
const https = require('https');

const outDir = path.join(__dirname, '..', 'public', 'test-images');
const photoPath = path.join(outDir, 'sample-photo.jpg');

// Try downloading a realistic landscape photo from Wikimedia Commons
const photoUrl = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80';

console.log('Downloading sample photograph...');

function download(url, dest, callback) {
  const file = fs.createWriteStream(dest);
  https.get(url, (response) => {
    // Handle redirect
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      return download(response.headers.location, dest, callback);
    }
    if (response.statusCode !== 200) {
      return callback(new Error(`Failed with status code: ${response.statusCode}`));
    }
    response.pipe(file);
    file.on('finish', () => {
      file.close(callback);
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    callback(err);
  });
}

download(photoUrl, photoPath, (err) => {
  if (err) {
    console.error('Error downloading sample photo:', err.message);
    process.exit(1);
  } else {
    const stats = fs.statSync(photoPath);
    console.log(`sample-photo.jpg successfully created: ${stats.size} bytes`);
  }
});

