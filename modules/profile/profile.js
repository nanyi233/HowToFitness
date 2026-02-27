/**
 * Profile Module
 */

const ProfileModule = {
    init() {
        this.updateProfileStats();
    },

    destroy() {},

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

    showHelp() {
        alert('📖 使用帮助\n\n在"饮食"页面输入食物名称和克数来记录饮食。\n例如：鸡胸肉 150g\n\n也可以用自然语言输入，AI会自动解析。');
    },

    clearChatHistory() {
        if (confirm('确定要清除所有聊天记录吗？')) {
            Storage.clearChatHistory();
            alert('✅ 聊天记录已清除');
        }
    }
};

window.ProfileModule = ProfileModule;
