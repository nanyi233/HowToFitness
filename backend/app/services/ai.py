"""
AI service module.
Proxies requests to DeepSeek API, keeping the API key securely on the backend.
"""

import json
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

DEEPSEEK_CHAT_URL = f"{settings.DEEPSEEK_BASE_URL}/v1/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"

# ── System prompts (mirrored from frontend) ────────────────────────

FOOD_PARSE_SYSTEM_PROMPT = (
    "你是一个饮食记录助手。用户会输入他们吃的食物，你需要解析出食物名称和克数，并提供每100g的营养信息。\n"
    '请严格按照以下JSON格式返回，不要有任何其他文字：\n'
    '{"success": true, "food_name": "食物名称", "grams": 数字, '
    '"per_100g": {"calories": 热量数字, "protein": 蛋白质数字, "carbs": 碳水数字, "fat": 脂肪数字}}\n'
    '如果无法解析，返回：{"success": false, "error": "原因"}'
)

TRAINING_PARSE_SYSTEM_PROMPT = (
    "你是一个力量训练记录助手。用户会描述他们的训练内容，你需要解析出每个训练动作的名称、重量（kg）、组数和每组次数。\n\n"
    "请严格按照以下JSON格式返回，不要有任何其他文字：\n"
    "{\n"
    '    "success": true,\n'
    '    "exercises": [\n'
    "        {\n"
    '            "name": "标准化的训练动作名称",\n'
    '            "weight": 重量数字(kg，自重填0),\n'
    '            "sets": 组数,\n'
    '            "reps": 每组次数,\n'
    '            "set_details": [\n'
    '                {"weight": 重量, "reps": 次数},\n'
    '                {"weight": 重量, "reps": 次数}\n'
    "            ]\n"
    "        }\n"
    "    ],\n"
    '    "duration": 训练时长分钟数(如果用户提及了时长，否则为null)\n'
    "}\n\n"
    '如果无法解析，返回：{"success": false, "error": "原因"}\n\n'
    "注意：\n"
    "1. 如果用户描述了多个动作，请分别解析\n"
    "2. set_details 数组长度应等于组数\n"
    "3. 如果用户没指定重量，根据动作合理估计或填0（自重）\n"
    "4. 常见动作名称请标准化：如\"卧推\"、\"深蹲\"、\"硬拉\"、\"引体向上\"等\n"
    "5. 只返回JSON"
)


# ── Helper ──────────────────────────────────────────────────────────

def _strip_markdown_json(raw: str) -> dict:
    """Strip optional markdown code fences and parse JSON."""
    text = raw.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return json.loads(text.strip())


async def _call_deepseek(
    prompt: str,
    system_prompt: str,
    *,
    temperature: float = 0.3,
    max_tokens: int = 500,
) -> dict:
    """
    Call the DeepSeek chat completion API and return parsed JSON.
    Raises ValueError on non-JSON responses and httpx errors on network issues.
    """
    if not settings.DEEPSEEK_API_KEY:
        raise ValueError("DEEPSEEK_API_KEY is not configured on the server")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
    }
    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(DEEPSEEK_CHAT_URL, json=payload, headers=headers)
        resp.raise_for_status()

    data = resp.json()
    raw_content = data["choices"][0]["message"]["content"]
    logger.debug("DeepSeek raw response: %s", raw_content)

    return _strip_markdown_json(raw_content)


# ── Public API ──────────────────────────────────────────────────────

async def parse_food(prompt: str) -> dict:
    """
    Parse a natural-language food description via DeepSeek AI.
    Returns the parsed JSON dict (with 'success', 'food_name', etc.).
    """
    return await _call_deepseek(prompt, FOOD_PARSE_SYSTEM_PROMPT)


async def parse_training(prompt: str) -> dict:
    """
    Parse a natural-language training description via DeepSeek AI.
    Returns the parsed JSON dict (with 'success', 'exercises', etc.).
    """
    return await _call_deepseek(
        prompt,
        TRAINING_PARSE_SYSTEM_PROMPT,
        max_tokens=800,
    )
