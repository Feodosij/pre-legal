# syntax=docker/dockerfile:1

FROM node:22-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim
WORKDIR /app

COPY backend/pyproject.toml backend/uv.lock backend/README.md ./
RUN uv sync --frozen --no-dev --no-install-project

COPY backend/src ./src
RUN uv sync --frozen --no-dev

COPY --from=frontend-builder /frontend/out ./static
COPY catalog.json ./catalog.json
COPY templates ./templates

ENV PRELEGAL_DB_PATH=/app/prelegal.db
ENV PRELEGAL_STATIC_DIR=/app/static
ENV PRELEGAL_CATALOG_PATH=/app/catalog.json
ENV PRELEGAL_TEMPLATES_DIR=/app/templates
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uvicorn", "prelegal_backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
