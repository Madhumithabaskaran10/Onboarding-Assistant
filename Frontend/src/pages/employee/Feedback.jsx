import { useEffect, useState } from "react";
import { api } from "../../api";
import { fmtDate } from "../../utils";
import "./Trail.css";
import "./Forms.css";

const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

export default function Feedback() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [anon, setAnon] = useState(false);
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  function load() {
    api.get("/feedback").then(setItems).catch((e) => {
      setError(e.message);
      setItems([]);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setDone("");
    if (!rating) {
      setError("Choose a rating from 1 to 5.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.post("/feedback", {
        rating,
        comment: comment.trim() || null,
        is_anonymous: anon,
      });
      setDone("Feedback posted.");
      setRating(0);
      setComment("");
      setAnon(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const avg = items && items.length
    ? (items.reduce((s, f) => s + f.rating, 0) / items.length).toFixed(1)
    : null;

  return (
    <>
      <h1 className="page-title">Feedback</h1>
      <p className="sub">Tell us how your onboarding went. Everyone in the company can read what's posted here.</p>

      <form className="panel" onSubmit={onSubmit}>
        <h2>Share your feedback</h2>

        <fieldset className="stars">
          <legend>Your rating</legend>
          <div className="stars-row">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n}>
                <input
                  className="sr-only"
                  type="radio"
                  id={`star-${n}`}
                  name="rating"
                  value={n}
                  checked={rating === n}
                  onChange={() => setRating(n)}
                />
                <label htmlFor={`star-${n}`} className={n <= rating ? "on" : ""}>
                  <span aria-hidden="true">{n <= rating ? "★" : "☆"}</span>
                  <span className="sr-only">{n} out of 5</span>
                </label>
              </span>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="comment">Comment (optional)</label>
          <textarea
            id="comment" maxLength={1000}
            value={comment} onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <label className="check">
          <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
          Post without my name
        </label>

        {error && <p className="error-box" role="alert">{error}</p>}
        {done && <p className="success-box" role="status">{done}</p>}

        <button className="primary" type="submit" disabled={busy}>
          {busy ? "Posting…" : "Post feedback"}
        </button>
      </form>

      <h2 className="section-title">What others said</h2>
      {items === null && <p className="sub">Loading…</p>}
      {items && items.length === 0 && <p className="sub">No feedback yet. Yours could be the first.</p>}
      {avg && <p className="avg">Average rating {avg} out of 5 from {items.length} {items.length === 1 ? "response" : "responses"}.</p>}
      {items && items.length > 0 && (
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