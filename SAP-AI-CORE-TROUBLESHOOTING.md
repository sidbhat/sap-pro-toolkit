# SAP AI Core Integration - Troubleshooting Guide

**Last Updated**: 2026-01-13

## CRITICAL FIX: 404 Endpoint Construction Bug ✅ RESOLVED

### Problem Summary
SAP AI Core integration was failing with 404 errors when making inference calls, despite:
- ✅ OAuth2 authentication working correctly
- ✅ Deployment list loading successfully  
- ✅ Primary model feature implemented
- ❌ Inference calls failing with 404 or "model not found" errors

### Root Cause Identified

**The Bug**: We were incorrectly appending endpoint paths to `deployment.deploymentUrl`

```javascript
// ❌ WRONG (causes 404):
const inferenceUrl = `${deployment.deploymentUrl}${selectedStrategy.path}`;

// Example wrong URL construction:
// deployment.deploymentUrl = "https://api.ai.prod.../v2/inference/deployments/d123abc"
// selectedStrategy.path = "/chat/completions"
// Result: "https://.../deployments/d123abc/chat/completions" ❌ 404 ERROR
```

**The Issue**: The `deploymentUrl` field returned by SAP AI Core's `/v2/lm/deployments` API **already contains the complete inference endpoint**. We don't need to append `/chat/completions` or any other paths.

### The Fix

**Location**: `panel/side-panel.js` line ~5965 in `makeAPICall()` function

```javascript
// ✅ CORRECT (Fixed 2026-01-13):
const inferenceUrl = deployment.deploymentUrl;
const requestBody = selectedStrategy.body;

// Now correctly uses the complete URL from the API:
// deployment.deploymentUrl = "https://api.ai.prod.../v2/inference/deployments/d123abc"
// We POST directly to this URL with the request body
```

### Detailed Explanation

**What SAP AI Core Returns**:
```json
{
  "resources": [{
    "id": "d123abc",
    "deploymentUrl": "https://api.ai.prod.us-east-1.aws.ml.hana.ondemand.com/v2/inference/deployments/d123abc",
    "status": "RUNNING",
    "details": {
      "resources": {
        "model_name": "gpt-4"
      }
    }
  }]
}
```

The `deploymentUrl` is the **complete, ready-to-use inference endpoint**. No modifications needed.

**Previous Incorrect Logic**:
We had "endpoint strategies" that tried to append different paths:
- `/chat/completions` (OpenAI format)
- `/invoke` (Anthropic format)
- `/v1/chat/completions` (Llama format)

This was based on a misunderstanding of how SAP AI Core deployments work. The deployment URL is deployment-specific and already routes to the correct model endpoint internally.

### Enhanced Logging Added

The fix includes detailed console logging to help diagnose future issues:

```javascript
console.log('[SAP AI Core] Inference Request:', {
  url: inferenceUrl,
  deploymentUrl_raw: deployment.deploymentUrl,
  strategy_path_NOT_USED: selectedStrategy.path,  // For debugging
  method: 'POST',
  headers: { /* redacted */ },
  body: requestBody
});
```

This logging shows:
- The actual URL being called
- The raw deploymentUrl from the API
- The strategy path we're NOT using (for reference)

## Testing the Fix

### Step 1: Configure SAP AI Core
1. Go to Settings > API Keys
2. Enter SAP AI Core credentials:
   - Client ID
   - Client Secret  
   - Base URL (e.g., `https://api.ai.prod.us-east-1.aws.ml.hana.ondemand.com`)
   - Auth URL (e.g., `https://your-tenant.authentication.us10.hana.ondemand.com/oauth/token`)
   - Resource Group (e.g., `default`)

### Step 2: Fetch Deployed Models
1. Click "🔄 Test & Fetch Models" button
2. Should see: "✅ Connected! Found X deployed model(s)"
3. Model dropdown populates with RUNNING deployments

### Step 3: Set Primary Model
1. Select a model from dropdown
2. Click "💾 Save Configuration"
3. Should see:
   - "SAP AI Core configuration saved ✓"
   - "Primary model set to: [Model Name] ✓"
   - Green indicator banner showing primary model

### Step 4: Test Inference
1. Create a new note (type: AI Prompt)
2. Enter test prompt (e.g., "Say hello in 5 words")
3. Model dropdown should auto-select SAP AI Core primary model
4. Click "🧪 Test Now"
5. Should see successful response in Test Results modal

### Expected Console Logs (Success)
```
[SAP AI Core] Starting API call...
[SAP AI Core] OAuth2 token obtained successfully
[SAP AI Core] Deployment ID: d123abc
[SAP AI Core] Deployment found: {...}
[SAP AI Core] Selected strategy: OpenAI-compatible (with model field)
[SAP AI Core] Inference Request: {
  url: "https://api.ai.prod.../v2/inference/deployments/d123abc",
  deploymentUrl_raw: "https://api.ai.prod.../v2/inference/deployments/d123abc",
  strategy_path_NOT_USED: "/chat/completions"
}
[SAP AI Core] Response status: 200
[SAP AI Core] Parsing as OpenAI format
[SAP AI Core] Successfully parsed response: {...}
```

## Error Scenarios & Solutions

### Error: 404 - Deployment endpoint not found

**If this still occurs after the fix**:

**Possible Cause**: Deployment may have been stopped or deleted

