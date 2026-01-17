// SF Pro Toolkit - State Management Module
// Global state variables and data loading/saving logic

// ==================== STATE VARIABLES ====================

window.currentPageData = null;
window.shortcuts = [];
window.environments = [];
window.notes = [];
window.solutions = [];
window.settings = { showConfirmationForProd: true };
window.availableProfiles = [];
window.currentProfile = 'profile-global';
window.popularOssNotes = null;

// State mutation functions (for safe updates from other modules)
window.setCurrentPageData = function (data) { window.currentPageData = data; };
window.setShortcuts = function (data) { window.shortcuts = data; };
window.setEnvironments = function (data) { window.environments = data; };
window.setNotes = function (data) { window.notes = data; };
window.setSolutions = function (data) { window.solutions = data; };
window.setSettings = function (data) { window.settings = data; };
window.setAvailableProfiles = function (data) { window.availableProfiles = data; };
window.setCurrentProfile = function (id) { window.currentProfile = id; };
window.setPopularOssNotes = function (data) { window.popularOssNotes = data; };

// ==================== DATA LOADING ====================

window.loadSettings = async function () {
  const result = await chrome.storage.sync.get({ showConfirmationForProd: true, enableAiFeatures: true });
  window.settings = result;
  await updateAISettings();
};

window.updateAISettings = async function () {
  document.body.classList.add('ai-active');
  console.log('[AI Settings] AI Search button is always visible');
};

window.loadShortcuts = async function () {
  const storageKey = `shortcuts_${window.currentProfile}`;
  const initKey = `shortcutsInitialized_${window.currentProfile}`;

  console.log('[Load Shortcuts] Loading for profile:', window.currentProfile);
  console.log('[Load Shortcuts] Storage key:', storageKey);

  const result = await chrome.storage.local.get([storageKey, initKey]);
  console.log('[Load Shortcuts] Storage result:', {
    hasData: !!result[storageKey],
    count: result[storageKey]?.length || 0,
    initialized: result[initKey]
  });

  window.shortcuts = result[storageKey] || [];

  if (!result[initKey] && window.shortcuts.length === 0) {
    console.log('[Load Shortcuts] First load - trying to load from profile JSON...');
    try {
      const profileData = await window.loadProfileData(window.currentProfile);
      console.log('[Load Shortcuts] Profile data loaded:', {
        hasGlobalShortcuts: !!profileData.globalShortcuts,
        hasShortcuts: !!profileData.shortcuts,
        count: (profileData.globalShortcuts || profileData.shortcuts || []).length
      });

      if (profileData.globalShortcuts || profileData.shortcuts) {
        window.shortcuts = [...(profileData.globalShortcuts || profileData.shortcuts || [])];

        await chrome.storage.local.set({
          [storageKey]: window.shortcuts,
          [initKey]: true
        });
        console.log('[Load Shortcuts] Initialized with template data');
      } else {
        console.log('[Load Shortcuts] No template data available (custom profile?)');
      }
    } catch (error) {
      console.error(`[Shortcuts] Failed to load template shortcuts for ${window.currentProfile}:`, error);
    }
  }

  console.log(`[Shortcuts] ✅ Final count: ${window.shortcuts.length} shortcuts`);
};

window.loadEnvironments = async function () {
  const storageKey = `environments_${window.currentProfile}`;

  console.log('[Load Environments] Loading for profile:', window.currentProfile);
  console.log('[Load Environments] Storage key:', storageKey);

  const result = await chrome.storage.local.get(storageKey);
  console.log('[Load Environments] Storage result:', {
    hasData: !!result[storageKey],
    count: result[storageKey]?.length || 0
  });

  if (result[storageKey] && Array.isArray(result[storageKey])) {
    window.environments = result[storageKey];
    console.log('[Load Environments] Loaded from storage');
  } else {
    console.log('[Load Environments] No data in storage, loading from profile JSON...');
    const profileData = await window.loadProfileData(window.currentProfile);
    console.log('[Load Environments] Profile data:', {
      hasEnvironments: !!profileData.environments,
      count: profileData.environments?.length || 0
    });
    window.environments = profileData.environments || [];
    await chrome.storage.local.set({ [storageKey]: window.environments });
    console.log('[Load Environments] Saved to storage');
  }

  console.log(`[Load Environments] ✅ Final count: ${window.environments.length} environments`);
};

