# Coding Standards & Best Practices

**Last Updated**: 2026-01-18  
**Purpose**: Prevent hasty fixes, enforce systematic debugging, comprehensive QA, and maintain code quality

---

## Core Principles

1. **Second-Order Impact Analysis**: ALWAYS analyze cross-file impact BEFORE writing ANY code
2. **Comprehensive QA**: Test changes across entire project, not just modified files
3. **Modularity and Code Reuse**: Always check for existing implementations before writing new code
4. **Security**: This is a Manifest V3 Chrome extension - understand CSP, XSS, and security implications
5. **Consistency**: Reuse existing CSS styles, components, and patterns
6. **Systematic Debugging**: Invest 30 minutes in diagnosis to save 3+ hours of wrong fixes

---

## 🎯 SECOND-ORDER IMPACT ANALYSIS (NEW - CRITICAL)

### The Icon Fix Lesson: Hidden Ripple Effects (2026-01-18)

**What happened**: Fixed icon URI format in 3 files, but didn't check OTHER profile JSONs for same issue.

**Discovery**: After "completing" the fix, found 8 additional profile JSONs with invalid icon IDs (numeric values, "rocket", "pricing").

**Why it matters**: A "complete" fix that only addresses visible symptoms creates technical debt and inconsistent behavior across the system.

---

### MANDATORY: Before Writing ANY Code

**Cross-File Impact Checklist (DO NOT SKIP!):**

```bash
# 1. Find ALL files that use the same data structure/pattern
grep -rn "pattern\|field\|function" --include="*.js" --include="*.json" .

# 2. Find ALL files that depend on the change you're making
grep -rn "functionName\|variableName\|constantName" --include="*.js" .

# 3. Check ALL similar files (e.g., if fixing one JSON, check all JSONs)
find resources -name "*.json" -type f

# 4. Search for the same pattern across the entire project
grep -rn "icon.*:" --include="*.json" resources/

# 5. Identify integration points (who calls this? who depends on this?)
grep -rn "yourFunction\|yourVariable" --include="*.js" .
```

**Answer these questions:**
- [ ] What OTHER files use this same pattern/structure?
- [ ] What OTHER components depend on this change?
- [ ] What SIDE EFFECTS might this change cause?
- [ ] What DATA might be affected by this change?
- [ ] What USER WORKFLOWS might break from this change?

**Time Investment**: 15-20 minutes of impact analysis prevents days of bug hunting

---

### ✅ CORRECT: Second-Order Impact Analysis Example

**Scenario**: Fixing icon URI format issue

```
Primary Change:
├─> panel/state.js (DEFAULT_ICONS)
├─> resources/starter-profile.json (icon values)
└─> panel/toolkit-core.js (rendering)

Second-Order Impact Analysis:
├─> Are there OTHER profile JSONs? 
│   └─> YES: 8 more profile JSONs exist
│       └─> Check: Do they have same icon format issue?
│           └─> FOUND: All 8 have invalid icon IDs!
│
├─> Does this affect icon picker?
│   └─> Check: panel/icon-picker.js integration
│       └─> VERIFIED: Picker returns library IDs (correct)
│
├─> Does this affect rendering in OTHER places?
│   └─> Check: All renderX() functions
│       └─> VERIFIED: All use window.renderSAPIcon() (centralized)
│
└─> Does this affect user data?
    └─> Check: Migration logic in load functions
        └─> VERIFIED: Applies DEFAULT_ICONS to migrated data (correct)
```

**Result**: Discovered 8 additional files needing fixes BEFORE claiming "done"

---

### ❌ WRONG: Fixing in Isolation

```
1. See bug in file A
2. Fix file A
3. Test file A works
4. Commit → "Fixed!" ❌

Missing:
- Didn't check if files B, C, D have same issue
- Didn't verify integration with files E, F, G
- Didn't test full user workflows
- Created inconsistent system (1 file fixed, 8 broken)
```

**Result**: Incomplete fix, technical debt, inconsistent behavior

---

## 🔍 COMPREHENSIVE QA PROTOCOL (NEW - MANDATORY)

