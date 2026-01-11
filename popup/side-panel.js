// SF Pro Toolkit - Side Panel Edition
// Enhanced with Starter Pack Import System
// Uses shared toolkit-core.js for common functionality

// ==================== STATE ====================

let currentPageData = null;
let shortcuts = [];
let environments = [];
let notes = [];
let settings = { showConfirmationForProd: true };
let availableProfiles = [];
let currentProfile = 'profile-default';

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
      addNote: openAddNoteModal,
      filterContent: filterContent
    });
    
    updatePlatformSpecificUI();
    
    // Listen for tab changes to update UI
    chrome.tabs.onActivated.addListener(async () => {
      console.log('[Tab Change] Active tab changed, reloading page data...');
      await loadCurrentPageData();
    });
    
    // Listen for URL changes within the same tab
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete') {
        console.log('[Tab Update] Tab URL updated, reloading page data...');
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
          console.log(`[Environments] Loading ${result[storageKey].length} environments from ${p.name}`);
          allEnvironments.push(...result[storageKey].map(e => ({ ...e, _source: p.name })));
        }
      }
    }
    
    // Remove duplicates
    environments = removeDuplicates(allEnvironments, 'hostname');
    console.log('[Environments] All Profiles mode - total unique environments:', environments.length);
    renderEnvironments();
    return;
  }
  
  // Load from current profile (profile-specific storage)
  const storageKey = `environments_${currentProfile}`;
  const result = await chrome.storage.local.get(storageKey);
  
  if (result[storageKey] && Array.isArray(result[storageKey]) && result[storageKey].length > 0) {
    console.log('[Environments] Loaded from profile storage:', result[storageKey].length, 'environments for profile:', currentProfile);
    environments = result[storageKey];
  } else {
    // Load default environments from current profile file
    console.log('[Environments] No environments in profile storage, loading from profile file...');
    try {
      const profileData = await loadProfileData(currentProfile);
      
      if (profileData.environments && Array.isArray(profileData.environments)) {
        environments = profileData.environments;
        await chrome.storage.local.set({ [storageKey]: environments });
        console.log('[Environments] Saved default environments to profile storage');
      } else {
        environments = [];
      }
    } catch (error) {
      console.error('[Environments] Failed to load default environments:', error);
      environments = [];
    }
  }
  
  console.log('[Environments] Final count:', environments.length, 'for profile:', currentProfile);
  renderEnvironments();
}

/**
 * Load notes from local storage
 * Notes are stored globally (not profile-specific)
 */
