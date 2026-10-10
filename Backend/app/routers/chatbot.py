from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.db import supabase
from app.schemas import ChatIn
from app.services.rag import answer_question, BusyError

router = APIRouter(tags=["Chatbot"])

CONFIDENCE_THRESHOLD = 0.6
DAILY_LIMIT = 10


@router.post("/chat")
def chat(data: ChatIn, user=Depends(get_current_user)):
    today = datetime.now(timezone.utc).date().isoformat()
    used = (
        supabase.table("chatbot_queries")
        .select("id", count="exact")
        .eq("employee_id", user.id)
        .gte("created_at", today)
        .execute()
        .count
    )
    if used >= DAILY_LIMIT:
        raise HTTPException(status_code=429, detail="Daily question limit reached. Please try tomorrow or contact HR.")

    try:
        result = answer_question(data.question)
    except BusyError:
        raise HTTPException(status_code=503, detail="The assistant is busy right now. Please try again in a minute.")

    escalate = result["confidence"] < CONFIDENCE_THRESHOLD

    try:
        q = supabase.table("chatbot_queries").insert({
            "employee_id": user.id,
            "question": data.question,
            "answer": result["answer"],
            "confidence": result["confidence"],
            "escalated": escalate,
        }).execute().data[0]

        if escalate:
            supabase.table("escalations").insert({
                "query_id": q["id"],
                "employee_id": user.id,
            }).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not save chat (use an employee login): {e}")

    return {**result, "escalated": escalate}