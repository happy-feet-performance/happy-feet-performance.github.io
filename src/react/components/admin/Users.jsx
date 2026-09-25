import { useState } from "react";

function UserRow({ u, showActions = true }) {
  const roleColor =
    u.role === "player"
      ? "var(--green)"
      : u.role === "coach"
        ? "var(--gold)"
        : u.role === "admin"
          ? "var(--red)"
          : "var(--blue)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-md)",
        padding: "var(--sp-md)",
        background: "var(--bg2)",
        marginBottom: "var(--sp-sm)",
        borderLeft: `2px solid ${u.banned ? "var(--red)" : "var(--border)"}`,
      }}
    >
      <div className="avatar avatar-sm" style={{ background: roleColor }}>
        {window.HF_UTILS.initials(u.name)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{u.name}</div>
        <div style={{ fontSize: 11, color: "var(--text2)" }}>{u.contact}</div>
        {u.banned && (
          <div style={{ fontSize: 11, color: "var(--red)", marginTop: 2 }}>
            Banned: {u.ban_reason || "-"}
          </div>
        )}
      </div>
      {showActions ? (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => window.HF_ROLE_UTILS.viewSenderProfile(u.id, "admin", "users")}
          >
            <i className="ti ti-user"></i> Profile
          </button>
          {u.banned ? (
            <button className="btn btn-outline btn-sm" onClick={() => window.HF_ADMIN.unbanUser(u.id)}>
              <i className="ti ti-lock-open"></i> Unban
            </button>
          ) : (
            <>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => window.HF_ADMIN.kickUser(u.id, u.name)}
              >
                <i className="ti ti-logout"></i> Kick
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => window.HF_ADMIN.banUser(u.id, u.name)}
              >
                <i className="ti ti-ban"></i> Ban
              </button>
            </>
          )}
          <button
            className="btn btn-danger btn-sm"
            onClick={() => window.HF_ADMIN.removeUser(u.id, u.name)}
          >
            <i className="ti ti-trash"></i> Remove
          </button>
        </div>
      ) : (
        <div
          style={{
            fontFamily: "var(--font)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "2px 8px",
            background: "rgba(200,16,46,.1)",
            color: "var(--red)",
          }}
        >
          Admin
        </div>
      )}
    </div>
  );
}

// Users sections all start collapsed, matching the legacy markup
// (which hardcoded style="display:none" regardless of section).
function Section({ title, color, list, showActions = true }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card">
      <div
        className="card-title"
        style={{ cursor: "pointer", justifyContent: "space-between" }}
        onClick={() => setOpen((o) => !o)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
          <div className="card-dot"></div>
          {title}
          <span style={{ color, marginLeft: 4 }}>{list.length}</span>
        </div>
        <i
          className={`ti ${open ? "ti-chevron-up" : "ti-chevron-down"}`}
          style={{ fontSize: 14, color: "var(--text3)" }}
        ></i>
      </div>
      <div style={{ display: open ? "block" : "none" }}>
        {list.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text2)", fontSize: 13 }}>
            No {title.toLowerCase()} yet.
          </div>
        ) : (
          list.map((u) => <UserRow key={u.id} u={u} showActions={showActions} />)
        )}
      </div>
    </div>
  );
}

export default function Users({ users }) {
  const players = users?.filter((u) => u.role === "player") || [];
  const coaches = users?.filter((u) => u.role === "coach") || [];
  const scouts = users?.filter((u) => u.role === "scout") || [];
  const admins = users?.filter((u) => u.role === "admin") || [];

  return (
    <>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--green)" }}>
            {players.length}
          </div>
          <div className="metric-label">Players</div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--gold)" }}>
            {coaches.length}
          </div>
          <div className="metric-label">Coaches</div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--blue)" }}>
            {scouts.length}
          </div>
          <div className="metric-label">Scouts</div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--red)" }}>
            {admins.length}
          </div>
          <div className="metric-label">Admins</div>
        </div>
      </div>

      <Section title="Players" color="var(--green)" list={players} />
      <Section title="Coaches" color="var(--gold)" list={coaches} />
      <Section title="Scouts" color="var(--blue)" list={scouts} />
      <Section title="Admins" color="var(--red)" list={admins} showActions={false} />
    </>
  );
}
