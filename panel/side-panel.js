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

/**
 * Load shortcuts from profile-specific storage
 * On first run for a profile, loads template shortcuts from that profile's JSON file
 * Shortcuts are stored per-profile (like environments and notes)
 */
async function loadShortcuts() {
  const storageKey = `shortcuts_${currentProfile}`;
  const initKey = `shortcutsInitialized_${currentProfile}`;
  
  const result = await chrome.storage.local.get([storageKey, initKey]);
  shortcuts = result[storageKey] || [];
  
  // On first run for this profile, load template shortcuts from profile JSON
  if (!result[initKey] && shortcuts.length === 0) {
    try {
      const profileData = await loadProfileData(currentProfile);
      
      if (profileData.globalShortcuts || profileData.shortcuts) {
        shortcuts = [...(profileData.globalShortcuts || profileData.shortcuts || [])];
        
        // Save to profile-specific storage and mark as initialized
        await chrome.storage.local.set({ 
          [storageKey]: shortcuts,
          [initKey]: true 
        });
      }
    } catch (error) {
      console.error(`[Shortcuts] Failed to load template shortcuts for ${currentProfile}:`, error);
    }
  }
  
  console.log(`[Shortcuts] Loaded ${shortcuts.length} shortcuts for profile: ${currentProfile}`);
  renderShortcuts();
}

async function loadEnvironments() {
  // Load for the specific profile
  const storageKey = `environments_${currentProfile}`;
  const result = await chrome.storage.local.get(storageKey);

  if (result[storageKey] && Array.isArray(result[storageKey])) {
    environments = result[storageKey];
  } else {
    const profileData = await loadProfileData(currentProfile);
    environments = profileData.environments || [];
    await chrome.storage.local.set({ [storageKey]: environments });
  }
  renderEnvironments();
}

/**
 * Load notes from profile-specific storage
 * On first run for a profile, loads template notes from that profile's JSON file
 * Notes are stored per-profile (like environments)
 */
