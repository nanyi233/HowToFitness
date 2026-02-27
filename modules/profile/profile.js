/**
 * Profile Module
 */

const ProfileModule = {
    weightChart: null,
    weightSectionOpen: false,

    init() {
        this.updateProfileStats();
    },

    destroy() {
        if (this.weightChart) {
            this.weightChart.destroy();
            this.weightChart = null;
        }
        this.weightSectionOpen = false;
    },

    updateProfileStats() {
        // Streak
        const records = Storage.getDietRecords();
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = Utils.formatDate(d);
            if (records[key] && records[key].foods && records[key].foods.length > 0) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        const streakEl = document.getElementById('streakDays');
        if (streakEl) streakEl.textContent = streak > 0 ? `${streak} Days` : '0';

        // Latest weight
        const weightRecords = Storage.getWeightRecords();
        const profileWeightEl = document.getElementById('profileWeight');
        if (weightRecords.length > 0) {
            const latest = weightRecords[weightRecords.length - 1];
            if (profileWeightEl) profileWeightEl.textContent = `${latest.weight} kg`;
        } else {
            if (profileWeightEl) profileWeightEl.textContent = '--';
        }

        // BMI
        const bmiEl = document.getElementById('profileBMI');
        if (bmiEl && weightRecords.length > 0) {
            const w = weightRecords[weightRecords.length - 1].weight;
            const h = 1.75; // default height
            bmiEl.textContent = (w / (h * h)).toFixed(1);
        }
    },

    // ==================== Weight Chart ====================

    toggleWeightChart() {
        const section = document.getElementById('profileWeightSection');
        const arrow = document.getElementById('weightArrow');
        if (!section) return;

        this.weightSectionOpen = !this.weightSectionOpen;
        section.classList.toggle('hidden', !this.weightSectionOpen);

        if (arrow) {
            arrow.textContent = this.weightSectionOpen ? '⌄' : '›';
        }

        if (this.weightSectionOpen) {
            this.initWeightChart();
            this.renderWeightRecords();
        }
    },

    initWeightChart() {
        const ctx = document.getElementById('profileWeightChart')?.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart
        if (this.weightChart) {
            this.weightChart.destroy();
        }

        const chartTooltip = {
            backgroundColor: '#fff', titleColor: '#1a2332', bodyColor: '#6b7b8d',
            borderColor: '#e8ecf0', borderWidth: 1, cornerRadius: 8, padding: 10
        };
        const gridOpts = { color: 'rgba(0,0,0,0.04)' };

        const weightRecords = Storage.getRecentWeightRecords(30);

        this.weightChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weightRecords.map(r => r.date.slice(5)),
                datasets: [{
                    label: '体重 (kg)',
                    data: weightRecords.map(r => r.weight),
                    fill: true,
                    backgroundColor: 'rgba(0,188,212,0.08)',
                    borderColor: '#00bcd4',
                    borderWidth: 2.5,
                    tension: 0.35,
                    pointBackgroundColor: '#00bcd4',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: { grid: gridOpts },
                    y: { beginAtZero: false, grid: gridOpts }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: chartTooltip
                }
            }
        });
    },

    renderWeightRecords() {
        const container = document.getElementById('profileWeightRecords');
        if (!container) return;

        const records = Storage.getRecentWeightRecords(10);
        if (records.length === 0) {
            container.innerHTML = '<p class="empty-message" style="margin-top:8px;">暂无体重记录</p>';
            return;
        }

        // Show records in reverse chronological order
        const reversed = [...records].reverse();
        container.innerHTML = reversed.map((r, i) => {
            let diff = '';
            if (i < reversed.length - 1) {
                const prev = reversed[i + 1].weight;
                const change = r.weight - prev;
                if (change > 0) diff = `<span class="weight-change up">+${change.toFixed(1)}</span>`;
                else if (change < 0) diff = `<span class="weight-change down">${change.toFixed(1)}</span>`;
                else diff = `<span class="weight-change">0</span>`;
            }
            return `
                <div class="weight-record-item">
                    <span class="weight-record-date">${r.date}</span>
                    <span class="weight-record-value">${r.weight} kg ${diff}</span>
                </div>
            `;
        }).join('');
    },

    addWeight() {
        const input = document.getElementById('profileWeightInput');
        if (!input) return;

        const weight = parseFloat(input.value);
        if (isNaN(weight) || weight < 20 || weight > 300) {
            alert('请输入20-300之间的有效体重数值');
            return;
        }

        const today = Utils.formatDate(new Date());
        Storage.addWeightRecord(today, weight);

        input.value = '';
        this.updateProfileStats();
        this.initWeightChart();
        this.renderWeightRecords();
    },

    showHelp() {
        alert('📖 使用帮助\n\n在首页"AI助手"页面输入食物或训练信息来记录。\n\n饮食模式：输入 鸡胸肉 150g\n训练模式：输入 卧推 60kg 4组8个\n\n也可以用自然语言输入，AI会自动解析。');
    },

    clearChatHistory() {
        if (confirm('确定要清除所有聊天记录吗？')) {
            Storage.clearChatHistory();
            Storage.clearTrainingChatHistory();
            alert('✅ 聊天记录已清除');
        }
    }
};

window.ProfileModule = ProfileModule;
