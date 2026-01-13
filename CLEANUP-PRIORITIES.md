# SF Pro Toolkit - Prioritized Cleanup Tasks
Based on product owner feedback - 2026-01-11

## ✅ APPROVED TASKS - Execute Now

### Phase 1: Dead Code Removal (HIGH PRIORITY)
- [x] Remove visual indicators system from content.js (~150 lines)
- [x] Remove dark mode feature from content script
- [x] Check and remove content/indicators.css if unused
- [x] Keep side panel code, remove popup mode references

### Phase 2: File Organization (DO NOW)
- [ ] Rename `/popup` directory to `/panel`
- [ ] Split `side-panel.css` into modules:
  - `base.css`
  - `components.css`
  - `sections.css`
  - `themes.css`

### Phase 3: UX Improvements (HIGH PRIORITY)
- [ ] Add 500ms debounce to icon suggestions
- [ ] Add loading indicators (profile switch, environments, quick actions)
- [ ] Improve character counter message

### Phase 4: Code Quality (HIGH PRIORITY)
- [ ] Remove debug console.log statements (keep errors/important)
- [ ] Add try-catch to storage operations
- [ ] Add JSDoc comments to public functions
- [ ] Consolidate duplicate code:
  - Move isSFPage() to toolkit-core.js
  - Remove duplicate toast implementation
  - Use extractAllUrlParameters() consistently

### Phase 5: i18n Hardcoded Strings (HIGH PRIORITY)
- [ ] Move all hardcoded user-facing strings to _locales/en/messages.json
- [ ] Translate to 9 languages (RIGHT NOW priority)

### Phase 6: Documentation Updates (HIGH PRIORITY)
- [ ] Update IMPLEMENTATION-STATUS.md
- [ ] Update README.md (screenshots, keyboard shortcuts)

## ❌ SKIPPED TASKS

- Performance optimizations (deferred)
- Unit testing (deferred)
- Magic number extraction (not needed)
- WHY comments (deferred)

## 🎯 DECISIONS MADE

1. **Visual Indicators**: ❌ REMOVE completely
2. **Dark Mode in Content Script**: ❌ REMOVE
3. **Display Mode Toggle**: ✅ Keep side panel, remove popup references
4. **Character Counter**: ✅ Keep as-is (no changes needed)
5. **Translation Priority**: 🔥 RIGHT NOW

## 📊 Execution Order

1. **NOW**: Dead code removal (clean up codebase)
2. **NOW**: File reorganization (rename /popup to /panel)
3. **THIS WEEK**: UX improvements + Code quality
4. **THIS WEEK**: i18n strings + translations
5. **THIS WEEK**: Documentation updates

---

**Status**: Ready to execute
**Estimated Time**: 4-6 hours total
