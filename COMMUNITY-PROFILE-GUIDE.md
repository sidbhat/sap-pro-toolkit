# Community Profile Developer Guide

**Version**: 1.0  
**Last Updated**: 2026-01-18  
**For**: SAP Pro Toolkit Community Developers

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [JSON Schema Reference](#json-schema-reference)
3. [Field Specifications](#field-specifications)
4. [Icon System](#icon-system)
5. [Complete Examples](#complete-examples)
6. [Validation & Testing](#validation--testing)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Minimal Profile Template (Copy-Paste Ready)

```json
{
  "profileName": "My Custom Profile",
  "profileDescription": "Brief description of what this profile contains",
  "profileIcon": "folder",
  "shortcuts": [],
  "environments": [],
  "notes": []
}
```

### Usage

1. Copy the template above
2. Replace `profileName`, `profileDescription`, and add your data
3. Save as `my-profile.json`
4. Import via SAP Pro Toolkit: **Settings → Import Profile**

---

## 📐 JSON Schema Reference

### TypeScript Interface

```typescript
interface ProfileJSON {
  // Profile Metadata (Optional but Recommended)
  profileName?: string;           // Default: "Imported Profile"
  profileDescription?: string;    // Default: ""
  profileIcon?: string;           // Default: "📁" or "folder"
  version?: string;               // Optional version tracking
  
  // Data Arrays (All Optional - empty arrays if omitted)
  shortcuts?: Shortcut[];
  environments?: Environment[];
  notes?: Note[];
  solutions?: Solution[];         // Advanced: Quick Actions
  
  // Legacy Compatibility (Import system supports both)
  globalShortcuts?: Shortcut[];  // Alternative to "shortcuts"
}

interface Shortcut {
  id: string;                     // Required: Unique ID
  name: string;                   // Required: Display name (max 200 chars)
  url: string;                    // Required: Must be http:// or https://
  icon?: string;                  // Optional: SAP icon ID or emoji
  iconType?: "sap";              // Optional: Always "sap" if using SAP icons
  notes?: string;                 // Optional: Description (max 1000 chars)
  tags?: string[];                // Optional: For filtering/search
}

interface Environment {
  id: string;                     // Required: Unique ID
  name: string;                   // Required: Display name (max 200 chars)
  hostname: string;               // Required: Domain only (no http://)
  type: EnvironmentType;          // Required: See allowed values below
  icon?: string;                  // Optional: SAP icon ID or emoji
  iconType?: "sap";              // Optional: Always "sap" if using SAP icons
  notes?: string;                 // Optional: Description (max 1000 chars)
}

type EnvironmentType = 
  | "production" 
  | "preview" 
  | "test" 
  | "dev" 
  | "sandbox" 
  | "demo" 
  | "training";

interface Note {
  id: string;                     // Required: Unique ID
  title: string;                  // Required: Note title (max 500 chars)
  content: string;                // Required: Note content (max 50,000 chars)
  noteType: "note" | "ai-prompt"; // Required: Note type
  icon?: string;                  // Optional: SAP icon ID or emoji
  iconType?: "sap";              // Optional: Always "sap" if using SAP icons
  timestamp?: number;             // Optional: Unix timestamp (ms)
  aiConfig?: {                    // Optional: Only for ai-prompt type
    defaultModel?: string;        // e.g., "gpt-4-turbo"
  };
}

interface Solution {
  id: string;                     // Required: Unique ID
  name: string;                   // Required: Solution name (max 200 chars)
  quickActions: QuickAction[];    // Required: Array of quick actions
}

interface QuickAction {
  id: string;                     // Required: Unique ID
  name: string;                   // Required: Display name (max 200 chars)
  path: string;                   // Required: Relative URL path (max 500 chars)
}
```

---

## 📝 Field Specifications

### Profile Metadata

| Field | Type | Required | Max Length | Default | Notes |
|-------|------|----------|------------|---------|-------|
| `profileName` | string | No | 30 chars | "Imported Profile" | **CRITICAL**: Limited to 30 chars to prevent UI overflow |
| `profileDescription` | string | No | 500 chars | "" | Shown in profile menu |
| `profileIcon` | string | No | 50 chars | "📁" or "folder" | SAP icon ID or emoji |
| `version` | string | No | 20 chars | - | Optional version tracking |

### Shortcuts

| Field | Type | Required | Max Length | Validation |
|-------|------|----------|------------|------------|
| `id` | string | **Yes** | 50 chars | Alphanumeric, dashes, underscores only |
| `name` | string | **Yes** | 200 chars | No HTML tags |
| `url` | string | **Yes** | - | **Must start with http:// or https://** |
| `icon` | string | No | 50 chars | SAP icon ID (see Icon System) |
| `iconType` | string | No | - | Always `"sap"` if using SAP icons |
| `notes` | string | No | 1000 chars | No HTML tags |
| `tags` | string[] | No | 50 chars/tag | For search/filtering |

**Example**:
```json
{
  "id": "shortcut-joule-community",
  "name": "Joule Community",
  "url": "https://community.sap.com/topics/joule",
  "icon": "note",
  "iconType": "sap",
  "notes": "Q&A and best practices for SAP Joule",
  "tags": ["joule", "community", "help"]
}
```

### Environments

| Field | Type | Required | Max Length | Validation |
|-------|------|----------|------------|------------|
| `id` | string | **Yes** | 50 chars | Alphanumeric, dashes, underscores only |
| `name` | string | **Yes** | 200 chars | No HTML tags |
| `hostname` | string | **Yes** | - | Domain only (no `http://`, no spaces) |
| `type` | string | **Yes** | - | See EnvironmentType enum |
| `icon` | string | No | 50 chars | SAP icon ID |
| `iconType` | string | No | - | Always `"sap"` if using SAP icons |
| `notes` | string | No | 1000 chars | No HTML tags |

**Allowed Environment Types**:
- `"production"` - Production system
- `"preview"` - Preview/staging environment
- `"test"` - Test environment
- `"dev"` - Development environment
- `"sandbox"` - Sandbox for experimentation
- `"demo"` - Demo/sales environment
- `"training"` - Training environment

**Example**:
```json
{
  "id": "env-prod-us",
  "name": "Production (US)",
  "hostname": "company.successfactors.com",
  "type": "production",
  "icon": "globe",
  "iconType": "sap",
  "notes": "US production tenant"
}
```

### Notes

| Field | Type | Required | Max Length | Validation |
|-------|------|----------|------------|------------|
| `id` | string | **Yes** | 50 chars | Alphanumeric, dashes, underscores only |
| `title` | string | **Yes** | 500 chars | No HTML tags |
| `content` | string | **Yes** | 50,000 chars | No HTML tags |
| `noteType` | string | **Yes** | - | `"note"` or `"ai-prompt"` |
| `icon` | string | No | 50 chars | SAP icon ID |
| `iconType` | string | No | - | Always `"sap"` if using SAP icons |
| `timestamp` | number | No | - | Unix timestamp in milliseconds |
| `aiConfig` | object | No | - | Only for `noteType: "ai-prompt"` |

**Example (Regular Note)**:
```json
{
  "id": "note-onboarding-checklist",
  "title": "New Employee Onboarding Checklist",
  "content": "Day 1:\n• IT setup\n• Office tour\n• Benefits enrollment\n\nWeek 1:\n• Team introductions\n• Training sessions",
  "noteType": "note",
  "icon": "note",
  "iconType": "sap",
  "timestamp": 1737138000000
}
```

**Example (AI Prompt)**:
```json
{
  "id": "note-ai-resume-builder",
  "title": "Resume Builder Prompt",
  "content": "Create a professional resume based on:\n• Name: [Your Name]\n• Experience: [Years]\n• Skills: [List]\n• Target Role: [Position]",
  "noteType": "ai-prompt",
  "icon": "ai",
  "iconType": "sap",
  "timestamp": 1737138001000,
  "aiConfig": {
    "defaultModel": "gpt-4-turbo"
  }
}
```

---

## 🎨 Icon System

### SAP Icon Library

The toolkit uses SAP's Fiori icon library. Use icon **names** (not codes).

#### Common Icons

| Icon Name | Visual | Use For |
|-----------|--------|---------|
| `folder` | 📁 | Profiles, containers |
| `link` | 🔗 | Shortcuts, URLs |
| `globe` | 🌐 | Environments, websites |
| `note` | 📝 | Notes, documentation |
| `ai` | 🤖 | AI prompts, Joule |
| `target` | 🎯 | Goals, objectives |
| `preview` | 👁️ | Preview environments |
| `key` | 🔑 | Credentials, security |
| `wrench` | 🔧 | Tools, settings |
| `lightbulb` | 💡 | Tips, ideas |

#### Full Icon Reference

See complete list: [ICON-MAPPING.md](./ICON-MAPPING.md)

**Usage**:
```json
{
  "icon": "folder",
  "iconType": "sap"
}
```

**Emoji Alternative** (if you prefer):
```json
{
  "icon": "📁"
}
```

---

## 📚 Complete Examples

### Example 1: Minimal Profile (5 Items)

```json
{
  "profileName": "SuccessFactors Essentials",
  "profileDescription": "Core SF resources for consultants",
  "profileIcon": "note",
  "shortcuts": [
    {
      "id": "shortcut-1",
      "name": "SF Help Center",
      "url": "https://help.sap.com/docs/SAP_SUCCESSFACTORS_PLATFORM",
      "icon": "note",
      "iconType": "sap"
    }
  ],
  "environments": [
    {
      "id": "env-1",
      "name": "Production",
      "hostname": "company.successfactors.com",
      "type": "production",
      "icon": "globe",
      "iconType": "sap"
    }
  ],
  "notes": [
    {
      "id": "note-1",
      "title": "Quick Reference",
      "content": "Common SF transactions and tips",
      "noteType": "note",
      "icon": "note",
      "iconType": "sap",
      "timestamp": 1737138000000
    }
  ]
}
```

### Example 2: Full-Featured Profile

```json
{
  "profileName": "SF Implementation Toolkit",
  "profileDescription": "Complete toolkit for SuccessFactors implementations",
  "profileIcon": "wrench",
  "version": "1.0",
  "shortcuts": [
    {
      "id": "shortcut-sf-roadmap",
      "name": "SF Product Roadmap",
      "url": "https://roadmaps.sap.com/board?PRODUCT=089E017A62AB1EDA94C15F5EDB3320E1",
      "icon": "target",
      "iconType": "sap",
      "notes": "Upcoming SF features and release dates",
      "tags": ["roadmap", "planning", "releases"]
    },
    {
      "id": "shortcut-sf-community",
      "name": "SF Community",
      "url": "https://community.sap.com/topics/successfactors",
      "icon": "note",
      "iconType": "sap",
      "notes": "Community Q&A and best practices",
      "tags": ["community", "support", "help"]
    }
  ],
  "environments": [
    {
      "id": "env-prod",
      "name": "Production (US)",
      "hostname": "company.successfactors.com",
      "type": "production",
      "icon": "globe",
      "iconType": "sap",
      "notes": "US production tenant - LIVE DATA"
    },
    {
      "id": "env-preview",
      "name": "Preview (Testing)",
      "hostname": "company-preview.hr.cloud.sap",
      "type": "preview",
      "icon": "preview",
      "iconType": "sap",
      "notes": "Preview tenant for release testing"
    },
    {
      "id": "env-demo",
      "name": "Sales Demo",
      "hostname": "demo.successfactors.com",
      "type": "demo",
      "icon": "lightbulb",
      "iconType": "sap",
      "notes": "Demo tenant with sample data"
    }
  ],
  "notes": [
    {
      "id": "note-onboarding",
      "title": "Employee Onboarding Process",
      "content": "Complete onboarding checklist:\n\nWeek 1:\n• IT setup and system access\n• Benefits enrollment\n• Team introductions\n\nWeek 2:\n• Training sessions\n• Goal setting with manager\n• Department overview",
      "noteType": "note",
      "icon": "note",
      "iconType": "sap",
      "timestamp": 1737138000000
    },
    {
      "id": "note-ai-performance-summary",
      "title": "AI Prompt: Performance Summary",
      "content": "Summarize this employee's goal progress for [time period] and highlight their top 3 accomplishments in business language suitable for performance review discussion.\n\nExample: Summarize Jane Smith's goal progress for H1 2025 and highlight her top 3 accomplishments.",
      "noteType": "ai-prompt",
      "icon": "ai",
      "iconType": "sap",
      "timestamp": 1737138001000,
      "aiConfig": {
        "defaultModel": "gpt-4-turbo"
      }
    }
  ],
  "solutions": [
    {
      "id": "solution-sf-recruiting",
      "name": "SuccessFactors Recruiting",
      "quickActions": [
        {
          "id": "qa-requisitions",
          "name": "Requisition List",
          "path": "/xi/ui/rcmcommon/pages/requisitionList.xhtml"
        },
        {
          "id": "qa-candidates",
          "name": "Candidate List",
          "path": "/xi/ui/rcmcommon/pages/candidateSearch.xhtml"
        }
      ]
    }
  ]
}
```

### Example 3: Industry-Specific (HR Consulting)

```json
{
  "profileName": "HR Consultant Essentials",
  "profileDescription": "Resources for HR consultants working with SAP",
  "profileIcon": "note",
  "shortcuts": [
    {
      "id": "shortcut-1",
      "name": "SAP SuccessFactors Community",
      "url": "https://community.sap.com/topics/successfactors",
      "icon": "note",
      "iconType": "sap"
    },
    {
      "id": "shortcut-2",
      "name": "Workday vs SAP Comparison",
      "url": "https://www.sap.com/products/hcm/compare.html",
      "icon": "target",
      "iconType": "sap"
    }
  ],
  "environments": [],
  "notes": [
    {
      "id": "note-1",
      "title": "Client Discovery Questions",
      "content": "Key questions for SF implementations:\n• Current HRIS system?\n• Employee count?\n• Geographic locations?\n• Key pain points?\n• Timeline and budget?",
      "noteType": "note",
      "icon": "note",
      "iconType": "sap",
      "timestamp": 1737138000000
    }
  ]
}
```

---

## ✅ Validation & Testing

### Pre-Import Validation Checklist

Before sharing your profile JSON, verify:

- [ ] **Valid JSON**: Use [jsonlint.com](https://jsonlint.com/) to validate syntax
- [ ] **Profile Name**: ≤30 characters (CRITICAL for UI)
- [ ] **URLs**: All start with `http://` or `https://`
- [ ] **Hostnames**: No `http://` prefix, no spaces
- [ ] **Environment Types**: Only use allowed values
- [ ] **Icon IDs**: Valid SAP icon names (see ICON-MAPPING.md)
- [ ] **No HTML**: All text fields stripped of HTML tags
- [ ] **Unique IDs**: All `id` fields are unique within their array
- [ ] **No Credentials**: No passwords, API keys, or sensitive data

### Testing Workflow

1. **Validate JSON Syntax**:
   ```bash
   # Using Node.js
   node -e "JSON.parse(require('fs').readFileSync('my-profile.json'))"
   
   # Using Python
   python -m json.tool my-profile.json
   ```

2. **Import in Toolkit**:
   - Open SAP Pro Toolkit extension
   - Go to **Settings** section
   - Click **Import Profile** button
   - Select your JSON file
   - Verify profile name appears correctly (not truncated)

3. **Verify Data**:
   - Switch to imported profile
   - Check shortcuts render correctly
   - Verify environments display proper icons
   - Test notes open without errors
   - Confirm AI prompts show AI icon

4. **Export & Compare**:
   - Export the imported profile
   - Compare with your original JSON
   - Verify no data loss or corruption

### Common Validation Errors

| Error Message | Cause | Fix |
|--------------|-------|-----|
| "Invalid JSON file" | Syntax error | Use jsonlint.com to find error |
| "Profile name too long" | >30 characters | Shorten profile name to ≤30 chars |
| "URL must be external" | Missing http:// | Add `https://` prefix to URLs |
| "Hostname cannot contain spaces" | Spaces in hostname | Remove spaces from hostname field |
| "Invalid environment type" | Wrong type value | Use only allowed environment types |

---

## 💡 Best Practices

### 1. Naming Conventions

**Profile Names**:
- ✅ "SF Implementation Toolkit"
- ✅ "BTP Developer Essentials"
- ❌ "My Super Amazing SuccessFactors Profile with Everything" (too long!)

**Shortcut Names**:
- ✅ "SF Product Roadmap"
- ✅ "Joule Community Q&A"
- ❌ "Click here for the SuccessFactors product roadmap" (verbose)

**Environment Names**:
- ✅ "Production (US)"
- ✅ "Preview - Q1 Release"
- ❌ "Prod" (too short, unclear)

### 2. Icon Selection

**Use Semantic Icons**:
- 📁 `folder` - For profiles and containers
- 🔗 `link` - For external URLs
- 🌐 `globe` - For production environments
- 👁️ `preview` - For preview/staging environments
- 🤖 `ai` - For AI prompts and Joule content
- 📝 `note` - For documentation and notes
- 🎯 `target` - For goals and roadmaps

**Consistency**:
- Use same icon for similar item types
- Don't mix icon styles within a profile
- Prefer SAP icons over emojis for professional profiles

### 3. URL Validation

**Always Include Protocol**:
- ✅ `https://community.sap.com`
- ❌ `community.sap.com` (will fail validation)

**Use HTTPS When Possible**:
- ✅ `https://help.sap.com`
- ⚠️ `http://internal-wiki.com` (use only if HTTPS unavailable)

### 4. Security Considerations

**NEVER Include**:
- ❌ Passwords or credentials
- ❌ API keys or tokens
- ❌ Customer-specific company IDs
- ❌ Internal email addresses (@corp.sap, @company.com)
- ❌ Real person IDs or user IDs

**Use Templates Instead**:
```json
{
  "name": "Production Access",
  "notes": "Replace with your credentials: username@company.com"
}
```

### 5. Content Organization

**Group Related Items**:
- Group shortcuts by category (Documentation, Tools, Communities)
- Order environments by priority (Production, Preview, Test)
- Organize notes by topic (Onboarding, Policies, Technical)

**Use Tags for Shortcuts**:
```json
{
  "tags": ["documentation", "help", "api"]
}
```

### 6. Versioning

**Track Changes**:
```json
{
  "version": "1.2",
  "profileDescription": "Updated for H1 2026 release"
}
```

### 7. Documentation

**Add Descriptive Notes**:
```json
{
  "name": "API Documentation",
  "url": "https://api.successfactors.com/doc",
  "notes": "OData v2 API reference. Rate limit: 20K calls/hour"
}
```

---

## 🐛 Troubleshooting

### Profile Name Shows as "Imported Profile"

**Cause**: `profileName` field missing or too long

**Fix**:
```json
{
  "profileName": "My Profile"  // Add this field, ≤30 chars
}
```

### Shortcuts Don't Import

**Cause**: Invalid URL format

**Fix**: Ensure all URLs start with `http://` or `https://`:
```json
{
  "url": "https://community.sap.com"  // ✅ Correct
}
```

### Environment Icons Don't Show

**Cause**: Invalid icon ID

**Fix**: Use valid SAP icon names (see ICON-MAPPING.md):
```json
{
  "icon": "globe",      // ✅ Correct
  "iconType": "sap"
}
```

### Import Fails with "Invalid JSON"

**Cause**: JSON syntax error

**Fix**: Validate at [jsonlint.com](https://jsonlint.com/):
- Check for missing commas
- Verify closing brackets
- Ensure proper quote matching

### AI Prompts Show as Regular Notes

**Cause**: `noteType` field incorrect

**Fix**:
```json
{
  "noteType": "ai-prompt",  // Must be exact string
  "aiConfig": {
    "defaultModel": "gpt-4-turbo"
  }
}
```

---

## 📚 Additional Resources

### Reference Files

Use these as templates:
- `resources/starter-profile.json` - Simple community template
- `resources/profile-global.json` - System profile example
- `resources/profile-successfactors-public.json` - Full-featured example

### Documentation

- [Main README](./README.md) - Toolkit overview
- [ICON-MAPPING.md](./ICON-MAPPING.md) - Complete icon reference
- [PROFILES.md](./PROFILES.md) - Profile system documentation

### Community

- **GitHub Issues**: [Report bugs or request features](https://github.com/sidbhat/sap-pro-toolkit/issues)
- **Discussions**: [Ask questions and share profiles](https://github.com/sidbhat/sap-pro-toolkit/discussions)

---

## 🎉 Sharing Your Profile

### Contribution Guidelines

When sharing your profile with the community:

1. **Sanitize Data**: Remove all credentials, company-specific info
2. **Test Thoroughly**: Import/export to verify no data loss
3. **Document Purpose**: Clear description of what profile contains
4. **Add License**: Specify if others can use/modify
5. **Version Track**: Include version number for updates

### Recommended License

Add to your JSON:
```json
{
  "license": "MIT",
  "author": "Your Name",
  "repository": "https://github.com/yourusername/sf-profiles"
}
```

---

**Questions?** Open an issue on [GitHub](https://github.com/sidbhat/sap-pro-toolkit/issues)

**Found a bug?** Use `/reportbug` in the toolkit chat

**Have a profile to share?** Submit a pull request!

---

*Last Updated: 2026-01-18 | Community Developer Guide v1.0*
