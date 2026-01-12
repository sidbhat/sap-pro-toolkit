# Security Audit & Data Sanitization Rule

This rule performs comprehensive security audits before git commits to prevent credential leaks, customer data exposure, content moderation violations, and security vulnerabilities.

**Trigger phrase**: "run security audit" or "/security" or "security check" or before any git commit

## CRITICAL: Pre-Commit Security Checklist

### 🔍 Automated Security Scans

Run these commands to detect security violations:

```bash
# 1. Search for credentials and secrets
grep -r "password\|Password\|PASSWORD\|credential\|Credential\|secret\|Secret\|token\|Token\|apikey\|ApiKey\|API_KEY" \
  --include="*.json" --include="*.js" --include="*.html" . | \
  grep -v node_modules | grep -v ".git" | grep -v ".clinerules"

# 2. Search for customer-specific data
grep -r "SFSALES\|company=" --include="*.json" resources/

# 3. Search for person IDs and user IDs
grep -r "I[0-9]{13}\|personId\|userId" --include="*.json" resources/

# 4. Search for internal emails
grep -r "@.*\.corp\.sap\|@sap\.com" --include="*.json" resources/

# 5. Check for API keys and tokens in code
grep -r "sk-\|api_key\|API_KEY\|openai\|anthropic\|ANTHROPIC" --include="*.js" --include="*.json" --include="*.env" .

# 6. Check for hardcoded URLs with sensitive parameters
grep -r "password=\|token=\|key=\|secret=" --include="*.js" --include="*.json" .

# 7. Check for LLM prompt injection patterns (if using AI features)
grep -r "ignore previous\|forget instructions\|disregard\|new instructions" --include="*.js" --include="*.json" .

# 8. Check for model configuration exposure
grep -r "temperature\|max_tokens\|model.*gpt\|model.*claude" --include="*.json" .
```

### 🛡️ Content Moderation Scans (NEW)

Detect negative SAP messaging or competitor polarization:

```bash
# 9. Check for negative SAP statements
grep -ri "SAP.*\(is\|are\).*\(bad\|terrible\|awful\|worst\|broken\|unreliable\|buggy\|garbage\|trash\|sucks\)" \
  --include="*.md" --include="*.json" --include="*.js" --include="*.html" . | \
  grep -v node_modules | grep -v ".git"

# 10. Check for competitor polarization (vs/compared language)
grep -ri "better than SAP\|worse than.*\(Oracle\|Salesforce\|Workday\|Microsoft\|ServiceNow\)\|SAP vs\|compared to SAP\|SAP versus" \
  --include="*.md" --include="*.json" --include="*.js" --include="*.html" . | \
  grep -v node_modules | grep -v ".git"

# 11. Check for inflammatory competitor language
grep -ri "Oracle.*\(bad\|terrible\|awful\|worst\)\|Salesforce.*\(bad\|terrible\|awful\|worst\)\|Workday.*\(bad\|terrible\|awful\|worst\)" \
  --include="*.md" --include="*.json" --include="*.js" --include="*.html" . | \
  grep -v node_modules | grep -v ".git"
```

### 🔒 Security Vulnerability Scans (NEW)

Detect XSS, injection, and other security risks:

```bash
# 12. XSS vulnerability patterns
grep -r "innerHTML\|outerHTML\|document\.write\|insertAdjacentHTML" \
  --include="*.js" . | grep -v node_modules | grep -v ".git"

# 13. JavaScript eval() and Function() usage (code injection risks)
grep -r "eval(\|new Function(\|setTimeout.*+\|setInterval.*+" \
  --include="*.js" . | grep -v node_modules | grep -v ".git"

# 14. SQL injection patterns (if backend/API)
grep -r "query.*+.*req\.\|SELECT.*+.*params\.\|INSERT.*+.*body\." \
  --include="*.js" . | grep -v node_modules | grep -v ".git"

# 15. Unsafe user input handling
grep -r "req\.body\|req\.query\|req\.params" \
  --include="*.js" . | grep -v node_modules | grep -v ".git" | \
  grep -v "validate\|sanitize\|escape"

# 16. Dangerous URL redirects (open redirect vulnerability)
grep -r "location\.href.*req\.\|window\.location.*params\|redirect.*req\." \
  --include="*.js" . | grep -v node_modules | grep -v ".git"

# 17. Unsafe JSON parsing
grep -r "JSON\.parse.*req\.\|JSON\.parse.*body\." \
  --include="*.js" . | grep -v node_modules | grep -v ".git" | \
  grep -v "try\|catch"

# 18. CSP bypass attempts
grep -r "unsafe-inline\|unsafe-eval" \
  --include="*.html" --include="*.json" --include="*.js" . | \
  grep -v node_modules | grep -v ".git"
```

