import json
import os
from groq import Groq
from app.db import supabase  # loads .env first

client = Groq(api_key=os.environ["GROQ_API_KEY"])
MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-20b")

SYSTEM = """You are an HR assistant for new employees.
Answer ONLY using the policy text provided. Never use outside knowledge.
If the policy text does not contain the answer, set "confidence" to 0.1 or lower.
Reply with JSON only, in this exact format:
{"answer": "<short, clear answer>", "confidence": <number from 0 to 1>}
Confidence means how sure you are that the policy text fully answers the question."""

_cache: dict = {}


class BusyError(Exception):
    """AI limit reached or AI unavailable"""


def answer_question(question: str) -> dict:
    key = " ".join(question.lower().split())
    if key in _cache:
        return _cache[key]

    chunks = supabase.rpc("search_policies", {"q": question, "k": 3}).execute().data
    if not chunks:
        return {
            "answer": "I couldn't find this in the company policies, so I've passed your question to HR.",
            "confidence": 0.0,
            "sources": [],
        }

    context = "\n\n".join(f"[{c['title']}]\n{c['content']}" for c in chunks)

    try:
        resp = client.chat.completions.create(
            model=MODEL,
            temperature=0,
            max_tokens=1000,
            response_format={"type": "json_object"},
            extra_body={"reasoning_effort": "low"},
            messages=[
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": f"Policy text:\n{context}\n\nQuestion: {question}"},
            ],
        )
        data = json.loads(resp.choices[0].message.content)
        confidence = max(0.0, min(1.0, float(data.get("confidence", 0))))
        result = {
            "answer": data.get("answer", ""),
            "confidence": round(confidence, 2),
            "sources": [c["title"] for c in chunks],
        }
    except Exception as e:
        print("AI error:", e)
        raise BusyError()

    _cache[key] = result
    return result