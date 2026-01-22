/**
 * Carousel Module
 * Handles hero selection carousel with swipe support
 */

const Carousel = {
    // State
    currentIndex: 0,
    cards: [],
    indicators: [],
    selectedPart: null,
    isAnimating: false,
    
    // Touch handling
    touchStartX: 0,
    touchEndX: 0,
    
    /**
     * Initialize carousel
     */
    init() {
        this.carousel = document.getElementById('hero-carousel');
        this.cards = document.querySelectorAll('.hero-card');
        this.indicators = document.querySelectorAll('.indicator');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        
        if (!this.carousel || this.cards.length === 0) return;
        
        this.bindEvents();
        this.updateCarousel();
        
        // Set initial selected part
        this.selectedPart = this.cards[0]?.dataset.part || null;
        this.cards[0]?.classList.add('selected');
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Navigation buttons
        this.prevBtn?.addEventListener('click', () => this.prev());
        this.nextBtn?.addEventListener('click', () => this.next());
        
        // Indicators
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goTo(index));
        });
        
        // Card click/flip
        this.cards.forEach((card, index) => {
            card.addEventListener('click', () => this.selectCard(index));
        });
        
        // Touch events for swipe
        this.carousel.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.carousel.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
        this.carousel.addEventListener('touchend', () => this.handleTouchEnd());
        
        // Mouse drag events
        this.carousel.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.carousel.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.carousel.addEventListener('mouseup', () => this.handleMouseUp());
        this.carousel.addEventListener('mouseleave', () => this.handleMouseUp());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    },

    /**
     * Go to previous card
     */
    prev() {
        if (this.isAnimating) return;
        this.goTo(this.currentIndex - 1);
        Audio.playNavigate();
    },

    /**
     * Go to next card
     */
    next() {
        if (this.isAnimating) return;
        this.goTo(this.currentIndex + 1);
        Audio.playNavigate();
    },

    /**
     * Go to specific index
     * @param {number} index - Target index
     */
    goTo(index) {
        if (this.isAnimating) return;
        
        // Wrap around
        if (index < 0) index = this.cards.length - 1;
        if (index >= this.cards.length) index = 0;
        
        this.currentIndex = index;
        this.updateCarousel();
        this.selectCard(index, false);
    },

    /**
     * Select a card
     * @param {number} index - Card index
     * @param {boolean} flip - Whether to flip the card
     */
    selectCard(index, flip = true) {
        // Remove selection from all cards
        this.cards.forEach(card => {
            card.classList.remove('selected');
            if (!flip) card.classList.remove('flipped');
        });
        
        // Select the clicked card
        const card = this.cards[index];
        if (card) {
            card.classList.add('selected');
            this.selectedPart = card.dataset.part;
            
            // Flip card on click
            if (flip) {
                card.classList.toggle('flipped');
                Audio.playFlip();
            }
            
            // Navigate to this card if not current
            if (index !== this.currentIndex) {
                this.currentIndex = index;
                this.updateCarousel();
            }
        }
    },

    /**
     * Update carousel position and indicators
     */
    updateCarousel() {
        this.isAnimating = true;
        
        // Calculate scroll position
        const cardWidth = this.cards[0]?.offsetWidth || 280;
        const gap = 32; // 2rem gap
        const scrollPosition = this.currentIndex * (cardWidth + gap);
        
        // Scroll carousel
        this.carousel.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
        
        // Update indicators
        this.indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentIndex);
        });
        
        // Update card scales
        this.cards.forEach((card, index) => {
            const distance = Math.abs(index - this.currentIndex);
            const scale = 1 - (distance * 0.1);
            const opacity = 1 - (distance * 0.2);
            
            card.style.transform = `scale(${Math.max(scale, 0.8)})`;
            card.style.opacity = Math.max(opacity, 0.5);
        });
        
        // Reset animation flag
        setTimeout(() => {
            this.isAnimating = false;
        }, 500);
    },

    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
    },

    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        this.touchEndX = e.touches[0].clientX;
    },

    /**
     * Handle touch end
     */
    handleTouchEnd() {
        const diff = this.touchStartX - this.touchEndX;
        const threshold = 50;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.next();
            } else {
                this.prev();
            }
        }
        
        this.touchStartX = 0;
        this.touchEndX = 0;
    },

    /**
     * Handle mouse down
     */
    handleMouseDown(e) {
        this.isDragging = true;
        this.touchStartX = e.clientX;
        this.carousel.style.cursor = 'grabbing';
    },

    /**
     * Handle mouse move
     */
    handleMouseMove(e) {
        if (!this.isDragging) return;
        this.touchEndX = e.clientX;
    },

    /**
     * Handle mouse up
     */
    handleMouseUp() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.carousel.style.cursor = 'grab';
        
        const diff = this.touchStartX - this.touchEndX;
        const threshold = 50;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.next();
            } else {
                this.prev();
            }
        }
        
        this.touchStartX = 0;
        this.touchEndX = 0;
    },

    /**
     * Handle keyboard navigation
     */
    handleKeyboard(e) {
        // Only if hero selection is active
        const heroSection = document.getElementById('hero-selection');
        if (!heroSection?.classList.contains('active')) return;
        
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.prev();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.next();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.selectCard(this.currentIndex);
                break;
        }
    },

    /**
     * Get currently selected body part
     * @returns {string|null} Selected body part ID
     */
    getSelectedPart() {
        return this.selectedPart;
    },

    /**
     * Reset carousel to initial state
     */
    reset() {
        this.currentIndex = 0;
        this.cards.forEach(card => {
            card.classList.remove('flipped', 'selected');
        });
        this.cards[0]?.classList.add('selected');
        this.selectedPart = this.cards[0]?.dataset.part || null;
        this.updateCarousel();
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Carousel;
}
