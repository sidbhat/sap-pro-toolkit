# Post-Feature Cleanup & Documentation Rule

This rule should be triggered after completing any feature implementation to ensure code quality, documentation accuracy, and maintainability.

**Trigger phrase**: "run cleanup" or "/cleanup" or "cleanup task"

## IMPORTANT: Security First

⚠️ **ALWAYS run security audit BEFORE cleanup**:
1. Run `/security` first (see security-audit.md)
2. Sanitize any violations found
3. Then proceed with cleanup steps below
4. Finally commit cleaned, secure code

## Execution Steps

### 1. SECURITY AUDIT (CRITICAL - Run First)

Before any cleanup, run security checks:

```bash
# Run automated security scans
grep -r "password\|credential\|@corp.sap" --include="*.json" resources/
```

**If violations found**:
- Stop cleanup process
- Run `/security` to sanitize
- Return to cleanup after security passes

### 2. CODE CLEANUP (High Priority)

#### A. Remove Obsolete Files
- [ ] Identify and list obsolete files (old popup files, unused resources, deprecated code)
- [ ] Confirm with user before deletion
- [ ] Delete confirmed obsolete files
- [ ] Update manifest.json to remove references to deleted files

#### B. Remove Dead Code
- [ ] Search for commented-out code blocks
- [ ] Search for unused functions (functions not called anywhere)
- [ ] Search for unused imports/variables
- [ ] Remove or document why commented code should remain

#### C. Add Proper Comments
- [ ] Review all JavaScript files for missing function documentation
- [ ] Add JSDoc-style comments to all exported functions
- [ ] Add inline comments for complex logic
- [ ] Document all parameters and return types

**Comment Standards**:
```javascript
/**
 * Brief description of what function does
 * @param {Type} paramName - Description
 * @returns {Type} Description of return value
 */
function exampleFunction(paramName) {
  // Inline comment explaining complex logic
  return result;
}
```

#### D. Review Modularity
- [ ] Check for duplicated code across files
- [ ] Identify opportunities to extract reusable functions
- [ ] Review file organization (are related functions together?)
- [ ] Check for overly long functions (>50 lines should be refactored)

### 3. DOCUMENTATION UPDATES (High Priority)

#### A. Update README.md
- [ ] Read current README.md
- [ ] Update feature list with newly added features
- [ ] Update screenshots if UI changed significantly
- [ ] Update installation/setup instructions if needed
- [ ] Add any new configuration options
- [ ] Update keyboard shortcuts table if shortcuts added
- [ ] Update roadmap section
- [ ] Add "What's New" section if major features added

#### B. Update Help Documentation (panel/side-panel.html)
- [ ] Update "About SF Pro Toolkit" section with new features
- [ ] Update "Key Features" list with descriptions
- [ ] Update keyboard shortcuts section if any shortcuts added
- [ ] Ensure all feature descriptions are current and accurate
- [ ] Add visual examples or tips for complex features

#### C. Update Technical Documentation
- [ ] Review and update IMPLEMENTATION-STATUS.md with completed features
- [ ] Update PRD.md if feature scope or requirements changed
- [ ] Update TESTING.md with new test scenarios and edge cases
- [ ] Check if CHROME-STORE-SUBMISSION.md needs updates
- [ ] Update IMPROVEMENTS.md or PROPOSED-IMPROVEMENTS.md if applicable
- [ ] Add new features to TESTING-GUIDE.md if testing procedures needed

#### D. Update CHANGELOG.md (REQUIRED - Critical)

**MANDATORY**: Update CHANGELOG.md with ALL changes before commit

- [ ] Open CHANGELOG.md and move items from [Unreleased] to new version
- [ ] Create version header: `## [X.Y.Z] - YYYY-MM-DD`
- [ ] Categorize ALL changes into appropriate sections:
  - **Added**: New features, capabilities, or functionality
  - **Changed**: Modifications to existing features
  - **Deprecated**: Features marked for future removal
  - **Removed**: Deleted features or functionality
  - **Fixed**: Bug fixes
  - **Security**: Security improvements or fixes
  - **Documentation**: Documentation updates
- [ ] Use emojis and clear descriptions for readability
- [ ] After updating CHANGELOG.md, sync summary to README.md "Version History"

**Example CHANGELOG.md Entry**:
```markdown
## [1.4.0] - 2026-01-15
### Added
- 🎯 Environment favoriting system with star icons
- 📋 Bulk import/export for environments (JSON format)
- 🔍 Fuzzy search with highlighting

### Changed
- Enhanced search algorithm for better matching
- Improved modal animations (200ms transitions)

### Fixed
- Environment switching bug in Edge browser
- Search focus issue on modal open

### Security
- Added rate limiting for API calls (10 req/min)
- Sanitized user input in search queries
```

**Then Update README.md**:
- [ ] Add matching version section to README.md "Version History"
- [ ] Keep it concise (3-5 major bullet points)
- [ ] Link to CHANGELOG.md for full details

#### E. Update .clinerules Documentation (If Workflow Changed)
- [ ] Update security-audit.md if new security checks needed
- [ ] Update profile-content-updater.md if profile structure changed
- [ ] Update cleanup-after-feature.md if cleanup process changed

### 4. INTERNATIONALIZATION (Medium Priority)

