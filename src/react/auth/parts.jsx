import { useEffect, useRef, useState } from "react";
import { passwordStrength } from "../../lib/auth.js";

export const COUNTRY_CODES = [
  ["+233", "🇬🇭"],
  ["+234", "🇳🇬"],
  ["+221", "🇸🇳"],
  ["+225", "🇨🇮"],
  ["+256", "🇺🇬"],
  ["+254", "🇰🇪"],
  ["+27", "🇿🇦"],
  ["+1", "🇺🇸"],
  ["+44", "🇬🇧"],
];

// One auth screen. All screens stay mounted so typed values survive moving
// back and forth; only the active one is shown (.auth-screen.active).
export function Screen({ id, active, children, center }) {
  return (
    <div className={`auth-screen${active ? " active" : ""}`} id={id}>
      <div className={`auth-card${center ? " text-center" : ""}`}>{children}</div>
    </div>
  );
}

export function AuthLogo({ name = "split", tag }) {
  return (
    <div className="auth-logo">
      <div className="auth-logo-hex">HF</div>
      {name === "mark" ? (
        <div className="auth-logo-mark">HappyFeet</div>
      ) : name === "plain" ? (
        <div className="auth-logo-name">HappyFeet</div>
      ) : (
        <div className="auth-logo-name">
          <span>Happy</span>Feet
        </div>
      )}
      {tag && <div className="auth-logo-tag">{tag}</div>}
    </div>
  );
}

// e.g. <StepRow steps={["done", "active", ""]} />
export function StepRow({ steps }) {
  return (
    <div className="step-row">
      {steps.map((s, i) => (
        <div key={i} className={`step${s ? ` ${s}` : ""}`}></div>
      ))}
    </div>
  );
}

// Error message that clears itself after 2s and whenever the screen is
// left, like the old HF_UTILS.showError.
export function useTimedError(active) {
  const [error, setError] = useState("");
  const timer = useRef(null);
  const show = (message) => {
    clearTimeout(timer.current);
    setError(message || "");
    if (message) timer.current = setTimeout(() => setError(""), 2000);
  };
  useEffect(() => {
    clearTimeout(timer.current);
    setError("");
  }, [active]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [error, show];
}

// `box` → .error-box (login/signup/verify), otherwise .auth-error.
export function ErrorMessage({ message, box }) {
  if (!message) return null;
  return <div className={box ? "error-box show" : "auth-error"}>{message}</div>;
}

// Enter anywhere on the page triggers the active screen's main action.
export function useEnterKey(enabled, handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e) => {
      if (e.key === "Enter") ref.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [enabled]);
}

export function PasswordInput({ value, onChange, placeholder, onEnter, onInput }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-wrap">
      <input
        type={visible ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          onInput?.(e.target.value);
        }}
        onKeyDown={onEnter ? (e) => e.key === "Enter" && onEnter() : undefined}
      />
      <button type="button" className="password-toggle" onClick={() => setVisible((v) => !v)}>
        <i className={`ti ${visible ? "ti-eye-off" : "ti-eye"}`}></i>
      </button>
    </div>
  );
}

export function StrengthMeter({ password }) {
  const level = passwordStrength(password);
  return (
    <>
      <div className="strength-bar">
        <div className="strength-fill" style={{ width: level.width, background: level.color }}></div>
      </div>
      <div className="strength-label" style={{ color: level.color }}>
        {level.label}
      </div>
    </>
  );
}

export function PhoneInput({ countryCode, onCountryCode, phone, onPhone }) {
  return (
    <div className="input-group">
      <select value={countryCode} onChange={(e) => onCountryCode(e.target.value)}>
        {COUNTRY_CODES.map(([code, flag]) => (
          <option key={code} value={code}>
            {flag} {code}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={phone}
        onChange={(e) => onPhone(e.target.value)}
        placeholder="024 123 4567"
        autoComplete="off"
      />
    </div>
  );
}

export function TabToggle({ tab, onTab, className = "" }) {
  return (
    <div className={`tab-toggle${className ? ` ${className}` : ""}`}>
      <button className={tab === "email" ? "active" : ""} onClick={() => onTab("email")}>
        Email
      </button>
      <button className={tab === "phone" ? "active" : ""} onClick={() => onTab("phone")}>
        Phone number
      </button>
    </div>
  );
}

// Multi-select: chosen values appear as removable tags above the buttons,
// and a chosen value's button is hidden.
export function TagPicker({ options, selected, onChange, buttonClass, rowClass = "region-button-row" }) {
  const toggle = (value) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  return (
    <>
      <div className="region-group">
        {selected.map((value) => (
          <span key={value} className="selected-tag">
            {value}{" "}
            <span className="tag-close" title="Remove" onClick={() => toggle(value)}>
              ×
            </span>
          </span>
        ))}
      </div>
      <div className={rowClass}>
        {options
          .filter((value) => !selected.includes(value))
          .map((value) => (
            <button key={value} type="button" className={buttonClass} onClick={() => toggle(value)}>
              {value}
            </button>
          ))}
      </div>
    </>
  );
}
