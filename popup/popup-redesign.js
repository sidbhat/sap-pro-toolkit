// SF Pro Toolkit - Popup Redesign Logic
// Card-based dashboard with instant actions

// ==================== I18N INITIALIZATION ====================

async function detectLanguage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && isSFPage(tab.url)) {
      const url = new URL(tab.url);
      
      const localeParam = url.searchParams.get('locale');
      if (localeParam) {
        const lang = localeParam.split('_')[0];
        console.log('[SF Pro Toolkit] Language detected from URL locale parameter:', lang);
        return lang;
      }
      
      const pathMatch = url.pathname.match(/\/([a-z]{2}_[A-Z]{2})\//);
      if (pathMatch) {
        const lang = pathMatch[1].split('_')[0];
        console.log('[SF Pro Toolkit] Language detected from URL path:', lang);
        return lang;
      }
    }
  } catch (error) {
    console.log('[SF Pro Toolkit] Error detecting language from URL:', error);
  }
  
  const browserLang = navigator.language.split('-')[0];
  console.log('[SF Pro Toolkit] Using browser language:', browserLang);
  return browserLang;
}

function initI18n() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = chrome.i18n.getMessage(key) || element.textContent;
  });
  
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    element.title = chrome.i18n.getMessage(key) || element.title;
  });
  
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = chrome.i18n.getMessage(key) || element.placeholder;
  });
}

// ==================== CONSTANTS ====================

const ENV_COLORS = {
  'production': '#ef4444',
  'preview': '#10b981',
  'sales': '#f59e0b',
  'sandbox': '#a855f7',
  'unknown': '#6b7280'
};

const ENV_EMOJIS = {
  'production': '🔴',
  'preview': '🟢',
  'sales': '🟠',
  'sandbox': '🟣',
  'unknown': '⚫'
};

const ENV_LABELS = {
  'production': 'PRODUCTION',
  'preview': 'PREVIEW',
  'sales': 'SALES',
  'sandbox': 'SANDBOX',
  'unknown': 'UNKNOWN'
};

const COUNTRY_FLAGS = {
  'AE': '🇦🇪', 'SA': '🇸🇦', 'CN': '🇨🇳', 'DE': '🇩🇪',
  'US': '🇺🇸', 'CA': '🇨🇦', 'JP': '🇯🇵', 'SG': '🇸🇬',
  'NL': '🇳🇱', 'BR': '🇧🇷', 'AU': '🇦🇺', 'CH': '🇨🇭', 'IN': '🇮🇳'
};

const MAX_VISIBLE_SHORTCUTS = 6;

// ==================== STATE ====================

let currentPageData = null;
let datacenterDB = null;
let shortcuts = [];
let environments = [];
let notes = [];
let settings = { showConfirmationForProd: true };
let showingAllShortcuts = false;

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const detectedLang = await detectLanguage();
    await chrome.storage.local.set({ detectedLanguage: detectedLang });
    initI18n();
    
    await loadDatacenterDB();
    await loadSettings();
    await loadShortcuts();
    await loadEnvironments();
    await loadNotes();
    await loadCurrentPageData();
    setupEventListeners();
  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Failed to initialize extension', 'error');
  }
});

// ==================== DATA LOADING ====================

async function loadDatacenterDB() {
  try {
    const response = await fetch(chrome.runtime.getURL('resources/dc.json'));
    datacenterDB = await response.json();
  } catch (error) {
    console.error('Failed to load datacenter DB:', error);
    datacenterDB = [];
  }
}

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
      icon: '🗺️'
    }];
    await chrome.storage.local.set({ shortcuts });
  }
  
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
    
    // Try to get enhanced data from content script with timeout
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
    
    // Set timeout for message response
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 500));
    
    // Race between message response and timeout
    const response = await Promise.race([messagePromise, timeoutPromise]);
    
    // Use response if available, otherwise fall back to URL detection
    if (response && response.hostname) {
      currentPageData = response;
      console.log('[SF Pro Toolkit] Using enhanced data from content script:', currentPageData);
    } else {
      currentPageData = detectEnvironmentFromURL(tab.url);
      console.log('[SF Pro Toolkit] Using URL-based detection:', currentPageData);
    }
    
    showContextBanner(currentPageData);
    highlightActiveStates(tab.url);
    
  } catch (error) {
    console.error('[SF Pro Toolkit] Failed to load page data:', error);
    showContextBanner(null);
  }
}

