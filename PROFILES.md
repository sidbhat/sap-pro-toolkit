# 📦 Community Profile Database

Welcome to the SF Pro Toolkit Community Profile Database! This collection of curated profiles enables rapid configuration of the toolkit for different SAP solutions, roles, and use cases.

## 🎯 What are Profiles?

Profiles are JSON configuration files that pre-configure the SF Pro Toolkit with:
- **Quick Actions**: Deep links to common workflows
- **Shortcuts**: Frequently accessed URLs and documentation
- **Environments**: Pre-configured SAP system templates
- **AI Prompts**: Joule copilot prompt templates
- **Notes**: Reference documentation and code snippets

## 📚 Available Profiles

### 1. 🌍 Global Profile
**File**: [`resources/profile-global.json`](resources/profile-global.json)

**Purpose**: Universal SAP shortcuts and resources applicable across all SAP solutions

**Includes**:
- SAP Community links
- SAP Note search shortcuts
- General Joule AI activation guides
- Cross-solution documentation

**Best For**: All SAP users, consultants working across multiple solutions

---

### 2. 👥 SuccessFactors Profile
**File**: [`resources/profile-successfactors-public.json`](resources/profile-successfactors-public.json)

**Purpose**: HCM/HR workflows and SuccessFactors-specific resources

**Includes**:
- SuccessFactors Product Roadmap
- Employee Central quick actions
- Recruiting & Performance prompts
- Common test user templates
- Essential SF SAP Notes
- API integration references

**Best For**: HR administrators, SF consultants, implementation teams

**Key Features**:
- 🤖 **4 AI Prompts**: Performance reviews, policy explanations, attrition analysis, recruiting optimization
- ⚡ **Quick Actions**: Direct links to admin tools, goal management, recruiting
- 🌍 **Environment Templates**: Production, Preview, Sales Demo configurations

---

### 3. 💼 S/4HANA Profile
**File**: [`resources/profile-s4hana.json`](resources/profile-s4hana.json)

**Purpose**: ERP & Finance workflows for S/4HANA Cloud and on-premise

**Includes**:
- Finance & Controlling shortcuts
- Clean Core migration guides
- S/4HANA Cloud release notes
- Joule prompts for financial analysis
- Common transaction codes

**Best For**: Finance teams, ERP consultants, S/4HANA administrators

---

### 4. ☁️ BTP Profile
**File**: [`resources/profile-btp.json`](resources/profile-btp.json)

**Purpose**: Business Technology Platform development and integration

**Includes**:
- BTP Cockpit quick access
- SAP Build shortcuts
- AI Core & Joule Studio links
- CAP development resources
- Integration Suite guides

**Best For**: BTP developers, integration architects, low-code developers

---

### 5. 📊 Executive Profile
**File**: [`resources/profile-executive.json`](resources/profile-executive.json)

**Purpose**: Business value metrics and executive dashboards

**Includes**:
- ROI calculators
- Competitive positioning resources
- Customer success stories
- Business value frameworks

**Best For**: Executive stakeholders, sales teams, business analysts

---

### 6. 🚀 Go-Live Profile
**File**: [`resources/profile-golive.json`](resources/profile-golive.json)

**Purpose**: Implementation and go-live checklists

**Includes**:
- Cutover planning templates
- Go-live readiness checks
- Hypercare support guides
- Common go-live issues & resolutions

**Best For**: Implementation teams, project managers, technical leads during go-live

---

### 7. 🤖 AI & Joule Profile
**File**: [`resources/profile-ai-joule.json`](resources/profile-ai-joule.json)

**Purpose**: Comprehensive Joule AI prompt library and AI capabilities

**Includes**:
- 20+ production-ready Joule prompts
- AI model configuration guides
- Prompt engineering best practices
- Token counting & optimization tips

**Best For**: AI enthusiasts, Joule early adopters, productivity power users

---

### 8. 🎬 Starter Profile (Template)
**File**: [`resources/starter-profile.json`](resources/starter-profile.json)

**Purpose**: Empty template for creating custom profiles

