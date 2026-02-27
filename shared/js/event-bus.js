/**
 * Event Bus — cross-module communication
 */
const EventBus = {
    _listeners: {},

    /**
     * Subscribe to an event
     * @param {string} event
     * @param {function} callback
     * @returns {function} unsubscribe function
     */
    on(event, callback) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(callback);
        return () => this.off(event, callback);
    },

    /**
     * Unsubscribe from an event
     * @param {string} event
     * @param {function} callback
     */
    off(event, callback) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    },

    /**
     * Emit an event
     * @param {string} event
     * @param {*} data
     */
    emit(event, data) {
        if (!this._listeners[event]) return;
        this._listeners[event].forEach(cb => {
            try {
                cb(data);
            } catch (err) {
                console.error(`EventBus error on "${event}":`, err);
            }
        });
    },

    /**
     * Clear all listeners (useful for cleanup)
     */
    clear() {
        this._listeners = {};
    }
};

// Make globally available
window.EventBus = EventBus;
