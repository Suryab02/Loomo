import time
from collections import defaultdict
from threading import Lock
from fastapi import HTTPException, Depends
from app.models.user import User
from app.utils.auth import get_current_user

# Per-user timestamps of LLM calls (last hour)
_llm_calls: dict[int, list[float]] = defaultdict(list)
_lock = Lock()

# Max LLM-backed requests per user per rolling hour
MAX_LLM_CALLS_PER_HOUR = 60
WINDOW_SEC = 3600


def consume_llm_slot(user_id: int) -> None:
    """Raises HTTPException 429 if user exceeded hourly budget."""
    with _lock:
        now = time.time()
        cutoff = now - WINDOW_SEC
        arr = _llm_calls[user_id]
        while arr and arr[0] < cutoff:
            arr.pop(0)
        if len(arr) >= MAX_LLM_CALLS_PER_HOUR:
            raise HTTPException(
                status_code=429,
                detail="Too many AI requests. Try again in a few minutes.",
            )
        arr.append(now)


def require_llm_budget(current_user: User = Depends(get_current_user)) -> User:
    consume_llm_slot(current_user.id)
    return current_user
