#!/usr/bin/env python3
"""
CSS Modularization Script
Splits panel/side-panel.css into modular files for better maintainability
"""

import os
import re

# Define the CSS file path
CSS_FILE = os.path.join(os.path.dirname(__file__), '../panel/side-panel.css')
OUTPUT_BASE = os.path.join(os.path.dirname(__file__), '../panel/styles')

# Read the CSS file
with open(CSS_FILE, 'r', encoding='utf-8') as f:
    css_content = f.read()

# Define module extraction rules (section markers to file mappings)
modules = {
    # Layout
    'layout/header.css': {
        'start': '/* ==================== HEADER ====================',
        'end': '/* ==================== SEARCH ===================='
    },
    'layout/search.css': {
        'start': '/* ==================== SEARCH ====================',
        'end': '#aiSearchBtn {'
    },
    'layout/sections.css': {
        'start': '/* ==================== SECTIONS ====================',
        'end': '/* ==================== TABLES ===================='
    },
    'layout/footer.css': {
        'start': '/* ==================== STICKY FOOTER ====================',
        'end': '/* ==================== PROFILE SWITCHER ===================='
    },
    
    # Components
    'components/forms.css': {
        'start': '/* ==================== FORMS ====================',
        'end': '/* ==================== TOAST ===================='
    },
    'components/modals.css': {
        'start': '/* ==================== MODALS ====================',
        'end': '/* ==================== HARMONIZED MODAL FOOTER SYSTEM ===================='
    },
    'components/tables.css': {
        'start': '/* ==================== TABLES ====================',
        'end': '/* Table Action Buttons - Icon Only System */'
    },
    'components/badges.css': {
        'start': '/* Note Type Badges */',
        'end': '/* ==================== ACTIVE ENVIRONMENT HIGHLIGHT ===================='
    },
    'components/dropdowns.css': {
        'start': '/* ==================== SPLIT BUTTON DROPDOWN ====================',
        'end': '/* ==================== QUICK ACTION BADGES ===================='
    },
    'components/toast.css': {
        'start': '/* ==================== TOAST ====================',
        'end': '/* ==================== UNIFIED LOADING SYSTEM ===================='
    },
    
    # Features
    'features/ai-insights.css': {
        'start': '/* ==================== AI INSIGHTS BAR ====================',
        'end': '/* ==================== FILTER BAR ===================='
    },
    'features/quick-actions.css': {
        'start': '/* ==================== QUICK ACTION BADGES ====================',
        'end': '.section {'
    },
    'features/environments.css': {
        'start': '/* Environment Table Cells - Responsive */',
        'end': '/* Shortcut Table Cells - Responsive */'
    },
    'features/shortcuts.css': {
        'start': '/* Shortcut Table Cells - Responsive */',
        'end': '/* Note Table Cells - Responsive */'
    },
    'features/notes.css': {
        'start': '/* Note Table Cells - Responsive */',
        'end': '/* Table Action Buttons - Icon Only System */'
    },
    'features/diagnostics.css': {
        'start': '/* ==================== DIAGNOSTICS ====================',
        'end': '/* ==================== DC TABLE ===================='
    },
    'features/profiles.css': {
        'start': '/* ==================== PROFILE SWITCHER ====================',
        'end': '/* ==================== AI SETTINGS TOGGLE ===================='
    },
    'features/settings.css': {
        'start': '/* ==================== SETTINGS MODAL TAB SYSTEM ====================',
        'end': '/* ==================== KEYBOARD SHORTCUTS ===================='
    },
    'features/oss-search.css': {
        'start': '/* ==================== OSS NOTE SEARCH INLINE FORM ====================',
        'end': '/* ==================== STANDALONE QUICK ACTIONS BAR ===================='
    },
    
    # Utilities
    'utilities/loading.css': {
        'start': '/* ==================== UNIFIED LOADING SYSTEM ====================',
        'end': '/* ==================== DIAGNOSTICS ===================='
    },
    'utilities/animations.css': {
        'start': '@keyframes slideDown {',
        'end': '/* ==================== RESPONSIVE & ACCESSIBILITY IMPROVEMENTS ===================='
    },
    'utilities/accessibility.css': {
        'start': '/* ==================== KEYBOARD SHORTCUTS ====================',
        'end': '/* ==================== READ-ONLY MODE BANNER ===================='
    },
    
    # Themes
    'themes/responsive.css': {
        'start': '/* ==================== MOBILE-FIRST RESPONSIVE ====================',
        'end': '/* ==================== CHARACTER COUNTERS ===================='
    },
}

def extract_section(content, start_marker, end_marker):
    """Extract a section of CSS between two markers"""
    start_idx = content.find(start_marker)
    if start_idx == -1:
        return None
    
    end_idx = content.find(end_marker, start_idx + len(start_marker))
    if end_idx == -1:
        # If no end marker, take to end of file
        return content[start_idx:]
    
    return content[start_idx:end_idx]

# Extract and write each module
print('🎨 Starting CSS Modularization...\n')

created_files = []
for module_path, markers in modules.items():
    section = extract_section(css_content, markers['start'], markers['end'])
    
    if section:
        output_path = os.path.join(OUTPUT_BASE, module_path)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(section)
        
        line_count = len(section.split('\n'))
        created_files.append((module_path, line_count))
        print(f'✅ Created {module_path} ({line_count} lines)')

print(f'\n📊 Modularization Summary:')
print(f'   Created {len(created_files)} module files')
print(f'   Total lines distributed: {sum(count for _, count in created_files)}')

print('\n✨ CSS Modularization Complete!')
