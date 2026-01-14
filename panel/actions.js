// SF Pro Toolkit - Actions Module
// CRUD operations for environments, shortcuts, notes, and navigation

// ==================== NAVIGATION ====================

window.navigateToShortcut = async function(url) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab && tab.id) {
      await chrome.tabs.update(tab.id, { url: url });
    } else {
      await chrome.tabs.create({ url: url });
    }
  } catch (error) {
    console.error('Navigation error:', error);
    if (window.showToast) window.showToast('Failed to navigate', 'error');
  }
}

window.switchEnvironment = async function(targetHostname, targetType) {
  try {
    const env = window.environments.find(e => e.hostname === targetHostname);
    if (env) {
      env.lastAccessed = Date.now();
      env.accessCount = (env.accessCount || 0) + 1;
      
      const storageKey = `environments_${window.currentProfile}`;
      await chrome.storage.local.set({ [storageKey]: window.environments });
    }
    
    const response = await chrome.runtime.sendMessage({
      action: 'switchEnvironment',
      targetHostname: targetHostname,
      preservePath: true
    });
    
    if (response.success) {
      if (window.showToast) window.showToast(`Switching to ${targetHostname}...`, 'success');
    } else {
      if (window.showToast) window.showToast('Failed to switch environment', 'error');
    }
  } catch (error) {
    console.error('Environment switch error:', error);
    if (window.showToast) window.showToast('Failed to switch environment', 'error');
  }
}

window.quickSwitchToEnvironment = async function(envIndex) {
  if (window.environments.length === 0) {
    if (window.showToast) window.showToast('No environments saved', 'warning');
    return;
  }
  
  let currentHostname = null;
  if (window.currentPageData) {
    currentHostname = window.currentPageData.hostname;
  }
  
  const sortedEnvs = [...window.environments].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    
    const aIsActive = currentHostname && currentHostname === a.hostname;
    const bIsActive = currentHostname && currentHostname === b.hostname;
    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;
    
    return 0;
  });
  
  if (envIndex < 0 || envIndex >= sortedEnvs.length) {
    if (window.showToast) window.showToast(`No environment at position ${envIndex + 1}`, 'warning');
    return;
  }
  
  const env = sortedEnvs[envIndex];
  if (!env) {
    if (window.showToast) window.showToast(`No environment at position ${envIndex + 1}`, 'warning');
    return;
  }
  
  await window.switchEnvironment(env.hostname, env.type);
};

// ==================== CRUD - ENVIRONMENTS ====================

window.openAddEnvironmentModal = async function() {
  const modal = document.getElementById('addEnvModal');
  
  // Fetch FRESH current page data
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  
  if (tab && tab.url) {
    // Use currentPageData if available, otherwise parse from tab
    const pageData = window.currentPageData || {
      hostname: new URL(tab.url).hostname,
      environment: 'production',
      datacenter: 'Unknown',
      solutionType: null
    };
    
    document.getElementById('envHostname').value = pageData.hostname || '';
    const envType = pageData.environment || 'production';
    document.getElementById('envType').value = envType;
    
    let suggestedName = typeof ENV_LABELS !== 'undefined' ? ENV_LABELS[envType] : envType;
    if (pageData.datacenter && pageData.datacenter !== 'Unknown') {
      suggestedName += ` ${pageData.datacenter}`;
    }
    document.getElementById('envName').value = suggestedName.trim();
    
    if (typeof updateCompanyIdFieldVisibility === 'function') {
      updateCompanyIdFieldVisibility(pageData.solutionType);
    }
  }
  
  modal.classList.add('active');
};

window.closeAddEnvironmentModal = function() {
  const modal = document.getElementById('addEnvModal');
  modal.classList.remove('active');
  modal.removeAttribute('data-edit-id');
  document.getElementById('addEnvForm').reset();
  document.querySelector('#addEnvModal .modal-header h3').textContent = 'Add Environment';
};

window.editEnvironment = async function(id) {
  const env = window.environments.find(e => e.id === id);
  if (!env) return;
  
  document.getElementById('envName').value = env.name;
  document.getElementById('envType').value = env.type;
  document.getElementById('envHostname').value = env.hostname;
  document.getElementById('envNotes').value = env.notes || '';
  
  const modal = document.getElementById('addEnvModal');
  modal.setAttribute('data-edit-id', id);
  document.querySelector('#addEnvModal .modal-header h3').textContent = 'Edit Environment';
  
  modal.classList.add('active');
};

window.deleteEnvironment = async function(id) {
  const env = window.environments.find(e => e.id === id);
  if (!env) return;
  
  const message = chrome.i18n.getMessage('confirmDeleteEnvironment').replace('{envName}', env.name);
  const confirmed = confirm(message);
  if (!confirmed) return;
  
  const newEnvs = window.environments.filter(e => e.id !== id);
  window.setEnvironments(newEnvs);
  
  const storageKey = `environments_${window.currentProfile}`;
  await chrome.storage.local.set({ [storageKey]: newEnvs });
  
  window.renderEnvironments();
  if (window.showToast) window.showToast('Environment deleted', 'success');
};

