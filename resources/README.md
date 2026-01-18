# 📦 SAP Pro Toolkit - Profile Repository

This directory contains curated configuration profiles for the SAP Pro Toolkit Chrome extension.

## 🎯 What's in This Directory?

**8 System Profiles** - Professionally curated, pre-tested profiles maintained by the SAP Pro Toolkit team:
- `profile-global.json` - Universal SAP resources
- `profile-successfactors-public.json` - SuccessFactors HCM workflows
- `profile-s4hana.json` - S/4HANA ERP & Finance
- `profile-btp.json` - Business Technology Platform development
- `profile-executive.json` - Business value metrics
- `profile-golive.json` - Implementation & go-live checklists
- `profile-ai-joule.json` - Comprehensive Joule AI prompt library
- `starter-profile.json` - Empty template for custom profiles

**Community Profiles** - Coming soon! Profiles contributed by the SAP community will be added here with proper attribution.

---

## 📝 Profile JSON Schema

### Basic Structure

```json
{
  "version": "2.0",
  "profileName": "My Custom Profile",
  "profileDescription": "What this profile contains and who it's for",
  "profileIcon": "ai",
  "contributor": "Your Name (optional - for community profiles)",
  "contributorUrl": "https://linkedin.com/in/yourprofile (optional)",
  "globalShortcuts": [],
  "environments": [],
  "notes": [],
  "exportDate": "2026-01-18T12:00:00.000Z",
  "lastUpdated": "2026-01-18"
}
```

### Contributor Attribution (NEW!)

For community-contributed profiles, add these optional fields:

```json
{
  "contributor": "Jane Smith",
  "contributorUrl": "https://linkedin.com/in/janesmith",
  "contributorOrg": "Acme Corp (optional)",
  "contributionDate": "2026-01-18"
}
```

**These fields will be displayed in the extension UI to give credit to profile creators!**

---

## 🤝 Contributing Your Profile

We welcome community contributions! Your profile can help thousands of SAP professionals.

### Step 1: Create Your Profile

1. Download `starter-profile.json` as a template
2. Customize with your shortcuts, environments, and AI prompts
3. Add meaningful descriptions and helpful notes
4. Test thoroughly in the SAP Pro Toolkit extension

### Step 2: Add Contributor Attribution

Add your name and optional profile link at the top level:

```json
{
  "version": "2.0",
  "profileName": "SAP Ariba Procurement Workflows",
  "profileDescription": "Common procurement workflows, approval shortcuts, and supplier management",
  "profileIcon": "folder",
  "contributor": "John Doe",
  "contributorUrl": "https://linkedin.com/in/johndoe",
  "contributorOrg": "Procurement Solutions Inc",
  "contributionDate": "2026-01-18",
  "globalShortcuts": [...]
}
```

### Step 3: Sanitize Sensitive Data

**⚠️ CRITICAL - Remove these before submitting:**

❌ **DO NOT INCLUDE:**
- Real production hostnames (use `your-company.sapsf.com` placeholders)
- Company IDs, tenant identifiers, or customer names
- Credentials, API keys, passwords, or tokens
- Internal employee names, emails, or user IDs
- Proprietary business data or confidential information
- Internal company URLs or intranet links

✅ **SAFE TO INCLUDE:**
- Generic SAP documentation URLs (help.sap.com, community.sap.com)
- Public product roadmap links
- SAP Note numbers and references
- Public API documentation
- Template/example configurations
- Your name and public LinkedIn/GitHub profile

### Step 4: Submit Your Profile