### The Icon Fix QA Lesson (2026-01-18)

After implementing ANY code change, you MUST perform comprehensive QA:

---

### Phase 1: MODIFIED FILES VERIFICATION (5 checks)

**Check 1: Syntax Validation**
```bash
# JavaScript files
node --check panel/your-file.js

# JSON files  
python3 -m json.tool resources/your-file.json > /dev/null

# CSS files (visual inspection)
# Look for: missing semicolons, unclosed brackets, invalid properties
```

**Check 2: Data Consistency**
```bash
# If you changed a data format, verify ALL occurrences
grep -rn "yourDataField" --include="*.json" resources/

# If you changed a constant, verify ALL references
grep -rn "YOUR_CONSTANT" --include="*.js" .
```

**Check 3: Integration Points**
```bash
# Find ALL functions that call your modified function
grep -rn "yourModifiedFunction()" --include="*.js" .

# Find ALL places that read your modified data
grep -rn "yourDataStructure\." --include="*.js" .
```

**Check 4: Function Signature Changes**
```bash
# If you changed parameters, find ALL call sites
grep -rn "yourFunction(" --include="*.js" .

# Verify all calls pass correct number/type of parameters
```

**Check 5: Breaking Changes**
- [ ] Does old data format still work? (backward compatibility)
- [ ] Are there migration paths for existing users?
- [ ] Will this break any external dependencies?

---

### Phase 2: CROSS-FILE REGRESSION TESTING (4 checks)

**Check 1: Similar Files**
```bash
# If you modified a JSON, check ALL JSONs for consistency
find resources -name "*.json" -type f

# If you modified a component, check similar components
find panel -name "*-component.js" -type f
```

**Check 2: Data Flow End-to-End**
```
Storage → Load → Process → Render → Display
  ↓        ↓        ↓         ↓        ↓
[Test each step individually]
```

**Example for Icon System**:
```bash
# 1. Storage: Check all profile JSONs
grep '"icon":' resources/*.json

# 2. Load: Verify migration logic
grep -A 10 "iconType" panel/state.js

# 3. Render: Check rendering calls
grep "renderSAPIcon" panel/ui-render.js

# 4. Display: Test in browser (visual verification)
```

**Check 3: Feature Interactions**
- [ ] Does Feature A still work after changing Feature B?
- [ ] Do modals/dropdowns/tooltips still function?
- [ ] Do keyboard shortcuts still work?
- [ ] Does profile switching preserve state?

**Check 4: Edge Cases**
- [ ] Empty state (no data)
- [ ] Large datasets (100+ items)
- [ ] Rapid interactions (spam clicks)
- [ ] Invalid/missing data fields
- [ ] Browser compatibility (Chrome, Edge)

---

### Phase 3: FULL PROJECT SCAN (3 checks)

**Check 1: Pattern Consistency**
```bash
# Find ALL instances of the pattern you changed
grep -rn "yourPattern" --include="*.js" --include="*.json" .

# Verify consistency (are some files using old pattern?)
# Example: Icon format
grep -rn '"icon":' resources/*.json | grep -v "ai\|note\|link\|folder"
```

**Check 2: Unused Code Detection**
```bash
# After refactoring, check for orphaned code
grep -rn "oldFunctionName" --include="*.js" .

# Should return 0 results if properly refactored
```

**Check 3: Documentation Sync**
```bash
# Verify docs match code reality
# Check: README.md, CHANGELOG.md, technical docs
# Look for outdated examples, incorrect function signatures
```

---

### Phase 4: USER JOURNEY TESTING (5 scenarios)

**Scenario 1: Fresh Install**
- [ ] Extension loads without errors
- [ ] Default data populates correctly
- [ ] All features accessible

**Scenario 2: Existing User (Migration)**
- [ ] Old data migrates successfully
- [ ] No data loss
- [ ] Icons/functionality preserved

**Scenario 3: Full CRUD Cycle**
- [ ] Create new item → Works
- [ ] Edit item → Works  
- [ ] Delete item → Works
- [ ] List updates correctly

**Scenario 4: Context Switching**
- [ ] Switch profiles → Works
- [ ] Switch environments → Works
- [ ] Data persists correctly

