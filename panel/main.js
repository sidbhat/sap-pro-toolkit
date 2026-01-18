// SAP Pro Toolkit - Main Module
// Initialization and event listener setup
// Uses window object pattern for cross-file communication

// ==================== INITIALIZATION ====================

async function init() {
  console.log('[Init] Starting SAP Pro Toolkit initialization...');

  try {
    // Define available profiles (hardcoded list of profile files)
    const profileDefinitions = [
      {
        id: 'profile-global',
        name: 'Global',
        file: 'profile-global.json',
        icon: '🌐',
        description: 'Universal SAP shortcuts and resources across all solutions'
      },
      {
        id: 'profile-successfactors',
        name: 'SuccessFactors',
        file: 'profile-successfactors-public.json',
        icon: '👥',
        description: 'SuccessFactors HCM tools, shortcuts, and Joule prompts'
      },
      {
        id: 'profile-s4hana',
        name: 'S/4HANA',
        file: 'profile-s4hana.json',
        icon: '🏭',
        description: 'S/4HANA Cloud ERP, Fiori apps, and Clean Core resources'
      },
      {
        id: 'profile-btp',
        name: 'BTP',
        file: 'profile-btp.json',
        icon: '☁️',
        description: 'SAP Business Technology Platform and development tools'
      },
      {
        id: 'profile-executive',
        name: 'Executive',
        file: 'profile-executive.json',
        icon: '📊',
        description: 'Strategic resources for SAP leadership and decision makers'
      },
      {
        id: 'profile-golive',
        name: 'Go-Live',
        file: 'profile-golive.json',
        icon: '🚀',
        description: 'Critical checklists for S/4HANA go-live and cutover'
      },
      {
        id: 'profile-ai-joule',
        name: 'AI & Joule',
        file: 'profile-ai-joule.json',
        icon: '✨',
        description: 'SAP AI, Joule, Generative AI Hub, and prompt engineering'
      }
    ];

    window.availableProfiles.length = 0;
    window.availableProfiles.push(...profileDefinitions);

    // Load custom profiles from storage
    const customProfilesResult = await chrome.storage.local.get('customProfiles');
    const customProfiles = customProfilesResult.customProfiles || [];
    if (customProfiles.length > 0) {
      window.availableProfiles.push(...customProfiles);
      console.log(`[Init] Loaded ${customProfiles.length} custom profile(s)`);
    }

    // Check for Starter Profile generation (First Run Experience)
    const starterCheck = await chrome.storage.local.get('starterProfileCreated');
    if (customProfiles.length === 0 && !starterCheck.starterProfileCreated) {
      console.log('[Init] Creating Starter Profile...');
      try {
        const response = await fetch('../resources/starter-profile.json');
        if (response.ok) {
          const starterData = await response.json();
          const starterId = 'custom-starter';

          // Create the profile
          if (window.createCustomProfile) {
            await window.createCustomProfile(starterId, starterData.profileName, starterData);

            // Mark as created so we don't recreate it if deleted
            await chrome.storage.local.set({ starterProfileCreated: true });

            // If active profile is still default global, maybe switch to starter? 
            // The requirement said "Default Profile: Blank vs. Starter".
            // If we want it to be the default *viewed* profile, we should switch to it.
            // But let's stick to just creating it for now, unless the user explicitly said "Start them with examples".
            // "Strategy: Provide a 'Demo Profile' that is pre-loaded by default."
            // If we switch to it, we might annoy users who want Global. 
            // But "Default Profile" implies it should be the active one?
            // "Should the default be a blank slate or a 'starter' box?"
            // I'll stick to just creating it. The user can switch. 
            // Actually, if it's "pre-loaded by default", just having it available is enough.
          }
        }
      } catch (e) {
        console.error('[Init] Failed to create starter profile:', e);
      }
    }

    // Load active profile
    const result = await chrome.storage.local.get('activeProfile');
    const activeProfile = result.activeProfile || 'profile-global';

    // Set current profile using window object
    window.setCurrentProfile(activeProfile);

    // Update profile display
    const profile = window.availableProfiles.find(p => p.id === activeProfile);
    if (profile) {
      document.getElementById('currentProfileName').textContent = profile.name;
    }

    // Load all data (load solutions BEFORE environments to fix Quick Actions race condition)
    await window.loadSettings();
    await window.loadSolutions();
    await window.loadShortcuts();
    await window.loadEnvironments();
    await window.loadNotes();
    await window.loadCurrentPageData();
    await window.loadTheme();

    // Render UI FIRST (so buttons exist in DOM)
    await window.renderShortcuts();
    await window.renderEnvironments();
    await window.renderNotes();
    await window.renderProfileMenu();
    await window.renderPopularNotes();

    // Update diagnostics button state
    window.updateDiagnosticsButton();

    // Initialize collapsible sections AFTER rendering (attach event listeners to actual buttons)
    await window.initializeCollapsibleSections();

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

    // Check for first-run and show welcome modal
    const isFirstRun = await window.checkFirstRun();
    if (isFirstRun) {
      console.log('[Welcome] First run detected - showing welcome modal');
      document.getElementById('welcomeModal')?.classList.add('active');
    }

  } catch (error) {
    console.error('[Init] ❌ Failed:', error);
    if (window.showToast) {
      window.showToast(window.i18n('failedInitialize'), 'error');
    }
  }
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
  console.log('[Event Listeners] Starting setupEventListeners...');

  // Environment actions
  document.getElementById('addEnvBtn')?.addEventListener('click', window.addCurrentPageAsEnvironment);
  document.getElementById('addEnvBtnInline')?.addEventListener('click', window.addCurrentPageAsEnvironment);
  document.getElementById('closeAddEnvModal')?.addEventListener('click', window.closeAddEnvironmentModal);
  document.getElementById('cancelAddEnvBtn')?.addEventListener('click', window.closeAddEnvironmentModal);
  document.getElementById('saveEnvBtn')?.addEventListener('click', window.saveEnvironment);

  // Shortcut actions
  document.getElementById('addShortcutBtn')?.addEventListener('click', window.addCurrentPageAsShortcut);
  document.getElementById('addCurrentPageBtnEmpty')?.addEventListener('click', window.addCurrentPageAsShortcut);
  document.getElementById('closeAddShortcutModal')?.addEventListener('click', window.closeAddShortcutModal);
  document.getElementById('cancelAddShortcutBtn')?.addEventListener('click', window.closeAddShortcutModal);
  document.getElementById('saveShortcutBtn')?.addEventListener('click', window.saveShortcut);
  document.getElementById('addShortcutWithAIBtn')?.addEventListener('click', window.addShortcutWithAI);

  // Welcome modal
  document.getElementById('welcomeGotItBtn')?.addEventListener('click', async () => {
    await window.markWelcomeSeen();
    document.getElementById('welcomeModal')?.classList.remove('active');
    if (window.showToast) window.showToast(window.i18n('welcomeGetStarted'), 'success');
  });

  document.getElementById('welcomeLearnMoreBtn')?.addEventListener('click', async () => {
    await window.markWelcomeSeen();
    document.getElementById('welcomeModal')?.classList.remove('active');
    document.getElementById('helpModal')?.classList.add('active');
  });

  document.getElementById('welcomeSettingsBtn')?.addEventListener('click', async () => {
    await window.markWelcomeSeen();
    document.getElementById('welcomeModal')?.classList.remove('active');
    if (window.openSettingsModal) window.openSettingsModal();
  });

  // Note actions
  document.getElementById('addNoteBtn')?.addEventListener('click', window.openAddNoteModal);
  document.getElementById('addNoteBtnEmpty')?.addEventListener('click', window.openAddNoteModal);
  document.getElementById('closeAddNoteModal')?.addEventListener('click', window.closeAddNoteModal);
  document.getElementById('cancelAddNoteBtn')?.addEventListener('click', window.closeAddNoteModal);
  document.getElementById('saveNoteBtn')?.addEventListener('click', window.saveNote);
  // Note download dropdown
  const noteDropdown = document.getElementById('noteDownloadDropdown');
  const noteDropdownBtn = document.getElementById('noteDownloadBtn');
  const noteDropdownMenu = document.getElementById('noteDownloadMenu');

  noteDropdownBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    noteDropdown?.classList.toggle('open');
  });

  noteDropdownMenu?.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const format = e.currentTarget.dataset.format;
      const noteTitle = document.getElementById('noteTitle')?.value.trim() || 'note';
      const noteContent = document.getElementById('noteContent')?.value.trim();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      if (noteContent && window.downloadFile) {
        // Detect if this is an AI-generated note
        const modal = document.getElementById('addNoteModal');
        const editId = modal?.getAttribute('data-edit-id');
        let isAINote = false;
        
        if (editId) {
          const note = window.notes.find(n => n.id === editId);
          isAINote = note && (note.noteType === 'ai-prompt' || note.title.startsWith('AI Response'));
        }
        
        // Use conditional header and disclaimer based on AI detection
        const header = isAINote 
          ? window.i18n('exportHeaderToolkitAINote')
          : window.i18n('exportHeaderToolkitNote');
        
        const disclaimer = isAINote 
          ? window.i18n('aiDisclaimerExport')
          : window.i18n('toolkitDisclaimerExport');

        window.downloadFile({
          content: noteContent,
          filename: `${noteTitle.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}`,
          format: format,
          title: header,
          headerDisclaimer: disclaimer
        });
      }
      noteDropdown?.classList.remove('open');
    });
  });

  document.getElementById('copyNoteContentBtn')?.addEventListener('click', window.copyNoteFromModal);
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
    if (window.openSettingsModal) {
      window.openSettingsModal();
    }
  });
  document.getElementById('closeSettingsModal')?.addEventListener('click', () => {
    if (window.closeSettingsModal) {
      window.closeSettingsModal();
    }
  });

  // AI Diagnostics modal
  document.getElementById('footerDiagnosticsBtn')?.addEventListener('click', window.showDiagnosticsModal);
  document.getElementById('closeDiagnosticsModal')?.addEventListener('click', window.closeDiagnosticsModal);
  document.getElementById('closeDiagnosticsBtn')?.addEventListener('click', window.closeDiagnosticsModal);
  document.getElementById('copyAllDiagnosticsBtn')?.addEventListener('click', window.copyAllDiagnostics);
  document.getElementById('regenerateDiagnosticsWithAIBtn')?.addEventListener('click', window.regenerateDiagnosticsWithAI);
  document.getElementById('saveDiagnosticsBtn')?.addEventListener('click', window.saveDiagnosticsAsNote);

  // Diagnostics download dropdown
  const diagDropdown = document.getElementById('diagnosticsDownloadDropdown');
  const diagDropdownBtn = document.getElementById('diagnosticsDownloadBtn');
  const diagDropdownMenu = document.getElementById('diagnosticsDownloadMenu');

  diagDropdownBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    diagDropdown?.classList.toggle('open');
  });

  diagDropdownMenu?.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const format = e.currentTarget.dataset.format;
      const modal = document.getElementById('diagnosticsModal');
      const content = modal?.getAttribute('data-ai-report');
      const pageTitle = modal?.getAttribute('data-page-title') || 'Diagnostics Report';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      if (content && window.downloadFile) {
        window.downloadFile({
          content: content,
          filename: `diagnostics-${timestamp}`,
          format: format,
          title: pageTitle,
          headerDisclaimer: window.i18n('aiDisclaimerDiagnostics')
        });
      }
      diagDropdown?.classList.remove('open');
    });
  });

  // AI Search
  document.getElementById('aiSearchBtn')?.addEventListener('click', () => {
    const searchInput = document.getElementById('globalSearch');
    const query = searchInput?.value.trim();
    if (query) {
      window.performAISearch(query);
    } else {
      if (window.showToast) window.showToast(window.i18n('enterSearchQueryFirst'), 'warning');
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

  // AI Results download dropdown
  const aiResultsDropdown = document.getElementById('aiResultsDownloadDropdown');
  const aiResultsDropdownBtn = document.getElementById('aiResultsDownloadBtn');
  const aiResultsDropdownMenu = document.getElementById('aiResultsDownloadMenu');

  aiResultsDropdownBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    aiResultsDropdown?.classList.toggle('open');
  });

  aiResultsDropdownMenu?.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const format = e.currentTarget.dataset.format;
      const modal = document.getElementById('aiTestResultsModal');
      const content = modal?.dataset?.responseContent;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      if (content && window.downloadFile) {
        window.downloadFile({
          content: content,
          filename: `ai-analysis-${timestamp}`,
          format: format,
          title: window.i18n('exportHeaderToolkitAIAnalysis'),
          headerDisclaimer: window.i18n('aiDisclaimerExport')
        });
      }
      aiResultsDropdown?.classList.remove('open');
    });
  });

  // Enterprise Calculator modal
  document.getElementById('closeEnterpriseCalculatorModal')?.addEventListener('click', window.closeEnterpriseCalculatorModal);

  // Profile modal
  document.getElementById('closeProfileModal')?.addEventListener('click', () => {
    document.getElementById('editProfileModal')?.classList.remove('active');
  });
  document.getElementById('cancelProfileBtn')?.addEventListener('click', () => {
    document.getElementById('editProfileModal')?.classList.remove('active');
  });

  // Profile switching
  document.getElementById('profileDropdownBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    window.toggleProfileMenu();
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
  document.getElementById('exportCurrentProfileBtn')?.addEventListener('click', window.exportCurrentProfile);
  document.getElementById('exportAllBtn')?.addEventListener('click', window.exportAllProfiles);
  document.getElementById('importJsonBtn')?.addEventListener('click', () => {
    document.getElementById('importFileInput')?.click();
  });
  document.getElementById('importFileInput')?.addEventListener('change', window.handleFileImport);

  // Reset Profile
  document.getElementById('resetProfileBtn')?.addEventListener('click', window.resetProfile);

  // New Profile modal
  const closeNewProfileBtn = document.getElementById('closeNewProfileModal');
  const cancelNewProfileBtn = document.getElementById('cancelNewProfileBtn');
  const saveNewProfileBtn = document.getElementById('saveNewProfileBtn');

  console.log('[Event Listeners] New Profile modal buttons:', {
    closeBtn: !!closeNewProfileBtn,
    cancelBtn: !!cancelNewProfileBtn,
    saveBtn: !!saveNewProfileBtn,
    closeFn: !!window.closeNewProfileModal,
    saveFn: !!window.saveNewProfile
  });

  if (closeNewProfileBtn) {
    closeNewProfileBtn.addEventListener('click', () => {
      console.log('[New Profile] Close button clicked');
      if (window.closeNewProfileModal) window.closeNewProfileModal();
    });
  }

  if (cancelNewProfileBtn) {
    cancelNewProfileBtn.addEventListener('click', () => {
      console.log('[New Profile] Cancel button clicked');
      if (window.closeNewProfileModal) window.closeNewProfileModal();
    });
  }

  if (saveNewProfileBtn) {
    saveNewProfileBtn.addEventListener('click', () => {
      console.log('[New Profile] Save button clicked');
      if (window.saveNewProfile) window.saveNewProfile();
    });
  }

  // Character counters for new profile modal
  const newProfileName = document.getElementById('newProfileName');
  const newProfileDesc = document.getElementById('newProfileDesc');
  const nameCounter = document.getElementById('newProfileNameCounter');
  const descCounter = document.getElementById('newProfileDescCounter');

  if (newProfileName && nameCounter) {
    newProfileName.addEventListener('input', () => {
      const length = newProfileName.value.length;
      nameCounter.textContent = `${length}/100`;
      if (length > 100) {
        nameCounter.style.color = 'var(--error)';
      } else {
        nameCounter.style.color = 'var(--text-secondary)';
      }
    });
  }

  if (newProfileDesc && descCounter) {
    newProfileDesc.addEventListener('input', () => {
      const length = newProfileDesc.value.length;
      descCounter.textContent = `${length}/200`;
      if (length > 200) {
        descCounter.style.color = 'var(--error)';
      } else {
        descCounter.style.color = 'var(--text-secondary)';
      }
    });
  }

  // Theme toggle
  document.getElementById('footerThemeBtn')?.addEventListener('click', window.toggleTheme);

  // OSS Note actions
  document.getElementById('ossNoteBtn')?.addEventListener('click', window.toggleOssNoteSearch);
  document.getElementById('openOssNoteInlineBtn')?.addEventListener('click', window.openOssNoteInline);
  document.getElementById('copyOssUrlBtn')?.addEventListener('click', window.copyOssNoteUrl);
  document.getElementById('addOssShortcutBtn')?.addEventListener('click', window.addOssNoteAsShortcut);
  document.getElementById('closeOssSearchBtn')?.addEventListener('click', window.closeOssNoteSearch);

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

  // Close profile menu when clicking outside
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('profileMenu');
    const switcher = document.getElementById('profileDropdownBtn');
    if (menu && !menu.contains(e.target) && !switcher?.contains(e.target)) {
      menu.classList.remove('active');
    }
  });

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
      document.getElementById('globalSearch')?.focus();
    }

    // Cmd/Ctrl + E: Add environment
    if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
      e.preventDefault();
      window.openAddEnvironmentModal();
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
  const searchInput = document.getElementById('globalSearch');
  const clearBtn = document.getElementById('clearSearch');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.trim();
      if (clearBtn) clearBtn.style.display = searchTerm ? 'flex' : 'none';
      if (window.filterContent) window.filterContent(searchTerm);
    });

    // Clear search on Escape
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
        if (window.filterContent) window.filterContent('');
        searchInput.blur();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      clearBtn.style.display = 'none';
      if (window.filterContent) window.filterContent('');
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
        counter.textContent = `${length.toLocaleString()} (⚠️ ${window.i18n('largeNoteWarning')})`;
      } else {
        counter.classList.remove('char-warning');
        counter.textContent = length.toLocaleString();
      }
    });
  }
}

// ==================== START INITIALIZATION ====================

// Close any open dropdowns when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.download-dropdown.open').forEach(dropdown => {
    dropdown.classList.remove('open');
  });
});

document.addEventListener('DOMContentLoaded', init);
