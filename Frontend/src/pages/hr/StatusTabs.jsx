export default function StatusTabs({ tabs, value, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {tabs.map(([key, text]) => (
        <button key={key} type="button" aria-pressed={value === key} onClick={() => onChange(key)}>
          {text}
        </button>
      ))}
    </div>
  );
}