window.saveEnvironment = async function() {
  const name = document.getElementById('envName').value.trim();
  const type = document.getElementById('envType').value;
  let hostname = document.getElementById('envHostname').value.trim();
  
  if (!name) {
    if (window.showToast) window.showToast('Environment name is required', 'warning');
    document.getElementById('envName').focus();
    return;
  }
  
  if (!hostname) {
    if (window.showToast) window.showToast('Hostname is required', 'warning');
    document.getElementById('envHostname').focus();
    return;
  }
  
  hostname = hostname.replace(/^https?:\/\//, '');
  
  let hostnameOnly = hostname.split('/')[0].split('?')[0].split('#')[0];
  
  if (/\s/.test(hostnameOnly)) {
    if (window.showToast) window.showToast('Hostname cannot contain spaces', 'error');
    document.getElementById('envHostname').focus();
    return;
  }
  
  if (!/^[a-zA-Z0-9.-]+$/.test(hostnameOnly)) {
    if (window.showToast) window.showToast('Hostname contains invalid characters. Use only letters, numbers, dots, and hyphens', 'error');
    document.getElementById('envHostname').focus();
    return;
  }
  
  const sapDomains = [
    'hr.cloud.sap', 'sapsf.com', 'sapsf.cn', 'sapcloud.cn',
    'successfactors.eu', 'sapsf.eu', 'successfactors.com',
    's4hana.ondemand.com', 's4hana.cloud.sap',
    'hana.ondemand.com', 'cfapps', 'build.cloud.sap',
    'ibp.cloud.sap', 'scmibp.ondemand.com', 'ibplanning'
  ];
  const isValidSAPHostname = sapDomains.some(domain => hostnameOnly.includes(domain));
  
  if (!isValidSAPHostname) {
    if (window.showToast) window.showToast('Must be a valid SAP hostname (SuccessFactors, S/4HANA, BTP, or IBP)', 'error');
    document.getElementById('envHostname').focus();
    return;
  }
  
  document.getElementById('envHostname').value = hostname;
  
  const notes = document.getElementById('envNotes').value.trim();
  
  const modal = document.getElementById('addEnvModal');
  const editId = modal.getAttribute('data-edit-id');
  
  const envObject = {
    id: editId || `env-${Date.now()}`,
    name,
    type,
    hostname,
    notes
  };
  
  try {
    let newEnvs;
    if (editId) {
      newEnvs = window.environments.filter(e => e.id !== editId);
      newEnvs.push(envObject);
      if (window.showToast) window.showToast('Environment updated ✓', 'success');
      modal.removeAttribute('data-edit-id');
    } else {
      newEnvs = [...window.environments, envObject];
      if (window.showToast) window.showToast('Environment saved ✓', 'success');
    }
    
    window.setEnvironments(newEnvs);
    
    const storageKey = `environments_${window.currentProfile}`;
    await chrome.storage.local.set({ [storageKey]: newEnvs });
    
    window.renderEnvironments();
    window.closeAddEnvironmentModal();
  } catch (error) {
    console.error('Failed to save environment:', error);
    if (window.showToast) window.showToast('Failed to save environment. Please try again.', 'error');
  }
};

// ==================== CRUD - SHORTCUTS ====================

window.openAddShortcutModal = function() {
  document.getElementById('addShortcutModal').classList.add('active');
};

window.closeAddShortcutModal = function() {
  const modal = document.getElementById('addShortcutModal');
  modal.classList.remove('active');
  modal.removeAttribute('data-edit-id');
  document.getElementById('addShortcutForm').reset();
  document.querySelector('#addShortcutModal .modal-header h3').textContent = 'Add Shortcut';
};

window.editShortcut = function(id) {
  const shortcut = window.shortcuts.find(s => s.id === id);
  
  if (!shortcut) {
    if (window.showToast) window.showToast('Shortcut not found. Try reloading the extension.', 'error');
    return;
  }
  
  const nameEl = document.getElementById('shortcutName');
  const pathEl = document.getElementById('shortcutPath');
  const notesEl = document.getElementById('shortcutNotes');
  const iconEl = document.getElementById('shortcutIcon');
  const tagsEl = document.getElementById('shortcutTags');
  const modalEl = document.getElementById('addShortcutModal');
  const headerEl = document.querySelector('#addShortcutModal .modal-header h3');
  
  if (!nameEl || !pathEl || !modalEl) {
    if (window.showToast) window.showToast('Error: Form elements not found', 'error');
    return;
  }
  
  nameEl.value = shortcut.name;
  pathEl.value = shortcut.url;
  notesEl.value = shortcut.notes || '';
  iconEl.value = shortcut.icon || '8';
  tagsEl.value = shortcut.tags ? shortcut.tags.join(', ') : '';
  modalEl.setAttribute('data-edit-id', id);
  if (headerEl) headerEl.textContent = 'Edit Shortcut';
  
  window.openAddShortcutModal();
};

window.deleteShortcut = async function(id) {
  const shortcut = window.shortcuts.find(s => s.id === id);
  if (!shortcut) return;
  
  const message = chrome.i18n.getMessage('confirmDeleteShortcut').replace('{shortcutName}', shortcut.name);
  const confirmed = confirm(message);
  if (!confirmed) return;
  
  const newShortcuts = window.shortcuts.filter(s => s.id !== id);
  window.setShortcuts(newShortcuts);
  
  const storageKey = `shortcuts_${window.currentProfile}`;
  await chrome.storage.local.set({ [storageKey]: newShortcuts });
  
  window.renderShortcuts();
  if (window.showToast) window.showToast('Shortcut deleted', 'success');
};

window.saveShortcut = async function() {
  const name = document.getElementById('shortcutName').value.trim();
  const url = document.getElementById('shortcutPath').value.trim();
  const notes = document.getElementById('shortcutNotes').value.trim();
  const icon = document.getElementById('shortcutIcon').value || '8';
  const tagsInput = document.getElementById('shortcutTags').value.trim();
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
  
  if (!name || !url) {
    if (window.showToast) window.showToast('Please fill in required fields', 'warning');
    return;
  }
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (window.showToast) window.showToast('URL must start with http:// or https:// (external links only)', 'warning');
    document.getElementById('shortcutPath').focus();
    return;
  }
  
  const modal = document.getElementById('addShortcutModal');
  const editId = modal.getAttribute('data-edit-id');
  
  let newShortcuts;
  if (editId) {
    newShortcuts = window.shortcuts.filter(s => s.id !== editId);
    newShortcuts.push({ id: editId, name, url, notes, icon, tags });
    if (window.showToast) window.showToast('Shortcut updated ✓', 'success');
    modal.removeAttribute('data-edit-id');
  } else {
    const newShortcut = { id: `shortcut-${Date.now()}`, name, url, notes, icon, tags };
    newShortcuts = [...window.shortcuts, newShortcut];
    if (window.showToast) window.showToast('Shortcut saved ✓', 'success');
  }
  
  window.setShortcuts(newShortcuts);
  
  const storageKey = `shortcuts_${window.currentProfile}`;
  await chrome.storage.local.set({ [storageKey]: newShortcuts });
  
  window.renderShortcuts();
  window.closeAddShortcutModal();
};

