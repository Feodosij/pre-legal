# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory. The user can carry an AI chat in order to establish what document they want and how to fill in the fields. The available documents are covered in catalog.json file in the project root, included here:

@catalog.json

Before we start: the initial implementation was a frontend-only prototype that only supported the Mutual NDA document with no AI chat. The V1 technical foundation (Docker, FastAPI backend, static frontend) has since been built — see "Implementation status" below.

## Implementation status

- **Backend** (`backend/`): `uv` project using FastAPI (`backend/src/prelegal_backend/`). SQLite database is dropped and recreated from scratch on every startup (`init_db()` run in the app `lifespan`), with a `users` table and working `POST /api/auth/signup` / `POST /api/auth/signin` endpoints (PBKDF2 password hashing, stdlib only). `GET /api/health` is also available.
- **Frontend** (`frontend/`): Next.js app built as a static export (`next.config.ts` `output: "export"`). The document creator lives at `/app`. `/` is a fake login screen (sign in/sign up tabs) with no real authentication or backend calls — submitting just navigates to `/app`, per the "no authentication yet" scope for V1.
- **AI chat, multi-document** (`backend/src/prelegal_backend/chat.py`, `chat_engine.py`, `routing.py`, `documents/`, `llm_client.py`; `frontend/src/components/Chat.tsx`, `frontend/src/hooks/useChat.ts`): a free-form chat at `/app` first asks what document the user wants, then collects that document's fields. `POST /api/chat/message` is stateless per-request (the frontend sends the full message history, the current `documentId` — null until routing resolves it — and accumulated fields each turn). A `DocumentDefinition` registry (`backend/src/prelegal_backend/documents/registry.py`) currently supports **Mutual NDA, Pilot Agreement, and Design Partner Agreement**; `chat_engine.py` generically drives field extraction/merging for any registered document. `routing.py` handles the document-selection turn: it feeds the full `catalog.json` list to the LLM, which either sets `documentId` (if one of the 3 supported documents matches) or `suggestedDocumentId` (the closest supported alternative, with an explanation in `reply`) for any of the other 8 catalog documents, which are not yet generatable. The LLM call uses the mandated LiteLLM/OpenRouter free-tier model with Structured Outputs (`llm_client.py`).
- **Document rendering**: Mutual NDA keeps its original hand-authored renderer (`frontend/src/lib/nda-content.ts`, `NdaDocument.tsx`, `NdaPdfDocument.tsx`) unchanged. Pilot Agreement and Design Partner Agreement (which have no separate cover-page template file, unlike Mutual NDA) use a generic backend-side renderer instead: `POST /api/documents/{document_id}/render` (`backend/src/prelegal_backend/documents/render.py`) substitutes collected field values directly into the real `templates/*/*.md` text and parses it into structured `Section`/`Subsection` JSON, which generic frontend components (`GenericDocument.tsx`, `GenericPdfDocument.tsx`) render as HTML/PDF — no hand-authored JSX needed per document, so this path scales to more documents later.
- **UI**: `/app` (`frontend/src/app/app/page.tsx`) is a two-column layout — chat on the left, a live document preview on the right that updates automatically after every turn (no button click needed) for all three supported documents, with a "Download PDF" button once a document is selected. The chat panel (`Chat.tsx`) shows message bubbles with sender avatars and an animated typing indicator while a turn is in flight.
- **Docker**: single multi-stage `Dockerfile` builds the frontend static export, installs the backend with `uv`, and serves the static build via FastAPI's `StaticFiles` (mounted after `/api/*` routes so they take precedence). Also copies `catalog.json` and `templates/` into the image (`PRELEGAL_CATALOG_PATH`, `PRELEGAL_TEMPLATES_DIR`) since the backend now reads them at runtime. Exposes port 8000.
- **Scripts**: `scripts/start-*` / `stop-*` for Mac, Linux, and Windows build/run/stop the Docker container, wired to `--env-file .env` for the OpenRouter key.
- **Tests**: `backend/tests/` (pytest + FastAPI TestClient) covers auth, chat routing/field-collection, the generic chat engine (tested against a fake document spec to prove it's document-agnostic), and template rendering (including against the real Pilot Agreement template). `frontend/` has a Vitest + React Testing Library setup covering the login page, the chat UI/hook, the generic document renderer, and the render-request client.
- **Not yet implemented**: real authentication/session handling, and support for the other 8 catalog documents (csa, sla, psa, dpa, software-license-agreement, partnership-agreement, baa, ai-addendum) beyond the graceful "closest supported alternative" fallback.

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
