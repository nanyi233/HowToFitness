/**
 * Aerobic Exercise Calorie Calculator
 * Calculate calorie consumption for various aerobic exercises
 */

// Exercise data based on the reference document
const EXERCISE_DATA = {
    "平地走": {
        icon: "🚶",
        levels: [
            { name: "每走一万步", perKg: 3.8, note: "约1小时" },
            { name: "每走一小时", perKg: 3.8, note: "" }
        ]
    },
    "爬坡走": {
        icon: "⛰️",
        levels: [
            { name: "坡度5°（一般选择）", perKg: 5.5, note: "" },
            { name: "坡度10°（很累）", perKg: 8.0, note: "" }
        ]
    },
    "跑步": {
        icon: "🏃",
        levels: [
            { name: "速度6km/h", perKg: 5.5, note: "慢跑" },
            { name: "速度7km/h", perKg: 7.2, note: "" },
            { name: "速度8km/h", perKg: 9.5, note: "" },
            { name: "速度9km/h", perKg: 9.6, note: "" },
            { name: "速度10km/h", perKg: 9.8, note: "" },
            { name: "速度12km/h", perKg: 10.1, note: "" },
            { name: "速度13km/h", perKg: 10.1, note: "" },
            { name: "速度14km/h", perKg: 10.4, note: "" },
            { name: "速度15km/h", perKg: 10.9, note: "" },
            { name: "速度16km/h", perKg: 12.7, note: "快跑" }
        ]
    },
    "户外骑行": {
        icon: "🚴",
        levels: [
            { name: "速度10km/h", perKg: 3.6, note: "通勤" },
            { name: "速度12km/h", perKg: 3.9, note: "通勤" },
            { name: "速度13km/h", perKg: 4.4, note: "通勤" },
            { name: "速度15km/h", perKg: 5.5, note: "通勤" },
            { name: "速度18km/h", perKg: 6.5, note: "通勤" },
            { name: "速度27km/h", perKg: 7.5, note: "专业" },
            { name: "速度31km/h", perKg: 10.0, note: "专业" },
            { name: "速度34km/h", perKg: 12.0, note: "专业" }
        ]
    },
    "室内单车": {
        icon: "🚲",
        levels: [
            { name: "功率50-90W", perKg: 4.8, note: "轻松" },
            { name: "功率90-100W", perKg: 6.8, note: "" },
            { name: "功率100-160W", perKg: 8.8, note: "" },
            { name: "功率160-200W", perKg: 11.0, note: "" },
            { name: "功率200-270W", perKg: 14.0, note: "剧烈" }
        ]
    },
    "游泳": {
        icon: "🏊",
        levels: [
            { name: "速度1km/h", perKg: 4.2, note: "休闲" },
            { name: "速度2km/h", perKg: 7.7, note: "" },
            { name: "速度3km/h", perKg: 9.2, note: "快速" }
        ]
    },
    "球类运动": {
        icon: "⚽",
        levels: [
            { name: "篮球", perKg: 6.1, note: "" },
            { name: "足球", perKg: 7.0, note: "" },
            { name: "排球", perKg: 4.1, note: "" },
            { name: "网球", perKg: 8.9, note: "" },
            { name: "乒乓球", perKg: 6.6, note: "" },
            { name: "羽毛球", perKg: 7.4, note: "" }
        ]
    },
    "跳操跟练": {
        icon: "💃",
        levels: [
            { name: "轻松强度", perKg: 2.3, note: "" },
            { name: "中等强度", perKg: 4.0, note: "" },
            { name: "剧烈强度", perKg: 6.0, note: "" }
        ]
    },
    "室内其他": {
        icon: "🧘",
        levels: [
            { name: "瑜伽", perKg: 3.1, note: "" },
            { name: "舞蹈", perKg: 5.0, note: "" },
            { name: "椭圆仪", perKg: 5.0, note: "" },
            { name: "普拉提", perKg: 3.0, note: "" },
            { name: "健身环", perKg: 5.0, note: "" }
        ]
    },
    "爬楼": {
        icon: "🪜",
        levels: [
            { name: "上楼", perKg: 8.0, note: "90步/分钟" },
            { name: "下楼", perKg: 3.1, note: "" }
        ]
    },
    "划船机": {
        icon: "🚣",
        levels: [
            { name: "功率100W", perKg: 7.0, note: "" },
            { name: "功率150W", perKg: 8.5, note: "" },
            { name: "功率200W", perKg: 12.0, note: "" }
        ]
    },
    "拳击": {
        icon: "🥊",
        levels: [
            { name: "打沙袋", perKg: 5.5, note: "" },
            { name: "真人格斗", perKg: 7.8, note: "" }
        ]
    },
    "跳绳": {
        icon: "🪢",
        levels: [
            { name: "<100次/分钟", perKg: 8.8, note: "慢速" },
            { name: "100-120次/分钟", perKg: 11.8, note: "" },
            { name: "120-160次/分钟", perKg: 12.3, note: "快速" }
        ]
    }
};

