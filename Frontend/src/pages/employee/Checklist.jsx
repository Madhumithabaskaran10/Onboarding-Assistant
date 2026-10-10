import { useEffect, useState } from "react";
import { api } from "../../api";
import Status from "../../components/Status";
import { fmtDate, taskKind } from "../../utils";
import "./Trail.css";

const STAGES = [
  ["pre-boarding", "Before you start"],
  ["onboarding", "Getting started"],
  ["post-boarding", "Settling in"],
];

export default function Checklist() {
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/my/tasks").then(setTasks).catch((e) => setError(e.message));
  }, []);

  async function complete(id) {
    setError("");
    try {
      const updated = await api.patch(`/my/tasks/${id}/complete`);
      setTasks((ts) => ts.map((t) => (t.id === id ? updated : t)));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <h1 className="page-title">Your checklist</h1>
      <p className="sub">Tasks for your role, in the order they're due.</p>

      {error && <p className="error-box" role="alert">{error}</p>}
      {!tasks && !error && <p>Loading your checklist…</p>}
      {tasks && tasks.length === 0 && (
        <p>Your checklist is empty. HR assigns tasks based on your role, so check back soon.</p>
      )}

      {tasks && STAGES.map(([stage, label]) => {
        const group = tasks.filter((t) => t.stage === stage);
        if (group.length === 0) return null;
        return (
          <section className="trail-group" key={stage}>
            <h2>{label}</h2>
            <ol className="trail">
              {group.map((t) => {
                const kind = taskKind(t);
                return (
                  <li key={t.id} className={`step ${kind === "completed" ? "done" : ""} ${kind === "overdue" ? "late" : ""}`}>
                    <span className="dot" aria-hidden="true" />
                    <div>
                      <h3>{t.title}</h3>
                      {t.description && <p>{t.description}</p>}
                      <p>{t.due_date ? `Due ${fmtDate(t.due_date)}` : "No due date"}</p>
                    </div>
                    <div className="step-side">
                      <Status kind={kind} />
                      {t.status !== "completed" && (
                        <button onClick={() => complete(t.id)}>Mark complete</button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </>
  );
}