# SAP Pro Toolkit - Internationalization (i18n) Guide

## Overview

SAP Pro Toolkit now supports multiple languages through Chrome's built-in internationalization (i18n) system. The extension automatically detects the appropriate language based on:

1. **SF Page Language** (Priority 1) - Language from the SuccessFactors URL
2. **Browser Language** (Priority 2) - User's browser language setting

## Language Detection Logic

### Priority 1: SF Page URL Detection

The extension checks for language indicators in the SF page URL:

**Method 1: URL Parameter**
```
https://hcm-us20.hr.cloud.sap/sf/admin?locale=zh_CN
                                            ↑
                                    Detected: zh (Chinese)
```

**Method 2: URL Path**
```
https://hcm-us20.hr.cloud.sap/zh_CN/sf/admin
                                ↑
                        Detected: zh (Chinese)
```

### Priority 2: Browser Language

If no SF page language is detected, the extension uses the browser's language setting:

```javascript
navigator.language // e.g., 'en-US' → 'en'
                   //      'zh-CN' → 'zh'
```

## Supported Languages

Currently available (9 languages):
- **English (en)** - Default language
- **Chinese Simplified (zh_CN)** - 简体中文
- **German (de)** - Deutsch
- **French (fr)** - Français
- **Spanish (es)** - Español
- **Japanese (ja)** - 日本語
- **Korean (ko)** - 한국어
- **Portuguese Brazil (pt_BR)** - Português (Brasil)
- **Italian (it)** - Italiano
- **Dutch (nl)** - Nederlands

## Adding New Languages

To add support for a new language:

### 1. Create Language Directory

Create a new directory in `_locales/` with the language code:

```
_locales/
├── en/           # English (default)
├── zh_CN/        # Chinese Simplified
└── [new_lang]/   # Your new language
```

**Common language codes:**
- `de` - German
- `fr` - French
- `es` - Spanish
- `ja` - Japanese
- `ko` - Korean
- `pt_BR` - Portuguese (Brazil)
- `it` - Italian
- `nl` - Dutch

### 2. Copy messages.json Template

Copy the English `messages.json` file as a starting point:

```bash
cp _locales/en/messages.json _locales/[new_lang]/messages.json
```

### 3. Translate All Messages

Edit the new `messages.json` file and translate each message:

```json
{
  "extName": {
    "message": "Your translation here",
    "description": "Name of the extension"
  },
  "extDescription": {
    "message": "Your translation here",
    "description": "Description of the extension"
  },
  ...
}
```

**Translation Guidelines:**
- Keep the same JSON structure
- Translate only the `"message"` field values
- Keep `"description"` fields in English (for developers)
- Maintain consistency with SF terminology
- Test translations in context

### 4. Test Your Translation

1. Change your browser language to the new language
2. Reload the extension
3. Open the popup and verify all text is translated
4. Check that modals, tooltips, and placeholders are correct

## Translation Keys Reference

### Main UI Elements

| Key | English | Purpose |
|-----|---------|---------|
| `headerTitle` | SAP Pro Toolkit | Main header title |
| `switchEnvironmentTitle` | Switch Environment | Environment section |
| `shortcutsTitle` | Shortcuts | Shortcuts section |
| `notesTitle` | Notes | Notes section |
| `diagnosticsTitle` | System Diagnostics | Diagnostics section |

### Buttons & Actions

| Key | English | Purpose |
|-----|---------|---------|
| `addCurrentInstance` | Add Current Instance | Add environment button |
| `addEnvironment` | Add Environment | Add environment button |
| `addCurrentPage` | Add Current Page | Add shortcut from current page |
| `editSelected` | Edit Selected | Edit button tooltip |
| `deleteSelected` | Delete Selected | Delete button tooltip |
| `switchButton` | Switch | Switch environment button |
| `cancel` | Cancel | Cancel button |
| `close` | Close | Close button |

### Form Labels

| Key | English | Purpose |
|-----|---------|---------|
| `environmentName` | Environment Name | Environment name field |
| `environmentType` | Environment Type | Environment type field |
| `hostname` | Hostname | Hostname field |
| `shortcutName` | Name | Shortcut name field |
| `shortcutUrl` | URL | Shortcut URL field |
| `shortcutNotes` | Notes (optional) | Shortcut notes field |
| `shortcutIcon` | Icon | Shortcut icon field |
| `noteTitle` | Title | Note title field |
| `noteContent` | Content | Note content field |
| `noteColor` | Color | Note color field |

### Environment Types

| Key | English | Purpose |
|-----|---------|---------|
| `environmentTypeProduction` | Production | Production environment |
| `environmentTypePreview` | Preview | Preview environment |
| `environmentTypeSales` | Sales/Demo | Sales/Demo environment |
| `environmentTypeSandbox` | Sandbox | Sandbox environment |

### Note Colors

| Key | English | Purpose |
|-----|---------|---------|
| `noteColorYellow` | Yellow | Yellow note |
| `noteColorBlue` | Blue | Blue note |
| `noteColorGreen` | Green | Green note |
| `noteColorPink` | Pink | Pink note |
| `noteColorOrange` | Orange | Orange note |

