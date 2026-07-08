# Prelegal

Prelegal is a small SaaS app for drafting legal agreements from ready-made templates. You sign up, tell an AI chat assistant what kind of deal you're doing, and it fills in a Common Paper agreement template as you talk, with a live preview and a PDF download once it's done. Finished documents are saved to your account so you can come back and look at them later.

Right now the assistant can draft three document types: a Mutual NDA, a Pilot Agreement, and a Design Partner Agreement. The full catalog (in `catalog.json`) lists several more — Cloud Service Agreement, DPA, SLA, and so on — and if you ask for one of those, the assistant will say so and point you to the closest one it can actually generate. The templates themselves live under `templates/` and come from [Common Paper](https://commonpaper.com), licensed CC BY 4.0.

## Running it

You need Docker and an OpenRouter API key (the assistant runs on a free-tier model via OpenRouter/LiteLLM). Put the key in a `.env` file at the project root:

```
OPENROUTER_API_KEY=your-key-here
```

Then, depending on your OS:

```
scripts/start-mac.sh       # macOS
scripts/start-linux.sh     # Linux
scripts/start-windows.ps1  # Windows
```

This builds the image and runs it, and the app comes up at `http://localhost:8000`. There's a matching `stop-*` script for each platform to tear the container down.

The whole thing — frontend and backend — runs out of one Docker container: a single `Dockerfile` builds the Next.js frontend as a static export and serves it straight from FastAPI, so there's nothing else to stand up. The database is SQLite and gets wiped and recreated from scratch every time the container starts, so nothing persists across restarts — that's intentional for now, not a bug.

If you'd rather not use the helper scripts, the equivalent by hand is:

```
docker build -t prelegal .
docker run -d --name prelegal -p 8000:8000 --env-file .env prelegal
```

## Working on it locally

For frontend or backend changes you don't need Docker at all.

Backend (`backend/`) is a `uv` project:

```
cd backend
uv sync
uv run uvicorn prelegal_backend.main:app --reload --port 8000
uv run pytest
```

Frontend (`frontend/`) is a standard Next.js app:

```
cd frontend
npm install
npm run dev
npm test
```

When running the two separately like this, the frontend dev server and the backend won't share a port, so requests from the frontend to `/api/*` will need the backend running on 8000 as well — the static-export-served-by-FastAPI setup is what Docker gives you for free.
