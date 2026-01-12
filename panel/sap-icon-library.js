/**
 * SAP Fiori Icon Library
 * 
 * Provides SAP-themed icons for SF Pro Toolkit with:
 * - Complete icon definitions with SVG paths
 * - Auto-suggestion based on content keywords
 * - Backward compatibility with numeric indices
 * - Theme-aware rendering
 */

// ============================================================================
// ENVIRONMENT ICONS
// ============================================================================

const ENVIRONMENT_ICONS = {
  production: {
    id: 'production',
    label: 'Production',
    emoji: '🏭',
    // Factory/Industry icon - represents live production environment
    path: 'M22 18V22H2V18L6 14H10V11H14V8H18V11H22L22 18ZM16 20V16H8V20H16ZM4 20V16H6V20H4ZM18 20H20V16H18V20Z',
    viewBox: '0 0 24 24',
    color: '#DD0000',
    colorDark: '#FF5555'
  },
  preview: {
    id: 'preview',
    label: 'Preview',
    emoji: '👁️',
    // Eye icon - represents viewing/previewing
    path: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
    viewBox: '0 0 24 24',
    color: '#0070F2',
    colorDark: '#5AB3FF'
  },
  sales: {
    id: 'sales',
    label: 'Sales/Demo',
    emoji: '🎪',
    // Presentation/Demo icon - represents showcasing
    path: 'M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM10 12H8l4-4 4 4h-2v4h-4v-4z',
    viewBox: '0 0 24 24',
    color: '#F58B00',
    colorDark: '#FFB84D'
  },
  sandbox: {
    id: 'sandbox',
    label: 'Sandbox',
    emoji: '🧪',
    // Lab/Experiment icon - represents testing/development
    path: 'M7 2v2h1v14c0 2.21 1.79 4 4 4s4-1.79 4-4V4h1V2H7zm2 2h6v3h-2.5v3.5h-1V7H9V4zm2 5.5h2.5V16h-1v-3.5h-1.5V9.5z',
    viewBox: '0 0 24 24',
    color: '#9C27B0',
    colorDark: '#CE93D8'
  }
};

// ============================================================================
// SHORTCUT ICONS (25 total)
// ============================================================================

