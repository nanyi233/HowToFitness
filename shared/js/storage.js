/**
 * Unified Storage Module
 * All localStorage operations go through here with consistent key prefixes
 */
const Storage = {
    KEYS: {
        DIET_RECORDS: 'htf_diet_records',
        WEIGHT_RECORDS: 'htf_weight_records',
        SETTINGS: 'htf_settings',
        CHAT_HISTORY: 'htf_chat_history',
        PLAN_DATA: 'htf_plan_data',
        AEROBIC_DATA: 'htf_aerobic_data',
        USER_PROFILE: 'htf_user_profile'
    },

    // ==================== Initialization ====================

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

    // ==================== Migrate Old Keys ====================

    migrateOldKeys() {
        const migrations = [
            { oldKey: 'fitness_diet_records', newKey: this.KEYS.DIET_RECORDS },
            { oldKey: 'fitness_weight_records', newKey: this.KEYS.WEIGHT_RECORDS },
            { oldKey: 'fitness_settings', newKey: this.KEYS.SETTINGS },
            { oldKey: 'fitness_chat_history', newKey: this.KEYS.CHAT_HISTORY },
            { oldKey: 'fitness_plan_data', newKey: this.KEYS.PLAN_DATA },
            { oldKey: 'aerobic_calculator_data', newKey: this.KEYS.AEROBIC_DATA }
        ];

        migrations.forEach(({ oldKey, newKey }) => {
            const oldData = localStorage.getItem(oldKey);
            if (oldData && !localStorage.getItem(newKey)) {
                localStorage.setItem(newKey, oldData);
                localStorage.removeItem(oldKey);
            }
        });
    },

    // ==================== Diet Records ====================

    getDietRecords() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.DIET_RECORDS)) || {};
        } catch (e) {
            console.error('Error reading diet records:', e);
            return {};
        }
    },

    getDietByDate(date) {
        const records = this.getDietRecords();
        return records[date] || {
            date: date,
            dayType: 'training',
            foods: [],
            totals: { calories: 0, protein: 0, carbs: 0, fat: 0 }
        };
    },

    saveDietRecord(date, data) {
        const records = this.getDietRecords();
        records[date] = {
            ...data,
            date: date,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(this.KEYS.DIET_RECORDS, JSON.stringify(records));
    },

    addFood(date, food) {
        const dietRecord = this.getDietByDate(date);
        food.id = Date.now().toString();
        food.addedAt = new Date().toISOString();
        dietRecord.foods.push(food);
        dietRecord.totals = this.calculateTotals(dietRecord.foods);
        this.saveDietRecord(date, dietRecord);
        window.EventBus && EventBus.emit('food:added', { date, food });
        return food;
    },

    removeFood(date, foodId) {
        const dietRecord = this.getDietByDate(date);
        dietRecord.foods = dietRecord.foods.filter(f => f.id !== foodId);
        dietRecord.totals = this.calculateTotals(dietRecord.foods);
        this.saveDietRecord(date, dietRecord);
        window.EventBus && EventBus.emit('food:removed', { date, foodId });
    },

    setDayType(date, dayType) {
        const dietRecord = this.getDietByDate(date);
        dietRecord.dayType = dayType;
        this.saveDietRecord(date, dietRecord);
    },

    calculateTotals(foods) {
        return foods.reduce((totals, food) => ({
            calories: totals.calories + (food.calories || 0),
            protein: Math.round((totals.protein + (food.protein || 0)) * 10) / 10,
            carbs: Math.round((totals.carbs + (food.carbs || 0)) * 10) / 10,
            fat: Math.round((totals.fat + (food.fat || 0)) * 10) / 10
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    },

    getDietByDayType(dayType) {
        const records = this.getDietRecords();
        return Object.values(records)
            .filter(r => r.dayType === dayType && r.foods.length > 0)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    getRecentDietRecords(dayType, limit = 7) {
        const records = this.getDietByDayType(dayType);
        return records.slice(-limit);
    },

    // ==================== Weight Records ====================

    getWeightRecords() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.WEIGHT_RECORDS)) || [];
        } catch (e) {
            console.error('Error reading weight records:', e);
            return [];
        }
    },

    addWeightRecord(date, weight) {
        const records = this.getWeightRecords();
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
        records.sort((a, b) => new Date(a.date) - new Date(b.date));
        localStorage.setItem(this.KEYS.WEIGHT_RECORDS, JSON.stringify(records));
        window.EventBus && EventBus.emit('weight:updated', { date, weight });
        return record;
    },

    getWeightByDate(date) {
        const records = this.getWeightRecords();
        return records.find(r => r.date === date) || null;
    },

    getRecentWeightRecords(limit = 30) {
        const records = this.getWeightRecords();
        return records.slice(-limit);
    },

    // ==================== Chat History ====================

    getChatHistory() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.CHAT_HISTORY)) || [];
        } catch (e) {
            console.error('Error reading chat history:', e);
            return [];
        }
    },

    addChatMessage(message) {
        const history = this.getChatHistory();
        const chatMessage = {
            id: Date.now().toString(),
            content: message.content,
            type: message.type,
            status: message.status || '',
            timestamp: new Date().toISOString()
        };
        history.push(chatMessage);
        const maxMessages = 100;
        if (history.length > maxMessages) {
            history.splice(0, history.length - maxMessages);
        }
        localStorage.setItem(this.KEYS.CHAT_HISTORY, JSON.stringify(history));
        return chatMessage;
    },

    getRecentChatHistory(limit = 50) {
        const history = this.getChatHistory();
        return history.slice(-limit);
    },

    clearChatHistory() {
        localStorage.setItem(this.KEYS.CHAT_HISTORY, JSON.stringify([]));
    },

    // ==================== Plan Data ====================

    getPlanData() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.PLAN_DATA)) || null;
        } catch (e) {
            return null;
        }
    },

    savePlanData(data) {
        localStorage.setItem(this.KEYS.PLAN_DATA, JSON.stringify(data));
    },

    // ==================== Aerobic Data ====================

    getAerobicData() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.AEROBIC_DATA)) || null;
        } catch (e) {
            return null;
        }
    },

    saveAerobicData(data) {
        localStorage.setItem(this.KEYS.AEROBIC_DATA, JSON.stringify(data));
    },

    // ==================== User Profile (Shared) ====================

    getUserProfile() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.USER_PROFILE)) || {};
        } catch (e) {
            return {};
        }
    },

    saveUserProfile(data) {
        localStorage.setItem(this.KEYS.USER_PROFILE, JSON.stringify(data));
        window.EventBus && EventBus.emit('profile:updated', data);
    },

    // ==================== Export / Import ====================

    exportData() {
        return {
            dietRecords: this.getDietRecords(),
            weightRecords: this.getWeightRecords(),
            planData: this.getPlanData(),
            aerobicData: this.getAerobicData(),
            userProfile: this.getUserProfile(),
            exportedAt: new Date().toISOString()
        };
    },

    importData(data) {
        if (data.dietRecords) localStorage.setItem(this.KEYS.DIET_RECORDS, JSON.stringify(data.dietRecords));
        if (data.weightRecords) localStorage.setItem(this.KEYS.WEIGHT_RECORDS, JSON.stringify(data.weightRecords));
        if (data.planData) localStorage.setItem(this.KEYS.PLAN_DATA, JSON.stringify(data.planData));
        if (data.aerobicData) localStorage.setItem(this.KEYS.AEROBIC_DATA, JSON.stringify(data.aerobicData));
        if (data.userProfile) localStorage.setItem(this.KEYS.USER_PROFILE, JSON.stringify(data.userProfile));
    },

    clearAll() {
        Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
        this.init();
    }
};

// Initialize & migrate on load
Storage.migrateOldKeys();
Storage.init();

// Make globally available
window.Storage = Storage;
