// SF Pro Toolkit - AI Features Module
// Heavy AI logic: diagnostics, search, cost estimator, prompts

// ==================== AI DIAGNOSTICS ====================

window.showDiagnosticsModal = async function () {
  const modal = document.getElementById('diagnosticsModal');
  const contentDiv = document.getElementById('diagnosticsContent');

  modal.removeAttribute('data-ai-report');
  modal.removeAttribute('data-page-title');

  // Add null checks for buttons that may not exist in modal
  const saveBtn = document.getElementById('saveDiagnosticsBtn');
  const downloadBtn = document.getElementById('downloadDiagnosticsBtn');
  if (saveBtn) saveBtn.style.display = 'none';
  if (downloadBtn) downloadBtn.style.display = 'none';

  modal.classList.add('active');
  contentDiv.innerHTML = `
    <div class="diagnostics-loading">
      <div class="spinner"></div>
      <span>Click "Analyze with AI" to start...</span>
    </div>
  `;
};

window.closeDiagnosticsModal = function () {
  document.getElementById('diagnosticsModal').classList.remove('active');
};


window.regenerateDiagnosticsWithAI = async function () {
  // Check if AI features are configured
  if (!window.ToolkitCore || !window.ToolkitCore.testPromptWithModel) {
    if (window.showToast) {
      window.showToast('⚙️ AI features require configuration', 'warning');
      setTimeout(() => {
        if (window.showToast) window.showToast('💡 Go to Settings → API Keys to configure OpenAI, Anthropic, or SAP AI Core', 'info');
      }, 2000);
    }
    return;
  }

  const contentDiv = document.getElementById('diagnosticsContent');
  const modal = document.getElementById('diagnosticsModal');
  const regenerateBtn = document.getElementById('regenerateDiagnosticsWithAIBtn');

  // Disable button to prevent duplicate calls
  if (regenerateBtn) {
    regenerateBtn.disabled = true;
    regenerateBtn.textContent = '⏳ Analyzing...';
  }

  // Apply inline loading state (same pattern as addShortcutWithAI)
  contentDiv.style.background = 'rgba(16, 185, 129, 0.1)';
  contentDiv.style.borderColor = '#10B981';

  contentDiv.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; padding: 16px;">
      <div class="spinner"></div>
      <span>⏳ AI is analyzing the page...</span>
    </div>
  `;

  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab || !tab.url) {
      throw new Error('No active tab found');
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      });
    } catch (injectError) {
      console.warn('[AI Diagnostics] Content script injection failed, proceeding with URL-based analysis:', injectError.message);
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    const scrapedData = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: 'scrapePageForDiagnostics' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          console.warn('[AI Diagnostics] Scrape failed, using fallback data.', chrome.runtime.lastError?.message);
          resolve({
            title: tab.title,
            url: tab.url,
            performance: {},
            consoleErrors: [],
            testData: { found: false },
            expiredDates: [],
            cardsNotLoaded: [],
            error: null
          });
        } else {
          resolve(response);
        }
      });
    });

    if (window.loadCurrentPageData) await window.loadCurrentPageData();
    const standardDiag = window.currentPageData && typeof formatDiagnosticsReport === 'function' && typeof gatherDiagnostics === 'function'
      ? formatDiagnosticsReport(await gatherDiagnostics(window.currentPageData))
      : 'Standard diagnostics not available for this page.';

    const prompt = await buildDiagnosticsPrompt(standardDiag, scrapedData, window.currentPageData);
    const result = await window.ToolkitCore.testPromptWithModel(prompt);

    if (!result || !result.content) {
      throw new Error('No response from AI');
    }

    const formattedResponse = markdownToHTML(result.content);

    modal.setAttribute('data-ai-report', result.content);
    modal.setAttribute('data-page-title', scrapedData.title || tab.title);

    // ✅ MATCH AI NOTE RESPONSE FORMAT - Add green background styling
    contentDiv.innerHTML = `
      <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.12) 100%); border-left: 3px solid #10B981; padding: 16px; border-radius: 6px;">
        <div class="ai-response" style="font-size: 13px; line-height: 1.6; color: var(--text-primary);">
          ${formattedResponse}
        </div>
        
        <div style="margin-top: 12px; padding: 10px; background: rgba(16, 185, 129, 0.15); border-radius: 4px; font-size: 10px; line-height: 1.4; color: var(--text-secondary);">
          <strong style="color: #10B981;">✨ AI INSIGHTS</strong> – This response was generated by AI analyzing your page. Always verify information independently before making decisions.
        </div>
      </div>
    `;

    // ✅ FIX: Add null checks for buttons
    const saveBtn = document.getElementById('saveDiagnosticsBtn');
    const downloadBtn = document.getElementById('downloadDiagnosticsBtn');
    if (saveBtn) saveBtn.style.display = 'inline-flex';
    if (downloadBtn) downloadBtn.style.display = 'inline-flex';

    if (window.showToast) window.showToast('✨ AI diagnostics generated ✓', 'success');

  } catch (error) {
    console.error('[AI Diagnostics] Failed:', error);
    if (window.showToast) window.showToast(`AI diagnostics failed: ${error.message}`, 'error');
    contentDiv.innerHTML = `<p style="color: var(--env-production);">Failed to generate AI diagnostics. Please try again.</p>`;

    const saveBtn = document.getElementById('saveDiagnosticsBtn');
    const downloadBtn = document.getElementById('downloadDiagnosticsBtn');
    if (saveBtn) saveBtn.style.display = 'none';
    if (downloadBtn) downloadBtn.style.display = 'none';
  } finally {
    // Clear inline loading styles and re-enable button
    contentDiv.style.background = '';
    contentDiv.style.borderColor = '';

    const regenerateBtn = document.getElementById('regenerateDiagnosticsWithAIBtn');
    if (regenerateBtn) {
      regenerateBtn.disabled = false;
      regenerateBtn.innerHTML = '✨ AI';
    }
  }
};

window.saveDiagnosticsAsNote = async function () {
  const modal = document.getElementById('diagnosticsModal');
  const reportContent = modal.getAttribute('data-ai-report');
  const pageTitle = modal.getAttribute('data-page-title') || 'Untitled Page';

  if (!reportContent) {
    if (window.showToast) window.showToast('No report content to save.', 'warning');
    return;
  }

  try {
    const cleanContent = stripMarkdown(reportContent);
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const noteTitle = `Diagnostics Report - ${pageTitle} - ${date}`;

    const newNote = {
      id: `note-${Date.now()}`,
      title: noteTitle,
      content: cleanContent,
      noteType: 'documentation',
      icon: 'document',
      tags: ['diagnostics', 'system-analysis'],
      timestamp: Date.now(),
    };

    const newNotes = [...window.notes, newNote];
    window.setNotes(newNotes);

    const storageKey = `notes_${window.currentProfile}`;
    await chrome.storage.local.set({ [storageKey]: newNotes });

    window.renderNotes();
    if (window.showToast) window.showToast('Diagnostics report saved as a note ✓', 'success');
  } catch (error) {
    console.error('[Save Diagnostics] Failed:', error);
    if (window.showToast) window.showToast('Failed to save report as note.', 'error');
  }
};

window.downloadDiagnosticsReport = async function () {
  const modal = document.getElementById('diagnosticsModal');
  const reportContent = modal.getAttribute('data-ai-report');

  if (!reportContent) {
    if (window.showToast) window.showToast('No report content to download.', 'warning');
    return;
  }

  try {
    const cleanContent = stripMarkdown(reportContent);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `diagnostics-report-${timestamp}.txt`;

    const blob = new Blob([cleanContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.showToast) window.showToast('Report downloaded successfully ✓', 'success');
  } catch (error) {
    console.error('[Download Diagnostics] Failed:', error);
    if (window.showToast) window.showToast('Failed to download report.', 'error');
  }
};

async function buildDiagnosticsPrompt(standardDiag, scrapedData, currentPageData) {
  const pageTitle = scrapedData.title || currentPageData?.hostname || 'Unknown Page';
  const currentUrl = scrapedData.url || currentPageData?.url || 'Unknown URL';
  const pageType = currentPageData?.solutionType || detectPageType(currentUrl);
  const loadTime = scrapedData.performance?.loadTime;
  const domReady = scrapedData.performance?.domContentLoaded;
  const resourceCount = scrapedData.performance?.resourceCount;
  const consoleErrors = scrapedData.consoleErrors || [];
  const testDataFound = scrapedData.testData?.found || false;
  const expiredDates = scrapedData.expiredDates || [];
  const errorStates = scrapedData.error || 'None detected';
  const failedElements = scrapedData.cardsNotLoaded || [];

  // Load external prompt template
  let promptTemplate = '';
  try {
    promptTemplate = await window.PromptLoader.loadAndCachePrompt('ai_diagnostics');
  } catch (err) {
    console.error('[AI Diagnostics] Failed to load prompt template:', err);
    throw new Error('Failed to load AI prompt configuration');
  }

  // Populate template
  const prompt = window.PromptLoader.fillPromptTemplate(promptTemplate, {
    pageTitle: pageTitle,
    currentUrl: currentUrl,
    dataCenter: currentPageData?.datacenter || 'Unknown',
    consoleErrorsCount: consoleErrors.length,
    loadTime: loadTime || 'N/A',
    testDataFound: testDataFound ? '⚠️ Test Data Found' : 'Clean',
    expiredDatesCount: expiredDates.length,
    environment: currentPageData?.environment || 'Unknown',
    timestamp: new Date().toISOString()
  });

  return prompt;
}

function detectPageType(url) {
  if (!url) return 'Unknown';

  if (url.includes('sapsf.com') || url.includes('successfactors')) return 'SuccessFactors';
  if (url.includes('s4hana') || url.includes('.ondemand.com')) return 'S/4HANA';
  if (url.includes('hana.ondemand') || url.includes('cfapps') || url.includes('build.cloud.sap')) return 'SAP BTP';
  if (url.includes('ibp.cloud.sap') || url.includes('ibplanning')) return 'SAP IBP';

  if (url.includes('salesforce.com')) return 'Salesforce';
  if (url.includes('workday.com')) return 'Workday';
  if (url.includes('oracle.com')) return 'Oracle';
  if (url.includes('microsoft.com') || url.includes('office.com')) return 'Microsoft';
  if (url.includes('github.com')) return 'GitHub';
  if (url.includes('stackoverflow.com')) return 'Stack Overflow';

  if (url.includes('localhost') || url.includes('127.0.0.1')) return 'Local Development';
  if (url.startsWith('chrome://') || url.startsWith('edge://')) return 'Browser Internal';

  return 'Web Application';
}

// ==================== AI SEARCH ====================

window.performAISearch = async function (query) {
  console.log('[AI Search] Starting with query:', query);

  if (!document.body.classList.contains('ai-active')) {
    if (window.showToast) {
      window.showToast('⚙️ AI features require configuration', 'warning');
      setTimeout(() => {
        if (window.showToast) window.showToast('💡 Go to Settings → API Keys to configure OpenAI, Anthropic, or SAP AI Core', 'info');
      }, 2000);
    }
    return;
  }

  if (!window.ToolkitCore || !window.ToolkitCore.testPromptWithModel) {
    if (window.showToast) {
      window.showToast('⚙️ AI features require configuration', 'warning');
      setTimeout(() => {
        if (window.showToast) window.showToast('💡 Go to Settings → API Keys to configure OpenAI, Anthropic, or SAP AI Core', 'info');
      }, 2000);
    }
    return;
  }

  const aiSearchBtn = document.getElementById('aiSearchBtn');

  // Disable button to prevent duplicate calls
  if (aiSearchBtn) aiSearchBtn.disabled = true;

  try {
    const aiInsightsBar = document.getElementById('aiInsightsBar');
    const aiInsightsContent = document.getElementById('aiInsightsContent');

    if (!aiInsightsBar || !aiInsightsContent) {
      console.error('[AI Search] Insights bar elements not found');
      return;
    }

    // Apply inline loading state (same pattern as addShortcutWithAI)
    aiInsightsBar.style.display = 'block';
    aiInsightsContent.style.background = 'rgba(16, 185, 129, 0.1)';
    aiInsightsContent.style.borderColor = '#10B981';

    aiInsightsContent.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; padding: 12px;">
        <span>⏳ Analyzing toolkit data across all profiles...</span>
      </div>
    `;

    console.log('[AI Search] Building comprehensive context...');
    const context = await buildComprehensiveContext(query);

    const prompt = await buildEnhancedPrompt(query, context);
    console.log('[AI Search] Prompt built with', context.stats.totalItems, 'items analyzed');

    const result = await window.ToolkitCore.testPromptWithModel(prompt);

    if (!result || !result.content) {
      throw new Error('No response from AI');
    }

    displayEnhancedAISearchResults(query, result.content, context);

  } catch (error) {
    console.error('[AI Search] Failed:', error);
    if (window.showToast) window.showToast(`AI search failed: ${error.message}`, 'error');

    const aiInsightsBar = document.getElementById('aiInsightsBar');
    if (aiInsightsBar) aiInsightsBar.style.display = 'none';
  } finally {
    // Clear inline loading styles and re-enable button
    const aiInsightsContent = document.getElementById('aiInsightsContent');
    if (aiInsightsContent) {
      aiInsightsContent.style.background = '';
      aiInsightsContent.style.borderColor = '';
    }

    const aiSearchBtn = document.getElementById('aiSearchBtn');
    if (aiSearchBtn) aiSearchBtn.disabled = false;
  }
};

