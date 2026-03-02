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
     * @param {object} options - Optional: temperature, max_tokens, type ('food' | 'training'), messages (conversation history)
     * @returns {object|string} - Parsed JSON (backend) or raw content (direct)
     */
    async callDeepSeek(prompt, systemPrompt, options = {}) {
        const { temperature = 0.3, maxTokens = 500, type, messages = [] } = options;

        // ── Backend proxy mode ──────────────────────────────────
        if (API_CONFIG.useBackend) {
            const endpoint = type === 'training'
                ? `${API_CONFIG.backendBaseUrl}/ai/parse-training`
                : `${API_CONFIG.backendBaseUrl}/ai/parse-food`;

            const body = { prompt };
            if (messages && messages.length > 0) {
                body.messages = messages;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
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
        // Build messages array with optional history
        const apiMessages = [
            { role: 'system', content: systemPrompt }
        ];
        if (messages && messages.length > 0) {
            messages.forEach(msg => {
                if (msg.role && msg.content) {
                    apiMessages.push({ role: msg.role, content: msg.content });
                }
            });
        }
        apiMessages.push({ role: 'user', content: prompt });

        const response = await fetch(API_CONFIG.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: apiMessages,
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
    },

    /**
     * Build conversation history messages from chat history for AI context.
     * Converts chat history format {content, type, status} to API format {role, content}.
     * Only includes meaningful user inputs and successful bot responses (last N turns).
     * @param {Array} chatHistory - Array of {content, type, status} messages
     * @param {number} maxTurns - Maximum number of recent message pairs to include (default 10)
     * @returns {Array} - Array of {role, content} messages for the AI API
     */
    buildChatMessages(chatHistory, maxTurns = 10) {
        if (!chatHistory || chatHistory.length === 0) return [];

        // Filter to only meaningful messages: user inputs and successful bot responses
        const meaningful = chatHistory.filter(msg => {
            if (msg.type === 'user') return true;
            if (msg.type === 'bot' && msg.status === 'success') return true;
            return false;
        });

        // Take only the last N messages to avoid token overflow
        const recent = meaningful.slice(-(maxTurns * 2));

        return recent.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));
    },

    // ── Backend Calculator API ──────────────────────────────────────

    /**
     * Search for a food in the backend database.
     * @param {string} foodName
     * @returns {object|null} Food info with name, calories, protein, carbs, fat
     */
    async searchFood(foodName) {
        const res = await fetch(`${API_CONFIG.backendBaseUrl}/calc/food-search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ food_name: foodName })
        });
        if (!res.ok) return null;
        return res.json();
    },

    /**
     * Calculate nutrition for a food and given grams.
     * @param {string} foodName
     * @param {number} grams
     * @returns {object} Nutrition result
     */
    async calculateNutrition(foodName, grams) {
        const res = await fetch(`${API_CONFIG.backendBaseUrl}/calc/food-nutrition`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ food_name: foodName, grams })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Food not found');
        }
        return res.json();
    },

    /**
     * Detect whether user input is food or training.
     * @param {string} message
     * @returns {object} { type: 'food'|'training'|'unknown' }
     */
    async detectInput(message) {
        const res = await fetch(`${API_CONFIG.backendBaseUrl}/calc/detect-input`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        if (!res.ok) return { type: 'unknown' };
        return res.json();
    },

    /**
     * Try to parse training input locally on the backend.
     * @param {string} message
     * @returns {object} { success, exercise }
     */
    async parseTrainingLocal(message) {
        const res = await fetch(`${API_CONFIG.backendBaseUrl}/calc/parse-training-local`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        if (!res.ok) return { success: false };
        return res.json();
    },

    /**
     * Calculate BMI, BMR, TDEE, macros plan.
     * @param {object} params - { gender, height_cm, weight_kg, age, training_level, aerobic_calories }
     * @returns {object} Plan calculation result
     */
    async calculatePlan(params) {
        const res = await fetch(`${API_CONFIG.backendBaseUrl}/calc/plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Calculation failed');
        }
        return res.json();
    },

    /**
     * Calculate aerobic exercise calories.
     * @param {object} params - { weight_kg, category, level_index, hours, minutes, frequency }
     * @returns {object} Aerobic calculation result
     */
    async calculateAerobic(params) {
        const res = await fetch(`${API_CONFIG.backendBaseUrl}/calc/aerobic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Calculation failed');
        }
        return res.json();
    },

    /**
     * Get all exercise categories from backend.
     * @returns {Array} Exercise categories with levels
     */
    async getExerciseCategories() {
        const res = await fetch(`${API_CONFIG.backendBaseUrl}/calc/exercise-categories`);
        if (!res.ok) return [];
        return res.json();
    }
};

window.API = API;
