/**
 * Main Application Module
 * Initializes and coordinates all modules
 */

const App = {
    // State
    isInitialized: false,
    currentScreen: 'hero-selection',

    /**
     * Initialize the application
     */
    init() {
        if (this.isInitialized) return;
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    },

    /**
     * Setup all modules and event listeners
     */
    setup() {
        console.log('🏋️ HowToFitness - Initializing...');
        
        // Initialize modules
        Theme.init();
        Audio.init();
        Carousel.init();
        Exercises.init();
        Leaderboard.init();
        
        // Bind global events
        this.bindEvents();
        
        // Hide loading screen
        this.hideLoadingScreen();
        
        this.isInitialized = true;
        console.log('✅ HowToFitness - Ready!');
    },

    /**
     * Bind global event listeners
     */
    bindEvents() {
        // Start training button
        document.getElementById('start-training-btn')?.addEventListener('click', () => {
            this.startTraining();
        });
        
        // Back to selection button
        document.getElementById('back-to-selection')?.addEventListener('click', () => {
            this.showScreen('hero-selection');
            Carousel.reset();
            Audio.playNavigate();
        });
        
        // Resume audio context on user interaction
        document.addEventListener('click', () => {
            Audio.resume();
        }, { once: true });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
        
        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Pause any animations if needed
            } else {
                // Resume animations
            }
        });
        
        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    },

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.remove();
                }, 500);
            }, 500);
        }
    },

    /**
     * Start training - navigate to exercise library
     */
    startTraining() {
        const selectedPart = Carousel.getSelectedPart();
        
        if (!selectedPart) {
            Audio.playError();
            alert('请先选择一个训练部位');
            return;
        }
        
        Audio.playSelect();
        
        // Load exercises for selected body part
        Exercises.loadExercises(selectedPart);
        
        // Switch to exercise library screen
        this.showScreen('exercise-library');
    },

    /**
     * Show a specific screen
     * @param {string} screenId - Screen element ID
     */
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /**
     * Handle keyboard events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboard(e) {
        // ESC to go back
        if (e.key === 'Escape') {
            if (this.currentScreen === 'exercise-library') {
                this.showScreen('hero-selection');
                Carousel.reset();
            }
        }
        
        // Enter to start training
        if (e.key === 'Enter' && this.currentScreen === 'hero-selection') {
            // Check if not in a modal
            const activeModal = document.querySelector('.modal.active');
            if (!activeModal) {
                this.startTraining();
            }
        }
    },

    /**
     * Handle window resize
     */
    handleResize() {
        // Recalculate carousel if needed
        if (Carousel.updateCarousel) {
            Carousel.updateCarousel();
        }
    },

    /**
     * Get application statistics
     * @returns {object} Statistics object
     */
    getStats() {
        return Storage.getStatistics();
    },

    /**
     * Reset all application data
     */
    resetData() {
        if (confirm('确定要清除所有训练数据吗？此操作不可恢复。')) {
            Storage.clearAll();
            location.reload();
        }
    }
};

// Initialize the application
App.init();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
