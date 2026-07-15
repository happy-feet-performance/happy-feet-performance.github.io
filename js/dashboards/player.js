/**
 * HappyFeet: dashboards/player.js
 * All views for the Player role.
 */

const HF_PLAYER = (() => {
  const { barHTML, miniChartHTML, avatarHTML, badgeHTML, toast } = HF_UTILS;

  const setMain = (html) => {
    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc) mc.innerHTML = html;
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

  // ── DASHBOARD ───────────────────────────────────────────────
  const dashboard = async (s) => {
    const p = s.profile || {};
    const r = p.ratings || {};
    const overall = HF_UTILS.calcRating(r);
    const tracker = await HF_DB.getTracker(s.userId);
    const sessionsThisMonth = tracker?.sessionsThisMonth || 0;
    const loginStreak = await HF_DB.getLoginStreak(s.userId);
    const newUser = HF_UTILS.isNewUser(s);
    const { data: agentConvos } = await HF_DB.getAgentConversations(s.userId);
    const unreadCount = await HF_DB.getUnreadCount(s.userId);

    setMain(`
    <div class="welcome-banner">
      <div style="display:flex;align-items:center;gap:var(--sp-lg);">
        <div style="width:72px;height:72px;overflow:hidden;background:var(--green);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#fff;">
          ${
            p.avatarUrl
              ? `<img src="${p.avatarUrl}?cb=${Date.now()}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`
              : HF_UTILS.initials(s.name)
          }
        </div>
        <div>
          <div class="welcome-title">${newUser ? "Welcome" : "Welcome back"}, ${s.name.split(" ")[0]}!</div>
          <div class="welcome-sub">${p.pos || "Player"} · ${p.tier || "U21"} · ${p.status === "unattached" ? "Free Agent" : p.club || "Unattached"}</div>
        </div>
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
      <div class="metric-card" style="cursor:pointer;" onclick="HF_ROUTER.navTo('messages')">
        <div class="metric-val" style="color:var(--red)">${unreadCount}</div>
        <div class="metric-label">Messages</div>
        <div class="metric-sub" style="color:var(--text2)">${unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</div>
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
    </div>

    <div class="card">
      <div class="card-title" style="justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">
          <div class="card-dot"></div>Recent AI conversations
        </div>
        <button class="btn btn-outline btn-sm" onclick="HF_AGENT.toggle()">
          <i class="ti ti-ball-football"></i> Ask AI
        </button>
      </div>
      ${
        !agentConvos || agentConvos.length === 0
          ? `
        <div style="text-align:center;padding:24px;color:var(--text2)">
          <i class="ti ti-ball-football" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No conversations yet</div>
          <div style="font-size:13px">Ask the AI agent anything about football.</div>
        </div>`
          : agentConvos
              .map(
                (c) => `
  <div style="padding:var(--sp-md);background:var(--bg2);border-left:2px solid var(--gold);margin-bottom:var(--sp-sm);cursor:pointer;"
    onclick="HF_AGENT.openConversation('${c.session_id}', \`${(c.message || "").replace(/`/g, "'").replace(/\n/g, " ")}\`, \`${(c.response || "").replace(/`/g, "'").replace(/\n/g, " ")}\`)">
    <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:4px;">
      <i class="ti ti-message" style="color:var(--gold);margin-right:4px"></i>${c.message}
    </div>
    <div style="font-size:11px;color:var(--text2);line-height:1.5;">
      ${c.response.slice(0, 120)}${c.response.length > 120 ? "..." : ""}
    </div>
    <div style="font-size:10px;color:var(--text3);margin-top:4px;">${HF_UTILS.timeAgo(c.created_at)}</div>
  </div>`,
              )
              .join("")
      }
    </div>`);

    if (newUser) setTimeout(() => HF_UTILS.launchConfetti(), 300);
  };

  // ── PROFILE ─────────────────────────────────────────────────
  const profile = async (s, editing = false) => {
    const { data: freshUser } = await HF_DB.getUserById(s.userId);
    if (freshUser?.profile) {
      s.profile = freshUser.profile;
      HF_DB.saveSession(s);
    }
    const p = s.profile || {};
    const { data: invite } = await HF_DB.getPlayerCurrentCoach(s.userId);
    const jerseyNumber = invite?.jersey_number || null;
    const ms = freshUser?.match_stats || {};
    const r = p.ratings || {};
    const overall = HF_UTILS.calcRating(r);
    const unrated = overall === null;

    setMain(`
    <!-- ── PROFILE HEADER ── -->
    <div style="background:#0f0f0d;padding:var(--sp-2xl);margin-bottom:var(--sp-lg);display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-lg);">
  
      <!-- Left: avatar + name wrapped together -->
      <div style="display:flex;align-items:center;gap:var(--sp-lg);">
        <div style="width:72px;height:72px;overflow:hidden;background:#1a7a2e;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#fff;">
          ${
            p.avatarUrl
              ? `<img src="${p.avatarUrl}?cb=${Date.now()}" style="width:100%;height:100%;object-fit:cover;">`
              : HF_UTILS.initials(s.name)
          }
        </div>
        <div>
          <div style="font-family:var(--font);font-size:22px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">${s.name}</div>
          <div style="font-size:13px;color:rgba(255,255,255,.55);margin-top:3px;">${p.pos || "-"} · ${p.tier || "-"}</div>
          <div style="margin-top:8px;display:flex;align-items:center;gap:8px;">
            ${badgeHTML("Player", "green")}
            ${
              p.status === "unattached" || !p.club
                ? `<span style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;background:var(--bg3);color:var(--text2);">Free Agent</span>`
                : `<span style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;background:rgba(26,122,46,.15);color:var(--green);">${p.club} <i class="ti ti-circle-check"></i></span>`
            }
            <span style="font-size:11px;color:rgba(255,255,255,.4)">${p.hometown || "Ghana"}</span>
          </div>
        </div>
      </div>

      <!-- Right: overall rating -->
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-family:var(--font);font-size:42px;font-weight:700;color:${unrated ? "var(--text3)" : "var(--gold)"};">
          ${unrated ? "-" : overall + "%"}
        </div>
        <div style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,.4);">
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
        <div style="display:flex;gap:6px;">
          <button class="btn btn-outline btn-sm" onclick="HF_PLAYER.editProfile()">
            <i class="ti ti-edit"></i> Edit
          </button>
          ${
            p.club && p.status !== "unattached"
              ? `
          <button class="btn btn-danger btn-sm" onclick="HF_PLAYER.leaveTeam()">
            <i class="ti ti-logout"></i> Leave team
          </button>`
              : ""
          }
        </div>
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
        <div class="info-cell"><div class="info-label">Jersey #</div><div class="info-val" style="color:var(--gold);font-size:18px;font-weight:700;">${jerseyNumber || "-"}</div></div>
      </div>
    </div>

    <!-- ── ABILITY RATINGS ── -->
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Match stats</div>
      <div id="player-match-stats">Loading...</div>
    </div>

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
    </div>
    <div class="card">
      <div class="card-title" style="justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">
          <div class="card-dot"></div>Highlight reel
        </div>
        <span style="font-family:var(--font);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:2px 6px;background:rgba(196,154,10,.15);color:var(--gold);">
          Coming soon
        </span>
      </div>
      <div style="text-align:center;padding:32px;background:var(--bg2);border:0.5px dashed var(--border);">
        <i class="ti ti-video" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
        <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No highlights yet</div>
        <div style="font-size:13px;color:var(--text2);margin-bottom:16px">Upload your best moments to showcase your talent to scouts and coaches.</div>
        <button class="btn btn-outline btn-sm" disabled style="opacity:0.5;cursor:not-allowed;">
          <i class="ti ti-upload"></i> Upload highlight (coming soon)
        </button>
      </div>
    </div>`);
    const msEl = document.getElementById("player-match-stats");
    if (msEl) {
      if (!ms || ms.matches_played === 0) {
        msEl.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text2);font-size:13px;">No match data yet.</div>`;
      } else {
        msEl.innerHTML = `
        <div class="metrics-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:0;">
          <div class="metric-card">
            <div class="metric-val" style="color:var(--gold)">${ms.matches_played || 0}</div>
            <div class="metric-label">Matches</div>
          </div>
          <div class="metric-card">
            <div class="metric-val" style="color:var(--green)">${ms.goals || 0}</div>
            <div class="metric-label">Goals</div>
          </div>
          <div class="metric-card">
            <div class="metric-val" style="color:var(--blue)">${ms.assists || 0}</div>
            <div class="metric-label">Assists</div>
          </div>
          <div class="metric-card">
            <div class="metric-val" style="color:var(--text2)">${ms.shots || 0}</div>
            <div class="metric-label">Shots</div>
          </div>
          <div class="metric-card">
            <div class="metric-val" style="color:var(--faith)">${ms.saves || 0}</div>
            <div class="metric-label">Saves</div>
          </div>
          <div class="metric-card">
            <div class="metric-val" style="color:var(--gold)">${ms.minutes_played || 0}</div>
            <div class="metric-label">Minutes</div>
          </div>
          <div class="metric-card">
            <div class="metric-val" style="color:#f5c518">${ms.yellow_cards || 0}</div>
            <div class="metric-label">Yellows</div>
          </div>
          <div class="metric-card">
            <div class="metric-val" style="color:var(--red)">${ms.red_cards || 0}</div>
            <div class="metric-label">Reds</div>
          </div>
        </div>`;
      }
    }
  };

  // ── PROFILE HELPERS  ─────────────────────────────────────────
  const editProfile = async (editing = true) => {
    const session = HF_DB.getSession();
    const p = session.profile || {};

    setMain(`
      <div style="background:#0f0f0d;padding:var(--sp-2xl);margin-bottom:var(--sp-lg);display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-lg);">
        <div style="display:flex;align-items:center;gap:var(--sp-lg);">
          <div style="position:relative;">
            <div id="avatar-banner" style="width:72px;height:72px;overflow:hidden;background:#1a7a2e;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#fff;">
              ${
                p.avatarUrl
                  ? `<img src="${p.avatarUrl}" style="width:100%;height:100%;object-fit:cover;">`
                  : HF_UTILS.initials(session.name)
              }
            </div>
            <label style="position:absolute;bottom:-8px;right:-8px;width:24px;height:24px;background:var(--gold);cursor:pointer;display:flex;align-items:center;justify-content:center;color:#0f0f0d;">
              <i class="ti ti-camera" style="font-size:12px"></i>
              <input type="file" id="avatar-input" accept="image/*" style="display:none;"
                onchange="HF_ROLE_UTILS.previewAvatar(this)">
            </label>
          </div>
          <div>
            <div style="font-family:var(--font);font-size:22px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">${session.name}</div>
            <div style="font-size:13px;color:rgba(255,255,255,.55);margin-top:3px;">${p.pos || "-"} · ${p.tier || "-"}</div>
            <div style="font-size:11px;color:rgba(255,255,255,.3);margin-top:4px;">Click camera to change photo</div>
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
            <select id="ep-pos" style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
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
            <select id="ep-tier" style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
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

    setMain(`
    <div class="card">
      <div class="card-title" style="flex-direction:column;align-items:flex-start;gap:2px;">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">
          <div class="card-dot"></div>Performance overview
        </div>
        <div style="font-size:11px;color:var(--text3);font-family:var(--font);text-transform:none;letter-spacing:0;font-weight:400;padding-left:calc(var(--sp-sm) + 8px);">
          Ratings are based on sessions logged by your coach
        </div>
      </div>
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
          <div style="display:flex;align-items:center;gap:4px;"><div style="width:10px;height:10px;background:var(--blue);"></div>Check-in logged</div>
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
          <div class="table-wrap">
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
                    const isToday =
                      r.created_at?.split("T")[0] === HF_DB.localDate();
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
            </table>
            </div>`
      }
    </div>`);
  };

  // ── TRAINING ─────────────────────────────────────────────────
  const training = async (s) => {
    const p = s.profile || {};

    // Gate: player must be on a team
    if (!p.club || p.status === "unattached") {
      setMain(`
      <div class="card">
        <div style="text-align:center;padding:40px 24px;color:var(--text2)">
          <i class="ti ti-clipboard-list" style="font-size:40px;margin-bottom:12px;display:block;color:var(--text3)"></i>
          <div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:6px">No training plan yet</div>
          <div style="font-size:13px;margin-bottom:20px;line-height:1.6">
            You need to join a verified squad before you can see training plans.<br>
            Your coach will broadcast sessions directly to you.
          </div>
          <button class="btn btn-primary btn-sm" onclick="HF_ROUTER.navTo('findmyteam')">
            <i class="ti ti-search"></i> Find a team
          </button>
        </div>
      </div>`);
      return;
    }

    // Load coach's training plan
    const { data: coachData } = await HF_DB.getCoachTrainingForPlayer(s.userId);
    const schedule = coachData?.schedule || {};
    const sessions = coachData?.sessions || [];
    const { data: logs } = await HF_DB.getTrainingLogs(s.userId);

    const today = new Date().getDay();
    const todayISO = HF_DB.localDate();
    const todayType = schedule[todayISO] || schedule[today] || null;

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

    // most recent broadcast session
    const latestSession = sessions[0] || null;

    const logForToday = logs?.find((l) => l.date === todayISO);
    const isDone = logForToday?.completed;

    const playerView = window._playerTrainingView || "week";
    const selectedPlayerDay = window._playerTrainingSelectedDay ?? today;
    const selectedPlayerDateISO =
      window._playerTrainingSelectedDate ||
      HF_UTILS.getDateForDayISO(selectedPlayerDay);

    const playerWeekStrip = days
      .map((day, i) => {
        const dateISO = HF_UTILS.getDateForDayISO(i);
        const isToday = i === today;
        const isSelected = dateISO === selectedPlayerDateISO;
        const sessionType = schedule[dateISO] || null;
        const color = sessionType ? typeColors[sessionType] : null;
        const displayColor =
          color || (sessionType === "Rest" ? typeColors.Rest : null);
        const hasLog = logs?.find((l) => l.date === dateISO);
        return `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;"
        onclick="window._playerTrainingSelectedDay=${i};window._playerTrainingSelectedDate='${dateISO}';HF_PLAYER.training(HF_DB.getSession())">
        <div style="font-family:var(--font);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;
          color:${isSelected ? "var(--text)" : "var(--text3)"};">${day}</div>
        <div style="width:100%;padding:8px 4px;
          background:${isSelected ? (displayColor ? displayColor + "33" : "var(--bg3)") : displayColor ? displayColor + "11" : "transparent"};
          border:${isSelected ? "2px solid " + (displayColor || "var(--text)") : isToday ? "1.5px solid var(--text3)" : "0.5px solid var(--border)"};
          text-align:center;min-height:60px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;">
          <span style="font-size:9px;font-weight:600;font-family:var(--font);letter-spacing:0.04em;text-transform:uppercase;
            color:${displayColor || "var(--text3)"};">${sessionType || "-"}</span>
          ${hasLog ? `<i class="ti ti-circle-check" style="font-size:10px;color:var(--green);"></i>` : ""}
        </div>
      </div>`;
      })
      .join("");

    const playerMonthView = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();
      let cells = "";
      for (let i = 0; i < firstDay; i++) cells += "<div></div>";
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dayOfWeek = new Date(year, month, d).getDay();
        const isToday = d === now.getDate();
        const isSelected = dateStr === selectedPlayerDateISO;
        const t = schedule[dateStr] || null;
        const c = t ? typeColors[t] : null;
        const dc = c || (t === "Rest" ? typeColors.Rest : null);
        const hasLog = logs?.find((l) => l.date === dateStr);
        cells += `
        <div onclick="window._playerTrainingSelectedDay=${dayOfWeek};window._playerTrainingSelectedDate='${dateStr}';HF_PLAYER.training(HF_DB.getSession())"
          style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:40px;
            background:${isSelected ? (dc ? dc + "22" : "var(--bg3)") : "transparent"};
            border:${isSelected ? "2px solid " + (dc || "var(--text)") : isToday ? "1.5px solid var(--text3)" : "0.5px solid var(--border)"};
            color:${isSelected ? "var(--text)" : "var(--text2)"};font-size:11px;font-weight:${isToday ? "700" : "400"};
            cursor:pointer;position:relative;">
          <span>${d}</span>
          ${hasLog ? `<div style="width:4px;height:4px;background:var(--green);border-radius:50%;position:absolute;bottom:3px;"></div>` : t ? `<div style="width:4px;height:4px;background:${dc};position:absolute;bottom:3px;"></div>` : ""}
        </div>`;
      }
      return `
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:6px;">
        ${days.map((d) => `<div style="text-align:center;font-family:var(--font);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text3);padding:4px 0;">${d}</div>`).join("")}
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:var(--sp-md);">
        ${cells}
      </div>`;
    };

    // rebuild completionBlock for selected date (not just today)
    const selectedLogForDate = logs?.find(
      (l) => l.date === selectedPlayerDateISO,
    );
    const selectedIsDone = selectedLogForDate?.completed;
    const selectedDayType = schedule[selectedPlayerDateISO] || null;
    const selectedColor = selectedDayType
      ? typeColors[selectedDayType]
      : "var(--border)";
    const isSelectedToday = selectedPlayerDateISO === todayISO;
    const selectedDateLabel = new Date(
      selectedPlayerDateISO + "T00:00:00",
    ).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });

    const selectedCompletionBlock = selectedDayType
      ? `
    <div id="completion-section" style="padding:var(--sp-md);background:${selectedIsDone ? "rgba(26,122,46,.08)" : selectedColor + "22"};border-left:3px solid ${selectedIsDone ? "var(--green)" : selectedColor};margin-bottom:var(--sp-lg);">
      <div style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text2);margin-bottom:6px;">
        ${isSelectedToday ? "Today" : selectedDateLabel}
      </div>
      ${
        selectedIsDone
          ? `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
            <div style="font-size:13px;color:var(--green);display:flex;align-items:center;gap:6px;">
              <i class="ti ti-circle-check"></i> ${selectedDayType} completed!
              ${selectedLogForDate.notes ? `<span style="font-size:11px;color:var(--text2);">"${selectedLogForDate.notes}"</span>` : ""}
            </div>
            <button class="btn btn-outline btn-sm" onclick="HF_PLAYER.toggleSessionComplete('${selectedDayType}', '${selectedPlayerDateISO}', false)">
              <i class="ti ti-x"></i> Uncomplete
            </button>
          </div>`
          : `<div style="font-size:13px;color:var(--text);margin-bottom:8px;">
            Coach has planned: <strong style="color:${selectedColor}">${selectedDayType}</strong>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <input type="text" id="session-notes-${selectedPlayerDateISO}" placeholder="Add session notes (optional)..."
              style="flex:1;min-width:150px;padding:8px 12px;background:var(--bg);border:0.5px solid var(--border);color:var(--text);font-size:13px;outline:none;font-family:var(--font);">
            <button class="btn btn-primary btn-sm" onclick="HF_PLAYER.toggleSessionComplete('${selectedDayType}', '${selectedPlayerDateISO}', true)">
              <i class="ti ti-circle-check"></i> Mark completed
            </button>
          </div>`
      }
    </div>`
      : `
    <div style="padding:var(--sp-md);background:var(--bg2);border-left:3px solid var(--border);margin-bottom:var(--sp-lg);font-size:13px;color:var(--text2);">
      ${isSelectedToday ? "No session planned for today by your coach." : `No session planned for ${selectedDateLabel}.`}
    </div>`;

    setMain(`
    <div class="card">
      <div class="card-title" style="justify-content:space-between;">
        <div style="display:flex;flex-direction:column;gap:2px;">
          <div style="display:flex;align-items:center;gap:var(--sp-sm);">
            <div class="card-dot"></div>Training plan
            <span style="font-size:11px;color:var(--text3);">
              ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </span>
          </div>
          <div style="font-size:11px;color:var(--text3);font-family:var(--font);text-transform:none;letter-spacing:0;font-weight:400;">
            Set by ${p.club} coaching staff · read-only
          </div>
        </div>
        <div style="display:flex;gap:4px;">
          ${["day", "week", "month"]
            .map(
              (v) => `
            <button class="btn btn-sm ${playerView === v ? "btn-primary" : "btn-outline"}"
              onclick="window._playerTrainingView='${v}';window._playerTrainingSelectedDate=null;HF_PLAYER.training(HF_DB.getSession())">
              ${v.charAt(0).toUpperCase() + v.slice(1)}
            </button>`,
            )
            .join("")}
        </div>
      </div>

      ${selectedCompletionBlock}

      ${
        playerView === "month"
          ? playerMonthView()
          : playerView === "day"
            ? `
      <div style="padding:var(--sp-lg);background:${schedule[selectedPlayerDateISO] ? (typeColors[schedule[selectedPlayerDateISO]] || "var(--gold)") + "22" : "var(--bg2)"};
        border:${schedule[selectedPlayerDateISO] ? "2px solid " + (typeColors[schedule[selectedPlayerDateISO]] || "var(--gold)") : "0.5px solid var(--border)"};
        text-align:center;margin-bottom:var(--sp-lg);">
        <div style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text3);margin-bottom:6px;">
          ${new Date(selectedPlayerDateISO + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </div>
        <div style="font-family:var(--font);font-size:28px;font-weight:700;color:${schedule[selectedPlayerDateISO] ? typeColors[schedule[selectedPlayerDateISO]] || "var(--gold)" : "var(--text3)"};margin-bottom:4px;">
          ${schedule[selectedPlayerDateISO] || "No session set"}
        </div>
        <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin-top:var(--sp-md);">
          ${days
            .map((day, i) => {
              const dISO = HF_UTILS.getDateForDayISO(i);
              const dt = schedule[dISO] || null;
              const dc = dt ? typeColors[dt] || "var(--text3)" : null;
              const isSelected = dISO === selectedPlayerDateISO;
              return `<button class="btn btn-sm ${isSelected ? "btn-primary" : "btn-outline"}"
              style="${isSelected && dc ? `background:${dc};border-color:${dc};color:#fff;` : ""}"
              onclick="window._playerTrainingSelectedDay=${i};window._playerTrainingSelectedDate='${dISO}';HF_PLAYER.training(HF_DB.getSession())">
              ${day}
            </button>`;
            })
            .join("")}
        </div>
      </div>`
            : `
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:var(--sp-lg);">
        ${playerWeekStrip}
      </div>`
      }

      <div style="padding:var(--sp-md);background:var(--bg2);">
        <div style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text2);margin-bottom:8px;">Legend</div>
        <div style="display:flex;gap:var(--sp-md);flex-wrap:wrap;">
          ${Object.entries(typeColors)
            .map(
              ([t, c]) => `
            <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text2);">
              <div style="width:10px;height:10px;background:${c};"></div>${t}
            </div>`,
            )
            .join("")}
        </div>
      </div>
    </div>

    ${
      latestSession
        ? (() => {
            const typeColors = {
              Technical: "var(--gold)",
              Tactical: "var(--blue)",
              Physical: "var(--red)",
              Recovery: "var(--green)",
              Match: "var(--faith)",
              Rest: "var(--text3)",
            };
            const cat = latestSession.category || "";
            const isMatch = cat === "Match";
            const color =
              typeColors[cat] ||
              typeColors[
                latestSession.name?.includes("vs") ? "Match" : "Technical"
              ] ||
              "var(--gold)";
            const bgColor = isMatch ? "var(--faith-lt)" : color + "11";

            return `
  <div class="card" style="border-top:2px solid ${color};">
    <div class="card-title"><div class="card-dot" style="background:${color};"></div>Latest session from coach</div>
    <div style="padding:var(--sp-md);background:${bgColor};border-left:3px solid ${color};">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:var(--sp-sm);">
        <div style="font-size:14px;font-weight:600;color:${isMatch ? color : "var(--text)"};">
          ${isMatch ? `<i class="ti ti-whistle" style="margin-right:6px"></i>${p.club || "Your team"} ${latestSession.name}` : latestSession.name}
        </div>
        <span style="font-family:var(--font);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:2px 8px;background:${color}22;color:${color};">${cat}</span>
      </div>
      ${
        isMatch
          ? `
      ${latestSession.location ? `<div style="font-size:12px;color:var(--text2);margin-bottom:var(--sp-sm);"><i class="ti ti-map-pin" style="margin-right:4px"></i>${latestSession.location}</div>` : ""}
      ${latestSession.intent ? `<div style="font-size:12px;color:var(--text2);"><i class="ti ti-target" style="margin-right:4px"></i>${latestSession.intent}</div>` : ""}
      `
          : `
      <div style="display:flex;gap:var(--sp-lg);flex-wrap:wrap;font-size:12px;color:var(--text2);margin-bottom:${latestSession.drills?.length ? "var(--sp-md)" : "0"};">
        ${latestSession.duration ? `<span><i class="ti ti-clock" style="margin-right:4px"></i>${latestSession.duration} min</span>` : ""}
        ${latestSession.intensity ? `<span><i class="ti ti-gauge" style="margin-right:4px"></i>${latestSession.intensity} intensity</span>` : ""}
        ${latestSession.intent ? `<span><i class="ti ti-target" style="margin-right:4px"></i>${latestSession.intent}</span>` : ""}
      </div>
      ${
        latestSession.drills?.length
          ? `
      <div style="margin-top:var(--sp-sm);">
        <div style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text2);margin-bottom:6px;">Drills</div>
        ${latestSession.drills
          .map(
            (d) => `
          <div style="display:flex;align-items:center;gap:var(--sp-sm);padding:6px 0;border-bottom:0.5px solid var(--border);">
            <div style="width:6px;height:6px;background:${color};flex-shrink:0;"></div>
            <span style="flex:1;font-size:12px;color:var(--text)">${d.name}</span>
            <span style="font-size:11px;color:var(--text3)">${d.type} · ${d.duration}min</span>
          </div>`,
          )
          .join("")}
      </div>`
          : ""
      }
      `
      }
    </div>
  </div>`;
          })()
        : ""
    }

    <div class="card">
      <div class="card-title"><div class="card-dot"></div>My completion log</div>
      ${
        !logs || logs.length === 0
          ? `<div style="text-align:center;padding:24px;color:var(--text2);font-size:13px;">No sessions logged yet. Mark today's session complete above.</div>`
          : `<div class="table-wrap"><table class="table">
            <thead><tr><th>Date</th><th>Type</th><th>Notes</th></tr></thead>
            <tbody>
              ${logs
                .map(
                  (l) => `
                <tr>
                  <td style="color:var(--text2)">${new Date(l.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</td>
                  <td>${l.session_type || "-"}</td>
                  <td style="font-size:11px;color:var(--text2)">${l.notes || "-"}</td>
                </tr>`,
                )
                .join("")}
            </tbody>
          </table></div>`
      }
    </div>`);
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
        desc: "Litres consumed today",
        type: "number",
        step: 0.1,
        min: 0,
        max: 10,
        placeholder: "e.g. 2.5",
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
        .map(
          (m) => `
        <div style="padding:var(--sp-md);background:var(--bg2);margin-bottom:var(--sp-sm);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:32px;height:32px;background:var(--bg);display:flex;align-items:center;justify-content:center;">
                <i class="ti ${m.icon}" style="font-size:16px;color:var(--text2)"></i>
              </div>
              <div>
                <div style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--text2);">${m.label}</div>
                <div style="font-size:10px;color:var(--text3)">${m.desc}</div>
              </div>
            </div>
            <span id="hv-${m.id}" style="font-family:var(--font);font-size:28px;font-weight:700;color:var(--gold);">
              ${m.id === "hydration" ? (todayLog?.[m.id] || 0) + "L" : todayLog?.[m.id] || 5}
            </span>
          </div>
          ${m.id === "hydration" ? `
          <div style="font-size:13px;color:var(--text2);margin-top:4px;">
            ${todayLog?.[m.id] || 0}L consumed
          </div>` : `
          <div style="height:6px;background:var(--border);margin-top:8px;">
            <div style="height:100%;width:${((todayLog?.[m.id] || 5) / 10) * 100}%;background:var(--gold);"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text3);margin-top:4px;">
            <span>1: Low</span><span>10: High</span>
          </div>`}
        </div>`,
        )
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
            ${m.id !== "hydration" ? `
            <span id="sv-${m.id}" style="font-family:var(--font);font-size:14px;font-weight:700;color:var(--gold)">
              ${todayLog?.[m.id] || 5}
            </span>` : `<span id="sv-${m.id}" style="display:none;">0</span>`}
          </div>
          ${
            m.type === "number"
              ? `
          <input type="number" min="${m.min || 0}" max="${m.max || 10}" step="${m.step || 1}"
            value="${todayLog?.[m.id] || ""}" placeholder="${m.placeholder || ""}"
            id="sv-${m.id}-input"
            style="width:100%;padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;outline:none;font-family:var(--font);"
            oninput="document.getElementById('sv-${m.id}').textContent=parseFloat(this.value)||0">
          <div style="font-size:11px;color:var(--text3);margin-top:4px;">Litres</div>`
              : `
          <input type="range" min="1" max="10" value="${todayLog?.[m.id] || 5}" step="1"
            style="width:100%;accent-color:var(--gold)"
            oninput="document.getElementById('sv-${m.id}').textContent=this.value">
          <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text3);margin-top:4px;">
            <span>1: Low</span><span>10: High</span>
          </div>`
          }
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
        </div>
      </div>

      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Recent wellness history</div>
        <div class="table-wrap">
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
                  const isToday = l.date === HF_DB.localDate();
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
                    <td style="color:var(--text2);font-size:11px">${l.notes && l.notes !== "null" ? l.notes : "None"}</td>
                  </tr>`;
                })
                .join("")}
            </tbody>
          </table>
          </div>
      </div>`
        : ""
    }
  `);
  };

  // ── HEALTH HELPERS ───────────────────────────────────────────────
  const showHealthSliders = () => {
    document.getElementById("health-logged-view").style.display = "none";
    document.getElementById("health-slider-view").style.display = "block";

    const todayLog = window._todayHealthLog;
    if (!todayLog) return;

    ["energy", "mood", "sleep", "soreness", "hydration"].forEach((k) => {
      const val = todayLog[k] || (k === "hydration" ? 0 : 5);
      if (k === "hydration") {
        const numInput = document.getElementById("sv-hydration-input");
        if (numInput) numInput.value = val;
      } else {
        const slider = document.querySelector(`input[oninput*="sv-${k}"]`);
        if (slider) slider.value = val;
      }
      const display = document.getElementById(`sv-${k}`);
      if (display) display.textContent = val;
    });

    const notes = document.getElementById("health-notes");
    if (notes) notes.value = todayLog.notes || "";
  };

  const showHealthCards = () => {
    document.getElementById("health-logged-view").style.display = "block";
    document.getElementById("health-slider-view").style.display = "none";
  };

  const logHealthCheckin = async () => {
    const session = HF_DB.getSession();

    const hydration = parseFloat(
      document.getElementById("sv-hydration-input")?.value ||
      document.getElementById("sv-hydration")?.textContent ||
      0
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

    const unlockedMap = {};
    unlocked.forEach((a) => (unlockedMap[a.id] = a));

    const totalCount = Object.values(ACHIEVEMENTS).reduce(
      (sum, cat) => sum + cat.items.length,
      0,
    );
    const unlockedCount = unlocked.length;

    const renderTree = (cat) => {
      const items = cat.items;
      const nodeSize = 72;
      const hGap = 120;
      const vGap = 100;

      // assign positions by tier
      const tiers = {};
      items.forEach((item) => {
        if (!tiers[item.tier]) tiers[item.tier] = [];
        tiers[item.tier].push(item);
      });

      const maxTier = Math.max(...Object.keys(tiers).map(Number));
      const maxPerTier = Math.max(...Object.values(tiers).map((t) => t.length));
      const svgW = maxTier * hGap + nodeSize + 40;
      const svgH = maxPerTier * vGap + nodeSize + 56;

      // calculate node positions
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

      // build connection lines
      const lines = items
        .flatMap((item) => {
          if (!item.requires) return [];
          return item.requires.map((reqId) => {
            const from = positions[reqId];
            const to = positions[item.id];
            if (!from || !to) return "";
            const isActive = unlockedIds.has(reqId) && unlockedIds.has(item.id);
            const isPending =
              unlockedIds.has(reqId) && !unlockedIds.has(item.id);
            const color = isActive
              ? cat.color
              : isPending
                ? "rgba(196,154,10,.4)"
                : "var(--border)";
            return `<line 
          x1="${from.x + nodeSize / 2}" y1="${from.y + nodeSize / 2}"
          x2="${to.x + nodeSize / 2}"   y2="${to.y + nodeSize / 2}"
          stroke="${color}" stroke-width="${isActive ? 2 : 1}"
          stroke-dasharray="${isPending ? "4,4" : "none"}"/>`;
          });
        })
        .join("");

      // build nodes
      const nodes = items
        .map((item) => {
          const pos = positions[item.id];
          const isUnlocked = unlockedIds.has(item.id);
          const requires = item.requires || [];
          const prereqsMet = requires.every((r) => unlockedIds.has(r));
          const isLocked = !prereqsMet && !isUnlocked;

          const bgColor = isUnlocked ? cat.color : "var(--bg2)";
          const borderColor = isUnlocked
            ? cat.color
            : prereqsMet
              ? cat.color
              : "var(--border)";
          const borderWidth = isUnlocked ? 2 : prereqsMet ? 2 : 1;
          const borderDash = prereqsMet && !isUnlocked ? "4,3" : "none";
          const iconColor = isUnlocked
            ? "#0f0f0d"
            : isLocked
              ? "#444"
              : cat.color + "88";
          const textColor = isUnlocked ? cat.color : isLocked ? "#444" : "#888";

          return `
          <g transform="translate(${pos.x}, ${pos.y})"
            data-id="${item.id}"
            onmouseenter="HF_PLAYER.showAchievementTooltip(event, '${item.id}')"
            onmouseleave="HF_PLAYER.hideAchievementTooltip()"
            onclick="${!isLocked ? `HF_PLAYER.showAchievementDetail('${item.id}')` : ""}"
            style="cursor:${isLocked ? "default" : "pointer"}">
            <rect width="${nodeSize}" height="${nodeSize}"
              fill="${bgColor}"
              stroke="${borderColor}"
              stroke-width="${borderWidth}"
              stroke-dasharray="${borderDash}"
              rx="0"
              style="transition:filter 0.15s ease;"/>
          ${
            isUnlocked
              ? `
            <rect width="${nodeSize}" height="4" fill="${cat.color}" rx="0"/>`
              : ""
          }
          <text x="${nodeSize / 2}" y="${nodeSize / 2 - 6}" 
            text-anchor="middle" 
            font-family="tabler-icons" 
            font-size="20"
            fill="${iconColor}">
          </text>
          <foreignObject x="4" y="${nodeSize / 2 - 8}" width="${nodeSize - 8}" height="20">
            <div xmlns="http://www.w3.org/1999/xhtml" 
              style="text-align:center;font-size:10px;color:${iconColor};">
              <i class="ti ${isLocked ? "ti-lock" : item.icon}"></i>
            </div>
          </foreignObject>
          <foreignObject x="${-10}" y="${nodeSize + 2}" width="${nodeSize + 20}" height="32">
            <div xmlns="http://www.w3.org/1999/xhtml"
              style="text-align:center;font-size:8px;font-weight:700;font-family:Inter,sans-serif;color:${textColor};line-height:1.3;word-wrap:break-word;">
              ${isLocked ? "???" : item.label}
            </div>
          </foreignObject>
          ${
            isUnlocked
              ? `
            <circle cx="${nodeSize - 8}" cy="8" r="6" fill="var(--green)"/>
            <text x="${nodeSize - 8}" y="12" text-anchor="middle" font-size="8" fill="white">✓</text>`
              : ""
          }
        </g>`;
        })
        .join("");

      const catUnlocked = items.filter((i) => unlockedIds.has(i.id)).length;
      const catKey = cat.label.toLowerCase().replace(/\s/g, "-");

      return `
        <div class="card" style="margin-bottom:var(--sp-lg);">
          <div class="card-title" style="justify-content:space-between;cursor:pointer;"
            onclick="
              const c=document.getElementById('tree-${catKey}');
              const i=document.getElementById('tree-chevron-${catKey}');
              c.style.display=c.style.display==='none'?'block':'none';
              i.className='ti '+(c.style.display==='none'?'ti-chevron-down':'ti-chevron-up');
            ">
            <div style="display:flex;align-items:center;gap:var(--sp-sm);">
              <i class="ti ${cat.icon}" style="color:${cat.color}"></i>
              ${cat.label}
              <span style="font-size:11px;color:var(--text3);font-family:var(--font);text-transform:none;letter-spacing:0;font-weight:400;">
                ${catUnlocked}/${items.length}
              </span>
            </div>
            <i id="tree-chevron-${catKey}" class="ti ti-chevron-down" style="font-size:14px;color:var(--text3)"></i>
          </div>
          <div id="tree-${catKey}" style="display:none;">
            <div style="overflow-x:auto;">
              <svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg">
                ${lines}
                ${nodes}
              </svg>
            </div>
            <div id="achievement-detail-${catKey}" style="display:none;margin-top:var(--sp-md);padding:var(--sp-md);background:var(--bg2);border-left:2px solid ${cat.color};"></div>
          </div>
        </div>`;
    };

    setMain(`
    <div class="welcome-banner">
      <div>
        <div class="welcome-title">Achievements</div>
        <div class="welcome-sub">${unlockedCount} of ${totalCount} unlocked</div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-family:var(--font);font-size:42px;font-weight:700;color:var(--gold);">${Math.round((unlockedCount / totalCount) * 100)}%</div>
        <div style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,.4);">Complete</div>
      </div>
    </div>

    <div style="display:flex;gap:var(--sp-md);flex-wrap:wrap;margin-bottom:var(--sp-lg);">
      ${Object.entries(ACHIEVEMENTS)
        .map(([key, cat]) => {
          const catUnlocked = cat.items.filter((a) =>
            unlockedIds.has(a.id),
          ).length;
          const pct = Math.round((catUnlocked / cat.items.length) * 100);
          return `
          <div style="flex:1;min-width:120px;padding:var(--sp-md);background:var(--bg2);border-top:2px solid ${cat.color};">
            <div style="font-family:var(--font);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${cat.color};margin-bottom:4px;">
              <i class="ti ${cat.icon}" style="margin-right:4px"></i>${cat.label}
            </div>
            <div style="font-size:18px;font-weight:700;color:var(--text)">${catUnlocked}/${cat.items.length}</div>
            <div style="height:3px;background:var(--border);margin-top:6px;">
              <div style="height:100%;width:${pct}%;background:${cat.color};transition:width 0.3s ease;"></div>
            </div>
          </div>`;
        })
        .join("")}
    </div>

    ${Object.values(ACHIEVEMENTS)
      .map((cat) => renderTree(cat))
      .join("")}

    <div style="display:flex;gap:var(--sp-lg);flex-wrap:wrap;padding:var(--sp-md);background:var(--bg2);font-size:11px;color:var(--text2);">
      <div style="display:flex;align-items:center;gap:6px;"><div style="width:16px;height:16px;background:var(--gold);"></div>Unlocked</div>
      <div style="display:flex;align-items:center;gap:6px;"><div style="width:16px;height:16px;background:var(--bg2);border:1px solid var(--gold);"></div>Available</div>
      <div style="display:flex;align-items:center;gap:6px;"><div style="width:16px;height:16px;background:var(--bg2);border:1px solid var(--border);opacity:0.4;"></div>Locked</div>
    </div>
  `);
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
          <button class="btn btn-primary btn-sm" onclick="HF_ROLE_UTILS.composeMessage('player')">
            <i class="ti ti-edit"></i> New message
          </button>
          <button class="btn btn-outline btn-sm" onclick="HF_ROLE_UTILS.contactAdmin('player')">
            <i class="ti ti-headset"></i> Support
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

    ${HF_ROLE_UTILS.archivedMessagesHTML(enrichedArchived, "player")}`);
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

  const sendCoachMessage = (coachId, coachName) =>
    HF_ROLE_UTILS.sendMessage(coachId, coachName, "findmyteam");

  // ── FAITH ────────────────────────────────────────────────────
  const faith = async (s) => {
    const todayKey = HF_DB.localDate();
    const storageKey = `hf_faith_checklist_${s.userId}_${todayKey}`;
    const checked = JSON.parse(localStorage.getItem(storageKey) || "{}");

    const prayers = [
      {
        id: "morning",
        title: "Morning prayer",
        desc: "Before training: Lord, strengthen my body and sharpen my mind. Guide my feet, protect me from injury, and let my performance bring glory to You today.",
      },
      {
        id: "prematch",
        title: "Pre-match prayer",
        desc: "Father, as I step onto this pitch I surrender the outcome to You. Let me play with courage, integrity, and joy. Win or lose, may my character reflect Your grace.",
      },
      {
        id: "struggle",
        title: "When you're struggling",
        desc: "God, I don't understand this season. Renew my strength. Remind me that You have a plan for me greater than any setback. Help me trust the process.",
      },
      {
        id: "evening",
        title: "Evening reflection",
        desc: "Lord, thank You for the strength You gave me today. I reflect on what I learned, I forgive myself for my mistakes, and I rest knowing You watch over me tonight. Tomorrow I rise again.",
      },
    ];

    const allChecked = prayers.every((p) => checked[p.id]);

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
          <span style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;background:rgba(26,122,46,.15);color:var(--green);">
            <i class="ti ti-circle-check"></i> All done
          </span>`
            : `
          <span style="font-family:var(--font);font-size:10px;color:var(--text3);">
            ${Object.values(checked).filter(Boolean).length}/${prayers.length} completed
          </span>`
        }
      </div>

      ${prayers
        .map((p) => {
          const isChecked = !!checked[p.id];
          return `
          <div style="display:flex;align-items:flex-start;gap:var(--sp-md);padding:var(--sp-md);background:var(--bg2);border-left:2px solid ${isChecked ? "var(--green)" : "var(--faith)"};margin-bottom:var(--sp-sm);cursor:pointer;transition:var(--trans);"
            onclick="HF_ROLE_UTILS.togglePrayer('${p.id}', 'player')">
            <div style="width:20px;height:20px;border:2px solid ${isChecked ? "var(--green)" : "var(--faith)"};background:${isChecked ? "var(--green)" : "transparent"};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">
              ${isChecked ? '<i class="ti ti-check" style="font-size:12px;color:#fff;"></i>' : ""}
            </div>
            <div>
              <div style="font-family:var(--font);font-size:13px;font-weight:600;color:${isChecked ? "var(--green)" : "var(--faith)"};margin-bottom:4px;${isChecked ? "text-decoration:line-through;" : ""}">
                ${p.title}
              </div>
              <div style="font-size:12px;color:var(--text2);font-style:normal;line-height:1.5;${isChecked ? "opacity:0.5;" : ""}">
                ${p.desc}
              </div>
            </div>
          </div>`;
        })
        .join("")}

      ${
        allChecked
          ? `
        <div style="text-align:center;padding:var(--sp-lg);color:var(--faith);font-size:13px;font-style:normal;">
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
          <div style="font-size:12px;color:var(--text2);font-style:normal;line-height:1.6">${verse}</div>
        </div>`,
        )
        .join("")}
    </div>`);
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
        !coachesWithStatus || coachesWithStatus.length === 0
          ? `
        <div class="card">
          <div style="text-align:center;padding:32px;color:var(--text2)">
            <i class="ti ti-map-search" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No coaches recruiting yet</div>
            <div style="font-size:13px">Verified coaches who are open for recruitment will appear here.</div>
          </div>
        </div>`
          : coachesWithStatus.map((c) => _coachCard(c, s.userId)).join("")
      }
    </div>`);

    window._fmtAllCoaches = coachesWithStatus;
    window._fmtUserId = s.userId;
  };

  // ── FIND MY TEAM HELPERS ───────────────────────────────────────────────
  const _coachCard = (c, playerId) => {
    const p = c.profile || {};
    const safeName = c.name.replace(/'/g, "\\'");
    const req = c.trialRequest;
    const isPending = req?.status === "pending";
    const isAccepted = req?.status === "accepted";
    const isDeclined = req?.status === "declined";

    // check if declined within 24 hours
    const declinedRecently =
      isDeclined &&
      req?.responded_at &&
      new Date() - new Date(req.responded_at) < 24 * 60 * 60 * 1000;

    return `
    <div class="card" style="margin-bottom:var(--sp-md);">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-md);">
        <div style="display:flex;align-items:center;gap:var(--sp-md);">
          <div class="avatar avatar-lg" style="background:var(--gold);width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-family:var(--font);font-size:18px;font-weight:700;color:#0f0f0d;">
            ${HF_UTILS.initials(c.name)}
          </div>
          <div>
            <div style="font-size:14px;font-weight:600;color:var(--text)">${c.name}</div>
            <div style="font-size:12px;color:var(--text2)">${p.club || "-"}</div>
            <div style="font-size:11px;color:var(--text3)">${p.spec || "Head coach"} · ${p.exp || "-"} yrs exp · ${p.licence || "-"}</div>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-family:var(--font);font-size:20px;font-weight:700;color:var(--gold)">${p.teamSize || 0}</div>
          <div style="font-size:10px;color:var(--text3);font-family:var(--font);text-transform:uppercase;letter-spacing:0.08em">Players</div>
        </div>
      </div>
      <div style="margin-top:var(--sp-md);padding-top:var(--sp-md);border-top:0.5px solid var(--border);display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        ${
          isAccepted
            ? `
          <span style="font-family:var(--font);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:3px 8px;background:rgba(26,122,46,.15);color:var(--green);">
            <i class="ti ti-circle-check"></i> Trial accepted
          </span>`
            : isPending
              ? `
          <span id="trial-btn-${c.id}" style="font-family:var(--font);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:3px 8px;background:rgba(196,154,10,.15);color:var(--gold);">
            <i class="ti ti-clock"></i> Trial request pending
          </span>`
              : declinedRecently
                ? `
          <span style="font-family:var(--font);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:3px 8px;background:rgba(200,16,46,.1);color:var(--red);">
            <i class="ti ti-x"></i> Declined: resend in 24hrs
          </span>`
                : `
          <button id="trial-btn-${c.id}" class="btn btn-primary btn-sm"
            onclick="HF_PLAYER.requestTrial('${c.id}', '${safeName}')">
            <i class="ti ti-send"></i> Request trial
          </button>`
        }
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
    showHealthSliders,
    showHealthCards,
    editProfile,
    saveProfile,
    respondInvite,
    leaveTeam,
    filterCoaches,
    requestTrial,
    messageCoach,
    sendCoachMessage,
    showAchievementDetail,
    showAchievementTooltip,
    hideAchievementTooltip,
  };
})();

window.HF_PLAYER = HF_PLAYER;
