"""
Calculator service.
Contains business logic for input detection, training parsing,
BMI/BMR/TDEE calculation, and aerobic calorie calculation.
Migrated from frontend home.js, plan.js, aerobic.js, profile.js.
"""

import re
import math
from typing import Optional


# ── Input Classification Keywords ────────────────────────────────────

TRAINING_KEYWORDS = [
    "卧推", "深蹲", "硬拉", "推举", "划船", "弯举", "飞鸟", "夹胸",
    "引体", "俯卧撑", "臂屈伸", "腿举", "腿弯", "腿屈伸", "小腿",
    "侧平举", "前平举", "耸肩", "下拉", "坐姿", "站姿", "绳索",
    "bench", "squat", "deadlift", "press", "curl", "row", "pullup",
    "组", "次", "kg", "rep", "set", "自重",
    "练了", "练胸", "练背", "练腿", "练肩", "练臂", "练手",
    "有氧", "跑步", "跳绳", "椭圆", "游泳",
    "训练时长",
]

FOOD_KEYWORDS = [
    "吃", "喝", "早餐", "午餐", "晚餐", "加餐", "零食", "夜宵",
    "鸡", "牛", "猪", "鱼", "虾", "蛋", "奶", "豆", "米", "面",
    "饭", "粥", "汤", "菜", "肉", "水果", "蔬菜", "沙拉",
    "咖啡", "牛奶", "酸奶", "果汁", "茶",
    "克", "g", "两", "碗", "杯", "个", "片", "块", "根",
    "蛋白粉", "增肌粉", "燕麦", "香蕉", "苹果", "面包",
    "力训日", "休息日", "训练日",
]


def detect_input_type(message: str) -> str:
    """
    Detect whether user input is food or training related.
    Returns: 'food', 'training', or 'unknown'.
    Migrated from HomeModule.detectInputType in home.js.
    """
    lower = message.lower()

    # Strong regex signals for training
    if re.search(r"\d+\s*[kK][gG]", message):
        return "training"
    if re.search(r"\d+\s*[x×]\s*\d+", message):
        return "training"
    if "自重" in message:
        return "training"
    if re.search(r"\d+\s*组", message) or re.search(r"\d+\s*次", message):
        return "training"

    # Strong regex signal for food (grams without kg)
    if re.search(r"\d+\s*[gG克]", message) and not re.search(r"[kK][gG]", message):
        return "food"

    # Keyword scoring
    food_score = 0
    training_score = 0

    for k in FOOD_KEYWORDS:
        kl = k.lower()
        if kl == "g":
            continue
        if kl in lower:
            food_score += 1

    for k in TRAINING_KEYWORDS:
        kl = k.lower()
        if kl == "kg":
            continue
        if kl in lower:
            training_score += 1

    if training_score > 0 and food_score == 0:
        return "training"
    if food_score > 0 and training_score == 0:
        return "food"
    if training_score >= food_score + 1:
        return "training"
    if food_score >= training_score + 1:
        return "food"

    return "unknown"


# ── Local Training Parse ─────────────────────────────────────────────

def generate_set_details(weight: float, sets: int, reps: int) -> list[dict]:
    """Generate set_details array: [{weight, reps}, ...]."""
    return [{"weight": weight, "reps": reps} for _ in range(sets)]


def try_local_training_parse(message: str) -> Optional[dict]:
    """
    Try to parse training input locally using regex patterns.
    Returns dict with name, weight, sets, reps, setDetails or None.
    Migrated from HomeModule.tryLocalTrainingParse and TrainingModule.tryLocalParse.
    """
    patterns = [
        # Pattern 1: "卧推 60kg 4组8个"
        r"^(.+?)\s+(\d+(?:\.\d+)?)\s*[kK][gG]\s+(\d+)\s*[组x×]\s*(\d+)\s*[个次reps]?$",
        # Pattern 2: "卧推 60 4x8"
        r"^(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+)\s*[x×]\s*(\d+)$",
        # Pattern 3: "引体向上 自重 3组10个"
        r"^(.+?)\s+自重\s+(\d+)\s*[组x×]\s*(\d+)\s*[个次reps]?$",
    ]

    for i, pattern in enumerate(patterns):
        match = re.match(pattern, message)
        if match:
            if i == 2:  # Bodyweight pattern
                name = match.group(1).strip()
                sets = int(match.group(2))
                reps = int(match.group(3))
                return {
                    "name": name,
                    "weight": 0,
                    "sets": sets,
                    "reps": reps,
                    "set_details": generate_set_details(0, sets, reps),
                }
            else:
                name = match.group(1).strip()
                weight = float(match.group(2))
                sets = int(match.group(3))
                reps = int(match.group(4))
                return {
                    "name": name,
                    "weight": weight,
                    "sets": sets,
                    "reps": reps,
                    "set_details": generate_set_details(weight, sets, reps),
                }

    return None


