from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class JobPost(Base):
    __tablename__ = "job_posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="Untitled Job")
    company: Mapped[str] = mapped_column(String(255), nullable=False, default="Unknown")
    description: Mapped[str] = mapped_column(Text, nullable=False)