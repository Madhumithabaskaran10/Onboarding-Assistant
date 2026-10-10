import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import Status from "../../components/Status";
import { fmtDate, taskKind } from "../../utils";
import "./Trail.css";

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/me"), api.get("/my/tasks")])
      .then(([m, t]) => { setMe(m); setTasks(t); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error-box" role="alert">{error}</p>;
  if (!me || !tasks) return <p>Loading…</p>;

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "completed").length;
  const pct = total ? Math.round((100 * done) / total) : 0;
  const next = tasks
    .filter((t) => t.status !== "completed")
    .sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"))
    .slice(0, 3);

  return (
    <>
      <h1 className="page-title">Hi, {(me.name || me.email).split(" ")[0]}</h1>
      <p className="sub">
        {total === 0
          ? "HR hasn't assigned your checklist yet."
          : done === total
          ? "You've finished every task. Nice work."
          : `You've finished ${done} of ${total} tasks.`}
      </p>

      <div className="progress" aria-label={`${pct} percent complete`}>
        <div className="progress-bar"><span style={{ width: `${pct}%` }} /></div>
      </div>

      <h2 className="section-title">Next up</h2>
      {next.length === 0 ? (
        <p className="sub">Nothing is due. You can upload a document or ask the assistant a question.</p>
      ) : (
        <ul className="next-list">
          {next.map((t) => (
            <li key={t.id}>
              <div>
                <strong>{t.title}</strong>
                <p>{t.due_date ? `Due ${fmtDate(t.due_date)}` : "No due date"}</p>
              </div>
              <Status kind={taskKind(t)} />
            </li>
          ))}
        </ul>
      )}

      <div className="links">
        <Link className="linkbtn" to="/employee/checklist">Open checklist</Link>
        <Link className="linkbtn" to="/employee/chatbot">Ask the assistant</Link>
        <Link className="linkbtn" to="/employee/documents">Upload a document</Link>
      </div>
    </>
  );
}