async function buildComprehensiveContext(query) {
  console.log('[AI Search Context] Loading all profile data...');

  const allData = await window.loadAllProfilesData();
  const currentPageInfo = window.currentPageData;
  const activeProfile = window.currentProfile;
  const allProfiles = window.availableProfiles;
  const allSolutions = window.solutions;

  const groupByProfile = (items) => {
    const grouped = {};
    items.forEach(item => {
      const profileId = item.profileId || 'unknown';
      if (!grouped[profileId]) {
        grouped[profileId] = {
          profileName: item.profileName,
          profileIcon: item.profileIcon,
          items: []
        };
      }
      grouped[profileId].items.push(item);
    });
    return grouped;
  };

  const environmentsByProfile = groupByProfile(allData.environments);
  const shortcutsByProfile = groupByProfile(allData.shortcuts);
  const notesByProfile = groupByProfile(allData.notes);

  const context = {
    query: query,

    activeProfile: {
      id: activeProfile,
      name: allProfiles.find(p => p.id === activeProfile)?.name || 'Unknown',
      icon: allProfiles.find(p => p.id === activeProfile)?.icon || '📁',
      itemCounts: {
        environments: window.environments.length,
        shortcuts: window.shortcuts.length,
        notes: window.notes.length
      }
    },

    allProfiles: allProfiles.map(p => ({
      id: p.id,
      name: p.name,
      icon: p.icon || '📁',
      description: p.description || '',
      type: p.type
    })),

    environmentsByProfile: environmentsByProfile,
    shortcutsByProfile: shortcutsByProfile,
    notesByProfile: notesByProfile,

    currentContext: {
      onSAPSystem: !!currentPageInfo,
      solutionType: currentPageInfo?.solutionType || 'none',
      hostname: currentPageInfo?.hostname || 'not on SAP system',
      datacenter: currentPageInfo?.datacenter || 'Unknown',
      environment: currentPageInfo?.environment || 'Unknown'
    },

    quickActions: allSolutions.map(s => ({
      solution: s.name,
      solutionId: s.id,
      actionsCount: s.quickActions?.length || 0,
      actions: (s.quickActions || []).map(qa => ({
        id: qa.id,
        name: qa.name,
        path: qa.path
      }))
    })),

    stats: {
      totalProfiles: allProfiles.length,
      totalEnvironments: allData.environments.length,
      totalShortcuts: allData.shortcuts.length,
      totalNotes: allData.notes.length,
      totalQuickActions: allSolutions.reduce((sum, s) => sum + (s.quickActions?.length || 0), 0),
      totalItems: allData.environments.length + allData.shortcuts.length + allData.notes.length
    }
  };

  console.log('[AI Search Context] Built comprehensive context:', {
    profiles: context.stats.totalProfiles,
    items: context.stats.totalItems,
    environments: context.stats.totalEnvironments,
    shortcuts: context.stats.totalShortcuts,
    notes: context.stats.totalNotes,
    quickActions: context.stats.totalQuickActions
  });

  return context;
}

