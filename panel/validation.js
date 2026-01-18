// SAP Pro Toolkit - Input Validation & Sanitization
// Prevents breaks from malformed input and ensures consistent formatting

// ==================== CONSTANTS ====================

const VALIDATION_LIMITS = {
  // Environment limits
  ENV_NAME_MIN: 3,
  ENV_NAME_MAX: 100,
  ENV_HOSTNAME_MIN: 5,
  ENV_HOSTNAME_MAX: 255,
  ENV_NOTES_MAX: 500,

  // Shortcut limits
  SHORTCUT_NAME_MIN: 3,
  SHORTCUT_NAME_MAX: 100,
  SHORTCUT_URL_MIN: 10,
  SHORTCUT_URL_MAX: 2000,
  SHORTCUT_NOTES_MAX: 500,

  // Note limits
  NOTE_TITLE_MIN: 3,
  NOTE_TITLE_MAX: 100,
  NOTE_CONTENT_MAX: 5000,

  // Tag limits
  TAG_NAME_MIN: 1,
  TAG_NAME_MAX: 30,
  TAG_MAX_COUNT: 10
};

// ==================== TEXT SANITIZATION ====================

/**
 * Sanitize text input to prevent XSS and formatting issues
 * @param {string} text - Input text to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized text
 */
function sanitizeText(text, maxLength, options = {}) {
  if (!text || typeof text !== 'string') return '';

  // Remove HTML tags (prevent XSS)
  text = text.replace(/<[^>]*>/g, '');

  // Remove script tags and dangerous attributes
  text = text.replace(/javascript:/gi, '');
  text = text.replace(/on\w+\s*=/gi, '');

  // Normalize whitespace
  text = text.trim().replace(/\s+/g, ' ');

  // Truncate if needed
  if (maxLength && text.length > maxLength) {
    text = text.substring(0, maxLength).trim();
  }

  // Auto-capitalize first letter if requested
  if (options.capitalize && text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }

  // Convert to lowercase if requested (for hostnames, etc.)
  if (options.lowercase) {
    text = text.toLowerCase();
  }

  return text;
}

/**
 * Sanitize and format hostname
 * @param {string} hostname - Hostname to sanitize
 * @returns {string} Sanitized hostname
 */
function sanitizeHostname(hostname) {
  if (!hostname || typeof hostname !== 'string') return '';

  // Remove protocol if present
  hostname = hostname.replace(/^https?:\/\//, '');

  // Trim and lowercase
  hostname = hostname.trim().toLowerCase();

  // Extract just the domain part before any path/query/hash
  let hostnameOnly = hostname.split('/')[0].split('?')[0].split('#')[0];

  // Remove spaces from hostname part
  hostnameOnly = hostnameOnly.replace(/\s+/g, '');

  // Get the rest (path, query, hash) if any
  const pathPart = hostname.substring(hostnameOnly.length);

  // Validate hostname format (only letters, numbers, dots, hyphens)
  if (hostnameOnly && !/^[a-zA-Z0-9.-]+$/.test(hostnameOnly)) {
    // Remove invalid characters
    hostnameOnly = hostnameOnly.replace(/[^a-zA-Z0-9.-]/g, '');
  }

  return hostnameOnly + pathPart;
}

/**
 * Sanitize URL
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL
 */
function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';

  // Trim whitespace
  url = url.trim();

  // Remove dangerous protocols
  if (url.match(/^(javascript|data|vbscript):/i)) {
    return '';
  }

  // Ensure protocol is present for absolute URLs
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    url = 'https://' + url;
  }

  return url;
}

/**
 * Parse and sanitize tags from comma-separated string
 * @param {string} tagsString - Comma-separated tags
 * @returns {Array} Array of sanitized tag strings
 */
function sanitizeTags(tagsString) {
  if (!tagsString || typeof tagsString !== 'string') return [];

  const tags = tagsString
    .split(',')
    .map(tag => {
      // Trim and normalize
      tag = tag.trim();

      // Remove special characters except hyphens and underscores
      tag = tag.replace(/[^a-zA-Z0-9\s-_]/g, '');

      // Normalize spaces to single space
      tag = tag.replace(/\s+/g, ' ');

      // Capitalize first letter
      if (tag.length > 0) {
        tag = tag.charAt(0).toUpperCase() + tag.slice(1);
      }

      // Enforce length limits
      if (tag.length > VALIDATION_LIMITS.TAG_NAME_MAX) {
        tag = tag.substring(0, VALIDATION_LIMITS.TAG_NAME_MAX);
      }

      return tag;
    })
    .filter(tag => tag.length >= VALIDATION_LIMITS.TAG_NAME_MIN) // Remove empty/too short tags
    .slice(0, VALIDATION_LIMITS.TAG_MAX_COUNT); // Limit total number of tags

  // Remove duplicates (case-insensitive)
  const uniqueTags = [];
  const seen = new Set();
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      uniqueTags.push(tag);
    }
  }

  return uniqueTags;
}

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Validate environment data
 * @param {Object} env - Environment object to validate
 * @returns {Object} { valid: boolean, errors: Array, sanitized: Object }
 */
