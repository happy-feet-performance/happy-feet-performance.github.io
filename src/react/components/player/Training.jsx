import { useState } from "react";
import { getDateForDayISO } from "../../../lib/utils.js";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TYPE_COLORS = {
  Rest: "var(--text3)",
  Technical: "var(--gold)",
  Tactical: "var(--blue)",
  Physical: "var(--red)",
  Recovery: "var(--green)",
  Match: "var(--faith)",
};

export default function PlayerTraining({
  session: s,
  hasTeam,
  schedule,
  logs,
  todayISO,
  todayDayIndex,
  onToggleComplete,
}) {
  const [view, setView] = useState(window._playerTrainingView || "week");
  const [selectedDay, setSelectedDay] = useState(
    window._playerTrainingSelectedDay ?? todayDayIndex,
  );
  const [selectedDate, setSelectedDate] = useState(
    window._playerTrainingSelectedDate || todayISO,
  );

  if (!hasTeam) {
    return (
      <div className="card">
        <div style={{ textAlign: "center", padding: "40px 24px", color: "var(--text2)" }}>
          <i
            className="ti ti-clipboard-list"
            style={{ fontSize: 40, marginBottom: 12, display: "block", color: "var(--text3)" }}
          ></i>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
            No training plan yet
          </div>
          <div style={{ fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
            You need to join a verified squad before you can see training plans.
            <br />
            Your coach will broadcast sessions directly to you.
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => window.HF_ROUTER.navTo("findmyteam")}>
            <i className="ti ti-search"></i> Find a team
          </button>
        </div>
      </div>
    );
  }

  const p = s.profile || {};

  const selectDay = (dayIndex, dateISO) => {
    window._playerTrainingSelectedDay = dayIndex;
    window._playerTrainingSelectedDate = dateISO;
    setSelectedDay(dayIndex);
    setSelectedDate(dateISO);
  };

  const changeView = (v) => {
    window._playerTrainingView = v;
    window._playerTrainingSelectedDate = null;
    setView(v);
  };

  const selectedLogForDate = logs?.find((l) => l.date === selectedDate);
  const selectedIsDone = selectedLogForDate?.completed;
  const selectedDayType = schedule[selectedDate] || null;
  const selectedColor = selectedDayType ? TYPE_COLORS[selectedDayType] : "var(--border)";
  const isSelectedToday = selectedDate === todayISO;
  const selectedDateLabel = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  const weekStrip = DAYS.map((day, i) => {
    const dateISO = getDateForDayISO(i);
    const isToday = i === todayDayIndex;
    const isSelected = dateISO === selectedDate;
    const sessionType = schedule[dateISO] || null;
    const color = sessionType ? TYPE_COLORS[sessionType] : null;
    const displayColor = color || (sessionType === "Rest" ? TYPE_COLORS.Rest : null);
    const hasLog = logs?.find((l) => l.date === dateISO);
    return (
      <div
        key={day + i}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
        onClick={() => selectDay(i, dateISO)}
      >
        <div
          style={{
            fontFamily: "var(--font)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: isSelected ? "var(--text)" : "var(--text3)",
          }}
        >
          {day}
        </div>
        <div
          style={{
            width: "100%",
            padding: "8px 4px",
            background: isSelected
              ? displayColor
                ? displayColor + "33"
                : "var(--bg3)"
              : displayColor
                ? displayColor + "11"
                : "transparent",
            border: isSelected
              ? `2px solid ${displayColor || "var(--text)"}`
              : isToday
                ? "1.5px solid var(--text3)"
                : "0.5px solid var(--border)",
            textAlign: "center",
            minHeight: 60,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              fontFamily: "var(--font)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: displayColor || "var(--text3)",
            }}
          >
            {sessionType || "-"}
          </span>
          {hasLog && <i className="ti ti-circle-check" style={{ fontSize: 10, color: "var(--green)" }}></i>}
        </div>
      </div>
    );
  });

  const renderMonthView = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`blank-${i}`}></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayOfWeek = new Date(year, month, d).getDay();
      const isToday = d === now.getDate();
      const isSelected = dateStr === selectedDate;
      const t = schedule[dateStr] || null;
      const c = t ? TYPE_COLORS[t] : null;
      const dc = c || (t === "Rest" ? TYPE_COLORS.Rest : null);
      const hasLog = logs?.find((l) => l.date === dateStr);
      cells.push(
        <div
          key={dateStr}
          onClick={() => selectDay(dayOfWeek, dateStr)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: 40,
            background: isSelected ? (dc ? dc + "22" : "var(--bg3)") : "transparent",
            border: isSelected
              ? `2px solid ${dc || "var(--text)"}`
              : isToday
                ? "1.5px solid var(--text3)"
                : "0.5px solid var(--border)",
            color: isSelected ? "var(--text)" : "var(--text2)",
            fontSize: 11,
            fontWeight: isToday ? 700 : 400,
            cursor: "pointer",
            position: "relative",
          }}
        >
          <span>{d}</span>
          {hasLog ? (
            <div
              style={{
                width: 4,
                height: 4,
                background: "var(--green)",
                borderRadius: "50%",
                position: "absolute",
                bottom: 3,
              }}
            ></div>
          ) : t ? (
            <div style={{ width: 4, height: 4, background: dc, position: "absolute", bottom: 3 }}></div>
          ) : null}
        </div>,
      );
    }
    return (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
          {DAYS.map((d) => (
            <div
              key={d}
              style={{
                textAlign: "center",
                fontFamily: "var(--font)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text3)",
                padding: "4px 0",
              }}
            >
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: "var(--sp-md)" }}>
          {cells}
        </div>
      </>
    );
  };

  return (
    <>
      <div className="card">
        <div className="card-title" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
              <div className="card-dot"></div>Training plan
              <span style={{ fontSize: 11, color: "var(--text3)" }}>
                {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text3)",
                fontFamily: "var(--font)",
                textTransform: "none",
                letterSpacing: 0,
                fontWeight: 400,
              }}
            >
              Set by {p.club} coaching staff · read-only
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {["day", "week", "month"].map((v) => (
              <button
                key={v}
                className={`btn btn-sm ${view === v ? "btn-primary" : "btn-outline"}`}
                onClick={() => changeView(v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {selectedDayType ? (
          <div
            id="completion-section"
            style={{
              padding: "var(--sp-md)",
              background: selectedIsDone ? "rgba(26,122,46,.08)" : selectedColor + "22",
              borderLeft: `3px solid ${selectedIsDone ? "var(--green)" : selectedColor}`,
              marginBottom: "var(--sp-lg)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text2)",
                marginBottom: 6,
              }}
            >
              {isSelectedToday ? "Today" : selectedDateLabel}
            </div>
            {selectedIsDone ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 13, color: "var(--green)", display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="ti ti-circle-check"></i> {selectedDayType} completed!
                  {selectedLogForDate.notes && (
                    <span style={{ fontSize: 11, color: "var(--text2)" }}>"{selectedLogForDate.notes}"</span>
                  )}
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => onToggleComplete(selectedDayType, selectedDate, false)}
                >
                  <i className="ti ti-x"></i> Uncomplete
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 8 }}>
                  Coach has planned: <strong style={{ color: selectedColor }}>{selectedDayType}</strong>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    id={`session-notes-${selectedDate}`}
                    placeholder="Add session notes (optional)..."
                    style={{
                      flex: 1,
                      minWidth: 150,
                      padding: "8px 12px",
                      background: "var(--bg)",
                      border: "0.5px solid var(--border)",
                      color: "var(--text)",
                      fontSize: 13,
                      outline: "none",
                      fontFamily: "var(--font)",
                    }}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onToggleComplete(selectedDayType, selectedDate, true)}
                  >
                    <i className="ti ti-circle-check"></i> Mark completed
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div
            style={{
              padding: "var(--sp-md)",
              background: "var(--bg2)",
              borderLeft: "3px solid var(--border)",
              marginBottom: "var(--sp-lg)",
              fontSize: 13,
              color: "var(--text2)",
            }}
          >
            {isSelectedToday ? "No session planned for today by your coach." : `No session planned for ${selectedDateLabel}.`}
          </div>
        )}

        {view === "month" ? (
          renderMonthView()
        ) : view === "day" ? (
          <div
            style={{
              padding: "var(--sp-lg)",
              background: schedule[selectedDate] ? (TYPE_COLORS[schedule[selectedDate]] || "var(--gold)") + "22" : "var(--bg2)",
              border: schedule[selectedDate]
                ? `2px solid ${TYPE_COLORS[schedule[selectedDate]] || "var(--gold)"}`
                : "0.5px solid var(--border)",
              textAlign: "center",
              marginBottom: "var(--sp-lg)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text3)",
                marginBottom: 6,
              }}
            >
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
            <div
              style={{
                fontFamily: "var(--font)",
                fontSize: 28,
                fontWeight: 700,
                color: schedule[selectedDate] ? TYPE_COLORS[schedule[selectedDate]] || "var(--gold)" : "var(--text3)",
                marginBottom: 4,
              }}
            >
              {schedule[selectedDate] || "No session set"}
            </div>
            <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", marginTop: "var(--sp-md)" }}>
              {DAYS.map((day, i) => {
                const dISO = getDateForDayISO(i);
                const dt = schedule[dISO] || null;
                const dc = dt ? TYPE_COLORS[dt] || "var(--text3)" : null;
                const isSelected = dISO === selectedDate;
                return (
                  <button
                    key={day + i}
                    className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-outline"}`}
                    style={isSelected && dc ? { background: dc, borderColor: dc, color: "#fff" } : undefined}
                    onClick={() => selectDay(i, dISO)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: "var(--sp-lg)" }}>
            {weekStrip}
          </div>
        )}

        <div style={{ padding: "var(--sp-md)", background: "var(--bg2)" }}>
          <div
            style={{
              fontFamily: "var(--font)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text2)",
              marginBottom: 8,
            }}
          >
            Legend
          </div>
          <div style={{ display: "flex", gap: "var(--sp-md)", flexWrap: "wrap" }}>
            {Object.entries(TYPE_COLORS).map(([t, c]) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text2)" }}>
                <div style={{ width: 10, height: 10, background: c }}></div>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <div className="card-dot"></div>My completion log
        </div>
        {!logs || logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text2)", fontSize: 13 }}>
            No sessions logged yet. Mark today's session complete above.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={l.id || i}>
                    <td style={{ color: "var(--text2)" }}>
                      {new Date(l.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    </td>
                    <td>{l.session_type || "-"}</td>
                    <td style={{ fontSize: 11, color: "var(--text2)" }}>{l.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
