import { MiniCalendar } from "../shared/index.js";
import * as db from "../../../lib/db/index.js";

export default function CoachViewPlayerHealth({ playerName, logs, todayLog }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-md)", marginBottom: "var(--sp-lg)" }}>
        <button className="btn btn-outline btn-sm" onClick={() => window.HF_ROUTER.navTo("health")}>
          <i className="ti ti-arrow-left"></i> Back to squad wellness
        </button>
        <div
          style={{
            fontFamily: "var(--font)",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "var(--text)",
          }}
        >
          {playerName} Health log
        </div>
      </div>

      {todayLog ? (
        <>
          <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
            <div className="metric-card">
              <div className="metric-val" style={{ color: "var(--gold)" }}>{todayLog.energy}</div>
              <div className="metric-label">Energy</div>
            </div>
            <div className="metric-card">
              <div className="metric-val" style={{ color: "var(--faith)" }}>{todayLog.mood}</div>
              <div className="metric-label">Mood</div>
            </div>
            <div className="metric-card">
              <div className="metric-val" style={{ color: "var(--blue)" }}>{todayLog.sleep}</div>
              <div className="metric-label">Sleep</div>
            </div>
            <div className="metric-card">
              <div className="metric-val" style={{ color: "var(--red)" }}>{todayLog.soreness}</div>
              <div className="metric-label">Soreness</div>
            </div>
            <div className="metric-card">
              <div className="metric-val" style={{ color: "var(--green)" }}>{todayLog.hydration}</div>
              <div className="metric-label">Hydration</div>
            </div>
          </div>
          {todayLog.notes && (
            <div
              style={{
                padding: "10px 12px",
                background: "var(--bg2)",
                borderLeft: "2px solid var(--border)",
                fontSize: 13,
                color: "var(--text2)",
                marginBottom: "var(--sp-lg)",
              }}
            >
              <i className="ti ti-notes" style={{ marginRight: 6 }}></i>
              {todayLog.notes}
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            padding: "var(--sp-lg)",
            background: "var(--bg2)",
            borderLeft: "2px solid var(--border)",
            marginBottom: "var(--sp-lg)",
            fontSize: 13,
            color: "var(--text2)",
          }}
        >
          <i className="ti ti-info-circle" style={{ marginRight: 6 }}></i>
          {playerName} has not logged a check-in today.
        </div>
      )}

      {logs && logs.length > 0 && (
        <div className="card">
          <div className="card-title">
            <div className="card-dot"></div>Check-in calendar
          </div>
          <MiniCalendar
            logs={logs}
            colorFn={(date) => {
              const log = logs.find((l) => l.date === date);
              if (!log) return "var(--green)";
              const avg = Math.round(
                (log.energy + log.mood + log.sleep + (10 - log.soreness) + log.hydration) / 5,
              );
              return avg >= 8 ? "var(--green)" : avg >= 6 ? "var(--gold)" : "var(--red)";
            }}
          />
          <div style={{ display: "flex", gap: "var(--sp-md)", marginTop: "var(--sp-md)", fontSize: 11, color: "var(--text2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 10, height: 10, background: "var(--green)" }}></div>Ready
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 10, height: 10, background: "var(--gold)" }}></div>Monitor
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 10, height: 10, background: "var(--red)" }}></div>At risk
            </div>
          </div>
        </div>
      )}

      {logs && logs.length > 0 && (
        <div className="card">
          <div className="card-title">
            <div className="card-dot"></div>Wellness history
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th title="Energy"><i className="ti ti-bolt"></i></th>
                  <th title="Mood"><i className="ti ti-mood-smile"></i></th>
                  <th title="Sleep"><i className="ti ti-moon"></i></th>
                  <th title="Soreness"><i className="ti ti-activity"></i></th>
                  <th title="Hydration"><i className="ti ti-droplet"></i></th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => {
                  const isToday = l.date === db.localDate();
                  return (
                    <tr key={l.date} style={isToday ? { background: "rgba(196,154,10,.05)" } : {}}>
                      <td style={{ color: isToday ? "var(--gold)" : "var(--text2)", fontWeight: isToday ? 600 : 400 }}>
                        {isToday
                          ? "Today"
                          : new Date(l.date).toLocaleDateString("en-GB", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                      </td>
                      <td>{l.energy || "-"}</td>
                      <td>{l.mood || "-"}</td>
                      <td>{l.sleep || "-"}</td>
                      <td>{l.soreness || "-"}</td>
                      <td>{l.hydration || "-"}</td>
                      <td style={{ color: "var(--text2)", fontSize: 11 }}>{l.notes || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
