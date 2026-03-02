"""
AI service module.
Proxies requests to DeepSeek API, keeping the API key securely on the backend.
"""

import json
import logging
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

DEEPSEEK_CHAT_URL = f"{settings.DEEPSEEK_BASE_URL}/v1/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"

# ── System prompts (mirrored from frontend) ────────────────────────

FOOD_PARSE_SYSTEM_PROMPT = (
    "你是一个饮食记录助手。用户会通过对话告诉你他们吃的食物，你需要解析出食物名称和克数，并提供每100g的营养信息。\n"
    "用户可能会在对话中逐条补充食物，每次只需解析用户最新一条消息中提到的食物。\n"
    "如果用户的最新消息是对之前内容的补充或修正，请结合上下文理解。\n\n"
    '请严格按照以下JSON格式返回，不要有任何其他文字：\n'
    '如果用户提到了一种食物：\n'
    '{"success": true, "foods": [{"food_name": "食物名称", "grams": 数字, '
    '"per_100g": {"calories": 热量数字, "protein": 蛋白质数字, "carbs": 碳水数字, "fat": 脂肪数字}}]}\n'
    '如果用户提到了多种食物：\n'
    '{"success": true, "foods": [{"food_name": "食物1", "grams": 数字, '
    '"per_100g": {"calories": 热量, "protein": 蛋白质, "carbs": 碳水, "fat": 脂肪}}, '
    '{"food_name": "食物2", "grams": 数字, '
    '"per_100g": {"calories": 热量, "protein": 蛋白质, "carbs": 碳水, "fat": 脂肪}}]}\n'
    '如果无法解析，返回：{"success": false, "error": "原因"}\n\n'
    "注意：\n"
    "1. 始终返回 foods 数组，即使只有一种食物\n"
    "2. 只解析用户最新消息中的食物，不要重复解析历史消息中已处理的食物\n"
    "3. 只返回JSON"
)

TRAINING_PARSE_SYSTEM_PROMPT = (
    "你是一个力量训练记录助手。用户会通过对话描述他们的训练内容，你需要解析出每个训练动作的名称、重量（kg）、组数和每组次数。\n"
    "用户可能会在对话中逐条补充训练动作，每次只需解析用户最新一条消息中提到的训练。\n"
    "如果用户的最新消息是对之前内容的补充或修正，请结合上下文理解。\n\n"
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
    "5. 只解析用户最新消息中的训练动作，不要重复解析历史消息中已处理的动作\n"
    "6. 只返回JSON"
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


def _build_messages(
    system_prompt: str,
    prompt: str,
    history: Optional[list[dict]] = None,
) -> list[dict]:
    """
    Build the messages list for the DeepSeek API call.
    Includes system prompt, optional conversation history, and the current user prompt.
    """
    messages = [{"role": "system", "content": system_prompt}]

    if history:
        for msg in history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": prompt})
    return messages


async def _call_deepseek(
    prompt: str,
    system_prompt: str,
    *,
    temperature: float = 0.3,
    max_tokens: int = 500,
    history: Optional[list[dict]] = None,
) -> dict:
    """
    Call the DeepSeek chat completion API and return parsed JSON.
    Supports multi-turn conversation via optional history parameter.
    Raises ValueError on non-JSON responses and httpx errors on network issues.
    """
    if not settings.DEEPSEEK_API_KEY:
        raise ValueError("DEEPSEEK_API_KEY is not configured on the server")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
    }

    messages = _build_messages(system_prompt, prompt, history)

    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": messages,
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

async def parse_food(prompt: str, history: Optional[list[dict]] = None) -> dict:
    """
    Parse a natural-language food description via DeepSeek AI.
    Supports multi-turn conversation for contextual understanding.
    Returns the parsed JSON dict (with 'success', 'foods', etc.).
    """
    return await _call_deepseek(prompt, FOOD_PARSE_SYSTEM_PROMPT, history=history)


async def parse_training(prompt: str, history: Optional[list[dict]] = None) -> dict:
    """
    Parse a natural-language training description via DeepSeek AI.
    Supports multi-turn conversation for contextual understanding.
    Returns the parsed JSON dict (with 'success', 'exercises', etc.).
    """
    return await _call_deepseek(
        prompt,
        TRAINING_PARSE_SYSTEM_PROMPT,
        max_tokens=800,
        history=history,
    )
