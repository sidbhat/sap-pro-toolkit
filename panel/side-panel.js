// SF Pro Toolkit - Side Panel Edition
// Enhanced with Starter Pack Import System
// Uses shared toolkit-core.js for common functionality

// ==================== STATE ====================

let currentPageData = null;
let shortcuts = [];
let environments = [];
let notes = [];
let solutions = []; // Quick Actions are defined in solutions array
let settings = { showConfirmationForProd: true };
let availableProfiles = [];
let currentProfile = 'profile-global';  // Default to Global profile
let popularOssNotes = null; // Popular OSS notes data

// ==================== DEBUGGING HELPERS ====================

/**
 * Debug function to inspect notes storage
 * Call from browser console: window.debugNotes()
 */
window.debugNotes = async function () {
  const result = await chrome.storage.local.get('notes');
  console.log('=== NOTES DEBUG ===');
  console.log('Notes in storage:', result.notes);
  console.log('Notes count:', result.notes?.length || 0);
  console.log('Current notes variable:', notes);
  console.log('Notes count in memory:', notes.length);

  // Check all storage keys
  const allKeys = await chrome.storage.local.get(null);
  console.log('All storage keys:', Object.keys(allKeys));
  console.log('Keys containing "note":', Object.keys(allKeys).filter(k => k.toLowerCase().includes('note')));

  return { storage: result.notes, memory: notes, allKeys: Object.keys(allKeys) };
};

// ==================== INITIALIZATION ====================

// NOTE: Initialization now handled by main.js init() function
// This avoids duplicate setupEventListeners() calls that create multiple event handlers
// main.js loads AFTER side-panel.js, so it has access to all functions defined here

// ==================== DATA LOADING ====================









// ==================== SEARCH/FILTER ====================

function setupSearchFilter() {
  const searchInput = document.getElementById('globalSearch');
  const clearBtn = document.getElementById('clearSearch');

  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();
    clearBtn.style.display = searchTerm ? 'flex' : 'none';
    window.filterContent(searchTerm);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    window.filterContent('');
    searchInput.focus();
  });
}

// filterContent() is now in actions.js as window.filterContent

// ==================== NAVIGATION & CRUD FUNCTIONS ====================
// All navigation and CRUD operations are now in actions.js as window.* functions:
// - window.navigateToShortcut, window.switchEnvironment, window.quickSwitchToEnvironment
// - Environment CRUD: window.openAddEnvironmentModal, window.closeAddEnvironmentModal, 
//   window.editEnvironment, window.deleteEnvironment, window.saveEnvironment
// - Shortcut CRUD: window.openAddShortcutModal, window.closeAddShortcutModal,
//   window.editShortcut, window.deleteShortcut, window.saveShortcut, window.addCurrentPageAsShortcut
// - Note CRUD: window.openAddNoteModal, window.closeAddNoteModal, window.editNote,
//   window.deleteNote, window.saveNote, window.copyNoteContent, window.downloadNote, window.prettifyNote

// ==================== DIAGNOSTICS ====================
// Diagnostics functions are now in ai-features.js as window.* functions:
// - window.showDiagnosticsModal, window.closeDiagnosticsModal, window.regenerateDiagnosticsWithAI
// - window.saveDiagnosticsAsNote, window.downloadDiagnosticsReport, window.buildDiagnosticsPrompt

// loadPopularOssNotes, renderPopularNotes, togglePopularNotes, openPopularOssNote 
// are now in state.js and ui-render.js as window.* functions

// togglePin is now in actions.js as window.togglePin

// ==================== OSS NOTE INLINE FUNCTIONS ====================

/**
 * Toggle OSS Note search form visibility
 */
window.toggleOssNoteSearch = async function() {
  console.log('[OSS Note] toggleOssNoteSearch called');
  const form = document.getElementById('ossNoteSearchForm');
  if (form) {
    console.log('[OSS Note] Form found, current display:', form.style.display);
    form.style.display = form.style.display === 'none' ? 'flex' : 'none';
    if (form.style.display === 'flex') {
      document.getElementById('ossNoteInputInline')?.focus();
    }
    console.log('[OSS Note] Form display set to:', form.style.display);
  } else {
    console.error('[OSS Note] Form element not found!');
  }
};

/**
 * Open OSS Note from inline input
 */
window.openOssNoteInline = function() {
  console.log('[OSS Note] openOssNoteInline called');
  const input = document.getElementById('ossNoteInputInline');
  const noteNumber = input?.value.trim();

  if (!noteNumber) {
    if (window.showToast) window.showToast('Please enter an OSS Note number', 'warning');
    return;
  }

  // Clean up input - remove non-numeric characters
  const cleanNumber = noteNumber.replace(/\D/g, '');

  if (!cleanNumber) {
    if (window.showToast) window.showToast('Invalid OSS Note number', 'error');
    return;
  }

  const ossUrl = `https://launchpad.support.sap.com/#/notes/${cleanNumber}`;
  chrome.tabs.create({ url: ossUrl });
  if (window.showToast) window.showToast(`Opening OSS Note ${cleanNumber} ✓`, 'success');

  // Clear input and hide form
  if (input) input.value = '';
  document.getElementById('ossNoteSearchForm').style.display = 'none';
}

/**
 * Copy OSS Note URL to clipboard
 */
window.copyOssNoteUrl = async function() {
  console.log('[OSS Note] copyOssNoteUrl called');
  const input = document.getElementById('ossNoteInputInline');
  const noteNumber = input?.value.trim().replace(/\D/g, '');

  if (!noteNumber) {
    if (window.showToast) window.showToast('Please enter an OSS Note number first', 'warning');
    return;
  }

  const ossUrl = `https://launchpad.support.sap.com/#/notes/${noteNumber}`;

  try {
    await navigator.clipboard.writeText(ossUrl);
    if (window.showToast) window.showToast('OSS Note URL copied ✓', 'success');
  } catch (error) {
    console.error('[Copy OSS URL] Failed:', error);
    if (window.showToast) window.showToast('Failed to copy URL', 'error');
  }
}

/**
 * Add OSS Note as a shortcut
 */
window.addOssNoteAsShortcut = async function() {
  console.log('[OSS Note] addOssNoteAsShortcut called');
  const input = document.getElementById('ossNoteInputInline');
  const noteNumber = input?.value.trim().replace(/\D/g, '');

  if (!noteNumber) {
    if (window.showToast) window.showToast('Please enter an OSS Note number first', 'warning');
    return;
  }

  const ossUrl = `https://launchpad.support.sap.com/#/notes/${noteNumber}`;

  const newShortcut = {
    id: `shortcut-${Date.now()}`,
    name: `OSS Note ${noteNumber}`,
    url: ossUrl,
    icon: 'document',
    notes: 'Added from OSS Note search',
    timestamp: Date.now()
  };

  const newShortcuts = [...window.shortcuts, newShortcut];
  window.setShortcuts(newShortcuts);

  const storageKey = `shortcuts_${window.currentProfile}`;
  await chrome.storage.local.set({ [storageKey]: newShortcuts });

  window.renderShortcuts();
  if (window.showToast) window.showToast(`OSS Note ${noteNumber} added as shortcut ✓`, 'success');

  // Clear input and hide form
  if (input) input.value = '';
  document.getElementById('ossNoteSearchForm').style.display = 'none';
}

/**
 * Toggle popular notes section
 */
async function togglePopularNotes() {
  const section = document.getElementById('popularNotesSection');
  if (section) {
    section.classList.toggle('collapsed');
    const isCollapsed = section.classList.contains('collapsed');
    await chrome.storage.local.set({ popularNotesCollapsed: isCollapsed });
  }
}

/**
 * Open settings modal (window function for cross-file access)
 * Shows modal immediately, initializes content in background
 */
window.openSettingsModal = function() {
  const modal = document.getElementById('settingsModal');
  if (!modal) {
    console.error('[Settings] Modal element not found!');
    return;
  }

  // Show modal IMMEDIATELY (no await, no blocking)
  modal.classList.add('active');
  console.log('[Settings] Modal opened');

  // Initialize content in background (non-blocking)
  initializeSettingsContent();
};

/**
 * Initialize settings content in background
 * Non-blocking initialization with proper error handling
 */
async function initializeSettingsContent() {
  try {
    console.log('[Settings] Starting background initialization...');
    
    // Run all initializations in parallel, catch errors individually
    await Promise.allSettled([
      Promise.resolve(initializeAPIKeysTab()).catch(err => 
        console.warn('[Settings] API Keys tab init failed:', err)
      ),
      Promise.resolve(initializeBackupTab()).catch(err => 
        console.warn('[Settings] Backup tab init failed:', err)
      ),
      loadQuickActionsTab().catch(err => 
        console.warn('[Settings] Quick Actions tab init failed:', err)
      ),
      loadSavedAPIKeys().catch(err => 
        console.warn('[Settings] Load API keys failed:', err)
      )
    ]);
    
    console.log('[Settings] Background initialization complete');
  } catch (error) {
    console.error('[Settings] Initialization error:', error);
    // Don't show error toast - modal is already visible and functional
  }
}

