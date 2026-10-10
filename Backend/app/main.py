import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import health, session, hr, employee, chatbot

app = FastAPI(title="Onboarding Assistant API")

origins = [
    o.strip()
    for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(session.router)
app.include_router(hr.router)
app.include_router(employee.router)
app.include_router(chatbot.router)