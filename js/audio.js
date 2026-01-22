/**
 * Audio Module
 * Handles sound effects for the application
 */

const Audio = {
    // Audio elements
    sounds: {},
    enabled: true,

    /**
     * Initialize audio system
     */
    init() {
        // Load sound preference from storage
        this.enabled = Storage.getSoundEnabled();
        
        // Create audio context for generating sounds
        this.audioContext = null;
        
        // Try to get audio elements
        this.sounds.flip = document.getElementById('sound-flip');
        this.sounds.select = document.getElementById('sound-select');
        this.sounds.success = document.getElementById('sound-success');
        
        // Update UI
        this.updateToggleButton();
    },

    /**
     * Create audio context if not exists
     */
    getAudioContext() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Web Audio API not supported');
            }
        }
        return this.audioContext;
    },

    /**
     * Play a generated tone (fallback if no audio files)
     * @param {number} frequency - Tone frequency
     * @param {number} duration - Duration in seconds
     * @param {string} type - Oscillator type
     */
    playTone(frequency, duration = 0.15, type = 'sine') {
        if (!this.enabled) return;
        
        const ctx = this.getAudioContext();
        if (!ctx) return;
        
        try {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + duration);
        } catch (e) {
            console.warn('Error playing tone:', e);
        }
    },

    /**
     * Play flip sound
     */
    playFlip() {
        if (!this.enabled) return;
        
        if (this.sounds.flip && this.sounds.flip.src) {
            this.sounds.flip.currentTime = 0;
            this.sounds.flip.play().catch(() => {});
        } else {
            // Generate flip sound
            this.playTone(800, 0.1, 'sine');
            setTimeout(() => this.playTone(1000, 0.1, 'sine'), 50);
        }
    },

    /**
     * Play select sound
     */
    playSelect() {
        if (!this.enabled) return;
        
        if (this.sounds.select && this.sounds.select.src) {
            this.sounds.select.currentTime = 0;
            this.sounds.select.play().catch(() => {});
        } else {
            // Generate select sound
            this.playTone(600, 0.08, 'square');
        }
    },

    /**
     * Play success sound
     */
    playSuccess() {
        if (!this.enabled) return;
        
        if (this.sounds.success && this.sounds.success.src) {
            this.sounds.success.currentTime = 0;
            this.sounds.success.play().catch(() => {});
        } else {
            // Generate success melody
            this.playTone(523, 0.1, 'sine'); // C5
            setTimeout(() => this.playTone(659, 0.1, 'sine'), 100); // E5
            setTimeout(() => this.playTone(784, 0.15, 'sine'), 200); // G5
        }
    },

    /**
     * Play error sound
     */
    playError() {
        if (!this.enabled) return;
        this.playTone(200, 0.2, 'sawtooth');
    },

    /**
     * Play navigation sound
     */
    playNavigate() {
        if (!this.enabled) return;
        this.playTone(440, 0.05, 'sine');
    },

    /**
     * Toggle sound on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        Storage.saveSoundEnabled(this.enabled);
        this.updateToggleButton();
        
        // Play a sound to confirm if enabled
        if (this.enabled) {
            this.playSelect();
        }
    },

    /**
     * Update toggle button UI
     */
    updateToggleButton() {
        const btn = document.getElementById('sound-toggle');
        if (btn) {
            const icon = btn.querySelector('.icon');
            if (icon) {
                icon.textContent = this.enabled ? '🔊' : '🔇';
            }
        }
    },

    /**
     * Resume audio context (needed after user interaction)
     */
    resume() {
        const ctx = this.getAudioContext();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume();
        }
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Audio;
}
