/**
 * Main Application Module
 * Handles user interactions, chat processing, and chart rendering
 */

// DeepSeek API Configuration
const DEEPSEEK_CONFIG = {
    apiKey: 'sk-f498ca40814d498fa1da7ce70552001b',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat'
};

const App = {
    currentDate: null,
    charts: {
        training: null,
        rest: null,
        weight: null
    },
    isProcessing: false, // Flag to prevent multiple simultaneous requests

    /**
     * Initialize the application
     */
    init() {
        this.currentDate = this.formatDate(new Date());
        this.setupEventListeners();
        this.initDateSelector();
        this.loadDayData();
        this.initCharts();
        this.updateCharts();
        this.loadChatHistory(); // Load chat history on init
    },

    /**
     * Format date to YYYY-MM-DD
     * @param {Date} date - Date object
     * @returns {string} - Formatted date string
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Chat input
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUserInput();
            }
        });
        
        sendBtn.addEventListener('click', () => {
            this.handleUserInput();
        });

        // Date selector
        document.getElementById('dateSelector').addEventListener('change', (e) => {
            this.currentDate = e.target.value;
            this.loadDayData();
        });

        // Day type selector
        document.getElementById('dayType').addEventListener('change', (e) => {
            Storage.setDayType(this.currentDate, e.target.value);
            this.updateCharts();
        });
    },

    /**
     * Initialize date selector with current date
     */
    initDateSelector() {
        const dateSelector = document.getElementById('dateSelector');
        dateSelector.value = this.currentDate;
    },

    /**
     * Load data for the selected day
     */
    loadDayData() {
        const dayData = Storage.getDietByDate(this.currentDate);
        
        // Update day type selector
        document.getElementById('dayType').value = dayData.dayType;
        
        // Update totals
        this.updateTotals(dayData.totals);
        
        // Update food list
        this.renderFoodList(dayData.foods);
    },

    /**
     * Update nutrition totals display
     * @param {object} totals - Nutrition totals
     */
    updateTotals(totals) {
        document.getElementById('totalCalories').textContent = totals.calories || 0;
        document.getElementById('totalProtein').textContent = totals.protein || 0;
        document.getElementById('totalCarbs').textContent = totals.carbs || 0;
        document.getElementById('totalFat').textContent = totals.fat || 0;
    },

    /**
     * Render food list for the current day
     * @param {array} foods - Array of food items
     */
    renderFoodList(foods) {
        const foodList = document.getElementById('foodList');
        
        if (foods.length === 0) {
            foodList.innerHTML = '<p class="empty-message">暂无记录</p>';
            return;
        }
        
        foodList.innerHTML = foods.map(food => `
            <div class="food-item fade-in" data-id="${food.id}">
                <div class="food-item-info">
                    <div class="food-item-name">${food.name} - ${food.grams}g</div>
                    <div class="food-item-details">
                        🔥 ${food.calories}kcal | 
                        🥩 ${food.protein}g蛋白 | 
                        🍚 ${food.carbs}g碳水 | 
                        🥑 ${food.fat}g脂肪
                    </div>
                    <div class="nutrition-bar">
                        <div class="protein" style="width: ${this.getNutritionPercent(food, 'protein')}%"></div>
                        <div class="carbs" style="width: ${this.getNutritionPercent(food, 'carbs')}%"></div>
                        <div class="fat" style="width: ${this.getNutritionPercent(food, 'fat')}%"></div>
                    </div>
                </div>
                <button class="food-item-delete" onclick="App.deleteFood('${food.id}')">删除</button>
            </div>
        `).join('');
    },

    /**
     * Calculate nutrition percentage for visual bar
     * @param {object} food - Food item
     * @param {string} type - Nutrition type
     * @returns {number} - Percentage
     */
    getNutritionPercent(food, type) {
        const total = (food.protein * 4) + (food.carbs * 4) + (food.fat * 9);
        if (total === 0) return 0;
        
        const multiplier = type === 'fat' ? 9 : 4;
        return Math.round((food[type] * multiplier / total) * 100);
    },

    /**
     * Handle user input from chat
     */
    handleUserInput() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        input.value = '';
        
        // Process the message
        this.processMessage(message);
    },

    /**
     * Add message to chat display
     * @param {string} content - Message content
     * @param {string} type - Message type (user, bot, system)
     * @param {string} status - Bot message status (success, error, info)
     * @param {boolean} saveToHistory - Whether to save to history (default: true)
     */
    addMessage(content, type, status = '', saveToHistory = true) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message ${status}`;
        messageDiv.innerHTML = content;
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Save to storage (skip system welcome messages and temporary status messages)
        if (saveToHistory && type !== 'system') {
            Storage.addChatMessage({
                content: content,
                type: type,
                status: status
            });
        }
    },

    /**
     * Load chat history from storage
     */
    loadChatHistory() {
        const history = Storage.getRecentChatHistory(50);
        
        if (history.length === 0) {
            return; // No history to load
        }

        const chatMessages = document.getElementById('chatMessages');
        
        // Add a separator for historical messages
        const separator = document.createElement('div');
        separator.className = 'message system-message';
        separator.innerHTML = `<small>📜 以下是历史聊天记录 (${history.length}条)</small>`;
        chatMessages.appendChild(separator);
        
        // Load historical messages
        history.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.type}-message ${msg.status || ''}`;
            messageDiv.innerHTML = msg.content;
            chatMessages.appendChild(messageDiv);
        });

        // Add separator for new messages
        const newSeparator = document.createElement('div');
        newSeparator.className = 'message system-message';
        newSeparator.innerHTML = '<small>───────── 新消息 ─────────</small>';
        chatMessages.appendChild(newSeparator);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    },

    /**
     * Clear chat history
     */
    clearChatHistory() {
        Storage.clearChatHistory();
        const chatMessages = document.getElementById('chatMessages');
        // Keep only the welcome message
        const welcomeMessage = chatMessages.querySelector('.system-message');
        chatMessages.innerHTML = '';
        if (welcomeMessage) {
            chatMessages.appendChild(welcomeMessage);
        }
        this.addMessage('✅ 聊天记录已清除', 'bot', 'success', false);
    },

    /**
     * Process user message and generate response
     * @param {string} message - User input message
     */
    processMessage(message) {
        const lowerMessage = message.toLowerCase();
        
        // Check for weight record
        if (lowerMessage.includes('体重')) {
            this.handleWeightInput(message);
            return;
        }
        
        // Check for day type setting
        if (lowerMessage === '力训日' || lowerMessage === '训练日') {
            this.setDayType('training');
            return;
        }
        
        if (lowerMessage === '休息日') {
            this.setDayType('rest');
            return;
        }
        
        // Check for summary request
        if (lowerMessage === '汇总' || lowerMessage === '总结') {
            this.showSummary();
            return;
        }
        
        // Check for help
        if (lowerMessage === '帮助' || lowerMessage === 'help') {
            this.showHelp();
            return;
        }

        // Check for clear chat history
        if (lowerMessage === '清除记录' || lowerMessage === '清除聊天' || lowerMessage === '清空聊天') {
            this.clearChatHistory();
            return;
        }
        
        // Default: treat as food input
        this.handleFoodInput(message);
    },

    /**
     * Handle food input
     * @param {string} message - User input
     */
    async handleFoodInput(message) {
        // Parse food name and grams
        // Support formats: "鸡胸肉 150g", "鸡胸肉 150", "鸡胸肉150g"
        const regex = /(.+?)\s*(\d+(?:\.\d+)?)\s*[gG克]?$/;
        const match = message.match(regex);
        
        if (!match) {
            // If format doesn't match, try using AI to parse the message
            this.addMessage('🤖 正在使用AI分析您的输入...', 'bot', 'info');
            await this.handleAIFoodInput(message);
            return;
        }
        
        const foodName = match[1].trim();
        const grams = parseFloat(match[2]);
        
        // Search for food in database
        const foodData = searchFood(foodName);
        
        if (!foodData) {
            // If not found in local database, use AI to get nutrition info
            this.addMessage(`🤖 本地数据库未找到"${foodName}"，正在使用AI查询营养信息...`, 'bot', 'info');
            await this.getAINutritionInfo(foodName, grams);
            return;
        }
        
        // Calculate nutrition
        const nutrition = calculateNutrition(foodData, grams);
        
        // Save to storage
        Storage.addFood(this.currentDate, nutrition);
        
        // Update display
        this.loadDayData();
        this.updateCharts();
        
        // Show success message
        this.addMessage(
            `✅ 已添加：<strong>${nutrition.name}</strong> ${grams}g<br>` +
            `🔥 ${nutrition.calories}kcal | ` +
            `🥩 ${nutrition.protein}g蛋白 | ` +
            `🍚 ${nutrition.carbs}g碳水 | ` +
            `🥑 ${nutrition.fat}g脂肪`,
            'bot', 'success'
        );
    },

    /**
     * Call DeepSeek API
     * @param {string} prompt - User prompt
     * @param {string} systemPrompt - System prompt
     * @returns {Promise<string>} - AI response
     */
    async callDeepSeekAPI(prompt, systemPrompt) {
        try {
            const response = await fetch(DEEPSEEK_CONFIG.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
                },
                body: JSON.stringify({
                    model: DEEPSEEK_CONFIG.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('DeepSeek API Error:', error);
            throw error;
        }
    },

    /**
     * Handle AI-powered food input parsing
     * @param {string} message - User input message
     */
    async handleAIFoodInput(message) {
        if (this.isProcessing) {
            this.addMessage('⏳ 请等待上一个请求完成...', 'bot', 'info');
            return;
        }

        this.isProcessing = true;

        const systemPrompt = `你是一个饮食记录助手。用户会输入他们吃的食物，你需要解析出食物名称和克数，并提供每100g的营养信息。

请严格按照以下JSON格式返回，不要有任何其他文字：
{
  "success": true,
  "food_name": "食物名称",
  "grams": 数字,
  "per_100g": {
    "calories": 热量数字,
    "protein": 蛋白质数字,
    "carbs": 碳水数字,
    "fat": 脂肪数字
  }
}

如果无法解析，返回：
{"success": false, "error": "原因"}

注意：
1. 如果用户没有说明克数，请根据常识估算合理的份量
2. 营养数据请尽量准确
3. 只返回JSON，不要有其他文字`;

        try {
            const aiResponse = await this.callDeepSeekAPI(message, systemPrompt);
            
            // Parse AI response
            let result;
            try {
                // Clean the response (remove markdown code blocks if present)
                let cleanResponse = aiResponse.trim();
                if (cleanResponse.startsWith('```json')) {
                    cleanResponse = cleanResponse.slice(7);
                }
                if (cleanResponse.startsWith('```')) {
                    cleanResponse = cleanResponse.slice(3);
                }
                if (cleanResponse.endsWith('```')) {
                    cleanResponse = cleanResponse.slice(0, -3);
                }
                result = JSON.parse(cleanResponse.trim());
            } catch (e) {
                this.addMessage('❌ AI返回格式错误，请重试', 'bot', 'error');
                this.isProcessing = false;
                return;
            }

            if (!result.success) {
                this.addMessage(`❌ ${result.error || '无法解析您的输入，请使用格式：食物名称 克数'}`, 'bot', 'error');
                this.isProcessing = false;
                return;
            }

            // Calculate nutrition based on AI data
            const nutrition = {
                name: result.food_name,
                grams: result.grams,
                calories: Math.round(result.per_100g.calories * result.grams / 100),
                protein: Math.round(result.per_100g.protein * result.grams / 100 * 10) / 10,
                carbs: Math.round(result.per_100g.carbs * result.grams / 100 * 10) / 10,
                fat: Math.round(result.per_100g.fat * result.grams / 100 * 10) / 10
            };

            // Save to storage
            Storage.addFood(this.currentDate, nutrition);

            // Update display
            this.loadDayData();
            this.updateCharts();

            // Show success message
            this.addMessage(
                `✅ <span class="ai-badge">AI</span> 已添加：<strong>${nutrition.name}</strong> ${nutrition.grams}g<br>` +
                `🔥 ${nutrition.calories}kcal | ` +
                `🥩 ${nutrition.protein}g蛋白 | ` +
                `🍚 ${nutrition.carbs}g碳水 | ` +
                `🥑 ${nutrition.fat}g脂肪`,
                'bot', 'success'
            );
        } catch (error) {
            this.addMessage(`❌ AI服务暂时不可用，请稍后重试<br><small>${error.message}</small>`, 'bot', 'error');
        }

        this.isProcessing = false;
    },

    /**
     * Get nutrition info from AI for unknown food
     * @param {string} foodName - Food name
     * @param {number} grams - Amount in grams
     */
    async getAINutritionInfo(foodName, grams) {
        if (this.isProcessing) {
            this.addMessage('⏳ 请等待上一个请求完成...', 'bot', 'info');
            return;
        }

        this.isProcessing = true;

        const systemPrompt = `你是一个营养学专家。请提供食物每100g的营养信息。

请严格按照以下JSON格式返回，不要有任何其他文字：
{
  "success": true,
  "food_name": "标准化的食物名称",
  "per_100g": {
    "calories": 热量数字,
    "protein": 蛋白质数字,
    "carbs": 碳水数字,
    "fat": 脂肪数字
  }
}

如果无法识别食物，返回：
{"success": false, "error": "原因"}

注意：只返回JSON，不要有其他文字`;

        try {
            const aiResponse = await this.callDeepSeekAPI(`请提供"${foodName}"的营养信息`, systemPrompt);
            
            // Parse AI response
            let result;
            try {
                let cleanResponse = aiResponse.trim();
                if (cleanResponse.startsWith('```json')) {
                    cleanResponse = cleanResponse.slice(7);
                }
                if (cleanResponse.startsWith('```')) {
                    cleanResponse = cleanResponse.slice(3);
                }
                if (cleanResponse.endsWith('```')) {
                    cleanResponse = cleanResponse.slice(0, -3);
                }
                result = JSON.parse(cleanResponse.trim());
            } catch (e) {
                this.addMessage('❌ AI返回格式错误，请重试', 'bot', 'error');
                this.isProcessing = false;
                return;
            }

            if (!result.success) {
                this.addMessage(`❌ ${result.error || '无法识别该食物'}`, 'bot', 'error');
                this.isProcessing = false;
                return;
            }

            // Calculate nutrition
            const nutrition = {
                name: result.food_name,
                grams: grams,
                calories: Math.round(result.per_100g.calories * grams / 100),
                protein: Math.round(result.per_100g.protein * grams / 100 * 10) / 10,
                carbs: Math.round(result.per_100g.carbs * grams / 100 * 10) / 10,
                fat: Math.round(result.per_100g.fat * grams / 100 * 10) / 10
            };

            // Save to storage
            Storage.addFood(this.currentDate, nutrition);

            // Update display
            this.loadDayData();
            this.updateCharts();

            // Show success message
            this.addMessage(
                `✅ <span class="ai-badge">AI</span> 已添加：<strong>${nutrition.name}</strong> ${grams}g<br>` +
                `🔥 ${nutrition.calories}kcal | ` +
                `🥩 ${nutrition.protein}g蛋白 | ` +
                `🍚 ${nutrition.carbs}g碳水 | ` +
                `🥑 ${nutrition.fat}g脂肪`,
                'bot', 'success'
            );
        } catch (error) {
            this.addMessage(`❌ AI服务暂时不可用，请稍后重试<br><small>${error.message}</small>`, 'bot', 'error');
        }

        this.isProcessing = false;
    },

    /**
     * Handle weight input
     * @param {string} message - User input
     */
    handleWeightInput(message) {
        // Parse weight value
        const regex = /体重\s*[:：]?\s*(\d+(?:\.\d+)?)\s*[kK]?[gG]?/;
        const match = message.match(regex);
        
        if (!match) {
            this.addMessage(
                '❌ 格式不正确，请使用：<code>体重 70.5</code>',
                'bot', 'error'
            );
            return;
        }
        
        const weight = parseFloat(match[1]);
        
        if (weight < 20 || weight > 300) {
            this.addMessage(
                '❌ 体重数值不合理，请输入20-300kg之间的数值',
                'bot', 'error'
            );
            return;
        }
        
        // Save weight record
        Storage.addWeightRecord(this.currentDate, weight);
        
        // Update charts
        this.updateCharts();
        
        // Get previous weight for comparison
        const weightRecords = Storage.getWeightRecords();
        let comparison = '';
        
        if (weightRecords.length >= 2) {
            const prevRecord = weightRecords[weightRecords.length - 2];
            const diff = weight - prevRecord.weight;
            if (diff > 0) {
                comparison = `<br>📈 较上次(${prevRecord.date})增加了 <strong>${diff.toFixed(1)}kg</strong>`;
            } else if (diff < 0) {
                comparison = `<br>📉 较上次(${prevRecord.date})减少了 <strong>${Math.abs(diff).toFixed(1)}kg</strong>`;
            } else {
                comparison = `<br>➡️ 与上次(${prevRecord.date})持平`;
            }
        }
        
        this.addMessage(
            `✅ 已记录体重：<strong>${weight}kg</strong> (${this.currentDate})${comparison}`,
            'bot', 'success'
        );
    },

    /**
     * Set day type
     * @param {string} type - 'training' or 'rest'
     */
    setDayType(type) {
        Storage.setDayType(this.currentDate, type);
        document.getElementById('dayType').value = type;
        this.updateCharts();
        
        const typeName = type === 'training' ? '力训日' : '休息日';
        this.addMessage(
            `✅ 已将今天设置为：<strong>${typeName}</strong>`,
            'bot', 'success'
        );
    },

    /**
     * Show daily summary
     */
    showSummary() {
        const dayData = Storage.getDietByDate(this.currentDate);
        const weightRecord = Storage.getWeightByDate(this.currentDate);
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
        
        if (dayData.foods.length === 0) {
            summaryHtml += '暂无记录';
        } else {
            summaryHtml += dayData.foods.map(f => `• ${f.name} ${f.grams}g`).join('<br>');
        }
        
        if (weightRecord) {
            summaryHtml += `<br><br><strong>今日体重：</strong>${weightRecord.weight} kg`;
        }
        
        this.addMessage(summaryHtml, 'bot', 'info');
    },

    /**
     * Show help message
     */
    showHelp() {
        this.addMessage(
            `<strong>📖 使用帮助</strong><br><br>
            <strong>记录食物：</strong><br>
            输入格式：<code>食物名称 克数</code><br>
            例如：鸡胸肉 150g、米饭 200<br>
            <small>💡 也可以自然语言输入，如"早上吃了两个鸡蛋"，AI会自动解析</small><br><br>
            <strong>记录体重：</strong><br>
            输入格式：<code>体重 数值</code><br>
            例如：体重 70.5<br><br>
            <strong>设置日期类型：</strong><br>
            输入"力训日"或"休息日"<br><br>
            <strong>查看汇总：</strong><br>
            输入"汇总"<br><br>
            <strong>清除聊天记录：</strong><br>
            输入"清除记录"<br><br>
            <strong>🤖 AI功能：</strong><br>
            当本地数据库没有食物时，会自动调用AI查询营养信息`,
            'bot', 'info'
        );
    },

    /**
     * Delete food item
     * @param {string} foodId - ID of food to delete
     */
    deleteFood(foodId) {
        Storage.removeFood(this.currentDate, foodId);
        this.loadDayData();
        this.updateCharts();
        this.addMessage('✅ 已删除该食物记录', 'bot', 'success');
    },

    /**
     * Initialize all charts
     */
    initCharts() {
        // Training day chart
        const trainingCtx = document.getElementById('trainingDayChart').getContext('2d');
        this.charts.training = new Chart(trainingCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '蛋白质 (g)',
                        data: [],
                        backgroundColor: 'rgba(233, 30, 99, 0.7)',
                        borderColor: 'rgba(233, 30, 99, 1)',
                        borderWidth: 1
                    },
                    {
                        label: '碳水 (g)',
                        data: [],
                        backgroundColor: 'rgba(255, 152, 0, 0.7)',
                        borderColor: 'rgba(255, 152, 0, 1)',
                        borderWidth: 1
                    },
                    {
                        label: '脂肪 (g)',
                        data: [],
                        backgroundColor: 'rgba(156, 39, 176, 0.7)',
                        borderColor: 'rgba(156, 39, 176, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });

        // Rest day chart
        const restCtx = document.getElementById('restDayChart').getContext('2d');
        this.charts.rest = new Chart(restCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '蛋白质 (g)',
                        data: [],
                        backgroundColor: 'rgba(233, 30, 99, 0.7)',
                        borderColor: 'rgba(233, 30, 99, 1)',
                        borderWidth: 1
                    },
                    {
                        label: '碳水 (g)',
                        data: [],
                        backgroundColor: 'rgba(255, 152, 0, 0.7)',
                        borderColor: 'rgba(255, 152, 0, 1)',
                        borderWidth: 1
                    },
                    {
                        label: '脂肪 (g)',
                        data: [],
                        backgroundColor: 'rgba(156, 39, 176, 0.7)',
                        borderColor: 'rgba(156, 39, 176, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });

        // Weight chart
        const weightCtx = document.getElementById('weightChart').getContext('2d');
        this.charts.weight = new Chart(weightCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '体重 (kg)',
                    data: [],
                    fill: true,
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    borderColor: 'rgba(33, 150, 243, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    pointBackgroundColor: 'rgba(33, 150, 243, 1)',
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
                    y: {
                        beginAtZero: false
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    },

    /**
     * Update all charts with latest data
     */
    updateCharts() {
        // Update training day chart
        const trainingRecords = Storage.getRecentDietRecords('training', 7);
        this.charts.training.data.labels = trainingRecords.map(r => r.date.slice(5));
        this.charts.training.data.datasets[0].data = trainingRecords.map(r => r.totals.protein);
        this.charts.training.data.datasets[1].data = trainingRecords.map(r => r.totals.carbs);
        this.charts.training.data.datasets[2].data = trainingRecords.map(r => r.totals.fat);
        this.charts.training.update();

        // Update rest day chart
        const restRecords = Storage.getRecentDietRecords('rest', 7);
        this.charts.rest.data.labels = restRecords.map(r => r.date.slice(5));
        this.charts.rest.data.datasets[0].data = restRecords.map(r => r.totals.protein);
        this.charts.rest.data.datasets[1].data = restRecords.map(r => r.totals.carbs);
        this.charts.rest.data.datasets[2].data = restRecords.map(r => r.totals.fat);
        this.charts.rest.update();

        // Update weight chart
        const weightRecords = Storage.getRecentWeightRecords(30);
        this.charts.weight.data.labels = weightRecords.map(r => r.date.slice(5));
        this.charts.weight.data.datasets[0].data = weightRecords.map(r => r.weight);
        this.charts.weight.update();
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
