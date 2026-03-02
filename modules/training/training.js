/**
 * Training Module — workout logging via AI chat
 * Handles exercise recording, sets/reps/weight tracking
 */

const TrainingModule = {
    currentDate: null,
    isProcessing: false,
    charts: { intensity: null, volume: null },

    init() {
        this.currentDate = Utils.formatDate(new Date());
        this.setupEventListeners();
        this.initDateSelector();
        this.updateHeaderDate();
        this.loadDayData();
        this.initCharts();
        this.updateCharts();
    },

    destroy() {
        // Destroy chart instances to free memory
        if (this.charts) {
            Object.values(this.charts).forEach(chart => {
                if (chart) chart.destroy();
            });
        }
        this.charts = { intensity: null, volume: null };
    },

    updateHeaderDate() {
        const el = document.getElementById('trainingHeaderDate');
        if (el) el.textContent = Utils.getDisplayDate(new Date());
    },

    setupEventListeners() {
        const dateSelector = document.getElementById('trainingDateSelector');
        if (dateSelector) {
            dateSelector.addEventListener('change', (e) => {
                this.currentDate = e.target.value;
                this.loadDayData();
            });
        }

        // Chart toggle buttons
        document.querySelectorAll('.training-charts-section .chart-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => this.toggleChart(btn.dataset.chart));
        });
    },

    initDateSelector() {
        const el = document.getElementById('trainingDateSelector');
        if (el) el.value = this.currentDate;
    },

    // ==================== Data Loading ====================

    loadDayData() {
        const dayData = Storage.getTrainingByDate(this.currentDate);
        this.updateSummary(dayData);
        this.renderExerciseList(dayData.exercises);
    },

    updateSummary(dayData) {
        const exercises = dayData.exercises || [];
        let totalSets = 0;
        let totalVolume = 0;

        exercises.forEach(ex => {
            totalSets += ex.sets || 0;
            totalVolume += ex.volume || 0;
        });

        const exEl = document.getElementById('totalExercises');
        if (exEl) exEl.textContent = exercises.length;

        const setsEl = document.getElementById('totalSets');
        if (setsEl) setsEl.textContent = totalSets;

        const volEl = document.getElementById('totalVolume');
        if (volEl) volEl.textContent = totalVolume;

        const durEl = document.getElementById('trainingDuration');
        if (durEl) durEl.textContent = dayData.duration || '--';
    },

    renderExerciseList(exercises) {
        const list = document.getElementById('exerciseList');
        if (!list) return;

        if (!exercises || exercises.length === 0) {
            list.innerHTML = '<p class="empty-message">暂无记录，快去添加训练吧 💪</p>';
            return;
        }

        // Find max volume for bar scaling
        const maxVolume = Math.max(...exercises.map(e => e.volume || 0), 1);

        list.innerHTML = exercises.map(ex => {
            const setsHtml = ex.setDetails && ex.setDetails.length > 0
                ? ex.setDetails.map((s, i) => `<span class="set-tag">S${i + 1}: ${s.weight}kg×${s.reps}</span>`).join('')
                : `<span class="set-tag">${ex.sets}组×${ex.reps}次 @ ${ex.weight}kg</span>`;

            const volumePercent = maxVolume > 0 ? Math.round((ex.volume / maxVolume) * 100) : 0;

            // Show weight range if sets have different weights
            const weights = ex.setDetails ? [...new Set(ex.setDetails.map(s => s.weight))] : [ex.weight];
            const weightDisplay = weights.length > 1
                ? `${Math.min(...weights)}-${Math.max(...weights)}kg`
                : `${ex.weight}kg`;

            return `
                <div class="exercise-item fade-in" data-id="${ex.id}">
                    <div class="exercise-item-icon">🏋️</div>
                    <div class="exercise-item-info">
                        <div class="exercise-item-name">${ex.name}</div>
                        <div class="exercise-item-details">
                            ${ex.sets}组 · ${weightDisplay} · 容量 ${ex.volume}kg
                        </div>
                        <div class="exercise-sets">${setsHtml}</div>
                        <div class="volume-bar">
                            <div class="volume-bar-fill" style="width: ${volumePercent}%"></div>
                        </div>
                    </div>
                    <button class="exercise-item-delete" onclick="TrainingModule.deleteExercise('${ex.id}')">✕</button>
                </div>
            `;
        }).join('');
    },

    // ==================== Chat Interface ====================

    handleUserInput() {
        const input = document.getElementById('trainingChatInput');
        const message = input.value.trim();
        if (!message) return;
        this.addMessage(message, 'user');
        input.value = '';
        this.processMessage(message);
    },

    addMessage(content, type, status = '', saveToHistory = true) {
        const chatMessages = document.getElementById('trainingChatMessages');
        if (!chatMessages) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message ${status}`;

        if (type === 'user') {
            messageDiv.innerHTML = `<div class="bubble">${content}</div>`;
        } else {
            messageDiv.innerHTML = `
                <div class="bot-avatar">${type === 'system' ? '📌' : '🤖'}</div>
                <div class="bubble">${content}</div>
            `;
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (saveToHistory && type !== 'system') {
            Storage.addTrainingChatMessage({ content, type, status });
        }
    },

    loadChatHistory() {
        const history = Storage.getRecentTrainingChatHistory(50);
        if (history.length === 0) return;

        const chatMessages = document.getElementById('trainingChatMessages');
        if (!chatMessages) return;

        const separator = document.createElement('div');
        separator.className = 'message system-message';
        separator.innerHTML = `<div class="bot-avatar">📜</div><div class="bubble"><small>以下是历史聊天记录 (${history.length}条)</small></div>`;
        chatMessages.appendChild(separator);

        history.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.type}-message ${msg.status || ''}`;
            if (msg.type === 'user') {
                messageDiv.innerHTML = `<div class="bubble">${msg.content}</div>`;
            } else {
                messageDiv.innerHTML = `<div class="bot-avatar">🤖</div><div class="bubble">${msg.content}</div>`;
            }
            chatMessages.appendChild(messageDiv);
        });

        const newSep = document.createElement('div');
        newSep.className = 'message system-message';
        newSep.innerHTML = `<div class="bot-avatar">✨</div><div class="bubble"><small>───── 新消息 ─────</small></div>`;
        chatMessages.appendChild(newSep);

        chatMessages.scrollTop = chatMessages.scrollHeight;
    },

    // ==================== Message Processing ====================

    processMessage(message) {
        const lower = message.toLowerCase();

        if (lower === '汇总' || lower === '总结') { this.showSummary(); return; }
        if (lower === '帮助' || lower === 'help') { this.showHelp(); return; }
        if (lower === '清除记录' || lower === '清除聊天' || lower === '清空聊天') { this.clearChatHistory(); return; }

        // Duration input
        const durationMatch = message.match(/训练时长\s*[:：]?\s*(\d+)\s*(分钟|min|m)?/i);
        if (durationMatch) {
            this.setDuration(parseInt(durationMatch[1]));
            return;
        }

        // Try local parsing first
        const parsed = this.tryLocalParse(message);
        if (parsed) {
            this.addExercise(parsed);
            return;
        }

        // Fallback to AI parsing
        this.handleAITrainingInput(message);
    },

    /**
     * Try to parse common patterns locally without AI
     * Patterns: "卧推 60kg 4组8个", "深蹲 80kg 5x5", "引体向上 自重 3组10个"
     */
    tryLocalParse(message) {
        // Pattern: 动作名 重量kg 组数x次数 or 组数组次数个
        const patterns = [
            // "卧推 60kg 4组8个" or "卧推 60kg 4组8次"
            /^(.+?)\s+(\d+(?:\.\d+)?)\s*[kK][gG]\s+(\d+)\s*[组x×]\s*(\d+)\s*[个次reps]?$/,
            // "卧推 60 4x8"
            /^(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+)\s*[x×]\s*(\d+)$/,
            // "引体向上 自重 3组10个"
            /^(.+?)\s+自重\s+(\d+)\s*[组x×]\s*(\d+)\s*[个次reps]?$/,
        ];

        for (let i = 0; i < patterns.length; i++) {
            const match = message.match(patterns[i]);
            if (match) {
                if (i === 2) {
                    // Bodyweight pattern
                    return {
                        name: match[1].trim(),
                        weight: 0,
                        sets: parseInt(match[2]),
                        reps: parseInt(match[3]),
                        setDetails: this.generateSetDetails(0, parseInt(match[2]), parseInt(match[3]))
                    };
                } else {
                    return {
                        name: match[1].trim(),
                        weight: parseFloat(match[2]),
                        sets: parseInt(match[3]),
                        reps: parseInt(match[4]),
                        setDetails: this.generateSetDetails(parseFloat(match[2]), parseInt(match[3]), parseInt(match[4]))
                    };
                }
            }
        }

        return null;
    },

    generateSetDetails(weight, sets, reps) {
        const details = [];
        for (let i = 0; i < sets; i++) {
            details.push({ weight: weight, reps: reps });
        }
        return details;
    },

    addExercise(parsed) {
        const volume = parsed.weight * parsed.sets * parsed.reps;
        const exercise = {
            name: parsed.name,
            weight: parsed.weight,
            sets: parsed.sets,
            reps: parsed.reps,
            volume: volume,
            setDetails: parsed.setDetails || []
        };

        // Check if this exercise already exists today (merge detection)
        const dayData = Storage.getTrainingByDate(this.currentDate);
        const normalizedName = parsed.name.trim().toLowerCase();
        const existsBefore = dayData.exercises.some(e => e.name.trim().toLowerCase() === normalizedName);

        const result = Storage.addTrainingExercise(this.currentDate, exercise);
        this.loadDayData();

        const weightStr = parsed.weight > 0 ? `${parsed.weight}kg` : '自重';
        if (existsBefore) {
            this.addMessage(
                `✅ 已合并到：<strong>${parsed.name}</strong><br>` +
                `➕ 新增 ${parsed.sets}组 (${weightStr}×${parsed.reps}) · 当前共 ${result.sets}组 · 总容量 ${result.volume}kg`,
                'bot', 'success'
            );
        } else {
            this.addMessage(
                `✅ 已添加：<strong>${parsed.name}</strong><br>` +
                `🏋️ ${weightStr} · ${parsed.sets}组×${parsed.reps}次 · 容量 ${volume}kg`,
                'bot', 'success'
            );
        }
    },

    // ==================== AI Parsing ====================

    async handleAITrainingInput(message) {
        if (this.isProcessing) {
            this.addMessage('⏳ 请等待上一个请求完成...', 'bot', 'info');
            return;
        }
        this.isProcessing = true;
        this.addMessage('🤖 正在使用AI分析您的训练内容...', 'bot', 'info', false);

        const systemPrompt = `你是一个力量训练记录助手。用户会描述他们的训练内容，你需要解析出每个训练动作的名称、重量（kg）、组数和每组次数。

请严格按照以下JSON格式返回，不要有任何其他文字：
{
    "success": true,
    "exercises": [
        {
            "name": "标准化的训练动作名称",
            "weight": 重量数字(kg，自重填0),
            "sets": 组数,
            "reps": 每组次数,
            "set_details": [
                {"weight": 重量, "reps": 次数},
                {"weight": 重量, "reps": 次数}
            ]
        }
    ],
    "duration": 训练时长分钟数(如果用户提及了时长，否则为null)
}

如果无法解析，返回：{"success": false, "error": "原因"}

注意：
1. 如果用户描述了多个动作，请分别解析
2. set_details 数组长度应等于组数
3. 如果用户没指定重量，根据动作合理估计或填0（自重）
4. 常见动作名称请标准化：如"卧推"、"深蹲"、"硬拉"、"引体向上"等
5. 只返回JSON`;

        try {
            const aiResponse = await API.callDeepSeek(message, systemPrompt, { maxTokens: 800, type: 'training' });
            const result = API.parseJSONResponse(aiResponse);

            if (!result.success) {
                this.addMessage(`❌ ${result.error || '无法解析您的训练内容'}`, 'bot', 'error');
                this.isProcessing = false;
                return;
            }

            // Process duration if provided
            if (result.duration) {
                Storage.setTrainingDuration(this.currentDate, result.duration);
            }

            // Process each exercise
            const exercises = result.exercises || [];
            if (exercises.length === 0) {
                this.addMessage('❌ 未能识别到训练动作，请重新描述', 'bot', 'error');
                this.isProcessing = false;
                return;
            }

            // Pre-fetch day data for merge detection
            const dayData = Storage.getTrainingByDate(this.currentDate);
            const existingNames = new Set(dayData.exercises.map(e => e.name.trim().toLowerCase()));

            let summaryParts = [];
            exercises.forEach(ex => {
                const volume = ex.weight * ex.sets * ex.reps;
                const exercise = {
                    name: ex.name,
                    weight: ex.weight,
                    sets: ex.sets,
                    reps: ex.reps,
                    volume: volume,
                    setDetails: ex.set_details || this.generateSetDetails(ex.weight, ex.sets, ex.reps)
                };
                const wasMerged = existingNames.has(ex.name.trim().toLowerCase());
                const saved = Storage.addTrainingExercise(this.currentDate, exercise);
                existingNames.add(ex.name.trim().toLowerCase());

                const weightStr = ex.weight > 0 ? `${ex.weight}kg` : '自重';
                if (wasMerged) {
                    summaryParts.push(`• <strong>${ex.name}</strong> ${weightStr} +${ex.sets}组 → 共${saved.sets}组 (${saved.volume}kg)`);
                } else {
                    summaryParts.push(`• <strong>${ex.name}</strong> ${weightStr} ${ex.sets}组×${ex.reps}次 (容量${volume}kg)`);
                }
            });

            this.loadDayData();

            let msg = `✅ <span class="ai-badge">AI</span> 已添加 ${exercises.length} 个动作：<br>` + summaryParts.join('<br>');
            if (result.duration) {
                msg += `<br>⏱️ 训练时长：${result.duration}分钟`;
            }
            this.addMessage(msg, 'bot', 'success');

        } catch (error) {
            this.addMessage(`❌ AI服务暂时不可用，请稍后重试<br><small>${error.message}</small>`, 'bot', 'error');
        }
        this.isProcessing = false;
    },

    // ==================== Commands ====================

    setDuration(minutes) {
        if (minutes < 1 || minutes > 600) {
            this.addMessage('❌ 训练时长不合理，请输入1-600分钟之间的数值', 'bot', 'error');
            return;
        }
        Storage.setTrainingDuration(this.currentDate, minutes);
        this.loadDayData();
        this.addMessage(`✅ 已记录训练时长：<strong>${minutes}分钟</strong>`, 'bot', 'success');
    },

    showSummary() {
        const dayData = Storage.getTrainingByDate(this.currentDate);
        const exercises = dayData.exercises || [];

        let totalSets = 0;
        let totalVolume = 0;
        exercises.forEach(ex => {
            totalSets += ex.sets || 0;
            totalVolume += ex.volume || 0;
        });

        let html = `<strong>📊 ${this.currentDate} 训练汇总</strong><br><br>`;
        html += `<strong>动作数：</strong>${exercises.length}<br>`;
        html += `<strong>总组数：</strong>${totalSets}<br>`;
        html += `<strong>总容量：</strong>${totalVolume} kg<br>`;
        if (dayData.duration) html += `<strong>训练时长：</strong>${dayData.duration} 分钟<br>`;
        html += `<br><strong>动作列表：</strong><br>`;

        if (exercises.length === 0) {
            html += '暂无记录';
        } else {
            html += exercises.map(ex => {
                const weightStr = ex.weight > 0 ? `${ex.weight}kg` : '自重';
                return `• ${ex.name} ${weightStr} ${ex.sets}组×${ex.reps}次 (${ex.volume}kg)`;
            }).join('<br>');
        }

        this.addMessage(html, 'bot', 'info');
    },

    showHelp() {
        this.addMessage(
            `<strong>📖 训练记录帮助</strong><br><br>
            <strong>快速记录：</strong><br>
            格式：<code>动作名 重量kg 组数x次数</code><br>
            例如：<code>卧推 60kg 4组8个</code>、<code>深蹲 80kg 5x5</code><br><br>
            <strong>自重动作：</strong><code>引体向上 自重 3组10个</code><br>
            <strong>自然语言：</strong>"今天练了胸，卧推60做了4组8个"<br><br>
            <strong>记录时长：</strong><code>训练时长 60分钟</code><br>
            <strong>查看汇总：</strong>输入"汇总"<br>
            <strong>清除聊天：</strong>输入"清除记录"`,
            'bot', 'info'
        );
    },

    clearChatHistory() {
        Storage.clearTrainingChatHistory();
        const chatMessages = document.getElementById('trainingChatMessages');
        if (!chatMessages) return;
        const welcomeMessage = chatMessages.querySelector('.system-message');
        chatMessages.innerHTML = '';
        if (welcomeMessage) chatMessages.appendChild(welcomeMessage);
        this.addMessage('✅ 聊天记录已清除', 'bot', 'success', false);
    },

    deleteExercise(exerciseId) {
        Storage.removeTrainingExercise(this.currentDate, exerciseId);
        this.loadDayData();
        this.addMessage('✅ 已删除该训练记录', 'bot', 'success');
    },

    // ==================== Chart Methods ====================

    toggleChart(chartType) {
        document.querySelectorAll('.training-charts-section .chart-toggle-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.training-charts-section .chart-toggle-btn[data-chart="${chartType}"]`)?.classList.add('active');

        const intensityCard = document.getElementById('trainingIntensityCard');
        const volumeCard = document.getElementById('trainingVolumeCard');

        if (chartType === 'intensity') {
            intensityCard?.classList.remove('hidden');
            volumeCard?.classList.add('hidden');
            if (this.charts.intensity) {
                requestAnimationFrame(() => this.charts.intensity.resize());
            }
        } else {
            intensityCard?.classList.add('hidden');
            volumeCard?.classList.remove('hidden');
            // Lazy-init volume chart on first toggle
            if (!this.charts.volume) {
                this._createVolumeChart();
                this._updateVolumeChartData();
            }
            requestAnimationFrame(() => {
                if (this.charts.volume) this.charts.volume.resize();
            });
        }
    },

    _getChartOptions() {
        return {
            tooltip: {
                backgroundColor: '#fff', titleColor: '#1a2332', bodyColor: '#6b7b8d',
                borderColor: '#e8ecf0', borderWidth: 1, cornerRadius: 8, padding: 10
            },
            grid: { color: 'rgba(0,0,0,0.04)' }
        };
    },

    _createVolumeChart() {
        const opts = this._getChartOptions();
        const volumeCtx = document.getElementById('trainingVolumeChart')?.getContext('2d');
        if (!volumeCtx) return;
        this.charts.volume = new Chart(volumeCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: '训练容量 (kg)',
                    data: [],
                    backgroundColor: 'rgba(155,89,182,0.7)',
                    borderColor: '#9b59b6',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                animation: { duration: 300 },
                scales: {
                    x: { grid: opts.grid, title: { display: true, text: '日期', color: '#6b7b8d', font: { size: 11 } } },
                    y: { beginAtZero: true, grid: opts.grid, title: { display: true, text: '训练容量 (kg)', color: '#9b59b6', font: { size: 11 } } }
                },
                plugins: { legend: { display: false }, tooltip: opts.tooltip }
            }
        });
    },

    initCharts() {
        Chart.defaults.color = '#6b7b8d';
        Chart.defaults.borderColor = '#e8ecf0';
        Chart.defaults.font.family = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

        const opts = this._getChartOptions();

        // Only init intensity chart eagerly (it's visible by default)
        const intensityCtx = document.getElementById('trainingIntensityChart')?.getContext('2d');
        if (intensityCtx) {
            this.charts.intensity = new Chart(intensityCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: '最大重量 (kg)',
                        data: [],
                        fill: true,
                        backgroundColor: 'rgba(231,76,60,0.08)',
                        borderColor: '#e74c3c',
                        borderWidth: 2.5,
                        tension: 0.35,
                        pointBackgroundColor: '#e74c3c',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    animation: { duration: 300 },
                    scales: {
                        x: { grid: opts.grid, title: { display: true, text: '日期', color: '#6b7b8d', font: { size: 11 } } },
                        y: { beginAtZero: false, grid: opts.grid, title: { display: true, text: '最大重量 (kg)', color: '#e74c3c', font: { size: 11 } } }
                    },
                    plugins: { legend: { display: false }, tooltip: opts.tooltip }
                }
            });
        }

        // Volume chart is lazy-initialized on first toggle
        this.charts.volume = null;
    },

    _updateVolumeChartData() {
        if (!this.charts.volume) return;
        const trainingData = Storage.getRecentTrainingRecords(14);
        this.charts.volume.data.labels = trainingData.map(r => r.date.slice(5));
        this.charts.volume.data.datasets[0].data = trainingData.map(r => r.totalVolume || 0);
        this.charts.volume.update();
    },

    updateCharts() {
        // Training Intensity chart (always visible)
        if (this.charts.intensity) {
            const trainingData = Storage.getRecentTrainingRecords(14);
            this.charts.intensity.data.labels = trainingData.map(r => r.date.slice(5));
            this.charts.intensity.data.datasets[0].data = trainingData.map(r => r.maxIntensity || 0);
            this.charts.intensity.update();
        }

        // Volume chart — only update if already initialized
        this._updateVolumeChartData();
    }
};

// Make globally available for onclick handlers
window.TrainingModule = TrainingModule;
