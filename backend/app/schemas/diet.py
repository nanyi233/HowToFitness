"""
Diet-related Pydantic schemas for request/response validation.
"""

from datetime import datetime

from pydantic import BaseModel, Field


# ── Food ──────────────────────────────────────────────────────────────

class FoodCreate(BaseModel):
    """Request body for adding a food item."""
    name: str = Field(..., min_length=1, max_length=200, description="Food name")
    amount: float = Field(0, ge=0, description="Amount in given unit")
    unit: str = Field("g", max_length=20, description="Unit (g, ml, piece, etc.)")
    calories: float = Field(0, ge=0, description="Calories (kcal)")
    protein: float = Field(0, ge=0, description="Protein (g)")
    carbs: float = Field(0, ge=0, description="Carbohydrates (g)")
    fat: float = Field(0, ge=0, description="Fat (g)")


class FoodResponse(BaseModel):
    """Response schema for a single food item."""
    id: int
    name: str
    amount: float
    unit: str
    calories: float
    protein: float
    carbs: float
    fat: float
    added_at: datetime

    model_config = {"from_attributes": True}


# ── Totals ────────────────────────────────────────────────────────────

class NutritionTotals(BaseModel):
    """Aggregated nutrition totals for a day."""
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0


# ── DietRecord ────────────────────────────────────────────────────────

class DayTypeUpdate(BaseModel):
    """Request body for updating the day type."""
    day_type: str = Field(..., pattern=r"^(training|rest)$", description="Day type: training or rest")


class DietRecordResponse(BaseModel):
    """Full diet record for a single date."""
    date: str
    day_type: str
    foods: list[FoodResponse] = []
    totals: NutritionTotals = NutritionTotals()

    model_config = {"from_attributes": True}


class DietRecordSummary(BaseModel):
    """Summary of a diet record (for recent records list)."""
    date: str
    day_type: str
    totals: NutritionTotals = NutritionTotals()
    food_count: int = 0

    model_config = {"from_attributes": True}
