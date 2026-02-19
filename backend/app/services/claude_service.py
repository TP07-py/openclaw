import asyncio
from functools import partial

import anthropic

from app.config import settings

LEGAL_SYSTEM_PROMPT = """You are an expert legal AI assistant helping lawyers and clients
understand legal documents, cases, and related matters. You provide clear, accurate, and
professional analysis. Always remind users to consult a licensed attorney for formal legal advice.
Be concise and structured in your responses."""

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


def _sync_chat(messages: list[dict]) -> str:
    client = _get_client()
    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=2048,
        system=LEGAL_SYSTEM_PROMPT,
        messages=messages,
    )
    return response.content[0].text


def _sync_analyze_document(text: str) -> dict:
    client = _get_client()
    prompt = (
        f"Analyze this legal document and provide:\n"
        f"1. A concise summary (2-3 paragraphs)\n"
        f"2. Key legal points as a JSON list under 'key_points'\n\n"
        f"Document text:\n{text[:15000]}\n\n"
        f"Respond with JSON: {{\"summary\": \"...\", \"key_points\": [...]}}"
    )
    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=2048,
        system=LEGAL_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    import json
    raw = response.content[0].text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


async def chat_with_claude(messages: list[dict]) -> str:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, partial(_sync_chat, messages))


async def analyze_document_with_claude(text: str) -> dict:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, partial(_sync_analyze_document, text))
