"""
Training-related Pydantic schemas for request/response validation.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ── Exercise ──────────────────────────────────────────────────────────

class ExerciseCreate(BaseModel):
    """Request body for adding an exercise."""
    name: str = Field(..., min_length=1, max_length=200, description="Exercise name")
    weight: float = Field(0, ge=0, description="Weight used (kg)")
    sets: int = Field(0, ge=0, description="Number of sets")
    reps: int = Field(0, ge=0, description="Number of reps per set")
    volume: float = Field(0, ge=0, description="Total volume (weight × reps × sets)")
    set_details: list[dict[str, Any]] | None = Field(
        None, description="Detailed set info, e.g. [{'weight': 60, 'reps': 10}, ...]"
    )


class ExerciseResponse(BaseModel):
    """Response schema for a single exercise."""
    id: int
    name: str
    weight: float
    sets: int
    reps: int
    volume: float
    set_details: list[dict[str, Any]] | None = None
    added_at: datetime

    model_config = {"from_attributes": True}


# ── TrainingRecord ────────────────────────────────────────────────────

class DurationUpdate(BaseModel):
    """Request body for updating training duration."""
    duration: int = Field(..., ge=0, description="Training duration in minutes")


class TrainingRecordResponse(BaseModel):
    """Full training record for a single date."""
    date: str
    duration: int | None = None
    exercises: list[ExerciseResponse] = []

    model_config = {"from_attributes": True}


class TrainingRecordSummary(BaseModel):
    """Summary of a training record (for recent records list)."""
    date: str
    duration: int | None = None
    exercise_count: int = 0

    model_config = {"from_attributes": True}
