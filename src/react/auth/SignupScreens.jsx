import { useState } from "react";
import { useAppState } from "../../lib/appStore.js";
import { completeSignup, goStep2, goStep3, goToConfirm, selectRole, showScreen } from "../../lib/auth.js";
import {
  AuthLogo,
  ErrorMessage,
  PasswordInput,
  PhoneInput,
  Screen,
  StepRow,
  StrengthMeter,
  TabToggle,
  useEnterKey,
  useTimedError,
} from "./parts.jsx";

const ROLES = [
  { role: "player", icon: "ti-ball-football", name: "Player", desc: "Track development & find your team" },
  { role: "coach", icon: "ti-clipboard-list", name: "Coach", desc: "Manage squad & build sessions" },
  { role: "scout", icon: "ti-search", name: "Scout", desc: "Discover talent & placements" },
];
const ROLE_ICONS = Object.fromEntries(ROLES.map((r) => [r.role, r.icon]));

export function SignupRoleScreen({ active }) {
  const role = useAppState((s) => s.signupRole);
  useEnterKey(active, goStep2);

  return (
    <Screen id="screen-signup-role" active={active}>
      <AuthLogo />
      <StepRow steps={["active", "", ""]} />
      <div className="auth-title">Who are you?</div>
      <div className="auth-sub">Choose your role to get started</div>
      <div className="role-grid">
        {ROLES.map((r) => (
          <div
            key={r.role}
            className={`role-card${role === r.role ? " selected" : ""}`}
            onClick={() => selectRole(r.role)}
          >
            <div className="role-icon">
              <i className={`ti ${r.icon}`}></i>
            </div>
            <div className="role-name">{r.name}</div>
            <div className="role-desc">{r.desc}</div>
          </div>
        ))}
      </div>
      <button className="btn btn-primary btn-full" onClick={goStep2}>
        Continue →
      </button>
      <div className="auth-link">
        Have an account? <a onClick={() => showScreen("screen-login")}>Sign in</a>
      </div>
    </Screen>
  );
}

// ─── Role-specific signup fields ───────────────────────────
const ROLE_FIELD_DEFAULTS = {
  player: { pos: "", tier: "U21", hometown: "" },
  coach: { licence: "None yet", exp: "", club: "", spec: "All-round" },
  scout: { org: "", exp: "", region: "" },
};
const POSITIONS = ["GK", "CB", "LB", "RB", "DM", "CM", "CAM", "LW", "RW", "ST"];
const TIERS = ["U10", "U12", "U14", "U16", "U18", "U21", "Professional"];
const LICENCES = ["None yet", "CAF D", "CAF C", "CAF B", "CAF A", "UEFA Pro"];
const SPECS = ["All-round", "Goalkeeper", "Defending", "Attacking", "Set pieces", "Fitness & conditioning"];
const REGIONS = [
  "Ghana",
  "Nigeria",
  "Senegal",
  "Ivory Coast",
  "Cameroon",
  "Kenya",
  "South Africa",
  "Egypt",
  "Morocco",
  "West Africa",
  "East Africa",
  "North Africa",
  "Other",
];

function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

