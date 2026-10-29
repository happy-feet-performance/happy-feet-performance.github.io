// Scouting report screens, opened from Saved prospects: generate a report
// from the scout's observations, view it, and share it with a coach.
import { useRef, useState } from "react";
import { initials, timeAgo } from "../../../lib/utils.js";
import { navTo } from "../../../lib/router.js";
import {
  downloadReport,
  downloadReportPDF,
  generateReport,
  searchCoaches,
  sendReportMessage,
  shareReportViaMessage,
  submitGenerateReport,
  viewReport,
} from "../../../lib/scout.js";
import { fieldStyle } from "../common/styles.js";

const titleStyle = {
  fontFamily: "var(--font)",
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--text)",
};

function BackToProspects({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-md)" }}>
      <button className="btn btn-outline btn-sm" onClick={() => navTo("prospects")}>
        <i className="ti ti-arrow-left"></i> Back
      </button>
      <div style={titleStyle}>{children}</div>
    </div>
  );
}

function InfoCell({ label, value, gold }) {
  return (
    <div className="info-cell">
      <div className="info-label">{label}</div>
      <div className="info-val" style={gold ? { color: "var(--gold)" } : undefined}>
        {value}
      </div>
    </div>
  );
}

const OBSERVATIONS = [
  ["strengths", "Key strengths observed", "e.g. Exceptional first touch, strong aerial ability, natural leader...", 3],
  ["weaknesses", "Areas needing development", "e.g. Weak foot needs work, positional awareness in defensive phase...", 3],
  ["context", "Additional context", "e.g. Observed in 3 matches, plays in Ghana Premier League youth setup...", 2],
];

// `inputs` comes from loadReportInputs().
export function GenerateReport({ scoutId, playerId, playerName, inputs }) {
  const { profile: p, sessions, latest, avgOverall, prospect } = inputs;
  const [obs, setObs] = useState({ strengths: "", weaknesses: "", context: "", targets: "" });
  const [generating, setGenerating] = useState(false);
  const field = (key) => ({ value: obs[key], onChange: (e) => setObs((o) => ({ ...o, [key]: e.target.value })) });

  const generate = async () => {
    setGenerating(true);
    const trimmed = Object.fromEntries(Object.entries(obs).map(([k, v]) => [k, v.trim()]));
    // on success the report view replaces this screen
    if (!(await submitGenerateReport(scoutId, playerId, playerName, trimmed))) setGenerating(false);
  };

  return (
    <>
      <div style={{ marginBottom: "var(--sp-lg)" }}>
        <BackToProspects>Generate scouting report for {playerName}</BackToProspects>
      </div>

      {prospect?.report && (
        <div
          style={{
            padding: "10px 12px",
            background: "rgba(26,122,46,.06)",
            borderLeft: "2px solid var(--green)",
            fontSize: 13,
            color: "var(--text2)",
            marginBottom: "var(--sp-lg)",
          }}
        >
          <i className="ti ti-circle-check" style={{ color: "var(--green)", marginRight: 6 }}></i>
          Report already generated {timeAgo(prospect.report_generated_at)}.{" "}
          <span
            onClick={() => viewReport(scoutId, playerId, playerName)}
            style={{ color: "var(--gold)", cursor: "pointer", textDecoration: "underline" }}
          >
            View existing report
          </span>
        </div>
      )}

      <div className="card">
        <div className="card-title">
          <div className="card-dot"></div>Player data
        </div>
        <div className="info-grid">
          <InfoCell label="Name" value={playerName} />
          <InfoCell label="Position" value={p.pos || "-"} />
          <InfoCell label="Age tier" value={p.tier || "-"} />
          <InfoCell label="Hometown" value={p.hometown || "-"} />
          <InfoCell label="Club status" value={p.club || "Unattached"} />
          <InfoCell label="Sessions logged" value={sessions.length} />
          {avgOverall && <InfoCell label="Avg overall" value={`${avgOverall}/100`} gold />}
          {latest && (
            <>
              <InfoCell label="Latest speed" value={`${latest.speed}/100`} />
              <InfoCell label="Latest technical" value={`${latest.technical}/100`} />
              <InfoCell label="Latest tactical" value={`${latest.tactical}/100`} />
              <InfoCell label="Latest physical" value={`${latest.physical}/100`} />
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <div className="card-dot"></div>Scout observations
        </div>
        {OBSERVATIONS.map(([key, label, placeholder, rows]) => (
          <div key={key} className="fg">
            <label>{label}</label>
            <textarea rows={rows} placeholder={placeholder} style={{ ...fieldStyle, resize: "vertical" }} {...field(key)}></textarea>
          </div>
        ))}
        <div className="fg">
          <label>Target clubs / leagues</label>
          <input
            type="text"
            placeholder="e.g. MLS academies, Bundesliga youth teams..."
            style={fieldStyle}
            {...field("targets")}
          />
        </div>
        <button className="btn btn-primary" disabled={generating} onClick={generate}>
          {generating ? (
            <>
              <i className="ti ti-loader"></i> Generating...
            </>
          ) : (
            <>
              <i className="ti ti-sparkles"></i> Generate AI report
            </>
          )}
        </button>
      </div>
    </>
  );
}

// `data` is the prospect row from getProspectReport (has .report).
export function ReportView({ scoutId, playerId, playerName, data }) {
  const report = data?.report;
  if (!report)
    return (
      <>
        <BackToProspects>Scouting report for {playerName}</BackToProspects>
        <div className="card" style={{ marginTop: "var(--sp-lg)", fontSize: 13, color: "var(--text2)" }}>
          No report found. Generate one first.
        </div>
      </>
    );

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--sp-lg)",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <BackToProspects>Scouting report for {playerName}</BackToProspects>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => generateReport(scoutId, playerId, playerName)}>
            <i className="ti ti-refresh"></i> Regenerate
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => downloadReport(playerName, report)}>
            <i className="ti ti-markdown"></i> Download .md
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => downloadReportPDF(playerName, report)}>
            <i className="ti ti-file-type-pdf"></i> Download PDF
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => shareReportViaMessage(scoutId, playerId, playerName)}>
            <i className="ti ti-send"></i> Share with coach
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-lg)" }}>
          <div>
            <div style={{ ...titleStyle, fontSize: 18 }}>{playerName}</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
              {report.position || "-"} · {report.tier || "-"} · {report.generatedBy}
            </div>
          </div>
          {report.avgOverall && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font)", fontSize: 36, fontWeight: 700, color: "var(--gold)" }}>
                {report.avgOverall}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text3)",
                  fontFamily: "var(--font)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Avg overall
              </div>
            </div>
          )}
        </div>
        <div
          style={{
            whiteSpace: "pre-line",
            fontSize: 13,
            color: "var(--text)",
            lineHeight: 1.8,
            background: "var(--bg2)",
            padding: "var(--sp-lg)",
          }}
        >
          {report.text}
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: "var(--sp-md)" }}>
          Generated {timeAgo(data.report_generated_at)}
        </div>
      </div>
    </>
  );
}

