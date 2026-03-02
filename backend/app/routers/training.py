"""
Training routes: CRUD for daily training records and exercises.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.training import (
    DurationUpdate,
    ExerciseCreate,
    ExerciseResponse,
    TrainingRecordResponse,
    TrainingRecordSummary,
)
from app.services.training import (
    add_exercise,
    delete_exercise,
    get_or_create_training_record,
    get_recent_training_records,
    get_training_record,
    update_duration,
)

router = APIRouter(prefix="/api/training", tags=["training"])


def _build_training_response(record) -> TrainingRecordResponse:
    """Helper to build a TrainingRecordResponse from a TrainingRecord model."""
    return TrainingRecordResponse(
        date=record.date,
        duration=record.duration,
        exercises=[ExerciseResponse.model_validate(e) for e in record.exercises],
    )


@router.get("/recent", response_model=list[TrainingRecordSummary])
async def get_recent(
    limit: int = Query(7, ge=1, le=90, description="Number of records"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recent training records (summary)."""
    records = await get_recent_training_records(db, current_user.id, limit)
    return [
        TrainingRecordSummary(
            date=r.date,
            duration=r.duration,
            exercise_count=len(r.exercises),
        )
        for r in records
    ]


@router.get("/{date}", response_model=TrainingRecordResponse)
async def get_training_by_date(
    date: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get training record for a specific date."""
    record = await get_training_record(db, current_user.id, date)

    if record is None:
        # Return empty record instead of 404
        return TrainingRecordResponse(date=date, duration=None, exercises=[])

    return _build_training_response(record)


@router.post("/{date}/exercises", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
async def create_exercise(
    date: str,
    exercise: ExerciseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add an exercise to the training record for the given date."""
    new_exercise = await add_exercise(
        db,
        user_id=current_user.id,
        date=date,
        name=exercise.name,
        weight=exercise.weight,
        sets=exercise.sets,
        reps=exercise.reps,
        volume=exercise.volume,
        set_details=exercise.set_details,
    )
    return ExerciseResponse.model_validate(new_exercise)


@router.delete("/{date}/exercises/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_exercise(
    date: str,
    exercise_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an exercise from the training record."""
    deleted = await delete_exercise(db, current_user.id, exercise_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )


@router.put("/{date}/duration", response_model=TrainingRecordResponse)
async def set_duration(
    date: str,
    body: DurationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set the training duration (minutes) for a specific date."""
    record = await update_duration(db, current_user.id, date, body.duration)
    return _build_training_response(record)
