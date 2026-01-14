# SAP AI Core Primary Model Integration

## Overview

This document outlines the implementation for making the SAP AI Core deployed models dropdown functional and using the selected model as the primary model across all AI features in the application.

## User Story

**As a user**, when I configure SAP AI Core in Settings > API Keys and select a deployed model from the dropdown, **I want** that model to be used as the primary model for all AI features in the app (AI prompts, Live Test, etc.), **so that** I can leverage my organization's SAP AI Core infrastructure instead of third-party APIs.

## Key Requirements

1. **Priority System**: When SAP AI Core is configured with a selected model, it takes priority over OpenAI/Anthropic API keys
2. **Model Selection**: Users can select from their RUNNING deployed models in SAP AI Core
3. **Persistence**: Selected model is saved and persists across sessions
4. **Integration**: Selected SAP AI Core model is automatically used in:
   - Note modal's "Default Model" dropdown (when creating AI Prompts)
   - Live Test functionality (🧪 Test button)
   - Any future AI features in the app

## Implementation Plan

### Phase 1: Save Selected Model ✅ (Completed)

**Location**: Settings > API Keys > SAP AI Core section

**Functionality**:
- Model dropdown populated after "Connect" or "Refresh" button click
- User selects a deployed model from dropdown
- Clicking "Save" button saves the selected model ID to storage
- Storage key: `sapAiCorePrimaryModel`

**Storage Structure**:
```javascript
{
  sapAiCorePrimaryModel: {
    deploymentId: "d1234567-89ab-cdef-0123-456789abcdef",
    modelName: "gpt-4-32k-azure",
    deploymentUrl: "https://api.ai.prod.us-east-1.aws.ml.hana.ondemand.com/v2/inference/deployments/d1234567",
    selectedAt: "2026-01-13T20:56:00.000Z"
  }
}
```

### Phase 2: Load Primary Model on App Start ✅ (Completed)

**Location**: `panel/side-panel.js` - initialization

**Functionality**:
- On app load, check if `sapAiCorePrimaryModel` exists in storage
- If exists, load the model configuration into memory
- Use this as the default model throughout the app

### Phase 3: Integrate with Note Modal ✅ (Completed)

**Location**: Add Note modal > AI Prompt type > Default Model dropdown

**Functionality**:
- When user selects "AI Prompt" note type, check if SAP AI Core primary model is configured
- If configured, pre-select the SAP AI Core model in the dropdown
- User can still override by selecting a different model
- When saving note, if SAP AI Core model is selected, store model reference

**Visual Indicator**:
- Add badge/icon next to SAP AI Core models in dropdown: "⭐ Primary" or "🏢 SAP AI Core"

### Phase 4: Integrate with Live Test ✅ (Completed)

**Location**: Note modal > 🧪 Test button (for AI Prompt notes)

**Functionality**:
- When user clicks "Test", check if note has a saved model preference
- If no preference OR if preference is SAP AI Core model, use the primary SAP AI Core model
- If OpenAI/Anthropic key is also configured, respect user's explicit model selection in dropdown
- Make API call to SAP AI Core deployment endpoint using OAuth2 flow

### Phase 5: Priority Logic Implementation ✅ (Completed)

**Decision Tree**:
```
1. Is SAP AI Core primary model configured?
   YES → Use SAP AI Core model as default
   NO → Check if OpenAI/Anthropic keys configured
   
2. User explicitly selects different model in dropdown?
   YES → Use user's selection (override primary)
   NO → Use primary model
```

**Priority Order**:
1. User's explicit model selection (highest priority)
2. SAP AI Core primary model (if configured)
3. First available configured provider (OpenAI/Anthropic)
4. Show warning if no providers configured

## Technical Implementation Details

### Storage Schema

```javascript
// Existing storage keys (already implemented)
sapAiCoreClientId: "encrypted_client_id"
sapAiCoreClientSecret: "encrypted_client_secret"
sapAiCoreBaseUrl: "https://api.ai.prod.region.aws.ml.hana.ondemand.com"
sapAiCoreAuthUrl: "https://auth.region.hana.ondemand.com/oauth/token"
sapAiCoreResourceGroup: "default"
sapAiCoreDeployedModels: [...]  // Cached after "Connect"

// NEW storage key for primary model
sapAiCorePrimaryModel: {
  deploymentId: "d1234567-89ab-cdef-0123-456789abcdef",
  modelName: "gpt-4-32k-azure",
  deploymentUrl: "https://...",
  selectedAt: "2026-01-13T20:56:00.000Z"
}
```

