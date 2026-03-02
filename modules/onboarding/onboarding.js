/**
 * Onboarding Module — First-time Setup Wizard
 * Collects body info, calculates metabolism, lets user choose a goal,
 * and shows daily macro targets.
 */
const OnboardingModule = {
    currentStep: 1,
    gender: 'male',
    height: 0,
    weight: 0,
    age: 0,
    goal: null,  // 'bulk' or 'cut'
    calcResult: null,

    init() {
        this.currentStep = 1;
        this.gender = 'male';
        this.goal = null;
        this.calcResult = null;
        this.showStep(1);
    },

    destroy() {
        // Cleanup if needed
    },

    // ==================== Navigation ====================

    showStep(step) {
        this.currentStep = step;

        // Hide all steps
        document.querySelectorAll('.onboarding-step').forEach(el => {
            el.classList.remove('active');
        });

        // Show target step
        const stepEl = document.getElementById(`onboardingStep${step}`);
        if (stepEl) stepEl.classList.add('active');

        // Update progress
        const fill = document.getElementById('onboardingProgressFill');
        const text = document.getElementById('onboardingProgressText');
        const percent = Math.round((step / 3) * 100);
        if (fill) fill.style.width = `${percent}%`;
        if (text) text.textContent = `${step} / 3`;
    },

    // ==================== Step 1: Body Info ====================

    setGender(value) {
        this.gender = value;
        const maleBtn = document.getElementById('obGenderMale');
        const femaleBtn = document.getElementById('obGenderFemale');
        if (maleBtn) maleBtn.classList.toggle('active', value === 'male');
        if (femaleBtn) femaleBtn.classList.toggle('active', value === 'female');
    },

    goToStep2() {
        const height = parseFloat(document.getElementById('obHeight')?.value);
        const weight = parseFloat(document.getElementById('obWeight')?.value);
        const age = parseInt(document.getElementById('obAge')?.value);

        if (!height || height < 100 || height > 250) {
            alert('请输入有效的身高（100-250cm）');
            return;
        }
        if (!weight || weight < 30 || weight > 300) {
            alert('请输入有效的体重（30-300kg）');
            return;
        }
        if (!age || age < 10 || age > 100) {
            alert('请输入有效的年龄（10-100岁）');
            return;
        }

        this.height = height;
        this.weight = weight;
        this.age = age;

        // Calculate metabolism
        this.calculateMetabolism();
        this.showStep(2);
    },

    calculateMetabolism() {
        const { gender, height, weight, age } = this;

        // Mifflin-St Jeor formula (same as backend)
        let bmr;
        if (gender === 'male') {
            bmr = weight * 9.99 + height * 6.25 - age * 4.92 + 5;
        } else {
            bmr = weight * 9.99 + height * 6.25 - age * 4.92 - 161;
        }

        const tdee = bmr / 0.7;
        const heightM = height / 100;
        const bmi = weight / (heightM * heightM);

        this.calcResult = {
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
            bmi: parseFloat(bmi.toFixed(1))
        };

        // Display
        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setEl('obBMR', this.calcResult.bmr);
        setEl('obTDEE', this.calcResult.tdee);
        setEl('obBMI', this.calcResult.bmi);

        // BMI status
        const bmiStatusEl = document.getElementById('obBMIStatus');
        if (bmiStatusEl) {
            let status = '', cls = 'normal';
            if (bmi < 18.5) { status = '偏瘦'; cls = 'warning'; }
            else if (bmi < 24) { status = '正常'; cls = 'normal'; }
            else if (bmi < 28) { status = '超重'; cls = 'warning'; }
            else { status = '肥胖'; cls = 'danger'; }
            bmiStatusEl.textContent = status;
            bmiStatusEl.className = `meta-status ${cls}`;
        }

        // Reset goal selection
        this.goal = null;
        document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('selected'));
        const nextBtn = document.getElementById('obStep2Next');
        if (nextBtn) nextBtn.disabled = true;
    },

    // ==================== Step 2: Goal Selection ====================

    setGoal(goal) {
        this.goal = goal;

        document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('selected'));
        const card = document.getElementById(goal === 'bulk' ? 'goalBulk' : 'goalCut');
        if (card) card.classList.add('selected');

        const nextBtn = document.getElementById('obStep2Next');
        if (nextBtn) nextBtn.disabled = false;
    },

    goToStep1() {
        this.showStep(1);
    },

    goToStep3() {
        if (!this.goal) {
            alert('请选择一个目标计划');
            return;
        }

        this.calculateMacros();
        this.showStep(3);
    },

    // ==================== Step 3: Macro Calculation ====================

    calculateMacros() {
        const { gender, weight, goal } = this;
        const { tdee } = this.calcResult;

        // Training calories estimate (use intermediate level as default)
        const trainingCal = gender === 'male' ? 200 : 150;

        // Total balance on training day
        const balanceTraining = tdee + trainingCal;
        const balanceRest = tdee;

        let targetCalTraining, targetCalRest;
        let carbTraining, carbRest;
        let protein, fat;

        if (goal === 'cut') {
            // Cutting: ~64% of balance (calorie deficit)
            targetCalTraining = Math.round(balanceTraining * 0.64);
            targetCalRest = Math.round(balanceRest * 0.64);

            carbTraining = Math.round(weight * 2.6);
            carbRest = Math.round(weight * 2.1);
            protein = Math.round(weight * 1.4);
            fat = gender === 'male' ? (weight >= 120 ? 70 : 60) : 50;
        } else {
            // Bulking: ~110% of balance (slight surplus)
            targetCalTraining = Math.round(balanceTraining * 1.1);
            targetCalRest = Math.round(balanceRest * 1.0);

            carbTraining = Math.round(weight * 4.0);
            carbRest = Math.round(weight * 3.2);
            protein = Math.round(weight * 1.8);
            fat = gender === 'male' ? (weight >= 120 ? 80 : 70) : 60;
        }

        this.macroResult = {
            targetCalTraining,
            targetCalRest,
            carbTraining,
            carbRest,
            protein,
            fat,
            balanceTraining,
            balanceRest,
            trainingCal
        };

        this.displayMacros();
    },

    displayMacros() {
        const { goal } = this;
        const r = this.macroResult;

        // Badge
        const badge = document.getElementById('obPlanBadge');
        if (badge) {
            badge.textContent = goal === 'bulk' ? '💪 增肌计划' : '🔥 减脂计划';
            badge.className = `macro-plan-badge ${goal}`;
        }

        // Description
        const desc = document.getElementById('obGoalDesc');
        if (desc) {
            desc.textContent = goal === 'bulk'
                ? '增肌需要热量盈余，以下是你的每日摄入目标（训练日）'
                : '减脂需要热量缺口，以下是你的每日摄入目标（训练日）';
        }

        // Main values (show training day values)
        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setEl('obTargetCal', r.targetCalTraining);
        setEl('obTargetCarb', r.carbTraining);
        setEl('obTargetProtein', r.protein);
        setEl('obTargetFat', r.fat);

        // Detail box
        const detailBox = document.getElementById('obMacroDetail');
        if (detailBox) {
            detailBox.innerHTML = `
                <div class="macro-detail-row">
                    <span class="label">📅 训练日热量</span>
                    <span class="value">${r.targetCalTraining} 千卡</span>
                </div>
                <div class="macro-detail-row">
                    <span class="label">😴 休息日热量</span>
                    <span class="value">${r.targetCalRest} 千卡</span>
                </div>
                <div class="macro-detail-row">
                    <span class="label">🍚 训练日碳水</span>
                    <span class="value">${r.carbTraining}g</span>
                </div>
                <div class="macro-detail-row">
                    <span class="label">🍚 休息日碳水</span>
                    <span class="value">${r.carbRest}g</span>
                </div>
                <div class="macro-detail-row">
                    <span class="label">🥩 蛋白质</span>
                    <span class="value">${r.protein}g</span>
                </div>
                <div class="macro-detail-row">
                    <span class="label">🥑 脂肪</span>
                    <span class="value">${r.fat}g</span>
                </div>
            `;
        }
    },

    // ==================== Finish ====================

    finish() {
        const { gender, height, weight, age, goal, calcResult, macroResult } = this;

        // Save user profile
        const profile = {
            gender,
            height,
            weight,
            age,
            goal,
            onboardingCompleted: true,
            completedAt: new Date().toISOString()
        };
        Storage.saveUserProfile(profile);

        // Save plan data (compatible with profile module)
        const planData = {
            gender,
            height,
            weight,
            age,
            trainingLevel: 'intermediate',
            aerobicCalories: 0,
            goal,
            bmr: calcResult.bmr,
            tdee: calcResult.tdee,
            bmi: calcResult.bmi,
            targetCalTraining: macroResult.targetCalTraining,
            targetCalRest: macroResult.targetCalRest,
            carbTraining: macroResult.carbTraining,
            carbRest: macroResult.carbRest,
            protein: macroResult.protein,
            fat: macroResult.fat
        };
        Storage.savePlanData(planData);

        // Also record initial weight
        const today = Utils.formatDate(new Date());
        Storage.addWeightRecord(today, weight);

        // Mark onboarding as done
        localStorage.setItem('htf_onboarding_done', 'true');

        // Navigate to main app
        window.EventBus && EventBus.emit('onboarding:complete');
    }
};

window.OnboardingModule = OnboardingModule;
