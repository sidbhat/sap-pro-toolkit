#!/usr/bin/env node

/**
 * Version Synchronization Script
 * 
 * Keeps version numbers in sync across package.json and manifest.json
 * 
 * Usage:
 *   npm run version:bump:patch  - 1.1.0 → 1.1.1
 *   npm run version:bump:minor  - 1.1.0 → 1.2.0
 *   npm run version:bump:major  - 1.1.0 → 2.0.0
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m'
};

function syncVersion() {
  console.log(`${colors.bright}${colors.blue}Version Sync Script${colors.reset}\n`);

  // Read package.json version (source of truth after npm version bump)
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const newVersion = packageJson.version;

  // Update manifest.json
  const manifestPath = path.join(__dirname, '..', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const oldVersion = manifest.version;

  if (oldVersion === newVersion) {
    console.log(`${colors.yellow}No version change needed${colors.reset}`);
    console.log(`Current version: ${newVersion}\n`);
    return;
  }

  manifest.version = newVersion;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`${colors.green}✓${colors.reset} Version synchronized`);
  console.log(`  ${oldVersion} → ${colors.bright}${newVersion}${colors.reset}`);
  console.log(`\n${colors.bright}Updated files:${colors.reset}`);
  console.log(`  - package.json`);
  console.log(`  - manifest.json`);
  console.log(`\n${colors.bright}Next steps:${colors.reset}`);
  console.log(`  1. Update CHANGELOG.md with version ${newVersion}`);
  console.log(`  2. git add -A`);
  console.log(`  3. git commit -m "chore: bump version to ${newVersion}"`);
  console.log(`  4. git tag v${newVersion}`);
  console.log(`  5. git push && git push --tags\n`);
}

try {
  syncVersion();
} catch (error) {
  console.error(`${colors.red}Sync failed:${colors.reset}`, error.message);
  process.exit(1);
}
