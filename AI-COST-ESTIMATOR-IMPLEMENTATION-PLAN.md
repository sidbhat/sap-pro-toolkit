# AI Cost Estimator - Implementation Plan

## Overview
Complete refactor of Notes system to add AI prompt testing and enterprise cost calculation. **NO backward compatibility** - fresh start with clean data model.

## Feature: Test-to-Scale Lineage

```
Individual Testing → Enterprise Planning

1. Create "AI Prompt" note
2. [Test Now] → Measure tokens, cost, latency
3. [Compare All] → Test across models
4. [📊 Plan for Enterprise] → Bridge to calculator
5. Scale parameters → Annual projections
6. Export budget proposal
```

## Implementation Phases

### Phase 1: Fixed Note Types System (30 min)
**Goal**: Replace tags with 4 predefined note types

**New Data Model**:
```json
{
  "title": "Employee Review Summarizer",
  "content": "Summarize this employee review...",
  "noteType": "ai-prompt",
  "aiConfig": {
    "defaultModel": "gpt-4-turbo",
    "lastTestMetrics": {
      "inputTokens": 37,
      "outputTokens": 156,
      "cost": 0.0059,
      "latency": 1200
    }
  },
  "icon": "🤖",
  "timestamp": "2026-01-13T11:00:00Z"
}
```

**Note Types**:
- `note` (default) - 📝 General notes
- `ai-prompt` - 🤖 AI prompts (unlocks testing)
- `documentation` - 📚 Documentation
- `code` - 💻 Code snippets

**UI Changes**:
- Replace tag input with radio buttons
- Show model selector only for "AI Prompt" type
- Add [💰 Estimate Cost] button (only for ai-prompt)

**Files Modified**:
- `panel/side-panel.html`
- `panel/side-panel.js`
- `resources/profile-global.json`

### Phase 2: LLM Pricing Database (15 min)
**Create**: `resources/llm-pricing.json`

```json
{
  "gpt-4-turbo": {
    "input": 0.01,
    "output": 0.03,
    "provider": "OpenAI",
    "contextWindow": 128000
  },
  "gpt-3.5-turbo": {
    "input": 0.0015,
    "output": 0.002,
    "provider": "OpenAI",
    "contextWindow": 16385
  },
  "claude-3-5-sonnet-20240620": {
    "input": 0.003,
    "output": 0.015,
    "provider": "Anthropic",
    "contextWindow": 200000
  },
  "claude-3-haiku-20240307": {
    "input": 0.00025,
    "output": 0.00125,
    "provider": "Anthropic",
    "contextWindow": 200000
  }
}
```

### Phase 3: Individual Testing (60 min)
**Features**:
- [Test Now] - Test with default model
- [Compare All] - Test across all configured models
- Display results in modal (not saved)
- [📊 Plan for Enterprise] bridge button

**API Integration**:
- OpenAI: `/v1/chat/completions`
- Anthropic: `/v1/messages`
- SAP AI Core: Custom endpoint (BYOK)

**Token Estimation**: ~4 characters = 1 token

**Cost Calculation**: `(tokens/1000) × price_per_1k`

**Files Modified**:
- `panel/side-panel.js` (test functions)
- `panel/side-panel.html` (test modal)
- `panel/side-panel.css` (modal styling)
- `manifest.json` (API permissions)

### Phase 4: Enterprise Cost Calculator (60 min)
**Goal**: Project costs using measured test metrics

**Features**:
- Auto-populated from test results
- Scale parameters: users, queries/day, working days
- Multi-model comparison table
- Hybrid model recommendations
- Export to CSV/PDF

**Calculator Logic**:
```javascript
annualQueries = numUsers × queriesPerDay × workingDays
annualCost = (inputTokens × annualQueries / 1000) × inputPrice +
             (outputTokens × annualQueries / 1000) × outputPrice
```

**Files Modified**:
- `panel/side-panel.js` (calculator logic)
- `panel/side-panel.html` (calculator modal)
- `panel/side-panel.css` (styling)

### Phase 5: API Key Management (45 min)
**Goal**: Secure BYOK storage using crypto-utils.js

**Settings - New Tab**: "AI Keys"
- OpenAI API Key input
- Anthropic API Key input
- SAP AI Core Token + Endpoint
- Test Connection buttons
- Default model selectors

**Encryption**:
- Reuse existing `crypto-utils.js`
- AES-256-GCM encryption
- Store in `chrome.storage.local`

**Files Modified**:
- `panel/side-panel.html` (settings tab)
- `panel/side-panel.js` (key management)

### Phase 6: Remove Shortcuts Tags (15 min)
**Goal**: Simplify shortcuts (no tags)

**Changes**:
- Remove tag input from shortcut modal
- Remove tag rendering
- Clean up data model

**Files Modified**:
- `panel/side-panel.html`
- `panel/side-panel.js`

### Phase 7: Testing & Validation (30 min)
**Test Cases**:
1. Create AI Prompt note
2. Test with GPT-4
3. Compare across models
4. Enterprise calculator
5. API key encryption
6. Error handling
7. Shortcuts without tags

## Friction Points Solved

| SAP Gen AI Hub Issue | Our Solution |
|---------------------|--------------|
| Complex setup | Direct API calls |
| Model selection paralysis | Side-by-side comparison |
| No cost visibility | Real-time estimates |
| Deployment required | Test from browser |
| Steep learning curve | One-click testing |
| Enterprise planning | Test-to-scale lineage |

## Total Implementation Time
~4.5 hours

## Manifest.json Updates
```json
{
  "permissions": ["storage", "activeTab"],
  "host_permissions": [
    "https://api.openai.com/*",
    "https://api.anthropic.com/*",
    "https://*.sap.com/*"
  ]
}
```

## Success Criteria
- [x] Fixed note types replace tags
- [x] Individual prompt testing works
- [x] Multi-model comparison functional
- [x] Enterprise calculator auto-populates
- [x] API keys encrypted
- [x] Shortcuts tags removed
- [x] All tests pass

---

**Status**: Ready for implementation  
**Last Updated**: 2026-01-13  
**Estimated Completion**: 4.5 hours