async function buildEnhancedPrompt(query, context) {
  const profilesList = context.allProfiles.map(p =>
    `  • ${p.icon} ${p.name} (${p.type}) - ${p.description}`
  ).join('\n');

  const envsByProfile = Object.entries(context.environmentsByProfile).map(([profileId, data]) => {
    const items = data.items.slice(0, 5);
    return `  ${data.profileIcon} ${data.profileName} (${data.items.length}):
${items.map(env => `    - ${env.name} (${env.type}) - ${env.hostname}`).join('\n')}`;
  }).join('\n');

  const shortcutsByProfile = Object.entries(context.shortcutsByProfile).map(([profileId, data]) => {
    const items = data.items.slice(0, 5);
    return `  ${data.profileIcon} ${data.profileName} (${data.items.length}):
${items.map(sc => `    - ${sc.name}`).join('\n')}`;
  }).join('\n');

  const notesByProfile = Object.entries(context.notesByProfile).map(([profileId, data]) => {
    const items = data.items.slice(0, 5);
    return `  ${data.profileIcon} ${data.profileName} (${data.items.length}):
${items.map(note => `    - ${note.title} (${note.noteType || 'note'})`).join('\n')}`;
  }).join('\n');

  const quickActionsList = context.quickActions
    .filter(qa => qa.actionsCount > 0)
    .map(qa => `  ⚡ ${qa.solution} (${qa.actionsCount}): ${qa.actions.slice(0, 3).map(a => a.name).join(', ')}${qa.actionsCount > 3 ? '...' : ''}`)
    .join('\n');

  // Load external prompt template
  let promptTemplate = '';
  try {
    promptTemplate = await window.PromptLoader.loadAndCachePrompt('ai_search_insights');
  } catch (err) {
    console.error('[AI Search] Failed to load prompt template:', err);
    throw new Error('Failed to load AI prompt configuration');
  }

  // Populate template
  const prompt = window.PromptLoader.fillPromptTemplate(promptTemplate, {
    query: query,
    activeProfileName: context.activeProfile.name,
    hostname: context.currentContext.hostname,
    totalItems: context.stats.totalItems,
    profilesList: profilesList,
    envsByProfile: envsByProfile || '  (No environments)',
    shortcutsByProfile: shortcutsByProfile || '  (No shortcuts)',
    notesByProfile: notesByProfile || '  (No notes)',
    quickActionsList: quickActionsList || '  (No Quick Actions)'
  });

  console.log('[AI Search] Prompt length:', prompt.length, 'characters');
  return prompt;
}

