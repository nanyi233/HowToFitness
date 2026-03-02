"""
Pydantic schemas for AI parsing endpoints.
"""

from pydantic import BaseModel, Field


# ── Request ─────────────────────────────────────────────────────────

class ChatMessageItem(BaseModel):
    """A single message in the conversation history."""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class AIParseRequest(BaseModel):
    """Common request body for AI parsing endpoints."""
    prompt: str = Field(..., min_length=1, max_length=2000, description="Natural-language input to parse")
    messages: list[ChatMessageItem] = Field(default=[], description="Conversation history for multi-turn context")


# ── Food response ───────────────────────────────────────────────────

class FoodPer100g(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float


class FoodItem(BaseModel):
    """A single food entry parsed by AI."""
    food_name: str
    grams: float
    per_100g: FoodPer100g


class FoodParseSuccess(BaseModel):
    success: bool = True
    foods: list[FoodItem] = Field(default=[], description="List of parsed food items")


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
