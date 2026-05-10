import httpx
import json


class OllamaProvider:
    def __init__(self, base_url: str, llm_model: str, embedding_model: str):
        self.base_url = base_url.rstrip("/")
        self.llm_model = llm_model
        self.embedding_model = embedding_model

    async def generate(self, prompt: str) -> str:
        timeout = httpx.Timeout(connect=10.0, read=600.0, write=60.0, pool=60.0)

        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.llm_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0}
                },
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")

    async def generate_structured(self, prompt: str, schema: dict) -> dict:
        timeout = httpx.Timeout(connect=10.0, read=600.0, write=60.0, pool=60.0)

        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.llm_model,
                    "prompt": prompt,
                    "stream": False,
                    "format": schema,
                    "options": {"temperature": 0}
                },
            )
            response.raise_for_status()
            data = response.json()
            content = data.get("response", "{}")

            try:
                return json.loads(content)
            except Exception:
                return {
                    "overall_match": "Analysis could not be returned in structured format.",
                    "strengths": [],
                    "not_explicitly_shown": [],
                    "missing_or_weak_areas": [],
                    "cv_rewrite_suggestions": [content[:1000]]
                }

    async def embed(self, text: str) -> list[float]:
        timeout = httpx.Timeout(connect=10.0, read=300.0, write=60.0, pool=60.0)

        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/embeddings",
                json={
                    "model": self.embedding_model,
                    "prompt": text
                },
            )
            response.raise_for_status()
            data = response.json()
            return data.get("embedding", [])