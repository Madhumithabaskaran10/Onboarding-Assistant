import { useEffect, useState } from "react";
import { api } from "../../api";
import { fmtDate } from "../../utils";
import StatusTabs from "./StatusTabs";
import "../employee/Trail.css";
import "../employee/Forms.css";
import "./Tables.css";
import "./Review.css";

const TABS = [
  ["open", "Waiting for you"],
  ["resolved", "Answered"],
];

function tone(c) {
  if (c >= 0.8) return "ok";
  if (c >= 0.6) return "warn";
  return "bad";
}

function Item({ item, onDone }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const q = item.chatbot_queries || {};
  const who = item.employees || {};
  const conf = Number(q.confidence ?? 0);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) {
      setError("Write a reply before you send.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.patch(`/hr/escalations/${item.id}/resolve`, { hr_response: text.trim() });
      onDone(item.id);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <li>
      <div className="who-line">
        <span>{who.full_name || "Unknown"} · {who.email}</span>
        <span>Asked {fmtDate(item.created_at.slice(0, 10))}</span>
      </div>
      <p className="q-text">{q.question}</p>

      <div className="answer-box">
        <span className={`status ${tone(conf)}`}>The assistant was {Math.round(conf * 100)}% sure</span>
        <p>{q.answer || "No answer was given."}</p>
      </div>

      {item.status === "open" ? (
        <form onSubmit={send}>
          <div className="field">
            <label htmlFor={`r-${item.id}`}>Your reply to {who.full_name?.split(" ")[0] || "the employee"}</label>
            <textarea id={`r-${item.id}`} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          {error && <p className="error-box" role="alert">{error}</p>}
          <button className="primary" type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send reply"}
          </button>
        </form>
      ) : (
        <p>Your reply: {item.hr_response}</p>
      )}
    </li>
  );
}

export default function Escalations() {
  const [tab, setTab] = useState("open");
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(null);
    setError("");
    api.get(`/hr/escalations?status=${tab}`).then(setItems).catch((e) => {
      setError(e.message);
      setItems([]);
    });
  }, [tab]);

  return (
    <>
      <h1 className="page-title">Questions</h1>
      <p className="sub">Questions the assistant wasn't sure about. Your reply goes straight to the employee.</p>

      <StatusTabs tabs={TABS} value={tab} onChange={setTab} label="Question status" />

      {error && <p className="error-box" role="alert">{error}</p>}
      {items === null && !error && <p className="sub">Loading…</p>}
      {items && items.length === 0 && !error && (
        <p className="sub">
          {tab === "open"
            ? "No questions are waiting. When the assistant isn't sure, the question shows up here."
            : "You haven't answered any questions yet."}
        </p>
      )}
      {items && items.length > 0 && (
        <ul className="queue">
          {items.map((it) => (
            <Item key={it.id} item={it} onDone={(id) => setItems((xs) => xs.filter((x) => x.id !== id))} />
          ))}
        </ul>
      )}
    </>
  );
}