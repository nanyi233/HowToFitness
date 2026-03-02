/**
 * Profile Module — includes Weight Tracking, Aerobic Calculator, Fat Loss Plan
 * Business logic (aerobic data, plan calculation) now served by backend API.
 */

// Cached exercise categories from backend
let _exerciseCategories = null;

const FOOD_EQUIVALENTS = [    { name: "熟米饭", amount: 80, unit: "g", icon: "🍚" },
    { name: "瘦熟肉", amount: 80, unit: "g", icon: "🥩" },
    { name: "苹果/香蕉", amount: 1, unit: "个", icon: "🍎" },
    { name: "鸡蛋", amount: 1.5, unit: "个", icon: "🥚" },
    { name: "全脂牛奶", amount: 200, unit: "ml", icon: "🥛" },
    { name: "坚果", amount: 20, unit: "g", icon: "🥜" }
];

const ProfileModule = {
    weightChart: null,
    weightSectionOpen: false,
    aerobicSectionOpen: false,
    planSectionOpen: false,
    planResults: {},

    init() {
        this.updateProfileStats();
        this.updateAuthUI();
        this.initAerobicForm();
        this.initPlanForm();
    },

    destroy() {
        if (this.weightChart) {
            this.weightChart.destroy();
            this.weightChart = null;
        }
        this.weightSectionOpen = false;
        this.aerobicSectionOpen = false;
        this.planSectionOpen = false;
    },

    async updateProfileStats() {
        // Streak
        const records = await Storage.getDietRecords();
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
        const weightRecords = await Storage.getWeightRecords();
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
            const h = 1.75;
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

    async initWeightChart() {
        const ctx = document.getElementById('profileWeightChart')?.getContext('2d');
        if (!ctx) return;

        if (this.weightChart) {
            this.weightChart.destroy();
        }

        const chartTooltip = {
            backgroundColor: '#fff', titleColor: '#1a2332', bodyColor: '#6b7b8d',
            borderColor: '#e8ecf0', borderWidth: 1, cornerRadius: 8, padding: 10
        };
        const gridOpts = { color: 'rgba(0,0,0,0.04)' };

        const weightRecords = await Storage.getRecentWeightRecords(30);

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

    async renderWeightRecords() {
        const container = document.getElementById('profileWeightRecords');
        if (!container) return;

        const records = await Storage.getRecentWeightRecords(10);
        if (records.length === 0) {
            container.innerHTML = '<p class="empty-message" style="margin-top:8px;">暂无体重记录</p>';
            return;
        }

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

    async addWeight() {
        const input = document.getElementById('profileWeightInput');
        if (!input) return;

        const weight = parseFloat(input.value);
        if (isNaN(weight) || weight < 20 || weight > 300) {
            alert('请输入20-300之间的有效体重数值');
            return;
        }

        const today = Utils.formatDate(new Date());
        await Storage.addWeightRecord(today, weight);

        input.value = '';
        await this.updateProfileStats();
        await this.initWeightChart();
        await this.renderWeightRecords();
    },

    // ==================== Aerobic Calculator ====================

    toggleAerobicCalc() {
        const section = document.getElementById('aerobicSection');
        const arrow = document.getElementById('aerobicArrow');
        if (!section) return;

        this.aerobicSectionOpen = !this.aerobicSectionOpen;
        section.classList.toggle('hidden', !this.aerobicSectionOpen);
        if (arrow) arrow.textContent = this.aerobicSectionOpen ? '⌄' : '›';

        if (this.aerobicSectionOpen) {
            this.populateCategories();
            this.loadAerobicData();
        }
    },

    initAerobicForm() {
        // Will be fully initialized when section is opened
    },

    async populateCategories() {
        const categorySelect = document.getElementById('exerciseCategory');
        if (!categorySelect || categorySelect.options.length > 1) return;

        // Fetch categories from backend
        if (!_exerciseCategories) {
            try {
                _exerciseCategories = await API.getExerciseCategories();
            } catch (e) {
                console.error('Failed to load exercise categories:', e);
                _exerciseCategories = [];
            }
        }

        categorySelect.innerHTML = '<option value="">请选择运动类型</option>';
        _exerciseCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = `${cat.icon} ${cat.name}`;
            categorySelect.appendChild(option);
        });

        categorySelect.addEventListener('change', (e) => {
            this.populateLevels(e.target.value);
            this.saveAerobicData();
        });

        const form = document.getElementById('aerobicForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.calculateAerobic();
            });
        }

        const inputs = document.querySelectorAll('#aerobicForm input, #aerobicForm select');
        inputs.forEach(input => {
            input.addEventListener('change', () => this.saveAerobicData());
        });
    },

    populateLevels(category) {
        const levelSelect = document.getElementById('exerciseLevel');
        if (!levelSelect) return;
        if (!category || !_exerciseCategories) {
            levelSelect.innerHTML = '<option value="">请先选择运动类型</option>';
            levelSelect.disabled = true;
            return;
        }
        const cat = _exerciseCategories.find(c => c.name === category);
        if (!cat) {
            levelSelect.innerHTML = '<option value="">请先选择运动类型</option>';
            levelSelect.disabled = true;
            return;
        }
        levelSelect.innerHTML = '<option value="">请选择强度/速度</option>';
        cat.levels.forEach((level, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = level.name + (level.note ? ` (${level.note})` : '');
            levelSelect.appendChild(option);
        });
        levelSelect.disabled = false;
    },

    async calculateAerobic() {
        const weight = parseFloat(document.getElementById('aeroWeight')?.value);
        const category = document.getElementById('exerciseCategory')?.value;
        const levelIndex = document.getElementById('exerciseLevel')?.value;
        const hours = parseInt(document.getElementById('durationHours')?.value) || 0;
        const minutes = parseInt(document.getElementById('durationMinutes')?.value) || 0;
        const frequency = parseInt(document.getElementById('frequency')?.value);

        if (!weight || !category || levelIndex === '') {
            alert('请填写所有必填项');
            return;
        }

        try {
            const results = await API.calculateAerobic({
                weight_kg: weight,
                category: category,
                level_index: parseInt(levelIndex),
                hours: hours,
                minutes: minutes,
                frequency: frequency
            });
            this.displayAerobicResults(results);
            this.saveAerobicData();
        } catch (e) {
            alert('计算失败：' + e.message);
        }
    },

    displayAerobicResults(results) {
        const card = document.getElementById('aeroResultCard');
        if (card) card.style.display = 'block';

        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setEl('hourlyCalories', results.hourly_calories || results.hourlyCalories);
        setEl('singleCalories', results.single_calories || results.singleCalories);
        setEl('weeklyCalories', results.weekly_calories || results.weeklyCalories);
        setEl('dailyAvgCalories', results.daily_avg_calories || results.dailyAvgCalories);
        setEl('planValue', results.daily_avg_calories || results.dailyAvgCalories);

        const foodGrid = document.getElementById('foodEquivalent');
        if (foodGrid) {
            const dailyAvg = results.daily_avg_calories || results.dailyAvgCalories;
            const multiplier = dailyAvg / 100;
            foodGrid.innerHTML = FOOD_EQUIVALENTS.map(food => {
                const amount = Math.round(food.amount * multiplier * 10) / 10;
                return `<div class="food-equiv-item"><span>${food.icon}</span><span class="amount">${amount}${food.unit}</span><span>${food.name}</span></div>`;
            }).join('');
        }
    },

    saveAerobicData() {
        const data = {
            weight: document.getElementById('aeroWeight')?.value,
            category: document.getElementById('exerciseCategory')?.value,
            level: document.getElementById('exerciseLevel')?.value,
            hours: document.getElementById('durationHours')?.value,
            minutes: document.getElementById('durationMinutes')?.value,
            frequency: document.getElementById('frequency')?.value
        };
        Storage.saveAerobicData(data);
    },

    loadAerobicData() {
        const data = Storage.getAerobicData();
        if (!data) return;
        try {
            if (data.weight) { const el = document.getElementById('aeroWeight'); if (el) el.value = data.weight; }
            if (data.category) {
                const el = document.getElementById('exerciseCategory'); if (el) el.value = data.category;
                this.populateLevels(data.category);
                if (data.level) { const lvl = document.getElementById('exerciseLevel'); if (lvl) lvl.value = data.level; }
            }
            if (data.hours) { const el = document.getElementById('durationHours'); if (el) el.value = data.hours; }
            if (data.minutes) { const el = document.getElementById('durationMinutes'); if (el) el.value = data.minutes; }
            if (data.frequency) { const el = document.getElementById('frequency'); if (el) el.value = data.frequency; }
        } catch (e) { console.error('Error loading aerobic data:', e); }
    },

    // ==================== Fat Loss Plan Calculator ====================

    togglePlanCalc() {
        const section = document.getElementById('planSection');
        const arrow = document.getElementById('planArrow');
        if (!section) return;

        this.planSectionOpen = !this.planSectionOpen;
        section.classList.toggle('hidden', !this.planSectionOpen);
        if (arrow) arrow.textContent = this.planSectionOpen ? '⌄' : '›';

        if (this.planSectionOpen) {
            this.setupPlanListeners();
            this.loadPlanData();
        }
    },

    initPlanForm() {
        // Will be fully initialized when section is opened
    },

    setupPlanListeners() {
        const form = document.getElementById('basicInfoForm');
        if (form && !form._listenerAttached) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.calculatePlan();
            });
            form._listenerAttached = true;
        }

        const inputs = document.querySelectorAll('#basicInfoForm input, #basicInfoForm select');
        inputs.forEach(input => {
            if (!input._listenerAttached) {
                input.addEventListener('change', () => this.savePlanData());
                input._listenerAttached = true;
            }
        });
    },

    loadPlanData() {
        const data = Storage.getPlanData();
        if (!data) return;
        try {
            if (data.gender) { const el = document.getElementById('planGender'); if (el) el.value = data.gender; }
            if (data.height) { const el = document.getElementById('planHeight'); if (el) el.value = data.height; }
            if (data.weight) { const el = document.getElementById('planWeight'); if (el) el.value = data.weight; }
            if (data.age) { const el = document.getElementById('planAge'); if (el) el.value = data.age; }
            if (data.trainingLevel) { const el = document.getElementById('trainingLevel'); if (el) el.value = data.trainingLevel; }
            if (data.aerobicCalories) { const el = document.getElementById('aerobicCalories'); if (el) el.value = data.aerobicCalories; }
        } catch (e) { console.error('Error loading plan data:', e); }
    },

    savePlanData() {
        const data = {
            gender: document.getElementById('planGender')?.value || '',
            height: parseFloat(document.getElementById('planHeight')?.value) || 0,
            weight: parseFloat(document.getElementById('planWeight')?.value) || 0,
            age: parseInt(document.getElementById('planAge')?.value) || 0,
            trainingLevel: document.getElementById('trainingLevel')?.value || '',
            aerobicCalories: parseFloat(document.getElementById('aerobicCalories')?.value) || 0
        };
        Storage.savePlanData(data);
    },

    async calculatePlan() {
        this.savePlanData();
        const gender = document.getElementById('planGender')?.value;
        const height = parseFloat(document.getElementById('planHeight')?.value) || 0;
        const weight = parseFloat(document.getElementById('planWeight')?.value) || 0;
        const age = parseInt(document.getElementById('planAge')?.value) || 0;
        const trainingLevel = document.getElementById('trainingLevel')?.value;
        const aerobicCalories = parseFloat(document.getElementById('aerobicCalories')?.value) || 0;

        if (!gender || !height || !weight || !age || !trainingLevel) {
            alert('请填写所有必填项');
            return;
        }

        try {
            const result = await API.calculatePlan({
                gender,
                height_cm: height,
                weight_kg: weight,
                age,
                training_level: trainingLevel,
                aerobic_calories: aerobicCalories
            });
            this.planResults = result;
            this.displayPlanResults();
        } catch (e) {
            alert('计算失败：' + e.message);
        }
    },

    displayPlanResults() {
        const card = document.getElementById('planResultCard');
        if (card) card.style.display = 'block';

        const r = this.planResults;
        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

        const bmiEl = document.getElementById('resultBMI');
        const bmiStatusEl = document.getElementById('bmiStatus');
        if (bmiEl) bmiEl.textContent = typeof r.bmi === 'number' ? r.bmi.toFixed ? r.bmi.toFixed(1) : r.bmi : r.bmi;
        if (bmiStatusEl) {
            const bmiVal = parseFloat(r.bmi);
            let status = '', cls = 'normal';
            if (bmiVal < 18.5) { status = '偏瘦'; cls = 'warning'; }
            else if (bmiVal < 24) { status = '正常'; cls = 'normal'; }
            else if (bmiVal < 28) { status = '超重'; cls = 'warning'; }
            else { status = '肥胖'; cls = 'danger'; }
            bmiStatusEl.textContent = status;
            bmiStatusEl.className = `status ${cls}`;
        }

        setEl('resultBMR', r.bmr);
        setEl('resultTDEE', r.tdee);
        setEl('resultTraining', r.training_calories || r.trainingCalories);
        setEl('balanceTraining', (r.balance_training || r.balanceTraining) + ' 大卡');
        setEl('balanceRest', (r.balance_rest || r.balanceRest) + ' 大卡');
        setEl('intakeTraining', (r.intake_training || r.intakeTraining) + ' 大卡');
        setEl('intakeRest', (r.intake_rest || r.intakeRest) + ' 大卡');
        setEl('carbTraining', (r.carb_training || r.carbTraining) + 'g');
        setEl('carbRest', (r.carb_rest || r.carbRest) + 'g');
        setEl('proteinTraining', (r.protein) + 'g');
        setEl('proteinRest', (r.protein) + 'g');
        setEl('fatTraining', r.fat + 'g');
        setEl('fatRest', r.fat + 'g');
    },

    toggleMealPlan() {
        const card = document.getElementById('mealPlanCard');
        if (!card) return;
        card.style.display = card.style.display === 'none' ? 'block' : 'none';
        if (card.style.display === 'block') {
            this.generateMealPlan();
        }
    },

    generateMealPlan() {
        const carbTraining = this.planResults.carb_training || this.planResults.carbTraining;
        const carbRest = this.planResults.carb_rest || this.planResults.carbRest;
        const protein = this.planResults.protein;
        if (!carbTraining) return;

        const trainingMeals = [
            { name: '①早饭=练前餐', carbPercent: 15, proteinPercent: 20, note: '吃完就开始力训' },
            { name: '②练后餐', carbPercent: 35, proteinPercent: 20, note: '练完30分钟内吃' },
            { name: '③午饭', carbPercent: 20, proteinPercent: 20, note: '可少吃' },
            { name: '④晚饭', carbPercent: 20, proteinPercent: 20, note: '正常饮食' },
            { name: '⑤零食/夜宵', carbPercent: 10, proteinPercent: 20, note: '不吃糖油混合物' }
        ];

        const restMeals = [
            { name: '①早饭', carbPercent: 15, proteinPercent: 20, note: '与力训日早饭相同' },
            { name: '②午饭', carbPercent: 35, proteinPercent: 30, note: '正常饮食' },
            { name: '③晚饭', carbPercent: 40, proteinPercent: 30, note: '正常饮食' },
            { name: '④零食/夜宵', carbPercent: 10, proteinPercent: 20, note: '不吃糖油混合物' }
        ];

        const renderTable = (meals, totalCarb, totalProtein, tableId) => {
            const tbody = document.getElementById(tableId);
            if (!tbody) return;
            tbody.innerHTML = meals.map(m => `
                <tr>
                    <td><strong>${m.name}</strong></td>
                    <td><span class="value">${Math.round(totalCarb * m.carbPercent / 100)}</span> (${m.carbPercent}%)</td>
                    <td><span class="value">${Math.round(totalProtein * m.proteinPercent / 100)}</span> (${m.proteinPercent}%)</td>
                    <td><small>${m.note}</small></td>
                </tr>
            `).join('') + `
                <tr style="background: rgba(46,204,113,0.06); font-weight: bold;">
                    <td>合计</td>
                    <td><span class="value">${Math.round(totalCarb)}</span>g</td>
                    <td><span class="value">${Math.round(totalProtein)}</span>g</td>
                    <td></td>
                </tr>
            `;
        };

        renderTable(trainingMeals, carbTraining, protein, 'trainingMealTable');
        renderTable(restMeals, carbRest, protein, 'restMealTable');
    },

    // ==================== Utilities ====================

    showHelp() {
        alert('📖 使用帮助\n\n在首页"焚决"页面输入食物或训练信息来记录。\n\n饮食模式：输入 鸡胸肉 150g\n训练模式：输入 卧推 60kg 4组8个\n\n也可以用自然语言输入，AI会自动解析。');
    },

    clearChatHistory() {
        if (confirm('确定要清除所有聊天记录吗？')) {
            Storage.clearChatHistory();
            Storage.clearTrainingChatHistory();
            alert('✅ 聊天记录已清除');
        }
    },

    // ==================== Auth UI ====================

    updateAuthUI() {
        const nameEl = document.getElementById('profileDisplayName');
        const badgeEl = document.getElementById('profileModeBadge');
        const authIcon = document.getElementById('authMenuIcon');
        const authText = document.getElementById('authMenuText');

        if (Storage.isLoggedIn()) {
            // Extract username from JWT token
            let username = 'User';
            try {
                const payload = JSON.parse(atob(Storage.token.split('.')[1]));
                username = payload.username || 'User';
            } catch (e) { /* ignore */ }

            if (nameEl) nameEl.textContent = username;
            if (badgeEl) {
                badgeEl.textContent = '☁️ 云端同步';
                badgeEl.style.background = 'rgba(0,188,212,0.12)';
                badgeEl.style.color = 'var(--accent)';
            }
            if (authIcon) authIcon.textContent = '🚪';
            if (authText) authText.textContent = '退出登录';
        } else {
            const isLocalMode = localStorage.getItem('htf_local_mode') === 'true';
            if (nameEl) nameEl.textContent = 'HowToFitness';
            if (badgeEl) {
                badgeEl.textContent = '📱 本地模式';
                badgeEl.style.background = '';
                badgeEl.style.color = '';
            }
            if (authIcon) authIcon.textContent = '🔓';
            if (authText) authText.textContent = '登录 / 注册（开启云同步）';
        }
    },

    handleAuthAction() {
        if (Storage.isLoggedIn()) {
            // Confirm logout
            if (confirm('确定要退出登录吗？\n退出后将切换为本地模式。')) {
                Storage.logout();
                // EventBus 'auth:logout' will trigger AppRouter.onAuthLogout()
            }
        } else {
            // Go to auth page: clear local mode flag and trigger auth flow
            localStorage.removeItem('htf_local_mode');
            window.EventBus && EventBus.emit('auth:logout');
        }
    }
};

window.ProfileModule = ProfileModule;
