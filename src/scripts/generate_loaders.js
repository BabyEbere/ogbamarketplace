const fs = require('fs');
const path = require('path');

// Let's copy animated svg to public/loader.svg
fs.copyFileSync('public/images/logo-loader.svg', 'public/loader.svg');

// Basic minimal valid animated GIF generator for Node.js
// Generates a multi-frame pulsing animated GIF with Ogba Market Place palette (#1E5E3A, #F97316, #FFFFFF)
function createAnimatedGif() {
  const width = 120;
  const height = 120;
  
  // Palette: 0: White/Transparent, 1: Deep Green, 2: Orange, 3: Soft Green
  const palette = [
    255, 255, 255, // 0: White
    30, 94, 58,    // 1: Emerald Green (#1E5E3A)
    249, 115, 22,  // 2: Orange (#F97316)
    208, 235, 216, // 3: Soft Green (#D0EBD8)
  ];

  // Helper to write GIF bytes
  const frames = [];
  const totalFrames = 8;

  for (let f = 0; f < totalFrames; f++) {
    const pixels = new Uint8Array(width * height);
    pixels.fill(0); // White background

    const angle = (f / totalFrames) * 2 * Math.PI;
    const pulseRadius = 40 + Math.sin(angle) * 4;

    // Draw circular rotating halo
    for (let deg = 0; deg < 360; deg += 10) {
      const rad = (deg * Math.PI) / 180 + angle;
      const x = Math.round(60 + Math.cos(rad) * pulseRadius);
      const y = Math.round(60 + Math.sin(rad) * pulseRadius);
      if (x >= 0 && x < width && y >= 0 && y < height) {
        pixels[y * width + x] = (deg % 20 === 0) ? 1 : 2;
        if (x + 1 < width) pixels[y * width + (x + 1)] = 1;
      }
    }

    // Draw central PM mark representation
    // P (Green)
    for (let py = 35; py <= 85; py++) {
      for (let px = 38; px <= 44; px++) {
        pixels[py * width + px] = 1;
      }
    }
    for (let py = 35; py <= 58; py++) {
      for (let px = 44; px <= 62; px++) {
        if (py === 35 || py === 58 || px === 62) {
          pixels[py * width + px] = 1;
        }
      }
    }

    // M (Orange)
    for (let my = 50; my <= 85; my++) {
      for (let mx = 58; mx <= 84; mx++) {
        if (mx === 58 || mx === 84) {
          pixels[my * width + mx] = 2;
        }
        if ((mx === 64 && my === 60) || (mx === 70 && my === 70) || (mx === 76 && my === 60)) {
          pixels[my * width + mx] = 2;
          pixels[my * width + (mx + 1)] = 2;
        }
      }
    }

    // Leaves on top (Green)
    for (let lx = 48; lx <= 60; lx++) {
      pixels[30 * width + lx] = 1;
      pixels[31 * width + lx] = 1;
      pixels[32 * width + lx] = 1;
    }

    frames.push(pixels);
  }

  // Encode GIF89a
  const buffer = [];
  function writeStr(s) { for (let i = 0; i < s.length; i++) buffer.push(s.charCodeAt(i)); }
  function writeShort(v) { buffer.push(v & 0xff); buffer.push((v >> 8) & 0xff); }

  writeStr('GIF89a');
  writeShort(width);
  writeShort(height);
  buffer.push(0x80 | 0x70 | 0x01); // Global Color Table Flag, 2 bits (4 colors)
  buffer.push(0); // Background Color Index
  buffer.push(0); // Pixel Aspect Ratio

  // Global Color Table
  for (let c of palette) buffer.push(c);
  for (let pad = palette.length; pad < 4 * 3; pad++) buffer.push(0);

  // Netscape 2.0 Loop Extension
  buffer.push(0x21, 0xff, 0x0b);
  writeStr('NETSCAPE2.0');
  buffer.push(0x03, 0x01, 0x00, 0x00, 0x00);

  // Write Frames
  frames.forEach(frame => {
    // Graphic Control Extension (Delay: 10 = 100ms)
    buffer.push(0x21, 0xf9, 0x04, 0x04, 10, 0, 0, 0);

    // Image Descriptor
    buffer.push(0x2c);
    writeShort(0);
    writeShort(0);
    writeShort(width);
    writeShort(height);
    buffer.push(0); // Local color table flag: none

    // Image Data (Uncompressed LZW literal stream)
    const minCodeSize = 2;
    buffer.push(minCodeSize);

    // Simple raw LZW chunks
    const clearCode = 1 << minCodeSize;
    const endCode = clearCode + 1;
    
    // Sub-block encoding
    const subBlock = [];
    // We write in 126 byte chunks with literal tokens
    let byteAcc = 0;
    let bitAcc = 0;
    let codeBits = minCodeSize + 1;

    function putCode(c) {
      byteAcc |= (c << bitAcc);
      bitAcc += codeBits;
      while (bitAcc >= 8) {
        subBlock.push(byteAcc & 0xff);
        byteAcc >>= 8;
        bitAcc -= 8;
      }
    }

    putCode(clearCode);
    for (let i = 0; i < frame.length; i++) {
      putCode(frame[i]);
      if (i > 0 && i % 250 === 0) {
        putCode(clearCode);
      }
    }
    putCode(endCode);
    if (bitAcc > 0) {
      subBlock.push(byteAcc & 0xff);
    }

    // Split subBlocks into <= 254 bytes
    let offset = 0;
    while (offset < subBlock.length) {
      const len = Math.min(254, subBlock.length - offset);
      buffer.push(len);
      for (let j = 0; j < len; j++) {
        buffer.push(subBlock[offset + j]);
      }
      offset += len;
    }
    buffer.push(0); // Sub-block terminator
  });

  buffer.push(0x3b); // Trailer
  return Buffer.from(buffer);
}

const gifBuffer = createAnimatedGif();
fs.writeFileSync('public/loader.gif', gifBuffer);
fs.writeFileSync('public/images/logo-loader.gif', gifBuffer);

const mobileAssetDir = 'apps/mobile/assets/images';
if (!fs.existsSync(mobileAssetDir)) fs.mkdirSync(mobileAssetDir, { recursive: true });
fs.writeFileSync(path.join(mobileAssetDir, 'logo-loader.gif'), gifBuffer);

console.log('Successfully generated animated GIF loaders in public and mobile assets!');
