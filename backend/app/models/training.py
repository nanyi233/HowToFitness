"""
Training-related models: TrainingRecord (daily) and Exercise (individual exercises).
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class TrainingRecord(Base):
    """One record per user per date, storing training session info."""
    __tablename__ = "training_records"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    date: Mapped[str] = mapped_column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)  # minutes
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="training_records")
    exercises: Mapped[list["Exercise"]] = relationship(back_populates="training_record", cascade="all, delete-orphan")


class Exercise(Base):
    """Individual exercise belonging to a TrainingRecord."""
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    training_record_id: Mapped[int] = mapped_column(ForeignKey("training_records.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    weight: Mapped[float] = mapped_column(Float, default=0)
    sets: Mapped[int] = mapped_column(Integer, default=0)
    reps: Mapped[int] = mapped_column(Integer, default=0)
    volume: Mapped[float] = mapped_column(Float, default=0)  # total weight × reps
    set_details: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # [{weight, reps}, ...]
    added_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="exercises")
    training_record: Mapped["TrainingRecord"] = relationship(back_populates="exercises")


