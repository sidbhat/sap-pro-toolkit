// SAP Pro Toolkit - SVG Renderer Module
// Centralizes all SVG generation for cleaner, more maintainable code

/**
 * SVG Renderer - Generates SVG icons and graphics
 * Extracted from side-panel.js to reduce file size and improve modularity
 */
const SVGRenderer = {
  /**
   * Render environment type icon as SVG
   * @param {string} type - Environment type (production, preview, sales, sandbox)
   * @param {number} size - Icon size in pixels
   * @param {string} theme - Theme (light/dark) for color selection
   * @returns {string} SVG HTML string
   */
  renderEnvironmentIcon(type, size = 18, theme = 'light') {
    // Get icon from SAP Icon Library if available
    if (typeof window.SAPIconLibrary !== 'undefined' && window.SAPIconLibrary.ENVIRONMENT_ICONS) {
      const envIcon = window.SAPIconLibrary.ENVIRONMENT_ICONS[type];
      if (envIcon && envIcon.path) {
        const iconColor = theme === 'dark' ? envIcon.colorDark : envIcon.color;
        return `<svg width="${size}" height="${size}" viewBox="${envIcon.viewBox}" fill="${iconColor}" xmlns="http://www.w3.org/2000/svg" aria-label="${envIcon.label}">
          <path d="${envIcon.path}"/>
        </svg>`;
      }
    }

    // Fallback to emoji if library not loaded
    const emojiMap = {
      production: '🔴',
      preview: '🟢',
      sales: '🟠',
      sandbox: '🟣',
      unknown: '⚫'
    };
    return `<span class="emoji-fallback">${emojiMap[type] || '🔵'}</span>`;
  },

  /**
   * Render pin icon (star)
   * @param {boolean} pinned - Whether item is pinned
   * @param {number} size - Icon size in pixels
   * @returns {string} SVG HTML string
   */
  renderPinIcon(pinned, size = 14) {
    const fillColor = pinned ? '#F59E0B' : 'currentColor';
    const opacity = pinned ? '1' : '0.3';

    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fillColor}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: ${opacity}">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`;
  },

  /**
   * Render switch/reload icon
   * @param {number} size - Icon size in pixels
   * @returns {string} SVG HTML string
   */
  renderSwitchIcon(size = 16) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>`;
  },

  /**
   * Render edit icon (pencil)
   * @param {number} size - Icon size in pixels
   * @returns {string} SVG HTML string
   */
  renderEditIcon(size = 16) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>`;
  },

  /**
   * Render delete icon (trash)
   * @param {number} size - Icon size in pixels
   * @returns {string} SVG HTML string
   */
  renderDeleteIcon(size = 16) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>`;
  },

  /**
   * Render go/arrow icon
   * @param {number} size - Icon size in pixels
   * @returns {string} SVG HTML string
   */
  renderGoIcon(size = 16) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>`;
  },

  /**
   * Render copy icon
   * @param {number} size - Icon size in pixels
   * @returns {string} SVG HTML string
   */
  renderCopyIcon(size = 16) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>`;
  },

  /**
   * Render view/eye icon
   * @param {number} size - Icon size in pixels
   * @returns {string} SVG HTML string
   */
  renderViewIcon(size = 16) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`;
  },

  /**
   * Render checkmark icon
   * @param {number} size - Icon size in pixels
   * @returns {string} SVG HTML string
   */
  renderCheckIcon(size = 14) {
    return `<svg class="profile-check" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>`;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SVGRenderer;
}

// Make available globally for side-panel.js
window.SVGRenderer = SVGRenderer;