// ==================== ENVIRONMENT DETECTION ====================

function isSFPage(url) {
  if (!url) return false;
  const sfDomains = ['hr.cloud.sap', 'sapsf.com', 'sapsf.cn', 'sapcloud.cn', 
                      'successfactors.eu', 'sapsf.eu', 'successfactors.com'];
  return sfDomains.some(domain => url.includes(domain));
}

function detectEnvironmentFromURL(url) {
  const hostname = new URL(url).hostname;
  
  const dcEntry = datacenterDB.find(dc => 
    dc.csd_hostname === hostname || 
    dc.old_hostname === hostname ||
    dc.sales_hostname === hostname
  );
  
  if (dcEntry) {
    return {
      environment: dcEntry.environment.toLowerCase(),
      datacenter: dcEntry.datacenter,
      hostname: hostname,
      country: dcEntry.country,
      platform: dcEntry.platform,
      region: dcEntry.region,
      apiHostname: dcEntry.api_hostname,
      detectedVia: 'hostname-lookup'
    };
  }
  
  const envType = detectEnvironmentHeuristic(hostname);
  return {
    environment: envType,
    datacenter: 'Unknown',
    hostname: hostname,
    country: 'Unknown',
    platform: 'Unknown',
    region: 'Unknown',
    apiHostname: 'Unknown',
    detectedVia: 'heuristic'
  };
}

