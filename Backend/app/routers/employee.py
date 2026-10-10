from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.auth import get_current_user
from app.db import supabase
from app.schemas import FeedbackIn

router = APIRouter(tags=["Employee"])


@router.get("/my/tasks")
def my_tasks(user=Depends(get_current_user)):
    # employee_id comes from the token, never from the request
    return (
        supabase.table("onboarding_tasks")
        .select("*")
        .eq("employee_id", user.id)
        .order("due_date")
        .execute()
        .data
    )


@router.patch("/my/tasks/{task_id}/complete")
def complete_task(task_id: str, user=Depends(get_current_user)):
    res = (
        supabase.table("onboarding_tasks")
        .update({
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", task_id)
        .eq("employee_id", user.id)   # can only complete your own task
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return res.data[0]


@router.post("/feedback")
def submit_feedback(data: FeedbackIn, user=Depends(get_current_user)):
    try:
        supabase.table("feedback").insert({
            "employee_id": user.id,
            "rating": data.rating,
            "comment": data.comment,
            "is_anonymous": data.is_anonymous,
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not save feedback: {e}")
    return {"message": "Thank you for your feedback"}


@router.get("/feedback")
def all_feedback(user=Depends(get_current_user)):
    # Any logged-in user (employee or HR) can read. Anonymous names are hidden by the view.
    return (
        supabase.table("feedback_public")
        .select("*")
        .order("created_at", desc=True)
        .execute()
        .data
    )
@router.get("/my/escalations")
def my_escalations(user=Depends(get_current_user)):
    return (
        supabase.table("escalations")
        .select("id, status, hr_response, created_at, resolved_at, chatbot_queries(question)")
        .eq("employee_id", user.id)
        .order("created_at", desc=True)
        .execute()
        .data
    )

ALLOWED_TYPES = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
}
MAX_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/my/documents")
async def upload_document(
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF, PNG or JPG files are allowed")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File is too large (maximum 5 MB)")

    # Safe path: one folder per employee, random file name
    path = f"{user.id}/{uuid.uuid4()}.{ALLOWED_TYPES[file.content_type]}"
    try:
        supabase.storage.from_("documents").upload(
            path, content, {"content-type": file.content_type}
        )
        row = supabase.table("documents").insert({
            "employee_id": user.id,
            "doc_type": doc_type,
            "file_path": path,
        }).execute().data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Upload failed: {e}")
    return row


@router.get("/my/documents")
def my_documents(user=Depends(get_current_user)):
    return (
        supabase.table("documents")
        .select("id, doc_type, status, hr_comment, uploaded_at")
        .eq("employee_id", user.id)
        .order("uploaded_at", desc=True)
        .execute()
        .data
    )