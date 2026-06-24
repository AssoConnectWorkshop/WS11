"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { APP_VERSION } from "@/config/version";
import VisualizationPanel, { VizItem } from "./VisualizationPanel";

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
  "Show me my latest email campaigns",
  "What's my account balance?",
];

function Sidebar() {
  return (
    <aside className="flex flex-col flex-none" style={{ width: "13rem", minHeight: "100vh", background: "var(--gradient-cta)" }}>
      <div className="flex flex-col items-center gap-1 px-4 pt-6 pb-4">
        <div className="flex items-center justify-center" style={{ width: "3rem", height: "3rem", borderRadius: "var(--radius-xl)", background: "var(--color-white)" }}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <path d="M14 4C9.03 4 5 8.03 5 13c0 3.27 1.67 6.15 4.2 7.84L14 24l4.8-3.16A9 9 0 0 0 23 13c0-4.97-4.03-9-9-9Z" fill="#316BF2" />
            <path d="M14 10.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" fill="white" />
          </svg>
        </div>
        <span style={{ color: "var(--color-white)", fontFamily: "var(--font-heading)", fontSize: "0.75rem", letterSpacing: "-0.3px", marginTop: "0.25rem" }}>Victor test 3…</span>
        <span style={{ background: "var(--color-accent-yellow)", color: "var(--color-text-title)", fontFamily: "var(--font-body)", fontSize: "0.6875rem", fontWeight: 500, padding: "0.125rem 0.5rem", borderRadius: "var(--radius-sm)" }}>Chapter</span>
        <span style={{ color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-body)", fontSize: "0.6875rem" }}>Victor BUCHTER</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.15)", height: "1px", margin: "0 1rem" }} />
      <nav className="flex flex-col flex-1 overflow-y-auto" style={{ padding: "0.75rem 0.5rem", gap: "2px" }}>
        {NAV_ITEMS.map((item) => (
          <button key={item.label} className="flex items-center w-full text-left" style={{ gap: "0.625rem", padding: "0.4rem 0.625rem", borderRadius: "var(--radius-md)", color: "rgba(255,255,255,0.7)", background: "transparent", fontFamily: "var(--font-body)", fontSize: "0.8125rem", transition: "background var(--duration-fast)", cursor: "pointer", border: "none" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <span style={{ fontSize: "0.9375rem", width: "1.125rem", textAlign: "center" }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.hasChildren && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.6875rem" }}>›</span>}
          </button>
        ))}
        <div style={{ margin: "0.5rem 0" }}>
          <div style={{ background: "rgba(255,255,255,0.15)", height: "1px", marginBottom: "0.5rem" }} />
          <div className="flex items-center w-full" style={{ gap: "0.625rem", padding: "0.4rem 0.625rem", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.18)", color: "var(--color-white)", fontFamily: "var(--font-heading)", fontSize: "0.8125rem", letterSpacing: "-0.3px", boxShadow: "0 0 0 1px rgba(255,255,255,0.25)" }}>
            <span style={{ fontSize: "0.9375rem", width: "1.125rem", textAlign: "center" }}>✨</span>
            <span>PopliCOACH</span>
          </div>
        </div>
      </nav>
      <div style={{ padding: "0 0.5rem 1rem" }}>
        <div style={{ background: "rgba(255,255,255,0.15)", height: "1px", marginBottom: "0.625rem" }} />
        <button className="flex items-center w-full text-left" style={{ gap: "0.625rem", padding: "0.4rem 0.625rem", borderRadius: "var(--radius-md)", color: "rgba(255,255,255,0.6)", background: "transparent", fontFamily: "var(--font-body)", fontSize: "0.8125rem", cursor: "pointer", border: "none", transition: "background var(--duration-fast)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
          <span style={{ fontSize: "0.9375rem" }}>⚙</span><span>Settings</span>
        </button>
      </div>
    </aside>
  );
}

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [vizItems, setVizItems] = useState<VizItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const vizIdRef = useRef(0);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setVizItems([]); // clear viz for new query

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
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const obj = JSON.parse(line) as { type: string; chunk?: string; tool?: string; data?: unknown };
            if (obj.type === "text" && obj.chunk != null) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantIndex] = { role: "assistant", content: obj.chunk! };
                return updated;
              });
            } else if (obj.type === "viz" && obj.tool) {
              const id = ++vizIdRef.current;
              setVizItems((prev) => [...prev, { tool: obj.tool!, data: obj.data, id }]);
            }
          } catch { /* ignore malformed lines */ }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantIndex] = { role: "assistant", content: "Sorry, something went wrong. Please try again." };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-bg-grey)" }}>
      <Sidebar />

      {/* Content: chat + viz side by side */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between flex-none" style={{ background: "var(--color-white)", borderBottom: "1px solid var(--color-border)", padding: "0.625rem 1.25rem" }}>
          <div className="flex items-center" style={{ gap: "var(--gap-s)" }}>
            <div className="flex items-center justify-center" style={{ width: "2rem", height: "2rem", borderRadius: "var(--radius-md)", background: "var(--color-bg-blue)", fontSize: "1rem" }}>✨</div>
            <div>
              <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "0.9375rem", color: "var(--color-text-title)", letterSpacing: "-0.6px", margin: 0 }}>PopliCOACH</h1>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6875rem", color: "var(--color-text-muted)", margin: 0 }}>AI analytics assistant for your association</p>
            </div>
          </div>
          <div className="flex items-center" style={{ gap: "var(--gap-s)" }}>
            <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}>en_US</span>
            <div className="flex items-center justify-center text-white" style={{ width: "1.875rem", height: "1.875rem", borderRadius: "50%", background: "var(--gradient-cta)", fontFamily: "var(--font-heading)", fontSize: "0.6875rem", letterSpacing: "-0.3px" }}>VB</div>
          </div>
        </header>

        {/* Split: chat | viz */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat panel */}
          <div className="flex flex-col overflow-hidden" style={{ width: "420px", flexShrink: 0, borderRight: "1px solid var(--color-border)" }}>
            <div className="flex-1 overflow-y-auto" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "var(--gap-m)" }}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center" style={{ marginTop: "3rem", gap: "var(--gap-m)" }}>
                  <div className="flex items-center justify-center" style={{ width: "3rem", height: "3rem", borderRadius: "var(--radius-xl)", background: "var(--color-bg-blue)", fontSize: "1.375rem" }}>✨</div>
                  <div className="text-center">
                    <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", color: "var(--color-text-title)", letterSpacing: "-0.6px", margin: "0 0 0.375rem" }}>How can I help?</h2>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>Ask anything — data appears on the right.</p>
                  </div>
                  <div className="flex flex-wrap justify-center" style={{ gap: "var(--gap-s)" }}>
                    {SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => setInput(s)} style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-primary)", background: "var(--color-white)", border: "1px solid var(--color-secondary)", borderRadius: "var(--radius-3xl)", padding: "0.4rem 0.875rem", cursor: "pointer", transition: "background var(--duration-fast), border-color var(--duration-fast)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg-blue)"; e.currentTarget.style.borderColor = "var(--color-primary)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-white)"; e.currentTarget.style.borderColor = "var(--color-secondary)"; }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className="flex" style={{ justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center justify-center flex-none" style={{ width: "1.5rem", height: "1.5rem", borderRadius: "var(--radius-md)", background: "var(--color-bg-blue)", fontSize: "0.75rem", marginRight: "0.375rem", marginTop: "0.25rem" }}>✨</div>
                  )}
                  <div style={{
                    maxWidth: "82%",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "var(--radius-xl)",
                    borderBottomRightRadius: msg.role === "user" ? "var(--radius-xs)" : "var(--radius-xl)",
                    borderBottomLeftRadius: msg.role === "assistant" ? "var(--radius-xs)" : "var(--radius-xl)",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.8125rem",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    ...(msg.role === "user"
                      ? { background: "var(--gradient-cta)", color: "var(--color-white)" }
                      : { background: "var(--color-white)", color: "var(--color-text-body)", border: "1px solid var(--color-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }),
                  }}>
                    {msg.content || (
                      <span className="flex items-center" style={{ gap: "0.25rem", height: "1rem" }}>
                        {[0, 150, 300].map((d) => (
                          <span key={d} style={{ width: "0.3125rem", height: "0.3125rem", borderRadius: "50%", background: "var(--color-accent-mint)", display: "inline-block", animation: `bounce 1s ease-in-out ${d}ms infinite` }} />
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ flexShrink: 0, background: "var(--color-white)", borderTop: "1px solid var(--color-border)", padding: "0.875rem 1rem" }}>
              <form onSubmit={send} className="flex" style={{ gap: "var(--gap-s)" }}>
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your association…" disabled={loading}
                  style={{ flex: 1, border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "0.5rem 0.875rem", fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--color-text-body)", background: "var(--color-white)", outline: "none", transition: "border-color var(--duration-fast)" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }} />
                <button type="submit" disabled={loading || !input.trim()} style={{ background: "var(--gradient-cta)", color: "var(--color-white)", border: "none", borderRadius: "var(--radius-lg)", padding: "0.5rem 1rem", fontFamily: "var(--font-heading)", fontSize: "0.8125rem", letterSpacing: "-0.3px", cursor: loading || !input.trim() ? "not-allowed" : "pointer", opacity: loading || !input.trim() ? 0.45 : 1, transition: "opacity var(--duration-fast)" }}>
                  Send
                </button>
              </form>
            </div>
          </div>

          {/* Visualization panel */}
          <div className="flex-1 overflow-y-auto" style={{ padding: "1.25rem", background: "var(--color-bg-grey)" }}>
            <div style={{ marginBottom: "0.875rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "0.8125rem", color: "var(--color-text-title)", letterSpacing: "-0.3px", margin: 0 }}>Data Visualizations</h2>
              {vizItems.length > 0 && (
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.625rem", color: "var(--color-text-muted)", background: "var(--color-secondary)", padding: "0.125rem 0.5rem", borderRadius: "var(--radius-sm)" }}>
                  {vizItems.length} result{vizItems.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <VisualizationPanel items={vizItems} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex-none flex items-center justify-between" style={{ background: "var(--color-white)", borderTop: "1px solid var(--color-border)", padding: "0.3rem 1.25rem" }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.625rem", color: "var(--color-text-muted)" }}>Built with love avec mon cul et Claudo AI — {APP_VERSION}</span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.625rem", color: "var(--color-text-muted)" }}>CGUV: yolo lol</span>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </div>
  );
}