**Scenario 5: Error Handling**
- [ ] Invalid input handled gracefully
- [ ] Network errors don't crash extension
- [ ] Storage errors show user-friendly messages

---

## 📊 QA CHECKLIST TEMPLATE

Copy this checklist before EVERY code change:

```markdown
## Pre-Code Analysis
- [ ] Mapped full code flow (entry → processing → output)
- [ ] Identified ALL files using this pattern/structure
- [ ] Listed ALL functions that depend on this change
- [ ] Analyzed second-order impacts (ripple effects)
- [ ] Checked for similar code patterns in other files

## Implementation
- [ ] Code written following established patterns
- [ ] No duplicate code introduced
- [ ] Proper error handling added
- [ ] Comments/documentation added

## Modified Files QA (5 checks)
- [ ] Syntax validation (no parse errors)
- [ ] Data consistency verified
- [ ] Integration points tested
- [ ] Function signatures correct
- [ ] Backward compatibility maintained

## Cross-File Regression (4 checks)
- [ ] Similar files checked for consistency
- [ ] Data flow tested end-to-end
- [ ] Feature interactions verified
- [ ] Edge cases tested

## Full Project Scan (3 checks)
- [ ] Pattern consistency across project
- [ ] No orphaned code remaining
- [ ] Documentation synced with code

## User Journey Testing (5 scenarios)
- [ ] Fresh install tested
- [ ] Existing user migration tested
- [ ] Full CRUD cycle tested
- [ ] Context switching tested
- [ ] Error handling tested

## Pre-Commit Final Check
- [ ] Security audit passed (/security)
- [ ] No console errors
- [ ] CHANGELOG.md updated
- [ ] All tests passed
```

---

## 🚨 LESSONS FROM REAL BUGS

### Bug 1: Section Toggle (2026-01-16) - 4 hours wasted
**Mistake**: Hasty fix, tested only initial load
**Lesson**: Test full lifecycle, not just happy path

### Bug 2: Icon URI Format (2026-01-18) - Incomplete fix
**Mistake**: Fixed 3 files, didn't check 8 other profile JSONs
**Lesson**: Always scan for pattern across ENTIRE project

**Combined Lesson**: 
- 30 minutes of diagnosis + 20 minutes of impact analysis = 50 minutes
- Saves 4+ hours of wrong fixes + days of bug reports
- **ROI: 5-10x time savings**

---

## 🚨 EVENT LISTENER MANAGEMENT PROTOCOL

### The 4-Hour Bug Lesson: Section Toggle Fix (2026-01-16)

**What happened**: Section collapse/expand buttons didn't respond to clicks. Took 4+ hours and 3 attempts to fix.

**Root causes**:
1. Duplicate listeners accumulating (called initialization multiple times)
2. DOM destruction losing listeners (innerHTML destroyed elements without re-attaching)

**Why it took so long**: Hasty fixes that only addressed ONE root cause and only tested initial page load.

---

### MANDATORY: Before Adding/Modifying Event Listeners

**Diagnostic Checklist (DO NOT SKIP!):**

```bash
# 1. Find ALL places where this listener is attached
grep -rn "addEventListener.*yourElement" --include="*.js" .

# 2. Find ALL places where this element's DOM is destroyed/recreated
grep -rn "innerHTML\s*=" --include="*.js" panel/

# 3. Find ALL places where initialization function is called
grep -rn "initializeYourFeature()" --include="*.js" .

# 4. Check for duplicate function definitions
grep -rn "function.*yourFunction\|window\.yourFunction" --include="*.js" .
```

**Answer these questions:**
- [ ] Where are listeners attached? (Which function?)
- [ ] When are they attached? (Initial load, profile switch, after render?)
- [ ] When is DOM destroyed? (Which render functions use innerHTML?)
- [ ] Are listeners re-attached after DOM destruction? (If not → BUG!)
- [ ] Is initialization called multiple times? (If yes, duplicates will accumulate!)

**Time Investment**: 30 minutes of diagnosis saves 3+ hours of wrong fixes

---

