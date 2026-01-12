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
let currentProfile = 'profile-default';
let popularOssNotes = null; // Popular OSS notes data

// ==================== DEBUGGING HELPERS ====================

/**
 * Debug function to inspect notes storage
 * Call from browser console: window.debugNotes()
 */
window.debugNotes = async function() {
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

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const detectedLang = await detectLanguage();
    await chrome.storage.local.set({ detectedLanguage: detectedLang });
    initI18n();
    
    // Load theme first
    await loadTheme();
    
    // Discover and load profiles
    await discoverProfiles();
    await loadActiveProfile();
    
    await loadSettings();
    await loadShortcuts();
    await loadEnvironments();
    await loadNotes();
    await loadCurrentPageData();
    setupEventListeners();
    
    // Setup enhanced keyboard shortcuts with callbacks
    setupEnhancedKeyboardShortcuts({
      addShortcut: addCurrentPageAsShortcut,
      addEnvironment: openAddEnvironmentModal,
      addNote: openAddNoteModal,
      filterContent: filterContent,
      quickSwitchEnv: quickSwitchToEnvironment
    });
    
    // Initialize collapsible sections
    await initializeCollapsibleSections();
    
    // Initialize world clock and content date
    await initializeWorldClock();
    await displayProfileUpdateDate();
    
    updatePlatformSpecificUI();
    
    // Listen for tab changes to update UI
    chrome.tabs.onActivated.addListener(async () => {
      await loadCurrentPageData();
    });
    
    // Listen for URL changes within the same tab
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete') {
        await loadCurrentPageData();
      }
    });
    
  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Failed to initialize extension', 'error');
  }
});

// ==================== DATA LOADING ====================

async function loadSettings() {
  const result = await chrome.storage.sync.get({ showConfirmationForProd: true });
  settings = result;
}

async function loadShortcuts() {
  // Special handling for "All Profiles" mode
  if (currentProfile === 'profile-all') {
    let allShortcuts = [];
    
    // Load shortcuts from all profile files
    for (const p of availableProfiles) {
      if (p.file && p.id !== 'profile-all') {
        const profileData = await loadProfileData(p.id);
        const profileShortcuts = profileData.globalShortcuts || profileData.shortcuts || [];
        allShortcuts.push(...profileShortcuts.map(s => ({ ...s, _source: p.name })));
      }
    }
    
    // Remove duplicates based on URL
    shortcuts = removeDuplicates(allShortcuts, 'url');
    renderShortcuts();
    return;
  }
  
  // Load from current profile's globalShortcuts
  const profileData = await loadProfileData(currentProfile);
  shortcuts = profileData.globalShortcuts || profileData.shortcuts || [];
  
  await chrome.storage.local.set({ shortcuts });
  renderShortcuts();
}

async function loadEnvironments() {
  // Special handling for "All Profiles" mode
  if (currentProfile === 'profile-all') {
    let allEnvironments = [];
    
    // Load environments from all profile storage keys
    for (const p of availableProfiles) {
      if (p.file) {
        const storageKey = `environments_${p.id}`;
        const result = await chrome.storage.local.get(storageKey);
        
        if (result[storageKey] && Array.isArray(result[storageKey])) {
          allEnvironments.push(...result[storageKey].map(e => ({ ...e, _source: p.name })));
        }
      }
    }
    
    // Remove duplicates
    environments = removeDuplicates(allEnvironments, 'hostname');
    renderEnvironments();
    return;
  }
  
  // Load from current profile (profile-specific storage)
  const storageKey = `environments_${currentProfile}`;
  const result = await chrome.storage.local.get(storageKey);
  
  if (result[storageKey] && Array.isArray(result[storageKey]) && result[storageKey].length > 0) {
    environments = result[storageKey];
  } else {
    // Load default environments from current profile file
    try {
      const profileData = await loadProfileData(currentProfile);
      
      if (profileData.environments && Array.isArray(profileData.environments)) {
        environments = profileData.environments;
        await chrome.storage.local.set({ [storageKey]: environments });
      } else {
        environments = [];
      }
    } catch (error) {
      console.error('[Environments] Failed to load default environments:', error);
      environments = [];
    }
  }
  
  renderEnvironments();
}

/**
 * Load notes from local storage
 * On first run, also loads template notes from profile-global.json
 * Notes are stored globally (not profile-specific)
 */
async function loadNotes() {
  const result = await chrome.storage.local.get(['notes', 'notesInitialized']);
  notes = result.notes || [];
  
  // On first run, load template notes from profile-global.json
  if (!result.notesInitialized || notes.length === 0) {
    try {
      const globalResponse = await fetch(chrome.runtime.getURL('resources/profile-global.json'));
      const globalData = await globalResponse.json();
      
      if (globalData.notes && Array.isArray(globalData.notes) && globalData.notes.length > 0) {
        notes = [...globalData.notes, ...notes]; // Prepend template notes
        
        // Save to storage and mark as initialized
        await chrome.storage.local.set({ 
          notes: notes,
          notesInitialized: true 
        });
      }
    } catch (error) {
      console.error('[Notes] Failed to load template notes from profile-global.json:', error);
    }
  }
  
  console.log('[Notes] Loaded notes from storage:', notes.length, 'notes');
  console.log('[Notes] Notes data:', JSON.stringify(notes, null, 2));
  renderNotes();
}

async function loadCurrentPageData() {
  try {
    // Side panel needs to query across all windows, not just currentWindow
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    
    if (!tab || !tab.url) {
      currentPageData = null;
      renderEnvironments();
      updateDiagnosticsButton();
      return;
    }
    
    // Check if it's any SAP page (not just SF)
    const hostname = new URL(tab.url).hostname;
    const solutionType = detectSolutionType(tab.url, hostname);
    
    if (!solutionType) {
      currentPageData = null;
      renderEnvironments();
      updateDiagnosticsButton();
      return;
    }
    
    const messagePromise = new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: 'getPageData' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('[SF Pro Toolkit] Content script message failed, using URL detection');
          resolve(null);
        } else {
          resolve(response);
        }
      });
    });
    
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 500));
    const response = await Promise.race([messagePromise, timeoutPromise]);
    
    if (response && response.hostname) {
      currentPageData = response;
      currentPageData.url = tab.url;
      currentPageData.solutionType = solutionType;
      console.log('[SF Pro Toolkit] Using enhanced data from content script:', currentPageData);
    } else {
      currentPageData = detectEnvironmentFromURL(tab.url);
      currentPageData.url = tab.url;
      currentPageData.solutionType = solutionType;
      console.log('[SF Pro Toolkit] Using URL-based detection:', currentPageData);
    }
    
    // Auto-suggest profile switch if on live SAP system
    await suggestProfileSwitch(solutionType);
    
    renderEnvironments();
    highlightActiveStates(tab.url);
    updateDiagnosticsButton();
    
  } catch (error) {
    console.error('[SF Pro Toolkit] Failed to load page data:', error);
    currentPageData = null;
    renderEnvironments();
    updateDiagnosticsButton();
  }
}

/**
 * Suggest profile switch when user is on a live SAP system
 * Only suggests once per session to avoid being annoying
 * @param {string} solutionType - The detected solution type (successfactors, s4hana, btp, ibp)
 */
async function suggestProfileSwitch(solutionType) {
  if (!solutionType) return;
  
  // Map solution types to recommended profiles
  const profileMap = {
    'successfactors': 'profile-successfactors',
    's4hana': 'profile-s4hana',
    'btp': 'profile-btp',
    'ibp': 'profile-successfactors' // IBP is part of SF ecosystem
  };
  
  const recommendedProfile = profileMap[solutionType];
  if (!recommendedProfile) return;
  
  // Don't suggest if already on recommended profile or "All Profiles"
  if (currentProfile === recommendedProfile || currentProfile === 'profile-all') return;
  
  // Check if we've already suggested this session (use sessionStorage)
  const sessionKey = `profileSuggested_${solutionType}`;
  const result = await chrome.storage.session.get(sessionKey);
  if (result[sessionKey]) return;
  
  // Mark as suggested for this session
  await chrome.storage.session.set({ [sessionKey]: true });
  
  // Get profile name for display
  const profile = availableProfiles.find(p => p.id === recommendedProfile);
  if (!profile) return;
  
  // Show toast notification with action
  const solutionLabels = {
    'successfactors': 'SuccessFactors',
    's4hana': 'S/4HANA',
    'btp': 'BTP',
    'ibp': 'IBP'
  };
  
  const solutionLabel = solutionLabels[solutionType] || solutionType;
  const message = chrome.i18n.getMessage('profileSwitchSuggestion')
    .replace('{solutionLabel}', solutionLabel)
    .replace('{profileName}', profile.name);
  showToast(message, 'info', 5000, () => {
    switchProfile(recommendedProfile);
  });
}

function updateDiagnosticsButton() {
  const diagnosticsBtn = document.getElementById('footerDiagnosticsBtn');
  if (!diagnosticsBtn) return;
  
  const isOnSAPSystem = currentPageData && currentPageData.solutionType;
  
  if (isOnSAPSystem) {
    diagnosticsBtn.classList.remove('btn-disabled');
    diagnosticsBtn.setAttribute('title', 'Diagnostics');
  } else {
    diagnosticsBtn.classList.add('btn-disabled');
    diagnosticsBtn.setAttribute('title', 'Navigate to an SAP system to view diagnostics');
  }
}


/**
 * Load profile data with Global base layer
 * Every profile (except "All Profiles") loads Global first, then merges profile-specific data
 * @param {string} profileId - The profile ID to load
 * @returns {Object} Merged profile data (Global + Profile-specific)
 */
async function loadProfileData(profileId) {
  // Special case: "All Profiles" handled separately
  if (profileId === 'profile-all') {
    return { globalShortcuts: [], solutions: [], environments: [] };
  }
  
  try {
    // Step 1: Always load Global base layer first
    const globalResponse = await fetch(chrome.runtime.getURL('resources/profile-global.json'));
    const globalData = await globalResponse.json();
    
    // Step 2: If loading Global profile itself, return it
    if (profileId === 'profile-global') {
      return globalData;
    }
    
    // Step 3: Load profile-specific data
    const profile = availableProfiles.find(p => p.id === profileId);
    if (!profile || !profile.file) {
      return globalData; // Return just Global
    }
    
    const profileResponse = await fetch(chrome.runtime.getURL(`resources/${profile.file}`));
    const profileData = await profileResponse.json();
    
    // Step 4: Merge Global + Profile data
    const merged = {
      globalShortcuts: [
        ...(globalData.globalShortcuts || []),
        ...(profileData.globalShortcuts || [])
      ],
      solutions: profileData.solutions || globalData.solutions || [],
      environments: [
        ...(globalData.environments || []),
        ...(profileData.environments || [])
      ]
    };
    
    return merged;
    
  } catch (error) {
    console.error('[Profile] Failed to load profile data:', error);
    return { globalShortcuts: [], solutions: [], environments: [] };
  }
}

// ==================== UI RENDERING - ENVIRONMENTS ====================

