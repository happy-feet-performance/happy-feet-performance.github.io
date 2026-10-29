import { getTodayScripture } from "../../../lib/scripture.js";

export default function ScriptureStrip() {
  const s = getTodayScripture();
  return (
    <div className="scripture-strip" style={{ marginBottom: "var(--sp-xl)", padding: "var(--sp-lg)" }}>
      <i className="ti ti-cross" style={{ color: "var(--faith)", fontSize: 18, flexShrink: 0 }}></i>
      <span>
        {s.verse}{" "}
        <em style={{ color: "var(--faith)", fontStyle: "normal", fontWeight: 600 }}>~ {s.ref}</em>
      </span>
    </div>
  );
}
