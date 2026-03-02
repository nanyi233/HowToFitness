"""
User settings and profile models.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Float, Integer, Text, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class UserSettings(Base):
    """User-specific settings (e.g., default day type)."""
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False, index=True)
    default_day_type: Mapped[str] = mapped_column(String(20), default="training")
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="settings")


class UserProfile(Base):
    """User profile including plan data and aerobic data."""
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False, index=True)

    # Basic info
    gender: Mapped[str | None] = mapped_column(String(10), nullable=True)
    height: Mapped[float | None] = mapped_column(Float, nullable=True)
    weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Plan data (stored as JSON for flexibility)
    plan_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Aerobic data (stored as JSON for flexibility)
    aerobic_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Extra profile fields
    extra: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="profile")


