import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.document import DocumentStatus


class DocumentRead(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    case_id: uuid.UUID
    filename: str
    original_filename: str
    mime_type: str
    file_size: int
    status: DocumentStatus
    ai_summary: str | None
    ai_key_points: str | None
    created_at: datetime
    updated_at: datetime


class AnalysisResult(BaseModel):
    summary: str
    key_points: list[str]
