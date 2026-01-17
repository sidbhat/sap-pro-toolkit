# Custom Profile Storage Architecture

**Date**: 2026-01-16

---

## 🏗️ STORAGE STRUCTURE

Custom profiles use a **two-tier storage system**:

### Tier 1: Profile Metadata (Single Array)
**Storage Key**: `customProfiles` (global, not profile-specific)

```javascript
// Chrome storage structure:
{
  "customProfiles": [
    {
      "id": "custom-my-team",
      "name": "My Team",
      "icon": "👥",
      "description": "Team-specific environments and shortcuts",
      "file": null,  // Custom profiles have NO JSON template file
      "createdAt": 1705449600000
    },
    {
      "id": "custom-demo-prep",
      "name": "Demo Prep",
      "icon": "🎯",
      "description": "Demo environments",
      "file": null,
      "createdAt": 1705536000000
    }
  ]
}
```

**Key Points**:
- Stored as array in `customProfiles` key
- Contains metadata only (id, name, icon, description)
- **`file: null`** indicates no JSON template (vs. system profiles with `file: "profile-xyz.json"`)
- All custom profiles in ONE array, NOT per-profile storage

---

### Tier 2: Profile Data (Per-Profile Storage Keys)
**Storage Keys**: `environments_${profileId}`, `shortcuts_${profileId}`, `notes_${profileId}`

```javascript
// Chrome storage structure for profile "custom-my-team":
{
  "customProfiles": [...],  // Tier 1 (metadata)
  
  // Tier 2 (actual data) - separate keys per profile:
  "environments_custom-my-team": [
    {
      "id": "env-123",
      "name": "Team Prod",
      "hostname": "team.sapsf.com",
      "type": "production"
    }
  ],
  
  "shortcuts_custom-my-team": [
    {
      "id": "shortcut-456",
      "name": "Team Dashboard",
      "url": "https://team.sapsf.com/sf/home"
    }
  ],
  
  "notes_custom-my-team": [
    {
      "id": "note-789",
      "title": "Team Notes",
      "content": "Important info..."
    }
  ]
}
```

**Key Points**:
- Data stored in **separate keys** per profile: `{type}_{profileId}`
- Each key contains an **array** of items
- Same structure as system profiles (SuccessFactors, S/4HANA, etc.)

---

## 🔄 HOW IT WORKS

### Creating a Custom Profile

**Function**: `window.createCustomProfile()` in `panel/actions.js` (line 1073)

```javascript
// Step 1: Generate profile ID
const profileId = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
// Example: "My Team" → "custom-my-team"

// Step 2: Create profile metadata object
const newProfile = {
  id: profileId,
  name: profileName,
  icon: icon,
  description: description,
  file: null,  // ← NO JSON file!
  createdAt: Date.now()
};

// Step 3: Add to customProfiles array
const result = await chrome.storage.local.get('customProfiles');
const customProfiles = result.customProfiles || [];
customProfiles.push(newProfile);
await chrome.storage.local.set({ customProfiles });

// Step 4: Initialize empty data arrays for this profile
await chrome.storage.local.set({
  [`environments_${profileId}`]: [],
  [`shortcuts_${profileId}`]: [],
  [`notes_${profileId}`]: []
});
```

---

### Loading Custom Profiles

**Function**: `discoverProfiles()` in `panel/actions.js` (line 1689)

```javascript
// Step 1: Load hardcoded system profiles
const hardcodedProfiles = [
  { id: 'profile-global', name: 'Global', file: 'profile-global.json' },
  { id: 'profile-successfactors', name: 'SuccessFactors', file: 'profile-successfactors-public.json' },
  // ... etc
];

// Step 2: Load custom profiles from storage
const result = await chrome.storage.local.get('customProfiles');
const customProfiles = result.customProfiles || [];

// Step 3: Merge both lists
window.availableProfiles = [...hardcodedProfiles, ...customProfiles];
```

---

### Saving Data to Custom Profile

**Function**: `window.saveEnvironment()` in `panel/actions.js`

```javascript
// When saving to custom profile "custom-my-team":
const storageKey = `environments_${currentProfile}`;  
// → "environments_custom-my-team"

window.environments.push(newEnvironment);

await chrome.storage.local.set({ 
  [storageKey]: window.environments  // Saves to "environments_custom-my-team" key
});
```

**Same pattern for shortcuts and notes**:
- `shortcuts_custom-my-team`
- `notes_custom-my-team`

---

### Loading Data from Custom Profile

**Function**: `window.loadEnvironments()` in `panel/state.js`

```javascript
const storageKey = `environments_${window.currentProfile}`;
// For "custom-my-team" → "environments_custom-my-team"

const result = await chrome.storage.local.get(storageKey);
window.environments = result[storageKey] || [];
```

---

## 🔍 KEY DIFFERENCES: Custom vs. System Profiles

