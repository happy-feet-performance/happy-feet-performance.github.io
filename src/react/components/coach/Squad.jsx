import { Fragment } from "react";
import { initials, timeAgo } from "../../../lib/utils.js";
import { messageUser } from "../../../lib/roleUtils.js";

function TrialRequests({ trialRequests }) {
  if (!trialRequests || trialRequests.length === 0) return null;
  return (
    <div className="card">
      <div className="card-title" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
          <div className="card-dot"></div>Trial requests
          <span
            style={{
              fontFamily: "var(--font)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "2px 6px",
              background: "rgba(196,154,10,.15)",
              color: "var(--gold)",
            }}
          >
            {trialRequests.length} pending
          </span>
        </div>
      </div>
      {trialRequests.map((req) => {
        const rp = req.player?.profile || {};
        const safeName = (req.player?.name || "").replace(/'/g, "\\'");
        return (
          <div
            key={req.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-md)",
              padding: "var(--sp-md)",
              background: "var(--bg2)",
              borderLeft: "2px solid var(--gold)",
              marginBottom: "var(--sp-sm)",
            }}
          >
            <div className="avatar avatar-md" style={{ background: "var(--green)" }}>
              {initials(req.player?.name || "?")}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                {req.player?.name || "-"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>
                {rp.pos || "-"} · {rp.tier || "-"} · {rp.hometown || "-"}
              </div>
              <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>
                {timeAgo(req.created_at)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() =>
                  window.HF_COACH.acceptTrialRequest(req.id, req.player_id, safeName)
                }
              >
                <i className="ti ti-circle-check"></i> Accept to trial
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() =>
                  window.HF_COACH.declineTrialRequest(req.id, req.player_id, safeName)
                }
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

function NetworkRequests({ networkRequests }) {
  if (!networkRequests || networkRequests.length === 0) return null;
  return (
    <div className="card">
      <div className="card-title" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
          <div className="card-dot"></div>Scout network requests
          <span
            style={{
              fontFamily: "var(--font)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "2px 6px",
              background: "rgba(196,154,10,.15)",
              color: "var(--gold)",
            }}
          >
            {networkRequests.length} pending
          </span>
        </div>
      </div>
      {networkRequests.map((req) => {
        const rp = req.scout?.profile || {};
        const safeName = (req.scout?.name || "").replace(/'/g, "\\'");
        return (
          <div
            key={req.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-md)",
              padding: "var(--sp-md)",
              background: "var(--bg2)",
              borderLeft: "2px solid var(--blue)",
              marginBottom: "var(--sp-sm)",
            }}
          >
            <div className="avatar avatar-md" style={{ background: "var(--blue)" }}>
              {initials(req.scout?.name || "?")}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                {req.scout?.name || "-"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>
                {rp.org || "Scout"} · {rp.region || "-"}
              </div>
              <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>
                {timeAgo(req.created_at)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() =>
                  window.HF_COACH.approveNetworkRequest(req.id, req.scout_id, safeName)
                }
              >
                <i className="ti ti-circle-check"></i> Approve
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() =>
                  window.HF_COACH.declineNetworkRequest(req.id, req.scout_id, safeName)
                }
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

function TrialPlayers({ trialPlayers }) {
  if (!trialPlayers || trialPlayers.length === 0) return null;
  return (
    <div className="card">
      <div className="card-title" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
          <div className="card-dot"></div>On trial
          <span
            style={{
              fontFamily: "var(--font)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "2px 6px",
              background: "rgba(26,122,46,.15)",
              color: "var(--green)",
            }}
          >
            {trialPlayers.length} players
          </span>
        </div>
      </div>
      {trialPlayers.map((req) => {
        const rp = req.player?.profile || {};
        const safeName = (req.player?.name || "").replace(/'/g, "\\'");
        return (
          <div
            key={req.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-md)",
              padding: "var(--sp-md)",
              background: "var(--bg2)",
              borderLeft: "2px solid var(--green)",
              marginBottom: "var(--sp-sm)",
            }}
          >
            <div className="avatar avatar-md" style={{ background: "var(--green)" }}>
              {initials(req.player?.name || "?")}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                {req.player?.name || "-"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>
                {rp.pos || "-"} · {rp.tier || "-"} · {rp.hometown || "-"}
              </div>
              <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>
                On trial since {timeAgo(req.responded_at)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() =>
                  window.HF_COACH.approveTrialPlayer(req.id, req.player_id, safeName)
                }
              >
                <i className="ti ti-user-plus"></i> Add to squad
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() =>
                  window.HF_COACH.removeTrialPlayer(req.id, req.player_id, safeName)
                }
              >
                <i className="ti ti-x"></i> Remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CoachSquad({
  session: s,
  squadPlayers,
  trialRequests,
  trialPlayers,
  networkRequests,
}) {
  const isVerified = s.squadStatus === "verified";
  const p = s.profile || {};

  if (!isVerified) {
    return (
      <>
        <TrialRequests trialRequests={trialRequests} />
        <NetworkRequests networkRequests={networkRequests} />
        <TrialPlayers trialPlayers={trialPlayers} />
        <div className="card">
          <div style={{ textAlign: "center", padding: 32, color: "var(--text2)" }}>
            <i
              className="ti ti-lock"
              style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--text3)" }}
            ></i>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
              Squad locked
            </div>
            <div style={{ fontSize: 13 }}>
              Register and verify your squad to start adding players.
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: 16 }}
              onClick={() => window.HF_COACH.resubmitSquad()}
            >
              <i className="ti ti-clipboard-check"></i> Register your squad
            </button>
          </div>
        </div>
      </>
    );
  }

  const hasPlayers = squadPlayers?.length > 0;

  return (
    <>
      <TrialRequests trialRequests={trialRequests} />
      <NetworkRequests networkRequests={networkRequests} />
      <TrialPlayers trialPlayers={trialPlayers} />

      <div className="card">
        <div
          className="card-title"
          style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
            <div className="card-dot"></div>Squad roster: {p.club || "Your club"}
            <span style={{ fontFamily: "var(--font)", fontSize: 10, color: "var(--text3)", marginLeft: 4 }}>
              {squadPlayers?.length || 0} players
            </span>
          </div>
          <div id="squad-wdl"></div>
        </div>

        <div
          id="invite-panel"
          style={{
            display: "none",
            marginBottom: "var(--sp-lg)",
            padding: "var(--sp-md)",
            background: "var(--bg2)",
            borderLeft: "2px solid var(--gold)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--gold)",
              marginBottom: 8,
            }}
          >
            Invite a player
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              id="player-search-input"
              placeholder="Search by name or email..."
              style={{
                flex: 1,
                padding: "8px 12px",
                background: "var(--bg)",
                border: "0.5px solid var(--border)",
                color: "var(--text)",
                fontSize: 13,
                fontFamily: "var(--font)",
                outline: "none",
              }}
              onInput={(e) => window.HF_COACH.searchPlayers(e.target.value)}
            />
            <button
              className="btn btn-outline btn-sm"
              onClick={() => window.HF_COACH.showInvitePanel()}
            >
              <i className="ti ti-x"></i>
            </button>
          </div>
          <div id="player-search-results" style={{ marginTop: 8 }}></div>
        </div>

        {!hasPlayers ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text2)" }}>
            <i
              className="ti ti-users"
              style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--text3)" }}
            ></i>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
              No players yet
            </div>
            <div style={{ fontSize: 13 }}>Invite players to your squad in Find my team.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>Jersey</th>
                  <th>Player</th>
                  <th>Position</th>
                  <th>Tier</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th style={{ width: 24 }}></th>
                </tr>
              </thead>
              <tbody>
                {squadPlayers.map((sp) => {
                  const rp = sp.player?.profile || {};
                  const name = sp.player?.name || "Unknown";
                  const safeName = name.replace(/'/g, "\\'");
                  const overall = rp.ratings
                    ? Math.round(
                        (rp.ratings.speed + rp.ratings.tech + rp.ratings.tact + rp.ratings.phys) / 4,
                      )
                    : null;
                  return (
                    <Fragment key={sp.player_id}>
                      <tr
                        style={{ cursor: "pointer", transition: "background 0.1s" }}
                        onClick={() => window.HF_COACH.togglePlayerActions(sp.player_id)}
                      >
                        <td style={{ fontWeight: 700, color: "var(--gold)", fontSize: 13, fontFamily: "var(--font)" }}>
                          {sp.jersey_number ? "#" + sp.jersey_number : "-"}
                        </td>
                        <td style={{ fontWeight: 600 }}>{name}</td>
                        <td>{rp.pos || "-"}</td>
                        <td>{rp.tier || "-"}</td>
                        <td>
                          <span
                            style={{
                              fontSize: 10,
                              padding: "1px 7px",
                              fontWeight: 600,
                              background: rp.status === "signed" ? "rgba(26,122,46,.1)" : "rgba(196,154,10,.1)",
                              color: rp.status === "signed" ? "var(--green)" : "var(--gold)",
                            }}
                          >
                            {rp.status === "signed" ? "Signed" : "Unattached"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: overall ? "var(--gold)" : "var(--text3)" }}>
                          {overall !== null ? overall + "%" : "-"}
                        </td>
                        <td>
                          <i
                            className="ti ti-chevron-down"
                            id={`chevron-${sp.player_id}`}
                            style={{ fontSize: 12, color: "var(--text3)" }}
                          ></i>
                        </td>
                      </tr>
                      <tr
                        id={`actions-${sp.player_id}`}
                        style={{ display: "none", background: "var(--bg2)" }}
                      >
                        <td colSpan={7} style={{ padding: "var(--sp-md)" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "var(--sp-lg)",
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <label
                                style={{
                                  fontFamily: "var(--font)",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  letterSpacing: "0.08em",
                                  textTransform: "uppercase",
                                  color: "var(--text2)",
                                }}
                              >
                                Jersey
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="99"
                                id={`jersey-input-${sp.player_id}`}
                                defaultValue={sp.jersey_number || ""}
                                placeholder="1–99"
                                style={{
                                  width: 56,
                                  padding: "5px 8px",
                                  background: "var(--bg)",
                                  border: "0.5px solid var(--border)",
                                  color: "var(--gold)",
                                  fontSize: 13,
                                  fontWeight: 700,
                                  fontFamily: "var(--font)",
                                  textAlign: "center",
                                  outline: "none",
                                  boxSizing: "border-box",
                                }}
                              />
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.HF_COACH.saveJerseyNumber(sp.player_id, safeName);
                                }}
                              >
                                <i className="ti ti-circle-check"></i> Assign
                              </button>
                            </div>

                            <div style={{ height: 24, width: 0.5, background: "var(--border)" }}></div>

                            <button
                              className="btn btn-outline btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.HF_COACH.trackPlayer(sp.player_id, safeName);
                              }}
                            >
                              <i className="ti ti-chart-line"></i> View stats
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                messageUser(sp.player_id, safeName, "squad", "coach");
                              }}
                            >
                              <i className="ti ti-message"></i> Message
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.HF_COACH.confirmKickPlayer(sp.player_id, safeName);
                              }}
                            >
                              <i className="ti ti-logout"></i> Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
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
