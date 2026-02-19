import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.chat_message import MessageRole


class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageRead(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    case_id: uuid.UUID
    user_id: uuid.UUID | None
    role: MessageRole
    content: str
    created_at: datetime
    updated_at: datetime
