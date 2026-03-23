export { StudyAgent } from "./agent";
export type { Env } from "./agent";

import type { Env } from "./agent";
import { getRecentTopics } from "./db";

// ------------------------------------------------------------------ //
// CORS helpers                                                         //
// ------------------------------------------------------------------ //
const CORS_HEADERS: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400): Response {
  return json({ error: message }, status);
}

async function callAgent(
  env: Env,
  userId: string,
  path: string,
  method: string,
  body?: unknown
): Promise<Response> {
  const id = env.STUDY_AGENT.idFromName(userId);
  const stub = env.STUDY_AGENT.get(id);
  return stub.fetch(
    new Request(`https://agent/${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-partykit-room": userId,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  );
}

// ------------------------------------------------------------------ //
// Default export — fetch handler                                       //
// ------------------------------------------------------------------ //
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname, method } = { pathname: url.pathname, method: request.method };

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (method === "GET" && pathname === "/") {
      return json({ status: "ok", service: "cf_ai_studyagent" });
    }

    const match = pathname.match(/^\/agent\/([^/]+)(\/.*)?$/);
    if (!match) return err("Not found", 404);

    const userId = decodeURIComponent(match[1]);
    const sub = match[2] ?? "/";

    // POST /agent/:userId/chat
    if (method === "POST" && sub === "/chat") {
      let body: { message?: string };
      try { body = await request.json(); } catch { return err("Invalid JSON body"); }
      if (!body.message) return err("message is required");

      const agentRes = await callAgent(env, userId, "chat", "POST", { message: body.message });
      if (!agentRes.ok) return err(await agentRes.text() || "Agent error", agentRes.status);
      const reply = await agentRes.json<string>();
      return json({ reply });
    }

    // POST /agent/:userId/topic
    if (method === "POST" && sub === "/topic") {
      let body: { topic?: string };
      try { body = await request.json(); } catch { return err("Invalid JSON body"); }
      if (!body.topic) return err("topic is required");

      const agentRes = await callAgent(env, userId, "topic", "POST", { topic: body.topic });
      if (!agentRes.ok) return err(await agentRes.text() || "Agent error", agentRes.status);
      return json({ ok: true });
    }

    // GET /agent/:userId/history
    if (method === "GET" && sub === "/history") {
      const agentRes = await callAgent(env, userId, "history", "GET");
      if (!agentRes.ok) return err(await agentRes.text() || "Agent error", agentRes.status);
      return json(await agentRes.json());
    }

    // GET /agent/:userId/recent-topics
    if (method === "GET" && sub === "/recent-topics") {
      const topics = await getRecentTopics(env.DB, userId);
      return json(topics);
    }

    return err("Not found", 404);
  },
} satisfies ExportedHandler<Env>;
