# SAP Pro Toolkit

> A Chrome extension for SAP professionals - Your command center for SuccessFactors, S/4HANA, BTP, and more

<img src="screenshots/sap%20pro%20toolkil%20screenshots1.png" alt="SAP Pro Toolkit" width="400">

**Version**: 1.6.5 | **Status**: Production Ready | **Languages**: 10 supported

---

## 🎯 What is SAP Pro Toolkit?

A **Chrome side panel extension** that transforms how SAP professionals work across multiple SAP systems. Switch environments instantly, organize bookmarks by solution, test AI prompts live, and access everything with keyboard shortcuts - all from a persistent side panel.

**First-time users**: The extension shows a welcome screen featuring the 5 core capabilities, then loads you into a curated starter profile with example environments, shortcuts, and notes.

---

## ✨ PRIMARY FEATURES (What You'll Use Daily)

### 1. 📦 **Profile System** - Organize by SAP Solution

**8 curated profiles** pre-loaded with solution-specific resources:

| Profile | Best For | Includes |
|---------|----------|----------|
| **SuccessFactors** | HR/HCM workflows | 4 AI prompts, Quick Actions, demo environments |
| **S/4HANA** | Finance/ERP | Clean Core guides, Joule prompts, T-codes |
| **BTP** | Developers | BTP Cockpit links, CAP resources, AI Core setup |
| **AI & Joule** | AI enthusiasts | 20+ production Joule prompts, model configs |
| **Go-Live** | Implementations | Cutover checklists, monitoring T-codes |
| **Executive** | Leadership | Business value metrics, ROI calculators |
| **Global** | Everyone | Universal SAP resources, community links |
| **Starter** | New users | Template with examples |

<img src="screenshots/sap%20pro%20toolkil%20screenshotsSTARTER4.png" alt="Profile System" width="400">

**Switch profiles instantly** with the dropdown in the header. Each profile maintains its own environments, shortcuts, and notes.

---

### 2. ✨ **AI-Powered Features** - Test, Search, Analyze

<img src="screenshots/sap%20pro%20toolkil%20screenshotsAISEARCH9.png" alt="AI Search" width="400">

**AI Search** (`Cmd+I`): Search across all your environments, shortcuts, and notes with intelligent insights
- Understands context and relationships
- Provides relevance scoring
- Suggests related items

<img src="screenshots/sap%20pro%20toolkil%20screenshotsAIPROMPT5.png" alt="AI Prompts" width="400">

**Live AI Prompt Testing**: Test Joule copilot prompts with real AI models
- **Supported Models**: OpenAI GPT-4, Anthropic Claude, SAP AI Core
- Configure API keys in Settings → API Keys tab
- Save responses as notes for reference
- Download responses in TXT/MD/HTML formats

<img src="screenshots/sap%20pro%20toolkil%20screenshotsAIRESPONSENOTE10.png" alt="AI Response" width="400">

**AI Diagnostics**: Generate intelligent page analysis reports
- Automatic troubleshooting insights
- Configuration validation
- Performance recommendations

**AI Note Enhancement**: Refine and expand your notes with AI
- Format and organize content
- Add context and explanations
- Generate summaries

---

### 3. 🌐 **Environment Management** - Switch Safely

<img src="screenshots/sap%20pro%20toolkil%20screenshots2.png" alt="Environment Switching" width="400">

**One-click switching** between Production, Preview, Sales, and Sandbox instances:
- 🔴 **Production** - Red indicator with confirmation prompts
- 🟢 **Preview** - Green indicator for safe testing
- 🟠 **Sales/Demo** - Orange indicator
- 🟣 **Sandbox** - Purple indicator

**Features:**
- ⭐ **Pin favorites** to top of list (star icon)
- 📊 **Usage tracking** (last accessed, access count)
- 🔐 **Optional auto-login** with AES-256-GCM encryption
- 📝 **Environment notes** (test users, credentials, configs)
- 🏷️ **Custom naming** and organization
- 🌍 **40+ datacenters** automatically detected

---

### 4. ⚡ **Quick Actions** - One-Click Workflows

<img src="screenshots/sap%20pro%20toolkil%20screenshotsQUICKACTION6.png" alt="Quick Actions" width="400">

**Solution-specific workflows** that adapt to your current profile:
- Admin tools (Provisioning, RBP, User Management)
- Performance management (Goals, Reviews, Calibration)
- Recruiting workflows (Requisitions, Candidates)
- Time management (Time Off, Time Sheets)
- Compensation planning

<img src="screenshots/sap%20pro%20toolkil%20screenshotsCONFIGUREQA14.png" alt="Configure Quick Actions" width="400">

**Customize in Settings**: Edit names and paths for each profile

---

### 5. 🔍 **Diagnostics & System Info**

<img src="screenshots/sap%20pro%20toolkil%20screenshotsPAGEDIAGNOSTICS12.png" alt="Page Diagnostics" width="400">

**One-click diagnostic reports** for troubleshooting:
- Environment details (datacenter, region, platform)
- Company and user information
- Browser and extension version
- API endpoints and configuration
- **Copy to clipboard** for support tickets

