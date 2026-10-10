import { useState } from "react";
import { initials } from "../../../lib/utils.js";
import { invitePlayer, messageScout, toggleRecruitment } from "../../../lib/coach.js";

const POSITIONS = ["GK", "CB", "LB", "RB", "DM", "CM", "CAM", "LW", "RW", "ST"];
const TIERS = ["U10", "U12", "U14", "U16", "U18", "U21", "Professional"];
const DAY_MS = 24 * 60 * 60 * 1000;

const filterStyle = {
  padding: "7px 10px",
  background: "var(--bg2)",
  border: "0.5px solid var(--border)",
  color: "var(--text)",
  fontSize: 12,
  fontFamily: "var(--font)",
  outline: "none",
};

const tagStyle = {
  fontSize: 10,
  fontWeight: 700,
  padding: "1px 6px",
  background: "var(--bg)",
  border: "0.5px solid var(--border)",
  color: "var(--text2)",
};

// One unattached player. The invite button shows when the squad is verified
// and open for recruitment; a declined invite can be resent after 24h.
function PlayerCard({ p, canInvite, isInvited, declinedAt }) {
  const prof = p.profile || {};
  const r = prof.ratings;
  const overall = r ? Math.round((r.speed + r.tech + r.tact + r.phys) / 4) : null;
  const waiting = !!declinedAt && Date.now() - new Date(declinedAt).getTime() <= DAY_MS;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-md)",
        padding: "var(--sp-md)",
        background: "var(--bg2)",
        borderLeft: `3px solid ${overall && overall >= 75 ? "var(--gold)" : "var(--border)"}`,
        marginBottom: "var(--sp-sm)",
      }}
    >
      <div className="avatar avatar-md" style={{ background: "var(--green)", flexShrink: 0 }}>
        {initials(p.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{p.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
          {prof.pos && <span style={tagStyle}>{prof.pos}</span>}
          {prof.tier && <span style={tagStyle}>{prof.tier}</span>}
          {prof.hometown && <span style={{ fontSize: 10, color: "var(--text3)" }}>{prof.hometown}</span>}
        </div>
        {overall !== null ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <div style={{ flex: 1, height: 3, background: "var(--border)" }}>
              <div
                style={{
                  height: "100%",
                  width: `${overall}%`,
                  background: overall >= 75 ? "var(--gold)" : overall >= 60 ? "var(--blue)" : "var(--text3)",
                }}
              ></div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: overall >= 75 ? "var(--gold)" : "var(--text2)" }}>
              {overall}%
            </span>
          </div>
        ) : (
          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4 }}>Not yet rated</div>
        )}
      </div>
      {canInvite && (
        <button
          className={`btn ${isInvited ? "btn-outline" : waiting ? "btn-danger" : "btn-primary"} btn-sm`}
          style={{
            flexShrink: 0,
            width: 100,
            justifyContent: "center",
            whiteSpace: "nowrap",
            ...(waiting || isInvited ? { cursor: "not-allowed" } : {}),
          }}
          disabled={waiting || isInvited}
          onClick={() => invitePlayer(p.id, p.name)}
        >
          <i className={`ti ti-${isInvited || waiting ? "clock" : "send"}`}></i>{" "}
          {isInvited ? "Invited" : waiting ? "24h wait" : "Invite"}
        </button>
      )}
    </div>
  );
}

