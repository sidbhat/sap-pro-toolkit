// SF Pro Toolkit - Injected Script
// Runs in page context to access window.pageHeaderJsonData

(function() {
  'use strict';
  
  console.log('[SF Pro Toolkit] Injected script loaded');
  
  let lastCompanyId = null;
  let lastUrl = window.location.href;
  
  function sendPageData() {
    if (window.pageHeaderJsonData && typeof window.pageHeaderJsonData === 'object') {
      const currentCompanyId = window.pageHeaderJsonData.companyId;
      
      // Only send if data changed or first time
      if (currentCompanyId !== lastCompanyId || window.location.href !== lastUrl) {
        console.log('[SF Pro Toolkit Injected] Sending pageHeaderJsonData:', {
          companyId: currentCompanyId,
          baseUrl: window.pageHeaderJsonData.baseUrl,
          url: window.location.href,
          fullData: window.pageHeaderJsonData
        });
        
        window.postMessage({
          type: 'sf-pro-toolkit-data',
          data: window.pageHeaderJsonData
        }, '*');
        
        lastCompanyId = currentCompanyId;
        lastUrl = window.location.href;
      }
      
      return true;
    }
    return false;
  }
  
  // Initial poll for data
  let attempts = 0;
  const maxAttempts = 50; // 10 seconds
  
  const pollForData = setInterval(() => {
    attempts++;
    
    if (sendPageData()) {
      clearInterval(pollForData);
      return;
    }
    
    if (attempts >= maxAttempts) {
      console.log('[SF Pro Toolkit] pageHeaderJsonData not found after 10 seconds');
      window.postMessage({
        type: 'sf-pro-toolkit-error',
        error: 'pageHeaderJsonData not found'
      }, '*');
      clearInterval(pollForData);
    }
  }, 200);
  
  // Watch for URL changes (SPA navigation)
  let lastCheckedUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastCheckedUrl) {
      console.log('[SF Pro Toolkit] URL changed, re-checking pageHeaderJsonData');
      lastCheckedUrl = window.location.href;
      sendPageData();
    }
  }, 500);
  
  // Also watch for DOM changes that might indicate navigation
  const observer = new MutationObserver(() => {
    sendPageData();
  });
  
  // Observe title changes (common indicator of navigation)
  if (document.querySelector('title')) {
    observer.observe(document.querySelector('title'), {
      childList: true,
      characterData: true,
      subtree: true
    });
  }
  
})();
