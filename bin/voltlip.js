#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

function run() {
  let electronPath;
  try {
    electronPath = require('electron');
  } catch (_err) {
    console.error('Error: Failed to locate the Electron binary.');
    console.error('Please ensure voltlip was installed completely or run: npm install voltlip');
    console.error('For help, see: https://github.com/voltlip/voltlip/blob/main/docs/TROUBLESHOOTING.md');
    process.exit(1);
  }

  const appEntry = path.resolve(__dirname, '../src/main/main.js');
  const forwardedArgs = process.argv.slice(2);
  const childArgs = [appEntry, ...forwardedArgs];

  try {
    const child = spawn(electronPath, childArgs, {
      detached: true,
      stdio: 'ignore',
    });

    child.unref();

    console.log('Voltlip is starting... look at the top edge of your screen.');
    process.exit(0);
  } catch (err) {
    console.error('Error launching Voltlip:', err.message);
    console.error('For troubleshooting help, see: https://github.com/voltlip/voltlip/blob/main/docs/TROUBLESHOOTING.md');
    process.exit(1);
  }
}

run();
