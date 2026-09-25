export default function RatingBar({ label, value, color = "var(--gold)" }) {
  return (
    <div className="bar-row">
      <div className="bar-head">
        <span>{label}</span>
        <span style={{ fontWeight: 600, color }}>{value}</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${value}%`, background: color }}></div>
      </div>
    </div>
  );
}
