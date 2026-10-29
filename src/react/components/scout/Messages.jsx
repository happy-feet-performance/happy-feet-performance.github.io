import { composeMessage, contactAdmin } from "../../../lib/roleUtils.js";
import { ArchivedMessages, MessageList } from "../common/index.js";

export default function Messages({ enriched, enrichedArchived }) {
  const msgs = enriched || [];

  return (
    <>
      <div className="card">
        <div className="card-title" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
            <div className="card-dot"></div>Messages
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-primary btn-sm" onClick={() => composeMessage("scout")}>
              <i className="ti ti-edit"></i> New message
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => contactAdmin("scout")}>
              <i className="ti ti-headset"></i> Support
            </button>
          </div>
        </div>
        {msgs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text2)" }}>
            <i
              className="ti ti-message"
              style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--text3)" }}
            ></i>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>No messages yet</div>
            <div style={{ fontSize: 13 }}>Messages from HappyFeet and players will appear here.</div>
          </div>
        ) : (
          <MessageList messages={msgs} role="scout" />
        )}
      </div>

      <ArchivedMessages messages={enrichedArchived} role="scout" />
    </>
  );
}
