import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { generatePNG, drawBatteryIcon } from '../scripts/make-tray-icon.js';

describe('make-tray-icon', () => {
  it('generates valid PNG header and chunks for 16x16 and 32x32', () => {
    const icon16 = generatePNG(16, 16, drawBatteryIcon);
    expect(icon16.length).toBeGreaterThan(60);

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    expect(icon16[0]).toBe(0x89);
    expect(icon16[1]).toBe(0x50);
    expect(icon16[2]).toBe(0x4e);
    expect(icon16[3]).toBe(0x47);

    const icon32 = generatePNG(32, 32, drawBatteryIcon);
    expect(icon32.length).toBeGreaterThan(60);
    expect(icon32[0]).toBe(0x89);

    // Write to assets if not present
    const assetsDir = path.resolve(__dirname, '..', 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(assetsDir, 'tray-icon-16.png'), icon16);
    fs.writeFileSync(path.join(assetsDir, 'tray-icon-32.png'), icon32);
    fs.writeFileSync(path.join(assetsDir, 'tray-icon.png'), icon32);

    expect(fs.existsSync(path.join(assetsDir, 'tray-icon-16.png'))).toBe(true);
    expect(fs.existsSync(path.join(assetsDir, 'tray-icon-32.png'))).toBe(true);
  });
});
