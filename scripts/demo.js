#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

const electronPath = require('electron');
const appEntry = path.resolve(__dirname, '../src/main/main.js');

const userArg = process.argv[2] || '29:discharging';
const childArgs = [appEntry, '--demo', `--mock=${userArg}`];

console.log(`Starting Voltlip in demo mode pinned to: ${userArg}`);
const child = spawn(electronPath, childArgs, {
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
