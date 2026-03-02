/**
 * DeepSeek API Module
 * Supports backend proxy mode (recommended) and direct mode (fallback).
 * In backend mode the API key is kept securely on the server.
 */

const API_CONFIG = {
    // Backend proxy (preferred – API key lives on server)
    useBackend: true,
    backendBaseUrl: 'http://localhost:8000/api',

    // Direct mode fallback (only used when useBackend = false)
    apiKey: '',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat'
};

const API = {
    /**
     * Call DeepSeek AI – either through backend proxy or directly.
     * @param {string} prompt - User prompt
     * @param {string} systemPrompt - System prompt
     * @param {object} options - Optional: temperature, max_tokens, type ('food' | 'training')
     * @returns {object|string} - Parsed JSON (backend) or raw content (direct)
     */
    async callDeepSeek(prompt, systemPrompt, options = {}) {
        const { temperature = 0.3, maxTokens = 500, type } = options;

        // ── Backend proxy mode ──────────────────────────────────
        if (API_CONFIG.useBackend) {
            const endpoint = type === 'training'
                ? `${API_CONFIG.backendBaseUrl}/ai/parse-training`
                : `${API_CONFIG.backendBaseUrl}/ai/parse-food`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || `Backend AI request failed: ${response.status}`);
            }

            // Backend already returns parsed JSON – stringify so callers
            // that use parseJSONResponse still work transparently.
            const data = await response.json();
            return JSON.stringify(data);
        }

        // ── Direct mode (fallback) ─────────────────────────────
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
