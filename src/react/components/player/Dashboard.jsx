import { useEffect } from "react";

export default function PlayerDashboard({
  session: s,
  overall,
  newUser,
  loginStreak,
  unreadCount,
  sessionsThisMonth,
  agentConvos,
}) {
  const p = s.profile || {};

  useEffect(() => {
    if (newUser) {
      const t = setTimeout(() => window.HF_UTILS.launchConfetti(), 300);
      return () => clearTimeout(t);
    }
  }, [newUser]);

  return (
    <>
      <div className="welcome-banner">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-lg)" }}>
          <div
            style={{
              width: 72,
              height: 72,
              overflow: "hidden",
              background: "var(--green)",
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
                onError={(e) => (e.target.style.display = "none")}
              />
            ) : (
              window.HF_UTILS.initials(s.name)
            )}
          </div>
          <div>
            <div className="welcome-title">
              {newUser ? "Welcome" : "Welcome back"}, {s.name.split(" ")[0]}!
            </div>
            <div className="welcome-sub">
              {p.pos || "Player"} · {p.tier || "U21"} ·{" "}
              {p.status === "unattached" ? "Free Agent" : p.club || "Unattached"}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "var(--gold)" }}>
            {overall !== null ? overall + "%" : "-"}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>
            {overall !== null ? "Overall rating" : "Not yet rated"}
          </div>
        </div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: window.HF_SCRIPTURE.stripHTML() }} />

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--gold)" }}>
            {overall !== null ? overall + "%" : "-"}
          </div>
          <div className="metric-label">Overall rating</div>
          <div className="metric-sub" style={{ color: "var(--text2)" }}>
            {overall !== null ? "Based on your stats" : "Not yet rated"}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--green)" }}>
            {loginStreak}
          </div>
          <div className="metric-label">Daily streak</div>
          <div className="metric-sub" style={{ color: "var(--text2)" }}>
            {loginStreak === 1 ? "Day 1: keep going!" : `${loginStreak} days in a row`}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--faith)" }}>
            {p.faithStreak || 0}
          </div>
          <div className="metric-label">Faith streak</div>
          <div className="metric-sub" style={{ color: "var(--text2)" }}>
            Days in a row
          </div>
        </div>
        <div
          className="metric-card"
          style={{ cursor: "pointer" }}
          onClick={() => window.HF_ROUTER.navTo("messages")}
        >
          <div className="metric-val" style={{ color: "var(--red)" }}>
            {unreadCount}
          </div>
          <div className="metric-label">Messages</div>
          <div className="metric-sub" style={{ color: "var(--text2)" }}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <button className="quick-action" onClick={() => window.HF_ROUTER.navTo("stats")}>
          <div className="quick-action-icon">
            <i className="ti ti-chart-bar"></i>
          </div>
          <div className="quick-action-label">View my stats</div>
          <div className="quick-action-sub">Performance data</div>
        </button>
        <button className="quick-action" onClick={() => window.HF_ROUTER.navTo("health")}>
          <div className="quick-action-icon">
            <i className="ti ti-stethoscope"></i>
          </div>
          <div className="quick-action-label">Log wellness</div>
          <div className="quick-action-sub">How are you today?</div>
        </button>
        <button className="quick-action" onClick={() => window.HF_ROUTER.navTo("faith")}>
          <div className="quick-action-icon">
            <i className="ti ti-cross"></i>
          </div>
          <div className="quick-action-label">Morning devotion</div>
          <div className="quick-action-sub">Prayer & scripture</div>
        </button>
      </div>

      <div className="card">
        <div className="card-title">
          <div className="card-dot"></div>Recent activity
        </div>
        {sessionsThisMonth === 0 && (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text2)" }}>
            <i
              className="ti ti-activity"
              style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--text3)" }}
            ></i>
            <div style={{ fontSize: 13 }}>No activity yet. Log your first session to get started.</div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
            <div className="card-dot"></div>Recent AI conversations
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => window.HF_AGENT.toggle()}>
            <i className="ti ti-ball-football"></i> Ask AI
          </button>
        </div>
        {!agentConvos || agentConvos.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text2)" }}>
            <i
              className="ti ti-ball-football"
              style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--text3)" }}
            ></i>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
              No conversations yet
            </div>
            <div style={{ fontSize: 13 }}>Ask the AI agent anything about football.</div>
          </div>
        ) : (
          agentConvos.map((c) => (
            <div
              key={c.session_id}
              style={{
                padding: "var(--sp-md)",
                background: "var(--bg2)",
                borderLeft: "2px solid var(--gold)",
                marginBottom: "var(--sp-sm)",
                cursor: "pointer",
              }}
              onClick={() =>
                window.HF_AGENT.openConversation(
                  c.session_id,
                  (c.message || "").replace(/`/g, "'").replace(/\n/g, " "),
                  (c.response || "").replace(/`/g, "'").replace(/\n/g, " "),
                )
              }
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                <i className="ti ti-message" style={{ color: "var(--gold)", marginRight: 4 }}></i>
                {c.message}
              </div>
              <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.5 }}>
                {c.response.slice(0, 120)}
                {c.response.length > 120 ? "..." : ""}
              </div>
              <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4 }}>
                {window.HF_UTILS.timeAgo(c.created_at)}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
