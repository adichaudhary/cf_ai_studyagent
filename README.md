# cf_ai_studyagent

An AI-powered study assistant built on Cloudflare's full-stack edge platform.

## What it does

StudyAgent is a per-user tutoring chatbot. You set a topic, then chat with the agent — it answers questions, explains concepts, and asks follow-up questions to test your understanding. Conversation state is held in a Durable Object so context is preserved across messages. Every session is logged to D1 so the sidebar shows your recent study topics.

## Cloudflare products used

| Product | Role |
|---|---|
| **Workers AI** (Llama 3.3 70B fp8-fast) | LLM inference |
| **Agents SDK** | `Agent` class with `onRequest` HTTP routing on the Durable Object |
| **Durable Objects** | Per-user agent state (messages, current topic, session count) |
| **D1** | Session persistence (recent topics history) |
| **Workers Assets** | Hosts the vanilla HTML/CSS/JS frontend |

## Architecture

```
Browser (Workers Assets)
    │
    │  HTTP (CORS)
    ▼
Cloudflare Worker  ─── POST /agent/:userId/chat          ──►  StudyAgent DO
  (fetch handler)  ─── POST /agent/:userId/topic         ──►    │  state: {topic, messages, sessionCount}
                   ─── GET  /agent/:userId/history        ──►    │  env.AI  ──► Workers AI (Llama 3.3)
                   ─── GET  /agent/:userId/recent-topics  ──►    │  env.DB  ──► D1 (sessions table)
```

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
wrangler d1 create studyagent-db

# 3. Run the migration
wrangler d1 execute studyagent-db --file=migrations/001_init.sql --local

# 4. Start the worker (from repo root)
cd ..
wrangler dev

# 5. Open frontend/index.html in your browser.
#    WORKER_URL defaults to http://localhost:8787 when on localhost
```

## Deploy

```bash
# Deploy the worker + frontend together (Workers Assets)
wrangler deploy
```

The frontend is served from the same worker origin — no separate Pages project needed.

## Bindings (wrangler.toml)

| Binding | Type | Notes |
|---|---|---|
| `AI` | Workers AI | automatic |
| `STUDY_AGENT` | Durable Object | `class_name = "StudyAgent"` |
| `DB` | D1 | Replace `database_id` with your real D1 database ID |
