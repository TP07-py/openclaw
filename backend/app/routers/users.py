import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import AdminUser
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate
from app.services.auth_service import hash_password
from app.services.case_service import get_user_or_404
from app.utils.exceptions import conflict

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserRead])
async def list_users(
    _: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    result = await session.execute(select(User).order_by(User.created_at.desc()))
    return list(result.scalars().all())


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: uuid.UUID,
    _: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    return await get_user_or_404(session, user_id)


@router.put("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: uuid.UUID,
    body: UserUpdate,
    _: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    user = await get_user_or_404(session, user_id)
    if body.email is not None:
        existing = await session.execute(
            select(User).where(User.email == body.email, User.id != user_id)
        )
        if existing.scalar_one_or_none():
            raise conflict("Email already in use")
        user.email = body.email
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.password is not None:
        user.hashed_password = hash_password(body.password)
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.role is not None:
        user.role = body.role
    session.add(user)
    await session.flush()
    await session.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    _: AdminUser,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    user = await get_user_or_404(session, user_id)
    await session.delete(user)
