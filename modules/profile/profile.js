/**
 * Profile Module — includes Weight Tracking, Aerobic Calculator, Fat Loss Plan
 */

// ==================== Aerobic Exercise Data ====================
const EXERCISE_DATA = {
    "平地走": { icon: "🚶", levels: [{ name: "每走一万步", perKg: 3.8, note: "约1小时" }, { name: "每走一小时", perKg: 3.8, note: "" }] },
    "爬坡走": { icon: "⛰️", levels: [{ name: "坡度5°（一般选择）", perKg: 5.5, note: "" }, { name: "坡度10°（很累）", perKg: 8.0, note: "" }] },
    "跑步": { icon: "🏃", levels: [{ name: "速度6km/h", perKg: 5.5, note: "慢跑" }, { name: "速度7km/h", perKg: 7.2, note: "" }, { name: "速度8km/h", perKg: 9.5, note: "" }, { name: "速度9km/h", perKg: 9.6, note: "" }, { name: "速度10km/h", perKg: 9.8, note: "" }, { name: "速度12km/h", perKg: 10.1, note: "" }, { name: "速度13km/h", perKg: 10.1, note: "" }, { name: "速度14km/h", perKg: 10.4, note: "" }, { name: "速度15km/h", perKg: 10.9, note: "" }, { name: "速度16km/h", perKg: 12.7, note: "快跑" }] },
    "户外骑行": { icon: "🚴", levels: [{ name: "速度10km/h", perKg: 3.6, note: "通勤" }, { name: "速度12km/h", perKg: 3.9, note: "通勤" }, { name: "速度13km/h", perKg: 4.4, note: "通勤" }, { name: "速度15km/h", perKg: 5.5, note: "通勤" }, { name: "速度18km/h", perKg: 6.5, note: "通勤" }, { name: "速度27km/h", perKg: 7.5, note: "专业" }, { name: "速度31km/h", perKg: 10.0, note: "专业" }, { name: "速度34km/h", perKg: 12.0, note: "专业" }] },
    "室内单车": { icon: "🚲", levels: [{ name: "功率50-90W", perKg: 4.8, note: "轻松" }, { name: "功率90-100W", perKg: 6.8, note: "" }, { name: "功率100-160W", perKg: 8.8, note: "" }, { name: "功率160-200W", perKg: 11.0, note: "" }, { name: "功率200-270W", perKg: 14.0, note: "剧烈" }] },
    "游泳": { icon: "🏊", levels: [{ name: "速度1km/h", perKg: 4.2, note: "休闲" }, { name: "速度2km/h", perKg: 7.7, note: "" }, { name: "速度3km/h", perKg: 9.2, note: "快速" }] },
    "球类运动": { icon: "⚽", levels: [{ name: "篮球", perKg: 6.1, note: "" }, { name: "足球", perKg: 7.0, note: "" }, { name: "排球", perKg: 4.1, note: "" }, { name: "网球", perKg: 8.9, note: "" }, { name: "乒乓球", perKg: 6.6, note: "" }, { name: "羽毛球", perKg: 7.4, note: "" }] },
    "跳操跟练": { icon: "💃", levels: [{ name: "轻松强度", perKg: 2.3, note: "" }, { name: "中等强度", perKg: 4.0, note: "" }, { name: "剧烈强度", perKg: 6.0, note: "" }] },
    "室内其他": { icon: "🧘", levels: [{ name: "瑜伽", perKg: 3.1, note: "" }, { name: "舞蹈", perKg: 5.0, note: "" }, { name: "椭圆仪", perKg: 5.0, note: "" }, { name: "普拉提", perKg: 3.0, note: "" }, { name: "健身环", perKg: 5.0, note: "" }] },
    "爬楼": { icon: "🪜", levels: [{ name: "上楼", perKg: 8.0, note: "90步/分钟" }, { name: "下楼", perKg: 3.1, note: "" }] },
    "划船机": { icon: "🚣", levels: [{ name: "功率100W", perKg: 7.0, note: "" }, { name: "功率150W", perKg: 8.5, note: "" }, { name: "功率200W", perKg: 12.0, note: "" }] },
    "拳击": { icon: "🥊", levels: [{ name: "打沙袋", perKg: 5.5, note: "" }, { name: "真人格斗", perKg: 7.8, note: "" }] },
    "跳绳": { icon: "🪢", levels: [{ name: "<100次/分钟", perKg: 8.8, note: "慢速" }, { name: "100-120次/分钟", perKg: 11.8, note: "" }, { name: "120-160次/分钟", perKg: 12.3, note: "快速" }] }
};

const FOOD_EQUIVALENTS = [
    { name: "熟米饭", amount: 80, unit: "g", icon: "🍚" },
    { name: "瘦熟肉", amount: 80, unit: "g", icon: "🥩" },
    { name: "苹果/香蕉", amount: 1, unit: "个", icon: "🍎" },
    { name: "鸡蛋", amount: 1.5, unit: "个", icon: "🥚" },
    { name: "全脂牛奶", amount: 200, unit: "ml", icon: "🥛" },
    { name: "坚果", amount: 20, unit: "g", icon: "🥜" }
];

function calculateAerobicCalories(weight, perKg) {
    let baseCalories = weight * perKg;
    if (weight > 80) {
        const excessWeight = weight - 80;
        const reductionSteps = Math.floor(excessWeight / 5);
        const reductionFactor = Math.pow(0.97, reductionSteps);
        baseCalories = baseCalories * reductionFactor;
    }
    return Math.round(baseCalories);
}

