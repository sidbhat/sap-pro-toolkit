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

### 1️⃣ Switch Between Environments
Save multiple SF instances (Production, Preview, Sales, Sandbox) and quickly switch between them without manually changing URLs. The extension intelligently preserves your current page path when switching environments.

**Key Benefits:**
- ⚡ Instant environment switching
- 🔒 Production confirmation prompts
- 🎯 Automatic datacenter detection
- 📍 Path preservation across switches

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

### v1.3.0 (Latest)
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
- 📋 Enhanced diagnostics section with clear description
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
A: The extension only activates on SAP SuccessFactors pages. On other pages, it remains dormant.

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
| `Cmd+Shift+N` (Mac) / `Ctrl+Shift+N` (Windows) | Add new shortcut |
| `Cmd+M` (Mac) / `Ctrl+M` (Windows) | Add new note |
| `↑` `↓` Arrow keys | Navigate items |
| `Tab` | Navigate buttons |
| `Enter` | Open selected item |
| `Esc` | Close modal or clear search |

**Note**: Keyboard shortcuts work throughout the extension for faster navigation and actions.

## 🎯 Roadmap

Future enhancements under consideration:
- Environment favorites/pinning
- Bulk environment import/export
- Note categories and tags
- Enhanced datacenter information display

---

**Made with ❤️ for SAP SuccessFactors Professionals**
