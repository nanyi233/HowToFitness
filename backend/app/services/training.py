"""
Training service: business logic for training records and exercises.
"""

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.training import TrainingRecord, Exercise


async def get_or_create_training_record(
    db: AsyncSession, user_id: int, date: str
) -> TrainingRecord:
    """Get existing training record for a date, or create a new one."""
    result = await db.execute(
        select(TrainingRecord)
        .options(selectinload(TrainingRecord.exercises))
        .where(TrainingRecord.user_id == user_id, TrainingRecord.date == date)
    )
    record = result.scalar_one_or_none()

    if record is None:
        record = TrainingRecord(
            user_id=user_id,
            date=date,
            duration=None,
        )
        db.add(record)
        await db.flush()
        await db.refresh(record, ["exercises"])

    return record


async def get_training_record(
    db: AsyncSession, user_id: int, date: str
) -> TrainingRecord | None:
    """Get training record for a specific date (with exercises eagerly loaded)."""
    result = await db.execute(
        select(TrainingRecord)
        .options(selectinload(TrainingRecord.exercises))
        .where(TrainingRecord.user_id == user_id, TrainingRecord.date == date)
    )
    return result.scalar_one_or_none()


async def add_exercise(
    db: AsyncSession, user_id: int, date: str,
    name: str, weight: float, sets: int, reps: int,
    volume: float, set_details: list[dict] | None = None,
) -> Exercise:
    """Add an exercise to the training record for the given date."""
    record = await get_or_create_training_record(db, user_id, date)

    exercise = Exercise(
        user_id=user_id,
        training_record_id=record.id,
        name=name,
        weight=weight,
        sets=sets,
        reps=reps,
        volume=volume,
        set_details=set_details,
    )
    db.add(exercise)
    await db.commit()
    await db.refresh(exercise)
    return exercise


async def delete_exercise(
    db: AsyncSession, user_id: int, exercise_id: int
) -> bool:
    """Delete an exercise. Returns True if deleted."""
    result = await db.execute(
        select(Exercise).where(
            Exercise.id == exercise_id,
            Exercise.user_id == user_id,
        )
    )
    exercise = result.scalar_one_or_none()

    if exercise is None:
        return False

    await db.delete(exercise)
    await db.commit()
    return True


async def update_duration(
    db: AsyncSession, user_id: int, date: str, duration: int
) -> TrainingRecord:
    """Set the training duration (minutes) for a date."""
    record = await get_or_create_training_record(db, user_id, date)
    record.duration = duration
    await db.commit()
    await db.refresh(record, ["exercises"])
    return record


async def get_recent_training_records(
    db: AsyncSession, user_id: int, limit: int = 7
) -> list[TrainingRecord]:
    """Get recent training records."""
    result = await db.execute(
        select(TrainingRecord)
        .options(selectinload(TrainingRecord.exercises))
        .where(TrainingRecord.user_id == user_id)
        .order_by(desc(TrainingRecord.date))
        .limit(limit)
    )
    return list(result.scalars().all())
