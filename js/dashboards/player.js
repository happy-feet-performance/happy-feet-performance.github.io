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
    if (window._stopConfetti) window._stopConfetti();
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

  // ── FIND MY TEAM ───────────────────────────────────────
  const findmyteam = async (s) => {
    const { data: coaches } = await HF_DB.getOpenCoaches();
    const p = s.profile || {};

    setMain(`
    <div class="welcome-banner">
      <div>
        <div class="welcome-title">Find my team</div>
        <div class="welcome-sub">Browse verified coaches looking for players</div>
      </div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:var(--sp-lg);flex-wrap:wrap;">
      <select id="fmt-league" onchange="HF_PLAYER.filterCoaches()" 
        style="padding:7px 10px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:12px;font-family:var(--font);outline:none;">
        <option value="">All leagues</option>
        <option>Ghana Premier League</option>
        <option>Division One League</option>
        <option>MTN FA Cup</option>
        <option>CAF Champions League</option>
        <option>Other</option>
      </select>
      <input type="text" id="fmt-search" placeholder="Search by coach or club name..."
        oninput="HF_PLAYER.filterCoaches()"
        style="flex:1;min-width:150px;padding:7px 10px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:12px;font-family:var(--font);outline:none;">
    </div>

    <div id="coaches-list">
      ${
        !coaches || coaches.length === 0
          ? `
        <div class="card">
          <div style="text-align:center;padding:32px;color:var(--text2)">
            <i class="ti ti-map-search" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No coaches recruiting yet</div>
            <div style="font-size:13px">Verified coaches who are open for recruitment will appear here.</div>
          </div>
        </div>`
          : coaches.map((c) => _coachCard(c, s.userId)).join("")
      }
    </div>`);

    window._fmtAllCoaches = coaches;
    window._fmtUserId = s.userId;
  };

  const _coachCard = (c, playerId) => {
    const p = c.profile || {};
    const safeName = c.name.replace(/'/g, "\\'");
    return `
    <div class="card" style="margin-bottom:var(--sp-md);">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-md);">
        <div style="display:flex;align-items:center;gap:var(--sp-md);">
          <div class="avatar avatar-lg" style="background:var(--gold);width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:18px;font-weight:700;color:#0f0f0d;">
            ${HF_UTILS.initials(c.name)}
          </div>
          <div>
            <div style="font-size:14px;font-weight:600;color:var(--text)">${c.name}</div>
            <div style="font-size:12px;color:var(--text2)">${p.club || "-"}</div>
            <div style="font-size:11px;color:var(--text3)">${p.spec || "Head coach"} · ${p.exp || "-"} yrs exp · ${p.licence || "-"}</div>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-family:var(--font-head);font-size:20px;font-weight:700;color:var(--gold)">${p.teamSize || 0}</div>
          <div style="font-size:10px;color:var(--text3);font-family:var(--font-head);text-transform:uppercase;letter-spacing:0.08em">Players</div>
        </div>
      </div>
      <div style="margin-top:var(--sp-md);padding-top:var(--sp-md);border-top:0.5px solid var(--border);display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" onclick="HF_PLAYER.requestTrial('${c.id}', '${safeName}')">
          <i class="ti ti-send"></i> Request trial
        </button>
        <button class="btn btn-outline btn-sm" onclick="HF_PLAYER.messageCoach('${c.id}', '${safeName}')">
          <i class="ti ti-message"></i> Message
        </button>
      </div>
    </div>`;
  };

  const filterCoaches = () => {
    const league = document.getElementById("fmt-league")?.value;
    const search = document.getElementById("fmt-search")?.value.toLowerCase();
    const list = document.getElementById("coaches-list");
    if (!list || !window._fmtAllCoaches) return;

    const filtered = window._fmtAllCoaches.filter((c) => {
      const p = c.profile || {};
      const matchLeague = !league || p.league === league;
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search) ||
        (p.club || "").toLowerCase().includes(search);
      return matchLeague && matchSearch;
    });

    list.innerHTML =
      filtered.length === 0
        ? `<div class="card"><div style="text-align:center;padding:24px;color:var(--text2);font-size:13px">No coaches match your filters.</div></div>`
        : filtered.map((c) => _coachCard(c, window._fmtUserId)).join("");
  };

  const requestTrial = async (coachId, coachName) => {
    const session = HF_DB.getSession();
    const p = session.profile || {};

    const result = await HF_DB._sendMessage(
      session.userId,
      coachId,
      "Trial request",
      `${session.name} (${p.pos || "Player"} · ${p.tier || "-"} · ${p.hometown || "-"}) has requested a trial with your squad. Check their profile on HappyFeet.`,
    );

    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }
    HF_UTILS.toast(`Trial request sent to ${coachName}!`, "success");
  };

  const messageCoach = async (coachId, coachName) => {
    const session = HF_DB.getSession();
    setMain(`
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Message ${coachName}</div>
      <div class="fg">
        <label class="required">Message</label>
        <textarea id="fmt-msg-body" rows="4" placeholder="Introduce yourself..."
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);resize:vertical;"></textarea>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary" onclick="HF_PLAYER.sendCoachMessage('${coachId}', '${coachName.replace(/'/g, "\\'")}')">
          <i class="ti ti-send"></i> Send
        </button>
        <button class="btn btn-outline" onclick="HF_ROUTER.navTo('findmyteam')">Cancel</button>
      </div>
    </div>`);
  };

  const sendCoachMessage = async (coachId, coachName) => {
    const session = HF_DB.getSession();
    const body = document.getElementById("fmt-msg-body")?.value.trim();
    if (!body) {
      HF_UTILS.toast("Please enter a message.", "error");
      return;
    }

    const result = await HF_DB._sendMessage(
      session.userId,
      coachId,
      `Message from ${session.name}`,
      body,
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    HF_UTILS.toast(`Message sent to ${coachName}!`, "success");
    HF_ROUTER.navTo("findmyteam");
  };

  // ── DASHBOARD ───────────────────────────────────────────────
  const dashboard = async (s) => {
    const p = s.profile || {};
    const r = p.ratings || {};
    const overall = calcRating(r);
    const tracker = await HF_DB.getTracker(s.userId);
    const sessionsThisMonth = tracker?.sessionsThisMonth || 0;
    const faithStreak = p.faithStreak || 0;
    const loginStreak = await HF_DB.getLoginStreak(s.userId);
    const messagesUnread = 0;
    const newUser = HF_UTILS.isNewUser(s);

    setMain(`
    <div class="welcome-banner">
      <div>
        <div class="welcome-title" id="welcome-title">${newUser ? "Welcome" : "Welcome back"}, ${s.name.split(" ")[0]}!</div>
        <div class="welcome-sub">${p.pos || "Player"} · ${p.tier || "U21"} · ${p.status === "unattached" ? "Free Agent" : p.club || "unattached"}</div>
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
        <div class="metric-val" style="color:var(--green)">${loginStreak}</div>
        <div class="metric-label">Daily streak</div>
        <div class="metric-sub" style="color:var(--text2)">${loginStreak === 1 ? "Day 1: keep going!" : `${loginStreak} days in a row`}</div>
      </div>
      <div class="metric-card">
        <div class="metric-val" style="color:var(--faith)">${p.faithStreak || 0}</div>
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
    if (newUser) setTimeout(() => HF_UTILS.launchConfetti(), 300);
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
          <div style="font-size:13px;color:rgba(255,255,255,.55);margin-top:3px;">${p.pos || "-"} · ${p.tier || "-"}</div>
          <div style="margin-top:8px;display:flex;align-items:center;gap:8px;">
            ${badgeHTML("Player", "green")}
            ${
              p.status === "unattached" || !p.club
                ? `<span style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;background:var(--bg3);color:var(--text2);">Free Agent</span>`
                : `<span style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;background:rgba(26,122,46,.15);color:var(--green);">${p.club} <i class="ti ti-circle-check"></i></span>`
            }
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
        <div class="info-cell">
          <div class="info-label">Club status</div>
          <div class="info-val" style="color:${p.status === "unattached" || !p.club ? "var(--text2)" : "var(--green)"}">
            ${p.status === "unattached" || !p.club ? "Free Agent" : p.club + " ✓"}
          </div>
        </div>
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
  const stats = async (s) => {
    const r = s.profile?.ratings || {};
    const overall = calcRating(r);
    const { data: sessions } = await HF_DB.getPlayerSessionRatings(s.userId);
    const hasStats = sessions && sessions.length > 0;

    // build trend from real session data
    const trendData = sessions
      ? [...sessions].reverse().map((s) => s.overall)
      : [];

    setMain(`
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Performance overview</div>
      <div class="metrics-grid" style="grid-template-columns:repeat(3,1fr)">
        <div class="metric-card">
          <div class="metric-val" style="color:var(--gold)">${overall !== null ? overall + "%" : "-"}</div>
          <div class="metric-label">Overall</div>
        </div>
        <div class="metric-card">
          <div class="metric-val" style="color:var(--green)">${sessions?.length || 0}</div>
          <div class="metric-label">Sessions</div>
        </div>
        <div class="metric-card">
          <div class="metric-val" style="color:var(--blue)">
            ${hasStats ? sessions[0].overall + "/100" : "-"}
          </div>
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
          <div style="font-size:13px">Your rating trend will appear once your coach logs session data.</div>
        </div>`
          : `
        ${HF_UTILS.miniChartHTML(trendData)}
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text2);margin-top:6px">
          <span>Oldest</span><span>Latest</span>
        </div>`
      }
    </div>

    ${
      hasStats
        ? `
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Session calendar</div>
        ${HF_UTILS.miniCalendarHTML(sessions, () => "var(--blue)")}
        <div style="display:flex;gap:var(--sp-md);margin-top:var(--sp-md);font-size:11px;color:var(--text2);">
          <div style="display:flex;align-items:center;gap:4px;"><div style="width:10px;height:10px;background:var(--blue);"></div>Session logged</div>
          <div style="display:flex;align-items:center;gap:4px;"><div style="width:10px;height:10px;background:var(--gold);border-radius:50%;"></div>Today</div>
        </div>
      </div>`
        : ""
    }

    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Session history</div>
      ${
        !hasStats
          ? `
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <i class="ti ti-history" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No sessions yet</div>
          <div style="font-size:13px">Session history will appear once your coach starts logging data.</div>
        </div>`
          : `
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Overall</th>
              <th>Speed</th>
              <th>Technical</th>
              <th>Tactical</th>
              <th>Physical</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${sessions
              .map((r) => {
                const isToday = r.created_at?.split("T")[0] === _localDate();
                return `
                <tr style="${isToday ? "background:rgba(196,154,10,.05)" : ""}">
                  <td style="color:${isToday ? "var(--gold)" : "var(--text2)"};font-weight:${isToday ? "600" : "400"}">
                    ${isToday ? "Today" : HF_UTILS.timeAgo(r.created_at)}
                  </td>
                  <td>${r.session_type}</td>
                  <td style="font-weight:700;color:${r.overall >= 80 ? "var(--green)" : r.overall >= 65 ? "var(--gold)" : "var(--red)"}">
                    ${r.overall}
                  </td>
                  <td>${r.speed}</td>
                  <td>${r.technical}</td>
                  <td>${r.tactical}</td>
                  <td>${r.physical}</td>
                  <td>${r.notes}</td>
                </tr>`;
              })
              .join("")}
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

    const key = `hf_training_plan_${s.userId}`;
    const saved = await HF_DB.getTraining(s.userId);
    const plan =
      saved?.weeklyPlan || JSON.parse(localStorage.getItem(key) || "{}");
    const today = new Date().getDay();

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
          <strong style="color:var(--text)">Reach 80+ overall rating</strong>: You're at ${overall}%. Keep pushing!
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
    const { data: todayLog } = await HF_DB.getTodayHealthLog(s.userId);
    const { data: logs } = await HF_DB.getHealthLogs(s.userId);

    const metrics = [
      {
        id: "energy",
        label: "Energy",
        icon: "ti-bolt",
        desc: "Physical energy level",
      },
      {
        id: "mood",
        label: "Mood",
        icon: "ti-mood-smile",
        desc: "Mental state",
      },
      { id: "sleep", label: "Sleep", icon: "ti-moon", desc: "Quality of rest" },
      {
        id: "soreness",
        label: "Soreness",
        icon: "ti-activity",
        desc: "Muscle soreness",
      },
      {
        id: "hydration",
        label: "Hydration",
        icon: "ti-droplet",
        desc: "Water intake",
      },
    ];

    const today = new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const loggedView = todayLog
      ? `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-lg);">
      <div style="font-size:13px;color:var(--text2);">
        <i class="ti ti-circle-check" style="color:var(--green);margin-right:6px"></i>
        Logged today
      </div>
      <button class="btn btn-outline btn-sm" onclick="HF_PLAYER.showHealthSliders()">
        <i class="ti ti-edit"></i> Update
      </button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--sp-sm);">
      ${metrics
        .map((m) => {
          const val = todayLog[m.id] || 0;
          const pct = (val / 10) * 100;
          return `
          <div style="padding:var(--sp-md);background:var(--bg2);border-top:2px solid var(--border);">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
              <i class="ti ${m.icon}" style="color:var(--text2)"></i>
              <span style="font-family:var(--font-head);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text2);">${m.label}</span>
            </div>
            <div style="font-family:var(--font-head);font-size:28px;font-weight:700;color:var(--text);line-height:1;">${val}</div>
            <div style="height:3px;background:var(--border);margin-top:8px;">
              <div style="height:100%;width:${pct}%;background:var(--gold);"></div>
            </div>
            <div style="font-size:10px;color:var(--text3);margin-top:4px">${m.desc}</div>
          </div>`;
        })
        .join("")}
    </div>
    ${
      todayLog.notes
        ? `
      <div style="padding:10px 12px;background:var(--bg2);border-left:2px solid var(--border);font-size:13px;color:var(--text2);margin-top:var(--sp-md);">
        <i class="ti ti-notes" style="margin-right:6px"></i>${todayLog.notes}
      </div>`
        : ""
    }`
      : "";

    const sliderView = `
    <div id="health-sliders">
      ${metrics
        .map(
          (m) => `
        <div style="margin-bottom:var(--sp-md);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <i class="ti ${m.icon}" style="color:var(--text2)"></i>
              <span style="font-size:13px;font-weight:600;color:var(--text)">${m.label}</span>
            </div>
            <span id="hv-${m.id}" style="font-family:var(--font-head);font-size:14px;font-weight:700;color:var(--gold)">
              ${todayLog?.[m.id] || 5}
            </span>
          </div>
          <input type="range" min="1" max="10" value="${todayLog?.[m.id] || 5}" step="1"
            style="width:100%;accent-color:var(--gold)"
            oninput="document.getElementById('hv-${m.id}').textContent=this.value">
        </div>`,
        )
        .join("")}
      <div class="fg">
        <label>Notes</label>
        <input type="text" id="health-notes" value="${todayLog?.notes || ""}" placeholder="Any injuries, illness, or notes..."
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
      </div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn btn-primary" onclick="HF_PLAYER.logHealthCheckin()">
          <i class="ti ti-circle-check"></i> ${todayLog ? "Update check-in" : "Log check-in"}
        </button>
        ${
          todayLog
            ? `
          <button class="btn btn-outline" onclick="HF_PLAYER.showHealthCards()">
            Cancel
          </button>`
            : ""
        }
      </div>
    </div>`;

    setMain(`
    <div class="card">
      <div class="card-title" style="justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">
          <div class="card-dot"></div>Daily wellness check
        </div>
        <span style="font-size:11px;color:var(--text3)">${today}</span>
      </div>

      <div id="health-logged-view">
        ${todayLog ? loggedView : ""}
      </div>
      <div id="health-slider-view" style="${todayLog ? "display:none" : ""}">
        ${sliderView}
      </div>
    </div>

    ${
      logs && logs.length > 0
        ? `
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Check-in calendar</div>
        ${HF_UTILS.miniCalendarHTML(logs, (date) => {
          const log = logs.find((l) => l.date === date);
          if (!log) return "var(--green)";
          const avg = Math.round(
            (log.energy +
              log.mood +
              log.sleep +
              (10 - log.soreness) +
              log.hydration) /
              5,
          );
          return avg >= 8
            ? "var(--green)"
            : avg >= 6
              ? "var(--gold)"
              : "var(--red)";
        })}
        <div style="display:flex;gap:var(--sp-md);margin-top:var(--sp-md);font-size:11px;color:var(--text2);">
          <div style="display:flex;align-items:center;gap:4px;"><div style="width:10px;height:10px;background:var(--green);"></div>Ready</div>
          <div style="display:flex;align-items:center;gap:4px;"><div style="width:10px;height:10px;background:var(--gold);"></div>Monitor</div>
          <div style="display:flex;align-items:center;gap:4px;"><div style="width:10px;height:10px;background:var(--red);"></div>At risk</div>
          <div style="display:flex;align-items:center;gap:4px;"><div style="width:10px;height:10px;background:var(--blue);border-radius:50%;"></div>Today</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Recent wellness history</div>
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th title="Energy"><i class="ti ti-bolt"></i></th>
              <th title="Mood"><i class="ti ti-mood-smile"></i></th>
              <th title="Sleep"><i class="ti ti-moon"></i></th>
              <th title="Soreness"><i class="ti ti-activity"></i></th>
              <th title="Hydration"><i class="ti ti-droplet"></i></th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${logs
              .map((l) => {
                const isToday = l.date === _localDate();
                return `
                <tr style="${isToday ? "background:rgba(196,154,10,.05)" : ""}">
                  <td style="color:${isToday ? "var(--gold)" : "var(--text2)"};font-weight:${isToday ? "600" : "400"}">
                    ${isToday ? "Today" : new Date(l.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                  </td>
                  <td>${l.energy || "-"}</td>
                  <td>${l.mood || "-"}</td>
                  <td>${l.sleep || "-"}</td>
                  <td>${l.soreness || "-"}</td>
                  <td>${l.hydration || "-"}</td>
                  <td style="color:var(--text2);font-size:11px">${l.notes || "-"}</td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>`
        : ""
    }
  `);
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
  const messages = async (s) => {
    const { data: msgs } = await HF_DB.getMessages(s.userId);
    const { data: archived } = await HF_DB.getArchivedMessages(s.userId);
    const { data: invites } = await HF_DB.getSquadInvites(s.userId);

    // enrich messages with sender names
    const enriched = await Promise.all(
      (msgs || []).map(async (m) => ({
        ...m,
        senderName: await HF_DB.getUserNameById(m.from_id),
      })),
    );

    const enrichedArchived = await Promise.all(
      (archived || []).map(async (m) => ({
        ...m,
        senderName: await HF_DB.getUserNameById(m.from_id),
      })),
    );

    setMain(`
    ${
      invites?.length > 0
        ? `
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Squad invites</div>
        ${invites
          .map(
            (inv) => `
          <div style="padding:var(--sp-md);background:var(--bg2);border-left:2px solid var(--gold);margin-bottom:var(--sp-sm);">
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px">
              <i class="ti ti-users"></i> Invite to join ${inv.squad_name}
            </div>
            <div style="font-size:12px;color:var(--text2);margin-bottom:10px">
              ${HF_UTILS.timeAgo(inv.created_at)}
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-primary btn-sm" onclick="HF_PLAYER.respondInvite('${inv.id}','${inv.player_id}',true,'${inv.squad_name}','${inv.coach_id}')">
                <i class="ti ti-circle-check"></i> Accept
              </button>
              <button class="btn btn-danger btn-sm" onclick="HF_PLAYER.respondInvite('${inv.id}','${inv.player_id}',false,'${inv.squad_name}','${inv.coach_id}')">
                <i class="ti ti-x"></i> Decline
              </button>
            </div>
          </div>`,
          )
          .join("")}
      </div>`
        : ""
    }

    <div class="card">
      <div class="card-title" style="justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">
          <div class="card-dot"></div>Messages
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-primary btn-sm" onclick="HF_PLAYER.composeMessage()">
            <i class="ti ti-edit"></i> New message
          </button>
          <button class="btn btn-outline btn-sm" onclick="HF_PLAYER.contactAdmin()">
            <i class="ti ti-headset"></i> Contact admin
          </button>
        </div>
      </div>
      ${
        !msgs || msgs.length === 0
          ? `
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <i class="ti ti-message" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No messages yet</div>
          <div style="font-size:13px">Messages will appear here.</div>
        </div>`
          : HF_UTILS.messageListHTML(enriched, "player")
      }
    </div>

    ${
      archived?.length > 0
        ? `
      <div class="card">
        <div class="card-title" style="cursor:pointer;" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
          <div class="card-dot"></div>Archived
          <span style="margin-left:auto;font-size:11px;color:var(--text3)">
            ${archived.length} · click to expand
          </span>
        </div>
        <div style="display:none">
          ${enrichedArchived
            .map(
              (m) => `
            <div class="msg-item" id="archived-msg-${m.id}" style="cursor:pointer;" 
              onclick="HF_PLAYER.viewThread('${m.thread_id}', '${m.from_id}', '${(m.subject || "").replace(/'/g, "\\'")}')">
              <div class="avatar avatar-md" style="background:var(--bg2);display:flex;align-items:center;justify-content:center;">
                <i class="ti ti-shield" style="font-size:16px;color:var(--text3)"></i>
              </div>
              <div style="flex:1;opacity:0.6">
                <div style="font-size:11px;font-family:var(--font-head);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--text3);margin-bottom:2px;">
                  From: ${m.senderName || (m.from_id === "system" ? "HappyFeet System" : "HappyFeet Admin")}
                </div>
                <div class="msg-name">${m.subject || "Message"}</div>
                <div class="msg-preview">${m.body}</div>
                <div class="msg-time">${HF_UTILS.timeAgo(m.created_at)}</div>
              </div>
              <button class="btn btn-outline btn-sm" style="font-size:10px;padding:2px 8px;flex-shrink:0;"
                title="Move back to inbox"
                onclick="event.stopPropagation();HF_PLAYER.unarchiveMessage('${m.id}')">
                <i class="ti ti-inbox"></i>
              </button>
            </div>`,
            )
            .join("")}
        </div>
      </div>`
        : ""
    }`);
  };

  // ── FAITH ────────────────────────────────────────────────────
  const faith = async (s) => {
    const todayKey = _localDate();
    const storageKey = `hf_faith_checklist_${s.userId}_${todayKey}`;
    const checked = JSON.parse(localStorage.getItem(storageKey) || "[]");

    const prayers = [
      {
        id: "morning",
        title: "Morning prayer",
        desc: "Before training: Lord, strengthen my body and sharpen my mind.",
      },
      {
        id: "prematch",
        title: "Pre-match prayer",
        desc: "Father, as I step onto this pitch I surrender the outcome to You.",
      },
      {
        id: "struggle",
        title: "When you're struggling",
        desc: "God, I don't understand this season. Renew my strength.",
      },
    ];

    const allChecked = prayers.every((p) => checked.includes(p.id));

    setMain(`
    <div class="faith-hero">
      <i class="ti ti-cross" style="font-size:32px;margin-bottom:10px;display:block;color:var(--faith)"></i>
      <div style="font-size:20px;font-weight:700;margin-bottom:6px">Faith & Purpose</div>
      <div style="font-size:13px;opacity:.8">Your talent is God-given. Your discipline is your worship.</div>
    </div>

    <div class="faith-verse-card">
      <div class="verse-text">${HF_SCRIPTURE.getToday().verse}</div>
      <div class="verse-ref">${HF_SCRIPTURE.getToday().ref}</div>
    </div>

    <div class="card faith-card">
      <div class="card-title" style="justify-content:space-between;padding-top:var(--sp-md);">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">
          Daily prayers
        </div>
        ${
          allChecked
            ? `
          <span style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;background:rgba(26,122,46,.15);color:var(--green);">
            <i class="ti ti-circle-check"></i> All done
          </span>`
            : `
          <span style="font-family:var(--font-head);font-size:10px;color:var(--text3);">
            ${checked.length}/${prayers.length} completed
          </span>`
        }
      </div>

      ${prayers
        .map((p) => {
          const isChecked = checked.includes(p.id);
          return `
          <div style="display:flex;align-items:flex-start;gap:var(--sp-md);padding:var(--sp-md);background:var(--bg2);border-left:2px solid ${isChecked ? "var(--green)" : "var(--faith)"};margin-bottom:var(--sp-sm);cursor:pointer;transition:var(--trans);"
            onclick="HF_PLAYER.togglePrayer('${p.id}', '${todayKey}', '${s.userId}')">
            <div style="width:20px;height:20px;border:2px solid ${isChecked ? "var(--green)" : "var(--faith)"};background:${isChecked ? "var(--green)" : "transparent"};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">
              ${isChecked ? '<i class="ti ti-check" style="font-size:12px;color:#fff;"></i>' : ""}
            </div>
            <div>
              <div style="font-family:var(--font);font-size:13px;font-weight:600;color:${isChecked ? "var(--green)" : "var(--faith)"};margin-bottom:4px;${isChecked ? "text-decoration:line-through;" : ""}">
                ${p.title}
              </div>
              <div style="font-size:12px;color:var(--text2);font-style:italic;line-height:1.5;${isChecked ? "opacity:0.5;" : ""}">
                ${p.desc}
              </div>
            </div>
          </div>`;
        })
        .join("")}

      ${
        allChecked
          ? `
        <div style="text-align:center;padding:var(--sp-lg);color:var(--faith);font-size:13px;font-style:italic;">
          <i class="ti ti-heart" style="margin-right:6px"></i>
          All prayers completed for today. Come back tomorrow.
        </div>`
          : ""
      }
    </div>

    <div class="card faith-card">
      <div class="card-title" style="justify-content:space-between;padding-top:var(--sp-md);">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">Scripture for every moment</div>
      ${[
        [
          "When you doubt yourself",
          '"For I know the plans I have for you," declares the LORD. ~ Jeremiah 29:11',
        ],
        [
          "Before a big match",
          "Have I not commanded you? Be strong and courageous. ~ Joshua 1:9",
        ],
        [
          "On hard work",
          "Whatever you do, work at it with all your heart. ~ Colossians 3:23",
        ],
        ["When injured", "He gives strength to the weary. ~ Isaiah 40:29"],
      ]
        .map(
          ([title, verse]) => `
        <div style="padding:12px;background:var(--faith-lt);border-radius:0;border-left:3px solid var(--faith);margin-bottom:8px">
          <div style="font-size:11px;font-weight:700;color:var(--faith);margin-bottom:4px">${title}</div>
          <div style="font-size:12px;color:var(--text2);font-style:italic;line-height:1.6">${verse}</div>
        </div>`,
        )
        .join("")}
    </div>`);
  };

  const updateTrainingDay = async (dayIndex, type) => {
    const session = HF_DB.getSession();
    const key = `hf_training_plan_${session.userId}`;
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    saved[dayIndex] = type;
    localStorage.setItem(key, JSON.stringify(saved));

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

  const logHealthCheckin = async () => {
    const session = HF_DB.getSession();

    const data = {
      energy: parseInt(document.getElementById("hv-energy")?.textContent || 5),
      mood: parseInt(document.getElementById("hv-mood")?.textContent || 5),
      sleep: parseInt(document.getElementById("hv-sleep")?.textContent || 5),
      soreness: parseInt(
        document.getElementById("hv-soreness")?.textContent || 5,
      ),
      hydration: parseInt(
        document.getElementById("hv-hydration")?.textContent || 5,
      ),
      notes: document.getElementById("health-notes")?.value.trim() || null,
    };

    const result = await HF_DB.saveHealthLog(session.userId, data);
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    HF_UTILS.toast("Health check-in logged!", "success");
    health(session);
  };

  const editProfile = (editing = true) => {
    const session = HF_DB.getSession();
    const p = session.profile || {};

    setMain(`
    <div style="background:#0f0f0d;padding:var(--sp-2xl);margin-bottom:var(--sp-lg);display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-lg);">
      <div style="display:flex;align-items:center;gap:var(--sp-lg);">
        <div style="position:relative;">
          <div style="width:72px;height:72px;background:#1a7a2e;display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:26px;font-weight:700;color:#fff;">
            ${HF_UTILS.initials(session.name)}
          </div>
          <button onclick="HF_UTILS.toast('Profile photo upload coming soon!','success')"
            style="position:absolute;bottom:-8px;right:-8px;width:24px;height:24px;background:var(--gold);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#0f0f0d;">
            <i class="ti ti-camera" style="font-size:12px"></i>
          </button>
        </div>
        <div>
          <div style="font-family:var(--font-head);font-size:22px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">${session.name}</div>
          <div style="font-size:13px;color:rgba(255,255,255,.55);margin-top:3px;">${p.pos || "-"} · ${p.tier || "-"}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Edit profile</div>
      <div class="fg">
        <label class="required">Full name</label>
        <input type="text" id="ep-name" value="${session.name || ""}" placeholder="Your full name"
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
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
      <div class="fg"><label class="required">Hometown / region</label>
        <input type="text" id="ep-hometown" value="${p.hometown || ""}" placeholder="e.g. Kumasi, Ashanti"
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
      </div>
      ${
        !p.club
          ? `
        <div style="padding:12px;background:var(--bg2);border-left:2px solid var(--border);font-size:13px;color:var(--text2);margin-bottom:var(--sp-md)">
          <i class="ti ti-info-circle" style="margin-right:6px"></i>
          Your club is assigned by your coach once you join a verified squad.
        </div>`
          : `
        <div style="padding:12px;background:rgba(26,122,46,.05);border-left:2px solid var(--green);font-size:13px;color:var(--text2);margin-bottom:var(--sp-md)">
          <i class="ti ti-circle-check" style="margin-right:6px;color:var(--green)"></i>
          You are currently signed to <strong style="color:var(--green)">${p.club}</strong>.
        </div>`
      }
      <div style="display:flex;gap:8px;margin-top:4px;">
        <button class="btn btn-primary" onclick="HF_PLAYER.saveProfile()">
          <i class="ti ti-circle-check"></i> Save changes
        </button>
        <button class="btn btn-outline" onclick="HF_ROUTER.navTo('profile')">Cancel</button>
      </div>
    </div>`);
  };

  const saveProfile = async () => {
    const session = HF_DB.getSession();
    const p = session.profile || {};
    const name = document.getElementById("ep-name")?.value.trim();
    const pos = document.getElementById("ep-pos")?.value;
    const tier = document.getElementById("ep-tier")?.value;
    const hometown = document.getElementById("ep-hometown")?.value.trim();

    if (!name) {
      HF_UTILS.toast("Please enter your full name.", "error");
      return;
    }
    if (!pos) {
      HF_UTILS.toast("Please select your position.", "error");
      return;
    }
    if (!hometown) {
      HF_UTILS.toast("Please enter your hometown.", "error");
      return;
    }

    // update name if changed
    if (name !== session.name) {
      const nameResult = await HF_DB.updateUserName(session.userId, name);
      if (nameResult.error) {
        HF_UTILS.toast(nameResult.error, "error");
        return;
      }
      session.name = name;
    }

    const updatedProfile = { ...p, pos, tier, hometown };
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

    // update topbar name display
    const nameDisplay = document.getElementById("topbar-name-display");
    if (nameDisplay) nameDisplay.textContent = name;

    HF_UTILS.toast("Profile updated!", "success");
    HF_ROUTER.navTo("profile");
  };

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

      // update coach team size
      await HF_DB.incrementTeamSize(coachId);

      HF_UTILS.toast(`Welcome to ${squadName}!`, "success");
    } else {
      HF_UTILS.toast("Invite declined.", "success");
    }

    messages(HF_DB.getSession());
  };

  const readMessage = async (messageId, el) => {
    const badge = document.getElementById(`badge-${messageId}`);
    if (badge) badge.remove();

    await HF_DB.markMessageRead(messageId);

    const session = HF_DB.getSession();
    const { data: msgs } = await HF_DB.getMessages(session.userId);
    const unreadCount = msgs?.filter((m) => !m.read).length || 0;
    HF_ROUTER.refreshSidenavBadge("messages", unreadCount, "var(--red)");

    // find the message and show body in a modal
    const msg = msgs?.find((m) => m.id === messageId);
    if (msg) {
      const overlay = document.createElement("div");
      overlay.id = `msg-modal-${messageId}`;
      overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:flex;align-items:center;justify-content:center;padding:var(--sp-xl);`;
      overlay.innerHTML = `
      <div style="background:var(--bg);border-top:3px solid var(--gold);padding:var(--sp-2xl);max-width:480px;width:100%;">
        <div style="font-family:var(--font-head);font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text3);margin-bottom:4px;">
          HappyFeet ${msg.from_id === "system" ? "System" : "Admin"}
        </div>
        <div style="font-family:var(--font-head);font-size:16px;font-weight:700;color:var(--text);margin-bottom:var(--sp-md);">
          ${msg.subject || "Message"}
        </div>
        <div style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:var(--sp-xl);">
          ${msg.body}
        </div>
        <button class="btn btn-primary" onclick="document.getElementById('msg-modal-${messageId}').remove();HF_ROUTER.navTo('messages');">
          <i class="ti ti-circle-check"></i> Got it
        </button>
      </div>`;
      document.body.appendChild(overlay);
    }

    messages(session);
  };

  const archiveMessage = async (messageId) => {
    await HF_DB.archiveMessage(messageId);

    const session = HF_DB.getSession();
    const { data: msgs } = await HF_DB.getMessages(session.userId);
    const unreadCount = msgs?.filter((m) => !m.read).length || 0;
    HF_ROUTER.refreshSidenavBadge("messages", unreadCount, "var(--red)");

    HF_UTILS.toast("Message archived.", "success");
    messages(session);
  };

  const unarchiveMessage = async (messageId) => {
    await HF_DB.unarchiveMessage(messageId);
    HF_UTILS.toast("Message unarchived.", "success");
    messages(HF_DB.getSession());
  };

  const togglePrayer = (prayerId, dateKey, userId) => {
    const storageKey = `hf_faith_checklist_${userId}_${dateKey}`;
    const checked = JSON.parse(localStorage.getItem(storageKey) || "[]");

    const idx = checked.indexOf(prayerId);
    if (idx > -1) {
      checked.splice(idx, 1);
    } else {
      checked.push(prayerId);
      // update faith streak if all prayers done
      const prayers = ["morning", "prematch", "struggle"];
      if (prayers.every((p) => checked.includes(p))) {
        const session = HF_DB.getSession();
        const profile = session.profile || {};
        const lastStreakKey = `hf_faith_streak_date_${userId}`;
        const lastDate = localStorage.getItem(lastStreakKey);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = yesterday.toISOString().split("T")[0];

        const newStreak =
          lastDate === yesterdayKey ? (profile.faithStreak || 0) + 1 : 1;

        localStorage.setItem(lastStreakKey, dateKey);
        const updatedProfile = { ...profile, faithStreak: newStreak };
        HF_DB.updateUserProfile(userId, updatedProfile).then(() => {
          session.profile = updatedProfile;
          HF_DB.saveSession(session);
        });

        HF_UTILS.toast(
          `Faith streak: ${newStreak} days! Keep going.`,
          "success",
        );
      }
    }

    localStorage.setItem(storageKey, JSON.stringify(checked));
    faith(HF_DB.getSession());
  };

  const contactAdmin = () => {
    setMain(`
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Contact admin</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:var(--sp-lg)">
        Send a message to the HappyFeet admin team for any account or platform related issues.
      </div>
      <div class="fg">
        <label class="required">Subject</label>
        <select id="contact-subject" onchange="HF_PLAYER.toggleCustomSubject(this.value)"
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
          <option value="">Select a subject</option>
          <option>Account issue</option>
          <option>Report a problem</option>
          <option>Squad dispute</option>
          <option>Appeal a ban or kick</option>
          <option value="custom">Other (custom reason)</option>
        </select>
      </div>
      <div class="fg" id="custom-subject-field" style="display:none;">
        <label class="required">Custom subject</label>
        <input type="text" id="contact-custom-subject" placeholder="Enter your subject..."
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
      </div>
      <div class="fg">
        <label class="required">Message</label>
        <textarea id="contact-body" rows="4" placeholder="Describe your issue..."
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);resize:vertical;"></textarea>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary" onclick="HF_PLAYER.sendAdminMessage()">
          <i class="ti ti-send"></i> Send message
        </button>
        <button class="btn btn-outline" onclick="HF_ROUTER.navTo('messages')">Cancel</button>
      </div>
    </div>`);
  };

  const toggleCustomSubject = (value) => {
    const field = document.getElementById("custom-subject-field");
    if (field) field.style.display = value === "custom" ? "block" : "none";
  };

  const sendAdminMessage = async () => {
    const session = HF_DB.getSession();
    const subjectSelect = document.getElementById("contact-subject")?.value;
    const customSubject = document
      .getElementById("contact-custom-subject")
      ?.value.trim();
    const body = document.getElementById("contact-body")?.value.trim();

    const subject = subjectSelect === "custom" ? customSubject : subjectSelect;

    if (!subject) {
      HF_UTILS.toast("Please enter a subject.", "error");
      return;
    }
    if (!body) {
      HF_UTILS.toast("Please enter your message.", "error");
      return;
    }

    const adminIds = await HF_DB.getAdminIds();
    for (const adminId of adminIds) {
      await HF_DB._sendMessage(
        session.userId,
        adminId,
        `[Player] ${subject}`,
        body,
      );
    }

    HF_UTILS.toast("Message sent to admin!", "success");
    HF_ROUTER.navTo("messages");
  };

  const composeMessage = () => {
    const session = HF_DB.getSession();
    setMain(`
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>New message</div>
      <div class="fg">
        <label class="required">To</label>
        <div id="compose-to-container" style="display:flex;flex-wrap:wrap;gap:4px;padding:8px;background:var(--bg2);border:0.5px solid var(--border);min-height:44px;cursor:text;" onclick="document.getElementById('compose-search').focus()">
          <div id="compose-tags" style="display:flex;flex-wrap:wrap;gap:4px;"></div>
          <input type="text" id="compose-search" placeholder="Search by name or email..."
            oninput="HF_${session.role.toUpperCase()}.searchRecipients(this.value)"
            style="flex:1;min-width:150px;border:none;background:transparent;color:var(--text);font-size:13px;font-family:var(--font);outline:none;padding:2px 4px;">
        </div>
        <div id="compose-search-results" style="margin-top:2px;border:0.5px solid var(--border);background:var(--bg);display:none;"></div>
        <input type="hidden" id="compose-to-ids">
      </div>
      <div class="fg">
        <label class="required">Subject</label>
        <input type="text" id="compose-subject" placeholder="Message subject"
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
      </div>
      <div class="fg">
        <label class="required">Message</label>
        <textarea id="compose-body" rows="5" placeholder="Write your message..."
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);resize:vertical;"></textarea>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary" onclick="HF_${session.role.toUpperCase()}.sendComposedMessage()">
          <i class="ti ti-send"></i> Send
        </button>
        <button class="btn btn-outline" onclick="HF_ROUTER.navTo('messages')">Cancel</button>
      </div>
    </div>`);

    // store selected recipients
    window._composeRecipients = [];
  };

  const searchRecipients = async (query) => {
    const results = document.getElementById("compose-search-results");
    if (!results) return;
    if (!query || query.length < 2) {
      results.style.display = "none";
      results.innerHTML = "";
      return;
    }

    const session = HF_DB.getSession();
    const { data } = await HF_DB.searchAllUsers(query, session.userId);
    const existing = window._composeRecipients?.map((r) => r.id) || [];
    const filtered = data?.filter((u) => !existing.includes(u.id)) || [];

    if (!filtered || filtered.length === 0) {
      results.style.display = "none";
      return;
    }

    results.style.display = "block";
    results.innerHTML = filtered
      .map(
        (u) => `
    <div style="display:flex;align-items:center;gap:var(--sp-md);padding:10px;cursor:pointer;border-bottom:0.5px solid var(--border);"
      onmousedown="event.preventDefault();HF_${session.role.toUpperCase()}.selectRecipient('${u.id}', '${u.name.replace(/'/g, "\\'")}', '${u.role}')">
      <div class="avatar avatar-sm" style="background:${u.role === "player" ? "var(--green)" : u.role === "coach" ? "var(--gold)" : u.role === "admin" ? "var(--red)" : "var(--blue)"}">
        ${HF_UTILS.initials(u.name)}
      </div>
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--text)">${u.name}</div>
        <div style="font-size:11px;color:var(--text2)">${u.role}</div>
      </div>
    </div>`,
      )
      .join("");
  };

  const selectRecipient = (userId, userName, userRole) => {
    if (!window._composeRecipients) window._composeRecipients = [];

    // don't add duplicates
    if (window._composeRecipients.find((r) => r.id === userId)) return;

    window._composeRecipients.push({
      id: userId,
      name: userName,
      role: userRole,
    });

    // add tag chip
    const tags = document.getElementById("compose-tags");
    const tag = document.createElement("div");
    tag.id = `tag-${userId}`;
    tag.style.cssText = `display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:var(--gold);color:#0f0f0d;font-size:12px;font-weight:600;font-family:var(--font-head);letter-spacing:0.04em;`;
    tag.innerHTML = `
    ${userName}
    <span style="cursor:pointer;font-size:14px;font-weight:700;line-height:1;" 
      onclick="HF_${HF_DB.getSession().role.toUpperCase()}.removeRecipient('${userId}')">×</span>`;
    tags?.appendChild(tag);

    const clearAll = document.getElementById("compose-clear-all");
    if (!clearAll && window._composeRecipients.length > 1) {
      const link = document.createElement("div");
      link.id = "compose-clear-all";
      link.style.cssText =
        "font-size:11px;color:var(--text3);cursor:pointer;padding:2px 4px;text-decoration:underline;";
      link.textContent = "Clear all";
      link.onclick = () => {
        window._composeRecipients = [];
        document.getElementById("compose-tags").innerHTML = "";
        link.remove();
      };
      document.getElementById("compose-to-container")?.appendChild(link);
    }

    // remove clear all if back to 0 or 1
    if (window._composeRecipients.length <= 1) {
      document.getElementById("compose-clear-all")?.remove();
    }

    // clear search
    const search = document.getElementById("compose-search");
    const results = document.getElementById("compose-search-results");
    if (search) {
      search.value = "";
      search.focus();
    }
    if (results) {
      results.style.display = "none";
      results.innerHTML = "";
    }
  };

  const removeRecipient = (userId) => {
    window._composeRecipients =
      window._composeRecipients?.filter((r) => r.id !== userId) || [];
    document.getElementById(`tag-${userId}`)?.remove();
    if (window._composeRecipients.length <= 1) {
      document.getElementById("compose-clear-all")?.remove();
    }
  };

  const sendComposedMessage = async () => {
    const session = HF_DB.getSession();
    const recipients = window._composeRecipients || [];
    const subject = document.getElementById("compose-subject")?.value.trim();
    const body = document.getElementById("compose-body")?.value.trim();

    if (recipients.length === 0) {
      HF_UTILS.toast("Please select at least one recipient.", "error");
      return;
    }
    if (!subject) {
      HF_UTILS.toast("Please enter a subject.", "error");
      return;
    }
    if (!body) {
      HF_UTILS.toast("Please enter a message.", "error");
      return;
    }

    for (const recipient of recipients) {
      await HF_DB._sendMessage(session.userId, recipient.id, subject, body);
    }

    window._composeRecipients = [];
    HF_UTILS.toast(
      `Message sent to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}!`,
      "success",
    );
    HF_ROUTER.navTo("messages");
  };

  const toggleMsgActions = (messageId, fromId, senderName) => {
    const actions = document.getElementById(`msg-actions-${messageId}`);
    if (actions)
      actions.style.display =
        actions.style.display === "none" ? "block" : "none";
  };

  const replyToMessage = (messageId, fromId, senderName, subject) => {
    if (!fromId || fromId === "admin" || fromId === "system") {
      HF_UTILS.toast("You cannot reply to system messages.", "error");
      return;
    }
    const session = HF_DB.getSession();
    setMain(`
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Reply to ${senderName}</div>
      <div style="padding:10px 12px;background:var(--bg2);border-left:2px solid var(--border);font-size:12px;color:var(--text2);margin-bottom:var(--sp-md);">
        <i class="ti ti-arrow-back-up" style="margin-right:6px"></i>
        Replying to: <strong style="color:var(--text)">${subject || "Message"}</strong>
      </div>
      <div class="fg">
        <label class="required">Message</label>
        <textarea id="reply-body" rows="4" placeholder="Write your reply..."
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);resize:vertical;"></textarea>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary" onclick="HF_${session.role.toUpperCase()}.sendReply('${fromId}', 'Re: ${(subject || "Message").replace(/'/g, "\\'")}')">
          <i class="ti ti-send"></i> Send reply
        </button>
        <button class="btn btn-outline" onclick="HF_ROUTER.navTo('messages')">Cancel</button>
      </div>
    </div>`);
  };

  const sendReply = async (toId, subject, threadId) => {
    const session = HF_DB.getSession();
    const body = document.getElementById("reply-body")?.value.trim();
    if (!body) {
      HF_UTILS.toast("Please enter a reply.", "error");
      return;
    }

    // detect emoji-only and launch confetti
    const emojiOnly =
      body
        .replace(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu, "")
        .trim().length === 0;
    if (emojiOnly) {
      const firstEmoji = body.match(
        /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu,
      )?.[0];
      if (firstEmoji) HF_UTILS.launchEmojiConfetti(firstEmoji);
    }

    const result = await HF_DB._sendMessage(
      session.userId,
      toId,
      subject,
      body,
      threadId,
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    document.getElementById("reply-body").value = "";
    viewThread(threadId, toId, subject);
  };

  const viewThread = async (threadId, otherUserId, subject) => {
    const session = HF_DB.getSession();
    const { data: msgs } = await HF_DB.getThread(threadId, session.userId);

    const isEmojiOnly = (text) => {
      const stripped = text
        .replace(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu, "")
        .trim();
      return stripped.length === 0;
    };

    const renderMessageBody = (body) => {
      return body.replace(
        /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu,
        `<span class="emoji-animate" style="font-size:1.3em;cursor:pointer;display:inline-block;"
      onclick="HF_UTILS.launchEmojiConfetti('$1');this.style.transform='scale(1.8)';setTimeout(()=>this.style.transform='scale(1)',200)">$1</span>`,
      );
    };

    // mark all unread messages in thread as read
    const unread =
      msgs?.filter((m) => !m.read && m.to_id === session.userId) || [];
    for (const m of unread) await HF_DB.markMessageRead(m.id);

    // enrich with sender names
    const enriched = await Promise.all(
      (msgs || []).map(async (m) => ({
        ...m,
        senderName: await HF_DB.getUserNameById(m.from_id),
      })),
    );

    setMain(`
    <div style="display:flex;align-items:center;gap:var(--sp-md);margin-bottom:var(--sp-lg);">
      <button class="btn btn-outline btn-sm" onclick="HF_ROUTER.navTo('messages')">
        <i class="ti ti-arrow-left"></i> Back
      </button>
      <div style="font-family:var(--font-head);font-size:14px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:var(--text);">
        ${subject || "Conversation"}
      </div>
    </div>

    <div class="card" style="padding:0;overflow:hidden;">
      <div style="padding:var(--sp-lg);display:flex;flex-direction:column;gap:var(--sp-md);min-height:300px;max-height:60vh;overflow-y:auto;" id="thread-messages">
        ${enriched
          .map((m) => {
            const isMine = m.from_id === session.userId;
            const emojiOnly = isEmojiOnly(m.body);
            return `
            <div style="display:flex;flex-direction:column;align-items:${isMine ? "flex-end" : "flex-start"};">
              <div style="font-size:10px;color:var(--text3);margin-bottom:3px;font-family:var(--font-head);letter-spacing:0.04em;">
                ${isMine ? "You" : m.senderName} · ${HF_UTILS.timeAgo(m.created_at)}
              </div>
              <div style="
                max-width:75%;
                padding:${emojiOnly ? "4px" : "10px 14px"};
                background:${emojiOnly ? "transparent" : isMine ? "var(--gold)" : "var(--bg2)"};
                color:${isMine && !emojiOnly ? "#0f0f0d" : "var(--text)"};
                font-size:${emojiOnly ? "32px" : "13px"};
                line-height:1.5;">
                ${renderMessageBody(m.body)}
              </div>
            </div>`;
          })
          .join("")}
      </div>

      <div style="padding:var(--sp-md);border-top:0.5px solid var(--border);background:var(--bg);">
        <div id="emoji-picker" style="display:none;padding:var(--sp-sm);background:var(--bg2);border:0.5px solid var(--border);margin-bottom:8px;flex-wrap:wrap;gap:4px;">
          ${[
            "😀",
            "😂",
            "😍",
            "🔥",
            "👏",
            "💪",
            "⚽",
            "🏆",
            "🎯",
            "👊",
            "🙏",
            "❤️",
            "😤",
            "😭",
            "🤝",
            "✅",
            "💯",
            "🚀",
            "👋",
            "😎",
            "🤔",
            "😅",
            "🥅",
            "🎉",
            "👍",
            "👎",
            "❌",
            "⚡",
            "🌟",
            "😴",
          ]
            .map(
              (e) => `
            <span style="font-size:24px;cursor:pointer;width:42px;height:42px;display:inline-flex;align-items:center;justify-content:center;transition:transform 0.15s ease;"
              onmouseover="this.style.transform='scale(1.3)'"
              onmouseout="this.style.transform='scale(1)'"
              onclick="document.getElementById('reply-body').value += '${e}';this.style.transform='scale(1.5)';setTimeout(()=>this.style.transform='scale(1)',150)">
              ${e}
            </span>`,
            )
            .join("")}
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="text" id="reply-body" placeholder="Write a reply..."
            style="flex:1;padding:0 12px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:13px;font-family:var(--font);outline:none;height:42px;box-sizing:border-box;">
          <button class="btn btn-outline" style="height:42px;width:42px;min-height:42px;padding:0;box-sizing:border-box;display:flex;align-items:center;justify-content:center;flex-shrink:0;"
            title="Emoji"
            onclick="const p=document.getElementById('emoji-picker');p.style.display=p.style.display==='none'?'flex':'none'">
            <i class="ti ti-mood-smile"></i>
          </button>
          <button class="btn btn-primary" style="height:42px;width:42px;min-height:42px;padding:0;box-sizing:border-box;display:flex;align-items:center;justify-content:center;flex-shrink:0;"
            onclick="HF_${session.role.toUpperCase()}.sendReply('${otherUserId}', '${(subject || "").replace(/'/g, "\\'")}', '${threadId}')">
            <i class="ti ti-send"></i>
          </button>
        </div>
      </div>
    </div>`);

    setTimeout(() => {
      const threadEl = document.getElementById("thread-messages");
      if (threadEl) threadEl.scrollTop = threadEl.scrollHeight;

      // enter key sends message
      const replyInput = document.getElementById("reply-body");
      if (replyInput) {
        replyInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            HF_DB.getSession() &&
              window[
                `HF_${HF_DB.getSession().role.toUpperCase()}`
              ]?.sendReply?.(otherUserId, subject, threadId);
          }
        });
      }
    }, 100);
  };

  const viewSenderProfile = async (userId) => {
    const { data: user } = await HF_DB.getUserById(userId);
    if (!user) {
      HF_UTILS.toast("User not found.", "error");
      return;
    }
    const p = user.profile || {};
    const overall = p.ratings
      ? Math.round(
          (p.ratings.speed + p.ratings.tech + p.ratings.tact + p.ratings.phys) /
            4,
        )
      : null;

    setMain(`
    <div style="background:#0f0f0d;padding:var(--sp-2xl);margin-bottom:var(--sp-lg);display:flex;align-items:flex-start;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:var(--sp-lg);">
        <div style="width:72px;height:72px;background:var(--green);display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:26px;font-weight:700;color:#fff;">
          ${HF_UTILS.initials(user.name)}
        </div>
        <div>
          <div style="font-family:var(--font-head);font-size:22px;font-weight:700;color:#fff;">${user.name}</div>
          <div style="font-size:13px;color:rgba(255,255,255,.55)">${p.pos || p.org || "-"} · ${p.tier || p.exp + " yrs exp" || "-"}</div>
          <div style="margin-top:8px">${HF_UTILS.badgeHTML(user.role, user.role === "player" ? "green" : user.role === "coach" ? "gold" : "blue")}</div>
        </div>
      </div>
      ${
        overall !== null
          ? `
        <div style="text-align:right">
          <div style="font-family:var(--font-head);font-size:42px;font-weight:700;color:var(--gold)">${overall}%</div>
          <div style="font-size:10px;color:rgba(255,255,255,.4);font-family:var(--font-head);text-transform:uppercase;letter-spacing:0.1em">Overall</div>
        </div>`
          : ""
      }
    </div>
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Details</div>
      <div class="info-grid">
        ${p.pos ? `<div class="info-cell"><div class="info-label">Position</div><div class="info-val">${p.pos}</div></div>` : ""}
        ${p.tier ? `<div class="info-cell"><div class="info-label">Tier</div><div class="info-val">${p.tier}</div></div>` : ""}
        ${p.hometown ? `<div class="info-cell"><div class="info-label">Hometown</div><div class="info-val">${p.hometown}</div></div>` : ""}
        ${p.org ? `<div class="info-cell"><div class="info-label">Organisation</div><div class="info-val">${p.org}</div></div>` : ""}
        ${p.exp ? `<div class="info-cell"><div class="info-label">Experience</div><div class="info-val">${p.exp} years</div></div>` : ""}
        ${p.club ? `<div class="info-cell"><div class="info-label">Club</div><div class="info-val">${p.club}</div></div>` : ""}
      </div>
    </div>
    <button class="btn btn-outline" onclick="HF_ROUTER.navTo('messages')" style="margin-top:8px">
      <i class="ti ti-arrow-left"></i> Back to messages
    </button>`);
  };

  const reportToAdmin = async (fromId, senderName) => {
    const session = HF_DB.getSession();
    const reason = prompt(
      `Report ${senderName} to admin?\n\nPlease describe the issue:`,
    );
    if (!reason) return;

    const adminIds = await HF_DB.getAdminIds();
    for (const adminId of adminIds) {
      await HF_DB._sendMessage(
        session.userId,
        adminId,
        `[Report] User: ${senderName}`,
        `${session.name} has reported ${senderName}.\n\nReason: ${reason}`,
      );
    }

    HF_UTILS.toast(`${senderName} has been reported to admin.`, "success");
  };

  const showHealthSliders = () => {
    document.getElementById("health-logged-view").style.display = "none";
    document.getElementById("health-slider-view").style.display = "block";
  };

  const showHealthCards = () => {
    document.getElementById("health-logged-view").style.display = "block";
    document.getElementById("health-slider-view").style.display = "none";
  };

  return {
    render,
    updateTrainingDay,
    logHealthCheckin,
    showHealthSliders,
    showHealthCards,
    editProfile,
    saveProfile,
    respondInvite,
    readMessage,
    archiveMessage,
    unarchiveMessage,
    togglePrayer,
    contactAdmin,
    toggleCustomSubject,
    sendAdminMessage,
    composeMessage,
    sendComposedMessage,
    searchRecipients,
    selectRecipient,
    removeRecipient,
    viewThread,
    toggleMsgActions,
    replyToMessage,
    sendReply,
    viewSenderProfile,
    reportToAdmin,
    filterCoaches,
    requestTrial,
    messageCoach,
    sendCoachMessage,
  };
})();

window.HF_PLAYER = HF_PLAYER;