const SHORTCUT_ICONS = [
  {
    index: 0,
    id: 'map',
    label: 'Map/Roadmap',
    emoji: '🗺️',
    category: 'Navigation',
    path: 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z',
    viewBox: '0 0 24 24'
  },
  {
    index: 1,
    id: 'settings',
    label: 'Settings',
    emoji: '⚙️',
    category: 'Admin',
    path: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
    viewBox: '0 0 24 24'
  },
  {
    index: 2,
    id: 'security',
    label: 'Security',
    emoji: '🔐',
    category: 'Admin',
    path: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z',
    viewBox: '0 0 24 24'
  },
  {
    index: 3,
    id: 'people',
    label: 'People/Teams',
    emoji: '👥',
    category: 'People',
    path: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    viewBox: '0 0 24 24'
  },
  {
    index: 4,
    id: 'analytics',
    label: 'Analytics',
    emoji: '📊',
    category: 'Business',
    path: 'M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z',
    viewBox: '0 0 24 24'
  },
  {
    index: 5,
    id: 'tools',
    label: 'Tools',
    emoji: '🛠️',
    category: 'Admin',
    path: 'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z',
    viewBox: '0 0 24 24'
  },
  {
    index: 6,
    id: 'document',
    label: 'Document',
    emoji: '📝',
    category: 'Documentation',
    path: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
    viewBox: '0 0 24 24'
  },
  {
    index: 7,
    id: 'target',
    label: 'Target/Goal',
    emoji: '🎯',
    category: 'Business',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    viewBox: '0 0 24 24'
  },
  {
    index: 8,
    id: 'page',
    label: 'Page',
    emoji: '📄',
    category: 'Documentation',
    path: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z',
    viewBox: '0 0 24 24'
  },
  {
    index: 9,
    id: 'link',
    label: 'Link',
    emoji: '🔗',
    category: 'Navigation',
    path: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
    viewBox: '0 0 24 24'
  },
  {
    index: 10,
    id: 'pricing',
    label: 'Pricing/Cost',
    emoji: '💰',
    category: 'Business',
    path: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z',
    viewBox: '0 0 24 24'
  },
  {
    index: 11,
    id: 'preview-eye',
    label: 'Preview',
    emoji: '👁️',
    category: 'Navigation',
    path: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
    viewBox: '0 0 24 24'
  },
  {
    index: 12,
    id: 'datacenter',
    label: 'Datacenter/Region',
    emoji: '🌍',
    category: 'Infrastructure',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
    viewBox: '0 0 24 24'
  },
  {
    index: 13,
    id: 'credentials',
    label: 'Credentials',
    emoji: '🔑',
    category: 'Admin',
    path: 'M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
    viewBox: '0 0 24 24'
  },
  {
    index: 14,
    id: 'demo',
    label: 'Demo/Walkthrough',
    emoji: '🎪',
    category: 'Learning',
    path: 'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z',
    viewBox: '0 0 24 24'
  },
  {
    index: 15,
    id: 'ai',
    label: 'AI/Joule',
    emoji: '🤖',
    category: 'Technology',
    path: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z',
    viewBox: '0 0 24 24'
  },
  {
    index: 16,
    id: 'sync',
    label: 'Sync/Restore',
    emoji: '🔄',
    category: 'Infrastructure',
    path: 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
    viewBox: '0 0 24 24'
  },
  {
    index: 17,
    id: 'learning',
    label: 'Learning',
    emoji: '📚',
    category: 'Learning',
    path: 'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z',
    viewBox: '0 0 24 24'
  },
  {
    index: 18,
    id: 'company',
    label: 'Company/Customer',
    emoji: '🏢',
    category: 'Business',
    path: 'M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z',
    viewBox: '0 0 24 24'
  },
  {
    index: 19,
    id: 'package',
    label: 'Package/Module',
    emoji: '📦',
    category: 'Technology',
    path: 'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
    viewBox: '0 0 24 24'
  },
  {
    index: 20,
    id: 'alert',
    label: 'Alert/Notification',
    emoji: '🔔',
    category: 'System',
    path: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
    viewBox: '0 0 24 24'
  },
  {
    index: 21,
    id: 'success',
    label: 'Success/Verified',
    emoji: '✅',
    category: 'System',
    path: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    viewBox: '0 0 24 24'
  },
  {
    index: 22,
    id: 'warning',
    label: 'Warning',
    emoji: '⚠️',
    category: 'System',
    path: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
    viewBox: '0 0 24 24'
  },
  {
    index: 23,
    id: 'external',
    label: 'External Link',
    emoji: '🌐',
    category: 'Navigation',
    path: 'M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z',
    viewBox: '0 0 24 24'
  },
  {
    index: 24,
    id: 'training',
    label: 'Training',
    emoji: '🎓',
    category: 'Learning',
    path: 'M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z',
    viewBox: '0 0 24 24'
  }
];

// ============================================================================
// NOTE ICONS (20 total)
// ============================================================================

