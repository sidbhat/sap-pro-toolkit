// SF Pro Toolkit - Content Script
// Runs on all SuccessFactors pages to detect environment and inject visual indicators

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

// ==================== STATE ====================

let pageData = null;
let datacenterDB = null;
let currentEnvironment = null;
let darkModeEnabled = false;

// ==================== INITIALIZATION ====================

(async function init() {
  try {
    await loadDatacenterDB();
    await loadSettings();
    injectHelperScript();
    setupMessageListeners();
    
    // Detect environment from URL immediately
    const urlBasedEnv = detectEnvironmentFromURL(window.location.href);
    currentEnvironment = urlBasedEnv;
    // Visual indicators disabled - popup still uses detection data
    // injectVisualIndicators(urlBasedEnv);
    
    // Wait for SF page data (enhanced detection)
    listenForPageData();
    
  } catch (error) {
    console.error('[SF Pro Toolkit] Initialization error:', error);
  }
})();

// ==================== DATA LOADING ====================

async function loadDatacenterDB() {
  try {
    const response = await fetch(chrome.runtime.getURL('resources/dc.json'));
    datacenterDB = await response.json();
  } catch (error) {
    console.error('[SF Pro Toolkit] Failed to load datacenter DB:', error);
    datacenterDB = [];
  }
}

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get({
      darkMode: 'light'
    });
    
    // Apply dark mode based on settings (only if explicitly set to dark)
    applyDarkMode(result.darkMode);
    
  } catch (error) {
    console.error('[SF Pro Toolkit] Failed to load settings:', error);
  }
}

// ==================== SCRIPT INJECTION ====================

function injectHelperScript() {
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('content/injected.js');
    script.onload = function() {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  } catch (error) {
    console.error('[SF Pro Toolkit] Failed to inject helper script:', error);
  }
}

// ==================== MESSAGE LISTENERS ====================

function setupMessageListeners() {
  // Listen to messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageData') {
      sendResponse(pageData || currentEnvironment);
      return true;
    }
    
    if (request.action === 'setDarkMode') {
      applyDarkMode(request.mode);
      sendResponse({ success: true });
      return true;
    }
  });
}

function listenForPageData() {
  // Listen to messages from injected script
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    
    if (event.data.type === 'sf-pro-toolkit-data') {
      const sfData = event.data.data;
      
      // KEY FIX: Use baseUrl from pageHeaderJsonData (like SuccessFactors Toolkit does)
      const hostname = sfData.baseUrl ? sfData.baseUrl.replace('https://', '').replace('http://', '') : window.location.hostname;
      
      console.log('[SF Pro Toolkit] Looking up hostname:', hostname);
      console.log('[SF Pro Toolkit] Company ID:', sfData.companyId);
      console.log('[SF Pro Toolkit] datacenterDB loaded?', datacenterDB ? 'YES' : 'NO', 'Entries:', datacenterDB?.length);
      
      // Look up datacenter info - prioritize csd_hostname, then old_hostname, then sales_hostname
      let dcEntry = datacenterDB?.find(dc => dc.csd_hostname === hostname);
      if (!dcEntry) {
        dcEntry = datacenterDB?.find(dc => dc.old_hostname === hostname);
      }
      if (!dcEntry) {
        dcEntry = datacenterDB?.find(dc => dc.sales_hostname === hostname);
      }
      
      if (dcEntry) {
        console.log('[SF Pro Toolkit] MATCH FOUND in DC entry:', dcEntry);
      }
      
      console.log('[SF Pro Toolkit] DC Entry found:', dcEntry ? 'YES' : 'NO', dcEntry);
      
      // Extract relevant information including all user fields
      pageData = {
        ...currentEnvironment,
        companyId: sfData.companyId,
        baseUrl: sfData.baseUrl,
        hostname: hostname,
        userId: sfData.userInfo?.id,
        userName: sfData.userInfo?.fullName,
        personId: sfData.userInfo?.personId,
        personIdExternal: sfData.userInfo?.personIdExternal,
        assignmentId: sfData.userInfo?.assignmentId,
        assignmentIdExternal: sfData.userInfo?.assignmentIdExternal,
        assignmentUUID: sfData.userInfo?.assignmentUUID,
        proxyId: sfData.userInfo?.proxyId || null,
        detectedVia: 'pageHeaderJsonData'
      };
      
      // If we found a DC match, merge that info
      if (dcEntry) {
        pageData = {
          ...pageData,
          environment: dcEntry.environment.toLowerCase(),
          datacenter: dcEntry.datacenter,
          country: dcEntry.country,
          platform: dcEntry.platform,
          region: dcEntry.region,
          apiHostname: dcEntry.api_hostname
        };
      }
      
      currentEnvironment = pageData;
      
      console.log('[SF Pro Toolkit] Final page data:', pageData);
    }
    
    if (event.data.type === 'sf-pro-toolkit-error') {
      console.log('[SF Pro Toolkit] Could not find pageHeaderJsonData, using URL-based detection');
    }
  });
}

// ==================== ENVIRONMENT DETECTION ====================