export default function CoachFindMyTeam({
  session: s,
  players,
  neededPositions,
  prospects,
  invitedIds,
  declinedAt,
}) {
  const p = s.profile || {};
  const isVerified = s.squadStatus === "verified";
  const [pos, setPos] = useState("");
  const [tier, setTier] = useState("");
  const [search, setSearch] = useState("");

  const filtered = (players || []).filter((pl) => {
    const prof = pl.profile || {};
    return (
      (!pos || prof.pos === pos) &&
      (!tier || prof.tier === tier) &&
      (!search || pl.name.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <>
      <div className="welcome-banner">
        <div>
          <div className="welcome-title">Find my team</div>
          <div className="welcome-sub">Browse players and scout recommendations</div>
        </div>
      </div>

      {isVerified ? (
        <div className="card">
          <div className="card-title" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
              <div className="card-dot"></div>Recruitment status
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", margin: 0 }}>
              <span style={{ fontSize: 12, color: "var(--text2)", whiteSpace: "nowrap" }}>
                Open for recruitment
              </span>
              <input
                type="checkbox"
                id="recruitment-toggle"
                defaultChecked={!!p.openForRecruitment}
                onChange={(e) => toggleRecruitment(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "var(--gold)", cursor: "pointer", flexShrink: 0 }}
              />
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-md)" }}>
            <div
              style={{
                padding: "var(--sp-md)",
                background: "var(--bg2)",
                borderLeft: `3px solid ${p.openForRecruitment ? "var(--green)" : "var(--border)"}`,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: p.openForRecruitment ? "var(--green)" : "var(--text2)",
                  marginBottom: 4,
                }}
              >
                <i className={`ti ti-${p.openForRecruitment ? "eye" : "eye-off"}`} style={{ marginRight: 4 }}></i>
                {p.openForRecruitment ? "Visible to players" : "Hidden from players"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>
                {p.openForRecruitment
                  ? "Players looking for a team can find and send you trial requests."
                  : "Toggle on to appear in player searches and receive trial requests."}
              </div>
            </div>
            <div style={{ padding: "var(--sp-md)", background: "var(--bg2)", borderLeft: "3px solid var(--border)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 4 }}>
                <i className="ti ti-users" style={{ marginRight: 4 }}></i>Trial requests
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>
                Players who send trial requests appear in your squad page to accept or decline.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: "var(--sp-lg)",
            background: "rgba(196,154,10,.06)",
            borderLeft: "3px solid var(--gold)",
            marginBottom: "var(--sp-lg)",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--text2)" }}>
            <i className="ti ti-lock" style={{ marginRight: 6 }}></i>
            Verify your squad to invite players and appear in player searches.
          </div>
        </div>
      )}

      {isVerified && neededPositions.length > 0 && (
        <div className="card">
          <div className="card-title">
            <div className="card-dot"></div>Squad needs
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: "var(--sp-sm)" }}>
            Positions not yet covered in your squad:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {neededPositions.map((needed) => (
              <span
                key={needed}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 10px",
                  background: pos === needed ? "var(--gold)" : "rgba(196,154,10,.1)",
                  border: "0.5px solid var(--gold)",
                  color: pos === needed ? "#0f0f0d" : "var(--gold)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onClick={() => setPos((cur) => (cur === needed ? "" : needed))}
              >
                {needed}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: "var(--sp-sm)" }}>
            Click a position to filter players
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
            <div className="card-dot"></div>Browse players
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: "var(--sp-lg)", flexWrap: "wrap" }}>
          <select value={pos} onChange={(e) => setPos(e.target.value)} style={filterStyle}>
            <option value="">All positions</option>
            {POSITIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <select value={tier} onChange={(e) => setTier(e.target.value)} style={filterStyle}>
            <option value="">All tiers</option>
            {TIERS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            style={{ ...filterStyle, flex: 1, minWidth: 120 }}
          />
        </div>
        <div>
          {!players || players.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: "var(--text2)" }}>
              <i
                className="ti ti-users"
                style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--text3)" }}
              ></i>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
                No unattached players
              </div>
              <div style={{ fontSize: 13 }}>Unattached players will appear here as they register.</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, color: "var(--text2)", fontSize: 13 }}>
              No players match your filters.
            </div>
          ) : (
            filtered.map((pl) => (
              <PlayerCard
                key={pl.id}
                p={pl}
                canInvite={isVerified && !!p.openForRecruitment}
                isInvited={invitedIds.includes(pl.id)}
                declinedAt={declinedAt[pl.id]}
              />
            ))
          )}
        </div>
      </div>

      {prospects && prospects.length > 0 && (
        <div className="card">
          <div className="card-title">
            <div className="card-dot"></div>Scout recommendations
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: "var(--sp-md)" }}>
            Players flagged by verified scouts as elite prospects.
          </div>
          {prospects.map((sp) => {
            const player = sp.player || {};
            const rp = player.profile || {};
            const scout = sp.scout || {};
            const overall = rp.ratings
              ? Math.round((rp.ratings.speed + rp.ratings.tech + rp.ratings.tact + rp.ratings.phys) / 4)
              : null;

            return (
              <div
                key={sp.id || player.id}
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
                  {initials(player.name || "?")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{player.name || "-"}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>
                    {rp.pos || "-"} · {rp.tier || "-"} · {rp.hometown || "-"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                    <i className="ti ti-flag" style={{ color: "var(--gold)", marginRight: 4 }}></i>
                    Flagged by {scout.name || "Scout"} · {sp.scout_agency || ""}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginRight: 8 }}>
                  {overall !== null ? (
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--gold)" }}>{overall}%</div>
                  ) : (
                    <div style={{ fontSize: 13, color: "var(--text3)" }}>Unrated</div>
                  )}
                  {sp.report_shared && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        padding: "1px 6px",
                        background: "rgba(196,154,10,.15)",
                        color: "var(--gold)",
                      }}
                    >
                      Report available
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {isVerified && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => invitePlayer(player.id, player.name)}
                    >
                      <i className="ti ti-send"></i> Invite
                    </button>
                  )}
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => messageScout(sp.scout_id, scout.name)}
                  >
                    <i className="ti ti-message"></i> Scout
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
