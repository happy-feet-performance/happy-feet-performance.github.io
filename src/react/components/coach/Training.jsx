import { useEffect, useState } from "react";
import { getDateForDayISO } from "../../../lib/utils.js";
import { toast } from "../../../lib/dom.js";
import { WdlRecord } from "../shared/index.js";
import * as db from "../../../lib/db/index.js";
import { useAsync } from "../../hooks/useAsync.js";
import { approveMatchRequest, clearDayType, declineMatchRequest, logMatchResult, notifySquadOfMatch, saveLineup, saveMatchSession, saveOpponentLineup, savePostStats, saveSession, setDayType, training } from "../../../lib/coach.js";
import { navTo } from "../../../lib/router.js";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TYPE_COLORS = {
  Technical: "var(--gold)",
  Tactical: "var(--blue)",
  Physical: "var(--red)",
  Recovery: "var(--green)",
  Match: "var(--faith)",
  Rest: "var(--text3)",
};
const TYPES = Object.keys(TYPE_COLORS).filter((t) => t !== "Match");

// Re-runs the training view (src/lib/coach.js), which remounts this component.
const reRender = () => training(db.getSession());

// ── PENDING MATCH REQUESTS (top of page) ──────────────────────
function PendingRequestsCard({ pendingRequests, session }) {
  if (!pendingRequests || pendingRequests.length === 0) return null;
  return (
    <div className="card" style={{ borderTop: "2px solid var(--faith)" }}>
      <div className="card-title">
        <div className="card-dot" style={{ background: "var(--faith)" }}></div>
        Pending match requests
        <span
          style={{
            fontFamily: "var(--font)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "2px 6px",
            background: "var(--faith-lt)",
            color: "var(--faith)",
          }}
        >
          {pendingRequests.length} pending
        </span>
      </div>
      {pendingRequests.map((req) => {
        const requestingClub = req.coach?.profile?.club || req.coach?.name || "Unknown club";
        const matchDate = new Date(req.date + "T00:00:00").toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        return (
          <div
            key={req.id}
            style={{
              padding: "var(--sp-md)",
              background: "var(--bg2)",
              borderLeft: "3px solid var(--faith)",
              marginBottom: "var(--sp-sm)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
              <i className="ti ti-whistle" style={{ color: "var(--faith)", marginRight: 6 }}></i>
              {requestingClub} wants to play you on {matchDate}
            </div>
            {req.location && (
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 8 }}>
                <i className="ti ti-map-pin" style={{ marginRight: 4 }}></i>
                {req.location}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() =>
                  approveMatchRequest(
                    req.id,
                    requestingClub,
                    session.userId === req.coach_id ? false : true,
                  )
                }
              >
                <i className="ti ti-circle-check"></i> Approve
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => declineMatchRequest(req.id, req.coach_id, requestingClub)}
              >
                <i className="ti ti-x"></i> Decline
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── WEEK / DAY / MONTH CALENDAR VIEWS ─────────────────────────
function WeekView({ schedule, selectedDateISO, allSessions, incomingLockedDates }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: "var(--sp-lg)" }}>
      {DAYS.map((day, i) => {
        const dateISO = getDateForDayISO(i);
        const t = schedule[dateISO] || null;
        const c = t ? TYPE_COLORS[t] : null;
        const displayC = c || (t === "Rest" ? TYPE_COLORS.Rest : null);
        const isSelected = dateISO === selectedDateISO;
        const isToday = i === new Date().getDay();
        const hasSession = allSessions.some((ss) => ss.dayIndex === i || ss.date === dateISO);
        const locked = incomingLockedDates.has(dateISO);
        return (
          <div
            key={day}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}
            onClick={() => {
              window._coachTrainingSelectedDay = i;
              window._coachTrainingSelectedDate = getDateForDayISO(i);
              window._matchSaved = false;
              window._editingMatchDetails = false;
              window._matchTab = null;
              window._editingSession = null;
              reRender();
            }}
            title={locked ? "Incoming match request: approve or decline first" : ""}
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
                minHeight: 56,
                padding: "6px 4px",
                background: isSelected ? (displayC ? displayC + "22" : "var(--bg3)") : displayC ? displayC + "11" : "transparent",
                border: isSelected
                  ? `2px solid ${displayC || "var(--text)"}`
                  : isToday
                    ? "1px solid var(--text3)"
                    : "0.5px solid var(--border)",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
              }}
            >
              {locked ? (
                <>
                  <i className="ti ti-lock" style={{ fontSize: 9, color: "var(--faith)" }}></i>
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      fontFamily: "var(--font)",
                      textTransform: "uppercase",
                      color: "var(--faith)",
                    }}
                  >
                    Match req
                  </span>
                </>
              ) : (
                <>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      fontFamily: "var(--font)",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: displayC || "var(--text3)",
                    }}
                  >
                    {t || "-"}
                  </span>
                  {hasSession && <i className="ti ti-clipboard-check" style={{ fontSize: 9, color: "var(--green)" }}></i>}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({ schedule, selectedDateISO, allSessions, selectedDay }) {
  const t = schedule[selectedDateISO] || null;
  const displayC = t ? TYPE_COLORS[t] || null : null;
  const hasSession = allSessions.some((ss) => ss.date === selectedDateISO || ss.dayIndex === selectedDay);
  const dateLabel = new Date(selectedDateISO + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return (
    <>
      <div
        style={{
          padding: "var(--sp-lg)",
          background: displayC ? displayC + "22" : "var(--bg2)",
          border: displayC ? `2px solid ${displayC}` : "0.5px solid var(--border)",
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
          {dateLabel}
        </div>
        <div
          style={{
            fontFamily: "var(--font)",
            fontSize: 28,
            fontWeight: 700,
            color: displayC || "var(--text3)",
            marginBottom: 4,
          }}
        >
          {t || "No session set"}
        </div>
        {hasSession && (
          <div style={{ fontSize: 11, color: "var(--green)", marginTop: 6 }}>
            <i className="ti ti-clipboard-check" style={{ marginRight: 4 }}></i>Session plan saved
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", marginBottom: "var(--sp-lg)" }}>
        {DAYS.map((day, i) => {
          const dISO = getDateForDayISO(i);
          const dt = schedule[dISO] || null;
          const dc = dt ? TYPE_COLORS[dt] || "var(--text3)" : null;
          const isSelected = dISO === selectedDateISO;
          return (
            <button
              key={day}
              className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-outline"}`}
              style={isSelected && dc ? { background: dc, borderColor: dc, color: "#fff" } : {}}
              onClick={() => {
                window._coachTrainingSelectedDay = i;
                window._coachTrainingSelectedDate = dISO;
                window._matchTab = null;
                window._editingSession = null;
                reRender();
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </>
  );
}

function MonthView({ schedule, selectedDateISO, allSessions, incomingLockedDates }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`blank-${i}`}></div>);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dayOfWeek = date.getDay();
    const isToday = d === now.getDate();
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const t = schedule[dateStr] || null;
    const color = t ? TYPE_COLORS[t] : null;
    const displayC = color || (t === "Rest" ? TYPE_COLORS.Rest : null);
    const hasSession = allSessions.some((ss) => ss.date === dateStr);
    const isSelected = dateStr === selectedDateISO;
    const locked = incomingLockedDates.has(dateStr);
    cells.push(
      <div
        key={dateStr}
        onClick={() => {
          window._coachTrainingSelectedDay = dayOfWeek;
          window._coachTrainingSelectedDate = dateStr;
          window._matchSaved = false;
          window._editingMatchDetails = false;
          window._matchTab = null;
          window._editingSession = null;
          reRender();
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: 40,
          background: isSelected ? (displayC ? displayC + "22" : "var(--bg3)") : "transparent",
          border: isSelected
            ? `2px solid ${displayC || "var(--text)"}`
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
        {locked ? (
          <div style={{ width: 4, height: 4, background: "var(--faith)", borderRadius: "50%", position: "absolute", bottom: 3 }}></div>
        ) : hasSession ? (
          <div style={{ width: 4, height: 4, background: "var(--green)", borderRadius: "50%", position: "absolute", bottom: 3 }}></div>
        ) : t ? (
          <div style={{ width: 4, height: 4, background: displayC, position: "absolute", bottom: 3 }}></div>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: "var(--sp-md)" }}>{cells}</div>
    </>
  );
}

// ── TYPE PICKER ────────────────────────────────────────────────
function TypePicker({
  dayMatchLocked,
  lockedByIncoming,
  incomingClub,
  incomingStatus,
  existingSession,
  selectedDay,
  selectedDateISO,
  sessionSaved,
  isEditingSession,
  selectedType,
}) {
  if (dayMatchLocked) {
    return (
      <div
        style={{
          padding: "var(--sp-md)",
          background: "var(--faith-lt)",
          borderLeft: "3px solid var(--faith)",
          marginBottom: "var(--sp-md)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--faith)",
            marginBottom: 6,
          }}
        >
          Session type locked
        </div>
        <div style={{ fontSize: 12, color: "var(--text2)" }}>
          {lockedByIncoming
            ? `${incomingClub} has sent you a match request for this day. ${
                incomingStatus === "confirmed"
                  ? "The match is confirmed."
                  : "Approve or decline the request below before changing this day's session type."
              }`
            : `This day has a ${
                existingSession.matchStatus === "confirmed" ? "confirmed" : "pending"
              } match${existingSession.opponent ? ` vs ${existingSession.opponent}` : ""}. ${
                existingSession.matchStatus === "pending"
                  ? "Both coaches must approve or decline before the session type can be changed."
                  : "The match is confirmed: session type cannot be changed."
              }`}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "var(--sp-md)" }}>
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
        Session type for {DAYS[selectedDay]} ·{" "}
        {new Date(selectedDateISO + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
      </div>
      {sessionSaved && !isEditingSession ? (
        <div style={{ fontSize: 12, color: "var(--text2)" }}>
          <i className="ti ti-lock" style={{ marginRight: 6, color: "var(--text3)" }}></i>
          Session type locked. Click <strong>Update session</strong> to change.
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TYPES.map((t) => (
            <button
              key={t}
              className={`btn btn-sm ${selectedType === t ? "btn-primary" : "btn-outline"}`}
              style={selectedType === t ? { background: TYPE_COLORS[t], borderColor: TYPE_COLORS[t], color: t === "Rest" ? "var(--text)" : "#fff" } : {}}
              onClick={() => setDayType(selectedDay, selectedDateISO, t)}
            >
              {t}
            </button>
          ))}
          {selectedType && (
            <button
              className="btn btn-sm btn-outline"
              style={{ color: "var(--text3)" }}
              onClick={() => clearDayType(selectedDay, selectedDateISO)}
            >
              <i className="ti ti-x"></i> Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── LINEUP TABLE (shared shape for own-side and opponent-side) ──
// Lineup form values ({ [playerId]: { role, sub_on_min, sub_off_min } }) from saved stats.
const initialLineup = (squadPlayers, stats) =>
  Object.fromEntries(
    squadPlayers.map((sp) => {
      const e = stats[sp.player_id] || {};
      return [sp.player_id, { role: e.role || "starter", sub_on_min: e.sub_on_min ?? "", sub_off_min: e.sub_off_min ?? "" }];
    }),
  );

// The post-match stats each row collects, by position.
const statFieldsFor = (pos) =>
  pos === "GK"
    ? ["minutes", "saves", "yellow_cards", "red_cards"]
    : ["minutes", "goals", "assists", "shots", "saves", ...(["CB", "LB", "RB", "DM"].includes(pos) ? ["tackles"] : []), "yellow_cards", "red_cards"];

// Stats form values for everyone not on the bench.
const initialStats = (squadPlayers, myStats) =>
  Object.fromEntries(
    squadPlayers
      .filter((sp) => (myStats[sp.player_id]?.role || "starter") !== "bench")
      .map((sp) => {
        const e = myStats[sp.player_id] || {};
        const fields = statFieldsFor(sp.player?.profile?.pos || "CM");
        return [sp.player_id, Object.fromEntries(fields.map((k) => [k, e[k] ?? (k === "minutes" ? 90 : 0)]))];
      }),
  );

// Updates one player's field in a { [playerId]: {...} } form.
const setPlayerField = (setter) => (pid, field, value) =>
  setter((form) => ({ ...form, [pid]: { ...form[pid], [field]: value } }));

function LineupTable({ squadPlayers, values, onChange, locked }) {

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, tableLayout: "fixed" }}>
      <colgroup>
        <col style={{ width: "auto" }} />
        <col style={{ width: 70 }} />
        <col style={{ width: 60 }} />
        <col style={{ width: 60 }} />
      </colgroup>
      <thead>
        <tr style={{ borderBottom: "2px solid var(--border)" }}>
          <th
            style={{
              textAlign: "left",
              padding: "6px 8px",
              fontFamily: "var(--font)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text2)",
            }}
          >
            Player
          </th>
          <th
            style={{
              textAlign: "center",
              padding: 4,
              fontFamily: "var(--font)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--text2)",
            }}
          >
            Role
          </th>
          <th
            style={{
              textAlign: "center",
              padding: 4,
              fontFamily: "var(--font)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--text2)",
            }}
          >
            Sub on
          </th>
          <th
            style={{
              textAlign: "center",
              padding: 4,
              fontFamily: "var(--font)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--text2)",
            }}
          >
            Sub off
          </th>
        </tr>
      </thead>
      <tbody>
        {squadPlayers.map((sp) => {
          const pos = sp.player?.profile?.pos || "CM";
          const v = values[sp.player_id] || {};
          const role = v.role || "starter";
          const set = (field) => (ev) => onChange(sp.player_id, field, ev.target.value);
          return (
            <tr key={sp.player_id} style={{ borderBottom: "0.5px solid var(--border)" }}>
              <td style={{ padding: "6px 8px", fontWeight: 600, color: "var(--text)" }}>
                {sp.player?.name?.split(" ")[0] || "Player"}
                <span style={{ fontSize: 9, color: "var(--text3)", marginLeft: 4 }}>{pos}</span>
              </td>
              <td style={{ padding: "3px 4px" }}>
                <select
                  disabled={locked}
                  value={role}
                  onChange={set("role")}
                  style={{
                    width: "100%",
                    padding: "5px 4px",
                    background: "var(--bg2)",
                    border: "0.5px solid var(--border)",
                    color: "var(--text)",
                    fontSize: 11,
                    fontFamily: "var(--font)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="starter">Starter</option>
                  <option value="sub">Sub</option>
                  <option value="bench">Bench</option>
                </select>
              </td>
              <td style={{ padding: "3px 4px" }}>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={v.sub_on_min ?? ""}
                  onChange={set("sub_on_min")}
                  placeholder="min"
                  disabled={role !== "sub" || locked}
                  style={{
                    width: "100%",
                    padding: "5px 3px",
                    background: "var(--bg2)",
                    border: "0.5px solid var(--border)",
                    color: "var(--text)",
                    fontSize: 12,
                    fontFamily: "var(--font)",
                    textAlign: "center",
                    outline: "none",
                    boxSizing: "border-box",
                    opacity: role === "sub" && !locked ? 1 : 0.4,
                  }}
                />
              </td>
              <td style={{ padding: "3px 4px" }}>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={v.sub_off_min ?? ""}
                  onChange={set("sub_off_min")}
                  placeholder="min"
                  disabled={role === "bench" || locked}
                  style={{
                    width: "100%",
                    padding: "5px 3px",
                    background: "var(--bg2)",
                    border: "0.5px solid var(--border)",
                    color: "var(--text)",
                    fontSize: 12,
                    fontFamily: "var(--font)",
                    textAlign: "center",
                    outline: "none",
                    boxSizing: "border-box",
                    opacity: role !== "bench" && !locked ? 1 : 0.4,
                  }}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── POST-MATCH STATS TABLE ────────────────────────────────────
function StatsTable({ squadPlayers, myStats, values, onChange }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
        <colgroup>
          <col style={{ minWidth: 110 }} />
          <col style={{ width: 50 }} />
          <col style={{ width: 50 }} />
          <col style={{ width: 50 }} />
          <col style={{ width: 50 }} />
          <col style={{ width: 50 }} />
          <col style={{ width: 50 }} />
          <col style={{ width: 44 }} />
          <col style={{ width: 44 }} />
        </colgroup>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--border)" }}>
            <th style={{ textAlign: "left", padding: "6px 8px", fontFamily: "var(--font)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text2)" }}>
              Player
            </th>
            <th style={{ textAlign: "center", padding: 4, color: "var(--text2)", fontSize: 13 }}><i className="ti ti-clock" title="Minutes"></i></th>
            <th style={{ textAlign: "center", padding: 4, color: "var(--text2)", fontSize: 13 }}><i className="ti ti-ball-football" title="Goals"></i></th>
            <th style={{ textAlign: "center", padding: 4, color: "var(--text2)", fontSize: 13 }}><i className="ti ti-arrow-forward-up" title="Assists"></i></th>
            <th style={{ textAlign: "center", padding: 4, color: "var(--text2)", fontSize: 13 }}><i className="ti ti-target" title="Shots"></i></th>
            <th style={{ textAlign: "center", padding: 4, color: "var(--text2)", fontSize: 13 }}><i className="ti ti-shield" title="Saves"></i></th>
            <th style={{ textAlign: "center", padding: 4, color: "var(--text2)", fontSize: 13 }}><i className="ti ti-sword" title="Tackles"></i></th>
            <th style={{ textAlign: "center", padding: 4, color: "#f5c518", fontSize: 13 }}><i className="ti ti-square" title="Yellow"></i></th>
            <th style={{ textAlign: "center", padding: 4, color: "var(--red)", fontSize: 13 }}><i className="ti ti-square" title="Red"></i></th>
          </tr>
        </thead>
        <tbody>
          {squadPlayers
            .filter((sp) => (myStats[sp.player_id]?.role || "starter") !== "bench")
            .map((sp) => {
              const pos = sp.player?.profile?.pos || "CM";
              const e = myStats[sp.player_id] || {};
              const isGK = pos === "GK";
              const isDefMid = ["CB", "LB", "RB", "DM"].includes(pos);
              const inputStyle = {
                width: "100%",
                padding: "5px 3px",
                background: "var(--bg2)",
                border: "0.5px solid var(--border)",
                color: "var(--text)",
                fontSize: 12,
                fontFamily: "var(--font)",
                textAlign: "center",
                outline: "none",
                boxSizing: "border-box",
              };
              const bind = (stat) => ({
                value: values[sp.player_id]?.[stat] ?? "",
                onChange: (ev) => onChange(sp.player_id, stat, ev.target.value),
              });
              const inp = (stat, min = 0, max = 20) => (
                <input type="number" min={min} max={max} {...bind(stat)} style={inputStyle} />
              );
              const na = (
                <input
                  type="text"
                  defaultValue="N/A"
                  disabled
                  style={{ ...inputStyle, background: "var(--bg3)", color: "var(--text3)", cursor: "default" }}
                />
              );
              const dim = (stat) => (
                <input
                  type="number"
                  min="0"
                  max="20"
                  {...bind(stat)}
                  title="Not typical for this position"
                  style={{ ...inputStyle, color: "var(--text3)", opacity: 0.35 }}
                />
              );
              return (
                <tr key={sp.player_id} style={{ borderBottom: "0.5px solid var(--border)" }}>
                  <td style={{ padding: "6px 8px", fontWeight: 600, color: "var(--text)" }}>
                    {sp.player?.name?.split(" ")[0] || "Player"}
                    <span style={{ fontSize: 9, color: "var(--text3)", marginLeft: 4 }}>{pos}</span>
                    {e.role === "sub" && (
                      <span style={{ fontSize: 9, color: "var(--faith)", marginLeft: 4 }}>
                        ↑{e.sub_on_min ? "'" + e.sub_on_min : ""}
                      </span>
                    )}
                    {e.sub_off_min && <span style={{ fontSize: 9, color: "var(--red)", marginLeft: 2 }}>↓{e.sub_off_min}'</span>}
                  </td>
                  <td style={{ padding: "3px 2px" }}>{inp("minutes", 0, 120)}</td>
                  {isGK ? (
                    <>
                      <td style={{ padding: "3px 2px" }}>{na}</td>
                      <td style={{ padding: "3px 2px" }}>{na}</td>
                      <td style={{ padding: "3px 2px" }}>{na}</td>
                      <td style={{ padding: "3px 2px" }}>{inp("saves")}</td>
                      <td style={{ padding: "3px 2px" }}>{na}</td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: "3px 2px" }}>{inp("goals")}</td>
                      <td style={{ padding: "3px 2px" }}>{inp("assists")}</td>
                      <td style={{ padding: "3px 2px" }}>{inp("shots")}</td>
                      <td style={{ padding: "3px 2px" }}>{dim("saves")}</td>
                      <td style={{ padding: "3px 2px" }}>{isDefMid ? inp("tackles") : na}</td>
                    </>
                  )}
                  <td style={{ padding: "3px 2px" }}>{inp("yellow_cards", 0, 2)}</td>
                  <td style={{ padding: "3px 2px" }}>{inp("red_cards", 0, 1)}</td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

// The opponent's submitted lineup, shown once a match is confirmed.
function OpponentSquadList({ matchId, coachId }) {
  const { data: squad, loading } = useAsync(async () => (await db.getOpponentSquad(matchId, coachId)).data || [], [matchId]);
  if (loading) return <div style={{ fontSize: 13, color: "var(--text2)" }}>Loading...</div>;
  if (!squad.length) return <div style={{ color: "var(--text3)", fontSize: 12 }}>No lineup submitted yet.</div>;
  return squad.map((p) => {
    const prof = p.player?.profile || {};
    const r = prof.ratings;
    const overall = r ? Math.round((r.speed + r.tech + r.tact + r.phys) / 4) : null;
    return (
      <div
        key={p.player_id || p.player?.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-md)",
          padding: "var(--sp-sm) var(--sp-md)",
          background: "var(--bg2)",
          borderLeft: "2px solid var(--faith)",
          marginBottom: 4,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font)",
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 6px",
            background: "var(--faith-lt)",
            color: "var(--faith)",
          }}
        >
          {prof.pos || "?"}
        </div>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{p.player?.name || "Unknown"}</div>
        {overall !== null && (
          <div style={{ fontFamily: "var(--font)", fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>{overall}%</div>
        )}
      </div>
    );
  });
}

// ── MATCH FORM (fixture hero + tabs) ──────────────────────────
function MatchForm({
  session: s,
  selectedDay,
  selectedDateISO,
  wdl,
  clubName,
  existingSession,
  verifiedTeams,
  matchTab,
  matchPhase,
  phaseLabel,
  statusColor,
  statusLabel,
  formLocked,
  opponentRequestPending,
  squadPlayers,
  myStats,
}) {
  const [lineup, setLineup] = useState(() => initialLineup(squadPlayers, myStats));
  const [postStats, setPostStats] = useState(() => initialStats(squadPlayers, myStats));
  const [match, setMatch] = useState({
    opponent: existingSession?.isUnverifiedOpponent ? "__other__" : existingSession?.opponent || "",
    otherName: existingSession?.isUnverifiedOpponent ? existingSession.opponent : "",
    venue: existingSession?.venueType || "",
    neutralVenue: existingSession?.venueType === "neutral" ? existingSession.location : "",
    intent: existingSession?.intent || "",
  });
  // home ground of the chosen opponent, for the Away venue
  const opponentGround =
    (verifiedTeams || []).find((t) => t.name === match.opponent)?.homeGround ||
    (match.opponent === "__other__" ? null : existingSession?.opponentGround || null);
  return (
    <div className="card" style={{ borderTop: "2px solid var(--faith)", padding: 0, overflow: "hidden" }}>
      {/* FIXTURE HERO */}
      <div style={{ background: "var(--bg)", borderBottom: "0.5px solid var(--border)", padding: "var(--sp-lg) var(--sp-xl)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: "var(--sp-md)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
            <i className="ti ti-calendar-event" style={{ color: "var(--faith)", fontSize: 14 }}></i>
            <span style={{ fontFamily: "var(--font)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text2)" }}>
              {DAYS[selectedDay]} ·{" "}
              {new Date(selectedDateISO + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            <span style={{ fontFamily: "var(--font)", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 8px", background: "var(--faith-lt)", color: "var(--faith)" }}>
              {phaseLabel}
            </span>
          </div>
          {wdl.total > 0 && <WdlRecord W={wdl.W} D={wdl.D} L={wdl.L} />}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--sp-xl)" }}>
          <div style={{ textAlign: "center", flex: 1, maxWidth: 160 }}>
            <div style={{ fontFamily: "var(--font)", fontSize: 18, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text)", marginBottom: 4 }}>
              {clubName}
            </div>
            <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--font)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {existingSession?.venueType === "home" ? "Home" : existingSession?.venueType === "away" ? "Away" : "-"}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <div style={{ fontFamily: "var(--font)", fontSize: 22, fontWeight: 700, letterSpacing: "0.12em", color: "var(--text3)" }}>VS</div>
            {existingSession?.location ? (
              <div style={{ fontSize: 10, color: "var(--text2)", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                <i className="ti ti-map-pin" style={{ fontSize: 10, color: "var(--faith)" }}></i>
                {existingSession.location}
              </div>
            ) : (
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.2)" }}>Venue TBD</div>
            )}
          </div>

          <div style={{ textAlign: "center", flex: 1, maxWidth: 160 }}>
            <div style={{ fontFamily: "var(--font)", fontSize: 18, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: existingSession?.opponent ? "var(--text)" : "var(--text3)" }}>
              {existingSession?.opponent || "TBD"}
            </div>
            <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--font)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {existingSession?.venueType === "away" ? "Home" : existingSession?.venueType === "home" ? "Away" : "-"}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "var(--sp-lg)", paddingTop: "var(--sp-md)", borderTop: "0.5px solid var(--border)", display: "flex", alignItems: "flex-start", gap: "var(--sp-lg)", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text3)", marginBottom: 4 }}>
              Coach's note
            </div>
            <div style={{ fontSize: 12, color: existingSession?.intent ? "var(--text2)" : "var(--text3)" }}>
              {existingSession?.intent || "No note added"}
            </div>
          </div>

          {existingSession?.matchStatus ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0, marginLeft: "auto", alignSelf: "center" }}>
              <div style={{ display: "inline-flex", alignItems: "center", background: `${statusColor}22`, border: `1px solid ${statusColor}44`, lineHeight: 1 }}>
                <span style={{ fontFamily: "var(--font)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: statusColor, verticalAlign: "middle" }}>
                  {statusLabel}
                </span>
              </div>
              {existingSession.matchStatus === "pending" && (
                <div style={{ fontSize: 10, color: "var(--text3)", textAlign: "center" }}>
                  Awaiting {existingSession.opponent || "opponent"} approval
                </div>
              )}
              {existingSession.matchStatus === "confirmed" && (
                <div style={{ fontSize: 10, color: "var(--text3)", textAlign: "center" }}>Both coaches approved</div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 10, color: "var(--text3)" }}>Not yet sent</div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ padding: "0 var(--sp-xl)" }}>
        <div className="tab-toggle" style={{ margin: "var(--sp-md) 0" }}>
          <button
            className={matchTab === "details" ? "active" : ""}
            style={!window._editingMatchDetails && existingSession?.matchId ? { opacity: 0.5 } : {}}
            onClick={() => {
              window._matchTab = "details";
              reRender();
            }}
          >
            <i className="ti ti-edit" style={{ fontSize: 11, marginRight: 3 }}></i>Edit
          </button>
          <button
            className={matchTab === "lineup" ? "active" : ""}
            onClick={() => {
              window._matchTab = "lineup";
              reRender();
            }}
          >
            Lineup
          </button>
          {matchPhase !== "pre" && (
            <button
              className={matchTab === "stats" ? "active" : ""}
              onClick={() => {
                window._matchTab = "stats";
                reRender();
              }}
            >
              Stats
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "0 var(--sp-xl) var(--sp-xl)" }}>
        {/* TAB: DETAILS */}
        {matchTab === "details" && (
          <>
            {formLocked ? (
              <>
                <div style={{ padding: "var(--sp-md)", background: "var(--bg2)", borderLeft: "2px solid var(--faith)", marginBottom: "var(--sp-md)" }}>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: "var(--sp-sm)" }}>
                    Click Edit above or the button below to change match details.
                  </div>
                  {opponentRequestPending && (
                    <div style={{ fontSize: 11, color: "var(--gold)", display: "flex", alignItems: "center", gap: 6 }}>
                      <i className="ti ti-lock"></i> Opponent field locked while {existingSession.opponent} reviews the request.
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    window._editingMatchDetails = true;
                    window._matchSaved = false;
                    window._matchTab = "details";
                    reRender();
                  }}
                >
                  <i className="ti ti-edit"></i> Edit match details
                </button>
              </>
            ) : (
              <>
                {opponentRequestPending && (
                  <div
                    style={{
                      padding: "var(--sp-sm) var(--sp-md)",
                      background: "rgba(196,154,10,.06)",
                      borderLeft: "2px solid var(--gold)",
                      marginBottom: "var(--sp-md)",
                      fontSize: 12,
                      color: "var(--text2)",
                    }}
                  >
                    <i className="ti ti-lock" style={{ marginRight: 6, color: "var(--gold)" }}></i>
                    Opponent cannot be changed while {existingSession.opponent} is reviewing the match request.
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-md)", marginBottom: "var(--sp-md)" }}>
                  <div className="fg">
                    <label className="required">Opponent</label>
                    <select
                      value={match.opponent} onChange={(e) => setMatch((f) => ({ ...f, opponent: e.target.value }))}
                      disabled={!!opponentRequestPending}
                      
                      style={{
                        padding: "10px 14px",
                        background: "var(--bg2)",
                        border: "0.5px solid var(--border)",
                        color: "var(--text)",
                        fontSize: 14,
                        width: "100%",
                        outline: "none",
                        fontFamily: "var(--font)",
                        opacity: opponentRequestPending ? 0.5 : 1,
                        cursor: opponentRequestPending ? "not-allowed" : "auto",
                      }}
                    >
                      <option value="">Select opponent</option>
                      {(verifiedTeams || [])
                        .filter((t) => t.name !== clubName)
                        .map((t) => (
                          <option key={t.name} value={t.name} data-ground={t.homeGround || ""}>
                            {t.name}
                          </option>
                        ))}
                      <option value="__other__">Other (requires admin approval)</option>
                    </select>
                  </div>
                  <div
                    className="fg"
                    style={{ display: match.opponent === "__other__" ? "flex" : "none", flexDirection: "column", gap: 5 }}
                  >
                    <label>Opponent name</label>
                    <input
                      type="text"
                      value={match.otherName} onChange={(e) => setMatch((f) => ({ ...f, otherName: e.target.value }))}
                      
                      placeholder="Enter team name"
                      autoComplete="off"
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
                </div>

                <div className="fg" style={{ marginBottom: "var(--sp-md)" }}>
                  <label>Match venue</label>
                  <select
                    value={match.venue} onChange={(e) => setMatch((f) => ({ ...f, venue: e.target.value }))}
                    
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
                    <option value="">Select venue</option>
                    <option value="home">Home: {s.profile?.homeGround || s.profile?.club || "Your ground"}</option>
                    <option value="away">Away: {opponentGround || "Opponent's ground"}</option>
                    <option value="neutral">Neutral venue: requires admin approval</option>
                  </select>
                  <div
                    style={{ display: match.venue === "neutral" ? "block" : "none", marginTop: "var(--sp-sm)" }}
                  >
                    <input
                      type="text"
                      value={match.neutralVenue} onChange={(e) => setMatch((f) => ({ ...f, neutralVenue: e.target.value }))}
                      
                      placeholder="e.g. Accra Sports Stadium"
                      autoComplete="off"
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
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
                      <i className="ti ti-info-circle" style={{ marginRight: 4 }}></i>
                      Neutral venues require admin approval before the match is confirmed.
                    </div>
                  </div>
                </div>

                <div className="fg" style={{ marginBottom: "var(--sp-lg)" }}>
                  <label>Coach's note</label>
                  <input
                    type="text"
                    value={match.intent} onChange={(e) => setMatch((f) => ({ ...f, intent: e.target.value }))}
                    
                    placeholder="e.g. Press high, win second balls"
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

                {!existingSession?.matchId && (
                  <div
                    style={{
                      padding: "var(--sp-sm) var(--sp-md)",
                      background: "rgba(196,154,10,.06)",
                      borderLeft: "2px solid var(--gold)",
                      marginBottom: "var(--sp-md)",
                      fontSize: 12,
                      color: "var(--text2)",
                    }}
                  >
                    <i className="ti ti-info-circle" style={{ marginRight: 6, color: "var(--gold)" }}></i>
                    After saving match details, go to the <strong>Lineup</strong> tab to submit your starting XI. The
                    match request is sent to the opponent once your lineup is submitted.
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => saveMatchSession(selectedDay, selectedDateISO, { ...match, opponentGround })}
                  >
                    <i className="ti ti-device-floppy"></i> {existingSession?.matchId ? "Update details" : "Save match details"}
                  </button>
                  {existingSession?.matchStatus === "confirmed" && (
                    <button className="btn btn-outline" onClick={() => notifySquadOfMatch(existingSession.matchId)}>
                      <i className="ti ti-send"></i> Notify my squad
                    </button>
                  )}
                  <button
                    className="btn btn-outline"
                    onClick={() =>
                      existingSession?.matchId
                        ? navTo("dashboard")
                        : clearDayType(selectedDay, selectedDateISO)
                    }
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {matchPhase !== "pre" && existingSession?.matchId && (
              <div style={{ marginTop: "var(--sp-lg)", paddingTop: "var(--sp-lg)", borderTop: "0.5px solid var(--border)" }}>
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
                  Match result
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {["W", "D", "L"].map((r) => (
                    <button
                      key={r}
                      className={`btn btn-sm ${existingSession.result === r ? "btn-primary" : "btn-outline"}`}
                      style={
                        existingSession.result === r
                          ? {
                              background: r === "W" ? "var(--green)" : r === "D" ? "var(--gold)" : "var(--red)",
                              borderColor: r === "W" ? "var(--green)" : r === "D" ? "var(--gold)" : "var(--red)",
                              color: "#fff",
                            }
                          : {}
                      }
                      onClick={() => logMatchResult(existingSession.matchId, r, selectedDay, selectedDateISO)}
                    >
                      {r === "W" ? "Win" : r === "D" ? "Draw" : "Loss"}
                    </button>
                  ))}
                  {existingSession.result && (
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>
                      <i
                        className={`ti ti-${existingSession.adminVerified ? "circle-check" : "clock"}`}
                        style={{ color: existingSession.adminVerified ? "var(--green)" : "var(--text3)" }}
                      ></i>
                      {existingSession.adminVerified ? "Verified by admin" : "Pending admin verification"}
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB: LINEUP */}
        {matchTab === "lineup" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--sp-md)", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>
                {matchPhase === "post" ? "Lineup submitted before the match." : "Set your starting XI, subs, and bench before the match."}
              </div>
              {existingSession?.matchId &&
                matchPhase !== "post" &&
                (() => {
                  const mySubmitted = existingSession.coachConfirmed;
                  const deadlinePassed = existingSession.lineupDeadline && new Date() >= new Date(existingSession.lineupDeadline);
                  return (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      {existingSession.lineupDeadline ? (
                        <div style={{ fontSize: 11, color: deadlinePassed ? "var(--red)" : "var(--gold)" }}>
                          <i className="ti ti-clock" style={{ marginRight: 4 }}></i>
                          Deadline:{" "}
                          {new Date(existingSession.lineupDeadline).toLocaleDateString("en-GB", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: "var(--text3)" }}>Deadline set to 24hrs before match once submitted</div>
                      )}
                      <button
                        className={`btn btn-sm ${mySubmitted ? "btn-outline" : "btn-primary"}`}
                        onClick={() => saveLineup(existingSession.matchId, lineup)}
                      >
                        <i className={`ti ti-${mySubmitted ? "refresh" : "send"}`}></i>{" "}
                        {mySubmitted ? "Update lineup" : "Submit lineup to opponent"}
                      </button>
                    </div>
                  );
                })()}
            </div>

            <LineupTable
              squadPlayers={squadPlayers}
              values={lineup}
              onChange={setPlayerField(setLineup)}
              locked={matchPhase === "post"}
            />
          </>
        )}

        {/* TAB: STATS */}
        {matchTab === "stats" && matchPhase !== "pre" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--sp-md)", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>Fill in player statistics after the match.</div>
              {existingSession?.matchId && (
                <button className="btn btn-primary btn-sm" onClick={() => savePostStats(existingSession.matchId, postStats)}>
                  <i className="ti ti-circle-check"></i> Save stats
                </button>
              )}
            </div>

            <StatsTable squadPlayers={squadPlayers} myStats={myStats} values={postStats} onChange={setPlayerField(setPostStats)} />

            {existingSession?.matchStatus === "confirmed" ? (
              <div style={{ marginTop: "var(--sp-lg)", paddingTop: "var(--sp-lg)", borderTop: "0.5px solid var(--border)" }}>
                <div
                  style={{
                    fontFamily: "var(--font)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--faith)",
                    marginBottom: 8,
                  }}
                >
                  {existingSession.opponent} lineup
                </div>
                <OpponentSquadList matchId={existingSession.matchId} coachId={s.userId} />
              </div>
            ) : (
              <div style={{ marginTop: "var(--sp-lg)", padding: "var(--sp-md)", background: "var(--bg2)", borderLeft: "2px solid var(--faith)" }}>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>
                  <i className="ti ti-clock" style={{ color: "var(--gold)", marginRight: 6 }}></i>
                  {existingSession?.matchStatus === "pending"
                    ? `Waiting for ${existingSession.opponent} to confirm. Opponent lineup visible once both coaches approve.`
                    : "Opponent lineup available once match is confirmed by both coaches."}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── NON-MATCH SESSION BUILDER ─────────────────────────────────
const DRILL_TYPES = [
  "Warm-up",
  "Technical drill",
  "Tactical shape",
  "Small-sided game",
  "Conditioning",
  "Cooldown",
  "Prayer & devotion",
];

const drillInputStyle = {
  padding: "8px 12px",
  background: "var(--bg)",
  border: "0.5px solid var(--border)",
  color: "var(--text)",
  fontSize: 13,
  width: "100%",
  outline: "none",
  fontFamily: "var(--font)",
};

// Drills for the session being edited. HF_COACH.saveSession() still reads
// window._sessionDrills, so keep it in sync with local state.
function DrillsEditor({ initialDrills }) {
  const [drills, setDrills] = useState(() => (initialDrills ? [...initialDrills] : []));
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("10");
  const [type, setType] = useState(DRILL_TYPES[0]);

  useEffect(() => {
    window._sessionDrills = drills;
  }, [drills]);

  const addDrill = () => {
    if (!name.trim()) return toast("Please enter a drill name.", "error");
    setDrills((ds) => [...ds, { name: name.trim(), duration: parseInt(duration), type }]);
    setName("");
    setDuration("10");
    toast("Drill added!", "success");
  };

  return (
    <>
      <div style={{ marginBottom: "var(--sp-md)" }}>
        {drills.length ? (
          drills.map((d, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)", padding: "8px var(--sp-md)", background: "var(--bg2)", borderLeft: "2px solid var(--gold)", marginBottom: 4 }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{d.name}</div>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>
                  {d.type} · {d.duration} min
                </div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => setDrills((ds) => ds.filter((_, j) => j !== i))}>
                <i className="ti ti-x"></i>
              </button>
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: 24, background: "var(--bg2)", border: "0.5px dashed var(--border)", color: "var(--text3)", fontSize: 13 }}>
            No drills yet! Add one below.
          </div>
        )}
      </div>

      <div style={{ background: "var(--bg2)", padding: "var(--sp-md)", borderLeft: "3px solid var(--border)", marginBottom: "var(--sp-lg)" }}>
        <div
          style={{
            fontFamily: "var(--font)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text2)",
            marginBottom: "var(--sp-sm)",
          }}
        >
          Add a drill
        </div>
        <div className="fg" style={{ marginBottom: "var(--sp-sm)" }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 4v4 rondo: possession under pressure"
            style={drillInputStyle}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-sm)", marginBottom: "var(--sp-sm)" }}>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="1"
            max="60"
            placeholder="Duration (min)"
            style={drillInputStyle}
          />
          <select value={type} onChange={(e) => setType(e.target.value)} style={drillInputStyle}>
            {DRILL_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-outline btn-sm" onClick={addDrill}>
          <i className="ti ti-plus"></i> Add drill
        </button>
      </div>
    </>
  );
}

function SessionBuilder({ effectiveType, existingSession, selectedDay, selectedDateISO, sessionSaved, isEditingSession, selectedType }) {
  const [plan, setPlan] = useState({
    name: existingSession?.name || "",
    category: existingSession?.category || effectiveType,
    intensity: existingSession?.intensity || "Medium",
    duration: existingSession?.duration || 90,
    intent: existingSession?.intent || "",
  });
  if (effectiveType && effectiveType !== "Match") {
    if (sessionSaved && !isEditingSession) {
      return (
        <div className="card" style={{ borderTop: `2px solid ${TYPE_COLORS[effectiveType]}` }}>
          <div className="card-title" style={{ justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
              <div className="card-dot" style={{ background: TYPE_COLORS[effectiveType] }}></div>
              Session plan · {DAYS[selectedDay]}
              <span
                style={{
                  fontFamily: "var(--font)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  background: `${TYPE_COLORS[effectiveType]}22`,
                  color: TYPE_COLORS[effectiveType],
                }}
              >
                {effectiveType}
              </span>
              <span
                style={{
                  fontFamily: "var(--font)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  background: "rgba(26,122,46,.15)",
                  color: "var(--green)",
                }}
              >
                <i className="ti ti-circle-check"></i> Saved & sent
              </span>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                window._editingSession = selectedDateISO;
                reRender();
              }}
            >
              <i className="ti ti-edit"></i> Update session
            </button>
          </div>

          <div style={{ padding: "var(--sp-md)", background: `${TYPE_COLORS[effectiveType]}11`, borderLeft: `3px solid ${TYPE_COLORS[effectiveType]}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: "var(--sp-sm)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{existingSession.name}</div>
              <span
                style={{
                  fontFamily: "var(--font)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  background: `${TYPE_COLORS[effectiveType]}22`,
                  color: TYPE_COLORS[effectiveType],
                }}
              >
                {existingSession.category || effectiveType}
              </span>
            </div>
            <div style={{ display: "flex", gap: "var(--sp-lg)", flexWrap: "wrap", fontSize: 12, color: "var(--text2)", marginBottom: existingSession.drills?.length ? "var(--sp-md)" : 0 }}>
              {existingSession.duration && (
                <span>
                  <i className="ti ti-clock" style={{ marginRight: 4 }}></i>
                  {existingSession.duration} min
                </span>
              )}
              {existingSession.intensity && (
                <span>
                  <i className="ti ti-gauge" style={{ marginRight: 4 }}></i>
                  {existingSession.intensity} intensity
                </span>
              )}
              {existingSession.intent && (
                <span>
                  <i className="ti ti-target" style={{ marginRight: 4 }}></i>
                  {existingSession.intent}
                </span>
              )}
            </div>
            {existingSession.drills?.length > 0 && (
              <div style={{ marginTop: "var(--sp-sm)" }}>
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
                  Drills
                </div>
                {existingSession.drills.map((d, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)", padding: "6px 0", borderBottom: "0.5px solid var(--border)" }}
                  >
                    <div style={{ width: 6, height: 6, background: TYPE_COLORS[effectiveType], flexShrink: 0 }}></div>
                    <span style={{ flex: 1, fontSize: 12, color: "var(--text)" }}>{d.name}</span>
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>
                      {d.type} · {d.duration}min
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="card">
        <div className="card-title" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
            <div className="card-dot"></div>Session plan · {DAYS[selectedDay]}
            <span
              style={{
                fontFamily: "var(--font)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "2px 8px",
                background: `${TYPE_COLORS[effectiveType]}22`,
                color: TYPE_COLORS[effectiveType],
              }}
            >
              {effectiveType}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-md)", marginBottom: "var(--sp-md)" }}>
          <div className="fg">
            <label className="required">Session name</label>
            <input
              type="text"
              value={plan.name} onChange={(e) => setPlan((f) => ({ ...f, name: e.target.value }))}
              
              placeholder="e.g. Tuesday technical block"
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
          <div className="fg">
            <label className="required">Category</label>
            <select
              value={plan.category} onChange={(e) => setPlan((f) => ({ ...f, category: e.target.value }))}
              
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
              <option>Technical</option>
              <option>Tactical</option>
              <option>Physical</option>
              <option>Recovery</option>
              <option>Match prep</option>
              <option>Faith & devotion</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-md)", marginBottom: "var(--sp-md)" }}>
          <div className="fg">
            <label>Intensity</label>
            <select
              value={plan.intensity} onChange={(e) => setPlan((f) => ({ ...f, intensity: e.target.value }))}
              
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
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          <div className="fg">
            <label>Duration (min)</label>
            <input
              type="number"
              value={plan.duration} onChange={(e) => setPlan((f) => ({ ...f, duration: e.target.value }))}
              
              min="15"
              max="180"
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
        </div>

        <div className="fg" style={{ marginBottom: "var(--sp-lg)" }}>
          <label>Coaching intent</label>
          <input
            type="text"
            value={plan.intent} onChange={(e) => setPlan((f) => ({ ...f, intent: e.target.value }))}
            
            placeholder="e.g. Focus on press triggers and compact shape"
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
          Drills
        </div>
        <DrillsEditor key={selectedDateISO} initialDrills={existingSession?.drills} />

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={() => saveSession(selectedDay, selectedDateISO, plan)}>
            <i className="ti ti-send"></i> {sessionSaved ? "Update and notify squad" : "Save and notify squad"}
          </button>
          {isEditingSession ? (
            <button
              className="btn btn-outline"
              onClick={() => {
                window._editingSession = null;
                reRender();
              }}
            >
              Cancel
            </button>
          ) : (
            <button
              className="btn btn-outline"
              onClick={() => clearDayType(selectedDay, selectedDateISO)}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  if (selectedType === "Rest") {
    return (
      <div className="card">
        <div style={{ textAlign: "center", padding: 24, color: "var(--text2)" }}>
          <i className="ti ti-moon" style={{ fontSize: 28, marginBottom: 8, display: "block", color: "var(--text3)" }}></i>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{DAYS[selectedDay]} is a rest day</div>
          <div style={{ fontSize: 13 }}>Change the session type above to plan a different session.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ textAlign: "center", padding: 24, color: "var(--text2)" }}>
        <i className="ti ti-calendar-plus" style={{ fontSize: 28, marginBottom: 8, display: "block", color: "var(--text3)" }}></i>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>No session set for {DAYS[selectedDay]}</div>
        <div style={{ fontSize: 13 }}>Select a session type above to start planning.</div>
      </div>
    </div>
  );
}

// ── INCOMING MATCH REQUEST CARD (bottom of page) ──────────────
function IncomingMatchCard({ opponentMatchRequest, squadPlayers, matchPhase }) {
  const [lineup, setLineup] = useState(() =>
    initialLineup(squadPlayers, opponentMatchRequest?.opponent_player_stats || {}),
  );
  if (!opponentMatchRequest) return null;
  const matchTab = window._matchTab || "lineup";

  return (
    <div className="card" style={{ borderTop: "2px solid var(--faith)" }}>
      <div className="card-title">
        <div className="card-dot" style={{ background: "var(--faith)" }}></div>
        Incoming match request
        <span
          style={{
            fontFamily: "var(--font)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "2px 8px",
            background: opponentMatchRequest.match_status === "confirmed" ? "rgba(26,122,46,.15)" : "rgba(196,154,10,.15)",
            color: opponentMatchRequest.match_status === "confirmed" ? "var(--green)" : "var(--gold)",
          }}
        >
          {opponentMatchRequest.match_status === "confirmed" ? "Confirmed" : "Pending your approval"}
        </span>
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--faith)", fontFamily: "var(--font)", marginBottom: "var(--sp-md)" }}>
        {opponentMatchRequest.coach?.profile?.club || opponentMatchRequest.coach?.name} vs {opponentMatchRequest.opponent}
      </div>

      <div style={{ display: "flex", gap: "var(--sp-lg)", flexWrap: "wrap", fontSize: 12, color: "var(--text2)", marginBottom: "var(--sp-lg)" }}>
        <span>
          <i className="ti ti-calendar" style={{ marginRight: 4 }}></i>
          {new Date(opponentMatchRequest.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </span>
        {opponentMatchRequest.location && (
          <span>
            <i className="ti ti-map-pin" style={{ marginRight: 4 }}></i>
            {opponentMatchRequest.location}
          </span>
        )}
      </div>

      {opponentMatchRequest.match_status === "pending" ? (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "var(--sp-md)" }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() =>
                approveMatchRequest(
                  opponentMatchRequest.id,
                  opponentMatchRequest.coach?.profile?.club || opponentMatchRequest.coach?.name,
                  true,
                )
              }
            >
              <i className="ti ti-circle-check"></i> Approve match
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() =>
                declineMatchRequest(
                  opponentMatchRequest.id,
                  opponentMatchRequest.coach_id,
                  (opponentMatchRequest.coach?.profile?.club || opponentMatchRequest.coach?.name || "").replace(/'/g, "\\'"),
                )
              }
            >
              <i className="ti ti-x"></i> Decline
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)" }}>
            <i className="ti ti-clock" style={{ marginRight: 4 }}></i>
            You have 24 hours to respond. No response = auto-decline.
          </div>
        </>
      ) : opponentMatchRequest.match_status === "confirmed" ? (
        <div style={{ marginBottom: "var(--sp-md)" }}>
          <div className="tab-toggle">
            <button
              className={matchTab === "lineup" ? "active" : ""}
              onClick={() => {
                window._matchTab = "lineup";
                reRender();
              }}
            >
              Lineup
            </button>
            {matchPhase !== "pre" && (
              <button
                className={matchTab === "stats" ? "active" : ""}
                onClick={() => {
                  window._matchTab = "stats";
                  reRender();
                }}
              >
                Stats
              </button>
            )}
          </div>

          {matchTab === "lineup" && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--sp-md)", flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>Set your lineup at least 24hrs before the match.</div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  {opponentMatchRequest.lineup_deadline && (
                    <div
                      style={{
                        fontSize: 11,
                        color: new Date() >= new Date(opponentMatchRequest.lineup_deadline) ? "var(--red)" : "var(--gold)",
                      }}
                    >
                      <i className="ti ti-clock" style={{ marginRight: 4 }}></i>
                      Deadline:{" "}
                      {new Date(opponentMatchRequest.lineup_deadline).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                  <button
                    className={`btn btn-sm ${opponentMatchRequest.opponent_lineup_submitted ? "btn-outline" : "btn-primary"}`}
                    onClick={() => saveOpponentLineup(opponentMatchRequest.id, lineup)}
                  >
                    <i className={`ti ti-${opponentMatchRequest.opponent_lineup_submitted ? "refresh" : "send"}`}></i>{" "}
                    {opponentMatchRequest.opponent_lineup_submitted ? "Update lineup" : "Submit lineup"}
                  </button>
                </div>
              </div>

              <LineupTable
                squadPlayers={squadPlayers}
                values={lineup}
                onChange={setPlayerField(setLineup)}
                locked={false}
              />
            </>
          )}

          {matchTab === "stats" && matchPhase !== "pre" && (
            <div style={{ fontSize: 12, color: "var(--text2)", padding: "var(--sp-md)", background: "var(--bg2)", borderLeft: "2px solid var(--faith)" }}>
              Post-match stats for your side will be available here after the match.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ── MAIN TRAINING VIEW ────────────────────────────────────────
function TrainingPlanner({
  session: s,
  pendingRequests,
  schedule,
  allSessions,
  squadPlayers,
  verifiedTeams,
  wdl,
  opponentMatchRequest,
  existingSession,
  myStats,
  incomingMatches,
}) {
  const view = window._coachTrainingView || "week";
  const selectedDay = window._coachTrainingSelectedDay ?? new Date().getDay();
  const selectedDateISO = window._coachTrainingSelectedDate || getDateForDayISO(selectedDay);
  const selectedType = schedule[selectedDateISO] || null;
  const effectiveType = selectedType === "Rest" ? null : selectedType;

  const incomingLockedDates = new Set([
    ...(pendingRequests || []).map((r) => r.date),
    ...(incomingMatches || []).filter((m) => ["pending", "confirmed"].includes(m.match_status)).map((m) => m.date),
  ]);

  const dayMatchLocked = existingSession?.matchId && ["pending", "confirmed"].includes(existingSession?.matchStatus);
  const lockedByIncoming =
    !existingSession?.matchId && opponentMatchRequest && ["pending", "confirmed"].includes(opponentMatchRequest.match_status);
  const incomingClub = opponentMatchRequest?.coach?.profile?.club || opponentMatchRequest?.coach?.name || "Another team";
  const incomingStatus = opponentMatchRequest?.match_status;

  const sessionSaved = !!(existingSession?.name && existingSession?.date === selectedDateISO);
  const isEditingSession = window._editingSession === selectedDateISO;

  const clubName = s.profile?.club || "Your team";
  const today = db.localDate();
  const isMatchDay = selectedDateISO === today;
  const isPostMatch = selectedDateISO < today;
  const matchPhase = isPostMatch ? "post" : isMatchDay ? "day" : "pre";

  const formLocked = window._matchSaved || (existingSession?.matchId && !window._editingMatchDetails);
  const opponentRequestPending = existingSession?.matchStatus === "pending" && existingSession?.opponentCoachId;
  const matchTab = window._matchTab || "details";
  window._matchTab = matchTab;

  const statusColor =
    existingSession?.matchStatus === "confirmed"
      ? "var(--green)"
      : existingSession?.matchStatus === "declined"
        ? "var(--red)"
        : existingSession?.matchStatus === "pending"
          ? "var(--gold)"
          : "var(--faith)";
  const statusLabel =
    existingSession?.matchStatus === "confirmed"
      ? "Confirmed"
      : existingSession?.matchStatus === "declined"
        ? "Declined"
        : existingSession?.matchStatus === "pending"
          ? "Pending"
          : "New";
  const phaseLabel = matchPhase === "pre" ? "Pre-match" : matchPhase === "day" ? "Match day" : "Post-match";

  return (
    <>
      <PendingRequestsCard pendingRequests={pendingRequests} session={s} />

      <div className="card">
        <div className="card-title" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
              <div className="card-dot"></div>Weekly plan
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--font)", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>
              {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })} · click a day to build its session
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {["day", "week", "month"].map((v) => (
              <button
                key={v}
                className={`btn btn-sm ${view === v ? "btn-primary" : "btn-outline"}`}
                onClick={() => {
                  window._coachTrainingView = v;
                  window._coachTrainingSelectedDate = null;
                  reRender();
                }}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "0 0 var(--sp-sm) 0" }}>
          {view === "month" ? (
            <MonthView schedule={schedule} selectedDateISO={selectedDateISO} allSessions={allSessions} incomingLockedDates={incomingLockedDates} />
          ) : view === "day" ? (
            <DayView schedule={schedule} selectedDateISO={selectedDateISO} allSessions={allSessions} selectedDay={selectedDay} />
          ) : (
            <WeekView schedule={schedule} selectedDateISO={selectedDateISO} allSessions={allSessions} incomingLockedDates={incomingLockedDates} />
          )}
        </div>

        <TypePicker
          dayMatchLocked={dayMatchLocked}
          lockedByIncoming={lockedByIncoming}
          incomingClub={incomingClub}
          incomingStatus={incomingStatus}
          existingSession={existingSession}
          selectedDay={selectedDay}
          selectedDateISO={selectedDateISO}
          sessionSaved={sessionSaved}
          isEditingSession={isEditingSession}
          selectedType={selectedType}
        />

        <div style={{ background: "var(--bg2)", padding: "var(--sp-sm) var(--sp-md)" }}>
          <div style={{ display: "flex", gap: "var(--sp-md)", flexWrap: "wrap" }}>
            {TYPES.map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text2)" }}>
                <div style={{ width: 8, height: 8, background: TYPE_COLORS[t] }}></div>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {effectiveType === "Match" ? (
        <MatchForm
          session={s}
          selectedDay={selectedDay}
          selectedDateISO={selectedDateISO}
          wdl={wdl}
          clubName={clubName}
          existingSession={existingSession}
          verifiedTeams={verifiedTeams}
          matchTab={matchTab}
          matchPhase={matchPhase}
          phaseLabel={phaseLabel}
          statusColor={statusColor}
          statusLabel={statusLabel}
          formLocked={formLocked}
          opponentRequestPending={opponentRequestPending}
          squadPlayers={squadPlayers}
          myStats={myStats}
        />
      ) : (
        <SessionBuilder
          effectiveType={effectiveType}
          existingSession={existingSession}
          selectedDay={selectedDay}
          selectedDateISO={selectedDateISO}
          sessionSaved={sessionSaved}
          isEditingSession={isEditingSession}
          selectedType={selectedType}
        />
      )}

      <IncomingMatchCard opponentMatchRequest={opponentMatchRequest} squadPlayers={squadPlayers} matchPhase={matchPhase} />
    </>
  );
}

// Sessions are built for squad players, so there's nothing to plan until
// the squad has players.
export default function CoachTraining(props) {
  if (!props.squadPlayers?.length) {
    return (
      <div className="card">
        <div style={{ textAlign: "center", padding: 32, color: "var(--text2)" }}>
          <i className="ti ti-clipboard-list" style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--text3)" }}></i>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>No players yet</div>
          <div style={{ fontSize: 13 }}>Invite players to your squad to start building sessions.</div>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => navTo("squad")}>
            <i className="ti ti-users"></i> Go to squad
          </button>
        </div>
      </div>
    );
  }
  return <TrainingPlanner {...props} />;
}
