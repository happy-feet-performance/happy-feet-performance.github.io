import { useEffect, useRef } from "react";
import { timeAgo } from "../../../lib/utils.js";

// Sub-view rendered by HF_ADMIN.replyTicket() when an admin opens a
// claimed/resolved ticket's message thread from the Tickets view.
export default function TicketThread({ ticketId, subject, session, messages }) {
  const threadRef = useRef(null);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  const sendReply = () => {
    window.HF_ADMIN.sendTicketReply(ticketId, subject);
  };

  return (
    <>
      <div
        style={{ display: "flex", alignItems: "center", gap: "var(--sp-md)", marginBottom: "var(--sp-lg)" }}
      >
        <button className="btn btn-outline btn-sm" onClick={() => window.HF_ROUTER.navTo("tickets")}>
          <i className="ti ti-arrow-left"></i> Back
        </button>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{subject}</div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          ref={threadRef}
          id="ticket-thread"
          style={{
            padding: "var(--sp-lg)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--sp-md)",
            minHeight: 200,
            maxHeight: "50vh",
            overflowY: "auto",
          }}
        >
          {(messages || []).map((m) => {
            const isMine = m.from_id === session.userId;
            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMine ? "flex-end" : "flex-start",
                }}
              >
                <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 3 }}>
                  {m.from_name} · {timeAgo(m.created_at)}
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
        <div
          style={{
            padding: "var(--sp-md)",
            borderTop: "0.5px solid var(--border)",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <input
            type="text"
            id="ticket-reply-input"
            placeholder="Write a reply..."
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
            onKeyDown={(e) => {
              if (e.key === "Enter") sendReply();
            }}
          />
          <button
            className="btn btn-primary"
            style={{
              height: 42,
              width: 42,
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={sendReply}
          >
            <i className="ti ti-send"></i>
          </button>
        </div>
      </div>
    </>
  );
}
