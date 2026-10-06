import { initials } from "../../../lib/utils.js";
import { AccountSettings, Badge } from "../shared/index.js";

export default function ScoutProfile({ session, onEdit, onSettings }) {
  const p = session.profile || {};
  const regionsDisplay = Array.isArray(p.regionsCovered)
    ? p.regionsCovered.join(", ")
    : p.region || "-";
  const leaguesDisplay = Array.isArray(p.targetLeagues)
    ? p.targetLeagues.join(", ")
    : p.dest || "-";

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
          <div
            style={{
              width: 72,
              height: 72,
              overflow: "hidden",
              background: "#185FA5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {p.avatarUrl ? (
              <img
                src={`${p.avatarUrl}?cb=${Date.now()}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              initials(session.name)
            )}
          </div>
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
              {session.name}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 3 }}>
              {p.org || "-"}
            </div>
            <div style={{ marginTop: 8 }}>
              <Badge type="blue">Scout</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
            <div className="card-dot"></div>Scout details
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                const mc = document.getElementById("main-content");
                if (mc && window.HF_REACT) {
                  window.HF_REACT.mount("ScoutEditProfile", mc, { session });
                } else {
                  onEdit();
                }
              }}
            >
              <i className="ti ti-edit"></i> Edit
            </button>
            <button className="btn btn-outline btn-sm" onClick={onSettings}>
              <i className="ti ti-settings"></i> Settings
            </button>
          </div>
        </div>
        <div className="info-grid">
          <div className="info-cell">
            <div className="info-label">Organisation</div>
            <div className="info-val">{p.org || "-"}</div>
          </div>
          <div className="info-cell">
            <div className="info-label">Experience</div>
            <div className="info-val">{p.exp || "-"} years</div>
          </div>
          <div className="info-cell">
            <div className="info-label">Regions covered</div>
            <div className="info-val">{regionsDisplay}</div>
          </div>
          <div className="info-cell">
            <div className="info-label">Target destinations</div>
            <div className="info-val">{leaguesDisplay}</div>
          </div>
          <div className="info-cell">
            <div className="info-label">{session.contactType === "phone" ? "Phone" : "Email"}</div>
            <div className="info-val">{session.displayContact || session.contact}</div>
          </div>
          <div className="info-cell">
            <div className="info-label">Agency status</div>
            <div
              className="info-val"
              style={{ color: session.agencyStatus === "verified" ? "var(--green)" : "var(--text2)" }}
            >
              {session.agencyStatus === "verified" ? "Verified" : session.agencyStatus || "Unregistered"}
            </div>
          </div>
        </div>
      </div>

      <AccountSettings session={session} />
    </>
  );
}