window.loadNotes = async function () {
  const storageKey = `notes_${window.currentProfile}`;
  const initKey = `notesInitialized_${window.currentProfile}`;

  const result = await chrome.storage.local.get([storageKey, initKey]);
  window.notes = result[storageKey] || [];

  if (!result[initKey] && window.notes.length === 0) {
    try {
      const profileData = await window.loadProfileData(window.currentProfile);

      if (profileData.notes && Array.isArray(profileData.notes) && profileData.notes.length > 0) {
        window.notes = [...profileData.notes];

        await chrome.storage.local.set({
          [storageKey]: window.notes,
          [initKey]: true
        });
      }
    } catch (error) {
      console.error(`[Notes] Failed to load template notes for ${window.currentProfile}:`, error);
    }
  }

  let needsSave = false;
  window.notes = window.notes.map(note => {
    if (!note.noteType) {
      console.log('[Notes Migration] Adding missing noteType to:', note.title);
      needsSave = true;
      return {
        ...note,
        noteType: 'note'
      };
    }
    return note;
  });

  if (needsSave) {
    await chrome.storage.local.set({ [storageKey]: window.notes });
    console.log('[Notes Migration] Saved', window.notes.length, 'notes with noteType field');
  }

  console.log(`[Notes] Loaded ${window.notes.length} notes for profile: ${window.currentProfile}`);
};

window.loadSolutions = async function () {
  try {
    console.log('[Load Solutions] Starting...');

    const result = await chrome.storage.local.get('solutions');

    if (result.solutions && Array.isArray(result.solutions)) {
      window.solutions = result.solutions;
      console.log('[Load Solutions] ✅ Loaded from storage:', window.solutions.length, 'solutions');
    } else {
      console.log('[Load Solutions] First run - copying solutions.json to storage...');
      const response = await fetch(chrome.runtime.getURL('resources/solutions.json'));
      if (!response.ok) {
        throw new Error('Failed to load solutions.json');
      }
      const baseData = await response.json();
      window.solutions = baseData.solutions || [];

      await chrome.storage.local.set({ solutions: window.solutions });
      console.log('[Load Solutions] ✅ Copied to storage:', window.solutions.length, 'solutions');
      console.log('[Load Solutions] 📝 From now on, all edits save to storage only');
    }

  } catch (error) {
    console.error('[Solutions] Failed to load:', error);
    window.solutions = [];
  }
};

async function loadCurrentPageData() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

    if (!tab || !tab.url) {
      currentPageData = null;
      return;
    }

    const hostname = new URL(tab.url).hostname;
    const solutionType = window.detectSolutionType ? window.detectSolutionType(tab.url, hostname) : null;

    if (!solutionType) {
      window.currentPageData = null;
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
      window.currentPageData = response;
      window.currentPageData.url = tab.url;
      window.currentPageData.solutionType = solutionType;
      console.log('[SF Pro Toolkit] Using enhanced data from content script:', window.currentPageData);
    } else {
      window.currentPageData = window.detectEnvironmentFromURL ? window.detectEnvironmentFromURL(tab.url) : null;
      window.currentPageData.url = tab.url;
      window.currentPageData.solutionType = solutionType;
      console.log('[SF Pro Toolkit] Using URL-based detection:', window.currentPageData);
    }

    // Render environments after page data is loaded to show Quick Actions
    if (window.renderEnvironments) {
      window.renderEnvironments();
    }

  } catch (error) {
    console.error('[SF Pro Toolkit] Failed to load page data:', error);
    window.currentPageData = null;
  }
}

// Expose on window object for side-panel.js
window.loadCurrentPageData = loadCurrentPageData;

window.loadProfileData = async function (profileId) {
  if (!profileId) {
    return { globalShortcuts: [], solutions: [], environments: [] };
  }

  try {
    const profile = window.availableProfiles.find(p => p.id === profileId);
    if (!profile || !profile.file) {
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
};

window.loadAllProfilesData = async function () {
  const allData = {
    environments: [],
    shortcuts: [],
    notes: []
  };

  for (const profile of window.availableProfiles) {
    try {
      const envKey = `environments_${profile.id}`;
      const shortcutsKey = `shortcuts_${profile.id}`;
      const notesKey = `notes_${profile.id}`;

      const result = await chrome.storage.local.get([envKey, shortcutsKey, notesKey]);

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
    profiles: window.availableProfiles.length
  });

  return allData;
};

window.loadPopularOssNotes = async function () {
  if (window.popularOssNotes) return window.popularOssNotes;

  try {
    const response = await fetch(chrome.runtime.getURL('resources/popular-oss-notes.json'));
    window.popularOssNotes = await response.json();
    return window.popularOssNotes;
  } catch (error) {
    console.error('[Popular OSS Notes] Failed to load:', error);
    return null;
  }
};

window.loadTheme = async function () {
  const result = await chrome.storage.local.get({ theme: 'auto' });
  const theme = result.theme;
  applyTheme(theme);
};

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);

  const themeBtn = document.getElementById('footerThemeBtn');
  if (themeBtn) {
    themeBtn.setAttribute('data-theme-active', theme !== 'auto' ? 'true' : 'false');
  }

  console.log('[Theme] Applied theme:', theme);
}

// Helper functions are available on window object from toolkit-core.js
// No need to wrap them - just use window.detectSolutionType and window.detectEnvironmentFromURL directly