function RoleFields({ role, fields, set }) {
  if (role === "player")
    return (
      <>
        <div className="form-row">
          <div className="fg">
            <label className="required">Position</label>
            <Select value={fields.pos} onChange={set("pos")} options={POSITIONS} placeholder="Select position" />
          </div>
          <div className="fg">
            <label>Age tier</label>
            <Select value={fields.tier} onChange={set("tier")} options={TIERS} />
          </div>
        </div>
        <div className="fg">
          <label className="required">Hometown / region</label>
          <input
            type="text"
            value={fields.hometown}
            onChange={(e) => set("hometown")(e.target.value)}
            placeholder="e.g. Kumasi, Ashanti"
          />
        </div>
      </>
    );
  if (role === "coach")
    return (
      <>
        <div className="form-row">
          <div className="fg">
            <label>Coaching licence</label>
            <Select value={fields.licence} onChange={set("licence")} options={LICENCES} />
          </div>
          <div className="fg">
            <label>Years experience</label>
            <input
              type="number"
              min="0"
              max="50"
              value={fields.exp}
              onChange={(e) => set("exp")(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>
        </div>
        <div className="fg">
          <label>Current club / academy</label>
          <input
            type="text"
            value={fields.club}
            onChange={(e) => set("club")(e.target.value)}
            placeholder="e.g. Accra Academy FC"
          />
        </div>
        <div className="fg">
          <label>Specialisation</label>
          <Select value={fields.spec} onChange={set("spec")} options={SPECS} />
        </div>
      </>
    );
  if (role === "scout")
    return (
      <>
        <div className="fg">
          <label className="required">Organisation / Agency</label>
          <input
            type="text"
            value={fields.org}
            onChange={(e) => set("org")(e.target.value)}
            placeholder="e.g. Independent / Agency name"
          />
        </div>
        <div className="form-row">
          <div className="fg">
            <label className="required">Years experience</label>
            <input
              type="number"
              min="0"
              max="50"
              value={fields.exp}
              onChange={(e) => set("exp")(e.target.value)}
              placeholder="e.g. 3"
            />
          </div>
          <div className="fg">
            <label className="required">Home region</label>
            <Select value={fields.region} onChange={set("region")} options={REGIONS} placeholder="Select region" />
          </div>
        </div>
      </>
    );
  return null;
}

const STEP2_COPY = {
  player: ["Player registration", "Tell us about yourself as a player"],
  coach: ["Coach registration", "Tell us about your coaching background"],
  scout: ["Scout registration", "Tell us about your scouting experience"],
};

export function SignupInfoScreen({ active }) {
  const selectedRole = useAppState((s) => s.signupRole);
  const roleKey = useAppState((s) => s.signupRoleKey);
  const [name, setName] = useState("");
  const [tab, setTab] = useState("email");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+233");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [roleFields, setRoleFields] = useState({});
  // The role (and Continue press) the current role fields were set up for.
  // Clicking a role card changes selectedRole straight away, but this form
  // only switches over when Continue bumps roleKey.
  const [fieldsFor, setFieldsFor] = useState({ key: null, role: "" });
  const [error, showError] = useTimedError(active);
  const role = fieldsFor.role;

  // Continuing from the role screen starts the role fields afresh; name,
  // contact and password are kept. Done during render so the new fields
  // never render without their defaults.
  if (fieldsFor.key !== roleKey) {
    setFieldsFor({ key: roleKey, role: selectedRole });
    setTab("email");
    setRoleFields({ ...(ROLE_FIELD_DEFAULTS[selectedRole] || {}) });
  }

  const setField = (key) => (value) => setRoleFields((f) => ({ ...f, [key]: value }));
  const submit = async () =>
    showError(await goStep3({ name, tab, email, countryCode, phone, password, roleFields }));
  useEnterKey(active, submit);

  const [title, sub] = STEP2_COPY[role] || ["Create your account", "Fill in your details"];

  return (
    <Screen id="screen-signup-info" active={active}>
      <AuthLogo />
      <StepRow steps={["done", "active", ""]} />
      <div className="auth-title">{title}</div>
      <div className="auth-sub">{sub}</div>
      <ErrorMessage message={error} box />
      <div className="fg">
        <label>Full name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          autoComplete="off"
        />
      </div>
      <div className="fg mb-sm">
        <label>Sign in with</label>
      </div>
      <TabToggle tab={tab} onTab={setTab} className="mb-sm" />
      {tab === "email" ? (
        <div className="fg">
          <label>Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="off"
          />
        </div>
      ) : (
        <div className="fg">
          <label>Phone number</label>
          <PhoneInput countryCode={countryCode} onCountryCode={setCountryCode} phone={phone} onPhone={setPhone} />
          <div className="whatsapp-note">
            <span className="wa-icon">
              <i className="ti ti-message"></i>
            </span>
            Your WhatsApp number works perfectly for sign-in.
          </div>
        </div>
      )}
      <div className="fg">
        <label>Password</label>
        <PasswordInput value={password} onChange={setPassword} placeholder="Create a password" />
        <StrengthMeter password={password} />
      </div>
      <RoleFields role={role} fields={roleFields} set={setField} />
      <button className="btn btn-primary btn-full" onClick={submit}>
        Continue →
      </button>
      <div className="auth-link">
        <a onClick={() => showScreen("screen-signup-role")}>← Back</a>
      </div>
    </Screen>
  );
}

const SECURITY_QUESTIONS = [
  "What was the name of your first football club?",
  "What is your mother's maiden name?",
  "What was the name of your primary school?",
  "What is the name of your hometown?",
  "What was your childhood nickname?",
  "Who was your first football hero?",
  "What was the name of your first coach?",
];

export function SignupSecurityScreen({ active }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, showError] = useTimedError(active);

  const submit = () => showError(goToConfirm({ question, answer }));
  useEnterKey(active, submit);

  return (
    <Screen id="screen-signup-security" active={active}>
      <AuthLogo name="plain" />
      <div className="auth-title">Security question</div>
      <div className="auth-sub">This will help you recover your account if you forget your password.</div>
      <div className="fg">
        <label className="required">Security question</label>
        <Select value={question} onChange={setQuestion} options={SECURITY_QUESTIONS} placeholder="Select a question" />
      </div>
      <div className="fg">
        <label className="required">Your answer</label>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Enter your answer"
          autoComplete="off"
        />
      </div>
      <ErrorMessage message={error} />
      <button className="btn btn-primary btn-full mt-sm" onClick={submit}>
        <i className="ti ti-arrow-right"></i> Continue
      </button>
      <button className="btn btn-outline btn-full mt-sm" onClick={() => showScreen("screen-signup-info")}>
        Back
      </button>
    </Screen>
  );
}

const SUMMARY_FIELDS = {
  player: (p) => [
    ["Role", "Player"],
    ["Position", p.pos || "-"],
    ["Tier", p.tier],
    ["Hometown", p.hometown || "-"],
  ],
  coach: (p) => [
    ["Role", "Coach"],
    ["Licence", p.licence],
    ["Club", p.club || "-"],
  ],
  scout: (p) => [
    ["Role", "Scout"],
    ["Organisation", p.org || "-"],
    ["Home region", p.region || "-"],
  ],
};

export function SignupConfirmScreen({ active }) {
  const summary = useAppState((s) => s.signupSummary);
  useEnterKey(active, completeSignup);

  const rows = summary
    ? [
        ["Name", summary.name],
        [summary.contactType === "phone" ? "Phone" : "Email", summary.displayContact],
        ...SUMMARY_FIELDS[summary.role](summary.profile),
      ]
    : [];

  return (
    <Screen id="screen-signup-confirm" active={active}>
      <AuthLogo />
      <StepRow steps={["done", "done", "active"]} />
      <div className="section-header">
        <div className="role-icon">{summary && <i className={`ti ${ROLE_ICONS[summary.role]}`}></i>}</div>
        <div className="auth-title">{summary ? `You're set, ${summary.name.split(" ")[0]}!` : "You're all set!"}</div>
        <div className="auth-sub">
          {summary ? `Your ${summary.role} account is ready.` : "Your account is ready."}
        </div>
      </div>
      <div className="confirm-box">
        {rows.map(([label, value], i) => (
          <span key={label}>
            {i > 0 && <br />}
            <strong>{label}:</strong> {value}
          </span>
        ))}
      </div>
      <button className="btn btn-primary btn-full" onClick={completeSignup}>
        Enter HappyFeet →
      </button>
      <button className="btn btn-outline btn-full mb-sm" onClick={() => showScreen("screen-signup-info")}>
        ← Edit my details
      </button>
    </Screen>
  );
}
