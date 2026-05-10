from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["jobs"])

class JobPayload(BaseModel):
    title: str
    company: str | None = None
    description: str

@router.post("/jobs")
def create_job(payload: JobPayload):
    return {"message": "job received", "job": payload.model_dump()}
