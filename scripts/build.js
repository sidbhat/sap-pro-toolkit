#!/usr/bin/env node

/**
 * SF Pro Toolkit Build Script
 * 
 * Creates a production-ready distribution build for Chrome Web Store submission.
 * 
 * Features:
 * - Copies all necessary files to dist/ directory
 * - Excludes development files (.clinerules, .github, docs)
 * - Creates INSTALL.md guide for unpacked installation
 * - Outputs build summary with file counts
 * 
 * Usage:
 *   npm run build        - Create dist/ folder
 *   npm run build:zip    - Create dist/ + ZIP file
 *   npm run clean        - Remove dist/ and ZIP files
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

// Configuration
const BUILD_DIR = 'dist';
const SOURCE_DIRS = [
  'panel',
  'background',
  'content',
  'resources',
  'icons',
  '_locales'
];
const SOURCE_FILES = [
  'manifest.json'
];

/**
 * Recursively copy directory contents
 */
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  let fileCount = 0;

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip .DS_Store files
    if (entry.name === '.DS_Store') {
      continue;
    }

    // Use sanitized public version for profile-successfactors.json
    if (entry.name === 'profile-successfactors.json') {
      console.log(`  ${colors.yellow}⚠${colors.reset} Skipping ${srcPath} (using public version instead)`);
      continue;
    }
    
    // Copy public version as profile-successfactors.json
    if (entry.name === 'profile-successfactors-public.json') {
      const publicDestPath = path.join(dest, 'profile-successfactors.json');
      fs.copyFileSync(srcPath, publicDestPath);
      console.log(`  ${colors.green}✓${colors.reset} ${entry.name} → profile-successfactors.json (sanitized)`);
      fileCount++;
      continue;
    }

    if (entry.isDirectory()) {
      fileCount += copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      fileCount++;
    }
  }

  return fileCount;
}

/**
 * Copy a single file
 */
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

/**
 * Minify JavaScript file using Terser
 */
async function minifyJSFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  
  try {
    const result = await minify(code, {
      compress: {
        dead_code: true,
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true,
        pure_funcs: ['console.debug']
      },
      mangle: {
        toplevel: false, // Don't mangle top-level names (for debugging)
        reserved: [] // Reserved names that shouldn't be mangled
      },
      format: {
        comments: false, // Remove comments
        beautify: false
      }
    });

    if (result.code) {
      fs.writeFileSync(filePath, result.code);
      return true;
    }
  } catch (error) {
    console.error(`  ${colors.red}✗${colors.reset} Failed to minify ${path.basename(filePath)}: ${error.message}`);
    return false;
  }
  
  return false;
}

/**
 * Minify all JavaScript files in dist/
 */
async function minifyAllJS() {
  const jsFiles = [
    'background/background.js',
    'panel/side-panel.js',
    'panel/toolkit-core.js',
    'panel/sap-icon-library.js',
    'panel/validation.js',
    'content/content.js',
    'content/injected.js'
  ];

  console.log(`\n${colors.bright}Minifying JavaScript files:${colors.reset}`);
  
  let minified = 0;
  let originalSize = 0;
  let minifiedSize = 0;

  for (const file of jsFiles) {
    const filePath = path.join(BUILD_DIR, file);
    if (fs.existsSync(filePath)) {
      const beforeSize = fs.statSync(filePath).size;
      const success = await minifyJSFile(filePath);
      
      if (success) {
        const afterSize = fs.statSync(filePath).size;
        const reduction = ((beforeSize - afterSize) / beforeSize * 100).toFixed(1);
        console.log(`  ${colors.green}✓${colors.reset} ${file} (${(beforeSize/1024).toFixed(1)}KB → ${(afterSize/1024).toFixed(1)}KB, -${reduction}%)`);
        
        minified++;
        originalSize += beforeSize;
        minifiedSize += afterSize;
      }
    }
  }

  const totalReduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
  console.log(`\n${colors.bright}Minification Summary:${colors.reset}`);
  console.log(`  Files minified: ${minified}/${jsFiles.length}`);
  console.log(`  Original size:  ${(originalSize/1024).toFixed(1)}KB`);
  console.log(`  Minified size:  ${(minifiedSize/1024).toFixed(1)}KB`);
  console.log(`  Space saved:    ${((originalSize - minifiedSize)/1024).toFixed(1)}KB (${totalReduction}% reduction)`);
}

