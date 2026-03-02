/**
 * Food Module — main entry
 * Handles chat input, food recording, calorie display
 */

const FoodModule = {
    currentDate: null,
    isProcessing: false,
    calorieTarget: 2200,
    charts: { training: null, rest: null },

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
        if (this.charts) {
            Object.values(this.charts).forEach(chart => {
                if (chart) chart.destroy();
            });
        }
        this.charts = { training: null, rest: null };
    },

    updateHeaderDate() {
        const el = document.getElementById('headerDate');
        if (el) el.textContent = Utils.getDisplayDate(new Date());
    },

    setupEventListeners() {
        const dateSelector = document.getElementById('dateSelector');
        if (dateSelector) {
            dateSelector.addEventListener('change', (e) => {
                this.currentDate = e.target.value;
                this.loadDayData();
            });
        }

        const dayType = document.getElementById('dayType');
        if (dayType) {
            dayType.addEventListener('change', async (e) => {
                await Storage.setDayType(this.currentDate, e.target.value);
            });
        }

        // Chart toggle buttons
        document.querySelectorAll('.food-charts-section .chart-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => this.toggleChart(btn.dataset.chart));
        });
    },

    initDateSelector() {
        const el = document.getElementById('dateSelector');
        if (el) el.value = this.currentDate;
    },

    async loadDayData() {
        const dayData = await Storage.getDietByDate(this.currentDate);
        const dayTypeEl = document.getElementById('dayType');
        if (dayTypeEl) dayTypeEl.value = dayData.dayType;
        this.updateTotals(dayData.totals);
        this.renderFoodList(dayData.foods);
    },

    updateTotals(totals) {
        const cal = totals.calories || 0;
        const calEl = document.getElementById('totalCalories');
        if (calEl) calEl.textContent = cal;

        const proteinEl = document.getElementById('totalProtein');
        if (proteinEl) proteinEl.textContent = totals.protein || 0;

        const carbsEl = document.getElementById('totalCarbs');
        if (carbsEl) carbsEl.textContent = totals.carbs || 0;

        const fatEl = document.getElementById('totalFat');
        if (fatEl) fatEl.textContent = totals.fat || 0;

        const pct = Math.min((cal / this.calorieTarget) * 100, 100);
        const bar = document.getElementById('caloriesProgressBar');
        if (bar) bar.style.width = pct + '%';
    },

    renderFoodList(foods) {
        const foodList = document.getElementById('foodList');
        if (!foodList) return;

        if (foods.length === 0) {
            foodList.innerHTML = '<p class="empty-message">暂无记录，快去添加食物吧 🍽️</p>';
            return;
        }

        foodList.innerHTML = foods.map(food => `
            <div class="food-item fade-in" data-id="${food.id}">
                <div class="food-item-icon">🍽️</div>
                <div class="food-item-info">
                    <div class="food-item-name">${food.name} - ${food.grams}g</div>
                    <div class="food-item-details">
                        ${food.calories}kcal · P ${food.protein}g · C ${food.carbs}g · F ${food.fat}g
                    </div>
                    <div class="nutrition-bar">
                        <div class="protein" style="width: ${this.getNutritionPercent(food, 'protein')}%"></div>
                        <div class="carbs" style="width: ${this.getNutritionPercent(food, 'carbs')}%"></div>
                        <div class="fat" style="width: ${this.getNutritionPercent(food, 'fat')}%"></div>
                    </div>
                </div>
                <button class="food-item-delete" onclick="FoodModule.deleteFood('${food.id}')">✕</button>
            </div>
        `).join('');
    },

    getNutritionPercent(food, type) {
        const total = (food.protein * 4) + (food.carbs * 4) + (food.fat * 9);
        if (total === 0) return 0;
        const multiplier = type === 'fat' ? 9 : 4;
        return Math.round((food[type] * multiplier / total) * 100);
    },

    handleUserInput() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (!message) return;
        this.addMessage(message, 'user');
        input.value = '';
        this.processMessage(message);
    },

    addMessage(content, type, status = '', saveToHistory = true) {
        const chatMessages = document.getElementById('chatMessages');
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
            Storage.addChatMessage({ content, type, status });
        }
    },

    loadChatHistory() {
        const history = Storage.getRecentChatHistory(50);
        if (history.length === 0) return;

        const chatMessages = document.getElementById('chatMessages');
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

    clearChatHistory() {
        Storage.clearChatHistory();
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        const welcomeMessage = chatMessages.querySelector('.system-message');
        chatMessages.innerHTML = '';
        if (welcomeMessage) chatMessages.appendChild(welcomeMessage);
        this.addMessage('✅ 聊天记录已清除', 'bot', 'success', false);
    },

    processMessage(message) {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('体重')) { this.handleWeightInput(message); return; }
        if (lowerMessage === '力训日' || lowerMessage === '训练日') { this.setDayType('training'); return; }
        if (lowerMessage === '休息日') { this.setDayType('rest'); return; }
        if (lowerMessage === '汇总' || lowerMessage === '总结') { this.showSummary(); return; }
        if (lowerMessage === '帮助' || lowerMessage === 'help') { this.showHelp(); return; }
        if (lowerMessage === '清除记录' || lowerMessage === '清除聊天' || lowerMessage === '清空聊天') { this.clearChatHistory(); return; }
        this.handleFoodInput(message);
    },

    async handleFoodInput(message) {
        const regex = /(.+?)\s*(\d+(?:\.\d+)?)\s*[gG克]?$/;
        const match = message.match(regex);

        if (!match) {
            this.addMessage('🤖 正在使用AI分析您的输入...', 'bot', 'info');
            await this.handleAIFoodInput(message);
            return;
        }

        const foodName = match[1].trim();
        const grams = parseFloat(match[2]);
        const foodData = searchFood(foodName);

        if (!foodData) {
            this.addMessage(`🤖 本地数据库未找到"${foodName}"，正在使用AI查询营养信息...`, 'bot', 'info');
            await this.getAINutritionInfo(foodName, grams);
            return;
        }

        const nutrition = calculateNutrition(foodData, grams);
        await Storage.addFood(this.currentDate, nutrition);
        await this.loadDayData();

        this.addMessage(
            `✅ 已添加：<strong>${nutrition.name}</strong> ${grams}g<br>` +
            `🔥 ${nutrition.calories}kcal · 🥩 ${nutrition.protein}g蛋白 · 🍚 ${nutrition.carbs}g碳水 · 🥑 ${nutrition.fat}g脂肪`,
            'bot', 'success'
        );
    },

    async handleAIFoodInput(message) {
        if (this.isProcessing) {
            this.addMessage('⏳ 请等待上一个请求完成...', 'bot', 'info');
            return;
        }
        this.isProcessing = true;

        // Build conversation history from chat records for multi-turn context
        const chatHistory = Storage.getRecentChatHistory(20);
        const messages = API.buildChatMessages(chatHistory);

        const systemPrompt = `你是一个饮食记录助手。（系统提示仅在直连模式使用）`;

        try {
            const aiResponse = await API.callDeepSeek(message, systemPrompt, { type: 'food', messages });
            const result = API.parseJSONResponse(aiResponse);

            if (!result.success) {
                this.addMessage(`❌ ${result.error || '无法解析您的输入'}`, 'bot', 'error');
                this.isProcessing = false;
                return;
            }

            // Support both single food (legacy) and multi-food (new) response format
            const foods = result.foods || [{
                food_name: result.food_name,
                grams: result.grams,
                per_100g: result.per_100g
            }];

            if (foods.length === 0) {
                this.addMessage('❌ 未能识别到食物信息', 'bot', 'error');
                this.isProcessing = false;
                return;
            }

            let parts = [];
            for (const item of foods) {
                const nutrition = {
                    name: item.food_name,
                    grams: item.grams,
                    calories: Math.round(item.per_100g.calories * item.grams / 100),
                    protein: Math.round(item.per_100g.protein * item.grams / 100 * 10) / 10,
                    carbs: Math.round(item.per_100g.carbs * item.grams / 100 * 10) / 10,
                    fat: Math.round(item.per_100g.fat * item.grams / 100 * 10) / 10
                };
                await Storage.addFood(this.currentDate, nutrition);
                parts.push(`• <strong>${nutrition.name}</strong> ${nutrition.grams}g — 🔥${nutrition.calories}kcal 🥩${nutrition.protein}g`);
            }

            await this.loadDayData();

            this.addMessage(
                `✅ <span class="ai-badge">AI</span> 已记录 ${foods.length} 项饮食：<br>` + parts.join('<br>'),
                'bot', 'success'
            );
        } catch (error) {
            this.addMessage(`❌ AI服务暂时不可用，请稍后重试<br><small>${error.message}</small>`, 'bot', 'error');
        }
        this.isProcessing = false;
    },

    async getAINutritionInfo(foodName, grams) {
        if (this.isProcessing) {
            this.addMessage('⏳ 请等待上一个请求完成...', 'bot', 'info');
            return;
        }
        this.isProcessing = true;

        // Build conversation history for context
        const chatHistory = Storage.getRecentChatHistory(20);
        const messages = API.buildChatMessages(chatHistory);

        const systemPrompt = `你是一个营养学专家。（系统提示仅在直连模式使用）`;

        try {
            const aiResponse = await API.callDeepSeek(`请提供"${foodName}"的营养信息`, systemPrompt, { type: 'food', messages });
            const result = API.parseJSONResponse(aiResponse);

            if (!result.success) {
                this.addMessage(`❌ ${result.error || '无法识别该食物'}`, 'bot', 'error');
                this.isProcessing = false;
                return;
            }

            const nutrition = {
                name: result.food_name,
                grams: grams,
                calories: Math.round(result.per_100g.calories * grams / 100),
                protein: Math.round(result.per_100g.protein * grams / 100 * 10) / 10,
                carbs: Math.round(result.per_100g.carbs * grams / 100 * 10) / 10,
                fat: Math.round(result.per_100g.fat * grams / 100 * 10) / 10
            };

            await Storage.addFood(this.currentDate, nutrition);
            await this.loadDayData();

            this.addMessage(
                `✅ <span class="ai-badge">AI</span> 已添加：<strong>${nutrition.name}</strong> ${grams}g<br>` +
                `🔥 ${nutrition.calories}kcal · 🥩 ${nutrition.protein}g蛋白 · 🍚 ${nutrition.carbs}g碳水 · 🥑 ${nutrition.fat}g脂肪`,
                'bot', 'success'
            );
        } catch (error) {
            this.addMessage(`❌ AI服务暂时不可用，请稍后重试<br><small>${error.message}</small>`, 'bot', 'error');
        }
        this.isProcessing = false;
    },

    async handleWeightInput(message) {
        const regex = /体重\s*[:：]?\s*(\d+(?:\.\d+)?)\s*[kK]?[gG]?/;
        const match = message.match(regex);

        if (!match) {
            this.addMessage('❌ 格式不正确，请使用：<code>体重 70.5</code>', 'bot', 'error');
            return;
        }

        const weight = parseFloat(match[1]);
        if (weight < 20 || weight > 300) {
            this.addMessage('❌ 体重数值不合理，请输入20-300kg之间的数值', 'bot', 'error');
            return;
        }

        await Storage.addWeightRecord(this.currentDate, weight);

        const weightRecords = await Storage.getWeightRecords();
        let comparison = '';
        if (weightRecords.length >= 2) {
            const prevRecord = weightRecords[weightRecords.length - 2];
            const diff = weight - prevRecord.weight;
            if (diff > 0) comparison = `<br>📈 较上次(${prevRecord.date})增加了 <strong>${diff.toFixed(1)}kg</strong>`;
            else if (diff < 0) comparison = `<br>📉 较上次(${prevRecord.date})减少了 <strong>${Math.abs(diff).toFixed(1)}kg</strong>`;
            else comparison = `<br>➡️ 与上次(${prevRecord.date})持平`;
        }

        this.addMessage(`✅ 已记录体重：<strong>${weight}kg</strong> (${this.currentDate})${comparison}`, 'bot', 'success');
    },

    async setDayType(type) {
        await Storage.setDayType(this.currentDate, type);
        const el = document.getElementById('dayType');
        if (el) el.value = type;
        const typeName = type === 'training' ? '力训日' : '休息日';
        this.addMessage(`✅ 已将今天设置为：<strong>${typeName}</strong>`, 'bot', 'success');
    },

    async showSummary() {
        const dayData = await Storage.getDietByDate(this.currentDate);
        const weightRecord = await Storage.getWeightByDate(this.currentDate);
        const dayTypeName = dayData.dayType === 'training' ? '力训日' : '休息日';

        let summaryHtml = `
            <strong>📊 ${this.currentDate} 汇总</strong><br>
            <strong>类型：</strong>${dayTypeName}<br><br>
            <strong>营养摄入：</strong><br>
            🔥 热量：${dayData.totals.calories} kcal<br>
            🥩 蛋白质：${dayData.totals.protein} g<br>
            🍚 碳水：${dayData.totals.carbs} g<br>
            🥑 脂肪：${dayData.totals.fat} g<br><br>
            <strong>食物列表：</strong><br>
        `;

        if (dayData.foods.length === 0) summaryHtml += '暂无记录';
        else summaryHtml += dayData.foods.map(f => `• ${f.name} ${f.grams}g`).join('<br>');
        if (weightRecord) summaryHtml += `<br><br><strong>今日体重：</strong>${weightRecord.weight} kg`;

        this.addMessage(summaryHtml, 'bot', 'info');
    },

    showHelp() {
        this.addMessage(
            `<strong>📖 使用帮助</strong><br><br>
            <strong>记录食物：</strong><br>
            输入格式：<code>食物名称 克数</code><br>
            例如：鸡胸肉 150g、米饭 200<br>
            <small>💡 也可以自然语言输入，如"早上吃了两个鸡蛋"</small><br><br>
            <strong>记录体重：</strong><code>体重 70.5</code><br>
            <strong>设置日期类型：</strong>输入"力训日"或"休息日"<br>
            <strong>查看汇总：</strong>输入"汇总"<br>
            <strong>清除聊天记录：</strong>输入"清除记录"`,
            'bot', 'info'
        );
    },

    async deleteFood(foodId) {
        await Storage.removeFood(this.currentDate, foodId);
        await this.loadDayData();
        this.addMessage('✅ 已删除该食物记录', 'bot', 'success');
    },

    // ==================== Chart Methods ====================

    toggleChart(chartType) {
        document.querySelectorAll('.food-charts-section .chart-toggle-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.food-charts-section .chart-toggle-btn[data-chart="${chartType}"]`)?.classList.add('active');

        const trainingCard = document.getElementById('foodTrainingChartCard');
        const restCard = document.getElementById('foodRestChartCard');

        if (chartType === 'training') {
            trainingCard?.classList.remove('hidden');
            restCard?.classList.add('hidden');
            if (this.charts.training) {
                requestAnimationFrame(() => this.charts.training.resize());
            }
        } else {
            trainingCard?.classList.add('hidden');
            restCard?.classList.remove('hidden');
            if (!this.charts.rest) {
                this._createRestChart();
                this._updateRestChartData();
            }
            requestAnimationFrame(() => {
                if (this.charts.rest) this.charts.rest.resize();
            });
        }
    },

    _getChartConfig() {
        return {
            tooltip: {
                backgroundColor: '#fff', titleColor: '#1a2332', bodyColor: '#6b7b8d',
                borderColor: '#e8ecf0', borderWidth: 1, cornerRadius: 8, padding: 10
            },
            grid: { color: 'rgba(0,0,0,0.04)' },
            datasets: [
                { label: '蛋白质 (g)', data: [], backgroundColor: 'rgba(46,204,113,0.7)', borderColor: '#2ecc71', borderWidth: 1, borderRadius: 6 },
                { label: '碳水 (g)', data: [], backgroundColor: 'rgba(243,156,18,0.7)', borderColor: '#f39c12', borderWidth: 1, borderRadius: 6 },
                { label: '脂肪 (g)', data: [], backgroundColor: 'rgba(231,76,60,0.6)', borderColor: '#e74c3c', borderWidth: 1, borderRadius: 6 }
            ]
        };
    },

    _createBarChart(canvasId) {
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return null;
        const cfg = this._getChartConfig();
        return new Chart(ctx, {
            type: 'bar',
            data: { labels: [], datasets: JSON.parse(JSON.stringify(cfg.datasets)) },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                animation: { duration: 300 },
                scales: { x: { grid: cfg.grid }, y: { beginAtZero: true, grid: cfg.grid } },
                plugins: {
                    legend: { position: 'top', labels: { color: '#6b7b8d', usePointStyle: true, pointStyle: 'circle' } },
                    tooltip: cfg.tooltip
                }
            }
        });
    },

    _createRestChart() {
        this.charts.rest = this._createBarChart('foodRestDayChart');
    },

    initCharts() {
        Chart.defaults.color = '#6b7b8d';
        Chart.defaults.borderColor = '#e8ecf0';
        Chart.defaults.font.family = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

        this.charts.training = this._createBarChart('foodTrainingDayChart');
        this.charts.rest = null;
    },

    async _updateRestChartData() {
        if (!this.charts.rest) return;
        const restRecords = await Storage.getRecentDietRecords('rest', 7);
        this.charts.rest.data.labels = restRecords.map(r => r.date.slice(5));
        this.charts.rest.data.datasets[0].data = restRecords.map(r => r.totals.protein);
        this.charts.rest.data.datasets[1].data = restRecords.map(r => r.totals.carbs);
        this.charts.rest.data.datasets[2].data = restRecords.map(r => r.totals.fat);
        this.charts.rest.update();
    },

    async updateCharts() {
        if (this.charts.training) {
            const trainingRecords = await Storage.getRecentDietRecords('training', 7);
            this.charts.training.data.labels = trainingRecords.map(r => r.date.slice(5));
            this.charts.training.data.datasets[0].data = trainingRecords.map(r => r.totals.protein);
            this.charts.training.data.datasets[1].data = trainingRecords.map(r => r.totals.carbs);
            this.charts.training.data.datasets[2].data = trainingRecords.map(r => r.totals.fat);
            this.charts.training.update();
        }

        await this._updateRestChartData();
    }
};

// Make globally available for onclick handlers
window.FoodModule = FoodModule;
