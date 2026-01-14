// SF Pro Toolkit - Shared Core Logic
// This file contains all shared functionality used by both popup and side panel

// ==================== I18N INITIALIZATION ====================

async function detectLanguage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && isSFPage(tab.url)) {
      const url = new URL(tab.url);
      
      const localeParam = url.searchParams.get('locale');
      if (localeParam) {
        const lang = localeParam.split('_')[0];
        return lang;
      }
      
      const pathMatch = url.pathname.match(/\/([a-z]{2}_[A-Z]{2})\//);
      if (pathMatch) {
        const lang = pathMatch[1].split('_')[0];
        return lang;
      }
    }
  } catch (error) {
    // Silently fall through to browser language
  }
  
  const browserLang = navigator.language.split('-')[0];
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

// ==================== ICON HELPER ====================


/**
 * Render SAP icon as SVG (new system)
 */
function renderSAPIcon(iconValue, iconType = 'shortcut', size = 16) {
  if (typeof window.SAPIconLibrary === 'undefined') {
    // Fallback to emoji if library not loaded
    const fallbackEmojis = {
      'shortcut': '🗺️',
      'note': '📝',
      'environment': '🌐'
    };
    return `<span style="font-size: ${size}px;">${fallbackEmojis[iconType] || '📌'}</span>`;
  }
  
  const icon = window.SAPIconLibrary.getIconByValue(iconValue, iconType);
  return window.SAPIconLibrary.renderIconSVG(icon, size);
}

/**
 * Suggest icon based on content (new feature)
 */