async function renderEnvironments() {
  const tbody = document.getElementById('environmentList');
  
  // Update section header Add button state based on profile mode
  const addEnvBtn = document.getElementById('addEnvBtn');
  if (addEnvBtn) {
    const isReadOnly = currentProfile === 'profile-all';
    if (isReadOnly) {
      addEnvBtn.classList.add('btn-disabled');
      addEnvBtn.setAttribute('title', 'Switch to a specific profile to add environments');
    } else {
      addEnvBtn.classList.remove('btn-disabled');
      addEnvBtn.setAttribute('title', addEnvBtn.getAttribute('data-title') || 'Add Environment');
    }
  }
  
  // Detect current SAP system and load Quick Actions (independent of saved environments)
  let quickActionsRowHTML = '';
  if (currentPageData && currentPageData.solutionType) {
    const solutionType = currentPageData.solutionType;
    
    // Check for custom solutions in storage first
    const storageKey = `solutions_${currentProfile}`;
    const solutionsResult = await chrome.storage.local.get(storageKey);
    let solutionsData = solutionsResult[storageKey];
    
    // If no custom solutions, load from profile
    if (!solutionsData) {
      const profileData = await loadProfileData(currentProfile);
      solutionsData = profileData.solutions;
    }
    
    const solution = solutionsData?.find(s => s.id === solutionType);
    
    if (solution && solution.quickActions && solution.quickActions.length > 0) {
      const quickActions = solution.quickActions.slice(0, 5);
      const solutionLabel = solution.name || solutionType.toUpperCase();
      
      quickActionsRowHTML = `
        <tr class="quick-actions-standalone-row">
          <td colspan="2" style="padding: 0;">
            <div class="quick-actions-standalone">
              <div class="quick-actions-header">
                <span class="quick-actions-title">⚡ ${solutionLabel} Quick Actions</span>
              </div>
              <div class="quick-action-badges">
                ${quickActions.map(action => `
                  <span class="quick-action-badge" data-action-id="${action.id}" data-action-path="${action.path}">
                    <span class="quick-action-icon">⚡</span>${action.name}
                  </span>
                `).join('')}
              </div>
            </div>
          </td>
        </tr>
      `;
    }
  }
  
  if (environments.length === 0) {
    tbody.innerHTML = quickActionsRowHTML + `
      <tr class="empty-row">
        <td colspan="2">
          <div class="empty-state">
            <p data-i18n="noEnvironments">No saved environments</p>
            <button class="btn btn-secondary btn-sm" id="addEnvBtnInline" data-i18n="addCurrentInstance">+ Add Current Instance</button>
          </div>
        </td>
      </tr>
    `;
    document.getElementById('addEnvBtnInline')?.addEventListener('click', openAddEnvironmentModal);
    
    // Attach quick actions handlers if present
    if (quickActionsRowHTML) {
      // Check for custom solutions in storage first
      const storageKey = `solutions_${currentProfile}`;
      const solutionsResult = await chrome.storage.local.get(storageKey);
      let solutionsData = solutionsResult[storageKey];
      
      // If no custom solutions, load from profile
      if (!solutionsData) {
        const profileData = await loadProfileData(currentProfile);
        solutionsData = profileData.solutions;
      }
      
      const solution = solutionsData?.find(s => s.id === currentPageData.solutionType);
      if (solution && solution.quickActions) {
        attachQuickActionBadgeHandlers(solution.quickActions.slice(0, 5));
      }
    }
    return;
  }
  
  // Detect active environment and solution type
  let currentHostname = null;
  let solutionType = null;
  let currentUrl = null;
  
  if (currentPageData) {
    currentHostname = currentPageData.hostname;
    solutionType = currentPageData.solutionType;
    currentUrl = currentPageData.url;
  }
  
  // Sort: Pinned first, then active, then others
  const sortedEnvs = [...environments].sort((a, b) => {
    // Pinned environments always first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    
    // Within pinned or unpinned, active environment first
    const aIsActive = currentHostname && currentHostname === a.hostname;
    const bIsActive = currentHostname && currentHostname === b.hostname;
    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;
    
    return 0;
  });
  
  // Load Quick Actions and build standalone row HTML
  let quickActions = [];
  let standaloneQuickActionsHTML = '';
  
  if (currentPageData && currentPageData.solutionType) {
    // Check for custom solutions in storage first
    const storageKey = `solutions_${currentProfile}`;
    const solutionsResult = await chrome.storage.local.get(storageKey);
    let solutionsData = solutionsResult[storageKey];
    
    // If no custom solutions, load from profile
    if (!solutionsData) {
      const profileData = await loadProfileData(currentProfile);
      solutionsData = profileData.solutions;
    }
    
    const solution = solutionsData?.find(s => s.id === currentPageData.solutionType);
    
    if (solution && solution.quickActions && solution.quickActions.length > 0) {
      quickActions = solution.quickActions.slice(0, 5);
      const solutionLabel = solution.name || currentPageData.solutionType.toUpperCase();
      
      // Build standalone quick actions row
      standaloneQuickActionsHTML = `
        <tr class="quick-actions-standalone-row">
          <td colspan="2" style="padding: 0;">
            <div class="quick-actions-standalone">
              <div class="quick-actions-header">
                <span class="quick-actions-title">⚡ ${solutionLabel} Quick Actions</span>
              </div>
              <div class="quick-action-badges">
                ${quickActions.map(action => `
                  <span class="quick-action-badge" data-action-id="${action.id}" data-action-path="${action.path}">
                    <span class="quick-action-icon">⚡</span>${action.name}
                  </span>
                `).join('')}
              </div>
            </div>
          </td>
        </tr>
      `;
    }
  }
  
  // Render environments with standalone quick actions prepended
  tbody.innerHTML = standaloneQuickActionsHTML + sortedEnvs.map(env => {
    const isActive = currentHostname && currentHostname === env.hostname;
    
    // Get SAP Fiori icon for environment type
    const envIcon = window.SAPIconLibrary 
      ? window.SAPIconLibrary.ENVIRONMENT_ICONS[env.type]
      : null;
    
    // Render icon as SVG or fallback to emoji
    let iconHTML;
    if (envIcon && envIcon.path) {
      const iconColor = document.body.getAttribute('data-theme') === 'dark' 
        ? envIcon.colorDark 
        : envIcon.color;
      iconHTML = `<svg width="18" height="18" viewBox="${envIcon.viewBox}" fill="${iconColor}" xmlns="http://www.w3.org/2000/svg" aria-label="${envIcon.label}">
        <path d="${envIcon.path}"/>
      </svg>`;
    } else {
      // Fallback to emoji if library not loaded
      const emojiMap = { production: '🔴', preview: '🟢', sales: '🟠', sandbox: '🟣' };
      iconHTML = `<span class="emoji-fallback">${emojiMap[env.type] || '🔵'}</span>`;
    }
    
    // Build metadata line: DC + Region + Company ID
    let metaLine = '';
    if (currentPageData && isActive) {
      const parts = [];
      if (currentPageData.datacenter && currentPageData.datacenter !== 'Unknown') {
        parts.push(currentPageData.datacenter);
      }
      if (currentPageData.region && currentPageData.region !== 'Unknown') {
        const flag = currentPageData.country && COUNTRY_FLAGS[currentPageData.country] ? COUNTRY_FLAGS[currentPageData.country] : '';
        parts.push(`${flag} ${currentPageData.region}`);
      }
      
      // Extract company ID
      const urlParams = extractAllUrlParameters(currentUrl || '', currentPageData);
      if (urlParams.company) {
        parts.push(`Company: ${urlParams.company}`);
      }
      
      metaLine = parts.join(' • ');
    }
    
    // Quick Actions are now rendered in standalone row only (not in environment cards)
    const hasQuickActions = false;
    const quickActionsBadgesHTML = '';
    
    // Build line 2: ALWAYS show hostname or metadata
    let line2HTML = '';
    if (isActive && metaLine) {
      // Active environment: show metadata (DC, region, company)
      line2HTML = `<div class="env-hostname">${metaLine}</div>`;
    } else {
      // Non-active environment: show hostname
      line2HTML = `<div class="env-hostname">${env.hostname}</div>`;
    }
    
    // Build line 3: Notes or usage stats (if present)
    let line3HTML = '';
    if (env.notes) {
      line3HTML = `<div class="env-notes">${env.notes}</div>`;
    } else if (env.lastAccessed && !isActive) {
      // Show usage stats if no notes and not currently active
      const daysSinceAccess = Math.floor((Date.now() - env.lastAccessed) / (1000 * 60 * 60 * 24));
      const accessCount = env.accessCount || 0;
      
      let usageText = '';
      if (daysSinceAccess === 0) {
        usageText = `Used today`;
      } else if (daysSinceAccess === 1) {
        usageText = `Used yesterday`;
      } else if (daysSinceAccess < 7) {
        usageText = `Used ${daysSinceAccess} days ago`;
      } else if (daysSinceAccess < 30) {
        const weeks = Math.floor(daysSinceAccess / 7);
        usageText = `Used ${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
      } else {
        const months = Math.floor(daysSinceAccess / 30);
        usageText = `Used ${months} ${months === 1 ? 'month' : 'months'} ago`;
      }
      
      if (accessCount > 1) {
        usageText += ` • ${accessCount} times`;
      }
      
      line3HTML = `<div class="env-usage-stats">${usageText}</div>`;
    }
    
    // Check if we're in "All Profiles" mode (read-only)
    const isReadOnly = currentProfile === 'profile-all';
    const disabledClass = isReadOnly ? 'btn-disabled' : '';
    const editTitle = isReadOnly ? 'Switch to a specific profile to edit' : 'Edit';
    const deleteTitle = isReadOnly ? 'Switch to a specific profile to delete' : 'Delete';
    
    return `
      <tr class="env-row ${env.type}-env ${isActive ? 'active-row active-env-card' : ''}" data-env-id="${env.id}">
        <td class="env-name-cell">
          <div class="env-name">
            <span class="status-dot ${env.type} ${isActive ? 'active' : ''}">${iconHTML}</span>
            ${env.name}
            <button class="pin-btn ${env.pinned ? 'pinned' : ''}" data-id="${env.id}" title="${env.pinned ? 'Unpin environment' : 'Pin environment to top'}" tabindex="0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="${env.pinned ? '#F59E0B' : 'currentColor'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: ${env.pinned ? '1' : '0.3'}">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>
          </div>
          ${line2HTML}
          ${line3HTML}
        </td>
        <td class="env-actions-cell">
          <div class="table-actions">
            <button class="icon-btn primary switch-btn" data-hostname="${env.hostname}" data-type="${env.type}" title="${isActive ? 'Reload this environment' : 'Switch to this environment'}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
            <button class="icon-btn edit-btn ${disabledClass}" data-id="${env.id}" title="${editTitle}" tabindex="0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="icon-btn danger delete-btn ${disabledClass}" data-id="${env.id}" title="${deleteTitle}" tabindex="0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  attachEnvironmentListeners();
  attachQuickActionBadgeHandlers(quickActions);
  updateSectionCounts();
}

function attachQuickActionBadgeHandlers(quickActions) {
  document.querySelectorAll('.quick-action-badge').forEach(badge => {
    badge.addEventListener('click', async (e) => {
      e.stopPropagation();
      const actionId = badge.getAttribute('data-action-id');
      const action = quickActions.find(a => a.id === actionId);
      
      if (!action) {
        showToast('Quick Action not found', 'error');
        return;
      }
      
      try {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (!tab) return;
        
        // Build URL with all parameters preserved
        const targetUrl = buildQuickActionUrl(action, currentPageData, tab.url);
        
        console.log('[Quick Action] Navigating to:', action.name);
        console.log('[Quick Action] Target URL:', targetUrl);
        
        await chrome.tabs.update(tab.id, { url: targetUrl });
        showToast(`Navigating to ${action.name}...`, 'success');
        
      } catch (error) {
        console.error('[Quick Action] Navigation failed:', error);
        showToast('Failed to navigate', 'error');
      }
    });
  });
}

function attachEnvironmentListeners() {
  // Pin button
  document.querySelectorAll('.env-row .pin-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const type = btn.getAttribute('data-type') || 'environment';
      await togglePin(id, type);
    });
  });
  
  // Switch button
  document.querySelectorAll('.switch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const hostname = btn.getAttribute('data-hostname');
      const type = btn.getAttribute('data-type');
      switchEnvironment(hostname, type);
    });
  });
  
  // Edit button
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      editEnvironment(id);
    });
  });
  
  // Delete button
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      deleteEnvironment(id);
    });
  });
  
  // Add tooltips to truncated text
  document.querySelectorAll('.env-name, .env-hostname').forEach(el => {
    if (el.scrollWidth > el.clientWidth) {
      el.setAttribute('title', el.textContent);
    }
  });
}

