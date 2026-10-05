import { timeAgo } from "../../../lib/utils.js";
import { composeMessage, contactAdmin } from "../../../lib/roleUtils.js";
import { ArchivedMessages, MessageList } from "../common/index.js";

export default function PlayerMessages({ session: s, invites, enriched, enrichedArchived, onRespondInvite }) {
  return (
    <>
      {invites?.length > 0 && (
        <div className="card">
          <div className="card-title">
            <div className="card-dot"></div>Squad invites
          </div>
          {invites.map((inv) => (
            <div
              key={inv.id}
              style={{
                padding: "var(--sp-md)",
                background: "var(--bg2)",
                borderLeft: "2px solid var(--gold)",
                marginBottom: "var(--sp-sm)",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                <i className="ti ti-users"></i> Invite to join {inv.squad_name}
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10 }}>
                {timeAgo(inv.created_at)}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onRespondInvite(inv.id, inv.player_id, true, inv.squad_name, inv.coach_id)}
                >
                  <i className="ti ti-circle-check"></i> Accept
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => onRespondInvite(inv.id, inv.player_id, false, inv.squad_name, inv.coach_id)}
                >
                  <i className="ti ti-x"></i> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-title" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
            <div className="card-dot"></div>Messages
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-primary btn-sm" onClick={() => composeMessage("player")}>
              <i className="ti ti-edit"></i> New message
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => contactAdmin("player")}>
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
            <div style={{ fontSize: 13 }}>Messages will appear here.</div>
          </div>
        ) : (
          <MessageList messages={enriched} role="player" />
        )}
      </div>

      <ArchivedMessages messages={enrichedArchived} role="player" />
    </>
  );
}