window.addCurrentPageAsShortcut = async function() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  
  if (!tab || !tab.url) {
    if (window.showToast) window.showToast('No active tab found', 'warning');
    return;
  }
  
  // Open modal FIRST
  window.openAddShortcutModal();
  
  // THEN populate with current page data (ensures form fields exist)
  document.getElementById('shortcutName').value = tab.title.substring(0, 50);
  document.getElementById('shortcutPath').value = tab.url;
  document.getElementById('shortcutIcon').value = '8';
};

// ==================== CRUD - NOTES ====================

window.openAddNoteModal = function() {
  const downloadBtn = document.getElementById('downloadNoteBtn');
  if (downloadBtn) downloadBtn.style.display = 'none';
  
  const noteTypeRadio = document.querySelector('input[name="noteType"][value="note"]');
  if (noteTypeRadio) noteTypeRadio.checked = true;
  
  const modelGroup = document.getElementById('modelSelectorGroup');
  if (modelGroup) modelGroup.style.display = 'none';
  
  if (window.hideAITestButtons) window.hideAITestButtons();
  
  document.getElementById('addNoteModal').classList.add('active');
};

window.closeAddNoteModal = function() {
  const modal = document.getElementById('addNoteModal');
  modal.classList.remove('active');
  modal.removeAttribute('data-edit-id');
  
  const wasReadOnly = modal.getAttribute('data-readonly-mode') === 'true';
  
  if (wasReadOnly) {
    document.getElementById('noteTitle').removeAttribute('readonly');
    document.getElementById('noteContent').removeAttribute('readonly');
    document.getElementById('noteIcon').removeAttribute('disabled');
    
    document.getElementById('saveNoteBtn').style.display = 'inline-flex';
    document.getElementById('prettifyNoteBtn').style.display = 'inline-flex';
    
    modal.removeAttribute('data-readonly-mode');
  }
  
  if (window.hideAITestButtons) window.hideAITestButtons();
  const modelGroup = document.getElementById('modelSelectorGroup');
  if (modelGroup) modelGroup.style.display = 'none';
  
  document.getElementById('addNoteForm').reset();
  document.querySelector('#addNoteModal .modal-header h3').textContent = 'Scratch Note';
};