function detectEnvironmentHeuristic(hostname) {
  if (hostname.includes('preview')) return 'preview';
  if (hostname.includes('sales') || hostname.includes('demo')) return 'sales';
  if (hostname.includes('sandbox') || hostname.includes('test')) return 'sandbox';
  return 'production';
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
  
  // Update instance card: "TYPE • DC • Flag Region"
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

// ==================== UI RENDERING - ENVIRONMENTS (TABLE-BASED) ====================

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
  
  // Check if current page matches any environment
  let currentHostname = null;
  if (currentPageData && currentPageData.hostname) {
    currentHostname = currentPageData.hostname;
  }
  
  tbody.innerHTML = environments.map(env => {
    const emoji = ENV_EMOJIS[env.type];
    const isActive = currentHostname && currentHostname === env.hostname;
    
    return `
      <tr class="env-row ${isActive ? 'active-row' : ''}" data-env-id="${env.id}">
        <td class="env-icon-cell">
          <span class="env-icon">${emoji}</span>
        </td>
        <td class="env-name-cell">
          <div class="env-name">${env.name}</div>
          <div class="env-hostname">${env.hostname}</div>
        </td>
        <td class="env-status-cell">
          ${isActive ? '<span class="status-badge active-badge">ACTIVE</span>' : ''}
        </td>
        <td class="env-actions-cell">
          ${!isActive ? `<button class="table-btn switch-btn" data-hostname="${env.hostname}" data-type="${env.type}">Switch</button>` : ''}
          <button class="table-btn edit-btn" data-id="${env.id}">Edit</button>
          <button class="table-btn delete-btn" data-id="${env.id}">Delete</button>
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
  
  document.querySelectorAll('.env-actions-cell .edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      editEnvironment(id);
    });
  });
  
  document.querySelectorAll('.env-actions-cell .delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      deleteEnvironment(id);
    });
  });
}

// ==================== UI RENDERING - SHORTCUTS (TABLE-BASED) ====================

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
  
  tbody.innerHTML = shortcuts.map(shortcut => `
    <tr class="shortcut-row" data-shortcut-id="${shortcut.id}" data-url="${shortcut.url}">
      <td class="shortcut-icon-cell">
        <span class="shortcut-icon">${shortcut.icon || '📄'}</span>
      </td>
      <td class="shortcut-name-cell">
        <div class="shortcut-name">${shortcut.name}</div>
        ${shortcut.notes ? `<div class="shortcut-notes">${shortcut.notes}</div>` : ''}
      </td>
      <td class="shortcut-actions-cell">
        <button class="table-btn edit-btn" data-id="${shortcut.id}">Edit</button>
        <button class="table-btn delete-btn" data-id="${shortcut.id}">Delete</button>
      </td>
    </tr>
  `).join('');
  
  attachShortcutListeners();
}

function attachShortcutListeners() {
  // Click on row to navigate (except on buttons)
  document.querySelectorAll('.shortcut-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.table-btn')) return;
      
      const url = row.getAttribute('data-url');
      navigateToShortcut(url);
    });
  });
  
  // Edit button
  document.querySelectorAll('.shortcut-actions-cell .edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      editShortcut(id);
    });
  });
  
  // Delete button
  document.querySelectorAll('.shortcut-actions-cell .delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      deleteShortcut(id);
    });
  });
}

// ==================== UI RENDERING - NOTES (TABLE-BASED) ====================

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
    // Truncate content for preview (show first 60 chars)
    const contentPreview = note.content 
      ? (note.content.length > 60 ? note.content.substring(0, 60) + '...' : note.content)
      : '';
    
    return `
      <tr class="note-row" data-note-id="${note.id}">
        <td class="note-icon-cell">
          <span class="note-icon">${note.icon || '📝'}</span>
        </td>
        <td class="note-content-cell">
          <div class="note-title">${note.title}</div>
          ${contentPreview ? `<div class="note-preview">${contentPreview}</div>` : ''}
        </td>
        <td class="note-actions-cell">
          <button class="table-btn copy-btn" data-id="${note.id}">Copy</button>
          <button class="table-btn edit-btn" data-id="${note.id}">Edit</button>
          <button class="table-btn delete-btn" data-id="${note.id}">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
  
  attachNoteListeners();
}

function attachNoteListeners() {
  // Copy button
  document.querySelectorAll('.note-actions-cell .copy-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      await copyNoteContent(id);
    });
  });
  
  // Edit button
  document.querySelectorAll('.note-actions-cell .edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      editNote(id);
    });
  });
  
  // Delete button
  document.querySelectorAll('.note-actions-cell .delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      deleteNote(id);
    });
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
  
  // Filter environments
  document.querySelectorAll('.env-row').forEach(row => {
    const name = row.querySelector('.env-name')?.textContent.toLowerCase() || '';
    const hostname = row.querySelector('.env-hostname')?.textContent.toLowerCase() || '';
    const matches = name.includes(term) || hostname.includes(term);
    row.style.display = matches ? '' : 'none';
  });
  
  // Filter shortcuts
  document.querySelectorAll('.shortcut-row').forEach(row => {
    const name = row.querySelector('.shortcut-name')?.textContent.toLowerCase() || '';
    const notes = row.querySelector('.shortcut-notes')?.textContent.toLowerCase() || '';
    const matches = name.includes(term) || notes.includes(term);
    row.style.display = matches ? '' : 'none';
  });
  
  // Filter notes
  document.querySelectorAll('.note-row').forEach(row => {
    const title = row.querySelector('.note-title')?.textContent.toLowerCase() || '';
    const preview = row.querySelector('.note-preview')?.textContent.toLowerCase() || '';
    const matches = title.includes(term) || preview.includes(term);
    row.style.display = matches ? '' : 'none';
  });
}

// ==================== ACTIVE STATE HIGHLIGHTING ====================

function highlightActiveStates(currentURL) {
  // Highlight active environment (already done in renderEnvironments)
  
  // Highlight active shortcuts
  document.querySelectorAll('.shortcut-row').forEach(row => {
    const url = row.getAttribute('data-url');
    const isActive = currentURL && url && currentURL.includes(url);
    row.classList.toggle('active-row', isActive);
  });
}

// ==================== NAVIGATION ====================

async function navigateToShortcut(url) {
  try {
    await chrome.tabs.update({ url: url });
    window.close();
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
    window.close();
  } catch (error) {
    console.error('Environment switch error:', error);
    showToast('Failed to switch environment', 'error');
  }
}

