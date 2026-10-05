import { togglePrayer } from "../../../lib/roleUtils.js";

const PRAYERS = [
  {
    id: "patience",
    title: "On patience with players",
    desc: '"Love is patient, love is kind." ~ 1 Corinthians 13:4',
  },
  {
    id: "leading",
    title: "On leading well",
    desc: '"Whoever wants to become great must be your servant." ~ Matthew 20:26',
  },
  {
    id: "perseverance",
    title: "On perseverance",
    desc: '"Let us not become weary in doing good." ~ Galatians 6:9',
  },
  {
    id: "evening",
    title: "Evening reflection",
    desc: "Lord, thank You for the strength You gave me today. I reflect on what I learned, I forgive myself for my mistakes, and I rest knowing You watch over me tonight. Tomorrow I rise again.",
  },
];

export default function CoachFaith({ checked }) {
  const allChecked = PRAYERS.every((p) => checked.includes(p.id));
  const today = window.HF_SCRIPTURE.getToday();

  const howTo = [
    ["ti-users", "Gather the squad", "Before every session, 5 to 10 minutes together."],
    ["ti-book", "Read a verse together", `Today: ${today.ref}.`],
    ["ti-microphone", "One player leads prayer", "Rotate leadership each session."],
    ["ti-target", "Set an intention", "What does the squad play for today?"],
    ["ti-hand-stop", "Hands in, one voice", "Close together as a team."],
  ];

  return (
    <>
      <div className="faith-hero">
        <i className="ti ti-cross" style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--faith)" }}></i>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Team Devotion</div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>Lead your players in faith as well as football.</div>
      </div>

      <div className="faith-verse-card">
        <div className="verse-text">{today.verse}</div>
        <div className="verse-ref">{today.ref}</div>
      </div>

      <div className="card faith-card">
        <div className="card-title" style={{ justifyContent: "space-between", paddingTop: "var(--sp-md)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
            Daily devotion checklist
          </div>
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
              {checked.length}/{PRAYERS.length} completed
            </span>
          )}
        </div>
        {PRAYERS.map((p) => {
          const isChecked = checked.includes(p.id);
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
              }}
              onClick={() => togglePrayer(p.id, "coach")}
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
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: isChecked ? "var(--green)" : "var(--faith)",
                    marginBottom: 4,
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
      </div>

      <div className="card faith-card">
        <div className="card-title" style={{ paddingTop: "var(--sp-md)" }}>How to run team devotion</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-sm)" }}>
          {howTo.map(([icon, title, desc], i) => (
            <div
              key={title}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--sp-md)",
                padding: "var(--sp-md)",
                background: "var(--bg2)",
                borderLeft: "3px solid var(--faith)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "var(--faith)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "#fff",
                  fontSize: 15,
                }}
              >
                <i className={`ti ${icon}`}></i>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font)", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
                  {i + 1}. {title}
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