**Includes**:
- Schema documentation
- Example structures for all features
- Placeholder data

**Best For**: Users creating custom profiles, developers, community contributors

---

## 📥 How to Use Profiles

### Method 1: Import via Extension UI

1. Open SF Pro Toolkit side panel
2. Click **⚙️ Settings** → **Profile Management**
3. Click **Import Profile**
4. Select a profile JSON file from the `resources/` directory
5. Review and confirm import

### Method 2: Download from GitHub

1. Navigate to [`resources/`](resources/) directory
2. Click on desired profile JSON file
3. Click **Raw** button
4. Right-click → **Save As** to download
5. Import using Method 1 above

### Method 3: Direct GitHub URL Import

```javascript
// Example: Import SuccessFactors profile via URL
const profileUrl = 'https://raw.githubusercontent.com/sidbhat/sf-pro-toolkit/main/resources/profile-successfactors-public.json';
// Use extension's import functionality with this URL
```

---

## 🛠️ Profile Schema Reference

### Profile Structure

```json
{
  "version": "2.0",
  "profileName": "My Custom Profile",
  "profileDescription": "Description of what this profile contains",
  "profileIcon": "ai",
  "globalShortcuts": [...],
  "environments": [...],
  "notes": [...],
  "exportDate": "2026-01-18T12:00:00.000Z",
  "lastUpdated": "2026-01-18"
}
```

### Shortcuts Array

```json
{
  "id": "shortcut-unique-id",
  "name": "Shortcut Name",
  "url": "https://example.com",
  "icon": "link",
  "iconType": "library",
  "notes": "Description of this shortcut",
  "searchProvider": "google|bing|duckduckgo"
}
```

### Environments Array

```json
{
  "id": "env-unique-id",
  "name": "Production",
  "type": "production|preview|sandbox|sales|training",
  "hostname": "your-company.sapsf.com",
  "notes": "Environment details",
  "icon": "folder"
}
```

### Notes Array

```json
{
  "id": "note-unique-id",
  "title": "Note Title",
  "content": "Note content...",
  "noteType": "note|ai-prompt",
  "icon": "note",
  "timestamp": 1736633533000,
  "aiConfig": {
    "defaultModel": "gpt-4-turbo|claude-3-opus|gemini-pro"
  }
}
```

### Icon Library

Available icons (use in `icon` field with `"iconType": "library"`):
- `ai`, `note`, `link`, `folder`, `settings`, `search`, `calendar`, `email`
- Or use custom emoji/text (set `"iconType": "text"`)

---

## 🤝 Contributing Your Profile

We welcome community-contributed profiles! Here's how:

### 1. Create Your Profile

1. Start with [`starter-profile.json`](resources/starter-profile.json) template
2. Customize with your shortcuts, environments, and prompts
3. Test thoroughly in your environment
4. Add meaningful descriptions and notes

### 2. Sanitize Sensitive Data

**⚠️ CRITICAL**: Remove before submitting:
- ❌ Real production hostnames (use placeholders: `your-company.sapsf.com`)
- ❌ Company IDs or tenant identifiers
- ❌ Credentials, API keys, or tokens
- ❌ Internal employee information
- ❌ Proprietary business data

**✅ Safe to Include**:
- Generic SAP documentation URLs
- Public roadmap links
- SAP Community resources
- Example/template configurations

### 3. Submit Your Profile

