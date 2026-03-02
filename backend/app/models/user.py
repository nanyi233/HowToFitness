"""
User model for authentication and data ownership.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.diet import DietRecord, Food
    from app.models.weight import WeightRecord
    from app.models.training import TrainingRecord, Exercise
    from app.models.chat import ChatMessage
    from app.models.settings import UserSettings, UserProfile


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships (use string refs to avoid circular imports)
    diet_records: Mapped[list["DietRecord"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    foods: Mapped[list["Food"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    weight_records: Mapped[list["WeightRecord"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    training_records: Mapped[list["TrainingRecord"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    exercises: Mapped[list["Exercise"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    chat_messages: Mapped[list["ChatMessage"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    settings: Mapped["UserSettings"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    profile: Mapped["UserProfile"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
