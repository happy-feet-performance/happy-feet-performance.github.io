/**
 * HappyFeet: dashboards/player.js
 * All views for the Player role.
 * Render is called by router.js with (view, session).
 */

const HF_PLAYER = (() => {
  const {
    barHTML,
    miniChartHTML,
    activityHTML,
    avatarHTML,
    badgeHTML,
    toast,
    today,
    ratingColor,
  } = HF_UTILS;

  const setMain = (html) => {
    const mc = document.getElementById("main-content");
    if (mc) mc.innerHTML = html;
  };

  // ── Overall rating calc ─────────────────────────────────────
  const calcRating = (r = {}) => {
    if (!r || Object.keys(r).length === 0) return null;
    const vals = [r.speed || 0, r.tech || 0, r.tact || 0, r.phys || 0];
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    return avg === 0 ? null : avg;
  };

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

  const findmyteam = (s) => {
    document.getElementById("main-content").innerHTML =
      `<div id="fmt-container"></div>`;
    HF_FINDTEAM.render("fmt-container", s);
  };

  // ── DASHBOARD ───────────────────────────────────────────────
  const dashboard = (s) => {
    const p = s.profile || {};
    const r = p.ratings || {};
    const overall = calcRating(r);
    const tracker = HF_DB.getSession()?.tracker || {};
    const sessionsThisMonth = tracker.sessionsThisMonth || 0;
    const faithStreak = p.faithStreak || 0;
    const messagesUnread = 0;

    setMain(`
    <div class="welcome-banner">
      <div>
        <div class="welcome-title">Welcome back, ${s.name.split(" ")[0]}</div>
        <div class="welcome-sub">${p.pos || "Player"} · ${p.tier || "U21"} · ${p.club || "-"}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:32px;font-weight:700;color:var(--gold)">${overall !== null ? overall + "%" : "-"}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.5)">${overall !== null ? "Overall rating" : "Not yet rated"}</div>
      </div>
    </div>

    ${HF_SCRIPTURE.stripHTML()}

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-val" style="color:var(--gold)">${overall !== null ? overall + "%" : "-"}</div>
        <div class="metric-label">Overall rating</div>
        <div class="metric-sub" style="color:var(--text2)">${overall !== null ? "Based on your stats" : "Not yet rated"}</div>
      </div>
      <div class="metric-card">
        <div class="metric-val" style="color:var(--green)">${sessionsThisMonth}</div>
        <div class="metric-label">Daily streak</div>
        <div class="metric-sub" style="color:var(--text2)">Days in a row</div>
      </div>
      <div class="metric-card">
        <div class="metric-val" style="color:var(--faith)">${faithStreak}</div>
        <div class="metric-label">Faith streak</div>
        <div class="metric-sub" style="color:var(--text2)">Days in a row</div>
      </div>
      <div class="metric-card">
        <div class="metric-val" style="color:var(--red)">${messagesUnread}</div>
        <div class="metric-label">Messages</div>
        <div class="metric-sub" style="color:var(--text2)">${messagesUnread > 0 ? "Unread" : "All caught up"}</div>
      </div>
    </div>

    <div class="quick-actions">
      <button class="quick-action" onclick="HF_ROUTER.navTo('stats')">
        <div class="quick-action-icon"><i class="ti ti-chart-bar"></i></div>
        <div class="quick-action-label">View my stats</div>
        <div class="quick-action-sub">Performance data</div>
      </button>
      <button class="quick-action" onclick="HF_ROUTER.navTo('health')">
        <div class="quick-action-icon"><i class="ti ti-stethoscope"></i></div>
        <div class="quick-action-label">Log wellness</div>
        <div class="quick-action-sub">How are you today?</div>
      </button>
      <button class="quick-action" onclick="HF_ROUTER.navTo('faith')">
        <div class="quick-action-icon"><i class="ti ti-cross"></i></div>
        <div class="quick-action-label">Morning devotion</div>
        <div class="quick-action-sub">Prayer & scripture</div>
      </button>
    </div>

    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Recent activity</div>
      ${
        sessionsThisMonth === 0
          ? `
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <i class="ti ti-activity" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:13px">No activity yet. Log your first session to get started.</div>
        </div>`
          : ""
      }
    </div>`);
  };

  // ── PROFILE ─────────────────────────────────────────────────
  const profile = (s, editing = false) => {
    const p = s.profile || {};
    const r = p.ratings || {};
    const overall = calcRating(r);
    const unrated = overall === null;

    setMain(`
    <!-- ── PROFILE HEADER ── -->
    <div style="background:#0f0f0d;padding:var(--sp-2xl);margin-bottom:var(--sp-lg);display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-lg);">
      
      <!-- Left: avatar + name -->
      <div style="display:flex;align-items:center;gap:var(--sp-lg);">
        <div style="position:relative;">
          <div style="width:72px;height:72px;background:#1a7a2e;display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:26px;font-weight:700;color:#fff;">
            ${HF_UTILS.initials(s.name)}
          </div>
          ${
            editing
              ? `
            <button onclick="HF_UTILS.toast('Profile photo upload coming soon!','success')"
              style="position:absolute;bottom:-8px;right:-8px;width:24px;height:24px;background:var(--gold);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#0f0f0d;">
              <i class="ti ti-camera" style="font-size:12px"></i>
            </button>`
              : ""
          }
        </div>
        <div>
          <div style="font-family:var(--font-head);font-size:22px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">${s.name}</div>
          <div style="font-size:13px;color:rgba(255,255,255,.55);margin-top:3px;">${p.pos || "-"} · ${p.tier || "-"} · ${p.club || "-"}</div>
          <div style="margin-top:8px;display:flex;align-items:center;gap:8px;">
            ${badgeHTML("Player", "green")}
            <span style="font-size:11px;color:rgba(255,255,255,.4)">${p.hometown || "Ghana"}</span>
          </div>
        </div>
      </div>

      <!-- Right: overall rating -->
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-family:var(--font-head);font-size:42px;font-weight:700;color:${unrated ? "var(--text3)" : "var(--gold)"};">
          ${unrated ? "-" : overall + "%"}
        </div>
        <div style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,.4);">
          ${unrated ? "Not yet rated" : "Overall rating"}
        </div>
      </div>
    </div>

    <!-- ── PLAYER DETAILS ── -->
    <div class="card">
      <div class="card-title" style="justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">
          <div class="card-dot"></div>Player details
        </div>
        <button class="btn btn-outline btn-sm" onclick="HF_PLAYER.editProfile()">
          <i class="ti ti-edit"></i> Edit
        </button>
      </div>
      <div class="info-grid">
        <div class="info-cell"><div class="info-label">Position</div><div class="info-val">${p.pos || "-"}</div></div>
        <div class="info-cell"><div class="info-label">Age tier</div><div class="info-val">${p.tier || "-"}</div></div>
        <div class="info-cell"><div class="info-label">Club</div><div class="info-val">${p.club || "-"}</div></div>
        <div class="info-cell"><div class="info-label">Hometown</div><div class="info-val">${p.hometown || "-"}</div></div>
        <div class="info-cell"><div class="info-label">${s.contactType === "phone" ? "Phone" : "Email"}</div><div class="info-val">${s.displayContact || s.contact}</div></div>
        <div class="info-cell"><div class="info-label">Faith streak</div><div class="info-val" style="color:var(--faith)">${p.faithStreak || 0} days <i class="ti ti-cross"></i></div></div>
      </div>
    </div>

    <!-- ── ABILITY RATINGS ── -->
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Ability ratings</div>
      ${
        unrated
          ? `
        <div style="text-align:center;padding:24px;color:var(--text2);">
          <i class="ti ti-info-circle" style="font-size:28px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No ratings yet</div>
          <div style="font-size:13px">Ratings will update as your coach logs your session data.</div>
        </div>`
          : `
        ${barHTML("Speed", r.speed || 0, "#c8102e")}
        ${barHTML("Technical", r.tech || 0, "var(--gold)")}
        ${barHTML("Tactical", r.tact || 0, "var(--blue)")}
        ${barHTML("Physical", r.phys || 0, "var(--green)")}`
      }
    </div>`);
  };

  // ── STATS ────────────────────────────────────────────────────
  const stats = (s) => {
    const r = s.profile?.ratings || {};
    const overall = calcRating(r);
    const hasStats = r.speed > 0 || r.tech > 0 || r.tact > 0 || r.phys > 0;

    setMain(`
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Performance overview</div>
      <div class="metrics-grid" style="grid-template-columns:repeat(3,1fr)">
        <div class="metric-card">
          <div class="metric-val" style="color:var(--gold)">${overall !== null ? overall + "%" : "-"}</div>
          <div class="metric-label">Overall</div>
        </div>
        <div class="metric-card">
          <div class="metric-val" style="color:var(--green)">0</div>
          <div class="metric-label">Sessions</div>
        </div>
        <div class="metric-card">
          <div class="metric-val" style="color:var(--blue)">-</div>
          <div class="metric-label">Last rating</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Rating trend</div>
      ${
        !hasStats
          ? `
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <i class="ti ti-chart-line" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No data yet</div>
          <div style="font-size:13px">Your rating trend will appear here once your coach logs session data.</div>
        </div>`
          : `
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text2);margin-top:6px">
          <span>Oldest</span><span>Latest</span>
        </div>`
      }
    </div>

    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Session history</div>
      ${
        !hasStats
          ? `
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <i class="ti ti-history" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No sessions yet</div>
          <div style="font-size:13px">Session history will appear here once your coach starts logging data.</div>
        </div>`
          : `
        <table class="table">
          <thead><tr><th>Date</th><th>Type</th><th>Rating</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td colspan="4" style="text-align:center;color:var(--text2);padding:20px">No sessions logged yet</td></tr>
          </tbody>
        </table>`
      }
    </div>`);
  };
  // ── TRAINING ─────────────────────────────────────────────────
  const training = async (s) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const types = [
      "rest",
      "recovery",
      "technical",
      "tactical",
      "match",
      "analysis",
      "match prep",
    ];
    const typeColors = {
      rest: "var(--text3)",
      recovery: "var(--green)",
      technical: "var(--gold)",
      tactical: "var(--blue)",
      match: "var(--red)",
      analysis: "var(--purple)",
      "match prep": "var(--faith)",
    };
    const typeLabels = {
      rest: "Rest",
      recovery: "Recovery",
      technical: "Technical",
      tactical: "Tactical",
      match: "Match",
      analysis: "Analysis",
      "match prep": "Match Prep",
    };

    const today = new Date().getDay(); // 0 = Sunday
    const saved = await HF_DB.getTraining(s.userId);
    const plan =
      saved?.weeklyPlan ||
      JSON.parse(localStorage.getItem("hf_training_plan") || "{}");

    const dayCards = days
      .map((day, i) => {
        const isToday = i === today;
        const selectedType = plan[i] || "rest";
        const color = typeColors[selectedType];
        return `
      <div style="
        padding:10px 8px;
        background:var(--bg);
        border:0.5px solid var(--border);
        border-top:2px solid ${isToday ? "var(--gold)" : color};
        text-align:center;
        ${isToday ? "background:rgba(196,154,10,.06);" : ""}
      ">
        <div style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${isToday ? "var(--gold)" : "var(--text2)"}">
          ${day}${isToday ? " · Today" : ""}
        </div>
        <div style="font-size:10px;font-weight:600;color:${color};margin-top:4px;text-transform:uppercase;letter-spacing:0.05em">
          ${typeLabels[selectedType]}
        </div>
        <select
          style="margin-top:6px;width:100%;padding:4px 2px;background:var(--bg2);border:0.5px solid var(--border);border-radius:0;color:var(--text);font-size:9px;font-family:var(--font-head);text-transform:uppercase;letter-spacing:0.04em;outline:none;"
          onchange="HF_PLAYER.updateTrainingDay(${i}, this.value)">
          ${types
            .map(
              (t) => `
            <option value="${t}" ${selectedType === t ? "selected" : ""}>${typeLabels[t]}</option>
          `,
            )
            .join("")}
        </select>
      </div>`;
      })
      .join("");

    setMain(`
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Weekly training plan</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:var(--sp-lg)">
        ${dayCards}
      </div>
      <div style="font-size:11px;color:var(--text2);text-align:center">
        <i class="ti ti-info-circle"></i> Select a session type for each day. Changes save automatically.
      </div>
    </div>

    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Today's focus: ${typeLabels[plan[today] || "rest"]}</div>
      ${
        plan[today] === "rest" || !plan[today]
          ? `
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <i class="ti ti-zzz" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">Rest day</div>
          <div style="font-size:13px">Recovery is part of the process. Rest well.</div>
        </div>`
          : `
        <div style="font-size:13px;color:var(--text2);margin-bottom:12px">
          Your coach will assign drills for today's ${typeLabels[plan[today]]} session.
        </div>
        <div style="padding:12px;background:var(--bg2);border-left:2px solid ${typeColors[plan[today]]};font-size:13px;color:var(--text2)">
          <i class="ti ti-clock" style="margin-right:6px"></i>
          Session details will appear here once your coach builds today's plan.
        </div>`
      }
    </div>`);
  };

  // ── ACHIEVEMENTS ─────────────────────────────────────────────
  const achievements = (s) => {
    const overall = calcRating(s.profile?.ratings || {});
    const hasStats =
      s.profile?.ratings?.speed > 0 || s.profile?.ratings?.tech > 0;

    const earned = [
      {
        icon: '<i class="ti ti-star"></i>',
        title: "First session logged",
        sub: "You started your HappyFeet journey",
        date: "Day 1",
        earned: true,
      },
      {
        icon: '<i class="ti ti-cross"></i>',
        title: "5-day faith streak",
        sub: "Complete 5 consecutive devotions",
        date: null,
        earned: (s.profile?.faithStreak || 0) >= 5,
      },
      {
        icon: '<i class="ti ti-trending-up"></i>',
        title: "First rating improvement",
        sub: "Get your first session rating from a coach",
        date: null,
        earned: hasStats,
      },
      {
        icon: '<i class="ti ti-run"></i>',
        title: "10 sessions completed",
        sub: "Log 10 training sessions",
        date: null,
        earned: false,
      },
      {
        icon: '<i class="ti ti-ball-football"></i>',
        title: "First clean sheet",
        sub: "Record a 90-min shutout",
        date: null,
        earned: false,
      },
      {
        icon: '<i class="ti ti-chart-bar"></i>',
        title: "Reach 80+ overall rating",
        sub: "Get your overall rating above 80",
        date: null,
        earned: overall !== null && overall >= 80,
      },
    ];

    setMain(`
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Achievements</div>
      ${earned
        .map(
          (a) => `
        <div class="achievement" style="opacity:${a.earned ? "1" : "0.4"};">
          <div class="achievement-icon" style="color:${a.earned ? "var(--gold)" : "var(--text3)"}">
            ${a.icon}
          </div>
          <div>
            <div class="achievement-title">${a.title}</div>
            <div class="achievement-sub">${a.sub}</div>
          </div>
          <div class="achievement-date">
            ${
              a.earned
                ? `<span style="color:var(--green);font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Earned</span>`
                : `<span style="color:var(--text3);font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Locked</span>`
            }
          </div>
        </div>`,
        )
        .join("")}
    </div>

    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Next milestone</div>
      ${
        overall === null
          ? `
        <div style="padding:12px;background:var(--bg2);border-left:2px solid var(--gold);font-size:13px;color:var(--text2)">
          Get your first session rating from your coach to start unlocking achievements.
        </div>`
          : overall < 80
            ? `
        <div style="padding:12px;background:var(--bg2);border-left:2px solid var(--gold);font-size:13px;color:var(--text2)">
          <strong style="color:var(--text)">Reach 80+ overall rating</strong> — You're at ${overall}%. Keep pushing!
        </div>`
            : `
        <div style="padding:12px;background:rgba(26,122,46,.05);border-left:2px solid var(--green);font-size:13px;color:var(--text2)">
          <strong style="color:var(--green)">Elite status reached!</strong> You're at ${overall}%. Outstanding.
        </div>`
      }
    </div>`);
  };

  // ── HEALTH ─────────────────────────────────────────────────
  const health = async (s) => {
    const healthData = (await HF_DB.getHealth(s.userId)) || {
      checkins: {},
      injuries: [],
    };
    const checkins = healthData.checkins || {};
    const todayKey = new Date().toISOString().split("T")[0];
    const todayCheckin = checkins[todayKey]?.values || {};
    const hasCheckedInToday = !!checkins[todayKey];
    const lastCheckin = Object.keys(checkins).sort().pop();

    const sliders = [
      ["sleep", "Sleep quality last night"],
      ["energy", "Energy level today"],
      ["sore", "Muscle soreness (10 = none)"],
      ["focus", "Mental focus & mood"],
      ["hydrate", "Hydration level"],
    ];

    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Daily wellness check-in</div>
        ${
          hasCheckedInToday
            ? `
          <div style="padding:12px;background:rgba(26,122,46,.05);border-left:2px solid var(--green);margin-bottom:16px">
            <div style="font-size:12px;font-weight:600;color:var(--green);margin-bottom:4px">
              <i class="ti ti-circle-check" style="margin-right:6px"></i>Checked in today
            </div>
            <div style="font-size:12px;color:var(--text2)">You have already logged your wellness for today. Come back tomorrow.</div>
          </div>`
            : `
          <div style="font-size:13px;color:var(--text2);margin-bottom:14px">How are you feeling today, ${s.name.split(" ")[0]}?</div>`
        }
        ${sliders
          .map(([id, label]) => {
            const savedVal = todayCheckin[id] || 7;
            return `
            <div class="bar-row">
              <div class="bar-head">
                <span>${label}</span>
                <span id="hv-${id}" style="color:var(--gold);font-weight:600">${savedVal}</span>
              </div>
              <input type="range" min="1" max="10" value="${savedVal}"
                style="width:100%;accent-color:var(--gold);margin-top:4px;${hasCheckedInToday ? "opacity:0.4;pointer-events:none;" : ""}"
                oninput="document.getElementById('hv-${id}').textContent=this.value">
            </div>`;
          })
          .join("")}
        ${
          !hasCheckedInToday
            ? `
          <button class="btn btn-outline btn-sm" style="margin-top:12px"
            onclick="HF_PLAYER.logCheckin('${todayKey}')">
            <i class="ti ti-circle-check"></i> Log check-in
          </button>`
            : ""
        }
      </div>

      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Health status</div>
        ${
          !lastCheckin
            ? `
          <div style="text-align:center;padding:32px;color:var(--text2)">
            <i class="ti ti-heart-rate-monitor" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No check-ins yet</div>
            <div style="font-size:13px">Log your first wellness check-in above to see your health status.</div>
          </div>`
            : `
          <div style="padding:12px;background:rgba(26,122,46,.05);border-left:2px solid var(--green);">
            <div style="font-size:12px;font-weight:600;color:var(--green);margin-bottom:4px">All clear</div>
            <div style="font-size:12px;color:var(--text2)">No injury flags. Cleared for full training.</div>
            <div style="font-size:11px;color:var(--text3);margin-top:6px">Last check-in: ${lastCheckin}</div>
          </div>`
        }
      </div>`);
  };

  // ── HIGHLIGHTS ───────────────────────────────────────────────
  const highlights = (s) => {
    setMain(`
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>My highlights</div>
      <div style="text-align:center;padding:40px 20px;color:var(--text2)">
        <i class="ti ti-video" style="font-size:48px;margin-bottom:12px;display:block;color:var(--text3)"></i>
        <div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:6px">Upload your highlights</div>
        <div style="font-size:13px;margin-bottom:20px;line-height:1.6">Share clips of your best moments.<br>Coaches and scouts can see your game.</div>
        <button class="btn btn-primary" onclick="HF_UTILS.toast('Video upload coming in the next version!','success')">
          <i class="ti ti-upload"></i> Upload video clip
        </button>
      </div>
    </div>`);
  };

  // ── MESSAGES ─────────────────────────────────────────────────
  const messages = (s) => {
    setMain(`
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Messages</div>
      <div style="text-align:center;padding:32px;color:var(--text2)">
        <i class="ti ti-message" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
        <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No messages yet</div>
        <div style="font-size:13px">When coaches or scouts contact you, messages will appear here.</div>
      </div>
    </div>`);
  };

  // ── FAITH ────────────────────────────────────────────────────
  const faith = (s) => {
    setMain(`
      <div class="faith-hero">
        <div style="font-size:32px;margin-bottom:10px"><i class="ti ti-cross"></i></div>
        <div style="font-size:20px;font-weight:700;margin-bottom:6px">Faith & Purpose</div>
        <div style="font-size:13px;opacity:.8;line-height:1.6">Your talent is God-given.<br>Your discipline is your worship.</div>
      </div>
      <div class="faith-verse-card">
        <div class="verse-text">${HF_SCRIPTURE.getToday().verse}</div>
        <div class="verse-ref">${HF_SCRIPTURE.getToday().ref}</div>
      </div>
      <div class="card faith-card">
        <div class="card-title"><div class="card-dot faith"></div>Daily prayers for athletes</div>
        <div class="prayer-card">
          <div class="prayer-title">Morning prayer before training</div>
          <div class="prayer-text">Lord, I come before You this morning with gratitude for the gift of health and the ability to compete. Strengthen my body, sharpen my mind, and guard me from injury today. Let every drop of sweat be an act of worship. Amen.</div>
        </div>
        <div class="prayer-card">
          <div class="prayer-title">Pre-match prayer</div>
          <div class="prayer-text">Father, as I step onto this pitch I surrender the outcome to You. Give me courage, clarity, and the strength to give everything I have. Let me play with joy, compete with integrity, and reflect Your grace. Thank You for this moment. Amen.</div>
        </div>
        <div class="prayer-card">
          <div class="prayer-title">When you're struggling</div>
          <div class="prayer-text">God, I don't understand this season. Injuries, setbacks, doubts, I bring them all to You. Your word says You work all things for good. Help me trust that. Renew my strength. I believe my breakthrough is coming. Amen.</div>
        </div>
      </div>
      <div class="card faith-card">
        <div class="card-title"><div class="card-dot faith"></div>Scripture for every moment</div>
        ${[
          [
            "When you doubt yourself",
            '"For I know the plans I have for you," declares the LORD, "plans to prosper you and not to harm you." ~ Jeremiah 29:11',
          ],
          [
            "Before a big match",
            '"Have I not commanded you? Be strong and courageous. Do not be afraid." ~ Joshua 1:9',
          ],
          [
            "On hard work",
            '"Whatever you do, work at it with all your heart, as working for the Lord." ~ Colossians 3:23',
          ],
          [
            "When injured",
            '"He gives strength to the weary and increases the power of the weak." ~ Isaiah 40:29',
          ],
        ]
          .map(
            ([title, verse]) => `
          <div style="padding:12px;background:var(--faith-lt);border-radius:8px;border-left:3px solid var(--faith);margin-bottom:8px">
            <div style="font-size:11px;font-weight:700;color:var(--faith);margin-bottom:4px">${title}</div>
            <div style="font-size:12px;color:var(--text2);font-style:italic;line-height:1.6">${verse}</div>
          </div>`,
          )
          .join("")}
      </div>`);
  };

  const updateTrainingDay = async (dayIndex, type) => {
    const session = HF_DB.getSession();
    const saved = JSON.parse(localStorage.getItem("hf_training_plan") || "{}");
    saved[dayIndex] = type;
    localStorage.setItem("hf_training_plan", JSON.stringify(saved));

    const existing = await HF_DB.getTraining(session.userId);
    await HF_DB.saveTraining(session.userId, {
      ...existing,
      weeklyPlan: saved,
    });

    HF_UTILS.toast(
      `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIndex]} set to ${type}`,
      "success",
    );
    training(session);
  };

  const logCheckin = async (dateKey) => {
    const session = HF_DB.getSession();
    const healthData = (await HF_DB.getHealth(session.userId)) || {
      checkins: {},
      injuries: [],
    };

    const sliders = ["sleep", "energy", "sore", "focus", "hydrate"];
    const values = {};
    sliders.forEach((id) => {
      const el = document.getElementById(`hv-${id}`);
      values[id] = el ? parseInt(el.textContent) : 7;
    });

    healthData.checkins[dateKey] = {
      values,
      timestamp: new Date().toISOString(),
    };

    await HF_DB.saveHealth(session.userId, healthData);
    HF_UTILS.toast("Wellness logged! Great job checking in.", "success");
    health(session);
  };

  const editProfile = () => {
    const session = HF_DB.getSession();
    profile(session, true);
    const p = session.profile || {};

    document.querySelector(".card").nextElementSibling.innerHTML = `
    <div class="card-title" style="justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:var(--sp-sm);">
        <div class="card-dot"></div>Edit player details
      </div>
    </div>
    <div class="form-row">
      <div class="fg"><label class="required">Position</label>
        <select id="ep-pos">
          <option value="">Select position</option>
          <option ${p.pos === "GK" ? "selected" : ""}>GK</option>
          <option ${p.pos === "CB" ? "selected" : ""}>CB</option>
          <option ${p.pos === "LB" ? "selected" : ""}>LB</option>
          <option ${p.pos === "RB" ? "selected" : ""}>RB</option>
          <option ${p.pos === "DM" ? "selected" : ""}>DM</option>
          <option ${p.pos === "CM" ? "selected" : ""}>CM</option>
          <option ${p.pos === "CAM" ? "selected" : ""}>CAM</option>
          <option ${p.pos === "LW" ? "selected" : ""}>LW</option>
          <option ${p.pos === "RW" ? "selected" : ""}>RW</option>
          <option ${p.pos === "ST" ? "selected" : ""}>ST</option>
        </select>
      </div>
      <div class="fg"><label>Age tier</label>
        <select id="ep-tier">
          <option ${p.tier === "U10" ? "selected" : ""}>U10</option>
          <option ${p.tier === "U12" ? "selected" : ""}>U12</option>
          <option ${p.tier === "U14" ? "selected" : ""}>U14</option>
          <option ${p.tier === "U16" ? "selected" : ""}>U16</option>
          <option ${p.tier === "U18" ? "selected" : ""}>U18</option>
          <option ${p.tier === "U21" ? "selected" : ""}>U21</option>
          <option ${p.tier === "Professional" ? "selected" : ""}>Professional</option>
        </select>
      </div>
    </div>
    <div class="fg"><label class="required">Current club / academy</label>
      <input type="text" id="ep-club" value="${p.club || ""}" placeholder="e.g. Kumasi Wolves FC">
    </div>
    <div class="fg"><label class="required">Hometown / region</label>
      <input type="text" id="ep-hometown" value="${p.hometown || ""}" placeholder="e.g. Kumasi, Ashanti">
    </div>
    <div style="display:flex;gap:8px;margin-top:4px;">
      <button class="btn btn-primary" onclick="HF_PLAYER.saveProfile()">
        <i class="ti ti-circle-check"></i> Save changes
      </button>
      <button class="btn btn-outline" onclick="HF_ROUTER.navTo('profile')">
        Cancel
      </button>
    </div>`;
  };

  const saveProfile = async () => {
    const session = HF_DB.getSession();
    const p = session.profile || {};

    const pos = document.getElementById("ep-pos")?.value;
    const tier = document.getElementById("ep-tier")?.value;
    const club = document.getElementById("ep-club")?.value.trim();
    const hometown = document.getElementById("ep-hometown")?.value.trim();

    if (!pos) {
      HF_UTILS.toast("Please select your position.", "error");
      return;
    }
    if (!club) {
      HF_UTILS.toast("Please enter your club.", "error");
      return;
    }
    if (!hometown) {
      HF_UTILS.toast("Please enter your hometown.", "error");
      return;
    }

    const updatedProfile = { ...p, pos, tier, club, hometown };
    const result = await HF_DB.updateUserProfile(
      session.userId,
      updatedProfile,
    );

    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    session.profile = updatedProfile;
    HF_DB.saveSession(session);

    HF_UTILS.toast("Profile updated!", "success");
    HF_ROUTER.navTo("profile");
  };

  return { render, updateTrainingDay, logCheckin, editProfile, saveProfile };
})();

window.HF_PLAYER = HF_PLAYER;
