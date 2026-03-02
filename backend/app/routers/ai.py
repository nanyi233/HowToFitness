"""
AI proxy router.
Forwards natural-language prompts to DeepSeek and returns structured data.
The API key is kept securely on the backend.
"""

import logging

from fastapi import APIRouter, HTTPException, status

from app.schemas.ai import AIParseRequest
from app.services.ai import parse_food, parse_training

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["AI"])


@router.post("/parse-food")
async def api_parse_food(body: AIParseRequest):
    """
    Parse a natural-language food description and return structured nutrition data.

    Example prompt: "200g鸡胸肉" or "一碗米饭加一个鸡蛋"
    """
    try:
        result = await parse_food(body.prompt)
        return result
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        )
    except Exception as exc:
        logger.exception("Failed to parse food via AI")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {exc}",
        )


@router.post("/parse-training")
async def api_parse_training(body: AIParseRequest):
    """
    Parse a natural-language training description and return structured exercise data.

    Example prompt: "卧推 60kg 4组8个，深蹲 80kg 5组5个"
    """
    try:
        result = await parse_training(body.prompt)
        return result
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        )
    except Exception as exc:
        logger.exception("Failed to parse training via AI")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {exc}",
        )
