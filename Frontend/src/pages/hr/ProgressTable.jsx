const STAGE = {
  "pre-boarding": "Pre-boarding",
  onboarding: "Onboarding",
  "post-boarding": "Post-boarding",
  completed: "Completed",
};

export default function ProgressTable({ rows }) {
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th scope="col">Employee</th>
            <th scope="col">Role</th>
            <th scope="col">Stage</th>
            <th scope="col">Progress</th>
            <th scope="col">Overdue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>
                <strong>{p.full_name}</strong>
                <small>{p.email}</small>
              </td>
              <td>{p.job_role}</td>
              <td>{STAGE[p.stage] || p.stage}</td>
              <td>
                <div className="mini" aria-label={`${p.percent} percent complete`}>
                  <div className="progress-bar"><span style={{ width: `${p.percent}%` }} /></div>
                  <span className="num">{p.completed}/{p.total_tasks}</span>
                </div>
              </td>
              <td>
                {p.overdue > 0 ? (
                  <span className="status bad">{p.overdue} overdue</span>
                ) : (
                  <span className="status muted">None</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}