/**
 * Toggle pin status for an environment
 * Pinned environments appear at the top of the list
 * @param {string} id - The environment ID
 */
async function togglePin(id) {
  // Block pinning in "All Profiles" mode
  if (currentProfile === 'profile-all') {
    showToast('Switch to a specific profile to pin environments', 'warning');
    return;
  }
  
  const env = environments.find(e => e.id === id);
  if (!env) return;
  
  // Toggle pinned state
  env.pinned = !env.pinned;
  
  // Save to storage
  const storageKey = `environments_${currentProfile}`;
  await chrome.storage.local.set({ [storageKey]: environments });
  
  // Re-render to show updated pin state and resort
  renderEnvironments();
  
  const message = env.pinned ? 'Environment pinned ⭐' : 'Environment unpinned';
  showToast(message, 'success');
}

// ==================== UI RENDERING - SHORTCUTS ====================

function renderShortcuts() {
  const tbody = document.getElementById('shortcutsList');
  
  // Update section header Add button state based on profile mode
  const addShortcutBtn = document.getElementById('addShortcutBtn');
  if (addShortcutBtn) {
    const isReadOnly = currentProfile === 'profile-all';
    if (isReadOnly) {
      addShortcutBtn.classList.add('btn-disabled');
      addShortcutBtn.setAttribute('title', 'Switch to a specific profile to add shortcuts');
    } else {
      addShortcutBtn.classList.remove('btn-disabled');
      const defaultTitle = addShortcutBtn.getAttribute('data-title') || 'Add Shortcut';
      addShortcutBtn.setAttribute('title', defaultTitle);
    }
  }
  
  if (shortcuts.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="3">
          <div class="empty-state">
            <p data-i18n="noShortcuts">No shortcuts</p>
            <button class="btn btn-secondary btn-sm" id="addCurrentPageBtnEmpty" data-i18n="addCurrentPage">+ Add Current Page</button>
          </div>
        </td>
      </tr>
    `;
    document.getElementById('addCurrentPageBtnEmpty')?.addEventListener('click', addCurrentPageAsShortcut);
    return;
  }
  
  // Sort: Pinned first, then others
  const sortedShortcuts = [...shortcuts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });
  
  // Check if we're in "All Profiles" mode (read-only)
  const isReadOnly = currentProfile === 'profile-all';
  const disabledClass = isReadOnly ? 'btn-disabled' : '';
  const editTitle = isReadOnly ? 'Switch to a specific profile to edit' : 'Edit';
  const deleteTitle = isReadOnly ? 'Switch to a specific profile to delete' : 'Delete';
  
  tbody.innerHTML = sortedShortcuts.map(shortcut => {
    const displayIcon = renderSAPIcon(shortcut.icon, 'shortcut', 16);
    const tagBadgesHTML = renderTagBadges(shortcut.tags);
    
    return `
      <tr class="shortcut-row" data-shortcut-id="${shortcut.id}" data-url="${shortcut.url}">
        <td class="shortcut-icon-cell">
          <span class="shortcut-icon">${displayIcon}</span>
        </td>
        <td class="shortcut-name-cell">
          <div class="shortcut-name">
            <span>${shortcut.name}</span>
            <button class="pin-btn ${shortcut.pinned ? 'pinned' : ''}" data-id="${shortcut.id}" data-type="shortcut" title="${shortcut.pinned ? 'Unpin shortcut' : 'Pin shortcut to top'}" tabindex="0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="${shortcut.pinned ? '#F59E0B' : 'currentColor'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: ${shortcut.pinned ? '1' : '0.3'}">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>
          </div>
          ${shortcut.notes ? `<div class="shortcut-notes">${shortcut.notes}</div>` : ''}
          ${tagBadgesHTML}
        </td>
        <td class="shortcut-actions-cell">
          <div class="table-actions">
            <button class="icon-btn primary go-btn" data-url="${shortcut.url}" title="Open shortcut" tabindex="0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
            <button class="icon-btn edit-btn ${disabledClass}" data-id="${shortcut.id}" title="${editTitle}" tabindex="0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="icon-btn danger delete-btn ${disabledClass}" data-id="${shortcut.id}" title="${deleteTitle}" tabindex="0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  attachShortcutListeners();
  updateSectionCounts();
}

function attachShortcutListeners() {
  // Pin button
  document.querySelectorAll('.shortcut-row .pin-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const type = btn.getAttribute('data-type');
      await togglePin(id, type);
    });
  });
  
  // Go button - navigate to shortcut
  document.querySelectorAll('.go-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = btn.getAttribute('data-url');
      const builtUrl = buildShortcutUrl({ url }, currentPageData);
      if (builtUrl) {
        navigateToShortcut(builtUrl);
      } else {
        showToast('Cannot navigate: No active SF instance detected', 'warning');
      }
    });
  });
  
  // Edit button
  document.querySelectorAll('.shortcut-row .edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      editShortcut(id);
    });
  });
  
  // Delete button
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      deleteShortcut(id);
    });
  });
  
  // Add tooltips
  document.querySelectorAll('.shortcut-name, .shortcut-notes').forEach(el => {
    if (el.scrollWidth > el.clientWidth) {
      el.setAttribute('title', el.textContent);
    }
  });
}

// ==================== UI RENDERING - NOTES ====================