/**
 * Close settings modal (window function for cross-file access)
 */
window.closeSettingsModal = function() {
  document.getElementById('settingsModal')?.classList.remove('active');
};

// ==================== NOTE CHARACTER COUNTER ====================

/**
 * Setup note character counter for content field
 * Shows character count and warning at 5000+ characters
 */
function setupNoteCharacterCounter() {
  const contentInput = document.getElementById('noteContent');
  const counter = document.getElementById('noteContentCounter');

  if (!contentInput || !counter) return;

  function updateCounter() {
    const length = contentInput.value.length;
    counter.textContent = length.toLocaleString();

    // Apply warning styling at 5000+ characters (soft warning)
    if (length >= 5000) {
      counter.classList.add('char-warning');
      counter.textContent = `${length.toLocaleString()} (⚠️ Large note)`;
    } else {
      counter.classList.remove('char-warning');
      counter.textContent = length.toLocaleString();
    }
  }

  // Update on input
  contentInput.addEventListener('input', updateCounter);

  // Update when modal opens (for edit mode)
  const modal = document.getElementById('addNoteModal');
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        if (modal.classList.contains('active')) {
          updateCounter();
        }
      }
    });
  });

  observer.observe(modal, { attributes: true });
}

/**
 * Initialize API Keys tab
 * Re-attaches event listeners and loads saved configuration
 */
function initializeAPIKeysTab() {
  console.log('[API Keys Tab] Initializing...');

  // Re-attach event listeners for API Keys buttons
  const testSAPBtn = document.getElementById('testSAPAICoreBtn');
  const saveSAPBtn = document.getElementById('saveSAPAICoreBtn');
  const clearSAPBtn = document.getElementById('clearSAPAICoreBtn');
  const testOpenAIBtn = document.getElementById('testOpenAIBtn');
  const clearOpenAIBtn = document.getElementById('clearOpenAIBtn');
  const testAnthropicBtn = document.getElementById('testAnthropicBtn');
  const clearAnthropicBtn = document.getElementById('clearAnthropicBtn');
  const saveMaxTokensBtn = document.getElementById('saveMaxTokensBtn');

  // Remove existing listeners to prevent duplicates (clone and replace)
  if (testSAPBtn) {
    const newTestSAPBtn = testSAPBtn.cloneNode(true);
    testSAPBtn.parentNode.replaceChild(newTestSAPBtn, testSAPBtn);
    newTestSAPBtn.addEventListener('click', connectSAPAICore);
  }

  if (saveSAPBtn) {
    const newSaveSAPBtn = saveSAPBtn.cloneNode(true);
    saveSAPBtn.parentNode.replaceChild(newSaveSAPBtn, saveSAPBtn);
    newSaveSAPBtn.addEventListener('click', saveSAPAICoreConfig);
  }

  if (clearSAPBtn) {
    const newClearSAPBtn = clearSAPBtn.cloneNode(true);
    clearSAPBtn.parentNode.replaceChild(newClearSAPBtn, clearSAPBtn);
    newClearSAPBtn.addEventListener('click', clearSAPAICoreConfig);
  }

  if (testOpenAIBtn) {
    const newTestOpenAIBtn = testOpenAIBtn.cloneNode(true);
    testOpenAIBtn.parentNode.replaceChild(newTestOpenAIBtn, testOpenAIBtn);
    newTestOpenAIBtn.addEventListener('click', async () => {
      const apiKey = document.getElementById('apiKeyopenaiInput').value.trim();
      if (!apiKey) {
        showToast('Please enter an API key first', 'warning');
        return;
      }

      try {
        showToast('Testing OpenAI connection...', 'info');
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (response.ok) {
          await window.CryptoUtils.encryptAndStore('apiKeyopenai', apiKey);
          await updateAISettings();
          showToast('OpenAI connection successful ✓', 'success');
        } else {
          showToast('OpenAI connection failed - check API key', 'error');
        }
      } catch (error) {
        console.error('[OpenAI] Test failed:', error);
        showToast('Connection test failed', 'error');
      }
    });
  }

  if (clearOpenAIBtn) {
    const newClearOpenAIBtn = clearOpenAIBtn.cloneNode(true);
    clearOpenAIBtn.parentNode.replaceChild(newClearOpenAIBtn, clearOpenAIBtn);
    newClearOpenAIBtn.addEventListener('click', async () => {
      await chrome.storage.local.remove('apiKeyopenai');
      document.getElementById('apiKeyopenaiInput').value = '';
      await updateAISettings();
      showToast('OpenAI API key cleared', 'success');
    });
  }

  if (testAnthropicBtn) {
    const newTestAnthropicBtn = testAnthropicBtn.cloneNode(true);
    testAnthropicBtn.parentNode.replaceChild(newTestAnthropicBtn, testAnthropicBtn);
    newTestAnthropicBtn.addEventListener('click', async () => {
      const apiKey = document.getElementById('apiKeyanthropicInput').value.trim();
      if (!apiKey) {
        showToast('Please enter an API key first', 'warning');
        return;
      }

      try {
        showToast('Testing Anthropic connection...', 'info');
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'test' }]
          })
        });

        if (response.ok) {
          await window.CryptoUtils.encryptAndStore('apiKeyanthropic', apiKey);
          await updateAISettings();
          showToast('Anthropic connection successful ✓', 'success');
        } else {
          showToast('Anthropic connection failed - check API key', 'error');
        }
      } catch (error) {
        console.error('[Anthropic] Test failed:', error);
        showToast('Connection test failed', 'error');
      }
    });
  }

  if (clearAnthropicBtn) {
    const newClearAnthropicBtn = clearAnthropicBtn.cloneNode(true);
    clearAnthropicBtn.parentNode.replaceChild(newClearAnthropicBtn, clearAnthropicBtn);
    newClearAnthropicBtn.addEventListener('click', async () => {
      await chrome.storage.local.remove('apiKeyanthropic');
      document.getElementById('apiKeyanthropicInput').value = '';
      await updateAISettings();
      showToast('Anthropic API key cleared', 'success');
    });
  }

  if (saveMaxTokensBtn) {
    const newSaveMaxTokensBtn = saveMaxTokensBtn.cloneNode(true);
    saveMaxTokensBtn.parentNode.replaceChild(newSaveMaxTokensBtn, saveMaxTokensBtn);
    newSaveMaxTokensBtn.addEventListener('click', async () => {
      const maxTokens = parseInt(document.getElementById('maxTokensDefault').value) || 4096;
      await chrome.storage.local.set({ maxTokensDefault: maxTokens });
      showToast(`Max tokens set to ${maxTokens} ✓`, 'success');
    });
  }

  // Load saved API keys
  loadSavedAPIKeys();

  console.log('[API Keys Tab] Initialized successfully');
}

/**
 * Initialize Backup/Import-Export tab
 * Re-attaches event listeners for import/export functionality
 */
function initializeBackupTab() {
  console.log('[Backup Tab] Initializing...');

  // Re-attach event listeners for backup/import-export buttons
  const exportBtn = document.getElementById('exportAllBtn');
  const importBtn = document.getElementById('importJsonBtn');
  const importFileInput = document.getElementById('importFileInput');

  if (exportBtn) {
    const newExportBtn = exportBtn.cloneNode(true);
    exportBtn.parentNode.replaceChild(newExportBtn, exportBtn);
    newExportBtn.addEventListener('click', exportJsonToFile);
  }

  if (importBtn) {
    const newImportBtn = importBtn.cloneNode(true);
    importBtn.parentNode.replaceChild(newImportBtn, importBtn);
    newImportBtn.addEventListener('click', importJsonFromFile);
  }

  if (importFileInput) {
    const newImportFileInput = importFileInput.cloneNode(true);
    importFileInput.parentNode.replaceChild(newImportFileInput, importFileInput);
    newImportFileInput.addEventListener('change', handleFileImport);
  }

  console.log('[Backup Tab] Initialized successfully');
}

// ==================== SETTINGS - QUICK ACTIONS TAB ====================

/**
 * Load Quick Actions tab - shows ALL profiles' Quick Actions for editing
 */
async function loadQuickActionsTab() {
  const container = document.getElementById('quick-actions-tab');

  // Update instructions
  container.querySelector('p').innerHTML = 'Edit Quick Action names and paths, then click "Save All Changes" below.';

  // Render all profiles' Quick Actions
  await renderAllProfilesQuickActions();
}




// ==================== SETTINGS - EXPORT ====================


async function importJsonFromFile() {
  const fileInput = document.getElementById('importFileInput');
  fileInput.click();
}

