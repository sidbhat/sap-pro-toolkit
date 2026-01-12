# Auto-Login Security Architecture

## Overview

This document details the security architecture and best practices for the SAP Pro Toolkit auto-login feature. The implementation prioritizes security through encryption, secure storage, and minimal credential exposure.

## Security Architecture

### 1. Encryption Standard: AES-256-GCM

**Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits
- **IV Size**: 96 bits (12 bytes)
- **Authentication**: Built-in AEAD (Authenticated Encryption with Associated Data)

**Why AES-256-GCM?**
- Industry-standard encryption (NIST approved)
- Authenticated encryption prevents tampering
- Hardware-accelerated in modern browsers
- Native support in Web Crypto API

### 2. Key Derivation: PBKDF2-SHA256

**Algorithm**: PBKDF2-SHA256
- **Iterations**: 100,000
- **Salt**: 16 bytes (random, stored per browser profile)
- **Key Material**: Chrome extension ID + User Agent string

**Key Derivation Process**:
```javascript
Key Material = Extension ID + User Agent
     ↓
PBKDF2-SHA256 (100K iterations)
     ↓
256-bit AES Key (non-extractable)
```

**Why PBKDF2 with 100K iterations?**
- Protects against brute-force attacks
- Makes rainbow table attacks impractical
- OWASP recommended minimum: 100K iterations (2023)
- Acceptable performance on modern hardware (<100ms)

### 3. Cryptographic Salt

**Storage**: `chrome.storage.local` (persistent)
- **Size**: 16 bytes (128 bits)
- **Generation**: Crypto-secure random (`crypto.getRandomValues()`)
- **Uniqueness**: One salt per browser profile
- **Purpose**: Prevents rainbow table attacks

**Salt Management**:
- Generated once on first use
- Persisted across extension sessions
- Never transmitted or exposed
- Not tied to any specific credential

### 4. Initialization Vector (IV)

**Per-Encryption Uniqueness**:
- **Size**: 12 bytes (96 bits)
- **Generation**: Crypto-secure random for each encryption
- **Storage**: Stored alongside ciphertext
- **Purpose**: Ensures identical plaintexts produce different ciphertexts

**Why unique IVs matter**:
- Prevents pattern analysis
- Critical for GCM mode security
- NIST requirement for AES-GCM

### 5. Storage Security Model

**Storage Layers**:

```
┌─────────────────────────────────────────┐
│ chrome.storage.local (Persistent)       │
│ - Encrypted username/password           │
│ - Plaintext: Company ID, hostname       │
│ - Cryptographic salt                    │
└─────────────────────────────────────────┘
           ↓ (during environment switch)
┌─────────────────────────────────────────┐
│ chrome.storage.session (Temporary)      │
│ - Encrypted credentials                 │
│ - Expiry: 2 minutes                     │
│ - Tab-specific keys                     │
└─────────────────────────────────────────┘
           ↓ (content script requests)
┌─────────────────────────────────────────┐
│ Memory Only (Decrypted)                 │
│ - Plaintext username/password           │
│ - Exists only during form filling       │
│ - Cleared after login attempt           │
└─────────────────────────────────────────┘
```

**Security Properties**:
- Credentials encrypted at rest
- Session storage auto-expires (2 minutes)
- Plaintext exists only in memory during login
- No credentials in network requests (except to SAP)

### 6. Threat Model & Mitigations

#### Threat 1: Local Storage Access
**Attack**: Malicious extension or malware reads `chrome.storage.local`
**Mitigation**: 
- ✅ Credentials encrypted (not plaintext)
- ✅ Key derived from extension ID (changes per installation)
- ✅ User Agent adds device-specific entropy
- ❌ **Limitation**: Same device + same extension = same key

#### Threat 2: Memory Dumping
**Attack**: Attacker dumps browser memory while credentials in RAM
**Mitigation**:
- ✅ Credentials in memory only during login (<5 seconds)
- ✅ No global variables holding plaintext
- ✅ Variables cleared after use
- ❌ **Limitation**: Cannot prevent OS-level memory access

#### Threat 3: Network Interception
**Attack**: Man-in-the-middle intercepts credentials
**Mitigation**:
- ✅ Credentials sent only via HTTPS to SAP
- ✅ No credentials in extension message passing
- ✅ No logging of plaintext credentials
- ✅ Chrome extension messaging is isolated

