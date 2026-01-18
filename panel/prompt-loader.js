// SAP Pro Toolkit - Prompt Loader
// Utility for loading, caching, and templating AI prompts from external files.

(function (window) {
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
     * Supports two formats:
     * 1. Legacy: Simple string with {{key}} replacements → returns string
     * 2. Structured: SYSTEM: ... ---USER--- {{key}} → returns {messages: [...]}
     * @param {string} template - The prompt template string.
     * @param {Object} data - An object containing key-value pairs for replacement.
     * @returns {string|Object} The filled prompt string OR structured messages object.
     */
    function fillPromptTemplate(template, data) {
        if (!template || !data) {
            return '';
        }

        // Check if template has SYSTEM/USER structure
        if (template.includes('SYSTEM:') && template.includes('---USER---')) {
            const [systemPart, userPart] = template.split('---USER---');
            const systemContent = systemPart.replace('SYSTEM:', '').trim();
            
            // Fill user content with data replacements
            const userContent = userPart.trim().replace(/\{\{(\w+)\}\}/g, (match, key) => {
                return data.hasOwnProperty(key) ? data[key] : match;
            });
            
            // Return structured messages format
            return {
                messages: [
                    { role: 'system', content: systemContent },
                    { role: 'user', content: userContent }
                ]
            };
        }
        
        // Legacy: Simple string replacement for backward compatibility
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
