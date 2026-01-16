# Coding Standards Now Global

**Date**: 2026-01-16

## Status: ✅ Global Rule Active

The comprehensive `coding.md` file created from the 4-hour section toggle bug fix has been copied to the **global Cline rules directory**.

### Location

- **Project-specific**: `.clinerules/coding.md` (this project only)
- **Global**: `~/Documents/Cline/Rules/coding.md` (applies to ALL projects)

### What This Means

The coding standards and debugging protocols will now be enforced across **all projects** where Cline is used, not just this Chrome extension project.

### Key Standards Now Global

1. **🚨 Event Listener Management Protocol**
   - Mandatory diagnostic checklist before modifying listeners
   - Clone-before-attach pattern to prevent duplicate listeners
   - Re-initialization after DOM manipulation

2. **🔍 Duplicate Code Prevention**
   - Grep commands to find existing implementations
   - Anti-patterns to avoid

3. **🎨 CSS Duplication Prevention**
   - CSS variable enforcement
   - Component-based architecture

4. **🐛 Systematic Debugging Protocol**
   - 30 minutes diagnosis before fixes
   - Full scenario test matrix
   - Multiple root cause consideration

5. **📏 Code Quality Standards**
   - File size limits (1,000 lines)
   - Function complexity (50 lines max)
   - Error handling requirements
   - Memory management
   - Performance optimization

6. **✅ Pre-Commit Checklist**
   - Security checks
   - Duplication checks
   - Testing requirements

### Benefits

- **Consistency**: Same high standards across all projects
- **Time Savings**: Prevents 4+ hour debugging sessions like this one
- **Quality**: Enforces best practices automatically
- **Knowledge Transfer**: Lessons learned in one project benefit all projects

### File Size

- **19,310 bytes** (19.3 KB)
- **600+ lines** of comprehensive guidance
- Transformed from original 4-line rule

### Updates

Any updates to `.clinerules/coding.md` in this project should also be copied to the global directory to keep standards in sync.

```bash
# To update global rule from project-specific rule:
cp .clinerules/coding.md ~/Documents/Cline/Rules/coding.md
```

---

**Related Documentation:**
- `.clinerules/coding.md` - Project-specific copy
- `SECTION-TOGGLE-FIX-COMPLETE.md` - The bug that inspired these standards
- `~/Documents/Cline/Rules/coding.md` - Global rule for all projects