# ── BMI / BMR / TDEE / Macro Calculation ─────────────────────────────

def calculate_plan(
    gender: str,
    height_cm: float,
    weight_kg: float,
    age: int,
    training_level: str,
    aerobic_calories: float = 0,
) -> dict:
    """
    Calculate BMI, BMR, TDEE, calorie balance, and macros.
    Migrated from ProfileModule.calculatePlan in profile.js.

    Args:
        gender: 'male' or 'female'
        height_cm: height in cm
        weight_kg: weight in kg
        age: age in years
        training_level: 'beginner', 'intermediate', or 'advanced'
        aerobic_calories: daily average aerobic calorie burn

    Returns:
        dict with all calculated values
    """
    height_m = height_cm / 100
    bmi = weight_kg / (height_m * height_m)

    # Mifflin-St Jeor BMR
    if gender == "male":
        bmr = weight_kg * 9.99 + height_cm * 6.25 - age * 4.92 + 5
    else:
        bmr = weight_kg * 9.99 + height_cm * 6.25 - age * 4.92 - 161

    tdee = bmr / 0.7

    training_calories_map = {
        "male": {"beginner": 150, "intermediate": 200, "advanced": 250},
        "female": {"beginner": 100, "intermediate": 150, "advanced": 200},
    }
    training_calories = training_calories_map.get(gender, {}).get(training_level, 150)

    balance_training = tdee + training_calories + aerobic_calories
    balance_rest = tdee + aerobic_calories
    intake_training = balance_training * 0.64
    intake_rest = balance_rest * 0.64

    carb_training = weight_kg * 2.6
    carb_rest = weight_kg * 2.1
    protein = weight_kg * 1.4
    fat = 70 if gender == "male" and weight_kg >= 120 else (60 if gender == "male" else 50)

    return {
        "bmi": round(bmi, 1),
        "bmr": round(bmr),
        "tdee": round(tdee),
        "training_calories": training_calories,
        "balance_training": round(balance_training),
        "balance_rest": round(balance_rest),
        "intake_training": round(intake_training),
        "intake_rest": round(intake_rest),
        "carb_training": round(carb_training),
        "carb_rest": round(carb_rest),
        "protein": round(protein),
        "fat": fat,
    }


# ── Aerobic Calorie Calculation ──────────────────────────────────────

