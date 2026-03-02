"""
Weight routes: CRUD for body weight records.
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.weight import WeightCreate, WeightResponse
from app.services.weight import (
    add_or_update_weight,
    get_recent_weight_records,
    get_weight_records,
)

router = APIRouter(prefix="/api/weight", tags=["weight"])


@router.get("", response_model=list[WeightResponse])
async def list_weights(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all weight records for the current user."""
    records = await get_weight_records(db, current_user.id)
    return [WeightResponse.model_validate(r) for r in records]


@router.post("", response_model=WeightResponse, status_code=status.HTTP_201_CREATED)
async def create_or_update_weight(
    body: WeightCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add or update a weight record. If a record already exists for the date, it will be updated."""
    record = await add_or_update_weight(db, current_user.id, body.date, body.weight)
    return WeightResponse.model_validate(record)


@router.get("/recent", response_model=list[WeightResponse])
async def get_recent(
    limit: int = Query(30, ge=1, le=365, description="Number of records"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recent weight records."""
    records = await get_recent_weight_records(db, current_user.id, limit)
    return [WeightResponse.model_validate(r) for r in records]