// ==================== CRUD OPERATIONS - ENVIRONMENTS ====================

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
  const hostname = document.getElementById('envHostname').value.trim();
  
  if (!name || !hostname) {
    showToast('Please fill in required fields', 'warning');
    return;
  }
  
  const sfDomains = ['hr.cloud.sap', 'sapsf.com', 'sapsf.cn', 'sapcloud.cn',
                     'successfactors.eu', 'sapsf.eu', 'successfactors.com'];
  const isValidSFHostname = sfDomains.some(domain => hostname.includes(domain));
  
  if (!isValidSFHostname) {
    showToast('Please enter a valid SuccessFactors hostname', 'error');
    return;
  }
  
  const modal = document.getElementById('addEnvModal');
  const editId = modal.getAttribute('data-edit-id');
  
  if (editId) {
    const index = environments.findIndex(e => e.id === editId);
    if (index !== -1) {
      environments[index] = { ...environments[index], name, type, hostname };
      showToast('Environment updated ✓', 'success');
    }
    modal.removeAttribute('data-edit-id');
  } else {
    const newEnv = { id: `env-${Date.now()}`, name, type, hostname };
    environments.unshift(newEnv);
    showToast('Environment saved ✓', 'success');
  }
  
  await chrome.storage.local.set({ environments });
  renderEnvironments();
  closeAddEnvironmentModal();
}

// ==================== CRUD OPERATIONS - SHORTCUTS ====================

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
  if (!shortcut) return;
  
  document.getElementById('shortcutName').value = shortcut.name;
  document.getElementById('shortcutPath').value = shortcut.url;
  document.getElementById('shortcutNotes').value = shortcut.notes || '';
  document.getElementById('shortcutIcon').value = shortcut.icon || '📄';
  document.getElementById('addShortcutModal').setAttribute('data-edit-id', id);
  document.querySelector('#addShortcutModal .modal-header h3').textContent = 'Edit Shortcut';
  
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
  const icon = document.getElementById('shortcutIcon').value.trim() || '📄';
  
  if (!name || !url) {
    showToast('Please fill in required fields', 'warning');
    return;
  }
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    showToast('Please enter a complete URL (starting with http:// or https://)', 'warning');
    return;
  }
  
  const modal = document.getElementById('addShortcutModal');
  const editId = modal.getAttribute('data-edit-id');
  
  if (editId) {
    const index = shortcuts.findIndex(s => s.id === editId);
    if (index !== -1) {
      shortcuts[index] = { ...shortcuts[index], name, url, notes, icon };
      showToast('Shortcut updated ✓', 'success');
    }
    modal.removeAttribute('data-edit-id');
  } else {
    const newShortcut = { id: `shortcut-${Date.now()}`, name, url, notes, icon };
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
  document.getElementById('shortcutIcon').value = '📄';
  
  openAddShortcutModal();
}

// ==================== CRUD OPERATIONS - NOTES ====================

function openAddNoteModal() {
  document.getElementById('addNoteModal').classList.add('active');
}

function closeAddNoteModal() {
  const modal = document.getElementById('addNoteModal');
  modal.classList.remove('active');
  modal.removeAttribute('data-edit-id');
  document.getElementById('addNoteForm').reset();
  document.querySelector('#addNoteModal .modal-header h3').textContent = chrome.i18n.getMessage('addNoteTitle') || 'Add Note';
}

function editNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  
  document.getElementById('noteTitle').value = note.title;
  document.getElementById('noteContent').value = note.content || '';
  document.getElementById('noteIcon').value = note.icon || '📝';
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
  const icon = document.getElementById('noteIcon').value || '📝';
  
  if (!title) {
    showToast('Please enter a title', 'warning');
    return;
  }
  
  const modal = document.getElementById('addNoteModal');
  const editId = modal.getAttribute('data-edit-id');
  
  if (editId) {
    const index = notes.findIndex(n => n.id === editId);
    if (index !== -1) {
      notes[index] = { ...notes[index], title, content, icon, timestamp: Date.now() };
      showToast('Note updated ✓', 'success');
    }
    modal.removeAttribute('data-edit-id');
  } else {
    const newNote = { id: `note-${Date.now()}`, title, content, icon, timestamp: Date.now() };
    notes.unshift(newNote);
    showToast('Note saved ✓', 'success');
  }
  
  await chrome.storage.local.set({ notes });
  renderNotes();
  closeAddNoteModal();
}