const NOTE_ICONS = [
  {
    index: 0,
    id: 'note',
    label: 'Note',
    emoji: '📝',
    category: 'General',
    path: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    viewBox: '0 0 24 24'
  },
  {
    index: 1,
    id: 'key',
    label: 'Key/Access',
    emoji: '🔑',
    category: 'Admin',
    path: 'M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
    viewBox: '0 0 24 24'
  },
  {
    index: 2,
    id: 'id',
    label: 'ID/User',
    emoji: '🆔',
    category: 'People',
    path: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    viewBox: '0 0 24 24'
  },
  {
    index: 3,
    id: 'link',
    label: 'Link/URL',
    emoji: '🔗',
    category: 'General',
    path: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
    viewBox: '0 0 24 24'
  },
  {
    index: 4,
    id: 'settings',
    label: 'Settings/Config',
    emoji: '⚙️',
    category: 'Admin',
    path: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
    viewBox: '0 0 24 24'
  },
  {
    index: 5,
    id: 'clipboard',
    label: 'Clipboard',
    emoji: '📋',
    category: 'General',
    path: 'M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z',
    viewBox: '0 0 24 24'
  },
  {
    index: 6,
    id: 'idea',
    label: 'Idea/Insight',
    emoji: '💡',
    category: 'General',
    path: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z',
    viewBox: '0 0 24 24'
  },
  {
    index: 7,
    id: 'pin',
    label: 'Pinned/Important',
    emoji: '📌',
    category: 'General',
    path: 'M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z',
    viewBox: '0 0 24 24'
  },
  {
    index: 8,
    id: 'pricing-note',
    label: 'Pricing Info',
    emoji: '💲',
    category: 'Business',
    path: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z',
    viewBox: '0 0 24 24'
  },
  {
    index: 9,
    id: 'user',
    label: 'User/Profile',
    emoji: '👤',
    category: 'People',
    path: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    viewBox: '0 0 24 24'
  },
  {
    index: 10,
    id: 'screenshot',
    label: 'Screenshot',
    emoji: '📸',
    category: 'General',
    path: 'M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z',
    viewBox: '0 0 24 24'
  },
  {
    index: 11,
    id: 'testing',
    label: 'Testing/QA',
    emoji: '🧪',
    category: 'Technology',
    path: 'M7 2v2h1v14c0 2.21 1.79 4 4 4s4-1.79 4-4V4h1V2H7zm2 2h6v3h-2.5v3.5h-1V7H9V4zm2 5.5h2.5V16h-1v-3.5h-1.5V9.5z',
    viewBox: '0 0 24 24'
  },
  {
    index: 12,
    id: 'tag',
    label: 'Tag/Label',
    emoji: '🏷️',
    category: 'General',
    path: 'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z',
    viewBox: '0 0 24 24'
  },
  {
    index: 13,
    id: 'contact',
    label: 'Contact',
    emoji: '📞',
    category: 'People',
    path: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
    viewBox: '0 0 24 24'
  },
  {
    index: 14,
    id: 'email',
    label: 'Email',
    emoji: '📧',
    category: 'People',
    path: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    viewBox: '0 0 24 24'
  },
  {
    index: 15,
    id: 'date',
    label: 'Date/Schedule',
    emoji: '🗓️',
    category: 'General',
    path: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z',
    viewBox: '0 0 24 24'
  },
  {
    index: 16,
    id: 'reminder',
    label: 'Reminder',
    emoji: '⏰',
    category: 'General',
    path: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
    viewBox: '0 0 24 24'
  },
  {
    index: 17,
    id: 'data',
    label: 'Data/Table',
    emoji: '📊',
    category: 'Technology',
    path: 'M10 10.02h5V21h-5zM17 21h3c1.1 0 2-.9 2-2v-9h-5v11zm3-18H5c-1.1 0-2 .9-2 2v3h19V5c0-1.1-.9-2-2-2zM3 19c0 1.1.9 2 2 2h3V10.02H3V19z',
    viewBox: '0 0 24 24'
  },
  {
    index: 18,
    id: 'search',
    label: 'Search/Query',
    emoji: '🔍',
    category: 'General',
    path: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    viewBox: '0 0 24 24'
  },
  {
    index: 19,
    id: 'edit',
    label: 'Edit/Modify',
    emoji: '✏️',
    category: 'General',
    path: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    viewBox: '0 0 24 24'
  }
];

// ============================================================================
// AUTO-SUGGESTION KEYWORDS
// ============================================================================

