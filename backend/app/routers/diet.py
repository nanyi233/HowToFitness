"""
Diet routes: CRUD for daily diet records and food items.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.diet import (
    DayTypeUpdate,
    DietRecordResponse,
    DietRecordSummary,
    FoodCreate,
    FoodResponse,
    NutritionTotals,
)
from app.services.diet import (
    add_food,
    delete_food,
    get_diet_record,
    get_or_create_diet_record,
    get_recent_diet_records,
    update_day_type,
)

router = APIRouter(prefix="/api/diet", tags=["diet"])


def _build_diet_response(record) -> DietRecordResponse:
    """Helper to build a DietRecordResponse from a DietRecord model."""
    return DietRecordResponse(
        date=record.date,
        day_type=record.day_type,
        foods=[FoodResponse.model_validate(f) for f in record.foods],
        totals=NutritionTotals(
            calories=record.total_calories,
            protein=record.total_protein,
            carbs=record.total_carbs,
            fat=record.total_fat,
        ),
    )


# NOTE: /recent MUST be defined before /{date} to avoid path parameter capture.
@router.get("/recent", response_model=list[DietRecordSummary])
async def get_recent(
    day_type: str | None = Query(None, alias="type", description="Filter by day type"),
    limit: int = Query(7, ge=1, le=90, description="Number of records"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recent diet records (summary)."""
    records = await get_recent_diet_records(db, current_user.id, day_type, limit)
    return [
        DietRecordSummary(
            date=r.date,
            day_type=r.day_type,
            totals=NutritionTotals(
                calories=r.total_calories,
                protein=r.total_protein,
                carbs=r.total_carbs,
                fat=r.total_fat,
            ),
            food_count=len(r.foods),
        )
        for r in records
    ]


@router.get("/{date}", response_model=DietRecordResponse)
async def get_diet_by_date(
    date: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get diet record for a specific date."""
    record = await get_diet_record(db, current_user.id, date)

    if record is None:
        # Return empty record instead of 404
        return DietRecordResponse(
            date=date,
            day_type="training",
            foods=[],
            totals=NutritionTotals(),
        )

    return _build_diet_response(record)


@router.post("/{date}/foods", response_model=FoodResponse, status_code=status.HTTP_201_CREATED)
async def create_food(
    date: str,
    food: FoodCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a food item to the diet record for the given date."""
    new_food = await add_food(
        db,
        user_id=current_user.id,
        date=date,
        name=food.name,
        amount=food.amount,
        unit=food.unit,
        calories=food.calories,
        protein=food.protein,
        carbs=food.carbs,
        fat=food.fat,
    )
    return FoodResponse.model_validate(new_food)


@router.delete("/{date}/foods/{food_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_food(
    date: str,
    food_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a food item from the diet record."""
    deleted = await delete_food(db, current_user.id, date, food_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food item not found",
        )


@router.put("/{date}/day-type", response_model=DietRecordResponse)
async def set_day_type(
    date: str,
    body: DayTypeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set the day type (training/rest) for a specific date."""
    record = await update_day_type(db, current_user.id, date, body.day_type)
    return _build_diet_response(record)
