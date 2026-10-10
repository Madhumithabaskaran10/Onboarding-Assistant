import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { session } from "../api";
import "./Shell.css";

export default function Shell({ title, links }) {
  const navigate = useNavigate();

  function logout() {
    session.clear();
    navigate("/", { replace: true });
  }

  return (
    <div className="shell">
      <aside className="side">
        <p className="side-brand">Onboarding Assistant</p>
        <p className="side-role">{title}</p>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? "active" : "")}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button className="side-out" onClick={logout}>Sign out</button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}