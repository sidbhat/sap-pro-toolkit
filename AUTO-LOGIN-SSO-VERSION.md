# Auto-Login with SSO Support (Future Feature)

This document contains the auto-login implementation with SSO detection and manual content script injection. This version was created but determined to be incompatible with SSO-enabled SF environments.

## Limitations

- **SSO/SAML authentication cannot be automated** by browser extensions due to security restrictions
- When SF is configured for SSO (e.g., via accounts.cloud.sap), manual login is required
- Auto-login only works for environments using standard username/password authentication

## Files Modified (For Future Reference)

### manifest.json Changes

Added permissions:
```json
"permissions": [
  "storage",
  "tabs",
  "activeTab",
  "sidePanel",
  "cookies",
  "scripting"  // NEW: Required for chrome.scripting.executeScript()
],

"web_accessible_resources": [
  {
    "resources": [
      "content/injected.js",
      "panel/crypto-utils.js",  // NEW: Required for credential decryption in content script
      "resources/dc.json",
      // ...
    ],
    "matches": ["<all_urls>"]
  }
]
```

### background/background.js Changes

Added manual content script injection after environment switching:

```javascript
// Step 5: Wait for page to load, then manually inject content script
// This is needed because clearing cookies + programmatic navigation may prevent
// automatic content script injection
chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo, tab) {
  if (updatedTabId === tabId && changeInfo.status === 'complete') {
    console.log('[Auto-Login] Page load complete, injecting content script...');
    
    // Remove this listener after it fires once
    chrome.tabs.onUpdated.removeListener(listener);
    
    // Manually execute content script to trigger auto-login
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content/content.js']
    }).then(() => {
      console.log('[Auto-Login] Content script injected successfully');
    }).catch(error => {
      console.error('[Auto-Login] Failed to inject content script:', error);
    });
  }
});
```

Also added company ID URL parameterization:

```javascript
// If credentials with company ID provided, append ?company= parameter to bypass company ID page
let newURL = `https://${targetHostname}/`;

if (credentials && credentials.enabled && credentials.companyId) {
  // For SuccessFactors systems, append company ID as query parameter
  if (targetHostname.includes('hr.cloud.sap') || 
      targetHostname.includes('sapsf.') || 
      targetHostname.includes('successfactors')) {
    newURL = `https://${targetHostname}/login?company=${encodeURIComponent(credentials.companyId)}`;
    console.log('[Environment Switch] Appending company ID to URL:', credentials.companyId);
  }
}
```

### content/content.js Changes

Added extensive debug logging and SSO detection:

```javascript
/**
 * Detect SSO/OAuth redirect pages
 * @param {string} url - Current page URL
 * @returns {boolean} True if SSO redirect detected
 */
function isSSORedirect(url) {
  const ssoIndicators = [
    'login.microsoftonline.com',
    'accounts.sap.com',
    'accounts.cloud.sap',
    'accounts.ondemand.com',  // NEW: SAP IAS
    'okta.com',
    '/oauth2/',
    '/saml2/',
    '/idp/',
    'SAMLRequest=',  // NEW: SAML redirect parameter
    'authorization_endpoint',
    'sso.redirect'
  ];
  
  return ssoIndicators.some(indicator => url.includes(indicator));
}
```

## Why This Approach Didn't Work

1. When navigating to `https://hostname/login?company=ID`, SF checks company authentication settings
2. If SSO is enabled, SF redirects to external identity provider (accounts.cloud.sap)
3. Content script cannot be injected on external domains (manifest permission error)
4. Even if injected, SSO authentication requires OAuth/SAML flows that cannot be automated

## Alternative Approach for SSO Environments

For SSO-enabled environments, consider:
1. Skip auto-login entirely (manual login required)
2. Show notification: "This environment uses SSO - please log in manually"
3. After SSO completes, user returns to SF and extension works normally

## When to Use This Code

This implementation can be restored when:
- Testing with SF environments using **standard username/password** authentication (no SSO)
- Customer has disabled SSO for specific test companies
- Building enterprise version with SSO credential provider integration (advanced feature)

## Date Saved

2026-01-12

## Version

Extension v1.5.0
