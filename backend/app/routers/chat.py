from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat_service
from app.services.chat_service import ChatConfigError


router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/message", response_model=ChatResponse)
def send_message(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatResponse:
    try:
        return chat_service.chat(
            db=db,
            user=current_user,
            message=payload.message,
            history=payload.history,
        )
    except ChatConfigError as e:
        # 503 — feature is unconfigured, not the user's fault
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat failed: {type(e).__name__}: {e}",
        )


@router.get("/health")
def chat_health(current_user: User = Depends(get_current_user)) -> dict:
    """Lightweight check the frontend can call to know whether to render the widget."""
    import os

    configured = bool(os.environ.get("ANTHROPIC_API_KEY"))
    return {"configured": configured}
