// SAP Pro Toolkit - Content Script
// Detects SAP environment and provides data to side panel

// ==================== STATE ====================

let pageData = null;
let datacenterDB = null;
let currentEnvironment = null;

// ==================== INITIALIZATION ====================

(async function init() {
  try {
    await loadDatacenterDB();
    injectHelperScript();
    setupMessageListeners();
    
    // Detect environment from URL immediately
    const urlBasedEnv = detectEnvironmentFromURL(window.location.href);
    currentEnvironment = urlBasedEnv;
    
    // Wait for SF page data (enhanced detection)
    listenForPageData();
    
  } catch (error) {
    console.error('[SAP Pro Toolkit] Initialization error:', error);
  }
})();

// ==================== DATA LOADING ====================

async function loadDatacenterDB() {
  try {
    const response = await fetch(chrome.runtime.getURL('resources/dc.json'));
    datacenterDB = await response.json();
  } catch (error) {
    console.error('[SAP Pro Toolkit] Failed to load datacenter DB:', error);
    datacenterDB = [];
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
    console.error('[SAP Pro Toolkit] Failed to inject helper script:', error);
  }
}

// ==================== MESSAGE LISTENERS ====================

function setupMessageListeners() {
  // Listen to messages from side panel
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageData') {
      sendResponse(pageData || currentEnvironment);
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
      
      console.log('[SAP Pro Toolkit] Looking up hostname:', hostname);
      console.log('[SAP Pro Toolkit] Company ID:', sfData.companyId);
      console.log('[SAP Pro Toolkit] datacenterDB loaded?', datacenterDB ? 'YES' : 'NO', 'Entries:', datacenterDB?.length);
      
      // Look up datacenter info - prioritize csd_hostname, then old_hostname, then sales_hostname
      let dcEntry = datacenterDB?.find(dc => dc.csd_hostname === hostname);
      if (!dcEntry) {
        dcEntry = datacenterDB?.find(dc => dc.old_hostname === hostname);
      }
      if (!dcEntry) {
        dcEntry = datacenterDB?.find(dc => dc.sales_hostname === hostname);
      }
      
      if (dcEntry) {
        console.log('[SAP Pro Toolkit] MATCH FOUND in DC entry:', dcEntry);
      }
      
      console.log('[SAP Pro Toolkit] DC Entry found:', dcEntry ? 'YES' : 'NO', dcEntry);
      
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
      
      console.log('[SAP Pro Toolkit] Final page data:', pageData);
    }
    
    if (event.data.type === 'sf-pro-toolkit-error') {
      console.log('[SAP Pro Toolkit] Could not find pageHeaderJsonData, using URL-based detection');
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
  // More specific preview detection
  if (hostname.includes('-preview') || hostname.includes('preview-') || hostname.includes('preview.')) return 'preview';
  
  // Sales/Demo detection - only if it's in the subdomain or company ID
  const hostnameLower = hostname.toLowerCase();
  if (hostnameLower.startsWith('demo.') || hostnameLower.startsWith('sales.')) return 'sales';
  if (hostnameLower.includes('-demo') || hostnameLower.includes('-sales')) return 'sales';
  
  // Sandbox/Test detection
  if (hostname.includes('sandbox') || hostname.includes('-test') || hostname.includes('test-')) return 'sandbox';
  
  // Default to production for standard hostnames
  return 'production';
}



// ==================== UTILITY ====================

// Log extension loaded
console.log('[SAP Pro Toolkit] Content script loaded on:', window.location.hostname);