## Technical Implementation

### How i18n Works

1. **Manifest Configuration**
```json
{
  "name": "__MSG_extName__",
  "description": "__MSG_extDescription__",
  "default_locale": "en"
}
```

2. **HTML Attributes**
```html
<!-- Text content -->
<h1 data-i18n="headerTitle">SAP Pro Toolkit</h1>

<!-- Tooltip/title -->
<button data-i18n-title="helpBtn">❓</button>

<!-- Placeholder -->
<input data-i18n-placeholder="shortcutNamePlaceholder" 
       placeholder="e.g., Admin Center">
```

3. **JavaScript Initialization**
```javascript
function initI18n() {
  // Apply translations to text content
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = chrome.i18n.getMessage(key);
  });
  
  // Apply translations to title attributes
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    element.title = chrome.i18n.getMessage(key);
  });
  
  // Apply translations to placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = chrome.i18n.getMessage(key);
  });
}
```

### Language Detection Flow

```
1. Extension loads
   ↓
2. detectLanguage() runs
   ↓
3. Check SF URL for locale parameter (?locale=zh_CN)
   ↓
4. Check SF URL path for locale (/zh_CN/)
   ↓
5. Fall back to browser language (navigator.language)
   ↓
6. Store detected language in chrome.storage.local
   ↓
7. initI18n() applies translations using chrome.i18n.getMessage()
```

## Best Practices

### For Translators

1. **Use Native Speakers**: Always have translations reviewed by native speakers
2. **Context Matters**: Understand where the text appears in the UI
3. **Consistent Terminology**: Use consistent terms throughout (e.g., always translate "Environment" the same way)
4. **Test In Context**: View translations in the actual extension UI
5. **Consider Length**: Some languages are more verbose - ensure text fits in UI

### For Developers

1. **Always Use Keys**: Never hardcode UI text - use i18n keys
2. **Descriptive Keys**: Use clear, descriptive key names (e.g., `addEnvironmentTitle` not `title1`)
3. **Add Comments**: Include helpful descriptions in messages.json
4. **Test Multiple Languages**: Test with at least 2 languages before release
5. **Fallback Text**: Include default text in HTML for before i18n loads

## SuccessFactors Language Codes

Common SF locale parameters:

| Locale | Language | Region |
|--------|----------|--------|
| `en_US` | English | United States |
| `zh_CN` | Chinese | China (Simplified) |
| `zh_TW` | Chinese | Taiwan (Traditional) |
| `ja_JP` | Japanese | Japan |
| `ko_KR` | Korean | South Korea |
| `de_DE` | German | Germany |
| `fr_FR` | French | France |
| `es_ES` | Spanish | Spain |
| `pt_BR` | Portuguese | Brazil |
| `it_IT` | Italian | Italy |
| `nl_NL` | Dutch | Netherlands |
| `pl_PL` | Polish | Poland |
| `ru_RU` | Russian | Russia |
| `tr_TR` | Turkish | Turkey |
| `ar_SA` | Arabic | Saudi Arabia |

## Debugging i18n

### View Detected Language

Check browser console for these logs:
```
[SAP Pro Toolkit] Language detected from URL locale parameter: zh
[SAP Pro Toolkit] Language detected from URL path: zh
[SAP Pro Toolkit] Using browser language: en
[SAP Pro Toolkit] Detected language: en
```

### Check Translation Loading

Test if translations load correctly:
```javascript
// In browser console
chrome.i18n.getMessage('headerTitle')
// Should return translated text
```

### Common Issues

**Problem**: Translations not appearing
- Check `default_locale` is set in manifest.json
- Verify messages.json file exists in correct directory
- Ensure JSON is valid (no syntax errors)
- Check key names match exactly

**Problem**: Wrong language displayed
- Check browser language setting
- Verify SF URL has correct locale parameter
- Check console logs for detected language

## Future Enhancements

Planned i18n improvements:

1. **User Language Override**: Allow users to manually select language in settings
2. **More Languages**: Add German, French, Spanish, Japanese based on demand
3. **Dynamic Content**: Translate dynamically generated content (modals, toasts)
4. **Date/Time Localization**: Format dates according to locale preferences
5. **RTL Support**: Add right-to-left language support (Arabic, Hebrew)

## Contributing Translations

To contribute a translation:

1. Fork the repository
2. Create new `_locales/[lang_code]/messages.json`
3. Translate all message values
4. Test the translation in the extension
5. Submit a pull request with:
   - Translation file
   - Screenshots showing translated UI
   - Native speaker verification

## Resources

- [Chrome i18n Documentation](https://developer.chrome.com/docs/extensions/reference/i18n/)
- [Chrome Supported Locales](https://developer.chrome.com/docs/webstore/i18n/#choosing-locales-to-support)
- [ISO 639-1 Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)

---

**Last Updated**: January 10, 2026  
**Extension Version**: 1.1.0+
