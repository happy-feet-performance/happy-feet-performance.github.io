import { useEffect } from "react";
import { initials, isNewUser, timeAgo } from "../../../lib/utils.js";
import { launchConfetti, toast } from "../../../lib/dom.js";
import { Badge, ScriptureStrip } from "../shared/index.js";
import { resubmitAgency } from "../../../lib/scout.js";
import { navTo } from "../../../lib/router.js";

export default function Dashboard({ session: s, agentConvos, prospects }) {
  const p = s.profile || {};
  const agencyStatus = s.agencyStatus || "unregistered";
  const isVerified = agencyStatus === "verified";
  const isPending = agencyStatus === "pending";
  const isUnregistered = agencyStatus === "unregistered";
  const isRejected = agencyStatus === "rejected";
  const newUser = isNewUser(s);

  const trackedCount = prospects?.length || 0;
  const eliteCount = prospects?.filter((pr) => pr.flagged).length || 0;
  const sharedCount = prospects?.filter((pr) => pr.report_shared).length || 0;
  const placedCount = prospects?.filter((pr) => pr.placed).length || 0;

  useEffect(() => {
    if (newUser) {
      const t = setTimeout(() => launchConfetti(), 300);
      return () => clearTimeout(t);
    }
  }, [newUser]);

  const badgeStyle = {
    fontFamily: "var(--font)",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "2px 8px",
  };

  const agencyStatusBadge = isVerified ? (
    <span style={{ ...badgeStyle, background: "rgba(26,122,46,.15)", color: "var(--green)" }}>Verified</span>
  ) : isPending ? (
    <span style={{ ...badgeStyle, background: "rgba(196,154,10,.15)", color: "var(--gold)" }}>Pending</span>
  ) : isRejected ? (
    <span style={{ ...badgeStyle, background: "rgba(200,16,46,.15)", color: "var(--red)" }}>Rejected</span>
  ) : (
    <span style={{ ...badgeStyle, background: "var(--bg3)", color: "var(--text2)" }}>Unregistered</span>
  );

  return (
    <>
      <div className="welcome-banner">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-xl)" }}>
          <div
            style={{
              width: 72,
              height: 72,
              overflow: "hidden",
              background: "var(--blue)",
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
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              initials(s.name)
            )}
          </div>
          <div>
            <div className="welcome-title">
              {newUser ? "Welcome" : "Welcome back"}, Scout {s.name.split(" ")[0]}!
            </div>
            <div className="welcome-sub">
              {p.org || "-"} · {p.region || "-"}
            </div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <Badge type="blue">Scout</Badge>
              {agencyStatusBadge}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "var(--font)", fontSize: 42, fontWeight: 700, color: "var(--gold)" }}>
            {isVerified ? trackedCount : "-"}
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
            Prospects tracked
          </div>
        </div>
      </div>

      <ScriptureStrip />

      {(isUnregistered || isPending || isRejected) && (
        <div
          style={{
            padding: "var(--sp-lg)",
            background: isRejected ? "rgba(200,16,46,.06)" : "rgba(196,154,10,.06)",
            borderLeft: `3px solid ${isRejected ? "var(--red)" : "var(--gold)"}`,
            marginBottom: "var(--sp-lg)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: isRejected ? "var(--red)" : "var(--gold)",
              marginBottom: 6,
            }}
          >
            {isRejected
              ? "Agency verification rejected"
              : isPending
                ? "Agency verification pending"
                : "Agency not registered"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>
            {isRejected
              ? "Your agency verification was rejected. Please review the reason in your messages and resubmit."
              : isPending
                ? "Your agency is awaiting admin approval. Full scouting features will unlock once verified."
                : "Register and verify your agency to unlock full scouting features."}
          </div>
          {(isUnregistered || isRejected) && (
            <button className="btn btn-primary btn-sm" onClick={() => resubmitAgency()}>
              <i className="ti ti-clipboard-check"></i> {isRejected ? "Resubmit agency" : "Register your agency"}
            </button>
          )}
          {isRejected && (
            <button
              className="btn btn-outline btn-sm"
              style={{ marginLeft: 8 }}
              onClick={() => navTo("messages")}
            >
              <i className="ti ti-message"></i> View messages
            </button>
          )}
        </div>
      )}

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--gold)" }}>
            {isVerified ? trackedCount : "-"}
          </div>
          <div className="metric-label">Tracked</div>
          <div className="metric-sub" style={{ color: "var(--text2)" }}>
            {isVerified ? "Active prospects" : "Verify agency to unlock"}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--red)" }}>
            {isVerified ? eliteCount : "-"}
          </div>
          <div className="metric-label">Elite prospects</div>
          <div className="metric-sub" style={{ color: "var(--text2)" }}>
            {isVerified ? "Flagged" : "Verify agency to unlock"}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--green)" }}>
            {isVerified ? sharedCount : "-"}
          </div>
          <div className="metric-label">Reports shared</div>
          <div className="metric-sub" style={{ color: "var(--text2)" }}>
            {isVerified ? "Sent to clubs" : "Verify agency to unlock"}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--blue)" }}>
            {isVerified ? placedCount : "-"}
          </div>
          <div className="metric-label">Placed</div>
          <div className="metric-sub" style={{ color: "var(--text2)" }}>
            {isVerified ? "Total placements" : "Verify agency to unlock"}
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <button
          className="quick-action"
          onClick={() =>
            isVerified
              ? navTo("discover")
              : toast("Verify your agency first.", "error")
          }
        >
          <div className="quick-action-icon">
            <i className="ti ti-search"></i>
          </div>
          <div className="quick-action-label">Discover talent</div>
          <div className="quick-action-sub">{isVerified ? "Search players" : "Agency not verified"}</div>
        </button>
        <button
          className="quick-action"
          onClick={() =>
            isVerified
              ? navTo("prospects")
              : toast("Verify your agency first.", "error")
          }
        >
          <div className="quick-action-icon">
            <i className="ti ti-star"></i>
          </div>
          <div className="quick-action-label">Saved prospects</div>
          <div className="quick-action-sub">{isVerified ? `${trackedCount} being tracked` : "Agency not verified"}</div>
        </button>
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
              onClick={() => window.HF_AGENT.openConversation(c.session_id, c.message || "", c.response || "")}
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
                {timeAgo(c.created_at)}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