// Weight brackets for table display
const WEIGHT_BRACKETS = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120];

// Food equivalents per 100 calories
const FOOD_EQUIVALENTS = [
    { name: "熟米饭", amount: 80, unit: "g", icon: "🍚" },
    { name: "瘦熟肉", amount: 80, unit: "g", icon: "🥩" },
    { name: "苹果/香蕉", amount: 1, unit: "个", icon: "🍎" },
    { name: "鸡蛋", amount: 1.5, unit: "个", icon: "🥚" },
    { name: "全脂牛奶", amount: 200, unit: "ml", icon: "🥛" },
    { name: "坚果", amount: 20, unit: "g", icon: "🥜" }
];

/**
 * Calculate calories with weight adjustment for heavy individuals
 * @param {number} weight - Body weight in kg
 * @param {number} perKg - Calories per kg
 * @returns {number} Adjusted hourly calorie consumption
 */
function calculateCalories(weight, perKg) {
    let baseCalories = weight * perKg;
    
    // Apply reduction for weights above 80kg
    // Reduce 3% for every 5kg above 80kg
    if (weight > 80) {
        const excessWeight = weight - 80;
        const reductionSteps = Math.floor(excessWeight / 5);
        const reductionFactor = Math.pow(0.97, reductionSteps);
        baseCalories = baseCalories * reductionFactor;
    }
    
    return Math.round(baseCalories);
}

/**
 * Get calorie consumption for a specific weight bracket
 * Uses pre-calculated values from the reference table
 */
function getTableCalories(weight, perKg) {
    return calculateCalories(weight, perKg);
}

