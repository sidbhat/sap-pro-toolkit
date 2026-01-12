# Security Audit & Data Sanitization Rule

This rule performs comprehensive security audits before git commits to prevent credential leaks and customer data exposure.

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
```

### ⚠️ Manual Review Required

Review these file types for sensitive data:
- [ ] All JSON files in `resources/` directory
- [ ] Scratch notes in profile JSON files
- [ ] Environment configurations
- [ ] Bundle templates

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

**SAFE TO COMMIT** ✅:
- Generic hostnames and URLs
- Template data with [PLACEHOLDER] markers
- Public documentation links
- Generic test user patterns (test-employee@test.com)
- SAP Note numbers and references
- Public API endpoint documentation

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

## Post-Sanitization Verification

After removing sensitive data:

```bash
# Verify no sensitive data remains
git diff --staged | grep -i "password\|credential\|@corp.sap"

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

Files Modified: X files
Security QA: ✅ PASSED"

git push
```

## Integration with cleanup-after-feature.md

**Run security audit BEFORE cleanup**:
1. Complete feature implementation
2. Run `/security` - Security audit FIRST
3. Sanitize any violations found
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

## Notes

- Run security audit before EVERY commit
- Profile-successfactors.json is SAP-internal only (in .gitignore)
- URLs and hostnames are okay to commit (per user guidance)
- Template data with [CUSTOMIZE] placeholders is safe
- When in doubt, ask user for confirmation
