from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json

class Settings(BaseSettings):
    app_name: str = "HireMind"
    app_env: str = "development"
    app_debug: bool = True
    postgres_db: str
    postgres_user: str
    postgres_password: str
    database_url: str
    ollama_base_url: str
    llm_model: str = "mistral"
    embedding_model: str = "nomic-embed-text"
    upload_dir: str = "/app/uploads"
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [item.strip() for item in v.split(",") if item.strip()]
        return v

@lru_cache
def get_settings():
    return Settings()

settings = get_settings()
