// SF Pro Toolkit - Side Panel Edition
// Enhanced with Starter Pack Import System
// Uses shared toolkit-core.js for common functionality

// ==================== STATE ====================

let currentPageData = null;
let shortcuts = [];
let environments = [];
let notes = [];
let settings = { showConfirmationForProd: true };

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const detectedLang = await detectLanguage();
    await chrome.storage.local.set({ detectedLanguage: detectedLang });
    initI18n();
    
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
  const result = await chrome.storage.local.get('shortcuts');
  shortcuts = result.shortcuts || [];
  
  // Add default Product Roadmap shortcut if no shortcuts exist
  if (shortcuts.length === 0) {
    shortcuts = [{
      id: `shortcut-${Date.now()}`,
      name: 'Product Roadmap',
      url: 'https://roadmaps.sap.com/board?PRODUCT=089E017A62AB1EDA94C15F5EDB3320E1',
      notes: 'SAP SuccessFactors Product Roadmap',
      icon: '0',
      tags: ['roadmap']
    }];
    await chrome.storage.local.set({ shortcuts });
  }
  
  // Render shortcuts after ensuring data is loaded
  renderShortcuts();
}

async function loadEnvironments() {
  const result = await chrome.storage.local.get('environments');
  environments = result.environments || [];
  renderEnvironments();
}

async function loadNotes() {
  const result = await chrome.storage.local.get('notes');
  notes = result.notes || [];
  renderNotes();
}

async function loadCurrentPageData() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      showContextBanner(null);
      return;
    }
    
    if (!isSFPage(tab.url)) {
      showContextBanner(null);
      return;
    }
    
    const messagePromise = new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: 'getPageData' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('[SAP Pro Toolkit] Content script message failed, using URL detection');
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
      console.log('[SAP Pro Toolkit] Using enhanced data from content script:', currentPageData);
    } else {
      currentPageData = detectEnvironmentFromURL(tab.url);
      console.log('[SAP Pro Toolkit] Using URL-based detection:', currentPageData);
    }
    
    showContextBanner(currentPageData);
    highlightActiveStates(tab.url);
    
  } catch (error) {
    console.error('[SAP Pro Toolkit] Failed to load page data:', error);
    showContextBanner(null);
  }
}

// ==================== UI RENDERING - INSTANCE CARD ====================

function showContextBanner(data) {
  const card = document.getElementById('instanceCard');
  
  if (!data) {
    card.style.display = 'none';
    return;
  }
  
  card.style.display = 'flex';
  
  const envType = data.environment || 'unknown';
  const emoji = ENV_EMOJIS[envType];
  const label = ENV_LABELS[envType];
  const flag = data.country && COUNTRY_FLAGS[data.country] ? COUNTRY_FLAGS[data.country] : '';
  
  document.getElementById('instanceEmoji').textContent = emoji;
  document.getElementById('instanceType').textContent = label;
  
  let metaText = '';
  if (data.datacenter && data.datacenter !== 'Unknown') {
    metaText += data.datacenter;
  }
  if (data.region && data.region !== 'Unknown') {
    metaText += metaText ? ' • ' : '';
    metaText += `${flag} ${data.region}`;
  }
  
  document.getElementById('instanceMeta').textContent = metaText || 'Unknown Region';
}

// ==================== UI RENDERING - ENVIRONMENTS ====================

