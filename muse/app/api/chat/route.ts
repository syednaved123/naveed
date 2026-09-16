import Anthropic from "@anthropic-ai/sdk";
import {
  allTools,
  customToolNames,
  executeTool,
} from "@/lib/tools";

// The Anthropic SDK needs the Node.js runtime (not Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MODEL = process.env.MUSE_MODEL || "claude-opus-5";
const EFFORT = (process.env.MUSE_EFFORT || "medium") as
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";
const MAX_ITERATIONS = 12;

const SYSTEM_PROMPT = `You are Muse, a warm, sharp, and resourceful AI agent.

You have real tools and you use them proactively instead of guessing:
- web_search: search the live web for current information, facts, news, prices, docs.
- web_fetch: fetch and read a specific URL that appears in the conversation.
- get_current_datetime: get the real current date/time (never assume it).
- calculator: do exact arithmetic (never do non-trivial math in your head).

Guidelines:
- When a question depends on current or factual information you're unsure about, search the web rather than relying on memory. Cite sources with links when you use them.
- Think about which tool actually answers the question, then call it. You may call several tools before answering.
- Be concise and genuinely helpful. Use Markdown: short paragraphs, bullet lists, and fenced code blocks where useful.
- If a tool fails, tell the user plainly and try an alternative.`;

type ClientMessage = { role: "user" | "assistant"; content: string };

/** Encode one SSE event line. */
function sse(event: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "Server is missing ANTHROPIC_API_KEY. Copy .env.example to .env.local and add your key.",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  let body: { messages?: ClientMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const messages: Anthropic.MessageParam[] = incoming
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m) => ({ role: m.role, content: m.content }));

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return new Response(
      JSON.stringify({ error: "Expected a non-empty message list ending in a user turn." }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const client = new Anthropic();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        try {
          controller.enqueue(sse(event));
        } catch {
          /* controller already closed */
        }
      };

      try {
        for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
          const llm = client.messages.stream({
            model: MODEL,
            max_tokens: 8000,
            system: SYSTEM_PROMPT,
            tools: allTools as unknown as Anthropic.ToolUnion[],
            output_config: { effort: EFFORT },
            messages,
          } as Anthropic.MessageStreamParams);

          // Forward text as it is generated.
          llm.on("text", (delta) => send({ type: "text", text: delta }));

          const message = await llm.finalMessage();

          // Surface any tool activity (server tools + custom tools) as UI chips.
          for (const block of message.content) {
            if (block.type === "server_tool_use") {
              send({
                type: "tool",
                name: block.name,
                input: block.input,
              });
            } else if (block.type === "tool_use") {
              send({
                type: "tool",
                name: block.name,
                input: block.input,
              });
            }
          }

          // Terminal states.
          if (message.stop_reason === "end_turn") break;
          if (message.stop_reason === "refusal") {
            send({
              type: "text",
              text: "\n\n_(I can't help with that request.)_",
            });
            break;
          }
          if (message.stop_reason === "max_tokens") {
            send({
              type: "text",
              text: "\n\n_(Response truncated — hit the length limit.)_",
            });
            break;
          }

          // Server tool paused mid-turn: resume by echoing the assistant turn.
          if (message.stop_reason === "pause_turn") {
            messages.push({ role: "assistant", content: message.content });
            continue;
          }

          // Custom tool calls: execute locally and feed results back.
          const customCalls = message.content.filter(
            (b): b is Anthropic.ToolUseBlock =>
              b.type === "tool_use" && customToolNames.has(b.name),
          );

          if (customCalls.length === 0) {
            // No local tools to run and not a terminal reason we handle —
            // (e.g. a server tool already resolved inline). Stop cleanly.
            break;
          }

          messages.push({ role: "assistant", content: message.content });

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const call of customCalls) {
            const result = await executeTool(call.name, call.input);
            toolResults.push({
              type: "tool_result",
              tool_use_id: call.id,
              content: result,
            });
          }
          messages.push({ role: "user", content: toolResults });
        }
      } catch (err) {
        const msg =
          err instanceof Anthropic.APIError
            ? `API error ${err.status}: ${err.message}`
            : err instanceof Error
              ? err.message
              : "Unknown error";
        send({ type: "error", error: msg });
      } finally {
        send({ type: "done" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