const ICON_SUGGESTION_KEYWORDS = {
  // Pricing/Financial
  'pricing': ['price', 'cost', 'sku', 'billing', 'payment', 'invoice', 'budget', 'fee', 'paid', 'purchase', 'revenue'],
  'pricing-note': ['price', 'cost', 'sku', 'billing', 'payment', 'invoice', 'budget', 'fee', 'paid', 'purchase', 'revenue'],
  
  // Preview/Testing
  'preview-eye': ['preview', 'view', 'display', 'show', 'visual'],
  'testing': ['test', 'qa', 'quality', 'validation', 'verify', 'check'],
  
  // Credentials/Access
  'credentials': ['password', 'credential', 'login', 'auth', 'access', 'token', 'authentication'],
  'key': ['key', 'secret', 'api key', 'certificate', 'private', 'secure'],
  
  // Datacenter/Infrastructure
  'datacenter': ['datacenter', 'dc', 'dc10', 'dc68', 'dc20', 'region', 'landscape', 'us10', 'us20', 'eu10', 'eu20', 'infrastructure'],
  
  // Demo/Training
  'demo': ['demo', 'walkme', 'presentation', 'showcase', 'demonstration'],
  'training': ['training', 'course', 'certification', 'learning path', 'education', 'workshop'],
  'learning': ['guide', 'tutorial', 'how-to', 'documentation', 'learn', 'study'],
  
  // AI/Joule
  'ai': ['joule', 'ai', 'copilot', 'chatbot', 'agent', 'assistant', 'ml', 'artificial intelligence', 'machine learning'],
  'idea': ['idea', 'insight', 'tip', 'suggestion', 'recommendation', 'brainstorm'],
  
  // Admin/Configuration
  'settings': ['admin', 'config', 'configuration', 'provisioning', 'setup', 'preference', 'option'],
  'security': ['security', 'role', 'permission', 'authorization', 'rbac', 'access control'],
  
  // Analytics/Reporting
  'analytics': ['report', 'analytics', 'dashboard', 'metrics', 'kpi', 'insight', 'intelligence', 'measurement'],
  'data': ['data', 'dataset', 'table', 'export', 'import', 'database', 'records'],
  
  // People/HR
  'people': ['employee', 'hr', 'people', 'team', 'workforce', 'staff', 'personnel'],
  'user': ['user', 'profile', 'account', 'member'],
  'id': ['id', 'userid', 'identifier', 'username', 'employee id'],
  
  // Integration
  'external': ['api', 'integration', 'odata', 'endpoint', 'webhook', 'external', 'service', 'rest'],
  'link': ['url', 'link', 'hyperlink', 'reference', 'website', 'web'],
  'sync': ['sync', 'synchronize', 'restore', 'backup', 'snapshot', 'replicate'],
  
  // Company/Customer
  'company': ['company', 'customer', 'client', 'tenant', 'organization', 'enterprise', 'business'],
  
  // Documentation
  'document': ['help', 'doc', 'documentation', 'reference', 'manual', 'handbook'],
  'page': ['page', 'article', 'content', 'wiki'],
  
  // System
  'alert': ['alert', 'notification', 'reminder', 'alarm', 'notice'],
  'success': ['success', 'complete', 'verified', 'approved', 'confirmed', 'done', 'finished'],
  'warning': ['warning', 'error', 'issue', 'problem', 'caution', 'alert', 'fail'],
  
  // Contact
  'contact': ['contact', 'phone', 'call', 'support', 'helpdesk'],
  'email': ['email', 'mail', 'message', 'inbox', 'correspondence'],
  
  // Tools
  'tools': ['tool', 'utility', 'admin', 'developer', 'technical'],
  
  // General
  'note': ['note', 'memo', 'scratch', 'temporary', 'draft', 'jot'],
  'clipboard': ['clipboard', 'paste', 'copy', 'buffer'],
  'pin': ['pin', 'important', 'favorite', 'bookmark', 'star'],
  'screenshot': ['screenshot', 'image', 'picture', 'visual', 'capture', 'snap'],
  'tag': ['tag', 'label', 'category', 'classification', 'organize'],
  'date': ['date', 'calendar', 'schedule', 'timeline', 'time', 'deadline'],
  'search': ['search', 'find', 'query', 'lookup', 'discover'],
  'edit': ['edit', 'modify', 'update', 'change', 'revise'],
  'target': ['target', 'goal', 'objective', 'aim', 'milestone'],
  'map': ['map', 'roadmap', 'plan', 'strategy', 'direction'],
  'package': ['package', 'module', 'component', 'plugin', 'extension']
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get icon by ID or index with backward compatibility
 * @param {string|number} iconValue - Icon ID (string) or index (number)
 * @param {string} iconType - 'shortcut', 'note', or 'environment'
 * @returns {Object} Icon object with id, label, path, viewBox, etc.
 */
function getIconByValue(iconValue, iconType = 'shortcut') {
  const iconArrays = {
    'shortcut': SHORTCUT_ICONS,
    'note': NOTE_ICONS,
    'environment': Object.values(ENVIRONMENT_ICONS)
  };
  
  const icons = iconArrays[iconType] || SHORTCUT_ICONS;
  
  // Handle numeric index (backward compatibility)
  if (typeof iconValue === 'number' || /^\d+$/.test(iconValue)) {
    const index = parseInt(iconValue);
    return icons.find(icon => icon.index === index) || icons[0];
  }
  
  // Handle string ID
  if (typeof iconValue === 'string') {
    const icon = icons.find(icon => icon.id === iconValue);
    if (icon) return icon;
    
    // For environment type
    if (iconType === 'environment') {
      return ENVIRONMENT_ICONS[iconValue] || ENVIRONMENT_ICONS.production;
    }
  }
  
  // Fallback
  return icons[0];
}

/**
 * Suggest icon based on content keywords
 * @param {string} name - Item name
 * @param {string} notes - Item notes/description
 * @param {string} tags - Item tags
 * @param {string} iconType - 'shortcut' or 'note'
 * @returns {string} Suggested icon ID
 */
function suggestIcon(name = '', notes = '', tags = '', iconType = 'shortcut') {
  const text = `${name} ${notes} ${tags}`.toLowerCase();
  
  // Score each icon based on keyword matches
  const scores = {};
  
  for (const [iconId, keywords] of Object.entries(ICON_SUGGESTION_KEYWORDS)) {
    scores[iconId] = 0;
    
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        // Weight longer matches higher (more specific)
        scores[iconId] += keyword.length;
      }
    }
  }
  
  // Find highest scoring icon
  const suggestedIconId = Object.keys(scores).reduce((a, b) => 
    scores[a] > scores[b] ? a : b
  );
  
  // Return suggestion if it has a positive score and is valid for the type
  if (scores[suggestedIconId] > 0) {
    const iconArrays = {
      'shortcut': SHORTCUT_ICONS,
      'note': NOTE_ICONS
    };
    
    const icons = iconArrays[iconType] || SHORTCUT_ICONS;
    const isValid = icons.some(icon => icon.id === suggestedIconId);
    
    if (isValid) {
      return suggestedIconId;
    }
  }
  
  // Default fallback
  return iconType === 'note' ? 'note' : 'document';
}

/**
 * Render icon as SVG HTML string
 * @param {Object} icon - Icon object
 * @param {number} size - Icon size in pixels
 * @param {string} color - Icon color (optional, uses theme default if not provided)
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

/**
 * Get all icons for a specific type, grouped by category
 * @param {string} iconType - 'shortcut' or 'note'
 * @returns {Object} Icons grouped by category
 */
function getIconsByCategory(iconType = 'shortcut') {
  const icons = iconType === 'note' ? NOTE_ICONS : SHORTCUT_ICONS;
  const grouped = {};
  
  icons.forEach(icon => {
    const category = icon.category || 'General';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(icon);
  });
  
  return grouped;
}

// ============================================================================
// EXPORTS
// ============================================================================

// Make functions and data available globally
if (typeof window !== 'undefined') {
  window.SAPIconLibrary = {
    ENVIRONMENT_ICONS,
    SHORTCUT_ICONS,
    NOTE_ICONS,
    ICON_SUGGESTION_KEYWORDS,
    getIconByValue,
    suggestIcon,
    renderIconSVG,
    getIconsByCategory
  };
}
