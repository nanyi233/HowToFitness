/**
 * Home Module — AI Assistant hub
 * Unified chat interface that auto-detects diet vs training input
 */

const HomeModule = {
    currentDate: null,
    isProcessing: false,

    // Keywords for local classification
    TRAINING_KEYWORDS: [
        '卧推', '深蹲', '硬拉', '推举', '划船', '弯举', '飞鸟', '夹胸',
        '引体', '俯卧撑', '臂屈伸', '腿举', '腿弯', '腿屈伸', '小腿',
        '侧平举', '前平举', '耸肩', '下拉', '坐姿', '站姿', '绳索',
        'bench', 'squat', 'deadlift', 'press', 'curl', 'row', 'pullup',
        '组', '次', 'kg', 'rep', 'set', '自重',
        '练了', '练胸', '练背', '练腿', '练肩', '练臂', '练手',
        '有氧', '跑步', '跳绳', '椭圆', '游泳',
        '训练时长'
    ],
    FOOD_KEYWORDS: [
        '吃', '喝', '早餐', '午餐', '晚餐', '加餐', '零食', '夜宵',
        '鸡', '牛', '猪', '鱼', '虾', '蛋', '奶', '豆', '米', '面',
        '饭', '粥', '汤', '菜', '肉', '水果', '蔬菜', '沙拉',
        '咖啡', '牛奶', '酸奶', '果汁', '茶',
        '克', 'g', '两', '碗', '杯', '个', '片', '块', '根',
        '蛋白粉', '增肌粉', '燕麦', '香蕉', '苹果', '面包',
        '力训日', '休息日', '训练日'
    ],

    init() {
        this.currentDate = Utils.formatDate(new Date());
        this.setupEventListeners();
        this.updateHeaderDate();
        this.loadChatHistory();
        this.updateQuickStats();
    },

    destroy() {},

    updateHeaderDate() {
        const el = document.getElementById('homeHeaderDate');
        if (el) el.textContent = Utils.getDisplayDate(new Date());
    },

    setupEventListeners() {
        const chatInput = document.getElementById('homeChatInput');
        const sendBtn = document.getElementById('homeSendBtn');

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleUserInput();
            });
        }
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.handleUserInput());
        }
    },

    updateQuickStats() {
        const dietData = Storage.getDietByDate(this.currentDate);
        const trainingData = Storage.getTrainingByDate(this.currentDate);

        const calEl = document.getElementById('homeCalories');
        if (calEl) calEl.textContent = dietData.totals.calories || 0;

        const proteinEl = document.getElementById('homeProtein');
        if (proteinEl) proteinEl.textContent = dietData.totals.protein || 0;

        const exEl = document.getElementById('homeExercises');
        if (exEl) exEl.textContent = (trainingData.exercises || []).length;
    },

    // ==================== Smart Input Detection ====================

    /**
     * Detect if user input is about food, training, or unknown
     * @returns 'food' | 'training' | 'unknown'
     */
    detectInputType(message) {
        const lower = message.toLowerCase();

        // ---- Priority 1: Explicit training patterns ----
        // Has kg → almost always training context
        if (/\d+\s*[kK][gG]/.test(message)) return 'training';
        // Weight × sets pattern
        if (/\d+\s*[x×]\s*\d+/.test(message)) return 'training';
        // 自重 + sets
        if (/自重/.test(message)) return 'training';
        // 组 or 次 with numbers
        if (/\d+\s*组/.test(message) || /\d+\s*次/.test(message)) return 'training';

        // ---- Priority 2: Explicit food patterns ----
        // Has grams notation (but NOT preceded by 'k', to exclude 'kg')
        if (/\d+\s*[gG克]/.test(message) && !/[kK][gG]/.test(message)) {
            return 'food';
        }

        // ---- Priority 3: Keyword scoring ----
        let foodScore = 0;
        let trainingScore = 0;

        // Use word-boundary-aware matching to avoid partial matches
        this.FOOD_KEYWORDS.forEach(k => {
            const kl = k.toLowerCase();
            // Skip single-char 'g' — already handled by regex above
            if (kl === 'g') return;
            if (lower.includes(kl)) foodScore++;
        });
        this.TRAINING_KEYWORDS.forEach(k => {
            const kl = k.toLowerCase();
            // Skip 'kg' — already handled by regex above
            if (kl === 'kg') return;
            if (lower.includes(kl)) trainingScore++;
        });

        // Clear winner
        if (trainingScore > 0 && foodScore === 0) return 'training';
        if (foodScore > 0 && trainingScore === 0) return 'food';
        if (trainingScore >= foodScore + 1) return 'training';
        if (foodScore >= trainingScore + 1) return 'food';

        // Ambiguous
        return 'unknown';
    },
    // ==================== Chat Interface ====================

    handleUserInput() {
        const input = document.getElementById('homeChatInput');
        const message = input.value.trim();
        if (!message) return;
        this.addMessage(message, 'user');
        input.value = '';
        this.processMessage(message);
    },

    addMessage(content, type, status = '', saveToHistory = true) {
        const chatMessages = document.getElementById('homeChatMessages');
        if (!chatMessages) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message ${status}`;

        if (type === 'user') {
            messageDiv.innerHTML = `<div class="bubble">${content}</div>`;
        } else {
            const avatar = type === 'system' ? '📌' : '🤖';
            messageDiv.innerHTML = `
                <div class="bot-avatar">${avatar}</div>
                <div class="bubble">${content}</div>
            `;
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Save to unified chat history
        if (saveToHistory && type !== 'system') {
            Storage.addChatMessage({ content, type, status });
        }
    },

    loadChatHistory() {
        const chatMessages = document.getElementById('homeChatMessages');
        if (!chatMessages) return;

        // Keep only the welcome message
        const welcome = chatMessages.querySelector('.system-message');
        chatMessages.innerHTML = '';
        if (welcome) chatMessages.appendChild(welcome);

        const history = Storage.getRecentChatHistory(50);

        if (history.length === 0) return;

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

        // Special commands first
        if (lower.includes('体重')) { this.handleWeightInput(message); return; }
        if (lower === '汇总' || lower === '总结') { this.showSummary(); return; }
        if (lower === '帮助' || lower === 'help') { this.showHelp(); return; }
        if (lower === '清除记录' || lower === '清除聊天' || lower === '清空聊天') { this.clearChatHistory(); return; }
        if (lower === '力训日' || lower === '训练日') { this.setDayType('training'); return; }
        if (lower === '休息日') { this.setDayType('rest'); return; }

        // Duration command
        const durationMatch = message.match(/训练时长\s*[:：]?\s*(\d+)\s*(分钟|min|m)?/i);
        if (durationMatch) {
            this.setDuration(parseInt(durationMatch[1]));
            return;
        }

        // Auto-detect input type
        const inputType = this.detectInputType(message);

        if (inputType === 'food') {
            this.handleFoodInput(message);
        } else if (inputType === 'training') {
            // Try local training parse first
            const parsed = this.tryLocalTrainingParse(message);
            if (parsed) {
                this.addTrainingExercise(parsed);
            } else {
                this.handleAITrainingInput(message);
            }
        } else {
            // Unknown — let AI decide
            this.handleAISmartInput(message);
        }
    },

    // ==================== AI Smart Classification + Processing ====================

    async handleAISmartInput(message) {
        if (this.isProcessing) {
            this.addMessage('⏳ 请等待上一个请求完成...', 'bot', 'info');
            return;
        }
        this.isProcessing = true;
        this.addMessage('🤖 正在分析您的输入...', 'bot', 'info', false);

        const systemPrompt = `你是一个健身助手，负责记录用户的饮食和训练。
用户会输入一段话，你需要判断这是饮食记录还是训练记录，并解析出具体信息。

请严格按照以下JSON格式返回，不要有任何其他文字：

如果是饮食记录：
{
    "type": "food",
    "items": [
        {"food_name": "食物名称", "grams": 克数, "per_100g": {"calories": 热量, "protein": 蛋白质, "carbs": 碳水, "fat": 脂肪}}
    ]
}

如果是训练记录：
{
    "type": "training",
    "exercises": [
        {"name": "动作名称", "weight": 重量kg, "sets": 组数, "reps": 每组次数, "set_details": [{"weight": 重量, "reps": 次数}]}
    ],
    "duration": 训练时长(分钟,如没有则null)
}

如果无法判断：
{"type": "unknown", "error": "无法识别，请描述更具体"}

注意：
1. 如果用户没说克数，根据常识估算合理份量
2. 如果用户没说重量，根据动作合理估计或填0(自重)
3. set_details长度应等于组数
4. 只返回JSON`;

        try {
            const aiResponse = await API.callDeepSeek(message, systemPrompt, { maxTokens: 800 });
            const result = API.parseJSONResponse(aiResponse);

            if (result.type === 'food') {
                this.processAIFoodResult(result);
            } else if (result.type === 'training') {
                this.processAITrainingResult(result);
            } else {
                this.addMessage(`🤔 ${result.error || '无法判断输入类型，请尝试更具体的描述'}`, 'bot', 'error');
            }
        } catch (error) {
            this.addMessage(`❌ AI服务暂时不可用，请稍后重试<br><small>${error.message}</small>`, 'bot', 'error');
        }
        this.isProcessing = false;
    },

    processAIFoodResult(result) {
        const items = result.items || [];
        if (items.length === 0) {
            this.addMessage('❌ 未能识别到食物信息，请重新描述', 'bot', 'error');
            return;
        }

        let parts = [];
        items.forEach(item => {
            const nutrition = {
                name: item.food_name,
                grams: item.grams,
                calories: Math.round(item.per_100g.calories * item.grams / 100),
                protein: Math.round(item.per_100g.protein * item.grams / 100 * 10) / 10,
                carbs: Math.round(item.per_100g.carbs * item.grams / 100 * 10) / 10,
                fat: Math.round(item.per_100g.fat * item.grams / 100 * 10) / 10
            };
            Storage.addFood(this.currentDate, nutrition);
            parts.push(`• <strong>${nutrition.name}</strong> ${nutrition.grams}g — 🔥${nutrition.calories}kcal 🥩${nutrition.protein}g`);
        });

        this.updateQuickStats();
        this.addMessage(
            `✅ <span class="ai-badge">AI</span> 🍎 已记录 ${items.length} 项饮食：<br>` + parts.join('<br>'),
            'bot', 'success'
        );
    },

    processAITrainingResult(result) {
        const exercises = result.exercises || [];
        if (exercises.length === 0) {
            this.addMessage('❌ 未能识别到训练动作，请重新描述', 'bot', 'error');
            return;
        }

        if (result.duration) {
            Storage.setTrainingDuration(this.currentDate, result.duration);
        }

        let parts = [];
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
            Storage.addTrainingExercise(this.currentDate, exercise);
            const w = ex.weight > 0 ? `${ex.weight}kg` : '自重';
            parts.push(`• <strong>${ex.name}</strong> ${w} ${ex.sets}组×${ex.reps}次 (${volume}kg)`);
        });

        this.updateQuickStats();
        let msg = `✅ <span class="ai-badge">AI</span> 🏋️ 已记录 ${exercises.length} 个动作：<br>` + parts.join('<br>');
        if (result.duration) msg += `<br>⏱️ 训练时长：${result.duration}分钟`;
        this.addMessage(msg, 'bot', 'success');
    },

    // ==================== Food Input Processing ====================

    async handleFoodInput(message) {
        // Match "food name + grams" pattern, require explicit g/G/克 suffix to avoid matching kg numbers
        const regex = /(.+?)\s*(\d+(?:\.\d+)?)\s*[gG克]$/;
        const match = message.match(regex);

        if (!match) {
            // No simple pattern match, use AI
            await this.handleAIFoodInput(message);
            return;
        }

        const foodName = match[1].trim();
        const grams = parseFloat(match[2]);
        const foodData = searchFood(foodName);

        if (!foodData) {
            this.addMessage(`🤖 本地未找到"${foodName}"，正在使用AI查询...`, 'bot', 'info', false);
            await this.getAINutritionInfo(foodName, grams);
            return;
        }

        const nutrition = calculateNutrition(foodData, grams);
        Storage.addFood(this.currentDate, nutrition);
        this.updateQuickStats();

        this.addMessage(
            `✅ 🍎 已添加：<strong>${nutrition.name}</strong> ${grams}g<br>` +
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
        this.addMessage('🤖 正在使用AI分析饮食内容...', 'bot', 'info', false);

        const systemPrompt = `你是一个饮食记录助手。用户会输入他们吃的食物，你需要解析出食物名称和克数，并提供每100g的营养信息。
可能包含多种食物，请全部解析。
请严格按照以下JSON格式返回，不要有任何其他文字：
{"success": true, "items": [{"food_name": "食物名称", "grams": 数字, "per_100g": {"calories": 热量数字, "protein": 蛋白质数字, "carbs": 碳水数字, "fat": 脂肪数字}}]}
如果输入的不是食物而是训练/运动内容，返回：{"success": false, "is_training": true, "error": "这是训练内容"}
如果无法解析，返回：{"success": false, "error": "原因"}
注意：1. 如果用户没有说明克数，请根据常识估算合理的份量 2. 营养数据请尽量准确 3. 只返回JSON`;

        try {
            const aiResponse = await API.callDeepSeek(message, systemPrompt);
            const result = API.parseJSONResponse(aiResponse);

            if (!result.success) {
                // If AI says this is training content, redirect to training handler
                if (result.is_training) {
                    this.isProcessing = false;
                    this.handleAITrainingInput(message);
                    return;
                }
                this.addMessage(`❌ ${result.error || '无法解析您的输入'}`, 'bot', 'error');
                this.isProcessing = false;
                return;
            }

            const items = result.items || [];
            if (items.length === 0) {
                this.addMessage('❌ 未能识别到食物信息', 'bot', 'error');
                this.isProcessing = false;
                return;
            }

            let parts = [];
            items.forEach(item => {
                const nutrition = {
                    name: item.food_name,
                    grams: item.grams,
                    calories: Math.round(item.per_100g.calories * item.grams / 100),
                    protein: Math.round(item.per_100g.protein * item.grams / 100 * 10) / 10,
                    carbs: Math.round(item.per_100g.carbs * item.grams / 100 * 10) / 10,
                    fat: Math.round(item.per_100g.fat * item.grams / 100 * 10) / 10
                };
                Storage.addFood(this.currentDate, nutrition);
                parts.push(`• <strong>${nutrition.name}</strong> ${nutrition.grams}g — 🔥${nutrition.calories}kcal 🥩${nutrition.protein}g`);
            });

            this.updateQuickStats();
            this.addMessage(
                `✅ <span class="ai-badge">AI</span> 🍎 已记录 ${items.length} 项饮食：<br>` + parts.join('<br>'),
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

        const systemPrompt = `你是一个营养学专家。请提供食物每100g的营养信息。
请严格按照以下JSON格式返回：
{"success": true, "food_name": "标准化的食物名称", "per_100g": {"calories": 热量数字, "protein": 蛋白质数字, "carbs": 碳水数字, "fat": 脂肪数字}}
如果无法识别食物，返回：{"success": false, "error": "原因"}
注意：只返回JSON，不要有其他文字`;

        try {
            const aiResponse = await API.callDeepSeek(`请提供"${foodName}"的营养信息`, systemPrompt);
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

            Storage.addFood(this.currentDate, nutrition);
            this.updateQuickStats();

            this.addMessage(
                `✅ <span class="ai-badge">AI</span> 🍎 已添加：<strong>${nutrition.name}</strong> ${grams}g<br>` +
                `🔥 ${nutrition.calories}kcal · 🥩 ${nutrition.protein}g蛋白 · 🍚 ${nutrition.carbs}g碳水 · 🥑 ${nutrition.fat}g脂肪`,
                'bot', 'success'
            );
        } catch (error) {
            this.addMessage(`❌ AI服务暂时不可用，请稍后重试<br><small>${error.message}</small>`, 'bot', 'error');
        }
        this.isProcessing = false;
    },

    // ==================== Training Input Processing ====================

    tryLocalTrainingParse(message) {
        const patterns = [
            /^(.+?)\s+(\d+(?:\.\d+)?)\s*[kK][gG]\s+(\d+)\s*[组x×]\s*(\d+)\s*[个次reps]?$/,
            /^(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+)\s*[x×]\s*(\d+)$/,
            /^(.+?)\s+自重\s+(\d+)\s*[组x×]\s*(\d+)\s*[个次reps]?$/,
        ];

        for (let i = 0; i < patterns.length; i++) {
            const match = message.match(patterns[i]);
            if (match) {
                if (i === 2) {
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
            details.push({ weight, reps });
        }
        return details;
    },

    addTrainingExercise(parsed) {
        const volume = parsed.weight * parsed.sets * parsed.reps;
        const exercise = {
            name: parsed.name,
            weight: parsed.weight,
            sets: parsed.sets,
            reps: parsed.reps,
            volume: volume,
            setDetails: parsed.setDetails || []
        };

        Storage.addTrainingExercise(this.currentDate, exercise);
        this.updateQuickStats();

        const weightStr = parsed.weight > 0 ? `${parsed.weight}kg` : '自重';
        this.addMessage(
            `✅ 🏋️ 已添加：<strong>${parsed.name}</strong><br>` +
            `🏋️ ${weightStr} · ${parsed.sets}组×${parsed.reps}次 · 容量 ${volume}kg`,
            'bot', 'success'
        );
    },

    async handleAITrainingInput(message) {
        if (this.isProcessing) {
            this.addMessage('⏳ 请等待上一个请求完成...', 'bot', 'info');
            return;
        }
        this.isProcessing = true;
        this.addMessage('🤖 正在使用AI分析训练内容...', 'bot', 'info', false);

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
4. 常见动作名称请标准化
5. 只返回JSON`;

        try {
            const aiResponse = await API.callDeepSeek(message, systemPrompt, { maxTokens: 800 });
            const result = API.parseJSONResponse(aiResponse);

            if (!result.success) {
                this.addMessage(`❌ ${result.error || '无法解析您的训练内容'}`, 'bot', 'error');
                this.isProcessing = false;
                return;
            }

            this.processAITrainingResult(result);
        } catch (error) {
            this.addMessage(`❌ AI服务暂时不可用，请稍后重试<br><small>${error.message}</small>`, 'bot', 'error');
        }
        this.isProcessing = false;
    },

    // ==================== Commands ====================

    handleWeightInput(message) {
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

        Storage.addWeightRecord(this.currentDate, weight);

        const weightRecords = Storage.getWeightRecords();
        let comparison = '';
        if (weightRecords.length >= 2) {
            const prevRecord = weightRecords[weightRecords.length - 2];
            const diff = weight - prevRecord.weight;
            if (diff > 0) comparison = `<br>📈 较上次(${prevRecord.date})增加了 <strong>${diff.toFixed(1)}kg</strong>`;
            else if (diff < 0) comparison = `<br>📉 较上次(${prevRecord.date})减少了 <strong>${Math.abs(diff).toFixed(1)}kg</strong>`;
            else comparison = `<br>➡️ 与上次(${prevRecord.date})持平`;
        }

        this.addMessage(`✅ ⚖️ 已记录体重：<strong>${weight}kg</strong> (${this.currentDate})${comparison}`, 'bot', 'success');
    },

    setDayType(type) {
        Storage.setDayType(this.currentDate, type);
        const typeName = type === 'training' ? '力训日' : '休息日';
        this.addMessage(`✅ 已将今天设置为：<strong>${typeName}</strong>`, 'bot', 'success');
    },

    setDuration(minutes) {
        if (minutes < 1 || minutes > 600) {
            this.addMessage('❌ 训练时长不合理，请输入1-600分钟之间的数值', 'bot', 'error');
            return;
        }
        Storage.setTrainingDuration(this.currentDate, minutes);
        this.addMessage(`✅ 已记录训练时长：<strong>${minutes}分钟</strong>`, 'bot', 'success');
    },

    showSummary() {
        const dietData = Storage.getDietByDate(this.currentDate);
        const trainingData = Storage.getTrainingByDate(this.currentDate);
        const weightRecord = Storage.getWeightByDate(this.currentDate);
        const dayTypeName = dietData.dayType === 'training' ? '力训日' : '休息日';

        let html = `<strong>📊 ${this.currentDate} 今日汇总</strong><br>`;
        html += `<strong>类型：</strong>${dayTypeName}<br><br>`;

        // Diet summary
        html += `<strong>🍎 饮食摄入：</strong><br>`;
        html += `🔥 热量：${dietData.totals.calories} kcal<br>`;
        html += `🥩 蛋白质：${dietData.totals.protein} g<br>`;
        html += `🍚 碳水：${dietData.totals.carbs} g<br>`;
        html += `🥑 脂肪：${dietData.totals.fat} g<br>`;
        if (dietData.foods.length > 0) {
            html += `食物：${dietData.foods.map(f => `${f.name} ${f.grams}g`).join('、')}<br>`;
        }

        // Training summary
        const exercises = trainingData.exercises || [];
        if (exercises.length > 0) {
            let totalVolume = 0;
            exercises.forEach(ex => totalVolume += ex.volume || 0);
            html += `<br><strong>🏋️ 训练记录：</strong><br>`;
            html += `动作数：${exercises.length} · 总容量：${totalVolume}kg<br>`;
            if (trainingData.duration) html += `训练时长：${trainingData.duration}分钟<br>`;
            html += exercises.map(ex => {
                const w = ex.weight > 0 ? `${ex.weight}kg` : '自重';
                return `• ${ex.name} ${w} ${ex.sets}组×${ex.reps}次`;
            }).join('<br>');
        } else {
            html += `<br><strong>🏋️ 训练记录：</strong>暂无`;
        }

        if (weightRecord) html += `<br><br><strong>⚖️ 今日体重：</strong>${weightRecord.weight} kg`;

        this.addMessage(html, 'bot', 'info');
    },

    showHelp() {
        this.addMessage(
            `<strong>📖 使用帮助</strong><br><br>
            直接输入内容，AI会自动识别类型：<br><br>
            <strong>🍎 饮食记录：</strong><br>
            <code>鸡胸肉 150g</code> 或 "早上吃了两个鸡蛋和一碗燕麦"<br><br>
            <strong>🏋️ 训练记录：</strong><br>
            <code>卧推 60kg 4组8个</code> 或 "今天练了胸，卧推60做了4组8个"<br><br>
            <strong>通用命令：</strong><br>
            ⚖️ 体重：<code>体重 70.5</code><br>
            📊 汇总：<code>汇总</code><br>
            ⏱️ 时长：<code>训练时长 60分钟</code><br>
            🗑️ 清除：<code>清除记录</code>`,
            'bot', 'info'
        );
    },

    clearChatHistory() {
        Storage.clearChatHistory();
        Storage.clearTrainingChatHistory();
        const chatMessages = document.getElementById('homeChatMessages');
        if (!chatMessages) return;
        const welcomeMessage = chatMessages.querySelector('.system-message');
        chatMessages.innerHTML = '';
        if (welcomeMessage) chatMessages.appendChild(welcomeMessage);
        this.addMessage('✅ 聊天记录已清除', 'bot', 'success', false);
    }
};

window.HomeModule = HomeModule;
