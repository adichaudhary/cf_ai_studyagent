# PROMPTS.md

Documents every Claude Code prompt used to build `cf_ai_studyagent`, in order.

---

## Prompt 1 — Project scaffold

**What it built:** The complete directory structure, config files, and empty entry files for the project.

**Prompt text:**

> Create a new Cloudflare AI agent project called `cf_ai_studyagent`.
>
> Scaffold the following structure:
> - `/worker` — a Cloudflare Worker using the `agents` SDK (npm i agents) that will serve as the backend
> - `/frontend` — a Cloudflare Pages app (vanilla HTML/CSS/JS, no framework) with a chat UI
> - `wrangler.toml` at root configured for the worker with Workers AI binding named AI, a Durable Objects binding named STUDY_AGENT, and a D1 database binding named DB
> - `README.md` placeholder
> - `PROMPTS.md` placeholder
>
> Use TypeScript throughout. Initialize a `package.json` in `/worker` with dependencies: `agents`, `@cloudflare/workers-types`.
>
> Do not write any logic yet — just the scaffold, configs, and empty entry files.

---

## Prompt 2 — StudyAgent class

**What it built:** `worker/src/agent.ts` — the Durable Object agent with state management and three callable methods.

**Prompt text:**

> In `/worker/src/agent.ts`, implement a `StudyAgent` class that extends `Agent` from the `agents` SDK.
>
> The agent should:
> 1. Maintain state with this shape:
>    - `topic: string` — current study topic
>    - `messages: { role: "user" | "assistant", content: string }[]` — full conversation history
>    - `sessionCount: number` — how many sessions this user has had
>
> 2. Expose a `@callable()` method `chat(userMessage: string): Promise<string>` that:
>    - Appends the user message to `this.state.messages`
>    - Calls Workers AI with model `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
>    - Uses a system prompt: "You are a focused study assistant. The user is studying: {topic}. Keep answers concise, educational, and ask follow-up questions to test understanding."
>    - Includes the full conversation history as the messages array
>    - Appends the assistant reply to state
>    - Returns the assistant reply
>
> 3. Expose a `@callable()` method `setTopic(topic: string)` that sets `this.state.topic` and resets message history.
>
> 4. Expose a `@callable()` method `getHistory(): Message[]` that returns `this.state.messages`.
>
> Use `this.setState()` for all state mutations. Import `Env` type that includes `AI: Ai`.

---

## Prompt 3 — Worker fetch handler

**What it built:** `worker/src/index.ts` — the Worker with CORS-aware routing to the Durable Object agent.

**Prompt text:**

> In `/worker/src/index.ts`, create the Cloudflare Worker fetch handler.
>
> It should:
> 1. Route `GET /` to serve a redirect or simple health check JSON
> 2. Route `POST /agent/:userId/chat` — parse JSON body `{ message: string }`, get or create a Durable Object stub for that userId using STUDY_AGENT binding, call the agent's `chat` method, return `{ reply }` as JSON
> 3. Route `POST /agent/:userId/topic` — parse JSON body `{ topic: string }`, call `setTopic` on the agent stub
> 4. Route `GET /agent/:userId/history` — call `getHistory` on the stub, return as JSON
> 5. Add CORS headers to all responses so the Pages frontend can call it
>
> Export the `StudyAgent` class as a named export (required for Durable Objects).
> Export the default fetch handler.

---

## Prompt 4 — D1 persistence helpers

**What it built:** `worker/migrations/001_init.sql`, `worker/src/db.ts`, and updated `agent.ts` to persist sessions to D1.

**Prompt text:**

> In `/worker/src/db.ts`, add a D1 persistence helper.
>
> Create a migration SQL file at `/worker/migrations/001_init.sql`:
> - Table `sessions(user_id TEXT, topic TEXT, created_at INTEGER, message_count INTEGER)`
>
> In `db.ts`, export two functions:
> - `saveSession(db: D1Database, userId: string, topic: string, messageCount: number): Promise<void>`
> - `getRecentTopics(db: D1Database, userId: string): Promise<string[]>` — returns the last 5 distinct topics the user studied
>
> In the agent's `chat` method (update `agent.ts`), after each reply, call `saveSession` to upsert the current session into D1. This gives cross-agent-instance memory of what topics the user has covered.

---

## Prompt 5 — Full chat UI

**What it built:** `frontend/index.html` — the complete single-file dark-theme terminal-aesthetic chat interface.

**Prompt text:**

> In `/frontend/index.html`, build a single-file chat UI.
>
> Design requirements:
> - Dark theme, monospace font (JetBrains Mono from Google Fonts), terminal-inspired aesthetic
> - Header shows "StudyBuddy" and current topic (editable inline on click)
> - Chat window with scrollable message history — user messages right-aligned in orange, assistant messages left-aligned in white
> - Input bar at bottom with a text field and Send button
> - A "Recent Topics" sidebar on the left that loads from GET /agent/:userId/history on page load
> - On page load, generate a random userId and store in localStorage
>
> JavaScript behavior:
> - On send: POST to /agent/:userId/chat, append messages optimistically, show a typing indicator while waiting
> - On topic click/edit: POST to /agent/:userId/topic with the new topic, clear chat display (but don't clear server history)
> - Fetch recent topics on load from the D1 endpoint
>
> The WORKER_URL should be read from a `window.WORKER_URL` variable set at the top of the script (so it's easy to swap between local and deployed).
>
> All in one file, no build step, no frameworks.

---

## Prompt 6 — README and PROMPTS docs

**What it built:** Final `README.md` (architecture, dev, deploy instructions) and this `PROMPTS.md` file.

**Prompt text:**

> Write a complete `README.md` for the project `cf_ai_studyagent` that includes:
>
> 1. Project overview — what it does and which Cloudflare products it uses (Workers AI / Llama 3.3, Agents SDK / Durable Objects, D1, Pages)
> 2. Architecture diagram as ASCII art showing: Frontend (Pages) → Worker → [Durable Object (state + LLM calls), D1 (session history)]
> 3. Prerequisites: Node 18+, Wrangler CLI, Cloudflare account
> 4. Local dev instructions: `cd worker && npm i`, `wrangler d1 create studybuddy-db`, `wrangler d1 execute studybuddy-db --file=migrations/001_init.sql`, `wrangler dev`, open `frontend/index.html` directly in browser, set `window.WORKER_URL = 'http://localhost:8787'`
> 5. Deploy instructions: `wrangler deploy`, deploy frontend via `wrangler pages deploy frontend/`
> 6. Environment variables needed in `wrangler.toml`
>
> Also finalize `wrangler.toml` with: `main = "src/index.ts"`, Durable Objects migration tag, D1 binding with placeholder database_id, Workers AI binding, compatibility date set to today.
>
> Also write the `PROMPTS.md` file for this project. It should document each of the 6 Claude Code prompts used to build the project, labeled Prompt 1 through Prompt 6, with a one-sentence description of what each prompt built and the full prompt text.