function displayEnhancedAISearchResults(query, response, context) {
  const aiInsightsContent = document.getElementById('aiInsightsContent');

  if (!aiInsightsContent) return;

  // Clear inline loading styles
  aiInsightsContent.style.background = '';
  aiInsightsContent.style.borderColor = '';

  const formattedResponse = markdownToHTML(response);

  const html = `
    <div style="padding: 12px;">
      <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border);">
        <strong>🔍 "${query}"</strong><br>
        <span style="opacity: 0.8;">📊 Analyzed ${context.stats.totalEnvironments} environments, ${context.stats.totalShortcuts} shortcuts, ${context.stats.totalNotes} notes across ${context.stats.totalProfiles} profiles</span>
      </div>
      
      <div class="ai-response" style="font-size: 13px; line-height: 1.6; color: var(--text-primary);">
        ${formattedResponse}
      </div>
      
      <div style="margin-top: 16px; padding: 12px; background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10B981; border-radius: 4px; font-size: 11px; line-height: 1.5; color: var(--text-secondary);">
        <strong style="color: #10B981;">✨ AI INSIGHTS</strong><br>
        This response was generated by AI analyzing your toolkit data. While AI provides helpful insights, always verify information independently before making decisions.
      </div>
    </div>
  `;

  aiInsightsContent.innerHTML = html;
  if (window.showToast) window.showToast('AI search complete ✓', 'success');
}

// ==================== AI PROMPTS ====================

window.handleRunAIPrompt = async function () {
  const textarea = document.getElementById('noteContent');
  const content = textarea.value.trim();

  if (!content) {
    if (window.showToast) window.showToast('Please enter prompt content first', 'warning');
    return;
  }

  if (!window.ToolkitCore || !window.ToolkitCore.testPromptWithModel) {
    console.error('[AI] ToolkitCore or testPromptWithModel not available');
    if (window.showToast) window.showToast('AI features not available - ToolkitCore missing', 'error');
    return;
  }

  // Disable button and show progress
  const runBtn = document.getElementById('enhanceWithAIBtn');
  if (runBtn) {
    runBtn.disabled = true;
    runBtn.innerHTML = '⏳ Running...';
  }

  // Apply inline loading state (same pattern as addShortcutWithAI)
  textarea.style.background = 'rgba(16, 185, 129, 0.1)';
  textarea.style.borderColor = '#10B981';

  const originalContent = content;
  textarea.value = '⏳ Running AI prompt...';

  try {

    const pricingData = await loadLLMPricing();

    let promptTemplate = '';
    try {
      promptTemplate = await window.PromptLoader.loadAndCachePrompt('note_refiner');
    } catch (err) {
      console.error('[AI Note] Failed to load prompt template:', err);
      // Fallback if loading fails, just use original content but warn
      promptTemplate = originalContent;
      if (window.showToast) window.showToast('Note refiner template missing, running raw prompt', 'warning');
    }

    const systemWrapper = window.PromptLoader.fillPromptTemplate(promptTemplate, {
      userContent: originalContent
    });

    const result = await window.ToolkitCore.testPromptWithModel(systemWrapper);

    if (!result) {
      if (window.showToast) window.showToast('No response from AI', 'warning');
      return;
    }

    const modelPricing = pricingData ? lookupModelPricing(result.model, pricingData) : null;

    let costs, modelData;

    if (modelPricing && result.usage?.inputTokens && result.usage?.outputTokens) {
      const inputCost = (result.usage.inputTokens / 1000) * modelPricing.input;
      const outputCost = (result.usage.outputTokens / 1000) * modelPricing.output;
      const totalCost = inputCost + outputCost;

      costs = {
        inputCost: inputCost.toFixed(4),
        outputCost: outputCost.toFixed(4),
        totalCost: totalCost.toFixed(4)
      };

      modelData = {
        provider: result.provider,
        model: result.model,
        inputCostPer1K: modelPricing.input,
        outputCostPer1K: modelPricing.output,
        disclaimer: modelPricing.disclaimer || null
      };

      console.log('[AI] Calculated costs from pricing data:', costs);
    } else {
      costs = {
        inputCost: (result.usage?.cost ? (parseFloat(result.usage.cost) / 2).toFixed(4) : '0.0000'),
        outputCost: (result.usage?.cost ? (parseFloat(result.usage.cost) / 2).toFixed(4) : '0.0000'),
        totalCost: result.usage?.cost || '0.0000'
      };

      modelData = {
        provider: result.provider,
        model: result.model,
        inputCostPer1K: 0,
        outputCostPer1K: 0
      };

      console.warn('[AI] No pricing data found, using fallback costs');
    }

    const estimateResult = {
      modelId: result.model,
      modelData: modelData,
      inputTokens: result.usage?.inputTokens || 0,
      outputTokens: result.usage?.outputTokens || 0,
      costs: costs,
      isEstimate: false,
      responseContent: result.content
    };

    showEstimateResults(estimateResult);

  } catch (error) {
    console.error('[AI] Prompt execution failed:', error);
    const textarea = document.getElementById('noteContent');
    textarea.value = originalContent; // Restore original content on error
    if (window.showToast) window.showToast(`AI test failed: ${error.message}`, 'error');
  } finally {
    // Clear inline loading styles and re-enable button
    const textarea = document.getElementById('noteContent');
    textarea.style.background = '';
    textarea.style.borderColor = '';

    const runBtn = document.getElementById('enhanceWithAIBtn');
    if (runBtn) {
      runBtn.disabled = false;
      runBtn.innerHTML = '✨ AI';
    }
  }
};

let llmPricingData = null;

window.loadLLMPricing = async function () {
  if (llmPricingData) return llmPricingData;

  try {
    const response = await fetch(chrome.runtime.getURL('resources/llm-pricing.json'));
    llmPricingData = await response.json();
    console.log('[AI] Loaded pricing data for', Object.keys(llmPricingData.models).length, 'models');
    return llmPricingData;
  } catch (error) {
    console.error('[AI] Failed to load pricing data:', error);
    if (window.showToast) window.showToast('Failed to load pricing data', 'error');
    return null;
  }
}