# Exercise data: { category: { icon, levels: [{ name, perKg, note }] } }
EXERCISE_DATA = {
    "平地走": {
        "icon": "🚶",
        "levels": [
            {"name": "每走一万步", "perKg": 3.8, "note": "约1小时"},
            {"name": "每走一小时", "perKg": 3.8, "note": ""},
        ],
    },
    "爬坡走": {
        "icon": "⛰️",
        "levels": [
            {"name": "坡度5°（一般选择）", "perKg": 5.5, "note": ""},
            {"name": "坡度10°（很累）", "perKg": 8.0, "note": ""},
        ],
    },
    "跑步": {
        "icon": "🏃",
        "levels": [
            {"name": "速度6km/h", "perKg": 5.5, "note": "慢跑"},
            {"name": "速度7km/h", "perKg": 7.2, "note": ""},
            {"name": "速度8km/h", "perKg": 9.5, "note": ""},
            {"name": "速度9km/h", "perKg": 9.6, "note": ""},
            {"name": "速度10km/h", "perKg": 9.8, "note": ""},
            {"name": "速度12km/h", "perKg": 10.1, "note": ""},
            {"name": "速度13km/h", "perKg": 10.1, "note": ""},
            {"name": "速度14km/h", "perKg": 10.4, "note": ""},
            {"name": "速度15km/h", "perKg": 10.9, "note": ""},
            {"name": "速度16km/h", "perKg": 12.7, "note": "快跑"},
        ],
    },
    "户外骑行": {
        "icon": "🚴",
        "levels": [
            {"name": "速度10km/h", "perKg": 3.6, "note": "通勤"},
            {"name": "速度12km/h", "perKg": 3.9, "note": "通勤"},
            {"name": "速度13km/h", "perKg": 4.4, "note": "通勤"},
            {"name": "速度15km/h", "perKg": 5.5, "note": "通勤"},
            {"name": "速度18km/h", "perKg": 6.5, "note": "通勤"},
            {"name": "速度27km/h", "perKg": 7.5, "note": "专业"},
            {"name": "速度31km/h", "perKg": 10.0, "note": "专业"},
            {"name": "速度34km/h", "perKg": 12.0, "note": "专业"},
        ],
    },
    "室内单车": {
        "icon": "🚲",
        "levels": [
            {"name": "功率50-90W", "perKg": 4.8, "note": "轻松"},
            {"name": "功率90-100W", "perKg": 6.8, "note": ""},
            {"name": "功率100-160W", "perKg": 8.8, "note": ""},
            {"name": "功率160-200W", "perKg": 11.0, "note": ""},
            {"name": "功率200-270W", "perKg": 14.0, "note": "剧烈"},
        ],
    },
    "游泳": {
        "icon": "🏊",
        "levels": [
            {"name": "速度1km/h", "perKg": 4.2, "note": "休闲"},
            {"name": "速度2km/h", "perKg": 7.7, "note": ""},
            {"name": "速度3km/h", "perKg": 9.2, "note": "快速"},
        ],
    },
    "球类运动": {
        "icon": "⚽",
        "levels": [
            {"name": "篮球", "perKg": 6.1, "note": ""},
            {"name": "足球", "perKg": 7.0, "note": ""},
            {"name": "排球", "perKg": 4.1, "note": ""},
            {"name": "网球", "perKg": 8.9, "note": ""},
            {"name": "乒乓球", "perKg": 6.6, "note": ""},
            {"name": "羽毛球", "perKg": 7.4, "note": ""},
        ],
    },
    "跳操跟练": {
        "icon": "💃",
        "levels": [
            {"name": "轻松强度", "perKg": 2.3, "note": ""},
            {"name": "中等强度", "perKg": 4.0, "note": ""},
            {"name": "剧烈强度", "perKg": 6.0, "note": ""},
        ],
    },
    "室内其他": {
        "icon": "🧘",
        "levels": [
            {"name": "瑜伽", "perKg": 3.1, "note": ""},
            {"name": "舞蹈", "perKg": 5.0, "note": ""},
            {"name": "椭圆仪", "perKg": 5.0, "note": ""},
            {"name": "普拉提", "perKg": 3.0, "note": ""},
            {"name": "健身环", "perKg": 5.0, "note": ""},
        ],
    },
    "爬楼": {
        "icon": "🪜",
        "levels": [
            {"name": "上楼", "perKg": 8.0, "note": "90步/分钟"},
            {"name": "下楼", "perKg": 3.1, "note": ""},
        ],
    },
    "划船机": {
        "icon": "🚣",
        "levels": [
            {"name": "功率100W", "perKg": 7.0, "note": ""},
            {"name": "功率150W", "perKg": 8.5, "note": ""},
            {"name": "功率200W", "perKg": 12.0, "note": ""},
        ],
    },
    "拳击": {
        "icon": "🥊",
        "levels": [
            {"name": "打沙袋", "perKg": 5.5, "note": ""},
            {"name": "真人格斗", "perKg": 7.8, "note": ""},
        ],
    },
    "跳绳": {
        "icon": "🪢",
        "levels": [
            {"name": "<100次/分钟", "perKg": 8.8, "note": "慢速"},
            {"name": "100-120次/分钟", "perKg": 11.8, "note": ""},
            {"name": "120-160次/分钟", "perKg": 12.3, "note": "快速"},
        ],
    },
}


def calculate_aerobic_calories(weight_kg: float, per_kg: float) -> int:
    """
    Calculate hourly aerobic calorie burn.
    Applies reduction factor for weight > 80kg.
    Migrated from calculateAerobicCalories in profile.js.
    """
    base = weight_kg * per_kg
    if weight_kg > 80:
        excess = weight_kg - 80
        steps = int(excess / 5)
        factor = 0.97 ** steps
        base = base * factor
    return round(base)


def calculate_aerobic(
    weight_kg: float,
    category: str,
    level_index: int,
    hours: float,
    minutes: float,
    frequency: int,
) -> Optional[dict]:
    """
    Calculate aerobic exercise calories.
    Migrated from ProfileModule.calculateAerobic in profile.js.

    Returns dict with hourly_calories, single_calories, weekly_calories, daily_avg_calories
    or None if invalid input.
    """
    if category not in EXERCISE_DATA:
        return None

    exercise = EXERCISE_DATA[category]
    if level_index < 0 or level_index >= len(exercise["levels"]):
        return None

    level = exercise["levels"][level_index]
    total_hours = hours + minutes / 60

    hourly_calories = calculate_aerobic_calories(weight_kg, level["perKg"])
    single_calories = round(hourly_calories * total_hours)
    weekly_calories = single_calories * frequency
    daily_avg_calories = round(weekly_calories / 7)

    return {
        "hourly_calories": hourly_calories,
        "single_calories": single_calories,
        "weekly_calories": weekly_calories,
        "daily_avg_calories": daily_avg_calories,
    }


def get_exercise_categories() -> list[dict]:
    """Return all exercise categories with their levels."""
    result = []
    for name, data in EXERCISE_DATA.items():
        result.append({
            "name": name,
            "icon": data["icon"],
            "levels": data["levels"],
        })
    return result
