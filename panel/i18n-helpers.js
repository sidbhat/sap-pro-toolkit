/**
 * i18n Helper Utilities
 * 
 * Wrapper functions to simplify internationalization in SF Pro Toolkit.
 * Reduces boilerplate when using chrome.i18n.getMessage() API.
 */

/**
 * Get internationalized message with optional substitutions
 * @param {string} key - Message key from messages.json
 * @param {string|string[]} [substitutions] - Optional substitution values for placeholders
 * @returns {string} Localized message, or key if not found (graceful fallback)
 */
window.i18n = function(key, substitutions) {
  try {
    const message = chrome.i18n.getMessage(key, substitutions);
    // If message is empty, return key as fallback (helps debug missing translations)
    return message || key;
  } catch (error) {
    console.warn(`[i18n] Failed to get message for key: ${key}`, error);
    return key;
  }
};

/**
 * Show toast notification with internationalized message
 * @param {string} key - Message key from messages.json
 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
 * @param {string|string[]} [substitutions] - Optional substitution values for placeholders
 */
window.showToastI18n = function(key, type, substitutions) {
  if (window.showToast) {
    const message = window.i18n(key, substitutions);
    window.showToast(message, type);
  } else {
    console.warn('[i18n] showToast function not available');
  }
};

/**
 * Get internationalized confirmation dialog message
 * Useful for confirm() dialogs with multi-line text
 * @param {string} key - Message key from messages.json
 * @param {string|string[]} [substitutions] - Optional substitution values
 * @returns {string} Localized message for confirmation dialog
 */
window.i18nConfirm = function(key, substitutions) {
  return window.i18n(key, substitutions);
};

// Log helper loaded
console.log('[i18n] i18n-helpers.js loaded successfully');
