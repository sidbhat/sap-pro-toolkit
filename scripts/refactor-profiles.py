#!/usr/bin/env python3
"""
Refactor all profile JSON files:
- Remove 'tags' from shortcuts
- Replace 'tags' with 'noteType' in notes
- Add 'aiConfig' for ai-prompt notes
- Update version to 2.0
"""

import json
import os
from pathlib import Path

# Note type mappings based on old tags
NOTE_TYPE_MAP = {
    'ai': 'ai-prompt',
    'joule': 'ai-prompt',
    'prompts': 'ai-prompt',
    'code': 'code',
    'platform': 'documentation',
    'documentation': 'documentation'
}

def determine_note_type(tags):
    """Determine noteType from old tags array"""
    if not tags:
        return 'note'
    
    tags_lower = [tag.lower() for tag in tags]
    
    # Check for AI-related tags first (highest priority)
    if any(tag in ['ai', 'joule', 'prompts'] for tag in tags_lower):
        return 'ai-prompt'
    
    # Check for code
    if 'code' in tags_lower:
        return 'code'
    
    # Check for documentation
    if any(tag in ['documentation', 'platform'] for tag in tags_lower):
        return 'documentation'
    
    # Default to note
    return 'note'

def refactor_shortcuts(shortcuts):
    """Remove tags from shortcuts"""
    refactored = []
    for shortcut in shortcuts:
        new_shortcut = {k: v for k, v in shortcut.items() if k != 'tags'}
        refactored.append(new_shortcut)
    return refactored

def refactor_notes(notes):
    """Replace tags with noteType, add aiConfig for ai-prompts"""
    import time
    refactored = []
    for note in notes:
        # Determine note type from old tags
        note_type = determine_note_type(note.get('tags', []))
        
        # Create new note structure
        new_note = {
            'id': note.get('id', f"note-{int(time.time())}"),
            'title': note.get('title', 'Untitled'),
            'content': note.get('content', ''),
            'noteType': note_type,
            'icon': note.get('icon', '0'),
            'timestamp': note.get('timestamp', int(time.time() * 1000))
        }
        
        # Add aiConfig for ai-prompt notes
        if note_type == 'ai-prompt':
            new_note['aiConfig'] = {
                'defaultModel': 'gpt-4-turbo'
            }
        
        refactored.append(new_note)
    
    return refactored

def refactor_profile(file_path):
    """Refactor a single profile JSON file"""
    print(f"Refactoring {file_path}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Update version
    data['version'] = '2.0'
    data['lastUpdated'] = '2026-01-13'
    
    # Refactor shortcuts
    if 'globalShortcuts' in data:
        data['globalShortcuts'] = refactor_shortcuts(data['globalShortcuts'])
    if 'shortcuts' in data:
        data['shortcuts'] = refactor_shortcuts(data['shortcuts'])
    
    # Refactor notes
    if 'notes' in data:
        data['notes'] = refactor_notes(data['notes'])
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ {file_path} refactored successfully")

def main():
    """Refactor all profile JSON files"""
    resources_dir = Path(__file__).parent.parent / 'resources'
    profile_files = list(resources_dir.glob('profile-*.json'))
    
    print(f"Found {len(profile_files)} profile files to refactor\n")
    
    for profile_file in profile_files:
        refactor_profile(profile_file)
    
    print(f"\n✅ All {len(profile_files)} profile files refactored successfully!")
    print("   - Tags removed from shortcuts")
    print("   - Note types assigned based on tags")
    print("   - aiConfig added to ai-prompt notes")
    print("   - Version updated to 2.0")

if __name__ == '__main__':
    main()