### ⚠️ Manual Review Required

Review these file types for sensitive data:
- [ ] All JSON files in `resources/` directory
- [ ] Scratch notes in profile JSON files
- [ ] Environment configurations
- [ ] Bundle templates
- [ ] Markdown documentation for polarizing language
- [ ] JavaScript files for XSS/injection risks

### 🚨 ZERO TOLERANCE Items

**DO NOT COMMIT**:
- ❌ Real passwords or credentials
- ❌ Customer company names (e.g., "Colgate", "Nike")
- ❌ Real sales demo company IDs (SFSALES*, SFPART*, etc.)
- ❌ Person IDs from production systems
- ❌ Internal SAP email addresses (@corp.sap, @sap.com)
- ❌ OAuth tokens or API keys
- ❌ WalkMe configuration passwords
- ❌ Real test user credentials
- ❌ OpenAI/Anthropic API keys (`sk-...`, `claude-...`)
- ❌ Model endpoint URLs with embedded credentials
- ❌ LLM system prompts containing sensitive company data
- ❌ Training data or fine-tuning datasets with PII
- ❌ Cached LLM responses containing customer information

**CONTENT MODERATION VIOLATIONS**:
- ❌ Negative statements about SAP products ("SAP is terrible", "SAP sucks")
- ❌ Competitor polarization ("better than SAP", "SAP vs Oracle")
- ❌ Inflammatory competitor language ("Oracle is garbage", "Salesforce is awful")
- ❌ Divisive comparison language that creates us-vs-them dynamics

**SECURITY VULNERABILITY VIOLATIONS**:
- ❌ Unvalidated innerHTML/outerHTML assignments (XSS risk)
- ❌ eval() or Function() with user input (code injection)
- ❌ SQL queries concatenated with user input (SQL injection)
- ❌ Unvalidated URL redirects (open redirect vulnerability)
- ❌ JSON.parse() without try-catch on user input
- ❌ CSP bypass attempts (unsafe-inline, unsafe-eval)

**SAFE TO COMMIT** ✅:
- Generic hostnames and URLs
- Template data with [PLACEHOLDER] markers
- Public documentation links
- Generic test user patterns (test-employee@test.com)
- SAP Note numbers and references
- Public API endpoint documentation
- Model names and versions (gpt-4, claude-3, etc.)
- Generic prompt templates without sensitive data
- Model parameters (temperature, max_tokens) without keys
- **Neutral product comparisons** with factual data only
- **Constructive feedback** without inflammatory language
- **Validated user input** with proper sanitization
- **Safe DOM manipulation** using textContent instead of innerHTML

## Sanitization Actions

### Action 1: Remove Sensitive Notes

If sensitive data found in notes array:

```javascript
// Remove notes containing:
// - Real credentials
// - Customer-specific user IDs
// - Internal emails
// - Real company names

// Keep only:
// - Generic templates
// - Joule prompt libraries
// - SAP Note references
// - API documentation
```

### Action 2: Add to .gitignore

For files with SAP-internal data that should stay local:

```bash
echo "# SAP-only sensitive data - keep local
resources/profile-successfactors.json
resources/profile-[custom].json" >> .gitignore
```

### Action 3: Replace with Templates

For bundle templates, use placeholders:

```json
{
  "content": "User: [CUSTOMIZE]\nPassword: [CUSTOMIZE]\n\n⚠️ SECURITY: Never commit credentials to Git!"
}
```

### Action 4: Fix Content Moderation Violations

If negative SAP messaging or competitor polarization found:

**Replace inflammatory language**:
```javascript
// ❌ BAD: "SAP is terrible at X"
// ✅ GOOD: "Consider Y approach for X"

// ❌ BAD: "Oracle is better than SAP at X"
// ✅ GOOD: "SAP provides X functionality via Y"

// ❌ BAD: "Salesforce vs SAP showdown"
// ✅ GOOD: "SAP SuccessFactors capabilities overview"
```

### Action 5: Fix Security Vulnerabilities

**XSS Prevention**:
```javascript
// ❌ UNSAFE: element.innerHTML = userInput;
// ✅ SAFE: element.textContent = userInput;

// ❌ UNSAFE: element.innerHTML = `<div>${userInput}</div>`;
// ✅ SAFE: element.textContent = userInput; or use DOMPurify
```

