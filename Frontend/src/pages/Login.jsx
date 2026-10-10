import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api, session } from "../api";
import "./Login.css";

const COPY = {
  employee: {
    title: "Employee sign in",
    label: "Work email",
    hint: "HR created your account. Use the email and password they sent you.",
    home: "/employee",
    otherTo: "/login/hr",
    otherText: "Are you in HR? Use the HR sign in.",
  },
  hr: {
    title: "HR sign in",
    label: "HR email",
    hint: "For the HR team. Sign in to manage employees, tasks and documents.",
    home: "/hr",
    otherTo: "/login/employee",
    otherText: "Are you an employee? Use the employee sign in.",
  },
};

export default function Login({ kind }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const text = COPY[kind];

  if (session.token && session.role) {
    return <Navigate to={session.role === "hr" ? "/hr" : "/employee"} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.post("/login", { email: email.trim(), password });
      const access_token = res.access_token;
      const role = res.role === "hr" ? "hr" : "employee";

      if (role !== kind) {
        session.clear();
        setError(
          role === "hr"
            ? "This is an HR account. Use the HR sign in."
            : "This is an employee account. Use the employee sign in."
        );
        return;
      }

      session.set(access_token, role);
      navigate(COPY[role].home, { replace: true });
    } catch (err) {
      session.clear();
      if (err.message === "Wrong email or password") {
        setError(
          kind === "employee"
            ? "That email and password don't match. Check them, or ask HR to reset your password."
            : "That email and password don't match. Check them and try again."
        );
      } else if (err instanceof TypeError) {
        setError("Can't reach the server. Check that the backend is running.");
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <Link className="back" to="/">Back to welcome page</Link>
      <div className="swing">
        <div className="lanyard" aria-hidden="true" />
        <section className="badge" aria-labelledby="login-title">
          <div className="badge-top">
            <p className="badge-brand">Onboarding Assistant</p>
          </div>
          <form className="badge-body" onSubmit={onSubmit}>
            <h1 id="login-title">{text.title}</h1>
            <p className="hint">{text.hint}</p>

            <label htmlFor="email">{text.label}</label>
            <input
              id="email" type="email" autoComplete="username" required
              value={email} onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="password">Password</label>
            <input
              id="password" type="password" autoComplete="current-password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="error" role="alert">{error}</p>}

            <button type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>

            <p className="swap"><Link to={text.otherTo}>{text.otherText}</Link></p>
          </form>
        </section>
      </div>
    </main>
  );
}