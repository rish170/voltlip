#!/usr/bin/env node

/**
 * End-to-end installation test script.
 * Simulates a stranger installing and launching Voltlip via npm pack / npx.
 * Run by the human tester: npm run test:install
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log('=== Voltlip Install & Packaging Test ===');

const rootDir = path.resolve(__dirname, '..');

// Step 1: Pack the npm tarball
console.log('1. Packing npm package (npm pack)...');
let packOutput = '';
try {
  packOutput = execSync('npm pack', { cwd: rootDir, encoding: 'utf8' }).trim();
} catch (err) {
  console.error('Failed to run npm pack:', err.message);
  process.exit(1);
}

const lines = packOutput.split('\n');
const tarballName = lines[lines.length - 1].trim();
const tarballPath = path.join(rootDir, tarballName);

if (!fs.existsSync(tarballPath)) {
  console.error(`Error: Tarball not found at ${tarballPath}`);
  process.exit(1);
}
console.log(`   Created tarball: ${tarballName}`);

// Step 2: Create a clean temp user data folder
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voltlip-test-'));
console.log(`2. Created clean temp user-data folder: ${tempDir}`);

// Step 3: Launch with npx
console.log(`3. Executing: npx --yes ./${tarballName} --fresh --demo`);
console.log('   Look at the top edge of your screen. Voltlip should launch!');

try {
  const result = spawnSync('npx', ['--yes', `./${tarballName}`, '--fresh', '--demo'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  });

  if (result.status !== 0) {
    console.warn(`Launcher exited with status ${result.status}`);
  } else {
    console.log('   Launcher completed successfully.');
  }
} catch (err) {
  console.error('Error running npx:', err.message);
}

console.log('\nTesting session started.');
console.log(`When finished testing, you may delete the tarball: ${tarballPath}`);
console.log(`And temp folder: ${tempDir}`);
