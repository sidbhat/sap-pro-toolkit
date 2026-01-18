const sharp = require('sharp');
const fs = require('fs');

async function createFavicon() {
  const svgBuffer = fs.readFileSync('logo.svg');
  
  // Create 32x32 PNG (standard favicon size)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile('favicon-32.png');
  
  console.log('✓ Created favicon-32.png');
  
  // Create 16x16 PNG (smaller favicon)
  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile('favicon-16.png');
  
  console.log('✓ Created favicon-16.png');
  
  console.log('\n✅ Favicon files created!');
  console.log('Note: Modern browsers support PNG favicons. Use favicon-32.png or favicon-16.png');
}

createFavicon().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
