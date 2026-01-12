# Auto-Login Feature Testing Guide

## Overview

This guide provides comprehensive testing procedures for the SAP Pro Toolkit auto-login feature, which supports SuccessFactors, S/4HANA, and BTP environments.

## Test Environment Setup

### Prerequisites

1. **Test Environments Required**:
   - SuccessFactors (SF) Production/Preview/Sales instance
   - S/4HANA Cloud instance (optional)
   - BTP account (optional)

2. **Test Credentials**:
   - Valid username/password for each environment
   - Company ID for SuccessFactors (if applicable)
   - Access to multiple environments for switching tests

3. **Browser Setup**:
   - Chrome or Edge (Chromium-based)
   - Extension loaded in Developer Mode
   - Console open for debugging (`F12`)

## Test Scenarios

### ✅ Test 1: Basic Credential Configuration

**Objective**: Verify credential storage and encryption

**Steps**:
1. Open extension side panel
2. Click "Add Environment" or edit existing environment
3. Enable "Enable auto-login for this environment"
4. Enter username and password
5. Click "Save Environment"
6. Re-open the environment for editing
7. Verify credentials are populated (decrypted)

**Expected Results**:
- ✅ Credential fields appear when checkbox is enabled
- ✅ Password is masked by default (dots)
- ✅ Eye icon toggles password visibility
- ✅ Credentials save successfully
- ✅ Credentials load correctly when editing
- ✅ Security notice displayed: "🔒 Credentials are encrypted..."

**Console Logs to Check**:
```
[Credentials] Encrypted and stored credentials for environment
```

---

### ✅ Test 2: SuccessFactors Single-Page Login

**Objective**: Test auto-login on SF single-page login form

**Steps**:
1. Configure environment with SF credentials
2. Enable "Clear cache & force fresh login"
3. Click "Switch" to navigate to SF environment
4. Observe login page behavior

**Expected Results**:
- ✅ Cookies cleared (check Chrome DevTools → Application → Cookies)
- ✅ Login page loads
- ✅ Username and password fields auto-filled
- ✅ Form auto-submitted
- ✅ Success notification: "Auto-login successful ✓"
- ✅ User logged into SF

**Console Logs to Check**:
```
[Auto-Login] Checking page: https://...
[Auto-Login] Detected login page: sf-single-page Solution: successfactors
[Auto-Login] Credentials received, attempting login
[Auto-Login] SF single-page: Filling credentials
[Auto-Login] Clicking Login button
```

---

### ✅ Test 3: SuccessFactors Two-Step Login (Username → Password)

**Objective**: Test auto-login on SF two-step login flow

**Steps**:
1. Configure environment with SF credentials
2. Navigate to SF login page with two-step flow
3. Observe username page, then password page

**Expected Results**:
- ✅ Username page: Username auto-filled
- ✅ Continue button auto-clicked
- ✅ Page transitions to password page
- ✅ Password page: Password auto-filled
- ✅ Login button auto-clicked
- ✅ Success notification displayed
- ✅ User logged into SF

**Console Logs to Check**:
```
[Auto-Login] Detected login page: sf-two-step-username
[Auto-Login] SF two-step: Filling username
[Auto-Login] Clicking Continue button
[Auto-Login] Setting up password page observer
[Auto-Login] Password page detected
[Auto-Login] SF two-step: Filling password
[Auto-Login] Clicking Login button
```

---

### ✅ Test 4: Company ID Handling (SuccessFactors)

**Objective**: Test company ID field visibility and auto-fill

**Steps**:
1. Add SF environment
2. Verify "Company ID" field appears (should be visible)
3. Enter company ID
4. Save environment
5. Switch to environment and observe login

**Expected Results**:
- ✅ Company ID field visible only for SF environments
- ✅ Company ID field hidden for S/4HANA/BTP
- ✅ Company ID auto-filled during login (if on same page as username/password)
- ✅ Company ID handled correctly in two-step flow

**Console Logs to Check**:
```
[Auto-Login] Filled company ID
```

---

### ✅ Test 5: Already Logged In Detection

**Objective**: Verify auto-login skips when user already logged in