function suggestIconForContent(name, notes, tags, iconType = 'shortcut') {
  if (typeof window.SAPIconLibrary === 'undefined') {
    return iconType === 'note' ? '0' : '8'; // Default indices
  }
  
  return window.SAPIconLibrary.suggestIcon(name, notes, tags, iconType);
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

// ==================== URL HANDLING ====================

function buildShortcutUrl(shortcut, currentPageData) {
  const url = shortcut.url;
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  if (url.startsWith('/')) {
    if (currentPageData && currentPageData.hostname) {
      return `https://${currentPageData.hostname}${url}`;
    }
    return null;
  }
  
  if (currentPageData && currentPageData.hostname) {
    return `https://${currentPageData.hostname}/${url}`;
  }
  
  return url;
}

function isAbsoluteUrl(url) {
  return url && (url.startsWith('http://') || url.startsWith('https://'));
}

// ==================== SOLUTION TYPE DETECTION ====================

const SOLUTION_PATTERNS = {
  successfactors: [
    'successfactors.com',
    'sapsf.com',
    'sapsf.cn',
    'sapsf.eu',
    'hr.cloud.sap',
    'successfactors.eu',
    'sapcloud.cn'
  ],
  s4hana: [
    's4hana.ondemand.com',
    's4hana.cloud.sap',
    '/sap/bc/ui5',
    '/sap/bc/webdynpro',
    'fiorilaunchpad',
    '#Shell-home'
  ],
  btp: [
    'hana.ondemand.com',
    'cfapps',
    'build.cloud.sap',
    'cockpit.btp'
  ],
  ibp: [
    'ibp.cloud.sap',
    'ibplanning'
  ]
};

function detectSolutionType(url, hostname) {
  if (!url || !hostname) return null;
  
  // SuccessFactors detection
  const sfPatterns = SOLUTION_PATTERNS.successfactors;
  if (sfPatterns.some(pattern => hostname.includes(pattern))) {
    return 'successfactors';
  }
  
  // S/4HANA detection
  const s4Patterns = SOLUTION_PATTERNS.s4hana;
  if (s4Patterns.some(pattern => url.includes(pattern) || hostname.includes(pattern))) {
    return 's4hana';
  }
  
  // IBP detection
  const ibpPatterns = SOLUTION_PATTERNS.ibp;
  if (ibpPatterns.some(pattern => hostname.includes(pattern) || url.includes(pattern))) {
    return 'ibp';
  }
  
  // BTP detection
  const btpPatterns = SOLUTION_PATTERNS.btp;
  if (btpPatterns.some(pattern => hostname.includes(pattern))) {
    return 'btp';
  }
  
  return null;
}

// ==================== URL PARAMETER EXTRACTION ====================

function extractAllUrlParameters(currentUrl, contentScriptData) {
  if (!currentUrl) return {};
  
  try {
    const url = new URL(currentUrl);
    const params = {};
    
    // Get ALL query parameters
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    // Extract company ID from multiple sources (priority order):
    let companyId = '';
    
    // 1. First check content script data (most reliable)
    if (contentScriptData && contentScriptData.companyId) {
      companyId = contentScriptData.companyId;
    }
    // 2. Check URL query parameters
    else if (params.bplte_company) {
      companyId = params.bplte_company;
    }
    else if (params.company) {
      companyId = params.company;
    }
    // 3. Extract from hostname pattern (e.g., companyXYZ.successfactors.com)
    else {
      const hostnameMatch = url.hostname.match(/^([^.]+)\./);
      if (hostnameMatch && hostnameMatch[1]) {
        // Verify it looks like a company ID (not 'www', 'api', etc.)
        const potentialCompany = hostnameMatch[1];
        if (!['www', 'api', 'auth', 'login'].includes(potentialCompany.toLowerCase())) {
          companyId = potentialCompany;
        }
      }
    }
    
    return {
      hostname: url.hostname,
      protocol: url.protocol,
      pathname: url.pathname,
      params: params,
      // Specific common parameters
      company: companyId,
      proxy: params.proxy || '',
      locale: params.locale || '',
      // Build full query string
      queryString: url.search.substring(1) // Remove leading '?'
    };
  } catch (error) {
    console.error('[SF Pro Toolkit] Failed to parse URL:', error);
    return {};
  }
}

// ==================== QUICK ACTION URL BUILDING ====================

function buildQuickActionUrl(quickAction, currentPageData, currentUrl) {
  const urlInfo = extractAllUrlParameters(currentUrl);
  
  // Start with the path from Quick Action
  let targetPath = quickAction.path;
  
  // Extract hash fragment (for S/4HANA Fiori navigation like #Shell-settings)
  let hashFragment = '';
  if (targetPath.includes('#')) {
    const [pathPart, hash] = targetPath.split('#');
    targetPath = pathPart;
    hashFragment = '#' + hash;
  }
  
  // Extract path and its own parameters
  const [pathOnly, pathParams] = targetPath.split('?');
  
  // Merge: Current URL params + Quick Action params
  const allParams = new URLSearchParams(urlInfo.queryString);
  
  // Add/override with Quick Action specific params
  if (pathParams) {
    const actionParams = new URLSearchParams(pathParams);
    actionParams.forEach((value, key) => {
      // Handle template variables
      if (value.includes('{{company}}')) {
        value = value.replace('{{company}}', urlInfo.company);
      }
      if (value.includes('{{proxy}}')) {
        value = value.replace('{{proxy}}', urlInfo.proxy);
      }
      if (value.includes('{{hostname}}')) {
        value = value.replace('{{hostname}}', urlInfo.hostname);
      }
      allParams.set(key, value);
    });
  }
  
  // Build final URL with ALL parameters preserved + hash fragment
  const finalUrl = `https://${urlInfo.hostname}${pathOnly}?${allParams.toString()}${hashFragment}`;
  
  return finalUrl;
}

// ==================== KEYBOARD NAVIGATION ====================

function setupEnhancedKeyboardShortcuts(callbacks) {
  document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + K → Focus search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('globalSearch')?.focus();
    }
    
    // Cmd/Ctrl + J → New shortcut (changed from Cmd+Shift+N)
    if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
      e.preventDefault();
      if (callbacks.addShortcut) callbacks.addShortcut();
    }
    
    // Cmd/Ctrl + E → New environment
    if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
      e.preventDefault();
      console.log('[Keyboard] Cmd+E pressed, callback exists:', !!callbacks.addEnvironment);
      if (callbacks.addEnvironment) {
        callbacks.addEnvironment();
      } else {
        console.error('[Keyboard] addEnvironment callback not registered!');
      }
    }
    
    // Cmd/Ctrl + M → New note
    if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
      e.preventDefault();
      if (callbacks.addNote) callbacks.addNote();
    }
    
    // Cmd/Ctrl + Shift + 1/2/3 → Quick switch to environment 1/2/3
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && ['1', '2', '3'].includes(e.key)) {
      e.preventDefault();
      if (callbacks.quickSwitchEnv) {
        const envIndex = parseInt(e.key) - 1;
        callbacks.quickSwitchEnv(envIndex);
      }
    }
    
    // Arrow key navigation through ALL rows (not in input/textarea/select)
    if (!e.target.matches('input, textarea, select')) {
      const allRows = document.querySelectorAll('.env-row:not([style*="display: none"]), .shortcut-row:not([style*="display: none"]), .note-row:not([style*="display: none"])');
      const currentIndex = Array.from(allRows).findIndex(row => row.classList.contains('keyboard-focus'));
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateRows(allRows, currentIndex, 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateRows(allRows, currentIndex, -1);
      } else if (e.key === 'Enter' && currentIndex >= 0) {
        e.preventDefault();
        const focusedRow = allRows[currentIndex];
        
        // Determine row type and trigger appropriate action
        if (focusedRow.classList.contains('env-row')) {
          const switchBtn = focusedRow.querySelector('.switch-btn');
          if (switchBtn) switchBtn.click();
        } else if (focusedRow.classList.contains('shortcut-row')) {
          focusedRow.click();
        } else if (focusedRow.classList.contains('note-row')) {
          const copyBtn = focusedRow.querySelector('.copy-btn');
          if (copyBtn) copyBtn.click();
        }
      }
    }
    
    // Tab navigation for buttons (built-in browser behavior, but ensure visible focus)
    if (e.key === 'Tab' && !e.target.matches('input, textarea, select')) {
      // Remove row focus when tabbing to buttons
      document.querySelectorAll('.keyboard-focus').forEach(el => {
        el.classList.remove('keyboard-focus');
      });
    }
    
    // Escape → Close modals/clear search
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal.active');
      if (openModal) {
        openModal.classList.remove('active');
      } else {
        const searchInput = document.getElementById('globalSearch');
        if (searchInput && searchInput.value) {
          searchInput.value = '';
          const clearBtn = document.getElementById('clearSearch');
          if (clearBtn) clearBtn.style.display = 'none';
          if (callbacks.filterContent) callbacks.filterContent('');
        }
      }
    }
  });
  
  // Clear keyboard focus when clicking anywhere
  document.addEventListener('click', () => {
    document.querySelectorAll('.keyboard-focus').forEach(el => {
      el.classList.remove('keyboard-focus');
    });
  });
}

