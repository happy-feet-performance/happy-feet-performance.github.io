import { useState } from "react";

const ACHIEVEMENTS = {
  performance: {
    label: "Performance",
    icon: "ti-ball-football",
    color: "var(--gold)",
    items: [
      { id: "first_session", label: "First touch", desc: "Have your first session rated by a coach", icon: "ti-star", tier: 1 },
      { id: "sessions_5", label: "Getting started", desc: "5 sessions rated by your coach", icon: "ti-star", tier: 2, requires: ["first_session"] },
      { id: "sessions_25", label: "Dedicated", desc: "25 sessions rated by your coach", icon: "ti-trophy", tier: 3, requires: ["sessions_5"] },
      { id: "rating_60", label: "Promising", desc: "Reach an average overall rating of 60", icon: "ti-chart-line", tier: 2, requires: ["first_session"] },
      { id: "rating_75", label: "Talented", desc: "Reach an average overall rating of 75", icon: "ti-chart-line", tier: 3, requires: ["rating_60"] },
      { id: "rating_90", label: "Elite", desc: "Reach an average overall rating of 90", icon: "ti-crown", tier: 4, requires: ["rating_75"] },
    ],
  },
  consistency: {
    label: "Consistency",
    icon: "ti-calendar",
    color: "var(--blue)",
    items: [
      { id: "streak_3", label: "Showing up", desc: "3 day login streak", icon: "ti-flame", tier: 1 },
      { id: "streak_7", label: "Weekly warrior", desc: "7 day login streak", icon: "ti-flame", tier: 2, requires: ["streak_3"] },
      { id: "streak_30", label: "Unstoppable", desc: "30 day login streak", icon: "ti-flame", tier: 3, requires: ["streak_7"] },
      { id: "training_5", label: "In the gym", desc: "Complete 5 training sessions", icon: "ti-barbell", tier: 2, requires: ["streak_3"] },
      { id: "training_20", label: "Iron will", desc: "Complete 20 training sessions", icon: "ti-barbell", tier: 3, requires: ["training_5"] },
    ],
  },
  wellness: {
    label: "Wellness",
    icon: "ti-heart-rate-monitor",
    color: "var(--green)",
    items: [
      { id: "first_checkin", label: "Body check", desc: "Log your first wellness check-in", icon: "ti-heart", tier: 1 },
      { id: "checkins_7", label: "Self aware", desc: "7 wellness check-ins logged", icon: "ti-heart", tier: 2, requires: ["first_checkin"] },
      { id: "checkins_30", label: "Holistic athlete", desc: "30 wellness check-ins logged", icon: "ti-heart", tier: 3, requires: ["checkins_7"] },
      { id: "wellness_perfect", label: "Peak condition", desc: "Log all wellness metrics at 8 or above", icon: "ti-award", tier: 3, requires: ["checkins_7"] },
    ],
  },
  faith: {
    label: "Faith",
    icon: "ti-cross",
    color: "var(--faith)",
    items: [
      { id: "first_prayer", label: "First step", desc: "Complete your first daily prayer", icon: "ti-cross", tier: 1 },
      { id: "faith_7", label: "Faithful", desc: "7 day faith streak", icon: "ti-cross", tier: 2, requires: ["first_prayer"] },
      { id: "faith_30", label: "Devoted", desc: "30 day faith streak", icon: "ti-cross", tier: 3, requires: ["faith_7"] },
    ],
  },
  community: {
    label: "Community",
    icon: "ti-users",
    color: "var(--red)",
    items: [
      { id: "join_squad", label: "Team player", desc: "Join a verified squad", icon: "ti-users", tier: 1 },
      { id: "scout_flagged", label: "On the radar", desc: "Get flagged as an elite prospect", icon: "ti-flag", tier: 2, requires: ["join_squad"] },
      { id: "report_shared", label: "Making waves", desc: "Have your scouting report shared", icon: "ti-file-text", tier: 3, requires: ["scout_flagged"] },
      { id: "scout_placed", label: "The journey begins", desc: "Get placed by a scout", icon: "ti-rocket", tier: 4, requires: ["report_shared"] },
    ],
  },
};

