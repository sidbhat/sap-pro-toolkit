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
    await loadSolutions();
    await window.loadCurrentPageData();
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
    
    updatePlatformSpecificUI();
    
    // Listen for tab changes to update UI
    chrome.tabs.onActivated.addListener(async () => {
      await window.loadCurrentPageData();
    });
    
    // Listen for URL changes within the same tab
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete') {
        await window.loadCurrentPageData();
      }
    });
    
  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Failed to initialize extension', 'error');
  }
});

// ==================== DATA LOADING ====================

async function loadSettings() {
  const result = await chrome.storage.sync.get({ showConfirmationForProd: true, enableAiFeatures: true });
  settings = result;
  await updateAISettings();
}

/**
 * AI Search button is always visible.
 * Users will see helpful error messages if API keys aren't configured.
 */
async function updateAISettings() {
  // Always show AI button - let users discover the feature
  document.body.classList.add('ai-active');
  console.log('[AI Settings] AI Search button is always visible');
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
  
  // Migration: Ensure all notes have noteType field
  let needsSave = false;
  notes = notes.map(note => {
    if (!note.noteType) {
      console.log('[Notes Migration] Adding missing noteType to:', note.title);
      needsSave = true;
      return {
        ...note,
        noteType: 'note' // Default type for notes without it
      };
    }
    return note;
  });
  
  // Save if we added missing fields
  if (needsSave) {
    await chrome.storage.local.set({ [storageKey]: notes });
    console.log('[Notes Migration] Saved', notes.length, 'notes with noteType field');
  }
  
  console.log(`[Notes] Loaded ${notes.length} notes for profile: ${currentProfile}`);
  renderNotes();
}

async function loadSolutions() {
  try {
    console.log('[Load Solutions] Starting...');
    
    // Check if we have solutions in storage
    const result = await chrome.storage.local.get('solutions');
    
    if (result.solutions && Array.isArray(result.solutions)) {
      // Use saved solutions from storage
      solutions = result.solutions;
      console.log('[Load Solutions] ✅ Loaded from storage:', solutions.length, 'solutions');
    } else {
      // FIRST RUN: Copy solutions.json into storage
      console.log('[Load Solutions] First run - copying solutions.json to storage...');
      const response = await fetch(chrome.runtime.getURL('resources/solutions.json'));
      if (!response.ok) {
        throw new Error('Failed to load solutions.json');
      }
      const baseData = await response.json();
      solutions = baseData.solutions || [];
      
      // SAVE TO STORAGE (this becomes the source of truth from now on)
      await chrome.storage.local.set({ solutions: solutions });
      console.log('[Load Solutions] ✅ Copied to storage:', solutions.length, 'solutions');
      console.log('[Load Solutions] 📝 From now on, all edits save to storage only');
    }

  } catch (error) {
    console.error('[Solutions] Failed to load:', error);
    solutions = [];
  }
}



