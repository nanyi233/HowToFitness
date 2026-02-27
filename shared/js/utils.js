/**
 * Utility functions shared across modules
 */

const Utils = {
    /**
     * Format date to YYYY-MM-DD
     * @param {Date} date
     * @returns {string}
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Get display date string (e.g., "Monday, June 12")
     * @param {Date} date
     * @returns {string}
     */
    getDisplayDate(date) {
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
    },

    /**
     * Get today's date string
     * @returns {string}
     */
    today() {
        return this.formatDate(new Date());
    }
};

window.Utils = Utils;
