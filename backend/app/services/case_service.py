import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.case import Case
from app.models.user import User, UserRole
from app.utils.exceptions import forbidden, not_found


async def get_case_or_404(session: AsyncSession, case_id: uuid.UUID) -> Case:
    result = await session.execute(
        select(Case)
        .where(Case.id == case_id)
        .options(selectinload(Case.lawyer), selectinload(Case.client))
    )
    case = result.scalar_one_or_none()
    if case is None:
        raise not_found("Case")
    return case


def assert_case_access(case: Case, user: User) -> None:
    if user.role == UserRole.admin:
        return
    if user.role == UserRole.lawyer and case.lawyer_id == user.id:
        return
    if user.role == UserRole.client and case.client_id == user.id:
        return
    raise forbidden("You do not have access to this case")


async def list_cases_for_user(session: AsyncSession, user: User) -> list[Case]:
    stmt = select(Case).options(selectinload(Case.lawyer), selectinload(Case.client))
    if user.role == UserRole.admin:
        pass
    elif user.role == UserRole.lawyer:
        stmt = stmt.where(Case.lawyer_id == user.id)
    else:
        stmt = stmt.where(Case.client_id == user.id)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_user_or_404(session: AsyncSession, user_id: uuid.UUID) -> User:
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise not_found("User")
    return user
