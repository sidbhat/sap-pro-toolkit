# SuccessFactors Pro Toolkit

> A Chrome extension for SAP SuccessFactors professionals

![SuccessFactors Pro Toolkit](screenshots/hero-image.png)

## 🚀 Features

### 🌍 Internationalization (i18n)
**Multi-language support with automatic detection** - The extension automatically detects your language from the SuccessFactors environment or browser settings.

**Supported Languages (10)**:
- 🇬🇧 English (en) - Default
- 🇨🇳 Chinese Simplified (zh_CN)
- 🇩🇪 German (de)
- 🇫🇷 French (fr)
- 🇪🇸 Spanish (es)
- 🇯🇵 Japanese (ja)
- 🇰🇷 Korean (ko)
- 🇧🇷 Portuguese Brazil (pt_BR)
- 🇮🇹 Italian (it)
- 🇳🇱 Dutch (nl)

The extension automatically:
- Detects language from SF URL parameters (?locale=zh_CN)
- Falls back to browser language settings
- Displays country flags next to datacenter regions
- Translates all UI labels, tooltips, and placeholders

### 1️⃣ Switch Between Environments (with Auto-Login)
Save multiple SF instances (Production, Preview, Sales, Sandbox) and quickly switch between them without manually changing URLs. The extension intelligently preserves your current page path when switching environments.

**NEW: Optional Auto-Login** 🔐
- Securely store credentials per environment (AES-256-GCM encrypted)
- Automatic login when switching environments
- Support for SuccessFactors two-step login flow
- Company ID management for SF environments
- Clear cache & force fresh login option
- SSO/OAuth detection with graceful fallback

**Key Benefits:**
- ⚡ Instant environment switching with auto-login
- 🔒 Production confirmation prompts
- 🎯 Automatic datacenter detection
- 📍 Path preservation across switches
- 🔐 Enterprise-grade encryption (AES-256-GCM)
- 🎫 Multi-step login support (SF username → password flow)

### 2️⃣ Navigate with Shortcuts
Quick access to frequently-used SuccessFactors pages and documentation. Pre-loaded with essential shortcuts including Admin Center, RBP, Provisioning, and What's New resources.

**Default Shortcuts:**
- ⚙️ Admin Center
- 🔐 Role-Based Permissions
- 🛠️ Provisioning
- 📰 What's New Viewer
- 📋 What's New Q1 2025
- 📚 Release Notes
- 🗺️ Product Roadmap

**Plus:**
- Create custom shortcuts for any SF URL
- Edit and organize your shortcuts
- Quick navigation from any page

### 3️⃣ Copy System Diagnostics
Generate comprehensive diagnostic reports for troubleshooting and support tickets. Includes environment details, datacenter info, user IDs, browser specs, and technical configuration.

**Report Includes:**
- Environment type and datacenter location
- Company ID and region information
- User identification data
- API endpoints and technical specs
- Browser and platform information

### 4️⃣ Personal Notes with Color-Coded Organization
**Quick note-taking system with visual organization** - Create color-coded notes that persist across sessions, perfect for tracking tasks, ideas, or important information.

**Features:**
- 5 color options: Yellow, Blue, Green, Pink, Orange
- Quick add/edit/delete operations
- Persistent storage across sessions
- Clean post-it note style interface
- Hover-reveal actions for editing

## 🎨 Design

**Modern SAP Blue Theme:**
- Professional color scheme aligned with SAP SuccessFactors branding
- Clean, intuitive interface with smooth animations
- Card-based design with excellent visual hierarchy
- Responsive hover states and feedback

**User Experience:**
- 400px popup width for optimal content display
- Automatic environment detection
- Smart form pre-filling
- Toast notifications for user feedback

## 📦 Installation

### From Chrome Web Store
1. Visit the Chrome Web Store
2. Search for "SuccessFactors Pro Toolkit"
3. Click "Add to Chrome"

### Manual Installation (Development)
1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked"
5. Select the extension directory

## 🔧 Usage

### Quick Start
1. Navigate to any SAP SuccessFactors page
2. Click the SuccessFactors Pro Toolkit icon in your toolbar
3. View current environment information automatically

