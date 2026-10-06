import { Fragment } from "react";
import { MiniCalendar, MiniChart } from "../shared/index.js";
import * as db from "../../../lib/db/index.js";

function RatingSlider({ label, initial }) {
  const key = label.toLowerCase();
  return (
    <div style={{ padding: "var(--sp-md)", background: "var(--bg2)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span
          style={{
            fontFamily: "var(--font)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text2)",
          }}
        >
          {label}
        </span>
        <span id={`cv-${key}`} style={{ fontFamily: "var(--font)", fontSize: 18, fontWeight: 700, color: "var(--gold)" }}>
          {initial}
        </span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        defaultValue={initial}
        step="1"
        style={{ width: "100%", accentColor: "var(--gold)" }}
        onInput={(e) => {
          const el = document.getElementById(`cv-${key}`);
          if (el) el.textContent = e.target.value;
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text3)", marginTop: 4 }}>
        <span>1</span>
        <span>10</span>
      </div>
    </div>
  );
}

export default function CoachTrackPlayer({ playerId, playerName, sessions, todayRating, playerTodayType }) {
  const latest = sessions?.[0];
  const trendData = sessions ? [...sessions].reverse().map((s) => s.overall) : [];
  let lastDate = null;

  const sliderInitial = (field) =>
    todayRating ? Math.round((todayRating[field] || 70) / 10) : 7;

  const typeSelectValue = todayRating?.session_type || playerTodayType || "";

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-md)", marginBottom: "var(--sp-lg)" }}>
        <button className="btn btn-outline btn-sm" onClick={() => window.HF_ROUTER.navTo("squad")}>
          <i className="ti ti-arrow-left"></i> Back to squad
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
          {playerName}
        </div>
      </div>

      <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--gold)" }}>
            {latest ? latest.overall + "/100" : "-"}
          </div>
          <div className="metric-label">Last rating</div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--green)" }}>{sessions?.length || 0}</div>
          <div className="metric-label">Sessions</div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--blue)" }}>
            {sessions?.length > 1
              ? sessions[0].overall > sessions[1].overall
                ? "↑"
                : sessions[0].overall < sessions[1].overall
                  ? "↓"
                  : "→"
              : "-"}
          </div>
          <div className="metric-label">Trend</div>
        </div>
      </div>

      {trendData.length > 0 && (
        <div className="card">
          <div className="card-title">
            <div className="card-dot"></div>Rating trend
          </div>
          <MiniChart values={trendData} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text2)", marginTop: 6 }}>
            <span>Oldest</span>
            <span>Latest</span>
          </div>
        </div>
      )}

      <div className="card">
        <div
          style={{
            background: "#0f0f0d",
            padding: "var(--sp-lg)",
            margin: "calc(var(--sp-lg) * -1) calc(var(--sp-lg) * -1) var(--sp-lg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,.4)",
                marginBottom: 2,
              }}
            >
              Session rating
            </div>
            <div style={{ fontFamily: "var(--font)", fontSize: 18, fontWeight: 700, color: "#fff" }}>{playerName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>
          {todayRating && (
            <span
              style={{
                fontFamily: "var(--font)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "3px 8px",
                background: "rgba(196,154,10,.2)",
                color: "var(--gold)",
              }}
            >
              Editing today
            </span>
          )}
        </div>

        <div className="fg">
          <label className="required">Session type</label>
          <select
            id="tr-type"
            defaultValue={typeSelectValue}
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
            <option value="">Select type</option>
            <option>Technical</option>
            <option>Tactical</option>
            <option>Physical</option>
            <option>Recovery</option>
            <option>Match</option>
          </select>
          {playerTodayType && (
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
              <i className="ti ti-info-circle" style={{ marginRight: 4 }}></i>
              Player planned: <strong style={{ color: "var(--gold)" }}>{playerTodayType}</strong> today
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-md)", margin: "var(--sp-md) 0" }}>
          {["Speed", "Technical", "Tactical", "Physical"].map((l) => (
            <RatingSlider key={l} label={l} initial={sliderInitial(l.toLowerCase())} />
          ))}
        </div>

        <div className="fg">
          <label>Notes</label>
          <input
            type="text"
            id="tr-notes"
            placeholder="e.g. Strong first touch, work on weak foot"
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

        <button
          className="btn btn-primary"
          style={{ marginTop: "var(--sp-md)", width: "100%" }}
          onClick={() => window.HF_COACH.logSessionRating(playerId, playerName.replace(/'/g, "\\'"))}
        >
          <i className="ti ti-circle-check"></i> {todayRating ? "Update rating" : "Save rating"}
        </button>
      </div>

      {sessions && sessions.length > 0 && (
        <div className="card">
          <div className="card-title">
            <div className="card-dot"></div>Session calendar
          </div>
          <MiniCalendar logs={sessions} />
          <div style={{ display: "flex", gap: "var(--sp-md)", marginTop: "var(--sp-md)", fontSize: 11, color: "var(--text2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 10, height: 10, background: "var(--blue)" }}></div>Session logged
            </div>
          </div>
        </div>
      )}

      {sessions && sessions.length > 0 && (
        <div className="card">
          <div className="card-title">
            <div className="card-dot"></div>Session history
          </div>
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
                </tr>
              </thead>
              <tbody>
                {sessions.map((r) => {
                  const dateStr = new Date(r.created_at).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });
                  const isToday = new Date(r.created_at).toISOString().split("T")[0] === db.localDate();
                  const showHeader = dateStr !== lastDate;
                  lastDate = dateStr;
                  return (
                    <Fragment key={r.id}>
                      {showHeader && (
                        <tr>
                          <td
                            colSpan={7}
                            style={{
                              fontFamily: "var(--font)",
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: isToday ? "var(--gold)" : "var(--text3)",
                              padding: "8px 0 4px",
                              borderBottom: "0.5px solid var(--border)",
                            }}
                          >
                            {isToday ? "Today: " : ""}
                            {dateStr}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td style={{ color: isToday ? "var(--gold)" : "var(--text2)" }}>
                          {isToday
                            ? "Today"
                            : new Date(r.created_at).toLocaleDateString("en-US", {
                                month: "2-digit",
                                day: "2-digit",
                                year: "numeric",
                              })}
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
                      </tr>
                    </Fragment>
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
