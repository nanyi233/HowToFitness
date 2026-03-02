"""
Weight service: business logic for body weight records.
"""

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.weight import WeightRecord


async def get_weight_records(
    db: AsyncSession, user_id: int
) -> list[WeightRecord]:
    """Get all weight records for a user, ordered by date descending."""
    result = await db.execute(
        select(WeightRecord)
        .where(WeightRecord.user_id == user_id)
        .order_by(desc(WeightRecord.date))
    )
    return list(result.scalars().all())


async def add_or_update_weight(
    db: AsyncSession, user_id: int, date: str, weight: float
) -> WeightRecord:
    """Add a new weight record, or update if one already exists for the date."""
    result = await db.execute(
        select(WeightRecord).where(
            WeightRecord.user_id == user_id,
            WeightRecord.date == date,
        )
    )
    record = result.scalar_one_or_none()

    if record is not None:
        record.weight = weight
    else:
        record = WeightRecord(user_id=user_id, date=date, weight=weight)
        db.add(record)

    await db.commit()
    await db.refresh(record)
    return record


async def get_recent_weight_records(
    db: AsyncSession, user_id: int, limit: int = 30
) -> list[WeightRecord]:
    """Get recent weight records."""
    result = await db.execute(
        select(WeightRecord)
        .where(WeightRecord.user_id == user_id)
        .order_by(desc(WeightRecord.date))
        .limit(limit)
    )
    return list(result.scalars().all())
