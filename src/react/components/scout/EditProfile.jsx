import { initials } from "../../../lib/utils.js";

export default function EditProfile({ session }) {
  const p = session.profile || {};

  const fieldInputStyle = {
    padding: "10px 14px",
    background: "var(--bg2)",
    border: "0.5px solid var(--border)",
    color: "var(--text)",
    fontSize: 14,
    width: "100%",
    outline: "none",
    fontFamily: "var(--font)",
  };

  return (
    <>
      <div
        style={{
          background: "#0f0f0d",
          padding: "var(--sp-2xl)",
          marginBottom: "var(--sp-lg)",
          display: "flex",
          alignItems: "flex-start",
          gap: "var(--sp-lg)",
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            id="avatar-banner"
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
          <label
            style={{
              position: "absolute",
              bottom: -8,
              right: -8,
              width: 24,
              height: 24,
              background: "var(--gold)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0f0f0d",
            }}
          >
            <i className="ti ti-camera" style={{ fontSize: 12 }}></i>
            <input
              type="file"
              id="avatar-input"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => window.HF_ROLE_UTILS.previewAvatar(e.target)}
            />
          </label>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font)", fontSize: 22, fontWeight: 700, color: "#fff" }}>{session.name}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 3 }}>{p.org || "-"}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <div className="card-dot"></div>Edit profile
        </div>
        <div className="fg">
          <label className="required">Full name</label>
          <input type="text" id="ep-name" defaultValue={session.name || ""} placeholder="Your full name" style={fieldInputStyle} />
        </div>
        <div className="fg">
          <label className="required">Organisation / agency</label>
          <input
            type="text"
            id="ep-org"
            defaultValue={p.org || ""}
            placeholder="e.g. HappyFeet Scouting"
            style={fieldInputStyle}
          />
        </div>
        <div className="fg">
          <label className="required">Years experience</label>
          <input type="number" id="ep-exp" defaultValue={p.exp || ""} min="0" max="50" style={fieldInputStyle} />
        </div>
        {session.agencyStatus === "verified" ? (
          <div
            style={{
              padding: 12,
              background: "rgba(26,122,46,.05)",
              borderLeft: "2px solid var(--green)",
              fontSize: 13,
              color: "var(--text2)",
              marginBottom: "var(--sp-md)",
            }}
          >
            <i className="ti ti-circle-check" style={{ marginRight: 6, color: "var(--green)" }}></i>
            Your agency <strong style={{ color: "var(--green)" }}>{session.profile?.org || ""}</strong> is verified. To
            change your agency name please{" "}
            <span
              onClick={() => window.HF_ROLE_UTILS.contactAdmin("scout")}
              style={{ color: "var(--gold)", cursor: "pointer", textDecoration: "underline" }}
            >
              contact an administrator
            </span>
            .
          </div>
        ) : (
          <div
            style={{
              padding: 12,
              background: "var(--bg2)",
              borderLeft: "2px solid var(--border)",
              fontSize: 13,
              color: "var(--text2)",
              marginBottom: "var(--sp-md)",
            }}
          >
            <i className="ti ti-info-circle" style={{ marginRight: 6 }}></i>
            Agency name is set during agency verification.
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button className="btn btn-primary" onClick={() => window.HF_SCOUT.saveProfile()}>
            <i className="ti ti-circle-check"></i> Save changes
          </button>
          <button className="btn btn-outline" onClick={() => window.HF_ROUTER.navTo("profile")}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
