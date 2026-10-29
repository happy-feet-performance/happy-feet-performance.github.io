import { viewPlayerHealth } from "../../../lib/coach.js";

export default function CoachHealth({ playerHealth }) {
  if (!playerHealth || playerHealth.length === 0) {
    return (
      <div className="card">
        <div style={{ textAlign: "center", padding: 32, color: "var(--text2)" }}>
          <i
            className="ti ti-stethoscope"
            style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--text3)" }}
          ></i>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
            No players to monitor yet
          </div>
          <div style={{ fontSize: 13, marginBottom: 16 }}>
            Invite players to your squad to start tracking their health.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="card-title" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
            <div className="card-dot"></div>Squad wellness
          </div>
          <span style={{ fontSize: 11, color: "var(--text3)" }}>
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Player</th>
                <th title="Energy">
                  <i className="ti ti-bolt"></i>
                </th>
                <th title="Mood">
                  <i className="ti ti-mood-smile"></i>
                </th>
                <th title="Sleep">
                  <i className="ti ti-moon"></i>
                </th>
                <th title="Soreness">
                  <i className="ti ti-activity"></i>
                </th>
                <th title="Hydration">
                  <i className="ti ti-droplet"></i>
                </th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {playerHealth.map((ph) => {
                const name = ph.player?.name || "Unknown";
                const log = ph.todayLog;
                const avg = log
                  ? Math.round(
                      (log.energy + log.mood + log.sleep + (10 - log.soreness) + log.hydration) / 5,
                    )
                  : null;
                const statusColor = !log
                  ? "var(--text3)"
                  : avg >= 8
                    ? "var(--green)"
                    : avg >= 6
                      ? "var(--gold)"
                      : "var(--red)";
                const statusLabel = !log ? "No check-in" : avg >= 8 ? "Ready" : avg >= 6 ? "Monitor" : "At risk";

                return (
                  <tr
                    key={ph.player_id}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      viewPlayerHealth(ph.player_id, name.replace(/'/g, "\\'"))
                    }
                  >
                    <td style={{ fontWeight: 600 }}>{name}</td>
                    <td>{log?.energy || "-"}</td>
                    <td>{log?.mood || "-"}</td>
                    <td>{log?.sleep || "-"}</td>
                    <td>{log?.soreness || "-"}</td>
                    <td>{log?.hydration || "-"}</td>
                    <td>
                      <span
                        style={{
                          fontFamily: "var(--font)",
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          padding: "2px 6px",
                          color: statusColor,
                          background: `${statusColor}22`,
                        }}
                      >
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <div className="card-dot"></div>Wellness key
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5,1fr)",
            gap: "var(--sp-sm)",
            marginBottom: "var(--sp-lg)",
          }}
        >
          {[
            ["ti-bolt", "Energy"],
            ["ti-mood-smile", "Mood"],
            ["ti-moon", "Sleep"],
            ["ti-activity", "Soreness"],
            ["ti-droplet", "Hydration"],
          ].map(([icon, label]) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "var(--sp-md)",
                background: "var(--bg2)",
                borderTop: "2px solid var(--border)",
              }}
            >
              <i className={`ti ${icon}`} style={{ fontSize: 20, color: "var(--text)" }}></i>
              <div
                style={{
                  fontFamily: "var(--font)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text2)",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "var(--sp-md)", flexWrap: "wrap" }}>
          {[
            ["var(--green)", "Ready", "avg 8+"],
            ["var(--gold)", "Monitor", "avg 6-7"],
            ["var(--red)", "At risk", "avg below 6"],
          ].map(([color, label, desc]) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: `${color}22`,
                borderLeft: `3px solid ${color}`,
                flex: 1,
                minWidth: 100,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "var(--font)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color,
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "var(--sp-sm)", fontSize: 11, color: "var(--text3)" }}>
          <i className="ti ti-info-circle" style={{ marginRight: 4 }}></i>
          Note: soreness score is inverted (lower soreness = better readiness).
        </div>
      </div>
    </>
  );
}
