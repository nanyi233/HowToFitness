/**
 * Unified Storage Module — Async Proxy Layer
 * Supports both localStorage (offline) and backend API (online) modes.
 * When useBackend=true and a valid token exists, all CRUD operations
 * are routed to the FastAPI backend. Otherwise falls back to localStorage.
 */
const Storage = {
    // ==================== Configuration ====================
    useBackend: false,
    token: null,
    API_BASE: 'http://localhost:8000/api',

    KEYS: {
        DIET_RECORDS: 'htf_diet_records',
        WEIGHT_RECORDS: 'htf_weight_records',
        SETTINGS: 'htf_settings',
        CHAT_HISTORY: 'htf_chat_history',
        PLAN_DATA: 'htf_plan_data',
        AEROBIC_DATA: 'htf_aerobic_data',
        USER_PROFILE: 'htf_user_profile',
        TRAINING_RECORDS: 'htf_training_records',
        TRAINING_CHAT_HISTORY: 'htf_training_chat_history',
        AUTH_TOKEN: 'htf_auth_token',
        USE_BACKEND: 'htf_use_backend'
    },

    // ==================== HTTP Helpers ====================

    _authHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    },

    async _get(path) {
        const res = await fetch(`${this.API_BASE}${path}`, {
            headers: this._authHeaders()
        });
        if (res.status === 401) {
            this._handleAuthError();
            throw new Error('Authentication required');
        }
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `API GET ${path} failed: ${res.status}`);
        }
        return res.json();
    },

    async _post(path, body) {
        const res = await fetch(`${this.API_BASE}${path}`, {
            method: 'POST',
            headers: this._authHeaders(),
            body: JSON.stringify(body)
        });
        if (res.status === 401) {
            this._handleAuthError();
            throw new Error('Authentication required');
        }
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `API POST ${path} failed: ${res.status}`);
        }
        return res.json();
    },

    async _put(path, body) {
        const res = await fetch(`${this.API_BASE}${path}`, {
            method: 'PUT',
            headers: this._authHeaders(),
            body: JSON.stringify(body)
        });
        if (res.status === 401) {
            this._handleAuthError();
            throw new Error('Authentication required');
        }
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `API PUT ${path} failed: ${res.status}`);
        }
        return res.json();
    },

    async _delete(path) {
        const res = await fetch(`${this.API_BASE}${path}`, {
            method: 'DELETE',
            headers: this._authHeaders()
        });
        if (res.status === 401) {
            this._handleAuthError();
            throw new Error('Authentication required');
        }
        if (!res.ok && res.status !== 204) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `API DELETE ${path} failed: ${res.status}`);
        }
    },

    _handleAuthError() {
        console.warn('Auth token expired or invalid, switching to local mode');
        this.token = null;
        localStorage.removeItem(this.KEYS.AUTH_TOKEN);
        window.EventBus && EventBus.emit('auth:expired');
    },

    _isOnline() {
        return this.useBackend && !!this.token;
    },

    // ==================== Auth Methods ====================

    async login(username, password) {
        const data = await this._post('/auth/login', { username, password });
        this.token = data.access_token;
        localStorage.setItem(this.KEYS.AUTH_TOKEN, this.token);
        this.useBackend = true;
        localStorage.setItem(this.KEYS.USE_BACKEND, 'true');
        window.EventBus && EventBus.emit('auth:login', { username });
        return data;
    },

    async register(username, password) {
        const data = await this._post('/auth/register', { username, password });
        this.token = data.access_token;
        localStorage.setItem(this.KEYS.AUTH_TOKEN, this.token);
        this.useBackend = true;
        localStorage.setItem(this.KEYS.USE_BACKEND, 'true');
        window.EventBus && EventBus.emit('auth:login', { username });
        return data;
    },

    logout() {
        this.token = null;
        this.useBackend = false;
        localStorage.removeItem(this.KEYS.AUTH_TOKEN);
        localStorage.removeItem(this.KEYS.USE_BACKEND);
        window.EventBus && EventBus.emit('auth:logout');
    },

    isLoggedIn() {
        return !!this.token;
    },

    // ==================== Initialization ====================

    init() {
        // Restore auth state
        const savedToken = localStorage.getItem(this.KEYS.AUTH_TOKEN);
        const savedBackend = localStorage.getItem(this.KEYS.USE_BACKEND);
        if (savedToken && savedBackend === 'true') {
            this.token = savedToken;
            this.useBackend = true;
        }

        // Ensure localStorage defaults exist
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
        if (!localStorage.getItem(this.KEYS.TRAINING_RECORDS)) {
            localStorage.setItem(this.KEYS.TRAINING_RECORDS, JSON.stringify({}));
        }
        if (!localStorage.getItem(this.KEYS.TRAINING_CHAT_HISTORY)) {
            localStorage.setItem(this.KEYS.TRAINING_CHAT_HISTORY, JSON.stringify([]));
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

    _getLocalDietRecords() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.DIET_RECORDS)) || {};
        } catch (e) {
            console.error('Error reading diet records:', e);
            return {};
        }
    },

    async getDietRecords() {
        if (this._isOnline()) {
            try {
                // Fetch recent records from backend (large limit to get "all")
                const records = await this._get('/diet/recent?limit=90');
                // Convert array of summaries to object keyed by date
                const result = {};
                records.forEach(r => {
                    result[r.date] = {
                        date: r.date,
                        dayType: r.day_type,
                        foods: [],
                        totals: r.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 }
                    };
                });
                return result;
            } catch (e) {
                console.error('Backend getDietRecords failed, falling back to local:', e);
                return this._getLocalDietRecords();
            }
        }
        return this._getLocalDietRecords();
    },

    async getDietByDate(date) {
        if (this._isOnline()) {
            try {
                const record = await this._get(`/diet/${date}`);
                // Transform backend response to match frontend format
                return {
                    date: record.date,
                    dayType: record.day_type,
                    foods: (record.foods || []).map(f => ({
                        id: String(f.id),
                        name: f.name,
                        grams: f.amount,
                        calories: f.calories,
                        protein: f.protein,
                        carbs: f.carbs,
                        fat: f.fat,
                        addedAt: f.added_at
                    })),
                    totals: record.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 }
                };
            } catch (e) {
                console.error('Backend getDietByDate failed, falling back to local:', e);
            }
        }
        const records = this._getLocalDietRecords();
        return records[date] || {
            date: date,
            dayType: 'training',
            foods: [],
            totals: { calories: 0, protein: 0, carbs: 0, fat: 0 }
        };
    },

    async saveDietRecord(date, data) {
        // Save locally always (for offline cache)
        const records = this._getLocalDietRecords();
        records[date] = {
            ...data,
            date: date,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(this.KEYS.DIET_RECORDS, JSON.stringify(records));
    },

    async addFood(date, food) {
        if (this._isOnline()) {
            try {
                const response = await this._post(`/diet/${date}/foods`, {
                    name: food.name,
                    amount: food.grams || 0,
                    unit: 'g',
                    calories: food.calories || 0,
                    protein: food.protein || 0,
                    carbs: food.carbs || 0,
                    fat: food.fat || 0
                });
                const result = {
                    id: String(response.id),
                    name: response.name,
                    grams: response.amount,
                    calories: response.calories,
                    protein: response.protein,
                    carbs: response.carbs,
                    fat: response.fat,
                    addedAt: response.added_at
                };
                window.EventBus && EventBus.emit('food:added', { date, food: result });
                return result;
            } catch (e) {
                console.error('Backend addFood failed, falling back to local:', e);
            }
        }
        // Fallback: localStorage
        const dietRecord = await this.getDietByDate(date);
        food.id = Date.now().toString();
        food.addedAt = new Date().toISOString();
        dietRecord.foods.push(food);
        dietRecord.totals = this.calculateTotals(dietRecord.foods);
        await this.saveDietRecord(date, dietRecord);
        window.EventBus && EventBus.emit('food:added', { date, food });
        return food;
    },

    async removeFood(date, foodId) {
        if (this._isOnline()) {
            try {
                await this._delete(`/diet/${date}/foods/${foodId}`);
                window.EventBus && EventBus.emit('food:removed', { date, foodId });
                return;
            } catch (e) {
                console.error('Backend removeFood failed, falling back to local:', e);
            }
        }
        // Fallback: localStorage
        const dietRecord = await this.getDietByDate(date);
        dietRecord.foods = dietRecord.foods.filter(f => f.id !== foodId);
        dietRecord.totals = this.calculateTotals(dietRecord.foods);
        await this.saveDietRecord(date, dietRecord);
        window.EventBus && EventBus.emit('food:removed', { date, foodId });
    },

    async setDayType(date, dayType) {
        if (this._isOnline()) {
            try {
                await this._put(`/diet/${date}/day-type`, { day_type: dayType });
                return;
            } catch (e) {
                console.error('Backend setDayType failed, falling back to local:', e);
            }
        }
        const dietRecord = await this.getDietByDate(date);
        dietRecord.dayType = dayType;
        await this.saveDietRecord(date, dietRecord);
    },

    calculateTotals(foods) {
        return foods.reduce((totals, food) => ({
            calories: totals.calories + (food.calories || 0),
            protein: Math.round((totals.protein + (food.protein || 0)) * 10) / 10,
            carbs: Math.round((totals.carbs + (food.carbs || 0)) * 10) / 10,
            fat: Math.round((totals.fat + (food.fat || 0)) * 10) / 10
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    },

    async getDietByDayType(dayType) {
        if (this._isOnline()) {
            try {
                const records = await this._get(`/diet/recent?type=${dayType}&limit=90`);
                return records.map(r => ({
                    date: r.date,
                    dayType: r.day_type,
                    foods: [],
                    totals: r.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 }
                }));
            } catch (e) {
                console.error('Backend getDietByDayType failed, falling back to local:', e);
            }
        }
        const records = this._getLocalDietRecords();
        return Object.values(records)
            .filter(r => r.dayType === dayType && r.foods.length > 0)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    async getRecentDietRecords(dayType, limit = 7) {
        if (this._isOnline()) {
            try {
                const records = await this._get(`/diet/recent?type=${dayType}&limit=${limit}`);
                return records.map(r => ({
                    date: r.date,
                    dayType: r.day_type,
                    foods: [],
                    totals: r.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 }
                }));
            } catch (e) {
                console.error('Backend getRecentDietRecords failed, falling back to local:', e);
            }
        }
        const all = await this.getDietByDayType(dayType);
        return all.slice(-limit);
    },

    // ==================== Weight Records ====================

    _getLocalWeightRecords() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.WEIGHT_RECORDS)) || [];
        } catch (e) {
            console.error('Error reading weight records:', e);
            return [];
        }
    },

    async getWeightRecords() {
        if (this._isOnline()) {
            try {
                const records = await this._get('/weight');
                return records.map(r => ({
                    date: r.date,
                    weight: r.weight,
                    updatedAt: r.updated_at
                }));
            } catch (e) {
                console.error('Backend getWeightRecords failed, falling back to local:', e);
            }
        }
        return this._getLocalWeightRecords();
    },

    async addWeightRecord(date, weight) {
        if (this._isOnline()) {
            try {
                const response = await this._post('/weight', { date, weight });
                const record = {
                    date: response.date,
                    weight: response.weight,
                    updatedAt: response.updated_at
                };
                window.EventBus && EventBus.emit('weight:updated', { date, weight });
                return record;
            } catch (e) {
                console.error('Backend addWeightRecord failed, falling back to local:', e);
            }
        }
        // Fallback: localStorage
        const records = this._getLocalWeightRecords();
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

    async getWeightByDate(date) {
        const records = await this.getWeightRecords();
        return records.find(r => r.date === date) || null;
    },

    async getRecentWeightRecords(limit = 30) {
        if (this._isOnline()) {
            try {
                const records = await this._get(`/weight/recent?limit=${limit}`);
                return records.map(r => ({
                    date: r.date,
                    weight: r.weight,
                    updatedAt: r.updated_at
                }));
            } catch (e) {
                console.error('Backend getRecentWeightRecords failed, falling back to local:', e);
            }
        }
        const records = this._getLocalWeightRecords();
        return records.slice(-limit);
    },

    // ==================== Chat History (Local Only — no backend route) ====================

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

    // ==================== Training Records ====================

    _getLocalTrainingRecords() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.TRAINING_RECORDS)) || {};
        } catch (e) {
            console.error('Error reading training records:', e);
            return {};
        }
    },

    async getTrainingRecords() {
        if (this._isOnline()) {
            try {
                const records = await this._get('/training/recent?limit=90');
                const result = {};
                records.forEach(r => {
                    result[r.date] = {
                        date: r.date,
                        exercises: [],
                        duration: r.duration,
                        exerciseCount: r.exercise_count
                    };
                });
                return result;
            } catch (e) {
                console.error('Backend getTrainingRecords failed, falling back to local:', e);
            }
        }
        return this._getLocalTrainingRecords();
    },

    async getTrainingByDate(date) {
        if (this._isOnline()) {
            try {
                const record = await this._get(`/training/${date}`);
                return {
                    date: record.date,
                    duration: record.duration,
                    exercises: (record.exercises || []).map(e => ({
                        id: String(e.id),
                        name: e.name,
                        weight: e.weight,
                        sets: e.sets,
                        reps: e.reps,
                        volume: e.volume,
                        setDetails: e.set_details || [],
                        addedAt: e.added_at
                    }))
                };
            } catch (e) {
                console.error('Backend getTrainingByDate failed, falling back to local:', e);
            }
        }
        const records = this._getLocalTrainingRecords();
        return records[date] || {
            date: date,
            exercises: [],
            duration: null
        };
    },

    async saveTrainingRecord(date, data) {
        // Save locally always
        const records = this._getLocalTrainingRecords();
        records[date] = {
            ...data,
            date: date,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(this.KEYS.TRAINING_RECORDS, JSON.stringify(records));
    },

    async addTrainingExercise(date, exercise) {
        if (this._isOnline()) {
            try {
                const response = await this._post(`/training/${date}/exercises`, {
                    name: exercise.name,
                    weight: exercise.weight || 0,
                    sets: exercise.sets || 0,
                    reps: exercise.reps || 0,
                    volume: exercise.volume || 0,
                    set_details: exercise.setDetails || exercise.set_details || []
                });
                const result = {
                    id: String(response.id),
                    name: response.name,
                    weight: response.weight,
                    sets: response.sets,
                    reps: response.reps,
                    volume: response.volume,
                    setDetails: response.set_details || [],
                    addedAt: response.added_at
                };
                window.EventBus && EventBus.emit('training:added', { date, exercise: result });
                return result;
            } catch (e) {
                console.error('Backend addTrainingExercise failed, falling back to local:', e);
            }
        }
        // Fallback: localStorage with merge logic
        const record = await this.getTrainingByDate(date);
        const normalizedName = exercise.name.trim().toLowerCase();
        const existing = record.exercises.find(
            e => e.name.trim().toLowerCase() === normalizedName
        );

        if (existing) {
            const newSetDetails = exercise.setDetails || this._generateSetDetails(exercise.weight, exercise.sets, exercise.reps);
            existing.setDetails = (existing.setDetails || []).concat(newSetDetails);
            existing.sets = existing.setDetails.length;
            existing.weight = Math.max(...existing.setDetails.map(s => s.weight || 0));
            existing.reps = newSetDetails.length > 0 ? newSetDetails[0].reps : existing.reps;
            existing.volume = existing.setDetails.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
            existing.updatedAt = new Date().toISOString();
            await this.saveTrainingRecord(date, record);
            window.EventBus && EventBus.emit('training:updated', { date, exercise: existing });
            return existing;
        } else {
            exercise.id = Date.now().toString() + Math.random().toString(36).substr(2, 4);
            exercise.addedAt = new Date().toISOString();
            if (!exercise.setDetails || exercise.setDetails.length === 0) {
                exercise.setDetails = this._generateSetDetails(exercise.weight, exercise.sets, exercise.reps);
            }
            record.exercises.push(exercise);
            await this.saveTrainingRecord(date, record);
            window.EventBus && EventBus.emit('training:added', { date, exercise });
            return exercise;
        }
    },

    _generateSetDetails(weight, sets, reps) {
        const details = [];
        for (let i = 0; i < sets; i++) {
            details.push({ weight: weight, reps: reps });
        }
        return details;
    },

    async removeTrainingExercise(date, exerciseId) {
        if (this._isOnline()) {
            try {
                await this._delete(`/training/${date}/exercises/${exerciseId}`);
                window.EventBus && EventBus.emit('training:removed', { date, exerciseId });
                return;
            } catch (e) {
                console.error('Backend removeTrainingExercise failed, falling back to local:', e);
            }
        }
        const record = await this.getTrainingByDate(date);
        record.exercises = record.exercises.filter(e => e.id !== exerciseId);
        await this.saveTrainingRecord(date, record);
        window.EventBus && EventBus.emit('training:removed', { date, exerciseId });
    },

    async setTrainingDuration(date, minutes) {
        if (this._isOnline()) {
            try {
                await this._put(`/training/${date}/duration`, { duration: minutes });
                return;
            } catch (e) {
                console.error('Backend setTrainingDuration failed, falling back to local:', e);
            }
        }
        const record = await this.getTrainingByDate(date);
        record.duration = minutes;
        await this.saveTrainingRecord(date, record);
    },

    async getRecentTrainingRecords(limit = 30) {
        if (this._isOnline()) {
            try {
                const summaries = await this._get(`/training/recent?limit=${limit}`);
                // For full data we need to fetch each date individually
                // Use summaries for basic info; caller may need full data
                const results = [];
                for (const s of summaries) {
                    const full = await this.getTrainingByDate(s.date);
                    let totalVolume = 0;
                    let totalSets = 0;
                    let maxWeight = 0;
                    full.exercises.forEach(ex => {
                        totalVolume += ex.volume || 0;
                        totalSets += ex.sets || 0;
                        if (ex.weight > maxWeight) maxWeight = ex.weight;
                    });
                    results.push({
                        date: full.date,
                        exercises: full.exercises,
                        exerciseCount: full.exercises.length,
                        duration: full.duration || 0,
                        totalVolume,
                        totalSets,
                        maxIntensity: maxWeight
                    });
                }
                return results;
            } catch (e) {
                console.error('Backend getRecentTrainingRecords failed, falling back to local:', e);
            }
        }
        // Fallback: localStorage
        const records = this._getLocalTrainingRecords();
        return Object.values(records)
            .filter(r => r.exercises && r.exercises.length > 0)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-limit)
            .map(r => {
                let totalVolume = 0;
                let totalSets = 0;
                let maxWeight = 0;
                r.exercises.forEach(ex => {
                    totalVolume += ex.volume || 0;
                    totalSets += ex.sets || 0;
                    if (ex.weight > maxWeight) maxWeight = ex.weight;
                });
                return {
                    date: r.date,
                    exercises: r.exercises,
                    exerciseCount: r.exercises.length,
                    duration: r.duration || 0,
                    totalVolume: totalVolume,
                    totalSets: totalSets,
                    maxIntensity: maxWeight
                };
            });
    },

    // ==================== Training Chat History (Local Only) ====================

    getTrainingChatHistory() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.TRAINING_CHAT_HISTORY)) || [];
        } catch (e) {
            return [];
        }
    },

    addTrainingChatMessage(message) {
        const history = this.getTrainingChatHistory();
        const chatMessage = {
            id: Date.now().toString(),
            content: message.content,
            type: message.type,
            status: message.status || '',
            timestamp: new Date().toISOString()
        };
        history.push(chatMessage);
        if (history.length > 100) history.splice(0, history.length - 100);
        localStorage.setItem(this.KEYS.TRAINING_CHAT_HISTORY, JSON.stringify(history));
        return chatMessage;
    },

    getRecentTrainingChatHistory(limit = 50) {
        return this.getTrainingChatHistory().slice(-limit);
    },

    clearTrainingChatHistory() {
        localStorage.setItem(this.KEYS.TRAINING_CHAT_HISTORY, JSON.stringify([]));
    },

    // ==================== Plan Data (Local Only) ====================

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

    // ==================== Aerobic Data (Local Only) ====================

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

    // ==================== User Profile (Local Only) ====================

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

    async exportData() {
        return {
            dietRecords: await this.getDietRecords(),
            weightRecords: await this.getWeightRecords(),
            planData: this.getPlanData(),
            aerobicData: this.getAerobicData(),
            userProfile: this.getUserProfile(),
            trainingRecords: await this.getTrainingRecords(),
            exportedAt: new Date().toISOString()
        };
    },

    importData(data) {
        if (data.dietRecords) localStorage.setItem(this.KEYS.DIET_RECORDS, JSON.stringify(data.dietRecords));
        if (data.weightRecords) localStorage.setItem(this.KEYS.WEIGHT_RECORDS, JSON.stringify(data.weightRecords));
        if (data.planData) localStorage.setItem(this.KEYS.PLAN_DATA, JSON.stringify(data.planData));
        if (data.aerobicData) localStorage.setItem(this.KEYS.AEROBIC_DATA, JSON.stringify(data.aerobicData));
        if (data.userProfile) localStorage.setItem(this.KEYS.USER_PROFILE, JSON.stringify(data.userProfile));
        if (data.trainingRecords) localStorage.setItem(this.KEYS.TRAINING_RECORDS, JSON.stringify(data.trainingRecords));
    },

    clearAll() {
        Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
        this.token = null;
        this.useBackend = false;
        this.init();
    }
};

// Initialize & migrate on load
Storage.migrateOldKeys();
Storage.init();

// Make globally available
window.Storage = Storage;
