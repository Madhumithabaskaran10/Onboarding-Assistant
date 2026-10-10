export const today = () => new Date().toLocaleDateString("en-CA");

export function fmtDate(d) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function taskKind(t) {
  if (t.status === "completed") return "completed";
  if (t.due_date && t.due_date < today()) return "overdue";
  return t.status;
}