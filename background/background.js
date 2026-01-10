// SAP Pro Toolkit - Background Service Worker
// Handles extension lifecycle, side panel, environment switching, and badge updates

console.log('[SAP Pro Toolkit] Background service worker initialized');

// ==================== DISPLAY MODE HANDLER ====================

// Listen for display mode changes and update action behavior
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'local' && changes.displayMode) {
    const newMode = changes.displayMode.newValue;
    await updateDisplayMode(newMode);
  }
});

// Update display mode dynamically
async function updateDisplayMode(mode) {
  try {
    if (mode === 'sidepanel') {
      // Remove popup to enable onClicked handler for side panel
      await chrome.action.setPopup({ popup: '' });
      console.log('[SAP Pro Toolkit] Display mode set to: Side Panel');
    } else {
      // Set popup back
      await chrome.action.setPopup({ popup: 'popup/popup-redesign.html' });
      console.log('[SAP Pro Toolkit] Display mode set to: Popup');
    }
  } catch (error) {
    console.error('[SAP Pro Toolkit] Failed to update display mode:', error);
  }
}

// Handle extension icon click (only triggered when popup is disabled for side panel mode)
chrome.action.onClicked.addListener(async (tab) => {
  console.log('[SAP Pro Toolkit] Extension icon clicked, tab:', tab.id);
  try {
    // This is only called when in side panel mode (popup is disabled)
    console.log('[SAP Pro Toolkit] Opening side panel...');
    // Open side panel - Chrome will use the default_path from manifest.json
    await chrome.sidePanel.open({ windowId: tab.windowId });
    console.log('[SAP Pro Toolkit] Side panel opened successfully for tab:', tab.id);
  } catch (error) {
    console.error('[SAP Pro Toolkit] Failed to open side panel:', error);
    console.error('[SAP Pro Toolkit] Error details:', error.message, error.stack);
  }
});

// Initialize display mode on startup AND when service worker wakes up
chrome.runtime.onStartup.addListener(async () => {
  const result = await chrome.storage.local.get({ displayMode: 'popup' });
  await updateDisplayMode(result.displayMode);
});

// Initialize display mode immediately when service worker starts
(async () => {
  const result = await chrome.storage.local.get({ displayMode: 'popup' });
  await updateDisplayMode(result.displayMode);
  console.log('[SAP Pro Toolkit] Display mode initialized on service worker start:', result.displayMode);
})();

// ==================== INSTALLATION ====================

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('[SAP Pro Toolkit] Extension installed');
    
    // Set default settings
    chrome.storage.sync.set({
      showConfirmationForProd: true
    });
    
    // Set default display mode to popup
    await chrome.storage.local.set({ displayMode: 'popup' });
    await updateDisplayMode('popup');
    
    // Load default shortcuts
    try {
      const response = await fetch(chrome.runtime.getURL('resources/shortcuts-default.json'));
      const defaultShortcuts = await response.json();
      
      // Transform shortcuts to include full URLs
      const shortcuts = defaultShortcuts.map(shortcut => {
        // If shortcut has a 'path' property, it's relative and needs current hostname
        // If it has 'url' property, it's absolute and can be used directly
        return {
          id: shortcut.id,
          name: shortcut.name,
          url: shortcut.url || shortcut.path, // Use url if available, otherwise path
          icon: shortcut.icon,
          notes: shortcut.notes,
          isDefault: true
        };
      });
      
      await chrome.storage.local.set({ shortcuts });
      console.log('[SAP Pro Toolkit] Default shortcuts loaded:', shortcuts.length);
    } catch (error) {
      console.error('[SAP Pro Toolkit] Failed to load default shortcuts:', error);
    }
  } else if (details.reason === 'update') {
    console.log('[SAP Pro Toolkit] Extension updated to version', chrome.runtime.getManifest().version);
    
    // Ensure display mode is initialized on update
    const result = await chrome.storage.local.get({ displayMode: 'popup' });
    await updateDisplayMode(result.displayMode);
  }
});

// ==================== MESSAGE HANDLING ====================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'switchEnvironment') {
    handleEnvironmentSwitch(request, sender.tab.id)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'updateBadge') {
    updateBadge(request.envType, sender.tab.id);
    sendResponse({ success: true });
    return true;
  }
});

// ==================== ENVIRONMENT SWITCHING ====================

async function handleEnvironmentSwitch(request, tabId) {
  try {
    const { targetHostname, preservePath } = request;
    
    // Get current tab URL
    const tab = await chrome.tabs.get(tabId);
    const currentURL = new URL(tab.url);
    
    // Build new URL
    let newURL;
    if (preservePath) {
      // Preserve path, query, and hash
      newURL = currentURL.href.replace(currentURL.hostname, targetHostname);
    } else {
      // Just switch hostname to root
      newURL = `${currentURL.protocol}//${targetHostname}/`;
    }
    
    // Update tab
    await chrome.tabs.update(tabId, { url: newURL });
    
    console.log('[SAP Pro Toolkit] Environment switched:', currentURL.hostname, '→', targetHostname);
    
    return { success: true };
  } catch (error) {
    console.error('[SAP Pro Toolkit] Environment switch error:', error);
    throw error;
  }
}

// ==================== BADGE MANAGEMENT ====================

function updateBadge(envType, tabId) {
  const badgeConfig = {
    production: { text: 'PROD', color: '#ef4444' },
    preview: { text: 'PREV', color: '#10b981' },
    sales: { text: 'SALE', color: '#f59e0b' },
    sandbox: { text: 'TEST', color: '#a855f7' },
    unknown: { text: '', color: '#6b7280' }
  };
  
  const config = badgeConfig[envType] || badgeConfig.unknown;
  
  // Set badge text
  chrome.action.setBadgeText({
    text: config.text,
    tabId: tabId
  });
  
  // Set badge background color
  chrome.action.setBadgeBackgroundColor({
    color: config.color,
    tabId: tabId
  });
  
  console.log('[SAP Pro Toolkit] Badge updated for tab', tabId, ':', envType);
}

// ==================== TAB UPDATES ====================

// Listen for tab updates to detect SAP pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if it's an SAP page
    if (isSFPage(tab.url)) {
      console.log('[SAP Pro Toolkit] SAP page detected:', tab.url);
      // Badge will be updated by content script via message
    } else {
      // Clear badge for non-SAP pages
      chrome.action.setBadgeText({ text: '', tabId: tabId });
    }
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!isSFPage(tab.url)) {
      chrome.action.setBadgeText({ text: '', tabId: activeInfo.tabId });
    }
  } catch (error) {
    // Tab might be closed
  }
});

// ==================== UTILITY FUNCTIONS ====================

function isSFPage(url) {
  if (!url) return false;
  
  const sfDomains = [
    '.hr.cloud.sap',
    '.sapsf.com',
    '.sapsf.cn',
    '.sapcloud.cn',
    '.successfactors.eu',
    '.sapsf.eu',
    '.successfactors.com'
  ];
  
  return sfDomains.some(domain => url.includes(domain));
}

// ==================== KEEP ALIVE (Manifest V3) ====================

// Keep service worker alive (Manifest V3 best practice)
// Service workers can be terminated by the browser after 30 seconds of inactivity
// This is not needed for our use case, but included for reference

// If needed, uncomment:
// let keepAliveInterval;
// 
// chrome.runtime.onStartup.addListener(() => {
//   keepAliveInterval = setInterval(() => {
//     console.log('[SAP Pro Toolkit] Keep alive ping');
//   }, 20000); // Ping every 20 seconds
// });
