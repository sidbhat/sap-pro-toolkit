# SAP Pro Toolkit - Storage Guide for Power Users

**Last Updated**: 2026-01-12

## Overview

SAP Pro Toolkit uses Chrome's `chrome.storage.local` API to persist user data. This guide helps power users understand the storage structure and manually manipulate data when needed.

---

## 🔍 Accessing Storage

### Method 1: Chrome DevTools Console

1. Open extension side panel
2. Right-click anywhere → "Inspect"
3. Go to **Console** tab
4. Use commands below

### Method 2: Chrome Storage Inspector

1. Open `chrome://extensions/`
2. Find "SAP Pro Toolkit"
3. Click "Details"
4. Scroll to "Inspect views: side panel"
5. Click "side panel" link
6. Go to **Application** tab → **Storage** → **Local Storage**

---

## 📦 Storage Keys Reference

### Core Data Keys

| Key | Type | Description |
|-----|------|-------------|
| `currentProfile` | string | Active profile ID (e.g., `"profile-successfactors"`) |
| `environments` | object | Saved environments (all profiles) |
| `shortcuts` | object | Saved shortcuts (all profiles) |
| `notes` | object | Saved notes (all profiles) |
| `solutions_${profileId}` | object | Quick Actions per profile |
| `customProfiles` | object | User-created custom profiles |
| `hiddenProfiles` | array | Hidden system profile IDs |
| `collapsedSections` | object | Collapsed section states |
| `pinnedEnvironments` | array | Pinned environment IDs |
| `theme` | string | Theme setting (`"light"`, `"dark"`, `"auto"`) |

---

## 🗂️ Data Structure Examples

### Custom Profiles
```javascript
{
  "customProfiles": {
    "profile-custom-1234567890": {
      "id": "profile-custom-1234567890",
      "name": "Project Alpha",
      "description": "Customer XYZ implementation",
      "icon": "💼",
      "type": "custom",
      "baseProfile": "profile-successfactors",
      "duplicatedFrom": "profile-successfactors",
      "createdAt": "2026-01-12T21:48:00Z"
    }
  }
}
```

### Quick Actions (Solutions)
```javascript
{
  "solutions_profile-successfactors": {
    "admin": {
      "name": "Admin Center",
      "path": "/sf/admin",
      "icon": "settings"
    },
    "provisioning": {
      "name": "Provisioning",
      "path": "/sf/provisioning",
      "icon": "people"
    }
  }
}
```

### Hidden Profiles
```javascript
{
  "hiddenProfiles": [
    "profile-btp",
    "profile-executive",
    "profile-golive"
  ]
}
```

### Environments
```javascript
{
  "environments": {
    "env-1234567890": {
      "id": "env-1234567890",
      "name": "Production DC68",
      "type": "production",
      "hostname": "performancemanager68.successfactors.com",
      "notes": "Main production instance",
      "profileId": "profile-successfactors",
      "isPinned": true,
      "usageCount": 42,
      "lastAccessed": "2026-01-12T20:30:00Z",
      "createdAt": "2025-12-01T10:00:00Z"
    }
  }
}
```

### Shortcuts
```javascript
{
  "shortcuts": {
    "shortcut-1234567890": {
      "id": "shortcut-1234567890",
      "name": "SAP Roadmap Explorer",
      "path": "https://roadmaps.sap.com",
      "notes": "Product roadmap portal",
      "tags": ["documentation", "planning"],
      "icon": "map",
      "profileId": "profile-global"
    }
  }
}
```

### Notes
```javascript
{
  "notes": {
    "note-1234567890": {
      "id": "note-1234567890",
      "title": "Test User IDs",
      "content": "user1@test.com\nuser2@test.com\n...",
      "tags": ["testing", "credentials"],
      "icon": "key",
      "profileId": "profile-successfactors"
    }
  }
}
```

---

## 🛠️ Power User Commands

### View All Storage Data
```javascript
chrome.storage.local.get(null, (data) => {
  console.log('All storage:', data);
});
```

### View Specific Key
```javascript
chrome.storage.local.get('customProfiles', (result) => {
  console.log('Custom profiles:', result.customProfiles);
});
```

### View Quick Actions for Profile
```javascript
chrome.storage.local.get('solutions_profile-successfactors', (result) => {
  console.log('SF Quick Actions:', result['solutions_profile-successfactors']);
});
```

### View Hidden Profiles
```javascript
chrome.storage.local.get('hiddenProfiles', (result) => {
  console.log('Hidden profiles:', result.hiddenProfiles || []);
});
```

