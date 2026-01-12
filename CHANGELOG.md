# Changelog

All notable changes to SF Pro Toolkit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- (Features currently in development will be listed here)

### Changed
- (Modifications to existing features will be listed here)

### Removed
- (Deprecated/removed features will be listed here)

---

## [1.3.0] - 2026-01-11
### Added
- 🌍 **Internationalization (i18n)**: Full support for 10 languages with automatic detection
  - English (en), Chinese Simplified (zh_CN), German (de), French (fr), Spanish (es)
  - Japanese (ja), Korean (ko), Portuguese Brazil (pt_BR), Italian (it), Dutch (nl)
- 📝 **Personal Notes Feature**: Color-coded note-taking system with 5 colors
  - Yellow, Blue, Green, Pink, Orange color options
  - Persistent storage across sessions
  - Quick add/edit/delete with hover actions
  - Post-it note style interface
- ⌨️ **Keyboard Shortcuts**: Productivity shortcuts throughout extension
  - `Cmd/Ctrl+K`: Focus search bar
  - `Cmd/Ctrl+Shift+N`: Add new shortcut
  - `Cmd/Ctrl+M`: Add new note
  - Arrow keys for navigation, Enter to open, Esc to close
- 🎨 **Simplified Icon Selector**: Streamlined icon selection without descriptions
- 🚩 **Country Flags**: Visual datacenter location indicators with flag emojis
- 🔄 **Auto Language Detection**: Detects language from SF environment or browser settings

### Changed
- **Modal Sizing**: Increased note modal to 480px width with 320px textarea height
- **Tag Styling**: Softened tag badges with removed borders and increased padding/border-radius
- **Delete Buttons**: Made less prominent with 0.6 opacity, red only on hover
- **CMD+K Badge**: Brightened for better visibility in dark mode
- **Help Documentation**: Updated with new features and keyboard shortcuts

### Fixed
- **Keyboard Shortcut Conflict**: Changed new shortcut hotkey from `Cmd+N` to `Cmd+Shift+N`
- **Download Button Visibility**: Fixed timing issue in note edit mode

### Security
- Removed sensitive scratch notes from profile-successfactors.json
- Added profile-successfactors.json to .gitignore (SAP-only local file)
- Sanitized credentials, customer names, person IDs, and internal emails
- Created comprehensive security audit workflow

### Documentation
- Added keyboard shortcuts table to README.md
- Created .clinerules/security-audit.md for pre-commit security scanning
- Created .clinerules/profile-content-updater.md for quarterly content refresh
- Enhanced .clinerules/cleanup-after-feature.md with security-first workflow
- Extracted 5 hardcoded strings to i18n messages
- Added 6 new i18n keys with placeholder support

---

## [1.2.0] - 2025-12-XX
### Added
- 🎨 **Complete UI Redesign**: Modern SAP blue theme with professional branding
- 📰 **What's New Shortcuts**: Pre-loaded documentation shortcuts
  - What's New Viewer
  - What's New Q1 2025
  - Release Notes
  - Product Roadmap
- 📋 **Enhanced Diagnostics**: Clear description and improved formatting
- 🎯 **Center-Aligned Header**: Professional layout with help button
- ✨ **Improved Animations**: Smooth hover effects and transitions
- 🖼️ **Professional Hero Image**: New branding visual for README

### Changed
- Card-based design with excellent visual hierarchy
- Responsive hover states and feedback
- 400px popup width for optimal content display
- Automatic environment detection
- Smart form pre-filling
- Toast notifications for user feedback

### Removed
- ❌ **Dark Mode**: Removed for UI simplicity and consistency

---

## [1.1.0] - 2025-11-XX
### Added
- 🌍 **Environment Switching**: Save and switch between multiple SF instances
  - Production, Preview, Sales, Sandbox environment types
  - Intelligent path preservation when switching
  - Production confirmation prompts
  - Automatic datacenter detection
- 🔗 **Custom Shortcuts**: Navigate to frequently-used SF pages
  - Pre-loaded essential shortcuts (Admin Center, RBP, Provisioning)
  - Create, edit, and delete custom shortcuts
  - Quick navigation from any page
- 📋 **System Diagnostics**: Generate comprehensive diagnostic reports
  - Environment details and datacenter info
  - Company ID and region information
  - User identification data
  - API endpoints and technical specs
  - Browser and platform information
- 🎨 **Professional Design**: Clean, intuitive interface
  - SAP SuccessFactors branding alignment
  - Smooth animations and hover states
  - Modern card-based layout

### Technical
- Built with Manifest V3 (latest Chrome extension standard)
- Vanilla JavaScript (no frameworks)
- Modern CSS with CSS variables
- Chrome Extension APIs (storage, tabs, activeTab)
- Support for multiple SF domains (*.hr.cloud.sap, *.sapsf.com, etc.)

---

## [1.0.0] - 2025-10-XX
### Added
- Initial project setup
- Basic extension structure
- Core functionality framework

---

## Legend
- 🌍 = Internationalization
- 📝 = Notes/Documentation
- ⌨️ = Keyboard Shortcuts
- 🎨 = UI/Design
- 🚩 = Visual Indicators
- 🔄 = Automation
- 🔒 = Security
- 📋 = Diagnostics
- 🔗 = Navigation
- ✨ = Enhancements
- ❌ = Removals
- 🛠️ = Technical Changes
