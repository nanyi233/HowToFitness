"""
Diet service: business logic for diet records and food items.
"""

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.diet import DietRecord, Food


async def get_or_create_diet_record(
    db: AsyncSession, user_id: int, date: str
) -> DietRecord:
    """Get existing diet record for a date, or create a new one."""
    result = await db.execute(
        select(DietRecord)
        .options(selectinload(DietRecord.foods))
        .where(DietRecord.user_id == user_id, DietRecord.date == date)
    )
    record = result.scalar_one_or_none()

    if record is None:
        record = DietRecord(
            user_id=user_id,
            date=date,
            day_type="training",
            total_calories=0,
            total_protein=0,
            total_carbs=0,
            total_fat=0,
        )
        db.add(record)
        await db.flush()
        await db.refresh(record, ["foods"])

    return record


async def get_diet_record(
    db: AsyncSession, user_id: int, date: str
) -> DietRecord | None:
    """Get diet record for a specific date (with foods eagerly loaded)."""
    result = await db.execute(
        select(DietRecord)
        .options(selectinload(DietRecord.foods))
        .where(DietRecord.user_id == user_id, DietRecord.date == date)
    )
    return result.scalar_one_or_none()


async def add_food(
    db: AsyncSession, user_id: int, date: str,
    name: str, amount: float, unit: str,
    calories: float, protein: float, carbs: float, fat: float,
) -> Food:
    """Add a food item to the diet record for the given date."""
    record = await get_or_create_diet_record(db, user_id, date)

    food = Food(
        user_id=user_id,
        diet_record_id=record.id,
        name=name,
        amount=amount,
        unit=unit,
        calories=calories,
        protein=protein,
        carbs=carbs,
        fat=fat,
    )
    db.add(food)

    # Update totals
    record.total_calories += calories
    record.total_protein += protein
    record.total_carbs += carbs
    record.total_fat += fat

    await db.commit()
    await db.refresh(food)
    return food


async def delete_food(
    db: AsyncSession, user_id: int, date: str, food_id: int
) -> bool:
    """Delete a food item and update totals. Returns True if deleted."""
    result = await db.execute(
        select(Food).where(
            Food.id == food_id,
            Food.user_id == user_id,
        )
    )
    food = result.scalar_one_or_none()

    if food is None:
        return False

    # Get the parent record to update totals
    record = await get_or_create_diet_record(db, user_id, date)
    record.total_calories = max(0, record.total_calories - food.calories)
    record.total_protein = max(0, record.total_protein - food.protein)
    record.total_carbs = max(0, record.total_carbs - food.carbs)
    record.total_fat = max(0, record.total_fat - food.fat)

    await db.delete(food)
    await db.commit()
    return True


async def update_day_type(
    db: AsyncSession, user_id: int, date: str, day_type: str
) -> DietRecord:
    """Set the day type (training/rest) for a date."""
    record = await get_or_create_diet_record(db, user_id, date)
    record.day_type = day_type
    await db.commit()
    await db.refresh(record, ["foods"])
    return record


async def get_recent_diet_records(
    db: AsyncSession, user_id: int, day_type: str | None = None, limit: int = 7
) -> list[DietRecord]:
    """Get recent diet records, optionally filtered by day type."""
    query = (
        select(DietRecord)
        .options(selectinload(DietRecord.foods))
        .where(DietRecord.user_id == user_id)
        .order_by(desc(DietRecord.date))
        .limit(limit)
    )

    if day_type is not None:
        query = query.where(DietRecord.day_type == day_type)

    result = await db.execute(query)
    return list(result.scalars().all())