#### A. Update English Base File (_locales/en/messages.json)
- [ ] Add any new UI strings to English messages
- [ ] Review existing strings for accuracy
- [ ] Ensure all user-facing text is externalized

#### B. Update All Translation Files
- [ ] Copy new English strings to all language files
- [ ] Mark new strings with `[NEEDS TRANSLATION]` prefix
- [ ] List which languages need translation updates

**Languages to update**:
- de (German)
- es (Spanish)
- fr (French)
- it (Italian)
- ja (Japanese)
- ko (Korean)
- nl (Dutch)
- pt_BR (Portuguese - Brazil)
- zh_CN (Chinese - Simplified)

### 5. TESTING & QA (REQUIRED Before Commit)

#### A. Extension Load Test
- [ ] Load unpacked extension in chrome://extensions/
- [ ] Verify no console errors on load
- [ ] Test on at least 1 SAP SuccessFactors domain
- [ ] Verify extension icon appears in toolbar

#### B. Feature Testing
- [ ] Test new feature in isolation (works as intended)
- [ ] Test feature integration with existing functionality
- [ ] Test all keyboard shortcuts still work (if applicable)
- [ ] Verify i18n strings display correctly in English
- [ ] Test modal interactions (open/close/save/cancel)

#### C. Cross-Environment Testing
- [ ] Test in at least 2 different SF environments
- [ ] Verify environment switching preserves current path
- [ ] Test diagnostics copy functionality
- [ ] Verify shortcuts navigate correctly

#### D. Browser Compatibility
- [ ] Test in Chrome (primary target)
- [ ] Verify no breaking changes in Edge (Chromium)
- [ ] Check responsive design at 400px width

#### E. Performance Check
- [ ] Extension loads in <1 second
- [ ] No memory leaks (check chrome://inspect/#devices)
- [ ] No console warnings in production
- [ ] Storage operations complete quickly (<100ms)

**If any tests fail**:
- Fix issues before proceeding to commit
- Re-test after fixes
- Document any known limitations

### 6. CODE QUALITY CHECKS (Medium Priority)

#### A. Consistency Review
- [ ] Check naming conventions (camelCase for functions, UPPER_CASE for constants)
- [ ] Check indentation consistency (2 spaces)
- [ ] Check quote style consistency (single vs double quotes)
- [ ] Check semicolon usage consistency

#### B. Error Handling Review
- [ ] Ensure all async functions have try-catch blocks
- [ ] Ensure all user-facing errors show toast notifications
- [ ] Ensure console.error used for error logging
- [ ] Check for unhandled promise rejections

#### C. Performance Review
- [ ] Check for unnecessary re-renders
- [ ] Check for memory leaks (event listeners cleaned up?)
- [ ] Check for inefficient loops or operations
- [ ] Ensure large operations are async

### 7. GIT COMMIT (Required)

#### A. Stage Changes
```bash
git add -A
```

#### B. Create Comprehensive Commit Message
Format:
```
feat: [Brief description of main feature]

Features:
- [Feature 1]
- [Feature 2]

Code Quality:
- Removed obsolete files: [list]
- Added documentation to [files]
- Refactored [modules]

Documentation:
- Updated README with [changes]
- Updated i18n files for [languages]
- Updated help documentation

Testing:
- Tested on [browsers/versions]
- Verified [key scenarios]
```

#### C. Commit and Report
```bash
git commit -m "[message]"
```

### 8. FINAL REPORT

Provide user with:
- [ ] List of files deleted
- [ ] List of files modified with summary of changes
- [ ] List of files that still need work (TODOs)
- [ ] List of translation files needing human translation
- [ ] Commit hash and summary
- [ ] Any recommendations for further improvements

## Example Execution Output

```
✅ CLEANUP COMPLETE

📦 Files Deleted (3):
- popup/popup-old.html (obsolete)
- resources/deprecated.json (unused)
- scripts/legacy.js (superseded)

📝 Files Modified (12):
- popup/side-panel.js: Added 47 function comments, removed dead code
- README.md: Updated feature list, added new screenshots
- _locales/en/messages.json: Added 8 new strings
- [etc...]

🌍 Translations Needed (9 languages):
- All non-English locales need 8 new strings translated
- Marked with [NEEDS TRANSLATION] prefix

✅ Git Commit:
- Hash: abc123def
- Message: "feat: Environment notes feature with cleanup"
- Files changed: 15

📋 Recommendations:
- Consider extracting environment rendering into separate module
- Add unit tests for new storage functions
- Update Chrome Web Store listing with new feature

Next Steps:
- Run `/cleanup` command after your next feature
- Translate new i18n strings
- Consider running test suite
```

## Integration with Other Rules

**Cleanup Workflow Order**:
1. `/security` - Security audit FIRST (critical)
2. `/cleanup` - Code cleanup and documentation
3. `/update-profiles` - Update time-sensitive content (optional)
4. Git commit and push

## Notes for Cline

- **ALWAYS run `/security` before cleanup**
- Always ask for confirmation before deleting files
- Be conservative with refactoring - only if clearly beneficial
- Focus on high-priority items first
- If cleanup will take >30 minutes, break into phases
- Document any decisions made during cleanup
- If uncertain about whether code is obsolete, ask user
- Security violations block cleanup - fix them first