export function ShareReport({ scoutId, playerId, playerName }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [note, setNote] = useState("");
  const latestQuery = useRef("");

  const search = async (value) => {
    setQuery(value);
    latestQuery.current = value;
    if (value.length < 2) return setResults(null);
    const coaches = await searchCoaches(value);
    if (latestQuery.current === value) setResults(coaches);
  };

  return (
    <div className="card">
      <div className="card-title">
        <div className="card-dot"></div>Share report: {playerName}
      </div>
      <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: "var(--sp-lg)" }}>
        Send this scouting report to a coach. Search for a coach by name or email.
      </div>
      <div className="fg">
        <label className="required">Send to</label>
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder="Search by name or email..."
          style={fieldStyle}
        />
        {results && (
          <div style={{ marginTop: 4 }}>
            {results.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text2)", padding: 8 }}>No coaches found.</div>
            ) : (
              results.map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--sp-md)",
                    padding: 10,
                    background: "var(--bg)",
                    border: "0.5px solid var(--border)",
                    marginBottom: 4,
                    cursor: "pointer",
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setRecipient(u);
                    setQuery("");
                    setResults(null);
                  }}
                >
                  <div className="avatar avatar-sm" style={{ background: "var(--gold)" }}>
                    {initials(u.name)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>Coach</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {recipient && (
          <div
            style={{
              display: "flex",
              marginTop: 8,
              padding: "8px 12px",
              background: "rgba(196,154,10,.08)",
              borderLeft: "2px solid var(--gold)",
              fontSize: 13,
              color: "var(--text)",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{recipient.name}</span>
            <span onClick={() => setRecipient(null)} style={{ cursor: "pointer", color: "var(--text3)" }}>
              <i className="ti ti-x"></i>
            </span>
          </div>
        )}
      </div>
      <div className="fg">
        <label>Additional message</label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note to accompany the report..."
          style={{ ...fieldStyle, resize: "vertical" }}
        ></textarea>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn btn-primary"
          onClick={() => sendReportMessage(scoutId, playerId, playerName, recipient?.id, note)}
        >
          <i className="ti ti-send"></i> Send report
        </button>
        <button className="btn btn-outline" onClick={() => viewReport(scoutId, playerId, playerName)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
