"""
Pydantic schemas for calculator and food database endpoints.
"""

from pydantic import BaseModel, Field


# ── Food Database Schemas ────────────────────────────────────────────

class FoodSearchRequest(BaseModel):
    food_name: str = Field(..., min_length=1, max_length=100, description="Food name to search")


class NutritionCalcRequest(BaseModel):
    food_name: str = Field(..., min_length=1, max_length=100, description="Food name")
    grams: float = Field(..., gt=0, description="Amount in grams")


class FoodInfo(BaseModel):
    name: str
    calories: float
    protein: float
    carbs: float
    fat: float


class NutritionResult(BaseModel):
    name: str
    grams: float
    calories: int
    protein: float
    carbs: float
    fat: float


# ── Input Detection Schemas ──────────────────────────────────────────

class DetectInputRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User input message")


class DetectInputResponse(BaseModel):
    type: str = Field(..., description="Detected type: 'food', 'training', or 'unknown'")


# ── Training Parse Schemas ───────────────────────────────────────────

class ParseTrainingRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Training input message")


class SetDetail(BaseModel):
    weight: float
    reps: int


class ParsedExercise(BaseModel):
    name: str
    weight: float
    sets: int
    reps: int
    set_details: list[SetDetail] = []


class ParseTrainingResponse(BaseModel):
    success: bool
    exercise: ParsedExercise | None = None


# ── Plan Calculator Schemas ──────────────────────────────────────────

class PlanCalcRequest(BaseModel):
    gender: str = Field(..., pattern="^(male|female)$", description="Gender: male or female")
    height_cm: float = Field(..., gt=50, lt=300, description="Height in cm")
    weight_kg: float = Field(..., gt=20, lt=500, description="Weight in kg")
    age: int = Field(..., gt=0, lt=150, description="Age in years")
    training_level: str = Field(..., pattern="^(beginner|intermediate|advanced)$", description="Training level")
    aerobic_calories: float = Field(default=0, ge=0, description="Daily avg aerobic calorie burn")


class PlanCalcResponse(BaseModel):
    bmi: float
    bmr: int
    tdee: int
    training_calories: int
    balance_training: int
    balance_rest: int
    intake_training: int
    intake_rest: int
    carb_training: int
    carb_rest: int
    protein: int
    fat: int


# ── Aerobic Calculator Schemas ───────────────────────────────────────

class AerobicCalcRequest(BaseModel):
    weight_kg: float = Field(..., gt=20, lt=500, description="Weight in kg")
    category: str = Field(..., min_length=1, description="Exercise category name")
    level_index: int = Field(..., ge=0, description="Level index within category")
    hours: float = Field(default=0, ge=0, description="Duration hours")
    minutes: float = Field(default=0, ge=0, description="Duration minutes")
    frequency: int = Field(..., ge=1, le=14, description="Times per week")


class AerobicCalcResponse(BaseModel):
    hourly_calories: int
    single_calories: int
    weekly_calories: int
    daily_avg_calories: int


class ExerciseLevel(BaseModel):
    name: str
    perKg: float
    note: str


class ExerciseCategory(BaseModel):
    name: str
    icon: str
    levels: list[ExerciseLevel]