**Steps**:
1. Log into SF manually
2. Navigate to another SF page
3. Switch to different SF environment with auto-login enabled

**Expected Results**:
- ✅ No auto-login attempt if already logged in
- ✅ Console log: "User already logged in, skipping auto-login"
- ✅ Environment switch happens normally

---

### ✅ Test 6: SSO Detection

**Objective**: Test SSO/OAuth redirect detection

**Steps**:
1. Configure environment that uses Azure AD/Okta SSO
2. Attempt to switch to that environment

**Expected Results**:
- ✅ SSO redirect detected
- ✅ Notification: "SSO login detected - please log in manually"
- ✅ No auto-login attempt
- ✅ Console log: "SSO/OAuth detected, cannot automate login"

**SSO Indicators Tested**:
- login.microsoftonline.com
- accounts.sap.com
- okta.com
- /oauth2/, /saml2/, /idp/

---

### ✅ Test 7: Cookie Clearing

**Objective**: Test cache clearing functionality

**Steps**:
1. Log into environment
2. Note session cookies in DevTools
3. Edit environment and enable "Clear cache & force fresh login"
4. Switch to same environment
5. Check cookies in DevTools

**Expected Results**:
- ✅ All cookies for hostname cleared
- ✅ Console log: "Cleared X cookies for hostname"
- ✅ Fresh login page loads
- ✅ Auto-login proceeds normally

---

### ✅ Test 8: S/4HANA Login

**Objective**: Test S/4HANA login automation

**Steps**:
1. Configure S/4HANA environment with credentials
2. Switch to S/4HANA environment
3. Observe login behavior

**Expected Results**:
- ✅ Login page detected: "s4hana-login"
- ✅ Username and password fields found and filled
- ✅ Login button clicked
- ✅ Success notification displayed

**Console Logs to Check**:
```
[Auto-Login] S/4HANA: Filling credentials
[Auto-Login] Clicking Login button
```

---

### ✅ Test 9: BTP Login

**Objective**: Test BTP login with SSO fallback

**Steps**:
1. Configure BTP environment
2. Switch to BTP environment
3. Observe behavior

**Expected Results**:
- ✅ If credentials login available: Auto-login proceeds
- ✅ If SSO only: Notification "BTP SSO login - please log in manually"
- ✅ Graceful fallback to manual login

---

### ✅ Test 10: Error Handling

**Objective**: Test error scenarios and graceful failures

**Test Cases**:

**10a: Invalid Credentials**
- Use incorrect password
- Expected: Login fails normally (SAP error message)
- Auto-login doesn't interfere with error display

**10b: Missing Password**
- Try to save environment with username only
- Expected: Validation error: "Username and password are required..."

**10c: Decryption Failure**
- Manually corrupt encrypted data in storage (DevTools)
- Expected: Error notification: "Auto-login failed: Could not decrypt credentials"

**10d: Login Button Not Found**
- Test on unknown login page format
- Expected: Error: "Login button not found"
- Fallback to manual login

---

### ✅ Test 11: Cross-Browser Testing

**Objective**: Verify functionality in different browsers

**Browsers**:
- ✅ Chrome (primary)
- ✅ Edge (Chromium)

**Expected Results**:
- ✅ Feature works identically in both browsers
- ✅ Encryption/decryption consistent
- ✅ Cookie clearing works

---

### ✅ Test 12: Security Validation

**Objective**: Verify security measures

**Tests**:

**12a: Encrypted Storage**
```javascript
// In DevTools Console:
chrome.storage.local.get(null, (data) => {
  console.log(data);
  // Verify credentials are encrypted (not plaintext)
  // Should see objects with: {ciphertext, iv, algorithm, version}
});
```

**12b: Session Storage Expiry**
```javascript
// Verify credentials in session storage expire after 2 minutes
chrome.storage.session.get(null, (data) => {
  console.log(data); // Check for pendingLogin_* keys
});
```

**12c: No Credentials in Network Tab**
- Open DevTools → Network
- Perform auto-login
- Verify no credentials sent in extension requests
- Only sent directly to SAP login endpoint

---

## Performance Testing