function renderNotes() {
  const tbody = document.getElementById('notesList');
  
  if (!tbody) {
    console.error('[Notes] notesList tbody element not found!');
    return;
  }
  
  // Update section header Add button state based on profile mode
  const addNoteBtn = document.getElementById('addNoteBtn');
  if (addNoteBtn) {
    const isReadOnly = currentProfile === 'profile-all';
    if (isReadOnly) {
      addNoteBtn.classList.add('btn-disabled');
      addNoteBtn.setAttribute('title', 'Switch to a specific profile to add notes');
    } else {
      addNoteBtn.classList.remove('btn-disabled');
      const defaultTitle = addNoteBtn.getAttribute('data-title') || 'Add Note';
      addNoteBtn.setAttribute('title', defaultTitle);
    }
  }
  
  if (notes.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="3">
          <div class="empty-state">
            <p data-i18n="noNotes">No notes</p>
            <button class="btn btn-secondary btn-sm" id="addNoteBtnEmpty" data-i18n="addNote">+ Add Note</button>
          </div>
        </td>
      </tr>
    `;
    document.getElementById('addNoteBtnEmpty')?.addEventListener('click', openAddNoteModal);
    return;
  }
  
  // Sort: Pinned first, then others
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });
  
  // Check if we're in "All Profiles" mode (read-only)
  const isReadOnly = currentProfile === 'profile-all';
  const disabledClass = isReadOnly ? 'btn-disabled' : '';
  const copyTitle = isReadOnly ? 'Switch to a specific profile to copy' : 'Copy note content';
  const deleteTitle = isReadOnly ? 'Switch to a specific profile to delete' : 'Delete';
  
  tbody.innerHTML = sortedNotes.map(note => {
    const contentPreview = note.content 
      ? (note.content.length > 60 ? note.content.substring(0, 60) + '...' : note.content)
      : '';
    const displayIcon = renderSAPIcon(note.icon, 'note', 16);
    const tagBadgesHTML = renderTagBadges(note.tags);
    
    // In "All Profiles" mode, show View button instead of Edit
    const firstButtonHTML = isReadOnly 
      ? `<button class="icon-btn primary view-btn" data-id="${note.id}" title="View note (read-only)" tabindex="0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>`
      : `<button class="icon-btn primary edit-btn" data-id="${note.id}" title="Edit" tabindex="0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>`;
    
    return `
      <tr class="note-row" data-note-id="${note.id}">
        <td class="note-icon-cell">
          <span class="note-icon">${displayIcon}</span>
        </td>
        <td class="note-content-cell">
          <div class="note-title">
            <span>${note.title}</span>
            <button class="pin-btn ${note.pinned ? 'pinned' : ''}" data-id="${note.id}" data-type="note" title="${note.pinned ? 'Unpin note' : 'Pin note to top'}" tabindex="0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="${note.pinned ? '#F59E0B' : 'currentColor'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: ${note.pinned ? '1' : '0.3'}">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>
          </div>
          ${contentPreview ? `<div class="note-preview">${contentPreview}</div>` : ''}
          ${tagBadgesHTML}
        </td>
        <td class="note-actions-cell">
          <div class="table-actions">
            ${firstButtonHTML}
            <button class="icon-btn copy-btn ${disabledClass}" data-id="${note.id}" title="${copyTitle}" tabindex="0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
            <button class="icon-btn danger delete-btn ${disabledClass}" data-id="${note.id}" title="${deleteTitle}" tabindex="0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  attachNoteListeners();
  updateSectionCounts();
}

function attachNoteListeners() {
  // Pin button
  document.querySelectorAll('.note-row .pin-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const type = btn.getAttribute('data-type');
      await togglePin(id, type);
    });
  });
  
  // Copy button
  document.querySelectorAll('.note-row .copy-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      await copyNoteContent(id, btn);
    });
  });
  
  // Edit button (only for notes in specific profiles)
  document.querySelectorAll('.note-row .edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      editNote(id);
    });
  });
  
  // View button (for read-only mode in "All Profiles")
  document.querySelectorAll('.note-row .view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      viewNoteReadOnly(id);
    });
  });
  
  // Delete button
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      deleteNote(id);
    });
  });
  
  // Add tooltips
  document.querySelectorAll('.note-title, .note-preview').forEach(el => {
    if (el.scrollWidth > el.clientWidth) {
      el.setAttribute('title', el.textContent);
    }
  });
}

// ==================== SEARCH/FILTER ====================

function setupSearchFilter() {
  const searchInput = document.getElementById('globalSearch');
  const clearBtn = document.getElementById('clearSearch');
  
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();
    clearBtn.style.display = searchTerm ? 'flex' : 'none';
    filterContent(searchTerm);
  });
  
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    filterContent('');
    searchInput.focus();
  });
}

function filterContent(searchTerm) {
  const term = searchTerm.toLowerCase();
  
  // Enhanced search: includes name, notes, and tags
  document.querySelectorAll('.env-row').forEach(row => {
    const name = row.querySelector('.env-name')?.textContent.toLowerCase() || '';
    const hostname = row.querySelector('.env-hostname')?.textContent.toLowerCase() || '';
    const matches = name.includes(term) || hostname.includes(term);
    row.style.display = matches ? '' : 'none';
  });
  
  document.querySelectorAll('.shortcut-row').forEach(row => {
    const shortcutId = row.getAttribute('data-shortcut-id');
    const shortcut = shortcuts.find(s => s.id === shortcutId);
    
    if (shortcut) {
      const name = (shortcut.name || '').toLowerCase();
      const notes = (shortcut.notes || '').toLowerCase();
      const tags = shortcut.tags ? shortcut.tags.map(t => t.toLowerCase()).join(' ') : '';
      const matches = name.includes(term) || notes.includes(term) || tags.includes(term);
      row.style.display = matches ? '' : 'none';
    } else {
      row.style.display = 'none';
    }
  });
  
  document.querySelectorAll('.note-row').forEach(row => {
    const noteId = row.getAttribute('data-note-id');
    const note = notes.find(n => n.id === noteId);
    
    if (note) {
      const title = (note.title || '').toLowerCase();
      const content = (note.content || '').toLowerCase();
      const tags = note.tags ? note.tags.map(t => t.toLowerCase()).join(' ') : '';
      const matches = title.includes(term) || content.includes(term) || tags.includes(term);
      row.style.display = matches ? '' : 'none';
    } else {
      row.style.display = 'none';
    }
  });
}

/**
 * Filter all sections by clicking a tag
 * @param {string} tagName - The tag to filter by
 */
function filterByTag(tagName) {
  const searchInput = document.getElementById('globalSearch');
  const clearBtn = document.getElementById('clearSearch');
  
  // Update search input to show the tag being filtered
  searchInput.value = tagName;
  clearBtn.style.display = 'flex';
  
  // Use existing filterContent function to filter by tag
  filterContent(tagName);
  
  // Show toast notification
  const capitalizedTag = tagName.charAt(0).toUpperCase() + tagName.slice(1);
  showToast(`Filtering by: ${capitalizedTag}`, 'info');
}

// ==================== TAG RENDERING ====================

function renderTagBadges(tags) {
  if (!tags || tags.length === 0) return '';
  // Capitalize first letter of each tag for better readability
  return `<div class="tag-badges">${tags.map(tag => {
    const capitalized = tag.charAt(0).toUpperCase() + tag.slice(1);
    return `<span class="tag-badge clickable-tag" data-tag="${tag}" title="Click to filter by ${tag}">${capitalized}</span>`;
  }).join('')}</div>`;
}

// ==================== ACTIVE STATE HIGHLIGHTING ====================

function highlightActiveStates(currentURL) {
  document.querySelectorAll('.shortcut-row').forEach(row => {
    const url = row.getAttribute('data-url');
    const isActive = currentURL && url && currentURL.includes(url);
    row.classList.toggle('active-row', isActive);
  });
}

// ==================== NAVIGATION ====================

async function navigateToShortcut(url) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab && tab.id) {
      await chrome.tabs.update(tab.id, { url: url });
    } else {
      await chrome.tabs.create({ url: url });
    }
  } catch (error) {
    console.error('Navigation error:', error);
    showToast('Failed to navigate', 'error');
  }
}

async function switchEnvironment(targetHostname, targetType) {
  try {
    if (targetType === 'production' && settings.showConfirmationForProd) {
      const confirmed = confirm('⚠️ You are about to switch to PRODUCTION.\n\nAre you sure?');
      if (!confirmed) return;
    }
    
    // Update environment usage tracking
    const env = environments.find(e => e.hostname === targetHostname);
    if (env) {
      env.lastAccessed = Date.now();
      env.accessCount = (env.accessCount || 0) + 1;
      
      // Save updated tracking to storage
      const storageKey = `environments_${currentProfile}`;
      await chrome.storage.local.set({ [storageKey]: environments });
    }
    
    // Send message to background script
    const response = await chrome.runtime.sendMessage({
      action: 'switchEnvironment',
      targetHostname: targetHostname,
      preservePath: true
    });
    
    if (response.success) {
      showToast(`Switching to ${targetHostname}...`, 'success');
    } else {
      showToast('Failed to switch environment', 'error');
    }
  } catch (error) {
    console.error('Environment switch error:', error);
    showToast('Failed to switch environment', 'error');
  }
}

/**
 * Quick switch to environment by index (0-based)
 * Used by Cmd+Shift+1/2/3 keyboard shortcuts
 * @param {number} envIndex - Environment index (0 = first, 1 = second, 2 = third)
 */
async function quickSwitchToEnvironment(envIndex) {
  if (envIndex < 0 || envIndex >= environments.length) {
    showToast(`No environment at position ${envIndex + 1}`, 'warning');
    return;
  }
  
  const env = environments[envIndex];
  if (!env) {
    showToast(`No environment at position ${envIndex + 1}`, 'warning');
    return;
  }
  
  await switchEnvironment(env.hostname, env.type);
}

// ==================== CRUD - ENVIRONMENTS ====================

function openAddEnvironmentModal() {
  // Block opening modal in "All Profiles" mode
  if (currentProfile === 'profile-all') {
    showToast('Switch to a specific profile to add environments', 'warning');
    return;
  }
  
  const modal = document.getElementById('addEnvModal');
  
  if (currentPageData) {
    document.getElementById('envHostname').value = currentPageData.hostname || '';
    const envType = currentPageData.environment || 'production';
    document.getElementById('envType').value = envType;
    
    let suggestedName = ENV_LABELS[envType];
    if (currentPageData.datacenter && currentPageData.datacenter !== 'Unknown') {
      suggestedName += ` ${currentPageData.datacenter}`;
    }
    document.getElementById('envName').value = suggestedName.trim();
    
    // Set hostname type for company ID field visibility
    updateCompanyIdFieldVisibility(currentPageData.solutionType);
  }
  
  modal.classList.add('active');
}

function closeAddEnvironmentModal() {
  const modal = document.getElementById('addEnvModal');
  modal.classList.remove('active');
  modal.removeAttribute('data-edit-id');
  document.getElementById('addEnvForm').reset();
  document.querySelector('#addEnvModal .modal-header h3').textContent = 'Add Environment';
}

async function editEnvironment(id) {
  const env = environments.find(e => e.id === id);
  if (!env) return;
  
  document.getElementById('envName').value = env.name;
  document.getElementById('envType').value = env.type;
  document.getElementById('envHostname').value = env.hostname;
  document.getElementById('envNotes').value = env.notes || '';
  
  document.getElementById('addEnvModal').setAttribute('data-edit-id', id);
  document.querySelector('#addEnvModal .modal-header h3').textContent = 'Edit Environment';
  
  openAddEnvironmentModal();
}

async function deleteEnvironment(id) {
  // Block deletion in "All Profiles" mode
  if (currentProfile === 'profile-all') {
    showToast('Switch to a specific profile to delete environments', 'warning');
    return;
  }
  
  const env = environments.find(e => e.id === id);
  if (!env) return;
  
  const message = chrome.i18n.getMessage('confirmDeleteEnvironment').replace('{envName}', env.name);
  const confirmed = confirm(message);
  if (!confirmed) return;
  
  environments = environments.filter(e => e.id !== id);
  
  const storageKey = `environments_${currentProfile}`;
  await chrome.storage.local.set({ [storageKey]: environments });
  
  renderEnvironments();
  showToast('Environment deleted', 'success');
}

async function saveEnvironment() {
  // Block saving in "All Profiles" mode
  if (currentProfile === 'profile-all') {
    showToast('Switch to a specific profile to save environments', 'warning');
    return;
  }
  
  const name = document.getElementById('envName').value.trim();
  const type = document.getElementById('envType').value;
  let hostname = document.getElementById('envHostname').value.trim();
  
  // Validation 1: Required fields
  if (!name) {
    showToast('Environment name is required', 'warning');
    document.getElementById('envName').focus();
    return;
  }
  
  if (!hostname) {
    showToast('Hostname is required', 'warning');
    document.getElementById('envHostname').focus();
    return;
  }
  
  // Validation 2: Remove protocol if present
  hostname = hostname.replace(/^https?:\/\//, '');
  
  // Validation 3: Split hostname from path/params/hash for domain validation only
  let hostnameOnly = hostname.split('/')[0].split('?')[0].split('#')[0];
  
  // Validation 4: Check for valid hostname format (no spaces in hostname part)
  if (/\s/.test(hostnameOnly)) {
    showToast('Hostname cannot contain spaces', 'error');
    document.getElementById('envHostname').focus();
    return;
  }
  
  if (!/^[a-zA-Z0-9.-]+$/.test(hostnameOnly)) {
    showToast('Hostname contains invalid characters. Use only letters, numbers, dots, and hyphens', 'error');
    document.getElementById('envHostname').focus();
    return;
  }
  
  // Validation 5: Check for valid SAP domain (SuccessFactors, S/4HANA, BTP, IBP)
  const sapDomains = [
    'hr.cloud.sap', 'sapsf.com', 'sapsf.cn', 'sapcloud.cn',
    'successfactors.eu', 'sapsf.eu', 'successfactors.com',
    's4hana.ondemand.com', 's4hana.cloud.sap',
    'hana.ondemand.com', 'cfapps', 'build.cloud.sap',
    'ibp.cloud.sap', 'scmibp.ondemand.com', 'ibplanning'
  ];
  const isValidSAPHostname = sapDomains.some(domain => hostnameOnly.includes(domain));
  
  if (!isValidSAPHostname) {
    showToast('Must be a valid SAP hostname (SuccessFactors, S/4HANA, BTP, or IBP)', 'error');
    document.getElementById('envHostname').focus();
    return;
  }
  
  // Keep full hostname with path/params intact
  document.getElementById('envHostname').value = hostname;
  
  // Get notes field
  const notes = document.getElementById('envNotes').value.trim();
  
  // Build environment object
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
    if (editId) {
      environments = environments.filter(e => e.id !== editId);
      environments.push(envObject);
      showToast('Environment updated ✓', 'success');
      modal.removeAttribute('data-edit-id');
    } else {
      environments.push(envObject);
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

// ==================== CRUD - SHORTCUTS ====================

function openAddShortcutModal() {
  document.getElementById('addShortcutModal').classList.add('active');
}

function closeAddShortcutModal() {
  const modal = document.getElementById('addShortcutModal');
  modal.classList.remove('active');
  modal.removeAttribute('data-edit-id');
  document.getElementById('addShortcutForm').reset();
  document.querySelector('#addShortcutModal .modal-header h3').textContent = 'Add Shortcut';
}

function editShortcut(id) {
  const shortcut = shortcuts.find(s => s.id === id);
  
  if (!shortcut) {
    showToast('Shortcut not found. Try reloading the extension.', 'error');
    return;
  }
  
  // Get all form elements
  const nameEl = document.getElementById('shortcutName');
  const pathEl = document.getElementById('shortcutPath');
  const notesEl = document.getElementById('shortcutNotes');
  const iconEl = document.getElementById('shortcutIcon');
  const tagsEl = document.getElementById('shortcutTags');
  const modalEl = document.getElementById('addShortcutModal');
  const headerEl = document.querySelector('#addShortcutModal .modal-header h3');
  
  if (!nameEl || !pathEl || !modalEl) {
    showToast('Error: Form elements not found', 'error');
    return;
  }
  
  // Set values
  nameEl.value = shortcut.name;
  pathEl.value = shortcut.url;
  notesEl.value = shortcut.notes || '';
  iconEl.value = shortcut.icon || '8';
  tagsEl.value = shortcut.tags ? shortcut.tags.join(', ') : '';
  modalEl.setAttribute('data-edit-id', id);
  if (headerEl) headerEl.textContent = 'Edit Shortcut';
  
  openAddShortcutModal();
}

async function deleteShortcut(id) {
  // Block deletion in "All Profiles" mode
  if (currentProfile === 'profile-all') {
    showToast('Switch to a specific profile to delete shortcuts', 'warning');
    return;
  }
  
  const shortcut = shortcuts.find(s => s.id === id);
  if (!shortcut) return;
  
  const message = chrome.i18n.getMessage('confirmDeleteShortcut').replace('{shortcutName}', shortcut.name);
  const confirmed = confirm(message);
  if (!confirmed) return;
  
  shortcuts = shortcuts.filter(s => s.id !== id);
  await chrome.storage.local.set({ shortcuts });
  
  renderShortcuts();
  showToast('Shortcut deleted', 'success');
}

async function saveShortcut() {
  // Block saving in "All Profiles" mode
  if (currentProfile === 'profile-all') {
    showToast('Switch to a specific profile to save shortcuts', 'warning');
    return;
  }
  
  const name = document.getElementById('shortcutName').value.trim();
  const url = document.getElementById('shortcutPath').value.trim();
  const notes = document.getElementById('shortcutNotes').value.trim();
  const icon = document.getElementById('shortcutIcon').value || '8';
  const tagsInput = document.getElementById('shortcutTags').value.trim();
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
  
  if (!name || !url) {
    showToast('Please fill in required fields', 'warning');
    return;
  }
  
  // ONLY allow absolute URLs (external links)
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    showToast('URL must start with http:// or https:// (external links only)', 'warning');
    document.getElementById('shortcutPath').focus();
    return;
  }
  
  const modal = document.getElementById('addShortcutModal');
  const editId = modal.getAttribute('data-edit-id');
  
  if (editId) {
    // Remove the existing item and add updated version at the end
    shortcuts = shortcuts.filter(s => s.id !== editId);
    shortcuts.push({ id: editId, name, url, notes, icon, tags });
    showToast('Shortcut updated ✓', 'success');
    modal.removeAttribute('data-edit-id');
  } else {
    const newShortcut = { id: `shortcut-${Date.now()}`, name, url, notes, icon, tags };
    shortcuts.push(newShortcut);
    showToast('Shortcut saved ✓', 'success');
  }
  
  await chrome.storage.local.set({ shortcuts });
  renderShortcuts();
  closeAddShortcutModal();
}

async function addCurrentPageAsShortcut() {
  // Block adding in "All Profiles" mode
  if (currentProfile === 'profile-all') {
    showToast('Switch to a specific profile to add shortcuts', 'warning');
    return;
  }
  
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  
  if (!tab || !tab.url) {
    showToast('No active tab found', 'warning');
    return;
  }
  
  document.getElementById('shortcutName').value = tab.title.substring(0, 50);
  document.getElementById('shortcutPath').value = tab.url;
  document.getElementById('shortcutIcon').value = '8';
  
  openAddShortcutModal();
}

// ==================== CRUD - NOTES ====================

function openAddNoteModal() {
  // Block opening modal in "All Profiles" mode
  if (currentProfile === 'profile-all') {
    showToast('Switch to a specific profile to add notes', 'warning');
    return;
  }
  
  // Hide download button when creating new note
  const downloadBtn = document.getElementById('downloadNoteBtn');
  if (downloadBtn) downloadBtn.style.display = 'none';
  
  document.getElementById('addNoteModal').classList.add('active');
}

function closeAddNoteModal() {
  const modal = document.getElementById('addNoteModal');
  modal.classList.remove('active');
  modal.removeAttribute('data-edit-id');
  
  // Check if we were in read-only mode
  const wasReadOnly = modal.getAttribute('data-readonly-mode') === 'true';
  
  if (wasReadOnly) {
    // Restore normal mode - remove readonly attributes
    document.getElementById('noteTitle').removeAttribute('readonly');
    document.getElementById('noteContent').removeAttribute('readonly');
    document.getElementById('noteIcon').removeAttribute('disabled');
    document.getElementById('noteTags').removeAttribute('readonly');
    
    // Show action buttons again
    document.getElementById('saveNoteBtn').style.display = 'inline-flex';
    document.getElementById('prettifyNoteBtn').style.display = 'inline-flex';
    // Download button will be hidden by openAddNoteModal() for new notes
    
    // Clear read-only flag
    modal.removeAttribute('data-readonly-mode');
  }
  
  document.getElementById('addNoteForm').reset();
  document.querySelector('#addNoteModal .modal-header h3').textContent = 'Scratch Note';
}

function editNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  
  document.getElementById('noteTitle').value = note.title;
  document.getElementById('noteContent').value = note.content || '';
  document.getElementById('noteIcon').value = note.icon || '0';
  document.getElementById('noteTags').value = note.tags ? note.tags.join(', ') : '';
  document.getElementById('addNoteModal').setAttribute('data-edit-id', id);
  document.querySelector('#addNoteModal .modal-header h3').textContent = 'Edit Note';
  
  openAddNoteModal();
  
  // Show download button in edit mode (must be after openAddNoteModal)
  const downloadBtn = document.getElementById('downloadNoteBtn');
  if (downloadBtn) downloadBtn.style.display = 'inline-flex';
}

/**
 * View note in read-only mode (for "All Profiles" mode)
 * @param {string} id - The note ID to view
 */
function viewNoteReadOnly(id) {
  const note = notes.find(n => n.id === id);
  if (!note) {
    showToast('Note not found', 'error');
    return;
  }
  
  // Populate modal fields
  document.getElementById('noteTitle').value = note.title;
  document.getElementById('noteContent').value = note.content || '';
  document.getElementById('noteIcon').value = note.icon || '0';
  document.getElementById('noteTags').value = note.tags ? note.tags.join(', ') : '';
  
  // Change modal title
  document.querySelector('#addNoteModal .modal-header h3').textContent = 'View Note';
  
  // Set all inputs to readonly
  document.getElementById('noteTitle').setAttribute('readonly', true);
  document.getElementById('noteContent').setAttribute('readonly', true);
  document.getElementById('noteIcon').setAttribute('disabled', true);
  document.getElementById('noteTags').setAttribute('readonly', true);
  
  // Hide action buttons (Save, Format, Download)
  document.getElementById('saveNoteBtn').style.display = 'none';
  document.getElementById('prettifyNoteBtn').style.display = 'none';
  document.getElementById('downloadNoteBtn').style.display = 'none';
  
  // Open modal
  document.getElementById('addNoteModal').classList.add('active');
  
  // Store read-only state so we can restore normal mode when closing
  document.getElementById('addNoteModal').setAttribute('data-readonly-mode', 'true');
}

async function deleteNote(id) {
  // Block deletion in "All Profiles" mode
  if (currentProfile === 'profile-all') {
    showToast('Switch to a specific profile to delete notes', 'warning');
    return;
  }
  
  const note = notes.find(n => n.id === id);
  if (!note) return;
  
  const message = chrome.i18n.getMessage('confirmDeleteNote').replace('{noteTitle}', note.title);
  const confirmed = confirm(message);
  if (!confirmed) return;
  
  notes = notes.filter(n => n.id !== id);
  await chrome.storage.local.set({ notes });
  
  renderNotes();
  showToast('Note deleted', 'success');
}

async function saveNote() {
  // Block saving in "All Profiles" mode
  if (currentProfile === 'profile-all') {
    showToast('Switch to a specific profile to save notes', 'warning');
    return;
  }
  
  const title = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteContent').value.trim();
  const icon = document.getElementById('noteIcon').value || '0';
  const tagsInput = document.getElementById('noteTags').value.trim();
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
  
  if (!title) {
    showToast('Please enter a title', 'warning');
    return;
  }
  
  const modal = document.getElementById('addNoteModal');
  const editId = modal.getAttribute('data-edit-id');
  
  if (editId) {
    // Remove the existing item and add updated version at the end
    notes = notes.filter(n => n.id !== editId);
    notes.push({ id: editId, title, content, icon, tags, timestamp: Date.now() });
    showToast('Note updated ✓', 'success');
    modal.removeAttribute('data-edit-id');
  } else {
    const newNote = { id: `note-${Date.now()}`, title, content, icon, tags, timestamp: Date.now() };
    notes.push(newNote);
    showToast('Note saved ✓', 'success');
  }
  
  await chrome.storage.local.set({ notes });
  
  renderNotes();
  closeAddNoteModal();
}

async function copyNoteContent(id, btn) {
  // Block copying in "All Profiles" mode
  if (currentProfile === 'profile-all') {
    showToast('Switch to a specific profile to copy notes', 'warning');
    return;
  }
  
  const note = notes.find(n => n.id === id);
  if (!note) return;
  
  const contentToCopy = note.content || note.title;
  
  try {
    await navigator.clipboard.writeText(contentToCopy);
    
    // Add visual feedback - button turns green for 2 seconds
    if (btn) {
      btn.classList.add('copy-success');
      setTimeout(() => btn.classList.remove('copy-success'), 2000);
    }
    
    showToast('Note copied ✓', 'success');
  } catch (error) {
    console.error('Failed to copy note:', error);
    showToast('Failed to copy note', 'error');
  }
}

/**
 * Download note as a text file
 * @param {string} id - The note ID
 */
async function downloadNote(id) {
  // Block downloading in "All Profiles" mode
  if (currentProfile === 'profile-all') {
    showToast('Switch to a specific profile to download notes', 'warning');
    return;
  }
  
  const note = notes.find(n => n.id === id);
  if (!note) return;
  
  try {
    // Build file content with title and content
    const fileContent = `${note.title}\n${'='.repeat(note.title.length)}\n\n${note.content || ''}`;
    
    // Create blob and download
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Generate filename from note title (sanitized)
    const sanitizedTitle = note.title
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .substring(0, 50);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${sanitizedTitle}-${timestamp}.txt`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('Note downloaded ✓', 'success');
    
  } catch (error) {
    console.error('Failed to download note:', error);
    showToast('Failed to download note', 'error');
  }
}