const AerobicCalculator = {
    init() {
        this.populateCategories();
        this.setupEventListeners();
        this.generateFullTable();
        this.loadSavedData();
    },

    /**
     * Populate exercise category dropdown
     */
    populateCategories() {
        const categorySelect = document.getElementById('exerciseCategory');
        categorySelect.innerHTML = '<option value="">请选择运动类型</option>';
        
        for (const [category, data] of Object.entries(EXERCISE_DATA)) {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = `${data.icon} ${category}`;
            categorySelect.appendChild(option);
        }
    },

    /**
     * Populate exercise level dropdown based on selected category
     */
    populateLevels(category) {
        const levelSelect = document.getElementById('exerciseLevel');
        
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

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Category change
        document.getElementById('exerciseCategory').addEventListener('change', (e) => {
            this.populateLevels(e.target.value);
            this.saveData();
        });

        // Form submit
        document.getElementById('aerobicForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculate();
        });

        // Auto-save on input change
        const inputs = document.querySelectorAll('#aerobicForm input, #aerobicForm select');
        inputs.forEach(input => {
            input.addEventListener('change', () => this.saveData());
        });
    },

    /**
     * Calculate calorie consumption
     */
    calculate() {
        const weight = parseFloat(document.getElementById('weight').value);
        const category = document.getElementById('exerciseCategory').value;
        const levelIndex = document.getElementById('exerciseLevel').value;
        const hours = parseInt(document.getElementById('durationHours').value) || 0;
        const minutes = parseInt(document.getElementById('durationMinutes').value) || 0;
        const frequency = parseInt(document.getElementById('frequency').value);

        // Validate
        if (!weight || !category || levelIndex === '') {
            alert('请填写所有必填项');
            return;
        }

        const level = EXERCISE_DATA[category].levels[levelIndex];
        const totalHours = hours + minutes / 60;

        // Calculate
        const hourlyCalories = calculateCalories(weight, level.perKg);
        const singleCalories = Math.round(hourlyCalories * totalHours);
        const weeklyCalories = singleCalories * frequency;
        const dailyAvgCalories = Math.round(weeklyCalories / 7);

        // Display results
        this.displayResults({
            hourlyCalories,
            singleCalories,
            weeklyCalories,
            dailyAvgCalories
        });

        this.saveData();
    },

    /**
     * Display calculation results
     */
    displayResults(results) {
        document.getElementById('resultCard').style.display = 'block';
        
        document.getElementById('hourlyCalories').textContent = results.hourlyCalories;
        document.getElementById('singleCalories').textContent = results.singleCalories;
        document.getElementById('weeklyCalories').textContent = results.weeklyCalories;
        document.getElementById('dailyAvgCalories').textContent = results.dailyAvgCalories;
        document.getElementById('planValue').textContent = results.dailyAvgCalories;

        // Calculate food equivalents
        const foodGrid = document.getElementById('foodEquivalent');
        const multiplier = results.dailyAvgCalories / 100;
        
        foodGrid.innerHTML = FOOD_EQUIVALENTS.map(food => {
            const amount = Math.round(food.amount * multiplier * 10) / 10;
            return `
                <div class="food-item">
                    <span>${food.icon}</span>
                    <span class="amount">${amount}${food.unit}</span>
                    <span>${food.name}</span>
                </div>
            `;
        }).join('');

        // Scroll to results
        document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    /**
     * Generate full calorie consumption table
     */
    generateFullTable() {
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';

        for (const [category, data] of Object.entries(EXERCISE_DATA)) {
            data.levels.forEach((level, index) => {
                const row = document.createElement('tr');
                
                // Category name (only show for first level)
                const categoryCell = document.createElement('td');
                if (index === 0) {
                    categoryCell.textContent = `${data.icon} ${category}`;
                    categoryCell.rowSpan = data.levels.length;
                    row.appendChild(categoryCell);
                }
                
                // Level name
                const levelCell = document.createElement('td');
                levelCell.textContent = level.name;
                row.appendChild(levelCell);
                
                // Per kg value
                const perKgCell = document.createElement('td');
                perKgCell.textContent = level.perKg;
                row.appendChild(perKgCell);
                
                // Calorie values for each weight bracket
                WEIGHT_BRACKETS.slice(0, 11).forEach(weight => {
                    const cell = document.createElement('td');
                    cell.textContent = getTableCalories(weight, level.perKg);
                    row.appendChild(cell);
                });
                
                tbody.appendChild(row);
            });
        }
    },

    /**
     * Save form data to localStorage
     */
    saveData() {
        const data = {
            weight: document.getElementById('weight').value,
            category: document.getElementById('exerciseCategory').value,
            level: document.getElementById('exerciseLevel').value,
            hours: document.getElementById('durationHours').value,
            minutes: document.getElementById('durationMinutes').value,
            frequency: document.getElementById('frequency').value
        };
        localStorage.setItem('aerobic_calculator_data', JSON.stringify(data));
    },

    /**
     * Load saved data from localStorage
     */
    loadSavedData() {
        const saved = localStorage.getItem('aerobic_calculator_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.weight) document.getElementById('weight').value = data.weight;
                if (data.category) {
                    document.getElementById('exerciseCategory').value = data.category;
                    this.populateLevels(data.category);
                    if (data.level) document.getElementById('exerciseLevel').value = data.level;
                }
                if (data.hours) document.getElementById('durationHours').value = data.hours;
                if (data.minutes) document.getElementById('durationMinutes').value = data.minutes;
                if (data.frequency) document.getElementById('frequency').value = data.frequency;
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    AerobicCalculator.init();
});
