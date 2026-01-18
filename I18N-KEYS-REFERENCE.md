# i18n Keys Reference for Translation

This document lists ALL i18n keys used in the SF Pro Toolkit extension, organized by file and category.

**Last Updated**: 2026-01-18  
**Total Keys**: ~140 keys  
**Target Languages**: de, es, fr, it, ja, ko, nl, pt_BR, zh_CN

---

## How to Use This Reference

1. All keys listed here are already defined in `_locales/en/messages.json`
2. Translation agents should copy these keys to target language files
3. Each key includes English message and placeholders (if any)
4. Keys are organized by functional area for easier translation

---

## VALIDATION ERRORS (validation.js)

### Environment Validation
- **envNameTooShort**: "Environment name must be at least $1 characters" (1 placeholder)
- **envNameTooLong**: "Environment name cannot exceed $1 characters" (1 placeholder)
- **hostnameTooShort**: "Hostname must be at least $1 characters" (1 placeholder)
- **hostnameTooLong**: "Hostname cannot exceed $1 characters" (1 placeholder)
- **invalidSapHostname**: "Invalid SAP hostname format"

### Shortcut Validation
- **shortcutNameTooShort**: "Shortcut name must be at least $1 characters" (1 placeholder)
- **shortcutNameTooLong**: "Shortcut name cannot exceed $1 characters" (1 placeholder)
- **urlMustBeExternal**: "URL must start with http:// or https://"
- **urlTooShort**: "URL must be at least $1 characters" (1 placeholder)
- **urlTooLong**: "URL cannot exceed $1 characters" (1 placeholder)

### Note Validation
- **noteTitleTooShort**: "Note title must be at least $1 characters" (1 placeholder)
- **noteTitleTooLong**: "Note title cannot exceed $1 characters" (1 placeholder)

---

## INITIALIZATION & SYSTEM (main.js)

- **failedInitialize**: "Failed to initialize extension"
- **welcomeGetStarted**: "Let's get started! ✨"
- **enterSearchQueryFirst**: "Enter a search query first"

---

## ENVIRONMENT MANAGEMENT (actions.js)

### Navigation
- **failedNavigate**: "Failed to navigate"
- **switchingToEnvironment**: "Switching to $1..." (1 placeholder: hostname)
- **failedSwitchEnvironment**: "Failed to switch environment"
- **noEnvironmentsSaved**: "No environments saved yet"
- **noEnvironmentAtPosition**: "No environment at position $1" (1 placeholder: position number)

### CRUD Operations
- **noActiveTab**: "No active tab"
- **environmentDeleted**: "Environment deleted ✓"
- **environmentNameRequired**: "Environment name is required"
- **hostnameRequired**: "Hostname is required"
- **hostnameCannotContainSpaces**: "Hostname cannot contain spaces"
- **hostnameInvalidCharacters**: "Hostname contains invalid characters"
- **environmentUpdated**: "Environment updated ✓"
- **environmentSaved**: "Environment saved ✓"
- **failedSaveEnvironment**: "Failed to save environment"

---

## SHORTCUT MANAGEMENT (actions.js)

- **shortcutNotFound**: "Shortcut not found"
- **formElementsNotFound**: "Form elements not found"
- **shortcutDeleted**: "Shortcut deleted ✓"
- **fillRequiredFields**: "Please fill in all required fields"
- **shortcutUpdated**: "Shortcut updated ✓"
- **shortcutSaved**: "Shortcut saved ✓"

---

## NOTE MANAGEMENT (actions.js)

- **noteNotFound**: "Note not found"
- **modalNotFound**: "Modal not found"
- **noteDeleted**: "Note deleted ✓"
- **enterNoteTitle**: "Please enter a note title"
- **noteUpdated**: "Note updated ✓"
- **noteSaved**: "Note saved ✓"
- **noteCopied**: "Note copied ✓"
- **failedCopyNote**: "Failed to copy note"
- **noContentToCopy**: "No content to copy"
- **contentCopied**: "Content copied ✓"
- **failedCopyContent**: "Failed to copy content"

