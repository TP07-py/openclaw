import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.document import Document, DocumentStatus
from app.schemas.document import DocumentRead
from app.services.case_service import assert_case_access, get_case_or_404
from app.services.claude_service import analyze_document_with_claude
from app.services.document_service import (
    ALLOWED_MIME_TYPES,
    extract_text,
    save_upload,
)
from app.config import settings
from app.utils.exceptions import bad_request, not_found

router = APIRouter(prefix="/cases/{case_id}/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
async def upload_document(
    case_id: uuid.UUID,
    file: UploadFile,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    case = await get_case_or_404(session, case_id)
    assert_case_access(case, current_user)

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise bad_request(f"Unsupported file type: {file.content_type}")

    file_bytes = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise bad_request(f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB")

    ext = Path(file.filename or "file").suffix
    unique_name, file_path = await save_upload(case_id, file_bytes, ext)

    doc = Document(
        case_id=case_id,
        filename=unique_name,
        original_filename=file.filename or unique_name,
        mime_type=file.content_type,
        file_size=len(file_bytes),
        file_path=str(file_path),
        status=DocumentStatus.uploaded,
    )
    session.add(doc)
    await session.flush()
    await session.refresh(doc)
    return doc


@router.get("", response_model=list[DocumentRead])
async def list_documents(
    case_id: uuid.UUID,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    case = await get_case_or_404(session, case_id)
    assert_case_access(case, current_user)
    result = await session.execute(
        select(Document).where(Document.case_id == case_id).order_by(Document.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/{doc_id}", response_model=DocumentRead)
async def get_document(
    case_id: uuid.UUID,
    doc_id: uuid.UUID,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    case = await get_case_or_404(session, case_id)
    assert_case_access(case, current_user)
    result = await session.execute(
        select(Document).where(Document.id == doc_id, Document.case_id == case_id)
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise not_found("Document")
    return doc


@router.post("/{doc_id}/analyze", response_model=DocumentRead)
async def analyze_document(
    case_id: uuid.UUID,
    doc_id: uuid.UUID,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    case = await get_case_or_404(session, case_id)
    assert_case_access(case, current_user)
    result = await session.execute(
        select(Document).where(Document.id == doc_id, Document.case_id == case_id)
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise not_found("Document")

    doc.status = DocumentStatus.analyzing
    session.add(doc)
    await session.flush()

    try:
        with open(doc.file_path, "rb") as f:
            file_bytes = f.read()
        text = extract_text(file_bytes, doc.mime_type)
        doc.extracted_text = text

        analysis = await analyze_document_with_claude(text)
        doc.ai_summary = analysis.get("summary", "")
        doc.ai_key_points = "\n".join(analysis.get("key_points", []))
        doc.status = DocumentStatus.analyzed
    except Exception as e:
        doc.status = DocumentStatus.failed
        session.add(doc)
        await session.flush()
        raise bad_request(f"Analysis failed: {str(e)}")

    session.add(doc)
    await session.flush()
    await session.refresh(doc)
    return doc


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    case_id: uuid.UUID,
    doc_id: uuid.UUID,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    case = await get_case_or_404(session, case_id)
    assert_case_access(case, current_user)
    result = await session.execute(
        select(Document).where(Document.id == doc_id, Document.case_id == case_id)
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise not_found("Document")
    await session.delete(doc)


@router.get("/{doc_id}/download")
async def download_document(
    case_id: uuid.UUID,
    doc_id: uuid.UUID,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    case = await get_case_or_404(session, case_id)
    assert_case_access(case, current_user)
    result = await session.execute(
        select(Document).where(Document.id == doc_id, Document.case_id == case_id)
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise not_found("Document")
    return FileResponse(
        path=doc.file_path,
        filename=doc.original_filename,
        media_type=doc.mime_type,
    )