### ✅ CORRECT Pattern: Clone-Before-Attach

**Always remove old listeners before attaching new ones:**

```javascript
window.initializeFeature = function() {
  // STEP 1: Remove ALL existing listeners by cloning elements
  document.querySelectorAll('.my-button').forEach(btn => {
    const newBtn = btn.cloneNode(true);  // Fresh copy, NO listeners
    btn.parentNode.replaceChild(newBtn, btn);  // Replace old with new
  });
  
  // STEP 2: NOW attach fresh listeners (guaranteed no duplicates)
  document.querySelectorAll('.my-button').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await handleClick(e);
    });
  });
}
```

**Why cloning works:**
- `cloneNode(true)` creates a fresh copy with NO event listeners
- Replacing old element removes ALL old listeners at once
- More reliable than `removeEventListener` (which requires exact function reference)

---

### ❌ WRONG Pattern: Direct Attachment

```javascript
// ❌ BAD: Called multiple times = duplicate listeners accumulate!
window.initializeFeature = function() {
  document.querySelectorAll('.my-button').forEach(btn => {
    btn.addEventListener('click', handler);  // ❌ Adds another listener each call!
  });
}
```

**Result**: Button has 3-5+ click handlers → race conditions, weird behavior

---

### 🔄 Re-initialization After DOM Manipulation

**CRITICAL RULE**: If you use `innerHTML = ...`, you MUST re-attach listeners afterward!

```javascript
window.renderSomething = function() {
  const tbody = document.getElementById('myTable');
  
  // This DESTROYS all existing DOM elements and their event listeners!
  tbody.innerHTML = newHTML;  // ⚠️ Listeners are GONE now!
  
  // Attach listeners to row elements
  attachRowListeners();
  
  // MANDATORY: Re-initialize global feature listeners
  if (window.initializeFeature) {
    window.initializeFeature();  // ✅ Restores section toggles, etc.
  }
}
```

**Why this matters:**
- `innerHTML = ...` creates NEW DOM elements
- Old elements (with listeners) are destroyed
- New elements have NO listeners
- Must explicitly re-attach listeners to new elements

---

### Event Listener Lifecycle Example

```
✅ CORRECT Lifecycle:

1. Initial Page Load
   └─> render functions create DOM
   └─> initializeFeature() attaches listeners (via cloning)
   ✅ Buttons work

2. User Saves Item
   └─> renderItems() destroys/recreates DOM (innerHTML)
   └─> initializeFeature() called at end of render
   └─> Buttons cloned (removes stale listeners)
   └─> Fresh listeners attached
   ✅ Buttons still work

3. User Switches Profile
   └─> Multiple render functions called
   └─> Each calls initializeFeature()
   └─> Each call clones first (no accumulation)
   └─> Fresh listeners attached
   ✅ Buttons still work
```

---

## 🔍 DUPLICATE CODE PREVENTION

### CRITICAL: Always Check for Duplicates Before Adding Code

**The Duplicate Code Bug Pattern** (2026-01-16):
- **Bug**: Local function definitions in `side-panel.js` duplicated centralized window-level functions from modular files
- **Impact**: Caused confusion, maintenance overhead, and potential inconsistencies
- **Root Cause**: Not checking for existing implementations before writing new code

### Before Writing ANY Function

**Search for existing implementations:**

```bash
# Search for similar function names
grep -rn "function.*functionName\|window\.functionName" --include="*.js" .

# Search for similar logic patterns
grep -rn "querySelector.*toggle\|classList.*add" --include="*.js" .

# Find functions that do similar things
grep -rn "addEventListener.*click" --include="*.js" panel/

# Check if function already exists as window-level export
grep -rn "window\.functionName\s*=" --include="*.js" .
```

**If found**: Reuse or refactor into shared utility, don't duplicate!

### Duplicate Prevention Checklist

Before adding any function, verify:
- [ ] Function doesn't already exist in modular files (state.js, ui-render.js, actions.js)
- [ ] Similar functionality not available via window.* exports
- [ ] No conflicting implementations across files
- [ ] If modifying existing function, update in ONE canonical location only

### Where Functions Should Live