window.lookupModelPricing = function (modelId, pricingData) {
  if (!modelId || !pricingData || !pricingData.models) return null;

  const modelLower = modelId.toLowerCase();

  const keywordMap = {
    'sonnet-4.5': 'claude-3-5-sonnet-20240620',
    'sonnet-3.5': 'claude-3-5-sonnet-20240620',
    'opus': 'claude-3-opus-20240229',
    'sonnet': 'claude-3-sonnet-20240229',
    'haiku': 'claude-3-haiku-20240307',
    'gpt-4-turbo': 'gpt-4-turbo',
    'gpt-4': 'gpt-4',
    'gpt-3.5': 'gpt-3.5-turbo',
    'gpt-35': 'gpt-3.5-turbo'
  };

  for (const [keyword, pricingKey] of Object.entries(keywordMap)) {
    if (modelLower.includes(keyword)) {
      if (modelLower.includes('sap') || modelLower.includes('ai-core') || modelLower.includes('anthropic--') || modelLower.includes('openai--')) {
        const sapVariants = [
          'sap-ai-core-gpt-4',
          'sap-ai-core-gpt-35-turbo',
          'sap-ai-core-claude-3-sonnet'
        ];

        for (const sapKey of sapVariants) {
          if (sapKey.includes(keyword.replace('.', '')) || sapKey.includes(keyword.split('-')[0])) {
            if (pricingData.models[sapKey]) {
              console.log('[AI Pricing] Matched SAP AI Core variant:', modelId, '→', sapKey);
              return pricingData.models[sapKey];
            }
          }
        }
      }

      if (pricingData.models[pricingKey]) {
        console.log('[AI Pricing] Matched base model:', modelId, '→', pricingKey);
        return pricingData.models[pricingKey];
      }
    }
  }

  console.warn('[AI Pricing] No pricing found for model:', modelId);
  return null;
}

function calculateReadingTime(text) {
  if (!text) return '< 1 min read';

  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);

  if (minutes < 1) return '< 1 min read';
  if (minutes === 1) return '1 min read';
  return `${minutes} min read`;
}

function showEstimateResults(result) {
  const modal = document.getElementById('aiTestResultsModal');
  const titleEl = document.getElementById('aiTestResultsTitle');
  const contentEl = document.getElementById('aiTestResultsContent');

  if (!modal || !titleEl || !contentEl) {
    console.error('[AI] Results modal elements not found');
    return;
  }

  titleEl.textContent = '✨ AI Response';

  const readingTime = calculateReadingTime(result.responseContent);

  const metadataBadges = `
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
      <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; font-size: 11px; font-weight: 600; color: #10B981;">
        🤖 ${result.modelData.model || result.modelId}
      </span>
      <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; font-size: 11px; font-weight: 600; color: #3B82F6;">
        📊 ${(result.inputTokens + result.outputTokens).toLocaleString()} tokens
      </span>
      <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; font-size: 11px; font-weight: 600; color: #8B5CF6;">
        ⏱️ ${readingTime}
      </span>
    </div>
  `;

  const html = `
    ${metadataBadges}
    
    <div class="llm-response-card">
      <div class="llm-response-header">
        <span class="llm-response-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          AI Response
        </span>
      </div>
      <div class="llm-response-content ai-response">${markdownToHTML(result.responseContent)}</div>
      <div style="margin-top: 12px; padding: 10px; background: rgba(16, 185, 129, 0.15); border-radius: 4px; font-size: 10px; line-height: 1.4; color: var(--text-secondary);">
        <strong style="color: #10B981;">✨ AI INSIGHTS</strong> – This response was generated by AI. Always verify information independently before making decisions.
      </div>
    </div>
  `;

  contentEl.innerHTML = html;

  modal.dataset.responseContent = result.responseContent || '';
  modal.dataset.modelName = result.modelData.model || result.modelId;
  modal.dataset.provider = result.modelData.provider || 'Unknown';
  modal.dataset.inputTokens = result.inputTokens;
  modal.dataset.outputTokens = result.outputTokens;
  modal.dataset.totalCost = result.costs.totalCost;

  modal.classList.add('active');

  const saveBtn = modal.querySelector('#saveAiResponseBtn');
  const copyBtn = modal.querySelector('#copyAiResponseBtn');
  const calcBtn = modal.querySelector('#openEnterpriseCalcBtn');

  if (saveBtn) {
    saveBtn.onclick = () => saveAIResponseAsNote(result);
  }

  if (copyBtn) {
    copyBtn.onclick = copyAIResponseToClipboard;
  }

  if (calcBtn) {
    calcBtn.onclick = () => openEnterpriseCalculator(result);
  }
}

window.saveAIResponseAsNote = async function (fallbackResult) {
  const modal = document.getElementById('aiTestResultsModal');

  let responseContent = modal.dataset.responseContent;
  let modelName = modal.dataset.modelName;
  let provider = modal.dataset.provider;
  let inputTokens = modal.dataset.inputTokens;
  let outputTokens = modal.dataset.outputTokens;
  let totalCost = modal.dataset.totalCost;

  if (!responseContent || !modelName) {
    if (fallbackResult && fallbackResult.responseContent) {
      responseContent = fallbackResult.responseContent;
      modelName = fallbackResult.modelData.model;
      provider = fallbackResult.modelData.provider;
      inputTokens = fallbackResult.inputTokens;
      outputTokens = fallbackResult.outputTokens;
      totalCost = fallbackResult.costs.totalCost;
    } else {
      if (window.showToast) window.showToast('No response content to save', 'warning');
      return;
    }
  }

  try {
    const timestamp = new Date().toLocaleString();
    const dateStamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const title = `AI Response - ${dateStamp}`;

    const cleanResponse = stripMarkdown(responseContent);

    let costLine = totalCost ? `Cost: $${totalCost}\n` : '';

    const content = `${cleanResponse}

---
Model: ${provider} - ${modelName}
Input Tokens: ${Number(inputTokens).toLocaleString()}
Output Tokens: ${Number(outputTokens).toLocaleString()}
${costLine}Generated: ${timestamp}`;

    const noteObject = {
      id: `note-${Date.now()}`,
      title,
      content,
      icon: 'ai',
      noteType: 'ai-prompt',
      tags: ['ai', 'llm-response', provider ? provider.toLowerCase() : 'ai'],
      timestamp: Date.now(),
      aiConfig: {
        defaultModel: modelName,
        provider: provider
      }
    };

    const newNotes = [...window.notes, noteObject];
    window.setNotes(newNotes);

    const storageKey = `notes_${window.currentProfile}`;
    await chrome.storage.local.set({ [storageKey]: newNotes });

    window.renderNotes();
    window.closeAiTestResultsModal();

    if (window.showToast) window.showToast('AI response saved as note ✓', 'success');

  } catch (error) {
    console.error('[Save AI Response] Failed:', error);
    if (window.showToast) window.showToast(`Failed to save: ${error.message}`, 'error');
  }
};

window.copyAIResponseToClipboard = async function () {
  const modal = document.getElementById('aiTestResultsModal');
  const responseContent = modal.dataset.responseContent;

  if (!responseContent) {
    if (window.showToast) window.showToast('No response content to copy.', 'warning');
    return;
  }

  try {
    const plainText = stripMarkdown(responseContent);

    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(plainText);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = plainText;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    if (window.showToast) window.showToast('Response copied to clipboard ✓', 'success');
  } catch (error) {
    console.error('[Copy AI Response] Failed:', error);
    if (window.showToast) window.showToast('Failed to copy response.', 'error');
  }
};

