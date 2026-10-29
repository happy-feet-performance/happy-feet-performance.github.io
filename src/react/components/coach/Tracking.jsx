import { useEffect, useState } from "react";
import { hasRatingToday, logSessionRating } from "../../../lib/coach.js";
import { navTo } from "../../../lib/router.js";

function RatingSlider({ label, value, onChange }) {
  return (
    <div className="bar-row">
      <div className="bar-head">
        <span>{label}</span>
        <span style={{ color: "var(--gold)", fontWeight: 600 }}>{value}</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        step="1"
        style={{ width: "100%", accentColor: "var(--gold)", marginTop: 4 }}
      />
    </div>
  );
}

export default function CoachTracking({ squadPlayers, recentRatings }) {
  const [playerId, setPlayerId] = useState("");
  const [sessionType, setSessionType] = useState("");
  const [notes, setNotes] = useState("");
  const [ratings, setRatings] = useState({ speed: 7, technical: 7, tactical: 7, physical: 7 });
  // whether the chosen player already has a rating today (then Save updates it)
  const [existing, setExisting] = useState(false);

  useEffect(() => {
    let current = true;
    setExisting(false);
    if (playerId) hasRatingToday(playerId).then((has) => current && setExisting(has));
    return () => {
      current = false;
    };
  }, [playerId]);

  if (!squadPlayers || squadPlayers.length === 0) {
    return (
      <div className="card">
        <div style={{ textAlign: "center", padding: 32, color: "var(--text2)" }}>
          <i
            className="ti ti-chart-line"
            style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--text3)" }}
          ></i>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
            No players to track
          </div>
          <div style={{ fontSize: 13 }}>
            Invite players to your squad to start tracking their performance.
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginTop: 16 }}
            onClick={() => navTo("squad")}
          >
            <i className="ti ti-users"></i> Go to squad
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="card-title">
          <div className="card-dot"></div>Log a session rating
        </div>
        <div className="form-row">
          <div className="fg">
            <label className="required">Player</label>
            <select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
              <option value="">Select player</option>
              {squadPlayers.map((sp) => (
                <option key={sp.player_id} value={sp.player_id}>
                  {sp.player?.name || "Unknown"}
                </option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label className="required">Session type</label>
            <select value={sessionType} onChange={(e) => setSessionType(e.target.value)}>
              <option value="">Select type</option>
              <option>Technical</option>
              <option>Tactical</option>
              <option>Physical</option>
              <option>Recovery</option>
              <option>Match</option>
            </select>
          </div>
        </div>
        {["Speed", "Technical", "Tactical", "Physical"].map((l) => {
          const key = l.toLowerCase();
          return (
            <RatingSlider key={l} label={l} value={ratings[key]} onChange={(v) => setRatings((r) => ({ ...r, [key]: v }))} />
          );
        })}
        <div className="fg" style={{ marginTop: 8 }}>
          <label>Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
          style={{ marginTop: 8 }}
          onClick={() =>
            logSessionRating({
              playerId,
              playerName: squadPlayers.find((sp) => sp.player_id === playerId)?.player?.name || "Player",
              sessionType,
              notes,
              ratings,
            })
          }
        >
          {existing ? (
            <>
              <i className="ti ti-refresh"></i> Update rating
            </>
          ) : (
            <>
              <i className="ti ti-circle-check"></i> Save rating
            </>
          )}
        </button>
      </div>

      <div className="card">
        <div className="card-title">
          <div className="card-dot"></div>Recent session ratings
        </div>
        {!recentRatings || recentRatings.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text2)", fontSize: 13 }}>
            No ratings logged yet.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Type</th>
                  <th>Overall</th>
                  <th>Notes</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentRatings.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.player?.name || "-"}</td>
                    <td>{r.session_type}</td>
                    <td
                      style={{
                        fontWeight: 700,
                        color: r.overall >= 80 ? "var(--green)" : r.overall >= 65 ? "var(--gold)" : "var(--red)",
                      }}
                    >
                      {r.overall}/100
                    </td>
                    <td style={{ color: "var(--text2)", fontSize: 11 }}>
                      {r.notes && r.notes !== "null" ? r.notes : "None"}
                    </td>
                    <td style={{ color: "var(--text2)" }}>
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </td>
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
