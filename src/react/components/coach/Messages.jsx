import { composeMessage, contactAdmin } from "../../../lib/roleUtils.js";
import { ArchivedMessages, MessageList } from "../common/index.js";

export default function CoachMessages({ session: s, enriched, enrichedArchived }) {
  const isAwaitingReview = s.squadStatus === "awaiting_coach_approval";

  return (
    <>
      {isAwaitingReview && (
        <div
          style={{
            padding: "var(--sp-lg)",
            background: "rgba(24,95,165,.06)",
            borderLeft: "3px solid var(--blue)",
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
              color: "var(--blue)",
              marginBottom: 6,
            }}
          >
            Action required
          </div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>
            An admin has made changes to your squad registration. Review and respond below.
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => window.HF_COACH.reviewAdminEdits()}>
            <i className="ti ti-eye"></i> Review changes
          </button>
        </div>
      )}

      <div className="card">
        <div className="card-title" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
            <div className="card-dot"></div>Messages
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => composeMessage("coach")}
            >
              <i className="ti ti-edit"></i> New message
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => contactAdmin("coach")}
            >
              <i className="ti ti-headset"></i> Support
            </button>
          </div>
        </div>
        {!enriched || enriched.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text2)" }}>
            <i
              className="ti ti-message"
              style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--text3)" }}
            ></i>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
              No messages yet
            </div>
            <div style={{ fontSize: 13 }}>Messages from HappyFeet will appear here.</div>
          </div>
        ) : (
          <MessageList messages={enriched} role="coach" />
        )}
      </div>

      <ArchivedMessages messages={enrichedArchived} role="coach" />
    </>
  );
}
