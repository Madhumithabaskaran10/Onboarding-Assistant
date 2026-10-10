import { useEffect, useState } from "react";
import { api } from "../../api";
import { fmtDate } from "../../utils";
import "../employee/Trail.css";
import "../employee/Forms.css";
import "./Review.css";

const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

export default function HrFeedback() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/feedback").then(setItems).catch((e) => {
      setError(e.message);
      setItems([]);
    });
  }, []);

  const total = items ? items.length : 0;
  const avg = total ? (items.reduce((s, f) => s + f.rating, 0) / total).toFixed(1) : null;

  return (
    <>
      <h1 className="page-title">Feedback</h1>
      <p className="sub">What new joiners say about onboarding. Anonymous posts stay anonymous, even for HR.</p>

      {error && <p className="error-box" role="alert">{error}</p>}
      {items === null && !error && <p className="sub">Loading…</p>}
      {items && total === 0 && !error && <p className="sub">No feedback yet. It shows up here when employees post it.</p>}

      {avg && (
        <>
          <p className="big-avg">
            <strong>{avg} out of 5</strong> from {total} {total === 1 ? "response" : "responses"}
          </p>
          <div className="bars">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = items.filter((f) => f.rating === n).length;
              return (
                <div className="bar-row" key={n}>
                  <span>{n} {n === 1 ? "star" : "stars"}</span>
                  <div className="progress-bar"><span style={{ width: `${(100 * count) / total}%` }} /></div>
                  <b>{count}</b>
                </div>
              );
            })}
          </div>
        </>
      )}

      {items && total > 0 && (
        <ul className="rows">
          {items.map((f) => (
            <li key={f.id}>
              <div className="row-head">
                <strong>{f.author_name || "Anonymous"}</strong>
                <span aria-label={`${f.rating} out of 5`}>{stars(f.rating)}</span>
              </div>
              {f.comment && <p>{f.comment}</p>}
              <p className="muted">{fmtDate(f.created_at.slice(0, 10))}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}