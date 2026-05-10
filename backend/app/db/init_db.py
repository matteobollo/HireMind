from app.db.base import Base
from app.db.session import engine
from app.models.document import Document
from app.models.job_post import JobPost
from app.models.analysis import Analysis


def init_db():
    Base.metadata.create_all(bind=engine)