### Export All Data to JSON
```javascript
chrome.storage.local.get(null, (data) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sf-toolkit-backup-${Date.now()}.json`;
  a.click();
  console.log('Export complete!');
});
```

---

## ✏️ Manual Data Manipulation

### Create Custom Profile
```javascript
chrome.storage.local.get('customProfiles', (result) => {
  const profiles = result.customProfiles || {};
  const newId = `profile-custom-${Date.now()}`;
  
  profiles[newId] = {
    id: newId,
    name: "My Custom Profile",
    description: "Created manually via DevTools",
    icon: "🎯",
    type: "custom",
    baseProfile: "profile-global",
    createdAt: new Date().toISOString()
  };
  
  chrome.storage.local.set({ customProfiles: profiles }, () => {
    console.log('Profile created:', newId);
    // Reload extension to see changes
    location.reload();
  });
});
```

### Add Quick Action to Profile
```javascript
const profileId = 'profile-successfactors';
const storageKey = `solutions_${profileId}`;

chrome.storage.local.get(storageKey, (result) => {
  const actions = result[storageKey] || {};
  
  actions.myCustomAction = {
    name: "My Custom Action",
    path: "/my/custom/path",
    icon: "tools"
  };
  
  chrome.storage.local.set({ [storageKey]: actions }, () => {
    console.log('Quick Action added!');
    location.reload();
  });
});
```

### Hide System Profile
```javascript
chrome.storage.local.get('hiddenProfiles', (result) => {
  const hidden = result.hiddenProfiles || [];
  
  if (!hidden.includes('profile-btp')) {
    hidden.push('profile-btp');
    
    chrome.storage.local.set({ hiddenProfiles: hidden }, () => {
      console.log('Profile hidden!');
      location.reload();
    });
  }
});
```

### Unhide All Profiles
```javascript
chrome.storage.local.set({ hiddenProfiles: [] }, () => {
  console.log('All profiles restored!');
  location.reload();
});
```

### Delete Custom Profile
```javascript
const profileToDelete = 'profile-custom-1234567890';

chrome.storage.local.get(['customProfiles', `solutions_${profileToDelete}`], (result) => {
  const profiles = result.customProfiles || {};
  delete profiles[profileToDelete];
  
  chrome.storage.local.set({ customProfiles: profiles }, () => {
    // Also delete associated Quick Actions
    chrome.storage.local.remove(`solutions_${profileToDelete}`, () => {
      console.log('Profile deleted!');
      location.reload();
    });
  });
});
```

### Bulk Import Quick Actions
```javascript
const profileId = 'profile-successfactors';
const storageKey = `solutions_${profileId}`;

const bulkActions = {
  admin: { name: "Admin Center", path: "/sf/admin", icon: "settings" },
  provisioning: { name: "Provisioning", path: "/sf/provisioning", icon: "people" },
  performance: { name: "Performance", path: "/sf/performance", icon: "target" },
  succession: { name: "Succession", path: "/sf/succession", icon: "analytics" }
};

chrome.storage.local.set({ [storageKey]: bulkActions }, () => {
  console.log('Bulk import complete!');
  location.reload();
});
```

### Clear All Data (CAUTION!)
```javascript
// ⚠️ WARNING: This deletes ALL extension data!
chrome.storage.local.clear(() => {
  console.log('All data cleared!');
  location.reload();
});
```

### Clear Only Custom Data (Keep System Profiles)
```javascript