### Adding Environments
1. Click "Add Environment" button
2. Enter environment name, type, and hostname
3. Click "Save Environment"
4. Switch between environments with one click

### Using Shortcuts
1. Select a shortcut from the dropdown menu
2. Navigate instantly to common SF pages
3. Add custom shortcuts with the "+" button
4. Edit or delete shortcuts as needed

### Copying Diagnostics
1. Navigate to an SF instance
2. Click "Copy Diagnostics Report"
3. Paste into support tickets or documentation

## 🛠️ Technical Details

**Built With:**
- Manifest V3 (latest Chrome extension standard)
- Vanilla JavaScript (no frameworks)
- Modern CSS with CSS variables
- Chrome Extension APIs

**Permissions:**
- `storage` - Save environments, shortcuts, and notes
- `tabs` - Detect current page and switch environments
- `activeTab` - Access current tab information
- `sidePanel` - Display extension in Chrome side panel
- `cookies` - Clear session cookies for fresh logins (auto-login feature)

**Internationalization:**
- 10 languages supported with automatic detection
- Translations for all UI elements
- Language detection from SF environment or browser
- See I18N-GUIDE.md for complete documentation

**Supported Domains:**
- `*.hr.cloud.sap`
- `*.sapsf.com`
- `*.sapsf.cn`
- `*.sapcloud.cn`
- `*.successfactors.eu`
- `*.sapsf.eu`
- `*.successfactors.com`

## 📋 Version History

### v1.6.2 (2026-01-14) - Latest Release
- ✨ **AI UX Improvements**: Enhanced user experience during AI operations
  - Increased overlay opacity from 12% to 95% for better visibility
  - Changed to green background (`rgba(16, 185, 129, 0.95)`)
  - Updated message text to "Generating insights....."
  - Added blocking overlay to diagnostics AI button
  - Prevents accidental clicks during AI processing
- 🔒 **Security**: Removed hardcoded SAP AI Core credentials
  - Cleared all pre-populated credential values from HTML
  - Updated help text to instruct users to enter own credentials
  - All credential fields now start empty
  - Safe for public repository distribution
- 🐛 **UI Fixes**: Removed Close and Copy All buttons from diagnostics modal
  - Streamlined diagnostics modal footer
  - Improved user workflow

### v1.6.0
- 🔐 **NEW**: Auto-login feature with AES-256-GCM encryption
  - Optional credential storage per environment
  - Automatic login when switching environments
  - SuccessFactors two-step login support (username → continue → password)
  - Company ID management for SF environments
  - Cookie clearing for fresh logins
  - SSO/OAuth detection with graceful fallback
  - Password visibility toggle (eye icon)
  - Support for SF, S/4HANA, and BTP environments
- ⭐ **NEW**: Universal pin/favorite system
  - Pin environments, shortcuts, and notes to the top
  - Star icons with visual states (gray when unpinned, gold when pinned)
  - One-click pin/unpin functionality
  - Pinned items automatically sort to top of lists
- ⌨️ **NEW**: Enhanced keyboard shortcuts
  - `Cmd+E` to add new environment
  - `Cmd+Shift+1/2/3` for quick environment switching
  - All shortcuts now work reliably via document listeners
- 📊 **NEW**: Environment usage tracking
  - Last accessed timestamp for each environment
  - Access count tracking
  - Helps identify frequently-used environments
- 🔔 **NEW**: New content notifications
  - Toast notifications when new notes/shortcuts added
  - Asterisk indicators for profile updates
- 📚 **NEW**: Comprehensive security documentation (AUTO-LOGIN-SECURITY.md)
- 🧪 **NEW**: Detailed testing guide (AUTO-LOGIN-TESTING-GUIDE.md)
- 🐛 **FIXED**: Keyboard shortcuts not working (removed conflicting manifest.json commands)
- � **FIXED**: Pin buttons not visible (CSS overflow issues resolved)
- 🐛 **FIXED**: Footer overlapping content (increased padding)

### v1.3.0
- 🌍 **NEW**: Internationalization (i18n) support for 10 languages
- 📝 **NEW**: Personal Notes feature with color-coded organization
- 🎨 **NEW**: Simplified icon selector without descriptions
- 🚩 Enhanced datacenter display with country flags
- 🔄 Automatic language detection from SF environment
- 💾 Persistent notes storage across sessions