**Modular Architecture**:
```
panel/state.js       → State management (load/set functions for data)
panel/ui-render.js   → Rendering functions (render* functions for UI)
panel/actions.js     → CRUD operations (save/edit/delete functions)
panel/main.js        → Initialization and event wiring
panel/side-panel.js  → Should ONLY wire up events, NOT define functions
```

**Golden Rule**: `side-panel.js` should use `window.functionName()`, never define new implementations

---

### Common Duplication Anti-Patterns

#### ❌ Same Function in Multiple Files

```javascript
// ❌ BAD: loadShortcuts() in both state.js AND side-panel.js
// panel/state.js
window.loadShortcuts = async function() { /* ... */ }

// panel/side-panel.js  
async function loadShortcuts() { /* ... */ }  // ❌ LOCAL DUPLICATE!
```

**Solution**: Keep ONE canonical version in modular file, remove local duplicates

```javascript
// ✅ GOOD: Single source of truth in state.js
// panel/state.js
window.loadShortcuts = async function() { /* ... */ }

// panel/side-panel.js
// Use window.loadShortcuts() - no local definition needed!
document.addEventListener('DOMContentLoaded', async () => {
  await window.loadShortcuts();  // ✅ Uses centralized version
});
```

#### ❌ Missing Duplicate Checks in CRUD Operations

```javascript
// ❌ BAD: No duplicate check before saving
window.saveShortcut = async function() {
  const url = document.getElementById('shortcutPath').value.trim();
  
  // Missing: Check if shortcut with this URL already exists!
  const newShortcut = { id: `shortcut-${Date.now()}`, url, name };
  // ... save logic
}
```

**Solution**: Always check for duplicates based on unique identifier

```javascript
// ✅ GOOD: Prevent duplicates with explicit check
window.saveShortcut = async function() {
  const url = document.getElementById('shortcutPath').value.trim();
  const editId = modal.getAttribute('data-edit-id');
  
  // DUPLICATE CHECK: Prevent duplicate shortcuts by URL
  const duplicateShortcut = window.shortcuts.find(s => s.url === url && s.id !== editId);
  if (duplicateShortcut) {
    if (window.showToast) window.showToast(`Shortcut already exists: "${duplicateShortcut.name}"`, 'warning');
    return;
  }
  
  // ... save logic
}
```

**Duplicate Check Pattern for All CRUD Operations**:
```javascript
// Environments: Check by hostname (unless editing same environment)
const duplicate = window.environments.find(e => e.hostname === hostname && e.id !== editId);

// Shortcuts: Check by URL (unless editing same shortcut)
const duplicate = window.shortcuts.find(s => s.url === url && s.id !== editId);

// Notes: Check by title (unless editing same note) - optional, allow duplicate titles
// const duplicate = window.notes.find(n => n.title === title && n.id !== editId);
```

---

#### ❌ Repeated Event Attachment Logic

```javascript
// ❌ BAD: Same addEventListener pattern in 5 functions
function initButtons1() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', handler1);
  });
}

function initButtons2() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', handler2);
  });
}
```

**Solution**: Extract to reusable function

```javascript
// ✅ GOOD: Reusable attachment function
function attachListeners(selector, event, handler) {
  document.querySelectorAll(selector).forEach(el => {
    el.addEventListener(event, handler);
  });
}

function initButtons1() {
  attachListeners('.btn', 'click', handler1);
}

function initButtons2() {
  attachListeners('.btn', 'click', handler2);
}
```

---

## 🎨 CSS DUPLICATION PREVENTION

### Before Adding CSS

**Check for existing styles:**

```bash
# Search for similar class names
grep -rn "\.btn-" --include="*.css" panel/styles/

# Search for similar properties
grep -rn "border-radius:\s*6px" --include="*.css" panel/styles/

# Find color definitions (should use CSS variables!)
grep -rn "#[0-9A-Fa-f]{6}" --include="*.css" panel/styles/

# Search for specific selectors
grep -rn "\.modal\|\.section-toggle" --include="*.css" panel/styles/
```

---

### CSS Architecture Rules

#### ✅ DO:

1. **Use CSS Variables** (defined in `panel/styles/variables.css`)
   ```css
   /* ✅ GOOD */
   .my-button {
     background: var(--primary-color);
     border: 1px solid var(--border);
   }
   
   /* ❌ BAD */
   .my-button {
     background: #007bff;  /* Hardcoded color! */
     border: 1px solid #ddd;
   }
   ```

2. **Follow Component Structure**
   - Buttons → `panel/styles/components/buttons.css`
   - Modals → `panel/styles/components/modals.css`
   - Tables → `panel/styles/components/tables.css`
   - Features → `panel/styles/features/[feature-name].css`

3. **Reuse Existing Classes**
   ```html
   <!-- ✅ GOOD: Reuse existing button classes -->
   <button class="btn btn-primary">Save</button>
   <button class="icon-btn">⚙️</button>
   
   <!-- ❌ BAD: Creating new button style -->
   <button class="my-custom-button">Save</button>
   ```

#### ❌ DON'T:

1. **Inline Styles in JavaScript** (except for dynamic values like `top: ${y}px`)
   ```javascript
   // ❌ BAD
   element.style.color = '#007bff';
   element.style.padding = '12px';
   
   // ✅ GOOD
   element.classList.add('btn-primary');
   ```

2. **Duplicate Color Values**
   ```css
   /* ❌ BAD: Same color repeated in 5 files */
   .header { background: #007bff; }
   .button { background: #007bff; }
   .badge { background: #007bff; }
   
   /* ✅ GOOD: Use CSS variable */
   :root {
     --primary-color: #007bff;
   }
   .header { background: var(--primary-color); }
   .button { background: var(--primary-color); }
   .badge { background: var(--primary-color); }
   ```

3. **Create New Button Styles Without Checking Existing**
   - Always check `panel/styles/components/buttons.css` first
   - Existing: `.btn`, `.btn-primary`, `.btn-secondary`, `.icon-btn`, `.btn-sm`

---

## 🐛 SYSTEMATIC DEBUGGING PROTOCOL

### The Golden Rule: Diagnosis BEFORE Fixes

**Time Investment**: 30 minutes of systematic diagnosis saves 3+ hours of wrong fixes

---

### Phase 1: DIAGNOSIS (Mandatory - DO NOT Skip to Fixes!)

#### Step 1: Reproduce in ALL Scenarios

**Test Matrix:**
- [ ] Initial page load
- [ ] After save operation
- [ ] After edit operation
- [ ] After delete operation
- [ ] After profile/context switch
- [ ] After search/filter
- [ ] After import/export
- [ ] Edge cases (rapid clicks, multiple simultaneous actions)

**Critical Question**: "Why works in scenario A but fails in scenario B?"

---

#### Step 2: Map the Code Flow

```bash
# Find where feature is initialized
grep -rn "initializeFeature" --include="*.js" .

# Find where it's called
grep -rn "initializeFeature()" --include="*.js" .

# Find where DOM is manipulated
grep -rn "innerHTML\|appendChild\|replaceChild" --include="*.js" .

# Find related functions
grep -rn "function.*related" --include="*.js" .
```

**Create a flow diagram:**
```
User Action → Function A → Modifies DOM → Function B → Should trigger?
                                            ↓
                                        ❌ Doesn't work here!
```

---

#### Step 3: Identify MULTIPLE Root Causes

**Don't assume single cause!** The section toggle bug had TWO:
1. Duplicate listeners accumulating
2. DOM destruction losing listeners

**Ask diagnostic questions:**
- Why does it work initially but fail after CRUD operation?
- Why does it work for one section but not another?
- Are there multiple code paths that could cause this?
- Is the issue timing-related or logic-related?

---

#### Step 4: Use Browser DevTools

```javascript
// Check listener count (paste in console)
const btn = document.querySelector('.my-button');
console.log(getEventListeners(btn));  // Chrome DevTools only

// Monitor when DOM changes
const observer = new MutationObserver(() => {
  console.log('DOM changed!');
});
observer.observe(document.body, { childList: true, subtree: true });
```

---

### Phase 2: TEST MATRIX (Before Claiming "Fixed!")