function detectEnvironmentFromURL(url) {
  const hostname = new URL(url).hostname;
  
  // Lookup in datacenter DB - prioritize csd_hostname, then old_hostname, then sales_hostname
  let dcEntry = datacenterDB?.find(dc => dc.csd_hostname === hostname);
  if (!dcEntry) {
    dcEntry = datacenterDB?.find(dc => dc.old_hostname === hostname);
  }
  if (!dcEntry) {
    dcEntry = datacenterDB?.find(dc => dc.sales_hostname === hostname);
  }
  
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
  
  // Heuristic detection with better logic
  const envType = detectEnvironmentHeuristic(hostname);
  
  // Try to extract datacenter from hostname pattern
  let datacenter = 'Unknown';
  const dcMatch = hostname.match(/hcm-(\w+\d+)/);
  if (dcMatch) {
    // Look up by partial match to get region info
    const partialMatch = datacenterDB.find(dc => 
      dc.csd_hostname && dc.csd_hostname.includes(dcMatch[1])
    );
    if (partialMatch) {
      return {
        environment: envType,
        datacenter: partialMatch.datacenter,
        hostname: hostname,
        country: partialMatch.country,
        platform: partialMatch.platform,
        region: partialMatch.region,
        apiHostname: partialMatch.api_hostname || 'Unknown',
        detectedVia: 'heuristic-with-dc-match'
      };
    }
  }
  
  return {
    environment: envType,
    datacenter: datacenter,
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

// ==================== VISUAL INDICATORS ====================

function injectVisualIndicators(envData) {
  if (!envData) return;
  
  const envType = envData.environment || 'unknown';
  const color = ENV_COLORS[envType];
  const emoji = ENV_EMOJIS[envType];
  const label = ENV_LABELS[envType];
  
  // Inject border
  injectBorder(color);
  
  // Inject banner
  injectBanner(emoji, label, color, envData);
}

function injectBorder(color) {
  // Remove existing border if any
  document.body.classList.remove(
    'sf-toolkit-env-production',
    'sf-toolkit-env-preview',
    'sf-toolkit-env-sales',
    'sf-toolkit-env-sandbox',
    'sf-toolkit-env-unknown'
  );
  
  // Apply border via CSS class
  const envType = Object.keys(ENV_COLORS).find(key => ENV_COLORS[key] === color) || 'unknown';
  document.body.classList.add(`sf-toolkit-env-${envType}`);
}

function injectBanner(emoji, label, color, envData) {
  // Check if banner already exists
  let banner = document.getElementById('sf-toolkit-env-banner');
  
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'sf-toolkit-env-banner';
    banner.className = 'sf-toolkit-env-banner';
    document.body.appendChild(banner);
  }
  
  // Update banner content
  const dcInfo = envData.datacenter !== 'Unknown' ? ` • ${envData.datacenter}` : '';
  
  banner.innerHTML = `
    <div class="sf-toolkit-banner-content" style="background: linear-gradient(135deg, ${color}dd, ${color}ff); border: 2px solid ${color};">
      <span class="sf-toolkit-banner-emoji">${emoji}</span>
      <span class="sf-toolkit-banner-text">${label}${dcInfo}</span>
    </div>
  `;
  
  // Add click handler to show tooltip
  banner.addEventListener('click', () => {
    showEnvironmentTooltip(envData);
  });
}

function showEnvironmentTooltip(envData) {
  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'sf-toolkit-tooltip';
  tooltip.innerHTML = `
    <div class="sf-toolkit-tooltip-content">
      <div><strong>Environment:</strong> ${ENV_LABELS[envData.environment]}</div>
      <div><strong>Datacenter:</strong> ${envData.datacenter}</div>
      <div><strong>Region:</strong> ${envData.region}</div>
      <div><strong>Hostname:</strong> ${envData.hostname}</div>
      ${envData.companyId ? `<div><strong>Company:</strong> ${envData.companyId}</div>` : ''}
    </div>
  `;
  
  document.body.appendChild(tooltip);
  
  // Position near banner
  const banner = document.getElementById('sf-toolkit-env-banner');
  const rect = banner.getBoundingClientRect();
  tooltip.style.position = 'fixed';
  tooltip.style.top = (rect.bottom + 10) + 'px';
  tooltip.style.left = rect.left + 'px';
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    tooltip.remove();
  }, 3000);
  
  // Remove on click
  tooltip.addEventListener('click', () => {
    tooltip.remove();
  });
}

// ==================== DARK MODE ====================

function applyDarkMode(mode) {
  // Only enable dark mode if explicitly set to 'dark'
  darkModeEnabled = mode === 'dark';
  
  if (darkModeEnabled) {
    injectDarkCSS();
  } else {
    removeDarkCSS();
  }
}

function injectDarkCSS() {
  // Check if already injected
  if (document.getElementById('sf-toolkit-dark-mode')) {
    return;
  }
  
  const link = document.createElement('link');
  link.id = 'sf-toolkit-dark-mode';
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('content/dark.css');
  document.head.appendChild(link);
  
  console.log('[SF Pro Toolkit] Dark mode enabled');
}

function removeDarkCSS() {
  const link = document.getElementById('sf-toolkit-dark-mode');
  if (link) {
    link.remove();
    console.log('[SF Pro Toolkit] Dark mode disabled');
  }
}


// ==================== UTILITY ====================

// Log extension loaded
console.log('[SF Pro Toolkit] Content script loaded on:', window.location.hostname);