**Option A: GitHub Issue**
1. Go to [Issues](https://github.com/sidbhat/sap-pro-toolkit/issues/new/choose)
2. Select **✨ Feature Request**
3. Choose **"Yes, I'd like to contribute a profile JSON"**
4. Paste your profile JSON in the **Additional Context** section

**Option B: Pull Request**
1. Fork the repository
2. Add your profile: `resources/profile-[name].json`
3. Update this PROFILES.md with profile description
4. Submit PR with clear description

### 4. Profile Contribution Guidelines

Your profile should:
- ✅ Have a clear, descriptive name
- ✅ Include meaningful descriptions for all items
- ✅ Use appropriate icons from the library
- ✅ Follow the schema structure
- ✅ Be tested in the extension
- ✅ Add value for a specific use case/role

Profiles will be reviewed for:
- Security (no sensitive data)
- Quality (helpful content, good descriptions)
- Uniqueness (fills a gap in existing profiles)
- Schema compliance (valid JSON structure)

---

## 📖 Additional Resources

### Documentation
- [README.md](README.md) - Full extension documentation
- [AI-TRANSPARENCY.md](AI-TRANSPARENCY.md) - AI feature details
- [PRIVACY-POLICY.md](PRIVACY-POLICY.md) - Data handling practices

### Support
- [Report a Bug](https://github.com/sidbhat/sap-pro-toolkit/issues/new?template=bug_report.yml) - File bug reports
- [Request a Feature](https://github.com/sidbhat/sap-pro-toolkit/issues/new?template=feature_request.yml) - Suggest new features
- [Discussions](https://github.com/sidbhat/sap-pro-toolkit/discussions) - Community Q&A

### SAP Resources
- [SAP Community](https://community.sap.com) - Expert discussions
- [SAP Help Portal](https://help.sap.com) - Official documentation
- [SAP Roadmap Explorer](https://roadmaps.sap.com) - Product roadmaps

---

## 📊 Profile Statistics

| Profile | Shortcuts | Environments | AI Prompts | Notes | Use Case |
|---------|-----------|--------------|------------|-------|----------|
| Global | 5+ | 0 | 2 | 10+ | Universal |
| SuccessFactors | 4+ | 3 | 4 | 5+ | HCM/HR |
| S/4HANA | 6+ | 2 | 3 | 8+ | Finance/ERP |
| BTP | 7+ | 2 | 2 | 6+ | Development |
| Executive | 4+ | 0 | 2 | 5+ | Business Value |
| Go-Live | 3+ | 4 | 1 | 10+ | Implementation |
| AI & Joule | 2+ | 0 | 20+ | 5+ | AI/Productivity |
| Starter | 2 | 2 | 1 | 3 | Template |

---

## 🎉 Community Highlights

*Coming soon: Showcase of community-contributed profiles!*

Have you created an amazing profile? Share it with the community! We'll feature the best contributions here.

---

## 📝 Version History

- **v2.0** (2026-01-18): Initial community profile database with 8 curated profiles
- Profile schema standardization
- AI prompt library integration
- Icon library support

---

## 💡 Tips & Best Practices

### For Profile Creators
1. **Start Small**: Begin with 5-10 most useful items
2. **Test Thoroughly**: Import and test your profile before sharing
3. **Add Context**: Include helpful notes explaining each item
4. **Use Icons Wisely**: Choose intuitive icons from the library
5. **Version Control**: Track changes with version numbers

### For Profile Users
1. **Customize**: Import a base profile then customize to your needs
2. **Combine**: Mix items from multiple profiles
3. **Export**: Back up your customized profiles regularly
4. **Share**: Contribute back improvements to community profiles

### For AI Prompts
1. **Be Specific**: Include [placeholders] for context-specific terms
2. **Show Examples**: Provide concrete usage examples
3. **Set Expectations**: Describe expected output format
4. **Choose Models**: Select appropriate AI model (GPT-4 for reasoning, Claude for creative)

---

## 🔒 Security & Privacy

- All profiles in this repository are **sanitized for public use**
- No production credentials or sensitive data included
- Use placeholder hostnames (e.g., `your-company.sapsf.com`)
- See [PRIVACY-POLICY.md](PRIVACY-POLICY.md) for data handling

**Before Importing**: Review profile contents to ensure they align with your organization's security policies.

---

## 📞 Questions?

- **General Questions**: [GitHub Discussions](https://github.com/sidbhat/sap-pro-toolkit/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/sidbhat/sap-pro-toolkit/issues)
- **Feature Requests**: [Feature Request Template](https://github.com/sidbhat/sap-pro-toolkit/issues/new?template=feature_request.yml)

---

**Made with ❤️ by the SAP Community**

*Last Updated: January 18, 2026*
