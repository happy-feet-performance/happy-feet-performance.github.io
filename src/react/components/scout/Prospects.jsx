import { useMemo, useState } from "react";
import { initials } from "../../../lib/utils.js";
import { toast } from "../../../lib/dom.js";
import { messageUser, viewSenderProfile } from "../../../lib/roleUtils.js";
import * as db from "../../../lib/db/index.js";
import { generateReport, shareReportViaMessage, viewReport } from "../../../lib/scout.js";
import { navTo } from "../../../lib/router.js";

const STAGES = [
  { key: "watching", label: "Watching", color: "var(--blue)", icon: "ti-eye" },
  { key: "flagged", label: "Flagged", color: "var(--gold)", icon: "ti-flag" },
  { key: "report_shared", label: "Report shared", color: "var(--faith)", icon: "ti-file-text" },
  { key: "trial", label: "Trial", color: "var(--red)", icon: "ti-calendar" },
  { key: "placed", label: "Placed", color: "var(--green)", icon: "ti-circle-check" },
];

function getStage(sp) {
  if (sp.placed) return "placed";
  if (sp.trial_arranged) return "trial";
  if (sp.report_shared) return "report_shared";
  if (sp.flagged) return "flagged";
  return "watching";
}

function overallOf(p) {
  return p.ratings ? Math.round((p.ratings.speed + p.ratings.tech + p.ratings.tact + p.ratings.phys) / 4) : null;
}

