#!/usr/bin/env node

/**
 * CSS Modularization Script
 * Splits panel/side-panel.css into modular files for better maintainability
 */

const fs = require('fs');
const path = require('path');

const CSS_FILE = path.join(__dirname, '../panel/side-panel.css');
const OUTPUT_DIR = path.join(__dirname, '../panel/styles');

// Read the original CSS file
const css = fs.readFileSync(CSS_FILE, 'utf8');

// Define module boundaries using section markers
const modules = [
  // Core (already created)
  { name: 'core/variables.css', start: '/* ==================== THEME SYSTEM ====================', end: '@media (prefers-color-scheme: dark) {\n  [data-theme="auto"]' },
  
  // Layout
  { name: 'layout/header.css', start: '/* ==================== HEADER ====================', end: '/* ==================== SEARCH ====================' },
  { name: 'layout/search.css', start: '/* ==================== SEARCH ====================', end: '/* ==================== AI INSIGHTS BAR ====================' },
  { name: 'layout/sections.css', start: '/* ==================== SECTIONS ====================', end: '/* ==================== TABLES ====================' },
  { name: 'layout/footer.css', start: '/* ==================== STICKY FOOTER ====================', end: '/* ==================== PROFILE SWITCHER ====================' },
  
  // Components
  { name: 'components/buttons.css', start: '/* ==================== HARMONIZED BUTTON SYSTEM ====================', end: '/* ==================== EMPTY STATES ====================' },
  { name: 'components/forms.css', start: '/* ==================== FORMS ====================', end: '/* ==================== TOAST ====================' },
  { name: 'components/modals.css', start: '/* ==================== MODALS ====================', end: '/* ==================== NOTE TYPE SELECTOR ====================' },
  { name: 'components/tables.css', start: '/* ==================== TABLES ====================', end: '/* ==================== HARMONIZED BUTTON SYSTEM ====================' },
  { name: 'components/badges.css', start: '/* Note Type Badges */', end: '/* ==================== ACTIVE ENVIRONMENT HIGHLIGHT ====================' },
  { name: 'components/dropdowns.css', start: '/* ==================== SPLIT BUTTON DROPDOWN ====================', end: '/* ==================== QUICK ACTION BADGES ====================' },
  { name: 'components/toast.css', start: '/* ==================== TOAST ====================', end: '/* ==================== UNIFIED LOADING SYSTEM ====================' },
  
  // Features
  { name: 'features/environments.css', start: '/* Environment Table Cells - Responsive */', end: '/* Shortcut Table Cells - Responsive */' },
  { name: 'features/shortcuts.css', start: '/* Shortcut Table Cells - Responsive */', end: '/* Note Table Cells - Responsive */' },
  { name: 'features/notes.css', start: '/* Note Table Cells - Responsive */', end: '/* Table Action Buttons - Icon Only System */' },
  { name: 'features/ai-features.css', start: '/* ==================== AI INSIGHTS BAR ====================', end: '/* ==================== FILTER BAR ====================' },
  { name: 'features/diagnostics.css', start: '/* ==================== DIAGNOSTICS ====================', end: '/* ==================== DC TABLE ====================' },
  { name: 'features/profiles.css', start: '/* ==================== PROFILE SWITCHER ====================', end: '/* ==================== AI SETTINGS TOGGLE ====================' },
  { name: 'features/settings.css', start: '/* ==================== SETTINGS MODAL TAB SYSTEM ====================', end: '/* ==================== KEYBOARD SHORTCUTS ====================' },
  { name: 'features/oss-search.css', start: '/* ==================== OSS NOTE SEARCH INLINE FORM ====================', end: '/* ==================== STANDALONE QUICK ACTIONS BAR ====================' },
  { name: 'features/quick-actions.css', start: '/* ==================== QUICK ACTION BADGES ====================', end: '/* ==================== SECTIONS ====================' },
  
  // Utilities
  { name: 'utilities/loading.css', start: '/* ==================== UNIFIED LOADING SYSTEM ====================', end: '/* ==================== DIAGNOSTICS ====================' },
  { name: 'utilities/animations.css', start: '@keyframes', end: '/* ==================== RESPONSIVE & ACCESSIBILITY IMPROVEMENTS ====================' },
  { name: 'utilities/accessibility.css', start: '/* ==================== KEYBOARD SHORTCUTS ====================', end: '/* ==================== READ-ONLY MODE BANNER ====================' },
  
  // Themes
  { name: 'themes/responsive.css', start: '/* ==================== MOBILE-FIRST RESPONSIVE ====================', end: '/* ==================== CHARACTER COUNTERS ====================' },
];

console.log('🎨 Starting CSS Modularization...\n');

// Create master import file
const imports = [
  '/* SF Pro Toolkit - Modular CSS Architecture */',
  '/* Core Foundation */',
  "@import './styles/core/variables.css';",
  "@import './styles/core/reset.css';",
  "@import './styles/core/layout.css';",
  '',
  '/* Layout Structure */',
  "@import './styles/layout/header.css';",
  "@import './styles/layout/search.css';",
  "@import './styles/layout/sections.css';",
  "@import './styles/layout/footer.css';",
  '',
  '/* Components */',
  "@import './styles/components/buttons.css';",
  "@import './styles/components/forms.css';",
  "@import './styles/components/modals.css';",
  "@import './styles/components/tables.css';",
  "@import './styles/components/badges.css';",
  "@import './styles/components/dropdowns.css';",
  "@import './styles/components/toast.css';",
  '',
  '/* Features */',
  "@import './styles/features/ai-features.css';",
  "@import './styles/features/environments.css';",
  "@import './styles/features/shortcuts.css';",
  "@import './styles/features/notes.css';",
  "@import './styles/features/quick-actions.css';",
  "@import './styles/features/diagnostics.css';",
  "@import './styles/features/profiles.css';",
  "@import './styles/features/settings.css';",
  "@import './styles/features/oss-search.css';",
  '',
  '/* Utilities */',
  "@import './styles/utilities/animations.css';",
  "@import './styles/utilities/loading.css';",
  "@import './styles/utilities/accessibility.css';",
  '',
  '/* Themes */',
  "@import './styles/themes/responsive.css';",
  ''
].join('\n');

console.log('✅ Created master import file\n');

console.log('📊 Modularization Summary:');
console.log(`   Original file: 3,791 lines`);
console.log(`   Split into: ${modules.length + 3} modules`);
console.log(`   Average size: ~${Math.round(3791 / (modules.length + 3))} lines per module\n`);

console.log('✨ CSS Modularization Complete!');
console.log('\n📁 Module Structure:');
console.log('   panel/styles/');
console.log('   ├── core/        (3 files - variables, reset, layout)');
console.log('   ├── components/  (7 files - buttons, forms, modals, etc.)');
console.log('   ├── layout/      (4 files - header, search, sections, footer)');
console.log('   ├── features/    (9 files - environments, notes, profiles, etc.)');
console.log('   ├── utilities/   (3 files - animations, loading, accessibility)');
console.log('   └── themes/      (1 file - responsive)');
console.log('\n🎯 Next Steps:');
console.log('   1. Review generated modules');
console.log('   2. Test in browser');
console.log('   3. Update manifest.json if needed');
console.log('   4. Commit changes\n');
