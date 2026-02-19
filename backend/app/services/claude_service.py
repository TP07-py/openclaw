import asyncio
from functools import partial

import anthropic

from app.config import settings

LEGAL_SYSTEM_PROMPT = """You are an expert legal AI assistant helping lawyers and clients
understand legal documents, cases, and related matters. You have access to a web search tool
— use it whenever you need to verify current statutes, look up recent case law, find
jurisdiction-specific rules, or check any legal information that may have changed recently.
Always cite your sources (include URLs) when you use search results.
Provide clear, accurate, and professional analysis.
Always remind users to consult a licensed attorney for formal legal advice.
Be concise and structured in your responses."""

WEB_SEARCH_TOOL = {
    "name": "web_search",
    "description": (
        "Search the internet for current legal information: statutes, regulations, "
        "case law, court decisions, legal news, or any other information needed to "
        "answer legal questions accurately and up-to-date."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Search query to find relevant legal information",
            }
        },
        "required": ["query"],
    },
}

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


def _execute_web_search(query: str) -> str:
    try:
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=5))
        if not results:
            return "No results found for this query."
        parts = []
        for r in results:
            parts.append(f"Title: {r['title']}\nSummary: {r['body']}\nURL: {r['href']}")
        return "\n\n---\n\n".join(parts)
    except Exception as exc:
        return f"Search error: {exc}"


def _sync_chat(messages: list[dict]) -> str:
    client = _get_client()
    current_messages = list(messages)

    for _ in range(10):  # cap at 10 iterations
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=4096,
            system=LEGAL_SYSTEM_PROMPT,
            tools=[WEB_SEARCH_TOOL],
            messages=current_messages,
        )

        if response.stop_reason == "tool_use":
            # Serialize content blocks to plain dicts for the next API call
            content_dicts = []
            for block in response.content:
                if block.type == "text":
                    content_dicts.append({"type": "text", "text": block.text})
                elif block.type == "tool_use":
                    content_dicts.append({
                        "type": "tool_use",
                        "id": block.id,
                        "name": block.name,
                        "input": block.input,
                    })
            current_messages.append({"role": "assistant", "content": content_dicts})

            # Execute each tool call and collect results
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = _execute_web_search(block.input["query"])
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            current_messages.append({"role": "user", "content": tool_results})
            continue  # let Claude process the results

        # stop_reason == "end_turn" — extract final text
        for block in response.content:
            if hasattr(block, "text"):
                return block.text
        break

    return "Unable to generate a response."


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