chrome.storage.local.get(null, (data) => {
  const keepData = {};
  keysToKeep.forEach(key => {
    if (data[key]) keepData[key] = data[key];
  });
  
  chrome.storage.local.clear(() => {
    chrome.storage.local.set(keepData, () => {
      console.log('Custom data cleared, preferences kept!');
      location.reload();
    });
  });
});
```

---

## 🔄 Backup & Restore Workflows

### Full Backup
```javascript
chrome.storage.local.get(null, (data) => {
  const backup = {
    version: '1.5.0',
    timestamp: new Date().toISOString(),
    data: data
  };
  
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sf-toolkit-full-backup-${Date.now()}.json`;
  a.click();
  
  console.log('Full backup created!');
});
```

### Selective Restore (from backup JSON)
```javascript
// 1. Copy your backup JSON content
// 2. Paste into backupJson variable below
// 3. Run this script

const backupJson = {
  "version": "1.5.0",
  "timestamp": "2026-01-12T21:48:00Z",
  "data": {
    // ... your backup data here
  }
};

// Restore specific keys only (safer)
const keysToRestore = ['customProfiles', 'hiddenProfiles'];
const dataToRestore = {};

keysToRestore.forEach(key => {
  if (backupJson.data[key]) {
    dataToRestore[key] = backupJson.data[key];
  }
});

chrome.storage.local.set(dataToRestore, () => {
  console.log('Selective restore complete!');
  location.reload();
});
```

---

## 🧪 Testing & Debugging

### Check Storage Size
```javascript
chrome.storage.local.getBytesInUse(null, (bytes) => {
  const kb = (bytes / 1024).toFixed(2);
  const mb = (bytes / 1024 / 1024).toFixed(2);
  console.log(`Storage used: ${bytes} bytes (${kb} KB, ${mb} MB)`);
  console.log(`Quota: ~10 MB (chrome.storage.local limit)`);
});
```

### Validate Data Integrity
```javascript
chrome.storage.local.get(null, (data) => {
  const issues = [];
  
  // Check custom profiles
  if (data.customProfiles) {
    Object.values(data.customProfiles).forEach(profile => {
      if (!profile.id || !profile.name) {
        issues.push(`Invalid profile: ${JSON.stringify(profile)}`);
      }
    });
  }
  
  // Check environments
  if (data.environments) {
    Object.values(data.environments).forEach(env => {
      if (!env.hostname || !env.type) {
        issues.push(`Invalid environment: ${env.id}`);
      }
    });
  }
  
  if (issues.length === 0) {
    console.log('✅ Data integrity check passed!');
  } else {
    console.warn('⚠️ Data integrity issues found:');
    issues.forEach(issue => console.warn(issue));
  }
});
```

### Monitor Storage Changes
```javascript
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    console.log('Storage changed:', changes);
    Object.keys(changes).forEach(key => {
      console.log(`  ${key}:`, changes[key]);
    });
  }
});

console.log('Storage monitoring enabled. Make changes in the UI to see updates.');
```

---

## 📚 Common Use Cases

### Use Case 1: Migrate Settings to New Machine
1. Export all data using "Export All Data to JSON" command
2. Install extension on new machine
3. Use "Selective Restore" to import data
4. Reload extension

### Use Case 2: Reset Specific Profile
```javascript
const profileId = 'profile-custom-1234567890';
chrome.storage.local.remove(`solutions_${profileId}`, () => {
  console.log(`Quick Actions reset for ${profileId}`);
  location.reload();
});
```

### Use Case 3: Clone Quick Actions Between Profiles
```javascript
const sourceProfile = 'profile-successfactors';
const targetProfile = 'profile-custom-1234567890';

chrome.storage.local.get(`solutions_${sourceProfile}`, (result) => {
  const actions = result[`solutions_${sourceProfile}`];
  if (actions) {
    chrome.storage.local.set({ [`solutions_${targetProfile}`]: actions }, () => {
      console.log('Quick Actions cloned!');
      location.reload();
    });
  }
});
```

### Use Case 4: Bulk Update Environment Types
```javascript
chrome.storage.local.get('environments', (result) => {
  const envs = result.environments || {};
  
  Object.values(envs).forEach(env => {
    if (env.hostname.includes('preview')) {
      env.type = 'preview';
    }
  });
  
  chrome.storage.local.set({ environments: envs }, () => {
    console.log('Environment types updated!');
    location.reload();
  });
});
```

---

## ⚠️ Important Notes

1. **Always Backup First**: Before manual manipulation, export your data
2. **Reload After Changes**: UI won't update until you reload (`location.reload()`)
3. **Respect Data Types**: Match the structure shown in examples
4. **IDs Must Be Unique**: Use timestamps or random strings for IDs
5. **System Profiles Are Read-Only**: Don't modify files in `resources/` directory
6. **Storage Limits**: Chrome allows ~10MB in `chrome.storage.local`

---

## 🆘 Troubleshooting

### Problem: Changes Don't Appear in UI
**Solution**: Run `location.reload()` after making changes

### Problem: Extension Crashes After Manual Edit
**Solution**: 
```javascript
// Restore from backup or clear corrupted data
chrome.storage.local.clear(() => {
  console.log('Storage cleared. Extension will reset.');
  location.reload();
});
```

### Problem: Can't Find Profile ID
**Solution**:
```javascript
chrome.storage.local.get('customProfiles', (result) => {
  console.table(Object.values(result.customProfiles || {}));
});
```

---

## 📞 Support

For additional help:
- GitHub Issues: https://github.com/sidbhat/sap-pro-toolkit/issues
- Check `TESTING-GUIDE.md` for testing procedures
- Review `IMPLEMENTATION-STATUS.md` for feature documentation

**Version**: 1.5.0  
**Last Updated**: 2026-01-12
