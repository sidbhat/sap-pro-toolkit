# Changelog

All notable changes to SAP Pro Toolkit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [1.6.3] - 2026-01-18
### Fixed
- 🔧 **Icon Rendering System**: Corrected icon ID format mismatch (CRITICAL)
  - Fixed `DEFAULT_ICONS` in panel/state.js to use library IDs instead of URIs
    - `environment: 'production'` (was `'sap-icon://customer'`)
    - `shortcut: 'link'` (was `'sap-icon://document-text'`)
    - `note: 'note'` (was `'sap-icon://write-new-document'`)
    - `profile: 'people'` (was `'sap-icon://hello-world'`)
  - Fixed starter profile icons to use correct library IDs
    - Profile icon: `'ai'` (was `'sap-icon://hello-world'`)
    - Shortcuts: `'note'`, `'target'` (were `'sap-icon://comment'`, `'sap-icon://map'`)
    - Environment: `'preview'` (was `'sap-icon://customer'`)
    - Notes: `'note'` (were `'sap-icon://education'`, `'sap-icon://document-text'`)
  - Added defensive URI stripping in `renderSAPIcon()` function
    - Now strips `'sap-icon://'` prefix if present (handles legacy data)
    - Added console warning when icon ID not found in library
    - Ensures icons render as SVG instead of emoji fallbacks

### Technical
- Icon library uses simple IDs: `'note'`, `'link'`, `'folder'`, `'settings'`, `'people'`, `'ai'`, `'target'`, `'analytics'`, `'external'`, `'security'`
- Environment icons: `'production'`, `'preview'`, `'sales'`, `'sandbox'`
- Migration logic now applies correct library IDs to existing data
- All new entities will use proper library IDs going forward

---

## [1.6.2] - 2026-01-14
### Changed
- ✨ **AI Blocking Overlay**: Enhanced UX during AI operations
  - Increased overlay opacity from 12% to 95% for better visibility
  - Changed background color to green (`rgba(16, 185, 129, 0.95)`)
  - Updated all text to white for optimal contrast
  - Changed message text to "Generating insights....."
  - Added subtitle: "Please wait, do not close this window"
  - Applied blocking overlay to diagnostics AI button
  - Prevents accidental clicks during AI processing

### Security
- 🔒 **Removed Hardcoded SAP AI Core Credentials**: Critical security improvement
  - Cleared pre-populated Client ID value from HTML
  - Cleared pre-populated Client Secret value from HTML
  - Cleared pre-populated Base URL and Auth URL values
  - Updated help text to instruct users to enter their own credentials
  - All SAP AI Core configuration fields now start empty
  - Safe for public repository distribution
- ✅ Passed comprehensive 18-check security audit
  - No credentials, passwords, or API keys in source code
  - Customer data (SFSALES IDs) safely in .gitignored file
  - No person IDs or internal emails exposed
  - Content moderation passed (no negative SAP messaging)
  - XSS/injection risks acceptable (innerHTML uses validated data only)

### Documentation
- Created AI-BLOCKING-OVERLAY-IMPLEMENTATION.md
- Created AI-BUTTON-LOADING-IMPLEMENTATION.md
- Updated security audit workflow

---

## [1.6.1] - 2026-01-12
### Fixed
- 🐛 **Profile Loading Architecture**: Fixed "All Profiles" and Settings modal behavior
  - Individual profiles now load only their own data (no automatic Global merging)
  - "All Profiles" mode aggregates data from all profiles for read-only viewing
  - Settings modal Quick Actions editor shows ALL profiles' data regardless of current selection
  - Added missing `loadActiveProfile()` function preventing initialization errors
  - Fixed `ReferenceError: loadActiveProfile is not defined`
- 🐛 **Go-Live Profile Shortcuts**: Removed incorrect S/4HANA transaction codes
  - Deleted 10 misplaced shortcuts (SM21, SM37, ST04, ST22, ST03N, SXI_MONITOR, STMS, SU01, SM35, SAP Support Launchpad)
  - Changed "shortcuts" array to "globalShortcuts" (empty array)
  - Profile now focuses on go-live specific guides and checklists

