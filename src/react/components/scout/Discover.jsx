import { useMemo, useState } from "react";
import { initials } from "../../../lib/utils.js";
import { toast } from "../../../lib/dom.js";
import { messageUser, viewSenderProfile } from "../../../lib/roleUtils.js";

function overallOf(prof) {
  return prof.ratings
    ? Math.round((prof.ratings.speed + prof.ratings.tech + prof.ratings.tact + prof.ratings.phys) / 4)
    : null;
}

function PlayerRow({ p, isSaved, isOpen, onToggle, onSave, onViewProfile, onMessage }) {
  const prof = p.profile || {};
  const overall = overallOf(prof);

  return (
    <>
      <div className="prospect-row" onClick={() => onToggle(p.id)} style={{ cursor: "pointer" }}>
        <div className="avatar avatar-md" style={{ background: "var(--green)" }}>
          {initials(p.name)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{p.name}</div>
          <div style={{ fontSize: 11, color: "var(--text2)" }}>
            {prof.pos || "-"} · {prof.tier || "-"} · {prof.hometown || "-"}
          </div>
          <div style={{ fontSize: 11, color: prof.status === "unattached" || !prof.club ? "var(--green)" : "var(--text3)" }}>
            {prof.status === "unattached" || !prof.club ? "Unattached" : prof.club}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {overall !== null ? (
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--gold)" }}>{overall}%</div>
          ) : (
            <div style={{ fontSize: 13, color: "var(--text3)" }}>Unrated</div>
          )}
          {isSaved && (
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
              Saved
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          display: isOpen ? "block" : "none",
          padding: "var(--sp-md)",
          background: "var(--bg2)",
          borderLeft: "2px solid var(--gold)",
          marginBottom: "var(--sp-sm)",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!isSaved && (
            <button
              className="btn btn-primary btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                onSave(p.id, p.name);
              }}
            >
              <i className="ti ti-star"></i> Save prospect
            </button>
          )}
          <button
            className="btn btn-outline btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile(p.id);
            }}
          >
            <i className="ti ti-user"></i> View profile
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onMessage(p.id, p.name);
            }}
          >
            <i className="ti ti-message"></i> Message
          </button>
        </div>
      </div>
    </>
  );
}

export default function Discover({ session: s, players, savedIds }) {
  const [filterPos, setFilterPos] = useState("");
  const [filterTier, setFilterTier] = useState("");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(() => new Set(savedIds || []));
  const [openIds, setOpenIds] = useState(() => new Set());

  const toggle = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const savePlayer = async (playerId, playerName) => {
    const session = window.HF_DB.getSession();
    const result = await window.HF_DB.saveProspect(session.userId, playerId);
    if (result.error) {
      toast(result.error, "error");
      return;
    }

    await window.HF_DB._sendMessage(
      "system",
      playerId,
      "You are being scouted",
      `${session.name} from ${session.profile?.org || "HappyFeet Scouting"} has added you to their prospect list. Your profile is now being actively monitored. Keep up the great work!`,
    );

    toast(`${playerName} saved as prospect!`, "success");
    setSaved((prev) => new Set(prev).add(playerId));
  };

  const viewProfile = (playerId) => viewSenderProfile(playerId, "scout", "discover");
  const messagePlayer = (playerId, playerName) => messageUser(playerId, playerName, "discover", "scout");

  const filtered = useMemo(() => {
    return (players || []).filter((p) => {
      const prof = p.profile || {};
      const matchPos = !filterPos || prof.pos === filterPos;
      const matchTier = !filterTier || prof.tier === filterTier;
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      return matchPos && matchTier && matchSearch;
    });
  }, [players, filterPos, filterTier, search]);

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
    <div className="card">
      <div className="card-title">
        <div className="card-dot"></div>Discover talent
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: "var(--sp-lg)", flexWrap: "wrap" }}>
        <select value={filterPos} onChange={(e) => setFilterPos(e.target.value)} style={inputStyle}>
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
        <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} style={inputStyle}>
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
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 120 }}
        />
      </div>

      <div>
        {!players || players.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text2)" }}>
            <i
              className="ti ti-users"
              style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--text3)" }}
            ></i>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>No players yet</div>
            <div style={{ fontSize: 13 }}>Players will appear here as they register on HappyFeet.</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text2)", fontSize: 13 }}>
            No players match your filters.
          </div>
        ) : (
          filtered.map((p) => (
            <PlayerRow
              key={p.id}
              p={p}
              isSaved={saved.has(p.id)}
              isOpen={openIds.has(p.id)}
              onToggle={toggle}
              onSave={savePlayer}
              onViewProfile={viewProfile}
              onMessage={messagePlayer}
            />
          ))
        )}
      </div>
    </div>
  );
}
