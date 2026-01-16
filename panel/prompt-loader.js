// SF Pro Toolkit - Prompt Loader
// Utility for loading, caching, and templating AI prompts from external files.

(function(window) {
    const promptCache = new Map();

    /**
     * Loads a prompt template from an external file and caches it.
     * @param {string} promptName - The name of the prompt file (e.g., 'ai_search_insights').
     * @returns {Promise<string>} The prompt template string.
     */
    async function loadAndCachePrompt(promptName) {
        if (promptCache.has(promptName)) {
            return promptCache.get(promptName);
        }

        try {
            const response = await fetch(chrome.runtime.getURL(`panel/prompts/${promptName}.txt`));
            if (!response.ok) {
                throw new Error(`Failed to load prompt: ${promptName}`);
            }
            const template = await response.text();
            promptCache.set(promptName, template);
            return template;
        } catch (error) {
            console.error(`[PromptLoader] Error loading prompt '${promptName}':`, error);
            throw error;
        }
    }

    /**
     * Fills a prompt template with the provided data.
     * Replaces all instances of {{key}} with the corresponding value from the data object.
     * @param {string} template - The prompt template string.
     * @param {Object} data - An object containing key-value pairs for replacement.
     * @returns {string} The filled prompt string.
     */
    function fillPromptTemplate(template, data) {
        if (!template || !data) {
            return '';
        }
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data.hasOwnProperty(key) ? data[key] : match;
        });
    }

    // Expose the functions to the global window object
    window.PromptLoader = {
        loadAndCachePrompt,
        fillPromptTemplate
    };

})(window);
