import { useMemo, useState } from "react";
import { initials } from "../../../lib/utils.js";
import { toast } from "../../../lib/dom.js";
import { messageUser } from "../../../lib/roleUtils.js";
import * as db from "../../../lib/db/index.js";

function overallOf(p) {
  return p.ratings ? Math.round((p.ratings.speed + p.ratings.tech + p.ratings.tact + p.ratings.phys) / 4) : null;
}

function ClubCard({ c, isExpanded, onToggleDetail, onRequestNetwork, onMessage }) {
  const p = c.profile || {};
  const req = c.networkRequest;
  const isApproved = c.isApproved;
  const isPending = req?.status === "pending";
  const isDeclined = req?.status === "declined";

  return (
    <div className="card" style={{ marginBottom: "var(--sp-md)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-md)" }}>
        <div
          style={{
            width: 52,
            height: 52,
            background: isApproved ? "var(--green)" : "var(--bg2)",
            border: `2px solid ${isApproved ? "var(--green)" : "var(--border)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 700,
            color: isApproved ? "#fff" : "var(--text2)",
            flexShrink: 0,
          }}
        >
          {(p.club || c.name).charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{p.club || "-"}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 3 }}>
            {p.league && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  background: "var(--bg2)",
                  border: "0.5px solid var(--border)",
                  color: "var(--text2)",
                }}
              >
                {p.league}
              </span>
            )}
            <span style={{ fontSize: 10, color: "var(--text3)" }}>Coach: {c.name}</span>
            {p.exp && <span style={{ fontSize: 10, color: "var(--text3)" }}>{p.exp} yrs exp</span>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {isApproved ? (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "2px 8px",
                background: "rgba(26,122,46,.15)",
                color: "var(--green)",
              }}
            >
              In network
            </span>
          ) : isPending ? (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "2px 8px",
                background: "rgba(196,154,10,.15)",
                color: "var(--gold)",
              }}
            >
              Pending
            </span>
          ) : isDeclined ? (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "2px 8px",
                background: "rgba(200,16,46,.1)",
                color: "var(--red)",
              }}
            >
              Declined
            </span>
          ) : null}
        </div>
      </div>

      <div style={{ marginTop: "var(--sp-md)", paddingTop: "var(--sp-md)", borderTop: "0.5px solid var(--border)" }}>
        {isApproved ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn btn-outline btn-sm" onClick={() => onToggleDetail(c)}>
              <i className="ti ti-chart-bar"></i> View squad details
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => onMessage(c.id, c.name)}>
              <i className="ti ti-message"></i> Message coach
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-md)" }}>
            <div style={{ flex: 1, fontSize: 12, color: "var(--text3)" }}>
              <i className="ti ti-lock" style={{ marginRight: 4 }}></i>
              Request access to see squad details, ratings, and wellness data.
            </div>
            {!isPending && (
              <button className="btn btn-primary btn-sm" onClick={() => onRequestNetwork(c.id, c.name)}>
                <i className="ti ti-network"></i> Request access
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ClubDetailPanel({ coachId, clubName, league, coachUser, readiness, squadPlayers, onMessage, onClose }) {
  const coachProfile = coachUser?.profile || {};
  const readinessColor = !readiness
    ? "var(--text3)"
    : readiness.score >= 75
      ? "var(--green)"
      : readiness.score >= 50
        ? "var(--gold)"
        : "var(--red)";

  return (
    <div className="card">
      <div
        style={{
          background: "#0f0f0d",
          padding: "var(--sp-xl)",
          margin: "calc(var(--sp-lg) * -1) calc(var(--sp-lg) * -1) var(--sp-lg)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--sp-lg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-lg)" }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "var(--green)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {clubName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{clubName}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 2 }}>
              {league || "-"} · {coachProfile.spec || "Football Club"}
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: "rgba(255,255,255,.4)" }}>
              Coach: {coachUser?.name || "-"} · {coachProfile.licence || "-"} licence
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: readinessColor }}>{readiness ? `${readiness.score}%` : "-"}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Squad readiness
          </div>
        </div>
      </div>

      <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: "var(--sp-lg)" }}>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--gold)" }}>
            {squadPlayers?.length || 0}
          </div>
          <div className="metric-label">Players</div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--blue)" }}>
            {readiness?.avgRating || "-"}
          </div>
          <div className="metric-label">Avg rating</div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--green)" }}>
            {readiness?.wellnessRate || "-"}%
          </div>
          <div className="metric-label">Wellness</div>
        </div>
      </div>

      {squadPlayers && squadPlayers.length > 0 ? (
        <>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text2)",
              marginBottom: "var(--sp-sm)",
            }}
          >
            Squad
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "var(--sp-sm)" }}>
            {squadPlayers.map((sp) => {
              const p = sp.player?.profile || {};
              const overall = overallOf(p);
              return (
                <div
                  key={sp.player_id || sp.id}
                  style={{
                    padding: "var(--sp-md)",
                    background: "var(--bg2)",
                    borderTop: "2px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--sp-sm)",
                  }}
                >
                  <div className="avatar avatar-sm" style={{ background: "var(--green)", flexShrink: 0 }}>
                    {initials(sp.player?.name || "?")}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {sp.player?.name || "-"}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text2)" }}>
                      {p.pos || "-"} · {overall !== null ? `${overall}%` : "Unrated"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: 24, color: "var(--text2)", fontSize: 13 }}>No players in squad yet.</div>
      )}

      <div style={{ marginTop: "var(--sp-lg)", display: "flex", gap: 8 }}>
        <button className="btn btn-outline btn-sm" onClick={() => onMessage(coachId, coachUser?.name || "")}>
          <i className="ti ti-message"></i> Message coach
        </button>
        <button className="btn btn-outline btn-sm" onClick={onClose}>
          <i className="ti ti-x"></i> Close
        </button>
      </div>
    </div>
  );
}

export default function FindMyTalent({ session: s, coaches }) {
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [expandedCoachId, setExpandedCoachId] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const approvedCount = (coaches || []).filter((c) => c.isApproved).length;
  const [list, setList] = useState(coaches || []);

  const filtered = useMemo(() => {
    return (list || []).filter((c) => {
      const p = c.profile || {};
      const matchFilter =
        !filter ||
        (filter === "approved" && c.isApproved) ||
        (filter === "pending" && c.networkRequest?.status === "pending");
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.club || "").toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [list, filter, search]);

  const messageCoach = (coachId, coachName) => messageUser(coachId, coachName, "discover", "scout");

  const requestNetwork = async (coachId, coachName) => {
    const session = db.getSession();
    const result = await db.requestClubNetwork(session.userId, coachId);
    if (result.error) {
      toast(result.error, "error");
      return;
    }

    await db._sendMessage(
      "system",
      coachId,
      "Scout network request",
      `${session.name} from ${session.profile?.org || "HappyFeet Scouting"} has requested to add your club to their scouting network. You can approve or decline from your squad page.`,
    );

    toast(`Network request sent to ${coachName}!`, "success");
    setList((prev) => prev.map((c) => (c.id === coachId ? { ...c, networkRequest: { status: "pending" } } : c)));
  };

  const toggleDetail = async (c) => {
    if (expandedCoachId === c.id) {
      setExpandedCoachId(null);
      return;
    }
    setExpandedCoachId(c.id);

    if (!detailCache[c.id]) {
      const [{ data: squadPlayers }, { data: coachUser }, { data: readiness }] = await Promise.all([
        db.getCoachSquadDetails(c.id),
        db.getUserById(c.id),
        db.getSquadReadiness(c.id),
      ]);
      setDetailCache((prev) => ({
        ...prev,
        [c.id]: { squadPlayers, coachUser, readiness, clubName: (c.profile || {}).club || c.name, league: (c.profile || {}).league },
      }));
    }

    setTimeout(() => {
      document.getElementById("club-detail-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const activeDetail = expandedCoachId ? detailCache[expandedCoachId] : null;

  const inputStyle = {
    padding: "7px 10px",
    background: "var(--bg2)",
    border: "0.5px solid var(--border)",
    color: "var(--text)",
    fontSize: 12,
    fontFamily: "var(--font)",
    outline: "none",
  };

  return (
    <>
      <div className="welcome-banner">
        <div>
          <div className="welcome-title">Club network</div>
          <div className="welcome-sub">Browse verified squads and request access to see full details</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "var(--gold)" }}>{approvedCount}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            In network
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: "var(--sp-lg)", flexWrap: "wrap" }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={inputStyle}>
          <option value="">All clubs</option>
          <option value="approved">In my network</option>
          <option value="pending">Pending</option>
        </select>
        <input
          type="text"
          placeholder="Search by coach or club name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 150 }}
        />
      </div>

      <div>
        {!list || list.length === 0 ? (
          <div className="card">
            <div style={{ textAlign: "center", padding: 32, color: "var(--text2)" }}>
              <i
                className="ti ti-building"
                style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--text3)" }}
              ></i>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>No verified clubs yet</div>
              <div style={{ fontSize: 13 }}>Verified clubs will appear here as coaches register.</div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div style={{ textAlign: "center", padding: 24, color: "var(--text2)", fontSize: 13 }}>No clubs match your filters.</div>
          </div>
        ) : (
          filtered.map((c) => (
            <ClubCard
              key={c.id}
              c={c}
              isExpanded={expandedCoachId === c.id}
              onToggleDetail={toggleDetail}
              onRequestNetwork={requestNetwork}
              onMessage={messageCoach}
            />
          ))
        )}
      </div>

      <div id="club-detail-panel" style={{ display: activeDetail ? "block" : "none", marginTop: "var(--sp-lg)" }}>
        {activeDetail && (
          <ClubDetailPanel
            coachId={expandedCoachId}
            clubName={activeDetail.clubName}
            league={activeDetail.league}
            coachUser={activeDetail.coachUser}
            readiness={activeDetail.readiness}
            squadPlayers={activeDetail.squadPlayers}
            onMessage={messageCoach}
            onClose={() => setExpandedCoachId(null)}
          />
        )}
      </div>
    </>
  );
}
