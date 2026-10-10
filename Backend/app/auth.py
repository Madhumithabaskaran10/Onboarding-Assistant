from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db import supabase

bearer = HTTPBearer()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        user = supabase.auth.get_user(creds.credentials).user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired login")
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired login")
    return user

def require_hr(user=Depends(get_current_user)):
    role = (user.app_metadata or {}).get("role")
    if role != "hr":
        raise HTTPException(status_code=403, detail="HR only")
    return user