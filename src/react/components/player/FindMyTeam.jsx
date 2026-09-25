import { useState } from "react";

const LEAGUES = [
  "Ghana Premier League",
  "Division One League",
  "MTN FA Cup",
  "CAF Champions League",
  "Other",
];

function CoachCard({ c, onRequestTrial, onMessageCoach }) {
  const p = c.profile || {};
  const req = c.trialRequest;
  const isPending = req?.status === "pending";
  const isAccepted = req?.status === "accepted";
  const isDeclined = req?.status === "declined";

  const declinedRecently =
    isDeclined && req?.responded_at && new Date() - new Date(req.responded_at) < 24 * 60 * 60 * 1000;

  return (
    <div className="card" style={{ marginBottom: "var(--sp-md)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--sp-md)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-md)" }}>
          <div
            className="avatar avatar-lg"
            style={{
              background: "var(--gold)",
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font)",
              fontSize: 18,
              fontWeight: 700,
              color: "#0f0f0d",
            }}
          >
            {window.HF_UTILS.initials(c.name)}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{c.name}</div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>{p.club || "-"}</div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>
              {p.spec || "Head coach"} · {p.exp || "-"} yrs exp · {p.licence || "-"}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "var(--font)", fontSize: 20, fontWeight: 700, color: "var(--gold)" }}>
            {p.teamSize || 0}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--text3)",
              fontFamily: "var(--font)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Players
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: "var(--sp-md)",
          paddingTop: "var(--sp-md)",
          borderTop: "0.5px solid var(--border)",
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {isAccepted ? (
          <span
            style={{
              fontFamily: "var(--font)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "3px 8px",
              background: "rgba(26,122,46,.15)",
              color: "var(--green)",
            }}
          >
            <i className="ti ti-circle-check"></i> Trial accepted
          </span>
        ) : isPending ? (
          <span
            id={`trial-btn-${c.id}`}
            style={{
              fontFamily: "var(--font)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "3px 8px",
              background: "rgba(196,154,10,.15)",
              color: "var(--gold)",
            }}
          >
            <i className="ti ti-clock"></i> Trial request pending
          </span>
        ) : declinedRecently ? (
          <span
            style={{
              fontFamily: "var(--font)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "3px 8px",
              background: "rgba(200,16,46,.1)",
              color: "var(--red)",
            }}
          >
            <i className="ti ti-x"></i> Declined: resend in 24hrs
          </span>
        ) : (
          <button id={`trial-btn-${c.id}`} className="btn btn-primary btn-sm" onClick={() => onRequestTrial(c)}>
            <i className="ti ti-send"></i> Request trial
          </button>
        )}
        <button className="btn btn-outline btn-sm" onClick={() => onMessageCoach(c)}>
          <i className="ti ti-message"></i> Message
        </button>
      </div>
    </div>
  );
}

export default function PlayerFindMyTeam({ session: s, coaches, onRequestTrial, onMessageCoach }) {
  const [league, setLeague] = useState("");
  const [search, setSearch] = useState("");

  const filtered = (coaches || []).filter((c) => {
    const p = c.profile || {};
    const matchLeague = !league || p.league === league;
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.club || "").toLowerCase().includes(search.toLowerCase());
    return matchLeague && matchSearch;
  });

  return (
    <>
      <div className="welcome-banner">
        <div>
          <div className="welcome-title">Find my team</div>
          <div className="welcome-sub">Browse verified coaches looking for players</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: "var(--sp-lg)", flexWrap: "wrap" }}>
        <select
          value={league}
          onChange={(e) => setLeague(e.target.value)}
          style={{
            padding: "7px 10px",
            background: "var(--bg2)",
            border: "0.5px solid var(--border)",
            color: "var(--text)",
            fontSize: 12,
            fontFamily: "var(--font)",
            outline: "none",
          }}
        >
          <option value="">All leagues</option>
          {LEAGUES.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search by coach or club name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 150,
            padding: "7px 10px",
            background: "var(--bg2)",
            border: "0.5px solid var(--border)",
            color: "var(--text)",
            fontSize: 12,
            fontFamily: "var(--font)",
            outline: "none",
          }}
        />
      </div>

      <div id="coaches-list">
        {!filtered || filtered.length === 0 ? (
          <div className="card">
            <div style={{ textAlign: "center", padding: 32, color: "var(--text2)" }}>
              <i
                className="ti ti-map-search"
                style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--text3)" }}
              ></i>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
                {!coaches || coaches.length === 0 ? "No coaches recruiting yet" : "No coaches match your filters."}
              </div>
              {(!coaches || coaches.length === 0) && (
                <div style={{ fontSize: 13 }}>Verified coaches who are open for recruitment will appear here.</div>
              )}
            </div>
          </div>
        ) : (
          filtered.map((c) => (
            <CoachCard key={c.id} c={c} onRequestTrial={onRequestTrial} onMessageCoach={onMessageCoach} />
          ))
        )}
      </div>
    </>
  );
}