async function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();

    // Validate JSON format
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      showToast('Invalid JSON file. Please check file format.', 'error');
      event.target.value = '';
      return;
    }

    // Check if file has expected structure
    if (!data.shortcuts && !data.environments && !data.notes) {
      showToast('Invalid file structure. Expected shortcuts, environments, or notes.', 'error');
      event.target.value = '';
      return;
    }

    // Check if this is a custom profile import
    if (data.profileType === 'custom' && data.profileName) {
      const profileId = `custom-${data.profileName.toLowerCase().replace(/\s+/g, '-')}`;
      const profileExists = availableProfiles.some(p => p.id === profileId);

      if (!profileExists) {
        // Offer to create new custom profile
        const confirmed = confirm(
          `📦 Create New Profile?\n\n` +
          `Profile Name: ${data.profileName}\n` +
          `Items: ${data.shortcuts?.length || 0} shortcuts, ${data.environments?.length || 0} environments, ${data.notes?.length || 0} notes\n\n` +
          `Options:\n` +
          `• OK = Create new profile and switch to it\n` +
          `• Cancel = Import into current profile (${availableProfiles.find(p => p.id === currentProfile)?.name})`
        );

        if (confirmed) {
          await window.createCustomProfile(profileId, data.profileName, data);
          event.target.value = '';
          return;
        }
        // If cancelled, fall through to normal import into current profile
      } else {
        // Profile exists, offer to switch and import
        const confirmed = confirm(
          `Profile "${data.profileName}" already exists.\n\n` +
          `Switch to this profile and import data?`
        );

        if (confirmed) {
          await switchProfile(profileId);
          // Continue with normal import below
        } else {
          event.target.value = '';
          return;
        }
      }
    }

    // Normal import into current profile
    const importSummary = [];
    let importCount = 0;

    if (data.shortcuts && Array.isArray(data.shortcuts)) {
      const newShortcuts = data.shortcuts.filter(imported =>
        !shortcuts.some(existing => existing.url === imported.url)
      );
      shortcuts = [...newShortcuts, ...shortcuts];
      const storageKey = `shortcuts_${currentProfile}`;
      await chrome.storage.local.set({ [storageKey]: shortcuts });
      importCount += newShortcuts.length;
      if (newShortcuts.length > 0) importSummary.push(`${newShortcuts.length} shortcuts`);
    }

    if (data.environments && Array.isArray(data.environments)) {
      const newEnvs = data.environments.filter(imported =>
        !environments.some(existing => existing.hostname === imported.hostname)
      );
      environments = [...newEnvs, ...environments];

      // Save to profile-specific storage
      const storageKey = `environments_${currentProfile}`;
      await chrome.storage.local.set({ [storageKey]: environments });
      importCount += newEnvs.length;
      if (newEnvs.length > 0) importSummary.push(`${newEnvs.length} environments`);
    }

    if (data.notes && Array.isArray(data.notes)) {
      const newNotes = data.notes.filter(imported =>
        !notes.some(existing => existing.title === imported.title)
      );
      notes = [...newNotes, ...notes];
      const storageKey = `notes_${currentProfile}`;
      await chrome.storage.local.set({ [storageKey]: notes });
      importCount += newNotes.length;
      if (newNotes.length > 0) importSummary.push(`${newNotes.length} notes`);
    }

    // Import Quick Actions (solutions array) if present
    if (data.solutions && Array.isArray(data.solutions)) {
      const storageKey = `solutions_${currentProfile}`;
      await chrome.storage.local.set({ [storageKey]: data.solutions });
      solutions = data.solutions;

      const qaCount = data.solutions.reduce((sum, sol) => sum + (sol.quickActions?.length || 0), 0);
      if (qaCount > 0) {
        importSummary.push(`${qaCount} Quick Actions`);
      }
    }

    window.renderShortcuts();
    window.renderEnvironments();
    window.renderNotes();

    if (importCount === 0) {
      showToast('No new items to import (all items already exist)', 'warning');
    } else {
      const summary = importSummary.join(', ');
      const targetProfile = availableProfiles.find(p => p.id === currentProfile);
      showToast(`Imported ${summary} into ${targetProfile?.name || 'current profile'} ✓`, 'success');
    }

  } catch (error) {
    console.error('Import failed:', error);
    showToast(`Import failed: ${error.message}`, 'error');
  }

  event.target.value = '';
}

async function exportJsonToFile() {
  try {
    // Get profile name for filename
    const profile = availableProfiles.find(p => p.id === currentProfile);
    const profileName = profile ? profile.name.toLowerCase().replace(/\s+/g, '-') : 'data';

    // Load solutions from storage (check if user has customized Quick Actions)
    const storageKey = `solutions_${currentProfile}`;
    const solutionsResult = await chrome.storage.local.get(storageKey);
    const storedSolutions = solutionsResult[storageKey];

    // If no custom solutions in storage, try to get from profile data
    let exportSolutions = storedSolutions;
    if (!exportSolutions) {
      const profileData = await loadProfileData(currentProfile);
      exportSolutions = profileData.solutions || [];
    }

    // Always export as 'custom' type to allow profile creation on import
    // User can modify profileName in JSON to create a new custom profile
    const exportData = {
      version: '1.0',
      profileType: 'custom',
      profile: currentProfile,
      profileName: profile ? profile.name : 'Unknown',
      basedOn: currentProfile.startsWith('custom-') ? 'profile-successfactors' : currentProfile,
      shortcuts: shortcuts,
      environments: environments,
      notes: notes,
      solutions: exportSolutions, // Include Quick Actions
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

    // Show helpful message about creating new profiles and editing Quick Actions
    const itemCount = shortcuts.length + environments.length + notes.length;
    const qaCount = exportSolutions?.reduce((sum, sol) => sum + (sol.quickActions?.length || 0), 0) || 0;
    showToast(`Exported ${itemCount} items + ${qaCount} Quick Actions ✓ | Edit "solutions" array to customize Quick Actions`, 'success');

  } catch (error) {
    console.error('Export failed:', error);
    showToast('Failed to export configuration', 'error');
  }
}



// ==================== COLLAPSIBLE SECTIONS ====================

// Collapsible sections are now handled by window.initializeCollapsibleSections() in actions.js
// No local implementation needed here

// ==================== EVENT LISTENERS ====================

// REMOVED: Duplicate setupEventListeners() function
// All event listeners are now managed centrally in main.js to prevent:
// 1. Duplicate listener accumulation (coding.md violation)
// 2. Multiple competing handlers for same elements
// 3. Race conditions and unpredictable behavior
//
// Functions needed by side-panel.js are exposed as window.* functions above
// and called from main.js setupEventListeners()

// ==================== THEME MANAGEMENT ====================

async function loadTheme() {
  const result = await chrome.storage.local.get({ theme: 'auto' });
  const theme = result.theme;
  applyTheme(theme);
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);

  // Update footer button indicator
  const themeBtn = document.getElementById('footerThemeBtn');
  if (themeBtn) {
    themeBtn.setAttribute('data-theme-active', theme !== 'auto' ? 'true' : 'false');
  }

  console.log('[Theme] Applied theme:', theme);
}

async function toggleTheme() {
  const result = await chrome.storage.local.get({ theme: 'auto' });
  let currentTheme = result.theme;

  // Cycle: auto → light → dark → auto
  let nextTheme;
  if (currentTheme === 'auto') {
    nextTheme = 'light';
  } else if (currentTheme === 'light') {
    nextTheme = 'dark';
  } else {
    nextTheme = 'auto';
  }

  await chrome.storage.local.set({ theme: nextTheme });
  applyTheme(nextTheme);

  const themeLabels = { auto: 'Auto', light: 'Light', dark: 'Dark' };
  showToast(`Theme: ${themeLabels[nextTheme]}`, 'success');
}

// ==================== PROFILE MANAGEMENT ====================

async function discoverProfiles() {
  // Profiles are now discovered in main.js and stored in window.availableProfiles
  // This function just triggers the profile menu render
  console.log('[Discover Profiles] Using profiles from main.js:', window.availableProfiles.length);

  if (window.renderProfileMenu) {
    await window.renderProfileMenu();
  }
}

async function loadActiveProfile() {
  const result = await chrome.storage.local.get({ activeProfile: 'profile-global' });
  currentProfile = result.activeProfile;

  const profile = availableProfiles.find(p => p.id === currentProfile);
  if (profile) {
    document.getElementById('currentProfileName').textContent = profile.name;
  }
}

/**
 * Render ALL profiles' Quick Actions as editable text fields
 * Both name AND path are editable
 * Shows all profiles together for bulk editing
 */
