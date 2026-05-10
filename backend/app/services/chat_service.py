"""Chat service: orchestrates the tool-use loop with the Anthropic API.

Flow per user message:
  1. Build messages array: prior conversation + new user turn.
  2. Call Anthropic with tools.
  3. While the model returns `tool_use` blocks, run them and feed back
     `tool_result` blocks. Cap total iterations to avoid runaway loops.
  4. Return the final text reply + a trace of tool calls.
"""

from __future__ import annotations

import json
import os
from typing import Any

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.chat import ChatMessage, ChatResponse, ToolCallTrace
from app.services.chat_tools import TOOL_DEFINITIONS, execute_tool


MAX_TOOL_ITERATIONS = 8
DEFAULT_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-5")


class ChatConfigError(RuntimeError):
    """Raised when the chat feature is not configured (no API key)."""


def _system_prompt(user: User) -> str:
    role_scope = {
        "employee": "your own expenses and travel only",
        "manager": "your own data plus your direct reports' data",
        "finance": "all employees' expenses and travel across the company",
    }.get(user.role, "your own data")

    return (
        "You are the AI assistant inside a Travel & Expense (T&E) management "
        "system. You help employees, managers, and finance teams answer "
        "questions about their travel and expense data.\n\n"
        f"You are talking to {user.full_name} ({user.email}), role: "
        f"{user.role}. They can see {role_scope}. The tools you have access "
        "to already enforce this — never try to bypass scope.\n\n"
        "Guidelines:\n"
        "- Always use tools to fetch real data; do not invent numbers, dates, "
        "or report IDs.\n"
        "- If the user asks about a relative time range (last quarter, this "
        "year, last 30 days), call `get_today` first so you compute dates "
        "correctly.\n"
        "- Be concise. Prefer short, direct answers with the key number "
        "highlighted. Use a small markdown table only when comparing 3+ "
        "items.\n"
        "- Format currency with the symbol and 2 decimals (e.g. $1,234.56).\n"
        "- If a tool returns no rows, say so plainly — don't pad.\n"
        "- If the question is outside this app's scope (e.g. general "
        "knowledge, coding help), politely redirect to T&E topics.\n"
    )


def _get_client():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ChatConfigError(
            "ANTHROPIC_API_KEY is not set. Add it to backend/.env to enable the chat feature."
        )
    try:
        import anthropic  # type: ignore
    except ImportError as e:
        raise ChatConfigError(
            "The `anthropic` package is not installed. Run `pip install -r backend/requirements.txt`."
        ) from e
    return anthropic.Anthropic(api_key=api_key)


def _preview(obj: Any, limit: int = 240) -> str:
    s = json.dumps(obj, default=str)
    return s if len(s) <= limit else s[:limit] + "…"


def chat(db: Session, user: User, message: str, history: list[ChatMessage]) -> ChatResponse:
    client = _get_client()

    # Seed the conversation. We re-send full history each turn (stateless API).
    messages: list[dict[str, Any]] = [
        {"role": m.role, "content": m.content} for m in history
    ]
    messages.append({"role": "user", "content": message})

    traces: list[ToolCallTrace] = []
    final_text = ""

    for _ in range(MAX_TOOL_ITERATIONS):
        resp = client.messages.create(
            model=DEFAULT_MODEL,
            max_tokens=1024,
            system=_system_prompt(user),
            tools=TOOL_DEFINITIONS,
            messages=messages,
        )

        # Append the assistant's full content (mix of text + tool_use) back
        # into the message history — required by Anthropic's tool protocol.
        messages.append({"role": "assistant", "content": resp.content})

        # Collect any tool_use blocks; if none, we're done.
        tool_uses = [b for b in resp.content if getattr(b, "type", None) == "tool_use"]
        if not tool_uses:
            final_text = "".join(
                getattr(b, "text", "") for b in resp.content
                if getattr(b, "type", None) == "text"
            ).strip()
            break

        # Run each tool and feed results back as a single user-role message
        # with tool_result blocks (per Anthropic spec).
        tool_results = []
        for tu in tool_uses:
            args = tu.input or {}
            result = execute_tool(tu.name, args, db, user)
            traces.append(
                ToolCallTrace(name=tu.name, input=args, result_preview=_preview(result))
            )
            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": tu.id,
                    "content": json.dumps(result, default=str),
                }
            )

        messages.append({"role": "user", "content": tool_results})

        # Stop reason check — `end_turn` after tool_use shouldn't happen,
        # but if the model says it's done, respect it.
        if resp.stop_reason == "end_turn":
            break
    else:
        final_text = (
            "I hit the maximum number of tool calls while researching that. "
            "Could you narrow the question down a bit?"
        )

    if not final_text:
        final_text = "I wasn't able to produce a response. Try rephrasing the question."

    return ChatResponse(reply=final_text, tool_calls=traces)
