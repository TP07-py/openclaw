import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.chat_message import ChatMessage, MessageRole
from app.schemas.chat import ChatMessageCreate, ChatMessageRead
from app.services.case_service import assert_case_access, get_case_or_404
from app.services.claude_service import chat_with_claude
from app.utils.exceptions import not_found

router = APIRouter(prefix="/cases/{case_id}/chat", tags=["chat"])


@router.post("", response_model=list[ChatMessageRead], status_code=status.HTTP_201_CREATED)
async def send_message(
    case_id: uuid.UUID,
    body: ChatMessageCreate,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    case = await get_case_or_404(session, case_id)
    assert_case_access(case, current_user)

    # Save user message
    user_msg = ChatMessage(
        case_id=case_id,
        user_id=current_user.id,
        role=MessageRole.user,
        content=body.content,
    )
    session.add(user_msg)
    await session.flush()

    # Load last 20 messages for context
    history_result = await session.execute(
        select(ChatMessage)
        .where(ChatMessage.case_id == case_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(20)
    )
    history = list(reversed(history_result.scalars().all()))

    messages = [{"role": msg.role.value, "content": msg.content} for msg in history]

    # Get AI response
    ai_content = await chat_with_claude(messages)

    ai_msg = ChatMessage(
        case_id=case_id,
        user_id=None,
        role=MessageRole.assistant,
        content=ai_content,
    )
    session.add(ai_msg)
    await session.flush()
    await session.refresh(user_msg)
    await session.refresh(ai_msg)
    return [user_msg, ai_msg]


@router.get("", response_model=list[ChatMessageRead])
async def list_messages(
    case_id: uuid.UUID,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    case = await get_case_or_404(session, case_id)
    assert_case_access(case, current_user)
    result = await session.execute(
        select(ChatMessage)
        .where(ChatMessage.case_id == case_id)
        .order_by(ChatMessage.created_at.asc())
    )
    return list(result.scalars().all())


@router.delete("/{msg_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    case_id: uuid.UUID,
    msg_id: uuid.UUID,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    case = await get_case_or_404(session, case_id)
    assert_case_access(case, current_user)
    result = await session.execute(
        select(ChatMessage).where(ChatMessage.id == msg_id, ChatMessage.case_id == case_id)
    )
    msg = result.scalar_one_or_none()
    if msg is None:
        raise not_found("Message")
    await session.delete(msg)
