from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import analysis, documents, health, jobs
from app.core.config import settings
from app.db.init_db import init_db

app = FastAPI(title=settings.app_name)


@app.on_event("startup")
def on_startup():
    init_db()


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(documents.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")