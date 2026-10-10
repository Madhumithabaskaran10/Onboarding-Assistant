from fastapi import APIRouter
from app.db import supabase

router = APIRouter(tags=["Health"])

@router.get("/health")
def health():
    return {"status": "ok"}

@router.get("/templates")
def templates():
    return supabase.table("task_templates").select("*").execute().data