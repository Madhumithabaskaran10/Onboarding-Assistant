import { useEffect, useRef, useState } from "react";
import { api } from "../../api";
import { fmtDate } from "../../utils";
import "./Trail.css";
import "./Chatbot.css";

const SUGGESTIONS = [
  "How many leave days do I get?",
  "What are the working hours?",
  "Can I work from home?",
];

function confidenceTone(c) {
  if (c >= 0.8) return "ok";
  if (c >= 0.6) return "warn";
  return "bad";
}

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [replies, setReplies] = useState(null);
  const logRef = useRef(null);

  function loadReplies() {
    api.get("/my/escalations").then(setReplies).catch(() => setReplies([]));
  }

  useEffect(() => {
    loadReplies();
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, busy]);

  async function send(question) {
    const q = question.trim();
    if (!q || busy) return;
    setError("");
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      const r = await api.post("/chat", { question: q });
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: r.answer,
          confidence: r.confidence,
          sources: r.sources || [],
          escalated: r.escalated,
        },
      ]);
      if (r.escalated) loadReplies();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    send(input);
  }

  return (
    <>
      <h1 className="page-title">Ask the assistant</h1>
      <p className="sub">
        Ask about leave, working hours, payroll and other company policies. Answers come only from
        the policy documents.
      </p>

      <div className="chat-log" ref={logRef} role="log" aria-live="polite" aria-label="Conversation">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>Try one of these, or type your own question.</p>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div className="msg me" key={i}>
              <p className="bubble">{m.text}</p>
            </div>
          ) : (
            <div className="msg bot" key={i}>
              <p className="bubble">{m.text}</p>
              <div className="meta">
                <span className={`status ${confidenceTone(m.confidence)}`}>
                  {Math.round(m.confidence * 100)}% sure
                </span>
                {m.sources.length > 0 && <span className="sources">From: {m.sources.join(", ")}</span>}
              </div>
              {m.escalated && (
                <p className="notice">
                  I wasn't sure about this one, so I sent it to HR. Their reply will appear under
                  "Questions sent to HR" below.
                </p>
              )}
            </div>
          )
        )}

        {busy && <p className="thinking">Looking through the policies…</p>}
      </div>

      {error && <p className="error-box" role="alert">{error}</p>}

      <form className="chat-form" onSubmit={onSubmit}>
        <label htmlFor="question" className="sr-only">Your question</label>
        <input
          id="question"
          type="text"
          maxLength={500}
          placeholder="Type your question"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={busy || !input.trim()}>Send</button>
      </form>

      <section className="hr-replies">
        <h2 className="section-title">Questions sent to HR</h2>
        {replies === null && <p className="sub">Loading…</p>}
        {replies && replies.length === 0 && (
          <p className="sub">
            Nothing here yet. When the assistant isn't sure, your question goes to HR and their
            reply shows up here.
          </p>
        )}
        {replies && replies.length > 0 && (
          <ul className="reply-list">
            {replies.map((r) => (
              <li key={r.id}>
                <div className="reply-head">
                  <strong>{r.chatbot_queries?.question || "Question"}</strong>
                  <span className={`status ${r.status === "resolved" ? "ok" : "warn"}`}>
                    {r.status === "resolved" ? "Answered" : "Waiting for HR"}
                  </span>
                </div>
                {r.status === "resolved" ? (
                  <p>{r.hr_response}</p>
                ) : (
                  <p className="muted">Asked on {fmtDate(r.created_at.slice(0, 10))}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}