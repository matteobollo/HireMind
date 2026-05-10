from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.document import Document
from app.utils.pdf import extract_text_from_pdf

router = APIRouter(tags=["documents"])


@router.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    destination = upload_dir / file.filename
    content = await file.read()
    destination.write_bytes(content)

    try:
        extracted_text = extract_text_from_pdf(str(destination))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF extraction failed: {str(exc)}")

    if not extracted_text.strip():
        raise HTTPException(
            status_code=422,
            detail="No extractable text found in PDF. The file may be scanned or image-based."
        )

    db = SessionLocal()
    try:
        document = Document(
            filename=file.filename,
            content_type=file.content_type or "application/pdf",
            extracted_text=extracted_text,
        )
        db.add(document)
        db.commit()
        db.refresh(document)

        return {
            "id": document.id,
            "filename": file.filename,
            "size": len(content),
            "text": extracted_text,
        }
    finally:
        db.close()