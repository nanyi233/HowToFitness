/**
 * DeepSeek API Module
 * Centralized API call logic
 */

const API_CONFIG = {
    apiKey: 'sk-f498ca40814d498fa1da7ce70552001b',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat'
};

const API = {
    /**
     * Call DeepSeek API
     * @param {string} prompt - User prompt
     * @param {string} systemPrompt - System prompt
     * @param {object} options - Optional: temperature, max_tokens
     * @returns {string} - API response content
     */
    async callDeepSeek(prompt, systemPrompt, options = {}) {
        const { temperature = 0.3, maxTokens = 500 } = options;

        const response = await fetch(API_CONFIG.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature,
                max_tokens: maxTokens
            })
        });

        if (!response.ok) throw new Error(`API request failed: ${response.status}`);
        const data = await response.json();
        return data.choices[0].message.content;
    },

    /**
     * Parse AI JSON response (strips markdown code blocks)
     * @param {string} raw - Raw response string
     * @returns {object} - Parsed JSON
     */
    parseJSONResponse(raw) {
        let clean = raw.trim();
        if (clean.startsWith('```json')) clean = clean.slice(7);
        if (clean.startsWith('```')) clean = clean.slice(3);
        if (clean.endsWith('```')) clean = clean.slice(0, -3);
        return JSON.parse(clean.trim());
    }
};

window.API = API;
