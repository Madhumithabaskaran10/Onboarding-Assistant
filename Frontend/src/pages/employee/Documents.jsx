import { useEffect, useState } from "react";
import { api } from "../../api";
import { fmtDate } from "../../utils";
import "./Trail.css";
import "./Forms.css";

const TYPES = [
  "ID proof",
  "Signed offer letter",
  "Address proof",
  "Bank details",
  "Education certificate",
  "Other",
];
const ALLOWED = ["application/pdf", "image/png", "image/jpeg"];
const MAX = 5 * 1024 * 1024;

const STATUS = {
  pending: ["Under review", "warn"],
  approved: ["Approved", "ok"],
  rejected: ["Rejected", "bad"],
};

export default function Documents() {
  const [docs, setDocs] = useState(null);
  const [docType, setDocType] = useState(TYPES[0]);
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  function load() {
    api.get("/my/documents").then(setDocs).catch((e) => {
      setError(e.message);
      setDocs([]);
    });
  }

  useEffect(() => {
    load();
  }, []);

  function clearFile() {
    setFile(null);
    setFileKey((k) => k + 1);
  }

  function onPick(e) {
    const f = e.target.files[0] || null;
    setError("");
    setDone("");
    if (f && !ALLOWED.includes(f.type)) {
      setError("That file type isn't supported. Choose a PDF, PNG or JPG.");
      clearFile();
      return;
    }
    if (f && f.size > MAX) {
      setError("That file is over 5 MB. Choose a smaller file.");
      clearFile();
      return;
    }
    setFile(f);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    setBusy(true);
    setError("");
    setDone("");
    try {
      const form = new FormData();
      form.append("doc_type", docType);
      form.append("file", file);
      await api.post("/my/documents", form);
      setDone("Document uploaded. HR will review it.");
      clearFile();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="page-title">Documents</h1>
      <p className="sub">Upload the documents HR asks for, and see whether they're approved.</p>

      <form className="panel" onSubmit={onSubmit}>
        <h2>Upload a document</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="doctype">Document type</label>
            <select id="doctype" value={docType} onChange={(e) => setDocType(e.target.value)}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="docfile">File</label>
            <input id="docfile" key={fileKey} type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={onPick} />
            <p className="help">PDF, PNG or JPG, up to 5 MB.</p>
          </div>
        </div>

        {error && <p className="error-box" role="alert">{error}</p>}
        {done && <p className="success-box" role="status">{done}</p>}

        <button className="primary" type="submit" disabled={busy}>
          {busy ? "Uploading…" : "Upload document"}
        </button>
      </form>

      <h2 className="section-title">Your documents</h2>
      {docs === null && <p className="sub">Loading…</p>}
      {docs && docs.length === 0 && (
        <p className="sub">You haven't uploaded anything yet. Start with your ID proof.</p>
      )}
      {docs && docs.length > 0 && (
        <ul className="rows">
          {docs.map((d) => {
            const [label, tone] = STATUS[d.status] || [d.status, "muted"];
            return (
              <li key={d.id}>
                <div className="row-head">
                  <strong>{d.doc_type}</strong>
                  <span className={`status ${tone}`}>{label}</span>
                </div>
                <p className="muted">Uploaded {fmtDate(d.uploaded_at.slice(0, 10))}</p>
                {d.hr_comment && <p>HR says: {d.hr_comment}</p>}
                {d.status === "rejected" && <p>Upload a corrected file using the form above.</p>}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}