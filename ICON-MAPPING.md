# SAP Fiori Icon System - Complete Mapping

## Overview
This document maps the current emoji-based icons to SAP Fiori icons with semantic IDs for improved UX and scalability.

## Environment Icons (4 Types)

| Current | Emoji | New SAP Icon | Icon ID | Color Accent |
|---------|-------|--------------|---------|--------------|
| Production | 🔴 | sap-icon://flag | production | #DD0000 (red) |
| Preview | 🟢 | sap-icon://show | preview | #0070F2 (blue) |
| Sales/Demo | 🟠 | sap-icon://presentation | sales | #F58B00 (orange) |
| Sandbox | 🟣 | sap-icon://lab | sandbox | #9C27B0 (purple) |

## Shortcut Icons (25 Total)

### Original 10 Icons

| Index | Old Emoji | New SAP Icon | Icon ID | Label | Category |
|-------|-----------|--------------|---------|-------|----------|
| 0 | 🗺️ | sap-icon://map | map | Map/Roadmap | Navigation |
| 1 | ⚙️ | sap-icon://action-settings | settings | Settings | Admin |
| 2 | 🔐 | sap-icon://locked | security | Security | Admin |
| 3 | 👥 | sap-icon://group | people | People/Teams | People |
| 4 | 📊 | sap-icon://bar-chart | analytics | Analytics | Business |
| 5 | 🛠️ | sap-icon://wrench | tools | Tools | Admin |
| 6 | 📝 | sap-icon://document | document | Document | Documentation |
| 7 | 🎯 | sap-icon://target-group | target | Target/Goal | Business |
| 8 | 📄 | sap-icon://document-text | page | Page | Documentation |
| 9 | 🔗 | sap-icon://chain-link | link | Link | Navigation |

### New 15 Icons

| Index | Emoji | SAP Icon | Icon ID | Label | Category |
|-------|-------|----------|---------|-------|----------|
| 10 | 💰 | sap-icon://money-bills | pricing | Pricing/Cost | Business |
| 11 | 👁️ | sap-icon://show | preview-eye | Preview | Navigation |
| 12 | 🌍 | sap-icon://world | datacenter | Datacenter/Region | Infrastructure |
| 13 | 🔑 | sap-icon://key | credentials | Credentials | Admin |
| 14 | 🎪 | sap-icon://video | demo | Demo/Walkthrough | Learning |
| 15 | 🤖 | sap-icon://lightbulb | ai | AI/Joule | Technology |
| 16 | 🔄 | sap-icon://synchronize | sync | Sync/Restore | Infrastructure |
| 17 | 📚 | sap-icon://course-book | learning | Learning | Learning |
| 18 | 🏢 | sap-icon://building | company | Company/Customer | Business |
| 19 | 📦 | sap-icon://product | package | Package/Module | Technology |
| 20 | 🔔 | sap-icon://alert | alert | Alert/Notification | System |
| 21 | ✅ | sap-icon://accept | success | Success/Verified | System |
| 22 | ⚠️ | sap-icon://warning | warning | Warning | System |
| 23 | 🌐 | sap-icon://internet-browser | external | External Link | Navigation |
| 24 | 🎓 | sap-icon://study-leave | training | Training | Learning |

## Note Icons (20 Total)

### Original 8 Icons

| Index | Old Emoji | New SAP Icon | Icon ID | Label | Category |
|-------|-----------|--------------|---------|-------|----------|
| 0 | 📝 | sap-icon://notes | note | Note | General |
| 1 | 🔑 | sap-icon://key | key | Key/Access | Admin |
| 2 | 🆔 | sap-icon://person-placeholder | id | ID/User | People |
| 3 | 🔗 | sap-icon://chain-link | link | Link/URL | General |
| 4 | ⚙️ | sap-icon://action-settings | settings | Settings/Config | Admin |
| 5 | 📋 | sap-icon://paste | clipboard | Clipboard | General |
| 6 | 💡 | sap-icon://lightbulb | idea | Idea/Insight | General |
| 7 | 📌 | sap-icon://pushpin-on | pin | Pinned/Important | General |

### New 12 Icons

| Index | Emoji | SAP Icon | Icon ID | Label | Category |
|-------|-------|----------|---------|-------|----------|
| 8 | 💲 | sap-icon://paid-leave | pricing-note | Pricing Info | Business |
| 9 | 👤 | sap-icon://employee | user | User/Profile | People |
| 10 | 📸 | sap-icon://camera | screenshot | Screenshot | General |
| 11 | 🧪 | sap-icon://lab | testing | Testing/QA | Technology |
| 12 | 🏷️ | sap-icon://tags | tag | Tag/Label | General |
| 13 | 📞 | sap-icon://phone | contact | Contact | People |
| 14 | 📧 | sap-icon://email | email | Email | People |
| 15 | 🗓️ | sap-icon://calendar | date | Date/Schedule | General |
| 16 | ⏰ | sap-icon://timesheet | reminder | Reminder | General |
| 17 | 📊 | sap-icon://table-view | data | Data/Table | Technology |
| 18 | 🔍 | sap-icon://search | search | Search/Query | General |
| 19 | ✏️ | sap-icon://edit | edit | Edit/Modify | General |