async function loadNotes() {
  const result = await chrome.storage.local.get('notes');
  notes = result.notes || [];
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
  console.log('[Profile] Loading profile:', profileId);
  
  // Special case: "All Profiles" handled separately
  if (profileId === 'profile-all') {
    return { globalShortcuts: [], solutions: [], environments: [] };
  }
  
  try {
    // Step 1: Always load Global base layer first
    const globalResponse = await fetch(chrome.runtime.getURL('resources/profile-global.json'));
    const globalData = await globalResponse.json();
    console.log('[Profile] Loaded Global base layer');
    
    // Step 2: If loading Global profile itself, return it
    if (profileId === 'profile-global') {
      return globalData;
    }
    
    // Step 3: Load profile-specific data
    const profile = availableProfiles.find(p => p.id === profileId);
    if (!profile || !profile.file) {
      console.warn('[Profile] No profile file for:', profileId);
      return globalData; // Return just Global
    }
    
    const profileResponse = await fetch(chrome.runtime.getURL(`resources/${profile.file}`));
    const profileData = await profileResponse.json();
    console.log('[Profile] Loaded profile-specific data:', profileId);
    
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
    
    console.log('[Profile] Merged data - shortcuts:', merged.globalShortcuts.length, 'environments:', merged.environments.length);
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
  
  if (environments.length === 0) {
    tbody.innerHTML = `
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
  
  // Sort: Active environment first, then others
  const sortedEnvs = [...environments].sort((a, b) => {
    const aIsActive = currentHostname && currentHostname === a.hostname;
    const bIsActive = currentHostname && currentHostname === b.hostname;
    if (aIsActive) return -1;
    if (bIsActive) return 1;
    return 0;
  });
  
  // Load Quick Actions for the solution type (independent of profile)
  let quickActions = [];
  if (solutionType) {
    // For SF environments, always load from successfactors profile
    const targetProfile = solutionType === 'successfactors' ? 'profile-successfactors' : currentProfile;
    
    const profileData = await loadProfileData(targetProfile);
    console.log('[Quick Actions] Profile data loaded:', profileData);
    console.log('[Quick Actions] Looking for solution type:', solutionType);
    
    const solution = profileData.solutions?.find(s => s.id === solutionType);
    console.log('[Quick Actions] Found solution:', solution);
    
    if (solution && solution.quickActions) {
      quickActions = solution.quickActions.slice(0, 5);
      console.log('[Quick Actions] Loaded actions:', quickActions);
    } else {
      console.log('[Quick Actions] No quick actions found for solution type:', solutionType);
    }
  } else {
    console.log('[Quick Actions] No solution type detected');
  }
  
  tbody.innerHTML = sortedEnvs.map(env => {
    const emoji = ENV_EMOJIS[env.type];
    const isActive = currentHostname && currentHostname === env.hostname;
    
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
    
    // Build Quick Actions badges HTML (only for active environment)
    let quickActionsBadgesHTML = '';
    if (isActive && quickActions.length > 0) {
      quickActionsBadgesHTML = `
        <div class="quick-action-badges">
          ${quickActions.map(action => `
            <span class="quick-action-badge" data-action-id="${action.id}" data-action-path="${action.path}">
              <span class="quick-action-icon">⚡</span>${action.name}
            </span>
          `).join('')}
        </div>
      `;
    }
    
    const hasQuickActions = isActive && quickActions.length > 0;
    
    // Build line 2: Priority is notes (for ALL envs) > metadata (for active env only)
    let line2HTML = '';
    if (env.notes) {
      // Show notes for ALL environments (active or not)
      line2HTML = `<div class="env-notes">${env.notes}</div>`;
    } else if (isActive && metaLine) {
      // Show metadata only for active environment if no notes
      line2HTML = `<div class="env-hostname">${metaLine}</div>`;
    }
    
    // Check if we're in "All Profiles" mode (read-only)
    const isReadOnly = currentProfile === 'profile-all';
    const disabledClass = isReadOnly ? 'btn-disabled' : '';
    const editTitle = isReadOnly ? 'Switch to a specific profile to edit' : 'Edit';
    const deleteTitle = isReadOnly ? 'Switch to a specific profile to delete' : 'Delete';
    
    return `
      <tr class="env-row ${env.type}-env ${isActive ? 'active-row active-env-card' : ''}" data-env-id="${env.id}">
        <td class="env-name-cell" colspan="${hasQuickActions ? '2' : '1'}">
          <div class="env-name">
            <span class="status-dot ${env.type} ${isActive ? 'active' : ''}"></span>
            ${env.name}
          </div>
          ${line2HTML}
          ${quickActionsBadgesHTML}
        </td>
        ${!hasQuickActions ? `
        <td class="env-actions-cell">
          <div class="table-actions">
            ${!isActive ? `
              <button class="icon-btn primary switch-btn" data-hostname="${env.hostname}" data-type="${env.type}" title="Switch to this environment">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
              </button>
            ` : ''}
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
        ` : ''}
      </tr>
      ${hasQuickActions ? `
      <tr class="env-row env-quick-actions-row ${env.type}-env active-env-card" data-env-id="${env.id}-actions">
        <td colspan="2" class="env-actions-cell" style="text-align: right; padding: 8px 12px;">
          <div class="table-actions">
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
      ` : ''}
    `;
  }).join('');
  
  attachEnvironmentListeners();
  attachQuickActionBadgeHandlers(quickActions);
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

// ==================== UI RENDERING - SHORTCUTS ====================

function renderShortcuts() {
  console.log('[DEBUG] renderShortcuts() called');
  console.log('[DEBUG] shortcuts.length:', shortcuts.length);
  console.log('[DEBUG] shortcuts:', shortcuts);
  
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
  
  // Check if we're in "All Profiles" mode (read-only)
  const isReadOnly = currentProfile === 'profile-all';
  const disabledClass = isReadOnly ? 'btn-disabled' : '';
  const editTitle = isReadOnly ? 'Switch to a specific profile to edit' : 'Edit';
  const deleteTitle = isReadOnly ? 'Switch to a specific profile to delete' : 'Delete';
  
  tbody.innerHTML = shortcuts.map(shortcut => {
    const displayIcon = getIcon(shortcut.icon, SHORTCUT_ICONS, 8);
    const tagBadgesHTML = renderTagBadges(shortcut.tags);
    
    return `
      <tr class="shortcut-row" data-shortcut-id="${shortcut.id}" data-url="${shortcut.url}">
        <td class="shortcut-icon-cell">
          <span class="shortcut-icon">${displayIcon}</span>
        </td>
        <td class="shortcut-name-cell">
          <div class="shortcut-name">
            ${shortcut.name}
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
}

function attachShortcutListeners() {
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
  
  document.querySelectorAll('.shortcut-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.icon-btn')) return;
      const url = row.getAttribute('data-url');
      const builtUrl = buildShortcutUrl({ url }, currentPageData);
      if (builtUrl) {
        navigateToShortcut(builtUrl);
      } else {
        showToast('Cannot navigate: No active SF instance detected', 'warning');
      }
    });
  });
  
  // Edit button
  document.querySelectorAll('.edit-btn').forEach(btn => {
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
  
  // Check if we're in "All Profiles" mode (read-only)
  const isReadOnly = currentProfile === 'profile-all';
  const disabledClass = isReadOnly ? 'btn-disabled' : '';
  const copyTitle = isReadOnly ? 'Switch to a specific profile to copy' : 'Copy note content';
  const editTitle = isReadOnly ? 'Switch to a specific profile to edit' : 'Edit';
  const deleteTitle = isReadOnly ? 'Switch to a specific profile to delete' : 'Delete';
  
  tbody.innerHTML = notes.map(note => {
    const contentPreview = note.content 
      ? (note.content.length > 60 ? note.content.substring(0, 60) + '...' : note.content)
      : '';
    const displayIcon = getIcon(note.icon, NOTE_ICONS, 0);
    const tagBadgesHTML = renderTagBadges(note.tags);
    
    return `
      <tr class="note-row" data-note-id="${note.id}">
        <td class="note-icon-cell">
          <span class="note-icon">${displayIcon}</span>
        </td>
        <td class="note-content-cell">
          <div class="note-title">${note.title}</div>
          ${contentPreview ? `<div class="note-preview">${contentPreview}</div>` : ''}
          ${tagBadgesHTML}
        </td>
        <td class="note-actions-cell">
          <div class="table-actions">
            <button class="icon-btn primary copy-btn ${disabledClass}" data-id="${note.id}" title="${copyTitle}" tabindex="0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
            <button class="icon-btn edit-btn ${disabledClass}" data-id="${note.id}" title="${editTitle}" tabindex="0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
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
}

function attachNoteListeners() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      await copyNoteContent(id, btn);
    });
  });
  
  // Edit button
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      editNote(id);
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

// ==================== TAG RENDERING ====================

function renderTagBadges(tags) {
  if (!tags || tags.length === 0) return '';
  // Capitalize first letter of each tag for better readability
  return `<div class="tag-badges">${tags.map(tag => {
    const capitalized = tag.charAt(0).toUpperCase() + tag.slice(1);
    return `<span class="tag-badge">${capitalized}</span>`;
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
    
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    
    let newURL;
    if (tab && isSFPage(tab.url)) {
      const currentURL = new URL(tab.url);
      newURL = currentURL.href.replace(currentURL.hostname, targetHostname);
    } else {
      newURL = `https://${targetHostname}/`;
    }
    
    await chrome.tabs.update(tab.id, { url: newURL });
    showToast(`Switching to ${targetHostname}...`, 'success');
  } catch (error) {
    console.error('Environment switch error:', error);
    showToast('Failed to switch environment', 'error');
  }
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

function editEnvironment(id) {
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
  
  const confirmed = confirm(`Delete environment "${env.name}"?`);
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
  
  // Validation 3: Split hostname from path/params for domain validation only
  const [hostnameOnly] = hostname.split('/')[0].split('?');
  
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
    // SuccessFactors
    'hr.cloud.sap', 'sapsf.com', 'sapsf.cn', 'sapcloud.cn',
    'successfactors.eu', 'sapsf.eu', 'successfactors.com',
    // S/4HANA
    's4hana.ondemand.com', 's4hana.cloud.sap',
    // BTP
    'hana.ondemand.com', 'cfapps', 'build.cloud.sap',
    // IBP
    'ibp.cloud.sap'
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
  
  // Save environment
  const modal = document.getElementById('addEnvModal');
  const editId = modal.getAttribute('data-edit-id');
  
  try {
    if (editId) {
      environments = environments.filter(e => e.id !== editId);
      environments.unshift({ id: editId, name, type, hostname, notes });
      showToast('Environment updated ✓', 'success');
      modal.removeAttribute('data-edit-id');
    } else {
      const newEnv = { id: `env-${Date.now()}`, name, type, hostname, notes };
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
  console.log('[DEBUG] editShortcut called with id:', id);
  console.log('[DEBUG] shortcuts array:', shortcuts);
  console.log('[DEBUG] shortcuts length:', shortcuts.length);
  console.log('[DEBUG] shortcuts IDs:', shortcuts.map(s => s.id));
  
  const shortcut = shortcuts.find(s => s.id === id);
  console.log('[DEBUG] Found shortcut:', shortcut);
  
  if (!shortcut) {
    console.error('[DEBUG] Shortcut not found for id:', id);
    console.error('[DEBUG] All shortcuts:', JSON.stringify(shortcuts, null, 2));
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
  
  console.log('[DEBUG] Form elements found:', {
    nameEl: !!nameEl,
    pathEl: !!pathEl,
    notesEl: !!notesEl,
    iconEl: !!iconEl,
    tagsEl: !!tagsEl,
    modalEl: !!modalEl,
    headerEl: !!headerEl
  });
  
  if (!nameEl || !pathEl || !modalEl) {
    console.error('[DEBUG] Critical form elements missing!');
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
  
  console.log('[DEBUG] Opening modal...');
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
  
  const confirmed = confirm(`Delete shortcut "${shortcut.name}"?`);
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
    // Remove the existing item and add updated version at the top
    shortcuts = shortcuts.filter(s => s.id !== editId);
    shortcuts.unshift({ id: editId, name, url, notes, icon, tags });
    showToast('Shortcut updated ✓', 'success');
    modal.removeAttribute('data-edit-id');
  } else {
    const newShortcut = { id: `shortcut-${Date.now()}`, name, url, notes, icon, tags };
    shortcuts.unshift(newShortcut);
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
  
  document.getElementById('addNoteModal').classList.add('active');
}

function closeAddNoteModal() {
  const modal = document.getElementById('addNoteModal');
  modal.classList.remove('active');
  modal.removeAttribute('data-edit-id');
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
}

async function deleteNote(id) {
  // Block deletion in "All Profiles" mode
  if (currentProfile === 'profile-all') {
    showToast('Switch to a specific profile to delete notes', 'warning');
    return;
  }
  
  const note = notes.find(n => n.id === id);
  if (!note) return;
  
  const confirmed = confirm(`Delete note "${note.title}"?`);
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
    // Remove the existing item and add updated version at the top
    notes = notes.filter(n => n.id !== editId);
    notes.unshift({ id: editId, title, content, icon, tags, timestamp: Date.now() });
    showToast('Note updated ✓', 'success');
    modal.removeAttribute('data-edit-id');
  } else {
    const newNote = { id: `note-${Date.now()}`, title, content, icon, tags, timestamp: Date.now() };
    notes.unshift(newNote);
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
    
    let importCount = 0;
    
    if (data.shortcuts && Array.isArray(data.shortcuts)) {
      const newShortcuts = data.shortcuts.filter(imported => 
        !shortcuts.some(existing => existing.url === imported.url)
      );
      shortcuts = [...newShortcuts, ...shortcuts];
      await chrome.storage.local.set({ shortcuts });
      importCount += newShortcuts.length;
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
    }
    
    if (data.notes && Array.isArray(data.notes)) {
      const newNotes = data.notes.filter(imported =>
        !notes.some(existing => existing.title === imported.title)
      );
      notes = [...newNotes, ...notes];
      await chrome.storage.local.set({ notes });
      importCount += newNotes.length;
    }
    
    renderShortcuts();
    renderEnvironments();
    renderNotes();
    
    if (importCount === 0) {
      showToast('No new items to import (all items already exist)', 'warning');
    } else {
      showToast(`Import successful! Added ${importCount} new item(s) ✓`, 'success');
    }
    
  } catch (error) {
    console.error('Import failed:', error);
    showToast(`Import failed: ${error.message}`, 'error');
  }
  
  event.target.value = '';
}

async function exportJsonToFile() {
  try {
    const exportData = {
      version: '1.0',
      shortcuts: shortcuts,
      environments: environments,
      notes: notes,
      exportDate: new Date().toISOString()
    };
    
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `sap-pro-toolkit-${timestamp}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('Configuration exported ✓', 'success');
    
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

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
  setupSearchFilter();
  
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
  
  document.getElementById('addNoteBtn')?.addEventListener('click', openAddNoteModal);
  document.getElementById('closeAddNoteModal')?.addEventListener('click', closeAddNoteModal);
  document.getElementById('cancelAddNoteBtn')?.addEventListener('click', closeAddNoteModal);
  document.getElementById('saveNoteBtn')?.addEventListener('click', saveNote);
  
  document.getElementById('copyDiagnosticsBtn')?.addEventListener('click', showDiagnosticsModal);
  document.getElementById('closeDiagnosticsModal')?.addEventListener('click', closeDiagnosticsModal);
  document.getElementById('closeDiagnosticsBtn')?.addEventListener('click', closeDiagnosticsModal);
  document.getElementById('copyAllDiagnosticsBtn')?.addEventListener('click', copyAllDiagnostics);
  
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
  // Available profiles with Global as base layer
  availableProfiles = [
    { id: 'profile-all', name: 'All Profiles', file: null }, // Special "All" option
    { id: 'profile-global', name: 'Global', file: 'profile-global.json' }, // Base layer
    { id: 'profile-successfactors', name: 'SuccessFactors', file: 'profile-successfactors.json' }
  ];
  
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
  
  console.log('[Profile] Loaded active profile:', currentProfile);
}

function renderProfileMenu() {
  const menu = document.getElementById('profileMenu');
  if (!menu) return;
  
  menu.innerHTML = availableProfiles.map(profile => {
    const isActive = profile.id === currentProfile;
    return `
      <button class="profile-menu-item ${isActive ? 'active' : ''}" data-profile-id="${profile.id}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        ${profile.name}
        ${isActive ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
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
    // Handle "All Profiles" - load Global once, then all other profiles
    if (profileId === 'profile-all') {
      // Step 1: Load Global base layer once
      const globalResponse = await fetch(chrome.runtime.getURL('resources/profile-global.json'));
      const globalData = await globalResponse.json();
      let allShortcuts = [...(globalData.globalShortcuts || [])];
      
      // Step 2: Load shortcuts from other profiles (excluding Global)
      for (const p of availableProfiles) {
        if (p.file && p.id !== 'profile-global') {
          try {
            const response = await fetch(chrome.runtime.getURL(`resources/${p.file}`));
            const data = await response.json();
            if (data.globalShortcuts || data.shortcuts) {
              const shortcuts = data.globalShortcuts || data.shortcuts;
              allShortcuts.push(...shortcuts.map(s => ({ ...s, _source: p.name })));
            }
          } catch (err) {
            console.warn(`Failed to load shortcuts from ${p.name}:`, err);
          }
        }
      }
      shortcuts = removeDuplicates(allShortcuts, 'url');
      
      // Step 3: Load environments from all profile storage keys (user-modified data)
      let allEnvironments = [];
      for (const p of availableProfiles) {
        if (p.file) {
          const storageKey = `environments_${p.id}`;
          const result = await chrome.storage.local.get(storageKey);
          if (result[storageKey] && Array.isArray(result[storageKey])) {
            allEnvironments.push(...result[storageKey].map(e => ({ ...e, _source: p.name })));
          }
        }
      }
      environments = removeDuplicates(allEnvironments, 'hostname');
      
      // Step 4: Load notes from storage (user-created notes)
      const storageResult = await chrome.storage.local.get('notes');
      notes = storageResult.notes || [];
      
    } else {
      // Load profile data with Global base layer merged in
      const profileData = await loadProfileData(profileId);
      
      // Update state
      shortcuts = profileData.globalShortcuts || [];
      environments = profileData.environments || [];
      
      // Load notes from storage (user-created notes) for individual profiles
      const storageResult = await chrome.storage.local.get('notes');
      notes = storageResult.notes || [];
    }
    
    // Save to storage with profile-specific key for environments
    const storageKey = `environments_${profileId}`;
    await chrome.storage.local.set({ 
      shortcuts,
      [storageKey]: environments,
      notes,
      activeProfile: profileId
    });
    
    currentProfile = profileId;
    
    // Update UI
    document.getElementById('currentProfileName').textContent = profile.name;
    renderShortcuts();
    renderEnvironments();
    renderNotes();
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
