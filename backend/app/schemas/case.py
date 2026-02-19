import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.case import CaseStatus


class CaseCreate(BaseModel):
    title: str
    description: str | None = None
    status: CaseStatus = CaseStatus.open


class CaseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: CaseStatus | None = None


class CaseRead(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    title: str
    description: str | None
    status: CaseStatus
    lawyer_id: uuid.UUID | None
    client_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class CaseAssign(BaseModel):
    lawyer_id: uuid.UUID | None = None
    client_id: uuid.UUID | None = None