---

## PROFILE MANAGEMENT (actions.js)

- **switchedToProfile**: "Switched to $1 ✓" (1 placeholder: profile name)
- **failedSwitchProfile**: "Failed to switch profile"
- **noChangesToSave**: "No changes to save"
- **quickActionsSaved**: "$1 Quick Actions saved ✓" (1 placeholder: count)
- **failedSaveQuickActions**: "Failed to save Quick Actions"
- **profileAlreadyExists**: "A profile with this name already exists"
- **profileCreated**: "Profile '$1' created ✓" (1 placeholder: name)
- **failedCreateProfile**: "Failed to create profile: $1" (1 placeholder: error)
- **cannotDeleteSystemProfiles**: "Cannot delete system profiles"
- **switchProfileBeforeDeleting**: "Switch to another profile before deleting"
- **profileDeleted**: "Profile '$1' deleted" (1 placeholder: name)
- **failedDeleteProfile**: "Failed to delete profile: $1" (1 placeholder: error)
- **profileNameRequired**: "Profile name is required"
- **profileNameAlreadyExists**: "A profile with this name already exists"
- **currentProfileNotFound**: "Current profile not found"
- **profileResetSuccess**: "Profile '$1' reset to defaults ✓" (1 placeholder: name)
- **resetFailed**: "Reset failed: $1" (1 placeholder: error)

---

## IMPORT/EXPORT (actions.js, side-panel.js)

- **invalidJSONFile**: "Invalid JSON file. Please check file format."
- **invalidFileStructure**: "Invalid file structure. Expected shortcuts, environments, or notes."
- **noNewItemsToImport**: "No new items to import (all items already exist)"
- **importedIntoNewProfile**: "Imported $1 items into new profile '$2' ✓" (2 placeholders: count, name)
- **importFailed**: "Import failed: $1" (1 placeholder: error)
- **invalidBackupStructure**: "Invalid backup file structure"
- **fullBackupRestored**: "Restored $1 custom profiles with $2 total items ✓" (2 placeholders: profile count, item count)
- **backupRestoreFailed**: "Backup restore failed: $1" (1 placeholder: error)
- **importedIntoProfile**: "Imported $1 into $2 ✓" (2 placeholders: summary, profile name)
- **exportedProfile**: "Exported '$1' profile: $2 items + $3 Quick Actions ✓" (3 placeholders: name, item count, QA count)
- **failedExportProfile**: "Failed to export profile"
- **fullBackupExported**: "Full backup exported: $1 profiles, $2 items, $3 Quick Actions ✓" (3 placeholders: counts)
- **failedExportBackup**: "Failed to export backup"
- **exportedDataWithQA**: "Exported $1 items + $2 Quick Actions ✓" (2 placeholders: counts)
- **failedExportConfiguration**: "Failed to export configuration"

---

## AI FEATURES (ai-features.js)

### AI Configuration
- **aiFeaturesRequireConfiguration**: "AI features require API key configuration"
- **configureAPIKeysInSettings**: "Configure API keys in Settings → API Keys"
- **aiFeaturesNotAvailable**: "AI features not available"
- **aiFeaturesNotAvailableToolkitCoreMissing**: "AI features not available - ToolkitCore missing"

### AI Diagnostics
- **aiDiagnosticsOnlySAPDomains**: "AI Diagnostics only works on SAP domains"
- **navigateToSAPPage**: "Navigate to an SAP page to use diagnostics"
- **noResponseFromAI**: "No response from AI"
- **noReportContentToSave**: "No report content to save"
- **diagnosticsReportSavedAsNote**: "Diagnostics report saved as note ✓"
- **failedSaveReportAsNote**: "Failed to save report as note"
- **noReportContentToDownload**: "No report content to download"
- **failedLoadAIPromptConfiguration**: "Failed to load AI prompt configuration"