async function copyNoteContent(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  
  const contentToCopy = note.content || note.title;
  
  try {
    await navigator.clipboard.writeText(contentToCopy);
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
    const diagnostics = await gatherDiagnostics();
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
    const diagnostics = await gatherDiagnostics();
    const formatted = formatDiagnosticsReport(diagnostics);
    await navigator.clipboard.writeText(formatted);
    showToast('Diagnostics copied to clipboard ✓', 'success');
  } catch (error) {
    console.error('Failed to copy diagnostics:', error);
    showToast('Failed to copy diagnostics', 'error');
  }
}

async function gatherDiagnostics() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const browserInfo = await chrome.runtime.getPlatformInfo();
  
  return {
    timestamp: new Date().toLocaleString(),
    instance: currentPageData || {},
    browser: `Chrome ${navigator.userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown'}`,
    extension: chrome.runtime.getManifest().version,
    platform: browserInfo.os,
    currentURL: tab?.url || 'N/A'
  };
}

function formatDiagnosticsReport(data) {
  const env = data.instance;
  const envLabel = env.environment ? ENV_LABELS[env.environment] : 'N/A';
  const emoji = env.environment ? ENV_EMOJIS[env.environment] : '';
  
  let userInfo = '';
  if (env.userName) userInfo += `Full Name:       ${env.userName}\n`;
  if (env.userId) userInfo += `User ID:         ${env.userId}\n`;
  if (env.personId) userInfo += `Person ID:       ${env.personId}\n`;
  if (env.personIdExternal) userInfo += `Person ID (ext): ${env.personIdExternal}\n`;
  if (env.assignmentIdExternal || env.assignmentId) {
    userInfo += `Assignment UUID: ${env.assignmentIdExternal || env.assignmentId}\n`;
  }
  if (env.proxyId) userInfo += `Proxy ID:        ${env.proxyId}\n`;
  if (!userInfo) userInfo = 'No user information available\n';
  
  return `═══════════════════════════════════════
SF PRO TOOLKIT - DIAGNOSTICS REPORT
═══════════════════════════════════════
Generated: ${data.timestamp}

INSTANCE INFORMATION
───────────────────────────────────────
Environment:     ${emoji} ${envLabel}
Company ID:      ${env.companyId || 'N/A'}
Datacenter:      ${env.datacenter || 'N/A'}
Provider:        ${env.platform || 'N/A'}
Region:          ${env.region || 'N/A'}
Country:         ${env.country || 'N/A'}

URLS
───────────────────────────────────────
Current:         ${data.currentURL}
Hostname:        ${env.hostname || 'N/A'}
API Endpoint:    ${env.apiHostname || 'N/A'}

USER INFORMATION
───────────────────────────────────────
${userInfo}
TECHNICAL DETAILS
───────────────────────────────────────
Browser:         ${data.browser}
Extension:       SF Pro Toolkit v${data.extension}
Platform:        ${data.platform}
Detection:       ${env.detectedVia || 'N/A'}

═══════════════════════════════════════
Copy this information when reporting issues
═══════════════════════════════════════`;
}

// ==================== DATACENTER DIRECTORY ====================