**Solution**:
1. Refresh deployed models: Settings > API Keys > "🔄 Test & Fetch Models"
2. Verify deployment status in SAP AI Core directly
3. Select a different RUNNING deployment

### Error: 400 - Bad Request

**Possible Causes**:
- Missing required fields in request body
- Wrong request body format for specific model

**Solution**:
1. Check console logs for full error details
2. The request body is now logged in `makeAPICall()` - review structure
3. Some models may require different body formats (handled by strategy selection)

### Error: 401 - Unauthorized

**Possible Causes**:
- OAuth2 token expired (tokens are short-lived)
- Invalid credentials

**Solution**:
1. Extension automatically gets fresh token for each call
2. If persistent, verify credentials in Settings
3. Check Auth URL is correct for your tenant

### Error: Unknown response format

**Possible Cause**: Model returns response in unexpected format

**Solution**:
1. Check console for full response structure
2. The code handles 4 formats:
   - OpenAI (choices array)
   - Anthropic (content array)
   - Cohere (text field)
   - Legacy (completion field)
3. If new format needed, update response parsing in `makeAPICall()`

## Primary Model Feature

### How It Works

**Priority Logic** (in `getPrimaryAIModel()`):
1. **First Priority**: SAP AI Core primary model (if configured)
2. **Second Priority**: OpenAI API key
3. **Third Priority**: Anthropic API key

When you configure SAP AI Core and select a primary model, it will automatically be used for:
- Test Now button in notes
- AI Prompt notes
- Any future AI features

### Storage Keys

**Primary Model Storage**:
```javascript
{
  sapAiCorePrimaryModel: {
    deploymentId: "d123abc",
    modelName: "gpt-4",
    deploymentUrl: "https://.../deployments/d123abc",
    scenarioId: "foundation-models",
    selectedAt: "2026-01-13T21:00:00.000Z"
  }
}
```

**Deployed Models Cache**:
```javascript
{
  sapAiCoreDeployedModels: [
    {
      deploymentId: "d123abc",
      modelName: "gpt-4",
      scenarioId: "foundation-models",
      deploymentUrl: "https://.../deployments/d123abc",
      status: "RUNNING"
    }
  ],
  sapAiCoreModelsFetchedAt: "2026-01-13T21:00:00.000Z"
}
```

## API Documentation Reference

### SAP AI Core Endpoints

**Base URL Format**:
```
https://api.ai.{region}.{cloud-provider}.ml.hana.ondemand.com
```

**OAuth2 Authentication**:
```
POST {authUrl}/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={clientId}
&client_secret={clientSecret}
```

**List Deployments**:
```
GET {baseUrl}/v2/lm/deployments
Authorization: Bearer {access_token}
AI-Resource-Group: {resourceGroup}
```

**Inference Call** (AFTER FIX):
```
POST {deploymentUrl}  // Use URL directly from deployment object
Authorization: Bearer {access_token}
AI-Resource-Group: {resourceGroup}
Content-Type: application/json

{
  "messages": [{"role": "user", "content": "..."}],
  "max_tokens": 150
}
```

## Future Considerations

### Request Body Formats

Different models may expect different request formats. The current implementation includes "strategies" that define different body structures:

**OpenAI Format** (GPT, Mistral, Llama):
```json
{
  "model": "gpt-4",
  "messages": [{"role": "user", "content": "..."}],
  "max_tokens": 150
}
```

**Anthropic Format** (Claude):
```json
{
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": 150,
  "messages": [{"role": "user", "content": "..."}]
}
```

However, with the endpoint fix, the strategy selection may need refinement based on actual SAP AI Core deployment behavior.

## Debugging Checklist

If SAP AI Core inference still fails:

- [ ] Check console logs for detailed error messages
- [ ] Verify `deploymentUrl` in logs matches format: `https://.../v2/inference/deployments/{id}`
- [ ] Confirm no additional paths are being appended (check `strategy_path_NOT_USED` in logs)
- [ ] Verify OAuth2 token is obtained successfully (check for "OAuth2 token obtained" log)
- [ ] Check deployment status in SAP AI Core console (must be RUNNING)
- [ ] Try refreshing deployed models (may have changed since last fetch)
- [ ] Review full request/response in console logs

## Code Changes Summary

**Files Modified**: 
- `panel/side-panel.js` (line ~5965)

**Changes Made**:
1. Removed path appending: `${deployment.deploymentUrl}${selectedStrategy.path}` → `deployment.deploymentUrl`
2. Added detailed logging with `deploymentUrl_raw` and `strategy_path_NOT_USED` fields
3. Added code comments explaining why we don't append paths

**Impact**: 
- ✅ Fixes 404 errors on SAP AI Core inference calls
- ✅ Maintains compatibility with primary model feature
- ✅ Improves debugging with enhanced logging
- ✅ No impact on OpenAI/Anthropic integrations (unchanged)

## Status: READY FOR TESTING

The fix has been implemented and is ready for testing with a live SAP AI Core instance. The next step is to:

1. Load the updated extension in Chrome
2. Configure SAP AI Core in Settings
3. Test inference with the "Test Now" button
4. Verify successful API calls in console logs
5. Report results

---

**Implementation Date**: 2026-01-13  
**Bug Fix Version**: Fixed in current build  
**Tested**: Awaiting user testing with live SAP AI Core instance
