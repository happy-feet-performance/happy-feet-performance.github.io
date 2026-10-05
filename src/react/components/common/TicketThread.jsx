import { useEffect, useRef, useState } from "react";
import { timeAgo } from "../../../lib/utils.js";
import {
  markTicketResolved,
  myTickets,
  reopenUserTicket,
  sendUserTicketReply,
} from "../../../lib/roleUtils.js";
import { TICKET_STATUS } from "./styles.js";

function StatusNote({ color, bg, icon, children }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        background: bg,
        borderLeft: `3px solid ${color}`,
        marginBottom: "var(--sp-lg)",
        fontSize: 12,
        color: "var(--text2)",
      }}
    >
      <i className={`ti ${icon}`} style={{ marginRight: 6, color }}></i>
      {children}
    </div>
  );
}

export default function TicketThread({ ticketId, subject, fromMessages, role, currentUserId, ticket, messages }) {
  const [reply, setReply] = useState("");
  const listRef = useRef(null);
  const status = TICKET_STATUS[ticket?.status] || TICKET_STATUS.resolved;
  const args = [ticketId, subject, fromMessages, role];

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, []);

  const send = () => sendUserTicketReply(...args, reply.trim());

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--sp-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-md)" }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => myTickets(window.HF_DB.getSession(), fromMessages, role)}
          >
            <i className="ti ti-arrow-left"></i> My tickets
          </button>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{subject}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "1px 6px",
                  background: `${status.color}22`,
                  color: status.color,
                }}
              >
                {status.label}
              </span>
              <span style={{ fontSize: 11, color: "var(--text3)" }}>{ticket?.category || ""}</span>
            </div>
          </div>
        </div>
      </div>

      {ticket?.status === "claimed" && (
        <StatusNote color="var(--gold)" bg="rgba(196,154,10,.06)" icon="ti-user">
          Being handled by <strong style={{ color: "var(--text)" }}>{ticket.claimer?.name || "HappyFeet Support"}</strong>
        </StatusNote>
      )}
      {ticket?.status === "resolved" && (
        <StatusNote color="var(--green)" bg="rgba(26,122,46,.06)" icon="ti-circle-check">
          This ticket has been resolved.
        </StatusNote>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          ref={listRef}
          style={{
            padding: "var(--sp-lg)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--sp-md)",
            minHeight: 200,
            maxHeight: "55vh",
            overflowY: "auto",
          }}
        >
          {messages.map((m) => {
            const isMine = m.from_id === currentUserId;
            return (
              <div
                key={m.id}
                style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}
              >
                <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 3 }}>
                  {isMine ? "You" : "HappyFeet Support"} · {timeAgo(m.created_at)}
                </div>
                <div
                  style={{
                    maxWidth: "75%",
                    padding: "10px 14px",
                    background: isMine ? "var(--gold)" : "var(--bg2)",
                    color: isMine ? "#0f0f0d" : "var(--text)",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {m.body}
                </div>
              </div>
            );
          })}
        </div>
        {ticket?.status !== "resolved" ? (
          <div
            style={{
              padding: "var(--sp-md)",
              borderTop: "0.5px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              background: "var(--bg)",
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Add a message..."
                style={{
                  flex: 1,
                  padding: "0 12px",
                  height: 42,
                  background: "var(--bg2)",
                  border: "0.5px solid var(--border)",
                  color: "var(--text)",
                  fontSize: 13,
                  fontFamily: "var(--font)",
                  outline: "none",
                }}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button
                className="btn btn-primary"
                style={{
                  height: 42,
                  width: 42,
                  padding: 0,
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={send}
              >
                <i className="ti ti-send"></i>
              </button>
            </div>
            {ticket?.status === "claimed" && (
              <button
                className="btn btn-outline btn-sm"
                style={{ alignSelf: "flex-end" }}
                onClick={() => markTicketResolved(...args)}
              >
                <i className="ti ti-circle-check"></i> Mark as resolved
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              padding: "var(--sp-md)",
              borderTop: "0.5px solid var(--border)",
              background: "var(--bg)",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button className="btn btn-outline btn-sm" onClick={() => reopenUserTicket(...args)}>
              <i className="ti ti-arrow-back-up"></i> Reopen ticket
            </button>
          </div>
        )}
      </div>
    </>
  );
}
