from sqlalchemy import ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"), nullable=False)
    job_post_id: Mapped[int] = mapped_column(ForeignKey("job_posts.id"), nullable=False)
    result_json: Mapped[dict] = mapped_column(JSONB, nullable=False)