window.editNote = async function(id) {
  const note = window.notes.find(n => n.id === id);
  if (!note) {
    console.error('[Edit Note] Note not found:', id);
    if (window.showToast) window.showToast('Note not found. Try reloading the extension.', 'error');
    return;
  }
  
  console.log('[Edit Note] Opening note:', { id, note });
  
  const modal = document.getElementById('addNoteModal');
  if (!modal) {
    console.error('[Edit Note] Modal not found: addNoteModal');
    if (window.showToast) window.showToast('Error: Modal not found', 'error');
    return;
  }
  
  const titleEl = document.getElementById('noteTitle');
  const contentEl = document.getElementById('noteContent');
  const iconEl = document.getElementById('noteIcon');
  
  if (!titleEl || !contentEl || !iconEl) {
    console.error('[Edit Note] Form elements not found:', { titleEl, contentEl, iconEl });
    if (window.showToast) window.showToast('Error: Form elements not found', 'error');
    return;
  }
  
  titleEl.value = note.title;
  contentEl.value = note.content || '';
  iconEl.value = note.icon || '0';
  
  modal.setAttribute('data-edit-id', id);
  const headerEl = document.querySelector('#addNoteModal .modal-header h3');
  if (headerEl) headerEl.textContent = 'Edit Note';
  
  const downloadBtn = document.getElementById('downloadNoteBtn');
  if (downloadBtn) downloadBtn.style.display = 'inline-flex';
  
  const saveBtn = document.getElementById('saveNoteBtn');
  const prettifyBtn = document.getElementById('prettifyNoteBtn');
  if (saveBtn) saveBtn.style.display = 'inline-flex';
  if (prettifyBtn) prettifyBtn.style.display = 'inline-flex';
  
  const noteType = note.noteType || 'note';
  console.log('[Edit Note] Setting note type:', noteType);
  
  const noteTypeRadio = document.querySelector(`input[name="noteType"][value="${noteType}"]`);
  if (noteTypeRadio) {
    noteTypeRadio.checked = true;
    console.log('[Edit Note] Radio button checked:', noteTypeRadio);
  } else {
    console.warn('[Edit Note] Note type radio button not found:', noteType);
  }
  
  modal.classList.add('active');
  
  setTimeout(() => {
    if (noteType === 'ai-prompt') {
      console.log('[Edit Note] Showing AI button for ai-prompt type');
      if (window.showAITestButtons) window.showAITestButtons();
    } else {
      console.log('[Edit Note] Hiding AI button for non-ai-prompt type');
      if (window.hideAITestButtons) window.hideAITestButtons();
    }
  }, 50);
  
  console.log('[Edit Note] Modal opened successfully');
};

window.deleteNote = async function(id) {
  const note = window.notes.find(n => n.id === id);
  if (!note) return;
  
  const message = chrome.i18n.getMessage('confirmDeleteNote').replace('{noteTitle}', note.title);
  const confirmed = confirm(message);
  if (!confirmed) return;
  
  const newNotes = window.notes.filter(n => n.id !== id);
  window.setNotes(newNotes);
  
  const storageKey = `notes_${window.currentProfile}`;
  await chrome.storage.local.set({ [storageKey]: newNotes });
  
  window.renderNotes();
  if (window.showToast) window.showToast('Note deleted', 'success');
};

window.saveNote = async function() {
  const title = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteContent').value.trim();
  const icon = document.getElementById('noteIcon').value || '0';
  
  const noteTypeRadio = document.querySelector('input[name="noteType"]:checked');
  let noteType = noteTypeRadio ? noteTypeRadio.value : 'note';
  
  if (!title) {
    if (window.showToast) window.showToast('Please enter a title', 'warning');
    return;
  }
  
  const modal = document.getElementById('addNoteModal');
  const editId = modal.getAttribute('data-edit-id');
  
  // Check if we're saving an AI response (after running an AI prompt)
  // If editing an existing note, compare current content with stored note
  let finalTitle = title;
  let isAIResponse = false;
  
  if (editId) {
    const originalNote = window.notes.find(n => n.id === editId);
    if (originalNote) {
      // If content has changed significantly and note type is ai-prompt, it's likely an AI response
      const contentChanged = originalNote.content !== content;
      const isAIPromptType = originalNote.noteType === 'ai-prompt' || noteType === 'ai-prompt';
      
      if (contentChanged && isAIPromptType) {
        isAIResponse = true;
        // Override noteType to "note" for AI responses
        noteType = 'note';
      }
    }
  }
  
  // Add "AI Response" prefix if detected as AI response and not already prefixed
  if (isAIResponse && !finalTitle.startsWith('AI Response')) {
    finalTitle = `AI Response - ${finalTitle}`;
  }
  
  const noteObject = {
    id: editId || `note-${Date.now()}`,
    title: finalTitle,
    content,
    icon,
    noteType,
    timestamp: Date.now()
  };
  
  if (noteType === 'ai-prompt') {
    const modelSelect = document.getElementById('noteModel');
    noteObject.aiConfig = {
      defaultModel: modelSelect ? modelSelect.value : 'gpt-4-turbo'
    };
  }
  
  let newNotes;
  if (editId) {
    newNotes = window.notes.filter(n => n.id !== editId);
    newNotes.push(noteObject);
    if (window.showToast) window.showToast('Note updated ✓', 'success');
    modal.removeAttribute('data-edit-id');
  } else {
    newNotes = [...window.notes, noteObject];
    if (window.showToast) window.showToast('Note saved ✓', 'success');
  }
  
  window.setNotes(newNotes);
  
  const storageKey = `notes_${window.currentProfile}`;
  await chrome.storage.local.set({ [storageKey]: newNotes });
  
  window.renderNotes();
  window.closeAddNoteModal();
};

