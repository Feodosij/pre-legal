# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory. The user can carry an AI chat in order to establish what document they want and how to fill in the fields. The available documents are covered in catalog.json file in the project root, included here:

@catalog.json

Before we start: the initial implementation was a frontend-only prototype that only supported the Mutual NDA document with no AI chat. The V1 technical foundation (Docker, FastAPI backend, static frontend) has since been built, followed by AI chat, multi-document support, and now real multi-user auth with document history — see "Implementation status" below.

## Implementation status

- **Backend** (`backend/`): `uv` project using FastAPI (`backend/src/prelegal_backend/`). SQLite database is dropped and recreated from scratch on every startup (`init_db()` run in the app `lifespan`), with `users`, `sessions`, and `documents` tables. `GET /api/health` is also available.
- **Auth** (`backend/src/prelegal_backend/auth.py`, `sessions.py`, `security.py`; `frontend/src/hooks/useAuth.tsx`, `useRequireAuth.ts`, `frontend/src/lib/auth-client.ts`): `POST /api/auth/signup` / `POST /api/auth/signin` create a user (PBKDF2 password hashing, stdlib only) and issue an httpOnly session cookie backed by an opaque token in the `sessions` table (also stdlib only — no new dependency). `GET /api/auth/me` and `POST /api/auth/signout` round it out. `/` is a real login/signup screen wired to these endpoints. `/app` and `/app/history` are gated behind auth: since the frontend is a static export with no server-side middleware, the gate is client-side — each page checks `useAuth()`'s resolved user and redirects to `/` if signed out.
- **AI chat, multi-document** (`backend/src/prelegal_backend/chat.py`, `chat_engine.py`, `routing.py`, `documents/`, `llm_client.py`; `frontend/src/components/Chat.tsx`, `frontend/src/hooks/useChat.ts`): a free-form chat at `/app` first asks what document the user wants, then collects that document's fields. `POST /api/chat/message` is stateless per-request (the frontend sends the full message history, the current `documentId` — null until routing resolves it — and accumulated fields each turn). A `DocumentDefinition` registry (`backend/src/prelegal_backend/documents/registry.py`) currently supports **Mutual NDA, Pilot Agreement, and Design Partner Agreement**; `chat_engine.py` generically drives field extraction/merging for any registered document. `routing.py` handles the document-selection turn: it feeds the full `catalog.json` list to the LLM, which either sets `documentId` (if one of the 3 supported documents matches) or `suggestedDocumentId` (the closest supported alternative, with an explanation in `reply`) for any of the other 8 catalog documents, which are not yet generatable. Since the routing turn's structured output has no field properties, `chat.py` runs the extraction turn immediately in the same request once routing resolves a `documentId`, so anything the user already stated in that first message is captured right away rather than waiting for the next turn. The LLM call uses the mandated LiteLLM/OpenRouter free-tier model with Structured Outputs (`llm_client.py`).
- **Document rendering**: Mutual NDA keeps its original hand-authored renderer (`frontend/src/lib/nda-content.ts`, `NdaDocument.tsx`, `NdaPdfDocument.tsx`) unchanged. Pilot Agreement and Design Partner Agreement (which have no separate cover-page template file, unlike Mutual NDA) use a generic backend-side renderer instead: `POST /api/documents/{document_id}/render` (`backend/src/prelegal_backend/documents/render.py`) substitutes collected field values directly into the real `templates/*/*.md` text and parses it into structured `Section`/`Subsection` JSON, which generic frontend components (`GenericDocument.tsx`, `GenericPdfDocument.tsx`) render as HTML/PDF — no hand-authored JSX needed per document, so this path scales to more documents later.
- **Document history** (`backend/src/prelegal_backend/documents_router.py`; `frontend/src/lib/document-client.ts`, `frontend/src/app/app/history/`): completed documents are saved to the `documents` table, scoped to the owning user, via `POST` / `GET` / `PUT` `/api/documents[...]`. The document creator on `/app` auto-saves once a chat turn reports `isComplete` (creating on the first save, updating on later ones if the user keeps refining fields). `/app/history` lists a user's saved documents and re-renders any of them on selection (NDA via the hand-authored renderer, others via the generic one), with the same PDF download available from the creator page.
- **UI**: `/app` and `/app/history` (`frontend/src/app/app/page.tsx`, `frontend/src/app/app/history/page.tsx`) share a header (`Header.tsx`) with nav between the two pages, the signed-in user's email, and sign out. Both pages fill the viewport height below the header with no page-level scroll — the chat panel, and the document preview / history list and detail panes, each scroll independently. A `DisclaimerBanner` ("draft only, not legal advice, have counsel review it") appears on both pages. `/app`'s chat and preview panels update live after every turn as before, with a "Download PDF" button once a document is selected and a "Saved to your documents" indicator once a completed document has been persisted. The chat panel (`Chat.tsx`) shows message bubbles with sender avatars and an animated typing indicator while a turn is in flight.
- **Docker**: single multi-stage `Dockerfile` builds the frontend static export, installs the backend with `uv`, and serves the static build via FastAPI's `StaticFiles` (mounted after `/api/*` routes so they take precedence). Also copies `catalog.json` and `templates/` into the image (`PRELEGAL_CATALOG_PATH`, `PRELEGAL_TEMPLATES_DIR`) since the backend now reads them at runtime. Exposes port 8000.
- **Scripts**: `scripts/start-*` / `stop-*` for Mac, Linux, and Windows build/run/stop the Docker container, wired to `--env-file .env` for the OpenRouter key.
- **Tests**: `backend/tests/` (pytest + FastAPI TestClient) covers auth and the session cookie flow, documents CRUD with per-user ownership scoping, chat routing/field-collection (including a regression test for same-turn extraction on the first message), the generic chat engine (tested against a fake document spec to prove it's document-agnostic), and template rendering (including against the real Pilot Agreement template). `frontend/` has a Vitest + React Testing Library setup covering the login page, auth/document API clients, the chat UI/hook, the document-history page, the generic document renderer, and the render-request client.
- **Not yet implemented**: support for the other 8 catalog documents (csa, sla, psa, dpa, software-license-agreement, partnership-agreement, baa, ai-addendum) beyond the graceful "closest supported alternative" fallback. Sessions and documents are also not durable across restarts, since the whole SQLite database is intentionally recreated from scratch on every startup.

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
