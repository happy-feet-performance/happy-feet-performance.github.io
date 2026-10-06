import { useState } from "react";
import { submitAgencyResubmission } from "../../../lib/scout.js";
import { navTo } from "../../../lib/router.js";
import { TagPicker } from "../shared/index.js";
import { fieldStyle } from "../common/styles.js";

const REGIONS = ["Ghana", "Nigeria", "Senegal", "Ivory Coast", "Cameroon", "West Africa", "All Africa"];
const LEAGUES = ["Ghana Premier League", "MLS", "Premier League", "Europe", "Gulf"];

const tagRow = { display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" };
const tagBox = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  padding: 10,
  background: "var(--bg2)",
  border: "0.5px solid var(--border)",
  minHeight: 44,
};

// Opened from the dashboard when an agency is unregistered or rejected.
export default function ResubmitAgency({ session }) {
  const [agencyName, setAgencyName] = useState(session.profile?.org || "");
  const [regionsCovered, setRegions] = useState([]);
  const [targetLeagues, setLeagues] = useState([]);

  return (
    <div className="auth-card" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="auth-title">Resubmit agency registration</div>
      <div className="auth-sub">Update your agency details for verification</div>
      <div className="fg">
        <label className="required">Organisation / agency</label>
        <input
          type="text"
          value={agencyName}
          onChange={(e) => setAgencyName(e.target.value)}
          placeholder="e.g. HappyFeet Scouting"
          style={fieldStyle}
        />
      </div>
      <div className="fg">
        <label className="required">Regions you cover</label>
        <TagPicker
          options={REGIONS}
          selected={regionsCovered}
          onChange={setRegions}
          buttonClass="region-tag"
          rowClass=""
          groupStyle={tagBox}
          rowStyle={tagRow}
        />
      </div>
      <div className="fg">
        <label className="required">Target leagues / destinations</label>
        <TagPicker
          options={LEAGUES}
          selected={targetLeagues}
          onChange={setLeagues}
          buttonClass="region-tag league-tag"
          rowClass=""
          groupStyle={tagBox}
          rowStyle={tagRow}
        />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: "var(--sp-md)" }}>
        <button
          className="btn btn-primary"
          onClick={() => submitAgencyResubmission({ agencyName, regionsCovered, targetLeagues })}
        >
          <i className="ti ti-send"></i> Submit for verification
        </button>
        <button className="btn btn-outline" onClick={() => navTo("dashboard")}>
          Cancel
        </button>
      </div>
    </div>
  );
}