window.copyNoteContent = async function(id, btn) {
  const note = window.notes.find(n => n.id === id);
  if (!note) return;
  
  const contentToCopy = note.content || note.title;
  
  try {
    await navigator.clipboard.writeText(contentToCopy);
    
    if (btn) {
      btn.classList.add('copy-success');
      setTimeout(() => btn.classList.remove('copy-success'), 2000);
    }
    
    if (window.showToast) window.showToast('Note copied ✓', 'success');
  } catch (error) {
    console.error('Failed to copy note:', error);
    if (window.showToast) window.showToast('Failed to copy note', 'error');
  }
};

window.downloadNote = async function(id) {
  const note = window.notes.find(n => n.id === id);
  if (!note) {
    if (window.showToast) window.showToast('Note not found', 'error');
    return;
  }
  
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    
    const fileContent = `${note.title}
${note.timestamp ? `Created: ${new Date(note.timestamp).toLocaleString()}` : ''}
${note.noteType ? `Type: ${note.noteType}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${note.content || ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const safeTitle = note.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `note-${safeTitle}-${timestamp}-${timeStr}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    if (window.showToast) window.showToast('Note downloaded ✓', 'success');
    
  } catch (error) {
    console.error('[Download Note] Failed:', error);
    if (window.showToast) window.showToast(`Failed to download: ${error.message}`, 'error');
  }
};

window.downloadCurrentNoteContent = async function(title, content) {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    
    // Add "AI Response" prefix if content looks like AI output
    const prefixedTitle = title.startsWith('AI Response') ? title : `AI Response - ${title}`;
    
    const fileContent = `${prefixedTitle}
Generated: ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const safeTitle = prefixedTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle}-${timestamp}-${timeStr}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    if (window.showToast) window.showToast('AI response downloaded ✓', 'success');
    
  } catch (error) {
    console.error('[Download Current Note] Failed:', error);
    if (window.showToast) window.showToast(`Failed to download: ${error.message}`, 'error');
  }
};

window.prettifyNote = async function() {
  const contentInput = document.getElementById('noteContent');
  const counter = document.getElementById('noteContentCounter');
  
  if (!contentInput) return;
  
  try {
    let content = contentInput.value;
    
    content = content.replace(/\r\n/g, '\n');
    content = content.replace(/\n{3,}/g, '\n\n');
    
    content = content.split('\n').map(line => {
      if (/^[^:]+:\s*.+/.test(line)) {
        return line.replace(/^([^:]+):\s*(.+)$/, '$1: $2');
      }
      return line;
    }).join('\n');
    
    content = content.replace(/^[\s]*[-*•]\s*/gm, '• ');
    
    const urlsOnOwnLine = new Set();
    const lines = content.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (/^https?:\/\/[^\s]+$/.test(trimmed)) {
        urlsOnOwnLine.add(trimmed);
      }
    });
    
    content = content.replace(/(https?:\/\/[^\s]+)/g, (match, url) => {
      if (urlsOnOwnLine.has(url)) return url;
      return `\n${url}\n`;
    });
    
    content = content.replace(/^[\s]*(\d+)[.)]\s*/gm, '$1. ');
    content = content.replace(/\n{2,}(•|\d+\.)/g, '\n\n$1');
    content = content.split('\n').map(line => line.trimEnd()).join('\n');
    content = content.trim();
    
    contentInput.value = content;
    
    if (counter) {
      const length = content.length;
      if (length >= 5000) {
        counter.classList.add('char-warning');
        counter.textContent = `${length.toLocaleString()} (⚠️ Large note)`;
      } else {
        counter.classList.remove('char-warning');
        counter.textContent = length.toLocaleString();
      }
    }
    
    if (window.showToast) window.showToast('Note formatted ✓', 'success');
    
  } catch (error) {
    console.error('[Prettify] Error:', error);
    if (window.showToast) window.showToast(`Format failed: ${error.message}`, 'error');
  }
};

// ==================== PIN TOGGLE ====================

window.togglePin = async function(id, type = 'environment') {
  let item, collection, storageKey, renderFunction, itemLabel;
  
  if (type === 'environment') {
    item = window.environments.find(e => e.id === id);
    collection = window.environments;
    storageKey = `environments_${window.currentProfile}`;
    renderFunction = window.renderEnvironments;
    itemLabel = 'Environment';
  } else if (type === 'shortcut') {
    item = window.shortcuts.find(s => s.id === id);
    collection = window.shortcuts;
    storageKey = `shortcuts_${window.currentProfile}`;
    renderFunction = window.renderShortcuts;
    itemLabel = 'Shortcut';
  } else if (type === 'note') {
    item = window.notes.find(n => n.id === id);
    collection = window.notes;
    storageKey = `notes_${window.currentProfile}`;
    renderFunction = window.renderNotes;
    itemLabel = 'Note';
  } else {
    console.error('[Pin] Unknown type:', type);
    return;
  }
  
  if (!item) {
    console.error('[Pin] Item not found:', id, type);
    return;
  }
  
  item.pinned = !item.pinned;
  
  await chrome.storage.local.set({ [storageKey]: collection });
  
  renderFunction();
  
  const message = item.pinned ? `${itemLabel} pinned ⭐` : `${itemLabel} unpinned`;
  if (window.showToast) window.showToast(message, 'success');
};