function showDatacenterDirectory() {
  const modal = document.getElementById('dcModal');
  const dcList = document.getElementById('dcList');
  
  if (!datacenterDB || datacenterDB.length === 0) {
    dcList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Loading datacenter information...</p>';
    modal.classList.add('active');
    return;
  }
  
  // Group by datacenter
  const dcGroups = {};
  datacenterDB.forEach(dc => {
    if (!dcGroups[dc.datacenter]) dcGroups[dc.datacenter] = [];
    dcGroups[dc.datacenter].push(dc);
  });
  
  // Create table HTML
  const tableRows = Object.entries(dcGroups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dcName, entries]) => {
      const prod = entries.find(e => e.environment === 'Production');
      const preview = entries.find(e => e.environment === 'Preview');
      const sales = entries.find(e => e.environment === 'Sales');
      const refEntry = prod || preview || sales || entries[0];
      const flag = COUNTRY_FLAGS[refEntry.country] || '🌐';
      
      const envBadges = [];
      if (prod) envBadges.push('<span class="dc-badge prod">PROD</span>');
      if (preview) envBadges.push('<span class="dc-badge prev">PREV</span>');
      if (sales) envBadges.push('<span class="dc-badge sales">SALES</span>');
      
      return `
        <tr>
          <td><span class="dc-flag">${flag}</span><span class="dc-name">${dcName}</span></td>
          <td>${refEntry.region}</td>
          <td>${refEntry.platform}</td>
          <td><div class="dc-badges">${envBadges.join('')}</div></td>
        </tr>
      `;
    })
    .join('');
  
  dcList.innerHTML = `
    <table class="dc-table">
      <thead>
        <tr>
          <th>Datacenter</th>
          <th>Region</th>
          <th>Provider</th>
          <th>Environments</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;
  
  modal.classList.add('active');
}

function closeDatacenterDirectory() {
  document.getElementById('dcModal').classList.remove('active');
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
  // Search
  setupSearchFilter();
  
  // Datacenter Info
  document.getElementById('dcInfoBtn')?.addEventListener('click', showDatacenterDirectory);
  document.getElementById('closeDcModal')?.addEventListener('click', closeDatacenterDirectory);
  document.getElementById('closeDcBtn')?.addEventListener('click', closeDatacenterDirectory);
  
  // Help
  document.getElementById('helpBtn')?.addEventListener('click', () => {
    document.getElementById('helpModal').classList.add('active');
  });
  document.getElementById('closeHelpModal')?.addEventListener('click', () => {
    document.getElementById('helpModal').classList.remove('active');
  });
  document.getElementById('closeHelpBtn')?.addEventListener('click', () => {
    document.getElementById('helpModal').classList.remove('active');
  });
  
  // Add Environment
  document.getElementById('addEnvBtn')?.addEventListener('click', openAddEnvironmentModal);
  document.getElementById('closeAddEnvModal')?.addEventListener('click', closeAddEnvironmentModal);
  document.getElementById('cancelAddEnvBtn')?.addEventListener('click', closeAddEnvironmentModal);
  document.getElementById('saveEnvBtn')?.addEventListener('click', saveEnvironment);
  
  // Add Shortcut
  document.getElementById('addShortcutBtn')?.addEventListener('click', addCurrentPageAsShortcut);
  document.getElementById('closeAddShortcutModal')?.addEventListener('click', closeAddShortcutModal);
  document.getElementById('cancelAddShortcutBtn')?.addEventListener('click', closeAddShortcutModal);
  document.getElementById('saveShortcutBtn')?.addEventListener('click', saveShortcut);
  
  // Add Note
  document.getElementById('addNoteBtn')?.addEventListener('click', openAddNoteModal);
  document.getElementById('closeAddNoteModal')?.addEventListener('click', closeAddNoteModal);
  document.getElementById('cancelAddNoteBtn')?.addEventListener('click', closeAddNoteModal);
  document.getElementById('saveNoteBtn')?.addEventListener('click', saveNote);
  
  // Diagnostics
  document.getElementById('copyDiagnosticsBtn')?.addEventListener('click', showDiagnosticsModal);
  document.getElementById('closeDiagnosticsModal')?.addEventListener('click', closeDiagnosticsModal);
  document.getElementById('closeDiagnosticsBtn')?.addEventListener('click', closeDiagnosticsModal);
  document.getElementById('copyAllDiagnosticsBtn')?.addEventListener('click', copyAllDiagnostics);
  
  // Close modal on background click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });
}

// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast-${type} active`;
  
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}
