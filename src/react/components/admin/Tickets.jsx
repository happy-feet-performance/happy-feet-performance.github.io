import { useState } from "react";

function TicketRow({ t, session }) {
  const roleColor =
    t.from?.role === "player"
      ? "var(--green)"
      : t.from?.role === "coach"
        ? "var(--gold)"
        : t.from?.role === "scout"
          ? "var(--blue)"
          : "var(--text3)";

  const borderColor =
    t.status === "open" ? "var(--red)" : t.status === "claimed" ? "var(--gold)" : "var(--green)";

  return (
    <div
      style={{
        padding: "var(--sp-md)",
        background: "var(--bg2)",
        borderLeft: `3px solid ${borderColor}`,
        marginBottom: "var(--sp-sm)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--sp-md)",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{t.subject}</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "1px 6px",
                background: `${roleColor}22`,
                color: roleColor,
              }}
            >
              {t.from?.role || "-"}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "1px 6px",
                background: "var(--bg)",
                color: "var(--text3)",
              }}
            >
              {t.category ? t.category.charAt(0).toUpperCase() + t.category.slice(1) : "-"}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>
            From: {t.from?.name || "-"} · {window.HF_UTILS.timeAgo(t.created_at)}
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>
            {t.body.slice(0, 150)}
            {t.body.length > 150 ? "..." : ""}
          </div>
          {t.claimed_by && (
            <div style={{ fontSize: 11, color: "var(--gold)", marginTop: 4 }}>
              <i className="ti ti-user" style={{ marginRight: 4 }}></i>
              Claimed by {t.claimer?.name || "Admin"} · {window.HF_UTILS.timeAgo(t.claimed_at)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          {t.status === "open" && (
            <button className="btn btn-primary btn-sm" onClick={() => window.HF_ADMIN.claimTicket(t.id)}>
              <i className="ti ti-hand-stop"></i> Claim
            </button>
          )}

          {t.status === "claimed" && (
            <>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => window.HF_ADMIN.replyTicket(t.id, t.subject)}
              >
                <i className="ti ti-message"></i>{" "}
                {t.claimed_by === session.userId ? "Reply" : "View thread"}
              </button>
              {t.claimed_by === session.userId && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => window.HF_ADMIN.resolveTicket(t.id, t.from_id, t.subject)}
                >
                  <i className="ti ti-circle-check"></i> Resolve
                </button>
              )}
            </>
          )}

          {t.status === "resolved" && (
            <>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => window.HF_ADMIN.replyTicket(t.id, t.subject)}
              >
                <i className="ti ti-message"></i> View
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => window.HF_ADMIN.reopenTicket(t.id)}
              >
                <i className="ti ti-arrow-back-up"></i> Reopen
              </button>
            </>
          )}

          <button
            className="btn btn-outline btn-sm"
            onClick={() => window.HF_ADMIN.viewTicketUser(t.from_id)}
          >
            <i className="ti ti-user"></i> Profile
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, color, items, session, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card" style={{ marginBottom: "var(--sp-md)" }}>
      <div
        className="card-title"
        style={{ cursor: "pointer", justifyContent: "space-between" }}
        onClick={() => setOpen((o) => !o)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
          <div className="card-dot" style={{ background: color }}></div>
          {title}
          <span style={{ fontSize: 11, color: "var(--text3)" }}>{items.length}</span>
        </div>
        <i
          className={`ti ${open ? "ti-chevron-up" : "ti-chevron-down"}`}
          style={{ fontSize: 14, color: "var(--text3)" }}
        ></i>
      </div>
      <div style={{ display: open ? "block" : "none" }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text2)", fontSize: 13 }}>
            No tickets here.
          </div>
        ) : (
          items.map((t) => <TicketRow key={t.id} t={t} session={session} />)
        )}
      </div>
    </div>
  );
}

export default function Tickets({ session, open, mine, others, resolved }) {
  return (
    <>
      <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--red)" }}>
            {open.length}
          </div>
          <div className="metric-label">Unclaimed</div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--gold)" }}>
            {mine.length}
          </div>
          <div className="metric-label">My tickets</div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--blue)" }}>
            {others.length}
          </div>
          <div className="metric-label">Others handling</div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--green)" }}>
            {resolved.length}
          </div>
          <div className="metric-label">Resolved</div>
        </div>
      </div>

      <Section title="Unclaimed" color="var(--red)" items={open} session={session} defaultOpen />
      <Section title="My tickets" color="var(--gold)" items={mine} session={session} defaultOpen />
      <Section
        title="Handled by others"
        color="var(--blue)"
        items={others}
        session={session}
        defaultOpen={false}
      />
      <Section
        title="Resolved"
        color="var(--green)"
        items={resolved}
        session={session}
        defaultOpen={false}
      />
    </>
  );
}
