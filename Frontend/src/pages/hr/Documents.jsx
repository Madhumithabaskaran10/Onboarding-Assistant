import { useEffect, useState } from "react";
import { api } from "../../api";
import { fmtDate } from "../../utils";
import StatusTabs from "./StatusTabs";
import "../employee/Trail.css";
import "../employee/Forms.css";
import "./Tables.css";
import "./Review.css";

const TABS = [
  ["pending", "To review"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
];

const EMPTY = {
  pending: "No documents are waiting for review.",
  approved: "No approved documents yet.",
  rejected: "No rejected documents.",
};

function fileUrl(u) {
  if (!u) return null;
  if (u.startsWith("http")) return u;
  return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1${u.startsWith("/") ? "" : "/"}${u}`;
}

function Item({ d, tab, onDone }) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const url = fileUrl(d.view_url);

  async function review(status) {
    if (status === "rejected" && !comment.trim()) {
      setError("Tell the employee what to fix before you reject.");
      return;
    }
    setBusy(status);
    setError("");
    try {
      await api.patch(`/hr/documents/${d.id}/review`, {
        status,
        hr_comment: comment.trim() || null,
      });
      onDone(d.id);
    } catch (e) {
      setError(e.message);
      setBusy("");
    }
  }

  return (
    <li>
      <div className="who-line">
        <span>{d.employees?.full_name || "Unknown"} · {d.employees?.email}</span>
        <span>Uploaded {fmtDate(d.uploaded_at.slice(0, 10))}</span>
      </div>
      <p className="q-text">{d.doc_type}</p>

      {url ? (
        <a className="file-link" href={url} target="_blank" rel="noopener noreferrer">
          Open file in a new tab
        </a>
      ) : (
        <p className="no-link">The file link couldn't be created. Reload the page to try again.</p>
      )}

      {tab === "pending" ? (
        <>
          <div className="field">
            <label htmlFor={`c-${d.id}`}>Comment for the employee (required to reject)</label>
            <textarea id={`c-${d.id}`} value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          {error && <p className="error-box" role="alert">{error}</p>}
          <div className="btn-row">
            <button className="approve" disabled={!!busy} onClick={() => review("approved")}>
              {busy === "approved" ? "Approving…" : "Approve"}
            </button>
            <button className="reject" disabled={!!busy} onClick={() => review("rejected")}>
              {busy === "rejected" ? "Rejecting…" : "Reject"}
            </button>
          </div>
        </>
      ) : (
        d.hr_comment && <p>Your comment: {d.hr_comment}</p>
      )}
    </li>
  );
}

export default function HrDocuments() {
  const [tab, setTab] = useState("pending");
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setDocs(null);
    setError("");
    api.get(`/hr/documents?status=${tab}`).then(setDocs).catch((e) => {
      setError(e.message);
      setDocs([]);
    });
  }, [tab]);

  return (
    <>
      <h1 className="page-title">Documents</h1>
      <p className="sub">Open each file, then approve it or tell the employee what to fix. File links expire after an hour.</p>

      <StatusTabs tabs={TABS} value={tab} onChange={setTab} label="Document status" />

      {error && <p className="error-box" role="alert">{error}</p>}
      {docs === null && !error && <p className="sub">Loading…</p>}
      {docs && docs.length === 0 && !error && <p className="sub">{EMPTY[tab]}</p>}
      {docs && docs.length > 0 && (
        <ul className="queue">
          {docs.map((d) => (
            <Item key={d.id} d={d} tab={tab} onDone={(id) => setDocs((ds) => ds.filter((x) => x.id !== id))} />
          ))}
        </ul>
      )}
    </>
  );
}