### Changed
- **Profile Data Model**: Complete architectural change for Settings independence
  - `loadProfileData()`: Loads only specific profile, no Global merging
  - `loadShortcuts()` and `loadEnvironments()`: Aggregate all profiles only in "All Profiles" mode
  - `renderAllProfilesQuickActions()`: New function for Settings showing all profiles
  - `saveAllQuickActions()`: Saves changes across multiple profiles
  - Settings completely decoupled from profile selection (as per user requirement)

### Security
- ✅ Passed comprehensive 18-check security audit
  - No credentials, passwords, or API keys found
  - Customer data (SFSALES IDs) safely in .gitignored file
  - No person IDs or internal emails exposed
  - Content moderation passed (no negative SAP messaging)
  - XSS/injection risks acceptable (innerHTML uses internal storage only)

### Documentation
- Updated STORAGE-GUIDE.md explaining profile architecture
- Cleaned emoji prefixes from note titles in all profile JSON files

### Removed
- ❌ **"All Profiles" Read-Only Mode**: Simplified profile system
  - Removed profile-all aggregation mode from profile switcher
  - Removed read-only banner and view-only note functionality
  - Removed 22 profile-all conditional checks from JavaScript
  - Removed `viewNoteReadOnly()` and `updateReadOnlyBanner()` functions
  - Simplified Quick Actions to aggregate from available profiles without special mode
  - Updated documentation files (CLEANUP-PRIORITIES.md, CLEANUP-TODO.md, CLEANUP-REPORT.md, VALIDATION-INTEGRATION-STEPS.md)
  - Users now select specific profiles; Quick Actions remain universal across all profiles

---

## [1.6.0] - 2026-01-12
### Added
- ⭐ **Universal Pin/Favorite System**: Pin any item to top of lists
  - Works across environments, shortcuts, and notes
  - Star icons with visual states (gray when unpinned, gold ⭐ when pinned)
  - One-click pin/unpin functionality with animation
  - Pinned items automatically sort to top
  - Unified `togglePin(id, type)` function handles all three types
  - Toast notifications confirm pin/unpin actions
- ⌨️ **Enhanced Keyboard Shortcuts**: More productive hotkeys
  - `Cmd/Ctrl+E`: Add new environment
  - `Cmd/Ctrl+Shift+1/2/3`: Quick switch to environments 1/2/3
  - All shortcuts now work reliably via document listeners
- 📊 **Environment Usage Tracking**: Smart analytics for environments
  - `lastAccessed` timestamp for each environment
  - `accessCount` tracking (increments on switch)
  - Helps identify frequently-used environments
- 🔔 **New Content Notifications**: Visual indicators for updates
  - Toast notifications when new notes/shortcuts added
  - Asterisk (*) indicators for profile updates
  - Shows when profile content has been refreshed

### Changed
- **Keyboard Shortcut Architecture**: Removed Chrome commands API in favor of document listeners
  - Deleted entire `commands` section from manifest.json
  - Removed `chrome.commands.onCommand` listener from background.js
  - Removed `handleKeyboardCommand()` and message relay from side-panel.js
  - Now using ONLY toolkit-core.js document event listeners (more reliable)
- **CSS Overflow Handling**: Fixed pin button visibility
  - Parent containers use `overflow: visible` instead of `hidden`
  - Child text elements handle truncation with `overflow: hidden; text-overflow: ellipsis`
  - Applied to `.env-name`, `.shortcut-name`, `.note-title`

### Fixed
- 🐛 **CRITICAL: Keyboard Shortcuts Not Working**: Resolved Chrome commands API conflict
  - Manifest.json commands were conflicting with toolkit-core.js document listeners
  - Removed manifest commands entirely - all shortcuts now work reliably
- 🐛 **Pin Buttons Not Visible**: CSS overflow clipping star icons
  - Fixed parent container overflow settings
  - Pin buttons now visible and clickable
