up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

pull-models:
	docker compose exec ollama ollama pull mistral && docker compose exec ollama ollama pull nomic-embed-text
