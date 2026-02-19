import io
import uuid
from pathlib import Path

import aiofiles

from app.config import settings

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
}


def get_upload_path(case_id: uuid.UUID, filename: str) -> Path:
    upload_dir = Path(settings.UPLOAD_DIR) / str(case_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir / filename


async def save_upload(case_id: uuid.UUID, file_bytes: bytes, ext: str) -> tuple[str, Path]:
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = get_upload_path(case_id, unique_name)
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(file_bytes)
    return unique_name, file_path


def extract_text(file_bytes: bytes, mime_type: str) -> str:
    if mime_type == "application/pdf":
        return _extract_pdf(file_bytes)
    if mime_type == "text/plain":
        return file_bytes.decode("utf-8", errors="replace")
    # DOCX basic extraction
    if mime_type in (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    ):
        return _extract_docx(file_bytes)
    return ""


def _extract_pdf(file_bytes: bytes) -> str:
    try:
        import PyPDF2

        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n".join(pages)
    except Exception:
        return ""


def _extract_docx(file_bytes: bytes) -> str:
    try:
        import zipfile

        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            with z.open("word/document.xml") as f:
                xml_content = f.read().decode("utf-8")
        import re

        text = re.sub(r"<[^>]+>", " ", xml_content)
        text = re.sub(r"\s+", " ", text).strip()
        return text
    except Exception:
        return ""
