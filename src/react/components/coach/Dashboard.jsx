import { initials, timeAgo } from "../../../lib/utils.js";
import { toast } from "../../../lib/dom.js";
import { Badge } from "../shared/index.js";

export default function CoachDashboard({ session: s, readiness, agentConvos, newUser }) {
  const p = s.profile || {};
  const squadStatus = s.squadStatus || "unregistered";
  const isVerified = squadStatus === "verified";
  const isPending = squadStatus === "pending";
  const isUnregistered = squadStatus === "unregistered";
  const isRejected = squadStatus === "rejected";
  const isAwaitingCoach = squadStatus === "awaiting_coach_approval";

  const alertCount = isVerified && readiness ? readiness.alertCount : 0;

  const statusBadgeStyle = isVerified
    ? { background: "rgba(26,122,46,.15)", color: "var(--green)" }
    : isPending
      ? { background: "rgba(196,154,10,.15)", color: "var(--gold)" }
      : isAwaitingCoach
        ? { background: "rgba(24,95,165,.15)", color: "var(--blue)" }
        : isRejected
          ? { background: "rgba(200,16,46,.15)", color: "var(--red)" }
          : { background: "var(--bg3)", color: "var(--text2)" };

  const statusBadgeLabel = isVerified
    ? "Verified"
    : isPending
      ? "Pending"
      : isAwaitingCoach
        ? "Review required"
        : isRejected
          ? "Rejected"
          : "Unregistered";

  const showAlertBanner =
    isUnregistered || isPending || isRejected || isAwaitingCoach;

  const bannerColor = isRejected
    ? "var(--red)"
    : isAwaitingCoach
      ? "var(--blue)"
      : "var(--gold)";

  return (
    <>
      <div className="welcome-banner">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-lg)" }}>
          <div
            style={{
              width: 72,
              height: 72,
              overflow: "hidden",
              background: "var(--gold)",
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
              initials(s.name)
            )}
          </div>
          <div>
            <div className="welcome-title">
              {newUser ? "Welcome" : "Welcome back"}, Coach {s.name.split(" ")[0]}!
            </div>
            <div className="welcome-sub">
              {p.spec || "Head coach"} · {p.licence || "-"} licence
            </div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <Badge type="gold">Coach</Badge>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>{p.club || "-"}</span>
              <span
                style={{
                  fontFamily: "var(--font)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  ...statusBadgeStyle,
                }}
              >
                {statusBadgeLabel}
              </span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "var(--font)", fontSize: 42, fontWeight: 700, color: "var(--gold)" }}>
            {isVerified ? p.teamSize || 0 : "-"}
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
            Squad size
          </div>
        </div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: window.HF_SCRIPTURE.stripHTML() }} />

      {showAlertBanner && (
        <div
          style={{
            padding: "var(--sp-lg)",
            background: isRejected
              ? "rgba(200,16,46,.06)"
              : isAwaitingCoach
                ? "rgba(24,95,165,.06)"
                : "rgba(196,154,10,.06)",
            borderLeft: `3px solid ${bannerColor}`,
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
              color: bannerColor,
              marginBottom: 6,
            }}
          >
            {isRejected
              ? "Squad verification rejected"
              : isAwaitingCoach
                ? "Admin has updated your submission"
                : isPending
                  ? "Squad verification pending"
                  : "Squad not registered"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>
            {isRejected
              ? "Your squad verification was rejected. Please review the reason in your messages and resubmit."
              : isAwaitingCoach
                ? "An admin has made changes to your squad registration. Check your messages and accept or decline."
                : isPending
                  ? "Your squad is awaiting admin approval. Full features will unlock once verified."
                  : "Register and verify your squad to unlock full coaching features."}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {(isUnregistered || isRejected) && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => window.HF_COACH.resubmitSquad()}
              >
                <i className="ti ti-clipboard-check"></i>
                {isRejected ? " Resubmit squad" : " Register your squad"}
              </button>
            )}
            {isAwaitingCoach && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => window.HF_COACH.reviewAdminEdits()}
              >
                <i className="ti ti-eye"></i> Review changes
              </button>
            )}
            {(isRejected || isAwaitingCoach) && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => window.HF_ROUTER.navTo("messages")}
              >
                <i className="ti ti-message"></i> View messages
              </button>
            )}
          </div>
        </div>
      )}

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--gold)" }}>
            {isVerified ? p.teamSize || 0 : "-"}
          </div>
          <div className="metric-label">Squad size</div>
          <div className="metric-sub" style={{ color: "var(--text2)" }}>
            {isVerified ? "Active players" : "Verify squad"}
          </div>
        </div>
        <div className="metric-card">
          <div
            className="metric-val"
            style={{
              color:
                readiness?.score >= 75
                  ? "var(--green)"
                  : readiness?.score >= 50
                    ? "var(--gold)"
                    : "var(--red)",
            }}
          >
            {isVerified && readiness ? readiness.score + "%" : "-"}
          </div>
          <div className="metric-label">Squad readiness</div>
          <div className="metric-sub" style={{ color: "var(--text2)" }}>
            {isVerified && readiness
              ? `${readiness.checkedInCount}/${readiness.total} checked in`
              : "No data yet"}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--green)" }}>
            {isVerified && readiness && readiness.total > 0 ? readiness.avgRating + "/100" : "-"}
          </div>
          <div className="metric-label">Avg rating</div>
          <div className="metric-sub" style={{ color: "var(--text2)" }}>
            {isVerified && readiness ? `${readiness.ratedCount} players rated` : "No data yet"}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--blue)" }}>
            {isVerified && readiness && readiness.total > 0 ? readiness.wellnessRate + "%" : "-"}
          </div>
          <div className="metric-label">Wellness rate</div>
          <div className="metric-sub" style={{ color: "var(--text2)" }}>
            {isVerified && readiness
              ? `${readiness.readyCount}/${readiness.total} feeling good`
              : "No data yet"}
          </div>
        </div>
      </div>

      {isVerified && readiness && readiness.total > 0 && (
        <div className="card">
          <div className="card-title">
            <div className="card-dot"></div>Squad readiness breakdown
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-sm)" }}>
            {[
              { label: "Performance", val: readiness.avgRating, color: "var(--gold)" },
              { label: "Wellness participation", val: readiness.wellnessRate, color: "var(--blue)" },
              { label: "Player readiness", val: readiness.readyRate, color: "var(--green)" },
            ].map((item) => (
              <div key={item.label}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: "var(--text2)" }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>{item.val}%</span>
                </div>
                <div style={{ height: 6, background: "var(--border)" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${item.val}%`,
                      background: item.color,
                      transition: "width 0.4s ease",
                    }}
                  ></div>
                </div>
              </div>
            ))}
            <div
              style={{
                paddingTop: "var(--sp-sm)",
                borderTop: "0.5px solid var(--border)",
                fontSize: 11,
                color: "var(--text3)",
              }}
            >
              Readiness = 40% performance + 30% wellness participation + 30% player readiness
            </div>
          </div>
        </div>
      )}

      <div className="quick-actions">
        <button
          className="quick-action"
          onClick={() =>
            isVerified
              ? window.HF_ROUTER.navTo("squad")
              : toast("Verify your squad first.", "error")
          }
        >
          <div className="quick-action-icon">
            <i className="ti ti-users"></i>
          </div>
          <div className="quick-action-label">View squad</div>
          <div className="quick-action-sub">
            {isVerified ? (p.teamSize || 0) + " players" : "Squad not verified"}
          </div>
        </button>
        <button
          className="quick-action"
          onClick={() =>
            isVerified
              ? window.HF_ROUTER.navTo("training")
              : toast("Verify your squad first.", "error")
          }
        >
          <div className="quick-action-icon">
            <i className="ti ti-clipboard-list"></i>
          </div>
          <div className="quick-action-label">Today's session</div>
          <div className="quick-action-sub">{isVerified ? "Plan a session" : "Squad not verified"}</div>
        </button>
        <button
          className="quick-action"
          onClick={() =>
            isVerified
              ? window.HF_ROUTER.navTo("health")
              : toast("Verify your squad first.", "error")
          }
        >
          <div className="quick-action-icon">
            <i
              className="ti ti-stethoscope"
              style={{ color: isVerified && readiness && alertCount > 0 ? "var(--red)" : "inherit" }}
            ></i>
          </div>
          <div className="quick-action-label">Health flags</div>
          <div
            className="quick-action-sub"
            style={{ color: isVerified && readiness && alertCount > 0 ? "var(--red)" : "" }}
          >
            {isVerified && readiness
              ? `${alertCount} alert${alertCount !== 1 ? "s" : ""}`
              : "Squad not verified"}
          </div>
        </button>
      </div>

      <div className="card">
        <div
          className="card-title"
          style={{ justifyContent: "space-between", alignItems: "center" }}
        >
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
            <div style={{ fontSize: 13 }}>
              Ask the AI agent anything about football (tactics, training, player development).
            </div>
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
                {timeAgo(c.created_at)}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