/**
 * Prettify/format note content
 * Cleans up formatting, organizes sections, formats URLs
 */
function prettifyNote() {
  const contentInput = document.getElementById('noteContent');
  const counter = document.getElementById('noteContentCounter');
  
  if (!contentInput) {
    console.error('[Prettify] Content input not found');
    return;
  }
  
  let content = contentInput.value;
  if (!content.trim()) {
    showToast('No content to format', 'warning');
    return;
  }
  
  try {
    // 1. Normalize line endings
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // 2. Remove excessive blank lines (more than 2 consecutive)
    content = content.replace(/\n{3,}/g, '\n\n');
    
    // 3. Format section headers (lines ending with :)
    content = content.split('\n').map(line => {
      const trimmed = line.trim();
      // If line ends with : and is short (likely a header), add blank line after
      if (trimmed.endsWith(':') && trimmed.length < 50 && !trimmed.startsWith('http')) {
        return trimmed + '\n';
      }
      return line;
    }).join('\n');
    
    // 4. Format bullet lists - ensure consistent spacing
    content = content.replace(/^[\s]*[-*•]\s*/gm, '• ');
    
    // 5. Format URLs - ensure they're on their own lines (two-pass approach)
    // First pass: Identify URLs already on their own lines
    const urlsOnOwnLine = new Set();
    const lines = content.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (/^https?:\/\/[^\s]+$/.test(trimmed)) {
        urlsOnOwnLine.add(trimmed);
      }
    });
    
    // Second pass: Add newlines only to embedded URLs
    content = content.replace(/(https?:\/\/[^\s]+)/g, (match, url) => {
      // If URL is already on its own line, leave it unchanged
      if (urlsOnOwnLine.has(url)) return url;
      // Otherwise, wrap with newlines
      return `\n${url}\n`;
    });
    
    // 6. Format numbered lists
    content = content.replace(/^[\s]*(\d+)[.)]\s*/gm, '$1. ');
    
    // 7. Clean up spacing around sections
    content = content.replace(/\n{2,}(•|\d+\.)/g, '\n\n$1');
    
    // 8. Trim whitespace from each line while preserving structure
    content = content.split('\n').map(line => line.trimEnd()).join('\n');
    
    // 9. Final cleanup - trim start/end
    content = content.trim();
    
    // Update textarea
    contentInput.value = content;
    
    // Update character counter manually (simpler approach)
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
    
    showToast('Note formatted ✓', 'success');
    
  } catch (error) {
    console.error('[Prettify] Error:', error);
    showToast(`Format failed: ${error.message}`, 'error');
  }
}

