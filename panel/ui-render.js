// SF Pro Toolkit - UI Rendering Module
// All rendering functions for environments, shortcuts, notes, and UI updates

// ==================== UI RENDERING - ENVIRONMENTS ====================

window.renderEnvironments = async function() {
  const tbody = document.getElementById('environmentList');
  
  // Remove any existing Quick Actions banner first
  const section = document.querySelector('.section[data-section="environments"]');
  if (section) {
    const existingBanner = section.querySelector('.quick-actions-banner');
    if (existingBanner) existingBanner.remove();
  }
  
  // Detect current SAP system and load Quick Actions from GLOBAL solutions storage
  if (window.currentPageData && window.currentPageData.solutionType) {
    const solutionType = window.currentPageData.solutionType;
    
    const solution = window.solutions.find(s => s.id === solutionType);
    
    if (solution && solution.quickActions && solution.quickActions.length > 0) {
      const quickActions = solution.quickActions.slice(0, 5);
      const solutionLabel = solution.name || solutionType.toUpperCase();
      
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
      
      if (section) {
        section.insertAdjacentHTML('afterbegin', quickActionsHTML);
        attachQuickActionBadgeHandlers(quickActions);
      }
    }
  }
  
  if (window.environments.length === 0) {
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
    document.getElementById('addEnvBtnInline')?.addEventListener('click', () => {
      if (window.openAddEnvironmentModal) window.openAddEnvironmentModal();
    });
    return;
  }
  
  let currentHostname = null;
  let solutionType = null;
  let currentUrl = null;
  
  if (window.currentPageData) {
    currentHostname = window.currentPageData.hostname;
    solutionType = window.currentPageData.solutionType;
    currentUrl = window.currentPageData.url;
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
  
  tbody.innerHTML = sortedEnvs.map(env => {
    const isActive = currentHostname && currentHostname === env.hostname;
    
    const envTypeColors = {
      production: '#EF4444',
      preview: '#10B981',
      sales: '#F59E0B',
      sandbox: '#A855F7'
    };
    const borderColor = envTypeColors[env.type] || '#D9D9D9';
    
    const theme = document.body.getAttribute('data-theme') || 'light';
    const iconHTML = window.SVGRenderer.renderEnvironmentIcon(env.type, 18, theme);
    
    let metaLine = '';
    if (window.currentPageData && isActive) {
      const parts = [];
      if (window.currentPageData.datacenter && window.currentPageData.datacenter !== 'Unknown') {
        parts.push(window.currentPageData.datacenter);
      }
      if (window.currentPageData.region && window.currentPageData.region !== 'Unknown') {
        const flag = window.currentPageData.country && typeof COUNTRY_FLAGS !== 'undefined' && COUNTRY_FLAGS[window.currentPageData.country] ? COUNTRY_FLAGS[window.currentPageData.country] : '';
        parts.push(`${flag} ${window.currentPageData.region}`);
      }
      
      const urlParams = typeof extractAllUrlParameters === 'function' ? extractAllUrlParameters(currentUrl || '', window.currentPageData) : {};
      if (urlParams.company) {
        parts.push(`Company: ${urlParams.company}`);
      }
      
      metaLine = parts.join(' • ');
    }
    
    let line2HTML = '';
    if (isActive && metaLine) {
      line2HTML = `<div class="env-hostname">${metaLine}</div>`;
    } else {
      line2HTML = `<div class="env-hostname">${env.hostname}</div>`;
    }
    
    let line3HTML = '';
    if (env.notes) {
      line3HTML = `<div class="env-notes">${env.notes}</div>`;
    } else if (env.lastAccessed && !isActive) {
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
};

function attachQuickActionBadgeHandlers(quickActions) {
  document.querySelectorAll('.quick-action-badge').forEach(badge => {
    badge.addEventListener('click', async (e) => {
      e.stopPropagation();
      const actionId = badge.getAttribute('data-action-id');
      const actionPath = badge.getAttribute('data-action-path');
      
      const action = { id: actionId, path: actionPath };
      
      try {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (!tab) return;
        
        const targetUrl = typeof buildQuickActionUrl === 'function' ? buildQuickActionUrl(action, window.currentPageData, tab.url) : '';
        
        console.log('[Quick Action] Navigating to:', actionId);
        console.log('[Quick Action] Target URL:', targetUrl);
        
        await chrome.tabs.update(tab.id, { url: targetUrl });
        if (window.showToast) window.showToast(`Navigating to ${badge.textContent.trim()}...`, 'success');
        
      } catch (error) {
        console.error('[Quick Action] Navigation failed:', error);
        if (window.showToast) window.showToast('Failed to navigate', 'error');
      }
    });
  });
}

function attachEnvironmentListeners() {
  document.querySelectorAll('.env-row .pin-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const type = btn.getAttribute('data-type') || 'environment';
      if (window.togglePin) await window.togglePin(id, type);
    });
  });
  
  document.querySelectorAll('.switch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const hostname = btn.getAttribute('data-hostname');
      const type = btn.getAttribute('data-type');
      if (window.switchEnvironment) window.switchEnvironment(hostname, type);
    });
  });
  
  document.querySelectorAll('.env-row .edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      console.log('[Edit Environment] Button clicked, ID:', id);
      if (window.editEnvironment) window.editEnvironment(id);
    });
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (window.deleteEnvironment) window.deleteEnvironment(id);
    });
  });
  
  document.querySelectorAll('.env-name, .env-hostname').forEach(el => {
    if (el.scrollWidth > el.clientWidth) {
      el.setAttribute('title', el.textContent);
    }
  });
}

