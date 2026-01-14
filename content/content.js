// SAP Pro Toolkit - Content Script
// Detects SAP environment and provides data to side panel

// ==================== STATE ====================

let pageData = null;
let datacenterDB = null;
let currentEnvironment = null;

// ==================== INITIALIZATION ====================

(async function init() {
  try {
    console.log('[SAP Pro Toolkit] Content script initializing...');
    await loadDatacenterDB();
    injectHelperScript();
    setupMessageListeners();
    
    // Detect environment from URL immediately
    const urlBasedEnv = detectEnvironmentFromURL(window.location.href);
    currentEnvironment = urlBasedEnv;
    
    // Wait for SF page data (enhanced detection)
    listenForPageData();
    
    console.log('[SAP Pro Toolkit] Content script initialized');
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
    console.log('[Content Script] Received message:', request.action);
    
    if (request.action === 'getPageData') {
      console.log('[Content Script] Sending page data:', pageData || currentEnvironment);
      sendResponse(pageData || currentEnvironment);
      return true;
    }
    
    // NEW: Handle page scraping for AI shortcut creation
    if (request.action === 'scrapePageForShortcut') {
      console.log('[Content Script] Scraping page content...');
      try {
        const scrapedData = scrapePageContent();
        console.log('[Content Script] Scraped data:', scrapedData);
        sendResponse(scrapedData);
      } catch (error) {
        console.error('[Content Script] Scraping failed:', error);
        sendResponse({
          error: 'Failed to scrape page',
          title: document.title,
          url: window.location.href,
          content: ''
        });
      }
      return true;
    }
    
    // NEW: Handle comprehensive page scraping for AI diagnostics
    if (request.action === 'scrapePageForDiagnostics') {
      console.log('[Content Script] Scraping page for diagnostics...');
      try {
        const diagnosticsData = scrapePageForDiagnostics();
        console.log('[Content Script] Diagnostics data:', diagnosticsData);
        sendResponse(diagnosticsData);
      } catch (error) {
        console.error('[Content Script] Diagnostics scraping failed:', error);
        sendResponse({
          error: 'Failed to scrape diagnostics',
          title: document.title,
          url: window.location.href
        });
      }
      return true;
    }
    
    return false;
  });
  
  console.log('[Content Script] Message listeners setup complete');
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
      
      // Look up datacenter info - prioritize csd_hostname, then old_hostname, then sales_hostname
      let dcEntry = datacenterDB?.find(dc => dc.csd_hostname === hostname);
      if (!dcEntry) {
        dcEntry = datacenterDB?.find(dc => dc.old_hostname === hostname);
      }
      if (!dcEntry) {
        dcEntry = datacenterDB?.find(dc => dc.sales_hostname === hostname);
      }
      
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

// ==================== PAGE SCRAPING FOR AI ====================

/**
 * Scrape page content for AI shortcut creation
 * Returns page title, URL, content summary, and error detection
 * @returns {Object} Scraped page data
 */
function scrapePageContent() {
  const url = window.location.href;
  const title = document.title;
  
  // Detect error pages
  const errorDetection = detectErrorPage();
  
  // Extract main content
  const content = extractPageContent();
  
  return {
    title: title,
    url: url,
    content: content,
    error: errorDetection.isError ? errorDetection.message : null,
    errorType: errorDetection.errorType || null
  };
}

/**
 * Detect if current page is an error page (404, 403, 500, etc.)
 * @returns {Object} Error detection result
 */
function detectErrorPage() {
  const bodyText = document.body.textContent.toLowerCase();
  const title = document.title.toLowerCase();
  
  // Check HTTP status code patterns in title/content
  const statusPatterns = [
    { pattern: /404|not found|page not found/i, type: '404', message: '⚠️ Error Page Detected: 404 Not Found' },
    { pattern: /403|forbidden|access denied/i, type: '403', message: '⚠️ Error Page Detected: 403 Forbidden' },
    { pattern: /500|internal server error|server error/i, type: '500', message: '⚠️ Error Page Detected: 500 Internal Server Error' },
    { pattern: /503|service unavailable/i, type: '503', message: '⚠️ Error Page Detected: 503 Service Unavailable' },
    { pattern: /error|oops|something went wrong/i, type: 'generic', message: '⚠️ Error Page Detected: Generic Error' }
  ];
  
  for (const { pattern, type, message } of statusPatterns) {
    if (pattern.test(title) || pattern.test(bodyText)) {
      return { isError: true, errorType: type, message: message };
    }
  }
  
  return { isError: false };
}

/**
 * Extract meaningful page content for AI summarization
 * Focuses on main content areas, removes noise
 * @returns {string} Extracted content (max 3000 chars)
 */
function extractPageContent() {
  // Try to find main content area
  const mainSelectors = [
    'main',
    '[role="main"]',
    '#content',
    '#main',
    '.content',
    '.main-content',
    'article',
    '.page-content'
  ];
  
  let mainElement = null;
  for (const selector of mainSelectors) {
    mainElement = document.querySelector(selector);
    if (mainElement) break;
  }
  
  // Fallback to body if no main content found
  const targetElement = mainElement || document.body;
  
  // Extract text content, removing scripts and styles
  const clone = targetElement.cloneNode(true);
  
  // Remove unwanted elements
  const unwantedSelectors = ['script', 'style', 'nav', 'header', 'footer', '.navigation', '.menu', '.sidebar'];
  unwantedSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  // Get clean text
  let text = clone.textContent || '';
  
  // Clean up whitespace
  text = text
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
    .trim();
  
  // Limit to 3000 characters for AI processing
  if (text.length > 3000) {
    text = text.substring(0, 3000) + '... (content truncated)';
  }
  
  return text;
}

// ==================== DIAGNOSTICS SCRAPING ====================

/**
 * Comprehensive page scraping for AI-powered diagnostics
 * Captures meta tags, console errors, performance metrics, error states, and more
 * @returns {Object} Comprehensive diagnostics data
 */
function scrapePageForDiagnostics() {
  const url = window.location.href;
  const title = document.title;
  
  // Extract all diagnostic components
  const consoleErrors = getConsoleErrors();
  const performanceMetrics = getPerformanceMetrics();
  const errorDetection = detectErrorPage();
  const testData = findTestData();
  const expiredDates = findExpiredDates();
  const cardsNotLoaded = findCardsNotLoaded();
  
  return {
    title: title,
    url: url,
    consoleErrors: consoleErrors,
    performance: performanceMetrics,
    error: errorDetection.isError ? errorDetection.message : null,
    errorType: errorDetection.errorType || null,
    testData: testData,
    expiredDates: expiredDates,
    cardsNotLoaded: cardsNotLoaded,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get recent console errors (stored by injected script)
 * @returns {Array} Last 5 console errors as strings
 */
function getConsoleErrors() {
  const storedErrors = window.__sfProToolkitErrors || [];
  return storedErrors.slice(-5).map(err => err.message || String(err));
}

/**
 * Get performance metrics from Navigation Timing API
 * @returns {Object} Performance metrics
 */
function getPerformanceMetrics() {
  const metrics = {};
  try {
    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData) {
      metrics.loadTime = Math.round(perfData.loadEventEnd - perfData.fetchStart);
      metrics.domContentLoaded = Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart);
    }
    const resources = performance.getEntriesByType('resource');
    metrics.resourceCount = resources.length;
  } catch (error) {
    console.warn('[Diagnostics] Performance metrics not available:', error);
  }
  return metrics;
}

/**
 * Find test/demo data patterns on page
 * @returns {Object} Test data indicators found
 */
function findTestData() {
  const bodyText = document.body.textContent;
  const testPatterns = [/test/gi, /demo/gi, /sample/gi, /lorem ipsum/gi];
  const examples = [];
  let found = false;

  for (const pattern of testPatterns) {
    const matches = bodyText.match(pattern);
    if (matches) {
      found = true;
      examples.push(...matches);
      if (examples.length >= 5) break;
    }
  }
  return { found, examples: [...new Set(examples)].slice(0, 5) };
}

/**
 * Find dates that are significantly in the past (potential data issues)
 * @returns {Array} Expired dates found
 */
function findExpiredDates() {
  const expiredDates = [];
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const datePattern = /\b(?:\d{1,2}[\/-]\d{1,2}[\/-]\d{4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})\b/g;
  const matches = document.body.innerText.match(datePattern) || [];

  for (const dateStr of matches) {
    try {
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime()) && parsedDate < oneYearAgo) {
        const daysAgo = Math.floor((now - parsedDate) / (1000 * 60 * 60 * 24));
        expiredDates.push({ text: dateStr, daysAgo });
      }
    } catch (e) { /* ignore invalid dates */ }
  }
  return expiredDates.slice(0, 5);
}

/**
 * Detect cards or modules that failed to load
 * @returns {Array} Unloaded components found
 */
function findCardsNotLoaded() {
  const unloadedCards = [];
  const cardSelectors = ['.sapUiComponentContainer', '.card', '[data-sap-ui-component]'];
  
  for (const selector of cardSelectors) {
    document.querySelectorAll(selector).forEach(card => {
      if (card.innerHTML.trim() === '' || card.querySelector('.sapUiComponentContainerError')) {
        const cardId = card.id || card.getAttribute('data-sap-ui') || 'Unknown Card';
        unloadedCards.push(cardId);
      }
    });
  }
  return unloadedCards.slice(0, 5);
}

// ==================== UTILITY ====================

// Log extension loaded
console.log('[SAP Pro Toolkit] Content script loaded on:', window.location.hostname);
