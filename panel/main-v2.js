// SF Pro Toolkit - Main Module
// Initialization and event listener setup
// Uses window object pattern for cross-file communication

// ==================== INITIALIZATION ====================

async function init() {
  console.log('[Init] Starting SF Pro Toolkit initialization...');

  try {
    // Discover profiles dynamically from JSON files
    await window.discoverProfiles();
    console.log('[Init] Discovered profiles:', window.availableProfiles.length);

    // Render profile tabs (Chrome-style)
    window.renderProfileTabs();

    // Load active profile
    const result = await chrome.storage.local.get('activeProfile');
    const activeProfile = result.activeProfile || 'profile-global';
    
    // Set current profile using window object
    window.setCurrentProfile(activeProfile);

    // Update profile display (DISABLED - profile dropdown removed for testing)
    // const profile = window.availableProfiles.find(p => p.id === activeProfile);
    // if (profile) {
    //   const profileNameEl = document.getElementById('currentProfileName');
    //   if (profileNameEl) {
    //     profileNameEl.textContent = profile.name;
    //   }
    // }

    // Load all data (load solutions BEFORE environments to fix Quick Actions race condition)
    await window.loadSettings();
    await window.loadSolutions();
    await window.loadShortcuts();
    await window.loadEnvironments();
    await window.loadNotes();
    await window.loadCurrentPageData();
    await window.loadTheme();

    // Render UI
    window.renderShortcuts();
    window.renderEnvironments();
    window.renderNotes();
    await window.renderPopularNotes();

    // Initialize collapsible sections
    await window.initializeCollapsibleSections();

    // Update diagnostics button state
    window.updateDiagnosticsButton();

    // Setup all event listeners
    setupEventListeners();

    // Setup keyboard shortcuts
    setupKeyboardShortcuts();

    // Setup search functionality
    setupSearch();

    // Setup tab switching
    setupTabSwitching();

    // Initialize note type radio buttons
    setupNoteTypeHandlers();

    // Setup character counter for note content
    setupNoteCharCounter();

    // Listen for tab changes to update Quick Actions
    chrome.tabs.onActivated.addListener(async () => {
      await window.loadCurrentPageData();
    });

    // Listen for URL changes within tabs to update Quick Actions
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
      if (changeInfo.status === 'complete') {
        await window.loadCurrentPageData();
      }
    });

    console.log('[Init] ✅ Initialization complete');

  } catch (error) {
    console.error('[Init] ❌ Failed:', error);
    if (window.showToast) {
      window.showToast('Failed to initialize extension', 'error');
    }
  }
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
  // Environment actions
  document.getElementById('addEnvBtn')?.addEventListener('click', window.openAddEnvironmentModal);
  document.getElementById('addEnvBtnInline')?.addEventListener('click', window.openAddEnvironmentModal);
  document.getElementById('closeAddEnvModal')?.addEventListener('click', window.closeAddEnvironmentModal);
  document.getElementById('cancelAddEnvBtn')?.addEventListener('click', window.closeAddEnvironmentModal);
  document.getElementById('saveEnvBtn')?.addEventListener('click', window.saveEnvironment);

  // Shortcut actions
  document.getElementById('addShortcutBtn')?.addEventListener('click', window.openAddShortcutModal);
  document.getElementById('addCurrentPageBtnEmpty')?.addEventListener('click', window.addCurrentPageAsShortcut);
  document.getElementById('closeAddShortcutModal')?.addEventListener('click', window.closeAddShortcutModal);
  document.getElementById('cancelAddShortcutBtn')?.addEventListener('click', window.closeAddShortcutModal);
  document.getElementById('saveShortcutBtn')?.addEventListener('click', window.saveShortcut);
  document.getElementById('addShortcutWithAIBtn')?.addEventListener('click', window.addShortcutWithAI);

  // Note actions
  document.getElementById('addNoteBtn')?.addEventListener('click', window.openAddNoteModal);
  document.getElementById('addNoteBtnEmpty')?.addEventListener('click', window.openAddNoteModal);
  document.getElementById('closeAddNoteModal')?.addEventListener('click', window.closeAddNoteModal);
  document.getElementById('saveNoteBtn')?.addEventListener('click', window.saveNote);
  document.getElementById('downloadNoteBtn')?.addEventListener('click', () => {
    const modal = document.getElementById('addNoteModal');
    const editId = modal?.getAttribute('data-edit-id');
    
    // Check if this is after an AI response (content in textarea differs from stored note)
    const noteTitle = document.getElementById('noteTitle')?.value.trim();
    const noteContent = document.getElementById('noteContent')?.value.trim();
    
    if (noteContent && noteTitle) {
      // Download current content from textarea (which may be AI response)
      window.downloadCurrentNoteContent(noteTitle, noteContent);
    } else if (editId) {
      // Fallback: download stored note
      window.downloadNote(editId);
    }
  });
  document.getElementById('prettifyNoteBtn')?.addEventListener('click', window.prettifyNote);
  document.getElementById('enhanceWithAIBtn')?.addEventListener('click', window.handleRunAIPrompt);

  // Help modal
  document.getElementById('helpBtn')?.addEventListener('click', () => {
    document.getElementById('helpModal')?.classList.add('active');
  });
  document.getElementById('closeHelpModal')?.addEventListener('click', () => {
    document.getElementById('helpModal')?.classList.remove('active');
  });
  document.getElementById('closeHelpBtn')?.addEventListener('click', () => {
    document.getElementById('helpModal')?.classList.remove('active');
  });

  // Settings modal
  document.getElementById('footerSettingsBtn')?.addEventListener('click', () => {
    document.getElementById('settingsModal')?.classList.add('active');
  });
  document.getElementById('closeSettingsModal')?.addEventListener('click', () => {
    document.getElementById('settingsModal')?.classList.remove('active');
  });

  // AI Diagnostics modal
  document.getElementById('footerDiagnosticsBtn')?.addEventListener('click', window.showDiagnosticsModal);
  document.getElementById('closeDiagnosticsModal')?.addEventListener('click', window.closeDiagnosticsModal);
  document.getElementById('closeDiagnosticsBtn')?.addEventListener('click', window.closeDiagnosticsModal);
  document.getElementById('copyAllDiagnosticsBtn')?.addEventListener('click', window.copyAllDiagnostics);
  document.getElementById('regenerateDiagnosticsWithAIBtn')?.addEventListener('click', window.regenerateDiagnosticsWithAI);
  document.getElementById('saveDiagnosticsBtn')?.addEventListener('click', window.saveDiagnosticsAsNote);
  document.getElementById('downloadDiagnosticsBtn')?.addEventListener('click', window.downloadDiagnosticsReport);

  // AI Search
  document.getElementById('aiSearchBtn')?.addEventListener('click', () => {
    const searchInput = document.getElementById('globalSearch');
    const query = searchInput?.value.trim();
    if (query) {
      window.performAISearch(query);
    } else {
      if (window.showToast) window.showToast('Enter a search query first', 'warning');
    }
  });

  // AI Insights Bar
  document.getElementById('closeAiInsights')?.addEventListener('click', () => {
    document.getElementById('aiInsightsBar').style.display = 'none';
  });

  // AI Test Results modal
  document.getElementById('closeAiTestResultsModal')?.addEventListener('click', window.closeAiTestResultsModal);
  document.getElementById('saveAiResponseBtn')?.addEventListener('click', window.saveAIResponseAsNote);
  document.getElementById('copyAiResponseBtn')?.addEventListener('click', window.copyAIResponseToClipboard);
  document.getElementById('openEnterpriseCalcBtn')?.addEventListener('click', window.openEnterpriseCalculator);

  // Enterprise Calculator modal
  document.getElementById('closeEnterpriseCalculatorModal')?.addEventListener('click', window.closeEnterpriseCalculatorModal);

  // Profile modal
  document.getElementById('closeProfileModal')?.addEventListener('click', () => {
    document.getElementById('editProfileModal')?.classList.remove('active');
  });
  document.getElementById('cancelProfileBtn')?.addEventListener('click', () => {
    document.getElementById('editProfileModal')?.classList.remove('active');
  });

  // Quick Actions Save
  document.getElementById('saveAllQaBtn')?.addEventListener('click', window.saveAllQuickActions);

  // Settings tabs
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`${targetTab}-tab`)?.classList.add('active');
    });
  });

  // Import/Export
  document.getElementById('exportAllBtn')?.addEventListener('click', window.exportJsonToFile);
  document.getElementById('importJsonBtn')?.addEventListener('click', () => {
    document.getElementById('importFileInput')?.click();
  });
  document.getElementById('importFileInput')?.addEventListener('change', window.handleFileImport);

  // Theme toggle
  document.getElementById('footerThemeBtn')?.addEventListener('click', window.toggleTheme);

  // OSS Note search
  document.getElementById('ossNoteBtn')?.addEventListener('click', () => {
    const form = document.getElementById('ossNoteSearchForm');
    if (form) {
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
  });
  document.getElementById('closeOssSearchBtn')?.addEventListener('click', () => {
    document.getElementById('ossNoteSearchForm').style.display = 'none';
  });
  document.getElementById('openOssNoteInlineBtn')?.addEventListener('click', () => {
    const noteNumber = document.getElementById('ossNoteInputInline')?.value.trim();
    if (noteNumber) {
      window.openPopularOssNote(noteNumber);
    }
  });
  document.getElementById('copyOssUrlBtn')?.addEventListener('click', () => {
    const noteNumber = document.getElementById('ossNoteInputInline')?.value.trim();
    if (noteNumber) {
      const url = `https://launchpad.support.sap.com/#/notes/${noteNumber}`;
      navigator.clipboard.writeText(url);
      if (window.showToast) window.showToast('OSS Note URL copied ✓', 'success');
    }
  });
  document.getElementById('addOssShortcutBtn')?.addEventListener('click', () => {
    const noteNumber = document.getElementById('ossNoteInputInline')?.value.trim();
    if (noteNumber) {
      window.openAddShortcutModal();
      document.getElementById('shortcutName').value = `SAP Note ${noteNumber}`;
      document.getElementById('shortcutPath').value = `https://launchpad.support.sap.com/#/notes/${noteNumber}`;
      document.getElementById('shortcutIcon').value = 'document';
    } else {
      if (window.showToast) window.showToast('Enter an OSS Note number first', 'warning');
    }
  });
  document.getElementById('togglePopularNotes')?.addEventListener('click', () => {
    const grid = document.getElementById('popularNotesGrid');
    if (grid) {
      grid.style.display = grid.style.display === 'none' ? 'grid' : 'none';
    }
  });

  // Search functionality
  document.getElementById('clearSearch')?.addEventListener('click', () => {
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
      searchInput.value = '';
      window.filterContent('');
      document.getElementById('clearSearch').style.display = 'none';
    }
  });

  // Modal backdrop clicks (close modals)
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Section toggle buttons are set up in initializeCollapsibleSections() - don't duplicate here

  // Functions are already exposed to window object by their respective modules
  // No need to re-assign them here since they're already window.functionName
}

