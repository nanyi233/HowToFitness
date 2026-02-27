/**
 * Plan Module — fat loss plan calculator
 */

const PlanModule = {
    userData: { gender: '', height: 0, weight: 0, age: 0, trainingLevel: '', aerobicCalories: 0 },
    results: {},

    init() {
        this.loadSavedData();
        this.setupEventListeners();
    },

    destroy() {},

    setupEventListeners() {
        const form = document.getElementById('basicInfoForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.calculate();
            });
        }

        const inputs = document.querySelectorAll('#basicInfoForm input, #basicInfoForm select');
        inputs.forEach(input => {
            input.addEventListener('change', () => this.saveData());
        });
    },

    loadSavedData() {
        const data = Storage.getPlanData();
        if (!data) return;
        try {
            this.userData = { ...this.userData, ...data };
            if (data.gender) { const el = document.getElementById('planGender'); if (el) el.value = data.gender; }
            if (data.height) { const el = document.getElementById('planHeight'); if (el) el.value = data.height; }
            if (data.weight) { const el = document.getElementById('planWeight'); if (el) el.value = data.weight; }
            if (data.age) { const el = document.getElementById('planAge'); if (el) el.value = data.age; }
            if (data.trainingLevel) { const el = document.getElementById('trainingLevel'); if (el) el.value = data.trainingLevel; }
            if (data.aerobicCalories) { const el = document.getElementById('aerobicCalories'); if (el) el.value = data.aerobicCalories; }
        } catch (e) { console.error('Error loading plan data:', e); }
    },

    saveData() {
        this.userData = {
            gender: document.getElementById('planGender')?.value || '',
            height: parseFloat(document.getElementById('planHeight')?.value) || 0,
            weight: parseFloat(document.getElementById('planWeight')?.value) || 0,
            age: parseInt(document.getElementById('planAge')?.value) || 0,
            trainingLevel: document.getElementById('trainingLevel')?.value || '',
            aerobicCalories: parseFloat(document.getElementById('aerobicCalories')?.value) || 0
        };
        Storage.savePlanData(this.userData);
    },

    calculate() {
        this.saveData();
        const { gender, height, weight, age, trainingLevel, aerobicCalories } = this.userData;

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

        this.results = { bmi, bmr, tdee, trainingCalories, balanceTraining, balanceRest, intakeTraining, intakeRest, carbTraining, carbRest, protein, fat };
        this.displayResults();
    },

    displayResults() {
        const card = document.getElementById('planResultCard');
        if (card) card.style.display = 'block';

        const r = this.results;

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

        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
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

        card?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    toggleMealPlan() {
        const card = document.getElementById('mealPlanCard');
        if (!card) return;
        card.style.display = card.style.display === 'none' ? 'block' : 'none';
        if (card.style.display === 'block') {
            this.generateMealPlan();
            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    generateMealPlan() {
        const { carbTraining, carbRest, protein } = this.results;

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
    }
};

window.PlanModule = PlanModule;