// ==================== UI RENDERING - SHORTCUTS ====================

window.renderShortcuts = function() {
  const tbody = document.getElementById('shortcutsList');
  
  if (window.shortcuts.length === 0) {
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
    document.getElementById('addCurrentPageBtnEmpty')?.addEventListener('click', () => {
      if (window.addCurrentPageAsShortcut) window.addCurrentPageAsShortcut();
    });
    return;
  }
  
  const sortedShortcuts = [...window.shortcuts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });
  
  tbody.innerHTML = sortedShortcuts.map(shortcut => {
    const displayIcon = typeof renderSAPIcon === 'function' ? renderSAPIcon(shortcut.icon, 'shortcut', 16) : '📄';
    
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
};

function attachShortcutListeners() {
  document.querySelectorAll('.shortcut-row .pin-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const type = btn.getAttribute('data-type');
      if (window.togglePin) await window.togglePin(id, type);
    });
  });
  
  document.querySelectorAll('.go-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = btn.getAttribute('data-url');
      const builtUrl = typeof buildShortcutUrl === 'function' ? buildShortcutUrl({ url }, window.currentPageData) : url;
      if (builtUrl) {
        if (window.navigateToShortcut) window.navigateToShortcut(builtUrl);
      } else {
        if (window.showToast) window.showToast('Cannot navigate: No active SF instance detected', 'warning');
      }
    });
  });
  
  document.querySelectorAll('.shortcut-row .edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (window.editShortcut) window.editShortcut(id);
    });
  });
  
  document.querySelectorAll('.shortcut-row .delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (window.deleteShortcut) window.deleteShortcut(id);
    });
  });
  
  document.querySelectorAll('.shortcut-name, .shortcut-notes').forEach(el => {
    if (el.scrollWidth > el.clientWidth) {
      el.setAttribute('title', el.textContent);
    }
  });
}

// ==================== UI RENDERING - NOTES ====================

window.renderNotes = function() {
  const tbody = document.getElementById('notesList');
  
  if (!tbody) {
    console.error('[Notes] notesList tbody element not found!');
    return;
  }
  
  if (window.notes.length === 0) {
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
    document.getElementById('addNoteBtnEmpty')?.addEventListener('click', () => {
      if (window.openAddNoteModal) window.openAddNoteModal();
    });
    return;
  }
  
  const sortedNotes = [...window.notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });
  
  tbody.innerHTML = sortedNotes.map(note => {
    const contentPreview = note.content 
      ? (note.content.length > 60 ? note.content.substring(0, 60) + '...' : note.content)
      : '';
    const displayIcon = typeof renderSAPIcon === 'function' ? renderSAPIcon(note.icon, 'note', 16) : '📝';
    
    const noteType = note.noteType || 'note';
    const noteTypeLabels = {
      'note': '📝 Note',
      'ai-prompt': '✨ AI Prompt',
      'documentation': '📚 Documentation',
      'code': '💻 Code'
    };
    const noteTypeBadge = `<div class="note-type-badge"><span class="note-type-label">${noteTypeLabels[noteType]}</span></div>`;
    
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
};

function attachNoteListeners() {
  document.querySelectorAll('.note-row .pin-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const type = btn.getAttribute('data-type');
      if (window.togglePin) await window.togglePin(id, type);
    });
  });
  
  document.querySelectorAll('.note-row .copy-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (window.copyNoteContent) await window.copyNoteContent(id, btn);
    });
  });
  
  document.querySelectorAll('.note-row .edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (window.editNote) window.editNote(id);
    });
  });
  
  document.querySelectorAll('.note-row .delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (window.deleteNote) window.deleteNote(id);
    });
  });
  
  if (document.body.classList.contains('ai-active')) {
    document.querySelectorAll('.ai-prompt-btn').forEach(btn => {
      btn.style.display = 'flex';
    });
  }
  
  document.querySelectorAll('.note-title, .note-preview').forEach(el => {
    if (el.scrollWidth > el.clientWidth) {
      el.setAttribute('title', el.textContent);
    }
  });
}

