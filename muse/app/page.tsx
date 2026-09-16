"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { renderMarkdown } from "@/lib/markdown";

type ToolActivity = { name: string; detail?: string };

type Message = {
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  tools?: ToolActivity[];
  error?: string;
};

const STORAGE_KEY = "muse:conversation";

const SUGGESTIONS = [
  {
    tag: "Web search",
    text: "What are the biggest AI announcements this week?",
  },
  {
    tag: "Research + math",
    text: "Convert 250 USD to EUR at today's rate and show the calculation.",
  },
  {
    tag: "Read a page",
    text: "Summarize the key points of https://www.anthropic.com/news",
  },
  {
    tag: "Time-aware",
    text: "What time is it right now in Tokyo and Dublin?",
  },
];

function toolLabel(name: string, input: unknown): ToolActivity {
  const args = (input ?? {}) as Record<string, unknown>;
  switch (name) {
    case "web_search":
      return { name: "Searching the web", detail: String(args.query ?? "") };
    case "web_fetch":
      return { name: "Reading page", detail: String(args.url ?? "") };
    case "calculator":
      return { name: "Calculating", detail: String(args.expression ?? "") };
    case "get_current_datetime":
      return { name: "Checking the time" };
    default:
      return { name };
  }
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const loadedRef = useRef(false);

  // Load any saved conversation on first mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {
      /* ignore corrupt/unavailable storage */
    }
    loadedRef.current = true;
  }, []);

  // Persist when idle (avoids a write per streamed token).
  useEffect(() => {
    if (!loadedRef.current || busy) return;
    try {
      if (messages.length === 0) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages, busy]);

  const scrollToBottom = useCallback(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const autosize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      const history: Message[] = [
        ...messages,
        { role: "user", content: trimmed },
      ];
      setMessages([...history, { role: "assistant", content: "", tools: [] }]);
      setInput("");
      setBusy(true);
      requestAnimationFrame(autosize);

      const wire = history.map((m) => ({ role: m.role, content: m.content }));
      const controller = new AbortController();
      abortRef.current = controller;

      const update = (fn: (m: Message) => Message) => {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = fn(next[next.length - 1]);
          return next;
        });
      };

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: wire }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const info = await res.json().catch(() => ({}));
          throw new Error(info.error || `Request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            const line = chunk.trim();
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload) continue;

            let event: {
              type: string;
              text?: string;
              name?: string;
              input?: unknown;
              error?: string;
            };
            try {
              event = JSON.parse(payload);
            } catch {
              continue;
            }

            if (event.type === "text" && event.text) {
              update((m) => ({ ...m, content: m.content + event.text }));
            } else if (event.type === "thinking" && event.text) {
              update((m) => ({
                ...m,
                thinking: (m.thinking ?? "") + event.text,
              }));
            } else if (event.type === "tool" && event.name) {
              const activity = toolLabel(event.name, event.input);
              update((m) => ({ ...m, tools: [...(m.tools ?? []), activity] }));
            } else if (event.type === "error" && event.error) {
              update((m) => ({ ...m, error: event.error }));
            }
          }
        }
      } catch (err) {
        if (controller.signal.aborted) {
          // User pressed Stop — keep whatever streamed so far.
          update((m) => ({
            ...m,
            content: m.content || "_(stopped)_",
          }));
        } else {
          const msg =
            err instanceof Error ? err.message : "Something went wrong.";
          update((m) => ({ ...m, error: msg }));
        }
      } finally {
        abortRef.current = null;
        setBusy(false);
      }
    },
    [busy, messages, autosize],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const newChat = () => {
    if (busy) return;
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const empty = messages.length === 0;

  return (
    <div className="app">
      <header className="header">
        <div className="logo">✦</div>
        <div className="title">
          <h1>Muse</h1>
          <span>An AI agent with real tools</span>
        </div>
        <div className="spacer" />
        {!empty && (
          <button className="new-chat" onClick={newChat} disabled={busy}>
            New chat
          </button>
        )}
      </header>

      {empty ? (
        <div className="empty">
          <div className="logo" style={{ width: 56, height: 56, fontSize: 28 }}>
            ✦
          </div>
          <h2>Meet Muse</h2>
          <p>
            Ask anything. Muse can search the live web, read pages, do exact
            math, and check the current time — then reason over what it finds.
          </p>
          <div className="suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.text}
                className="suggestion"
                onClick={() => send(s.text)}
              >
                <b>{s.tag}</b>
                {s.text}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="messages" ref={messagesRef}>
          {messages.map((m, i) => (
            <div className={`row ${m.role}`} key={i}>
              <div className={`avatar ${m.role}`}>
                {m.role === "assistant" ? "✦" : "🙂"}
              </div>
              <div className="bubble">
                {m.thinking && (
                  <details className="thinking">
                    <summary>Thinking</summary>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(m.thinking),
                      }}
                    />
                  </details>
                )}
                {m.tools && m.tools.length > 0 && (
                  <div className="tools">
                    {m.tools.map((t, j) => (
                      <span className="tool-chip" key={j} title={t.detail}>
                        <span className="dot" />
                        {t.name}
                        {t.detail ? `: ${truncate(t.detail)}` : ""}
                      </span>
                    ))}
                  </div>
                )}
                {m.role === "assistant" ? (
                  m.content ? (
                    <>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(m.content),
                        }}
                      />
                      {!busy && <CopyButton text={m.content} />}
                    </>
                  ) : (
                    !m.error && (
                      <div className="typing">
                        <span />
                        <span />
                        <span />
                      </div>
                    )
                  )
                ) : (
                  <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                )}
                {m.error && <div className="error-note">⚠ {m.error}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <form className="composer" onSubmit={onSubmit}>
        <div className="composer-inner">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autosize();
            }}
            onKeyDown={onKeyDown}
            placeholder="Ask Muse anything…"
            rows={1}
          />
          {busy ? (
            <button
              className="send stop"
              type="button"
              onClick={stop}
              aria-label="Stop"
              title="Stop generating"
            >
              ■
            </button>
          ) : (
            <button
              className="send"
              type="submit"
              disabled={!input.trim()}
              aria-label="Send"
            >
              ↑
            </button>
          )}
        </div>
        <div className="hint">
          Muse can make mistakes — it uses live tools, so double-check anything
          important.
        </div>
      </form>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="copy-btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      title="Copy reply"
    >
      {copied ? "✓ Copied" : "⧉ Copy"}
    </button>
  );
}

function truncate(s: string, n = 42): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
