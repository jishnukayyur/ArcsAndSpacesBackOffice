const { spawnSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const ngCliPath = path.join(process.cwd(), 'node_modules', '@angular', 'cli', 'bin', 'ng.js');

const result = spawnSync(process.execPath, [ngCliPath, ...args], {
  stdio: 'inherit',
  env: process.env
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