// ==================== KEYBOARD SHORTCUTS ====================

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', async (e) => {
    // Only handle shortcuts when not in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    // Cmd/Ctrl + K: Quick search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('quickSearch')?.focus();
    }

    // Cmd/Ctrl + E: Add environment
    if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
      e.preventDefault();
      window.openAddEnvironmentModal();
    }

    // Cmd/Ctrl + D: Add shortcut
    if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
      e.preventDefault();
      window.addCurrentPageAsShortcut();
    }

    // Cmd/Ctrl + N: Add note
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      window.openAddNoteModal();
    }

    // Cmd/Ctrl + I: AI Search
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault();
      window.performAISearch();
    }

    // Number keys 1-5: Quick switch environments
    if (e.key >= '1' && e.key <= '5') {
      const envIndex = parseInt(e.key) - 1;
      await window.quickSwitchToEnvironment(envIndex);
    }

    // Escape: Close any open modal
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
      });
      document.getElementById('profileMenu')?.classList.remove('active');
    }
  });
}

// ==================== SEARCH ====================

function setupSearch() {
  const searchInput = document.getElementById('quickSearch');
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.trim();
      window.filterContent(searchTerm);
    });

    // Clear search on Escape
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        window.filterContent('');
        searchInput.blur();
      }
    });
  }
}

