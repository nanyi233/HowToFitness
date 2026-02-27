/**
 * Food Database — nutritional info per 100g
 */

const FoodDatabase = {
    '鸡胸肉': { calories: 133, protein: 31, carbs: 0, fat: 1.2 },
    '鸡腿肉': { calories: 181, protein: 26, carbs: 0, fat: 8 },
    '鸡翅': { calories: 222, protein: 17, carbs: 0, fat: 17 },
    '牛肉': { calories: 125, protein: 22, carbs: 0, fat: 4 },
    '牛排': { calories: 250, protein: 26, carbs: 0, fat: 16 },
    '猪肉': { calories: 143, protein: 21, carbs: 0, fat: 6 },
    '猪里脊': { calories: 155, protein: 21, carbs: 0, fat: 8 },
    '羊肉': { calories: 203, protein: 19, carbs: 0, fat: 14 },
    '鸭肉': { calories: 240, protein: 16, carbs: 0, fat: 19 },
    '三文鱼': { calories: 139, protein: 21, carbs: 0, fat: 6 },
    '金枪鱼': { calories: 144, protein: 23, carbs: 0, fat: 5 },
    '虾': { calories: 85, protein: 18, carbs: 0, fat: 1 },
    '虾仁': { calories: 85, protein: 18, carbs: 0, fat: 1 },
    '鳕鱼': { calories: 82, protein: 18, carbs: 0, fat: 0.7 },
    '带鱼': { calories: 127, protein: 18, carbs: 0, fat: 6 },
    '鲈鱼': { calories: 105, protein: 20, carbs: 0, fat: 2 },
    '鲫鱼': { calories: 108, protein: 17, carbs: 0, fat: 4 },
    '螃蟹': { calories: 95, protein: 14, carbs: 0, fat: 3 },
    '鸡蛋': { calories: 144, protein: 13, carbs: 1, fat: 10 },
    '蛋白': { calories: 52, protein: 11, carbs: 0.7, fat: 0.2 },
    '蛋黄': { calories: 317, protein: 16, carbs: 3, fat: 27 },
    '牛奶': { calories: 54, protein: 3, carbs: 5, fat: 3 },
    '脱脂牛奶': { calories: 35, protein: 3.4, carbs: 5, fat: 0.1 },
    '酸奶': { calories: 72, protein: 3.5, carbs: 10, fat: 2 },
    '希腊酸奶': { calories: 97, protein: 9, carbs: 4, fat: 5 },
    '奶酪': { calories: 328, protein: 20, carbs: 4, fat: 26 },
    '芝士': { calories: 328, protein: 20, carbs: 4, fat: 26 },
    '米饭': { calories: 116, protein: 2.6, carbs: 25, fat: 0.3 },
    '白米饭': { calories: 116, protein: 2.6, carbs: 25, fat: 0.3 },
    '糙米饭': { calories: 111, protein: 2.6, carbs: 23, fat: 0.9 },
    '燕麦': { calories: 379, protein: 13, carbs: 66, fat: 7 },
    '燕麦片': { calories: 379, protein: 13, carbs: 66, fat: 7 },
    '面条': { calories: 137, protein: 4.5, carbs: 28, fat: 0.8 },
    '挂面': { calories: 346, protein: 11, carbs: 72, fat: 1 },
    '面包': { calories: 266, protein: 8, carbs: 50, fat: 3 },
    '全麦面包': { calories: 247, protein: 13, carbs: 41, fat: 4 },
    '馒头': { calories: 221, protein: 7, carbs: 45, fat: 1 },
    '红薯': { calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
    '紫薯': { calories: 82, protein: 1.3, carbs: 19, fat: 0.1 },
    '土豆': { calories: 76, protein: 2, carbs: 17, fat: 0.1 },
    '玉米': { calories: 112, protein: 4, carbs: 22, fat: 1 },
    '小米': { calories: 361, protein: 9, carbs: 76, fat: 3 },
    '藜麦': { calories: 368, protein: 14, carbs: 64, fat: 6 },
    '西兰花': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
    '菠菜': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
    '生菜': { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
    '黄瓜': { calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1 },
    '番茄': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
    '西红柿': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
    '胡萝卜': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
    '青椒': { calories: 20, protein: 0.9, carbs: 4.6, fat: 0.2 },
    '洋葱': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
    '蘑菇': { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
    '豆芽': { calories: 31, protein: 3, carbs: 6, fat: 0.1 },
    '芹菜': { calories: 14, protein: 0.7, carbs: 3, fat: 0.2 },
    '白菜': { calories: 13, protein: 1, carbs: 2.2, fat: 0.1 },
    '包菜': { calories: 25, protein: 1.3, carbs: 6, fat: 0.1 },
    '卷心菜': { calories: 25, protein: 1.3, carbs: 6, fat: 0.1 },
    '南瓜': { calories: 26, protein: 1, carbs: 6, fat: 0.1 },
    '冬瓜': { calories: 12, protein: 0.4, carbs: 2.6, fat: 0.2 },
    '茄子': { calories: 25, protein: 1, carbs: 6, fat: 0.1 },
    '豆腐': { calories: 81, protein: 8, carbs: 2, fat: 5 },
    '豆浆': { calories: 31, protein: 3, carbs: 1.2, fat: 1.6 },
    '黑豆': { calories: 381, protein: 36, carbs: 23, fat: 16 },
    '黄豆': { calories: 390, protein: 35, carbs: 34, fat: 16 },
    '绿豆': { calories: 329, protein: 22, carbs: 62, fat: 0.8 },
    '红豆': { calories: 324, protein: 21, carbs: 61, fat: 0.6 },
    '毛豆': { calories: 131, protein: 13, carbs: 10, fat: 5 },
    '豆干': { calories: 140, protein: 16, carbs: 5, fat: 6 },
    '腐竹': { calories: 461, protein: 45, carbs: 22, fat: 22 },
    '花生': { calories: 567, protein: 26, carbs: 16, fat: 49 },
    '杏仁': { calories: 578, protein: 21, carbs: 20, fat: 50 },
    '核桃': { calories: 654, protein: 15, carbs: 14, fat: 65 },
    '腰果': { calories: 553, protein: 18, carbs: 30, fat: 44 },
    '开心果': { calories: 562, protein: 20, carbs: 28, fat: 45 },
    '芝麻': { calories: 573, protein: 18, carbs: 23, fat: 49 },
    '葵花籽': { calories: 584, protein: 21, carbs: 20, fat: 51 },
    '南瓜籽': { calories: 559, protein: 30, carbs: 11, fat: 49 },
    '苹果': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
    '香蕉': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
    '橙子': { calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
    '葡萄': { calories: 69, protein: 0.7, carbs: 18, fat: 0.2 },
    '草莓': { calories: 32, protein: 0.7, carbs: 8, fat: 0.3 },
    '蓝莓': { calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
    '西瓜': { calories: 30, protein: 0.6, carbs: 8, fat: 0.2 },
    '芒果': { calories: 60, protein: 0.8, carbs: 15, fat: 0.4 },
    '梨': { calories: 57, protein: 0.4, carbs: 15, fat: 0.1 },
    '桃子': { calories: 39, protein: 0.9, carbs: 10, fat: 0.3 },
    '猕猴桃': { calories: 61, protein: 1.1, carbs: 15, fat: 0.5 },
    '柚子': { calories: 42, protein: 0.8, carbs: 11, fat: 0.1 },
    '火龙果': { calories: 50, protein: 1.1, carbs: 11, fat: 0.4 },
    '樱桃': { calories: 63, protein: 1.1, carbs: 16, fat: 0.2 },
    '牛油果': { calories: 160, protein: 2, carbs: 9, fat: 15 },
    '蛋白粉': { calories: 380, protein: 80, carbs: 5, fat: 3 },
    '乳清蛋白': { calories: 380, protein: 80, carbs: 5, fat: 3 },
    '酪蛋白': { calories: 370, protein: 75, carbs: 8, fat: 2 },
    '沙拉': { calories: 20, protein: 1, carbs: 4, fat: 0.2 },
    '炒饭': { calories: 186, protein: 5, carbs: 28, fat: 6 },
    '炒面': { calories: 220, protein: 7, carbs: 30, fat: 8 },
    '水饺': { calories: 220, protein: 8, carbs: 30, fat: 8 },
    '包子': { calories: 220, protein: 7, carbs: 35, fat: 6 },
    '油条': { calories: 386, protein: 8, carbs: 51, fat: 17 },
    '橄榄油': { calories: 884, protein: 0, carbs: 0, fat: 100 },
    '花生油': { calories: 884, protein: 0, carbs: 0, fat: 100 },
    '黄油': { calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
    '咖啡': { calories: 2, protein: 0.1, carbs: 0, fat: 0 },
    '绿茶': { calories: 1, protein: 0, carbs: 0, fat: 0 },
    '红茶': { calories: 1, protein: 0, carbs: 0, fat: 0 },
    '可乐': { calories: 42, protein: 0, carbs: 11, fat: 0 },
    '果汁': { calories: 45, protein: 0.5, carbs: 11, fat: 0.1 },
    '橙汁': { calories: 45, protein: 0.7, carbs: 10, fat: 0.2 }
};

function searchFood(foodName) {
    const normalizedName = foodName.trim().toLowerCase();
    for (const [name, data] of Object.entries(FoodDatabase)) {
        if (name.toLowerCase() === normalizedName) return { name, ...data };
    }
    for (const [name, data] of Object.entries(FoodDatabase)) {
        if (name.toLowerCase().includes(normalizedName) || normalizedName.includes(name.toLowerCase())) return { name, ...data };
    }
    return null;
}

function calculateNutrition(foodData, grams) {
    const ratio = grams / 100;
    return {
        name: foodData.name,
        grams: grams,
        calories: Math.round(foodData.calories * ratio),
        protein: Math.round(foodData.protein * ratio * 10) / 10,
        carbs: Math.round(foodData.carbs * ratio * 10) / 10,
        fat: Math.round(foodData.fat * ratio * 10) / 10
    };
}

// Make globally available
window.FoodDatabase = FoodDatabase;
window.searchFood = searchFood;
window.calculateNutrition = calculateNutrition;
