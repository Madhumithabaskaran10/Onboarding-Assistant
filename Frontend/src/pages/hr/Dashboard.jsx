import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import ProgressTable from "./ProgressTable";
import "../employee/Trail.css";
import "./Tables.css";

export default function HrDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/hr/progress"),
      api.get("/hr/tasks/overdue"),
      api.get("/hr/escalations?status=open"),
      api.get("/hr/documents?status=pending"),
    ])
      .then(([people, overdue, esc, docs]) =>
        setData({ people, overdue: overdue.length, esc: esc.length, docs: docs.length })
      )
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error-box" role="alert">{error}</p>;
  if (!data) return <p>Loading…</p>;

  const items = [
    { to: "/hr/tasks", n: data.overdue, tone: "bad", title: "Overdue tasks", text: "Tasks past their due date" },
    { to: "/hr/escalations", n: data.esc, tone: "warn", title: "Questions for HR", text: "The assistant wasn't sure, so employees are waiting for you" },
    { to: "/hr/documents", n: data.docs, tone: "warn", title: "Documents to review", text: "Uploaded files waiting for approval" },
  ];
  const nothing = items.every((i) => i.n === 0);

  const nudge = [...data.people]
    .sort((a, b) => b.overdue - a.overdue || a.percent - b.percent)
    .slice(0, 5);

  return (
    <>
      <h1 className="page-title">Overview</h1>
      <p className="sub">
        {data.people.length === 0
          ? "No employees yet. Add the first one from the Employees page."
          : `${data.people.length} ${data.people.length === 1 ? "employee is" : "employees are"} in onboarding.`}
      </p>

      <h2 className="section-title">Needs your attention</h2>
      {nothing && <p className="sub">Nothing is waiting on you right now.</p>}
      <ul className="attn">
        {items.map((i) => (
          <li key={i.to}>
            <Link to={i.to}>
              <div>
                <strong>{i.title}</strong>
                <p>{i.text}</p>
              </div>
              <span className={`status ${i.n === 0 ? "muted" : i.tone}`}>{i.n}</span>
            </Link>
          </li>
        ))}
      </ul>

      {nudge.length > 0 && (
        <>
          <h2 className="section-title">Who needs a nudge</h2>
          <ProgressTable rows={nudge} />
        </>
      )}
    </>
  );
}