async function loadNotes() {
  const storageKey = `notes_${currentProfile}`;
  const initKey = `notesInitialized_${currentProfile}`;
  
  const result = await chrome.storage.local.get([storageKey, initKey]);
  notes = result[storageKey] || [];
  
  // On first run for this profile, load template notes from profile JSON
  if (!result[initKey] && notes.length === 0) {
    try {
      const profileData = await loadProfileData(currentProfile);
      
      if (profileData.notes && Array.isArray(profileData.notes) && profileData.notes.length > 0) {
        notes = [...profileData.notes]; // Use template notes from this profile
        
        // Save to profile-specific storage and mark as initialized
        await chrome.storage.local.set({ 
          [storageKey]: notes,
          [initKey]: true 
        });
      }
    } catch (error) {
      console.error(`[Notes] Failed to load template notes for ${currentProfile}:`, error);
    }
  }
  
  console.log(`[Notes] Loaded ${notes.length} notes for profile: ${currentProfile}`);
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
  
  // Don't suggest if already on recommended profile
  if (currentProfile === recommendedProfile) return;
  
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
 * Loads the data for a single, specified profile from its JSON file.
 * This function does NOT merge with the global profile.
 * @param {string} profileId - The profile ID to load.
 * @returns {Object} The data for the specified profile.
 */
async function loadProfileData(profileId) {
  if (!profileId) {
    return { globalShortcuts: [], solutions: [], environments: [] };
  }

  try {
    const profile = availableProfiles.find(p => p.id === profileId);
    if (!profile || !profile.file) {
      // For custom profiles without a file or if profile not found
      return { globalShortcuts: [], solutions: [], environments: [] };
    }

    const profileResponse = await fetch(chrome.runtime.getURL(`resources/${profile.file}`));
    if (!profileResponse.ok) {
      throw new Error(`HTTP error! status: ${profileResponse.status}`);
    }
    const profileData = await profileResponse.json();
    return profileData;

  } catch (error) {
    console.error(`[Profile] Failed to load profile data for ${profileId}:`, error);
    return { globalShortcuts: [], solutions: [], environments: [] };
  }
}

// ==================== UI RENDERING - ENVIRONMENTS ====================

async function renderEnvironments() {
  const tbody = document.getElementById('environmentList');
  
  // Remove any existing Quick Actions banner first
  const section = document.querySelector('.section[data-section="environments"]');
  if (section) {
    const existingBanner = section.querySelector('.quick-actions-banner');
    if (existingBanner) existingBanner.remove();
  }
  
  // Detect current SAP system and load Quick Actions from ALL profiles
  // Quick Actions will be rendered ABOVE the section (not inside tbody)
  if (currentPageData && currentPageData.solutionType) {
    const solutionType = currentPageData.solutionType;
    
    // Aggregate Quick Actions from ALL profiles (not just current profile)
    let allQuickActions = [];
    
    for (const profile of availableProfiles) {
      // Check for custom solutions in storage first
      const storageKey = `solutions_${profile.id}`;
      const solutionsResult = await chrome.storage.local.get(storageKey);
      let solutionsData = solutionsResult[storageKey];
      
      // If no custom solutions, load from profile file
      if (!solutionsData && profile.file) {
        const profileData = await loadProfileData(profile.id);
        solutionsData = profileData.solutions;
      }
      
      // Find matching solution for current solutionType
      const solution = solutionsData?.find(s => s.id === solutionType);
      if (solution && solution.quickActions) {
        allQuickActions.push(...solution.quickActions);
      }
    }
    
    // Remove duplicates by action ID (in case multiple profiles define same action)
    allQuickActions = removeDuplicates(allQuickActions, 'id');
    
    // Use combined Quick Actions
    const solution = allQuickActions.length > 0 ? { quickActions: allQuickActions } : null;
    
    if (solution && solution.quickActions && solution.quickActions.length > 0) {
      const quickActions = solution.quickActions.slice(0, 5);
      const solutionLabel = solution.name || solutionType.toUpperCase();
      
      // Render as standalone div ABOVE the table (not inside tbody)
      quickActionsHTML = `
        <div class="quick-actions-banner" style="margin-bottom: 12px; padding: 12px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.12) 100%); border-left: 3px solid var(--env-preview); border-radius: 6px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.5px; color: var(--env-preview); text-transform: uppercase;">⚡ ${solutionLabel} Quick Actions</span>
          </div>
          <div class="quick-action-badges">
            ${quickActions.map(action => `
              <span class="quick-action-badge" data-action-id="${action.id}" data-action-path="${action.path}">
                <span class="quick-action-icon">⚡</span>${action.name}
              </span>
            `).join('')}
          </div>
        </div>
      `;
      
      // Render Quick Actions ABOVE section-header
      if (section) {
        // Insert at the very top of the section
        section.insertAdjacentHTML('afterbegin', quickActionsHTML);
        
        // Attach handlers
        attachQuickActionBadgeHandlers(quickActions);
      }
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
  
  // Render environments (Quick Actions already rendered above section-header)
  tbody.innerHTML = sortedEnvs.map(env => {
    const isActive = currentHostname && currentHostname === env.hostname;
    
    // Color-coded borders for environment types
    const envTypeColors = {
      production: '#EF4444',  // Red
      preview: '#10B981',     // Green
      sales: '#F59E0B',       // Orange
      sandbox: '#A855F7'      // Purple
    };
    const borderColor = envTypeColors[env.type] || '#D9D9D9';
    
    // Render environment icon using SVG renderer
    const theme = document.body.getAttribute('data-theme') || 'light';
    const iconHTML = window.SVGRenderer.renderEnvironmentIcon(env.type, 18, theme);
    
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
    
    
    return `
      <tr class="env-row ${env.type}-env ${isActive ? 'active-row active-env-card' : ''}" data-env-id="${env.id}" style="border-left: 4px solid ${borderColor};">
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
            <button class="icon-btn edit-btn" data-id="${env.id}" title="Edit" tabindex="0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="icon-btn danger delete-btn" data-id="${env.id}" title="Delete" tabindex="0">
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
  updateSectionCounts();
}

function attachQuickActionBadgeHandlers(quickActions) {
  document.querySelectorAll('.quick-action-badge').forEach(badge => {
    badge.addEventListener('click', async (e) => {
      e.stopPropagation();
      const actionId = badge.getAttribute('data-action-id');
      const actionPath = badge.getAttribute('data-action-path');
      
      // Use the path directly from the badge's data attribute
      // This way we don't need to search through profiles
      const action = { id: actionId, path: actionPath };
      
      try {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (!tab) return;
        
        // Build URL with all parameters preserved
        const targetUrl = buildQuickActionUrl(action, currentPageData, tab.url);
        
        console.log('[Quick Action] Navigating to:', actionId);
        console.log('[Quick Action] Target URL:', targetUrl);
        
        await chrome.tabs.update(tab.id, { url: targetUrl });
        showToast(`Navigating to ${badge.textContent.trim()}...`, 'success');
        
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
  
  // Edit button (environment-specific)
  document.querySelectorAll('.env-row .edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      console.log('[Edit Environment] Button clicked, ID:', id);
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
            <button class="icon-btn edit-btn" data-id="${shortcut.id}" title="Edit" tabindex="0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="icon-btn danger delete-btn" data-id="${shortcut.id}" title="Delete" tabindex="0">
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
  
  tbody.innerHTML = sortedNotes.map(note => {
    const contentPreview = note.content 
      ? (note.content.length > 60 ? note.content.substring(0, 60) + '...' : note.content)
      : '';
    const displayIcon = renderSAPIcon(note.icon, 'note', 16);
    const tagBadgesHTML = renderTagBadges(note.tags);
    
    const firstButtonHTML = `<button class="icon-btn primary edit-btn" data-id="${note.id}" title="Edit" tabindex="0">
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
            <button class="icon-btn copy-btn" data-id="${note.id}" title="Copy note content" tabindex="0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
            <button class="icon-btn danger delete-btn" data-id="${note.id}" title="Delete" tabindex="0">
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
  
  // Edit button
  document.querySelectorAll('.note-row .edit-btn').forEach(btn => {
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
 * IMPORTANT: Uses DISPLAYED order (pinned first, then active, then others)
 * NOT storage array order - this matches what user sees on screen
 * @param {number} envIndex - Environment index (0 = first, 1 = second, 2 = third)
 */
async function quickSwitchToEnvironment(envIndex) {
  if (environments.length === 0) {
    showToast('No environments saved', 'warning');
    return;
  }
  
  // Sort environments in SAME order as renderEnvironments() display
  // This ensures keyboard shortcuts target what user SEES, not storage order
  let currentHostname = null;
  if (currentPageData) {
    currentHostname = currentPageData.hostname;
  }
  
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
  
  // Now use sorted array for keyboard shortcuts
  if (envIndex < 0 || envIndex >= sortedEnvs.length) {
    showToast(`No environment at position ${envIndex + 1}`, 'warning');
    return;
  }
  
  const env = sortedEnvs[envIndex];
  if (!env) {
    showToast(`No environment at position ${envIndex + 1}`, 'warning');
    return;
  }
  
  await switchEnvironment(env.hostname, env.type);
}

// ==================== CRUD - ENVIRONMENTS ====================

function openAddEnvironmentModal() {
  const modal = document.getElementById('addEnvModal');
  
  // Populate form with current page data
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
  
  // Populate form fields
  document.getElementById('envName').value = env.name;
  document.getElementById('envType').value = env.type;
  document.getElementById('envHostname').value = env.hostname;
  document.getElementById('envNotes').value = env.notes || '';
  
  // Set edit mode
  const modal = document.getElementById('addEnvModal');
  modal.setAttribute('data-edit-id', id);
  document.querySelector('#addEnvModal .modal-header h3').textContent = 'Edit Environment';
  
  // Open modal directly (bypass profile check since we're editing existing)
  modal.classList.add('active');
}

async function deleteEnvironment(id) {
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
  const shortcut = shortcuts.find(s => s.id === id);
  if (!shortcut) return;
  
  const message = chrome.i18n.getMessage('confirmDeleteShortcut').replace('{shortcutName}', shortcut.name);
  const confirmed = confirm(message);
  if (!confirmed) return;
  
  shortcuts = shortcuts.filter(s => s.id !== id);
  
  // Save to profile-specific storage
  const storageKey = `shortcuts_${currentProfile}`;
  await chrome.storage.local.set({ [storageKey]: shortcuts });
  
  renderShortcuts();
  showToast('Shortcut deleted', 'success');
}

async function saveShortcut() {
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
  
  // Save to profile-specific storage
  const storageKey = `shortcuts_${currentProfile}`;
  await chrome.storage.local.set({ [storageKey]: shortcuts });
  
  renderShortcuts();
  closeAddShortcutModal();
}

async function addCurrentPageAsShortcut() {
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


async function deleteNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  
  const message = chrome.i18n.getMessage('confirmDeleteNote').replace('{noteTitle}', note.title);
  const confirmed = confirm(message);
  if (!confirmed) return;
  
  notes = notes.filter(n => n.id !== id);
  
  // Save to profile-specific storage
  const storageKey = `notes_${currentProfile}`;
  await chrome.storage.local.set({ [storageKey]: notes });
  
  renderNotes();
  showToast('Note deleted', 'success');
}

async function saveNote() {
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
  
  // Save to profile-specific storage
  const storageKey = `notes_${currentProfile}`;
  await chrome.storage.local.set({ [storageKey]: notes });
  
  renderNotes();
  closeAddNoteModal();
}

async function copyNoteContent(id, btn) {
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
 * Render Quick Actions as editable text fields (SIMPLIFIED)
 * Both name AND path are editable
 * No onclick handlers - uses event delegation instead
 */
async function renderQuickActionsBySection(profileId) {
  const listContainer = document.getElementById('qaEditableList');
  if (!listContainer) return;
  
  try {
    const storageKey = `solutions_${profileId}`;
    const result = await chrome.storage.local.get(storageKey);
    let solutionsData = result[storageKey];
    
    if (!solutionsData) {
      const profileData = await loadProfileData(profileId);
      solutionsData = JSON.parse(JSON.stringify(profileData.solutions || []));
    }
    
    if (!solutionsData || solutionsData.length === 0) {
      listContainer.innerHTML = '<div class="empty-state" style="padding: 24px; text-align: center; color: var(--text-secondary);">No Quick Actions configured</div>';
      return;
    }
    
    // Render as simple editable list with BOTH name and path editable
    listContainer.innerHTML = solutionsData.map(solution => {
      const quickActions = solution.quickActions || [];
      
      return `
        <div class="qa-solution-group" style="margin-bottom: 24px;">
          <h4 style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px;">
            ${solution.name || solution.id} (${quickActions.length})
          </h4>
          ${quickActions.length === 0 ? 
            '<div style="padding: 12px; color: var(--text-secondary); font-size: 11px;">No Quick Actions</div>' :
            quickActions.map(qa => `
              <div class="qa-edit-row" data-qa-id="${qa.id}" data-solution-id="${solution.id}" style="margin-bottom: 12px;">
                <label style="display: block; font-size: 10px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Name:</label>
                <input 
                  type="text" 
                  class="qa-name-input" 
                  value="${qa.name}" 
                  data-original-name="${qa.name}"
                  style="width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: 4px; font-size: 12px; background: var(--bg-primary); color: var(--text-primary); margin-bottom: 8px;"
                >
                <label style="display: block; font-size: 10px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Path:</label>
                <input 
                  type="text" 
                  class="qa-path-input" 
                  value="${qa.path}" 
                  data-original-path="${qa.path}"
                  style="width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: 4px; font-size: 11px; background: var(--bg-primary); color: var(--text-primary); font-family: 'SF Mono', monospace;"
                >
              </div>
            `).join('')
          }
        </div>
      `;
    }).join('');
    
    // No-op, event listeners removed for explicit save button
    
  } catch (error) {
    console.error('[Quick Actions Tab] Failed to load:', error);
    listContainer.innerHTML = '<div class="empty-state" style="padding: 24px; text-align: center; color: var(--env-production);">Failed to load</div>';
  }
}

/**
 * Prettify note content - format with consistent spacing and structure
 */
async function prettifyNote() {
  const contentInput = document.getElementById('noteContent');
  const counter = document.getElementById('noteContentCounter');
  
  if (!contentInput) return;
  
  try {
    let content = contentInput.value;
    
    // 1. Normalize line endings
    content = content.replace(/\r\n/g, '\n');
    
    // 2. Remove excessive blank lines (max 2 consecutive)
    content = content.replace(/\n{3,}/g, '\n\n');
    
    // 3. Format key-value pairs
    content = content.split('\n').map(line => {
      // Format "Key: value" or "Key - value" patterns
      if (/^[^:]+:\s*.+/.test(line)) {
        return line.replace(/^([^:]+):\s*(.+)$/, '$1: $2');
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
 * Toggle popular notes section collapsed state
 */
async function togglePopularNotes() {
  const section = document.getElementById('popularNotesSection');
  const btn = document.getElementById('togglePopularNotes');
  
  if (!section || !btn) return;
  
  const isCollapsed = section.classList.contains('collapsed');
  section.classList.toggle('collapsed');
  
  // Save collapsed state to storage
  await chrome.storage.local.set({ popularNotesCollapsed: !isCollapsed });
}

/**
 * Open a popular OSS Note by number
 * @param {string} noteNumber - The OSS Note number to open
 */
async function openPopularOssNote(noteNumber) {
  try {
    const ossNoteUrl = `https://launchpad.support.sap.com/#/notes/${noteNumber}`;
    await chrome.tabs.create({ url: ossNoteUrl });
    showToast(`Opening OSS Note ${noteNumber} ✓`, 'success');
  } catch (error) {
    console.error('[Popular OSS Note] Failed to open:', error);
    showToast('Failed to open OSS Note', 'error');
  }
}

/**
 * Unified toggle pin function for environments, shortcuts, and notes
 * @param {string} id - The item ID
 * @param {string} type - The item type ('environment', 'shortcut', or 'note')
 */
async function togglePin(id, type = 'environment') {
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
    storageKey = `shortcuts_${currentProfile}`;
    renderFunction = renderShortcuts;
    itemLabel = 'Shortcut';
  } else if (type === 'note') {
    item = notes.find(n => n.id === id);
    collection = notes;
    storageKey = `notes_${currentProfile}`;
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
  const modal = document.getElementById('settingsModal');
  modal.classList.add('active');
  
  // Initialize Settings UI
  setupSettingsTabs();
  loadQuickActionsTab();
  loadProfilesTab();
}

function closeSettingsModal() {
  document.getElementById('settingsModal').classList.remove('active');
}

// ==================== SETTINGS - TAB SWITCHING ====================

/**
 * Setup tab switching in Settings modal
 */
function setupSettingsTabs() {
  const tabButtons = document.querySelectorAll('.settings-tab');
  const tabContents = document.querySelectorAll('.settings-tab-content');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update active tab content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${targetTab}-tab`) {
          content.classList.add('active');
        }
      });
      
      // Reload tab content
      if (targetTab === 'quick-actions') {
        loadQuickActionsTab();
      } else if (targetTab === 'profiles') {
        loadProfilesTab();
      }
    });
  });
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

// ==================== SETTINGS - PROFILES TAB ====================

/**
 * Load Profiles tab with simple lists (STUB - Removed in simplification)
 */
async function loadProfilesTab() {
  // No-op - Profiles tab removed in simplification
  console.log('[Profiles Tab] Tab removed in Settings simplification');
}

/**
 * Save all edited Quick Actions from the Settings tab.
 * This function is connected to an explicit "Save" button.
 */
async function saveAllQuickActions() {
  const profileId = currentProfile;
  const listContainer = document.getElementById('qaEditableList');
  if (!listContainer) return;

  try {
    const storageKey = `solutions_${profileId}`;
    const result = await chrome.storage.local.get(storageKey);
    let solutionsData = result[storageKey];

    if (!solutionsData) {
      const profileData = await loadProfileData(profileId);
      solutionsData = JSON.parse(JSON.stringify(profileData.solutions || []));
    }

    let changesMade = 0;
    listContainer.querySelectorAll('.qa-edit-row').forEach(row => {
      const qaId = row.getAttribute('data-qa-id');
      const solutionId = row.getAttribute('data-solution-id');
      const nameInput = row.querySelector('.qa-name-input');
      const pathInput = row.querySelector('.qa-path-input');

      const solution = solutionsData.find(s => s.id === solutionId);
      if (!solution) return;

      const qa = solution.quickActions.find(q => q.id === qaId);
      if (!qa) return;

      const newName = nameInput.value.trim();
      const newPath = pathInput.value.trim();

      if (qa.name !== newName || qa.path !== newPath) {
        qa.name = newName;
        qa.path = newPath;
        changesMade++;
      }
    });

    if (changesMade > 0) {
      await chrome.storage.local.set({ [storageKey]: solutionsData });
      showToast(`${changesMade} Quick Action(s) saved ✓`, 'success');
    } else {
      showToast('No changes to save', 'info');
    }
  } catch (error) {
    console.error('[Save All Quick Actions] Failed:', error);
    showToast('Failed to save Quick Actions', 'error');
  }
}


/**
 * Render system profiles as simple list
 */
async function renderSystemProfilesList() {
  const listDiv = document.getElementById('systemProfilesList');
  if (!listDiv) return;
  
  const result = await chrome.storage.local.get('hiddenProfiles');
  const hiddenProfiles = result.hiddenProfiles || [];
  
  const systemProfiles = availableProfiles.filter(p => 
    p.type === 'system' && 
    !hiddenProfiles.includes(p.id)
  );
  
  if (systemProfiles.length === 0) {
    listDiv.innerHTML = '<div style="padding: 12px; color: var(--text-secondary); font-size: 12px;">No visible system profiles</div>';
    return;
  }
  
  listDiv.innerHTML = systemProfiles.map(profile => {
    const isActive = profile.id === currentProfile;
    return `
      <div class="profile-list-item ${isActive ? 'active' : ''}">
        <span class="profile-list-icon">${profile.icon || '📁'}</span>
        <div class="profile-list-info">
          <div class="profile-list-name">${profile.name}</div>
          <div class="profile-list-desc">${profile.description || 'System profile'}</div>
        </div>
        <div class="profile-list-actions">
          <button class="btn btn-sm" onclick="hideProfileInline('${profile.id}')" title="Hide">🙈</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render custom profiles as simple list
 */
async function renderCustomProfilesList() {
  const listDiv = document.getElementById('customProfilesList');
  if (!listDiv) return;
  
  const customProfiles = availableProfiles.filter(p => p.type === 'custom');
  
  if (customProfiles.length === 0) {
    listDiv.innerHTML = '<div style="padding: 12px; color: var(--text-secondary); font-size: 12px;">No custom profiles</div>';
    return;
  }
  
  listDiv.innerHTML = customProfiles.map(profile => {
    const isActive = profile.id === currentProfile;
    return `
      <div class="profile-list-item ${isActive ? 'active' : ''}">
        <span class="profile-list-icon">${profile.icon || '📁'}</span>
        <div class="profile-list-info">
          <div class="profile-list-name">${profile.name}</div>
          <div class="profile-list-desc">Custom profile</div>
        </div>
        <div class="profile-list-actions">
          <button class="btn btn-sm" onclick="editProfileInline('${profile.id}')" title="Edit">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteProfileInline('${profile.id}')" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render hidden profiles list
 */
async function renderHiddenProfilesList() {
  const sectionDiv = document.getElementById('hiddenProfilesSection');
  const listDiv = document.getElementById('hiddenProfilesList');
  
  if (!sectionDiv || !listDiv) return;
  
  const result = await chrome.storage.local.get('hiddenProfiles');
  const hiddenProfileIds = result.hiddenProfiles || [];
  
  if (hiddenProfileIds.length === 0) {
    sectionDiv.style.display = 'none';
    return;
  }
  
  sectionDiv.style.display = 'block';
  
  const hiddenProfiles = availableProfiles.filter(p => hiddenProfileIds.includes(p.id));
  
  listDiv.innerHTML = hiddenProfiles.map(profile => {
    return `
      <div class="profile-list-item">
        <span class="profile-list-icon">${profile.icon || '📁'}</span>
        <div class="profile-list-info">
          <div class="profile-list-name">${profile.name}</div>
          <div class="profile-list-desc">Hidden</div>
        </div>
        <div class="profile-list-actions">
          <button class="btn btn-sm" onclick="unhideProfileInline('${profile.id}')" title="Show">👁️</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Hide profile inline
 */
async function hideProfileInline(profileId) {
  try {
    const result = await chrome.storage.local.get('hiddenProfiles');
    const hiddenProfiles = result.hiddenProfiles || [];
    
    if (!hiddenProfiles.includes(profileId)) {
      hiddenProfiles.push(profileId);
    }
    
    await chrome.storage.local.set({ hiddenProfiles });
    
    if (currentProfile === profileId) {
      await switchProfile('profile-global');
    }
    
    await loadProfilesTab();
    renderProfileMenu();
    showToast('Profile hidden', 'success');
  } catch (error) {
    console.error('[Hide Profile] Failed:', error);
    showToast('Failed to hide', 'error');
  }
}

/**
 * Unhide profile inline
 */
async function unhideProfileInline(profileId) {
  try {
    const result = await chrome.storage.local.get('hiddenProfiles');
    let hiddenProfiles = result.hiddenProfiles || [];
    
    hiddenProfiles = hiddenProfiles.filter(id => id !== profileId);
    
    await chrome.storage.local.set({ hiddenProfiles });
    
    await loadProfilesTab();
    renderProfileMenu();
    showToast('Profile restored', 'success');
  } catch (error) {
    console.error('[Unhide Profile] Failed:', error);
    showToast('Failed to restore', 'error');
  }
}

/**
 * Edit profile inline (simplified - just prompt for name)
 */
async function editProfileInline(profileId) {
  try {
    const result = await chrome.storage.local.get('customProfiles');
    const customProfiles = result.customProfiles || {};
    const profile = customProfiles[profileId];
    
    if (!profile) {
      showToast('Profile not found', 'error');
      return;
    }
    
    const newName = prompt('Edit profile name:', profile.name);
    if (newName && newName.trim()) {
      profile.name = newName.trim();
      await chrome.storage.local.set({ customProfiles });
      
      // Update availableProfiles
      const idx = availableProfiles.findIndex(p => p.id === profileId);
      if (idx >= 0) {
        availableProfiles[idx].name = newName.trim();
      }
      
      await loadProfilesTab();
      renderProfileMenu();
      showToast('Profile updated', 'success');
    }
  } catch (error) {
    console.error('[Edit Profile] Failed:', error);
    showToast('Failed to update', 'error');
  }
}

/**
 * Delete profile inline
 */
async function deleteProfileInline(profileId) {
  if (!confirm('Delete this profile? All data will be removed.')) return;
  
  try {
    const result = await chrome.storage.local.get('customProfiles');
    const customProfiles = result.customProfiles || {};
    
    delete customProfiles[profileId];
    await chrome.storage.local.set({ customProfiles });
    
    availableProfiles = availableProfiles.filter(p => p.id !== profileId);
    
    const keysToRemove = [`environments_${profileId}`, `solutions_${profileId}`];
    await chrome.storage.local.remove(keysToRemove);
    
    if (currentProfile === profileId) {
      await switchProfile('profile-global');
    }
    
    await loadProfilesTab();
    renderProfileMenu();
    showToast('Profile deleted', 'success');
  } catch (error) {
    console.error('[Delete Profile] Failed:', error);
    showToast('Failed to delete', 'error');
  }
}

/**
 * Create new profile (simplified - prompt for name only)
 */
async function createNewProfileInline() {
  const name = prompt('Enter profile name:');
  if (!name || !name.trim()) return;
  
  try {
    const result = await chrome.storage.local.get('customProfiles');
    const customProfiles = result.customProfiles || {};
    
    const newId = `custom-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    
    customProfiles[newId] = {
      id: newId,
      name: name.trim(),
      type: 'custom',
      basedOn: 'profile-global',
      created: new Date().toISOString()
    };
    
    await chrome.storage.local.set({ customProfiles });
    
    availableProfiles.push({
      id: newId,
      name: name.trim(),
      type: 'custom',
      file: null
    });
    
    await loadProfilesTab();
    renderProfileMenu();
    showToast(`Profile "${name.trim()}" created`, 'success');
  } catch (error) {
    console.error('[Create Profile] Failed:', error);
    showToast('Failed to create', 'error');
  }
}

/**
 * Toggle hidden profiles visibility
 */
function toggleHiddenProfiles() {
  const listDiv = document.getElementById('hiddenProfilesList');
  const toggleBtn = document.getElementById('toggleHiddenProfiles');
  
  if (!listDiv || !toggleBtn) return;
  
  const isVisible = listDiv.style.display !== 'none';
  
  if (isVisible) {
    listDiv.style.display = 'none';
    toggleBtn.textContent = '👁️ Show Hidden Profiles';
  } else {
    listDiv.style.display = 'block';
    toggleBtn.textContent = '👁️ Hide List';
  }
}

/**
 * Open Create Profile modal
 */
function openCreateProfileModal() {
  const modal = document.getElementById('editProfileModal');
  if (!modal) return;
  
  // Reset form
  document.getElementById('profileName').value = '';
  document.getElementById('profileDesc').value = '';
  document.getElementById('profileIcon').value = '📁';
  document.getElementById('profileBase').value = 'profile-global';
  document.getElementById('profileCopyQuickActions').checked = false;
  
  // Set create mode
  modal.removeAttribute('data-edit-id');
  modal.setAttribute('data-mode', 'create');
  
  // Update modal title
  document.querySelector('#editProfileModal .modal-header h3').textContent = 'Create Profile';
  
  modal.classList.add('active');
}

/**
 * Edit custom profile
 */
async function editProfile(profileId) {
  const modal = document.getElementById('editProfileModal');
  if (!modal) return;
  
  try {
    // Load custom profiles from storage
    const result = await chrome.storage.local.get('customProfiles');
    const customProfiles = result.customProfiles || {};
    const profile = customProfiles[profileId];
    
    if (!profile) {
      showToast('Profile not found', 'error');
      return;
    }
    
    // Populate form
    document.getElementById('profileName').value = profile.name || '';
    document.getElementById('profileDesc').value = profile.description || '';
    document.getElementById('profileIcon').value = profile.icon || '📁';
    document.getElementById('profileBase').value = profile.basedOn || 'profile-global';
    document.getElementById('profileCopyQuickActions').checked = false; // Not applicable in edit mode
    
    // Set edit mode
    modal.setAttribute('data-edit-id', profileId);
    modal.setAttribute('data-mode', 'edit');
    
    // Update modal title
    document.querySelector('#editProfileModal .modal-header h3').textContent = 'Edit Profile';
    
    modal.classList.add('active');
    
  } catch (error) {
    console.error('[Edit Profile] Failed:', error);
    showToast('Failed to load profile', 'error');
  }
}

/**
 * Duplicate profile (system or custom)
 */
async function duplicateProfile(profileId) {
  const modal = document.getElementById('editProfileModal');
  if (!modal) return;
  
  try {
    const profile = availableProfiles.find(p => p.id === profileId);
    if (!profile) {
      showToast('Profile not found', 'error');
      return;
    }
    
    // Populate form with " (Copy)" suffix
    document.getElementById('profileName').value = `${profile.name} (Copy)`;
    document.getElementById('profileDesc').value = profile.description || '';
    document.getElementById('profileIcon').value = profile.icon || '📁';
    document.getElementById('profileBase').value = profileId;
    document.getElementById('profileCopyQuickActions').checked = true;
    
    // Set duplicate mode
    modal.removeAttribute('data-edit-id');
    modal.setAttribute('data-mode', 'duplicate');
    modal.setAttribute('data-source-profile', profileId);
    
    // Update modal title
    document.querySelector('#editProfileModal .modal-header h3').textContent = 'Duplicate Profile';
    
    modal.classList.add('active');
    
  } catch (error) {
    console.error('[Duplicate Profile] Failed:', error);
    showToast('Failed to duplicate profile', 'error');
  }
}

/**
 * Delete custom profile
 */
async function deleteProfile(profileId) {
  const confirmed = confirm('Delete this profile? All associated data will be removed.');
  if (!confirmed) return;
  
  try {
    // Load custom profiles
    const result = await chrome.storage.local.get('customProfiles');
    const customProfiles = result.customProfiles || {};
    
    // Remove profile
    delete customProfiles[profileId];
    
    // Save updated profiles
    await chrome.storage.local.set({ customProfiles });
    
    // Remove from available profiles list
    availableProfiles = availableProfiles.filter(p => p.id !== profileId);
    
    // Remove associated data
    const keysToRemove = [
      `environments_${profileId}`,
      `solutions_${profileId}`
    ];
    await chrome.storage.local.remove(keysToRemove);
    
    // Switch to Global if deleted current profile
    if (currentProfile === profileId) {
      await switchProfile('profile-global');
    }
    
    // Reload grids
    await loadProfilesManager();
    renderProfileMenu();
    
    showToast('Profile deleted', 'success');
    
  } catch (error) {
    console.error('[Delete Profile] Failed:', error);
    showToast('Failed to delete profile', 'error');
  }
}

/**
 * Hide system profile
 */
async function hideProfile(profileId) {
  try {
    // Load hidden profiles list
    const result = await chrome.storage.local.get('hiddenProfiles');
    const hiddenProfiles = result.hiddenProfiles || [];
    
    // Add to hidden list
    if (!hiddenProfiles.includes(profileId)) {
      hiddenProfiles.push(profileId);
    }
    
    // Save updated list
    await chrome.storage.local.set({ hiddenProfiles });
    
    // Switch to Global if hiding current profile
    if (currentProfile === profileId) {
      await switchProfile('profile-global');
    }
    
    // Reload grids and menu
    await loadProfilesManager();
    renderProfileMenu();
    
    showToast('Profile hidden', 'success');
    
  } catch (error) {
    console.error('[Hide Profile] Failed:', error);
    showToast('Failed to hide profile', 'error');
  }
}

/**
 * Unhide system profile
 */
async function unhideProfile(profileId) {
  try {
    // Load hidden profiles list
    const result = await chrome.storage.local.get('hiddenProfiles');
    let hiddenProfiles = result.hiddenProfiles || [];
    
    // Remove from hidden list
    hiddenProfiles = hiddenProfiles.filter(id => id !== profileId);
    
    // Save updated list
    await chrome.storage.local.set({ hiddenProfiles });
    
    // Reload grids and menu
    await loadProfilesManager();
    renderProfileMenu();
    
    showToast('Profile restored', 'success');
    
  } catch (error) {
    console.error('[Unhide Profile] Failed:', error);
    showToast('Failed to restore profile', 'error');
  }
}

/**
 * Save profile (create, edit, or duplicate)
 */
async function saveProfile() {
  const modal = document.getElementById('editProfileModal');
  const mode = modal.getAttribute('data-mode');
  const editId = modal.getAttribute('data-edit-id');
  const sourceProfile = modal.getAttribute('data-source-profile');
  
  const name = document.getElementById('profileName').value.trim();
  const description = document.getElementById('profileDesc').value.trim();
  const icon = document.getElementById('profileIcon').value || '📁';
  const basedOn = document.getElementById('profileBase').value;
  const copyQuickActions = document.getElementById('profileCopyQuickActions').checked;
  
  // Validation
  if (!name) {
    showToast('Profile name is required', 'warning');
    return;
  }
  
  try {
    // Load custom profiles
    const result = await chrome.storage.local.get('customProfiles');
    const customProfiles = result.customProfiles || {};
    
    if (mode === 'create' || mode === 'duplicate') {
      // Create new profile
      const newId = `custom-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      
      customProfiles[newId] = {
        id: newId,
        name,
        description,
        icon,
        type: 'custom',
        basedOn,
        created: new Date().toISOString()
      };
      
      // Copy Quick Actions if requested
      if (copyQuickActions && (sourceProfile || basedOn)) {
        const sourceId = sourceProfile || basedOn;
        const sourceKey = `solutions_${sourceId}`;
        const sourceResult = await chrome.storage.local.get(sourceKey);
        
        if (sourceResult[sourceKey]) {
          const targetKey = `solutions_${newId}`;
          await chrome.storage.local.set({ [targetKey]: sourceResult[sourceKey] });
        }
      }
      
      // Save custom profiles
      await chrome.storage.local.set({ customProfiles });
      
      // Add to available profiles list
      availableProfiles.push({
        id: newId,
        name,
        type: 'custom',
        file: null,
        icon,
        description
      });
      
      showToast(`Profile "${name}" created ✓`, 'success');
      
      // Switch to new profile
      await switchProfile(newId);
      
    } else if (mode === 'edit') {
      // Edit existing profile
      if (!editId || !customProfiles[editId]) {
        showToast('Profile not found', 'error');
        return;
      }
      
      customProfiles[editId].name = name;
      customProfiles[editId].description = description;
      customProfiles[editId].icon = icon;
      customProfiles[editId].basedOn = basedOn;
      
      // Save custom profiles
      await chrome.storage.local.set({ customProfiles });
      
      // Update available profiles list
      const profileIndex = availableProfiles.findIndex(p => p.id === editId);
      if (profileIndex >= 0) {
        availableProfiles[profileIndex].name = name;
        availableProfiles[profileIndex].icon = icon;
        availableProfiles[profileIndex].description = description;
      }
      
      showToast('Profile updated ✓', 'success');
      
      // Update UI if editing current profile
      if (currentProfile === editId) {
        document.getElementById('currentProfileName').textContent = name;
      }
    }
    
    // Reload grids and menu
    await loadProfilesManager();
    renderProfileMenu();
    
    // Close modal
    modal.classList.remove('active');
    modal.removeAttribute('data-edit-id');
    modal.removeAttribute('data-mode');
    modal.removeAttribute('data-source-profile');
    
  } catch (error) {
    console.error('[Save Profile] Failed:', error);
    showToast('Failed to save profile', 'error');
  }
}

function closeProfileModal() {
  const modal = document.getElementById('editProfileModal');
  modal.classList.remove('active');
  modal.removeAttribute('data-edit-id');
  modal.removeAttribute('data-mode');
  modal.removeAttribute('data-source-profile');
  document.getElementById('profileName').value = '';
  document.getElementById('profileDesc').value = '';
}

// ==================== SETTINGS - EXPORT ====================

/**
 * Export configuration from Quick Actions tab
 */
async function exportConfigFromSettings() {
  const profileSelect = document.getElementById('qaProfileSelect');
  if (!profileSelect) {
    await exportJsonToFile();
    return;
  }
  
  const profileId = profileSelect.value;
  const profile = availableProfiles.find(p => p.id === profileId);
  
  if (!profile) {
    showToast('Profile not found', 'error');
    return;
  }
  
  try {
    // Load data for selected profile
    const storageKey = `environments_${profileId}`;
    const envResult = await chrome.storage.local.get(storageKey);
    const profileEnvs = envResult[storageKey] || [];
    
    const solutionsKey = `solutions_${profileId}`;
    const solutionsResult = await chrome.storage.local.get(solutionsKey);
    let profileSolutions = solutionsResult[solutionsKey];
    
    if (!profileSolutions) {
      const profileData = await loadProfileData(profileId);
      profileSolutions = profileData.solutions || [];
    }
    
    // Use current shortcuts and notes (global)
    const exportData = {
      version: '1.0',
      profileType: 'custom',
      profile: profileId,
      profileName: profile.name,
      basedOn: profileId.startsWith('custom-') ? 'profile-successfactors' : profileId,
      shortcuts: shortcuts,
      environments: profileEnvs,
      notes: notes,
      solutions: profileSolutions,
      exportDate: new Date().toISOString(),
      description: 'Custom profile export. To create a new profile, edit "profileName" field and re-import.'
    };
    
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    const profileSlug = profile.name.toLowerCase().replace(/\s+/g, '-');
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `sap-pro-toolkit-${profileSlug}-${timestamp}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    const itemCount = shortcuts.length + profileEnvs.length + notes.length;
    const qaCount = profileSolutions?.reduce((sum, sol) => sum + (sol.quickActions?.length || 0), 0) || 0;
    showToast(`Exported ${itemCount} items + ${qaCount} Quick Actions ✓`, 'success');
    
  } catch (error) {
    console.error('[Export Config] Failed:', error);
    showToast('Failed to export configuration', 'error');
  }
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
  // Load saved section states from storage (default: all expanded)
  const result = await chrome.storage.local.get('sectionStates');
  const sectionStates = result.sectionStates || {
    environments: true,  // true = expanded
    shortcuts: true,
    notes: true
  };
  
  // Apply saved states to all sections
  document.querySelectorAll('.section').forEach(section => {
    const sectionId = section.getAttribute('data-section');
    if (sectionId) {
      const isExpanded = sectionStates[sectionId] !== false; // Default to expanded if not set
      
      if (isExpanded) {
        section.classList.remove('collapsed');
      } else {
        section.classList.add('collapsed');
      }
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

  // Quick Actions save button
  document.getElementById('saveAllQaBtn')?.addEventListener('click', saveAllQuickActions);
  
  // New simplified Settings handlers
  document.getElementById('newProfileBtn')?.addEventListener('click', createNewProfileInline);
  document.getElementById('exportAllBtn')?.addEventListener('click', exportJsonToFile);
  document.getElementById('importJsonBtn')?.addEventListener('click', importJsonFromFile);
  document.getElementById('importFileInput')?.addEventListener('change', handleFileImport);
  
  // Legacy Profile modal handlers (still used for duplicate/edit with full form)
  document.getElementById('closeProfileModal')?.addEventListener('click', closeProfileModal);
  document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfile);
  
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
  // Start with system profiles (removed "All Profiles" for simplicity)
  availableProfiles = [
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
    const editableProfiles = availableProfiles;
    let allHTML = '';
    
    for (const profile of editableProfiles) {
      const storageKey = `solutions_${profile.id}`;
      const result = await chrome.storage.local.get(storageKey);
      let solutionsData = result[storageKey];
      
      if (!solutionsData) {
        const profileData = await loadProfileData(profile.id);
        solutionsData = JSON.parse(JSON.stringify(profileData.solutions || []));
      }
      
      if (!solutionsData || solutionsData.length === 0) continue;
      
      // Add profile header
      allHTML += `
        <div class="qa-profile-section" style="margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--border);">
          <h3 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px;">
            ${profile.icon || '📁'} ${profile.name}
          </h3>
      `;
      
      // Add solutions for this profile
      for (const solution of solutionsData) {
        const quickActions = solution.quickActions || [];
        
        allHTML += `
          <div class="qa-solution-group" style="margin-bottom: 20px;">
            <h4 style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 12px;">
              ${solution.name || solution.id} (${quickActions.length})
            </h4>
            ${quickActions.length === 0 ? 
              '<div style="padding: 12px; color: var(--text-secondary); font-size: 11px;">No Quick Actions</div>' :
              quickActions.map(qa => `
                <div class="qa-edit-row" data-qa-id="${qa.id}" data-solution-id="${solution.id}" data-profile-id="${profile.id}" style="margin-bottom: 12px;">
                  <label style="display: block; font-size: 10px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Name:</label>
                  <input 
                    type="text" 
                    class="qa-name-input" 
                    value="${qa.name}" 
                    data-original-name="${qa.name}"
                    style="width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: 4px; font-size: 12px; background: var(--bg-primary); color: var(--text-primary); margin-bottom: 8px;"
                  >
                  <label style="display: block; font-size: 10px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Path:</label>
                  <input 
                    type="text" 
                    class="qa-path-input" 
                    value="${qa.path}" 
                    data-original-path="${qa.path}"
                    style="width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: 4px; font-size: 11px; background: var(--bg-primary); color: var(--text-primary); font-family: 'SF Mono', monospace;"
                  >
                </div>
              `).join('')
            }
          </div>
        `;
      }
      
      allHTML += '</div>'; // Close profile section
    }
    
    if (!allHTML) {
      listContainer.innerHTML = '<div class="empty-state" style="padding: 24px; text-align: center; color: var(--text-secondary);">No Quick Actions configured</div>';
    } else {
      listContainer.innerHTML = allHTML;
    }
    
  } catch (error) {
    console.error('[Quick Actions Tab] Failed to load:', error);
    listContainer.innerHTML = '<div class="empty-state" style="padding: 24px; text-align: center; color: var(--env-production);">Failed to load</div>';
  }
}

/**
 * Save all edited Quick Actions from ALL profiles in the Settings tab.
 * This function is connected to an explicit "Save" button.
 */
async function saveAllQuickActions() {
  const listContainer = document.getElementById('qaEditableList');
  if (!listContainer) return;

  try {
    // Group changes by profile
    const changesByProfile = {};
    let totalChanges = 0;

    listContainer.querySelectorAll('.qa-edit-row').forEach(row => {
      const qaId = row.getAttribute('data-qa-id');
      const solutionId = row.getAttribute('data-solution-id');
      const profileId = row.getAttribute('data-profile-id');
      const nameInput = row.querySelector('.qa-name-input');
      const pathInput = row.querySelector('.qa-path-input');

      const newName = nameInput.value.trim();
      const newPath = pathInput.value.trim();
      const originalName = nameInput.getAttribute('data-original-name');
      const originalPath = pathInput.getAttribute('data-original-path');

      // Check if changed
      if (newName !== originalName || newPath !== originalPath) {
        if (!changesByProfile[profileId]) {
          changesByProfile[profileId] = [];
        }
        changesByProfile[profileId].push({ qaId, solutionId, newName, newPath });
        totalChanges++;
      }
    });

    if (totalChanges === 0) {
      showToast('No changes to save', 'info');
      return;
    }

    // Save changes for each profile
    for (const profileId in changesByProfile) {
      const storageKey = `solutions_${profileId}`;
      const result = await chrome.storage.local.get(storageKey);
      let solutionsData = result[storageKey];

      if (!solutionsData) {
        const profileData = await loadProfileData(profileId);
        solutionsData = JSON.parse(JSON.stringify(profileData.solutions || []));
      }

      // Apply changes
      for (const change of changesByProfile[profileId]) {
        const solution = solutionsData.find(s => s.id === change.solutionId);
        if (!solution) continue;

        const qa = solution.quickActions.find(q => q.id === change.qaId);
        if (!qa) continue;

        qa.name = change.newName;
        qa.path = change.newPath;
      }

      // Save to storage
      await chrome.storage.local.set({ [storageKey]: solutionsData });
    }

    showToast(`${totalChanges} Quick Action(s) saved across ${Object.keys(changesByProfile).length} profile(s) ✓`, 'success');
    
    // Reload Settings tab to reflect saved changes
    await loadQuickActionsTab();
    
    // CRITICAL: Re-render environments section to update Quick Actions display
    // This removes the old Quick Actions banner and creates a new one with updated data
    await renderEnvironments();

  } catch (error) {
    console.error('[Save All Quick Actions] Failed:', error);
    showToast('Failed to save Quick Actions', 'error');
  }
}


async function renderProfileMenu() {
  const menu = document.getElementById('profileMenu');
  if (!menu) return;
  
  // Get hidden profiles list
  const result = await chrome.storage.local.get('hiddenProfiles');
  const hiddenProfiles = result.hiddenProfiles || [];
  
  // Filter out hidden profiles
  const visibleProfiles = availableProfiles.filter(p => !hiddenProfiles.includes(p.id));
  
  menu.innerHTML = visibleProfiles.map(profile => {
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
        ${isActive ? window.SVGRenderer.renderCheckIcon(14) : ''}
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
    
    // Reload data
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
