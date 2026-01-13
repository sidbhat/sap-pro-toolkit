# Validation Integration - Remaining Steps

## ✅ Completed

1. Created validation.js with all sanitization and validation functions
2. Added validation.js script to side-panel.html
3. Added character counters to all form fields in HTML
4. Added CSS for character counters, text truncation, and validation states

## 🔄 In Progress - JavaScript Integration

### Step 1: Update saveEnvironment() Function

Replace the existing saveEnvironment() function with:

```javascript
async function saveEnvironment() {
  const rawData = {
    name: document.getElementById('envName').value,
    type: document.getElementById('envType').value,
    hostname: document.getElementById('envHostname').value,
    notes: document.getElementById('envNotes').value
  };
  
  // Validate and sanitize
  const validation = validateEnvironment(rawData);
  
  if (!validation.valid) {
    showToast(validation.errors[0], 'error');
    return;
  }
  
  const modal = document.getElementById('addEnvModal');
  const editId = modal.getAttribute('data-edit-id');
  
  try {
    if (editId) {
      environments = environments.filter(e => e.id !== editId);
      environments.unshift({ ...validation.sanitized, id: editId });
      showToast('Environment updated ✓', 'success');
      modal.removeAttribute('data-edit-id');
    } else {
      const newEnv = { ...validation.sanitized, id: `env-${Date.now()}` };
      environments.unshift(newEnv);
      showToast('Environment saved ✓', 'success');
    }
    
    const storageKey = `environments_${currentProfile}`;
    await chrome.storage.local.set({ [storageKey]: environments });
    
    renderEnvironments();
    closeAddEnvironmentModal();
  } catch (error) {
    console.error('Failed to save environment:', error);
    showToast('Failed to save environment. Please try again.', 'error');
  }
}
```

### Step 2: Update saveShortcut() Function

```javascript
async function saveShortcut() {
  const rawData = {
    name: document.getElementById('shortcutName').value,
    url: document.getElementById('shortcutPath').value,
    notes: document.getElementById('shortcutNotes').value,
    icon: document.getElementById('shortcutIcon').value,
    tags: document.getElementById('shortcutTags').value
  };
  
  // Validate and sanitize
  const validation = validateShortcut(rawData);
  
  if (!validation.valid) {
    showToast(validation.errors[0], 'error');
    return;
  }
  
  const modal = document.getElementById('addShortcutModal');
  const editId = modal.getAttribute('data-edit-id');
  
  if (editId) {
    shortcuts = shortcuts.filter(s => s.id !== editId);
    shortcuts.unshift({ ...validation.sanitized, id: editId });
    showToast('Shortcut updated ✓', 'success');
    modal.removeAttribute('data-edit-id');
  } else {
    const newShortcut = { ...validation.sanitized, id: `shortcut-${Date.now()}` };
    shortcuts.unshift(newShortcut);
    showToast('Shortcut saved ✓', 'success');
  }
  
  await chrome.storage.local.set({ shortcuts });
  renderShortcuts();
  closeAddShortcutModal();
}
```

### Step 3: Update saveNote() Function

```javascript
async function saveNote() {
  const rawData = {
    title: document.getElementById('noteTitle').value,
    content: document.getElementById('noteContent').value,
    icon: document.getElementById('noteIcon').value,
    tags: document.getElementById('noteTags').value
  };
  
  // Validate and sanitize
  const validation = validateNote(rawData);
  
  if (!validation.valid) {
    showToast(validation.errors[0], 'error');
    return;
  }
  
  const modal = document.getElementById('addNoteModal');
  const editId = modal.getAttribute('data-edit-id');
  
  if (editId) {
    notes = notes.filter(n => n.id !== editId);
    notes.unshift({ ...validation.sanitized, id: editId, timestamp: Date.now() });
    showToast('Note updated ✓', 'success');
    modal.removeAttribute('data-edit-id');
  } else {
    const newNote = { ...validation.sanitized, id: `note-${Date.now()}`, timestamp: Date.now() };
    notes.unshift(newNote);
    showToast('Note saved ✓', 'success');
  }
  
  await chrome.storage.local.set({ notes });
  renderNotes();
  closeAddNoteModal();
}
```

### Step 4: Setup Character Counters

Add to setupEventListeners() function:

```javascript
// Character counter setup
setupCharacterCounter('envName', 'envNameCounter', VALIDATION_LIMITS.ENV_NAME_MAX);
setupCharacterCounter('envHostname', 'envHostnameCounter', VALIDATION_LIMITS.ENV_HOSTNAME_MAX);
setupCharacterCounter('envNotes', 'envNotesCounter', VALIDATION_LIMITS.ENV_NOTES_MAX);

setupCharacterCounter('shortcutName', 'shortcutNameCounter', VALIDATION_LIMITS.SHORTCUT_NAME_MAX);
setupCharacterCounter('shortcutPath', 'shortcutPathCounter', VALIDATION_LIMITS.SHORTCUT_URL_MAX);
setupCharacterCounter('shortcutNotes', 'shortcutNotesCounter', VALIDATION_LIMITS.SHORTCUT_NOTES_MAX);
setupCharacterCounter('shortcutTags', 'shortcutTagsCounter', 300);

setupCharacterCounter('noteTitle', 'noteTitleCounter', VALIDATION_LIMITS.NOTE_TITLE_MAX);
setupCharacterCounter('noteContent', 'noteContentCounter', VALIDATION_LIMITS.NOTE_CONTENT_MAX);
setupCharacterCounter('noteTags', 'noteTagsCounter', 300);
```

### Step 5: Apply Data Migration on Load

Add to loadShortcuts(), loadEnvironments(), and loadNotes():

```javascript
// In loadShortcuts():
shortcuts = migrateData(result.shortcuts || [], 'shortcut');

// In loadEnvironments():
environments = migrateData(result[storageKey] || [], 'environment');

// In loadNotes():
notes = migrateData(result.notes || [], 'note');
```

## Testing Checklist

- [ ] Test saving environment with all lowercase name (should capitalize)
- [ ] Test saving with very long text (should truncate at limits)
- [ ] Test special characters in all fields (should sanitize)
- [ ] Test HTML/XSS attempts (should strip tags)
- [ ] Test malformed hostnames (should clean up)
- [ ] Test empty required fields (should show error)
- [ ] Test character counters update correctly
- [ ] Test character counter warnings (<50 chars)
- [ ] Test character counter errors (>limit)
- [ ] Test data migration fixes existing malformed data
- [ ] Test tags are properly formatted and deduplicated
- [ ] Test URLs are validated and sanitized

## Expected Behaviors

### Auto-Capitalization
- Input: "production dc68"
- Output: "Production dc68"

### Hostname Sanitization
- Input: "https://hcm-us20.hr.cloud.sap/extra/path"
- Output: "hcm-us20.hr.cloud.sap/extra/path"

### Tag Sanitization
- Input: "tag1, TAG1, tag2!!!, ,tag3"
- Output: ["Tag1", "Tag2", "Tag3"]

### XSS Prevention
- Input: "<script>alert('xss')</script>Test"
- Output: "Test"

### Length Enforcement
- Input: 150 character environment name
- Output: Truncated to 100 characters
