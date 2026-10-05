import { togglePrayer } from "../../../lib/roleUtils.js";

const PRAYERS = [
  {
    id: "morning",
    title: "Morning prayer",
    desc: "Before training: Lord, strengthen my body and sharpen my mind. Guide my feet, protect me from injury, and let my performance bring glory to You today.",
  },
  {
    id: "prematch",
    title: "Pre-match prayer",
    desc: "Father, as I step onto this pitch I surrender the outcome to You. Let me play with courage, integrity, and joy. Win or lose, may my character reflect Your grace.",
  },
  {
    id: "struggle",
    title: "When you're struggling",
    desc: "God, I don't understand this season. Renew my strength. Remind me that You have a plan for me greater than any setback. Help me trust the process.",
  },
  {
    id: "evening",
    title: "Evening reflection",
    desc: "Lord, thank You for the strength You gave me today. I reflect on what I learned, I forgive myself for my mistakes, and I rest knowing You watch over me tonight. Tomorrow I rise again.",
  },
];

const SCRIPTURE_MOMENTS = [
  ["When you doubt yourself", '"For I know the plans I have for you," declares the LORD. ~ Jeremiah 29:11'],
  ["Before a big match", "Have I not commanded you? Be strong and courageous. ~ Joshua 1:9"],
  ["On hard work", "Whatever you do, work at it with all your heart. ~ Colossians 3:23"],
  ["When injured", "He gives strength to the weary. ~ Isaiah 40:29"],
];

export default function PlayerFaith({ session: s, checked }) {
  const allChecked = PRAYERS.every((p) => checked[p.id]);
  const verse = window.HF_SCRIPTURE.getToday();

  return (
    <>
      <div className="faith-hero">
        <i className="ti ti-cross" style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--faith)" }}></i>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Faith & Purpose</div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>Your talent is God-given. Your discipline is your worship.</div>
      </div>

      <div className="faith-verse-card">
        <div className="verse-text">{verse.verse}</div>
        <div className="verse-ref">{verse.ref}</div>
      </div>

      <div className="card faith-card">
        <div className="card-title" style={{ justifyContent: "space-between", paddingTop: "var(--sp-md)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>Daily prayers</div>
          {allChecked ? (
            <span
              style={{
                fontFamily: "var(--font)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "2px 8px",
                background: "rgba(26,122,46,.15)",
                color: "var(--green)",
              }}
            >
              <i className="ti ti-circle-check"></i> All done
            </span>
          ) : (
            <span style={{ fontFamily: "var(--font)", fontSize: 10, color: "var(--text3)" }}>
              {Object.values(checked).filter(Boolean).length}/{PRAYERS.length} completed
            </span>
          )}
        </div>

        {PRAYERS.map((p) => {
          const isChecked = !!checked[p.id];
          return (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--sp-md)",
                padding: "var(--sp-md)",
                background: "var(--bg2)",
                borderLeft: `2px solid ${isChecked ? "var(--green)" : "var(--faith)"}`,
                marginBottom: "var(--sp-sm)",
                cursor: "pointer",
                transition: "var(--trans)",
              }}
              onClick={() => togglePrayer(p.id, "player")}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  border: `2px solid ${isChecked ? "var(--green)" : "var(--faith)"}`,
                  background: isChecked ? "var(--green)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {isChecked && <i className="ti ti-check" style={{ fontSize: 12, color: "#fff" }}></i>}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: isChecked ? "var(--green)" : "var(--faith)",
                    marginBottom: 4,
                    textDecoration: isChecked ? "line-through" : "none",
                  }}
                >
                  {p.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text2)",
                    fontStyle: "normal",
                    lineHeight: 1.5,
                    opacity: isChecked ? 0.5 : 1,
                  }}
                >
                  {p.desc}
                </div>
              </div>
            </div>
          );
        })}

        {allChecked && (
          <div style={{ textAlign: "center", padding: "var(--sp-lg)", color: "var(--faith)", fontSize: 13, fontStyle: "normal" }}>
            <i className="ti ti-heart" style={{ marginRight: 6 }}></i>
            All prayers completed for today. Come back tomorrow.
          </div>
        )}
      </div>

      <div className="card faith-card">
        <div className="card-title" style={{ justifyContent: "space-between", paddingTop: "var(--sp-md)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>Scripture for every moment</div>
          {SCRIPTURE_MOMENTS.map(([title, text]) => (
            <div
              key={title}
              style={{
                padding: 12,
                background: "var(--faith-lt)",
                borderRadius: 0,
                borderLeft: "3px solid var(--faith)",
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--faith)", marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", fontStyle: "normal", lineHeight: 1.6 }}>{text}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