**Required Test Scenarios:**
- [ ] Initial load works
- [ ] Still works after save operation
- [ ] Still works after edit operation
- [ ] Still works after delete operation
- [ ] Still works after context switch
- [ ] Still works after rapid repeated actions
- [ ] Still works after all edge cases

#### ❌ WRONG: "Works on initial load → Ship it!"

This is what caused 3 failed fix attempts. First two fixes worked on initial load but broke after CRUD operations.

#### ✅ CORRECT: Test Full User Journey

```
1. Load extension ✅
2. Click toggle button → Works ✅
3. Save an item
4. Click toggle button again → Still works? ✅
5. Switch profile
6. Click toggle button again → Still works? ✅
7. Rapid click 10 times → No weird behavior? ✅
```

**Only claim "fixed" when ALL scenarios pass!**

---

### Common Debugging Mistakes

#### ❌ Mistake 1: Not Tracing Full Lifecycle
- Focused on initialization only
- Didn't consider what happens AFTER renders
- Missed that innerHTML destroys listeners

#### ❌ Mistake 2: Testing Only Happy Path
- Tested initial page load only
- Didn't test CRUD operations
- Didn't test context switches

#### ❌ Mistake 3: Not Finding ALL Call Sites
- Fixed initialization in main.js
- Missed that render functions also need fixes
- Didn't grep for all related code

#### ❌ Mistake 4: Surface-Level Diagnosis
- "Buttons don't work" → assumed single cause
- Didn't ask WHY scenario A works but B fails
- Rushed to "fix" without understanding root cause

---

## 📏 CODE QUALITY STANDARDS

### File Size Management

**When to split a file:**
- File exceeds 1,000 lines
- File has multiple unrelated responsibilities
- File is difficult to navigate

**How to split:**
```javascript
// ❌ BAD: 3,000-line monolithic file
// panel/everything.js

// ✅ GOOD: Split by responsibility
// panel/actions.js (CRUD operations)
// panel/ui-render.js (Rendering functions)
// panel/state.js (State management)
```

---

### Function Complexity

**Rules:**
- Maximum 50 lines per function
- Maximum 3 levels of nesting
- Single Responsibility Principle

```javascript
// ❌ BAD: 150-line function with 5 levels of nesting
function doEverything() {
  if (condition1) {
    if (condition2) {
      if (condition3) {
        if (condition4) {
          if (condition5) {
            // 100 lines of logic here
          }
        }
      }
    }
  }
}

// ✅ GOOD: Extract responsibilities
function doEverything() {
  if (!validateConditions()) return;
  const data = prepareData();
  processData(data);
  updateUI();
}
```

---

### Error Handling

**All async operations MUST have try-catch:**

```javascript
// ❌ BAD: Unhandled promise rejection
async function saveData() {
  const data = await chrome.storage.local.get('key');
  return data;
}

// ✅ GOOD: Proper error handling
async function saveData() {
  try {
    const data = await chrome.storage.local.get('key');
    return data;
  } catch (error) {
    console.error('[Save Data] Failed:', error);
    if (window.showToast) {
      window.showToast('Failed to save data', 'error');
    }
    return null;
  }
}
```

---

### Memory Management

**Remove event listeners on cleanup:**

```javascript
// ✅ GOOD: Cleanup listeners
class MyFeature {
  constructor() {
    this.handleClick = this.handleClick.bind(this);
  }
  
  initialize() {
    document.addEventListener('click', this.handleClick);
  }
  
  destroy() {
    document.removeEventListener('click', this.handleClick);
  }
}
```

**Use cloning pattern for complex listener management:**

```javascript
// ✅ GOOD: Clone removes ALL listeners at once
function reinitialize() {
  const element = document.querySelector('.my-element');
  const newElement = element.cloneNode(true);
  element.parentNode.replaceChild(newElement, element);
  
  // Now attach fresh listeners to new element
  attachListeners(newElement);
}
```

---

### Performance

**Debounce expensive operations:**

```javascript
// ✅ GOOD: Debounce search input
let searchTimeout;
function handleSearch(value) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    performExpensiveSearch(value);
  }, 300);  // Wait 300ms after user stops typing
}
```

