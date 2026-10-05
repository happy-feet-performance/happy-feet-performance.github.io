import { useState } from "react";
import { timeAgo } from "../../../lib/utils.js";
import { newTicket, viewTicketThread } from "../../../lib/roleUtils.js";
import { TICKET_STATUS } from "./styles.js";

const lastMessage = (t) => t.messages?.[t.messages.length - 1];

function TicketCard({ t, session, isUnread, onOpen }) {
  const status = TICKET_STATUS[t.status] || TICKET_STATUS.resolved;
  const msgCount = t.messages?.length || 0;
  const last = lastMessage(t);

  return (
    <div
      style={{
        background: "var(--bg)",
        border: "0.5px solid var(--border)",
        borderLeft: `4px solid ${isUnread ? "var(--gold)" : status.color}`,
        marginBottom: "var(--sp-sm)",
        cursor: "pointer",
        transition: "background 0.15s ease",
        position: "relative",
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg2)")}
      onMouseOut={(e) => (e.currentTarget.style.background = "var(--bg)")}
      onClick={onOpen}
    >
      <div style={{ padding: "var(--sp-md) var(--sp-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 13,
              fontWeight: isUnread ? 700 : 600,
              color: "var(--text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {t.subject}
          </div>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              padding: "2px 6px",
              background: `${status.color}22`,
              color: status.color,
              flexShrink: 0,
            }}
          >
            {status.label}
          </span>
          <i className="ti ti-chevron-right" style={{ color: "var(--text3)", fontSize: 16, flexShrink: 0 }}></i>
        </div>

        <div style={{ fontSize: 11, color: "var(--text3)" }}>
          {[session.name, timeAgo(t.created_at), `${msgCount} message${msgCount !== 1 ? "s" : ""}`].join(" · ")}
        </div>

        {t.status === "claimed" && (
          <div
            style={{
              fontSize: 11,
              color: "var(--text2)",
              marginTop: 6,
              paddingTop: 6,
              borderTop: "0.5px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <i className="ti ti-user" style={{ color: "var(--gold)" }}></i>
            <span>
              Being handled by <strong style={{ color: "var(--text)" }}>{t.claimer?.name || "HappyFeet Support"}</strong>
            </span>
          </div>
        )}

        {last && (
          <div
            style={{
              fontSize: 12,
              color: "var(--text2)",
              marginTop: 6,
              padding: "8px 12px",
              background: isUnread ? "rgba(196,154,10,.06)" : "var(--bg2)",
              borderLeft: isUnread ? "2px solid var(--gold)" : "none",
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--text2)" }}>{last.is_admin ? "Support" : "You"}: </span>
            {last.body.slice(0, 100)}
            {last.body.length > 100 ? "..." : ""}
          </div>
        )}
      </div>
    </div>
  );
}

function TicketSection({ title, color, tickets, defaultOpen, highlight, renderTicket }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="card"
      style={{ marginBottom: "var(--sp-md)", ...(highlight ? { borderTop: "3px solid var(--gold)" } : {}) }}
    >
      <div
        className="card-title"
        style={{ cursor: "pointer", justifyContent: "space-between" }}
        onClick={() => setOpen((v) => !v)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
          <div className="card-dot" style={{ background: color }}></div>
          {title}
          {highlight ? (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "2px 6px",
                background: "rgba(196,154,10,.15)",
                color: "var(--gold)",
              }}
            >
              {tickets.length} new
            </span>
          ) : (
            <span style={{ fontSize: 11, color: "var(--text3)" }}>{tickets.length}</span>
          )}
        </div>
        <i
          className={`ti ${open ? "ti-chevron-up" : "ti-chevron-down"}`}
          style={{ fontSize: 14, color: "var(--text3)" }}
        ></i>
      </div>
      {open &&
        (tickets.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text2)", fontSize: 13 }}>No tickets here.</div>
        ) : (
          tickets.map((t) => renderTicket(t, highlight))
        ))}
    </div>
  );
}

export default function MyTickets({ session, tickets, fromMessages, role }) {
  const active = (t) => t.status !== "resolved";
  const unread = tickets.filter((t) => lastMessage(t)?.is_admin && active(t));
  const replied = tickets.filter((t) => !lastMessage(t)?.is_admin && (t.messages?.length || 0) > 1 && active(t));
  const resolved = tickets.filter((t) => !active(t));

  const renderTicket = (t, isUnread) => (
    <TicketCard
      key={t.id}
      t={t}
      session={session}
      isUnread={isUnread}
      onOpen={() => viewTicketThread(t.id, t.subject, fromMessages, role)}
    />
  );

  const sections = [
    { key: "unread", title: "Needs your attention", color: "var(--gold)", tickets: unread, defaultOpen: true, highlight: true },
    { key: "replied", title: "Awaiting response", color: "var(--blue)", tickets: replied, defaultOpen: true },
    { key: "resolved", title: "Resolved", color: "var(--green)", tickets: resolved, defaultOpen: false },
  ].filter((sec) => sec.tickets.length > 0);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--sp-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-md)" }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => window.HF_ROUTER.navTo(fromMessages ? "messages" : "dashboard")}
          >
            <i className="ti ti-arrow-left"></i> Back
          </button>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>My support tickets</div>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="card">
          <div style={{ textAlign: "center", padding: "48px 32px" }}>
            <i className="ti ti-ticket" style={{ fontSize: 48, marginBottom: 16, display: "block", color: "var(--text3)" }}></i>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>No tickets yet</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 24 }}>
              Submit a support ticket if you need help.
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => newTicket(session, fromMessages, role)}>
              <i className="ti ti-plus"></i> New ticket
            </button>
          </div>
        </div>
      ) : sections.length > 0 ? (
        sections.map(({ key, ...sec }) => <TicketSection key={key} {...sec} renderTicket={renderTicket} />)
      ) : (
        <TicketSection title="All tickets" color="var(--text3)" tickets={tickets} defaultOpen renderTicket={renderTicket} />
      )}
    </>
  );
}