function updateDiagnosticsButton() {
  const diagnosticsBtn = document.getElementById('footerDiagnosticsBtn');
  if (!diagnosticsBtn) return;
  
  // The button is now universal, so it should always be enabled.
  diagnosticsBtn.classList.remove('btn-disabled');
  diagnosticsBtn.setAttribute('title', 'Run Page Diagnostics');
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

/**
 * Load data from ALL profiles for cross-profile search
 * @returns {Promise<Object>} Object with all profiles' data
 */
async function loadAllProfilesData() {
  const allData = {
    environments: [],
    shortcuts: [],
    notes: []
  };
  
  for (const profile of availableProfiles) {
    try {
      // Load profile-specific data from storage
      const envKey = `environments_${profile.id}`;
      const shortcutsKey = `shortcuts_${profile.id}`;
      const notesKey = `notes_${profile.id}`;
      
      const result = await chrome.storage.local.get([envKey, shortcutsKey, notesKey]);
      
      // Add profile metadata to each item
      const profileEnvs = (result[envKey] || []).map(env => ({
        ...env,
        profileId: profile.id,
        profileName: profile.name,
        profileIcon: profile.icon || '📁'
      }));
      
      const profileShortcuts = (result[shortcutsKey] || []).map(shortcut => ({
        ...shortcut,
        profileId: profile.id,
        profileName: profile.name,
        profileIcon: profile.icon || '📁'
      }));
      
      const profileNotes = (result[notesKey] || []).map(note => ({
        ...note,
        profileId: profile.id,
        profileName: profile.name,
        profileIcon: profile.icon || '📁'
      }));
      
      allData.environments.push(...profileEnvs);
      allData.shortcuts.push(...profileShortcuts);
      allData.notes.push(...profileNotes);
      
    } catch (error) {
      console.error(`[Cross-Profile] Failed to load data for ${profile.id}:`, error);
    }
  }
  
  console.log('[Cross-Profile] Loaded data:', {
    environments: allData.environments.length,
    shortcuts: allData.shortcuts.length,
    notes: allData.notes.length,
    profiles: availableProfiles.length
  });
  
  return allData;
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
  
  // Detect current SAP system and load Quick Actions from GLOBAL solutions storage
  // Quick Actions will be rendered ABOVE the section (not inside tbody)
  console.log('[Quick Actions] Current page data:', currentPageData);
  console.log('[Quick Actions] Solution type detected:', currentPageData?.solutionType);
  console.log('[Quick Actions] Solutions array:', solutions);
  
  if (currentPageData && currentPageData.solutionType) {
    const solutionType = currentPageData.solutionType;
    
    // Find matching solution from global solutions array
    const solution = solutions.find(s => s.id === solutionType);
    console.log('[Quick Actions] Matched solution:', solution);
    
    if (solution && solution.quickActions && solution.quickActions.length > 0) {
      const quickActions = solution.quickActions.slice(0, 5);
      const solutionLabel = solution.name || solutionType.toUpperCase();
      
      // Render as standalone div ABOVE the table (not inside tbody)
      const quickActionsHTML = `
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
        const flag = currentPageData.country && typeof COUNTRY_FLAGS !== 'undefined' && COUNTRY_FLAGS[currentPageData.country] ? COUNTRY_FLAGS[currentPageData.country] : '';
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
    
    // Render note type badge instead of tags
    const noteType = note.noteType || 'note';
    const noteTypeLabels = {
      'note': '📝 Note',
      'ai-prompt': '✨ AI Prompt',
      'documentation': '📚 Documentation',
      'code': '💻 Code'
    };
    const noteTypeBadge = `<div class="note-type-badge"><span class="note-type-label">${noteTypeLabels[noteType]}</span></div>`;
    
    // Edit button (always shown for all note types)
    const editButtonHTML = `<button class="icon-btn primary edit-btn" data-id="${note.id}" title="Edit" tabindex="0">
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
          ${noteTypeBadge}
        </td>
        <td class="note-actions-cell">
          <div class="table-actions">
            ${editButtonHTML}
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
  
  // Show AI buttons if AI is active
  if (document.body.classList.contains('ai-active')) {
    document.querySelectorAll('.ai-prompt-btn').forEach(btn => {
      btn.style.display = 'flex';
    });
  }
  
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
  
  // Enhanced search: includes name and notes
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
      const matches = name.includes(term) || notes.includes(term);
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
      const noteType = (note.noteType || '').toLowerCase();
      const matches = title.includes(term) || content.includes(term) || noteType.includes(term);
      row.style.display = matches ? '' : 'none';
    } else {
      row.style.display = 'none';
    }
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
  
  // Reset note type to 'note' and hide AI elements
  const noteTypeRadio = document.querySelector('input[name="noteType"][value="note"]');
  if (noteTypeRadio) noteTypeRadio.checked = true;
  
  const modelGroup = document.getElementById('modelSelectorGroup');
  if (modelGroup) modelGroup.style.display = 'none';
  
  hideAITestButtons();
  
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
    
    // Show action buttons again
    document.getElementById('saveNoteBtn').style.display = 'inline-flex';
    document.getElementById('prettifyNoteBtn').style.display = 'inline-flex';
    // Download button will be hidden by openAddNoteModal() for new notes
    
    // Clear read-only flag
    modal.removeAttribute('data-readonly-mode');
  }
  
  // Hide AI elements when closing
  hideAITestButtons();
  const modelGroup = document.getElementById('modelSelectorGroup');
  if (modelGroup) modelGroup.style.display = 'none';
  
  document.getElementById('addNoteForm').reset();
  document.querySelector('#addNoteModal .modal-header h3').textContent = 'Scratch Note';
}

function editNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note) {
    console.error('[Edit Note] Note not found:', id);
    showToast('Note not found. Try reloading the extension.', 'error');
    return;
  }
  
  console.log('[Edit Note] Opening note:', { id, note });
  
  // Get the modal
  const modal = document.getElementById('addNoteModal');
  if (!modal) {
    console.error('[Edit Note] Modal not found: addNoteModal');
    showToast('Error: Modal not found', 'error');
    return;
  }
  
  // Get form elements
  const titleEl = document.getElementById('noteTitle');
  const contentEl = document.getElementById('noteContent');
  const iconEl = document.getElementById('noteIcon');
  
  if (!titleEl || !contentEl || !iconEl) {
    console.error('[Edit Note] Form elements not found:', { titleEl, contentEl, iconEl });
    showToast('Error: Form elements not found', 'error');
    return;
  }
  
  // Populate form fields
  titleEl.value = note.title;
  contentEl.value = note.content || '';
  iconEl.value = note.icon || '0';
  
  // Set edit mode FIRST (before setting note type)
  modal.setAttribute('data-edit-id', id);
  const headerEl = document.querySelector('#addNoteModal .modal-header h3');
  if (headerEl) headerEl.textContent = 'Edit Note';
  
  // Show download button in edit mode
  const downloadBtn = document.getElementById('downloadNoteBtn');
  if (downloadBtn) downloadBtn.style.display = 'inline-flex';
  
  // Show save and prettify buttons (ensure they're visible)
  const saveBtn = document.getElementById('saveNoteBtn');
  const prettifyBtn = document.getElementById('prettifyNoteBtn');
  if (saveBtn) saveBtn.style.display = 'inline-flex';
  if (prettifyBtn) prettifyBtn.style.display = 'inline-flex';
  
  // Set note type radio button
  const noteType = note.noteType || 'note';
  console.log('[Edit Note] Setting note type:', noteType);
  
  const noteTypeRadio = document.querySelector(`input[name="noteType"][value="${noteType}"]`);
  if (noteTypeRadio) {
    noteTypeRadio.checked = true;
    console.log('[Edit Note] Radio button checked:', noteTypeRadio);
  } else {
    console.warn('[Edit Note] Note type radio button not found:', noteType);
  }
  
  // Open modal BEFORE triggering AI features (modal must be visible for proper rendering)
  modal.classList.add('active');
  
  // AFTER modal is active, manually trigger AI feature visibility
  // This ensures the MutationObserver has fired and DOM is ready
  setTimeout(() => {
    if (noteType === 'ai-prompt') {
      console.log('[Edit Note] Showing AI button for ai-prompt type');
      // Show AI button
      showAITestButtons();
    } else {
      console.log('[Edit Note] Hiding AI button for non-ai-prompt type');
      // Hide AI button
      hideAITestButtons();
    }
  }, 50); // Small delay to ensure modal is fully rendered
  
  console.log('[Edit Note] Modal opened successfully');
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
  
  // Get selected note type from radio buttons
  const noteTypeRadio = document.querySelector('input[name="noteType"]:checked');
  const noteType = noteTypeRadio ? noteTypeRadio.value : 'note';
  
  if (!title) {
    showToast('Please enter a title', 'warning');
    return;
  }
  
  const modal = document.getElementById('addNoteModal');
  const editId = modal.getAttribute('data-edit-id');
  
  // Build note object with noteType
  const noteObject = {
    id: editId || `note-${Date.now()}`,
    title,
    content,
    icon,
    noteType,
    timestamp: Date.now()
  };
  
  // Add aiConfig if ai-prompt type
  if (noteType === 'ai-prompt') {
    const modelSelect = document.getElementById('noteModel');
    noteObject.aiConfig = {
      defaultModel: modelSelect ? modelSelect.value : 'gpt-4-turbo'
    };
  }
  
  if (editId) {
    // Remove the existing item and add updated version at the end
    notes = notes.filter(n => n.id !== editId);
    notes.push(noteObject);
    showToast('Note updated ✓', 'success');
    modal.removeAttribute('data-edit-id');
  } else {
    notes.push(noteObject);
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
 * Download note content as a text file
 * @param {string} id - Note ID
 */
async function downloadNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note) {
    showToast('Note not found', 'error');
    return;
  }
  
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    
    // Build file content
    const fileContent = `${note.title}
${note.timestamp ? `Created: ${new Date(note.timestamp).toLocaleString()}` : ''}
${note.noteType ? `Type: ${note.noteType}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${note.content || ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create safe filename from title
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
    
    showToast('Note downloaded ✓', 'success');
    
  } catch (error) {
    console.error('[Download Note] Failed:', error);
    showToast(`Failed to download: ${error.message}`, 'error');
  }
}

/**
 * Render Quick Actions as editable text fields (SIMPLIFIED)
 * Both name AND path are editable
 * Uses GLOBAL solutions storage (not profile-specific)
 */
