import { calcRating, initials } from "../../../lib/utils.js";
import { AccountSettings, Badge, RatingBar } from "../shared/index.js";

export default function PlayerProfile({ session: s, ms, jerseyNumber, onEdit, onSettings, onLeaveTeam }) {
  const p = s.profile || {};
  const r = p.ratings || {};
  const overall = calcRating(r);
  const unrated = overall === null;
  const hasMatchStats = ms && ms.matches_played > 0;

  return (
    <>
      {/* ── PROFILE HEADER ── */}
      <div
        style={{
          background: "#0f0f0d",
          padding: "var(--sp-2xl)",
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
              overflow: "hidden",
              background: "#1a7a2e",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {p.avatarUrl ? (
              <img
                src={`${p.avatarUrl}?cb=${Date.now()}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              initials(s.name)
            )}
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font)",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "#fff",
              }}
            >
              {s.name}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 3 }}>
              {p.pos || "-"} · {p.tier || "-"}
            </div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <Badge type="green">Player</Badge>
              {p.status === "unattached" || !p.club ? (
                <span
                  style={{
                    fontFamily: "var(--font)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    background: "var(--bg3)",
                    color: "var(--text2)",
                  }}
                >
                  Free Agent
                </span>
              ) : (
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
                  {p.club} <i className="ti ti-circle-check"></i>
                </span>
              )}
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>{p.hometown || "Ghana"}</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontFamily: "var(--font)",
              fontSize: 42,
              fontWeight: 700,
              color: unrated ? "var(--text3)" : "var(--gold)",
            }}
          >
            {unrated ? "-" : overall + "%"}
          </div>
          <div
            style={{
              fontFamily: "var(--font)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,.4)",
            }}
          >
            {unrated ? "Not yet rated" : "Overall rating"}
          </div>
        </div>
      </div>

      {/* ── PLAYER DETAILS ── */}
      <div className="card">
        <div className="card-title" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
            <div className="card-dot"></div>Player details
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <button className="btn btn-outline btn-sm" onClick={onEdit}>
              <i className="ti ti-edit"></i> Edit
            </button>
            <button className="btn btn-outline btn-sm" onClick={onSettings}>
              <i className="ti ti-settings"></i> Settings
            </button>
            {p.club && p.status !== "unattached" && (
              <button className="btn btn-danger btn-sm" onClick={onLeaveTeam}>
                <i className="ti ti-logout"></i> Leave team
              </button>
            )}
          </div>
        </div>
        <div className="info-grid">
          <div className="info-cell">
            <div className="info-label">Position</div>
            <div className="info-val">{p.pos || "-"}</div>
          </div>
          <div className="info-cell">
            <div className="info-label">Age tier</div>
            <div className="info-val">{p.tier || "-"}</div>
          </div>
          <div className="info-cell">
            <div className="info-label">Club status</div>
            <div
              className="info-val"
              style={{ color: p.status === "unattached" || !p.club ? "var(--text2)" : "var(--green)" }}
            >
              {p.status === "unattached" || !p.club ? "Free Agent" : p.club + " ✓"}
            </div>
          </div>
          <div className="info-cell">
            <div className="info-label">Hometown</div>
            <div className="info-val">{p.hometown || "-"}</div>
          </div>
          <div className="info-cell">
            <div className="info-label">{s.contactType === "phone" ? "Phone" : "Email"}</div>
            <div className="info-val">{s.displayContact || s.contact}</div>
          </div>
          <div className="info-cell">
            <div className="info-label">Faith streak</div>
            <div className="info-val" style={{ color: "var(--faith)" }}>
              {p.faithStreak || 0} days <i className="ti ti-cross"></i>
            </div>
          </div>
          <div className="info-cell">
            <div className="info-label">Jersey #</div>
            <div className="info-val" style={{ color: "var(--gold)", fontSize: 18, fontWeight: 700 }}>
              {jerseyNumber || "-"}
            </div>
          </div>
        </div>
      </div>

      {/* ── MATCH STATS ── */}
      <div className="card">
        <div className="card-title">
          <div className="card-dot"></div>Match stats
        </div>
        {!hasMatchStats ? (
          <div style={{ textAlign: "center", padding: 20, color: "var(--text2)", fontSize: 13 }}>
            No match data yet.
          </div>
        ) : (
          <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 0 }}>
            <div className="metric-card">
              <div className="metric-val" style={{ color: "var(--gold)" }}>
                {ms.matches_played || 0}
              </div>
              <div className="metric-label">Matches</div>
            </div>
            <div className="metric-card">
              <div className="metric-val" style={{ color: "var(--green)" }}>
                {ms.goals || 0}
              </div>
              <div className="metric-label">Goals</div>
            </div>
            <div className="metric-card">
              <div className="metric-val" style={{ color: "var(--blue)" }}>
                {ms.assists || 0}
              </div>
              <div className="metric-label">Assists</div>
            </div>
            <div className="metric-card">
              <div className="metric-val" style={{ color: "var(--text2)" }}>
                {ms.shots || 0}
              </div>
              <div className="metric-label">Shots</div>
            </div>
            <div className="metric-card">
              <div className="metric-val" style={{ color: "var(--faith)" }}>
                {ms.saves || 0}
              </div>
              <div className="metric-label">Saves</div>
            </div>
            <div className="metric-card">
              <div className="metric-val" style={{ color: "var(--gold)" }}>
                {ms.minutes_played || 0}
              </div>
              <div className="metric-label">Minutes</div>
            </div>
            <div className="metric-card">
              <div className="metric-val" style={{ color: "#f5c518" }}>
                {ms.yellow_cards || 0}
              </div>
              <div className="metric-label">Yellows</div>
            </div>
            <div className="metric-card">
              <div className="metric-val" style={{ color: "var(--red)" }}>
                {ms.red_cards || 0}
              </div>
              <div className="metric-label">Reds</div>
            </div>
          </div>
        )}
      </div>

      <AccountSettings session={s} />

      {/* ── ABILITY RATINGS ── */}
      <div className="card">
        <div className="card-title">
          <div className="card-dot"></div>Ability ratings
        </div>
        {unrated ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text2)" }}>
            <i
              className="ti ti-info-circle"
              style={{ fontSize: 28, marginBottom: 10, display: "block", color: "var(--text3)" }}
            ></i>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
              No ratings yet
            </div>
            <div style={{ fontSize: 13 }}>Ratings will update as your coach logs your session data.</div>
          </div>
        ) : (
          <div>
            <RatingBar label="Speed" value={r.speed || 0} color="#c8102e" />
            <RatingBar label="Technical" value={r.tech || 0} color="var(--gold)" />
            <RatingBar label="Tactical" value={r.tact || 0} color="var(--blue)" />
            <RatingBar label="Physical" value={r.phys || 0} color="var(--green)" />
          </div>
        )}
      </div>

      {/* ── HIGHLIGHT REEL ── */}
      <div className="card">
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
          <i
            className="ti ti-video"
            style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--text3)" }}
          ></i>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
            No highlights yet
          </div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
            Upload your best moments to showcase your talent to scouts and coaches.
          </div>
          <button className="btn btn-outline btn-sm" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
            <i className="ti ti-upload"></i> Upload highlight (coming soon)
          </button>
        </div>
      </div>
    </>
  );
}
