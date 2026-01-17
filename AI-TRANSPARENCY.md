# AI Transparency Statement

**Last Updated:** January 17, 2026  
**Document Version:** 1.0  
**Compliance:** EU AI Act (Limited Risk System)

---

## Overview

SF Pro Toolkit uses AI features to enhance productivity for SAP professionals. This document provides complete transparency about our AI implementation in compliance with the EU AI Act Article 52 (Limited Risk AI Systems).

---

## AI Risk Classification

**Classification:** Limited Risk AI System  
**Regulatory Framework:** EU AI Act Article 52 - Transparency Obligations  
**Geographic Scope:** Global (EU AI Act compliant)

---

## AI Features & Capabilities

### 1. **AI-Powered Search**
- **What It Does:** Analyzes your search query and provides intelligent recommendations for shortcuts, environments, and notes
- **AI Provider:** Configurable (OpenAI GPT-4, Anthropic Claude, or SAP AI Core)
- **Data Processing:** Search query sent to AI provider API only when you explicitly click "AI Search" button
- **User Control:** Can be disabled in Settings > API Keys

### 2. **Page Diagnostics**
- **What It Does:** Analyzes current SAP page for errors, performance issues, and configuration problems
- **AI Provider:** Configurable (OpenAI GPT-4, Anthropic Claude, or SAP AI Core)
- **Data Processing:** Page metadata (URL, title, console errors) sent to AI provider when you click "Diagnostics" button
- **User Control:** Manual trigger only - no automatic analysis

### 3. **AI Shortcut Creation**
- **What It Does:** Scrapes current page content and generates a descriptive shortcut title and summary
- **AI Provider:** Configurable (OpenAI GPT-4, Anthropic Claude, or SAP AI Core)
- **Data Processing:** Page title, URL, and visible text content sent to AI provider when you click "Add with AI" button
- **User Control:** Manual trigger only - works only on SAP domains

### 4. **Note Enhancement**
- **What It Does:** Refines and improves note content using AI
- **AI Provider:** Configurable (OpenAI GPT-4, Anthropic Claude, or SAP AI Core)
- **Data Processing:** Note content sent to AI provider when you explicitly request enhancement
- **User Control:** Manual trigger only - must click "Enhance with AI" button

### 5. **Enterprise Cost Calculator**
- **What It Does:** Projects enterprise-scale AI costs based on token usage from test queries
- **AI Provider:** Uses pricing data from LiteLLM database (no external API calls)
- **Data Processing:** Local calculation only - no data sent to external services
- **User Control:** Fully local - no AI provider involved

---

## AI Model Providers

We support three AI model providers. **You choose which one to use:**

### **OpenAI**
- **Models:** GPT-4 Turbo, GPT-4o
- **Privacy Policy:** https://openai.com/privacy
- **Data Retention:** Per OpenAI's API data usage policy (typically 30 days)
- **Location:** United States

### **Anthropic**
- **Models:** Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **Privacy Policy:** https://www.anthropic.com/privacy
- **Data Retention:** Per Anthropic's API data usage policy (typically 90 days)
- **Location:** United States

### **SAP AI Core**
- **Models:** Deployed models in your SAP BTP tenant
- **Privacy Policy:** https://www.sap.com/about/trust-center/agreements.html
- **Data Retention:** Controlled by your SAP contract and tenant configuration
- **Location:** Your chosen SAP data center region

---

## Data Processing

### What Data We Collect
- ✅ **Search queries** (when you use AI Search)
- ✅ **Page metadata** (URL, title, console errors - when you use Diagnostics)
- ✅ **Page content** (visible text - when you use AI Shortcut creation)
- ✅ **Note content** (when you use AI enhancement)

### What Data We DON'T Collect
- ❌ **No automatic tracking** - All AI features require explicit user action
- ❌ **No background data collection** - Extension only processes data when you trigger AI features
- ❌ **No browsing history** - We don't track which pages you visit
- ❌ **No personal information** - Extension doesn't collect names, emails, or credentials