window.closeAiTestResultsModal = function () {
  const modal = document.getElementById('aiTestResultsModal');
  if (modal) {
    modal.classList.remove('active');
  }
};

// ==================== ENTERPRISE CALCULATOR ====================

window.openEnterpriseCalculator = function (testResult) {
  const modal = document.getElementById('enterpriseCalculatorModal');
  const contentEl = document.getElementById('enterpriseCalculatorContent');

  if (!modal || !contentEl) {
    console.error('[Enterprise Calc] Modal elements not found');
    if (window.showToast) window.showToast('Enterprise calculator not available', 'error');
    return;
  }

  closeAiTestResultsModal();

  const noteContent = document.getElementById('noteContent')?.value.trim() || '';

  modal.setAttribute('data-original-prompt', noteContent);
  modal.setAttribute('data-ai-response', testResult.responseContent || '');

  const html = `
    <div class="enterprise-calc-form">
      <h4 style="margin-bottom: 16px; color: var(--text-primary);">Scale Parameters</h4>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
        <div class="form-group">
          <label>Number of Users</label>
          <input type="number" id="enterpriseNumUsers" value="1000" min="1" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-primary); color: var(--text-primary);">
        </div>
        
        <div class="form-group">
          <label>Queries per User per Day</label>
          <input type="number" id="enterpriseQueriesPerDay" value="5" min="1" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-primary); color: var(--text-primary);">
        </div>
        
        <div class="form-group">
          <label>Working Days per Year</label>
          <input type="number" id="enterpriseWorkingDays" value="250" min="1" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-primary); color: var(--text-primary);">
        </div>
        
        <div class="form-group">
          <label>Expected Output Tokens</label>
          <input type="number" id="enterpriseOutputTokens" value="${testResult.outputTokens}" min="1" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-primary); color: var(--text-primary);">
        </div>
      </div>
      
      <button class="btn btn-primary" id="calculateEnterpriseBtn" style="width: 100%; margin-bottom: 24px;">
        Calculate Annual Projections
      </button>
      
      <div id="enterpriseResults" style="display: none;">
        <h4 style="margin-bottom: 16px; color: var(--text-primary);">Annual Cost Projection</h4>
        <div id="enterpriseResultsContent"></div>
      </div>
    </div>
  `;

  contentEl.innerHTML = html;

  modal.setAttribute('data-test-input-tokens', testResult.inputTokens);
  modal.setAttribute('data-test-model', testResult.modelData.model);
  modal.setAttribute('data-test-provider', testResult.modelData.provider);
  modal.setAttribute('data-test-response', testResult.responseContent || '');

  document.getElementById('calculateEnterpriseBtn')?.addEventListener('click', () => {
    calculateEnterpriseProjections(testResult);
  });

  modal.classList.add('active');
}

function calculateEnterpriseProjections(testResult) {
  const numUsers = parseInt(document.getElementById('enterpriseNumUsers').value) || 1000;
  const queriesPerDay = parseInt(document.getElementById('enterpriseQueriesPerDay').value) || 5;
  const workingDays = parseInt(document.getElementById('enterpriseWorkingDays').value) || 250;
  const outputTokens = parseInt(document.getElementById('enterpriseOutputTokens').value) || testResult.outputTokens;

  const annualQueries = numUsers * queriesPerDay * workingDays;

  const annualInputTokens = testResult.inputTokens * annualQueries;
  const annualOutputTokens = outputTokens * annualQueries;

  const costPerQuery = parseFloat(testResult.costs.totalCost) || 0;
  const annualCost = costPerQuery * annualQueries;
  const monthlyCost = annualCost / 12;

  const modal = document.getElementById('enterpriseCalculatorModal');
  const originalPrompt = modal.getAttribute('data-original-prompt') || '';
  const aiResponse = modal.getAttribute('data-ai-response') || testResult.responseContent || '';

  const resultsDiv = document.getElementById('enterpriseResults');
  const resultsContent = document.getElementById('enterpriseResultsContent');

  if (!resultsDiv || !resultsContent) return;

  let contextHTML = '';
  if (originalPrompt || aiResponse) {
    contextHTML = `
      <div class="llm-response-card" style="margin-bottom: 16px;">
        <div class="llm-response-header">
          <span class="llm-response-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Context
          </span>
        </div>
        <div class="llm-response-content">
          ${originalPrompt ? `
            <div style="margin-bottom: 12px;">
              <strong style="font-size: 11px; color: var(--text-secondary); display: block; margin-bottom: 6px;">📝 Original Prompt (Input):</strong>
              <div style="padding: 12px; background: var(--bg-primary); border-radius: 4px; font-size: 12px; line-height: 1.6; max-height: 200px; overflow-y: auto; white-space: pre-wrap; font-family: 'SF Mono', monospace;">${originalPrompt}</div>
            </div>
          ` : ''}
          ${aiResponse ? `
            <div>
              <strong style="font-size: 11px; color: var(--text-secondary); display: block; margin-bottom: 6px;">✨ AI Response (Output):</strong>
              <div class="ai-response" style="padding: 12px; background: var(--bg-primary); border-radius: 4px; font-size: 13px; line-height: 1.7; max-height: 300px; overflow-y: auto;">${markdownToHTML(aiResponse)}</div>
            </div>
          ` : ''}
        </div>
        <div style="margin-top: 12px; padding: 10px; background: rgba(16, 185, 129, 0.15); border-radius: 4px; font-size: 10px; line-height: 1.4; color: var(--text-secondary);">
          <strong style="color: #10B981;">✨ AI INSIGHTS</strong> – This response was generated by AI. Always verify information independently before making decisions.
        </div>
      </div>
    `;
  }

  const html = `
    ${contextHTML}
    
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
      <span style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; font-size: 13px; font-weight: 600; color: #10B981;">
        🤖 ${testResult.modelData.provider} - ${testResult.modelData.model}
      </span>
      <span style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; font-size: 13px; font-weight: 600; color: #3B82F6;">
        📊 ${testResult.inputTokens.toLocaleString()} input tokens
      </span>
      <span style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; font-size: 13px; font-weight: 600; color: #8B5CF6;">
        📈 ${testResult.outputTokens.toLocaleString()} output tokens
      </span>
    </div>
    
    <div class="enterprise-projection-card" style="padding: 16px; background: var(--bg-secondary); border-radius: 6px; margin-bottom: 16px;">
      <h5 style="margin-bottom: 12px; color: var(--text-primary);">Volume Projections</h5>
      <div class="metric-row">
        <span class="metric-label">Annual Queries:</span>
        <span class="metric-value">${annualQueries.toLocaleString()}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Annual Input Tokens:</span>
        <span class="metric-value">${annualInputTokens.toLocaleString()}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Annual Output Tokens:</span>
        <span class="metric-value">${annualOutputTokens.toLocaleString()}</span>
      </div>
    </div>
    
    <div class="llm-response-card">
      <div class="llm-response-header">
        <span class="llm-response-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M2 12h20"/>
          </svg>
          Cost Projections
        </span>
      </div>
      <div class="llm-response-content">
      <div class="metric-row">
        <span class="metric-label">Cost per Query:</span>
        <span class="metric-value">$${costPerQuery.toFixed(4)}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Monthly Cost:</span>
        <span class="metric-value">$${monthlyCost.toFixed(2)}</span>
      </div>
        <div class="metric-row metric-total" style="font-size: 16px; font-weight: 700;">
          <span class="metric-label">Annual Cost:</span>
          <span class="metric-value">$${annualCost.toFixed(2)}</span>
        </div>
      </div>
      <div style="margin-top: 12px; padding: 10px; background: rgba(16, 185, 129, 0.15); border-radius: 4px; font-size: 10px; line-height: 1.4; color: var(--text-secondary);">
        <strong style="color: #10B981;">✨ AI INSIGHTS</strong> – Cost projections based on AI-analyzed token usage. Always verify with your provider for accurate enterprise pricing.
      </div>
    </div>
    
    <div style="margin-top: 16px; padding: 12px; background: var(--bg-tertiary); border-radius: 6px; font-size: 11px; color: var(--text-secondary);">
      <strong>Assumptions:</strong> ${numUsers.toLocaleString()} users × ${queriesPerDay} queries/day × ${workingDays} working days
    </div>
    
    <div class="result-disclaimer" style="margin-top: 12px; padding: 12px; background: rgba(245, 158, 11, 0.1); border-left: 3px solid #F59E0B; border-radius: 4px; font-size: 11px; line-height: 1.5; color: var(--text-secondary);">
      <strong style="color: #F59E0B;">⚠️ Cost Estimates Disclaimer:</strong> Pricing shown is indicative only, based on publicly available model provider rates (OpenAI, Anthropic) sourced from LiteLLM pricing database. These are NOT official SAP prices. This tool is not affiliated with or endorsed by SAP SE. Actual costs depend on your specific agreements, volume discounts, and enterprise contracts. For official pricing, contact your provider or SAP directly.
    </div>
  `;

  resultsContent.innerHTML = html;
  resultsDiv.style.display = 'block';

  const exportBtn = document.getElementById('exportEnterpriseReportBtn');
  if (exportBtn) {
    exportBtn.style.display = 'inline-flex';

    exportBtn.onclick = () => {
      exportEnterpriseReport({
        testResult,
        numUsers,
        queriesPerDay,
        workingDays,
        outputTokens,
        annualQueries,
        annualInputTokens,
        annualOutputTokens,
        costPerQuery,
        monthlyCost,
        annualCost
      });
    };
  }

  if (window.showToast) window.showToast('Projections calculated ✓', 'success');
};

