"use client";

import { useState, useRef, useEffect, FormEvent } from "react";

type Message = { role: "user" | "assistant"; content: string };

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
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      <header className="border-b px-6 py-4 flex-none">
        <h1 className="text-xl font-semibold">Analytics Assistant</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ask anything about your association data</p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col gap-3 mt-8">
            <p className="text-sm text-gray-500 text-center">Start by asking about your members, contacts, or trends.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "How many active members do I have?",
                "Give me a summary of my association data",
                "What should I focus on this month?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-sm border rounded-full px-4 py-1.5 hover:bg-gray-50 transition-colors"
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
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-black text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-900 rounded-bl-sm"
              }`}
            >
              {msg.content || (
                <span className="inline-flex gap-1 items-center">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse delay-100">●</span>
                  <span className="animate-pulse delay-200">●</span>
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex-none border-t px-6 py-4 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your association..."
          disabled={loading}
          className="flex-1 border rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-black text-white rounded-full px-5 py-2 text-sm font-medium disabled:opacity-40 hover:bg-gray-800 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
