/**
 * SAP Fiori Icon Library - Streamlined Universal Icon Set
 * 
 * Provides 10 essential icons for all features (Shortcuts, Notes, Profiles)
 * Plus 4 specialized Environment icons
 */

// ============================================================================
// UNIVERSAL ICONS (10 total - used for Shortcuts, Notes, Profiles)
// ============================================================================

const UNIVERSAL_ICONS = [
  {
    id: 'note',
    label: 'Note',
    path: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    viewBox: '0 0 24 24'
  },
  {
    id: 'link',
    label: 'Link',
    path: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
    viewBox: '0 0 24 24'
  },
  {
    id: 'folder',
    label: 'Folder',
    path: 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
    viewBox: '0 0 24 24'
  },
  {
    id: 'settings',
    label: 'Settings',
    path: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
    viewBox: '0 0 24 24'
  },
  {
    id: 'security',
    label: 'Security',
    path: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z',
    viewBox: '0 0 24 24'
  },
  {
    id: 'people',
    label: 'People',
    path: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    viewBox: '0 0 24 24'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: 'M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z',
    viewBox: '0 0 24 24'
  },
  {
    id: 'target',
    label: 'Target',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    viewBox: '0 0 24 24'
  },
  {
    id: 'ai',
    label: 'AI',
    path: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z',
    viewBox: '0 0 24 24'
  },
  {
    id: 'external',
    label: 'External',
    path: 'M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z',
    viewBox: '0 0 24 24'
  }
];

// ============================================================================
// ENVIRONMENT ICONS (4 specialized icons)
// ============================================================================

const ENVIRONMENT_ICONS = {
  production: {
    id: 'production',
    label: 'Production',
    path: 'M22 18V22H2V18L6 14H10V11H14V8H18V11H22L22 18ZM16 20V16H8V20H16ZM4 20V16H6V20H4ZM18 20H20V16H18V20Z',
    viewBox: '0 0 24 24',
    color: '#DD0000',
    colorDark: '#FF5555'
  },
  preview: {
    id: 'preview',
    label: 'Preview',
    path: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
    viewBox: '0 0 24 24',
    color: '#0070F2',
    colorDark: '#5AB3FF'
  },
  sales: {
    id: 'sales',
    label: 'Sales/Demo',
    path: 'M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM10 12H8l4-4 4 4h-2v4h-4v-4z',
    viewBox: '0 0 24 24',
    color: '#F58B00',
    colorDark: '#FFB84D'
  },
  sandbox: {
    id: 'sandbox',
    label: 'Sandbox',
    path: 'M7 2v2h1v14c0 2.21 1.79 4 4 4s4-1.79 4-4V4h1V2H7zm2 2h6v3h-2.5v3.5h-1V7H9V4zm2 5.5h2.5V16h-1v-3.5h-1.5V9.5z',
    viewBox: '0 0 24 24',
    color: '#9C27B0',
    colorDark: '#CE93D8'
  }
};

// ============================================================================
// DEFAULT ICONS
// ============================================================================

const DEFAULT_ICONS = {
  profile: 'people',
  shortcut: 'link',
  note: 'note',
  environment: 'production'
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all universal icons (for Shortcuts, Notes, Profiles)
 * @returns {Array} Array of 10 universal icon objects
 */
function getAllUniversalIcons() {
  return UNIVERSAL_ICONS;
}

/**
 * Get icon by ID
 * @param {string} iconId - Icon ID
 * @param {string} iconType - 'universal' or 'environment'
 * @returns {Object} Icon object with id, label, path, viewBox
 */
function getIconById(iconId, iconType = 'universal') {
  if (iconType === 'environment') {
    return ENVIRONMENT_ICONS[iconId] || ENVIRONMENT_ICONS.production;
  }

  const icon = UNIVERSAL_ICONS.find(icon => icon.id === iconId);
  return icon || null; // Return null if not found, allows emoji fallback
}

/**
 * Get default icon for a context
 * @param {string} context - 'profile', 'shortcut', 'note', or 'environment'
 * @returns {string} Default icon ID
 */
function getDefaultIcon(context) {
  return DEFAULT_ICONS[context] || 'note';
}

/**
 * Render icon as SVG HTML string
 * @param {Object} icon - Icon object
 * @param {number} size - Icon size in pixels
 * @param {string} color - Icon color (optional, uses currentColor if not provided)
 * @returns {string} SVG HTML string
 */
function renderIconSVG(icon, size = 16, color = null) {
  if (!icon) return '';

  const fillColor = color || icon.color || 'currentColor';
  const viewBox = icon.viewBox || '0 0 24 24';

  return `<svg width="${size}" height="${size}" viewBox="${viewBox}" fill="${fillColor}" xmlns="http://www.w3.org/2000/svg" aria-label="${icon.label}">
    <path d="${icon.path}"/>
  </svg>`;
}

// ============================================================================
// EXPORTS
// ============================================================================

if (typeof window !== 'undefined') {
  window.SAPIconLibrary = {
    UNIVERSAL_ICONS,
    ENVIRONMENT_ICONS,
    DEFAULT_ICONS,
    getAllUniversalIcons,
    getIconById,
    getDefaultIcon,
    renderIconSVG
  };
}