**Throttle rapid events:**

```javascript
// ✅ GOOD: Throttle scroll events
let scrollTimeout;
function handleScroll() {
  if (scrollTimeout) return;
  scrollTimeout = setTimeout(() => {
    updateScrollPosition();
    scrollTimeout = null;
  }, 100);  // Max once per 100ms
}
```

---

### Documentation

**All exported functions need JSDoc comments:**

```javascript
/**
 * Toggles the collapsed state of a section
 * @param {string} sectionId - The ID of the section to toggle (e.g., 'environments')
 * @returns {Promise<void>}
 */
window.toggleSection = async function(sectionId) {
  // Implementation
}
```

---

## ✅ PRE-COMMIT CHECKLIST

Before committing ANY code changes:

### 1. Security Check
- [ ] No credentials committed (run `/security`)
- [ ] No customer data in code
- [ ] No internal emails (@corp.sap)
- [ ] Input validation for user data
- [ ] XSS prevention (no innerHTML with user input)

### 2. Duplication Check
```bash
# Check for duplicate functions
grep -rn "function.*myFunction\|window\.myFunction" --include="*.js" .

# Check for duplicate CSS
grep -rn "\.my-class" --include="*.css" panel/styles/

# Check for duplicate event listeners
grep -rn "addEventListener.*myElement" --include="*.js" .
```

### 3. Testing
- [ ] Tested initial load scenario
- [ ] Tested all CRUD operations
- [ ] Tested context switches
- [ ] Tested edge cases
- [ ] No console errors
- [ ] No memory leaks

### 4. Code Quality
- [ ] Functions under 50 lines
- [ ] Proper error handling (try-catch)
- [ ] JSDoc comments for exported functions
- [ ] CSS uses variables (not hardcoded colors)
- [ ] Event listeners properly managed

### 5. Documentation
- [ ] Updated relevant .md files
- [ ] Added inline comments for complex logic
- [ ] Updated CHANGELOG.md

---

## 🚀 CHROME EXTENSION SPECIFIC

### Manifest V3 Considerations

**Content Security Policy (CSP):**
- No inline scripts in HTML
- No `eval()` or `new Function()`
- No remote code execution

```javascript
// ❌ BAD: Violates CSP
element.innerHTML = '<script>alert("hi")</script>';
eval('console.log("test")');

// ✅ GOOD: CSP-compliant
element.textContent = userInput;
element.classList.add('highlight');
```

### XSS Prevention

```javascript
// ❌ BAD: XSS vulnerability
element.innerHTML = userInput;

// ✅ GOOD: Safe alternatives
element.textContent = userInput;  // For text only
element.setAttribute('data-value', userInput);  // For attributes
```

### Background Script

- Keep background.js minimal
- Use message passing for communication
- Handle errors gracefully

```javascript
// ✅ GOOD: Message passing
chrome.runtime.sendMessage({
  action: 'doSomething',
  data: value
}, (response) => {
  if (chrome.runtime.lastError) {
    console.error('Message failed:', chrome.runtime.lastError);
    return;
  }
  handleResponse(response);
});
```

---

## 📝 SUMMARY

### Golden Rules

1. **30 minutes of diagnosis saves 3+ hours of wrong fixes**
2. **Clone-before-attach for event listeners** (prevents duplicates)
3. **Re-initialize after innerHTML** (restores lost listeners)
4. **Test ALL scenarios, not just initial load**
5. **Grep before coding** (find existing implementations)
6. **Use CSS variables** (no hardcoded colors)
7. **No inline styles** (except dynamic positioning)
8. **Try-catch for all async** (proper error handling)

### When in Doubt

Ask yourself:
- Have I traced the full lifecycle?
- Have I tested all scenarios?
- Have I checked for existing implementations?
- Have I verified no duplicates will accumulate?
- Have I handled cleanup properly?

**Remember**: Systematic debugging and proper architecture prevent bugs, hasty fixes create more bugs.

---

**Last Updated**: 2026-01-16 after the 4-hour section toggle bug fix
