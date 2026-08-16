import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { STORAGE_KEYS, uid, useStored } from "@/lib/storage";
import { TUTOR_SUGGESTIONS, tutorReply } from "@/lib/tutor";
import type { ChatMessage } from "@/lib/types";

export const Route = createFileRoute("/tutor")({
  head: () => ({
    meta: [
      { title: "AI Study Tutor — Study Sync" },
      { name: "description", content: "Ask maths, physics, chemistry and revision questions and get step-by-step explanations." },
      { property: "og:title", content: "AI Study Tutor — Study Sync" },
      { property: "og:description", content: "A chat tutor that explains equations, concepts and study plans." },
    ],
  }),
  component: TutorPage,
});

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "tutor",
  text: "Hi! I'm your Study Sync tutor.\nAsk me an equation, a science concept, or “plan my revision” and I'll walk you through it step by step.",
};

function TutorPage() {
  const [messages, setMessages] = useStored<ChatMessage[]>(STORAGE_KEYS.chat, [WELCOME]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function send(text: string) {
    const question = text.trim();
    if (!question || typing) return;
    setMessages((current) => [...current, { id: uid(), role: "user", text: question }]);
    setInput("");
    setTyping(true);
    window.setTimeout(() => {
      setMessages((current) => [...current, { id: uid(), role: "tutor", text: tutorReply(question) }]);
      setTyping(false);
    }, 550);
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="AI Study Tutor"
        title="Ask anything, learn the method"
        subtitle="Worked solutions for maths and science, plus revision coaching. Your chat is saved on this device."
      />

      <section className="card" style={{ marginTop: 8 }}>
        <div className="chat">
          <div className="chat__log" ref={logRef}>
            {messages.map((m) => (
              <div key={m.id} className={`bubble${m.role === "user" ? " bubble--me" : ""}`}>
                {m.text}
              </div>
            ))}
            {typing ? <div className="bubble muted">Tutor is thinking…</div> : null}
          </div>

          <div className="stack" style={{ gap: 10 }}>
            <div className="chips">
              {TUTOR_SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
            <form
              className="chat__form"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input
                className="input"
                placeholder="e.g. solve 4x + 8 = 24"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button className="btn btn--primary" type="submit">
                Send
              </button>
            </form>
            <button
              className="btn btn--ghost btn--sm btn--danger"
              onClick={() => setMessages([WELCOME])}
              style={{ justifySelf: "start" }}
            >
              Clear conversation
            </button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
