import { ratingColor } from "../../../lib/utils.js";

export default function MiniChart({ values }) {
  const max = Math.max(...values, 1);
  return (
    <div className="mini-chart">
      {values.map((v, i) => (
        <div
          key={i}
          className="mini-bar"
          style={{ height: Math.max(Math.round((v / max) * 48), 4), background: ratingColor(v) }}
          title={v}
        ></div>
      ))}
    </div>
  );
}
