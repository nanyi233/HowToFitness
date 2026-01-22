/**
 * Leaderboard Module
 * Handles leaderboard display and statistics
 */

const Leaderboard = {
    // State
    currentTab: 'total',

    /**
     * Initialize leaderboard module
     */
    init() {
        this.modal = document.getElementById('leaderboard-modal');
        this.content = document.getElementById('leaderboard-content');
        this.bindEvents();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Leaderboard button
        document.getElementById('leaderboard-btn')?.addEventListener('click', () => {
            this.open();
            Audio.playSelect();
        });
        
        // Close button
        document.getElementById('leaderboard-close')?.addEventListener('click', () => {
            this.close();
        });
        
        // Tab buttons
        document.querySelectorAll('.leaderboard-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });
        
        // Close on backdrop click
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
    },

    /**
     * Open leaderboard modal
     */
    open() {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.renderContent();
    },

    /**
     * Close leaderboard modal
     */
    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    },

    /**
     * Switch leaderboard tab
     * @param {string} tab - Tab name
     */
    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.leaderboard-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        this.renderContent();
        Audio.playNavigate();
    },

    /**
     * Render leaderboard content based on current tab
     */
    renderContent() {
        if (!this.content) return;
        
        switch (this.currentTab) {
            case 'total':
                this.renderTotalVolume();
                break;
            case 'streak':
                this.renderStreak();
                break;
            case 'personal':
                this.renderPersonalRecords();
                break;
        }
    },

    /**
     * Render total volume leaderboard
     */
    renderTotalVolume() {
        const stats = Storage.getStatistics();
        
        this.content.innerHTML = `
            <div class="stats-summary">
                <div class="leaderboard-item">
                    <div class="leaderboard-rank gold">🏆</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">总训练量</div>
                        <div class="leaderboard-detail">所有训练重量 × 次数 × 组数</div>
                    </div>
                    <div class="leaderboard-value">${this.formatNumber(stats.totalVolume)} kg</div>
                </div>
                
                <div class="leaderboard-item">
                    <div class="leaderboard-rank silver">📊</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">总训练组数</div>
                        <div class="leaderboard-detail">完成的训练组数</div>
                    </div>
                    <div class="leaderboard-value">${stats.totalSets} 组</div>
                </div>
                
                <div class="leaderboard-item">
                    <div class="leaderboard-rank bronze">📝</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">训练记录</div>
                        <div class="leaderboard-detail">已记录的训练条目</div>
                    </div>
                    <div class="leaderboard-value">${stats.totalRecords} 条</div>
                </div>
                
                <div class="leaderboard-item">
                    <div class="leaderboard-rank">💪</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">训练动作</div>
                        <div class="leaderboard-detail">已练习的不同动作</div>
                    </div>
                    <div class="leaderboard-value">${stats.exercisesTracked} 个</div>
                </div>
            </div>
        `;
    },

    /**
     * Render streak information
     */
    renderStreak() {
        const stats = Storage.getStatistics();
        const leaderboard = Storage.getLeaderboard();
        
        const streakEmoji = this.getStreakEmoji(stats.currentStreak);
        const motivationText = this.getMotivationText(stats.currentStreak);
        
        this.content.innerHTML = `
            <div class="streak-display">
                <div class="streak-main">
                    <div class="streak-icon">${streakEmoji}</div>
                    <div class="streak-number">${stats.currentStreak}</div>
                    <div class="streak-label">天连续训练</div>
                </div>
                
                <div class="streak-motivation">${motivationText}</div>
                
                <div class="leaderboard-item">
                    <div class="leaderboard-rank">📅</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">总训练天数</div>
                        <div class="leaderboard-detail">累计训练的天数</div>
                    </div>
                    <div class="leaderboard-value">${stats.totalWorkouts} 天</div>
                </div>
                
                <div class="leaderboard-item">
                    <div class="leaderboard-rank">📆</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">最近训练</div>
                        <div class="leaderboard-detail">上次训练日期</div>
                    </div>
                    <div class="leaderboard-value">${leaderboard.lastWorkoutDate || '未记录'}</div>
                </div>
            </div>
        `;
        
        // Add streak-specific styles
        const style = document.createElement('style');
        style.textContent = `
            .streak-display {
                text-align: center;
            }
            .streak-main {
                padding: 2rem;
                background: var(--gradient-primary);
                border-radius: var(--border-radius-lg);
                color: white;
                margin-bottom: 1.5rem;
            }
            .streak-icon {
                font-size: 4rem;
                margin-bottom: 0.5rem;
            }
            .streak-number {
                font-size: 4rem;
                font-weight: 700;
            }
            .streak-label {
                font-size: 1.2rem;
                opacity: 0.9;
            }
            .streak-motivation {
                font-size: 1.1rem;
                color: var(--text-secondary);
                margin-bottom: 1.5rem;
                font-style: italic;
            }
        `;
        this.content.appendChild(style);
    },

    /**
     * Render personal records
     */
    renderPersonalRecords() {
        const stats = Storage.getStatistics();
        const records = stats.personalRecords;
        
        if (Object.keys(records).length === 0) {
            this.content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎯</div>
                    <h3>暂无个人记录</h3>
                    <p>开始训练并记录数据，您的个人最佳记录将显示在这里</p>
                </div>
            `;
            this.addEmptyStateStyles();
            return;
        }
        
        // Get all records with exercise info
        const recordsList = Object.entries(records).map(([key, data]) => {
            const [bodyPartId, exerciseId] = key.split('_');
            const bodyPart = ExerciseData.getBodyPart(bodyPartId);
            const exercise = ExerciseData.getExercise(bodyPartId, exerciseId);
            
            return {
                bodyPart: bodyPart?.name || bodyPartId,
                exercise: exercise?.name || exerciseId,
                icon: exercise?.icon || '💪',
                maxWeight: data.maxWeight,
                maxReps: data.maxReps
            };
        }).filter(r => r.maxWeight > 0 || r.maxReps > 0);
        
        // Sort by max weight
        recordsList.sort((a, b) => b.maxWeight - a.maxWeight);
        
        this.content.innerHTML = `
            <div class="records-list">
                ${recordsList.map((record, index) => `
                    <div class="leaderboard-item">
                        <div class="leaderboard-rank ${this.getRankClass(index)}">${record.icon}</div>
                        <div class="leaderboard-info">
                            <div class="leaderboard-name">${record.exercise}</div>
                            <div class="leaderboard-detail">${record.bodyPart}</div>
                        </div>
                        <div class="record-values">
                            <div class="leaderboard-value">${record.maxWeight} kg</div>
                            <div class="leaderboard-detail">${record.maxReps} 次</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add record-specific styles
        const style = document.createElement('style');
        style.textContent = `
            .record-values {
                text-align: right;
            }
            .record-values .leaderboard-detail {
                margin-top: 0.25rem;
            }
        `;
        this.content.appendChild(style);
    },

    /**
     * Get rank class based on index
     */
    getRankClass(index) {
        if (index === 0) return 'gold';
        if (index === 1) return 'silver';
        if (index === 2) return 'bronze';
        return '';
    },

    /**
     * Get streak emoji based on days
     */
    getStreakEmoji(days) {
        if (days >= 30) return '🔥';
        if (days >= 14) return '⭐';
        if (days >= 7) return '💪';
        if (days >= 3) return '👍';
        return '🌱';
    },

    /**
     * Get motivation text based on streak
     */
    getMotivationText(days) {
        if (days >= 30) return '太棒了！你已经养成了健身习惯！';
        if (days >= 14) return '两周连续训练，继续保持！';
        if (days >= 7) return '一周连续训练，你真的很棒！';
        if (days >= 3) return '好的开始，继续加油！';
        if (days >= 1) return '每一天都是新的开始！';
        return '今天是开始训练的好日子！';
    },

    /**
     * Format large numbers
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    /**
     * Add empty state styles
     */
    addEmptyStateStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .empty-state {
                text-align: center;
                padding: 3rem;
            }
            .empty-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
            }
            .empty-state h3 {
                color: var(--text-primary);
                margin-bottom: 0.5rem;
            }
            .empty-state p {
                color: var(--text-secondary);
            }
        `;
        this.content.appendChild(style);
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Leaderboard;
}
