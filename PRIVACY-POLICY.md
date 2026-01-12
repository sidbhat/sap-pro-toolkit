# Privacy Policy for SAP Pro Toolkit

**Last Updated:** January 11, 2026

## Overview

SAP Pro Toolkit ("the Extension") is committed to protecting your privacy. This privacy policy explains how we handle data in our Chrome extension.

## Data Collection

**We do not collect any personal data.**

SAP Pro Toolkit does not:
- Collect personal information
- Track user behavior
- Send data to external servers
- Use analytics or tracking services
- Store data in the cloud
- Share data with third parties

## Local Storage Only

All data is stored **locally** in your browser using Chrome's secure storage API:

**What we store locally:**
- Saved environments (Production, Preview, Sales, Sandbox URLs)
- Custom shortcuts (titles, URLs, icons, tags)
- Scratch notes (content, color, tags, timestamps)
- User preferences (theme, profile selection, confirmation settings)
- Profile configurations (active profile, custom profiles)

**Important:**
- This data NEVER leaves your device
- No network transmission occurs
- You can export/import your data as JSON files
- You can delete individual items or clear all data
- Uninstalling the extension removes all stored data

## Permissions Explained

The extension requires specific permissions to function:

### storage
**Purpose:** Save your environments, shortcuts, notes, and preferences locally in your browser  
**Data:** URLs, custom content you create, user settings  
**Location:** Local browser storage only  

### tabs
**Purpose:** Detect which SAP page you're currently viewing  
**Scope:** Only reads tab URL and title  
**Use:** Environment switching, shortcut navigation, diagnostics  

### activeTab
**Purpose:** Read current page URL for environment detection  
**Scope:** Only active when you open the extension  
**Use:** Generate diagnostics, detect current environment  

### sidePanel
**Purpose:** Display extension interface in Chrome side panel  
**Scope:** Chrome UI only  
**Use:** Show toolkit interface at 420px width  

### host_permissions
**Domains:** SAP domains only (*.successfactors.com, *.sapsf.com, *.hr.cloud.sap, *.s4hana.cloud.sap, *.hana.ondemand.com)  
**Purpose:** Enable environment switching and context-aware features  
**Security:** Extension only works on authorized SAP domains  

## Third-Party Services

**We do not use any third-party services:**
- No analytics (Google Analytics, etc.)
- No tracking pixels
- No advertising networks
- No data brokers
- No cloud storage services
- No external APIs
- No telemetry or crash reporting

## SAP Platform Integration

The extension interacts with SAP systems:
- Reads current page URL (to detect environment)
- Navigates to new URLs (when you switch environments or use shortcuts)
- Does NOT intercept network requests
- Does NOT access HR records, financial data, or sensitive information
- Does NOT modify SAP system data
- Only provides navigation and note-taking tools

## Data Security

**Local Storage Security:**
- Uses Chrome's secure storage API
- Protected by Chrome's sandboxing
- Encrypted by Chrome's built-in security
- Only accessible by this extension

**No Network Transmission:**
- Zero data leaves your device
- No external servers contacted
- No API calls to third parties
- All operations are local

## User Control

**You have complete control:**
- ✅ Export all data as JSON anytime
- ✅ Import data from JSON files
- ✅ Delete individual environments, shortcuts, or notes
- ✅ Clear all data via browser extension settings
- ✅ Uninstall extension to remove all data
- ✅ No account creation required
- ✅ No registration or login

## Children's Privacy

This extension is intended for SAP professionals (consultants, administrators, developers) in enterprise environments. We do not knowingly collect information from children under 13.

## Changes to This Policy

If we make changes to this privacy policy:
- We will update the "Last Updated" date above
- Significant changes will be announced in extension updates
- Continued use after changes indicates acceptance

## Compliance

This extension complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)
- No data collection = no compliance concerns

## Contact & Support

**Questions about privacy?**
- Contact via Chrome Web Store support page

**Report Security Issues:**
If you discover a security vulnerability, please report it responsibly via Chrome Web Store support.

## Your Rights

Since we don't collect any data:
- No data to request
- No data to delete (except local storage you control)
- No data to export (except your own data via Export feature)
- No data to correct

You have complete control via browser extension settings and the extension's data management features.

## SAP Domains Accessed

The extension only works on these SAP domains:
- *.successfactors.com (SAP SuccessFactors)
- *.sapsf.com (SAP SuccessFactors)
- *.hr.cloud.sap (SAP SuccessFactors)
- *.performancemanager.successfactors.com (Performance Management)
- *.s4hana.cloud.sap (SAP S/4HANA Cloud)
- *.hana.ondemand.com (SAP Business Technology Platform)

**Why these domains?**
- To detect which SAP environment you're on
- To enable environment switching (e.g., Production → Preview)
- To provide context-aware shortcuts and features

## Production Environment Safety

The extension includes special protections for production environments:
- Confirmation prompts before production actions
- Visual indicators (🔴 red status) for production
- Customizable confirmation settings
- Clear warnings to prevent accidents

## Legal Disclaimer

This extension is an **unofficial productivity tool** created to enhance SAP professional workflows. It is not affiliated with, endorsed by, or officially connected to SAP SE or any of its subsidiaries.

SAP, SuccessFactors, S/4HANA, and BTP are trademarks of SAP SE.

## Summary

**In Plain English:**
- We don't collect anything
- Everything stays on your computer
- You can export/delete everything anytime
- No tracking, no analytics, no servers
- Just local environment management and note-taking

That's it. Simple and private.

---

*This privacy policy is effective as of January 11, 2026 and applies to version 1.5.0 and later.*