/**
 * Create INSTALL.md guide in dist/
 */
function createInstallGuide() {
  const content = `# SF Pro Toolkit - Installation Guide

## Chrome Web Store Installation (Recommended)

1. Visit the [Chrome Web Store listing](https://chromewebstore.google.com/detail/sf-pro-toolkit/[ID])
2. Click "Add to Chrome"
3. Confirm installation
4. Extension ready to use!

## Manual Installation (Developer Mode)

If installing from this distribution package:

1. **Enable Developer Mode**:
   - Open Chrome and go to \`chrome://extensions/\`
   - Toggle "Developer mode" in the top right

2. **Load Extension**:
   - Click "Load unpacked"
   - Select this \`dist\` folder
   - Extension will appear in your toolbar

3. **Configure**:
   - Click extension icon to open side panel
   - Add your SAP SuccessFactors environments
   - Customize profiles and shortcuts

## First-Time Setup

1. **Add Environments**:
   - Click "⚙️ Manage" to open environment manager
   - Add your SF instances (sandbox, production, etc.)
   - Save configurations

2. **Explore Features**:
   - Environment switcher with keyboard shortcuts
   - Quick Actions menu (Admin Center, Provisioning, etc.)
   - Profile-specific resources and notes
   - One-click diagnostics copy

## Support

- GitHub: https://github.com/sidbhat/sf-pro-toolkit
- Issues: https://github.com/sidbhat/sf-pro-toolkit/issues
- Documentation: See README.md

---
Built: ${new Date().toISOString()}
Version: ${require('../package.json').version}
`;

  fs.writeFileSync(path.join(BUILD_DIR, 'INSTALL.md'), content);
}

/**
 * Main build function
 */
async function build() {
  console.log(`${colors.bright}${colors.blue}SF Pro Toolkit - Build Script${colors.reset}\n`);

  // Clean existing build
  if (fs.existsSync(BUILD_DIR)) {
    console.log(`${colors.yellow}Cleaning existing build directory...${colors.reset}`);
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  }

  // Create build directory
  fs.mkdirSync(BUILD_DIR, { recursive: true });
  console.log(`${colors.green}✓${colors.reset} Created ${BUILD_DIR}/ directory\n`);

  let totalFiles = 0;

  // Copy directories
  console.log(`${colors.bright}Copying source directories:${colors.reset}`);
  for (const dir of SOURCE_DIRS) {
    if (fs.existsSync(dir)) {
      const fileCount = copyDir(dir, path.join(BUILD_DIR, dir));
      console.log(`  ${colors.green}✓${colors.reset} ${dir}/ (${fileCount} files)`);
      totalFiles += fileCount;
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${dir}/ (not found, skipping)`);
    }
  }

  // Copy individual files
  console.log(`\n${colors.bright}Copying root files:${colors.reset}`);
  for (const file of SOURCE_FILES) {
    if (fs.existsSync(file)) {
      copyFile(file, path.join(BUILD_DIR, file));
      console.log(`  ${colors.green}✓${colors.reset} ${file}`);
      totalFiles++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} ${file} (not found)`);
    }
  }

  // Create INSTALL.md
  console.log(`\n${colors.bright}Creating documentation:${colors.reset}`);
  createInstallGuide();
  console.log(`  ${colors.green}✓${colors.reset} INSTALL.md`);

  // Minify JavaScript files
  await minifyAllJS();

  // Build summary
  const manifest = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'manifest.json'), 'utf8'));
  console.log(`\n${colors.bright}${colors.green}Build Complete!${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`Extension:  ${manifest.name}`);
  console.log(`Version:    ${manifest.version}`);
  console.log(`Files:      ${totalFiles} files copied`);
  console.log(`Output:     ${BUILD_DIR}/`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

  console.log(`\n${colors.bright}Next Steps:${colors.reset}`);
  console.log(`  1. Test unpacked: ${colors.blue}chrome://extensions/${colors.reset} → Load unpacked → Select dist/`);
  console.log(`  2. Create ZIP:    ${colors.blue}npm run build:zip${colors.reset}`);
  console.log(`  3. Upload to:     ${colors.blue}https://chrome.google.com/webstore/devconsole${colors.reset}\n`);
}

// Run build
(async () => {
  try {
    await build();
  } catch (error) {
    console.error(`${colors.red}Build failed:${colors.reset}`, error.message);
    process.exit(1);
  }
})();
