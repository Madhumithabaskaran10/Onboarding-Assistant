const MAP = {
  completed: ["Done", "ok"],
  in_progress: ["In progress", "warn"],
  pending: ["To do", "muted"],
  overdue: ["Overdue", "bad"],
};

export default function Status({ kind }) {
  const [label, tone] = MAP[kind] || [kind, "muted"];
  return <span className={`status ${tone}`}>{label}</span>;
}