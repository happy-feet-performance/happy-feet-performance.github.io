import { useState } from "react";
import { initials } from "../../../lib/utils.js";
import { previewAvatar } from "../../../lib/roleUtils.js";
import { saveProfile } from "../../../lib/player.js";
import { navTo } from "../../../lib/router.js";

const POSITIONS = ["GK", "CB", "LB", "RB", "DM", "CM", "CAM", "LW", "RW", "ST"];
const TIERS = ["U10", "U12", "U14", "U16", "U18", "U21", "Professional"];

export default function PlayerEditProfile({ session: s }) {
  const p = s.profile || {};
  const [values, setValues] = useState({ name: s.name || "", pos: p.pos || "", tier: p.tier || "", hometown: p.hometown || "" });
  const field = (key) => ({ value: values[key], onChange: (e) => setValues((v) => ({ ...v, [key]: e.target.value })) });

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
          <div style={{ position: "relative" }}>
            <div
              id="avatar-banner"
              style={{
                width: 72,
                height: 72,
                overflow: "hidden",
                background: "#1a7a2e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {p.avatarUrl ? (
                <img src={p.avatarUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                initials(s.name)
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
              {p.pos || "-"} · {p.tier || "-"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 4 }}>
              Click camera to change photo
            </div>
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
            {...field("name")}
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
            <label className="required">Position</label>
            <select
              {...field("pos")}
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
            >
              <option value="">Select position</option>
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label>Age tier</label>
            <select
              {...field("tier")}
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
            >
              {TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="fg">
          <label className="required">Hometown / region</label>
          <input
            type="text"
            {...field("hometown")}
            placeholder="e.g. Kumasi, Ashanti"
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
        {!p.club ? (
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
            Your club is assigned by your coach once you join a verified squad.
          </div>
        ) : (
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
            You are currently signed to <strong style={{ color: "var(--green)" }}>{p.club}</strong>.
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button className="btn btn-primary" onClick={() => saveProfile(values)}>
            <i className="ti ti-circle-check"></i> Save changes
          </button>
          <button className="btn btn-outline" onClick={() => navTo("profile")}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
