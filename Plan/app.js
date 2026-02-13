/**
 * Fat Loss Plan Calculator
 * Calculate daily nutrition based on user's body metrics
 */

const PlanCalculator = {
    // User data
    userData: {
        gender: '',
        height: 0,
        weight: 0,
        age: 0,
        trainingLevel: '',
        aerobicCalories: 0
    },

    // Calculated results
    results: {
        bmi: 0,
        bmr: 0,
        tdee: 0,
        trainingCalories: 0,
        balanceTraining: 0,
        balanceRest: 0,
        intakeTraining: 0,
        intakeRest: 0,
        carbTraining: 0,
        carbRest: 0,
        protein: 0,
        fat: 0
    },

    /**
     * Initialize the calculator
     */
    init() {
        this.loadSavedData();
        this.setupEventListeners();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const form = document.getElementById('basicInfoForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.calculate();
            });
        }

        // Auto-save on input change
        const inputs = document.querySelectorAll('#basicInfoForm input, #basicInfoForm select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.saveData();
            });
        });
    },

    /**
     * Load saved data from localStorage
     */
    loadSavedData() {
        const saved = localStorage.getItem('fitness_plan_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.userData = { ...this.userData, ...data };
                
                // Fill form with saved data
                if (data.gender) document.getElementById('gender').value = data.gender;
                if (data.height) document.getElementById('height').value = data.height;
                if (data.weight) document.getElementById('weight').value = data.weight;
                if (data.age) document.getElementById('age').value = data.age;
                if (data.trainingLevel) document.getElementById('trainingLevel').value = data.trainingLevel;
                if (data.aerobicCalories) document.getElementById('aerobicCalories').value = data.aerobicCalories;
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    },

    /**
     * Save data to localStorage
     */
    saveData() {
        this.userData = {
            gender: document.getElementById('gender').value,
            height: parseFloat(document.getElementById('height').value) || 0,
            weight: parseFloat(document.getElementById('weight').value) || 0,
            age: parseInt(document.getElementById('age').value) || 0,
            trainingLevel: document.getElementById('trainingLevel').value,
            aerobicCalories: parseFloat(document.getElementById('aerobicCalories').value) || 0
        };
        localStorage.setItem('fitness_plan_data', JSON.stringify(this.userData));
    },

    /**
     * Calculate all metrics
     */
    calculate() {
        this.saveData();
        
        const { gender, height, weight, age, trainingLevel, aerobicCalories } = this.userData;

        // Validate inputs
        if (!gender || !height || !weight || !age || !trainingLevel) {
            alert('请填写所有必填项');
            return;
        }

        // Calculate BMI
        const heightM = height / 100;
        this.results.bmi = weight / (heightM * heightM);

        // Calculate BMR using Mifflin-St Jeor equation
        if (gender === 'male') {
            this.results.bmr = weight * 9.99 + height * 6.25 - age * 4.92 + 5;
        } else {
            this.results.bmr = weight * 9.99 + height * 6.25 - age * 4.92 - 161;
        }

        // Calculate TDEE (without exercise)
        // BMR accounts for about 70% of total daily energy expenditure
        this.results.tdee = this.results.bmr / 0.7;

        // Calculate training calories based on level
        const trainingCaloriesMap = {
            male: { beginner: 150, intermediate: 200, advanced: 250 },
            female: { beginner: 100, intermediate: 150, advanced: 200 }
        };
        this.results.trainingCalories = trainingCaloriesMap[gender][trainingLevel];

        // Calculate balance calories
        // Training day: TDEE + training + aerobic
        this.results.balanceTraining = this.results.tdee + this.results.trainingCalories + aerobicCalories;
        // Rest day: TDEE + aerobic
        this.results.balanceRest = this.results.tdee + aerobicCalories;

        // Calculate intake calories (balance × 0.64 for 20% deficit with 20% buffer)
        this.results.intakeTraining = this.results.balanceTraining * 0.64;
        this.results.intakeRest = this.results.balanceRest * 0.64;

        // Calculate macros
        // Training day: 2.6g carbs/kg, 1.4g protein/kg
        this.results.carbTraining = weight * 2.6;
        // Rest day: 2.1g carbs/kg, 1.4g protein/kg
        this.results.carbRest = weight * 2.1;
        // Protein same for both days
        this.results.protein = weight * 1.4;
        // Fat based on gender
        this.results.fat = gender === 'male' ? (weight >= 120 ? 70 : 60) : 50;

        // Display results
        this.displayResults();
    },

    /**
     * Display calculation results
     */
    displayResults() {
        // Show result card
        document.getElementById('resultCard').style.display = 'block';

        // BMI
        const bmiEl = document.getElementById('resultBMI');
        const bmiStatusEl = document.getElementById('bmiStatus');
        bmiEl.textContent = this.results.bmi.toFixed(1);
        
        let bmiStatus = '';
        let bmiClass = 'normal';
        if (this.results.bmi < 18.5) {
            bmiStatus = '偏瘦';
            bmiClass = 'warning';
        } else if (this.results.bmi < 24) {
            bmiStatus = '正常';
            bmiClass = 'normal';
        } else if (this.results.bmi < 28) {
            bmiStatus = '超重';
            bmiClass = 'warning';
        } else {
            bmiStatus = '肥胖';
            bmiClass = 'danger';
        }
        bmiStatusEl.textContent = bmiStatus;
        bmiStatusEl.className = `status ${bmiClass}`;

        // Other metrics
        document.getElementById('resultBMR').textContent = Math.round(this.results.bmr);
        document.getElementById('resultTDEE').textContent = Math.round(this.results.tdee);
        document.getElementById('resultTraining').textContent = this.results.trainingCalories;

        // Balance and intake
        document.getElementById('balanceTraining').textContent = Math.round(this.results.balanceTraining) + ' 大卡';
        document.getElementById('balanceRest').textContent = Math.round(this.results.balanceRest) + ' 大卡';
        document.getElementById('intakeTraining').textContent = Math.round(this.results.intakeTraining) + ' 大卡';
        document.getElementById('intakeRest').textContent = Math.round(this.results.intakeRest) + ' 大卡';

        // Macros
        document.getElementById('carbTraining').textContent = Math.round(this.results.carbTraining) + 'g';
        document.getElementById('carbRest').textContent = Math.round(this.results.carbRest) + 'g';
        document.getElementById('proteinTraining').textContent = Math.round(this.results.protein) + 'g';
        document.getElementById('proteinRest').textContent = Math.round(this.results.protein) + 'g';
        document.getElementById('fatTraining').textContent = this.results.fat + 'g';
        document.getElementById('fatRest').textContent = this.results.fat + 'g';

        // Scroll to results
        document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

/**
 * Show meal plan details
 */
function showMealPlan() {
    const mealPlanCard = document.getElementById('mealPlanCard');
    mealPlanCard.style.display = mealPlanCard.style.display === 'none' ? 'block' : 'none';

    if (mealPlanCard.style.display === 'block') {
        generateMealPlan();
        mealPlanCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Generate meal plan tables
 */
function generateMealPlan() {
    const { carbTraining, carbRest, protein } = PlanCalculator.results;

    // Training day meal distribution
    const trainingMeals = [
        { name: '①早饭=练前餐', carbPercent: 15, proteinPercent: 20, note: '吃完就开始力训，低饱腹感碳水为佳' },
        { name: '②练后餐', carbPercent: 35, proteinPercent: 20, note: '练完30分钟内吃，少吃蔬菜' },
        { name: '③午饭=其他餐', carbPercent: 20, proteinPercent: 20, note: '练后餐刚吃完，可少吃' },
        { name: '④晚饭=其他餐', carbPercent: 20, proteinPercent: 20, note: '正常饮食' },
        { name: '⑤零食/夜宵', carbPercent: 10, proteinPercent: 20, note: '不吃碳水食物和糖油混合物' }
    ];

    // Rest day meal distribution
    const restMeals = [
        { name: '①早饭', carbPercent: 15, proteinPercent: 20, note: '与力训日早饭相同' },
        { name: '②午饭', carbPercent: 35, proteinPercent: 30, note: '正常饮食' },
        { name: '③晚饭', carbPercent: 40, proteinPercent: 30, note: '正常饮食' },
        { name: '④零食/夜宵', carbPercent: 10, proteinPercent: 20, note: '不吃碳水食物和糖油混合物' }
    ];

    // Generate training day table
    const trainingTable = document.getElementById('trainingMealTable');
    trainingTable.innerHTML = trainingMeals.map(meal => `
        <tr>
            <td><strong>${meal.name}</strong></td>
            <td><span class="value">${Math.round(carbTraining * meal.carbPercent / 100)}</span> (${meal.carbPercent}%)</td>
            <td><span class="value">${Math.round(protein * meal.proteinPercent / 100)}</span> (${meal.proteinPercent}%)</td>
            <td><small>${meal.note}</small></td>
        </tr>
    `).join('') + `
        <tr style="background: #f0f7f0; font-weight: bold;">
            <td>合计</td>
            <td><span class="value">${Math.round(carbTraining)}</span>g</td>
            <td><span class="value">${Math.round(protein)}</span>g</td>
            <td></td>
        </tr>
    `;

    // Generate rest day table
    const restTable = document.getElementById('restMealTable');
    restTable.innerHTML = restMeals.map(meal => `
        <tr>
            <td><strong>${meal.name}</strong></td>
            <td><span class="value">${Math.round(carbRest * meal.carbPercent / 100)}</span> (${meal.carbPercent}%)</td>
            <td><span class="value">${Math.round(protein * meal.proteinPercent / 100)}</span> (${meal.proteinPercent}%)</td>
            <td><small>${meal.note}</small></td>
        </tr>
    `).join('') + `
        <tr style="background: #e3f2fd; font-weight: bold;">
            <td>合计</td>
            <td><span class="value">${Math.round(carbRest)}</span>g</td>
            <td><span class="value">${Math.round(protein)}</span>g</td>
            <td></td>
        </tr>
    `;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    PlanCalculator.init();
});
