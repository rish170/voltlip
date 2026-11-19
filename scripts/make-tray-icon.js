const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Standard CRC32 table implementation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function generatePNG(width, height, pixelFn) {
  // Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // deflate compression
  ihdrData[11] = 0; // filter 0
  ihdrData[12] = 0; // no interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      scanlines[offset++] = r;
      scanlines[offset++] = g;
      scanlines[offset++] = b;
      scanlines[offset++] = a;
    }
  }

  const idatCompressed = zlib.deflateSync(scanlines);
  const idatChunk = createChunk('IDAT', idatCompressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function drawBatteryIcon(x, y, w, _h) {
  // Battery body: horizontal rounded rectangle with positive terminal on right
  // Scaling factors
  const s = w / 16;
  const bodyX0 = Math.round(1 * s);
  const bodyX1 = Math.round(12 * s);
  const bodyY0 = Math.round(4 * s);
  const bodyY1 = Math.round(11 * s);
  const capX0 = Math.round(13 * s);
  const capX1 = Math.round(14 * s);
  const capY0 = Math.round(6 * s);
  const capY1 = Math.round(9 * s);

  // Border thickness
  const border = Math.max(1, Math.round(1 * s));

  // Terminal cap
  if (x >= capX0 && x <= capX1 && y >= capY0 && y <= capY1) {
    return [0, 0, 0, 255];
  }

  // Battery body
  if (x >= bodyX0 && x <= bodyX1 && y >= bodyY0 && y <= bodyY1) {
    // Outer border
    const isBorder = (
      x < bodyX0 + border ||
      x > bodyX1 - border ||
      y < bodyY0 + border ||
      y > bodyY1 - border
    );
    if (isBorder) {
      return [0, 0, 0, 255];
    }
    // Inside battery: partial charge fill (e.g. 70%)
    const innerX0 = bodyX0 + border + 1;
    const innerX1 = bodyX1 - border - 1;
    const fillWidth = Math.round((innerX1 - innerX0) * 0.75);
    if (x >= innerX0 && x <= innerX0 + fillWidth) {
      return [0, 0, 0, 255];
    }
    return [0, 0, 0, 0];
  }

  return [0, 0, 0, 0];
}

function main() {
  const assetsDir = path.resolve(__dirname, '..', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const icon16 = generatePNG(16, 16, drawBatteryIcon);
  fs.writeFileSync(path.join(assetsDir, 'tray-icon-16.png'), icon16);

  const icon32 = generatePNG(32, 32, drawBatteryIcon);
  fs.writeFileSync(path.join(assetsDir, 'tray-icon-32.png'), icon32);

  // Also default tray-icon.png (32x32)
  fs.writeFileSync(path.join(assetsDir, 'tray-icon.png'), icon32);

  console.log('Tray icons generated in assets/');
}

if (require.main === module) {
  main();
}

module.exports = { generatePNG, drawBatteryIcon };