<img src="screenshots/sap%20pro%20toolkil%20screenshotsSFPAGEDIAGNOSTICS13.png" alt="SF Diagnostics" width="400">

**Enhanced for SuccessFactors**: Extracts additional SF-specific data when available

---

## 🚀 SECONDARY FEATURES

### 📋 **Smart Shortcuts** - Organize External Links

<img src="screenshots/sap%20pro%20toolkil%20screenshotsADDSHORTCUT8.png" alt="Add Shortcut" width="400">

**External link management** with AI-powered summaries:
- Add any external URL (documentation, roadmaps, communities)
- ✨ **AI summary generation** from web page content
- 🏷️ **Tag-based organization** for easy searching
- ⭐ **Pin favorites** to top
- 📝 **Rich notes field** (up to 5000 characters)
- 🔍 **OSS Note search** (quick SAP Note lookup)

---

### 📝 **Scratch Notes** - Personal Knowledge Base

**Color-coded notes** for temporary information:
- 5 color options (Yellow, Blue, Green, Pink, Orange)
- **Two types**: Regular notes (📝) and AI prompts (✨)
- ⭐ Pin important notes to top
- 💾 Download in TXT/MD/HTML formats
- 📋 One-click copy to clipboard
- ✨ **AI enhancement** - refine and expand notes with AI

---

### 🔒 **Auto-Login** - Secure Credential Storage (PREMIUM NOT IMPLEMENTED)

**Optional encrypted auto-login** for faster environment switching:
- AES-256-GCM enterprise-grade encryption
- Support for SuccessFactors two-step login flow
- Company ID management
- Cookie clearing for fresh sessions
- SSO/OAuth detection with graceful fallback
- Password visibility toggle

**Recommended for**: Preview, Sales, and Sandbox environments only

---

## 🎨 TERTIARY FEATURES

### 🌍 **Internationalization**
**10 languages** with automatic detection:
- 🇬🇧 English • 🇨🇳 Chinese • 🇩🇪 German • 🇫🇷 French • 🇪🇸 Spanish
- 🇯🇵 Japanese • 🇰🇷 Korean • 🇧🇷 Portuguese • 🇮🇹 Italian • 🇳🇱 Dutch

Auto-detects from SAP environment (`?locale=`) or browser settings

---

### ⌨️ **Keyboard Shortcuts**

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Focus search bar |
| `Cmd/Ctrl + I` | AI search |
| `Cmd/Ctrl + J` | Add new shortcut |
| `Cmd/Ctrl + E` | Add new environment |
| `Cmd/Ctrl + Shift + N` | Add new note |
| `Cmd/Ctrl + Shift + 1/2` | Quick switch to environment 1/2 |
| `↑` `↓` Arrow keys | Navigate items |
| `Enter` | Open selected item |
| `Esc` | Close modal/clear search |

---

### 📦 **Import/Export**

<img src="screenshots/sap%20pro%20toolkil%20screenshotsEXPORT11.png" alt="Export Profile" width="400">

**Backup and share configurations**:
- Export current profile as JSON file
- Import profiles to create new configurations
- Share custom profiles with teams
- Migrate settings across devices

---

### 🎨 **Customization**

- **Icon picker** for visual organization (100+ SAP icons)
- **Color themes** for notes and UI elements
- **Drag-to-reorder** for environments, shortcuts, notes
- **Custom tags** for categorization
- **Per-item notes** for additional context

---

## 📸 Feature Screenshots

<details>
<summary>View All 15 Screenshots</summary>

1. **Overview** - Main interface and navigation
2. **Welcome Screen** - First-run experience showing 5 core capabilities
3. **API Configuration** - OpenAI, Anthropic, SAP AI Core setup
4. **Starter Profile** - Example profile with sample data
5. **AI Prompts** - Live AI prompt testing interface
6. **Quick Actions** - Solution-specific workflow shortcuts
7. **AI Response** - AI-generated content with save/download options
8. **Add Shortcut** - Smart shortcut creation with AI summary
9. **AI Search** - Intelligent search with insights
10. **AI Note** - AI-enhanced note storage
11. **Export** - Profile export functionality
12. **Page Diagnostics** - General diagnostic report
13. **SF Diagnostics** - SuccessFactors-specific diagnostics
14. **Configure QA** - Quick Actions editor
15. **Help Modal** - In-app documentation and keyboard shortcuts

</details>

---

## 🔧 Installation

### Option 1: Chrome Web Store (Coming Soon)
Extension pending Chrome Web Store review

### Option 2: Manual Installation
1. Download the latest release
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode" (top-right)
4. Click "Load unpacked"
5. Select the extension directory

---

## 🚀 Quick Start

### First Launch
1. Extension opens **Welcome Modal** explaining 5 core capabilities
2. Loads **Starter Profile** with example environments, shortcuts, and notes
3. Click "Got It!" to start using

### Daily Workflow
1. Open side panel: Click extension icon or `Cmd+K`
2. Search anything: Type in search bar
3. Switch environments: Click environment name
4. Use Quick Actions: Visible in main interface
5. Add items: Use `+` buttons or keyboard shortcuts

