import { useEffect, useState } from "react";
import { api } from "../../api";
import ProgressTable from "./ProgressTable";
import "../employee/Trail.css";
import "../employee/Forms.css";
import "./Tables.css";

const EMPTY = { full_name: "", email: "", temp_password: "", job_role: "", department: "", start_date: "" };

function makePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export default function Employees() {
  const [rows, setRows] = useState(null);
  const [roles, setRoles] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);

  function load() {
    api.get("/hr/progress").then(setRows).catch((e) => {
      setError(e.message);
      setRows([]);
    });
  }

  useEffect(() => {
    load();
    api.get("/templates")
      .then((t) => setRoles([...new Set(t.map((x) => x.job_role))]))
      .catch(() => {});
  }, []);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setCreated(null);
    try {
      const r = await api.post("/hr/employees", {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        temp_password: form.temp_password,
        job_role: form.job_role.trim(),
        department: form.department.trim() || null,
        start_date: form.start_date || null,
      });
      setCreated({
        name: form.full_name.trim(),
        email: r.email,
        password: form.temp_password,
        role: form.job_role.trim(),
        tasks: r.tasks_created,
      });
      setForm(EMPTY);
      setShow(false);
      load();
    } catch (err) {
      setError(
        err.message.includes("already been registered")
          ? "An account with this email already exists. Use a different email."
          : err.message
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="sub">Everyone in onboarding, and how far along they are.</p>
        </div>
        {!show && (
          <button className="primary" onClick={() => { setShow(true); setCreated(null); }}>
            Add employee
          </button>
        )}
      </div>

      {created && (
        <div className="success-box" role="status">
          <strong>Account created for {created.name}.</strong> Share these details with them. The
          password isn't shown again after you leave this page.
          <ul className="creds">
            <li>Email: <code>{created.email}</code></li>
            <li>Temporary password: <code>{created.password}</code></li>
          </ul>
        </div>
      )}
      {created && created.tasks === 0 && (
        <p className="warn-box" role="status">
          No checklist matched the role "{created.role}", so no tasks were assigned. You can assign
          tasks from the Tasks page.
        </p>
      )}
      {created && created.tasks > 0 && (
        <p className="sub">{created.tasks} checklist tasks were assigned for the {created.role} role.</p>
      )}

      {show && (
        <form className="panel" onSubmit={onSubmit}>
          <h2>Add an employee</h2>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="full_name">Full name</label>
              <input id="full_name" type="text" required value={form.full_name} onChange={set("full_name")} />
            </div>
            <div className="field">
              <label htmlFor="email">Work email</label>
              <input id="email" type="email" required value={form.email} onChange={set("email")} />
            </div>
            <div className="field">
              <label htmlFor="job_role">Job role</label>
              <input id="job_role" type="text" required list="role-list" value={form.job_role} onChange={set("job_role")} />
              <datalist id="role-list">
                {roles.map((r) => <option key={r} value={r} />)}
              </datalist>
              <p className="help">Choose a role that has a checklist, so tasks are assigned automatically.</p>
            </div>
            <div className="field">
              <label htmlFor="department">Department (optional)</label>
              <input id="department" type="text" value={form.department} onChange={set("department")} />
            </div>
            <div className="field">
              <label htmlFor="start_date">Start date (optional)</label>
              <input id="start_date" type="date" value={form.start_date} onChange={set("start_date")} />
              <p className="help">Due dates are counted from this day. Leave empty to start today.</p>
            </div>
            <div className="field">
              <label htmlFor="temp_password">Temporary password</label>
              <div className="pw-row">
                <input
                  id="temp_password" type="text" required minLength={8} autoComplete="off"
                  value={form.temp_password} onChange={set("temp_password")}
                />
                <button type="button" className="ghost" onClick={() => setForm((f) => ({ ...f, temp_password: makePassword() }))}>
                  Generate
                </button>
              </div>
              <p className="help">At least 8 characters.</p>
            </div>
          </div>

          {error && <p className="error-box" role="alert">{error}</p>}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="primary" type="submit" disabled={busy}>
              {busy ? "Creating…" : "Create account"}
            </button>
            <button className="ghost" type="button" onClick={() => { setShow(false); setError(""); }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {!show && error && <p className="error-box" role="alert">{error}</p>}
      {rows === null && <p className="sub">Loading…</p>}
      {rows && rows.length === 0 && <p className="sub">No employees yet. Click "Add employee" to create the first account.</p>}
      {rows && rows.length > 0 && <ProgressTable rows={rows} />}
    </>
  );
}