function AchievementTree({ cat, catKey, unlockedIds, isOpen, onToggle }) {
  const items = cat.items;
  const nodeSize = 72;
  const hGap = 120;
  const vGap = 100;

  const tiers = {};
  items.forEach((item) => {
    if (!tiers[item.tier]) tiers[item.tier] = [];
    tiers[item.tier].push(item);
  });

  const maxTier = Math.max(...Object.keys(tiers).map(Number));
  const maxPerTier = Math.max(...Object.values(tiers).map((t) => t.length));
  const svgW = maxTier * hGap + nodeSize + 40;
  const svgH = maxPerTier * vGap + nodeSize + 56;

  const positions = {};
  Object.entries(tiers).forEach(([tier, tierItems]) => {
    const x = (parseInt(tier) - 1) * hGap + 20;
    tierItems.forEach((item, idx) => {
      const totalH = tierItems.length * vGap;
      const startY = (svgH - totalH) / 2;
      const y = startY + idx * vGap;
      positions[item.id] = { x, y };
    });
  });

  const lines = items.flatMap((item) => {
    if (!item.requires) return [];
    return item.requires.map((reqId) => {
      const from = positions[reqId];
      const to = positions[item.id];
      if (!from || !to) return null;
      const isActive = unlockedIds.has(reqId) && unlockedIds.has(item.id);
      const isPending = unlockedIds.has(reqId) && !unlockedIds.has(item.id);
      const color = isActive ? cat.color : isPending ? "rgba(196,154,10,.4)" : "var(--border)";
      return (
        <line
          key={`${reqId}-${item.id}`}
          x1={from.x + nodeSize / 2}
          y1={from.y + nodeSize / 2}
          x2={to.x + nodeSize / 2}
          y2={to.y + nodeSize / 2}
          stroke={color}
          strokeWidth={isActive ? 2 : 1}
          strokeDasharray={isPending ? "4,4" : "none"}
        />
      );
    });
  });

  const nodes = items.map((item) => {
    const pos = positions[item.id];
    const isUnlocked = unlockedIds.has(item.id);
    const requires = item.requires || [];
    const prereqsMet = requires.every((r) => unlockedIds.has(r));
    const isLocked = !prereqsMet && !isUnlocked;

    const bgColor = isUnlocked ? cat.color : "var(--bg2)";
    const borderColor = isUnlocked ? cat.color : prereqsMet ? cat.color : "var(--border)";
    const borderWidth = isUnlocked ? 2 : prereqsMet ? 2 : 1;
    const borderDash = prereqsMet && !isUnlocked ? "4,3" : "none";
    const iconColor = isUnlocked ? "#0f0f0d" : isLocked ? "#444" : cat.color + "88";
    const textColor = isUnlocked ? cat.color : isLocked ? "#444" : "#888";

    return (
      <g
        key={item.id}
        transform={`translate(${pos.x}, ${pos.y})`}
        data-id={item.id}
        onMouseEnter={(e) => window.HF_PLAYER.showAchievementTooltip(e, item.id)}
        onMouseLeave={() => window.HF_PLAYER.hideAchievementTooltip()}
        onClick={() => {
          if (!isLocked) window.HF_PLAYER.showAchievementDetail(item.id);
        }}
        style={{ cursor: isLocked ? "default" : "pointer" }}
      >
        <rect
          width={nodeSize}
          height={nodeSize}
          fill={bgColor}
          stroke={borderColor}
          strokeWidth={borderWidth}
          strokeDasharray={borderDash}
          rx={0}
          style={{ transition: "filter 0.15s ease" }}
        />
        {isUnlocked && <rect width={nodeSize} height={4} fill={cat.color} rx={0} />}
        <foreignObject x={4} y={nodeSize / 2 - 8} width={nodeSize - 8} height={20}>
          <div xmlns="http://www.w3.org/1999/xhtml" style={{ textAlign: "center", fontSize: 10, color: iconColor }}>
            <i className={`ti ${isLocked ? "ti-lock" : item.icon}`}></i>
          </div>
        </foreignObject>
        <foreignObject x={-10} y={nodeSize + 2} width={nodeSize + 20} height={32}>
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              textAlign: "center",
              fontSize: 8,
              fontWeight: 700,
              fontFamily: "Inter,sans-serif",
              color: textColor,
              lineHeight: 1.3,
              wordWrap: "break-word",
            }}
          >
            {isLocked ? "???" : item.label}
          </div>
        </foreignObject>
        {isUnlocked && (
          <>
            <circle cx={nodeSize - 8} cy={8} r={6} fill="var(--green)" />
            <text x={nodeSize - 8} y={12} textAnchor="middle" fontSize={8} fill="white">
              ✓
            </text>
          </>
        )}
      </g>
    );
  });

  const catUnlocked = items.filter((i) => unlockedIds.has(i.id)).length;

  return (
    <div className="card" style={{ marginBottom: "var(--sp-lg)" }}>
      <div
        className="card-title"
        style={{ justifyContent: "space-between", cursor: "pointer" }}
        onClick={onToggle}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
          <i className={`ti ${cat.icon}`} style={{ color: cat.color }}></i>
          {cat.label}
          <span
            style={{
              fontSize: 11,
              color: "var(--text3)",
              fontFamily: "var(--font)",
              textTransform: "none",
              letterSpacing: 0,
              fontWeight: 400,
            }}
          >
            {catUnlocked}/{items.length}
          </span>
        </div>
        <i
          id={`tree-chevron-${catKey}`}
          className={`ti ${isOpen ? "ti-chevron-up" : "ti-chevron-down"}`}
          style={{ fontSize: 14, color: "var(--text3)" }}
        ></i>
      </div>
      <div id={`tree-${catKey}`} style={{ display: isOpen ? "block" : "none" }}>
        <div style={{ overflowX: "auto" }}>
          <svg width={svgW} height={svgH} xmlns="http://www.w3.org/2000/svg">
            {lines}
            {nodes}
          </svg>
        </div>
        <div
          id={`achievement-detail-${catKey}`}
          style={{ display: "none", marginTop: "var(--sp-md)", padding: "var(--sp-md)", background: "var(--bg2)", borderLeft: `2px solid ${cat.color}` }}
        ></div>
      </div>
    </div>
  );
}

