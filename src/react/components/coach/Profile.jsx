import { Avatar, Badge, WdlRecord } from "../shared/index.js";

export default function CoachProfile({ session: s, wdl, onEdit, onSettings }) {
  const p = s.profile || {};

  return (
    <>
      <div
        style={{
          background: "#0f0f0d",
          padding: "var(--sp-2xl)",
          marginBottom: "var(--sp-lg)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--sp-lg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-lg)" }}>
          <Avatar name={s.name} src={p.avatarUrl} size="xl" color="var(--gold)" />
          <div>
            <div
              style={{
                fontFamily: "var(--font)",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "#fff",
              }}
            >
              {s.name}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 3 }}>
              {p.spec || "Head coach"} · {p.club || "-"}
            </div>
            <div style={{ marginTop: 8 }}>
              <Badge type="gold">Coach</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
            <div className="card-dot"></div>Coaching details
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={onEdit}>
              <i className="ti ti-edit"></i> Edit
            </button>
            <button className="btn btn-outline btn-sm" onClick={onSettings}>
              <i className="ti ti-settings"></i> Settings
            </button>
          </div>
        </div>
        <div className="info-grid">
          <div className="info-cell">
            <div className="info-label">Licence</div>
            <div className="info-val">{p.licence || "-"}</div>
          </div>
          <div className="info-cell">
            <div className="info-label">Experience</div>
            <div className="info-val">{p.exp || "-"} years</div>
          </div>
          <div className="info-cell">
            <div className="info-label">Club</div>
            <div className="info-val">{p.club || "-"}</div>
          </div>
          <div className="info-cell">
            <div className="info-label">Specialisation</div>
            <div className="info-val">{p.spec || "-"}</div>
          </div>
          <div className="info-cell">
            <div className="info-label">Squad size</div>
            <div className="info-val">{p.teamSize || 0} players</div>
          </div>
          <div className="info-cell">
            <div className="info-label">{s.contactType === "phone" ? "Phone" : "Email"}</div>
            <div className="info-val">{s.displayContact || s.contact}</div>
          </div>
        </div>
        <div
          style={{
            marginTop: "var(--sp-md)",
            paddingTop: "var(--sp-md)",
            borderTop: "0.5px solid var(--border)",
          }}
        >
          <div className="info-label" style={{ marginBottom: 8 }}>
            Match record
          </div>
          <WdlRecord W={wdl.W} D={wdl.D} L={wdl.L} />
        </div>
      </div>

      <div
        className="card"
        dangerouslySetInnerHTML={{ __html: window.HF_SETTINGS.renderSettingsSection(s) }}
      />
    </>
  );
}