async function renderAllProfilesQuickActions() {
  const listContainer = document.getElementById('qaEditableList');
  if (!listContainer) return;

  try {
    console.log('[Render QA] Starting render...');
    console.log('[Render QA] Solutions from window.solutions:', window.solutions);

    // USE THE GLOBAL WINDOW.SOLUTIONS VARIABLE (loaded in main.js during init)
    const baseSolutions = window.solutions;

    if (baseSolutions.length === 0) {
      listContainer.innerHTML = '<div class="empty-state" style="padding: 24px; text-align: center; color: var(--text-secondary);">No Quick Actions configured in solutions.json</div>';
      return;
    }

    let allHTML = '';

    // Render solutions from solutions.json with 2-column grid layout
    for (const solution of baseSolutions) {
      const quickActions = solution.quickActions || [];

      allHTML += `
        <div class="qa-solution-group" style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--border);">
          <h3 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px;">
            ${solution.name || solution.id} (${quickActions.length})
          </h3>
          ${quickActions.length === 0 ?
          '<div style="padding: 12px; color: var(--text-secondary); font-size: 11px;">No Quick Actions</div>' :
          quickActions.map(qa => `
              <div class="qa-edit-row" data-qa-id="${qa.id}" data-solution-id="${solution.id}" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                <div>
                  <label style="display: block; font-size: 10px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Name:</label>
                  <input 
                    type="text" 
                    class="qa-name-input" 
                    value="${qa.name}" 
                    data-original-name="${qa.name}"
                    style="width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: 4px; font-size: 12px; background: var(--bg-primary); color: var(--text-primary);"
                  >
                </div>
                <div>
                  <label style="display: block; font-size: 10px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Path:</label>
                  <input 
                    type="text" 
                    class="qa-path-input" 
                    value="${qa.path}" 
                    data-original-path="${qa.path}"
                    style="width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: 4px; font-size: 11px; background: var(--bg-primary); color: var(--text-primary); font-family: 'SF Mono', monospace;"
                  >
                </div>
              </div>
            `).join('')
        }
        </div>
      `;
    }
    listContainer.innerHTML = allHTML;

  } catch (error) {
    console.error('[Quick Actions Tab] Failed to load:', error);
    listContainer.innerHTML = '<div class="empty-state" style="padding: 24px; text-align: center; color: var(--env-production);">Failed to load</div>';
  }
}


// renderProfileMenu() moved to ui-render.js (uses window.renderProfileMenu)

function toggleProfileMenu() {
  const menu = document.getElementById('profileMenu');
  if (!menu) return;

  const isActive = menu.classList.contains('active');
  menu.classList.toggle('active', !isActive);
}

// switchProfile function removed - using window.switchProfile from actions.js instead

// Helper function to remove duplicates from array based on key
function removeDuplicates(arr, key) {
  const seen = new Set();
  return arr.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

// ==================== AI SEARCH FUNCTIONALITY ====================

/**
 * Setup AI Search button handler
 */
function setupAISearchHandler() {
  const aiSearchBtn = document.getElementById('aiSearchBtn');
  const searchInput = document.getElementById('globalSearch');

  if (!aiSearchBtn || !searchInput) {
    console.warn('[AI Search] Button or search input not found');
    return;
  }

  aiSearchBtn.addEventListener('click', async () => {
    const searchQuery = searchInput.value.trim();

    if (!searchQuery) {
      showToast('Enter a search query first', 'warning');
      searchInput.focus();
      return;
    }

    // Calls the canonical function from ai-features.js
    await window.performAISearch(searchQuery);
  });

  console.log('[AI Search] Handler attached successfully');
}

/**
 * Extract actionable items from AI response
 * Detects profile switch recommendations and environment suggestions
 * @param {string} response - AI response text
 * @param {Object} context - Comprehensive context object
 * @returns {Object} Actionable items extracted from response
 */
function extractActionableItems(response, context) {
  const actions = {
    profileSwitch: null,
    environmentSwitch: null
  };

  // Detect profile switch recommendations
  const lowerResponse = response.toLowerCase();

  // Check for profile mentions in response
  context.allProfiles.forEach(profile => {
    const profileNameLower = profile.name.toLowerCase();
    if (lowerResponse.includes(`switch to '${profileNameLower}'`) ||
      lowerResponse.includes(`switch to "${profileNameLower}"`) ||
      lowerResponse.includes(`switch to ${profileNameLower} profile`)) {
      actions.profileSwitch = profile.id;
    }
  });

  // Detect environment switch recommendations
  Object.entries(context.environmentsByProfile).forEach(([profileId, data]) => {
    data.items.forEach(env => {
      if (lowerResponse.includes(env.name.toLowerCase()) &&
        (lowerResponse.includes('switch to') || lowerResponse.includes('use'))) {
        actions.environmentSwitch = {
          id: env.id,
          name: env.name,
          hostname: env.hostname,
          type: env.type
        };
      }
    });
  });

  return actions;
}

/**
 * Setup close button for AI insights bar
 */
document.getElementById('closeAiInsights')?.addEventListener('click', () => {
  const aiInsightsBar = document.getElementById('aiInsightsBar');
  if (aiInsightsBar) {
    aiInsightsBar.style.display = 'none';
  }
});

// ==================== AI COST ESTIMATOR FUNCTIONS ====================

/**
 * Setup note type change listener
 * Shows/hides AI button based on selected type
 */
function setupNoteTypeChangeListener() {
  const noteTypeRadios = document.querySelectorAll('input[name="noteType"]');

  noteTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const selectedType = e.target.value;
      const aiBtn = document.getElementById('enhanceWithAIBtn');

      if (selectedType === 'ai-prompt') {
        // Show AI button for AI-prompt type
        if (aiBtn) aiBtn.style.display = 'inline-flex';
      } else {
        // Hide AI button for other types
        if (aiBtn) aiBtn.style.display = 'none';
      }
    });
  });
}

/**
 * Show AI button in note modal footer
 */
function showAITestButtons() {
  const aiBtn = document.getElementById('enhanceWithAIBtn');
  if (aiBtn) aiBtn.style.display = 'inline-flex';
}

/**
 * Hide AI button in note modal footer
 */
function hideAITestButtons() {
  const aiBtn = document.getElementById('enhanceWithAIBtn');
  if (aiBtn) aiBtn.style.display = 'none';
}

/**
 * Setup AI test button handlers
 */
function setupAITestButtonHandlers() {
  // Main AI button (triggers LLM call)
  document.getElementById('enhanceWithAIBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await handleRunAIPrompt();
  });

  // AI Test Results modal close buttons
  document.getElementById('closeAiTestResultsModal')?.addEventListener('click', closeAiTestResultsModal);
  document.getElementById('closeAiTestResultsBtn')?.addEventListener('click', closeAiTestResultsModal);
}

// ==================== AI COST ESTIMATOR - PHASE 4 IMPLEMENTATION ====================
// lookupModelPricing() is now in ai-features.js as part of AI cost estimation

/**
 * Estimate token count from text
 * Rough estimate: ~4 characters = 1 token
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 */
function estimateTokens(text) {
  if (!text) return 0;
  // Simple estimation: 4 chars ≈ 1 token
  return Math.ceil(text.length / 4);
}

/**
 * Convert markdown text to clean HTML
 * Reusable utility for all AI/LLM response rendering
 * @param {string} markdown - Raw markdown text
 * @returns {string} Clean HTML string
 */
