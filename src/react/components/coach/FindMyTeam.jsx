export default function CoachFindMyTeam({
  session: s,
  players,
  neededPositions,
  prospects,
  playersListHTML,
}) {
  const p = s.profile || {};
  const isVerified = s.squadStatus === "verified";

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
                onChange={(e) => window.HF_COACH.toggleRecruitment(e.target.checked)}
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
            {neededPositions.map((pos) => (
              <span
                key={pos}
                id={`pos-btn-${pos}`}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 10px",
                  background: "rgba(196,154,10,.1)",
                  border: "0.5px solid var(--gold)",
                  color: "var(--gold)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onClick={() => window.HF_COACH.selectNeededPosition(pos)}
              >
                {pos}
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
          <select
            id="fmt-pos"
            onChange={() => window.HF_COACH.filterPlayers()}
            style={{
              padding: "7px 10px",
              background: "var(--bg2)",
              border: "0.5px solid var(--border)",
              color: "var(--text)",
              fontSize: 12,
              fontFamily: "var(--font)",
              outline: "none",
            }}
          >
            <option value="">All positions</option>
            <option>GK</option>
            <option>CB</option>
            <option>LB</option>
            <option>RB</option>
            <option>DM</option>
            <option>CM</option>
            <option>CAM</option>
            <option>LW</option>
            <option>RW</option>
            <option>ST</option>
          </select>
          <select
            id="fmt-tier"
            onChange={() => window.HF_COACH.filterPlayers()}
            style={{
              padding: "7px 10px",
              background: "var(--bg2)",
              border: "0.5px solid var(--border)",
              color: "var(--text)",
              fontSize: 12,
              fontFamily: "var(--font)",
              outline: "none",
            }}
          >
            <option value="">All tiers</option>
            <option>U10</option>
            <option>U12</option>
            <option>U14</option>
            <option>U16</option>
            <option>U18</option>
            <option>U21</option>
            <option>Professional</option>
          </select>
          <input
            type="text"
            id="fmt-search"
            placeholder="Search by name..."
            onInput={() => window.HF_COACH.filterPlayers()}
            style={{
              flex: 1,
              minWidth: 120,
              padding: "7px 10px",
              background: "var(--bg2)",
              border: "0.5px solid var(--border)",
              color: "var(--text)",
              fontSize: 12,
              fontFamily: "var(--font)",
              outline: "none",
            }}
          />
        </div>
        <div id="fmt-players-list">
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
          ) : (
            <div dangerouslySetInnerHTML={{ __html: playersListHTML }} />
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
            const safeName = (player.name || "").replace(/'/g, "\\'");
            const safeScout = (scout.name || "").replace(/'/g, "\\'");

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
                  {window.HF_UTILS.initials(player.name || "?")}
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
                      onClick={() => window.HF_COACH.invitePlayer(player.id, safeName)}
                    >
                      <i className="ti ti-send"></i> Invite
                    </button>
                  )}
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => window.HF_COACH.messageScout(sp.scout_id, safeScout)}
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