function navigateRows(rows, currentIndex, direction) {
  rows.forEach(row => row.classList.remove('keyboard-focus'));
  
  let newIndex = currentIndex + direction;
  if (newIndex < 0) newIndex = 0;
  if (newIndex >= rows.length) newIndex = rows.length - 1;
  
  if (rows[newIndex]) {
    rows[newIndex].classList.add('keyboard-focus');
    rows[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

// ==================== PLATFORM DETECTION ====================

function updatePlatformSpecificUI() {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';
  
  const searchHint = document.getElementById('searchKeyboardHint');
  if (searchHint) {
    searchHint.textContent = `${modKey}K`;
  }
  
  const modKey1 = document.getElementById('modKey1');
  const modKey2 = document.getElementById('modKey2');
  const modKey3 = document.getElementById('modKey3');
  if (modKey1) modKey1.textContent = modKey;
  if (modKey2) modKey2.textContent = modKey;
  if (modKey3) modKey3.textContent = modKey;
}

// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = 'info', duration = 3000, onClickCallback = null) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.className = `toast toast-${type} active`;
  
  // Add clickable styling if callback provided
  if (onClickCallback) {
    toast.style.cursor = 'pointer';
    
    // Remove any existing click handlers
    const newToast = toast.cloneNode(true);
    toast.parentNode.replaceChild(newToast, toast);
    
    // Add click handler
    newToast.addEventListener('click', () => {
      onClickCallback();
      newToast.classList.remove('active');
    });
    
    // Auto-hide after duration
    setTimeout(() => {
      newToast.classList.remove('active');
      newToast.style.cursor = '';
    }, duration);
  } else {
    toast.style.cursor = '';
    setTimeout(() => {
      toast.classList.remove('active');
    }, duration);
  }
}

// ==================== SAP AI CORE API ====================

/**
 * Load deployed models from SAP AI Core
 * @param {Object} config - AI Core configuration
 * @returns {Promise<Array>} Array of deployed model objects
 */
async function loadSAPAICoreModels(config) {
  const { clientId, clientSecret, baseUrl, authUrl, resourceGroup } = config;
  
  try {
    // Step 1: Get OAuth token
    const tokenResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Auth failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      throw new Error('No access token received');
    }
    
    // Step 2: Get deployments
    const deploymentsUrl = `${baseUrl}/v2/lm/deployments?$filter=executableId eq 'azure-openai' and targetStatus eq 'RUNNING'&resourceGroup=${resourceGroup}`;
    
    const deploymentsResponse = await fetch(deploymentsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'AI-Resource-Group': resourceGroup
      }
    });
    
    if (!deploymentsResponse.ok) {
      throw new Error(`Failed to fetch deployments: ${deploymentsResponse.status}`);
    }
    
    const deploymentsData = await deploymentsResponse.json();
    const deployments = deploymentsData.resources || [];
    
    // Filter for RUNNING status only
    const runningDeployments = deployments.filter(d => 
      d.status === 'RUNNING' && d.targetStatus === 'RUNNING'
    );
    
    if (runningDeployments.length === 0) {
      throw new Error('No running deployments found');
    }
    
    // Format for dropdown
    const models = runningDeployments.map(d => ({
      id: d.id,
      name: d.configurationName || d.id,
      status: d.status,
      scenario: d.scenarioId
    }));
    
    return models;
    
  } catch (error) {
    console.error('[SAP AI Core] Load models failed:', error);
    throw error;
  }
}

