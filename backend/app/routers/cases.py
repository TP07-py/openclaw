import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.case import Case
from app.models.user import UserRole
from app.schemas.case import CaseAssign, CaseCreate, CaseRead, CaseUpdate
from app.services.case_service import (
    assert_case_access,
    get_case_or_404,
    get_user_or_404,
    list_cases_for_user,
)
from app.utils.exceptions import forbidden

router = APIRouter(prefix="/cases", tags=["cases"])


@router.post("", response_model=CaseRead, status_code=status.HTTP_201_CREATED)
async def create_case(
    body: CaseCreate,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    case = Case(**body.model_dump())
    if current_user.role == UserRole.lawyer:
        case.lawyer_id = current_user.id
    elif current_user.role == UserRole.client:
        case.client_id = current_user.id
    session.add(case)
    await session.flush()
    await session.refresh(case)
    return case


@router.get("", response_model=list[CaseRead])
async def list_cases(
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    return await list_cases_for_user(session, current_user)


@router.get("/{case_id}", response_model=CaseRead)
async def get_case(
    case_id: uuid.UUID,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    case = await get_case_or_404(session, case_id)
    assert_case_access(case, current_user)
    return case


@router.put("/{case_id}", response_model=CaseRead)
async def update_case(
    case_id: uuid.UUID,
    body: CaseUpdate,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    case = await get_case_or_404(session, case_id)
    assert_case_access(case, current_user)
    if current_user.role == UserRole.client:
        raise forbidden("Clients cannot update case details")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(case, field, value)
    session.add(case)
    await session.flush()
    await session.refresh(case)
    return case


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case(
    case_id: uuid.UUID,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    case = await get_case_or_404(session, case_id)
    if current_user.role != UserRole.admin:
        raise forbidden("Only admins can delete cases")
    await session.delete(case)


@router.post("/{case_id}/assign", response_model=CaseRead)
async def assign_case(
    case_id: uuid.UUID,
    body: CaseAssign,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    if current_user.role != UserRole.admin:
        raise forbidden("Only admins can assign cases")
    case = await get_case_or_404(session, case_id)
    if body.lawyer_id is not None:
        lawyer = await get_user_or_404(session, body.lawyer_id)
        if lawyer.role != UserRole.lawyer:
            from app.utils.exceptions import bad_request
            raise bad_request("Assigned user must have lawyer role")
        case.lawyer_id = body.lawyer_id
    if body.client_id is not None:
        client = await get_user_or_404(session, body.client_id)
        if client.role != UserRole.client:
            from app.utils.exceptions import bad_request
            raise bad_request("Assigned user must have client role")
        case.client_id = body.client_id
    session.add(case)
    await session.flush()
    await session.refresh(case)
    return case
