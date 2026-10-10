import { Routes, Route, Navigate } from "react-router-dom";
import { session } from "./api";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Shell from "./components/Shell";
import Dashboard from "./pages/employee/Dashboard";
import Checklist from "./pages/employee/Checklist";
import Chatbot from "./pages/employee/Chatbot";
import Documents from "./pages/employee/Documents";
import Feedback from "./pages/employee/Feedback";
import HrDashboard from "./pages/hr/Dashboard";
import Employees from "./pages/hr/Employees";
import HrTasks from "./pages/hr/Tasks";
import HrDocuments from "./pages/hr/Documents";
import Escalations from "./pages/hr/Escalations";
import HrFeedback from "./pages/hr/Feedback";

const employeeLinks = [
  { to: "/employee", label: "Dashboard", end: true },
  { to: "/employee/checklist", label: "Checklist" },
  { to: "/employee/documents", label: "Documents" },
  { to: "/employee/chatbot", label: "Ask the assistant" },
  { to: "/employee/feedback", label: "Feedback" },
];

const hrLinks = [
  { to: "/hr", label: "Overview", end: true },
  { to: "/hr/employees", label: "Employees" },
  { to: "/hr/tasks", label: "Tasks" },
  { to: "/hr/documents", label: "Documents" },
  { to: "/hr/escalations", label: "Questions" },
  { to: "/hr/feedback", label: "Feedback" },
];

function Soon({ name }) {
  return (
    <>
      <h1 className="page-title">{name}</h1>
      <p className="sub">This page is built in the next step.</p>
    </>
  );
}

function RequireRole({ role, children }) {
  if (!session.token) return <Navigate to="/" replace />;
  if (session.role !== role) {
    return <Navigate to={session.role === "hr" ? "/hr" : "/employee"} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login/employee" element={<Login key="employee" kind="employee" />} />
      <Route path="/login/hr" element={<Login key="hr" kind="hr" />} />

      <Route path="/employee" element={<RequireRole role="employee"><Shell title="Employee" links={employeeLinks} /></RequireRole>}>
        <Route index element={<Dashboard />} />
        <Route path="checklist" element={<Checklist />} />
        <Route path="documents" element={<Documents />} />
        <Route path="chatbot" element={<Chatbot />} />
        <Route path="feedback" element={<Feedback />} />
      </Route>

      <Route path="/hr" element={<RequireRole role="hr"><Shell title="HR" links={hrLinks} /></RequireRole>}>
        <Route index element={<HrDashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="tasks" element={<HrTasks />} />
        <Route path="documents" element={<HrDocuments />} />
        <Route path="escalations" element={<Escalations />} />
        <Route path="feedback" element={<HrFeedback />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}