#### Threat 4: XSS/Code Injection
**Attack**: Malicious script on SAP page reads credentials
**Mitigation**:
- ✅ Content script isolated from page context
- ✅ No `eval()` or `innerHTML` with user input
- ✅ Strict Content Security Policy
- ✅ Credentials never exposed to page JavaScript

#### Threat 5: Browser Profile Theft
**Attack**: Attacker steals entire Chrome profile folder
**Mitigation**:
- ⚠️ **Risk**: If profile stolen, encrypted data may be decrypted
- ✅ Key tied to extension ID (attacker needs exact extension)
- ✅ Key tied to User Agent (attacker needs similar device)
- 💡 **Best Practice**: Users should encrypt their disk (FileVault, BitLocker)

#### Threat 6: Credential Stuffing
**Attack**: Stolen credentials used on other sites
**Mitigation**:
- ✅ Credentials only sent to configured SAP hostnames
- ✅ Hostname validation before sending
- ✅ No auto-login on non-SAP domains
- ✅ User must explicitly configure per environment

---

## Security Best Practices

### For Users

1. **Use Strong Passwords**
   - ✅ Use unique password per SAP environment
   - ✅ Enable MFA where available (extension won't bypass MFA)
   - ✅ Rotate passwords regularly

2. **Limit Auto-Login Usage**
   - ✅ Enable only for non-critical environments (Preview, Sales, Sandbox)
   - ⚠️ Consider disabling for Production environments
   - ✅ Use "Clear cache & force login" for better security

3. **Protect Your Device**
   - ✅ Enable disk encryption (FileVault on Mac, BitLocker on Windows)
   - ✅ Use strong OS password
   - ✅ Lock computer when away
   - ✅ Don't use auto-login on shared computers

4. **Audit Regularly**
   - ✅ Review which environments have auto-login enabled
   - ✅ Remove credentials for unused environments
   - ✅ Update passwords after credential changes

### For Developers

1. **Never Log Plaintext**
   ```javascript
   // ❌ BAD
   console.log('Password:', password);
   
   // ✅ GOOD
   console.log('[Auto-Login] Password received (length:', password.length, ')');
   ```

2. **Clear Sensitive Data**
   ```javascript
   // ✅ Clear variables after use
   let password = await decrypt();
   await fillLoginForm(password);
   password = null; // Clear reference
   ```

3. **Validate All Inputs**
   ```javascript
   // ✅ Validate hostname before auto-login
   if (!isValidSAPHostname(hostname)) {
     throw new Error('Invalid hostname');
   }
   ```

4. **Use Secure Defaults**
   ```javascript
   // ✅ Default to disabled
   credentials: {
     enabled: false, // User must explicitly enable
     username: null,
     password: null
   }
   ```

---

## Compliance & Privacy

### Data Handling

**What We Store**:
- ✅ Encrypted username and password (local only)
- ✅ Plaintext company ID (not considered PII)
- ✅ Cryptographic salt (local only)

**What We DON'T Store**:
- ❌ No server-side storage (all local)
- ❌ No telemetry or analytics of credentials
- ❌ No credential transmission to third parties
- ❌ No plaintext credential logs

### GDPR Considerations

**Right to Erasure**:
- Users can delete credentials by unchecking "Enable auto-login"
- Uninstalling extension removes all stored data
- Credentials never leave user's device

**Data Minimization**:
- Only essential fields collected (username, password, company ID)
- Company ID optional
- No collection of personal information beyond credentials

**Transparency**:
- Security notice displayed in UI
- This documentation openly describes security model
- No hidden data collection

---

## Encryption Implementation Details

### Code: `panel/crypto-utils.js`

**Core Functions**:

```javascript
// 1. Key Derivation
async deriveEncryptionKey() {
  const extensionId = chrome.runtime.id;
  const userAgent = navigator.userAgent;
  const keyMaterial = extensionId + userAgent;
  
  const salt = await this.getSalt();
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    await crypto.subtle.importKey(...),
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable
    ['encrypt', 'decrypt']
  );
}

// 2. Encryption
async encryptPassword(plaintext) {
  const key = await this.deriveEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoded
  );
  
  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
    algorithm: 'AES-GCM',
    version: '1.0'
  };
}

// 3. Decryption
async decryptPassword(encrypted) {
  const key = await this.deriveEncryptionKey();
  const iv = base64ToArrayBuffer(encrypted.iv);
  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);
  
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  );
  
  return new TextDecoder().decode(plaintext);
}
```

### Encrypted Data Format

**Stored in `chrome.storage.local`**:
```json
{
  "environments_profile-successfactors": [
    {
      "id": "env-1234567890",
      "name": "Production DC68",
      "hostname": "performancemanager4.successfactors.com",
      "credentials": {
        "enabled": true,
        "username": {
          "ciphertext": "base64_encrypted_data...",
          "iv": "base64_initialization_vector...",
          "algorithm": "AES-GCM",
          "version": "1.0"
        },
        "password": {
          "ciphertext": "base64_encrypted_data...",
          "iv": "base64_initialization_vector...",
          "algorithm": "AES-GCM",
          "version": "1.0"
        },
        "companyId": "SFPART123456"
      },
      "clearCache": true
    }
  ]
}
```

---

## Security Auditing

### Audit Checklist

**Code Review**:
- [ ] No plaintext passwords in code
- [ ] No console.log of sensitive data
- [ ] Input validation on all user inputs
- [ ] Error messages don't leak sensitive info
- [ ] No eval() or Function() with user input
- [ ] No innerHTML with user input

**Storage Review**:
- [ ] Credentials encrypted in chrome.storage.local
- [ ] Session storage expires (2 minutes)
- [ ] Salt properly generated and stored
- [ ] No credentials in chrome.storage.sync

**Network Review**:
- [ ] No credentials sent to non-SAP domains
- [ ] All SAP requests use HTTPS
- [ ] No credentials in URL parameters
- [ ] No credentials in extension message logs

### Automated Security Tests

**Run before each release**:

```bash
# 1. Check for plaintext credentials
grep -r "password.*=" --include="*.js" . | grep -v "encrypted" | grep -v "crypto"

# 2. Check for console.log of sensitive data
grep -r "console\.log.*password\|console\.log.*credential" --include="*.js" .

# 3. Check for unsafe practices
grep -r "eval\|innerHTML.*user\|new Function" --include="*.js" .

# 4. Check for credential transmission
grep -r "fetch.*password\|XMLHttpRequest.*password" --include="*.js" .
```

---

## Incident Response

### If Credentials Compromised

**Immediate Actions**:
1. User changes password on SAP system
2. User disables auto-login in extension
3. User clears browser data (chrome://settings/clearBrowserData)
4. User re-enables auto-login with new password

**Extension Cannot**:
- ❌ Remotely disable auto-login
- ❌ Remotely delete stored credentials
- ❌ Notify users of compromises (no server component)

### Reporting Security Issues

**Contact**: Report security vulnerabilities via GitHub Issues (mark as "Security")

**Include**:
- Vulnerability description
- Steps to reproduce
- Impact assessment
- Suggested fix (if any)

**Response SLA**:
- Critical: 24 hours
- High: 3 days
- Medium: 7 days

---

## Future Security Enhancements

### Potential Improvements

1. **Biometric Authentication** (Future)
   - Use Web Authentication API
   - Require fingerprint/Face ID before decryption
   - Browser support: Chrome 67+

2. **Hardware Security Module (HSM)** (Future)
   - Store keys in platform keychain (macOS Keychain, Windows Credential Manager)
   - Requires native messaging host
   - Better protection than software-only encryption

3. **Time-Based Auto-Lock** (Future)
   - Auto-disable credentials after N days of inactivity
   - Require re-entry periodically

4. **Audit Logging** (Future)
   - Log when auto-login used (timestamp only, no credentials)
   - Allow users to review login history
   - Help detect unauthorized access

5. **Chrome App-Bound Encryption** (When Available)
   - Use Chrome's upcoming App-Bound Encryption API
   - Ties encryption to Chrome profile + device
   - Further reduces risk of profile theft

---

## Comparison to Other Password Managers

### vs. Browser Built-In Password Manager

| Feature | SAP Pro Toolkit | Chrome Password Manager |
|---------|----------------|------------------------|
| Encryption | AES-256-GCM | AES-256-GCM |
| Key Storage | Extension-bound | Google Account-synced |
| Auto-Fill | SAP-specific logic | Generic form detection |
| Multi-step Login | ✅ Supported (SF two-step) | ❌ Limited |
| Cookie Clearing | ✅ Supported | ❌ Not available |
| Cross-Device Sync | ❌ Local only | ✅ Google Account sync |
| Company ID Support | ✅ Native support | ❌ Not supported |

**When to use SAP Pro Toolkit**:
- Need multi-step SF login automation
- Need cookie clearing for fresh logins
- Need company ID management
- Want local-only storage (no cloud sync)

**When to use Chrome Password Manager**:
- Need cross-device sync
- Prefer Google-managed encryption
- Don't need SAP-specific features

### vs. Third-Party Password Managers (1Password, LastPass)

**Advantages of SAP Pro Toolkit**:
- ✅ SAP-specific multi-step login support
- ✅ Integrated with SAP Pro Toolkit environment switching
- ✅ Free and open-source
- ✅ No subscription required
- ✅ Company ID native support

**Advantages of Third-Party Managers**:
- ✅ Cross-platform sync
- ✅ Broader password management features
- ✅ Enterprise admin controls
- ✅ Breach monitoring
- ✅ Secure password sharing

**Recommendation**: Use SAP Pro Toolkit for SAP-specific automation, third-party manager for general password management.

---

## Security FAQs

### Q: Are my passwords safe?

**A**: Passwords are encrypted using industry-standard AES-256-GCM encryption and stored locally in your browser. They cannot be decrypted without your specific browser profile and extension installation.

### Q: Can SAP Pro Toolkit developers see my passwords?

**A**: No. All encryption happens locally in your browser. We have no server component and never transmit credentials to any server.

### Q: What if I uninstall the extension?

**A**: All stored data (including encrypted credentials) is permanently deleted when you uninstall the extension.

### Q: Can I sync credentials across devices?

**A**: No. Credentials are local-only for security. You must configure credentials separately on each device.

### Q: Is auto-login secure for Production environments?

**A**: While the encryption is secure, storing Production credentials has inherent risks. We recommend:
- Use auto-login for Preview/Sales/Sandbox only
- Keep Production credentials in a dedicated password manager
- Enable "Clear cache & force login" for production if used

### Q: What happens if my laptop is stolen?

**A**: If disk encryption is enabled (FileVault, BitLocker), your credentials are protected. Without disk encryption, an attacker with physical access could potentially extract encrypted data and attempt decryption.

### Q: Does auto-login work with SSO/OAuth?

**A**: No. The extension detects SSO redirects and notifies you to log in manually. OAuth flows cannot be automated for security reasons.

### Q: Can auto-login bypass multi-factor authentication (MFA)?

**A**: No. If MFA is enabled on your SAP system, you'll still need to complete the MFA step manually after auto-login fills username/password.

---

## Security Certifications & Standards

### Standards Compliance

- ✅ **NIST SP 800-132**: PBKDF2 with ≥100K iterations
- ✅ **OWASP ASVS**: Level 2 cryptographic storage
- ✅ **Chrome Extension Best Practices**: Manifest V3, minimal permissions
- ✅ **GDPR**: Data minimization, right to erasure, local processing

### Limitations

- ❌ **NOT FIPS 140-2 certified**: Web Crypto API is not FIPS-validated
- ❌ **NOT SOC 2 compliant**: No organization, no audit trail
- ❌ **NOT for regulated industries**: Not suitable for HIPAA/PCI-DSS requirements

**Recommendation**: For regulated industries, use enterprise password managers with compliance certifications.

---

## Responsible Disclosure

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Email: [Your security contact email]
3. Provide:
   - Detailed description
   - Steps to reproduce
   - Proof of concept (if available)
   - Impact assessment

**We commit to**:
- Acknowledge receipt within 48 hours
- Provide status update within 7 days
- Coordinate disclosure timeline
- Credit researcher (if desired)

---

## Security Changelog

### v1.5.0 (2026-01-12)
- ✅ Initial auto-login implementation
- ✅ AES-256-GCM encryption
- ✅ PBKDF2-SHA256 key derivation (100K iterations)
- ✅ Session storage with 2-minute expiry
- ✅ Multi-step login support (SF two-step)
- ✅ SSO detection and graceful fallback
- ✅ Cookie clearing for fresh logins

### Future Updates
- [ ] Biometric authentication support (Web Authentication API)
- [ ] Chrome App-Bound Encryption (when available)
- [ ] Audit logging (local only)
- [ ] Time-based credential expiry

---

## Conclusion

The SAP Pro Toolkit auto-login feature implements defense-in-depth security:

1. **Encryption at Rest**: AES-256-GCM
2. **Key Derivation**: PBKDF2 with 100K iterations
3. **Minimal Exposure**: Plaintext only during login
4. **Session Expiry**: Temporary credentials expire
5. **Local-Only Storage**: No cloud sync or transmission
6. **SAP-Specific**: Only works on validated SAP domains

**Use responsibly**: Enable auto-login only for environments where convenience outweighs risk (Preview, Sales, Sandbox). For Production, consider manual login with a dedicated password manager.
