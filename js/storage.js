/**
 * Storage Module
 * Handles local storage operations for persistent data
 */

const Storage = {
    // Storage keys
    KEYS: {
        RECORDS: 'fitness_records',
        SETTINGS: 'fitness_settings',
        LEADERBOARD: 'fitness_leaderboard',
        PHOTOS: 'fitness_photos',
        THEME: 'fitness_theme',
        SOUND: 'fitness_sound'
    },

    /**
     * Save data to localStorage
     * @param {string} key - Storage key
     * @param {any} data - Data to save
     */
    save(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    },

    /**
     * Load data from localStorage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if not found
     * @returns {any} Loaded data or default value
     */
    load(key, defaultValue = null) {
        try {
            const serialized = localStorage.getItem(key);
            if (serialized === null) {
                return defaultValue;
            }
            return JSON.parse(serialized);
        } catch (error) {
            console.error('Storage load error:', error);
            return defaultValue;
        }
    },

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    /**
     * Clear all fitness data
     */
    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            this.remove(key);
        });
    },

    // ===== Records Management =====
    
    /**
     * Save exercise record
     * @param {string} bodyPart - Body part ID
     * @param {string} exerciseId - Exercise ID
     * @param {object} record - Record data {weight, reps, sets, date}
     */
    saveRecord(bodyPart, exerciseId, record) {
        const records = this.load(this.KEYS.RECORDS, {});
        
        if (!records[bodyPart]) {
            records[bodyPart] = {};
        }
        if (!records[bodyPart][exerciseId]) {
            records[bodyPart][exerciseId] = [];
        }
        
        // Add timestamp if not present
        if (!record.date) {
            record.date = new Date().toISOString();
        }
        
        records[bodyPart][exerciseId].unshift(record);
        
        // Keep only last 50 records per exercise
        if (records[bodyPart][exerciseId].length > 50) {
            records[bodyPart][exerciseId] = records[bodyPart][exerciseId].slice(0, 50);
        }
        
        this.save(this.KEYS.RECORDS, records);
        
        // Update leaderboard
        this.updateLeaderboard(bodyPart, exerciseId, record);
        
        return true;
    },

    /**
     * Get records for an exercise
     * @param {string} bodyPart - Body part ID
     * @param {string} exerciseId - Exercise ID
     * @returns {array} Array of records
     */
    getRecords(bodyPart, exerciseId) {
        const records = this.load(this.KEYS.RECORDS, {});
        return records[bodyPart]?.[exerciseId] || [];
    },

    /**
     * Get last record for an exercise
     * @param {string} bodyPart - Body part ID
     * @param {string} exerciseId - Exercise ID
     * @returns {object|null} Last record or null
     */
    getLastRecord(bodyPart, exerciseId) {
        const records = this.getRecords(bodyPart, exerciseId);
        return records.length > 0 ? records[0] : null;
    },

    /**
     * Get max weight for an exercise
     * @param {string} bodyPart - Body part ID
     * @param {string} exerciseId - Exercise ID
     * @returns {number} Max weight
     */
    getMaxWeight(bodyPart, exerciseId) {
        const records = this.getRecords(bodyPart, exerciseId);
        if (records.length === 0) return 0;
        return Math.max(...records.map(r => r.weight || 0));
    },

    /**
     * Get max reps for an exercise
     * @param {string} bodyPart - Body part ID
     * @param {string} exerciseId - Exercise ID
     * @returns {number} Max reps
     */
    getMaxReps(bodyPart, exerciseId) {
        const records = this.getRecords(bodyPart, exerciseId);
        if (records.length === 0) return 0;
        return Math.max(...records.map(r => r.reps || 0));
    },

    // ===== Leaderboard Management =====
    
    /**
     * Update leaderboard with new record
     */
    updateLeaderboard(bodyPart, exerciseId, record) {
        const leaderboard = this.load(this.KEYS.LEADERBOARD, {
            totalVolume: 0,
            totalSets: 0,
            totalWorkouts: 0,
            streak: 0,
            lastWorkoutDate: null,
            personalRecords: {}
        });
        
        // Update total volume (weight * reps * sets)
        const volume = (record.weight || 0) * (record.reps || 0) * (record.sets || 1);
        leaderboard.totalVolume += volume;
        leaderboard.totalSets += (record.sets || 1);
        
        // Update workout streak
        const today = new Date().toDateString();
        const lastDate = leaderboard.lastWorkoutDate;
        
        if (lastDate !== today) {
            leaderboard.totalWorkouts++;
            
            if (lastDate) {
                const lastDateObj = new Date(lastDate);
                const todayObj = new Date(today);
                const diffDays = Math.floor((todayObj - lastDateObj) / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    leaderboard.streak++;
                } else if (diffDays > 1) {
                    leaderboard.streak = 1;
                }
            } else {
                leaderboard.streak = 1;
            }
            
            leaderboard.lastWorkoutDate = today;
        }
        
        // Update personal records
        const key = `${bodyPart}_${exerciseId}`;
        if (!leaderboard.personalRecords[key]) {
            leaderboard.personalRecords[key] = { maxWeight: 0, maxReps: 0 };
        }
        
        if (record.weight > leaderboard.personalRecords[key].maxWeight) {
            leaderboard.personalRecords[key].maxWeight = record.weight;
        }
        if (record.reps > leaderboard.personalRecords[key].maxReps) {
            leaderboard.personalRecords[key].maxReps = record.reps;
        }
        
        this.save(this.KEYS.LEADERBOARD, leaderboard);
    },

    /**
     * Get leaderboard data
     * @returns {object} Leaderboard data
     */
    getLeaderboard() {
        return this.load(this.KEYS.LEADERBOARD, {
            totalVolume: 0,
            totalSets: 0,
            totalWorkouts: 0,
            streak: 0,
            lastWorkoutDate: null,
            personalRecords: {}
        });
    },

    // ===== Photo Management =====
    
    /**
     * Save photo for an exercise (as base64)
     * @param {string} bodyPart - Body part ID
     * @param {string} exerciseId - Exercise ID
     * @param {string} photoData - Base64 encoded photo
     */
    savePhoto(bodyPart, exerciseId, photoData) {
        const photos = this.load(this.KEYS.PHOTOS, {});
        const key = `${bodyPart}_${exerciseId}`;
        photos[key] = photoData;
        this.save(this.KEYS.PHOTOS, photos);
    },

    /**
     * Get photo for an exercise
     * @param {string} bodyPart - Body part ID
     * @param {string} exerciseId - Exercise ID
     * @returns {string|null} Base64 photo or null
     */
    getPhoto(bodyPart, exerciseId) {
        const photos = this.load(this.KEYS.PHOTOS, {});
        const key = `${bodyPart}_${exerciseId}`;
        return photos[key] || null;
    },

    // ===== Settings Management =====
    
    /**
     * Save theme setting
     * @param {string} theme - Theme name
     */
    saveTheme(theme) {
        this.save(this.KEYS.THEME, theme);
    },

    /**
     * Get theme setting
     * @returns {string} Theme name
     */
    getTheme() {
        return this.load(this.KEYS.THEME, 'default');
    },

    /**
     * Save sound setting
     * @param {boolean} enabled - Sound enabled state
     */
    saveSoundEnabled(enabled) {
        this.save(this.KEYS.SOUND, enabled);
    },

    /**
     * Get sound setting
     * @returns {boolean} Sound enabled state
     */
    getSoundEnabled() {
        return this.load(this.KEYS.SOUND, true);
    },

    // ===== Statistics =====
    
    /**
     * Get statistics summary
     * @returns {object} Statistics data
     */
    getStatistics() {
        const records = this.load(this.KEYS.RECORDS, {});
        const leaderboard = this.getLeaderboard();
        
        let totalExercises = 0;
        let exercisesWithRecords = 0;
        
        Object.values(records).forEach(bodyPart => {
            Object.values(bodyPart).forEach(exerciseRecords => {
                if (exerciseRecords.length > 0) {
                    exercisesWithRecords++;
                    totalExercises += exerciseRecords.length;
                }
            });
        });
        
        return {
            totalRecords: totalExercises,
            exercisesTracked: exercisesWithRecords,
            totalVolume: leaderboard.totalVolume,
            totalSets: leaderboard.totalSets,
            totalWorkouts: leaderboard.totalWorkouts,
            currentStreak: leaderboard.streak,
            personalRecords: leaderboard.personalRecords
        };
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