| Aspect | System Profiles | Custom Profiles |
|--------|-----------------|-----------------|
| **Metadata Storage** | Hardcoded in `actions.js` | Stored in `customProfiles` array |
| **JSON Template File** | `file: "profile-xyz.json"` | `file: null` |
| **Profile List** | Always available | Loaded from storage |
| **Data Storage** | `{type}_profile-xyz` keys | `{type}_custom-xyz` keys |
| **Deletion** | Cannot delete | Can delete (removes from `customProfiles`) |
| **Creation** | Predefined | User-created via UI |

---

## 🐛 POTENTIAL STORAGE ISSUES

### Issue 1: Empty Arrays After Save

**User reported**: "custom profiles stores nothing"

**Possible causes**:

1. **Data saved but render not called** (✅ FIXED)
   - Missing `window.` prefix prevented render functions from executing
   - UI didn't update, making it appear data wasn't saved

2. **Storage key mismatch**
   - If `currentProfile` variable doesn't match profile ID
   - Example: Saving to `environments_custom-team` but loading from `environments_custom-my-team`

3. **Data overwritten by empty array**
   - If load function runs AFTER save and overwrites with empty array
   - Race condition between save and load operations

### Issue 2: Console Shows `count: 0` But `hasData: true`

**From debug logs**:
```
[Load Environments] Storage result: {hasData: true, count: 0}
```

**Interpretation**:
- `hasData: true` means storage key EXISTS
- `count: 0` means array is EMPTY: `[]`
- This proves data is NOT saved, or was cleared/overwritten

**Likely cause**: Before our fixes, render functions weren't called after save, so:
1. User saves environment
2. Data written to storage
3. Render function NOT called (missing `window.` prefix)
4. UI doesn't update
5. User switches profile
6. Previous profile data loaded as empty (if it was just created)

---

## 🧪 DEBUGGING CUSTOM PROFILE STORAGE

### Check What's in Storage

Run in browser console:
```javascript
// Get all storage keys
chrome.storage.local.get(null, (result) => {
  console.log('All storage keys:', Object.keys(result));
  console.log('Custom profiles metadata:', result.customProfiles);
  
  // Check each custom profile's data
  Object.keys(result).forEach(key => {
    if (key.startsWith('environments_custom-') || 
        key.startsWith('shortcuts_custom-') || 
        key.startsWith('notes_custom-')) {
      console.log(key, '→', result[key]);
    }
  });
});
```

### Expected Output (Working Custom Profile)

```javascript
{
  "customProfiles": [
    { id: "custom-my-team", name: "My Team", ... }
  ],
  "environments_custom-my-team": [
    { id: "env-123", name: "Team Prod", ... }
  ],
  "shortcuts_custom-my-team": [
    { id: "shortcut-456", ... }
  ],
  "notes_custom-my-team": []
}
```

### What Indicates Broken Storage

```javascript
{
  "customProfiles": [
    { id: "custom-my-team", ... }
  ],
  // ❌ Data keys MISSING or EMPTY:
  "environments_custom-my-team": [],  // Empty array = no data saved
  "shortcuts_custom-my-team": []
  // ❌ OR keys don't exist at all
}
```

---

## ✅ VERIFICATION STEPS

After our fixes, test this flow:

1. **Create custom profile**:
   ```
   Open profile menu → Click "➕ New Profile" → Enter name "Test Profile" → Save
   ```

2. **Verify metadata saved**:
   ```javascript
   // Console:
   chrome.storage.local.get('customProfiles', (r) => console.log(r));
   // Should show: { customProfiles: [{ id: "custom-test-profile", name: "Test Profile", file: null, ... }] }
   ```

3. **Add environment to custom profile**:
   ```
   Click "+ Add Current Instance" → Fill form → Save
   ```

4. **Verify data saved**:
   ```javascript
   // Console:
   chrome.storage.local.get('environments_custom-test-profile', (r) => console.log(r));
   // Should show: { "environments_custom-test-profile": [{ id: "env-...", name: "...", ... }] }
   ```

5. **Verify UI updated**:
   - Environment should appear in list immediately
   - Section count should show "(1)"

6. **Switch profiles and back**:
   ```
   Switch to Global → Switch back to Test Profile
   ```
   - Environment should still be visible
   - Count should still be correct

---

## 🎯 SUMMARY

**Custom Profile Storage = Metadata + Data**

**Metadata** (profile list):
- Key: `customProfiles` (single array)
- Contains: Profile info (id, name, icon, description, `file: null`)

**Data** (profile content):
- Keys: `environments_${profileId}`, `shortcuts_${profileId}`, `notes_${profileId}`
- Contains: Arrays of actual items

**Our fixes ensure**:
- ✅ Render functions called after save (data appears in UI)
- ✅ Section counts updated (accurate display)
- ✅ Proper function references (no undefined errors)

**Still need to verify**:
- 🔍 Data actually persists in storage after our fixes
- 🔍 No race conditions between save/load operations
- 🔍 Custom profiles maintain data across profile switches