### Configure AI Features
1. Open Settings (`⚙️` in footer)
2. Go to "API Keys" tab
3. Enter OpenAI, Anthropic, or SAP AI Core credentials
4. Click "Test Connection" to verify
5. AI features now active throughout extension

---

## 🎯 Use Cases

**For SuccessFactors Consultants:**
- Switch between customer instances rapidly
- Store test user credentials securely
- Test Joule prompts before customer demos
- Quick access to Admin Center workflows

**For S/4HANA Finance Teams:**
- Organize Clean Core migration resources
- Store critical T-codes and transaction shortcuts
- Access finance-specific Joule prompts
- Track environment configurations

**For BTP Developers:**
- Switch between BTP subaccounts
- Access development tools quickly
- Store API endpoints and credentials
- Test AI Core models live

**For Presales/Demos:**
- Maintain separate Sales demo environments
- Quick Actions for common demo workflows
- Store demo scripts and talking points
- Switch contexts instantly during presentations

---

## 🔒 Privacy & Security

- **Local storage only** - All data stays on your device
- **No tracking** - Zero telemetry or analytics
- **Encrypted credentials** - AES-256-GCM
- **Minimal permissions** - Storage, tabs, cookies only
- **Open source** - Code available for audit(SEND REQUEST)

[Full Privacy Policy](PRIVACY-POLICY.md) | [AI Transparency](AI-TRANSPARENCY.md)

---

## 🛠️ Technical Details

**Architecture:**
- Manifest V3 Chrome extension
- Side panel mode (persistent, dockable left/right)
- Vanilla JavaScript (no frameworks)
- Local storage with sync backup
- CSP-compliant (no eval, no inline scripts)

**Supported SAP Systems:**
- SuccessFactors (all datacenters)
- S/4HANA Cloud
- SAP BTP
- IBP (Integrated Business Planning)

**Browser Compatibility:**
- Chrome 88+ (primary)
- Edge 88+ (Chromium-based)
- Brave (Chromium-based)

---

---

## 🤝 Community & Support

**Public Repository**: [github.com/sidbhat/sap-pro-toolkit](https://github.com/sidbhat/sap-pro-toolkit)
- 🐛 [Report Bugs](https://github.com/sidbhat/sap-pro-toolkit/issues/new?template=bug_report.yml)
- 💡 [Request Features](https://github.com/sidbhat/sap-pro-toolkit/issues/new?template=feature_request.yml)
- 💬 [Discussions](https://github.com/sidbhat/sap-pro-toolkit/discussions)
- 📦 [Download Profiles](https://github.com/sidbhat/sap-pro-toolkit/tree/main/resources)

**Learn More**: [PROFILES.md](PROFILES.md) • [COMMUNITY-PROFILE-GUIDE.md](COMMUNITY-PROFILE-GUIDE.md)

---

---

## ❓ FAQ

**Q: What's the difference between popup and side panel mode?**
A: The extension uses **side panel mode** (persistent panel on left/right) for continuous access. This replaced the old popup architecture in v1.4.

**Q: Do I need API keys to use the extension?**
A: No. AI features require API keys (OpenAI/Anthropic/SAP AI Core), but all other features work without configuration.

**Q: Is auto-login secure?**
A: Yes. Credentials are encrypted with AES-256-GCM before storage and only decrypted when needed. Recommended for non-production environments.

**Q: Can I share profiles with my team?**
A: Yes. Export your profile as JSON (Settings → Import/Export) and share the file. Team members can import it to create their own copy.

**Q: What happens to my data when I update the extension?**
A: All data persists across updates. Environments, shortcuts, notes, and settings are preserved.

**Q: Does the extension work offline?**
A: Partially. Saved environments/shortcuts work offline. AI features and diagnostics require internet connection.

---

## 🎯 Roadmap

**Completed** ✅:
- Profile system with 8 curated profiles
- AI-powered search and prompt testing
- Auto-login with encryption
- Universal pin/favorite system
- 10-language support
- Keyboard shortcuts

**In Progress** 🚧:
- Chrome Web Store submission
- Documentation website deployment
- Community profile contributions

**Planned** 📋:
- Bulk environment import/export
- Note categories and tags
- Enhanced datacenter analytics
- Biometric authentication support
- Environment usage dashboards
- Audit logging for compliance

---

## 🏗️ Built With

- **Framework**: Chrome Extension Manifest V3
- **UI**: Vanilla JavaScript, Modern CSS with variables
- **Storage**: Chrome Storage API (local + sync)
- **Security**: Web Crypto API (AES-256-GCM)
- **i18n**: Chrome i18n API with 10 language packs

---

## 📜 License

NOT AN OFFICIAL SAP tool.

---

**Made with ❤️ for SAP Professionals**

[GitHub](https://github.com/sidbhat/sap-pro-toolkit) • [Report Bug](https://github.com/sidbhat/sap-pro-toolkit/issues/new?template=bug_report.yml) • [Request Feature](https://github.com/sidbhat/sap-pro-toolkit/issues/new?template=feature_request.yml)
