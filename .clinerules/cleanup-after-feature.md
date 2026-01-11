# Post-Feature Cleanup & Documentation Rule

This rule should be triggered after completing any feature implementation to ensure code quality, documentation accuracy, and maintainability.

**Trigger phrase**: "run cleanup" or "/cleanup" or "cleanup task"

## Execution Steps

### 1. CODE CLEANUP (High Priority)

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

### 2. DOCUMENTATION UPDATES (High Priority)

#### A. Update README.md
- [ ] Read current README.md
- [ ] Update feature list with newly added features
- [ ] Update screenshots if UI changed significantly
- [ ] Update installation/setup instructions if needed
- [ ] Add any new configuration options
- [ ] Update roadmap section

#### B. Update Help Documentation (side-panel.html)
- [ ] Update "About SF Pro Toolkit" section with new features
- [ ] Update "Key Features" list
- [ ] Update keyboard shortcuts section if any shortcuts added
- [ ] Ensure all feature descriptions are current

#### C. Update Technical Documentation
- [ ] Review and update IMPLEMENTATION-STATUS.md
- [ ] Update PRD.md if feature scope changed
- [ ] Update TESTING.md with new test scenarios
- [ ] Check if CHROME-STORE-SUBMISSION.md needs updates

### 3. INTERNATIONALIZATION (Medium Priority)

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

### 4. CODE QUALITY CHECKS (Medium Priority)

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

### 5. GIT COMMIT (Required)

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

### 6. FINAL REPORT

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

## Notes for Cline

- Always ask for confirmation before deleting files
- Be conservative with refactoring - only if clearly beneficial
- Focus on high-priority items first
- If cleanup will take >30 minutes, break into phases
- Document any decisions made during cleanup
- If uncertain about whether code is obsolete, ask user