async function renderQuickActionsBySection(profileId) {
  const listContainer = document.getElementById('qaEditableList');
  if (!listContainer) return;
  
  try {
    // ✅ FIX: Use global solutions array (already loaded)
    const solutionsData = solutions;
    
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
              <div class="qa-edit-row" data-qa-id="${qa.id}" data-solution-id="${solution.id}" style="margin-bottom: 16px;">
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
  const modal = document.getElementById('diagnosticsModal');
  const contentDiv = document.getElementById('diagnosticsContent');
  
  // Reset modal state
  modal.removeAttribute('data-ai-report');
  modal.removeAttribute('data-page-title');
  document.getElementById('saveDiagnosticsBtn').style.display = 'none';
  document.getElementById('downloadDiagnosticsBtn').style.display = 'none';

  modal.classList.add('active');
  contentDiv.innerHTML = `
    <div class="diagnostics-loading">
      <div class="spinner"></div>
      <span>Click "Analyze with AI" to start...</span>
    </div>
  `;
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
 * Regenerate diagnostics with AI-powered comprehensive page analysis
 * Scrapes page for errors, test data, expired dates, unloaded cards, etc.
 * Provides insights for presales, admins, consultants, and end users
 */
async function regenerateDiagnosticsWithAI() {
  if (!window.ToolkitCore || !window.ToolkitCore.testPromptWithModel) {
    showToast('AI features not available. Please configure in Settings.', 'error');
    return;
  }

  const contentDiv = document.getElementById('diagnosticsContent');
  const modal = document.getElementById('diagnosticsModal');
  
  contentDiv.innerHTML = `
    <div class="diagnostics-ai-enhanced">
      <div style="display: flex; align-items: center; gap: 12px; padding: 16px;">
        <div class="spinner"></div>
        <span>✨ AI is analyzing the page...</span>
      </div>
    </div>
  `;

  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab || !tab.url) {
      throw new Error('No active tab found');
    }

    // Always try to inject content script, catch error if it fails (e.g., on restricted pages)
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      });
    } catch (injectError) {
      console.warn('[AI Diagnostics] Content script injection failed, proceeding with URL-based analysis:', injectError.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300)); // Give script time to load

    const scrapedData = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: 'scrapePageForDiagnostics' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          console.warn('[AI Diagnostics] Scrape failed, using fallback data.', chrome.runtime.lastError?.message);
          resolve({
            title: tab.title,
            url: tab.url,
            performance: {},
            consoleErrors: [],
            testData: { found: false },
            expiredDates: [],
            cardsNotLoaded: [],
            error: null
          });
        } else {
          resolve(response);
        }
      });
    });

    await loadCurrentPageData(); // Refresh current page data
    const standardDiag = currentPageData ? formatDiagnosticsReport(await gatherDiagnostics(currentPageData)) : 'Standard diagnostics not available for this page.';
    
    const prompt = buildDiagnosticsPrompt(standardDiag, scrapedData, currentPageData);
    const result = await window.ToolkitCore.testPromptWithModel(prompt);

    if (!result || !result.content) {
      throw new Error('No response from AI');
    }

    const formattedResponse = markdownToHTML(result.content);
    
    // Store the raw response content in the modal for saving/downloading
    modal.setAttribute('data-ai-report', result.content);
    modal.setAttribute('data-page-title', scrapedData.title || tab.title);

    contentDiv.innerHTML = `
      <div class="diagnostics-ai-enhanced">
        <div class="ai-badge">
          <span style="opacity: 0.8; font-size: 8px;">${result.model || 'AI'} · ${(result.usage?.inputTokens || 0) + (result.usage?.outputTokens || 0)} tokens</span>
        </div>
        <div class="ai-response" style="margin-top: 16px;">
          ${formattedResponse}
        </div>
      </div>
    `;

    // Show save/download buttons
    document.getElementById('saveDiagnosticsBtn').style.display = 'inline-flex';
    document.getElementById('downloadDiagnosticsBtn').style.display = 'inline-flex';

    showToast('✨ AI diagnostics generated ✓', 'success');

  } catch (error) {
    console.error('[AI Diagnostics] Failed:', error);
    showToast(`AI diagnostics failed: ${error.message}`, 'error');
    contentDiv.innerHTML = `<p style="color: var(--env-production);">Failed to generate AI diagnostics. Please try again.</p>`;
    // Hide save/download buttons on failure
    document.getElementById('saveDiagnosticsBtn').style.display = 'none';
    document.getElementById('downloadDiagnosticsBtn').style.display = 'none';
  }
}

/**
 * Saves the generated AI diagnostics report as a note.
 */
async function saveDiagnosticsAsNote() {
  const modal = document.getElementById('diagnosticsModal');
  const reportContent = modal.getAttribute('data-ai-report');
  const pageTitle = modal.getAttribute('data-page-title') || 'Untitled Page';

  if (!reportContent) {
    showToast('No report content to save.', 'warning');
    return;
  }

  try {
    const cleanContent = stripMarkdown(reportContent);
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const noteTitle = `Diagnostics Report - ${pageTitle} - ${date}`;

    const newNote = {
      id: `note-${Date.now()}`,
      title: noteTitle,
      content: cleanContent,
      noteType: 'documentation',
      icon: 'document',
      tags: ['diagnostics', 'system-analysis'],
      timestamp: Date.now(),
    };

    notes.push(newNote);
    const storageKey = `notes_${currentProfile}`;
    await chrome.storage.local.set({ [storageKey]: notes });

    renderNotes();
    showToast('Diagnostics report saved as a note ✓', 'success');
  } catch (error) {
    console.error('[Save Diagnostics] Failed:', error);
    showToast('Failed to save report as note.', 'error');
  }
}

/**
 * Downloads the generated AI diagnostics report as a text file.
 */