function exportEnterpriseReport(data) {
  const timestamp = new Date().toISOString().split('T')[0];

  const modal = document.getElementById('enterpriseCalculatorModal');
  const originalPrompt = modal.getAttribute('data-original-prompt') || '';
  const aiResponse = data.testResult.responseContent || '';

  const cleanResponse = stripMarkdown(aiResponse);

  const report = `SAP Pro Toolkit - Enterprise AI Cost Projection
Generated: ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${originalPrompt ? `📝 ORIGINAL PROMPT (INPUT)
${originalPrompt}

` : ''}${aiResponse ? `✨ AI RESPONSE (OUTPUT)
${cleanResponse}

` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODEL DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provider: ${data.testResult.modelData.provider}
Model: ${data.testResult.modelData.model}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCALE PARAMETERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Number of Users: ${data.numUsers.toLocaleString()}
Queries per User per Day: ${data.queriesPerDay}
Working Days per Year: ${data.workingDays}
Expected Output Tokens: ${data.outputTokens.toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VOLUME PROJECTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Annual Queries: ${data.annualQueries.toLocaleString()}
Annual Input Tokens: ${data.annualInputTokens.toLocaleString()}
Annual Output Tokens: ${data.annualOutputTokens.toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COST PROJECTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cost per Query: $${data.costPerQuery.toFixed(4)}
Monthly Cost: $${data.monthlyCost.toFixed(2)}
Annual Cost: $${data.annualCost.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input Tokens per Query: ${data.testResult.inputTokens.toLocaleString()}
Output Tokens per Query: ${data.testResult.outputTokens.toLocaleString()}
Cost per Query: $${data.testResult.costs.totalCost}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DISCLAIMER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ Cost Estimates Disclaimer

Pricing Source: LiteLLM pricing database (publicly available model rates)
Indicative Pricing: Pricing shown is indicative only, based on OpenAI and 
                    Anthropic published rates
Not Official SAP Pricing: These are NOT official SAP prices
Not Affiliated: This tool is not affiliated with or endorsed by SAP SE
Actual Costs: Actual costs depend on specific agreements, volume discounts, 
             and enterprise contracts
Official Pricing Contact: Contact your provider or SAP directly for official pricing

Last Updated: 2026-01-13
`;

  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `enterprise-ai-cost-projection-${timestamp}.txt`;
  a.click();

  URL.revokeObjectURL(url);

  if (window.showToast) window.showToast('Report exported ✓', 'success');
}

window.closeEnterpriseCalculatorModal = function () {
  const modal = document.getElementById('enterpriseCalculatorModal');
  if (modal) {
    modal.classList.remove('active');

    const exportBtn = document.getElementById('exportEnterpriseReportBtn');
    if (exportBtn) exportBtn.style.display = 'none';
  }
};

// ==================== AI SHORTCUT CREATION ====================

