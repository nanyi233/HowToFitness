/**
 * Exercises Module
 * Handles exercise library display and record management
 */

const Exercises = {
    // State
    currentBodyPart: null,
    currentExercise: null,

    /**
     * Initialize exercises module
     */
    init() {
        this.exerciseGrid = document.getElementById('exercise-grid');
        this.modal = document.getElementById('exercise-modal');
        this.bindEvents();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Modal close button
        document.getElementById('modal-close')?.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Close modal on backdrop click
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Save record button
        document.getElementById('save-record-btn')?.addEventListener('click', () => {
            this.saveRecord();
        });
        
        // Photo upload
        document.getElementById('photo-upload')?.addEventListener('change', (e) => {
            this.handlePhotoUpload(e);
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
                this.closeModal();
            }
        });
    },

    /**
     * Load exercises for a body part
     * @param {string} bodyPartId - Body part ID
     */
    loadExercises(bodyPartId) {
        this.currentBodyPart = bodyPartId;
        const bodyPart = ExerciseData.getBodyPart(bodyPartId);
        
        if (!bodyPart) {
            console.error('Body part not found:', bodyPartId);
            return;
        }
        
        // Update title
        const titleEl = document.getElementById('current-part-title');
        if (titleEl) {
            titleEl.textContent = `${bodyPart.name}动作库`;
        }
        
        // Clear grid
        this.exerciseGrid.innerHTML = '';
        
        // Generate exercise cards
        bodyPart.exercises.forEach((exercise, index) => {
            const card = this.createExerciseCard(exercise, index);
            this.exerciseGrid.appendChild(card);
        });
    },

    /**
     * Create exercise card element
     * @param {object} exercise - Exercise data
     * @param {number} index - Card index for animation delay
     * @returns {HTMLElement} Card element
     */
    createExerciseCard(exercise, index) {
        const card = document.createElement('div');
        card.className = 'exercise-card stagger-item animate-fadeInUp';
        card.style.animationDelay = `${index * 0.1}s`;
        card.dataset.exerciseId = exercise.id;
        
        // Get last record data
        const maxWeight = Storage.getMaxWeight(this.currentBodyPart, exercise.id);
        const maxReps = Storage.getMaxReps(this.currentBodyPart, exercise.id);
        
        card.innerHTML = `
            <div class="exercise-card-header">
                <div class="exercise-card-icon">${exercise.icon}</div>
                <div class="exercise-card-title">
                    <h3>${exercise.name}</h3>
                    <p>${exercise.nameEn}</p>
                </div>
            </div>
            <div class="exercise-card-stats">
                <div class="exercise-stat">
                    <div class="exercise-stat-value">${maxWeight > 0 ? maxWeight + ' kg' : '--'}</div>
                    <div class="exercise-stat-label">最大重量</div>
                </div>
                <div class="exercise-stat">
                    <div class="exercise-stat-value">${maxReps > 0 ? maxReps + ' 次' : '--'}</div>
                    <div class="exercise-stat-label">最大次数</div>
                </div>
            </div>
        `;
        
        // Click to open detail
        card.addEventListener('click', () => {
            this.openExerciseDetail(exercise.id);
            Audio.playSelect();
        });
        
        return card;
    },

    /**
     * Open exercise detail modal
     * @param {string} exerciseId - Exercise ID
     */
    openExerciseDetail(exerciseId) {
        const exercise = ExerciseData.getExercise(this.currentBodyPart, exerciseId);
        if (!exercise) return;
        
        this.currentExercise = exerciseId;
        
        // Update modal content
        document.getElementById('modal-exercise-name').textContent = exercise.name;
        
        // Update stats
        const maxWeight = Storage.getMaxWeight(this.currentBodyPart, exerciseId);
        const maxReps = Storage.getMaxReps(this.currentBodyPart, exerciseId);
        
        document.getElementById('last-max-weight').textContent = 
            maxWeight > 0 ? `${maxWeight} kg` : '-- kg';
        document.getElementById('last-max-reps').textContent = 
            maxReps > 0 ? `${maxReps} 次` : '-- 次';
        
        // Load photo
        const photo = Storage.getPhoto(this.currentBodyPart, exerciseId);
        const imgEl = document.getElementById('modal-exercise-image');
        if (imgEl) {
            imgEl.src = photo || `data:image/svg+xml,${encodeURIComponent(this.getPlaceholderSVG(exercise.icon))}`;
        }
        
        // Load history
        this.loadHistory(exerciseId);
        
        // Clear form
        document.getElementById('weight-input').value = '';
        document.getElementById('reps-input').value = '';
        document.getElementById('sets-input').value = '';
        
        // Show modal
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    /**
     * Generate placeholder SVG
     * @param {string} icon - Emoji icon
     * @returns {string} SVG string
     */
    getPlaceholderSVG(icon) {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150">
            <rect fill="#f0f0f0" width="200" height="150"/>
            <text x="100" y="75" font-size="50" text-anchor="middle" dominant-baseline="middle">${icon}</text>
            <text x="100" y="120" font-size="12" fill="#999" text-anchor="middle">点击上传照片</text>
        </svg>`;
    },

    /**
     * Close modal
     */
    closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.currentExercise = null;
    },

    /**
     * Load exercise history
     * @param {string} exerciseId - Exercise ID
     */
    loadHistory(exerciseId) {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;
        
        const records = Storage.getRecords(this.currentBodyPart, exerciseId);
        
        if (records.length === 0) {
            historyList.innerHTML = '<p class="no-history">暂无训练记录</p>';
            return;
        }
        
        historyList.innerHTML = records.slice(0, 10).map(record => {
            const date = new Date(record.date);
            const dateStr = date.toLocaleDateString('zh-CN', { 
                month: 'short', 
                day: 'numeric' 
            });
            
            return `
                <div class="history-item">
                    <span class="history-date">${dateStr}</span>
                    <div class="history-stats">
                        <span>${record.weight || 0} kg</span>
                        <span>${record.reps || 0} 次</span>
                        <span>${record.sets || 1} 组</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Save training record
     */
    saveRecord() {
        if (!this.currentBodyPart || !this.currentExercise) return;
        
        const weight = parseFloat(document.getElementById('weight-input').value) || 0;
        const reps = parseInt(document.getElementById('reps-input').value) || 0;
        const sets = parseInt(document.getElementById('sets-input').value) || 1;
        
        if (weight <= 0 && reps <= 0) {
            Audio.playError();
            alert('请输入有效的训练数据');
            return;
        }
        
        const record = { weight, reps, sets };
        Storage.saveRecord(this.currentBodyPart, this.currentExercise, record);
        
        // Play success sound
        Audio.playSuccess();
        
        // Update display
        document.getElementById('last-max-weight').textContent = 
            `${Storage.getMaxWeight(this.currentBodyPart, this.currentExercise)} kg`;
        document.getElementById('last-max-reps').textContent = 
            `${Storage.getMaxReps(this.currentBodyPart, this.currentExercise)} 次`;
        
        // Reload history
        this.loadHistory(this.currentExercise);
        
        // Clear form
        document.getElementById('weight-input').value = '';
        document.getElementById('reps-input').value = '';
        document.getElementById('sets-input').value = '';
        
        // Update exercise card in grid
        this.updateExerciseCard(this.currentExercise);
        
        // Show success feedback
        this.showFeedback('记录保存成功！');
    },

    /**
     * Update exercise card display
     * @param {string} exerciseId - Exercise ID
     */
    updateExerciseCard(exerciseId) {
        const card = this.exerciseGrid.querySelector(`[data-exercise-id="${exerciseId}"]`);
        if (!card) return;
        
        const maxWeight = Storage.getMaxWeight(this.currentBodyPart, exerciseId);
        const maxReps = Storage.getMaxReps(this.currentBodyPart, exerciseId);
        
        const weightEl = card.querySelector('.exercise-stat:first-child .exercise-stat-value');
        const repsEl = card.querySelector('.exercise-stat:last-child .exercise-stat-value');
        
        if (weightEl) weightEl.textContent = maxWeight > 0 ? `${maxWeight} kg` : '--';
        if (repsEl) repsEl.textContent = maxReps > 0 ? `${maxReps} 次` : '--';
        
        // Add animation
        card.classList.add('animate-pulse');
        setTimeout(() => card.classList.remove('animate-pulse'), 500);
    },

    /**
     * Handle photo upload
     * @param {Event} e - Change event
     */
    handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('图片大小不能超过5MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            
            // Save to storage
            Storage.savePhoto(this.currentBodyPart, this.currentExercise, base64);
            
            // Update image display
            const imgEl = document.getElementById('modal-exercise-image');
            if (imgEl) {
                imgEl.src = base64;
            }
            
            Audio.playSuccess();
            this.showFeedback('照片上传成功！');
        };
        
        reader.readAsDataURL(file);
    },

    /**
     * Show feedback message
     * @param {string} message - Message to display
     */
    showFeedback(message) {
        // Create feedback element
        const feedback = document.createElement('div');
        feedback.className = 'feedback-toast animate-fadeInUp';
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--gradient-primary);
            color: white;
            padding: 1rem 2rem;
            border-radius: var(--border-radius-xl);
            box-shadow: var(--shadow-lg);
            z-index: 2000;
        `;
        
        document.body.appendChild(feedback);
        
        // Remove after 2 seconds
        setTimeout(() => {
            feedback.classList.add('animate-fadeOut');
            setTimeout(() => feedback.remove(), 300);
        }, 2000);
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Exercises;
}
