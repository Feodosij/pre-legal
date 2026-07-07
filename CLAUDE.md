# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory. The user can carry an AI chat in order to establish what document they want and how to fill in the fields. The available documents are covered in catalog.json file in the project root, included here:

@catalog.json

Before we start: the initial implementation is a frontend-only prototype that only supports the Mutual NDA document with no AI chat.

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
