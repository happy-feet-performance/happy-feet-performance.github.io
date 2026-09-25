import VerificationRow from "./VerificationRow.jsx";

export default function Dashboard({
  session,
  pending,
  agencyPending,
  pendingCount,
  totalUsers,
  verifiedAgencyCount,
  verifiedSquadCount,
}) {
  return (
    <>
      <div
        style={{
          background: "#0f0f0d",
          padding: "var(--sp-2xl)",
          marginBottom: "var(--sp-lg)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--sp-lg)",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font)",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "#fff",
            }}
          >
            Admin Dashboard
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 3 }}>
            HappyFeet Platform Management
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--gold)" }}>
            {pendingCount}
          </div>
          <div className="metric-label">Pending verifications</div>
          <div className="metric-sub" style={{ color: "var(--text2)" }}>
            Awaiting review
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--blue)" }}>
            {totalUsers}
          </div>
          <div className="metric-label">Total users</div>
          <div className="metric-sub" style={{ color: "var(--text2)" }}>
            All roles
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--green)" }}>
            {verifiedAgencyCount}
          </div>
          <div className="metric-label">Verified agencies</div>
          <div className="metric-sub" style={{ color: "var(--text2)" }}>
            Total approved
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--green)" }}>
            {verifiedSquadCount}
          </div>
          <div className="metric-label">Verified squads</div>
          <div className="metric-sub" style={{ color: "var(--text2)" }}>
            Total approved
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <div className="card-dot"></div>Pending verifications
        </div>
        {pendingCount === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text2)" }}>
            <i
              className="ti ti-circle-check"
              style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--green)" }}
            ></i>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
              All caught up
            </div>
            <div style={{ fontSize: 13 }}>No pending verifications at this time.</div>
          </div>
        ) : (
          <>
            {pending?.length > 0 && (
              <>
                <div
                  style={{
                    fontFamily: "var(--font)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text2)",
                    marginBottom: 8,
                  }}
                >
                  Squads
                </div>
                {pending.map((v) => (
                  <VerificationRow key={v.id} v={v} type="squad" session={session} />
                ))}
              </>
            )}
            {agencyPending?.length > 0 && (
              <>
                <div
                  style={{
                    fontFamily: "var(--font)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text2)",
                    margin: "12px 0 8px",
                  }}
                >
                  Agencies
                </div>
                {agencyPending.map((v) => (
                  <VerificationRow key={v.id} v={v} type="agency" session={session} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
