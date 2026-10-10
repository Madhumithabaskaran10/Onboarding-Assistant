import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import create_client
from app.auth import get_current_user, require_hr
from app.db import supabase

router = APIRouter(tags=["Session"])


class LoginData(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(data: LoginData):
    client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_ANON_KEY"])
    try:
        res = client.auth.sign_in_with_password(
            {"email": data.email.strip(), "password": data.password}
        )
    except Exception as e:
        print("LOGIN ERROR:", e)
        raise HTTPException(status_code=401, detail="Wrong email or password")
    role = (res.user.app_metadata or {}).get("role", "employee")
    return {"access_token": res.session.access_token, "role": role}


@router.get("/me")
def me(user=Depends(get_current_user)):
    row = (
        supabase.table("employees")
        .select("full_name, job_role, department, start_date")
        .eq("id", user.id)
        .execute()
        .data
    )
    emp = row[0] if row else {}
    return {
        "id": user.id,
        "email": user.email,
        "name": emp.get("full_name") or user.email.split("@")[0],
        "job_role": emp.get("job_role"),
        "department": emp.get("department"),
        "start_date": emp.get("start_date"),
        "role": (user.app_metadata or {}).get("role", "employee"),
    }


@router.get("/hr/ping")
def hr_ping(user=Depends(require_hr)):
    return {"message": "Welcome HR"}