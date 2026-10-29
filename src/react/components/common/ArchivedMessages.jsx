import { useState } from "react";
import { timeAgo } from "../../../lib/utils.js";
import { unarchiveMessage, viewThread } from "../../../lib/roleUtils.js";

export default function ArchivedMessages({ messages, role }) {
  // Unarchiving re-renders the Messages view; keep this section open then.
  const [open, setOpen] = useState(() => {
    const startOpen = window._archivedSectionOpen || false;
    window._archivedSectionOpen = false;
    return startOpen;
  });
  if (!messages?.length) return null;

  return (
    <div className="card">
      <div className="card-title" style={{ cursor: "pointer" }} onClick={() => setOpen((v) => !v)}>
        <div className="card-dot"></div>Archived
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text3)" }}>
          {messages.length} · click to expand
        </span>
      </div>
      {open &&
        messages.map((m) => {
          const isSystem = m.from_id === "system" || m.from_id === "admin";
          const openThread = () => viewThread(m.thread_id, m.from_id, m.subject || "", role);
          return (
            <div
              key={m.id}
              className="msg-item"
              style={{ cursor: isSystem ? "default" : "pointer" }}
              onClick={isSystem ? undefined : openThread}
            >
              <div
                className="avatar avatar-md"
                style={{ background: "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <i className="ti ti-shield" style={{ fontSize: 16, color: "var(--text3)" }}></i>
              </div>
              <div style={{ flex: 1, opacity: 0.6 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--font)",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--text3)",
                    marginBottom: 2,
                  }}
                >
                  From: {m.senderName || (isSystem ? "HappyFeet System" : "HappyFeet Admin")}
                </div>
                <div className="msg-name">{m.subject || "Message"}</div>
                <div className="msg-preview">{m.body}</div>
                <div className="msg-time">{timeAgo(m.created_at)}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                <button
                  className="btn btn-outline btn-sm"
                  title="Move back to inbox"
                  onClick={(e) => {
                    e.stopPropagation();
                    unarchiveMessage(m.id, role);
                  }}
                >
                  <i className="ti ti-inbox"></i>
                </button>
                {!isSystem && (
                  <button
                    className="btn btn-outline btn-sm"
                    title="View thread"
                    onClick={(e) => {
                      e.stopPropagation();
                      openThread();
                    }}
                  >
                    <i className="ti ti-message"></i>
                  </button>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