### v1.2.0
- 🎨 Complete UI redesign with SAP blue theme
- ❌ Removed dark mode feature for simplicity
- 📰 Added What's New documentation shortcuts
- 🎯 Center-aligned header with help button
- �📋 Enhanced diagnostics section with clear description
- ✨ Improved animations and hover effects
- 🖼️ New professional hero image

### v1.1.0
- Initial release with core features
- Environment switching functionality
- Custom shortcuts support
- System diagnostics reporting

## 🤝 Contributing

This is an internal SAP tool. For issues or feature requests, contact the development team.

## 📄 License

Internal SAP use only.

## ❓ Help & Support

Click the help button (❓) in the extension header to view detailed feature descriptions and usage tips.

**Common Questions:**

**Q: What happens to my data when I update the extension?**  
A: All your saved environments and custom shortcuts are preserved during updates.

**Q: Can I use this extension on non-SF pages?**  
A: The extension supports SuccessFactors, S/4HANA, BTP, and IBP environments. It remains dormant on non-SAP pages.

**Q: Is the auto-login feature secure?**  
A: Yes. Credentials are encrypted using AES-256-GCM (industry-standard encryption) before storage. See AUTO-LOGIN-SECURITY.md for detailed security architecture.

**Q: How do I enable auto-login?**  
A: Edit an environment, check "Enable auto-login", enter your username/password, and save. When switching to that environment, the extension will automatically log you in.

**Q: Does auto-login work with SSO/OAuth?**  
A: No. The extension detects SSO redirects and notifies you to log in manually. OAuth flows cannot be automated for security reasons.

**Q: Can auto-login bypass multi-factor authentication (MFA)?**  
A: No. If MFA is enabled, you'll still need to complete the MFA step manually after the extension fills username/password.

**Q: Should I use auto-login for Production environments?**  
A: We recommend using auto-login for Preview, Sales, or Sandbox environments only. For Production, consider manual login for added security.

**Q: How do I report bugs?**  
A: Copy your system diagnostics and contact the development team with details.

**Q: Can I customize the shortcuts?**  
A: Yes! You can add, edit, and delete shortcuts. Default shortcuts are included but can be removed.

**Q: What languages are supported?**  
A: The extension supports 10 languages: English, Chinese (Simplified), German, French, Spanish, Japanese, Korean, Portuguese (Brazil), Italian, and Dutch. Language is automatically detected from your SF environment or browser settings.

**Q: How do I use the Notes feature?**  
A: Click "Add Note" in the Notes section, enter a title and content, choose a color, and save. Notes are stored locally and persist across sessions. You can edit or delete notes by hovering over them.

## ⌨️ Keyboard Shortcuts

Boost your productivity with keyboard shortcuts:

| Shortcut | Action |
|----------|--------|
| `Cmd+K` (Mac) / `Ctrl+K` (Windows) | Focus search bar |
| `Cmd+E` (Mac) / `Ctrl+E` (Windows) | Add new environment |
| `Cmd+Shift+1/2/3` (Mac) / `Ctrl+Shift+1/2/3` (Windows) | Quick switch to environment 1/2/3 |
| `↑` `↓` Arrow keys | Navigate items |
| `Tab` | Navigate buttons |
| `Enter` | Open selected item |
| `Esc` | Close modal or clear search |

**Note**: Keyboard shortcuts work throughout the extension for faster navigation and actions.

## 🎯 Roadmap

Completed enhancements:
- ✅ Auto-login with encrypted credential storage
- ✅ Multi-step login support (SF two-step flow)
- ✅ Cookie clearing for fresh logins
- ✅ Environment/shortcut/note pinning with favorites
- ✅ Quick environment switching (Cmd+Shift+1/2/3)
- ✅ Keyboard shortcuts for all major actions

Future enhancements under consideration:
- Bulk environment import/export
- Note categories and tags
- Enhanced datacenter information display
- Biometric authentication for credential access
- Audit logging for auto-login usage
- Environment usage analytics

---

**Made with ❤️ for SAP SuccessFactors Professionals**