// ==================== PROFILE MENU RENDERING ====================

window.renderProfileMenu = async function() {
  const menu = document.getElementById('profileMenu');
  if (!menu) return;
  
  const result = await chrome.storage.local.get('hiddenProfiles');
  const hiddenProfiles = result.hiddenProfiles || [];
  
  const visibleProfiles = window.availableProfiles.filter(p => !hiddenProfiles.includes(p.id));
  
  menu.innerHTML = visibleProfiles.map(profile => {
    const isActive = profile.id === window.currentProfile;
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
  
  menu.querySelectorAll('.profile-menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const profileId = item.getAttribute('data-profile-id');
      if (window.switchProfile) window.switchProfile(profileId);
    });
  });
};

// ==================== SECTION COUNT UPDATES ====================

window.updateSectionCounts = function() {
  const envCount = document.querySelector('.section[data-section="environments"] .section-count');
  if (envCount) {
    const count = window.environments.length;
    envCount.textContent = count > 0 ? `(${count})` : '';
  }
  
  const shortcutsCount = document.querySelector('.section[data-section="shortcuts"] .section-count');
  if (shortcutsCount) {
    const count = window.shortcuts.length;
    shortcutsCount.textContent = count > 0 ? `(${count})` : '';
  }
  
  const notesCount = document.querySelector('.section[data-section="notes"] .section-count');
  if (notesCount) {
    const count = window.notes.length;
    notesCount.textContent = count > 0 ? `(${count})` : '';
  }
};

// ==================== DIAGNOSTICS BUTTON UPDATE ====================

window.updateDiagnosticsButton = function() {
  const diagnosticsBtn = document.getElementById('footerDiagnosticsBtn');
  if (!diagnosticsBtn) return;
  
  diagnosticsBtn.classList.remove('btn-disabled');
  diagnosticsBtn.setAttribute('title', 'Run Page Diagnostics');
};

// ==================== POPULAR NOTES RENDERING ====================

window.renderPopularNotes = async function() {
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
  
  grid.querySelectorAll('.popular-note-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const noteNumber = btn.getAttribute('data-note-number');
      if (window.openPopularOssNote) await window.openPopularOssNote(noteNumber);
    });
  });
};

async function getPopularNotesForProfile() {
  const data = typeof window.loadPopularOssNotes === 'function' ? await window.loadPopularOssNotes() : null;
  if (!data) return [];
  
  if (window.currentProfile === 'profile-successfactors') {
    return [...(data.successfactors || []), ...(data.universal || [])];
  }
  
  if (window.currentProfile === 'profile-s4hana') {
    return [...(data.s4hana || []), ...(data.universal || [])];
  }
  
  if (window.currentProfile === 'profile-btp') {
    return [...(data.btp || []), ...(data.universal || [])];
  }
  
  return data.universal || [];
}

// ==================== QUICK ACTIONS RENDERING ====================

window.renderAllProfilesQuickActions = async function() {
  const listContainer = document.getElementById('qaEditableList');
  if (!listContainer) return;
  
  try {
    console.log('[Render QA] Starting render...');
    console.log('[Render QA] Current solutions in memory:', window.solutions);
    
    const baseSolutions = window.solutions;
    
    if (baseSolutions.length === 0) {
      listContainer.innerHTML = '<div class="empty-state" style="padding: 24px; text-align: center; color: var(--text-secondary);">No Quick Actions configured in solutions.json</div>';
      return;
    }
    
    let allHTML = '';
    
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
};
