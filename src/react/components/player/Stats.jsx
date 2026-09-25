import { timeAgo } from "../../../lib/utils.js";
import { MiniCalendar, MiniChart } from "../shared/index.js";

export default function PlayerStats({ session: s, overall, sessions, hasStats, trendData }) {
  return (
    <>
      <div className="card">
        <div className="card-title" style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
            <div className="card-dot"></div>Performance overview
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text3)",
              fontFamily: "var(--font)",
              textTransform: "none",
              letterSpacing: 0,
              fontWeight: 400,
              paddingLeft: "calc(var(--sp-sm) + 8px)",
            }}
          >
            Ratings are based on sessions logged by your coach
          </div>
        </div>
        <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          <div className="metric-card">
            <div className="metric-val" style={{ color: "var(--gold)" }}>
              {overall !== null ? overall + "%" : "-"}
            </div>
            <div className="metric-label">Overall</div>
          </div>
          <div className="metric-card">
            <div className="metric-val" style={{ color: "var(--green)" }}>
              {sessions?.length || 0}
            </div>
            <div className="metric-label">Sessions</div>
          </div>
          <div className="metric-card">
            <div className="metric-val" style={{ color: "var(--blue)" }}>
              {hasStats ? sessions[0].overall + "/100" : "-"}
            </div>
            <div className="metric-label">Last rating</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <div className="card-dot"></div>Rating trend
        </div>
        {!hasStats ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text2)" }}>
            <i
              className="ti ti-chart-line"
              style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--text3)" }}
            ></i>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
              No data yet
            </div>
            <div style={{ fontSize: 13 }}>
              Your rating trend will appear once your coach logs session data.
            </div>
          </div>
        ) : (
          <>
            <MiniChart values={trendData} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "var(--text2)",
                marginTop: 6,
              }}
            >
              <span>Oldest</span>
              <span>Latest</span>
            </div>
          </>
        )}
      </div>

      {hasStats && (
        <div className="card">
          <div className="card-title">
            <div className="card-dot"></div>Session calendar
          </div>
          <MiniCalendar logs={sessions} />
          <div style={{ display: "flex", gap: "var(--sp-md)", marginTop: "var(--sp-md)", fontSize: 11, color: "var(--text2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 10, height: 10, background: "var(--blue)" }}></div>Check-in logged
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">
          <div className="card-dot"></div>Session history
        </div>
        {!hasStats ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text2)" }}>
            <i
              className="ti ti-history"
              style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--text3)" }}
            ></i>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
              No sessions yet
            </div>
            <div style={{ fontSize: 13 }}>
              Session history will appear once your coach starts logging data.
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Overall</th>
                  <th>Speed</th>
                  <th>Technical</th>
                  <th>Tactical</th>
                  <th>Physical</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((r) => {
                  const isToday = r.created_at?.split("T")[0] === window.HF_DB.localDate();
                  return (
                    <tr key={r.id} style={isToday ? { background: "rgba(196,154,10,.05)" } : undefined}>
                      <td
                        style={{
                          color: isToday ? "var(--gold)" : "var(--text2)",
                          fontWeight: isToday ? 600 : 400,
                        }}
                      >
                        {isToday ? "Today" : timeAgo(r.created_at)}
                      </td>
                      <td>{r.session_type}</td>
                      <td
                        style={{
                          fontWeight: 700,
                          color: r.overall >= 80 ? "var(--green)" : r.overall >= 65 ? "var(--gold)" : "var(--red)",
                        }}
                      >
                        {r.overall}
                      </td>
                      <td>{r.speed}</td>
                      <td>{r.technical}</td>
                      <td>{r.tactical}</td>
                      <td>{r.physical}</td>
                      <td>{r.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
