import { useEffect, useId, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { session } from "../api";
import "./Welcome.css";

const ICONS = {
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="m3.5 6.2 1.3 1.3L7 5M3.5 12.2l1.3 1.3L7 11M3.5 18.2l1.3 1.3L7 17" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </>
  ),
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 21 12z" />,
  tick: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  book: (
    <>
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
      <path d="M5 17a3 3 0 0 1 3-3h11" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
    </>
  ),
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

function SignInMenu({ tone = "blue", size = "lg", place = "down-left" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const listId = useId();

  useEffect(() => {
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className={`menu ${place}`} ref={ref}>
      <button
        type="button"
        className={`cta ${tone} ${size}`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        Sign in
      </button>
      {open && (
        <ul className="menu-list" id={listId}>
          <li>
            <Link to="/login/employee">
              <strong>Employee</strong>
              <span>See your checklist and ask questions</span>
            </Link>
          </li>
          <li>
            <Link to="/login/hr">
              <strong>HR</strong>
              <span>Manage employees, tasks and documents</span>
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}

export default function Welcome() {
  if (session.token && session.role) {
    return <Navigate to={session.role === "hr" ? "/hr" : "/employee"} replace />;
  }

  return (
    <div className="landing">
      <section className="l-hero">
        <header className="wrap l-bar">
          <span className="l-brand">Onboarding Assistant</span>
          <nav className="l-nav" aria-label="Page sections">
            <a href="#features">How it works</a>
            <a href="#roles">Employees and HR</a>
          </nav>
          <SignInMenu tone="light" size="sm" place="down-right" />
        </header>

        <div className="wrap l-hero-in">
          <h1>Start your new job with a clear plan</h1>
          <p>
            Your checklist, your documents and answers about company policy, all in one place.
            HR sets up your account, so all you need to do is sign in.
          </p>
          <div className="l-actions">
            <SignInMenu tone="light" place="down-center" />
            <a className="ghost-link" href="#features">See how it works</a>
          </div>
        </div>

        <svg className="wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 50 C 240 100, 480 0, 720 40 S 1200 90, 1440 30 V90 H0 Z" />
        </svg>
      </section>

      <main>
        <section className="wrap l-why" id="features">
          <div>
            <h2>Everything for your first weeks, in one place</h2>
            <p className="lead">
              No more searching through emails and shared folders. What you need to do next is
              always one click away.
            </p>
          </div>
          <div className="f-cards">
            <article className="f-card">
              <span className="f-ico"><Icon name="list" /></span>
              <h3>A checklist for your role</h3>
              <p>Tasks are assigned from the day you join, with due dates and a clear order.</p>
            </article>
            <article className="f-card">
              <span className="f-ico"><Icon name="file" /></span>
              <h3>Documents without email chains</h3>
              <p>Upload what HR needs, and see right away whether it's approved.</p>
            </article>
            <article className="f-card">
              <span className="f-ico"><Icon name="chat" /></span>
              <h3>Answers from company policy</h3>
              <p>Ask about leave, hours or payroll and get an answer with its source.</p>
            </article>
          </div>
        </section>

        <section className="wrap l-show">
          <div className="mock" aria-hidden="true">
            <div className="mock-note">Asks HR when unsure</div>
            <div className="mock-list">
              <h3>Your checklist</h3>
              <div className="mock-row">
                <span>Sign employment contract</span>
                <span className="status ok">Done</span>
              </div>
              <div className="mock-row">
                <span>Set up laptop and accounts</span>
                <span className="status warn">In progress</span>
              </div>
              <div className="mock-row">
                <span>Read the security policy</span>
                <span className="status muted">To do</span>
              </div>
            </div>
            <div className="mock-chat">
              <p className="bubble-me">How many leave days do I get?</p>
              <p className="bubble-bot">You get 18 days of paid annual leave each year.</p>
              <div className="mock-meta">
                <span className="status ok">92% sure</span>
                <span>From: Leave Policy</span>
              </div>
            </div>
          </div>

          <div>
            <h2>When the assistant isn't sure, HR answers</h2>
            <p className="lead">
              The assistant only answers from your company's policy documents. If it can't find a
              confident answer, the question goes to HR and the reply appears in your chat.
            </p>
            <ul className="ticks">
              <li>
                <Icon name="book" />
                <div>
                  <strong>Sources with every answer</strong>
                  <span>You can see which policy an answer came from.</span>
                </div>
              </li>
              <li>
                <Icon name="person" />
                <div>
                  <strong>A person for the hard questions</strong>
                  <span>Unsure questions are sent to HR automatically.</span>
                </div>
              </li>
            </ul>
            <SignInMenu />
          </div>
        </section>

        <section className="wrap who" id="roles">
          <div>
            <h2>For employees</h2>
            <ul>
              <li>Follow a checklist built for your role</li>
              <li>Upload the documents HR needs</li>
              <li>Ask the assistant about company policy</li>
              <li>Share feedback once you've settled in</li>
            </ul>
          </div>
          <div>
            <h2>For HR</h2>
            <ul>
              <li>Create employee accounts</li>
              <li>Track progress and overdue tasks</li>
              <li>Review documents and answer escalated questions</li>
              <li>Read feedback from new joiners</li>
            </ul>
          </div>
        </section>

        <section className="l-cta">
          <div className="wrap">
            <h2>Your account is waiting</h2>
            <p>HR has already set it up. Sign in as an employee or as HR to continue.</p>
            <SignInMenu tone="light" place="up-center" />
            <ul className="checks">
              <li><Icon name="tick" />Checklist built for your role</li>
              <li><Icon name="tick" />Private document uploads</li>
              <li><Icon name="tick" />Policy answers with sources</li>
              <li><Icon name="tick" />Anonymous feedback</li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="l-foot">
        <div className="wrap">Accounts are created by HR. There is no public sign-up.</div>
      </footer>
    </div>
  );
}