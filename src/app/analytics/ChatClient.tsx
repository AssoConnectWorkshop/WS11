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

function Sidebar({ active }: { active: string }) {
  return (
    <aside
      className="flex flex-col w-56 min-h-screen flex-none"
      style={{ background: "#1B3B99" }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center gap-1 px-4 pt-5 pb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "#fff" }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path
              d="M14 4C9.03 4 5 8.03 5 13c0 3.27 1.67 6.15 4.2 7.84L14 24l4.8-3.16A9 9 0 0 0 23 13c0-4.97-4.03-9-9-9Z"
              fill="#E8334A"
            />
            <path d="M14 10.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" fill="#fff" />
          </svg>
        </div>
        <span className="text-white text-xs font-semibold mt-1 truncate w-full text-center">
          Victor test 3…
        </span>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ background: "#F59E0B", color: "#fff" }}
        >
          Chapter
        </span>
        <span className="text-white/60 text-xs mt-0.5">Victor BUCHTER</span>
      </div>

      <div className="w-full h-px" style={{ background: "rgba(255,255,255,0.15)" }} />

      {/* Navigation */}
      <nav className="flex flex-col flex-1 px-2 py-3 gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
            style={{
              color: "rgba(255,255,255,0.75)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.hasChildren && (
              <span className="text-white/40 text-xs">›</span>
            )}
          </button>
        ))}

        {/* PopliCOACH — active */}
        <div className="mt-2">
          <div className="w-full h-px mb-2" style={{ background: "rgba(255,255,255,0.15)" }} />
          <div
            className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: "rgba(255,255,255,0.18)",
              color: "#fff",
            }}
          >
            <span className="text-base w-5 text-center">✨</span>
            <span className="flex-1">PopliCOACH</span>
          </div>
        </div>
      </nav>

      {/* Settings */}
      <div className="px-2 pb-4">
        <div className="w-full h-px mb-3" style={{ background: "rgba(255,255,255,0.15)" }} />
        <button
          className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: "rgba(255,255,255,0.65)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(255,255,255,0.1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
          }}
        >
          <span className="text-base w-5 text-center">⚙</span>
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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar active="PopliCOACH" />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 bg-white border-b flex-none">
          <div className="flex items-center gap-3">
            <span className="text-lg">✨</span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">PopliCOACH</h1>
              <p className="text-xs text-gray-400">AI analytics assistant for your association</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">en_US</span>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "#1B3B99" }}
            >
              VB
            </div>
          </div>
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-4 mt-16">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: "#EEF2FF" }}
              >
                ✨
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-800">How can I help you today?</h2>
                <p className="text-sm text-gray-400 mt-1">Ask anything about your members, contacts, or finances.</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {[
                  "How many active members do I have?",
                  "List 10 contacts with their addresses",
                  "Give me a summary of my association",
                  "What should I focus on this month?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="text-sm border rounded-full px-4 py-2 bg-white hover:bg-gray-50 transition-colors text-gray-600 shadow-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2 flex-none mt-0.5"
                  style={{ background: "#EEF2FF" }}
                >
                  ✨
                </div>
              )}
              <div
                className="max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed"
                style={
                  msg.role === "user"
                    ? { background: "#1B3B99", color: "#fff", borderBottomRightRadius: "4px" }
                    : { background: "#fff", color: "#1a1a1a", borderBottomLeftRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                }
              >
                {msg.content || (
                  <span className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="flex-none bg-white border-t px-6 py-4">
          <form onSubmit={send} className="flex gap-3 max-w-3xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your association…"
              disabled={loading}
              className="flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 disabled:opacity-50"
              style={{ "--tw-ring-color": "#1B3B99" } as React.CSSProperties}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="text-white rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-40 transition-opacity"
              style={{ background: "#1B3B99" }}
            >
              Send
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="flex-none bg-white border-t px-6 py-1.5 flex items-center justify-between text-xs text-gray-300">
          <span>Built with love avec mon cul et Claudo AI — {APP_VERSION}</span>
          <span>CGUV: yolo lol</span>
        </div>
      </div>
    </div>
  );
}
