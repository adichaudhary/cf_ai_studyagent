import { Agent } from "agents";
import { saveSession } from "./db";

// ------------------------------------------------------------------ //
// Types                                                                //
// ------------------------------------------------------------------ //
export interface Env {
  AI: Ai;
  STUDY_AGENT: DurableObjectNamespace;
  DB: D1Database;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface StudyAgentState {
  topic: string;
  messages: Message[];
  sessionCount: number;
}

// ------------------------------------------------------------------ //
// StudyAgent                                                          //
// ------------------------------------------------------------------ //
export class StudyAgent extends Agent<Env, StudyAgentState> {
  initialState: StudyAgentState = {
    topic: "",
    messages: [],
    sessionCount: 0,
  };

  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+/, "");

    if (request.method === "POST" && path === "chat") {
      const { message } = await request.json<{ message: string }>();
      const reply = await this._chat(message);
      return Response.json(reply);
    }

    if (request.method === "POST" && path === "topic") {
      const { topic } = await request.json<{ topic: string }>();
      await this._setTopic(topic);
      return Response.json({ ok: true });
    }

    if (request.method === "GET" && path === "history") {
      return Response.json(this.state.messages);
    }

    return new Response("Not found", { status: 404 });
  }

  private async _chat(userMessage: string): Promise<string> {
    const updatedMessages: Message[] = [
      ...this.state.messages,
      { role: "user", content: userMessage },
    ];

    const systemPrompt =
      `You are a focused study assistant. The user is studying: ${this.state.topic || "a general topic"}. ` +
      `Keep answers concise, educational, and ask follow-up questions to test understanding.`;

    const response = await this.env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      {
        messages: [
          { role: "system", content: systemPrompt },
          ...updatedMessages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ],
      }
    );

    const reply =
      typeof response === "object" && response !== null && "response" in response
        ? (response as { response: string }).response
        : String(response);

    const finalMessages: Message[] = [
      ...updatedMessages,
      { role: "assistant", content: reply },
    ];

    this.setState({ ...this.state, messages: finalMessages });

    await saveSession(
      this.env.DB,
      this.name,
      this.state.topic,
      finalMessages.length
    );

    return reply;
  }

  private async _setTopic(topic: string): Promise<void> {
    this.setState({
      ...this.state,
      topic,
      messages: [],
      sessionCount: this.state.sessionCount + 1,
    });
  }
}
