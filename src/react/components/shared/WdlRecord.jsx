const RESULTS = [
  { key: "W", color: "var(--green)", bg: "rgba(26,122,46,.15)" },
  { key: "D", color: "var(--gold)", bg: "rgba(196,154,10,.15)" },
  { key: "L", color: "var(--red)", bg: "rgba(200,16,46,.1)" },
];

export default function WdlRecord({ W, D, L }) {
  const counts = { W, D, L };
  const total = W + D + L;
  if (total === 0) {
    return <span style={{ fontSize: 12, color: "var(--text3)" }}>No matches logged</span>;
  }
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {RESULTS.map((r) => (
        <div key={r.key} style={{ padding: "3px 10px", background: r.bg, border: `0.5px solid ${r.color}` }}>
          <span style={{ fontFamily: "var(--font)", fontSize: 13, fontWeight: 700, color: r.color }}>
            {counts[r.key]}
          </span>
          <span style={{ fontSize: 10, color: "var(--text3)", marginLeft: 2 }}>{r.key}</span>
        </div>
      ))}
      <span style={{ fontSize: 11, color: "var(--text3)" }}>{total} played</span>
    </div>
  );
}