function validateEnvironment(env) {
  const errors = [];
  const sanitized = {};

  // Validate name
  sanitized.name = sanitizeText(env.name, VALIDATION_LIMITS.ENV_NAME_MAX, { capitalize: true });
  if (sanitized.name.length < VALIDATION_LIMITS.ENV_NAME_MIN) {
    errors.push(window.i18n('envNameTooShort', [VALIDATION_LIMITS.ENV_NAME_MIN.toString()]));
  }
  if (sanitized.name.length > VALIDATION_LIMITS.ENV_NAME_MAX) {
    errors.push(window.i18n('envNameTooLong', [VALIDATION_LIMITS.ENV_NAME_MAX.toString()]));
  }

  // Validate hostname
  sanitized.hostname = sanitizeHostname(env.hostname);
  if (sanitized.hostname.length < VALIDATION_LIMITS.ENV_HOSTNAME_MIN) {
    errors.push(window.i18n('hostnameTooShort', [VALIDATION_LIMITS.ENV_HOSTNAME_MIN.toString()]));
  }
  if (sanitized.hostname.length > VALIDATION_LIMITS.ENV_HOSTNAME_MAX) {
    errors.push(window.i18n('hostnameTooLong', [VALIDATION_LIMITS.ENV_HOSTNAME_MAX.toString()]));
  }

  // Extract hostname only (before path) for domain validation
  const hostnameOnly = sanitized.hostname.split('/')[0].split('?')[0].split('#')[0];

  // Validate SAP domain
  const sapDomains = [
    'hr.cloud.sap', 'sapsf.com', 'sapsf.cn', 'sapcloud.cn',
    'successfactors.eu', 'sapsf.eu', 'successfactors.com',
    's4hana.ondemand.com', 's4hana.cloud.sap',
    'hana.ondemand.com', 'cfapps', 'build.cloud.sap',
    'ibp.cloud.sap', 'scmibp.ondemand.com', 'ibplanning'
  ];
  const isValidSAPHostname = sapDomains.some(domain => hostnameOnly.includes(domain));
  if (!isValidSAPHostname) {
    errors.push(window.i18n('invalidSapHostname'));
  }

  // Validate type
  const validTypes = ['production', 'preview', 'sales', 'sandbox'];
  sanitized.type = env.type && validTypes.includes(env.type) ? env.type : 'production';

  // Validate notes
  sanitized.notes = sanitizeText(env.notes || '', VALIDATION_LIMITS.ENV_NOTES_MAX);

  // Preserve ID if exists
  if (env.id) sanitized.id = env.id;

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validate shortcut data
 * @param {Object} shortcut - Shortcut object to validate
 * @returns {Object} { valid: boolean, errors: Array, sanitized: Object }
 */
function validateShortcut(shortcut) {
  const errors = [];
  const sanitized = {};

  // Validate name
  sanitized.name = sanitizeText(shortcut.name, VALIDATION_LIMITS.SHORTCUT_NAME_MAX, { capitalize: true });
  if (sanitized.name.length < VALIDATION_LIMITS.SHORTCUT_NAME_MIN) {
    errors.push(window.i18n('shortcutNameTooShort', [VALIDATION_LIMITS.SHORTCUT_NAME_MIN.toString()]));
  }
  if (sanitized.name.length > VALIDATION_LIMITS.SHORTCUT_NAME_MAX) {
    errors.push(window.i18n('shortcutNameTooLong', [VALIDATION_LIMITS.SHORTCUT_NAME_MAX.toString()]));
  }

  // Validate URL
  sanitized.url = sanitizeUrl(shortcut.url);
  if (!sanitized.url.startsWith('http://') && !sanitized.url.startsWith('https://')) {
    errors.push(window.i18n('urlMustBeExternal'));
  }
  if (sanitized.url.length < VALIDATION_LIMITS.SHORTCUT_URL_MIN) {
    errors.push(window.i18n('urlTooShort', [VALIDATION_LIMITS.SHORTCUT_URL_MIN.toString()]));
  }
  if (sanitized.url.length > VALIDATION_LIMITS.SHORTCUT_URL_MAX) {
    errors.push(window.i18n('urlTooLong', [VALIDATION_LIMITS.SHORTCUT_URL_MAX.toString()]));
  }

  // Validate notes
  sanitized.notes = sanitizeText(shortcut.notes || '', VALIDATION_LIMITS.SHORTCUT_NOTES_MAX);

  // Validate icon
  sanitized.icon = shortcut.icon || '8';

  // Validate tags
  sanitized.tags = sanitizeTags(shortcut.tags || '');

  // Preserve ID if exists
  if (shortcut.id) sanitized.id = shortcut.id;

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validate note data
 * @param {Object} note - Note object to validate
 * @returns {Object} { valid: boolean, errors: Array, sanitized: Object }
 */
function validateNote(note) {
  const errors = [];
  const sanitized = {};

  // Validate title
  sanitized.title = sanitizeText(note.title, VALIDATION_LIMITS.NOTE_TITLE_MAX, { capitalize: true });
  if (sanitized.title.length < VALIDATION_LIMITS.NOTE_TITLE_MIN) {
    errors.push(window.i18n('noteTitleTooShort', [VALIDATION_LIMITS.NOTE_TITLE_MIN.toString()]));
  }
  if (sanitized.title.length > VALIDATION_LIMITS.NOTE_TITLE_MAX) {
    errors.push(window.i18n('noteTitleTooLong', [VALIDATION_LIMITS.NOTE_TITLE_MAX.toString()]));
  }

  // Validate content
  sanitized.content = sanitizeText(note.content || '', VALIDATION_LIMITS.NOTE_CONTENT_MAX);

  // Validate icon
  sanitized.icon = note.icon || '0';

  // Validate tags
  sanitized.tags = sanitizeTags(note.tags || '');

  // Preserve ID and timestamp if exist
  if (note.id) sanitized.id = note.id;
  if (note.timestamp) sanitized.timestamp = note.timestamp;

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

// ==================== DATA MIGRATION ====================

/**
 * Sanitize existing data on load to fix legacy malformed entries
 * @param {Array} items - Array of items to sanitize
 * @param {string} type - Type of items ('environment', 'shortcut', 'note')
 * @returns {Array} Sanitized items
 */
function migrateData(items, type) {
  if (!Array.isArray(items)) return [];

  return items.map(item => {
    let result;

    switch (type) {
      case 'environment':
        result = validateEnvironment(item);
        break;
      case 'shortcut':
        result = validateShortcut(item);
        break;
      case 'note':
        result = validateNote(item);
        break;
      default:
        return item;
    }

    // If validation passed or we have sanitized data, use it
    // Otherwise, return original (better to show malformed data than lose it)
    return result.valid ? result.sanitized : (result.sanitized || item);
  });
}

// ==================== CHARACTER COUNTER ====================

/**
 * Update character counter display
 * @param {HTMLElement} input - Input element
 * @param {HTMLElement} counter - Counter display element
 * @param {number} maxLength - Maximum allowed length
 */
function updateCharacterCounter(input, counter, maxLength) {
  if (!input || !counter) return;

  const currentLength = input.value.length;
  const remaining = maxLength - currentLength;

  counter.textContent = `${currentLength}/${maxLength}`;

  // Add warning class if approaching limit
  if (remaining < 50) {
    counter.classList.add('char-warning');
  } else {
    counter.classList.remove('char-warning');
  }

  // Add error class if over limit
  if (remaining < 0) {
    counter.classList.add('char-error');
  } else {
    counter.classList.remove('char-error');
  }
}

/**
 * Setup character counter for an input field
 * @param {string} inputId - Input element ID
 * @param {string} counterId - Counter element ID
 * @param {number} maxLength - Maximum allowed length
 */
function setupCharacterCounter(inputId, counterId, maxLength) {
  const input = document.getElementById(inputId);
  const counter = document.getElementById(counterId);

  if (!input || !counter) return;

  // Set maxlength attribute
  input.setAttribute('maxlength', maxLength);

  // Update counter on input
  input.addEventListener('input', () => {
    updateCharacterCounter(input, counter, maxLength);
  });

  // Initialize counter
  updateCharacterCounter(input, counter, maxLength);
}
