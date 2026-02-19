import enum
import uuid

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class UserRole(str, enum.Enum):
    admin = "admin"
    lawyer = "lawyer"
    client = "client"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), nullable=False, default=UserRole.client
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    lawyer_cases: Mapped[list["Case"]] = relationship(  # noqa: F821
        "Case", back_populates="lawyer", foreign_keys="Case.lawyer_id"
    )
    client_cases: Mapped[list["Case"]] = relationship(  # noqa: F821
        "Case", back_populates="client", foreign_keys="Case.client_id"
    )