// ==================== DIAGNOSTICS ====================

async function gatherDiagnostics(currentPageData) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const browserInfo = await chrome.runtime.getPlatformInfo();
  
  const result = await chrome.storage.local.get(['shortcuts', 'environments', 'notes']);
  
  return {
    timestamp: new Date().toLocaleString(),
    instance: currentPageData || {},
    browser: `Chrome ${navigator.userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown'}`,
    extension: chrome.runtime.getManifest().version,
    platform: browserInfo.os,
    currentURL: tab?.url || 'N/A',
    shortcuts: (result.shortcuts || []).length,
    environments: (result.environments || []).length,
    notes: (result.notes || []).length
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
SAP PRO TOOLKIT - DIAGNOSTICS REPORT
v${data.extension}
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
Extension:       SAP Pro Toolkit v${data.extension}
Platform:        ${data.platform}
Detection:       ${env.detectedVia || 'N/A'}

═══════════════════════════════════════
Copy this information when reporting issues
═══════════════════════════════════════`;
}

// ==================== AI PROMPT TESTING ====================

/**
 * Test a prompt with the configured AI model
 * @param {string} promptText - The prompt to test
 * @returns {Promise<Object>} Result with content, model, provider, and usage
 */
async function testPromptWithModel(promptText) {
  if (!promptText || !promptText.trim()) {
    throw new Error('Prompt text is required');
  }
  
  try {
    // Check which API keys are available
    const openaiKey = await window.CryptoUtils.retrieveAndDecrypt('apiKeyopenai');
    const anthropicKey = await window.CryptoUtils.retrieveAndDecrypt('apiKeyanthropic');
    const sapCredentials = await window.CryptoUtils.retrieveAndDecrypt('sapAiCoreCredentials');
    
    // Get max tokens setting (default 4096)
    const maxTokensResult = await chrome.storage.local.get({ maxTokensDefault: 4096 });
    const maxTokens = maxTokensResult.maxTokensDefault;
    
    // Try SAP AI Core first (if configured with primary model)
    if (sapCredentials && sapCredentials.primaryModel) {
      console.log('[AI Test] Using SAP AI Core with model:', sapCredentials.primaryModel);
      return await testWithSAPAICore(promptText, sapCredentials, maxTokens);
    }
    
    // Try OpenAI
    if (openaiKey) {
      console.log('[AI Test] Using OpenAI');
      return await testWithOpenAI(promptText, openaiKey, maxTokens);
    }
    
    // Try Anthropic
    if (anthropicKey) {
      console.log('[AI Test] Using Anthropic');
      return await testWithAnthropic(promptText, anthropicKey, maxTokens);
    }
    
    throw new Error('No API keys configured. Please configure at least one provider in Settings.');
    
  } catch (error) {
    console.error('[AI Test] Failed:', error);
    throw error;
  }
}

/**
 * Test with OpenAI API
 */
async function testWithOpenAI(promptText, apiKey, maxTokens) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: promptText }],
      max_tokens: maxTokens
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  
  return {
    content: data.choices[0]?.message?.content || 'No response',
    model: data.model,
    provider: 'OpenAI',
    usage: {
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      cost: calculateOpenAICost(data.usage, data.model)
    }
  };
}

/**
 * Test with Anthropic API
 */
async function testWithAnthropic(promptText, apiKey, maxTokens) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: promptText }]
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  
  return {
    content: data.content[0]?.text || 'No response',
    model: data.model,
    provider: 'Anthropic',
    usage: {
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      cost: calculateAnthropicCost(data.usage, data.model)
    }
  };
}

/**
 * Test with SAP AI Core - UPDATED WITH SMART ENDPOINT STRATEGY
 * Detects model type and uses appropriate API format
 */
async function testWithSAPAICore(promptText, credentials, maxTokens) {
  const { clientId, clientSecret, baseUrl, authUrl, resourceGroup, primaryModel, primaryDeploymentId } = credentials;
  
  // Use deployment ID for API calls, model name for detection
  const deploymentId = primaryDeploymentId || primaryModel; // Fallback to primaryModel for backward compatibility
  
  console.log('[SAP AI Core] Starting test with model:', primaryModel);
  console.log('[SAP AI Core] Using deployment ID:', deploymentId);
  
  // Step 1: Get OAuth token
  const tokenResponse = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    })
  });
  
  if (!tokenResponse.ok) {
    throw new Error('SAP AI Core authentication failed');
  }
  
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  
  // Step 2: Get deployment details to extract model name and deployment URL
  const deploymentUrl = `${baseUrl}/v2/lm/deployments/${deploymentId}?resourceGroup=${resourceGroup}`;
  
  const deploymentResponse = await fetch(deploymentUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'AI-Resource-Group': resourceGroup
    }
  });
  
  if (!deploymentResponse.ok) {
    throw new Error(`Failed to get deployment details: ${deploymentResponse.status}`);
  }
  
  const deployment = await deploymentResponse.json();
  
  // Log full deployment object to debug structure
  console.log('[SAP AI Core] Full deployment response:', JSON.stringify(deployment, null, 2));
  
  // Try multiple paths to find model name
  const modelName = deployment.details?.scaling?.backendDetails?.model?.name || 
                    deployment.configurationName || 
                    deployment.scenarioId || 
                    '';
  const deploymentInferenceUrl = deployment.deploymentUrl || '';
  
  console.log('[SAP AI Core] Extracted values:', {
    modelName: modelName,
    configurationName: deployment.configurationName,
    scenarioId: deployment.scenarioId,
    deploymentUrl: deploymentInferenceUrl
  });
  
  // Step 3: Detect model type from primaryModel (now contains model identifier like "anthropic--claude-4.5-sonnet")
  const modelNameLower = modelName.toLowerCase();
  const primaryModelLower = primaryModel.toLowerCase();
  const detectionString = (primaryModelLower + ' ' + modelNameLower).toLowerCase();
  
  console.log('[SAP AI Core] Model detection - primaryModel:', primaryModel);
  console.log('[SAP AI Core] Model detection - modelName from deployment:', modelName);
  console.log('[SAP AI Core] Combined detection string:', detectionString);
  
  let requestBody, inferenceUrl, expectedResponseFormat;
  
  if (detectionString.includes('anthropic') || detectionString.includes('claude')) {
    // Anthropic models use /invoke endpoint with special format
    console.log('[SAP AI Core] Detected Anthropic/Claude model - using /invoke endpoint');
    inferenceUrl = `${deploymentInferenceUrl}/invoke`;
    requestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: promptText }]
    };
    expectedResponseFormat = 'anthropic';
    
  } else if (detectionString.includes('gpt') || detectionString.includes('openai')) {
    // OpenAI models use /chat/completions with model field
    console.log('[SAP AI Core] Detected OpenAI/GPT model - using /chat/completions endpoint');
    inferenceUrl = `${deploymentInferenceUrl}/chat/completions`;
    requestBody = {
      model: modelName,
      messages: [{ role: 'user', content: promptText }],
      max_tokens: maxTokens
    };
    expectedResponseFormat = 'openai';
    
  } else {
    // Unknown model type - default to OpenAI format (most common)
    console.log('[SAP AI Core] Unknown model type - defaulting to OpenAI format');
    console.warn('[SAP AI Core] Could not detect model type from:', { modelName, deploymentId: primaryModel });
    inferenceUrl = `${deploymentInferenceUrl}/chat/completions`;
    requestBody = {
      messages: [{ role: 'user', content: promptText }],
      max_tokens: maxTokens
    };
    expectedResponseFormat = 'openai';
  }
  
  console.log('[SAP AI Core] Inference URL:', inferenceUrl);
  console.log('[SAP AI Core] Request body:', JSON.stringify(requestBody, null, 2));
  
  // Step 4: Call inference endpoint
  const response = await fetch(inferenceUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'AI-Resource-Group': resourceGroup,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[SAP AI Core] Inference failed:', response.status, errorText);
    throw new Error(`SAP AI Core inference failed: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  console.log('[SAP AI Core] Response:', data);
  
  // Step 5: Parse response based on format
  let content, usage;
  
  if (expectedResponseFormat === 'anthropic') {
    // Anthropic format: { content: [{ text: "..." }], usage: { input_tokens, output_tokens } }
    content = data.content?.[0]?.text || 'No response';
    usage = {
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      cost: 'N/A (SAP AI Core)'
    };
  } else {
    // OpenAI format: { choices: [{ message: { content: "..." } }], usage: { prompt_tokens, completion_tokens } }
    content = data.choices?.[0]?.message?.content || 'No response';
    usage = {
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      cost: 'N/A (SAP AI Core)'
    };
  }
  
  return {
    content: content,
    model: modelName || primaryModel,
    provider: 'SAP AI Core',
    usage: usage
  };
}

