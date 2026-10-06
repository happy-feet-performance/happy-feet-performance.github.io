import { useState } from "react";
import { deleteAccount, saveSettings } from "../../../lib/settings.js";

const ROLES = [
  ["player", "Player"],
  ["coach", "Coach"],
  ["scout", "Scout"],
  ["admin", "Admin"],
];

// Rendered at the bottom of each Profile view. id="settings" is the target
// of the header's settings shortcut (navTo("profile#settings")).
export default function AccountSettings({ session }) {
  const current = session.displayContact || session.contact;
  const [email, setEmail] = useState(session.contactType === "email" ? current : "");
  const [phone, setPhone] = useState(session.contactType === "phone" ? current : "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(session.role);
  const canChangeRole = session.role === "admin";

  const save = () => saveSettings({ email: email.trim(), phone: phone.trim(), password, role });

  return (
    <div className="card" id="settings">
      <div className="card-title">
        <div className="card-dot"></div>Account settings
      </div>
      <div className="fg">
        <label>Email address</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter new email" />
      </div>
      <div className="fg">
        <label>Phone number</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter new phone number" />
      </div>
      <div className="fg">
        <label>New password</label>
        <div className="password-wrap">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
          />
          <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)}>
            <i className={`ti ${showPassword ? "ti-eye-off" : "ti-eye"}`}></i>
          </button>
        </div>
      </div>
      {canChangeRole && (
        <>
          <div className="fg">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="info-label" style={{ marginTop: 6, color: "var(--text2)", fontSize: 12 }}>
            Admin-only role changes.
          </div>
        </>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-sm" onClick={save}>
          <i className="ti ti-save"></i> Save settings
        </button>
        <button className="btn btn-danger btn-sm" onClick={deleteAccount}>
          <i className="ti ti-trash"></i> Delete account
        </button>
      </div>
    </div>
  );
}
