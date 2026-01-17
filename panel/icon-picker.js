/**
 * Icon Picker Component - Slack-style Visual Selection
 * 
 * Provides a clean, visual grid for selecting icons
 * No descriptions, just icons - modern and intuitive
 */

/**
 * Render icon picker in a container
 * @param {HTMLElement} containerElement - Container to render picker into
 * @param {string} currentIconId - Currently selected icon ID
 * @param {function} onChange - Callback when icon is selected (receives iconId)
 */
window.renderIconPicker = function(containerElement, currentIconId, onChange) {
  if (!containerElement) {
    console.error('[Icon Picker] Container element not found');
    return;
  }

  const icons = window.SAPIconLibrary.getAllUniversalIcons();
  
  // Build grid HTML
  let html = '<div class="icon-picker-grid">';
  
  icons.forEach(icon => {
    const isSelected = icon.id === currentIconId ? 'selected' : '';
    html += `
      <button type="button" 
              class="icon-picker-btn ${isSelected}" 
              data-icon-id="${icon.id}"
              title="${icon.label}"
              aria-label="${icon.label}">
        ${window.SAPIconLibrary.renderIconSVG(icon, 24)}
      </button>
    `;
  });
  
  html += '</div>';
  
  // Inject HTML
  containerElement.innerHTML = html;
  
  // Wire up click handlers
  const buttons = containerElement.querySelectorAll('.icon-picker-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const iconId = e.currentTarget.getAttribute('data-icon-id');
      
      // Update visual selection
      buttons.forEach(b => b.classList.remove('selected'));
      e.currentTarget.classList.add('selected');
      
      // Fire callback
      if (onChange && typeof onChange === 'function') {
        onChange(iconId);
      }
    });
  });
};

/**
 * Initialize icon picker for a modal
 * @param {string} pickerContainerId - ID of container element
 * @param {string} hiddenInputId - ID of hidden input to store selected icon
 * @param {string} defaultIcon - Default icon ID
 */
window.initIconPicker = function(pickerContainerId, hiddenInputId, defaultIcon) {
  const container = document.getElementById(pickerContainerId);
  const hiddenInput = document.getElementById(hiddenInputId);
  
  if (!container || !hiddenInput) {
    console.error('[Icon Picker] Container or hidden input not found');
    return;
  }
  
  const currentIcon = hiddenInput.value || defaultIcon;
  
  window.renderIconPicker(container, currentIcon, (iconId) => {
    hiddenInput.value = iconId;
  });
};