### AI Search
- **aiSearchComplete**: "AI search complete ✓"
- **pleaseEnterPromptContentFirst**: "Please enter prompt content first"
- **noteRefinerTemplateMissingRunningRawPrompt**: "Note refiner template missing - running raw prompt"
- **failedLoadPricingData**: "Failed to load pricing data"

### AI Response Management
- **noResponseContentToSave**: "No response content to save"
- **aiResponseSavedAsNote**: "AI response saved as note ✓"
- **noResponseContentToCopy**: "No response content to copy"
- **responseCopiedToClipboard**: "Response copied to clipboard ✓"
- **failedCopyResponse**: "Failed to copy response"
- **enterpriseCalculatorNotAvailable**: "Enterprise calculator not available"
- **projectionsCalculated**: "Projections calculated ✓"
- **reportExported**: "Report exported ✓"

### AI Shortcut Creation
- **noActiveTabFound**: "No active tab found"
- **cannotScrapeBrowserInternalPages**: "Cannot scrape browser internal pages"
- **aiShortcutCreationOnlySAPDomains**: "AI shortcut creation works best on SAP domains"
- **navigateToSAPPageForAIShortcut**: "Navigate to an SAP page for best results"
- **aiSummaryGenerated**: "✨ AI summary generated ✓"
- **aiShortcutCreationFailed**: "AI shortcut creation failed: $1" (1 placeholder: error)

### AI Downloads
- **downloadedAsFormat**: "Downloaded as $1 ✓" (1 placeholder: format like TXT/MD)
- **downloadFailed**: "Download failed"

---

## API KEY MANAGEMENT (side-panel.js)

### OpenAI
- **pleaseEnterAPIKeyFirst**: "Please enter an API key first"
- **testingOpenAIConnection**: "Testing OpenAI connection..."
- **openAIConnectionSuccessful**: "OpenAI connection successful ✓"
- **openAIConnectionFailed**: "OpenAI connection failed - check API key"
- **connectionTestFailed**: "Connection test failed"
- **openAIAPIKeyCleared**: "OpenAI API key cleared"

### Anthropic
- **testingAnthropicConnection**: "Testing Anthropic connection..."
- **anthropicConnectionSuccessful**: "Anthropic connection successful ✓"
- **anthropicConnectionFailed**: "Anthropic connection failed - check API key"
- **anthropicAPIKeyCleared**: "Anthropic API key cleared"

### SAP AI Core
- **connectingToSAPAICore**: "Connecting to SAP AI Core..."
- **pleaseFillInAllRequiredFields**: "Please fill in all required fields"
- **pleaseSelectDeployedModel**: "Please select a deployed model"
- **systemErrorToolkitCoreNotLoaded**: "System error: ToolkitCore not loaded. Try reloading the extension."
- **noDeployedModelsFoundInResourceGroup**: "No deployed models found in resource group"

### Max Tokens
- **maxTokensSet**: "Max tokens set to $1 ✓" (1 placeholder: token count)

---

## OSS NOTE SEARCH (side-panel.js)

- **pleaseEnterOSSNoteNumber**: "Please enter an OSS Note number"
- **invalidOSSNoteNumber**: "Invalid OSS Note number"
- **openingOSSNote**: "Opening OSS Note $1..." (1 placeholder: note number)
- **pleaseEnterOSSNoteNumberFirst**: "Please enter an OSS Note number first"
- **ossNoteURLCopied**: "OSS Note URL copied ✓"
- **failedCopyURL**: "Failed to copy URL"
- **ossNoteAddedAsShortcut**: "OSS Note $1 added as shortcut ✓" (1 placeholder: note number)
- **failedOpenOSSNote**: "Failed to open OSS Note"

---

## NAVIGATION (ui-render.js)

- **cannotNavigateNoActiveSFInstance**: "Cannot navigate: No active SF instance detected"
- **failedToNavigate**: "Failed to navigate"

---

## THEME MANAGEMENT (actions.js)

- **themeChanged**: "Theme: $1" (1 placeholder: theme name like Auto/Light/Dark)

---

## TRANSLATION GUIDELINES

