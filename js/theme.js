/**
 * Theme Module
 * Handles theme switching and persistence
 */

const Theme = {
    // Available themes
    themes: ['default', 'dark', 'ocean', 'sunset', 'forest', 'neon'],
    currentTheme: 'default',

    /**
     * Initialize theme module
     */
    init() {
        this.modal = document.getElementById('theme-modal');
        
        // Load saved theme
        this.currentTheme = Storage.getTheme();
        this.apply(this.currentTheme);
        
        this.bindEvents();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Theme toggle button
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            this.openModal();
            Audio.playSelect();
        });
        
        // Close button
        document.getElementById('theme-close')?.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Theme options
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                this.select(option.dataset.theme);
            });
        });
        
        // Close on backdrop click
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Keyboard shortcut for theme cycling
        document.addEventListener('keydown', (e) => {
            if (e.key === 't' && e.ctrlKey) {
                e.preventDefault();
                this.cycleTheme();
            }
        });
    },

    /**
     * Open theme modal
     */
    openModal() {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.updateActiveOption();
    },

    /**
     * Close theme modal
     */
    closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    },

    /**
     * Select a theme
     * @param {string} theme - Theme name
     */
    select(theme) {
        if (!this.themes.includes(theme)) return;
        
        this.currentTheme = theme;
        this.apply(theme);
        Storage.saveTheme(theme);
        this.updateActiveOption();
        
        Audio.playSelect();
    },

    /**
     * Apply theme to document
     * @param {string} theme - Theme name
     */
    apply(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update meta theme-color for mobile browsers
        const themeColors = {
            default: '#667eea',
            dark: '#2d3748',
            ocean: '#005bea',
            sunset: '#f5576c',
            forest: '#11998e',
            neon: '#ff00ff'
        };
        
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = themeColors[theme] || themeColors.default;
    },

    /**
     * Update active option in modal
     */
    updateActiveOption() {
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.theme === this.currentTheme);
        });
    },

    /**
     * Cycle through themes
     */
    cycleTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.select(this.themes[nextIndex]);
    },

    /**
     * Get current theme
     * @returns {string} Current theme name
     */
    getCurrent() {
        return this.currentTheme;
    },

    /**
     * Check if dark mode
     * @returns {boolean} True if using dark or neon theme
     */
    isDark() {
        return ['dark', 'neon'].includes(this.currentTheme);
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Theme;
}
