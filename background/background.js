// SAP Pro Toolkit - Background Service Worker
// Handles extension lifecycle, side panel, environment switching, and badge updates

console.log('[SAP Pro Toolkit] Background service worker initialized');

// ==================== SIDE PANEL HANDLER ====================

// Handle extension icon click to open side panel
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
    console.log('[SAP Pro Toolkit] Side panel opened for tab:', tab.id);
  } catch (error) {
    console.error('[SAP Pro Toolkit] Failed to open side panel:', error);
  }
});

// ==================== INSTALLATION ====================

/**
 * Handle extension installation and updates
 * Sets default configuration for side panel
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('[SAP Pro Toolkit] Extension installed');
    
    // Set default settings
    chrome.storage.sync.set({
      showConfirmationForProd: true
    });
    
    // Set default active profile
    await chrome.storage.local.set({ 
      activeProfile: 'profile-global'
    });
    
    console.log('[SAP Pro Toolkit] Initial setup complete');
  } else if (details.reason === 'update') {
    console.log('[SAP Pro Toolkit] Extension updated to version', chrome.runtime.getManifest().version);
  }
});

// ==================== MESSAGE HANDLING ====================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'switchEnvironment') {
    // Get tab ID from sender.tab if available (content script), otherwise query active tab (side panel)
    const getTabId = async () => {
      if (sender.tab?.id) {
        return sender.tab.id;
      }
      // Message from side panel - get active tab
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      return tab?.id;
    };
    
    getTabId()
      .then(tabId => handleEnvironmentSwitch(request, tabId))
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'updateBadge') {
    // Get tab ID from sender.tab if available, otherwise use request.tabId
    const tabId = sender.tab?.id || request.tabId;
    if (tabId) {
      updateBadge(request.envType, tabId);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'No tab ID available' });
    }
    return true;
  }
  
});

// ==================== ENVIRONMENT SWITCHING ====================

async function handleEnvironmentSwitch(request, tabId) {
  try {
    const { targetHostname } = request;
    
    // Get current tab URL
    const tab = await chrome.tabs.get(tabId);
    const currentURL = new URL(tab.url);
    
    // Build new URL - ALWAYS navigate to root
    const newURL = `https://${targetHostname}/`;
    
    console.log('[Environment Switch] Navigating to:', newURL);
    
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

/**
 * Check if URL is a SuccessFactors page
 * Note: This is a standalone version for the background service worker
 * The main version with additional functionality is in toolkit-core.js
 */
function isSFPage(url) {
  if (!url) return false;
  const sfDomains = ['hr.cloud.sap', 'sapsf.com', 'sapsf.cn', 'sapcloud.cn', 
                      'successfactors.eu', 'sapsf.eu', 'successfactors.com'];
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
