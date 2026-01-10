# Side Panel Implementation Plan

## Overview
Converting SF Pro Toolkit from popup (380px) to side panel (420px) with configurable starter packs.

## Phase 1: Side Panel Conversion

### 1.1 Manifest Updates
- Add `side_panel` configuration
- Update permissions if needed
- Keep backward compatibility

### 1.2 File Structure
```
popup/
├── popup-redesign.html     (keep for backward compat)
├── popup-redesign.js       (keep for backward compat)
├── popup-redesign.css      (keep for backward compat)
├── side-panel.html         (NEW - 420px optimized)
├── side-panel.js           (NEW - enhanced functionality)
└── side-panel.css          (NEW - 420px styling)
```

### 1.3 Background Service Worker Updates
- Handle side panel open/close
- Maintain popup fallback for older Chrome versions

## Phase 2: Starter Packs System

### 2.1 Data Structure
```json
{
  "version": "1.0.0",
  "starter_packs": [
    {
      "id": "sf-safe-essentials",
      "solution": "successfactors",
      "name": "SF Verified Essentials",
      "description": "4 guaranteed-working shortcuts",
      "shortcuts": [...]
    }
  ]
}
```

### 2.2 URL Handling
- **Relative URLs**: Prepend current hostname
- **Absolute URLs**: Use as-is
- **Smart detection**: Automatically determine URL type

### 2.3 Import Functionality
- Modal UI for pack selection
- Duplicate detection
- Visual feedback on import success

## Phase 3: Enhanced Icon System

### 3.1 SVG Icon Library
- Replace emoji with professional SVG icons
- Gradient colors by category
- Consistent sizing (20px for shortcuts)

### 3.2 Category Colors
```
Admin:     Purple (#667eea → #5b4fc5)
Resources: Orange (#f59e0b → #d97706)
Community: Green (#10b981 → #059669)
```

## Verified URLs (4 Shortcuts)

1. **Admin Center** - `/sf/admin` (relative)
2. **SF Product Roadmap** - `https://roadmaps.sap.com/board?PRODUCT=...` (absolute)
3. **SF Help Portal** - `https://help.sap.com/docs/SAP_SUCCESSFACTORS_PLATFORM` (absolute)
4. **SF Community** - `https://community.sap.com/topics/successfactors` (absolute)

## Implementation Order

1. ✅ Create starter-packs.json with 4 verified URLs
2. ✅ Update manifest.json for side panel support
3. ✅ Create side-panel.html (420px optimized layout)
4. ✅ Create side-panel.css (enhanced spacing and styling)
5. ✅ Create side-panel.js (import functionality + smart URLs)
6. ✅ Update background.js (side panel handler)
7. ✅ Create SVG icon system
8. ✅ Test import workflow
9. ✅ Test URL navigation (relative + absolute)
10. ✅ Documentation

## Testing Checklist

- [ ] Side panel opens on icon click
- [ ] 420px width displays correctly
- [ ] Import modal shows starter pack
- [ ] Pack imports without duplicates
- [ ] Relative URLs navigate to current instance
- [ ] Absolute URLs open correctly
- [ ] SVG icons display with gradients
- [ ] External URL badge shows correctly

## Success Criteria

- Side panel replaces popup as primary interface
- Users can import 4 verified shortcuts in 2 clicks
- URL handling works for both relative and absolute paths
- Visual design is clean and professional at 420px width
- Zero URL failures (100% verified URLs)
