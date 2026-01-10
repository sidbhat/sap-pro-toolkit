# Clear Saved Shortcuts

The extension still shows 7 shortcuts because they're saved in your browser's storage from previous use.

## Option 1: Clear via Browser Console (Recommended)

1. **Open the extension popup**
2. **Right-click** on the popup and select "Inspect"
3. **In the Console tab**, paste this command and press Enter:

```javascript
chrome.storage.local.remove('shortcuts', () => {
  console.log('Shortcuts cleared!');
  location.reload();
});
```

4. **Close and reopen** the extension popup
5. You should now see only 1 shortcut (Product Roadmap)

## Option 2: Clear All Extension Data

If Option 1 doesn't work, you can clear all extension data:

1. Go to `chrome://extensions/`
2. Find **SF Pro Toolkit**
3. Click **"Details"**
4. Scroll down and click **"Clear storage"** or **"Remove"** button
5. Reload the extension
6. Reopen the extension popup

This will remove all saved:
- Shortcuts (reset to 1 default)
- Environments
- Notes

## Why This Happened

The extension saves shortcuts to `chrome.storage.local` when you first use it. I updated:
- ✅ `popup-redesign.js` - Only loads 1 default shortcut
- ✅ `resources/shortcuts-default.json` - Only contains 1 shortcut

But your browser still has the old 7 shortcuts saved from before. Clearing storage will fix this.

## After Clearing

You'll start fresh with:
- **1 shortcut**: Product Roadmap 🗺️
- **Tight, condensed UI** with all the spacing optimizations
- **Clean slate** to add your own shortcuts
