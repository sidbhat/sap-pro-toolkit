# SuccessFactors Pro Toolkit - Testing Guide

## Prerequisites

### 1. Icon Files (Required)
Before loading the extension, you need icon files. See `icons/README.md` for instructions.

**Quick Fix**: Create placeholder icons using any image editor:
- Create a 128x128px purple square with "SF" text
- Save as `icons/icon-128.png`
- Resize and save as `icon-48.png`, `icon-32.png`, `icon-16.png`

### 2. Chrome Browser
- Chrome 88+ or Edge 88+ (Chromium-based)
- Developer mode enabled

### 3. Test Environment
- Access to a SuccessFactors instance (Production, Preview, or Sales)
- OR use these test hostnames for validation:
  - `hcm-us20.hr.cloud.sap` (Production DC68)
  - `hcm-us20-preview.hr.cloud.sap` (Preview DC68)

## Installation Steps

### 1. Load Extension in Developer Mode

```bash
# Navigate to project directory
cd /Users/I806232/Downloads/sf-pro-toolkit

# Open Chrome
# Go to: chrome://extensions/

# Enable "Developer mode" (toggle in top-right)

# Click "Load unpacked"

# Select the sf-pro-toolkit directory
```

### 2. Verify Installation

After loading, you should see:
- ✅ Extension appears in toolbar with icon
- ✅ No errors in Chrome Extensions page
- ✅ Extension shows as "SuccessFactors Pro Toolkit v1.3.0"

### 3. Check Console for Errors

Open DevTools Console (F12) and check for:
- ❌ No red error messages
- ✅ "[SuccessFactors Pro Toolkit] Background service worker initialized"

## Feature Testing Checklist

### P0: Environment Detection & Visual Indicators

