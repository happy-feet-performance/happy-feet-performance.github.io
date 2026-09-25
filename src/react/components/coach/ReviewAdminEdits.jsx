export default function CoachReviewAdminEdits({ data }) {
  return (
    <div className="card">
      <div className="card-title">
        <div className="card-dot"></div>Review admin changes
      </div>
      <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: "var(--sp-lg)" }}>
        An admin has reviewed your squad registration and proposed the following changes. Please
        review and accept or decline.
      </div>

      {data.admin_notes && (
        <div
          style={{
            padding: 12,
            background: "rgba(24,95,165,.06)",
            borderLeft: "2px solid var(--blue)",
            marginBottom: "var(--sp-lg)",
            fontSize: 13,
            color: "var(--text2)",
          }}
        >
          <strong style={{ color: "var(--text)" }}>Admin note:</strong> {data.admin_notes}
        </div>
      )}

      <div className="table-wrap">
        <table className="table" style={{ marginBottom: "var(--sp-lg)" }}>
          <thead>
            <tr>
              <th>Field</th>
              <th>Your submission</th>
              <th>Admin's version</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600 }}>Team name</td>
              <td>{data.team_name}</td>
              <td
                style={{
                  color:
                    data.edited_team_name && data.edited_team_name !== data.team_name
                      ? "var(--gold)"
                      : "var(--text2)",
                }}
              >
                {data.edited_team_name || data.team_name}
                {data.edited_team_name && data.edited_team_name !== data.team_name && (
                  <i className="ti ti-edit" style={{ marginLeft: 4 }}></i>
                )}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>League</td>
              <td>{data.league}</td>
              <td
                style={{
                  color:
                    data.edited_league && data.edited_league !== data.league
                      ? "var(--gold)"
                      : "var(--text2)",
                }}
              >
                {data.edited_league || data.league}
                {data.edited_league && data.edited_league !== data.league && (
                  <i className="ti ti-edit" style={{ marginLeft: 4 }}></i>
                )}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Founding year</td>
              <td>{data.founding_year || "-"}</td>
              <td>{data.edited_founding_year || data.founding_year || "-"}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Home ground</td>
              <td>{data.home_ground || "-"}</td>
              <td>{data.edited_home_ground || data.home_ground || "-"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn btn-primary"
          onClick={() => window.HF_COACH.acceptAdminEdits(data.id)}
        >
          <i className="ti ti-circle-check"></i> Accept changes
        </button>
        <button
          className="btn btn-danger"
          onClick={() => window.HF_COACH.declineAdminEdits(data.id)}
        >
          <i className="ti ti-x"></i> Decline & resubmit
        </button>
      </div>
    </div>
  );
}