function markdownToHTML(markdown) {
  if (!markdown) return '';

  let html = markdown;

  // Convert code blocks first (```code```)
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Convert inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert headers (# H1, ## H2, ### H3)
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // Convert horizontal rules (---)
  html = html.replace(/^---+$/gm, '<hr>');

  // Convert bold (**text** or __text__)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Convert links ([text](url))
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Convert lists (bullet points)
  const lines = html.split('\n');
  let inList = false;
  let listType = null;
  const processedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      if (!inList || listType !== 'ol') {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      processedLines.push(`<li>${trimmed.replace(/^\d+\.\s/, '')}</li>`);
    }
    // Bullet list (-, *, •)
    else if (/^[-*•]\s/.test(trimmed)) {
      if (!inList || listType !== 'ul') {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      processedLines.push(`<li>${trimmed.replace(/^[-*•]\s/, '')}</li>`);
    }
    // Regular line
    else {
      if (inList) {
        processedLines.push(`</${listType}>`);
        inList = false;
        listType = null;
      }

      // Convert paragraphs (non-empty lines that aren't headers/hr/lists)
      if (trimmed && !trimmed.startsWith('<')) {
        processedLines.push(`<p>${line}</p>`);
      } else {
        processedLines.push(line);
      }
    }
  }

  // Close any open list
  if (inList) {
    processedLines.push(`</${listType}>`);
  }

  return processedLines.join('\n');
}

/**
 * Strip markdown formatting to produce clean plain text
 * Used for saving notes and exporting to text files
 * @param {string} markdown - Raw markdown text
 * @returns {string} Clean plain text
 */
function stripMarkdown(markdown) {
  if (!markdown) return '';

  let text = markdown;

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');

  // Remove inline code backticks
  text = text.replace(/`([^`]+)`/g, '$1');

  // Remove headers (keep text only)
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Remove horizontal rules
  text = text.replace(/^---+$/gm, '');

  // Remove bold/italic markers
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');

  // Remove links (keep text only)
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Clean up list markers
  text = text.replace(/^[-*•]\s+/gm, '• ');
  text = text.replace(/^\d+\.\s+/gm, '');

  // Clean up excessive whitespace
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Calculate cost for given tokens and pricing
 * @param {number} inputTokens - Input token count
 * @param {number} outputTokens - Output token count
 * @param {Object} pricing - Model pricing object
 * @returns {Object} Cost breakdown
 */
function calculateCost(inputTokens, outputTokens, pricing) {
  const inputCost = (inputTokens / 1000) * pricing.inputCostPer1K;
  const outputCost = (outputTokens / 1000) * pricing.outputCostPer1K;
  const totalCost = inputCost + outputCost;

  return {
    inputCost: inputCost.toFixed(4),
    outputCost: outputCost.toFixed(4),
    totalCost: totalCost.toFixed(4)
  };
}

/**
 * Handle AI button click - runs the prompt with LLM
 * This is the main entry point for AI functionality
 */
async function handleRunAIPrompt() {
  const content = document.getElementById('noteContent').value.trim();

  if (!content) {
    showToast('Please enter prompt content first', 'warning');
    return;
  }

  // Check if ToolkitCore is loaded and has AI functions
  if (!window.ToolkitCore || !window.ToolkitCore.testPromptWithModel) {
    console.error('[AI] ToolkitCore or testPromptWithModel not available');
    showToast('AI features not available - ToolkitCore missing', 'error');
    return;
  }

  try {
    // Show blocking overlay during AI processing
    const overlay = document.getElementById('aiBlockingOverlay');
    if (overlay) overlay.classList.add('active');

    // Load pricing data
    const pricingData = await loadLLMPricing();

    // Call the test function from ToolkitCore
    const result = await window.ToolkitCore.testPromptWithModel(content);

    if (!result) {
      showToast('No response from AI', 'warning');
      return;
    }

    // Lookup model pricing using fuzzy matching
    const modelPricing = pricingData ? lookupModelPricing(result.model, pricingData) : null;

    let costs, modelData;

    if (modelPricing && result.usage?.inputTokens && result.usage?.outputTokens) {
      // Calculate costs from pricing data
      const inputCost = (result.usage.inputTokens / 1000) * modelPricing.input;
      const outputCost = (result.usage.outputTokens / 1000) * modelPricing.output;
      const totalCost = inputCost + outputCost;

      costs = {
        inputCost: inputCost.toFixed(4),
        outputCost: outputCost.toFixed(4),
        totalCost: totalCost.toFixed(4)
      };

      modelData = {
        provider: result.provider,
        model: result.model,
        inputCostPer1K: modelPricing.input,
        outputCostPer1K: modelPricing.output,
        disclaimer: modelPricing.disclaimer || null
      };

      console.log('[AI] Calculated costs from pricing data:', costs);
    } else {
      // Fallback: use API-provided cost or default to 0
      costs = {
        inputCost: (result.usage?.cost ? (parseFloat(result.usage.cost) / 2).toFixed(4) : '0.0000'),
        outputCost: (result.usage?.cost ? (parseFloat(result.usage.cost) / 2).toFixed(4) : '0.0000'),
        totalCost: result.usage?.cost || '0.0000'
      };

      modelData = {
        provider: result.provider,
        model: result.model,
        inputCostPer1K: 0,
        outputCostPer1K: 0
      };

      console.warn('[AI] No pricing data found, using fallback costs');
    }

    // Transform result to match existing showEstimateResults format
    const estimateResult = {
      modelId: result.model,
      modelData: modelData,
      inputTokens: result.usage?.inputTokens || 0,
      outputTokens: result.usage?.outputTokens || 0,
      costs: costs,
      isEstimate: false, // This is a live test, not an estimate
      responseContent: result.content // Store actual response content
    };

    // Use existing modal display function
    showEstimateResults(estimateResult);

  } catch (error) {
    console.error('[AI] Prompt execution failed:', error);
    showToast(`AI test failed: ${error.message}`, 'error');
  } finally {
    // Always hide overlay when done
    const overlay = document.getElementById('aiBlockingOverlay');
    if (overlay) overlay.classList.remove('active');
  }
}

/**
 * Calculate reading time estimate from text
 * Average reading speed: 200 words per minute
 * @param {string} text - Text to analyze
 * @returns {string} Reading time estimate (e.g., "2 min read")
 */
function calculateReadingTime(text) {
  if (!text) return '< 1 min read';

  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);

  if (minutes < 1) return '< 1 min read';
  if (minutes === 1) return '1 min read';
  return `${minutes} min read`;
}

/**
 * Show estimate results in modal with premium content display
 * PRICING METRICS REMOVED - focuses entirely on content quality
 * @param {Object} result - Test result object
 */
function showEstimateResults(result) {
  const modal = document.getElementById('aiTestResultsModal');
  const titleEl = document.getElementById('aiTestResultsTitle');
  const contentEl = document.getElementById('aiTestResultsContent');

  if (!modal || !titleEl || !contentEl) {
    console.error('[AI] Results modal elements not found');
    return;
  }

  titleEl.textContent = '✨ AI Response';

  // Calculate reading time from response content
  const readingTime = calculateReadingTime(result.responseContent);

  // Build metadata badges for response header
  const metadataBadges = `
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
      <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; font-size: 11px; font-weight: 600; color: #10B981;">
        🤖 ${result.modelData.model || result.modelId}
      </span>
      <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; font-size: 11px; font-weight: 600; color: #3B82F6;">
        📊 ${(result.inputTokens + result.outputTokens).toLocaleString()} tokens
      </span>
      <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; font-size: 11px; font-weight: 600; color: #8B5CF6;">
        ⏱️ ${readingTime}
      </span>
    </div>
  `;

  // Show response content with metadata badges at top
  const html = `
    ${metadataBadges}
    
    <div class="llm-response-card">
      <div class="llm-response-header">
        <span class="llm-response-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          AI Response
        </span>
      </div>
      <div class="llm-response-content ai-response">${markdownToHTML(result.responseContent)}</div>
      <div style="margin-top: 12px; padding: 10px; background: rgba(16, 185, 129, 0.15); border-radius: 4px; font-size: 10px; line-height: 1.4; color: var(--text-secondary);">
        <strong style="color: #10B981;">✨ AI INSIGHTS</strong> – This response was generated by AI. Always verify information independently before making decisions.
      </div>
    </div>
  `;

  contentEl.innerHTML = html;

  // Store result data in modal dataset for robust saving and copying
  modal.dataset.responseContent = result.responseContent || '';
  modal.dataset.modelName = result.modelData.model || result.modelId;
  modal.dataset.provider = result.modelData.provider || 'Unknown';
  modal.dataset.inputTokens = result.inputTokens;
  modal.dataset.outputTokens = result.outputTokens;
  modal.dataset.totalCost = result.costs.totalCost;

  modal.classList.add('active');

  // Attach handlers to footer buttons
  const saveBtn = modal.querySelector('#saveAiResponseBtn');
  const copyBtn = modal.querySelector('#copyAiResponseBtn');
  const calcBtn = modal.querySelector('#openEnterpriseCalcBtn');

  if (saveBtn) {
    // Pass the original result object as a fallback
    saveBtn.onclick = () => saveAIResponseAsNote(result);
  }

  if (copyBtn) {
    copyBtn.onclick = copyAIResponseToClipboard;
  }

  if (calcBtn) {
    calcBtn.onclick = () => openEnterpriseCalculator(result);
  }
}

/**
 * Save AI response as a note with AI tags.
 * Reads content and metadata directly from the modal's dataset attributes
 * to ensure the visible response is saved.
 * @param {Object} fallbackResult - Optional fallback AI test result object if dataset is missing.
 */
/**
 * Copies the AI response from the modal to the clipboard.
 * Reads content directly from the modal's dataset for robustness.
 */
async function copyAIResponseToClipboard() {
  const modal = document.getElementById('aiTestResultsModal');
  const responseContent = modal.dataset.responseContent;

  if (!responseContent) {
    showToast('No response content to copy.', 'warning');
    return;
  }

  try {
    const plainText = stripMarkdown(responseContent);

    // Use Clipboard API with fallback
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(plainText);
    } else {
      // Fallback for older browsers or insecure contexts
      const textarea = document.createElement('textarea');
      textarea.value = plainText;
      textarea.style.position = 'fixed'; // Prevent scrolling to bottom
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    showToast('Response copied to clipboard ✓', 'success');
  } catch (error) {
    console.error('[Copy AI Response] Failed:', error);
    showToast('Failed to copy response.', 'error');
  }
}

/**
 * Close AI Test Results modal
 */
function closeAiTestResultsModal() {
  const modal = document.getElementById('aiTestResultsModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

/**
 * Open Enterprise Calculator modal with pre-populated data from test results
 * @param {Object} testResult - Test result object with token counts, costs, and original prompt
 */
function openEnterpriseCalculator(testResult) {
  const modal = document.getElementById('enterpriseCalculatorModal');
  const contentEl = document.getElementById('enterpriseCalculatorContent');

  if (!modal || !contentEl) {
    console.error('[Enterprise Calc] Modal elements not found');
    showToast('Enterprise calculator not available', 'error');
    return;
  }

  // Close the AI Test Results modal first
  closeAiTestResultsModal();

  // Get original prompt from note content (if coming from note modal)
  const noteContent = document.getElementById('noteContent')?.value.trim() || '';

  // Store original prompt and response in modal for later use
  modal.setAttribute('data-original-prompt', noteContent);
  modal.setAttribute('data-ai-response', testResult.responseContent || '');

  // Pre-populate form with test data
  const html = `
    <div class="enterprise-calc-form">
      <h4 style="margin-bottom: 16px; color: var(--text-primary);">Scale Parameters</h4>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
        <div class="form-group">
          <label>Number of Users</label>
          <input type="number" id="enterpriseNumUsers" value="1000" min="1" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-primary); color: var(--text-primary);">
        </div>
        
        <div class="form-group">
          <label>Queries per User per Day</label>
          <input type="number" id="enterpriseQueriesPerDay" value="5" min="1" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-primary); color: var(--text-primary);">
        </div>
        
        <div class="form-group">
          <label>Working Days per Year</label>
          <input type="number" id="enterpriseWorkingDays" value="250" min="1" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-primary); color: var(--text-primary);">
        </div>
        
        <div class="form-group">
          <label>Expected Output Tokens</label>
          <input type="number" id="enterpriseOutputTokens" value="${testResult.outputTokens}" min="1" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-primary); color: var(--text-primary);">
        </div>
      </div>
      
      <button class="btn btn-primary" id="calculateEnterpriseBtn" style="width: 100%; margin-bottom: 24px;">
        Calculate Annual Projections
      </button>
      
      <div id="enterpriseResults" style="display: none;">
        <h4 style="margin-bottom: 16px; color: var(--text-primary);">Annual Cost Projection</h4>
        <div id="enterpriseResultsContent"></div>
      </div>
    </div>
  `;

  contentEl.innerHTML = html;

  // Store test result data for calculation
  modal.setAttribute('data-test-input-tokens', testResult.inputTokens);
  modal.setAttribute('data-test-model', testResult.modelData.model);
  modal.setAttribute('data-test-provider', testResult.modelData.provider);
  modal.setAttribute('data-test-response', testResult.responseContent || '');

  // Attach calculate button handler
  document.getElementById('calculateEnterpriseBtn')?.addEventListener('click', () => {
    calculateEnterpriseProjections(testResult);
  });

  modal.classList.add('active');
}

/**
 * Calculate and display enterprise cost projections
 * @param {Object} testResult - Original test result with token counts
 */
function calculateEnterpriseProjections(testResult) {
  const numUsers = parseInt(document.getElementById('enterpriseNumUsers').value) || 1000;
  const queriesPerDay = parseInt(document.getElementById('enterpriseQueriesPerDay').value) || 5;
  const workingDays = parseInt(document.getElementById('enterpriseWorkingDays').value) || 250;
  const outputTokens = parseInt(document.getElementById('enterpriseOutputTokens').value) || testResult.outputTokens;

  // Calculate annual query volume
  const annualQueries = numUsers * queriesPerDay * workingDays;

  // Calculate annual token usage
  const annualInputTokens = testResult.inputTokens * annualQueries;
  const annualOutputTokens = outputTokens * annualQueries;

  // Calculate annual costs (using per-query cost from test)
  // Parse cost as float and ensure it's a valid number
  const costPerQuery = parseFloat(testResult.costs.totalCost) || 0;
  const annualCost = costPerQuery * annualQueries;
  const monthlyCost = annualCost / 12;

  // Get original prompt and response from modal attributes
  const modal = document.getElementById('enterpriseCalculatorModal');
  const originalPrompt = modal.getAttribute('data-original-prompt') || '';
  const aiResponse = modal.getAttribute('data-ai-response') || testResult.responseContent || '';

  // Display results
  const resultsDiv = document.getElementById('enterpriseResults');
  const resultsContent = document.getElementById('enterpriseResultsContent');

  if (!resultsDiv || !resultsContent) return;

  // Build input/output display sections with green card styling and AI disclaimer
  let contextHTML = '';
  if (originalPrompt || aiResponse) {
    contextHTML = `
      <div class="llm-response-card" style="margin-bottom: 16px;">
        <div class="llm-response-header">
          <span class="llm-response-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Context
          </span>
        </div>
        <div class="llm-response-content">
          ${originalPrompt ? `
            <div style="margin-bottom: 12px;">
              <strong style="font-size: 11px; color: var(--text-secondary); display: block; margin-bottom: 6px;">📝 Original Prompt (Input):</strong>
              <div style="padding: 12px; background: var(--bg-primary); border-radius: 4px; font-size: 12px; line-height: 1.6; max-height: 200px; overflow-y: auto; white-space: pre-wrap; font-family: 'SF Mono', monospace;">${originalPrompt}</div>
            </div>
          ` : ''}
          ${aiResponse ? `
            <div>
              <strong style="font-size: 11px; color: var(--text-secondary); display: block; margin-bottom: 6px;">✨ AI Response (Output):</strong>
              <div class="ai-response" style="padding: 12px; background: var(--bg-primary); border-radius: 4px; font-size: 13px; line-height: 1.7; max-height: 300px; overflow-y: auto;">${markdownToHTML(aiResponse)}</div>
            </div>
          ` : ''}
        </div>
        <div style="margin-top: 12px; padding: 10px; background: rgba(16, 185, 129, 0.15); border-radius: 4px; font-size: 10px; line-height: 1.4; color: var(--text-secondary);">
          <strong style="color: #10B981;">✨ AI INSIGHTS</strong> – This response was generated by AI. Always verify information independently before making decisions.
        </div>
      </div>
    `;
  }

  const html = `
    ${contextHTML}
    
    <!-- MODEL & TOKEN INFORMATION (PROMINENT) -->
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
      <span style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; font-size: 13px; font-weight: 600; color: #10B981;">
        🤖 ${testResult.modelData.provider} - ${testResult.modelData.model}
      </span>
      <span style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; font-size: 13px; font-weight: 600; color: #3B82F6;">
        📊 ${testResult.inputTokens.toLocaleString()} input tokens
      </span>
      <span style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; font-size: 13px; font-weight: 600; color: #8B5CF6;">
        📈 ${testResult.outputTokens.toLocaleString()} output tokens
      </span>
    </div>
    
    <div class="enterprise-projection-card" style="padding: 16px; background: var(--bg-secondary); border-radius: 6px; margin-bottom: 16px;">
      <h5 style="margin-bottom: 12px; color: var(--text-primary);">Volume Projections</h5>
      <div class="metric-row">
        <span class="metric-label">Annual Queries:</span>
        <span class="metric-value">${annualQueries.toLocaleString()}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Annual Input Tokens:</span>
        <span class="metric-value">${annualInputTokens.toLocaleString()}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Annual Output Tokens:</span>
        <span class="metric-value">${annualOutputTokens.toLocaleString()}</span>
      </div>
    </div>
    
    <div class="llm-response-card">
      <div class="llm-response-header">
        <span class="llm-response-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M2 12h20"/>
          </svg>
          Cost Projections
        </span>
      </div>
      <div class="llm-response-content">
      <div class="metric-row">
        <span class="metric-label">Cost per Query:</span>
        <span class="metric-value">$${costPerQuery.toFixed(4)}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Monthly Cost:</span>
        <span class="metric-value">$${monthlyCost.toFixed(2)}</span>
      </div>
        <div class="metric-row metric-total" style="font-size: 16px; font-weight: 700;">
          <span class="metric-label">Annual Cost:</span>
          <span class="metric-value">$${annualCost.toFixed(2)}</span>
        </div>
      </div>
      <div style="margin-top: 12px; padding: 10px; background: rgba(16, 185, 129, 0.15); border-radius: 4px; font-size: 10px; line-height: 1.4; color: var(--text-secondary);">
        <strong style="color: #10B981;">✨ AI INSIGHTS</strong> – Cost projections based on AI-analyzed token usage. Always verify with your provider for accurate enterprise pricing.
      </div>
    </div>
    
    <div style="margin-top: 16px; padding: 12px; background: var(--bg-tertiary); border-radius: 6px; font-size: 11px; color: var(--text-secondary);">
      <strong>Assumptions:</strong> ${numUsers.toLocaleString()} users × ${queriesPerDay} queries/day × ${workingDays} working days
    </div>
    
    <div class="result-disclaimer" style="margin-top: 12px; padding: 12px; background: rgba(245, 158, 11, 0.1); border-left: 3px solid #F59E0B; border-radius: 4px; font-size: 11px; line-height: 1.5; color: var(--text-secondary);">
      <strong style="color: #F59E0B;">⚠️ Cost Estimates Disclaimer:</strong> Pricing shown is indicative only, based on publicly available model provider rates (OpenAI, Anthropic) sourced from LiteLLM pricing database. These are NOT official SAP prices. This tool is not affiliated with or endorsed by SAP SE. Actual costs depend on your specific agreements, volume discounts, and enterprise contracts. For official pricing, contact your provider or SAP directly.
    </div>
  `;

  resultsContent.innerHTML = html;
  resultsDiv.style.display = 'block';

  // Show export button
  const exportBtn = document.getElementById('exportEnterpriseReportBtn');
  if (exportBtn) {
    exportBtn.style.display = 'inline-flex';

    // Attach export handler with current data
    exportBtn.onclick = () => {
      exportEnterpriseReport({
        testResult,
        numUsers,
        queriesPerDay,
        workingDays,
        outputTokens,
        annualQueries,
        annualInputTokens,
        annualOutputTokens,
        costPerQuery,
        monthlyCost,
        annualCost
      });
    };
  }

  showToast('Projections calculated ✓', 'success');
}

/**
 * Export enterprise cost projection as text file with input/output context
 * @param {Object} data - Projection data
 */
function exportEnterpriseReport(data) {
  const timestamp = new Date().toISOString().split('T')[0];

  // Get original prompt and response from modal
  const modal = document.getElementById('enterpriseCalculatorModal');
  const originalPrompt = modal.getAttribute('data-original-prompt') || '';
  const aiResponse = data.testResult.responseContent || '';

  // Strip markdown for clean text export
  const cleanResponse = stripMarkdown(aiResponse);

  // Build comprehensive text report with input/output context
  const report = `SAP Pro Toolkit - Enterprise AI Cost Projection
