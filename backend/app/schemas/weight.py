"""
Weight-related Pydantic schemas for request/response validation.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class WeightCreate(BaseModel):
    """Request body for adding or updating a weight record."""
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Date in YYYY-MM-DD format")
    weight: float = Field(..., gt=0, le=500, description="Body weight in kg")


class WeightResponse(BaseModel):
    """Response schema for a single weight record."""
    id: int
    date: str
    weight: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
