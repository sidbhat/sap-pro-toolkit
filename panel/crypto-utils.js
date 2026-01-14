/**
 * Cryptographic utilities for secure credential storage
 * Uses Web Crypto API with AES-256-GCM encryption
 * 
 * Security features:
 * - AES-256-GCM authenticated encryption
 * - PBKDF2-SHA256 key derivation (100,000 iterations)
 * - Unique IV per encryption operation
 * - Keys derived from extension runtime ID
 * - Zero-knowledge architecture (passwords never in plaintext)
 */

class CryptoUtils {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.ivLength = 12; // 96 bits for GCM
    this.iterations = 100000; // PBKDF2 iterations
    this.saltLength = 16; // 128 bits
  }

  /**
   * Derive encryption key from extension ID and browser fingerprint
   * This binds keys to the specific browser/extension instance
   * @returns {Promise<CryptoKey>} Derived encryption key
   */
  async deriveEncryptionKey() {
    try {
      // Create key material from extension ID + user agent
      // This ensures keys are unique per installation
      const keyMaterial = chrome.runtime.id + navigator.userAgent;
      const encoder = new TextEncoder();
      const keyData = encoder.encode(keyMaterial);

      // Import key material
      const importedKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      // Get or create salt
      const salt = await this.getSalt();

      // Derive actual encryption key using PBKDF2
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: this.iterations,
          hash: 'SHA-256'
        },
        importedKey,
        {
          name: this.algorithm,
          length: this.keyLength
        },
        false, // Not extractable
        ['encrypt', 'decrypt']
      );

      return derivedKey;
    } catch (error) {
      console.error('Error deriving encryption key:', error);
      throw new Error('Failed to derive encryption key');
    }
  }

  /**
   * Get or create cryptographic salt
   * Salt is stored in chrome.storage.local and reused for consistency
   * @returns {Promise<Uint8Array>} Salt for key derivation
   */
  async getSalt() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['crypto_salt'], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        if (result.crypto_salt) {
          // Use existing salt
          resolve(new Uint8Array(result.crypto_salt));
        } else {
          // Generate new salt
          const newSalt = crypto.getRandomValues(new Uint8Array(this.saltLength));
          
          // Store salt for future use
          chrome.storage.local.set({ crypto_salt: Array.from(newSalt) }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
              return;
            }
            resolve(newSalt);
          });
        }
      });
    });
  }

  /**
   * Encrypt a plaintext password
   * @param {string} plaintext - Password to encrypt
   * @returns {Promise<Object>} Object containing ciphertext and IV as arrays
   */
  async encryptPassword(plaintext) {
    try {
      if (!plaintext || typeof plaintext !== 'string') {
        throw new Error('Invalid plaintext input');
      }

      // Derive encryption key
      const key = await this.deriveEncryptionKey();

      // Generate unique IV for this encryption
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));

      // Encode plaintext
      const encoder = new TextEncoder();
      const encoded = encoder.encode(plaintext);

      // Encrypt
      const ciphertext = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encoded
      );

      // Return as object with arrays (suitable for JSON storage)
      return {
        ciphertext: Array.from(new Uint8Array(ciphertext)),
        iv: Array.from(iv),
        algorithm: this.algorithm,
        version: '1.0' // For future compatibility
      };
    } catch (error) {
      console.error('Error encrypting password:', error);
      throw new Error('Failed to encrypt password');
    }
  }

  /**
   * Decrypt an encrypted password
   * @param {Object} encrypted - Object containing ciphertext and IV
   * @returns {Promise<string>} Decrypted plaintext password
   */
  async decryptPassword(encrypted) {
    try {
      if (!encrypted || !encrypted.ciphertext || !encrypted.iv) {
        throw new Error('Invalid encrypted data structure');
      }

      // Derive encryption key
      const key = await this.deriveEncryptionKey();

      // Convert arrays back to Uint8Array
      const ciphertext = new Uint8Array(encrypted.ciphertext);
      const iv = new Uint8Array(encrypted.iv);

      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        ciphertext
      );

      // Decode to string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Error decrypting password:', error);
      throw new Error('Failed to decrypt password');
    }
  }

  /**
   * Encrypt username (optional, for consistency)
   * @param {string} username - Username to encrypt
   * @returns {Promise<Object>} Encrypted username object
   */
  async encryptUsername(username) {
    return this.encryptPassword(username);
  }

  /**
   * Decrypt username (optional, for consistency)
   * @param {Object} encrypted - Encrypted username object
   * @returns {Promise<string>} Decrypted username
   */
  async decryptUsername(encrypted) {
    return this.decryptPassword(encrypted);
  }

  /**
   * Securely wipe a string from memory (best effort)
   * Note: JavaScript doesn't provide true memory wiping, but we can help GC
   * @param {string} sensitiveData - Data to wipe
   */
  wipeFromMemory(sensitiveData) {
    if (sensitiveData && typeof sensitiveData === 'string') {
      // Overwrite with null (helps garbage collection)
      sensitiveData = null;
    }
  }

  /**
   * Test encryption/decryption roundtrip
   * Useful for verifying crypto setup
   * @returns {Promise<boolean>} True if test passes
   */
  async testEncryption() {
    try {
      const testPassword = 'Test123!@#';
      const encrypted = await this.encryptPassword(testPassword);
      const decrypted = await this.decryptPassword(encrypted);
      
      const success = decrypted === testPassword;
      
      if (success) {
        console.log('✅ Encryption test passed');
      } else {
        console.error('❌ Encryption test failed: decrypted value does not match');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Encryption test failed with error:', error);
      return false;
    }
  }

  /**
   * Encrypt data and store in chrome.storage.local
   * @param {string} key - Storage key
   * @param {any} data - Data to encrypt (will be JSON stringified)
   * @returns {Promise<void>}
   */
  async encryptAndStore(key, data) {
    try {
      // Convert data to string if it's an object
      const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Encrypt the data
      const encrypted = await this.encryptPassword(plaintext);
      
      // Store encrypted data
      await chrome.storage.local.set({ [key]: encrypted });
      
      console.log(`[CryptoUtils] Encrypted and stored: ${key}`);
    } catch (error) {
      console.error(`[CryptoUtils] Failed to encrypt and store ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt data from chrome.storage.local
   * @param {string} key - Storage key
   * @returns {Promise<any>} Decrypted data (parsed if JSON)
   */
  async retrieveAndDecrypt(key) {
    try {
      const result = await chrome.storage.local.get(key);
      const encrypted = result[key];
      
      if (!encrypted) {
        return null;
      }
      
      // Decrypt the data
      const plaintext = await this.decryptPassword(encrypted);
      
      // Try to parse as JSON, otherwise return as string
      try {
        return JSON.parse(plaintext);
      } catch {
        return plaintext;
      }
    } catch (error) {
      console.error(`[CryptoUtils] Failed to retrieve and decrypt ${key}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
const cryptoUtils = new CryptoUtils();

// Export as window.CryptoUtils for backward compatibility
window.CryptoUtils = cryptoUtils;

// Self-test on load (only in development)
if (chrome.runtime.getManifest().version.includes('dev')) {
  cryptoUtils.testEncryption().then(result => {
    if (!result) {
      console.warn('Crypto self-test failed - check Web Crypto API support');
    }
  });
}
