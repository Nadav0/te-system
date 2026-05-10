from typing import Literal, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    """Incoming chat turn from the frontend.

    `history` is the full conversation prior to `message`, oldest first.
    The backend stitches them together when calling the LLM.
    """

    message: str = Field(..., min_length=1, max_length=4000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=40)


class ToolCallTrace(BaseModel):
    """Lightweight trace of a tool call, returned for debugging / UI hints."""

    name: str
    input: dict
    result_preview: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    tool_calls: list[ToolCallTrace] = Field(default_factory=list)
