import { useEffect, useState } from "react";
import { api } from "../../api";
import { fmtDate, today } from "../../utils";
import "../employee/Trail.css";
import "../employee/Forms.css";
import "./Tables.css";

const STAGES = [
  ["pre-boarding", "Before they start"],
  ["onboarding", "Getting started"],
  ["post-boarding", "Settling in"],
];
const EMPTY = { employee_id: "", title: "", description: "", stage: "onboarding", due_date: "" };

function daysLate(d) {
  const ms = new Date(today() + "T00:00:00") - new Date(d + "T00:00:00");
  return Math.max(1, Math.round(ms / 86400000));
}

export default function Tasks() {
  const [people, setPeople] = useState([]);
  const [late, setLate] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  function loadLate() {
    api.get("/hr/tasks/overdue").then(setLate).catch((e) => {
      setError(e.message);
      setLate([]);
    });
  }

  useEffect(() => {
    api.get("/hr/employees").then(setPeople).catch((e) => setError(e.message));
    loadLate();
  }, []);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDone("");
    try {
      await api.post("/hr/tasks", {
        employee_id: form.employee_id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        stage: form.stage,
        due_date: form.due_date || null,
      });
      const p = people.find((x) => x.id === form.employee_id);
      setDone(`Task assigned to ${p ? p.full_name : "the employee"}.`);
      setForm(EMPTY);
      loadLate();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="page-title">Tasks</h1>
      <p className="sub">Assign a task to an employee, and see what's overdue.</p>

      <form className="panel" onSubmit={onSubmit}>
        <h2>Assign a task</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="emp">Employee</label>
            <select id="emp" required value={form.employee_id} onChange={set("employee_id")}>
              <option value="">Choose an employee</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name} ({p.job_role})</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="stage">Stage</label>
            <select id="stage" value={form.stage} onChange={set("stage")}>
              {STAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="title">Task</label>
            <input id="title" type="text" required value={form.title} onChange={set("title")} />
          </div>
          <div className="field">
            <label htmlFor="due">Due date (optional)</label>
            <input id="due" type="date" value={form.due_date} onChange={set("due_date")} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="desc">Details (optional)</label>
          <textarea id="desc" value={form.description} onChange={set("description")} />
        </div>

        {error && <p className="error-box" role="alert">{error}</p>}
        {done && <p className="success-box" role="status">{done}</p>}

        <button className="primary" type="submit" disabled={busy}>
          {busy ? "Assigning…" : "Assign task"}
        </button>
      </form>

      <h2 className="section-title">Overdue tasks</h2>
      {late === null && <p className="sub">Loading…</p>}
      {late && late.length === 0 && <p className="sub">No overdue tasks. Everyone is on track.</p>}
      {late && late.length > 0 && (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">Task</th>
                <th scope="col">Employee</th>
                <th scope="col">Due</th>
                <th scope="col">Late by</th>
              </tr>
            </thead>
            <tbody>
              {late.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.title}</strong></td>
                  <td>
                    {t.employees?.full_name || "Unknown"}
                    <small>{t.employees?.email}</small>
                  </td>
                  <td>{fmtDate(t.due_date)}</td>
                  <td><span className="status bad">{daysLate(t.due_date)} {daysLate(t.due_date) === 1 ? "day" : "days"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}