/**
 * Setup character counter for note content with soft warning at 5000 chars
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

// ==================== DIAGNOSTICS ====================

async function showDiagnosticsModal() {
  // Block opening diagnostics when not on SAP system
  if (!currentPageData || !currentPageData.solutionType) {
    showToast('Navigate to an SAP system to view diagnostics', 'warning');
    return;
  }
  
  const modal = document.getElementById('diagnosticsModal');
  const contentDiv = document.getElementById('diagnosticsContent');
  
  modal.classList.add('active');
  contentDiv.innerHTML = `
    <div class="diagnostics-loading">
      <div class="spinner"></div>
      <span>Gathering diagnostics...</span>
    </div>
  `;
  
  try {
    // Refresh page data before gathering diagnostics to ensure latest state
    await loadCurrentPageData();
    
    const diagnostics = await gatherDiagnostics(currentPageData);
    const formatted = formatDiagnosticsReport(diagnostics);
    contentDiv.innerHTML = `<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">${formatted}</pre>`;
  } catch (error) {
    console.error('Failed to gather diagnostics:', error);
    contentDiv.innerHTML = `<p style="color: var(--env-production);">Failed to gather diagnostics. Please try again.</p>`;
  }
}

function closeDiagnosticsModal() {
  document.getElementById('diagnosticsModal').classList.remove('active');
}

async function copyAllDiagnostics() {
  try {
    // Refresh page data before copying diagnostics to ensure latest state
    await loadCurrentPageData();
    
    const diagnostics = await gatherDiagnostics(currentPageData);
    const formatted = formatDiagnosticsReport(diagnostics);
    await navigator.clipboard.writeText(formatted);
    showToast('Diagnostics copied to clipboard ✓', 'success');
  } catch (error) {
    console.error('Failed to copy diagnostics:', error);
    showToast('Failed to copy diagnostics', 'error');
  }
}

/**
 * Load popular OSS notes data from JSON file
 * @returns {Object} Popular notes data organized by solution
 */
async function loadPopularOssNotes() {
  if (popularOssNotes) return popularOssNotes;
  
  try {
    const response = await fetch(chrome.runtime.getURL('resources/popular-oss-notes.json'));
    popularOssNotes = await response.json();
    return popularOssNotes;
  } catch (error) {
    console.error('[Popular OSS Notes] Failed to load:', error);
    return null;
  }
}

/**
 * Get popular notes filtered by current profile
 * @returns {Array} Array of popular note objects
 */
async function getPopularNotesForProfile() {
  const data = await loadPopularOssNotes();
  if (!data) return [];
  
  // All Profiles: Show universal + top 2 from each solution
  if (currentProfile === 'profile-all') {
    const topFromEach = [
      ...(data.successfactors?.slice(0, 2) || []),
      ...(data.s4hana?.slice(0, 2) || []),
      ...(data.btp?.slice(0, 2) || [])
    ];
    return [...(data.universal || []), ...topFromEach];
  }
  
  // SuccessFactors: Show SF-specific + universal
  if (currentProfile === 'profile-successfactors') {
    return [...(data.successfactors || []), ...(data.universal || [])];
  }
  
  // S/4HANA: Show S/4-specific + universal
  if (currentProfile === 'profile-s4hana') {
    return [...(data.s4hana || []), ...(data.universal || [])];
  }
  
  // BTP: Show BTP-specific + universal
  if (currentProfile === 'profile-btp') {
    return [...(data.btp || []), ...(data.universal || [])];
  }
  
  // Default (Global, Executive, Custom): Show universal only
  return data.universal || [];
}

/**
 * Render popular notes buttons in the grid
 */
async function renderPopularNotes() {
  const grid = document.getElementById('popularNotesGrid');
  if (!grid) return;
  
  const popularNotes = await getPopularNotesForProfile();
  
  if (popularNotes.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 12px; color: var(--text-secondary); font-size: 11px;">No popular notes available</div>';
    return;
  }
  
  grid.innerHTML = popularNotes.map(note => `
    <button class="popular-note-btn" data-note-number="${note.number}" title="${note.description}">
      <div class="popular-note-number">#${note.number}</div>
      <div class="popular-note-title">${note.title}</div>
    </button>
  `).join('');
  
  // Attach click handlers
  grid.querySelectorAll('.popular-note-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const noteNumber = btn.getAttribute('data-note-number');
      await openPopularOssNote(noteNumber);
    });
  });
}

/**
 * Unified toggle pin function for environments, shortcuts, and notes
 * @param {string} id - The item ID
 * @param {string} type - The item type ('environment', 'shortcut', or 'note')
 */
async function togglePin(id, type = 'environment') {
  // Block pinning in "All Profiles" mode
  if (currentProfile === 'profile-all') {
    showToast('Switch to a specific profile to pin items', 'warning');
    return;
  }
  
  let item, collection, storageKey, renderFunction, itemLabel;
  
  if (type === 'environment') {
    item = environments.find(e => e.id === id);
    collection = environments;
    storageKey = `environments_${currentProfile}`;
    renderFunction = renderEnvironments;
    itemLabel = 'Environment';
  } else if (type === 'shortcut') {
    item = shortcuts.find(s => s.id === id);
    collection = shortcuts;
    storageKey = 'shortcuts';
    renderFunction = renderShortcuts;
    itemLabel = 'Shortcut';
  } else if (type === 'note') {
    item = notes.find(n => n.id === id);
    collection = notes;
    storageKey = 'notes';
    renderFunction = renderNotes;
    itemLabel = 'Note';
  } else {
    console.error('[Pin] Unknown type:', type);
    return;
  }
  
  if (!item) {
    console.error('[Pin] Item not found:', id, type);
    return;
  }
  
  // Toggle pinned state
  item.pinned = !item.pinned;
  
  // Save to storage
  await chrome.storage.local.set({ [storageKey]: collection });
  
  // Re-render to show updated pin state and resort
  renderFunction();
  
  const message = item.pinned ? `${itemLabel} pinned ⭐` : `${itemLabel} unpinned`;
  showToast(message, 'success');
}

/**
 * Toggle visibility of OSS Note search inline form
 * Also loads and renders popular notes when opening
 */
async function toggleOssNoteSearch() {
  const form = document.getElementById('ossNoteSearchForm');
  const input = document.getElementById('ossNoteInputInline');
  
  if (!form) return;
  
  const isVisible = form.style.display !== 'none';
  
  if (isVisible) {
    form.style.display = 'none';
  } else {
    form.style.display = 'block';
    
    // Load and render popular notes
    await renderPopularNotes();
    
    // Restore collapsed state from storage
    const result = await chrome.storage.local.get({ popularNotesCollapsed: false });
    const section = document.getElementById('popularNotesSection');
    if (section && result.popularNotesCollapsed) {
      section.classList.add('collapsed');
    }
    
    // Focus input when opening
    if (input) input.focus();
  }
}

/**
 * Validate and return OSS Note number from inline input
 * @returns {string|null} Validated note number or null if invalid
 */
function getValidatedOssNoteNumber() {
  const input = document.getElementById('ossNoteInputInline');
  if (!input) return null;
  
  let noteNumber = input.value.trim();
  
  // Remove any non-numeric characters
  noteNumber = noteNumber.replace(/\D/g, '');
  
  if (!noteNumber) {
    showToast('Please enter an OSS Note number', 'warning');
    input.focus();
    return null;
  }
  
  // Validate note number (typically 6-7 digits)
  if (noteNumber.length < 4) {
    showToast('OSS Note number too short (minimum 4 digits)', 'warning');
    input.focus();
    return null;
  }
  
  if (noteNumber.length > 10) {
    showToast('OSS Note number too long (maximum 10 digits)', 'warning');
    input.focus();
    return null;
  }
  
  return noteNumber;
}

/**
 * Open OSS Note in browser from inline search form
 */
async function openOssNoteInline() {
  const noteNumber = getValidatedOssNoteNumber();
  if (!noteNumber) return;
  
  try {
    const ossNoteUrl = `https://launchpad.support.sap.com/#/notes/${noteNumber}`;
    await chrome.tabs.create({ url: ossNoteUrl });
    showToast(`Opening OSS Note ${noteNumber} ✓`, 'success');
    
    // Clear input after successful open
    document.getElementById('ossNoteInputInline').value = '';
    
  } catch (error) {
    console.error('[OSS Note] Failed to open:', error);
    showToast('Failed to open OSS Note', 'error');
  }
}

/**
 * Copy OSS Note URL to clipboard
 */
async function copyOssNoteUrl() {
  const noteNumber = getValidatedOssNoteNumber();
  if (!noteNumber) return;
  
  try {
    const ossNoteUrl = `https://launchpad.support.sap.com/#/notes/${noteNumber}`;
    await navigator.clipboard.writeText(ossNoteUrl);
    showToast(chrome.i18n.getMessage('ossNoteCopied'), 'success');
    
    // Keep input value (don't clear) so user can still use it
    
  } catch (error) {
    console.error('[OSS Note] Failed to copy URL:', error);
    showToast('Failed to copy URL', 'error');
  }
}

/**
 * Add OSS Note as a shortcut
 * Opens the Add Shortcut modal pre-filled with OSS Note details
 */
async function addOssNoteAsShortcut() {
  const noteNumber = getValidatedOssNoteNumber();
  if (!noteNumber) return;
  
  // Block adding in "All Profiles" mode
  if (currentProfile === 'profile-all') {
    showToast('Switch to a specific profile to add shortcuts', 'warning');
    return;
  }
  
  try {
    const ossNoteUrl = `https://launchpad.support.sap.com/#/notes/${noteNumber}`;
    
    // Pre-fill Add Shortcut modal
    document.getElementById('shortcutName').value = `OSS Note ${noteNumber}`;
    document.getElementById('shortcutPath').value = ossNoteUrl;
    document.getElementById('shortcutNotes').value = 'SAP Support Launchpad';
    document.getElementById('shortcutIcon').value = 'document'; // Document icon
    document.getElementById('shortcutTags').value = 'oss-note, support';
    
    // Hide OSS search form
    document.getElementById('ossNoteSearchForm').style.display = 'none';
    
    // Open Add Shortcut modal
    openAddShortcutModal();
    
    showToast('Shortcut form pre-filled - review and save', 'success');
    
  } catch (error) {
    console.error('[OSS Note] Failed to create shortcut:', error);
    showToast('Failed to create shortcut', 'error');
  }
}

// ==================== SETTINGS ====================

function openSettingsModal() {
  document.getElementById('settingsModal').classList.add('active');
  // loadDisplayModeSetting() removed - side panel mode only
}

function closeSettingsModal() {
  document.getElementById('settingsModal').classList.remove('active');
}

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
          await createCustomProfile(profileId, data.profileName, data);
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
      await chrome.storage.local.set({ shortcuts });
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
      await chrome.storage.local.set({ notes });
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
  
  renderNotes();
    
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

/**
 * Create a new custom profile from imported data
 * @param {string} profileId - The ID for the custom profile (e.g., 'custom-sf-payroll-admins')
 * @param {string} profileName - Display name (e.g., 'SF Payroll Admins')
 * @param {Object} data - Imported JSON data containing shortcuts, environments, notes
 */
