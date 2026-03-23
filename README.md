# cf_ai_researchagent

An AI-powered research assistant built on Cloudflare's full-stack edge platform.

## What it does

ResearchAgent lets users ask research questions in natural language. For each query the
agent calls the Workers AI web-search tool to fetch current information, synthesizes the
results with Llama 3.3, and streams back a clear answer. Every query and its summary are
stored in the Durable Object's `researchHistory` so the sidebar always shows past searches.
Conversation context is preserved across turns for follow-up questions.

## Cloudflare products used

| Product | Role |
|---|---|
| **Workers AI** (Llama 3.3 70B fp8) | LLM inference + web-search tool |
| **Agents SDK** | `Agent` class with `onRequest` HTTP routing on the DO |
| **Durable Objects** | Per-user agent state (messages, researchHistory) |
| **D1** | Session persistence (query log) |
| **Workers Assets** | Hosts the vanilla HTML/CSS/JS frontend |

## Architecture

```
Browser (Workers Assets)
    │
    │  HTTP (CORS)
    ▼
Cloudflare Worker  ─── POST /agent/:userId/chat              ──►  StudyAgent DO
  (fetch handler)  ─── GET  /agent/:userId/history           ──►    │  state: {messages, researchHistory}
                   ─── GET  /agent/:userId/research-history  ──►    │  env.AI  ──► Workers AI (Llama 3.3 + web_search)
                                                                     │  env.DB  ──► D1 (sessions table)
```

### Agentic loop

1. User message → first AI call with `web_search_20250305` tool attached
2. If the model returns a `tool_use` block, a second AI call synthesizes the search results
3. Final reply saved to `researchHistory` in Durable Object state

## Prerequisites

- Node.js 18+
- Wrangler CLI (`npm i -g wrangler`)
- Cloudflare account with Workers AI enabled

## Local development

```bash
# 1. Install worker dependencies
cd worker
npm install

# 2. Create the D1 database (copy the database_id into wrangler.toml)
wrangler d1 create researchagent-db

# 3. Run the migration
wrangler d1 execute researchagent-db --file=worker/migrations/001_init.sql

# 4. Start the worker (from repo root)
cd ..
wrangler dev

# 5. Open frontend/index.html in your browser.
#    WORKER_URL defaults to http://localhost:8787
```

## Deploy

```bash
# Deploy the worker + frontend together (Workers Assets)
wrangler deploy
```

After deploying, the frontend is served from the same worker origin — no separate
Pages project needed.

## Bindings (wrangler.toml)

| Binding | Type | Notes |
|---|---|---|
| `AI` | Workers AI | automatic |
| `STUDY_AGENT` | Durable Object | `class_name = "StudyAgent"` |
| `DB` | D1 | Replace `database_id` with your real D1 database ID |
