import { useState } from "react";
import { MiniCalendar } from "../shared/index.js";
import * as db from "../../../lib/db/index.js";

const METRICS = [
  { id: "energy", label: "Energy", icon: "ti-bolt", desc: "Physical energy level" },
  { id: "mood", label: "Mood", icon: "ti-mood-smile", desc: "Mental state" },
  { id: "sleep", label: "Sleep", icon: "ti-moon", desc: "Quality of rest" },
  { id: "soreness", label: "Soreness", icon: "ti-activity", desc: "Muscle soreness" },
  {
    id: "hydration",
    label: "Hydration",
    icon: "ti-droplet",
    desc: "Litres consumed today",
    type: "number",
    step: 0.1,
    min: 0,
    max: 10,
    placeholder: "e.g. 2.5",
  },
  { id: "nutrition", label: "Nutrition", icon: "ti-salad", desc: "How healthy was your food today?" },
];

export default function PlayerHealth({ session: s, todayLog, logs, onLogCheckin }) {
  const [view, setView] = useState(todayLog ? "card" : "slider");
  const [values, setValues] = useState(() => ({
    ...Object.fromEntries(METRICS.filter((m) => m.id !== "hydration").map((m) => [m.id, todayLog?.[m.id] || 5])),
    hydration: todayLog?.hydration ?? "",
    notes: todayLog?.notes || "",
  }));
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <div className="card">
        <div className="card-title" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
            <div className="card-dot"></div>Daily wellness check
          </div>
          <span style={{ fontSize: 11, color: "var(--text3)" }}>{today}</span>
        </div>

        {view === "card" && todayLog && (
          <div id="health-logged-view">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-lg)" }}>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>
                <i className="ti ti-circle-check" style={{ color: "var(--green)", marginRight: 6 }}></i>
                Logged today
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setView("slider")}>
                <i className="ti ti-edit"></i> Update
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "var(--sp-sm)" }}>
              {METRICS.map((m) => (
                <div key={m.id} style={{ padding: "var(--sp-md)", background: "var(--bg2)", marginBottom: "var(--sp-sm)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          background: "var(--bg)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <i className={`ti ${m.icon}`} style={{ fontSize: 16, color: "var(--text2)" }}></i>
                      </div>
                      <div>
                        <div
                          style={{
                            fontFamily: "var(--font)",
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: "var(--text2)",
                          }}
                        >
                          {m.label}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text3)" }}>{m.desc}</div>
                      </div>
                    </div>
                    <span style={{ fontFamily: "var(--font)", fontSize: 28, fontWeight: 700, color: "var(--gold)" }}>
                      {m.id === "hydration" ? (todayLog?.[m.id] || 0) + "L" : todayLog?.[m.id] || 5}
                    </span>
                  </div>
                  {m.id === "hydration" ? (
                    <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>
                      {todayLog?.[m.id] || 0}L consumed
                    </div>
                  ) : (
                    <>
                      <div style={{ height: 6, background: "var(--border)", marginTop: 8 }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${((todayLog?.[m.id] || 5) / 10) * 100}%`,
                            background: "var(--gold)",
                          }}
                        ></div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text3)", marginTop: 4 }}>
                        <span>1: Low</span>
                        <span>10: High</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            {todayLog.notes && (
              <div
                style={{
                  padding: "10px 12px",
                  background: "var(--bg2)",
                  borderLeft: "2px solid var(--border)",
                  fontSize: 13,
                  color: "var(--text2)",
                  marginTop: "var(--sp-md)",
                }}
              >
                <i className="ti ti-notes" style={{ marginRight: 6 }}></i>
                {todayLog.notes}
              </div>
            )}
          </div>
        )}

        {view === "slider" && (
          <div id="health-sliders">
            {METRICS.map((m) => (
              <div key={m.id} style={{ marginBottom: "var(--sp-md)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <i className={`ti ${m.icon}`} style={{ color: "var(--text2)" }}></i>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{m.label}</span>
                  </div>
                  {m.id !== "hydration" && (
                    <span style={{ fontFamily: "var(--font)", fontSize: 14, fontWeight: 700, color: "var(--gold)" }}>
                      {values[m.id]}
                    </span>
                  )}
                </div>
                {m.type === "number" ? (
                  <>
                    <input
                      type="number"
                      min={m.min || 0}
                      max={m.max || 10}
                      step={m.step || 1}
                      value={values[m.id]}
                      onChange={set(m.id)}
                      placeholder={m.placeholder || ""}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "var(--bg2)",
                        border: "0.5px solid var(--border)",
                        color: "var(--text)",
                        fontSize: 14,
                        outline: "none",
                        fontFamily: "var(--font)",
                      }}
                    />
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>Litres</div>
                  </>
                ) : (
                  <>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={values[m.id]}
                      onChange={set(m.id)}
                      step={1}
                      style={{ width: "100%", accentColor: "var(--gold)" }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text3)", marginTop: 4 }}>
                      <span>1: Low</span>
                      <span>10: High</span>
                    </div>
                  </>
                )}
              </div>
            ))}
            <div className="fg">
              <label>Notes</label>
              <input
                type="text"
                value={values.notes}
                onChange={set("notes")}
                placeholder="Any injuries, illness, or notes..."
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
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                className="btn btn-primary"
                onClick={() =>
                  onLogCheckin({
                    ...Object.fromEntries(METRICS.filter((m) => m.id !== "hydration").map((m) => [m.id, parseInt(values[m.id])])),
                    hydration: values.hydration,
                    notes: values.notes,
                  })
                }
              >
                <i className="ti ti-circle-check"></i> {todayLog ? "Update check-in" : "Log check-in"}
              </button>
              {todayLog && (
                <button className="btn btn-outline" onClick={() => setView("card")}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {logs && logs.length > 0 && (
        <>
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

          <div className="card">
            <div className="card-title">
              <div className="card-dot"></div>Recent wellness history
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
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
                    <th title="Nutrition">
                      <i className="ti ti-salad"></i>
                    </th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l, i) => {
                    const isToday = l.date === db.localDate();
                    return (
                      <tr key={l.id || i} style={isToday ? { background: "rgba(196,154,10,.05)" } : undefined}>
                        <td style={{ color: isToday ? "var(--gold)" : "var(--text2)", fontWeight: isToday ? 600 : 400 }}>
                          {isToday
                            ? "Today"
                            : new Date(l.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                        </td>
                        <td>{l.energy || "-"}</td>
                        <td>{l.mood || "-"}</td>
                        <td>{l.sleep || "-"}</td>
                        <td>{l.soreness || "-"}</td>
                        <td>{l.hydration != null ? l.hydration + "L" : "-"}</td>
                        <td>{l.nutrition || "-"}</td>
                        <td style={{ color: "var(--text2)", fontSize: 11 }}>
                          {l.notes && l.notes !== "null" ? l.notes : "None"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