### ✅ Test 13: Login Speed

**Objective**: Measure auto-login performance

**Metrics**:
- Cookie clearing: <500ms
- Form detection: <100ms
- Field filling: <300ms
- Total login time: 2-4 seconds (depending on SAP response)

**Test**:
1. Enable Performance recording in DevTools
2. Execute auto-login
3. Measure timings

**Expected Results**:
- ✅ No noticeable delay vs manual login
- ✅ Smooth user experience
- ✅ No UI freezing

---

## Edge Cases & Known Limitations

### Edge Cases to Test

1. **Multiple tabs**: Open multiple SF tabs, switch environment
   - Expected: Auto-login on active tab only

2. **Slow network**: Test on throttled network (DevTools → Network → Slow 3G)
   - Expected: Longer wait times, but still succeeds

3. **Page reload during login**: Reload page while auto-login in progress
   - Expected: Graceful abort, retry on next switch

4. **Rapid environment switching**: Switch environments rapidly
   - Expected: Only latest switch proceeds

### Known Limitations

1. **SSO environments**: Cannot automate OAuth/SAML flows
2. **Multi-factor authentication (MFA)**: Cannot bypass MFA prompts
3. **CAPTCHA**: Cannot solve CAPTCHAs
4. **Custom login pages**: May not detect non-standard SAP login pages

---

## Troubleshooting

### Common Issues

**Issue: "No credentials available"**
- **Cause**: Credentials not configured or expired from session
- **Fix**: Re-save environment with credentials

**Issue: "Failed to decrypt credentials"**
- **Cause**: Corrupted encryption data or browser profile changed
- **Fix**: Re-enter credentials and save again

**Issue: "Login button not found"**
- **Cause**: Unknown page structure or custom login page
- **Fix**: Report issue with page URL and HTML structure

**Issue: Auto-login not triggering**
- **Check**: Is login page recognized? (See console logs)
- **Check**: Are credentials enabled for this environment?
- **Check**: Is SSO redirect happening?

### Debug Mode

Enable verbose logging:
```javascript
// In content.js, add at top:
const DEBUG = true;

// Then add debug logs throughout:
if (DEBUG) console.log('[Auto-Login Debug]', ...);
```

---

## Test Report Template

```markdown
## Auto-Login Test Report

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Browser**: Chrome/Edge [Version]
**Extension Version**: [Version]

### Test Results

| Test # | Scenario | Status | Notes |
|--------|----------|--------|-------|
| 1 | Basic Config | ✅ Pass | |
| 2 | SF Single-Page | ✅ Pass | |
| 3 | SF Two-Step | ✅ Pass | |
| 4 | Company ID | ✅ Pass | |
| 5 | Already Logged In | ✅ Pass | |
| 6 | SSO Detection | ✅ Pass | |
| 7 | Cookie Clearing | ✅ Pass | |
| 8 | S/4HANA Login | ⚠️ Skip | No test env |
| 9 | BTP Login | ⚠️ Skip | No test env |
| 10 | Error Handling | ✅ Pass | |
| 11 | Cross-Browser | ✅ Pass | |
| 12 | Security | ✅ Pass | |
| 13 | Performance | ✅ Pass | |

### Issues Found

1. [Issue description]
   - **Severity**: Critical/High/Medium/Low
   - **Steps to reproduce**: ...
   - **Expected**: ...
   - **Actual**: ...

### Recommendations

- [Recommendation 1]
- [Recommendation 2]
```

---

## Acceptance Criteria

**Feature is ready for release when**:
- ✅ All critical tests pass (Tests 1-7, 10, 12)
- ✅ No security vulnerabilities found
- ✅ Error handling is graceful
- ✅ User documentation is complete
- ✅ At least 2 browsers tested successfully
- ✅ Performance meets targets (<4s total login time)

---

## Contact & Support

For issues or questions about testing:
- Check console logs for detailed error messages
- Review Chrome extension error logs: `chrome://extensions` → Details → Errors
- Report issues with:
  - Browser and extension versions
  - Environment type (SF/S/4/BTP)
  - Console logs
  - Network tab screenshots (without sensitive data)