async function createCustomProfile(profileId, profileName, data) {
  try {
    // Load existing custom profiles
    const result = await chrome.storage.local.get('customProfiles');
    const customProfiles = result.customProfiles || {};
    
    // Create new custom profile
    customProfiles[profileId] = {
      id: profileId,
      name: profileName,
      type: 'custom',
      basedOn: data.basedOn || 'profile-global',
      created: new Date().toISOString(),
      shortcuts: data.shortcuts || [],
      environments: data.environments || [],
      notes: data.notes || []
    };
    
    // Save custom profiles to storage
    await chrome.storage.local.set({ customProfiles });
    
    // Save data to profile-specific storage keys
    await chrome.storage.local.set({
      shortcuts: data.shortcuts || [],
      [`environments_${profileId}`]: data.environments || [],
      notes: data.notes || []
    });
    
    // Add to available profiles list
    availableProfiles.push({
      id: profileId,
      name: profileName,
      type: 'custom',
      file: null
    });
    
    // Switch to new profile
    await switchProfile(profileId);
    
    showToast(`Created profile "${profileName}" ✓`, 'success');
    
  } catch (error) {
    console.error('Failed to create custom profile:', error);
    showToast('Failed to create profile', 'error');
  }
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

/**
 * Generate and download an empty template JSON file for import
 * Creates a template with empty arrays for shortcuts, environments, and notes
 */
async function downloadTemplate() {
  try {
    // Generate template structure
    const template = {
      version: '1.0',
      shortcuts: [],
      environments: [],
      notes: [],
      exportDate: new Date().toISOString()
    };
    
    const jsonStr = JSON.stringify(template, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sap-pro-toolkit-template.json';
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('Template downloaded ✓', 'success');
    
  } catch (error) {
    console.error('Template download failed:', error);
    showToast('Failed to download template', 'error');
  }
}

// ==================== DISPLAY MODE FUNCTIONS (DISABLED - SIDE PANEL ONLY) ====================
// These functions are commented out since the extension now operates in side panel mode only

/* 
async function loadDisplayModeSetting() {
  const result = await chrome.storage.local.get({ displayMode: 'sidepanel' });
  const mode = result.displayMode;
  
  const popupRadio = document.getElementById('displayModePopup');
  const sidePanelRadio = document.getElementById('displayModeSidePanel');
  
  if (popupRadio && sidePanelRadio) {
    if (mode === 'sidepanel') {
      sidePanelRadio.checked = true;
    } else {
      popupRadio.checked = true;
    }
  }
}

async function saveDisplayMode(mode) {
  await chrome.storage.local.set({ displayMode: mode });
  showToast(`Display mode will change after reloading extension`, 'success');
}
*/

// ==================== COLLAPSIBLE SECTIONS ====================

/**
 * Initialize collapsible sections with persistence
 * Loads saved states and sets up toggle handlers
 */
async function initializeCollapsibleSections() {
  // FORCE RESET: Clear any old collapsed states and default to expanded
  const sectionStates = {
    environments: true,  // true = expanded
    shortcuts: true,
    notes: true
  };
  
  // Save the reset states
  await chrome.storage.local.set({ sectionStates });
  
  // Apply expanded state to all sections
  document.querySelectorAll('.section').forEach(section => {
    const sectionId = section.getAttribute('data-section');
    if (sectionId) {
      // Force remove collapsed class - all sections should be expanded
      section.classList.remove('collapsed');
    }
  });
  
  // Setup toggle button handlers
  document.querySelectorAll('.section-toggle-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const sectionId = btn.getAttribute('data-section');
      await toggleSection(sectionId);
    });
  });
  
  // Update section count badges
  updateSectionCounts();
}

/**
 * Toggle a section's collapsed state
 * @param {string} sectionId - The section ID (environments, shortcuts, notes)
 */
async function toggleSection(sectionId) {
  const section = document.querySelector(`.section[data-section="${sectionId}"]`);
  if (!section) return;
  
  const isCurrentlyCollapsed = section.classList.contains('collapsed');
  const newState = !isCurrentlyCollapsed; // true = expanded
  
  // Toggle visual state
  section.classList.toggle('collapsed');
  
  // Save state to storage
  const result = await chrome.storage.local.get('sectionStates');
  const sectionStates = result.sectionStates || {};
  sectionStates[sectionId] = newState;
  await chrome.storage.local.set({ sectionStates });
}

/**
 * Update section count badges to show number of items
 */
function updateSectionCounts() {
  // Update environments count
  const envCount = document.querySelector('.section[data-section="environments"] .section-count');
  if (envCount) {
    const count = environments.length;
    envCount.textContent = count > 0 ? `(${count})` : '';
  }
  
  // Update shortcuts count
  const shortcutsCount = document.querySelector('.section[data-section="shortcuts"] .section-count');
  if (shortcutsCount) {
    const count = shortcuts.length;
    shortcutsCount.textContent = count > 0 ? `(${count})` : '';
  }
  
  // Update notes count
  const notesCount = document.querySelector('.section[data-section="notes"] .section-count');
  if (notesCount) {
    const count = notes.length;
    notesCount.textContent = count > 0 ? `(${count})` : '';
  }
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
  setupSearchFilter();
  
  // Tag filtering - click any tag to filter all sections
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('clickable-tag')) {
      e.stopPropagation(); // Prevent row click from firing
      const tag = e.target.getAttribute('data-tag');
      filterByTag(tag);
    }
  });
  
  // Global click handler to close all dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.kebab-btn') && !e.target.closest('.dropdown-menu')) {
      document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('active'));
    }
  });
  
  document.getElementById('helpBtn')?.addEventListener('click', () => {
    document.getElementById('helpModal').classList.add('active');
  });
  document.getElementById('closeHelpModal')?.addEventListener('click', () => {
    document.getElementById('helpModal').classList.remove('active');
  });
  document.getElementById('closeHelpBtn')?.addEventListener('click', () => {
    document.getElementById('helpModal').classList.remove('active');
  });
  
  document.getElementById('addEnvBtn')?.addEventListener('click', openAddEnvironmentModal);
  document.getElementById('closeAddEnvModal')?.addEventListener('click', closeAddEnvironmentModal);
  document.getElementById('cancelAddEnvBtn')?.addEventListener('click', closeAddEnvironmentModal);
  document.getElementById('saveEnvBtn')?.addEventListener('click', saveEnvironment);
  
  document.getElementById('addShortcutBtn')?.addEventListener('click', addCurrentPageAsShortcut);
  document.getElementById('closeAddShortcutModal')?.addEventListener('click', closeAddShortcutModal);
  document.getElementById('cancelAddShortcutBtn')?.addEventListener('click', closeAddShortcutModal);
  document.getElementById('saveShortcutBtn')?.addEventListener('click', saveShortcut);
  
  // Auto-suggestion for shortcut icons
  setupShortcutIconAutoSuggestion();
  
  document.getElementById('addNoteBtn')?.addEventListener('click', openAddNoteModal);
  document.getElementById('closeAddNoteModal')?.addEventListener('click', closeAddNoteModal);
  document.getElementById('saveNoteBtn')?.addEventListener('click', saveNote);
  document.getElementById('prettifyNoteBtn')?.addEventListener('click', prettifyNote);
  document.getElementById('downloadNoteBtn')?.addEventListener('click', () => {
    const modal = document.getElementById('addNoteModal');
    const editId = modal.getAttribute('data-edit-id');
    if (editId) {
      downloadNote(editId);
    }
  });
  
  // Auto-suggestion for note icons
  setupNoteIconAutoSuggestion();
  
  // Setup character counter for notes
  setupNoteCharacterCounter();
  
  document.getElementById('copyDiagnosticsBtn')?.addEventListener('click', showDiagnosticsModal);
  document.getElementById('closeDiagnosticsModal')?.addEventListener('click', closeDiagnosticsModal);
  document.getElementById('closeDiagnosticsBtn')?.addEventListener('click', closeDiagnosticsModal);
  document.getElementById('copyAllDiagnosticsBtn')?.addEventListener('click', copyAllDiagnostics);
  
  // OSS Note search (inline form in Notes section)
  document.getElementById('ossNoteBtn')?.addEventListener('click', async () => {
    await toggleOssNoteSearch();
  });
  document.getElementById('closeOssSearchBtn')?.addEventListener('click', () => {
    document.getElementById('ossNoteSearchForm').style.display = 'none';
  });
  document.getElementById('openOssNoteInlineBtn')?.addEventListener('click', openOssNoteInline);
  document.getElementById('copyOssUrlBtn')?.addEventListener('click', copyOssNoteUrl);
  document.getElementById('addOssShortcutBtn')?.addEventListener('click', addOssNoteAsShortcut);
  document.getElementById('ossNoteInputInline')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      openOssNoteInline();
    }
  });
  
  // Popular notes toggle
  document.getElementById('togglePopularNotes')?.addEventListener('click', togglePopularNotes);
  
  document.getElementById('settingsBtn')?.addEventListener('click', openSettingsModal);
  document.getElementById('closeSettingsModal')?.addEventListener('click', closeSettingsModal);
  document.getElementById('closeSettingsBtn')?.addEventListener('click', closeSettingsModal);
  
  document.getElementById('importJsonBtn')?.addEventListener('click', importJsonFromFile);
  document.getElementById('exportJsonBtn')?.addEventListener('click', exportJsonToFile);
  document.getElementById('downloadTemplateLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    downloadTemplate();
  });
  document.getElementById('importFileInput')?.addEventListener('change', handleFileImport);
  
  // Display mode event listeners removed - extension operates in side panel mode only
  
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });
  
  // Footer button handlers
  document.getElementById('footerSettingsBtn')?.addEventListener('click', openSettingsModal);
  document.getElementById('footerDiagnosticsBtn')?.addEventListener('click', showDiagnosticsModal);
  document.getElementById('footerThemeBtn')?.addEventListener('click', toggleTheme);
  
  // Profile switcher handlers
  document.getElementById('profileDropdownBtn')?.addEventListener('click', toggleProfileMenu);
  
  // Close profile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-switcher')) {
      document.getElementById('profileMenu')?.classList.remove('active');
    }
  });
}

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
  // Start with system profiles
  availableProfiles = [
    { id: 'profile-all', name: 'All Profiles', icon: '🌍', description: 'View everything across all profiles', file: null, type: 'system' },
    { id: 'profile-global', name: 'Global', icon: '⚡', description: 'Core SAP utilities for everyone', file: 'profile-global.json', type: 'system' },
    { id: 'profile-successfactors', name: 'SuccessFactors', icon: '👥', description: 'HR/HCM consultants & admins', file: 'profile-successfactors.json', type: 'system' },
    { id: 'profile-s4hana', name: 'S/4HANA', icon: '🏭', description: 'Clean Core & functional architects', file: 'profile-s4hana.json', type: 'system' },
    { id: 'profile-btp', name: 'BTP & Integration', icon: '🔧', description: 'Developers & technical architects', file: 'profile-btp.json', type: 'system' },
    { id: 'profile-executive', name: 'Executive & Sales', icon: '👔', description: 'CIOs, CTOs, presales engineers', file: 'profile-executive.json', type: 'system' },
    { id: 'profile-golive', name: 'Go-Live & Cutover', icon: '🚀', description: 'S/4HANA implementation go-live events and cutover activities', file: 'profile-golive.json', type: 'system' }
  ];
  
  // Load custom profiles from storage
  const result = await chrome.storage.local.get('customProfiles');
  const customProfiles = result.customProfiles || {};
  
  // Add custom profiles to available profiles list
  for (const profileId in customProfiles) {
    const profile = customProfiles[profileId];
    availableProfiles.push({
      id: profile.id,
      name: profile.name,
      type: 'custom',
      file: null
    });
  }
  
  renderProfileMenu();
}

/**
 * Load the active profile from storage
 * Defaults to profile-global if no profile is set
 */
async function loadActiveProfile() {
  const result = await chrome.storage.local.get({ 
    activeProfile: 'profile-global'
  });
  currentProfile = result.activeProfile;
  
  // Update UI to show current profile
  const profile = availableProfiles.find(p => p.id === currentProfile);
  if (profile) {
    document.getElementById('currentProfileName').textContent = profile.name;
  }
  
  // Update read-only banner visibility
  updateReadOnlyBanner();
  
  // Check for new content in profile
  await checkForNewContent();
}

/**
 * Check if profile JSON has new content since last viewed
 * Shows toast notification and blue dot badge for 7 days
 */
async function checkForNewContent() {
  try {
    const profileData = await loadProfileData(currentProfile);
    if (!profileData.contentVersion && !profileData.lastUpdated) return;
    
    // Get last viewed content version for this profile
    const storageKey = `profileViewed_${currentProfile}`;
    const result = await chrome.storage.local.get(storageKey);
    const lastViewedVersion = result[storageKey];
    
    const currentVersion = profileData.contentVersion || profileData.lastUpdated;
    
    // Check if content is new
    if (lastViewedVersion !== currentVersion) {
      // Calculate days since update
      let daysSinceUpdate = 0;
      if (profileData.lastUpdated) {
        const updateDate = new Date(profileData.lastUpdated);
        const now = new Date();
        daysSinceUpdate = Math.floor((now - updateDate) / (1000 * 60 * 60 * 24));
      }
      
      // Show notification if updated within last 7 days
      if (daysSinceUpdate <= 7) {
        const profile = availableProfiles.find(p => p.id === currentProfile);
        const message = `📋 ${profile?.name || 'Profile'} has new content!`;
        
        showToast(message, 'info', 5000, async () => {
          // Mark as viewed when clicked
          await chrome.storage.local.set({ [storageKey]: currentVersion });
          await displayProfileUpdateDate();
        });
        
        // Add blue dot badge to profile button (handled in displayProfileUpdateDate)
      }
    }
    
  } catch (error) {
    console.error('[New Content Check] Failed:', error);
  }
}