### Data Flow
1. **User triggers AI feature** (clicks button)
2. **Extension prepares request** (formats data locally)
3. **API call to selected provider** (OpenAI, Anthropic, or SAP AI Core)
4. **Provider processes request** (generates AI response)
5. **Response displayed to user** (with clear "AI-generated" label)
6. **No permanent storage** - API keys encrypted locally, responses not saved

### Data Retention
- **Extension Storage:** API keys stored encrypted in browser local storage
- **AI Provider Storage:** Per provider's API data usage policies (see above)
- **Your Control:** Clear API keys anytime in Settings > API Keys

---

## AI Limitations & Risks

### Known Limitations
⚠️ **Accuracy:** AI responses may contain inaccuracies or "hallucinations" (confident but incorrect statements)  
⚠️ **Context:** AI doesn't have access to your full SAP system - only data you explicitly send  
⚠️ **Timeliness:** AI training data has knowledge cutoff dates (typically 3-12 months old)  
⚠️ **Consistency:** Same query may produce different responses on repeated runs  
⚠️ **Language:** AI performs best in English; other languages may have reduced accuracy

### Risk Mitigation
✅ **Human Oversight Required:** All AI suggestions must be reviewed by qualified professionals  
✅ **No Autonomous Actions:** Extension never executes AI recommendations automatically  
✅ **Clear Labeling:** All AI-generated content clearly marked with 🤖 AI badge  
✅ **Verification Warnings:** "Always verify AI suggestions independently" disclaimer on all results  
✅ **Right to Explanation:** Users can see which model/provider was used for each response

---

## User Rights & Controls

### Your Rights
1. ✅ **Right to Disable AI:** Remove API keys in Settings to completely disable AI features
2. ✅ **Right to Explanation:** Each AI response shows model name, provider, and token count
3. ✅ **Right to Human Review:** All AI suggestions are recommendations only - you make final decisions
4. ✅ **Right to Data Deletion:** Clear API keys and browser data to remove all traces

### How to Exercise Your Rights
- **Disable AI Features:** Settings > API Keys > Clear all keys
- **View AI Transparency:** Click "AI Transparency & Privacy" link in extension footer
- **Contact Support:** Open issue on GitHub: https://github.com/sidbhat/sf-pro-toolkit/issues

---

## Compliance & Certifications

### EU AI Act Compliance
- ✅ **Article 52 (Transparency):** All AI interactions clearly disclosed to users
- ✅ **Article 13 (Transparency Obligations):** Full documentation of AI capabilities and limitations
- ✅ **Article 14 (Human Oversight):** All AI outputs subject to human review
- ✅ **Article 86 (Right to Explanation):** Model and provider information displayed for each response

### Data Protection
- ✅ **GDPR Compliant:** No personal data collected without explicit user action
- ✅ **Privacy by Design:** Local-first architecture - data only sent when user triggers AI
- ✅ **User Control:** Full control over API keys and AI feature usage

---

## Contact & Support

### Questions About AI Features
- **GitHub Issues:** https://github.com/sidbhat/sf-pro-toolkit/issues
- **Documentation:** https://github.com/sidbhat/sf-pro-toolkit/blob/main/README.md

### Report AI Issues
If you encounter:
- Inaccurate AI responses
- Inappropriate content
- Privacy concerns
- Compliance questions

Please open a GitHub issue with details.

---

## Updates to This Statement

This AI Transparency Statement may be updated to reflect:
- New AI features
- Changes to AI providers
- Updated compliance requirements
- User feedback

**Check this document periodically for updates.**  
**Last Updated:** January 17, 2026

---

## Disclaimer

**Not Affiliated with SAP SE**  
This extension is an independent tool and is not affiliated with, endorsed by, or supported by SAP SE or any of its affiliates.

**AI-Generated Content**  
All content generated by AI features in this extension should be independently verified before use in production environments or business-critical decisions.

**No Warranty**  
This extension and its AI features are provided "as is" without warranty of any kind, express or implied.
