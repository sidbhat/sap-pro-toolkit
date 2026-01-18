// SF Pro Toolkit - UI Rendering Module
// All rendering functions for environments, shortcuts, notes, and UI updates

// ==================== UI RENDERING - ENVIRONMENTS ====================

window.renderEnvironments = async function (newlyCreatedId = null) {
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
          <div class="empty-state-enhanced">
            <div class="empty-state-header">
              <div class="empty-state-icon">🌐</div>
              <h3 class="empty-state-title">No Saved Environments</h3>
              <p class="empty-state-subtitle">Save your SAP instances for quick access</p>
            </div>
            
            <details class="empty-state-guidance">
              <summary class="guidance-toggle">
                <span class="chevron-icon">▶</span>
                <span>How to Get Started</span>
              </summary>
              <div class="guidance-content">
                <div class="guidance-step">
                  <h4 data-step-number="1">Navigate to Your SAP System</h4>
                  <p>Open any SAP SuccessFactors, S/4HANA, or BTP instance in your browser</p>
                </div>
                
                <div class="guidance-step">
                  <h4 data-step-number="2">Save the Environment</h4>
                  <p>Click the <code>+ Environment</code> button or use <code>Cmd+E</code> keyboard shortcut</p>
                </div>
                
                <div class="guidance-step">
                  <h4 data-step-number="3">Switch Between Environments</h4>
                  <p>Use <code>Cmd+Shift+1-2</code> for quick switching, or click the switch icon</p>
                </div>
                
                <div class="guidance-tip">
                  <strong>💡 Pro Tip:</strong> Pin frequently-used environments to keep them at the top of your list
                </div>
              </div>
            </details>
            
            <button class="btn btn-primary" id="addEnvBtnInline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Current Instance
            </button>
          </div>
        </td>
      </tr>
    `;
    document.getElementById('addEnvBtnInline')?.addEventListener('click', () => {
      if (window.addCurrentPageAsEnvironment) window.addCurrentPageAsEnvironment();
    });
    // Auto-collapse empty section
    window.autoCollapseEmptySection?.('environments');
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

    const isNewlyCreated = newlyCreatedId && env.id === newlyCreatedId;

    return `
      <tr class="env-row ${env.type}-env ${isActive ? 'active-row active-env-card' : ''} ${isNewlyCreated ? 'newly-created' : ''}" data-env-id="${env.id}" style="border-left: 4px solid ${borderColor};">
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

  // Remove .newly-created class after animation completes (2000ms)
  if (newlyCreatedId) {
    setTimeout(() => {
      const newRow = document.querySelector(`.env-row[data-env-id="${newlyCreatedId}"]`);
      if (newRow) {
        newRow.classList.remove('newly-created');
      }
    }, 2000);
  }

  // Update counts (data already fresh from reload before render)
  if (window.updateSectionCounts) {
    window.updateSectionCounts();
  }
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

  document.querySelectorAll('.env-row .delete-btn').forEach(btn => {
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

window.renderShortcuts = async function (newlyCreatedId = null) {
  const tbody = document.getElementById('shortcutsList');

  if (window.shortcuts.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="3">
          <div class="empty-state-enhanced">
            <div class="empty-state-header">
              <div class="empty-state-icon">⚡</div>
              <h3 class="empty-state-title">No Saved Shortcuts</h3>
              <p class="empty-state-subtitle">Create quick links to frequently-used SAP pages</p>
            </div>
            
            <details class="empty-state-guidance">
              <summary class="guidance-toggle">
                <span class="chevron-icon">▶</span>
                <span>How to Get Started</span>
              </summary>
              <div class="guidance-content">
                <div class="guidance-step">
                  <h4 data-step-number="1">Navigate to Any SAP Page</h4>
                  <p>Open a report, form, workflow, or app you use frequently</p>
                </div>
                
                <div class="guidance-step">
                  <h4 data-step-number="2">Save as Shortcut</h4>
                  <p>Click <code>+ Shortcut</code> button to save</p>
                </div>
                
                <div class="guidance-step">
                  <h4 data-step-number="3">Open from Any Environment</h4>
                  <p>Shortcuts work across all environments - click to navigate instantly</p>
                </div>
                
                <div class="guidance-tip">
                  <strong>💡 Pro Tip:</strong> Use AI-powered shortcut suggestions to automatically generate name and icon
                </div>
              </div>
            </details>
            
            <button class="btn btn-primary" id="addCurrentPageBtnEmpty">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Current Page
            </button>
          </div>
        </td>
      </tr>
    `;
    document.getElementById('addCurrentPageBtnEmpty')?.addEventListener('click', () => {
      if (window.addCurrentPageAsShortcut) window.addCurrentPageAsShortcut();
    });
    // Auto-collapse empty section
    window.autoCollapseEmptySection?.('shortcuts');
    return;
  }

  const sortedShortcuts = [...window.shortcuts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  tbody.innerHTML = sortedShortcuts.map(shortcut => {
    // Render SAP icon using window.renderSAPIcon
    const icon = shortcut.icon || window.DEFAULT_ICONS.shortcut;
    const displayIcon = window.renderSAPIcon ? window.renderSAPIcon(icon, 16) : '📄';
    const isNewlyCreated = newlyCreatedId && shortcut.id === newlyCreatedId;

    return `
      <tr class="shortcut-row ${isNewlyCreated ? 'newly-created' : ''}" data-shortcut-id="${shortcut.id}" data-url="${shortcut.url}">
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

  // Remove .newly-created class after animation completes (2000ms)
  if (newlyCreatedId) {
    setTimeout(() => {
      const newRow = document.querySelector(`.shortcut-row[data-shortcut-id="${newlyCreatedId}"]`);
      if (newRow) {
        newRow.classList.remove('newly-created');
      }
    }, 2000);
  }

  // Update counts (data already fresh from reload before render)
  if (window.updateSectionCounts) {
    window.updateSectionCounts();
  }
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

window.renderNotes = async function (newlyCreatedId = null) {
  const tbody = document.getElementById('notesList');

  if (!tbody) {
    console.error('[Notes] notesList tbody element not found!');
    return;
  }

  if (window.notes.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="3">
          <div class="empty-state-enhanced">
            <div class="empty-state-header">
              <div class="empty-state-icon">📝</div>
              <h3 class="empty-state-title">No Saved Notes</h3>
              <p class="empty-state-subtitle">Store documentation, prompts, and code snippets</p>
            </div>
            
            <details class="empty-state-guidance">
              <summary class="guidance-toggle">
                <span class="chevron-icon">▶</span>
                <span>How to Get Started</span>
              </summary>
              <div class="guidance-content">
                <div class="guidance-step">
                  <h4 data-step-number="1">Create a Note</h4>
                  <p>Click <code>+ Note</code> button to create</p>
                </div>
                
                <div class="guidance-step">
                  <h4 data-step-number="2">Choose Note Type</h4>
                  <p>Select <strong>Note</strong> for general documentation or <strong>AI Prompt</strong> for testing prompts</p>
                </div>
                
                <div class="guidance-step">
                  <h4 data-step-number="3">Use AI Enhancement</h4>
                  <p>For AI Prompts, test against real models and refine your prompts interactively</p>
                </div>
                
                <div class="guidance-tip">
                  <strong>💡 Pro Tip:</strong> Pin important notes to keep them accessible across all profiles
                </div>
              </div>
            </details>
            
            <button class="btn btn-primary" id="addNoteBtnEmpty">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Note
            </button>
          </div>
        </td>
      </tr>
    `;
    document.getElementById('addNoteBtnEmpty')?.addEventListener('click', () => {
      if (window.openAddNoteModal) window.openAddNoteModal();
    });
    // Auto-collapse empty section
    window.autoCollapseEmptySection?.('notes');
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
    // Render SAP icon using window.renderSAPIcon
    const icon = note.icon || window.DEFAULT_ICONS.note;
    const displayIcon = window.renderSAPIcon ? window.renderSAPIcon(icon, 16) : '📝';
    const isNewlyCreated = newlyCreatedId && note.id === newlyCreatedId;

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
      <tr class="note-row ${isNewlyCreated ? 'newly-created' : ''}" data-note-id="${note.id}">
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

  // Remove .newly-created class after animation completes (2000ms)
  if (newlyCreatedId) {
    setTimeout(() => {
      const newRow = document.querySelector(`.note-row[data-note-id="${newlyCreatedId}"]`);
      if (newRow) {
        newRow.classList.remove('newly-created');
      }
    }, 2000);
  }

  // Update counts (data already fresh from reload before render)
  if (window.updateSectionCounts) {
    window.updateSectionCounts();
  }
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

window.renderProfileMenu = async function () {
  const menu = document.getElementById('profileMenu');
  if (!menu) {
    console.error('[Profile Menu] Menu element not found!');
    return;
  }

  const result = await chrome.storage.local.get('hiddenProfiles');
  const hiddenProfiles = result.hiddenProfiles || [];

  // Remove duplicates from availableProfiles first (using Set to track unique IDs)
  const uniqueProfileIds = new Set();
  const uniqueProfiles = [];

  for (const profile of window.availableProfiles) {
    if (!uniqueProfileIds.has(profile.id)) {
      uniqueProfileIds.add(profile.id);
      uniqueProfiles.push(profile);
    }
  }

  const visibleProfiles = uniqueProfiles.filter(p => !hiddenProfiles.includes(p.id));

  // Get list of system (hardcoded) profile IDs
  const systemProfiles = ['profile-global', 'profile-successfactors', 'profile-s4hana', 'profile-btp', 'profile-executive', 'profile-golive', 'profile-ai-joule'];

  // Build profile menu items
  const profileItems = visibleProfiles.map(profile => {
    const isActive = profile.id === window.currentProfile;
    const isCustom = !systemProfiles.includes(profile.id);
    const iconId = profile.icon || 'folder';
    const description = profile.description || '';

    // CRITICAL: Delete button should ONLY show if:
    // 1. Profile is custom (not system)
    // 2. Profile is NOT currently active
    const showDeleteBtn = isCustom && !isActive;

    // Render icon using SAPIconLibrary for proper SVG rendering
    let iconSVG = iconId; // Fallback to text
    if (window.SAPIconLibrary) {
      const iconObj = window.SAPIconLibrary.getIconById(iconId, 'universal');
      if (iconObj) {
        iconSVG = window.SAPIconLibrary.renderIconSVG(iconObj, 18);
      }
    }

    // Wrap profile item and delete button in a container for proper positioning
    return `
      <div class="profile-menu-item-wrapper">
        <button class="profile-menu-item ${isActive ? 'active' : ''}" data-profile-id="${profile.id}">
          <span class="profile-icon">${iconSVG}</span>
          <div class="profile-info">
            <div class="profile-name">${profile.name}</div>
            ${description ? `<div class="profile-desc">${description}</div>` : ''}
          </div>
          ${isActive ? '<span class="profile-check">' + window.SVGRenderer.renderCheckIcon(14) + '</span>' : ''}
        </button>
        ${showDeleteBtn ? `<button class="icon-btn danger delete-profile-btn" data-profile-id="${profile.id}" title="Delete profile"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>` : ''}
      </div>
    `;
  }).join('');

  // Add "New Profile" button at bottom
  const newProfileButton = `
    <button class="profile-menu-item profile-menu-new" id="newProfileMenuBtn" style="border-top: 1px solid var(--border); margin-top: 4px; padding-top: 12px;">
      <span class="profile-icon">➕</span>
      <div class="profile-info">
        <div class="profile-name">New Profile</div>
      </div>
    </button>
  `;

  menu.innerHTML = profileItems + newProfileButton;

  // Attach click handlers for profile switching (NO cloning - was breaking switching)
  menu.querySelectorAll('.profile-menu-item:not(.profile-menu-new)').forEach(item => {
    item.addEventListener('click', (e) => {
      // Don't switch if clicking delete button
      if (e.target.closest('.delete-profile-btn')) return;

      const profileId = item.getAttribute('data-profile-id');
      console.log('[Profile Switch] Switching to:', profileId);
      if (window.switchProfile) window.switchProfile(profileId);
    });
  });

  // Attach delete handlers for custom profiles
  menu.querySelectorAll('.delete-profile-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      const profileId = btn.getAttribute('data-profile-id');
      console.log('[Profile Delete] Deleting:', profileId);
      if (window.deleteCustomProfile) await window.deleteCustomProfile(profileId);
    });
  });

  // Attach handler for "New Profile" button
  const newProfileBtn = document.getElementById('newProfileMenuBtn');
  if (newProfileBtn) {
    newProfileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('[Profile Menu] Opening new profile modal');
      if (window.openNewProfileModal) window.openNewProfileModal();
    });
  }
};

// ==================== SECTION COUNT UPDATES ====================

/**
 * Updates section counts using current global state
 * NOTE: Render functions reload data before calling this, so counts are accurate
 */
window.updateSectionCounts = function () {
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

window.updateDiagnosticsButton = function () {
  const diagnosticsBtn = document.getElementById('footerDiagnosticsBtn');
  if (!diagnosticsBtn) return;

  diagnosticsBtn.classList.remove('btn-disabled');
  diagnosticsBtn.setAttribute('title', 'Run Page Diagnostics');
};

// ==================== POPULAR NOTES RENDERING ====================

window.renderPopularNotes = async function () {
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

window.renderAllProfilesQuickActions = async function () {
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