function renderEnvironments() {
  const tbody = document.getElementById('environmentList');
  
  if (environments.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="4">
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
  
  let currentHostname = null;
  if (currentPageData && currentPageData.hostname) {
    currentHostname = currentPageData.hostname;
  }
  
  tbody.innerHTML = environments.map(env => {
    const emoji = ENV_EMOJIS[env.type];
    const isActive = currentHostname && currentHostname === env.hostname;
    
    return `
      <tr class="env-row ${env.type}-env ${isActive ? 'active-row' : ''}" data-env-id="${env.id}">
        <td class="env-name-cell" style="padding-left: 12px;">
          <div class="env-name">
            <span class="status-dot ${env.type} ${isActive ? 'active' : ''}"></span>
            ${env.name}
          </div>
          <div class="env-hostname">${env.hostname}</div>
        </td>
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
            ` : '<span class="env-badge active">ACTIVE</span>'}
            <button class="kebab-btn" data-id="${env.id}" title="More actions">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
            <div class="dropdown-menu" data-dropdown-id="${env.id}">
              <button class="dropdown-item edit-action" data-id="${env.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </button>
              <button class="dropdown-item danger delete-action" data-id="${env.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete
              </button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  attachEnvironmentListeners();
}

function attachEnvironmentListeners() {
  document.querySelectorAll('.switch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const hostname = btn.getAttribute('data-hostname');
      const type = btn.getAttribute('data-type');
      switchEnvironment(hostname, type);
    });
  });
  
  // Kebab menu toggle
  document.querySelectorAll('.kebab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const dropdown = document.querySelector(`.dropdown-menu[data-dropdown-id="${id}"]`);
      
      // Close all other dropdowns
      document.querySelectorAll('.dropdown-menu').forEach(d => {
        if (d !== dropdown) d.classList.remove('active');
      });
      
      dropdown?.classList.toggle('active');
    });
  });
  
  // Edit action from dropdown
  document.querySelectorAll('.edit-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      editEnvironment(id);
      document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('active'));
    });
  });
  
  // Delete action from dropdown
  document.querySelectorAll('.delete-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      deleteEnvironment(id);
      document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('active'));
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
            <button class="kebab-btn" data-id="${shortcut.id}" title="More actions" tabindex="0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
            <div class="dropdown-menu" data-dropdown-id="${shortcut.id}">
              <button class="dropdown-item edit-action" data-id="${shortcut.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </button>
              <button class="dropdown-item danger delete-action" data-id="${shortcut.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete
              </button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  attachShortcutListeners();
}

function attachShortcutListeners() {
  console.log('[DEBUG] attachShortcutListeners() called');
  console.log('[DEBUG] Found .edit-action buttons:', document.querySelectorAll('.shortcut-actions-cell .edit-action').length);
  console.log('[DEBUG] Found .kebab-btn buttons:', document.querySelectorAll('.shortcut-actions-cell .kebab-btn').length);
  
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
      if (e.target.closest('.icon-btn, .kebab-btn, .dropdown-menu')) return;
      const url = row.getAttribute('data-url');
      const builtUrl = buildShortcutUrl({ url }, currentPageData);
      if (builtUrl) {
        navigateToShortcut(builtUrl);
      } else {
        showToast('Cannot navigate: No active SF instance detected', 'warning');
      }
    });
  });
  
  // Kebab menu toggle
  document.querySelectorAll('.shortcut-actions-cell .kebab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const dropdown = document.querySelector(`.dropdown-menu[data-dropdown-id="${id}"]`);
      
      // Close all other dropdowns
      document.querySelectorAll('.dropdown-menu').forEach(d => {
        if (d !== dropdown) d.classList.remove('active');
      });
      
      dropdown?.classList.toggle('active');
    });
    
    // Keyboard support
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });
  
  // Edit action
  document.querySelectorAll('.shortcut-actions-cell .edit-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      editShortcut(id);
      document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('active'));
    });
  });
  
  // Delete action
  document.querySelectorAll('.shortcut-actions-cell .delete-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      deleteShortcut(id);
      document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('active'));
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
            <button class="icon-btn primary copy-btn" data-id="${note.id}" title="Copy note content" tabindex="0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
            <button class="kebab-btn" data-id="${note.id}" title="More actions" tabindex="0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
            <div class="dropdown-menu" data-dropdown-id="${note.id}">
              <button class="dropdown-item edit-action" data-id="${note.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </button>
              <button class="dropdown-item danger delete-action" data-id="${note.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete
              </button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  attachNoteListeners();
}