### Placeholders
- `$1`, `$2`, `$3` represent dynamic values inserted at runtime
- **DO NOT translate placeholder markers** - keep as `$1`, `$2`, etc.
- Example: "Switched to $1 ✓" should become "Cambiado a $1 ✓" in Spanish

### Symbols & Emojis
- ✓ checkmark can be kept in all languages
- Emojis (⚡, 🌐, 📝, etc.) should be kept as-is
- Cmd/Ctrl keyboard shortcuts should be adapted to target OS conventions

### Technical Terms
- **API**, **JSON**, **URL**, **OSS Note** - keep in English
- **ToolkitCore**, **SAP AI Core** - keep as-is (product names)
- File formats (TXT, MD) - keep in English

### Tone
- Keep professional and concise
- Match the brevity of English messages
- Use formal "you" (usted/Sie/vous) for consistency

---

## CURRENT STATUS

✅ **Code Conversion**: Complete (all 6 JS files)
✅ **English Messages**: All keys defined in `_locales/en/messages.json`
⏳ **Translations**: Need translation for 9 languages

**Next Step**: Run translation agent to populate all language files with these ~140 keys.

---

## FILES CONVERTED

1. ✅ `panel/validation.js` - 10 validation error strings
2. ✅ `panel/main.js` - 3 initialization strings
3. ✅ `panel/actions.js` - 60 CRUD operation strings
4. ✅ `panel/ai-features.js` - 35 AI feature strings
5. ✅ `panel/side-panel.js` - 30 settings/modal strings
6. ✅ `panel/ui-render.js` - 2 navigation strings

---

## TESTING CHECKLIST

After translations are complete:

- [ ] Load extension in Chrome
- [ ] Switch to each language in chrome://extensions/ locale settings
- [ ] Verify all toast messages display correctly
- [ ] Check validation errors show translated text
- [ ] Test modal titles and buttons
- [ ] Verify no missing keys (should not show key names in UI)
- [ ] Check placeholder substitution works ($1, $2 replaced with actual values)

---

## LANGUAGE-SPECIFIC NOTES

### Japanese (ja)
- Consider particle usage for natural flow
- Honorific level: Keep neutral/polite
- Technical terms: Use katakana for API, URL, etc.

### German (de)
- Use formal "Sie" form
- Compound nouns: Follow German conventions
- Umlauts: Use proper characters (ä, ö, ü)

### French (fr)
- Use formal "vous" form
- Accents: Ensure proper é, è, ê, à usage
- Gender agreement for adjectives

### Spanish (es)
- Use formal "usted" form (Latin America neutral)
- Accents: Use proper á, é, í, ó, ú
- Keep concise (Spanish tends to be verbose)

### Chinese Simplified (zh_CN)
- Use simplified characters (not traditional)
- Keep technical terms in English where appropriate
- Character count will differ significantly

### Korean (ko)
- Use formal 합니다 form
- Keep technical terms in English/original
- Consider reading direction and length

### Dutch (nl)
- Use formal "u" form
- Similar to German but separate conventions

### Italian (it)
- Use formal "Lei" form
- Gender agreement important
- Accents: à, è, é, ì, ò, ù

### Portuguese - Brazil (pt_BR)
- Use Brazilian Portuguese (not European)
- Formal "você" (less formal than European Portuguese)
- Accents: á, â, ã, é, ê, í, ó, ô, õ, ú, ü, ç

---

## QUALITY ASSURANCE

### Translation Agent Validation

The translation agent should:
1. Preserve all placeholder markers (`$1`, `$2`, `$3`)
2. Maintain appropriate formality level
3. Keep technical terms in English when appropriate
4. Match message length/brevity of English
5. Test placeholder substitution in context
6. Verify no HTML/code injection in messages

### Human Review Recommendations

After agent translation:
- Native speakers should review for naturalness
- Test in actual UI context (not just JSON)
- Verify technical accuracy
- Check cultural appropriateness
- Confirm placeholder substitution works correctly

---

**End of Reference Document**
