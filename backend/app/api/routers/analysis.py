from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.analysis import Analysis
from app.models.document import Document
from app.models.job_post import JobPost
from app.providers.ollama_provider import OllamaProvider

router = APIRouter(tags=["analysis"])


class AnalysisPayload(BaseModel):
    document_id: int
    job_title: str = "Ad-hoc job post"
    company: str = "Unknown"
    job_description: str


class AnalysisResponse(BaseModel):
    overall_match: str = Field(description="Short evaluation of overall fit.")
    strengths: list[str] = Field(description="Skills or experiences clearly supported by the CV.")
    not_explicitly_shown: list[str] = Field(
        description="Requirements mentioned in the job description that are not explicitly stated in the provided CV text."
    )
    missing_or_weak_areas: list[str] = Field(
        description="Real gaps or weak areas based only on the provided CV text."
    )
    cv_rewrite_suggestions: list[str] = Field(
        description="Concrete bullet-point rewrites based only on the candidate's existing experience."
    )


@router.post("/analysis", response_model=AnalysisResponse)
async def run_analysis(payload: AnalysisPayload):
    db = SessionLocal()

    try:
        document = db.query(Document).filter(Document.id == payload.document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        schema = AnalysisResponse.model_json_schema()

        prompt = f"""
You are HireMind, a strict career analysis assistant.

Your task is to compare a candidate CV with a job description.

Important rules:
- Use ONLY the information explicitly present in the CV text.
- Do NOT invent projects, technologies, experience, tools, or achievements.
- If something appears in the job description but is not clearly stated in the CV, put it in "not_explicitly_shown".
- Use "missing_or_weak_areas" only for genuine gaps or clearly weak alignment.
- In "cv_rewrite_suggestions", suggest only improved phrasing of existing experience.
- Be concise and concrete.
- Return ONLY valid JSON matching the schema.

JSON schema:
{schema}

CV:
{document.extracted_text[:6000]}

JOB DESCRIPTION:
{payload.job_description[:4000]}
""".strip()

        provider = OllamaProvider(
            settings.ollama_base_url,
            settings.llm_model,
            settings.embedding_model,
        )

        result = await provider.generate_structured(prompt, schema)

        job_post = JobPost(
            title=payload.job_title,
            company=payload.company,
            description=payload.job_description,
        )
        db.add(job_post)
        db.commit()
        db.refresh(job_post)

        analysis = Analysis(
            document_id=document.id,
            job_post_id=job_post.id,
            result_json=result,
        )
        db.add(analysis)
        db.commit()

        return result
    finally:
        db.close()


@router.get("/analysis/history")
async def get_analysis_history(limit: int = 20):
    db = SessionLocal()

    try:
        rows = (
            db.query(Analysis, Document, JobPost)
            .join(Document, Analysis.document_id == Document.id)
            .join(JobPost, Analysis.job_post_id == JobPost.id)
            .order_by(Analysis.id.desc())
            .limit(limit)
            .all()
        )

        history = []
        for analysis, document, job_post in rows:
            history.append({
                "analysis_id": analysis.id,
                "document_id": document.id,
                "filename": document.filename,
                "job_title": job_post.title,
                "company": job_post.company,
                "job_description": job_post.description,
                "result": analysis.result_json,
            })

        return history
    finally:
        db.close()