# SF Pro Toolkit - Cleanup TODO List
Quick reference for immediate cleanup tasks

## 🔥 Critical (Do Now)

### 1. Fix Broken File References
- [ ] `background/background.js` line 18: Remove reference to `popup/popup-redesign.html`
- [ ] `content/content.js` line 307: Create `content/dark.css` OR remove dark mode feature
- [ ] Decision: Keep or remove entire display mode toggle system?

### 2. Remove Dead Code - Visual Indicators
- [ ] `content/content.js` lines 224-305: Remove unused functions:
  - `injectVisualIndicators()`
  - `injectBorder()`
  - `injectBanner()`
  - `showEnvironmentTooltip()`
- [ ] Or add comment explaining why disabled
- [ ] Check if `content/indicators.css` is still needed

### 3. UX - "All Profiles" Mode
- [ ] Add visible banner when in "All Profiles" mode
- [ ] Example: "📘 Viewing all profiles (read-only mode)"
- [ ] Make disabled state more obvious (not just title attribute)

---

## ⚠️ Important (This Week)

### 4. Documentation Updates
- [ ] Update `IMPLEMENTATION-STATUS.md`:
  - Remove "popup mode" references
  - Add Popular OSS Notes feature
  - Add Custom profiles feature
  - Add Icon suggestion system
- [ ] Update `README.md`:
  - Check if screenshots are current
  - Complete keyboard shortcuts section
  - Add "All Profiles" mode explanation

### 5. Code Quality
- [ ] Review 80+ `console.log` statements:
  - Keep: errors, initialization, important state changes
  - Remove: debug logs like `[DEBUG]`, `shortcuts.length`, etc.
- [ ] Add try-catch blocks to storage operations:
  - `deleteEnvironment()` line 1965
  - `deleteShortcut()` line 2148
  - `deleteNote()` line 2448
  - `buildQuickActionUrl()` in toolkit-core.js

### 6. Add JSDoc Comments
Priority functions to document:
- [ ] `background.js`: All message handlers
- [ ] `content.js`: Detection functions (`detectEnvironmentFromURL`, `detectEnvironmentHeuristic`)
- [ ] `toolkit-core.js`: URL building (`buildShortcutUrl`, `buildQuickActionUrl`)
- [ ] `side-panel.js`: CRUD operations (save/delete functions)

---

## 📝 Medium Priority (Next Sprint)

### 7. Consolidate Duplicate Code
- [ ] Move `isSFPage()` detection to toolkit-core.js (currently in 3 files)
- [ ] Remove duplicate toast implementation from side-panel.js (use toolkit-core version)
- [ ] Use `extractAllUrlParameters()` consistently instead of inline parsing

### 8. UX Improvements
- [ ] Add 500ms debounce to icon suggestions (lines 3089-3165 in side-panel.js)
- [ ] Add loading indicators:
  - Profile switching
  - Environment loading
  - Quick Action navigation
- [ ] Improve character counter message (line 2594)

### 9. i18n Hardcoded Strings
Move to `_locales/en/messages.json`:
- [ ] Line 1272: Profile switch suggestion toast
- [ ] Line 2070: Delete environment confirmation
- [ ] Line 2148: Delete shortcut confirmation  
- [ ] Line 2448: Delete note confirmation
- [ ] Line 2767: OSS note URL copied toast

---

## 🎨 Nice to Have (Future)

### 10. File Organization
- [ ] Consider renaming `/popup` directory to `/panel` or `/src`
- [ ] Split `side-panel.css` into modules:
  - `base.css`
  - `components.css`
  - `sections.css`
  - `themes.css`

### 11. Performance
- [ ] Add loading indicator for "All Profiles" mode
- [ ] Consider code splitting for `sap-icon-library.js` (~2000 lines)
- [ ] Optimize tab change listener (only re-render if data changed)

### 12. Testing
- [ ] Add unit tests for:
  - URL building functions
  - Environment detection logic
  - Icon suggestion algorithm
- [ ] Document test results in `TESTING.md`

---

## 📋 Quick Wins (< 30 min each)

- [ ] Extract magic numbers to constants:
  - `5000` (character warning threshold)
  - `50` (max polling attempts in injected.js)
- [ ] Add WHY comments:
  - Why display mode forced to sidepanel
  - Why template notes only loaded once
  - Why baseUrl preferred over window.location
- [ ] Check if `content/indicators.css` classes are used anywhere
- [ ] Update version number in manifest.json if needed

---

## 🎯 Decision Points Needed

1. **Visual Indicators Feature**
   - [ ] Decision: Remove completely OR keep with feature flag?
   - Current: ~150 lines of commented-out code

2. **Dark Mode in Content Script**
   - [ ] Decision: Implement fully OR remove feature?
   - Current: Broken (references non-existent CSS file)

3. **Display Mode Toggle**
   - [ ] Decision: Remove system entirely?
   - Current: Extension is side-panel only, but code remains

4. **Character Counter Limit**
   - [ ] Decision: Remove 5000 char warning OR keep with better message?
   - Current: Arbitrary soft limit may confuse users

---

## ✅ Completed Items
_(Move items here as you complete them)_

---

## 📞 Questions for Product Owner

1. Should visual indicators feature be kept for future use?
2. Is dark mode in content script a required feature?
3. Priority: Performance optimization vs. new features?
4. Timeline for translation review (9 languages)?

---

**Last Updated**: 2026-01-11
**Related Documents**: 
- Full analysis: `CLEANUP-REPORT.md`
- Cleanup rules: `.clinerules/cleanup-after-feature.md`
