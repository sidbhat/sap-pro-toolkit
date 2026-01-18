#!/usr/bin/env node

/**
 * SAP Pro Toolkit Icon Generator
 * 
 * Generates all required PNG icons from logo.svg
 * Uses sharp library for high-quality SVG to PNG conversion
 * 
 * Required sizes for Chrome Extension:
 * - 16x16: Toolbar icon (small)
 * - 32x32: Toolbar icon (retina)
 * - 48x48: Extension management page
 * - 128x128: Chrome Web Store listing
 * 
 * Usage: node icons/generate-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

async function generateIcons() {
  console.log(`${colors.bright}${colors.blue}SAP Pro Toolkit - Icon Generator${colors.reset}\n`);

  const svgPath = path.join(__dirname, 'logo.svg');
  
  if (!fs.existsSync(svgPath)) {
    console.error(`${colors.red}Error: logo.svg not found in icons/ directory${colors.reset}`);
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(svgPath);
  
  const sizes = [
    { size: 16, name: 'icon-16.png', desc: 'Toolbar icon (small)' },
    { size: 32, name: 'icon-32.png', desc: 'Toolbar icon (retina)' },
    { size: 48, name: 'icon-48.png', desc: 'Extension management' },
    { size: 128, name: 'icon-128.png', desc: 'Chrome Web Store listing' }
  ];

  console.log(`${colors.bright}Generating PNG icons from logo.svg:${colors.reset}`);

  for (const { size, name, desc } of sizes) {
    const outputPath = path.join(__dirname, name);
    
    try {
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      const stats = fs.statSync(outputPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`  ${colors.green}✓${colors.reset} ${name} (${size}x${size}px, ${sizeKB}KB) - ${desc}`);
    } catch (error) {
      console.error(`  ${colors.red}✗${colors.reset} Failed to create ${name}: ${error.message}`);
    }
  }

  // Also regenerate favicon files
  console.log(`\n${colors.bright}Generating favicon files:${colors.reset}`);
  
  try {
    await sharp(svgBuffer)
      .resize(16, 16)
      .png()
      .toFile(path.join(__dirname, 'favicon.png'));
    console.log(`  ${colors.green}✓${colors.reset} favicon.png (16x16px)`);
  } catch (error) {
    console.error(`  ${colors.red}✗${colors.reset} Failed to create favicon.png: ${error.message}`);
  }

  try {
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(__dirname, 'favicon-32.png'));
    console.log(`  ${colors.green}✓${colors.reset} favicon-32.png (32x32px)`);
  } catch (error) {
    console.error(`  ${colors.red}✗${colors.reset} Failed to create favicon-32.png: ${error.message}`);
  }

  console.log(`\n${colors.bright}${colors.green}Icon generation complete!${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`Generated: 6 PNG files from logo.svg`);
  console.log(`Location:  icons/`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

generateIcons().catch(error => {
  console.error(`${colors.red}Icon generation failed:${colors.reset}`, error.message);
  process.exit(1);
});
