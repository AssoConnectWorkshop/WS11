"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { APP_VERSION } from "@/config/version";

type Message = { role: "user" | "assistant"; content: string };

const NAV_ITEMS = [
  { label: "Home", icon: "⊞" },
  { label: "Community", icon: "👥", hasChildren: true },
  { label: "Accounting", icon: "🧾", hasChildren: true },
  { label: "Business Account", icon: "🏦" },
  { label: "Payments", icon: "💳", hasChildren: true },
  { label: "Forms & Campaigns", icon: "📋", hasChildren: true },
  { label: "Website", icon: "🌐", hasChildren: true },
  { label: "Emailing", icon: "✉️", hasChildren: true },
  { label: "Exports & Analytics", icon: "📊", hasChildren: true },
  { label: "Master Admin", icon: "⚙️", hasChildren: true },
];

const SUGGESTIONS = [
  "How many active members do I have?",
  "List 10 contacts with their addresses",
  "Give me a summary of my association",
  "What should I focus on this month?",
];

function Sidebar() {
  return (
    <aside
      className="flex flex-col w-56 min-h-screen flex-none"
      style={{ background: "var(--gradient-cta)" }}
    >
      {/* Logo + org */}
      <div className="flex flex-col items-center gap-1 px-4 pt-6 pb-4">
        <div
          className="w-12 h-12 flex items-center justify-center"
          style={{ borderRadius: "var(--radius-xl)", background: "var(--color-white)" }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path
              d="M14 4C9.03 4 5 8.03 5 13c0 3.27 1.67 6.15 4.2 7.84L14 24l4.8-3.16A9 9 0 0 0 23 13c0-4.97-4.03-9-9-9Z"
              fill="#316BF2"
            />
            <path d="M14 10.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" fill="white" />
          </svg>
        </div>
        <span
          className="text-xs font-medium mt-1 truncate w-full text-center"
          style={{ color: "var(--color-white)", fontFamily: "var(--font-heading)", letterSpacing: "-0.3px" }}
        >
          Victor test 3…
        </span>
        <span
          className="text-xs font-medium px-2 py-0.5"
          style={{
            background: "var(--color-accent-yellow)",
            color: "var(--color-text-title)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-body)",
          }}
        >
          Chapter
        </span>
        <span
          className="text-xs mt-0.5"
          style={{ color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-body)" }}
        >
          Victor BUCHTER
        </span>
      </div>

      <div style={{ background: "rgba(255,255,255,0.15)", height: "1px", margin: "0 1rem" }} />

      {/* Nav items */}
      <nav className="flex flex-col flex-1 py-3 overflow-y-auto" style={{ gap: "2px", padding: "0.75rem 0.5rem" }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className="flex items-center w-full text-left"
            style={{
              gap: "var(--gap-s)",
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-md)",
              color: "rgba(255,255,255,0.75)",
              background: "transparent",
              fontFamily: "var(--font-body)",
              fontSize: "0.875rem",
              transition: "background var(--duration-fast) var(--easing-standard)",
              cursor: "pointer",
              border: "none",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ fontSize: "1rem", width: "1.25rem", textAlign: "center" }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.hasChildren && <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>›</span>}
          </button>
        ))}

        {/* PopliCOACH */}
        <div style={{ margin: "0.5rem 0" }}>
          <div style={{ background: "rgba(255,255,255,0.15)", height: "1px", marginBottom: "0.5rem" }} />
          <div
            className="flex items-center w-full"
            style={{
              gap: "var(--gap-s)",
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-md)",
              background: "rgba(255,255,255,0.2)",
              color: "var(--color-white)",
              fontFamily: "var(--font-heading)",
              fontSize: "0.875rem",
              letterSpacing: "-0.3px",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.25)",
            }}
          >
            <span style={{ fontSize: "1rem", width: "1.25rem", textAlign: "center" }}>✨</span>
            <span style={{ flex: 1 }}>PopliCOACH</span>
          </div>
        </div>
      </nav>

      {/* Settings */}
      <div style={{ padding: "0 0.5rem 1rem" }}>
        <div style={{ background: "rgba(255,255,255,0.15)", height: "1px", marginBottom: "0.75rem" }} />
        <button
          className="flex items-center w-full text-left"
          style={{
            gap: "var(--gap-s)",
            padding: "0.5rem 0.75rem",
            borderRadius: "var(--radius-md)",
            color: "rgba(255,255,255,0.6)",
            background: "transparent",
            fontFamily: "var(--font-body)",
            fontSize: "0.875rem",
            transition: "background var(--duration-fast) var(--easing-standard)",
            cursor: "pointer",
            border: "none",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ fontSize: "1rem", width: "1.25rem", textAlign: "center" }}>⚙</span>
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const assistantIndex = newMessages.length;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIndex] = { role: "assistant", content: accumulated };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantIndex] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-bg-grey)" }}>
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between flex-none"
          style={{
            background: "var(--color-white)",
            borderBottom: "1px solid var(--color-border)",
            padding: "0.75rem 1.5rem",
          }}
        >
          <div className="flex items-center" style={{ gap: "var(--gap-s)" }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: "2.25rem",
                height: "2.25rem",
                borderRadius: "var(--radius-md)",
                background: "var(--color-bg-blue)",
                fontSize: "1.1rem",
              }}
            >
              ✨
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1rem",
                  color: "var(--color-text-title)",
                  letterSpacing: "-0.6px",
                  margin: 0,
                }}
              >
                PopliCOACH
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  margin: 0,
                }}
              >
                AI analytics assistant for your association
              </p>
            </div>
          </div>
          <div className="flex items-center" style={{ gap: "var(--gap-s)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}>
              en_US
            </span>
            <div
              className="flex items-center justify-center text-white text-xs font-medium"
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "50%",
                background: "var(--gradient-cta)",
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.3px",
              }}
            >
              VB
            </div>
          </div>
        </header>

        {/* Chat area */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "var(--gap-m)" }}
        >
          {messages.length === 0 && (
            <div
              className="flex flex-col items-center"
              style={{ marginTop: "4rem", gap: "var(--gap-m)" }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: "3.5rem",
                  height: "3.5rem",
                  borderRadius: "var(--radius-xl)",
                  background: "var(--color-bg-blue)",
                  fontSize: "1.5rem",
                }}
              >
                ✨
              </div>
              <div className="text-center">
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "1.25rem",
                    color: "var(--color-text-title)",
                    letterSpacing: "-0.6px",
                    margin: "0 0 0.5rem",
                  }}
                >
                  How can I help you today?
                </h2>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.875rem",
                    color: "var(--color-text-muted)",
                    margin: 0,
                  }}
                >
                  Ask anything about your members, contacts, or finances.
                </p>
              </div>
              <div className="flex flex-wrap justify-center" style={{ gap: "var(--gap-s)", marginTop: "0.5rem" }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.8125rem",
                      color: "var(--color-primary)",
                      background: "var(--color-white)",
                      border: "1px solid var(--color-secondary)",
                      borderRadius: "var(--radius-3xl)",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      transition: "background var(--duration-fast) var(--easing-standard), border-color var(--duration-fast) var(--easing-standard)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--color-bg-blue)";
                      e.currentTarget.style.borderColor = "var(--color-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--color-white)";
                      e.currentTarget.style.borderColor = "var(--color-secondary)";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className="flex"
              style={{ justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}
            >
              {msg.role === "assistant" && (
                <div
                  className="flex items-center justify-center flex-none"
                  style={{
                    width: "1.75rem",
                    height: "1.75rem",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-bg-blue)",
                    fontSize: "0.875rem",
                    marginRight: "0.5rem",
                    marginTop: "0.25rem",
                  }}
                >
                  ✨
                </div>
              )}
              <div
                style={{
                  maxWidth: "72%",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-xl)",
                  borderBottomRightRadius: msg.role === "user" ? "var(--radius-xs)" : "var(--radius-xl)",
                  borderBottomLeftRadius: msg.role === "assistant" ? "var(--radius-xs)" : "var(--radius-xl)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.875rem",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                  ...(msg.role === "user"
                    ? {
                        background: "var(--gradient-cta)",
                        color: "var(--color-white)",
                      }
                    : {
                        background: "var(--color-white)",
                        color: "var(--color-text-body)",
                        border: "1px solid var(--color-border)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      }),
                }}
              >
                {msg.content || (
                  <span className="flex items-center" style={{ gap: "0.25rem", height: "1rem" }}>
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        style={{
                          width: "0.375rem",
                          height: "0.375rem",
                          borderRadius: "50%",
                          background: "var(--color-accent-mint)",
                          display: "inline-block",
                          animation: `bounce 1s ease-in-out ${delay}ms infinite`,
                        }}
                      />
                    ))}
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div
          style={{
            flexShrink: 0,
            background: "var(--color-white)",
            borderTop: "1px solid var(--color-border)",
            padding: "1rem 1.5rem",
          }}
        >
          <form
            onSubmit={send}
            className="flex"
            style={{ gap: "var(--gap-s)", maxWidth: "48rem", margin: "0 auto" }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your association…"
              disabled={loading}
              style={{
                flex: 1,
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "0.625rem 1rem",
                fontFamily: "var(--font-body)",
                fontSize: "0.875rem",
                color: "var(--color-text-body)",
                background: "var(--color-white)",
                outline: "none",
                transition: "border-color var(--duration-fast) var(--easing-standard)",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: "var(--gradient-cta)",
                color: "var(--color-white)",
                border: "none",
                borderRadius: "var(--radius-lg)",
                padding: "0.625rem 1.25rem",
                fontFamily: "var(--font-heading)",
                fontSize: "0.875rem",
                letterSpacing: "-0.3px",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                opacity: loading || !input.trim() ? 0.45 : 1,
                transition: "opacity var(--duration-fast) var(--easing-standard)",
              }}
            >
              Send
            </button>
          </form>
        </div>

        {/* Footer */}
        <div
          style={{
            flexShrink: 0,
            background: "var(--color-bg-grey)",
            borderTop: "1px solid var(--color-border)",
            padding: "0.375rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            Built with love avec mon cul et Claudo AI — {APP_VERSION}
          </span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            CGUV: yolo lol
          </span>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