async function downloadDiagnosticsReport() {
  const modal = document.getElementById('diagnosticsModal');
  const reportContent = modal.getAttribute('data-ai-report');

  if (!reportContent) {
    showToast('No report content to download.', 'warning');
    return;
  }

  try {
    const cleanContent = stripMarkdown(reportContent);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `diagnostics-report-${timestamp}.txt`;

    const blob = new Blob([cleanContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Report downloaded successfully ✓', 'success');
  } catch (error) {
    console.error('[Download Diagnostics] Failed:', error);
    showToast('Failed to download report.', 'error');
  }
}

/**
 * Build enhanced universal diagnostics prompt for any page type
 * Provides multi-audience guidance (presales, consultants, technical)
 */
function buildDiagnosticsPrompt(standardDiag, scrapedData, currentPageData) {
  const pageTitle = scrapedData.title || currentPageData?.hostname || 'Unknown Page';
  const currentUrl = scrapedData.url || currentPageData?.url || 'Unknown URL';
  const pageType = currentPageData?.solutionType || detectPageType(currentUrl);
  const loadTime = scrapedData.performance?.loadTime;
  const domReady = scrapedData.performance?.domContentLoaded;
  const resourceCount = scrapedData.performance?.resourceCount;
  const consoleErrors = scrapedData.consoleErrors || [];
  const testDataFound = scrapedData.testData?.found || false;
  const expiredDates = scrapedData.expiredDates || [];
  const errorStates = scrapedData.error || 'None detected';
  const failedElements = scrapedData.cardsNotLoaded || [];

  return `You are an expert SAP system analyst providing diagnostics for presales, consultants, and technical users. Analyze this page and provide actionable insights in the structured format below.

# PAGE ANALYSIS DATA

**Current Page**: ${pageTitle}
**URL**: ${currentUrl}
**Page Type**: ${pageType || 'Unknown'}
**Timestamp**: ${new Date().toISOString()}

## Technical Metrics
- **Load Time**: ${loadTime || 'N/A'}ms
- **DOM Ready**: ${domReady || 'N/A'}ms  
- **Resources**: ${resourceCount || 0} loaded
- **Console Errors**: ${consoleErrors.length} found
- **Failed Elements**: ${failedElements.length} detected

## Content Analysis
- **Test Data Found**: ${testDataFound ? 'YES ⚠️' : 'No'}
- **Expired Dates**: ${expiredDates.length} detected
- **Error States**: ${errorStates}

# YOUR ANALYSIS TASK

Provide your response in this EXACT format:

## 🔍 QUICK SUMMARY
[2-3 sentences: What is this page? What's its current state? Any immediate concerns?]

## ⚡ KEY FINDINGS
**Performance**: [One line assessment]
**Functionality**: [One line assessment]  
**Data Quality**: [One line assessment]
**User Experience**: [One line assessment]

## 🎯 FOR PRESALES TEAMS
**Demo Readiness**: [Ready/Needs Attention/Not Ready + why]
**Customer Talking Points**: 
- [Key strength to highlight]
- [Value proposition visible]
- [Integration capability shown]

**Demo Risks**:
- [Potential issue 1]
- [Potential issue 2]

## 🔧 FOR CONSULTANTS  
**Implementation Insights**:
- [Configuration observation]
- [Integration point identified]
- [Customization detected]

**Client Guidance**:
- [Immediate recommendation]
- [Best practice suggestion]
- [Optimization opportunity]

## 🛠️ TECHNICAL DIAGNOSTICS
**System Health**: [Healthy/Degraded/Critical + reason]
**Issues Detected**:
${consoleErrors.slice(0, 3).map(error => `- ${error}`).join('\n') || '- None'}

**Performance Notes**:
- Load time: ${loadTime ? (loadTime > 3000 ? 'Slow' : loadTime > 1000 ? 'Moderate' : 'Fast') : 'Unknown'}
- Error rate: ${consoleErrors.length ? 'Elevated' : 'Normal'}

## 📋 ACTION ITEMS
**Immediate** (< 1 hour):
- [ ] [Most urgent task]
- [ ] [Quick fix needed]

**Short Term** (< 1 week):  
- [ ] [Important improvement]
- [ ] [Configuration task]

**Long Term** (> 1 week):
- [ ] [Strategic enhancement]
- [ ] [Major optimization]

## 🚨 ALERTS & WARNINGS
${testDataFound ? '⚠️ **TEST DATA DETECTED** - Not suitable for customer demos' : '✅ No test data visible'}
${expiredDates.length ? `⚠️ **EXPIRED CONTENT** - ${expiredDates.length} items need updating` : '✅ Content appears current'}
${consoleErrors.length > 5 ? '🔴 **HIGH ERROR RATE** - System stability concerns' : '✅ Error levels normal'}

## 💡 OPTIMIZATION OPPORTUNITIES
[3-4 specific, actionable recommendations based on what you observed]

---
*Analysis completed at ${new Date().toLocaleString()} | Based on live page data*`;
}

/**
 * Detect page type from URL for non-SAP pages
 * @param {string} url - Page URL
 * @returns {string} Page type classification
 */
function detectPageType(url) {
  if (!url) return 'Unknown';
  
  // SAP platforms
  if (url.includes('sapsf.com') || url.includes('successfactors')) return 'SuccessFactors';
  if (url.includes('s4hana') || url.includes('.ondemand.com')) return 'S/4HANA';
  if (url.includes('hana.ondemand') || url.includes('cfapps') || url.includes('build.cloud.sap')) return 'SAP BTP';
  if (url.includes('ibp.cloud.sap') || url.includes('ibplanning')) return 'SAP IBP';
  
  // Other platforms
  if (url.includes('salesforce.com')) return 'Salesforce';
  if (url.includes('workday.com')) return 'Workday';
  if (url.includes('oracle.com')) return 'Oracle';
  if (url.includes('microsoft.com') || url.includes('office.com')) return 'Microsoft';
  if (url.includes('github.com')) return 'GitHub';
  if (url.includes('stackoverflow.com')) return 'Stack Overflow';
  
  // Generic classification
  if (url.includes('localhost') || url.includes('127.0.0.1')) return 'Local Development';
  if (url.startsWith('chrome://') || url.startsWith('edge://')) return 'Browser Internal';
  
  return 'Web Application';
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

async function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.classList.add('active');
  
  // Initialize Settings UI
  setupSettingsTabs();
  
  // Initialize default tab (Quick Actions)
  loadQuickActionsTab();
  
  console.log('[Settings] Modal opened with Quick Actions tab initialized');
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
      
      // Initialize tab content when switching
      if (targetTab === 'quick-actions') {
        loadQuickActionsTab();
      } else if (targetTab === 'api-keys') {
        initializeAPIKeysTab();
      } else if (targetTab === 'backup') {
        initializeBackupTab();
      }
    });
  });
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

/**
 * Export edited Quick Actions as solutions.json file
 * This allows users to replace resources/solutions.json and rebuild the extension
 */