## Icon Categories

### For Dropdowns (Grouped)

**Shortcuts:**
- 📚 Documentation & Learning: map, document, page, learning, training, demo
- ⚙️ Administration: settings, security, credentials, tools
- 💰 Business: pricing, analytics, target, company
- 🌐 Navigation: link, external, preview-eye, datacenter
- 🔔 System: alert, success, warning, sync, ai, package

**Notes:**
- 📝 General: note, clipboard, idea, pin, screenshot, tag, search, edit
- 👥 People: id, user, contact, email
- ⚙️ Admin & Tech: key, settings, testing, data
- 📅 Time & Events: date, reminder

## Auto-Suggestion Keywords

```javascript
{
  // Pricing/Financial
  'pricing': ['price', 'cost', 'sku', 'billing', 'payment', 'invoice', 'budget', 'fee'],
  
  // Preview/Testing
  'preview-eye': ['preview', 'view', 'display', 'show'],
  'testing': ['test', 'qa', 'quality', 'validation'],
  
  // Credentials/Access
  'credentials': ['password', 'credential', 'login', 'auth', 'access', 'token'],
  'key': ['key', 'secret', 'api key', 'certificate'],
  
  // Datacenter/Infrastructure
  'datacenter': ['datacenter', 'dc', 'dc10', 'dc68', 'region', 'landscape', 'us10', 'eu20'],
  
  // Demo/Training
  'demo': ['demo', 'walkme', 'presentation', 'showcase'],
  'training': ['training', 'course', 'certification', 'learning path'],
  'learning': ['guide', 'tutorial', 'how-to', 'documentation'],
  
  // AI/Joule
  'ai': ['joule', 'ai', 'copilot', 'chatbot', 'agent', 'assistant', 'ml', 'artificial intelligence'],
  
  // Admin/Configuration
  'settings': ['admin', 'config', 'configuration', 'provisioning', 'setup'],
  'security': ['security', 'role', 'permission', 'authorization', 'rbac'],
  
  // Analytics/Reporting
  'analytics': ['report', 'analytics', 'dashboard', 'metrics', 'kpi', 'insight'],
  'data': ['data', 'dataset', 'table', 'export', 'import'],
  
  // People/HR
  'people': ['employee', 'hr', 'people', 'team', 'workforce'],
  'user': ['user', 'profile', 'account'],
  'id': ['id', 'userid', 'identifier', 'username'],
  
  // Integration
  'external': ['api', 'integration', 'odata', 'endpoint', 'webhook', 'external'],
  'link': ['url', 'link', 'hyperlink', 'reference'],
  'sync': ['sync', 'synchronize', 'restore', 'backup', 'snapshot'],
  
  // Company/Customer
  'company': ['company', 'customer', 'client', 'tenant', 'organization'],
  
  // Documentation
  'document': ['help', 'doc', 'documentation', 'reference', 'manual'],
  'page': ['page', 'article', 'content'],
  
  // System
  'alert': ['alert', 'notification', 'reminder', 'alarm'],
  'success': ['success', 'complete', 'verified', 'approved', 'confirmed'],
  'warning': ['warning', 'error', 'issue', 'problem', 'caution'],
  
  // Contact
  'contact': ['contact', 'phone', 'call', 'support'],
  'email': ['email', 'mail', 'message', 'inbox'],
  
  // General
  'note': ['note', 'memo', 'scratch', 'temporary'],
  'clipboard': ['clipboard', 'paste', 'copy'],
  'idea': ['idea', 'insight', 'tip', 'suggestion'],
  'pin': ['pin', 'important', 'favorite', 'bookmark'],
  'screenshot': ['screenshot', 'image', 'picture', 'visual'],
  'tag': ['tag', 'label', 'category', 'classification'],
  'date': ['date', 'calendar', 'schedule', 'timeline'],
  'search': ['search', 'find', 'query', 'lookup'],
  'edit': ['edit', 'modify', 'update', 'change']
}
```

## Backward Compatibility

All numeric indices (0-9 for old shortcuts/notes) are preserved and mapped to new semantic IDs automatically.

**Migration Strategy:**
1. On data load, check if icon is numeric
2. If numeric, map to semantic ID using index
3. Save with semantic ID on next edit
4. Support both formats indefinitely

## Color System

**Environment Type Colors:**
```css
--env-production: #DD0000;
--env-preview: #0070F2;
--env-sales: #F58B00;
--env-sandbox: #9C27B0;

/* Dark mode variants */
--env-production-dark: #FF5555;
--env-preview-dark: #5AB3FF;
--env-sales-dark: #FFB84D;
--env-sandbox-dark: #CE93D8;
```

## Implementation Notes

- All SAP icons use `sap-icon://` protocol
- Icons are rendered as inline SVG with proper ARIA labels
- Icon size: 16px default, 20px for environment indicators
- Support for light/dark themes with CSS variables
- Accessible with proper contrast ratios (WCAG AA)
