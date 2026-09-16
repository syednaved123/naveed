# ✦ Muse — an AI agent with real tools

Muse is a full-stack AI agent, inspired by Meta's "muse"-style AI companions but
built as a genuine **tool-using agent** rather than a chat toy. Ask it anything;
it decides which tools to use, runs them, and reasons over the results — all
streamed live into the chat.

Powered by [Claude](https://www.anthropic.com/) via the Anthropic API.

> **Just want to use it? No setup, no coding.**
> Open **[`standalone/muse.html`](standalone/muse.html)** in your web browser —
> that single file *is* the whole app. See
> **[`standalone/HOW-TO-USE.md`](standalone/HOW-TO-USE.md)** for a 3-step guide.
> The Next.js version below is for hosting Muse on a real website.

## What it can do

Muse runs a real agentic loop on the server. On each turn Claude can call:

| Tool | What it does | Runs on |
| --- | --- | --- |
| **web_search** | Searches the live web for current facts, news, prices, docs | Anthropic servers |
| **web_fetch** | Fetches and reads a specific URL from the conversation | Anthropic servers |
| **calculator** | Exact arithmetic — `+ - * / % ^`, parentheses, `sqrt/sin/log/…`, `pi/e` | Your server |
| **get_current_datetime** | The real current date/time in any timezone | Your server |

Tool activity is surfaced live in the UI as chips ("Searching the web: …"),
and answers stream token-by-token with Markdown formatting and clickable
citations.

The UI also supports:

- **Streamed reasoning** — a collapsible "Thinking" trace shows Claude's
  summarized reasoning as it works.
- **Stop generation** — cancel an in-flight response; the request is aborted
  server-side too (no wasted tokens).
- **Conversation persistence** — your chat is saved to `localStorage` and
  restored on reload. "New chat" clears it.
- **Copy** — one-click copy of any reply.

## Architecture

```
Browser (app/page.tsx)
  │  POST /api/chat  { messages: [...] }        ← only user/assistant text
  ▼
Next.js route (app/api/chat/route.ts)   ← runs on the server, holds the API key
  │  agentic loop:  Claude → tool_use → execute → tool_result → Claude …
  │  streams Server-Sent Events back:  {type:"text"|"tool"|"error"|"done"}
  ▼
Anthropic API (Claude + server-side web tools)
```

- **Your API key never reaches the browser.** All Claude calls happen in the
  server route.
- The loop mixes Anthropic's **server-side** tools (web search/fetch) with
  **custom** tools executed in `lib/tools.ts`, and handles `pause_turn`,
  `refusal`, and `max_tokens` cleanly.
- Responses stream via SSE for a real-time feel.

## Getting started

Requires **Node.js 18.18+** (Node 20+ recommended).

```bash
cd muse
npm install

# add your key
cp .env.example .env.local
#   then edit .env.local and set ANTHROPIC_API_KEY=sk-ant-...

npm run dev
```

Open <http://localhost:3000>.

Get an API key at <https://console.anthropic.com/>.

## Configuration

Set these in `.env.local` (see `.env.example`):

| Variable | Default | Notes |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | _(required)_ | Your Anthropic API key. |
| `MUSE_MODEL` | `claude-opus-5` | Any Claude model id, e.g. `claude-sonnet-5` for lower cost. |
| `MUSE_EFFORT` | `medium` | Reasoning effort: `low`/`medium`/`high`/`xhigh`/`max`. |

## Scripts

```bash
npm run dev        # start the dev server
npm run build      # production build
npm run start      # run the production build
npm run typecheck  # tsc --noEmit
```

## Extending Muse with your own tools

Add a tool in three steps:

1. Declare it in `customTools` in `lib/tools.ts` (name, description, JSON schema).
2. Handle it in the `executeTool` switch.
3. (Optional) Give it a nice UI label in `toolLabel` in `app/page.tsx`.

The agent loop and streaming already handle the rest.

## Notes & limits

- Conversation memory is kept as plain user/assistant text between turns; the
  within-turn tool trace is not replayed on later turns (each turn can re-search
  as needed). This keeps the client simple and the payloads small.
- `web_fetch` only fetches URLs already present in the conversation.
- This is a starting point — no auth, rate limiting, or persistence. Add those
  before shipping to real users.