// ==================== PROFILE SWITCHING ====================

window.switchProfile = async function(profileId) {
  if (profileId === window.currentProfile) {
    document.getElementById('profileMenu')?.classList.remove('active');
    return;
  }
  
  const profile = window.availableProfiles.find(p => p.id === profileId);
  if (!profile) {
    if (window.showToast) window.showToast('Profile not found', 'error');
    return;
  }
  
  try {
    await chrome.storage.local.set({ activeProfile: profileId });
    window.setCurrentProfile(profileId);
    
    document.getElementById('currentProfileName').textContent = profile.name;
    
    await window.loadShortcuts();
    await window.loadEnvironments();
    await window.loadNotes();
    
    window.renderShortcuts();
    window.renderEnvironments();
    window.renderNotes();
    window.renderProfileMenu();
    document.getElementById('profileMenu')?.classList.remove('active');
    
    if (window.showToast) window.showToast(`Switched to ${profile.name}`, 'success');
    
  } catch (error) {
    console.error('Failed to switch profile:', error);
    if (window.showToast) window.showToast('Failed to switch profile', 'error');
  }
};

window.toggleProfileMenu = function() {
  const menu = document.getElementById('profileMenu');
  if (!menu) return;
  
  const isActive = menu.classList.contains('active');
  menu.classList.toggle('active', !isActive);
};

// ==================== QUICK ACTIONS SAVE ====================

window.saveAllQuickActions = async function() {
  const listContainer = document.getElementById('qaEditableList');
  if (!listContainer) {
    console.error('[Save QA] Container not found!');
    return;
  }

  try {
    console.log('[Save QA] Starting save...');
    console.log('[Save QA] Current solutions:', window.solutions);
    
    let solutionsData = JSON.parse(JSON.stringify(window.solutions));
    
    let changesMade = 0;
    const changes = [];

    listContainer.querySelectorAll('.qa-edit-row').forEach(row => {
      const qaId = row.getAttribute('data-qa-id');
      const solutionId = row.getAttribute('data-solution-id');
      const nameInput = row.querySelector('.qa-name-input');
      const pathInput = row.querySelector('.qa-path-input');

      if (!nameInput || !pathInput) {
        console.warn('[Save QA] Missing inputs for:', qaId);
        return;
      }

      const newName = nameInput.value.trim();
      const newPath = pathInput.value.trim();
      const oldName = nameInput.getAttribute('data-original-name');
      const oldPath = pathInput.getAttribute('data-original-path');

      console.log('[Save QA] Processing:', { qaId, solutionId, oldName, newName, oldPath, newPath });

      const solution = solutionsData.find(s => s.id === solutionId);
      if (!solution) {
        console.warn('[Save QA] Solution not found:', solutionId);
        return;
      }

      const qa = solution.quickActions.find(q => q.id === qaId);
      if (!qa) {
        console.warn('[Save QA] QA not found:', qaId);
        return;
      }

      if (qa.name !== newName || qa.path !== newPath) {
        changes.push({ qaId, oldName: qa.name, newName, oldPath: qa.path, newPath });
        qa.name = newName;
        qa.path = newPath;
        changesMade++;
      }
    });

    console.log('[Save QA] Changes detected:', changesMade);
    console.log('[Save QA] Change details:', changes);

    if (changesMade === 0) {
      if (window.showToast) window.showToast('No changes to save', 'info');
      return;
    }

    console.log('[Save QA] Saving to storage with key: "solutions"');
    console.log('[Save QA] Data to save:', solutionsData);
    
    await chrome.storage.local.set({ solutions: solutionsData });
    
    const verifyResult = await chrome.storage.local.get('solutions');
    console.log('[Save QA] Verification - data in storage:', verifyResult.solutions);
    
    window.setSolutions(solutionsData);
    console.log('[Save QA] Updated global solutions variable');

    if (window.showToast) window.showToast(`${changesMade} Quick Action(s) saved ✓`, 'success');
    
    if (window.renderAllProfilesQuickActions) await window.renderAllProfilesQuickActions();
    await window.renderEnvironments();

  } catch (error) {
    console.error('[Save All Quick Actions] Failed:', error);
    if (window.showToast) window.showToast('Failed to save Quick Actions', 'error');
  }
};

// ==================== OSS NOTES ====================

window.openPopularOssNote = async function(noteNumber) {
  try {
    const ossNoteUrl = `https://launchpad.support.sap.com/#/notes/${noteNumber}`;
    await chrome.tabs.create({ url: ossNoteUrl });
    if (window.showToast) window.showToast(`Opening OSS Note ${noteNumber} ✓`, 'success');
  } catch (error) {
    console.error('[Popular OSS Note] Failed to open:', error);
    if (window.showToast) window.showToast('Failed to open OSS Note', 'error');
  }
};

// ==================== SEARCH/FILTER ====================

