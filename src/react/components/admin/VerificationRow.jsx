import { timeAgo } from "../../../lib/utils.js";
import { Badge } from "../shared/index.js";

const inputStyle = {
  padding: "8px 12px",
  background: "var(--bg2)",
  border: "0.5px solid var(--border)",
  color: "var(--text)",
  fontSize: 13,
  width: "100%",
  outline: "none",
  fontFamily: "var(--font)",
};

// Shared row used by both the admin dashboard's "pending verifications"
// list and the full squad/agency verifications view.
export default function VerificationRow({ v, type, session }) {
  const isSquad = type === "squad";
  const name = isSquad ? v.team_name : v.agency_name;
  const subInfo = isSquad
    ? `${v.league || "-"} · ${v.home_ground || "-"} · Founded ${v.founding_year || "-"}`
    : `Regions: ${Array.isArray(v.regions_covered) ? v.regions_covered.join(", ") : "-"}`;
  const color = isSquad ? "var(--gold)" : "var(--blue)";
  const userId = isSquad ? v.coach_id : v.scout_id;
  const isMine = v.claimed_by === session.userId;
  const isClaimed = v.claimed_by && !isMine;

  return (
    <div
      style={{
        padding: "var(--sp-md)",
        background: "var(--bg2)",
        borderLeft: `2px solid ${isMine ? "var(--gold)" : isClaimed ? "var(--border)" : color}`,
        marginBottom: "var(--sp-sm)",
        opacity: isClaimed ? 0.6 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{name}</div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{subInfo}</div>
          {v.website && (
            <div style={{ fontSize: 11, color: "var(--blue)", marginTop: 2 }}>{v.website}</div>
          )}
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
            Submitted {timeAgo(v.submitted_at)}
          </div>
          {isClaimed && (
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
              <i className="ti ti-lock" style={{ marginRight: 4 }}></i>
              Being reviewed by {v.claimer?.name || "another admin"}
            </div>
          )}
          {isMine && (
            <div style={{ fontSize: 11, color: "var(--gold)", marginTop: 4 }}>
              <i className="ti ti-user" style={{ marginRight: 4 }}></i>
              Claimed by you
            </div>
          )}
        </div>
        <Badge type={isClaimed ? "gold" : isSquad ? "gold" : "blue"}>
          {isClaimed ? "In review" : "Pending"}
        </Badge>
      </div>

      {isMine && isSquad && (
        <div
          id={`edit-form-${v.id}`}
          style={{
            display: "none",
            marginBottom: 12,
            padding: 12,
            background: "var(--bg)",
            border: "0.5px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text2)",
              marginBottom: 8,
            }}
          >
            Edit verification details
          </div>
          <div className="fg">
            <label>Team name</label>
            <input type="text" id={`edit-name-${v.id}`} defaultValue={v.team_name} style={inputStyle} />
          </div>
          <div className="fg">
            <label>League / division</label>
            <input
              type="text"
              id={`edit-league-${v.id}`}
              defaultValue={v.league || ""}
              style={inputStyle}
            />
          </div>
          <div className="form-row">
            <div className="fg">
              <label>Founding year</label>
              <input
                type="number"
                id={`edit-year-${v.id}`}
                defaultValue={v.founding_year || ""}
                style={inputStyle}
              />
            </div>
            <div className="fg">
              <label>Home ground</label>
              <input
                type="text"
                id={`edit-ground-${v.id}`}
                defaultValue={v.home_ground || ""}
                style={inputStyle}
              />
            </div>
          </div>
          <div className="fg">
            <label>Admin notes to coach</label>
            <input
              type="text"
              id={`edit-notes-${v.id}`}
              placeholder="e.g. Team name corrected"
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => window.HF_ADMIN.saveEdits(v.id, userId, name)}
            >
              <i className="ti ti-circle-check"></i> Save &amp; notify
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => window.HF_ADMIN.toggleEditForm(v.id)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        {!isClaimed && !isMine && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => window.HF_ADMIN.claimAndReview(v.id, type)}
          >
            <i className="ti ti-eye"></i> Claim &amp; review
          </button>
        )}
        {isMine && (
          <>
            <button
              className="btn btn-primary btn-sm"
              onClick={() =>
                isSquad
                  ? window.HF_ADMIN.approveSquad(v.id, userId, name)
                  : window.HF_ADMIN.approveAgency(v.id, userId, name)
              }
            >
              <i className="ti ti-circle-check"></i> Approve
            </button>
            {isSquad && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => window.HF_ADMIN.toggleEditForm(v.id)}
              >
                <i className="ti ti-edit"></i> Edit
              </button>
            )}
            <button
              className="btn btn-danger btn-sm"
              onClick={() =>
                isSquad
                  ? window.HF_ADMIN.rejectSquad(v.id, userId, name)
                  : window.HF_ADMIN.rejectAgency(v.id, userId, name)
              }
            >
              <i className="ti ti-x"></i> Reject
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => window.HF_ADMIN.unclaimVerification(v.id, type)}
            >
              <i className="ti ti-x"></i> Release
            </button>
          </>
        )}
      </div>
    </div>
  );
}
