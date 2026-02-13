/**
 * Storage Module
 * Handles local storage operations for diet and weight data
 */

const Storage = {
    KEYS: {
        DIET_RECORDS: 'fitness_diet_records',
        WEIGHT_RECORDS: 'fitness_weight_records',
        SETTINGS: 'fitness_settings',
        CHAT_HISTORY: 'fitness_chat_history'
    },

    /**
     * Initialize storage with default values if empty
     */
    init() {
        if (!localStorage.getItem(this.KEYS.DIET_RECORDS)) {
            localStorage.setItem(this.KEYS.DIET_RECORDS, JSON.stringify({}));
        }
        if (!localStorage.getItem(this.KEYS.WEIGHT_RECORDS)) {
            localStorage.setItem(this.KEYS.WEIGHT_RECORDS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.SETTINGS)) {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify({
                defaultDayType: 'training'
            }));
        }
        if (!localStorage.getItem(this.KEYS.CHAT_HISTORY)) {
            localStorage.setItem(this.KEYS.CHAT_HISTORY, JSON.stringify([]));
        }
    },

    /**
     * Get all diet records
     * @returns {object} - Diet records organized by date
     */
    getDietRecords() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.DIET_RECORDS)) || {};
        } catch (e) {
            console.error('Error reading diet records:', e);
            return {};
        }
    },

    /**
     * Get diet records for a specific date
     * @param {string} date - Date string (YYYY-MM-DD)
     * @returns {object} - Diet record for the date
     */
    getDietByDate(date) {
        const records = this.getDietRecords();
        return records[date] || {
            date: date,
            dayType: 'training',
            foods: [],
            totals: { calories: 0, protein: 0, carbs: 0, fat: 0 }
        };
    },

    /**
     * Save diet record for a specific date
     * @param {string} date - Date string (YYYY-MM-DD)
     * @param {object} data - Diet data to save
     */
    saveDietRecord(date, data) {
        const records = this.getDietRecords();
        records[date] = {
            ...data,
            date: date,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(this.KEYS.DIET_RECORDS, JSON.stringify(records));
    },

    /**
     * Add food to a specific date
     * @param {string} date - Date string (YYYY-MM-DD)
     * @param {object} food - Food data to add
     */
    addFood(date, food) {
        const dietRecord = this.getDietByDate(date);
        
        // Add unique ID to food item
        food.id = Date.now().toString();
        food.addedAt = new Date().toISOString();
        
        dietRecord.foods.push(food);
        
        // Recalculate totals
        dietRecord.totals = this.calculateTotals(dietRecord.foods);
        
        this.saveDietRecord(date, dietRecord);
        return food;
    },

    /**
     * Remove food from a specific date
     * @param {string} date - Date string (YYYY-MM-DD)
     * @param {string} foodId - ID of the food to remove
     */
    removeFood(date, foodId) {
        const dietRecord = this.getDietByDate(date);
        dietRecord.foods = dietRecord.foods.filter(f => f.id !== foodId);
        dietRecord.totals = this.calculateTotals(dietRecord.foods);
        this.saveDietRecord(date, dietRecord);
    },

    /**
     * Set day type for a specific date
     * @param {string} date - Date string (YYYY-MM-DD)
     * @param {string} dayType - 'training' or 'rest'
     */
    setDayType(date, dayType) {
        const dietRecord = this.getDietByDate(date);
        dietRecord.dayType = dayType;
        this.saveDietRecord(date, dietRecord);
    },

    /**
     * Calculate total nutrition from food list
     * @param {array} foods - Array of food items
     * @returns {object} - Total nutrition values
     */
    calculateTotals(foods) {
        return foods.reduce((totals, food) => ({
            calories: totals.calories + (food.calories || 0),
            protein: Math.round((totals.protein + (food.protein || 0)) * 10) / 10,
            carbs: Math.round((totals.carbs + (food.carbs || 0)) * 10) / 10,
            fat: Math.round((totals.fat + (food.fat || 0)) * 10) / 10
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    },

    /**
     * Get all weight records
     * @returns {array} - Weight records
     */
    getWeightRecords() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.WEIGHT_RECORDS)) || [];
        } catch (e) {
            console.error('Error reading weight records:', e);
            return [];
        }
    },

    /**
     * Add weight record
     * @param {string} date - Date string (YYYY-MM-DD)
     * @param {number} weight - Weight in kg
     */
    addWeightRecord(date, weight) {
        const records = this.getWeightRecords();
        
        // Check if record for this date already exists
        const existingIndex = records.findIndex(r => r.date === date);
        
        const record = {
            date: date,
            weight: weight,
            updatedAt: new Date().toISOString()
        };
        
        if (existingIndex >= 0) {
            records[existingIndex] = record;
        } else {
            records.push(record);
        }
        
        // Sort by date
        records.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        localStorage.setItem(this.KEYS.WEIGHT_RECORDS, JSON.stringify(records));
        return record;
    },

    /**
     * Get weight record for a specific date
     * @param {string} date - Date string (YYYY-MM-DD)
     * @returns {object|null} - Weight record or null
     */
    getWeightByDate(date) {
        const records = this.getWeightRecords();
        return records.find(r => r.date === date) || null;
    },

    /**
     * Get diet records by day type
     * @param {string} dayType - 'training' or 'rest'
     * @returns {array} - Array of diet records
     */
    getDietByDayType(dayType) {
        const records = this.getDietRecords();
        return Object.values(records)
            .filter(r => r.dayType === dayType && r.foods.length > 0)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    /**
     * Get recent diet records for charts
     * @param {string} dayType - 'training' or 'rest'
     * @param {number} limit - Number of records to return
     * @returns {array} - Recent diet records
     */
    getRecentDietRecords(dayType, limit = 7) {
        const records = this.getDietByDayType(dayType);
        return records.slice(-limit);
    },

    /**
     * Get recent weight records for charts
     * @param {number} limit - Number of records to return
     * @returns {array} - Recent weight records
     */
    getRecentWeightRecords(limit = 30) {
        const records = this.getWeightRecords();
        return records.slice(-limit);
    },

    /**
     * Export all data as JSON
     * @returns {object} - All stored data
     */
    exportData() {
        return {
            dietRecords: this.getDietRecords(),
            weightRecords: this.getWeightRecords(),
            exportedAt: new Date().toISOString()
        };
    },

    /**
     * Import data from JSON
     * @param {object} data - Data to import
     */
    importData(data) {
        if (data.dietRecords) {
            localStorage.setItem(this.KEYS.DIET_RECORDS, JSON.stringify(data.dietRecords));
        }
        if (data.weightRecords) {
            localStorage.setItem(this.KEYS.WEIGHT_RECORDS, JSON.stringify(data.weightRecords));
        }
    },

    /**
     * Clear all data
     */
    clearAll() {
        localStorage.removeItem(this.KEYS.DIET_RECORDS);
        localStorage.removeItem(this.KEYS.WEIGHT_RECORDS);
        localStorage.removeItem(this.KEYS.SETTINGS);
        localStorage.removeItem(this.KEYS.CHAT_HISTORY);
        this.init();
    },

    // ==================== Chat History Methods ====================

    /**
     * Get all chat history
     * @returns {array} - Chat messages array
     */
    getChatHistory() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.CHAT_HISTORY)) || [];
        } catch (e) {
            console.error('Error reading chat history:', e);
            return [];
        }
    },

    /**
     * Add a message to chat history
     * @param {object} message - Message object with content, type, status, timestamp
     */
    addChatMessage(message) {
        const history = this.getChatHistory();
        
        const chatMessage = {
            id: Date.now().toString(),
            content: message.content,
            type: message.type, // 'user', 'bot', 'system'
            status: message.status || '', // 'success', 'error', 'info'
            timestamp: new Date().toISOString()
        };
        
        history.push(chatMessage);
        
        // Keep only recent messages (limit to 100)
        const maxMessages = 100;
        if (history.length > maxMessages) {
            history.splice(0, history.length - maxMessages);
        }
        
        localStorage.setItem(this.KEYS.CHAT_HISTORY, JSON.stringify(history));
        return chatMessage;
    },

    /**
     * Get recent chat history
     * @param {number} limit - Number of messages to return
     * @returns {array} - Recent chat messages
     */
    getRecentChatHistory(limit = 50) {
        const history = this.getChatHistory();
        return history.slice(-limit);
    },

    /**
     * Clear chat history
     */
    clearChatHistory() {
        localStorage.setItem(this.KEYS.CHAT_HISTORY, JSON.stringify([]));
    },

    /**
     * Get chat history for a specific date
     * @param {string} date - Date string (YYYY-MM-DD)
     * @returns {array} - Chat messages for that date
     */
    getChatHistoryByDate(date) {
        const history = this.getChatHistory();
        return history.filter(msg => msg.timestamp.startsWith(date));
    }
};

// Initialize storage on load
Storage.init();