- 🐛 **Chrome Manifest Error**: Exceeded 4 shortcut limit
  - Removed all Chrome command shortcuts from manifest.json
  - Now handle shortcuts via JavaScript only
- 🐛 **Removed Note/Shortcut Keyboard Shortcuts**: Cleaned up unused hotkeys
  - Removed `Cmd/Ctrl+D` for adding shortcuts
  - Removed `Cmd/Ctrl+N` for adding notes
  - Updated all documentation to reflect current shortcuts only

### Security
- ✅ Passed 18-check security audit before commit
- ✅ No credential leaks, customer data, or content violations
- ✅ All innerHTML usage validated as safe (template literals only)
- ✅ Profile-successfactors.json remains in .gitignore (SAP-internal)

### Documentation
- Updated README.md with new features and keyboard shortcuts table
- Updated panel/side-panel.html help modal with pin feature documentation
- All features tested and verified working

### Technical
- Removed 56 lines of obsolete keyboard command code
- Added unified `togglePin(id, type)` function replacing environment-only version
- Added pin button HTML/CSS to shortcuts and notes sections
- Sorting logic: `pinned` items first (via array sort comparing boolean flags)
- Star SVG with dynamic fill/opacity based on pin state

---

## [1.5.0] - 2026-01-11
### Added
- 📅 **Profile Update Date Display**: Shows last content update date in footer
  - Reads from profile JSON lastUpdated field
  - Displays as "Profile: Mon DD" with hover tooltip
  - Helps users know when profile content was refreshed
- 🚀 **Go-Live & Cutover Profile**: New specialized profile for S/4HANA implementations
  - 10 critical monitoring T-Codes (SM21, ST22, SM37, ST04, ST03N, etc.)
  - 7 comprehensive guides covering go-live checklists, data migration, incident response
  - Performance baseline KPIs and interface monitoring playbooks
  - Essential SAP Notes for S/4HANA go-live success
  - 2 hot community posts with real-world lessons learned

### Changed
- Profile discovery: Added profile-golive to availableProfiles array

---

## [1.4.0] - 2026-01-11
### Added
- 🛠️ **Build Automation System**: Professional build workflow from gamified-sf best practices
  - `package.json` with npm scripts for building and versioning
  - `scripts/build.js` - Automated production build tool
  - `scripts/sync-version.js` - Version synchronization across package.json and manifest.json
  - `npm run build` - Create dist/ folder with all extension files
  - `npm run build:zip` - Create production ZIP file for Chrome Web Store
  - `npm run clean` - Remove build artifacts
  - `npm run version:bump:patch|minor|major` - Bump version and sync files
  - Auto-generated INSTALL.md in dist/ with setup instructions
  - Colored terminal output with build summary and file counts
- 🚀 **S/4HANA Go-Live & Cutover Profile**: Comprehensive go-live support for ERP implementations
  - 10 critical T-Code shortcuts (SM21, SM37, ST04, ST22, ST03N, SXI_MONITOR, STMS, SU01, SM35)
  - 9 detailed guides: Go-live checklist, critical T-Codes, data migration validation, incident response, interface monitoring, performance baseline, SAP Notes
  - 🔥 2 Hot Community Posts notes with top SAP Community articles on go-live strategy and technical monitoring
  - Cutover runbook template (Pre-48h, Cutover Weekend, Go-Live Day, Hypercare Week 1)
  - BASIS troubleshooting guides (P1-P4 severity with T-Code resolution steps)
  - Real-world lessons learned and best practices
- 🔒 **Enhanced .gitignore**: Added `.cache/` pattern for build caches

### Changed
- **Build Process**: Manual file copying replaced with automated build scripts
- **Chrome Web Store Submission**: Now single command (`npm run build:zip`)

### Documentation
- Build system integrated with security audit workflow
- Version management now automated with sync scripts
- Global chrome-store-build.md rule created for automated builds across all projects

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
  - `Cmd/Ctrl+E`: Add environment
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