/**
 * Update read-only banner visibility based on current profile
 * Shows banner when in "All Profiles" mode, hides it otherwise
 */
function updateReadOnlyBanner() {
  const banner = document.getElementById('readonlyBanner');
  if (!banner) return;
  
  const isReadOnly = currentProfile === 'profile-all';
  banner.style.display = isReadOnly ? 'flex' : 'none';
}

function renderProfileMenu() {
  const menu = document.getElementById('profileMenu');
  if (!menu) return;
  
  menu.innerHTML = availableProfiles.map(profile => {
    const isActive = profile.id === currentProfile;
    const icon = profile.icon || '📁';
    const description = profile.description || '';
    
    return `
      <button class="profile-menu-item ${isActive ? 'active' : ''}" data-profile-id="${profile.id}">
        <span class="profile-icon">${icon}</span>
        <div class="profile-info">
          <div class="profile-name">${profile.name}</div>
          ${description ? `<div class="profile-desc">${description}</div>` : ''}
        </div>
        ${isActive ? '<svg class="profile-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
      </button>
    `;
  }).join('');
  
  // Attach click handlers
  menu.querySelectorAll('.profile-menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const profileId = item.getAttribute('data-profile-id');
      switchProfile(profileId);
    });
  });
}

function toggleProfileMenu() {
  const menu = document.getElementById('profileMenu');
  if (!menu) return;
  
  const isActive = menu.classList.contains('active');
  menu.classList.toggle('active', !isActive);
}

async function switchProfile(profileId) {
  if (profileId === currentProfile) {
    document.getElementById('profileMenu')?.classList.remove('active');
    return;
  }
  
  const profile = availableProfiles.find(p => p.id === profileId);
  if (!profile) {
    showToast('Profile not found', 'error');
    return;
  }
  
  try {
    // Save active profile to storage
    await chrome.storage.local.set({ activeProfile: profileId });
    currentProfile = profileId;
    
    // Update UI display
    document.getElementById('currentProfileName').textContent = profile.name;
    
    // Update read-only banner visibility
    updateReadOnlyBanner();
    
    // Reload data (loadShortcuts, loadEnvironments, loadNotes handle "All Profiles" logic)
    await loadShortcuts();
    await loadEnvironments();
    await loadNotes();
    
    renderProfileMenu();
    document.getElementById('profileMenu')?.classList.remove('active');
    
    showToast(`Switched to ${profile.name}`, 'success');
    
  } catch (error) {
    console.error('Failed to switch profile:', error);
    showToast('Failed to switch profile', 'error');
  }
}

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

// ==================== ICON AUTO-SUGGESTION ====================

/**
 * Setup auto-suggestion for shortcut icons with 500ms debounce
 * Monitors name, notes, and tags fields for keywords and suggests appropriate icons
 */
function setupShortcutIconAutoSuggestion() {
  const nameInput = document.getElementById('shortcutName');
  const notesInput = document.getElementById('shortcutNotes');
  const tagsInput = document.getElementById('shortcutTags');
  const iconSelect = document.getElementById('shortcutIcon');
  const suggestionEl = document.getElementById('iconSuggestion');
  const suggestedNameEl = document.getElementById('suggestedShortcutIconName');
  const acceptBtn = document.getElementById('acceptShortcutSuggestion');
  
  if (!nameInput || !iconSelect || !suggestionEl) return;
  
  let currentSuggestion = null;
  let debounceTimer = null;
  
  function updateSuggestion() {
    const name = nameInput.value.trim();
    const notes = notesInput?.value.trim() || '';
    const tags = tagsInput?.value.trim() || '';
    
    // Only suggest if there's content and library is available
    if (!name || typeof window.SAPIconLibrary === 'undefined') {
      suggestionEl.style.display = 'none';
      return;
    }
    
    // Get suggestion from library
    const suggestedIconId = window.SAPIconLibrary.suggestIcon(name, notes, tags, 'shortcut');
    
    if (suggestedIconId && suggestedIconId !== iconSelect.value) {
      const icon = window.SAPIconLibrary.getIconByValue(suggestedIconId, 'shortcut');
      currentSuggestion = suggestedIconId;
      suggestedNameEl.textContent = `${icon.emoji} ${icon.label}`;
      suggestionEl.style.display = 'block';
    } else {
      suggestionEl.style.display = 'none';
    }
  }
  
  function debouncedUpdateSuggestion() {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set new timer for 500ms
    debounceTimer = setTimeout(() => {
      updateSuggestion();
    }, 500);
  }
  
  // Accept suggestion handler
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      if (currentSuggestion) {
        iconSelect.value = currentSuggestion;
        suggestionEl.style.display = 'none';
      }
    });
  }
  
  // Attach event listeners with debounce
  nameInput.addEventListener('input', debouncedUpdateSuggestion);
  if (notesInput) notesInput.addEventListener('input', debouncedUpdateSuggestion);
  if (tagsInput) tagsInput.addEventListener('input', debouncedUpdateSuggestion);
  
  // Hide suggestion when icon is manually changed
  iconSelect.addEventListener('change', () => {
    suggestionEl.style.display = 'none';
  });
}

// ==================== WORLD CLOCK & CONTENT DATE ====================

/**
 * Default timezone configuration for world clock
 * Represents 3 key SAP regions: Americas, Europe, Asia-Pacific
 */
const DEFAULT_TIMEZONES = [
  { id: 'america', name: 'EST', timezone: 'America/New_York', flag: '🇺🇸' },
  { id: 'europe', name: 'CET', timezone: 'Europe/Berlin', flag: '🇩🇪' },
  { id: 'asia', name: 'IST', timezone: 'Asia/Kolkata', flag: '🇮🇳' }
];

let worldClockInterval = null;

/**
 * Initialize world clock on page load
 * Loads timezone preferences from storage (defaults to EST, CET, IST)
 * Renders initial state and starts 1-minute update interval
 */
async function initializeWorldClock() {
  try {
    // Load timezone preferences (future: allow user customization)
    const result = await chrome.storage.local.get({ worldClockTimezones: DEFAULT_TIMEZONES });
    const timezones = result.worldClockTimezones;
    
    // Render initial clock state
    updateWorldClock(timezones);
    
    // Start 1-minute update interval
    worldClockInterval = setInterval(() => {
      updateWorldClock(timezones);
    }, 60000); // Update every 60 seconds
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      if (worldClockInterval) {
        clearInterval(worldClockInterval);
      }
    });
    
    console.log('[World Clock] Initialized with timezones:', timezones.map(tz => tz.name).join(', '));
    
  } catch (error) {
    console.error('[World Clock] Initialization failed:', error);
  }
}

/**
 * Update world clock display with current times in all configured timezones
 * @param {Array} timezones - Array of timezone configuration objects
 */
function updateWorldClock(timezones = DEFAULT_TIMEZONES) {
  const clockDiv = document.getElementById('worldClock');
  if (!clockDiv) return;
  
  try {
    const now = new Date();
    const timeStrings = timezones.map(tz => {
      // Format time for timezone
      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: tz.timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      // Get timezone abbreviation (EST, CET, IST)
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz.timezone,
        timeZoneName: 'short'
      });
      const parts = formatter.formatToParts(now);
      const tzAbbr = parts.find(part => part.type === 'timeZoneName')?.value || tz.name;
      
      return `<span class="timezone-item" title="${tz.timezone}">
        <span class="timezone-flag">${tz.flag}</span>
        <span class="timezone-abbr">${tzAbbr}</span>
        <span class="timezone-time">${timeStr}</span>
      </span>`;
    });
    
    clockDiv.innerHTML = timeStrings.join('');
    
  } catch (error) {
    console.error('[World Clock] Update failed:', error);
    clockDiv.innerHTML = '<span style="font-size: 9px; opacity: 0.5;">Clock error</span>';
  }
}

/**
 * Display profile content update date from current profile JSON
 * Reads lastUpdated or contentVersion field and displays in footer
 */
async function displayProfileUpdateDate() {
  const dateSpan = document.getElementById('profileUpdateDate');
  if (!dateSpan) return;
  
  try {
    // Load current profile data to get lastUpdated field
    const profileData = await loadProfileData(currentProfile);
    
    if (profileData.lastUpdated) {
      // Parse date and format as "Updated: Mon DD"
      const date = new Date(profileData.lastUpdated);
      const formatted = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      dateSpan.textContent = `Profile: ${formatted}`;
      dateSpan.setAttribute('title', `Last updated: ${date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`);
    } else if (profileData.contentVersion) {
      // Fallback to contentVersion (e.g., "2026-Q1")
      dateSpan.textContent = `Profile: ${profileData.contentVersion}`;
      dateSpan.setAttribute('title', `Content version: ${profileData.contentVersion}`);
    } else {
      // No date information available
      dateSpan.textContent = '';
    }
    
  } catch (error) {
    console.error('[Profile Date] Failed to load update date:', error);
    dateSpan.textContent = '';
  }
}


/**
 * Setup auto-suggestion for note icons with 500ms debounce
 * Monitors title, content, and tags fields for keywords and suggests appropriate icons
 */
function setupNoteIconAutoSuggestion() {
  const titleInput = document.getElementById('noteTitle');
  const contentInput = document.getElementById('noteContent');
  const tagsInput = document.getElementById('noteTags');
  const iconSelect = document.getElementById('noteIcon');
  const suggestionEl = document.getElementById('noteIconSuggestion');
  const suggestedNameEl = document.getElementById('suggestedNoteIconName');
  const acceptBtn = document.getElementById('acceptNoteSuggestion');
  
  if (!titleInput || !iconSelect || !suggestionEl) return;
  
  let currentSuggestion = null;
  let debounceTimer = null;
  
  function updateSuggestion() {
    const title = titleInput.value.trim();
    const content = contentInput?.value.trim() || '';
    const tags = tagsInput?.value.trim() || '';
    
    // Only suggest if there's content and library is available
    if (!title || typeof window.SAPIconLibrary === 'undefined') {
      suggestionEl.style.display = 'none';
      return;
    }
    
    // Get suggestion from library (use title as name, content as notes)
    const suggestedIconId = window.SAPIconLibrary.suggestIcon(title, content, tags, 'note');
    
    if (suggestedIconId && suggestedIconId !== iconSelect.value) {
      const icon = window.SAPIconLibrary.getIconByValue(suggestedIconId, 'note');
      currentSuggestion = suggestedIconId;
      suggestedNameEl.textContent = `${icon.emoji} ${icon.label}`;
      suggestionEl.style.display = 'block';
    } else {
      suggestionEl.style.display = 'none';
    }
  }
  
  function debouncedUpdateSuggestion() {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set new timer for 500ms
    debounceTimer = setTimeout(() => {
      updateSuggestion();
    }, 500);
  }
  
  // Accept suggestion handler
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      if (currentSuggestion) {
        iconSelect.value = currentSuggestion;
        suggestionEl.style.display = 'none';
      }
    });
  }
  
  // Attach event listeners with debounce
  titleInput.addEventListener('input', debouncedUpdateSuggestion);
  if (contentInput) contentInput.addEventListener('input', debouncedUpdateSuggestion);
  if (tagsInput) tagsInput.addEventListener('input', debouncedUpdateSuggestion);
  
  // Hide suggestion when icon is manually changed
  iconSelect.addEventListener('change', () => {
    suggestionEl.style.display = 'none';
  });
}
