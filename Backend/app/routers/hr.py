from datetime import date, timedelta, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.auth import require_hr
from app.schemas import NewEmployee, EscalationReply, TaskCreate,DocReview
from app.db import supabase
from app.schemas import NewEmployee

router = APIRouter(prefix="/hr", tags=["HR"])


@router.post("/employees")
def create_employee(data: NewEmployee, hr=Depends(require_hr)):
    # 1. Create the login in Supabase Auth
    try:
        res = supabase.auth.admin.create_user({
            "email": data.email,
            "password": data.temp_password,
            "email_confirm": True,
            "app_metadata": {"role": "employee"},
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not create login: {e}")

    user_id = res.user.id
    start = data.start_date or date.today()

    # 2. Create the employee row (same id as the login)
    try:
        supabase.table("employees").insert({
            "id": user_id,
            "full_name": data.full_name,
            "email": data.email,
            "job_role": data.job_role,
            "department": data.department,
            "start_date": start.isoformat(),
        }).execute()
    except Exception as e:
        # undo the login so we don't leave a half-created user
        supabase.auth.admin.delete_user(user_id)
        raise HTTPException(status_code=400, detail=f"Could not create employee: {e}")

    # 3. Copy the role's checklist templates into real tasks
    templates = (
        supabase.table("task_templates")
        .select("*")
        .eq("job_role", data.job_role)
        .execute()
        .data
    )
    tasks = [
        {
            "employee_id": user_id,
            "title": t["title"],
            "description": t["description"],
            "stage": t["stage"],
            "due_date": (start + timedelta(days=t["due_after_days"] or 0)).isoformat(),
        }
        for t in templates
    ]
    if tasks:
        supabase.table("onboarding_tasks").insert(tasks).execute()

    return {"id": user_id, "email": data.email, "tasks_created": len(tasks)}


@router.get("/employees")
def list_employees(hr=Depends(require_hr)):
    return supabase.table("employees").select("*").order("created_at", desc=True).execute().data

@router.get("/escalations")
def list_escalations(status: str = "open", hr=Depends(require_hr)):
    return (
        supabase.table("escalations")
        .select("*, chatbot_queries(question, answer, confidence), employees(full_name, email)")
        .eq("status", status)
        .order("created_at", desc=True)
        .execute()
        .data
    )


@router.patch("/escalations/{escalation_id}/resolve")
def resolve_escalation(escalation_id: str, data: EscalationReply, hr=Depends(require_hr)):
    res = (
        supabase.table("escalations")
        .update({
            "status": "resolved",
            "hr_response": data.hr_response,
            "resolved_by": hr.id,
            "resolved_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", escalation_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Escalation not found")
    return res.data[0]

@router.post("/tasks")
def assign_task(data: TaskCreate, hr=Depends(require_hr)):
    try:
        res = supabase.table("onboarding_tasks").insert({
            "employee_id": data.employee_id,
            "title": data.title,
            "description": data.description,
            "stage": data.stage,
            "due_date": data.due_date.isoformat() if data.due_date else None,
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not assign task: {e}")
    return res.data[0]


@router.get("/tasks/overdue")
def overdue_tasks(hr=Depends(require_hr)):
    # Overdue = not completed AND due date is before today
    return (
        supabase.table("onboarding_tasks")
        .select("*, employees(full_name, email)")
        .neq("status", "completed")
        .lt("due_date", date.today().isoformat())
        .order("due_date")
        .execute()
        .data
    )


@router.get("/progress")
def progress(hr=Depends(require_hr)):
    employees = supabase.table("employees").select("id, full_name, email, job_role, stage").execute().data
    tasks = supabase.table("onboarding_tasks").select("employee_id, status, due_date").execute().data
    today = date.today().isoformat()

    result = []
    for e in employees:
        mine = [t for t in tasks if t["employee_id"] == e["id"]]
        done = sum(1 for t in mine if t["status"] == "completed")
        overdue = sum(
            1 for t in mine
            if t["status"] != "completed" and t["due_date"] and t["due_date"] < today
        )
        result.append({
            **e,
            "total_tasks": len(mine),
            "completed": done,
            "overdue": overdue,
            "percent": round(100 * done / len(mine)) if mine else 0,
        })
    return result

@router.get("/documents")
def list_documents(status: str = "pending", hr=Depends(require_hr)):
    docs = (
        supabase.table("documents")
        .select("*, employees(full_name, email)")
        .eq("status", status)
        .order("uploaded_at", desc=True)
        .execute()
        .data
    )
    # Private files: give HR a temporary link (valid for 1 hour)
    for d in docs:
        try:
            signed = supabase.storage.from_("documents").create_signed_url(d["file_path"], 3600)
            d["view_url"] = signed.get("signedURL") or signed.get("signedUrl")
        except Exception:
            d["view_url"] = None
    return docs


@router.patch("/documents/{doc_id}/review")
def review_document(doc_id: str, data: DocReview, hr=Depends(require_hr)):
    res = (
        supabase.table("documents")
        .update({"status": data.status, "hr_comment": data.hr_comment})
        .eq("id", doc_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Document not found")
    return res.data[0]