window.addShortcutWithAI = async function () {
  if (!window.ToolkitCore || !window.ToolkitCore.testPromptWithModel) {
    if (window.showToast) window.showToast('AI features not available', 'error');
    return;
  }

  const addWithAIBtn = document.getElementById('addShortcutWithAIBtn');

  // Disable button to prevent duplicate calls
  if (addWithAIBtn) addWithAIBtn.disabled = true;

  try {
    if (window.openAddShortcutModal) window.openAddShortcutModal();

    const notesField = document.getElementById('shortcutNotes');

    notesField.value = '⏳ Analyzing current page...';
    notesField.style.background = 'rgba(16, 185, 129, 0.1)';
    notesField.style.borderColor = '#10B981';

    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab || !tab.url) {
      notesField.value = '';
      notesField.style.background = '';
      notesField.style.borderColor = '';
      if (window.showToast) window.showToast('No active tab found', 'warning');
      return;
    }

    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      notesField.value = '';
      notesField.style.background = '';
      notesField.style.borderColor = '';
      if (window.showToast) window.showToast('Cannot scrape browser internal pages', 'warning');
      document.getElementById('shortcutName').value = tab.title;
      document.getElementById('shortcutPath').value = tab.url;
      return;
    }

    notesField.value = '⏳ Preparing to scrape page...';
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      });
      console.log('[AI Shortcut] Content script injected');
    } catch (injectError) {
      console.log('[AI Shortcut] Content script already present or injection failed:', injectError);
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    notesField.value = '⏳ Scraping page content...';
    const scrapedData = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: 'scrapePageForShortcut' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('[AI Shortcut] Message failed:', chrome.runtime.lastError);
          resolve({ error: 'Failed to scrape page', title: tab.title, url: tab.url, content: '' });
        } else {
          resolve(response);
        }
      });
    });

    console.log('[AI Shortcut] Scraped data:', scrapedData);

    document.getElementById('shortcutPath').value = scrapedData.url;

    notesField.value = '⏳ Enhancing title...';
    const enhancedTitle = await enhanceTitle(scrapedData.title, scrapedData.content);
    document.getElementById('shortcutName').value = enhancedTitle;

    notesField.value = '⏳ Generating AI summary...';
    const summary = await generatePageSummary(scrapedData.title, scrapedData.url, scrapedData.content);

    notesField.value = summary;
    notesField.style.background = '';
    notesField.style.borderColor = '';

    document.getElementById('shortcutIcon').value = '8';

    if (window.showToast) window.showToast('✨ AI summary generated ✓', 'success');

  } catch (error) {
    console.error('[AI Shortcut] Failed:', error);
    const notesField = document.getElementById('shortcutNotes');
    notesField.value = '';
    notesField.style.background = '';
    notesField.style.borderColor = '';
    if (window.showToast) window.showToast(`AI shortcut creation failed: ${error.message}`, 'error');
  } finally {
    // Re-enable button after operation completes
    const addWithAIBtn = document.getElementById('addShortcutWithAIBtn');
    if (addWithAIBtn) addWithAIBtn.disabled = false;
  }
};

async function enhanceTitle(originalTitle, pageContent) {
  const vagueTitles = [
    'dashboard',
    'home',
    'admin',
    'settings',
    'configuration',
    'profile',
    'reports',
    'analytics',
    'overview',
    'home page',
    'main page',
    'portal'
  ];

  const titleLower = originalTitle.toLowerCase().trim();
  const isVague = vagueTitles.some(vague => titleLower === vague || titleLower.startsWith(vague + ' '));

  if (!isVague) {
    console.log('[Title Enhancement] Title is specific, keeping original:', originalTitle);
    return originalTitle;
  }

  console.log('[Title Enhancement] Vague title detected, enhancing:', originalTitle);

  try {
    const prompt = `Based on this page content, generate a more descriptive title (max 50 characters). 
Current title: "${originalTitle}"

Page content preview:
${pageContent.substring(0, 500)}

Provide only the enhanced title, nothing else.`;

    const result = await window.ToolkitCore.testPromptWithModel(prompt);

    if (result && result.content) {
      const enhancedTitle = result.content.trim().replace(/^["']|["']$/g, '');
      console.log('[Title Enhancement] Enhanced title:', enhancedTitle);
      return enhancedTitle.substring(0, 50);
    }

  } catch (error) {
    console.warn('[Title Enhancement] Failed, using original:', error);
  }

  return originalTitle;
}

async function generatePageSummary(title, url, content) {
  if (!content || content.length < 50) {
    return `${title}\n\nURL: ${url}`;
  }

  try {
    const prompt = `Summarize this page in 2-3 concise sentences (max 200 words). Focus on what the page is about and its key information.

Page Title: ${title}
URL: ${url}

Content:
${content}

Provide only the summary, no preamble.`;

    const result = await window.ToolkitCore.testPromptWithModel(prompt);

    if (result && result.content) {
      return result.content.trim();
    }

    return `${title}\n\n${content.substring(0, 200)}...`;

  } catch (error) {
    console.error('[AI Summary] Failed:', error);
    return `${title}\n\n${content.substring(0, 200)}...`;
  }
}

// ==================== MARKDOWN UTILITIES ====================

window.markdownToHTML = function (markdown) {
  if (!markdown) return '';

  let html = markdown;

  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  html = html.replace(/^---+$/gm, '<hr>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  const lines = html.split('\n');
  let inList = false;
  let listType = null;
  const processedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^\d+\.\s/.test(trimmed)) {
      if (!inList || listType !== 'ol') {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      processedLines.push(`<li>${trimmed.replace(/^\d+\.\s/, '')}</li>`);
    }
    else if (/^[-*•]\s/.test(trimmed)) {
      if (!inList || listType !== 'ul') {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      processedLines.push(`<li>${trimmed.replace(/^[-*•]\s/, '')}</li>`);
    }
    else {
      if (inList) {
        processedLines.push(`</${listType}>`);
        inList = false;
        listType = null;
      }

      if (trimmed && !trimmed.startsWith('<')) {
        processedLines.push(`<p>${line}</p>`);
      } else {
        processedLines.push(line);
      }
    }
  }

  if (inList) {
    processedLines.push(`</${listType}>`);
  }

  return processedLines.join('\n');
};

window.stripMarkdown = function (markdown) {
  if (!markdown) return '';

  let text = markdown;

  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/^---+$/gm, '');
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  text = text.replace(/^[-*•]\s+/gm, '• ');
  text = text.replace(/^\d+\.\s+/gm, '');
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
};

// ==================== AI FEATURE VISIBILITY ====================

window.showAITestButtons = function () {
  const aiBtn = document.getElementById('enhanceWithAIBtn');
  if (aiBtn) aiBtn.style.display = 'inline-flex';
};

window.hideAITestButtons = function () {
  const aiBtn = document.getElementById('enhanceWithAIBtn');
  if (aiBtn) aiBtn.style.display = 'none';
};