/**
 * Calculate OpenAI cost
 */
function calculateOpenAICost(usage, model) {
  if (!usage) return '0.0000';
  
  // Pricing per 1K tokens (as of 2024)
  const pricing = {
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
  };
  
  const modelPricing = pricing[model] || pricing['gpt-4-turbo'];
  const inputCost = (usage.prompt_tokens / 1000) * modelPricing.input;
  const outputCost = (usage.completion_tokens / 1000) * modelPricing.output;
  
  return (inputCost + outputCost).toFixed(4);
}

/**
 * Calculate Anthropic cost
 */
function calculateAnthropicCost(usage, model) {
  if (!usage) return '0.0000';
  
  // Pricing per 1K tokens (as of 2024)
  const pricing = {
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125 }
  };
  
  const modelPricing = pricing[model] || pricing['claude-3-5-sonnet-20241022'];
  const inputCost = (usage.input_tokens / 1000) * modelPricing.input;
  const outputCost = (usage.output_tokens / 1000) * modelPricing.output;
  
  return (inputCost + outputCost).toFixed(4);
}

// ==================== EXPORTS ====================

// Export functions for use in side-panel.js and other modules
window.ToolkitCore = {
  loadSAPAICoreModels,
  testPromptWithModel
};

// Export utility functions
window.detectLanguage = detectLanguage;
window.initI18n = initI18n;
window.isSFPage = isSFPage;
window.detectEnvironmentFromURL = detectEnvironmentFromURL;
window.detectSolutionType = detectSolutionType;
window.buildShortcutUrl = buildShortcutUrl;
window.buildQuickActionUrl = buildQuickActionUrl;
window.isAbsoluteUrl = isAbsoluteUrl;
window.extractAllUrlParameters = extractAllUrlParameters;
window.updatePlatformSpecificUI = updatePlatformSpecificUI;
window.showToast = showToast;
window.renderSAPIcon = renderSAPIcon;
window.suggestIconForContent = suggestIconForContent;

// Export diagnostics functions
window.gatherDiagnostics = gatherDiagnostics;
window.formatDiagnosticsReport = formatDiagnosticsReport;

// Export constants
window.ENV_COLORS = ENV_COLORS;
window.ENV_EMOJIS = ENV_EMOJIS;
window.ENV_LABELS = ENV_LABELS;
window.COUNTRY_FLAGS = COUNTRY_FLAGS;
