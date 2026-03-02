"""
Pydantic schemas for AI parsing endpoints.
"""

from pydantic import BaseModel, Field


# ── Request ─────────────────────────────────────────────────────────

class AIParseRequest(BaseModel):
    """Common request body for AI parsing endpoints."""
    prompt: str = Field(..., min_length=1, max_length=2000, description="Natural-language input to parse")


# ── Food response ───────────────────────────────────────────────────

class FoodPer100g(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float


class FoodParseSuccess(BaseModel):
    success: bool = True
    food_name: str
    grams: float
    per_100g: FoodPer100g


class FoodParseError(BaseModel):
    success: bool = False
    error: str


# ── Training response ──────────────────────────────────────────────

class SetDetail(BaseModel):
    weight: float
    reps: int


class ExerciseItem(BaseModel):
    name: str
    weight: float
    sets: int
    reps: int
    set_details: list[SetDetail] = []


class TrainingParseSuccess(BaseModel):
    success: bool = True
    exercises: list[ExerciseItem] = []
    duration: int | None = None


class TrainingParseError(BaseModel):
    success: bool = False
    error: str