function SavedProspectRow({ sp, scoutId, isOpen, onToggle, onFlag, onUnflag, onUnsave }) {
  const p = sp.player?.profile || {};
  const name = sp.player?.name || "Unknown";

  const overall = overallOf(p);

  const stageColor = sp.placed
    ? "var(--green)"
    : sp.trial_arranged
      ? "var(--red)"
      : sp.report_shared
        ? "var(--faith)"
        : sp.flagged
          ? "var(--gold)"
          : "var(--blue)";

  return (
    <div
      style={{
        background: "var(--bg)",
        border: "0.5px solid var(--border)",
        borderLeft: `4px solid ${stageColor}`,
        marginBottom: "var(--sp-sm)",
        transition: "background 0.15s ease",
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg2)")}
      onMouseOut={(e) => (e.currentTarget.style.background = "var(--bg)")}
    >
      <div
        style={{
          padding: "var(--sp-md) var(--sp-lg)",
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-md)",
          cursor: "pointer",
        }}
        onClick={() => onToggle(sp.id)}
      >
        <div
          style={{
            width: 44,
            height: 44,
            background: stageColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {initials(name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {p.pos && (
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
                {p.pos}
              </span>
            )}
            {p.tier && (
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
                {p.tier}
              </span>
            )}
            {p.hometown && <span style={{ fontSize: 10, color: "var(--text3)" }}>{p.hometown}</span>}
            {p.club ? (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", background: "rgba(26,122,46,.1)", color: "var(--green)" }}>
                {p.club}
              </span>
            ) : (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", background: "var(--bg2)", color: "var(--text3)" }}>
                Free agent
              </span>
            )}
          </div>
          {overall !== null && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <div style={{ flex: 1, height: 3, background: "var(--border)" }}>
                <div style={{ height: "100%", width: `${overall}%`, background: stageColor }}></div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: stageColor }}>{overall}%</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          {sp.report && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "2px 8px",
                background: "rgba(196,154,10,.1)",
                color: "var(--gold)",
              }}
            >
              Report ready
            </span>
          )}
        </div>
        <i
          className="ti ti-chevron-down"
          style={{
            color: "var(--text3)",
            fontSize: 14,
            flexShrink: 0,
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        ></i>
      </div>

      <div
        style={{
          display: isOpen ? "block" : "none",
          padding: "var(--sp-md) var(--sp-lg)",
          borderTop: "0.5px solid var(--border)",
          background: "var(--bg2)",
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              viewSenderProfile(sp.player_id, "scout", "prospects");
            }}
          >
            <i className="ti ti-user"></i> Profile
          </button>
          {!sp.report ? (
            <button
              className="btn btn-outline btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                generateReport(scoutId, sp.player_id, name);
              }}
            >
              <i className="ti ti-sparkles"></i> Generate report
            </button>
          ) : (
            <button
              className="btn btn-outline btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                viewReport(scoutId, sp.player_id, name);
              }}
            >
              <i className="ti ti-file-text"></i> View report
            </button>
          )}
          {sp.flagged ? (
            <button
              className="btn btn-outline btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                onUnflag(sp, name);
              }}
            >
              <i className="ti ti-flag-off"></i> Unflag
            </button>
          ) : (
            <button
              className="btn btn-outline btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                onFlag(sp, name);
              }}
            >
              <i className="ti ti-flag"></i> Flag
            </button>
          )}
          {!sp.report_shared && sp.report && (
            <button
              className="btn btn-outline btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                shareReportViaMessage(scoutId, sp.player_id, name);
              }}
            >
              <i className="ti ti-send"></i> Share report
            </button>
          )}
          <button
            className="btn btn-outline btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              messageUser(sp.player_id, name, "prospects", "scout");
            }}
          >
            <i className="ti ti-message"></i> Message
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onUnsave(sp, name);
            }}
          >
            <i className="ti ti-trash"></i> Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Prospects({ session: s, saved }) {
  const [list, setList] = useState(saved || []);
  const [openIds, setOpenIds] = useState(() => new Set());
  const [collapsed, setCollapsed] = useState(() => new Set());

  const toggleOpen = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCollapsed = (key) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const grouped = useMemo(() => {
    const g = {};
    STAGES.forEach((st) => (g[st.key] = []));
    (list || []).forEach((sp) => g[getStage(sp)].push(sp));
    return g;
  }, [list]);

  const total = list?.length || 0;

  const handleUnsave = async (sp, name) => {
    if (!window.confirm(`Remove ${name} from your prospects?`)) return;
    const result = await db.unsaveProspect(s.userId, sp.player_id);
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    toast(`${name} removed from prospects.`, "success");
    setList((prev) => prev.filter((x) => x.id !== sp.id));
  };

  const handleFlag = async (sp, name) => {
    const result = await db.updateProspectStatus(s.userId, sp.player_id, {
      flagged: true,
      status: "flagged",
    });
    if (result.error) {
      toast(result.error, "error");
      return;
    }

    await db._sendMessage(
      "system",
      sp.player_id,
      "You have been flagged as an elite prospect",
      `${s.name} from ${s.profile?.org || "HappyFeet Scouting"} has flagged you as an elite prospect. Your profile is being actively considered for placement opportunities.`,
    );

    toast(`${name} flagged as elite prospect!`, "success");
    setList((prev) => prev.map((x) => (x.id === sp.id ? { ...x, flagged: true, status: "flagged" } : x)));
  };

  const handleUnflag = async (sp, name) => {
    const result = await db.updateProspectStatus(s.userId, sp.player_id, {
      flagged: false,
      status: "watching",
    });
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    toast(`${name} unflagged.`, "success");
    setList((prev) => prev.map((x) => (x.id === sp.id ? { ...x, flagged: false, status: "watching" } : x)));
  };

  return (
    <>
      <div className="welcome-banner" style={{ marginBottom: "var(--sp-lg)" }}>
        <div>
          <div className="welcome-title">Saved Prospects</div>
          <div className="welcome-sub">Track your talent from discovery to placement</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "var(--gold)" }}>{total}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Prospects
          </div>
        </div>
      </div>

      {total === 0 ? (
        <div className="card">
          <div style={{ textAlign: "center", padding: "48px 32px" }}>
            <i className="ti ti-star" style={{ fontSize: 48, marginBottom: 16, display: "block", color: "var(--text3)" }}></i>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>No prospects yet</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 24 }}>
              Save players from Discover talent to start building your pipeline.
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => navTo("discover")}>
              <i className="ti ti-search"></i> Discover talent
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: "var(--sp-lg)" }}>
            <div className="card-title">
              <div className="card-dot"></div>Pipeline Overview
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 2, padding: "var(--sp-md) 0" }}>
              {STAGES.map((st, i) => {
                const count = grouped[st.key].length;
                return (
                  <div key={st.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                    {i < 4 && (
                      <div
                        style={{
                          position: "absolute",
                          top: 20,
                          left: "50%",
                          width: "100%",
                          height: 2,
                          background: count > 0 ? st.color : "var(--border)",
                          zIndex: 0,
                          opacity: 0.4,
                        }}
                      ></div>
                    )}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: count > 0 ? st.color : "var(--bg2)",
                        border: `2px solid ${count > 0 ? st.color : "var(--border)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1,
                        position: "relative",
                        cursor: count > 0 ? "pointer" : "default",
                      }}
                      onClick={() => {
                        if (count > 0) document.getElementById(`stage-${st.key}`)?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <i className={`ti ${st.icon}`} style={{ color: count > 0 ? "#fff" : "var(--text3)" }}></i>
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: count > 0 ? st.color : "var(--text3)",
                        marginTop: 6,
                        textAlign: "center",
                      }}
                    >
                      {st.label}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: count > 0 ? st.color : "var(--text3)" }}>{count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {STAGES.map((st) => {
            const players = grouped[st.key];
            if (players.length === 0) return null;
            const isCollapsed = collapsed.has(st.key);
            return (
              <div id={`stage-${st.key}`} key={st.key} className="card" style={{ marginBottom: "var(--sp-md)" }}>
                <div
                  className="card-title"
                  style={{ cursor: "pointer", justifyContent: "space-between" }}
                  onClick={() => toggleCollapsed(st.key)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
                    <div className="card-dot" style={{ background: st.color }}></div>
                    {st.label}
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>{players.length}</span>
                  </div>
                  <i className={`ti ${isCollapsed ? "ti-chevron-down" : "ti-chevron-up"}`} style={{ fontSize: 14, color: "var(--text3)" }}></i>
                </div>
                <div style={{ display: isCollapsed ? "none" : "block" }}>
                  {players.map((sp) => (
                    <SavedProspectRow
                      key={sp.id}
                      sp={sp}
                      scoutId={s.userId}
                      isOpen={openIds.has(sp.id)}
                      onToggle={toggleOpen}
                      onFlag={handleFlag}
                      onUnflag={handleUnflag}
                      onUnsave={handleUnsave}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