**Injection Prevention**:
```javascript
// ❌ UNSAFE: eval(userInput);
// ✅ SAFE: Use JSON.parse() or specific validators

// ❌ UNSAFE: new Function(userInput)();
// ✅ SAFE: Use predefined functions, validate input

// ❌ UNSAFE: setTimeout(userInput, 1000);
// ✅ SAFE: setTimeout(() => validatedFunction(), 1000);
```

**Input Validation**:
```javascript
// ❌ UNSAFE: const query = `SELECT * FROM users WHERE id=${req.params.id}`;
// ✅ SAFE: Use parameterized queries or ORM

// ❌ UNSAFE: JSON.parse(req.body.data);
// ✅ SAFE: 
try {
  const data = JSON.parse(req.body.data);
  // validate data structure
} catch (e) {
  // handle error
}
```

## Safe Coding Patterns

### DOM Manipulation
```javascript
// ✅ SAFE PATTERNS:
element.textContent = userInput;
element.setAttribute('data-value', userInput);
element.classList.add(validatedClassName);
element.dataset.id = sanitizedId;

// ⚠️ USE WITH CAUTION (validate/sanitize first):
element.innerHTML = DOMPurify.sanitize(userInput);
```

### User Input Handling
```javascript
// ✅ SAFE PATTERNS:
const sanitized = input.trim().replace(/[<>\"']/g, '');
const validated = /^[a-zA-Z0-9_-]+$/.test(input);
const escaped = encodeURIComponent(input);
```

### Content Tone Guidelines
```markdown
✅ CONSTRUCTIVE:
- "SAP provides X feature through Y approach"
- "Consider implementing Z for best results"
- "This workflow supports A, B, and C use cases"

❌ AVOID:
- "SAP is bad at X" → "Consider alternative approach Y"
- "Oracle does this better" → "SAP supports this via Z"
- "SAP vs Competitor" → "SAP capabilities overview"
```

## Post-Sanitization Verification

After removing sensitive data and fixing violations:

```bash
# Verify no sensitive data remains
git diff --staged | grep -i "password\|credential\|@corp.sap"

# Verify no content violations remain
git diff --staged | grep -i "SAP.*bad\|better than SAP\|SAP vs"

# Verify no security vulnerabilities remain
git diff --staged | grep -i "innerHTML\|eval(\|new Function"

# Should return EMPTY - if not, DO NOT COMMIT
```

## Git Commit Template

After security audit passes:

```bash
git add -A
git commit -m "feat: [Feature description]

Features:
- [Feature 1]
- [Feature 2]

Security:
- Removed sensitive scratch notes
- Added [file] to .gitignore
- Sanitized credentials and customer data
- Fixed content moderation violations
- Resolved security vulnerabilities (XSS/injection)

Files Modified: X files
Security QA: ✅ PASSED (18 checks)"

git push
```

## Integration with cleanup-after-feature.md

**Run security audit BEFORE cleanup**:
1. Complete feature implementation
2. Run `/security` - Security audit FIRST (18 automated checks)
3. Sanitize any violations found (credentials, content, security)
4. Then run `/cleanup` - Code cleanup
5. Finally commit cleaned, secure code

## Emergency: If Credentials Already Committed

If credentials accidentally committed to Git:

```bash
# 1. Immediately rotate/change exposed credentials
# 2. Remove from git history (DANGEROUS - coordinate with team):
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch resources/profile-successfactors.json" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Force push (requires admin access):
git push origin --force --all
```

## Summary of All 18 Security Checks

1. ✅ Credentials and secrets
2. ✅ Customer-specific data
3. ✅ Person IDs and user IDs
4. ✅ Internal emails
5. ✅ API keys and tokens
6. ✅ Hardcoded sensitive URLs
7. ✅ LLM prompt injection patterns
8. ✅ Model configuration exposure
9. ✅ Negative SAP statements (NEW)
10. ✅ Competitor polarization (NEW)
11. ✅ Inflammatory competitor language (NEW)
12. ✅ XSS vulnerability patterns (NEW)
13. ✅ JavaScript eval/Function injection (NEW)
14. ✅ SQL injection patterns (NEW)
15. ✅ Unsafe user input handling (NEW)
16. ✅ Dangerous URL redirects (NEW)
17. ✅ Unsafe JSON parsing (NEW)
18. ✅ CSP bypass attempts (NEW)

## Notes

- Run security audit before EVERY commit
- Profile-successfactors.json is SAP-internal only (in .gitignore)
- URLs and hostnames are okay to commit (per user guidance)
- Template data with [CUSTOMIZE] placeholders is safe
- Neutral comparisons with factual data are acceptable
- Always validate and sanitize user input
- Use textContent instead of innerHTML for user data
- When in doubt, ask user for confirmation