window.filterContent = function(searchTerm) {
  const term = searchTerm.toLowerCase();
  
  // Update clear button visibility
  const clearBtn = document.getElementById('clearSearch');
  if (clearBtn) {
    clearBtn.style.display = searchTerm ? 'flex' : 'none';
  }
  
  document.querySelectorAll('.env-row').forEach(row => {
    const name = row.querySelector('.env-name')?.textContent.toLowerCase() || '';
    const hostname = row.querySelector('.env-hostname')?.textContent.toLowerCase() || '';
    const matches = name.includes(term) || hostname.includes(term);
    row.style.display = matches ? '' : 'none';
  });
  
  document.querySelectorAll('.shortcut-row').forEach(row => {
    const shortcutId = row.getAttribute('data-shortcut-id');
    const shortcut = window.shortcuts.find(s => s.id === shortcutId);
    
    if (shortcut) {
      const name = (shortcut.name || '').toLowerCase();
      const notes = (shortcut.notes || '').toLowerCase();
      const matches = name.includes(term) || notes.includes(term);
      row.style.display = matches ? '' : 'none';
    } else {
      row.style.display = 'none';
    }
  });
  
  document.querySelectorAll('.note-row').forEach(row => {
    const noteId = row.getAttribute('data-note-id');
    const note = window.notes.find(n => n.id === noteId);
    
    if (note) {
      const title = (note.title || '').toLowerCase();
      const content = (note.content || '').toLowerCase();
      const noteType = (note.noteType || '').toLowerCase();
      const matches = title.includes(term) || content.includes(term) || noteType.includes(term);
      row.style.display = matches ? '' : 'none';
    } else {
      row.style.display = 'none';
    }
  });
};

// ==================== IMPORT/EXPORT ====================

