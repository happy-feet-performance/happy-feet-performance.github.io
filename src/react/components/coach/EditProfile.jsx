import { initials } from "../../../lib/utils.js";
import { contactAdmin, previewAvatar } from "../../../lib/roleUtils.js";

export default function CoachEditProfile({ session }) {
  const p = session.profile || {};

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
              background: "#C49A0A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 700,
              color: "#0f0f0d",
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
              onChange={(e) => previewAvatar(e.target)}
            />
          </label>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font)", fontSize: 22, fontWeight: 700, color: "#fff" }}>
            {session.name}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 3 }}>
            {p.spec || "Head coach"}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <div className="card-dot"></div>Edit profile
        </div>
        <div className="fg">
          <label className="required">Full name</label>
          <input
            type="text"
            id="ep-name"
            defaultValue={session.name || ""}
            placeholder="Your full name"
            style={{
              padding: "10px 14px",
              background: "var(--bg2)",
              border: "0.5px solid var(--border)",
              color: "var(--text)",
              fontSize: 14,
              width: "100%",
              outline: "none",
              fontFamily: "var(--font)",
            }}
          />
        </div>
        <div className="form-row">
          <div className="fg">
            <label className="required">Coaching licence</label>
            <select id="ep-licence" defaultValue={p.licence || ""}>
              <option value="">Select licence</option>
              <option>None yet</option>
              <option>CAF D</option>
              <option>CAF C</option>
              <option>CAF B</option>
              <option>CAF A</option>
              <option>UEFA Pro</option>
            </select>
          </div>
          <div className="fg">
            <label className="required">Years experience</label>
            <input
              type="number"
              id="ep-exp"
              defaultValue={p.exp || ""}
              min="0"
              max="50"
              style={{
                padding: "10px 14px",
                background: "var(--bg2)",
                border: "0.5px solid var(--border)",
                color: "var(--text)",
                fontSize: 14,
                width: "100%",
                outline: "none",
                fontFamily: "var(--font)",
              }}
            />
          </div>
        </div>
        <div className="fg">
          <label>Specialisation</label>
          <select id="ep-spec" defaultValue={p.spec || "All-round"}>
            <option>All-round</option>
            <option>Goalkeeper</option>
            <option>Defending</option>
            <option>Attacking</option>
            <option>Set pieces</option>
            <option>Fitness & conditioning</option>
          </select>
        </div>
        {session.squadStatus === "verified" ? (
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
            Your squad{" "}
            <strong style={{ color: "var(--green)" }}>{session.profile?.club || ""}</strong> is
            verified. To change your club name please{" "}
            <span
              onClick={() => contactAdmin("coach")}
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
            Club name is set during squad verification.
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button className="btn btn-primary" onClick={() => window.HF_COACH.saveProfile()}>
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
