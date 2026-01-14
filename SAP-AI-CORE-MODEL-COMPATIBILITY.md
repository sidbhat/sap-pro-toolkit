# SAP AI Core Model Compatibility Status

**Last Updated**: 2026-01-13

## Current Status Summary

| Model Type | Status | Endpoint Path | Notes |
|-----------|--------|---------------|-------|
| **Anthropic (Claude)** | ✅ Working | `/invoke` | Returns 200 OK, full response |
| **GPT-4** | ❌ Not Working | `/chat/completions` | Need error logs to diagnose |
| **Gemini** | ❌ Not Working | `/chat/completions` | Need error logs to diagnose |

## Successful Configuration (Anthropic)

### Working Endpoint Pattern
```
Base URL: https://api.ai.prod.us-east-1.aws.ml.hana.ondemand.com/v2/inference/deployments/{deploymentId}
Inference URL: {baseUrl}/invoke
Full Example: https://api.ai.prod.us-east-1.aws.ml.hana.ondemand.com/v2/inference/deployments/d677eadeac225763/invoke
```

### Working Request Body
```json
{
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": 2000,
  "messages": [
    { "role": "user", "content": "Your prompt here" }
  ]
}
```

### Successful Response Format
```json
{
  "content": [
    {
      "text": "Full response text here...",
      "type": "text"
    }
  ],
  "id": "msg_bdrk_01Lr1qmdAwJ8dAJ5xMUG1PHg",
  "model": "claude-3-5-sonnet-20241022",
  "role": "assistant",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 52,
    "output_tokens": 2000
  }
}
```

## Known Issues

### Issue #1: Response Truncation (FIXED)
- **Problem**: Responses cut off mid-sentence
- **Cause**: `max_tokens: 150` too low
- **Fix**: Increased to `max_tokens: 2000` in all endpoint strategies
- **Status**: ✅ Fixed in latest version

### Issue #2: GPT-4 Endpoint Returns 404 (DEBUGGING)
- **Problem**: GPT-4 deployment returns 404 on `/chat/completions` endpoint
- **Evidence**: 
  - URL: `https://api.ai.prod.../deployments/d3cd6cc29746c64e/chat/completions`
  - Error: `{"error":{"code":"404","message":"Resource not found"}}`
  - Strategy tried: "OpenAI-compatible (with model field)"
- **Root Cause**: Different SAP AI Core deployments expose different endpoint paths
- **Solution**: Automatic fallback through 5 endpoint strategies implemented
- **Status**: ⚠️ Should auto-fallback but needs live testing to verify which endpoint works
- **Next Step**: The extension will automatically try all 5 strategies - user should see success with one of them

### Issue #3: Gemini Models Not Working
- **Problem**: Similar to GPT - need error logs with all fallback attempts
- **Status**: ⚠️ Under Investigation

## Endpoint Strategy Selection Logic

The code uses smart endpoint selection based on model name:

```javascript
const modelName = (deployment.modelName || '').toLowerCase();

if (modelName.includes('anthropic') || modelName.includes('claude')) {
  // Use /invoke endpoint with Anthropic format
  selectedStrategy = endpointStrategies[1];
} else if (modelName.includes('llama') || modelName.includes('meta')) {
  // Use /v1/chat/completions endpoint with model field
  selectedStrategy = endpointStrategies[3];
} else if (modelName.includes('gpt') || modelName.includes('azure') || 
           modelName.includes('sonar') || modelName.includes('perplexity')) {
  // Use /chat/completions endpoint with model field
  selectedStrategy = endpointStrategies[0];
} else {
  // Unknown models: try OpenAI format first
  selectedStrategy = endpointStrategies[0];
}
```

## All Endpoint Strategies (Priority Order)

### Strategy 1: OpenAI-compatible (with model field)
- **Path**: `/chat/completions`
- **Used for**: GPT, Azure OpenAI, Sonar, Perplexity, Unknown models
- **Request Body**:
  ```json
  {
    "model": "model-name-here",
    "messages": [{ "role": "user", "content": "..." }],
    "max_tokens": 2000
  }
  ```

### Strategy 2: Anthropic Format ✅ WORKING
- **Path**: `/invoke`
- **Used for**: Claude models
- **Request Body**:
  ```json
  {
    "anthropic_version": "bedrock-2023-05-31",
    "max_tokens": 2000,
    "messages": [{ "role": "user", "content": "..." }]
  }
  ```

### Strategy 3: OpenAI-compatible (without model field)
- **Path**: `/chat/completions`
- **Used for**: Fallback if Strategy 1 fails
- **Request Body**:
  ```json
  {
    "messages": [{ "role": "user", "content": "..." }],
    "max_tokens": 2000
  }
  ```

### Strategy 4: Llama Format
- **Path**: `/v1/chat/completions`
- **Used for**: Llama, Meta models
- **Request Body**:
  ```json
  {
    "model": "model-name-here",
    "messages": [{ "role": "user", "content": "..." }],
    "max_tokens": 2000
  }
  ```

## Debugging Guide

### To Test GPT/Gemini Models:

1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Test the model
4. Look for these logs:
   ```
   [SAP AI Core] Selected strategy: [strategy name]
   [SAP AI Core] EXACT URL BEING CALLED: [url]
   [SAP AI Core] Response status: [status code]
   [SAP AI Core] Error response body: [error message]
   ```

### Key Things to Check:
- ✅ Is OAuth2 token obtained successfully?
- ✅ Is deployment ID correct?
- ✅ Is deployment URL present?
- ✅ What HTTP status code is returned? (404, 400, 500, etc.)
- ✅ What's in the error response body?

## Next Steps

1. **Test GPT model** and capture full console logs
2. **Test Gemini model** and capture full console logs
3. **Analyze error messages** to determine correct endpoint paths
4. **Update endpoint strategies** based on actual API responses
5. **Document working configurations** for each model type

## Questions to Answer

- [ ] Do GPT models use `/chat/completions` or different path?
- [ ] Do GPT models require `model` field in request body?
- [ ] Do Gemini models use same endpoint as GPT?
- [ ] Are there model-specific headers needed?
- [ ] Should we implement automatic fallback between strategies?