window.exportJsonToFile = async function() {
  try {
    const profile = window.availableProfiles.find(p => p.id === window.currentProfile);
    const profileName = profile ? profile.name.toLowerCase().replace(/\s+/g, '-') : 'data';
    
    const storageKey = `solutions_${window.currentProfile}`;
    const solutionsResult = await chrome.storage.local.get(storageKey);
    const storedSolutions = solutionsResult[storageKey];
    
    let exportSolutions = storedSolutions;
    if (!exportSolutions) {
      const profileData = await window.loadProfileData(window.currentProfile);
      exportSolutions = profileData.solutions || [];
    }
    
    const exportData = {
      version: '1.0',
      profileType: 'custom',
      profile: window.currentProfile,
      profileName: profile ? profile.name : 'Unknown',
      basedOn: window.currentProfile.startsWith('custom-') ? 'profile-successfactors' : window.currentProfile,
      shortcuts: window.shortcuts,
      environments: window.environments,
      notes: window.notes,
      solutions: exportSolutions,
      exportDate: new Date().toISOString(),
      description: 'Custom profile export. To create a new profile, edit "profileName" field and re-import. The extension will create a new custom profile with your chosen name. You can also edit the "solutions" array to customize Quick Actions.'
    };
    
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `sap-pro-toolkit-${profileName}-${timestamp}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    const itemCount = window.shortcuts.length + window.environments.length + window.notes.length;
    const qaCount = exportSolutions?.reduce((sum, sol) => sum + (sol.quickActions?.length || 0), 0) || 0;
    if (window.showToast) window.showToast(`Exported ${itemCount} items + ${qaCount} Quick Actions ✓ | Edit "solutions" array to customize Quick Actions`, 'success');
    
  } catch (error) {
    console.error('Export failed:', error);
    if (window.showToast) window.showToast('Failed to export configuration', 'error');
  }
};

window.handleFileImport = async function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      if (window.showToast) window.showToast('Invalid JSON file. Please check file format.', 'error');
      event.target.value = '';
      return;
    }
    
    if (!data.shortcuts && !data.environments && !data.notes) {
      if (window.showToast) window.showToast('Invalid file structure. Expected shortcuts, environments, or notes.', 'error');
      event.target.value = '';
      return;
    }
    
    if (data.profileType === 'custom' && data.profileName) {
      const profileId = `custom-${data.profileName.toLowerCase().replace(/\s+/g, '-')}`;
      const profileExists = window.availableProfiles.some(p => p.id === profileId);
      
      if (!profileExists) {
        const confirmed = confirm(
          `📦 Create New Profile?\n\n` +
          `Profile Name: ${data.profileName}\n` +
          `Items: ${data.shortcuts?.length || 0} shortcuts, ${data.environments?.length || 0} environments, ${data.notes?.length || 0} notes\n\n` +
          `Options:\n` +
          `• OK = Create new profile and switch to it\n` +
          `• Cancel = Import into current profile (${window.availableProfiles.find(p => p.id === window.currentProfile)?.name})`
        );
        
        if (confirmed) {
          if (window.createCustomProfile) await window.createCustomProfile(profileId, data.profileName, data);
          event.target.value = '';
          return;
        }
      } else {
        const confirmed = confirm(
          `Profile "${data.profileName}" already exists.\n\n` +
          `Switch to this profile and import data?`
        );
        
        if (confirmed) {
          await window.switchProfile(profileId);
        } else {
          event.target.value = '';
          return;
        }
      }
    }
    
    const importSummary = [];
    let importCount = 0;
    
    if (data.shortcuts && Array.isArray(data.shortcuts)) {
      const newShortcuts = data.shortcuts.filter(imported => 
        !window.shortcuts.some(existing => existing.url === imported.url)
      );
      const combined = [...newShortcuts, ...window.shortcuts];
      window.setShortcuts(combined);
      const storageKey = `shortcuts_${window.currentProfile}`;
      await chrome.storage.local.set({ [storageKey]: combined });
      importCount += newShortcuts.length;
      if (newShortcuts.length > 0) importSummary.push(`${newShortcuts.length} shortcuts`);
    }
    
    if (data.environments && Array.isArray(data.environments)) {
      const newEnvs = data.environments.filter(imported =>
        !window.environments.some(existing => existing.hostname === imported.hostname)
      );
      const combined = [...newEnvs, ...window.environments];
      window.setEnvironments(combined);
      
      const storageKey = `environments_${window.currentProfile}`;
      await chrome.storage.local.set({ [storageKey]: combined });
      importCount += newEnvs.length;
      if (newEnvs.length > 0) importSummary.push(`${newEnvs.length} environments`);
    }
    
    if (data.notes && Array.isArray(data.notes)) {
      const newNotes = data.notes.filter(imported =>
        !window.notes.some(existing => existing.title === imported.title)
      );
      const combined = [...newNotes, ...window.notes];
      window.setNotes(combined);
      const storageKey = `notes_${window.currentProfile}`;
      await chrome.storage.local.set({ [storageKey]: combined });
      importCount += newNotes.length;
      if (newNotes.length > 0) importSummary.push(`${newNotes.length} notes`);
    }
    
    if (data.solutions && Array.isArray(data.solutions)) {
      const storageKey = `solutions_${window.currentProfile}`;
      await chrome.storage.local.set({ [storageKey]: data.solutions });
      window.setSolutions(data.solutions);
      
      const qaCount = data.solutions.reduce((sum, sol) => sum + (sol.quickActions?.length || 0), 0);
      if (qaCount > 0) {
        importSummary.push(`${qaCount} Quick Actions`);
      }
    }
    
    window.renderShortcuts();
    window.renderEnvironments();
    window.renderNotes();
    
    if (importCount === 0) {
      if (window.showToast) window.showToast('No new items to import (all items already exist)', 'warning');
    } else {
      const summary = importSummary.join(', ');
      const targetProfile = window.availableProfiles.find(p => p.id === window.currentProfile);
      if (window.showToast) window.showToast(`Imported ${summary} into ${targetProfile?.name || 'current profile'} ✓`, 'success');
    }
    
  } catch (error) {
    console.error('Import failed:', error);
    if (window.showToast) window.showToast(`Import failed: ${error.message}`, 'error');
  }
  
  event.target.value = '';
};

// ==================== THEME TOGGLE ====================

window.toggleTheme = async function() {
  const result = await chrome.storage.local.get({ theme: 'auto' });
  let currentTheme = result.theme;
  
  let nextTheme;
  if (currentTheme === 'auto') {
    nextTheme = 'light';
  } else if (currentTheme === 'light') {
    nextTheme = 'dark';
  } else {
    nextTheme = 'auto';
  }
  
  await chrome.storage.local.set({ theme: nextTheme });
  
  document.body.setAttribute('data-theme', nextTheme);
  
  const themeBtn = document.getElementById('footerThemeBtn');
  if (themeBtn) {
    themeBtn.setAttribute('data-theme-active', nextTheme !== 'auto' ? 'true' : 'false');
  }
  
  const themeLabels = { auto: 'Auto', light: 'Light', dark: 'Dark' };
  if (window.showToast) window.showToast(`Theme: ${themeLabels[nextTheme]}`, 'success');
};

// ==================== COLLAPSIBLE SECTIONS ====================

window.toggleSection = async function(sectionId) {
  const section = document.querySelector(`.section[data-section="${sectionId}"]`);
  if (!section) return;
  
  const isCurrentlyCollapsed = section.classList.contains('collapsed');
  const newState = !isCurrentlyCollapsed;
  
  section.classList.toggle('collapsed');
  
  const result = await chrome.storage.local.get('sectionStates');
  const sectionStates = result.sectionStates || {};
  sectionStates[sectionId] = newState;
  await chrome.storage.local.set({ sectionStates });
};

window.initializeCollapsibleSections = async function() {
  const result = await chrome.storage.local.get('sectionStates');
  const sectionStates = result.sectionStates || {
    environments: true,
    shortcuts: true,
    notes: true
  };
  
  document.querySelectorAll('.section').forEach(section => {
    const sectionId = section.getAttribute('data-section');
    if (sectionId) {
      const isExpanded = sectionStates[sectionId] !== false;
      
      if (isExpanded) {
        section.classList.remove('collapsed');
      } else {
        section.classList.add('collapsed');
      }
    }
  });
  
  document.querySelectorAll('.section-toggle-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const sectionId = btn.getAttribute('data-section');
      await window.toggleSection(sectionId);
    });
  });
  
  if (window.updateSectionCounts) window.updateSectionCounts();
};
