/**
 * HappyFeet: dashboards/player.js
 * All views for the Player role.
 */

const HF_PLAYER = (() => {
  // ── RENDER DISPATCHER ───────────────────────────────────────
  const render = (view, session) => {
    const views = {
      dashboard,
      profile,
      stats,
      training,
      health,
      achievements,
      highlights,
      messages,
      faith,
      findmyteam,
    };
    const fn = views[view] || dashboard;
    fn(session);
  };

  // ── DASHBOARD ───────────────────────────────────────────────
  const dashboard = async (s) => {
    const p = s.profile || {};
    const r = p.ratings || {};
    const overall = HF_UTILS.calcRating(r);
    const newUser = HF_UTILS.isNewUser(s);
    const [tracker, loginStreak, { data: agentConvos }, unreadCount] =
      await Promise.all([
        HF_DB.getTracker(s.userId),
        HF_DB.getLoginStreak(s.userId),
        HF_DB.getAgentConversations(s.userId),
        HF_DB.getUnreadCount(s.userId),
      ]);
    const sessionsThisMonth = tracker?.sessionsThisMonth || 0;

    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("PlayerDashboard", mc, {
        session: s,
        overall,
        newUser,
        loginStreak,
        unreadCount,
        sessionsThisMonth,
        agentConvos,
      });
  };

  // ── PROFILE ─────────────────────────────────────────────────
  const profile = async (s, editing = false) => {
    const { data: freshUser } = await HF_DB.getUserById(s.userId);
    if (freshUser?.profile) {
      s.profile = freshUser.profile;
      HF_DB.saveSession(s);
    }
    const { data: invite } = await HF_DB.getPlayerCurrentCoach(s.userId);
    const jerseyNumber = invite?.jersey_number || null;
    const ms = freshUser?.match_stats || {};

    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("PlayerProfile", mc, {
        session: s,
        ms,
        jerseyNumber,
        onEdit: () => editProfile(),
        onSettings: () => HF_ROUTER.navTo("profile#settings"),
        onLeaveTeam: () => leaveTeam(),
      });
  };

  // ── PROFILE HELPERS  ─────────────────────────────────────────
  const editProfile = async (editing = true) => {
    const session = HF_DB.getSession();

    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("PlayerEditProfile", mc, {
        session,
        onSave: () => saveProfile(),
        onCancel: () => HF_ROUTER.navTo("profile"),
      });
  };

  const saveProfile = async () => {
    const session = HF_DB.getSession();

    // check for pending file upload from either input
    const fileInput =
      document.getElementById("avatar-input") ||
      document.getElementById("avatar-input-banner");
    const file = fileInput?.files[0] || window._pendingAvatarFile || null;
    let avatarUrl = session.profile?.avatarUrl || null;

    if (file) {
      HF_UTILS.toast("Uploading photo...", "success");
      const uploadResult = await HF_DB.uploadAvatar(session.userId, file);
      if (uploadResult.error) {
        HF_UTILS.toast(uploadResult.error, "error");
        return;
      }
      avatarUrl = uploadResult.url;
      window._pendingAvatarFile = null;
    }

    const updatedProfile = {
      ...session.profile,
      avatarUrl,
      pos: document.getElementById("ep-pos")?.value || session.profile?.pos,
      tier: document.getElementById("ep-tier")?.value || session.profile?.tier,
      hometown:
        document.getElementById("ep-hometown")?.value ||
        session.profile?.hometown,
    };

    const name =
      document.getElementById("ep-name")?.value.trim() || session.name;
    const result = await HF_DB.updateUserProfile(
      session.userId,
      updatedProfile,
      name,
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    session.profile = updatedProfile;
    session.name = name;
    HF_DB.saveSession(session);
    HF_UTILS.toast("Profile updated!", "success");
    HF_ROUTER.navTo("profile");
  };

  // ── STATS ────────────────────────────────────────────────────
  const stats = async (s) => {
    const r = s.profile?.ratings || {};
    const overall = HF_UTILS.calcRating(r);
    const { data: sessions } = await HF_DB.getPlayerSessionRatings(s.userId);
    const hasStats = sessions && sessions.length > 0;

    // build trend from real session data
    const trendData = sessions
      ? [...sessions].reverse().map((s) => s.overall)
      : [];

    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("PlayerStats", mc, {
        session: s,
        overall,
        sessions,
        hasStats,
        trendData,
      });
  };

  // ── TRAINING ─────────────────────────────────────────────────
  const training = async (s) => {
    const p = s.profile || {};

    // Gate: player must be on a team
    if (!p.club || p.status === "unattached") {
      if (window._stopConfetti) window._stopConfetti();
      const mcGate = document.getElementById("main-content");
      if (mcGate)
        window.HF_REACT.mount("PlayerTraining", mcGate, {
          session: s,
          hasTeam: false,
        });
      return;
    }

    // Load coach's training plan
    const { data: coachData } = await HF_DB.getCoachTrainingForPlayer(s.userId);
    const schedule = coachData?.schedule || {};
    const sessions = coachData?.sessions || [];
    const { data: logs } = await HF_DB.getTrainingLogs(s.userId);

    const today = new Date().getDay();
    const todayISO = HF_DB.localDate();

    const typeColors = {
      Rest: "var(--text3)",
      Technical: "var(--gold)",
      Tactical: "var(--blue)",
      Physical: "var(--red)",
      Recovery: "var(--green)",
      Match: "var(--faith)",
    };

    window._trainingSchedule = schedule;
    window._trainingLogs = logs;
    window._trainingTypeColors = typeColors;

    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("PlayerTraining", mc, {
        session: s,
        hasTeam: true,
        schedule,
        logs,
        todayISO,
        todayDayIndex: today,
        onToggleComplete: (type, date, completed) =>
          toggleSessionComplete(type, date, completed),
      });
  };

  // ── TRAINING HELPERS ───────────────────────────────────────────
  const updateTrainingDay = async (dayIndex, type, specificDate = null) => {
    const session = HF_DB.getSession();
    const existing = await HF_DB.getTraining(session.userId);
    const schedule = existing?.schedule || {};

    if (specificDate) {
      schedule[specificDate] = type;
    } else {
      schedule[dayIndex] = type;
    }

    await HF_DB.saveTraining(session.userId, { ...existing, schedule });
    window._trainingSchedule = schedule;

    HF_UTILS.toast(
      `${specificDate || ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIndex]} set to ${type}`,
      "success",
    );

    training(session);
  };

  const toggleSessionComplete = async (sessionType, date, completed) => {
    const session = HF_DB.getSession();
    const notes =
      document.getElementById(`session-notes-${date}`)?.value.trim() || null;

    const result = await HF_DB.logTrainingSession(
      session.userId,
      sessionType,
      notes,
      date,
      completed,
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    await HF_DB.checkAndUnlockAchievements(session.userId).then(
      ({ newlyUnlocked }) => {
        if (newlyUnlocked?.length > 0) {
          setTimeout(() => {
            HF_UTILS.launchConfetti();
            HF_UTILS.toast(
              `🏆 Achievement unlocked: ${newlyUnlocked.length} new!`,
              "success",
            );
          }, 500);
        }
      },
    );

    HF_UTILS.toast(
      completed ? "Session marked complete! 💪" : "Session unmarked.",
      "success",
    );
    training(session);
  };

  // keep old one for backward compat
  const logSessionComplete = async (sessionType) => {
    await toggleSessionComplete(sessionType, HF_DB.localDate(), true);
  };

  const completionSection = (specificDate = null) => {
    const schedule = window._trainingSchedule || {};
    const logs = window._trainingLogs || [];
    const typeColors = window._trainingTypeColors || {};

    const targetDate = specificDate || HF_DB.localDate();
    const isToday = targetDate === HF_DB.localDate();
    const logForDate = logs?.find((l) => l.date === targetDate);
    const isDone = logForDate?.completed;
    const dayOfWeek = new Date(targetDate + "T00:00:00").getDay();
    const dayType = schedule[targetDate] || schedule[dayOfWeek];
    const color = dayType ? typeColors[dayType] : "var(--border)";
    const dateLabel = new Date(targetDate + "T00:00:00").toLocaleDateString(
      "en-GB",
      {
        weekday: "long",
        day: "numeric",
        month: "short",
      },
    );

    const content = isDone
      ? `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      <div style="font-size:13px;color:var(--green);display:flex;align-items:center;gap:6px;">
        <i class="ti ti-circle-check"></i>
        ${dayType || "Session"} completed!
        ${logForDate.notes ? `<span style="font-size:11px;color:var(--text2);">"${logForDate.notes}"</span>` : ""}
      </div>
      <button class="btn btn-outline btn-sm" onclick="HF_PLAYER.toggleSessionComplete('${dayType || "Rest"}', '${targetDate}', false)">
        <i class="ti ti-x"></i> Uncomplete
      </button>
    </div>`
      : dayType
        ? `
    <div style="font-size:13px;color:var(--text);margin-bottom:8px;">
      Planned: <strong style="color:${color}">${dayType}</strong>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <input type="text" id="session-notes-${targetDate}" placeholder="Add session notes (optional)..."
        style="flex:1;min-width:150px;padding:8px 12px;background:var(--bg);border:0.5px solid var(--border);color:var(--text);font-size:13px;outline:none;font-family:var(--font);">
      <button class="btn btn-primary btn-sm" onclick="HF_PLAYER.toggleSessionComplete('${dayType}', '${targetDate}', true)">
        <i class="ti ti-circle-check"></i> Mark completed
      </button>
    </div>`
        : `
    <div style="font-size:13px;color:var(--text2);">
      No session planned.
      <span onclick="HF_UTILS.showDayPicker(${dayOfWeek}, '${targetDate}')"
        style="color:var(--gold);cursor:pointer;text-decoration:underline;margin-left:4px;">Set one</span>
    </div>`;

    return `
    <div id="completion-section" style="padding:var(--sp-md);background:${isDone ? "rgba(26,122,46,.08)" : dayType ? color + "22" : "var(--bg2)"};border-left:3px solid ${isDone ? "var(--green)" : dayType ? color : "var(--border)"};margin-bottom:var(--sp-lg);">
      <div style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text2);margin-bottom:6px;">
        ${isToday ? "Today" : dateLabel}
      </div>
      ${content}
    </div>`;
  };

  const selectTrainingDay = async (dateStr, dayIndex) => {
    window._trainingSelectedDate = dateStr;
    HF_UTILS.showDayPicker(dayIndex, dateStr);

    // refresh logs in case something changed
    const { data: freshLogs } = await HF_DB.getTrainingLogs(
      HF_DB.getSession().userId,
    );
    window._trainingLogs = freshLogs;

    // update completion section in place
    const completionEl = document.getElementById("completion-section");
    if (completionEl) {
      completionEl.outerHTML = completionSection(dateStr);
    }
  };

  // ── HEALTH ─────────────────────────────────────────────────
  const health = async (s) => {
    const { data: todayLog } = await HF_DB.getTodayHealthLog(s.userId);
    window._todayHealthLog = todayLog; // cache it
    const { data: logs } = await HF_DB.getHealthLogs(s.userId);

    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("PlayerHealth", mc, {
        session: s,
        todayLog,
        logs,
        onLogCheckin: () => logHealthCheckin(),
      });
  };

  // ── HEALTH HELPERS ───────────────────────────────────────────────
  const logHealthCheckin = async () => {
    const session = HF_DB.getSession();

    const hydration = parseFloat(
      document.getElementById("sv-hydration-input")?.value ||
        document.getElementById("sv-hydration")?.textContent ||
        0,
    );

    if (hydration < 0 || hydration > 10) {
      HF_UTILS.toast("Hydration must be between 0 and 10 litres.", "error");
      return;
    }

    const data = {
      energy: parseInt(document.getElementById("sv-energy")?.textContent || 5),
      mood: parseInt(document.getElementById("sv-mood")?.textContent || 5),
      sleep: parseInt(document.getElementById("sv-sleep")?.textContent || 5),
      soreness: parseInt(
        document.getElementById("sv-soreness")?.textContent || 5,
      ),
      hydration,
      nutrition: parseInt(
        document.getElementById("sv-nutrition")?.textContent || 5,
      ),
      notes: document.getElementById("health-notes")?.value.trim() || null,
    };

    const result = await HF_DB.saveHealthLog(session.userId, data);
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    await HF_DB.checkAndUnlockAchievements(session.userId).then(
      ({ newlyUnlocked }) => {
        if (newlyUnlocked?.length > 0) {
          setTimeout(() => {
            HF_UTILS.launchConfetti();
            HF_UTILS.toast(
              `🏆 Achievement unlocked: ${newlyUnlocked.length} new!`,
              "success",
            );
          }, 500);
        }
      },
    );

    HF_UTILS.toast("Health check-in logged!", "success");
    health(session);
  };

  // ── ACHIEVEMENTS ─────────────────────────────────────────────
  const ACHIEVEMENTS = {
    performance: {
      label: "Performance",
      icon: "ti-ball-football",
      color: "var(--gold)",
      items: [
        {
          id: "first_session",
          label: "First touch",
          desc: "Have your first session rated by a coach",
          icon: "ti-star",
          tier: 1,
        },
        {
          id: "sessions_5",
          label: "Getting started",
          desc: "5 sessions rated by your coach",
          icon: "ti-star",
          tier: 2,
          requires: ["first_session"],
        },
        {
          id: "sessions_25",
          label: "Dedicated",
          desc: "25 sessions rated by your coach",
          icon: "ti-trophy",
          tier: 3,
          requires: ["sessions_5"],
        },
        {
          id: "rating_60",
          label: "Promising",
          desc: "Reach an average overall rating of 60",
          icon: "ti-chart-line",
          tier: 2,
          requires: ["first_session"],
        },
        {
          id: "rating_75",
          label: "Talented",
          desc: "Reach an average overall rating of 75",
          icon: "ti-chart-line",
          tier: 3,
          requires: ["rating_60"],
        },
        {
          id: "rating_90",
          label: "Elite",
          desc: "Reach an average overall rating of 90",
          icon: "ti-crown",
          tier: 4,
          requires: ["rating_75"],
        },
      ],
    },
    consistency: {
      label: "Consistency",
      icon: "ti-calendar",
      color: "var(--blue)",
      items: [
        {
          id: "streak_3",
          label: "Showing up",
          desc: "3 day login streak",
          icon: "ti-flame",
          tier: 1,
        },
        {
          id: "streak_7",
          label: "Weekly warrior",
          desc: "7 day login streak",
          icon: "ti-flame",
          tier: 2,
          requires: ["streak_3"],
        },
        {
          id: "streak_30",
          label: "Unstoppable",
          desc: "30 day login streak",
          icon: "ti-flame",
          tier: 3,
          requires: ["streak_7"],
        },
        {
          id: "training_5",
          label: "In the gym",
          desc: "Complete 5 training sessions",
          icon: "ti-barbell",
          tier: 2,
          requires: ["streak_3"],
        },
        {
          id: "training_20",
          label: "Iron will",
          desc: "Complete 20 training sessions",
          icon: "ti-barbell",
          tier: 3,
          requires: ["training_5"],
        },
      ],
    },
    wellness: {
      label: "Wellness",
      icon: "ti-heart-rate-monitor",
      color: "var(--green)",
      items: [
        {
          id: "first_checkin",
          label: "Body check",
          desc: "Log your first wellness check-in",
          icon: "ti-heart",
          tier: 1,
        },
        {
          id: "checkins_7",
          label: "Self aware",
          desc: "7 wellness check-ins logged",
          icon: "ti-heart",
          tier: 2,
          requires: ["first_checkin"],
        },
        {
          id: "checkins_30",
          label: "Holistic athlete",
          desc: "30 wellness check-ins logged",
          icon: "ti-heart",
          tier: 3,
          requires: ["checkins_7"],
        },
        {
          id: "wellness_perfect",
          label: "Peak condition",
          desc: "Log all wellness metrics at 8 or above",
          icon: "ti-award",
          tier: 3,
          requires: ["checkins_7"],
        },
      ],
    },
    faith: {
      label: "Faith",
      icon: "ti-cross",
      color: "var(--faith)",
      items: [
        {
          id: "first_prayer",
          label: "First step",
          desc: "Complete your first daily prayer",
          icon: "ti-cross",
          tier: 1,
        },
        {
          id: "faith_7",
          label: "Faithful",
          desc: "7 day faith streak",
          icon: "ti-cross",
          tier: 2,
          requires: ["first_prayer"],
        },
        {
          id: "faith_30",
          label: "Devoted",
          desc: "30 day faith streak",
          icon: "ti-cross",
          tier: 3,
          requires: ["faith_7"],
        },
      ],
    },
    community: {
      label: "Community",
      icon: "ti-users",
      color: "var(--red)",
      items: [
        {
          id: "join_squad",
          label: "Team player",
          desc: "Join a verified squad",
          icon: "ti-users",
          tier: 1,
        },
        {
          id: "scout_flagged",
          label: "On the radar",
          desc: "Get flagged as an elite prospect",
          icon: "ti-flag",
          tier: 2,
          requires: ["join_squad"],
        },
        {
          id: "report_shared",
          label: "Making waves",
          desc: "Have your scouting report shared",
          icon: "ti-file-text",
          tier: 3,
          requires: ["scout_flagged"],
        },
        {
          id: "scout_placed",
          label: "The journey begins",
          desc: "Get placed by a scout",
          icon: "ti-rocket",
          tier: 4,
          requires: ["report_shared"],
        },
      ],
    },
  };

  const achievements = async (s) => {
    const { data: unlocked } = await HF_DB.getAchievements(s.userId);
    await HF_DB.checkAndUnlockAchievements(s.userId);

    const unlockedIds = new Set(unlocked.map((a) => a.id));
    window._unlockedIds = [...unlockedIds];

    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("PlayerAchievements", mc, {
        session: s,
        unlockedIds: [...unlockedIds],
      });
  };

  // ── ACHIEVEMENT HELPERS ───────────────────────────────
  const showAchievementDetail = (achievementId) => {
    const item = Object.values(ACHIEVEMENTS)
      .flatMap((c) => c.items)
      .find((i) => i.id === achievementId);
    const cat = Object.values(ACHIEVEMENTS).find((c) =>
      c.items.find((i) => i.id === achievementId),
    );
    if (!item || !cat) return;

    const unlockedIds = new Set(window._unlockedIds || []);
    const requires = item.requires || [];
    const prereqsMet = requires.every((r) => unlockedIds.has(r));
    const isLocked = !prereqsMet && !unlockedIds.has(item.id);

    const catKey = cat.label.toLowerCase().replace(/\s/g, "-");
    const detailId = `achievement-detail-${catKey}`;
    const detail = document.getElementById(detailId);
    if (!detail) return;

    const isVisible = detail.style.display !== "none";
    document
      .querySelectorAll('[id^="achievement-detail-"]')
      .forEach((el) => (el.style.display = "none"));
    if (isVisible) return;

    detail.style.display = "block";
    detail.innerHTML = isLocked
      ? `
      <div style="display:flex;align-items:center;gap:var(--sp-md);">
        <i class="ti ti-lock" style="font-size:24px;color:var(--text3)"></i>
        <div>
          <div style="font-family:var(--font);font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:var(--text3);">
            ???
          </div>
          <div style="font-size:12px;color:var(--text3);margin-top:2px;">
            Unlock required: ${requires
              .map((r) => {
                const req = Object.values(ACHIEVEMENTS)
                  .flatMap((c) => c.items)
                  .find((i) => i.id === r);
                return req?.label || r;
              })
              .join(", ")}
          </div>
        </div>
      </div>`
      : `
      <div style="display:flex;align-items:center;gap:var(--sp-md);">
        <i class="ti ${item.icon}" style="font-size:24px;color:${cat.color}"></i>
        <div>
          <div style="font-family:var(--font);font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${cat.color};">
            ${item.label}
          </div>
          <div style="font-size:12px;color:var(--text2);margin-top:2px;">${item.desc}</div>
          ${
            item.requires?.length
              ? `
            <div style="font-size:11px;color:var(--text3);margin-top:4px;">
              Requires: ${requires
                .map((r) => {
                  const req = Object.values(ACHIEVEMENTS)
                    .flatMap((c) => c.items)
                    .find((i) => i.id === r);
                  return req?.label || r;
                })
                .join(", ")}
            </div>`
              : ""
          }
        </div>
      </div>`;
  };

  const showAchievementTooltip = (event, achievementId) => {
    const item = Object.values(ACHIEVEMENTS)
      .flatMap((c) => c.items)
      .find((i) => i.id === achievementId);
    const cat = Object.values(ACHIEVEMENTS).find((c) =>
      c.items.find((i) => i.id === achievementId),
    );
    if (!item || !cat) return;

    const unlockedIds = new Set(window._unlockedIds || []);
    const requires = item.requires || [];
    const prereqsMet = requires.every((r) => unlockedIds.has(r));
    const isLocked = !prereqsMet && !unlockedIds.has(item.id);
    const isUnlocked = unlockedIds.has(item.id);

    // remove existing tooltip
    document.getElementById("achievement-tooltip")?.remove();

    const tooltip = document.createElement("div");
    tooltip.id = "achievement-tooltip";
    tooltip.className = "achievement-tooltip";
    tooltip.innerHTML = `
    <div style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${isLocked ? "var(--text3)" : cat.color};margin-bottom:4px;">
      ${isLocked ? "???" : item.label}
    </div>
    <div style="font-size:11px;color:var(--text2);">
      ${isLocked ? "Complete prerequisites to unlock this achievement." : item.desc}
    </div>
    ${
      requires.length && !isUnlocked
        ? `
      <div style="font-size:10px;color:var(--text3);margin-top:6px;border-top:0.5px solid var(--border);padding-top:6px;">
        Requires: ${requires
          .map((r) => {
            const req = Object.values(ACHIEVEMENTS)
              .flatMap((c) => c.items)
              .find((i) => i.id === r);
            return `<span style="color:${unlockedIds.has(r) ? "var(--green)" : "var(--text3)"}">
            ${unlockedIds.has(r) ? "✓" : "○"} ${req?.label || r}
          </span>`;
          })
          .join(" · ")}
      </div>`
        : ""
    }
    ${
      isUnlocked
        ? `
      <div style="font-size:10px;color:var(--green);margin-top:6px;">
        <i class="ti ti-circle-check"></i> Unlocked
      </div>`
        : !isLocked
          ? `
      <div style="font-size:10px;color:var(--gold);margin-top:6px;">
        <i class="ti ti-clock"></i> In progress
      </div>`
          : ""
    }`;

    document.body.appendChild(tooltip);

    // position near cursor
    const x = Math.min(event.clientX + 12, window.innerWidth - 240);
    const y = Math.min(event.clientY + 12, window.innerHeight - 120);
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
  };

  const hideAchievementTooltip = () => {
    document.getElementById("achievement-tooltip")?.remove();
  };

  // ── HIGHLIGHTS ───────────────────────────────────────────────
  const highlights = (s) => {
    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc) window.HF_REACT.mount("PlayerHighlights", mc, { session: s });
  };

  // ── MESSAGES ─────────────────────────────────────────────────
  const messages = async (s) => {
    const [{ data: msgs }, { data: archived }, { data: invites }] =
      await Promise.all([
        HF_DB.getMessages(s.userId),
        HF_DB.getArchivedMessages(s.userId),
        HF_DB.getSquadInvites(s.userId),
      ]);
    const allSenderIds = [
      ...(msgs || []).map((m) => m.from_id),
      ...(archived || []).map((m) => m.from_id),
    ];
    const senderNames = await HF_DB.getUserNamesByIds(allSenderIds);

    const enriched = (msgs || []).map((m) => ({
      ...m,
      senderName: senderNames[m.from_id] || "HappyFeet",
    }));

    const enrichedArchived = (archived || []).map((m) => ({
      ...m,
      senderName: senderNames[m.from_id] || "HappyFeet",
    }));

    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("PlayerMessages", mc, {
        session: s,
        invites,
        enriched,
        enrichedArchived,
        onRespondInvite: (inviteId, playerId, accept, squadName, coachId) =>
          respondInvite(inviteId, playerId, accept, squadName, coachId),
      });
  };

  // ── MESSAGES HELPERS ────────────────────────────────────────────────────
  const respondInvite = async (
    inviteId,
    playerId,
    accept,
    squadName,
    coachId,
  ) => {
    const result = await HF_DB.respondToInvite(
      inviteId,
      playerId,
      accept,
      squadName,
      coachId,
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    if (accept) {
      const session = HF_DB.getSession();
      session.profile = {
        ...session.profile,
        club: squadName,
        status: "signed",
      };
      HF_DB.saveSession(session);

      await HF_DB.updateTeamSize(coachId, 1);

      HF_UTILS.toast(`Welcome to ${squadName}!`, "success");

      HF_ROUTER.buildSidenav(session);
    } else {
      HF_UTILS.toast("Invite declined.", "success");
    }

    messages(HF_DB.getSession());
  };

  const messageCoach = (coachId, coachName) =>
    HF_ROLE_UTILS.messageUser(coachId, coachName, "findmyteam", "player");

  // ── FAITH ────────────────────────────────────────────────────
  const faith = async (s) => {
    const todayKey = HF_DB.localDate();
    const storageKey = `hf_faith_checklist_${s.userId}_${todayKey}`;
    const checked = JSON.parse(localStorage.getItem(storageKey) || "{}");

    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc) window.HF_REACT.mount("PlayerFaith", mc, { session: s, checked });
  };

  // ── FIND MY TEAM ───────────────────────────────────────
  const findmyteam = async (s) => {
    const { data: coaches } = await HF_DB.getVerifiedCoaches(true);

    const { data: currentInvite } = await HF_DB.getPlayerCurrentCoach(s.userId);
    const currentCoachId = currentInvite?.coach_id || null;

    const coachesWithStatus = await Promise.all(
      (coaches || [])
        .filter((c) => c.id !== currentCoachId)
        .map(async (c) => {
          const { data: req } = await HF_DB.getTrialRequestStatus(
            s.userId,
            c.id,
          );
          return { ...c, trialRequest: req };
        }),
    );

    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("PlayerFindMyTeam", mc, {
        session: s,
        coaches: coachesWithStatus,
        onRequestTrial: (c) => requestTrial(c.id, c.name),
        onMessageCoach: (c) => messageCoach(c.id, c.name),
      });
  };

  // ── FIND MY TEAM HELPERS ───────────────────────────────────────────────
  const requestTrial = async (coachId, coachName) => {
    const session = HF_DB.getSession();

    // update button immediately
    const btn = document.getElementById(`trial-btn-${coachId}`);
    if (btn) {
      btn.outerHTML = `
      <span id="trial-btn-${coachId}" style="font-family:var(--font);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:3px 8px;background:rgba(196,154,10,.15);color:var(--gold);">
        <i class="ti ti-clock"></i> Trial request pending
      </span>`;
    }

    const result = await HF_DB.requestTrial(session.userId, coachId);
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      // revert button if error
      findmyteam(session);
      return;
    }

    // notify coach via system message
    const p = session.profile || {};
    await HF_DB._sendMessage(
      "system",
      coachId,
      "New trial request",
      `${session.name} (${p.pos || "Player"} · ${p.tier || "-"} · ${p.hometown || "-"}) has requested a trial with your squad.\n\nGo to your squad page to accept or decline.`,
    );

    // save request ID for coach to reference
    await HF_DB._sendMessage(
      "system",
      session.userId,
      `Trial request sent to ${coachName}`,
      `Your trial request to ${coachName} has been sent. You will be notified when they respond.`,
    );

    HF_UTILS.toast(`Trial request sent to ${coachName}!`, "success");
  };

  // ── LEAVE TEAM ───────────────────────────────────────────────
  const leaveTeam = async () => {
    const session = HF_DB.getSession();
    const clubName = session.profile?.club || "your team";

    if (
      !confirm(
        `Are you sure you want to leave ${clubName}?\n\nThis cannot be undone. Your coach will be notified.`,
      )
    )
      return;

    const reason = prompt("Please enter a reason for leaving (required):");
    if (!reason || reason.trim().length < 3) {
      HF_UTILS.toast("A reason is required to leave your team.", "error");
      return;
    }

    const { data: invite } = await HF_DB.getPlayerCurrentCoach(session.userId);

    const result = await HF_DB.leaveSquad(session.userId);
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    // notify coach
    if (invite?.coach_id) {
      const [msgResult, sizeResult] = await Promise.all([
        HF_DB._sendMessage(
          "system",
          invite.coach_id,
          `${session.name} has left the squad`,
          `${session.name} has left ${clubName}.\n\nReason: ${reason.trim()}\n\nTheir slot is now available.`,
        ),
        HF_DB.updateTeamSize(invite.coach_id, -1),
      ]);
      if (sizeResult?.error) {
        console.error("Failed to decrement team size:", sizeResult.error);
      }
    } else {
      console.warn("leaveTeam: no coach_id found on invite", invite);
    }

    // update session
    session.profile = {
      ...session.profile,
      club: null,
      status: "unattached",
    };
    HF_DB.saveSession(session);

    // rebuild sidenav so training tab disappears
    HF_ROUTER.buildSidenav(session);

    HF_UTILS.toast(`You have left ${clubName}.`, "success");
    profile(session);
  };

  return {
    render,
    training,
    faith,
    messages,
    stats,
    health,
    findmyteam,
    profile,
    dashboard,
    logSessionComplete,
    toggleSessionComplete,
    logHealthCheckin,
    editProfile,
    saveProfile,
    respondInvite,
    leaveTeam,
    requestTrial,
    messageCoach,
    showAchievementDetail,
    showAchievementTooltip,
    hideAchievementTooltip,
  };
})();

window.HF_PLAYER = HF_PLAYER;