function attachNoteListeners() {
  document.querySelectorAll('.note-actions-cell .copy-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      await copyNoteContent(id, btn);
    });
    
    // Keyboard support
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });
  
  // Kebab menu toggle
  document.querySelectorAll('.note-actions-cell .kebab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const dropdown = document.querySelector(`.dropdown-menu[data-dropdown-id="${id}"]`);
      
      // Close all other dropdowns
      document.querySelectorAll('.dropdown-menu').forEach(d => {
        if (d !== dropdown) d.classList.remove('active');
      });
      
      dropdown?.classList.toggle('active');
    });
    
    // Keyboard support
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });
  
  // Edit action
  document.querySelectorAll('.note-actions-cell .edit-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      editNote(id);
      document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('active'));
    });
  });
  
  // Delete action
  document.querySelectorAll('.note-actions-cell .delete-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      deleteNote(id);
      document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('active'));
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
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
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
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
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
  document.getElementById('addEnvModal').setAttribute('data-edit-id', id);
  document.querySelector('#addEnvModal .modal-header h3').textContent = 'Edit Environment';
  
  openAddEnvironmentModal();
}

async function deleteEnvironment(id) {
  const env = environments.find(e => e.id === id);
  if (!env) return;
  
  const confirmed = confirm(`Delete environment "${env.name}"?`);
  if (!confirmed) return;
  
  environments = environments.filter(e => e.id !== id);
  await chrome.storage.local.set({ environments });
  
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
  
  // Validation 3: Remove trailing slashes or paths
  hostname = hostname.split('/')[0];
  
  // Validation 4: Check for valid hostname format (no spaces, valid characters)
  if (/\s/.test(hostname)) {
    showToast('Hostname cannot contain spaces', 'error');
    document.getElementById('envHostname').focus();
    return;
  }
  
  if (!/^[a-zA-Z0-9.-]+$/.test(hostname)) {
    showToast('Hostname contains invalid characters. Use only letters, numbers, dots, and hyphens', 'error');
    document.getElementById('envHostname').focus();
    return;
  }
  
  // Validation 5: Check for valid SuccessFactors domain
  const sfDomains = ['hr.cloud.sap', 'sapsf.com', 'sapsf.cn', 'sapcloud.cn',
                     'successfactors.eu', 'sapsf.eu', 'successfactors.com'];
  const isValidSFHostname = sfDomains.some(domain => hostname.includes(domain));
  
  if (!isValidSFHostname) {
    showToast('Must be a valid SuccessFactors hostname (e.g., company.sapsf.com)', 'error');
    document.getElementById('envHostname').focus();
    return;
  }
  
  // Update the cleaned hostname value
  document.getElementById('envHostname').value = hostname;
  
  // Save environment
  const modal = document.getElementById('addEnvModal');
  const editId = modal.getAttribute('data-edit-id');
  
  try {
    if (editId) {
      environments = environments.filter(e => e.id !== editId);
      environments.unshift({ id: editId, name, type, hostname });
      showToast('Environment updated ✓', 'success');
      modal.removeAttribute('data-edit-id');
    } else {
      const newEnv = { id: `env-${Date.now()}`, name, type, hostname };
      environments.unshift(newEnv);
      showToast('Environment saved ✓', 'success');
    }
    
    await chrome.storage.local.set({ environments });
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
  
  const isAbsolute = url.startsWith('http://') || url.startsWith('https://');
  const isRelative = url.startsWith('/');
  
  if (!isAbsolute && !isRelative) {
    showToast('URL must start with http://, https://, or / (for relative paths)', 'warning');
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
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
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
  loadDisplayModeSetting();
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
      await chrome.storage.local.set({ environments });
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

async function downloadTemplate() {
  try {
    const response = await fetch(chrome.runtime.getURL('resources/toolkit-template.json'));
    const template = await response.json();
    
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
  
  document.getElementById('displayModePopup')?.addEventListener('change', (e) => {
    if (e.target.checked) saveDisplayMode('popup');
  });
  document.getElementById('displayModeSidePanel')?.addEventListener('change', (e) => {
    if (e.target.checked) saveDisplayMode('sidepanel');
  });
  
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });
}