**Option A: GitHub Issue** (Easiest)
1. Go to [Issues → New Issue](https://github.com/sidbhat/sap-pro-toolkit/issues/new/choose)
2. Select **✨ Feature Request**
3. Title: "Community Profile: [Your Profile Name]"
4. Choose: **"Yes, I'd like to contribute a profile JSON"**
5. Paste your sanitized profile JSON in the description
6. Submit!

**Option B: Pull Request** (Advanced)
1. Fork the repository
2. Add your profile: `resources/profile-[descriptive-name].json`
3. Update `../PROFILES.md` with your profile description in the "Community Profiles" section
4. Submit PR with title: "feat: Add [Profile Name] community profile"

### Step 5: Profile Review

Your submission will be reviewed for:
- ✅ **Security**: No sensitive data, credentials, or internal information
- ✅ **Quality**: Helpful content, clear descriptions, proper formatting
- ✅ **Value**: Fills a gap, serves a specific SAP role/solution/use case
- ✅ **Schema**: Valid JSON structure matching the schema
- ✅ **Testing**: Profile works correctly when imported

**Typical review time**: 3-5 business days

---

## 📖 Schema Field Reference

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Schema version (use "2.0") |
| `profileName` | string | Yes | Profile display name |
| `profileDescription` | string | Yes | What the profile contains |
| `profileIcon` | string | Yes | Icon from library (ai, note, link, folder, etc.) |
| `contributor` | string | No | Your name (for community profiles) |
| `contributorUrl` | string | No | Your LinkedIn/GitHub URL |
| `contributorOrg` | string | No | Your organization (optional) |
| `contributionDate` | string | No | ISO date when profile created |
| `globalShortcuts` | array | Yes | Array of shortcut objects |
| `environments` | array | Yes | Array of environment objects |
| `notes` | array | Yes | Array of note/prompt objects |
| `exportDate` | string | Yes | ISO timestamp |
| `lastUpdated` | string | Yes | ISO date (YYYY-MM-DD) |

### Shortcuts Object

```json
{
  "id": "shortcut-unique-id",
  "name": "SAP Community",
  "url": "https://community.sap.com",
  "icon": "link",
  "iconType": "library",
  "notes": "Official SAP community forums and expert discussions",
  "searchProvider": "google"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique ID (shortcut-timestamp or shortcut-uuid) |
| `name` | string | Yes | Display name |
| `url` | string | Yes | Target URL |
| `icon` | string | Yes | Icon identifier |
| `iconType` | string | Yes | "library" or "text" |
| `notes` | string | No | Description/context |
| `searchProvider` | string | No | "google", "bing", or "duckduckgo" |

### Environments Object

```json
{
  "id": "env-unique-id",
  "name": "Production",
  "type": "production",
  "hostname": "your-company.sapsf.com",
  "notes": "Primary production environment",
  "icon": "folder"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique ID (env-timestamp) |
| `name` | string | Yes | Display name |
| `type` | string | Yes | production, preview, sandbox, sales, training |
| `hostname` | string | Yes | SAP system hostname (use placeholder) |
| `notes` | string | No | Environment details |
| `icon` | string | Yes | Icon identifier |

### Notes Object

```json
{
  "id": "note-unique-id",
  "title": "🤖 Joule Prompt: Summarize Employee Goals",
  "content": "Summarize this employee's goal progress for H1 2026...",
  "noteType": "ai-prompt",
  "icon": "ai",
  "timestamp": 1736633533000,
  "aiConfig": {
    "defaultModel": "gpt-4-turbo"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique ID (note-timestamp) |
| `title` | string | Yes | Note title |
| `content` | string | Yes | Note body/prompt text |
| `noteType` | string | Yes | "note" or "ai-prompt" |
| `icon` | string | Yes | Icon identifier |
| `timestamp` | number | Yes | Unix timestamp (milliseconds) |
| `aiConfig` | object | No | AI model configuration |
| `aiConfig.defaultModel` | string | No | "gpt-4-turbo", "claude-3-opus", "gemini-pro" |

### Icon Library

Available icons (use with `"iconType": "library"`):
- `ai` - AI/Joule prompts
- `note` - Documentation, notes
- `link` - Web shortcuts
- `folder` - Environments, collections
- `settings` - Configuration
- `search` - Search tools
- `calendar` - Scheduling
- `email` - Communication

Or use custom emoji/text with `"iconType": "text"`.

---

## 🎨 Profile Best Practices

### For Naming
- ✅ **Descriptive**: "SAP Ariba Procurement Workflows"
- ✅ **Solution-focused**: "SuccessFactors Recruiting Manager"
- ✅ **Role-based**: "Finance Controller - S/4HANA"
- ❌ **Too generic**: "My Profile", "SAP Stuff"

### For Descriptions
- ✅ **Specific**: "Common procurement workflows, PO approvals, supplier management shortcuts"
- ✅ **Target audience**: "For recruiting managers using SuccessFactors"
- ❌ **Vague**: "Some useful links"

### For Content
- ✅ **Quality over quantity**: 10 well-documented items > 50 random links
- ✅ **Add context**: Every shortcut should have a "notes" field explaining its purpose
- ✅ **Test first**: Import and verify everything works before submitting
- ✅ **Use placeholders**: `your-company.sapsf.com` instead of real hostnames

### For AI Prompts
- ✅ **Include examples**: Show expected input/output
- ✅ **Add context**: Explain when to use the prompt
- ✅ **Choose model**: Specify appropriate AI model for the task
- ✅ **Use placeholders**: `[employee-name]`, `[date-range]` for dynamic fields

---

## 🔒 Security Guidelines

### What NOT to Include

**Never include in public profiles:**
1. **Production Credentials**
   - Passwords, API keys, tokens
   - OAuth secrets
   - Service account credentials

2. **Customer Data**
   - Real company names
   - Customer IDs, tenant IDs
   - Employee names, emails, user IDs
   - Confidential business information

3. **Internal Resources**
   - Internal company URLs
   - Intranet links
   - Private Confluence/SharePoint pages
   - Non-public API endpoints

4. **Proprietary Information**
   - Custom code implementations
   - Business logic
   - Integration details
   - Competitive information

### Safe Content Examples

```json
{
  "environments": [
    {
      "name": "Production",
      "hostname": "your-company.sapsf.com",
      "notes": "Replace 'your-company' with your actual SAP subdomain"
    }
  ],
  "globalShortcuts": [
    {
      "name": "SAP Help Portal",
      "url": "https://help.sap.com",
      "notes": "Official SAP documentation"
    }
  ]
}
```

---

## 📊 Profile Statistics

**Current Repository:**
- **System Profiles**: 8 (professionally maintained)
- **Community Profiles**: 0 (accepting submissions!)
- **Total Combined**: 200+ shortcuts, 50+ environments, 100+ AI prompts

**Most Popular Uses:**
- SuccessFactors HR administration
- S/4HANA finance workflows
- BTP development shortcuts
- Joule AI prompt libraries

---

## 🎉 Community Profile Gallery

*This section will showcase amazing community contributions!*

**Want to be featured here?**
1. Create an exceptional profile with 15+ high-quality items
2. Add excellent documentation and descriptions
3. Submit via GitHub issue or PR
4. Get approved and merged
5. Your profile + name will be showcased here!

---

## 💡 Examples & Templates

### Example 1: Solution-Specific Profile

```json
{
  "version": "2.0",
  "profileName": "SAP Concur Travel Management",
  "profileDescription": "Travel booking workflows, expense reporting shortcuts, and policy compliance guides",
  "profileIcon": "folder",
  "contributor": "Jane Smith",
  "contributorUrl": "https://linkedin.com/in/janesmith",
  "globalShortcuts": [
    {
      "id": "shortcut-1736633533000",
      "name": "Concur Expense Reports",
      "url": "https://www.concursolutions.com/expense",
      "icon": "link",
      "iconType": "library",
      "notes": "Direct link to expense report submission"
    }
  ]
}
```

### Example 2: Role-Based Profile

```json
{
  "version": "2.0",
  "profileName": "SAP Basis Administrator Toolkit",
  "profileDescription": "System monitoring shortcuts, transport management, and performance tuning guides",
  "profileIcon": "settings",
  "contributor": "John Doe",
  "contributorUrl": "https://github.com/johndoe",
  "notes": [
    {
      "id": "note-1736633533000",
      "title": "Transaction Code Quick Reference",
      "content": "SM50 - Process Overview\nSM51 - SAP Servers\nST22 - ABAP Dumps...",
      "noteType": "note",
      "icon": "note"
    }
  ]
}
```

---

## 📞 Support

**Questions about profiles?**
- [GitHub Discussions](https://github.com/sidbhat/sap-pro-toolkit/discussions) - Community Q&A
- [Report an Issue](https://github.com/sidbhat/sap-pro-toolkit/issues) - Bugs or problems

**Profile submission questions?**
- Check the [PROFILES.md](../PROFILES.md) documentation
- Review existing profiles in this directory for examples
- Ask in Discussions before submitting

---

## 📝 Version History

- **v2.0** (2026-01-18): Initial profile repository with contributor attribution support
- Added `contributor`, `contributorUrl`, `contributorOrg` fields
- Established community contribution guidelines
- Created comprehensive schema documentation

---

**Ready to contribute? We can't wait to see what you build! 🚀**

*Made with ❤️ by the SAP Community*