const ProfileModule = {
    weightChart: null,
    weightSectionOpen: false,
    aerobicSectionOpen: false,
    planSectionOpen: false,
    planResults: {},

    init() {
        this.updateProfileStats();
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

    populateCategories() {
        const categorySelect = document.getElementById('exerciseCategory');
        if (!categorySelect || categorySelect.options.length > 1) return;
        categorySelect.innerHTML = '<option value="">请选择运动类型</option>';
        for (const [category, data] of Object.entries(EXERCISE_DATA)) {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = `${data.icon} ${category}`;
            categorySelect.appendChild(option);
        }

        // Attach event listeners
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
        if (!category || !EXERCISE_DATA[category]) {
            levelSelect.innerHTML = '<option value="">请先选择运动类型</option>';
            levelSelect.disabled = true;
            return;
        }
        const data = EXERCISE_DATA[category];
        levelSelect.innerHTML = '<option value="">请选择强度/速度</option>';
        data.levels.forEach((level, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = level.name + (level.note ? ` (${level.note})` : '');
            levelSelect.appendChild(option);
        });
        levelSelect.disabled = false;
    },

    calculateAerobic() {
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

        const level = EXERCISE_DATA[category].levels[levelIndex];
        const totalHours = hours + minutes / 60;

        const hourlyCalories = calculateAerobicCalories(weight, level.perKg);
        const singleCalories = Math.round(hourlyCalories * totalHours);
        const weeklyCalories = singleCalories * frequency;
        const dailyAvgCalories = Math.round(weeklyCalories / 7);

        this.displayAerobicResults({ hourlyCalories, singleCalories, weeklyCalories, dailyAvgCalories });
        this.saveAerobicData();
    },

    displayAerobicResults(results) {
        const card = document.getElementById('aeroResultCard');
        if (card) card.style.display = 'block';

        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setEl('hourlyCalories', results.hourlyCalories);
        setEl('singleCalories', results.singleCalories);
        setEl('weeklyCalories', results.weeklyCalories);
        setEl('dailyAvgCalories', results.dailyAvgCalories);
        setEl('planValue', results.dailyAvgCalories);

        const foodGrid = document.getElementById('foodEquivalent');
        if (foodGrid) {
            const multiplier = results.dailyAvgCalories / 100;
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

    calculatePlan() {
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

        const heightM = height / 100;
        const bmi = weight / (heightM * heightM);

        let bmr;
        if (gender === 'male') {
            bmr = weight * 9.99 + height * 6.25 - age * 4.92 + 5;
        } else {
            bmr = weight * 9.99 + height * 6.25 - age * 4.92 - 161;
        }

        const tdee = bmr / 0.7;

        const trainingCaloriesMap = {
            male: { beginner: 150, intermediate: 200, advanced: 250 },
            female: { beginner: 100, intermediate: 150, advanced: 200 }
        };
        const trainingCalories = trainingCaloriesMap[gender][trainingLevel];

        const balanceTraining = tdee + trainingCalories + aerobicCalories;
        const balanceRest = tdee + aerobicCalories;
        const intakeTraining = balanceTraining * 0.64;
        const intakeRest = balanceRest * 0.64;

        const carbTraining = weight * 2.6;
        const carbRest = weight * 2.1;
        const protein = weight * 1.4;
        const fat = gender === 'male' ? (weight >= 120 ? 70 : 60) : 50;

        this.planResults = { bmi, bmr, tdee, trainingCalories, balanceTraining, balanceRest, intakeTraining, intakeRest, carbTraining, carbRest, protein, fat };
        this.displayPlanResults();
    },

    displayPlanResults() {
        const card = document.getElementById('planResultCard');
        if (card) card.style.display = 'block';

        const r = this.planResults;
        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

        // BMI
        const bmiEl = document.getElementById('resultBMI');
        const bmiStatusEl = document.getElementById('bmiStatus');
        if (bmiEl) bmiEl.textContent = r.bmi.toFixed(1);
        if (bmiStatusEl) {
            let status = '', cls = 'normal';
            if (r.bmi < 18.5) { status = '偏瘦'; cls = 'warning'; }
            else if (r.bmi < 24) { status = '正常'; cls = 'normal'; }
            else if (r.bmi < 28) { status = '超重'; cls = 'warning'; }
            else { status = '肥胖'; cls = 'danger'; }
            bmiStatusEl.textContent = status;
            bmiStatusEl.className = `status ${cls}`;
        }

        setEl('resultBMR', Math.round(r.bmr));
        setEl('resultTDEE', Math.round(r.tdee));
        setEl('resultTraining', r.trainingCalories);
        setEl('balanceTraining', Math.round(r.balanceTraining) + ' 大卡');
        setEl('balanceRest', Math.round(r.balanceRest) + ' 大卡');
        setEl('intakeTraining', Math.round(r.intakeTraining) + ' 大卡');
        setEl('intakeRest', Math.round(r.intakeRest) + ' 大卡');
        setEl('carbTraining', Math.round(r.carbTraining) + 'g');
        setEl('carbRest', Math.round(r.carbRest) + 'g');
        setEl('proteinTraining', Math.round(r.protein) + 'g');
        setEl('proteinRest', Math.round(r.protein) + 'g');
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
        const { carbTraining, carbRest, protein } = this.planResults;
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
    }
};

window.ProfileModule = ProfileModule;