export default function PlayerAchievements({ session: s, unlockedIds: unlockedIdsArr }) {
  const [openCats, setOpenCats] = useState({});
  const unlockedIds = new Set(unlockedIdsArr);

  const totalCount = Object.values(ACHIEVEMENTS).reduce((sum, cat) => sum + cat.items.length, 0);
  const unlockedCount = unlockedIdsArr.length;

  return (
    <>
      <div className="welcome-banner">
        <div>
          <div className="welcome-title">Achievements</div>
          <div className="welcome-sub">
            {unlockedCount} of {totalCount} unlocked
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "var(--font)", fontSize: 42, fontWeight: 700, color: "var(--gold)" }}>
            {Math.round((unlockedCount / totalCount) * 100)}%
          </div>
          <div
            style={{
              fontFamily: "var(--font)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,.4)",
            }}
          >
            Complete
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "var(--sp-md)", flexWrap: "wrap", marginBottom: "var(--sp-lg)" }}>
        {Object.entries(ACHIEVEMENTS).map(([key, cat]) => {
          const catUnlocked = cat.items.filter((a) => unlockedIds.has(a.id)).length;
          const pct = Math.round((catUnlocked / cat.items.length) * 100);
          return (
            <div
              key={key}
              style={{ flex: 1, minWidth: 120, padding: "var(--sp-md)", background: "var(--bg2)", borderTop: `2px solid ${cat.color}` }}
            >
              <div
                style={{
                  fontFamily: "var(--font)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: cat.color,
                  marginBottom: 4,
                }}
              >
                <i className={`ti ${cat.icon}`} style={{ marginRight: 4 }}></i>
                {cat.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>
                {catUnlocked}/{cat.items.length}
              </div>
              <div style={{ height: 3, background: "var(--border)", marginTop: 6 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: cat.color, transition: "width 0.3s ease" }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {Object.entries(ACHIEVEMENTS).map(([key, cat]) => {
        const catKey = cat.label.toLowerCase().replace(/\s/g, "-");
        return (
          <AchievementTree
            key={key}
            cat={cat}
            catKey={catKey}
            unlockedIds={unlockedIds}
            isOpen={!!openCats[catKey]}
            onToggle={() => setOpenCats((prev) => ({ ...prev, [catKey]: !prev[catKey] }))}
          />
        );
      })}

      <div style={{ display: "flex", gap: "var(--sp-lg)", flexWrap: "wrap", padding: "var(--sp-md)", background: "var(--bg2)", fontSize: 11, color: "var(--text2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 16, background: "var(--gold)" }}></div>Unlocked
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 16, background: "var(--bg2)", border: "1px solid var(--gold)" }}></div>Available
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 16, background: "var(--bg2)", border: "1px solid var(--border)", opacity: 0.4 }}></div>Locked
        </div>
      </div>
    </>
  );
}