async function exportQuickActionsToJson() {
  try {
    console.log('[Export QA] Starting export...');
    
    // Get current solutions from global variable (already has edits)
    const solutionsData = { solutions: solutions };
    
    const jsonStr = JSON.stringify(solutionsData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `solutions-${timestamp}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    const qaCount = solutions.reduce((sum, sol) => sum + (sol.quickActions?.length || 0), 0);
    showToast(`Exported ${qaCount} Quick Actions ✓ | Replace resources/solutions.json and rebuild`, 'success');
    
  } catch (error) {
    console.error('[Export QA] Failed:', error);
    showToast('Failed to export Quick Actions', 'error');
  }
}

/**
 * Save all edited Quick Actions from the Settings tab.
 * Saves to a SINGLE 'solutions' key (global, not per-profile)
 */
async function saveAllQuickActions() {
  const listContainer = document.getElementById('qaEditableList');
  if (!listContainer) {
    console.error('[Save QA] Container not found!');
    return;
  }

  try {
    console.log('[Save QA] Starting save...');
    console.log('[Save QA] Current solutions:', solutions);
    
    // Deep clone to avoid mutating original
    let solutionsData = JSON.parse(JSON.stringify(solutions));
    
    let changesMade = 0;
    const changes = [];

    // Apply changes from the form
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

      // Find the solution and quick action
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

      // Check if changed
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
      showToast('No changes to save', 'info');
      return;
    }

    console.log('[Save QA] Saving to storage with key: "solutions"');
    console.log('[Save QA] Data to save:', solutionsData);
    
    // ✅ FIX: Save to SINGLE global 'solutions' key (matches loadSolutions)
    await chrome.storage.local.set({ solutions: solutionsData });
    
    // Verify save
    const verifyResult = await chrome.storage.local.get('solutions');
    console.log('[Save QA] Verification - data in storage:', verifyResult.solutions);
    
    // ✅ FIX: Update global solutions variable immediately
    solutions = solutionsData;
    console.log('[Save QA] Updated global solutions variable');

    showToast(`${changesMade} Quick Action(s) saved ✓`, 'success');
    
    // Re-render to show changes
    await renderAllProfilesQuickActions();
    await renderEnvironments();

  } catch (error) {
    console.error('[Save All Quick Actions] Failed:', error);
    showToast('Failed to save Quick Actions', 'error');
  }
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
      [`shortcuts_${profileId}`]: data.shortcuts || [],
      [`environments_${profileId}`]: data.environments || [],
      [`notes_${profileId}`]: data.notes || []
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
  console.log('[Collapsible Sections] Initializing...');
  
  // Load saved section states from storage (default: all expanded)
  const result = await chrome.storage.local.get('sectionStates');
  const sectionStates = result.sectionStates || {
    environments: true,  // true = expanded
    shortcuts: true,
    notes: true
  };
  
  console.log('[Collapsible Sections] Section states from storage:', sectionStates);
  
  // Apply saved states to all sections
  const sections = document.querySelectorAll('.section');
  console.log('[Collapsible Sections] Found', sections.length, 'sections');
  
  sections.forEach(section => {
    const sectionId = section.getAttribute('data-section');
    if (sectionId) {
      const savedState = sectionStates[sectionId];
      const isExpanded = savedState !== false; // Default to expanded if not set
      
      console.log(`[Collapsible Sections] Section "${sectionId}": savedState=${savedState}, isExpanded=${isExpanded}`);
      
      if (isExpanded) {
        section.classList.remove('collapsed');
        console.log(`[Collapsible Sections] ✓ Expanded: ${sectionId}`);
      } else {
        section.classList.add('collapsed');
        console.log(`[Collapsible Sections] ✗ Collapsed: ${sectionId}`);
      }
    }
  });
  
  // Setup toggle button handlers
  const toggleButtons = document.querySelectorAll('.section-toggle-btn');
  console.log('[Collapsible Sections] Found', toggleButtons.length, 'toggle buttons');
  
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const sectionId = btn.getAttribute('data-section');
      console.log('[Collapsible Sections] Toggle clicked for:', sectionId);
      await toggleSection(sectionId);
    });
  });
  
  // Update section count badges
  updateSectionCounts();
  
  console.log('[Collapsible Sections] ✅ Initialization complete');
}

/**
 * Toggle a section's collapsed state
 * @param {string} sectionId - The section ID (environments, shortcuts, notes)
 */
async function toggleSection(sectionId) {
  console.log('[Toggle] Starting toggle for:', sectionId);
  
  const section = document.querySelector(`.section[data-section="${sectionId}"]`);
  console.log('[Toggle] Section element found:', !!section);
  
  if (!section) {
    console.error('[Toggle] Section not found for ID:', sectionId);
    return;
  }
  
  // Toggle visual state FIRST
  section.classList.toggle('collapsed');
  
  // Then determine the NEW state based on what we just did
  const isNowCollapsed = section.classList.contains('collapsed');
  const newState = !isNowCollapsed; // true = expanded, false = collapsed
  
  console.log('[Toggle] After toggle, collapsed:', isNowCollapsed);
  console.log('[Toggle] Saving state (true=expanded):', newState);
  
  // Save state to storage
  const result = await chrome.storage.local.get('sectionStates');
  const sectionStates = result.sectionStates || {};
  sectionStates[sectionId] = newState;
  await chrome.storage.local.set({ sectionStates });
  console.log('[Toggle] ✅ State saved:', sectionStates);
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

  const enableAiFeaturesEl = document.getElementById('enableAiFeatures');
  if (enableAiFeaturesEl) {
    enableAiFeaturesEl.addEventListener('change', async (e) => {
      settings.enableAiFeatures = e.target.checked;
      await chrome.storage.sync.set({ enableAiFeatures: settings.enableAiFeatures });
      await updateAISettings();
    });
  }
  
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
  
  // Setup character counter for shortcut notes
  setupShortcutNotesCharacterCounter();
  
  // Setup note type change listener for AI features
  setupNoteTypeChangeListener();
  
  // Setup AI button handler
  setupAITestButtonHandlers();
  
  // Setup AI Search button handler
  setupAISearchHandler();
  
  document.getElementById('copyDiagnosticsBtn')?.addEventListener('click', showDiagnosticsModal);
  document.getElementById('closeDiagnosticsModal')?.addEventListener('click', closeDiagnosticsModal);
  document.getElementById('closeDiagnosticsBtn')?.addEventListener('click', closeDiagnosticsModal);
  document.getElementById('copyAllDiagnosticsBtn')?.addEventListener('click', copyAllDiagnostics);
  document.getElementById('regenerateDiagnosticsWithAIBtn')?.addEventListener('click', regenerateDiagnosticsWithAI);
  document.getElementById('saveDiagnosticsBtn')?.addEventListener('click', saveDiagnosticsAsNote);
  document.getElementById('downloadDiagnosticsBtn')?.addEventListener('click', downloadDiagnosticsReport);
  
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
  
  // Quick Actions export button
  document.getElementById('exportQaBtn')?.addEventListener('click', exportQuickActionsToJson);
  
  // API Keys buttons are now handled by initializeAPIKeysTab() when tab is opened
  // This prevents duplicate listeners and ensures proper initialization
  
  // Enterprise Calculator modal close buttons
  document.getElementById('closeEnterpriseCalculatorModal')?.addEventListener('click', closeEnterpriseCalculatorModal);
  document.getElementById('closeEnterpriseCalculatorBtn')?.addEventListener('click', closeEnterpriseCalculatorModal);
  
  // New simplified Settings handlers
  document.getElementById('exportAllBtn')?.addEventListener('click', exportJsonToFile);
  document.getElementById('importJsonBtn')?.addEventListener('click', importJsonFromFile);
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
  // Start with system profiles (removed "All Profiles" for simplicity)
  availableProfiles = [
    { id: 'profile-global', name: 'Global', icon: '⚡', description: 'Core SAP utilities for everyone', file: 'profile-global.json', type: 'system' },
    { id: 'profile-successfactors', name: 'SuccessFactors', icon: '👥', description: 'HR/HCM consultants & admins', file: 'profile-successfactors.json', type: 'system' },
    { id: 'profile-s4hana', name: 'S/4HANA', icon: '🏭', description: 'Clean Core & functional architects', file: 'profile-s4hana.json', type: 'system' },
    { id: 'profile-btp', name: 'BTP & Integration', icon: '🔧', description: 'Developers & technical architects', file: 'profile-btp.json', type: 'system' },
    { id: 'profile-executive', name: 'Executive & Sales', icon: '👔', description: 'CIOs, CTOs, presales engineers', file: 'profile-executive.json', type: 'system' },
    { id: 'profile-ai-joule', name: 'AI & Joule', icon: '🤖', description: 'AI prompts, Joule copilot, and generative AI resources', file: 'profile-ai-joule.json', type: 'system' },
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
    console.log('[Render QA] Starting render...');
    console.log('[Render QA] Current solutions in memory:', solutions);
    
    // USE THE GLOBAL SOLUTIONS VARIABLE (already loaded from storage or file)
    const baseSolutions = solutions;
    
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
    
    await performAISearch(searchQuery);
  });
  
  console.log('[AI Search] Handler attached successfully');
}

/**
 * Perform comprehensive AI-powered search across ALL profiles
 * @param {string} query - The search query
 */
async function performAISearch(query) {
  // Check if AI features are enabled
  if (!document.body.classList.contains('ai-active')) {
    showToast('AI features are disabled. Configure API keys in Settings.', 'warning');
    return;
  }
  
  // Check if ToolkitCore is loaded
  if (!window.ToolkitCore || !window.ToolkitCore.testPromptWithModel) {
    showToast('AI features not available', 'error');
    return;
  }
  
  try {
    // Show loading state
    const aiInsightsBar = document.getElementById('aiInsightsBar');
    const aiInsightsContent = document.getElementById('aiInsightsContent');
    
    if (!aiInsightsBar || !aiInsightsContent) {
      console.error('[AI Search] Insights bar elements not found');
      return;
    }
    
    aiInsightsBar.style.display = 'block';
    aiInsightsContent.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; padding: 12px;">
        <div class="spinner"></div>
        <span>🔍 Analyzing toolkit data across all profiles...</span>
      </div>
    `;
    
    // BUILD COMPREHENSIVE CONTEXT
    console.log('[AI Search] Building comprehensive context...');
    const context = await buildComprehensiveContext(query);
    
    // BUILD ENHANCED PROMPT
    const prompt = buildEnhancedPrompt(query, context);
    console.log('[AI Search] Prompt built with', context.stats.totalItems, 'items analyzed');
    
    // CALL AI
    const result = await window.ToolkitCore.testPromptWithModel(prompt);
    
    if (!result || !result.content) {
      throw new Error('No response from AI');
    }
    
    // DISPLAY RESULTS
    displayEnhancedAISearchResults(query, result.content, context);
    
  } catch (error) {
    console.error('[AI Search] Failed:', error);
    showToast(`AI search failed: ${error.message}`, 'error');
    
    const aiInsightsBar = document.getElementById('aiInsightsBar');
    if (aiInsightsBar) aiInsightsBar.style.display = 'none';
  }
}

/**
 * Build comprehensive context from ALL profiles and toolkit data
 * @param {string} query - User's search query
 * @returns {Object} Comprehensive context object
 */
async function buildComprehensiveContext(query) {
  console.log('[AI Search Context] Loading all profile data...');
  
  // 1. LOAD EVERYTHING
  const allData = await loadAllProfilesData();
  const currentPageInfo = currentPageData;
  const activeProfile = currentProfile;
  const allProfiles = availableProfiles;
  const allSolutions = solutions;
  
  // 2. GROUP DATA BY PROFILE
  const groupByProfile = (items) => {
    const grouped = {};
    items.forEach(item => {
      const profileId = item.profileId || 'unknown';
      if (!grouped[profileId]) {
        grouped[profileId] = {
          profileName: item.profileName,
          profileIcon: item.profileIcon,
          items: []
        };
      }
      grouped[profileId].items.push(item);
    });
    return grouped;
  };
  
  const environmentsByProfile = groupByProfile(allData.environments);
  const shortcutsByProfile = groupByProfile(allData.shortcuts);
  const notesByProfile = groupByProfile(allData.notes);
  
  // 3. BUILD COMPREHENSIVE SUMMARY
  const context = {
    query: query,
    
    // Active profile info
    activeProfile: {
      id: activeProfile,
      name: allProfiles.find(p => p.id === activeProfile)?.name || 'Unknown',
      icon: allProfiles.find(p => p.id === activeProfile)?.icon || '📁',
      itemCounts: {
        environments: environments.length,
        shortcuts: shortcuts.length,
        notes: notes.length
      }
    },
    
    // All profiles summary
    allProfiles: allProfiles.map(p => ({
      id: p.id,
      name: p.name,
      icon: p.icon || '📁',
      description: p.description || '',
      type: p.type
    })),
    
    // Cross-profile data grouped
    environmentsByProfile: environmentsByProfile,
    shortcutsByProfile: shortcutsByProfile,
    notesByProfile: notesByProfile,
    
    // Current context
    currentContext: {
      onSAPSystem: !!currentPageInfo,
      solutionType: currentPageInfo?.solutionType || 'none',
      hostname: currentPageInfo?.hostname || 'not on SAP system',
      datacenter: currentPageInfo?.datacenter || 'Unknown',
      environment: currentPageInfo?.environment || 'Unknown'
    },
    
    // Quick Actions available
    quickActions: allSolutions.map(s => ({
      solution: s.name,
      solutionId: s.id,
      actionsCount: s.quickActions?.length || 0,
      actions: (s.quickActions || []).map(qa => ({
        id: qa.id,
        name: qa.name,
        path: qa.path
      }))
    })),
    
    // Statistics
    stats: {
      totalProfiles: allProfiles.length,
      totalEnvironments: allData.environments.length,
      totalShortcuts: allData.shortcuts.length,
      totalNotes: allData.notes.length,
      totalQuickActions: allSolutions.reduce((sum, s) => sum + (s.quickActions?.length || 0), 0),
      totalItems: allData.environments.length + allData.shortcuts.length + allData.notes.length
    }
  };
  
  console.log('[AI Search Context] Built comprehensive context:', {
    profiles: context.stats.totalProfiles,
    items: context.stats.totalItems,
    environments: context.stats.totalEnvironments,
    shortcuts: context.stats.totalShortcuts,
    notes: context.stats.totalNotes,
    quickActions: context.stats.totalQuickActions
  });
  
  return context;
}

/**
 * Build enhanced AI prompt with full toolkit context
 * @param {string} query - User's search query
 * @param {Object} context - Comprehensive context object
 * @returns {string} - Enhanced prompt for AI
 */
function buildEnhancedPrompt(query, context) {
  // Build profiles list
  const profilesList = context.allProfiles.map(p => 
    `  • ${p.icon} ${p.name} (${p.type}) - ${p.description}`
  ).join('\n');
  
  // Build environments by profile
  const envsByProfile = Object.entries(context.environmentsByProfile).map(([profileId, data]) => {
    const items = data.items.slice(0, 5); // Limit to top 5 per profile
    return `  ${data.profileIcon} ${data.profileName} (${data.items.length}):
${items.map(env => `    - ${env.name} (${env.type}) - ${env.hostname}`).join('\n')}`;
  }).join('\n');
  
  // Build shortcuts by profile
  const shortcutsByProfile = Object.entries(context.shortcutsByProfile).map(([profileId, data]) => {
    const items = data.items.slice(0, 5);
    return `  ${data.profileIcon} ${data.profileName} (${data.items.length}):
${items.map(sc => `    - ${sc.name}`).join('\n')}`;
  }).join('\n');
  
  // Build notes by profile
  const notesByProfile = Object.entries(context.notesByProfile).map(([profileId, data]) => {
    const items = data.items.slice(0, 5);
    return `  ${data.profileIcon} ${data.profileName} (${data.items.length}):
${items.map(note => `    - ${note.title} (${note.noteType || 'note'})`).join('\n')}`;
  }).join('\n');
  
  // Build Quick Actions summary
  const quickActionsList = context.quickActions
    .filter(qa => qa.actionsCount > 0)
    .map(qa => `  ⚡ ${qa.solution} (${qa.actionsCount}): ${qa.actions.slice(0, 3).map(a => a.name).join(', ')}${qa.actionsCount > 3 ? '...' : ''}`)
    .join('\n');
  
  // Build the comprehensive prompt
  const prompt = `You are an intelligent search assistant for SAP Pro Toolkit, a productivity tool for SAP professionals.

## YOUR MISSION
Answer the user's query by analyzing ALL data across ALL profiles in the toolkit. Provide specific, actionable insights with exact counts, names, and profile recommendations.

## TOOLKIT DATA ANALYSIS

**Active Profile:** ${context.activeProfile.icon} ${context.activeProfile.name}
  - ${context.activeProfile.itemCounts.environments} environments
  - ${context.activeProfile.itemCounts.shortcuts} shortcuts
  - ${context.activeProfile.itemCounts.notes} notes

**All Available Profiles (${context.stats.totalProfiles}):**
${profilesList}

**Current Context:**
  - On SAP System: ${context.currentContext.onSAPSystem ? 'YES' : 'NO'}
  - Solution Type: ${context.currentContext.solutionType}
  - Hostname: ${context.currentContext.hostname}
  - Data Center: ${context.currentContext.datacenter}
  - Environment Type: ${context.currentContext.environment}

**Cross-Profile Data Summary:**
  - Total Environments: ${context.stats.totalEnvironments} across ${context.stats.totalProfiles} profiles
  - Total Shortcuts: ${context.stats.totalShortcuts}
  - Total Notes: ${context.stats.totalNotes}
  - Total Quick Actions: ${context.stats.totalQuickActions}

**Environments by Profile:**
${envsByProfile || '  (No environments)'}

**Shortcuts by Profile:**
${shortcutsByProfile || '  (No shortcuts)'}

**Notes by Profile:**
${notesByProfile || '  (No notes)'}

**Available Quick Actions:**
${quickActionsList || '  (No Quick Actions)'}

## YOUR TASK

User Query: "${query}"

Analyze the above toolkit data and provide:
1. **Specific answers** with exact counts and item names
2. **Profile recommendations** if better data exists in other profiles
3. **Quick Actions** if applicable to the query
4. **Relevant items** from the toolkit (environments, shortcuts, notes)
5. **Navigation suggestions** (which profile to switch to, which environment to use)

Be SPECIFIC and ACTIONABLE. Examples of good responses:
- "Found 3 SuccessFactors environments: 'SF Prod DC15', 'SF Preview DC20', 'SF Sandbox'. Currently in '${context.activeProfile.name}' profile. Switch to 'SuccessFactors' profile for 15 SF-specific shortcuts."
- "You have 2 AI prompts related to Joule in the 'AI & Joule' profile notes section. Switch to that profile to access them."
- "Quick Action available for your current system: Navigate to Admin Center. You're on ${context.currentContext.hostname}."

Provide your analysis now:`;

  console.log('[AI Search] Prompt length:', prompt.length, 'characters');
  return prompt;
}

/**
 * Display enhanced AI search results WITHOUT action buttons
 * @param {string} query - Original search query
 * @param {string} response - AI response content
 * @param {Object} context - Comprehensive context object
 */
function displayEnhancedAISearchResults(query, response, context) {
  const aiInsightsContent = document.getElementById('aiInsightsContent');
  
  if (!aiInsightsContent) return;
  
  // Use markdownToHTML utility for clean formatting
  const formattedResponse = markdownToHTML(response);
  
  const html = `
    <div style="padding: 12px;">
      <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border);">
        <strong>🔍 "${query}"</strong><br>
        <span style="opacity: 0.8;">📊 Analyzed ${context.stats.totalEnvironments} environments, ${context.stats.totalShortcuts} shortcuts, ${context.stats.totalNotes} notes across ${context.stats.totalProfiles} profiles</span>
      </div>
      
      <div class="ai-response" style="font-size: 13px; line-height: 1.6; color: var(--text-primary);">
        ${formattedResponse}
      </div>
      
      <div style="margin-top: 16px; padding: 12px; background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10B981; border-radius: 4px; font-size: 11px; line-height: 1.5; color: var(--text-secondary);">
        <strong style="color: #10B981;">✨ AI INSIGHTS</strong><br>
        This response was generated by AI analyzing your toolkit data. While AI provides helpful insights, always verify information independently before making decisions.
      </div>
    </div>
  `;
  
  aiInsightsContent.innerHTML = html;
  showToast('AI search complete ✓', 'success');
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

/**
 * Load LLM pricing data from JSON file
 * Cached after first load
 * NOTE: llmPricingData variable is declared in ai-features.js
 */
async function loadLLMPricing() {
  if (llmPricingData) return llmPricingData;
  
  try {
    const response = await fetch(chrome.runtime.getURL('resources/llm-pricing.json'));
    llmPricingData = await response.json();
    console.log('[AI] Loaded pricing data for', Object.keys(llmPricingData.models).length, 'models');
    return llmPricingData;
  } catch (error) {
    console.error('[AI] Failed to load pricing data:', error);
    showToast('Failed to load pricing data', 'error');
    return null;
  }
}

/**
 * Fuzzy lookup for model pricing using keyword matching
 * @param {string} modelId - Model identifier from API response
 * @param {Object} pricingData - Loaded pricing data from llm-pricing.json
 * @returns {Object|null} Pricing object with input/output costs or null
 */
function lookupModelPricing(modelId, pricingData) {
  if (!modelId || !pricingData || !pricingData.models) return null;
  
  const modelLower = modelId.toLowerCase();
  
  // Define keyword mappings for fuzzy matching
  const keywordMap = {
    // Claude models (order matters - check specific versions first)
    'sonnet-4.5': 'claude-3-5-sonnet-20240620',
    'sonnet-3.5': 'claude-3-5-sonnet-20240620',
    'opus': 'claude-3-opus-20240229',
    'sonnet': 'claude-3-sonnet-20240229',
    'haiku': 'claude-3-haiku-20240307',
    
    // OpenAI models
    'gpt-4-turbo': 'gpt-4-turbo',
    'gpt-4': 'gpt-4',
    'gpt-3.5': 'gpt-3.5-turbo',
    'gpt-35': 'gpt-3.5-turbo'
  };
  
  // Try keyword matching
  for (const [keyword, pricingKey] of Object.entries(keywordMap)) {
    if (modelLower.includes(keyword)) {
      // Check if this is SAP AI Core (prefer sap-ai-core-* variants)
      if (modelLower.includes('sap') || modelLower.includes('ai-core') || modelLower.includes('anthropic--') || modelLower.includes('openai--')) {
        // Try SAP AI Core variant first
        const sapVariants = [
          'sap-ai-core-gpt-4',
          'sap-ai-core-gpt-35-turbo',
          'sap-ai-core-claude-3-sonnet'
        ];
        
        for (const sapKey of sapVariants) {
          if (sapKey.includes(keyword.replace('.', '')) || sapKey.includes(keyword.split('-')[0])) {
            if (pricingData.models[sapKey]) {
              console.log('[AI Pricing] Matched SAP AI Core variant:', modelId, '→', sapKey);
              return pricingData.models[sapKey];
            }
          }
        }
      }
      
      // Fall back to base model pricing
      if (pricingData.models[pricingKey]) {
        console.log('[AI Pricing] Matched base model:', modelId, '→', pricingKey);
        return pricingData.models[pricingKey];
      }
    }
  }
  
  console.warn('[AI Pricing] No pricing found for model:', modelId);
  return null;
}

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
    showToast('Running AI prompt...', 'info');
    
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
async function saveAIResponseAsNote(fallbackResult) {
  const modal = document.getElementById('aiTestResultsModal');
  
  // Prioritize reading from the modal's dataset attributes
  let responseContent = modal.dataset.responseContent;
  let modelName = modal.dataset.modelName;
  let provider = modal.dataset.provider;
  let inputTokens = modal.dataset.inputTokens;
  let outputTokens = modal.dataset.outputTokens;
  let totalCost = modal.dataset.totalCost; // may not be available

  // Fallback to the argument if dataset is not available
  if (!responseContent || !modelName) {
    if (fallbackResult && fallbackResult.responseContent) {
        responseContent = fallbackResult.responseContent;
        modelName = fallbackResult.modelData.model;
        provider = fallbackResult.modelData.provider;
        inputTokens = fallbackResult.inputTokens;
        outputTokens = fallbackResult.outputTokens;
        totalCost = fallbackResult.costs.totalCost;
    } else {
      showToast('No response content to save', 'warning');
      return;
    }
  }
  
  try {
    const timestamp = new Date().toLocaleString();
    const title = `AI Response - ${provider} ${modelName}`;
    
    const cleanResponse = stripMarkdown(responseContent);
    
    let costLine = totalCost ? `Cost: $${totalCost}\n` : '';

    const content = `${cleanResponse}

---
Model: ${provider} - ${modelName}
Input Tokens: ${Number(inputTokens).toLocaleString()}
Output Tokens: ${Number(outputTokens).toLocaleString()}
${costLine}Generated: ${timestamp}`;
    
    const noteObject = {
      id: `note-${Date.now()}`,
      title,
      content,
      icon: 'ai',
      noteType: 'ai-prompt',
      tags: ['ai', 'llm-response', provider ? provider.toLowerCase() : 'ai'],
      timestamp: Date.now(),
      aiConfig: {
        defaultModel: modelName,
        provider: provider
      }
    };
    
    notes.push(noteObject);
    
    const storageKey = `notes_${currentProfile}`;
    await chrome.storage.local.set({ [storageKey]: notes });
    
    renderNotes();
    closeAiTestResultsModal();
    
    showToast('Response saved as a note ✓', 'success');
    
  } catch (error) {
    console.error('[Save AI Response] Failed:', error);
    showToast(`Failed to save: ${error.message}`, 'error');
  }
}

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

/**
 * Setup character counter for shortcut notes field (5000 char limit)
 */
function setupShortcutNotesCharacterCounter() {
  const notesInput = document.getElementById('shortcutNotes');
  const counter = document.getElementById('shortcutNotesCounter');
  
  if (!notesInput || !counter) return;
  
  function updateCounter() {
    const length = notesInput.value.length;
    const maxLength = 5000;
    const percentage = (length / maxLength) * 100;
    
    counter.textContent = `${length.toLocaleString()}/${maxLength.toLocaleString()}`;
    
    // Color coding: orange at 80%, red at 95%
    if (percentage >= 95) {
      counter.style.color = '#EF4444';
      counter.style.fontWeight = '700';
    } else if (percentage >= 80) {
      counter.style.color = '#F59E0B';
      counter.style.fontWeight = '600';
    } else {
      counter.style.color = 'var(--text-secondary)';
      counter.style.fontWeight = '400';
    }
  }
  
  // Update on input
  notesInput.addEventListener('input', updateCounter);
  
  // Update when modal opens
  const modal = document.getElementById('addShortcutModal');
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
