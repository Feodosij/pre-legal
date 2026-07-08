# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory. The user can carry an AI chat in order to establish what document they want and how to fill in the fields. The available documents are covered in catalog.json file in the project root, included here:

@catalog.json

Before we start: the initial implementation was a frontend-only prototype that only supported the Mutual NDA document with no AI chat. The V1 technical foundation (Docker, FastAPI backend, static frontend) has since been built — see "Implementation status" below.

## Implementation status

- **Backend** (`backend/`): `uv` project using FastAPI (`backend/src/prelegal_backend/`). SQLite database is dropped and recreated from scratch on every startup (`init_db()` run in the app `lifespan`), with a `users` table and working `POST /api/auth/signup` / `POST /api/auth/signin` endpoints (PBKDF2 password hashing, stdlib only). `GET /api/health` is also available.
- **Frontend** (`frontend/`): Next.js app built as a static export (`next.config.ts` `output: "export"`). The Mutual NDA Creator lives at `/app`. `/` is a fake login screen (sign in/sign up tabs) with no real authentication or backend calls — submitting just navigates to `/app`, per the "no authentication yet" scope for V1.
- **AI chat** (`backend/src/prelegal_backend/chat.py`, `nda_chat.py`, `llm_client.py`; `frontend/src/components/NdaChat.tsx`, `frontend/src/hooks/useNdaChat.ts`): replaces the old manual form. A free-form chat at `/app` asks the user about the Mutual NDA's fields; `POST /api/chat/nda` is stateless per-request (the frontend sends the full message history plus accumulated fields each turn, and the backend returns the merged fields, a conversational reply, and an `isComplete` flag). The LLM call uses the mandated LiteLLM/OpenRouter free-tier model with Structured Outputs (`llm_client.py`). Still only supports the Mutual NDA.
- **Docker**: single multi-stage `Dockerfile` builds the frontend static export, installs the backend with `uv`, and serves the static build via FastAPI's `StaticFiles` (mounted after `/api/*` routes so they take precedence). Exposes port 8000.
- **Scripts**: `scripts/start-*` / `stop-*` for Mac, Linux, and Windows build/run/stop the Docker container, wired to `--env-file .env` for the OpenRouter key.
- **Tests**: `backend/tests/` (pytest + FastAPI TestClient) covers auth and AI chat happy/error paths. `frontend/` has a Vitest + React Testing Library setup covering the login page, the chat UI, and the chat hook/client.
- **Not yet implemented**: real authentication/session handling, and support for any document other than the Mutual NDA.

## Development process

When instructed to build a feature:

1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter with a free-tier model (same choice as the PM project), rather than a paid model with the Cerebras inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

## Technical design

The entire project should be packaged into a Docker container. The backend should be in backend/ and be a uv project, using FastAPI. The database should use SQLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in. The frontend should be in frontend/. Consider statically building the frontend and serving it via FastAPI, if that will work. There should be scripts in scripts/ for:

```
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

Backend available at http://localhost:8000

There is an OpenRouter API key in the .env file in the project root.

## Color Scheme

- Accent Yellow: #ecad0a
- Blue Primary: #209dd7
- Purple Secondary: #753991 (submit buttons)
- Dark Navy: #032147 (headings)
- Gray Text: #888888
