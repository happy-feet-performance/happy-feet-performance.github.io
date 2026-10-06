import { useState } from "react";
import { useAppState } from "../../lib/appStore.js";
import { enterApp, submitAgencyVerification, submitSquadVerification } from "../../lib/auth.js";
import { AuthLogo, ErrorMessage, Screen, StepRow, TagPicker, useEnterKey, useTimedError } from "./parts.jsx";

// Remounted (via key) after each signup so they pick up the new prefill.
export function SquadVerifyScreen({ active }) {
  const prefill = useAppState((s) => s.verifyPrefill.team);
  const [teamName, setTeamName] = useState(prefill);
  const [league, setLeague] = useState("");
  const [year, setYear] = useState("");
  const [ground, setGround] = useState("");
  const [error, showError] = useTimedError(active);

  const submit = async () => showError(await submitSquadVerification({ teamName, league, year, ground }));
  useEnterKey(active, submit);

  return (
    <Screen id="screen-squad-verify" active={active}>
      <AuthLogo />
      <StepRow steps={["done", "done", "done", "active"]} />
      <div className="auth-title">Register your squad</div>
      <div className="auth-sub">Tell us about your team so we can verify it</div>
      <ErrorMessage message={error} box />
      <div className="fg">
        <label>
          Team name <span className="label-note">(from your profile)</span>
        </label>
        <input
          type="text"
          className="input-disabled"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="e.g. Kumasi Academy FC"
        />
      </div>
      <div className="fg">
        <label className="required">League / division</label>
        <input
          type="text"
          value={league}
          onChange={(e) => setLeague(e.target.value)}
          placeholder="e.g. Ghana Premier League"
        />
      </div>
      <div className="form-row">
        <div className="fg">
          <label>Founding year</label>
          <input type="number" min="1600" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2005" />
        </div>
        <div className="fg">
          <label>Home ground</label>
          <input
            type="text"
            value={ground}
            onChange={(e) => setGround(e.target.value)}
            placeholder="e.g. Baba Yara Stadium"
          />
        </div>
      </div>
      <button className="btn btn-primary btn-full" onClick={submit}>
        Submit for verification →
      </button>
      <div className="auth-link">
        <a onClick={enterApp}>Skip Verification and Enter HappyFeet →</a>
      </div>
    </Screen>
  );
}

function PendingScreen({ id, active, kind, canDo, onEnterKey }) {
  useEnterKey(active && onEnterKey, enterApp);
  return (
    <Screen id={id} active={active} center>
      <AuthLogo />
      <i className="ti ti-clock auth-icon-xl"></i>
      <div className="auth-title">Verification pending</div>
      <div className="auth-sub mb-xl">
        {kind === "squad"
          ? "Your squad registration has been submitted. Our team will review and verify your squad within 24-48 hours. You'll have limited access until then."
          : "Your agency registration has been submitted. Our team will review and verify your agency within 24-48 hours."}
      </div>
      <div className="auth-panel">
        <strong className="text-primary">While you wait you can:</strong>
        <br />
        <br />
        {canDo.map((item) => (
          <span key={item}>
            · {item}
            <br />
          </span>
        ))}
      </div>
      <button className="btn btn-primary btn-full" onClick={enterApp}>
        Enter HappyFeet →
      </button>
    </Screen>
  );
}

export const SquadPendingScreen = ({ active }) => (
  <PendingScreen
    id="screen-squad-pending"
    active={active}
    kind="squad"
    onEnterKey
    canDo={["View your profile", "Browse Find my team", "Access Faith & devotion", "Send and receive messages"]}
  />
);

export const AgencyPendingScreen = ({ active }) => (
  <PendingScreen
    id="screen-agency-pending"
    active={active}
    kind="agency"
    canDo={["View your profile", "Browse Find my team", "Access messages"]}
  />
);

const AGENCY_REGIONS = [
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
  "All Africa",
];
const AGENCY_LEAGUES = [
  "Ghana Premier League",
  "Nigeria Premier League",
  "CAF Champions League",
  "MLS",
  "USL",
  "Bundesliga",
  "Premier League",
  "La Liga",
  "Serie A",
  "Ligue 1",
  "Eredivisie",
  "Saudi Pro League",
  "UAE League",
  "Qatar Stars League",
  "Europe",
  "USA",
  "Gulf",
];

export function AgencyVerifyScreen({ active }) {
  const agencyName = useAppState((s) => s.verifyPrefill.agency);
  const [regionsCovered, setRegions] = useState([]);
  const [targetLeagues, setLeagues] = useState([]);
  const [website, setWebsite] = useState("");
  const [error, showError] = useTimedError(active);

  const submit = async () =>
    showError(await submitAgencyVerification({ agencyName, website, regionsCovered, targetLeagues }));

  return (
    <Screen id="screen-agency-verify" active={active}>
      <AuthLogo />
      <StepRow steps={["done", "done", "done", "active"]} />
      <div className="auth-title">Register your agency</div>
      <div className="auth-sub">Tell us about your organisation so we can verify it</div>
      <ErrorMessage message={error} box />
      <div className="fg">
        <label>
          Organisation / agency <span className="label-note">(from your profile)</span>
        </label>
        <input type="text" className="input-disabled" value={agencyName} readOnly />
      </div>
      <div className="fg">
        <label className="required">Regions you cover</label>
        <TagPicker
          options={AGENCY_REGIONS}
          selected={regionsCovered}
          onChange={setRegions}
          buttonClass="region-tag"
          rowClass="region-group region-button-row"
        />
      </div>
      <div className="fg">
        <label className="required">Target leagues / destinations</label>
        <TagPicker options={AGENCY_LEAGUES} selected={targetLeagues} onChange={setLeagues} buttonClass="league-tag" />
      </div>
      <div className="fg">
        <label className="required">Website</label>
        <input
          type="text"
          className="auth-input"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="e.g. https://youragency.com"
        />
      </div>
      <button className="btn btn-primary btn-full" onClick={submit}>
        Submit for verification →
      </button>
      <div className="auth-link">
        <a onClick={enterApp}>Skip Verification and Enter HappyFeet →</a>
      </div>
    </Screen>
  );
}
