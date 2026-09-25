function RatingSlider({ label }) {
  const key = label.toLowerCase();
  return (
    <div className="bar-row">
      <div className="bar-head">
        <span>{label}</span>
        <span id={`cv-${key}`} style={{ color: "var(--gold)", fontWeight: 600 }}>
          7
        </span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        defaultValue="7"
        step="1"
        style={{ width: "100%", accentColor: "var(--gold)", marginTop: 4 }}
        onInput={(e) => {
          const el = document.getElementById(`cv-${key}`);
          if (el) el.textContent = e.target.value;
        }}
      />
    </div>
  );
}

export default function CoachTracking({ squadPlayers, recentRatings }) {
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
            onClick={() => window.HF_ROUTER.navTo("squad")}
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
            <select id="tr-player" onChange={() => window.HF_COACH.checkExistingRating()}>
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
            <select id="tr-type" onChange={() => window.HF_COACH.checkExistingRating()}>
              <option value="">Select type</option>
              <option>Technical</option>
              <option>Tactical</option>
              <option>Physical</option>
              <option>Recovery</option>
              <option>Match</option>
            </select>
          </div>
        </div>
        {["Speed", "Technical", "Tactical", "Physical"].map((l) => (
          <RatingSlider key={l} label={l} />
        ))}
        <div className="fg" style={{ marginTop: 8 }}>
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
          id="tr-save-btn"
          className="btn btn-primary"
          style={{ marginTop: 8 }}
          onClick={() => window.HF_COACH.logSessionRating()}
        >
          <i className="ti ti-circle-check"></i> Save rating
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
