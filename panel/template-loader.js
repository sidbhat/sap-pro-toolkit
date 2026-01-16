// SF Pro Toolkit - Template Loader
// Utility for loading, caching, and filling HTML templates from external files.
// Similar pattern to PromptLoader for maintainability and consistency.

(function (window) {
    const templateCache = new Map();

    /**
     * Loads an HTML template from an external file and caches it.
     * @param {string} templateName - The name of the template file (e.g., 'modal-environment')
     * @returns {Promise<string>} The HTML template string
     */
    async function loadTemplate(templateName) {
        if (templateCache.has(templateName)) {
            console.log(`[TemplateLoader] Using cached template: ${templateName}`);
            return templateCache.get(templateName);
        }

        try {
            const response = await fetch(chrome.runtime.getURL(`panel/templates/${templateName}.html`));
            if (!response.ok) {
                throw new Error(`Failed to load template: ${templateName} (${response.status})`);
            }
            const html = await response.text();
            templateCache.set(templateName, html);
            console.log(`[TemplateLoader] Loaded and cached template: ${templateName}`);
            return html;
        } catch (error) {
            console.error(`[TemplateLoader] Error loading template '${templateName}':`, error);
            throw error;
        }
    }

    /**
     * Fills an HTML template with the provided data.
     * Replaces all instances of {{key}} with the corresponding value from the data object.
     * @param {string} template - The HTML template string
     * @param {Object} data - An object containing key-value pairs for replacement
     * @returns {string} The filled HTML string
     */
    function fillTemplate(template, data) {
        if (!template) {
            console.warn('[TemplateLoader] Empty template provided to fillTemplate');
            return '';
        }
        if (!data) {
            return template;
        }

        // Replace {{key}} placeholders with data values
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            if (data.hasOwnProperty(key)) {
                const value = data[key];
                // Handle undefined/null values
                return value !== undefined && value !== null ? value : '';
            }
            // Keep placeholder if no data provided
            return match;
        });
    }

    /**
     * Clears the template cache (useful for development/testing)
     */
    function clearCache() {
        templateCache.clear();
        console.log('[TemplateLoader] Cache cleared');
    }

    // Expose the functions to the global window object
    window.TemplateLoader = {
        loadTemplate,
        fillTemplate,
        clearCache
    };

    console.log('[TemplateLoader] Template loader initialized');

})(window);
