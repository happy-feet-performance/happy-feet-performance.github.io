import { useState } from "react";
import { timeAgo } from "../../../lib/utils.js";
import {
  archiveMessage,
  readMessage,
  reportToAdmin,
  viewSenderProfile,
  viewThread,
} from "../../../lib/roleUtils.js";
import { sectionLabelStyle } from "./styles.js";

const isSystemSender = (fromId) => !fromId || fromId === "admin" || fromId === "system";

const senderLabel = (m) =>
  m.senderName ||
  (m.from_id === "system" ? "HappyFeet System" : m.from_id === "admin" ? "HappyFeet Admin" : "HappyFeet");

function MessageRow({ m, role }) {
  const [showActions, setShowActions] = useState(false);
  const isSystem = isSystemSender(m.from_id);
  const open = () =>
    isSystem ? readMessage(m.id, null, role) : viewThread(m.thread_id || m.id, m.from_id, m.subject || "", role);

  return (
    <>
      <div className="msg-item" onClick={open}>
        <div
          className="avatar avatar-md"
          style={{ background: "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <i className="ti ti-shield" style={{ fontSize: 16, color: !m.read ? "var(--gold)" : "var(--text2)" }}></i>
        </div>
        <div style={{ flex: 1 }}>
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
            From: {senderLabel(m)}
          </div>
          <div className="msg-name">{m.subject || "Message"}</div>
          <div className="msg-preview">{m.body}</div>
          <div className="msg-time">{timeAgo(m.created_at)}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          {!m.read && <div className="msg-unread">1</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <button
              className="btn btn-outline btn-sm"
              title="Archive message"
              onClick={(e) => {
                e.stopPropagation();
                archiveMessage(m.id, null, role);
              }}
            >
              <i className="ti ti-archive"></i>
            </button>
            {!isSystem && (
              <button
                className="btn btn-outline btn-sm"
                title="More options"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions((v) => !v);
                }}
              >
                <i className="ti ti-dots-vertical"></i>
              </button>
            )}
          </div>
        </div>
      </div>
      {showActions && (
        <div
          style={{
            padding: "var(--sp-sm)",
            background: "var(--bg2)",
            borderLeft: "2px solid var(--border)",
            marginBottom: 4,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className="btn btn-outline btn-sm" onClick={open}>
              <i className="ti ti-arrow-back-up"></i> Reply
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => viewSenderProfile(m.from_id, role, "messages")}>
              <i className="ti ti-user"></i> View profile
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => reportToAdmin(m.from_id, m.senderName || "")}>
              <i className="ti ti-flag"></i> Report
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function MessageList({ messages, role }) {
  if (!messages?.length) return null;
  const unread = messages.filter((m) => !m.read);
  const read = messages.filter((m) => m.read);

  return (
    <>
      {unread.length > 0 && (
        <>
          <div style={{ ...sectionLabelStyle, color: "var(--red)" }}>Unread ({unread.length})</div>
          {unread.map((m) => (
            <MessageRow key={m.id} m={m} role={role} />
          ))}
          <div style={{ height: 1, background: "var(--border)", margin: "var(--sp-md) 0" }}></div>
        </>
      )}
      {read.length > 0 && (
        <>
          <div style={{ ...sectionLabelStyle, color: "var(--text3)" }}>Read ({read.length})</div>
          {read.map((m) => (
            <MessageRow key={m.id} m={m} role={role} />
          ))}
        </>
      )}
    </>
  );
}