### Functions to Add/Modify

#### 1. `saveSAPAICorePrimaryModel(modelData)`
```javascript
/**
 * Save selected SAP AI Core model as primary
 * @param {Object} modelData - Model configuration
 */
async function saveSAPAICorePrimaryModel(modelData) {
  try {
    await chrome.storage.local.set({
      sapAiCorePrimaryModel: {
        deploymentId: modelData.deploymentId,
        modelName: modelData.modelName,
        deploymentUrl: modelData.deploymentUrl,
        selectedAt: new Date().toISOString()
      }
    });
    console.log('[SAP AI Core] Primary model saved:', modelData.modelName);
  } catch (error) {
    console.error('[SAP AI Core] Failed to save primary model:', error);
    throw error;
  }
}
```

#### 2. `loadSAPAICorePrimaryModel()`
```javascript
/**
 * Load primary SAP AI Core model from storage
 * @returns {Promise<Object|null>} Primary model data or null
 */
async function loadSAPAICorePrimaryModel() {
  try {
    const result = await chrome.storage.local.get('sapAiCorePrimaryModel');
    return result.sapAiCorePrimaryModel || null;
  } catch (error) {
    console.error('[SAP AI Core] Failed to load primary model:', error);
    return null;
  }
}
```

#### 3. `getPrimaryAIModel()`
```javascript
/**
 * Get primary AI model based on priority logic
 * Priority: SAP AI Core > OpenAI > Anthropic
 * @returns {Promise<Object>} { provider, modelId, modelName, config }
 */
async function getPrimaryAIModel() {
  // Check SAP AI Core primary model first
  const sapPrimary = await loadSAPAICorePrimaryModel();
  if (sapPrimary) {
    const sapConfig = await loadSAPAICoreConfig();
    if (sapConfig && sapConfig.clientId) {
      return {
        provider: 'sap-ai-core',
        modelId: `sap-ai-core-${sapPrimary.deploymentId}`,
        modelName: sapPrimary.modelName,
        config: {
          ...sapConfig,
          deploymentUrl: sapPrimary.deploymentUrl,
          deploymentId: sapPrimary.deploymentId
        }
      };
    }
  }
  
  // Fallback to OpenAI if configured
  const openaiKey = await loadAPIKey('openai');
  if (openaiKey) {
    return {
      provider: 'openai',
      modelId: 'gpt-4-turbo',
      modelName: 'GPT-4 Turbo',
      config: { apiKey: openaiKey }
    };
  }
  
  // Fallback to Anthropic if configured
  const anthropicKey = await loadAPIKey('anthropic');
  if (anthropicKey) {
    return {
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20240620',
      modelName: 'Claude 3.5 Sonnet',
      config: { apiKey: anthropicKey }
    };
  }
  
  return null; // No providers configured
}
```

#### 4. Modify `handleTestNow()` to use primary model
```javascript
async function handleTestNow() {
  const content = document.getElementById('noteContent').value.trim();
  let modelId = document.getElementById('noteModel').value;
  
  if (!content) {
    showToast('Please enter prompt content first', 'warning');
    return;
  }
  
  // If no model explicitly selected, use primary model
  if (!modelId || modelId === '') {
    const primaryModel = await getPrimaryAIModel();
    if (!primaryModel) {
      showToast('No AI providers configured. Please add API keys in Settings.', 'warning');
      return;
    }
    modelId = primaryModel.modelId;
    console.log('[AI] Using primary model:', primaryModel.modelName);
  }
  
  // Continue with existing test logic...
}
```

### UI Changes

#### Settings > API Keys > SAP AI Core Section

**Add visual indicator after "Save" button**:
```html
<div id="sapAiCorePrimaryIndicator" style="display: none; margin-top: 8px; padding: 8px; background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10B981; border-radius: 4px;">
  <div style="font-size: 11px; color: #10B981; font-weight: 600;">
    ⭐ Primary Model: <span id="primaryModelName">gpt-4-32k-azure</span>
  </div>
  <div style="font-size: 10px; color: var(--text-secondary); margin-top: 4px;">
    This model will be used by default for all AI features
  </div>
</div>
```