// ==================== TAB SWITCHING ====================

function setupTabSwitching() {
  const tabs = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');

      // Update active tab button
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update visible content
      tabContents.forEach(content => {
        if (content.id === targetTab) {
          content.classList.add('active');
          
          // Load Quick Actions data when switching to that tab
          if (targetTab === 'quick-actions-tab') {
            window.renderAllProfilesQuickActions();
          }
        } else {
          content.classList.remove('active');
        }
      });
    });
  });
}

// ==================== NOTE TYPE HANDLERS ====================

function setupNoteTypeHandlers() {
  const noteTypeRadios = document.querySelectorAll('input[name="noteType"]');
  
  noteTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const noteType = e.target.value;
      const modelGroup = document.getElementById('modelSelectorGroup');
      
      if (noteType === 'ai-prompt') {
        if (modelGroup) modelGroup.style.display = 'block';
        window.showAITestButtons();
      } else {
        if (modelGroup) modelGroup.style.display = 'none';
        window.hideAITestButtons();
      }
    });
  });
}

// ==================== NOTE CHARACTER COUNTER ====================

function setupNoteCharCounter() {
  const noteContent = document.getElementById('noteContent');
  const counter = document.getElementById('noteContentCounter');
  
  if (noteContent && counter) {
    noteContent.addEventListener('input', () => {
      const length = noteContent.value.length;
      
      if (length >= 5000) {
        counter.classList.add('char-warning');
        counter.textContent = `${length.toLocaleString()} (⚠️ Large note)`;
      } else {
        counter.classList.remove('char-warning');
        counter.textContent = length.toLocaleString();
      }
    });
  }
}

// ==================== START INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', init);