#### Test 1: Navigate to SF Page
1. Navigate to any SF instance (e.g., your company's SF URL)
2. **Expected**:
   - ✅ Left border appears (red for prod, green for preview, orange for sales)
   - ✅ Top-left banner shows environment type and datacenter
   - ✅ Toolbar badge shows environment abbreviation (PROD/PREV/SALE)

#### Test 2: Open Extension Popup
1. Click extension icon in toolbar
2. **Expected**:
   - ✅ Popup opens (380px wide)
   - ✅ Context banner shows current environment
   - ✅ Hostname displayed correctly
   - ✅ Datacenter and region info shown (if in dc.json)

#### Test 3: Environment Banner Click
1. Click the environment banner in top-left of SF page
2. **Expected**:
   - ✅ Tooltip appears with detailed environment info
   - ✅ Tooltip auto-dismisses after 3 seconds

### P0: Environment Switcher

#### Test 4: Add Current Environment
1. While on SF page, open popup
2. Click "+ Add Current Instance" button
3. **Expected**:
   - ✅ Modal opens with pre-filled data
   - ✅ Hostname matches current page
   - ✅ Environment type detected correctly
   - ✅ Datacenter auto-filled (if known)

4. Edit name if desired, click "Save Environment"
5. **Expected**:
   - ✅ Modal closes
   - ✅ Environment appears in list
   - ✅ Toast notification: "Environment saved ✓"

#### Test 5: Switch Environments
1. Add at least 2 environments (e.g., Production and Preview)
2. Click "Switch" button on Preview environment
3. **Expected**:
   - ✅ Page reloads with new hostname
   - ✅ Relative path preserved (e.g., /sf/admin stays /sf/admin)
   - ✅ Visual indicators update to green (preview)

#### Test 6: Production Warning
1. From Preview, click "Switch" to Production
2. **Expected**:
   - ✅ Confirmation dialog appears
   - ✅ "⚠️ You are about to switch to PRODUCTION. Are you sure?"
   - ✅ Can cancel without switching
   - ✅ Confirming performs switch

### P0: Quick Navigation Shortcuts

#### Test 7: Default Shortcuts Load
1. On first install, open popup
2. **Expected**:
   - ✅ 12 default shortcuts displayed
   - ✅ Each has icon, name, and arrow
   - ✅ Shortcuts include: Admin Center, Permission Roles, Diagnostic Tool, etc.

#### Test 8: Navigate via Shortcut
1. Click "Admin Center" shortcut
2. **Expected**:
   - ✅ Navigates to `/sf/admin` on current instance
   - ✅ Popup closes automatically
   - ✅ No errors in console

#### Test 9: Active Shortcut Highlighting
1. Navigate to `/sf/admin` manually
2. Open popup
3. **Expected**:
   - ✅ "Admin Center" shortcut highlighted (bold + background glow)
   - ✅ Other shortcuts not highlighted

#### Test 10: Add Current Page as Shortcut
1. Navigate to any SF page (e.g., `/sf/profile`)
2. Open popup
3. Click "+ Add Current Page"
4. **Expected**:
   - ✅ Modal opens
   - ✅ Name pre-filled with page title
   - ✅ Path pre-filled with current path
   - ✅ Can edit and save
   - ✅ New shortcut appears in list

#### Test 11: Add Custom Shortcut
1. Click "Manage Shortcuts"
2. Fill in:
   - Name: "My Custom Page"
   - Path: `/sf/custom/path`
   - Category: Custom
   - Icon: 🔧
3. Click "Save Shortcut"
4. **Expected**:
   - ✅ Shortcut saved successfully
   - ✅ Appears in shortcuts list
   - ✅ Clicking navigates to specified path

### P1: Dark Mode

#### Test 12: Dark Mode Toggle - Light
1. Open popup
2. Dark Mode dropdown: Select "Light"
3. **Expected**:
   - ✅ SF page remains in light mode
   - ✅ No dark.css injected
   - ✅ Setting saved (persists on reload)

#### Test 13: Dark Mode Toggle - Dark
1. Dark Mode dropdown: Select "Dark"
2. **Expected**:
   - ✅ SF page instantly turns dark
   - ✅ Background becomes #111111
   - ✅ Text becomes light colored
   - ✅ Tables, cards, inputs all styled dark
   - ✅ Toast: "Dark mode set to: dark"

#### Test 14: Dark Mode Toggle - Auto
1. Dark Mode dropdown: Select "Auto"
2. **Expected**:
   - ✅ Follows system theme
   - ✅ If system is dark, page is dark
   - ✅ If system is light, page is light

#### Test 15: Dark Mode Coverage
With dark mode enabled, check various SF pages:
- ✅ Home page / landing
- ✅ Admin Center (`/sf/admin`)
- ✅ People Profile (`/sf/profile`)
- ✅ Time Off pages
- ✅ Tables render correctly
- ✅ Modals/dialogs are dark
- ✅ Buttons and inputs visible

### P1: Diagnostics Copy

#### Test 16: Copy Diagnostics
1. On an SF page, open popup
2. Click "📋 Copy Diagnostics"
3. **Expected**:
   - ✅ Toast: "Diagnostics copied to clipboard ✓"
   - ✅ Paste (Ctrl+V) shows formatted report
   - ✅ Report includes:
     - Environment type
     - Company ID (if available)
     - Datacenter
     - Provider and region
     - Current URL
     - Browser info
     - Extension version

#### Test 17: Diagnostics Accuracy
1. Compare diagnostics report with actual page
2. **Expected**:
   - ✅ Environment type matches visual indicator
   - ✅ Hostname matches address bar
   - ✅ Datacenter matches known value
   - ✅ All fields populated (or show "N/A")

### Edge Cases & Error Handling

#### Test 18: Non-SF Page
1. Navigate to google.com
2. Open popup
3. **Expected**:
   - ✅ Context banner: "Not on SuccessFactors page"
   - ✅ Message: "Navigate to an SF instance to use toolkit"
   - ✅ No environment info shown
   - ✅ Shortcuts still visible but disabled

#### Test 19: Unknown Datacenter
1. Navigate to SF instance not in dc.json
2. **Expected**:
   - ✅ Heuristic detection applied (preview/sales/production)
   - ✅ Gray border and "UNKNOWN" banner if no keywords
   - ✅ Datacenter shows "Unknown"
   - ✅ Extension still functional

#### Test 20: Empty State - No Environments
1. Fresh install, no environments saved
2. Open popup
3. **Expected**:
   - ✅ "No saved environments yet" message
   - ✅ "+ Add Current Instance" button visible
   - ✅ Can add first environment successfully

#### Test 21: Modal Cancel Behavior
1. Open "Add Environment" modal
2. Click background or X button
3. **Expected**:
   - ✅ Modal closes without saving
   - ✅ Form resets
   - ✅ No environment added

## Browser Console Checks

### Expected Console Messages
```
[SuccessFactors Pro Toolkit] Background service worker initialized
[SuccessFactors Pro Toolkit] Content script loaded on: hcm-us20.hr.cloud.sap
[SuccessFactors Pro Toolkit] Injected script loaded
[SuccessFactors Pro Toolkit] Found pageHeaderJsonData
[SuccessFactors Pro Toolkit] Page data received: {...}
```

### No Errors
- ❌ No red error messages
- ❌ No "Failed to load resource" errors
- ❌ No "Uncaught" exceptions

## Performance Checks

### Load Time
- Extension initialization: < 100ms
- Popup open: < 150ms
- Environment detection: < 50ms
- Dark mode toggle: < 100ms

### Memory Usage
1. Open Chrome Task Manager (Shift+Esc)
2. Find "Extension: SuccessFactors Pro Toolkit"
3. **Expected**: < 20MB memory usage

## Cross-Browser Testing

### Chrome
- ✅ Full functionality expected

### Edge (Chromium)
- ✅ Full functionality expected

### Brave
- ✅ Should work (Chromium-based)
- ⚠️ May need to allow extension in settings

## Storage Verification

### Check Stored Data
1. Open DevTools (F12)
2. Go to Application > Storage > Extensions
3. **Expected**:
   - ✅ `chrome.storage.local` contains:
     - `shortcuts` array (12+ items)
     - `environments` array (if any added)
   - ✅ `chrome.storage.sync` contains:
     - `darkMode` setting
     - `showConfirmationForProd` setting

## Troubleshooting

### Issue: Extension doesn't load
- ✅ Check icon files exist in `icons/` directory
- ✅ Check manifest.json is valid JSON
- ✅ Reload extension in chrome://extensions
- ✅ Check browser console for errors

### Issue: Content script not running
- ✅ Verify URL matches host_permissions in manifest
- ✅ Reload SF page
- ✅ Check content script console logs

### Issue: Dark mode not applying
- ✅ Verify dark.css file exists
- ✅ Check if file is web_accessible_resource
- ✅ Look for injection in page's <head>

### Issue: Environment not detected
- ✅ Verify hostname in dc.json
- ✅ Check if pageHeaderJsonData exists on page
- ✅ Should fallback to URL-based detection

## Success Criteria

### ✅ Extension is Ready for Use When:
- All P0 features work correctly
- All P1 features work correctly
- No console errors on normal usage
- Environment detection accurate for 40+ datacenters
- Dark mode covers 70%+ of pages
- Shortcuts navigate correctly
- Settings persist across sessions
- Performance meets targets (<100ms operations)

## Reporting Issues

If you find bugs:
1. Note the specific test that failed
2. Capture console logs
3. Include SF URL (if not sensitive)
4. Browser version
5. Steps to reproduce

## Next Steps

After testing:
1. Create icon files (see icons/README.md)
2. Package extension for distribution
3. Submit to Chrome Web Store (optional)
4. Share with team for beta testing