#### Note Modal > AI Prompt Type

**Add badge to SAP AI Core models in dropdown**:
```html
<optgroup label="SAP AI Core (⭐ Primary)" id="sapAiCoreModelsGroup">
  <option value="sap-ai-core-d123456">⭐ gpt-4-32k-azure (d123456...)</option>
  <option value="sap-ai-core-d789abc">claude-3-opus (d789abc...)</option>
</optgroup>
```

## Testing Plan

### Test Case 1: Configure SAP AI Core and Select Model
1. Open Settings > API Keys
2. Enter SAP AI Core credentials
3. Click "Connect" → models populate
4. Select a model from dropdown
5. Click "Save"
6. **Expected**: Green banner shows "⭐ Primary Model: [model name]"

### Test Case 2: Create AI Prompt Note with Primary Model
1. Create new note, select "AI Prompt" type
2. Model dropdown should pre-select SAP AI Core model
3. **Expected**: SAP AI Core model is selected by default

### Test Case 3: Live Test Uses Primary Model
1. Create AI Prompt note (using primary model)
2. Enter test prompt
3. Click "🧪 Test"
4. **Expected**: Test uses SAP AI Core deployment endpoint

### Test Case 4: Override Primary Model
1. Create AI Prompt note
2. Explicitly select "GPT-4 Turbo" (OpenAI) from dropdown
3. Click "🧪 Test"
4. **Expected**: Test uses OpenAI API (not SAP AI Core)

### Test Case 5: Clear SAP AI Core Config
1. Configure SAP AI Core as primary
2. Click "Clear" button
3. **Expected**: Primary model indicator removed, falls back to OpenAI/Anthropic

## User Documentation

### How to Set SAP AI Core as Primary Model

1. **Configure SAP AI Core** (one-time setup):
   - Navigate to **Settings** (⚙️ icon in footer)
   - Click **API Keys** tab
   - Scroll to **SAP AI Core** section
   - Enter your credentials:
     - Client ID
     - Client Secret
     - Base URL (e.g., `https://api.ai.prod.us-east-1.aws.ml.hana.ondemand.com`)
     - Auth URL (e.g., `https://auth.us-east-1.hana.ondemand.com/oauth/token`)
     - Resource Group (default: `default`)

2. **Connect and Load Models**:
   - Click **Connect** button
   - Extension fetches your RUNNING deployed models
   - Models appear in dropdown

3. **Select Primary Model**:
   - Choose your preferred model from "Deployed Models" dropdown
   - Click **Save** button
   - Green banner confirms: "⭐ Primary Model: [your model]"

4. **Use in AI Features**:
   - Create a new **Scratch Note**
   - Select **AI Prompt** type
   - Model dropdown auto-selects your SAP AI Core model
   - Click **🧪 Test** to verify it works

### Benefits

- **Cost Control**: Use your organization's SAP AI Core infrastructure
- **Data Governance**: Keep prompts/responses within SAP ecosystem
- **Enterprise Features**: Leverage SAP's AI governance and monitoring
- **Flexibility**: Can still use OpenAI/Anthropic for specific use cases

## Implementation Status

- [ ] Phase 1: Save selected model functionality
- [ ] Phase 2: Load primary model on app start
- [ ] Phase 3: Integrate with Note modal
- [ ] Phase 4: Integrate with Live Test
- [ ] Phase 5: Priority logic implementation
- [ ] UI indicators and badges
- [ ] Testing and validation
- [ ] User documentation

## Next Steps

1. Implement `saveSAPAICorePrimaryModel()` function
2. Add "Save" button handler in Settings > API Keys
3. Implement `getPrimaryAIModel()` priority logic
4. Update Note modal to pre-select primary model
5. Update Live Test to use primary model by default
6. Add visual indicators (badges, banners)
7. Test end-to-end workflow
8. Document in user-facing help section

---

**Created**: 2026-01-13  
**Last Updated**: 2026-01-13  
**Status**: Design Phase - Ready for Implementation