Generated: ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${originalPrompt ? `📝 ORIGINAL PROMPT (INPUT)
${originalPrompt}

` : ''}${aiResponse ? `✨ AI RESPONSE (OUTPUT)
${cleanResponse}

` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODEL DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provider: ${data.testResult.modelData.provider}
Model: ${data.testResult.modelData.model}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCALE PARAMETERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Number of Users: ${data.numUsers.toLocaleString()}
Queries per User per Day: ${data.queriesPerDay}
Working Days per Year: ${data.workingDays}
Expected Output Tokens: ${data.outputTokens.toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VOLUME PROJECTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Annual Queries: ${data.annualQueries.toLocaleString()}
Annual Input Tokens: ${data.annualInputTokens.toLocaleString()}
Annual Output Tokens: ${data.annualOutputTokens.toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COST PROJECTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cost per Query: $${data.costPerQuery.toFixed(4)}
Monthly Cost: $${data.monthlyCost.toFixed(2)}
Annual Cost: $${data.annualCost.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input Tokens per Query: ${data.testResult.inputTokens.toLocaleString()}
Output Tokens per Query: ${data.testResult.outputTokens.toLocaleString()}
Cost per Query: $${data.testResult.costs.totalCost}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DISCLAIMER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ Cost Estimates Disclaimer

Pricing Source: LiteLLM pricing database (publicly available model rates)
Indicative Pricing: Pricing shown is indicative only, based on OpenAI and 
                    Anthropic published rates
Not Official SAP Pricing: These are NOT official SAP prices
Not Affiliated: This tool is not affiliated with or endorsed by SAP SE
Actual Costs: Actual costs depend on specific agreements, volume discounts, 
             and enterprise contracts
Official Pricing Contact: Contact your provider or SAP directly for official pricing

Last Updated: 2026-01-13
`;

  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `enterprise-ai-cost-projection-${timestamp}.txt`;
  a.click();

  URL.revokeObjectURL(url);

  showToast('Report exported ✓', 'success');
}

/**
 * Close Enterprise Calculator modal
 */
function closeEnterpriseCalculatorModal() {
  const modal = document.getElementById('enterpriseCalculatorModal');
  if (modal) {
    modal.classList.remove('active');

    // Hide export button
    const exportBtn = document.getElementById('exportEnterpriseReportBtn');
    if (exportBtn) exportBtn.style.display = 'none';
  }
}

// ==================== SAP AI CORE CONFIGURATION ====================

/**
 * Connect to SAP AI Core and load deployed models
 */
async function connectSAPAICore() {
  const clientId = document.getElementById('sapAiCoreClientId').value.trim();
  const clientSecret = document.getElementById('sapAiCoreClientSecret').value.trim();
  const baseUrl = document.getElementById('sapAiCoreBaseUrl').value.trim();
  const authUrl = document.getElementById('sapAiCoreAuthUrl').value.trim();
  const resourceGroup = document.getElementById('sapAiCoreResourceGroup').value.trim() || 'default';

  if (!clientId || !clientSecret || !baseUrl || !authUrl) {
    showToast('Please fill in all required fields', 'warning');
    return;
  }

  // Verify ToolkitCore is loaded
  if (!window.ToolkitCore || !window.ToolkitCore.loadSAPAICoreModels) {
    console.error('[SAP AI Core] ToolkitCore not loaded!', window.ToolkitCore);
    showToast('System error: ToolkitCore not loaded. Try reloading the extension.', 'error');
    return;
  }

  try {
    showToast('Connecting to SAP AI Core...', 'info');

    // Test connection by loading deployed models
    // This validates credentials and populates the model dropdown
    const models = await window.ToolkitCore.loadSAPAICoreModels({
      clientId,
      clientSecret,
      baseUrl,
      authUrl,
      resourceGroup
    });

    if (!models || models.length === 0) {
      showToast('No deployed models found in resource group', 'warning');
      return;
    }

    // Populate model dropdown with model identifier as value (not deployment ID)
    const modelSelect = document.getElementById('sapAiCoreModel');
    modelSelect.disabled = false;
    modelSelect.innerHTML = models.map(m =>
      `<option value="${m.name}" data-deployment-id="${m.id}">${m.name} (${m.status})</option>`
    ).join('');

    showToast(`Connected ✓ Found ${models.length} deployed model(s)`, 'success');

  } catch (error) {
    console.error('[SAP AI Core] Connection failed:', error);
    showToast(`Connection failed: ${error.message}`, 'error');
  }
}

/**
 * Save SAP AI Core configuration to encrypted storage
 */
async function saveSAPAICoreConfig() {
  const clientId = document.getElementById('sapAiCoreClientId').value.trim();
  const clientSecret = document.getElementById('sapAiCoreClientSecret').value.trim();
  const baseUrl = document.getElementById('sapAiCoreBaseUrl').value.trim();
  const authUrl = document.getElementById('sapAiCoreAuthUrl').value.trim();
  const resourceGroup = document.getElementById('sapAiCoreResourceGroup').value.trim() || 'default';
  const selectedModel = document.getElementById('sapAiCoreModel').value;

  if (!clientId || !clientSecret || !baseUrl || !authUrl) {
    showToast('Please fill in all required fields', 'warning');
    return;
  }

  if (!selectedModel) {
    showToast('Please select a deployed model', 'warning');
    return;
  }

  try {
    // Get the deployment ID from the selected option's data attribute
    const modelSelect = document.getElementById('sapAiCoreModel');
    const selectedOption = modelSelect.options[modelSelect.selectedIndex];
    const deploymentId = selectedOption.getAttribute('data-deployment-id');

    // Encrypt and save credentials with BOTH model name and deployment ID
    const credentials = {
      clientId,
      clientSecret,
      baseUrl,
      authUrl,
      resourceGroup,
      primaryModel: selectedModel,        // Model name (e.g., "anthropic--claude-4.5-sonnet")
      primaryDeploymentId: deploymentId   // Deployment UUID (e.g., "ddf5f587ac5289df")
    };

    await window.CryptoUtils.encryptAndStore('sapAiCoreCredentials', credentials);

    // Show primary model indicator
    const indicator = document.getElementById('sapAiCorePrimaryIndicator');
    const modelName = document.getElementById('primaryModelName');
    if (indicator && modelName) {
      const modelSelect = document.getElementById('sapAiCoreModel');
      const selectedOption = modelSelect.options[modelSelect.selectedIndex];
      modelName.textContent = selectedOption.text;
      indicator.style.display = 'block';
    }

    // Update AI settings
    await updateAISettings();

    showToast('SAP AI Core configuration saved ✓', 'success');

  } catch (error) {
    console.error('[SAP AI Core] Save failed:', error);
    showToast(`Failed to save: ${error.message}`, 'error');
  }
}

/**
 * Clear SAP AI Core configuration from storage
 */
async function clearSAPAICoreConfig() {
  if (!confirm('Clear SAP AI Core configuration? This cannot be undone.')) return;

  try {
    await chrome.storage.local.remove('sapAiCoreCredentials');

    // Clear form fields
    document.getElementById('sapAiCoreClientId').value = '';
    document.getElementById('sapAiCoreClientSecret').value = '';
    document.getElementById('sapAiCoreBaseUrl').value = '';
    document.getElementById('sapAiCoreAuthUrl').value = '';
    document.getElementById('sapAiCoreResourceGroup').value = 'default';

    // Reset model dropdown
    const modelSelect = document.getElementById('sapAiCoreModel');
    modelSelect.disabled = true;
    modelSelect.innerHTML = '<option value="">Connect to load deployed models...</option>';

    // Hide primary model indicator
    const indicator = document.getElementById('sapAiCorePrimaryIndicator');
    if (indicator) indicator.style.display = 'none';

    // Update AI settings
    await updateAISettings();

    showToast('SAP AI Core configuration cleared', 'success');

  } catch (error) {
    console.error('[SAP AI Core] Clear failed:', error);
    showToast('Failed to clear configuration', 'error');
  }
}

/**
 * Load saved API keys when Settings modal opens
 * Decrypts and populates the input fields
 */
async function loadSavedAPIKeys() {
  try {
    // Load OpenAI API key
    const openaiKey = await window.CryptoUtils.retrieveAndDecrypt('apiKeyopenai');
    if (openaiKey) {
      document.getElementById('apiKeyopenaiInput').value = openaiKey;
    }

    // Load Anthropic API key
    const anthropicKey = await window.CryptoUtils.retrieveAndDecrypt('apiKeyanthropic');
    if (anthropicKey) {
      document.getElementById('apiKeyanthropicInput').value = anthropicKey;
    }

    // Load SAP AI Core credentials
    const sapCredentials = await window.CryptoUtils.retrieveAndDecrypt('sapAiCoreCredentials');
    if (sapCredentials) {
      document.getElementById('sapAiCoreClientId').value = sapCredentials.clientId || '';
      document.getElementById('sapAiCoreClientSecret').value = sapCredentials.clientSecret || '';
      document.getElementById('sapAiCoreBaseUrl').value = sapCredentials.baseUrl || '';
      document.getElementById('sapAiCoreAuthUrl').value = sapCredentials.authUrl || '';
      document.getElementById('sapAiCoreResourceGroup').value = sapCredentials.resourceGroup || 'default';

      // Show primary model indicator if set
      if (sapCredentials.primaryModel) {
        const indicator = document.getElementById('sapAiCorePrimaryIndicator');
        const modelName = document.getElementById('primaryModelName');
        if (indicator && modelName) {
          modelName.textContent = sapCredentials.primaryModel;
          indicator.style.display = 'block';
        }
      }
    }

    console.log('[API Keys] Loaded saved credentials');

  } catch (error) {
    console.error('[API Keys] Failed to load saved keys:', error);
    // Don't show error toast - just log it, as this is expected on first run
  }
}

// ==================== AI SHORTCUT CREATION ====================
// observeShortcutModal is now in ai-features.js

/**
 * Add event listener for AI shortcut button
 */
document.getElementById('addShortcutWithAIBtn')?.addEventListener('click', addShortcutWithAI);

/**
 * AI-powered shortcut creation
 * Opens modal first, then scrapes page and populates fields dynamically
 */
async function addShortcutWithAI() {
  // Check if AI is available
  if (!window.ToolkitCore || !window.ToolkitCore.testPromptWithModel) {
    showToast('AI features not available', 'error');
    return;
  }

  try {
    // Open modal FIRST with empty fields
    openAddShortcutModal();

    const notesField = document.getElementById('shortcutNotes');

    // Show loading state in notes field with green background
    notesField.value = '⏳ Analyzing current page...';
    notesField.style.background = 'rgba(16, 185, 129, 0.1)';
    notesField.style.borderColor = '#10B981';

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab || !tab.url) {
      notesField.value = '';
      notesField.style.background = '';
      notesField.style.borderColor = '';
      showToast('No active tab found', 'warning');
      return;
    }

    // Check if we can inject scripts (not on chrome:// or edge:// pages)
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      notesField.value = '';
      notesField.style.background = '';
      notesField.style.borderColor = '';
      showToast('Cannot scrape browser internal pages', 'warning');
      document.getElementById('shortcutName').value = tab.title;
      document.getElementById('shortcutPath').value = tab.url;
      return;
    }

    // Inject content script if not already present
    notesField.value = '⏳ Preparing to scrape page...';
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      });
      console.log('[AI Shortcut] Content script injected');
    } catch (injectError) {
      console.log('[AI Shortcut] Content script already present or injection failed:', injectError);
      // Continue anyway - script might already be loaded
    }

    // Wait a moment for script to initialize
    await new Promise(resolve => setTimeout(resolve, 300));

    // Scrape page content via content script
    notesField.value = '⏳ Scraping page content...';
    const scrapedData = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: 'scrapePageForShortcut' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('[AI Shortcut] Message failed:', chrome.runtime.lastError);
          resolve({ error: 'Failed to scrape page', title: tab.title, url: tab.url, content: '' });
        } else {
          resolve(response);
        }
      });
    });

    console.log('[AI Shortcut] Scraped data:', scrapedData);

    // Populate URL immediately
    document.getElementById('shortcutPath').value = scrapedData.url;

    // Enhance title if it's vague
    notesField.value = '⏳ Enhancing title...';
    const enhancedTitle = await enhanceTitle(scrapedData.title, scrapedData.content);
    document.getElementById('shortcutName').value = enhancedTitle;

    // Generate AI summary from page content
    notesField.value = '⏳ Generating AI summary...';
    const summary = await generatePageSummary(scrapedData.title, scrapedData.url, scrapedData.content);

    // Populate with summary and remove loading state
    notesField.value = summary;
    notesField.style.background = '';
    notesField.style.borderColor = '';

    // Set default icon
    document.getElementById('shortcutIcon').value = '8';

    showToast('✨ AI summary generated ✓', 'success');

  } catch (error) {
    console.error('[AI Shortcut] Failed:', error);
    const notesField = document.getElementById('shortcutNotes');
    notesField.value = '';
    notesField.style.background = '';
    notesField.style.borderColor = '';
    showToast(`AI shortcut creation failed: ${error.message}`, 'error');
  }
}

/**
 * Smart title enhancement - only enhances vague titles
 * @param {string} originalTitle - Original page title
 * @param {string} pageContent - Page content for context
 * @returns {string} Enhanced or original title
 */
async function enhanceTitle(originalTitle, pageContent) {
  // List of vague titles that need enhancement
  const vagueTitles = [
    'dashboard',
    'home',
    'admin',
    'settings',
    'configuration',
    'profile',
    'reports',
    'analytics',
    'overview',
    'home page',
    'main page',
    'portal'
  ];

  // Check if title is vague (case-insensitive)
  const titleLower = originalTitle.toLowerCase().trim();
  const isVague = vagueTitles.some(vague => titleLower === vague || titleLower.startsWith(vague + ' '));

  // If title is good (specific), return it unchanged
  if (!isVague) {
    console.log('[Title Enhancement] Title is specific, keeping original:', originalTitle);
    return originalTitle;
  }

  // If title is vague, enhance it with AI
  console.log('[Title Enhancement] Vague title detected, enhancing:', originalTitle);

  try {
    const prompt = `Based on this page content, generate a more descriptive title (max 50 characters). 
Current title: "${originalTitle}"

Page content preview:
${pageContent.substring(0, 500)}

Provide only the enhanced title, nothing else.`;

    const result = await window.ToolkitCore.testPromptWithModel(prompt);

    if (result && result.content) {
      const enhancedTitle = result.content.trim().replace(/^["']|["']$/g, ''); // Remove quotes
      console.log('[Title Enhancement] Enhanced title:', enhancedTitle);
      return enhancedTitle.substring(0, 50); // Limit to 50 chars
    }

  } catch (error) {
    console.warn('[Title Enhancement] Failed, using original:', error);
  }

  return originalTitle;
}

/**
 * Generate AI summary from page content
 * @param {string} title - Page title
 * @param {string} url - Page URL
 * @param {string} content - Scraped page content
 * @returns {string} AI-generated summary
 */
async function generatePageSummary(title, url, content) {
  if (!content || content.length < 50) {
    return `${title}\n\nURL: ${url}`;
  }

  try {
    const prompt = `Summarize this page in 2-3 concise sentences (max 200 words). Focus on what the page is about and its key information.

Page Title: ${title}
URL: ${url}

Content:
${content}

Provide only the summary, no preamble.`;

    const result = await window.ToolkitCore.testPromptWithModel(prompt);

    if (result && result.content) {
      return result.content.trim();
    }

    return `${title}\n\n${content.substring(0, 200)}...`;

  } catch (error) {
    console.error('[AI Summary] Failed:', error);
    return `${title}\n\n${content.substring(0, 200)}...`;
  }
}
