import { initials } from "../../../lib/utils.js";
import { Badge } from "../shared/index.js";
import { ROLE_COLORS } from "./styles.js";
import { navTo } from "../../../lib/router.js";

const RATING_LABELS = { speed: "Speed", tech: "Technical", tact: "Tactical", phys: "Physical" };
const BADGE_TYPES = { player: "green", coach: "gold" };

const listOrValue = (v) => (Array.isArray(v) ? v.join(", ") : v);

// Fields shown per role: [label, value]. Empty values are skipped.
const detailsFor = (role, p) =>
  ({
    player: [
      ["Position", p.pos],
      ["Tier", p.tier],
      ["Hometown", p.hometown],
      ["Club", p.club],
    ],
    coach: [
      ["Specialisation", p.spec],
      ["Licence", p.licence],
      ["Club", p.club],
      ["Experience", p.exp && `${p.exp} years`],
    ],
    scout: [
      ["Agency", p.org],
      ["Home region", p.region],
      ["Regions covered", p.regionsCovered && listOrValue(p.regionsCovered)],
      ["Target leagues", p.targetLeagues && listOrValue(p.targetLeagues)],
      ["Experience", p.exp && `${p.exp} years`],
    ],
  })[role] || [];

function PlayerExtras({ p, overall }) {
  return (
    <>
      {overall !== null && (
        <div className="card" style={{ marginTop: "var(--sp-md)" }}>
          <div className="card-title">
            <div className="card-dot"></div>Performance ratings
          </div>
          <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
            {Object.entries(RATING_LABELS).map(([k, label]) => (
              <div key={k} className="metric-card">
                <div className="metric-val" style={{ color: "var(--gold)" }}>
                  {p.ratings[k]}
                </div>
                <div className="metric-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="card" style={{ marginTop: "var(--sp-md)" }}>
        <div className="card-title" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
            <div className="card-dot"></div>Highlight reel
          </div>
          <span
            style={{
              fontFamily: "var(--font)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "2px 6px",
              background: "rgba(196,154,10,.15)",
              color: "var(--gold)",
            }}
          >
            Coming soon
          </span>
        </div>
        <div style={{ textAlign: "center", padding: 32, background: "var(--bg2)", border: "0.5px dashed var(--border)" }}>
          <i className="ti ti-video" style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--text3)" }}></i>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>No highlights yet</div>
          <div style={{ fontSize: 13, color: "var(--text2)" }}>This player hasn't uploaded any highlights yet.</div>
        </div>
      </div>
    </>
  );
}

export default function UserProfile({ user, backView }) {
  const p = user.profile || {};
  const role = user.role;
  const r = p.ratings;
  const overall = r ? Math.round((r.speed + r.tech + r.tact + r.phys) / 4) : null;
  const details = detailsFor(role, p).filter(([, v]) => v);

  return (
    <>
      {backView && (
        <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={() => navTo(backView)}>
          <i className="ti ti-arrow-left"></i> Back
        </button>
      )}
      <div
        style={{
          background: "#0f0f0d",
          padding: "var(--sp-2xl)",
          marginTop: "var(--sp-lg)",
          marginBottom: "var(--sp-lg)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--sp-lg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-lg)" }}>
          <div
            style={{
              width: 72,
              height: 72,
              background: ROLE_COLORS[role] || "var(--blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font)",
              fontSize: 26,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {initials(user.name)}
          </div>
          <div>
            <div style={{ fontFamily: "var(--font)", fontSize: 22, fontWeight: 700, color: "#fff" }}>{user.name}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 2 }}>
              {p.pos || p.spec || p.org || "-"}
            </div>
            <div style={{ marginTop: 8 }}>
              <Badge type={BADGE_TYPES[role] || "blue"}>{role}</Badge>
            </div>
          </div>
        </div>
        {overall !== null && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font)", fontSize: 42, fontWeight: 700, color: "var(--gold)" }}>{overall}%</div>
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,.4)",
                fontFamily: "var(--font)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Overall
            </div>
          </div>
        )}
      </div>
      <div className="card">
        <div className="card-title">
          <div className="card-dot"></div>Profile details
        </div>
        <div className="info-grid">
          {details.map(([label, value]) => (
            <div key={label} className="info-cell">
              <div className="info-label">{label}</div>
              <div className="info-val">{value}</div>
            </div>
          ))}
        </div>
        {role === "player" && <PlayerExtras p={p} overall={overall} />}
      </div>
    </>
  );
}
