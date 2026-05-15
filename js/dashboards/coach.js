/**
 * HappyFeet: dashboards/coach.js
 * All views for the Coach role.
 */

const HF_COACH = (() => {
  const {
    barHTML,
    activityHTML,
    avatarHTML,
    badgeHTML,
    miniChartHTML,
    toast,
    initials,
    avatarColor,
    ratingColor,
  } = HF_UTILS;

  const setMain = (html) => {
    const mc = document.getElementById("main-content");
    if (mc) mc.innerHTML = html;
  };

  const SQUAD = [];

  const statusBadge = (st) => {
    const map = { fit: "green", monitor: "gold", alert: "red" };
    const lbl = { fit: "Fit", monitor: "Monitor", alert: "Alert" };
    return badgeHTML(lbl[st] || st, map[st] || "gold");
  };

  const render = (view, session) => {
    const views = {
      dashboard,
      profile,
      squad,
      training,
      tracking,
      health,
      recruitment,
      messages,
      faith,
      findmyteam,
    };
    const fn = views[view] || dashboard;
    fn(session);
  };

  // DASHBOARD
  const dashboard = (s) => {
    const p = s.profile || {};
    const squadStatus = s.squadStatus || "unregistered";
    const isVerified = squadStatus === "verified";
    const isPending = squadStatus === "pending";
    const isUnregistered = squadStatus === "unregistered";
    const isRejected = squadStatus === "rejected";
    const isAwaitingCoach = squadStatus === "awaiting_coach_approval";
    const newUser = HF_UTILS.isNewUser(s);

    const squadStatusBadge = isVerified
      ? `<span style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;background:rgba(26,122,46,.15);color:var(--green);">Verified</span>`
      : isPending
        ? `<span style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;background:rgba(196,154,10,.15);color:var(--gold);">Pending</span>`
        : isAwaitingCoach
          ? `<span style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;background:rgba(24,95,165,.15);color:var(--blue);">Review required</span>`
          : isRejected
            ? `<span style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;background:rgba(200,16,46,.15);color:var(--red);">Rejected</span>`
            : `<span style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;background:var(--bg3);color:var(--text2);">Unregistered</span>`;

    setMain(`
    <div style="background:#0f0f0d;padding:var(--sp-2xl);margin-bottom:var(--sp-lg);display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-lg);">
      <div>
        <div style="font-family:var(--font-head);font-size:22px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">${newUser ? "Welcome" : "Welcome back"}, Coach ${s.name.split(" ").pop()}!</div>
        <div style="font-size:13px;color:rgba(255,255,255,.55);margin-top:3px;">${p.spec || "Head coach"} · ${p.licence || "-"} licence</div>
        <div style="margin-top:8px;display:flex;align-items:center;gap:8px;">
          ${badgeHTML("Coach", "gold")}
          <span style="font-size:11px;color:rgba(255,255,255,.4)">${p.club || "-"}</span>
          ${squadStatusBadge}
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-family:var(--font-head);font-size:42px;font-weight:700;color:var(--gold);">${isVerified ? p.teamSize || 0 : "-"}</div>
        <div style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,.4);">Squad size</div>
      </div>
    </div>

    ${HF_SCRIPTURE.stripHTML()}

    ${
      isUnregistered || isPending || isRejected || isAwaitingCoach
        ? `
  <div style="padding:var(--sp-lg);background:${isRejected ? "rgba(200,16,46,.06)" : isAwaitingCoach ? "rgba(24,95,165,.06)" : "rgba(196,154,10,.06)"};border-left:3px solid ${isRejected ? "var(--red)" : isAwaitingCoach ? "var(--blue)" : "var(--gold)"};margin-bottom:var(--sp-lg);">
    <div style="font-family:var(--font-head);font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${isRejected ? "var(--red)" : isAwaitingCoach ? "var(--blue)" : "var(--gold)"};margin-bottom:6px;">
      ${isRejected ? "Squad verification rejected" : isAwaitingCoach ? "Admin has updated your submission" : isPending ? "Squad verification pending" : "Squad not registered"}
    </div>
    <div style="font-size:13px;color:var(--text2);margin-bottom:12px;">
      ${
        isRejected
          ? "Your squad verification was rejected. Please review the reason in your messages and resubmit."
          : isAwaitingCoach
            ? "An admin has made changes to your squad registration. Check your messages and accept or decline."
            : isPending
              ? "Your squad is awaiting admin approval. Full features will unlock once verified."
              : "Register and verify your squad to unlock full coaching features."
      }
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      ${
        isUnregistered || isRejected
          ? `
        <button class="btn btn-primary btn-sm" onclick="${isRejected ? "HF_COACH.resubmitSquad()" : "HF_AUTH.showScreen('screen-squad-verify')"}">
          <i class="ti ti-clipboard-check"></i> ${isRejected ? "Resubmit squad" : "Register your squad"}
        </button>`
          : ""
      }
      ${
        isAwaitingCoach
          ? `
        <button class="btn btn-primary btn-sm" onclick="HF_COACH.reviewAdminEdits()">
          <i class="ti ti-eye"></i> Review changes
        </button>`
          : ""
      }
      ${
        isRejected || isAwaitingCoach
          ? `
        <button class="btn btn-outline btn-sm" onclick="HF_ROUTER.navTo('messages')">
          <i class="ti ti-message"></i> View messages
        </button>`
          : ""
      }
    </div>
  </div>`
        : ""
    }

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-val" style="color:${isVerified ? "var(--green)" : "var(--text3)"}">
          ${isVerified ? "-" : "-"}
        </div>
        <div class="metric-label">Squad readiness</div>
        <div class="metric-sub" style="color:var(--text2)">
          ${isVerified ? "Log sessions to calculate" : "Verify squad to unlock"}
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-val" style="color:${isVerified ? "var(--gold)" : "var(--text3)"}">
          ${isVerified ? "0" : "-"}
        </div>
        <div class="metric-label">Risk alerts</div>
        <div class="metric-sub" style="color:var(--text2)">${isVerified ? "All clear" : "Verify squad to unlock"}</div>
      </div>
      <div class="metric-card">
        <div class="metric-val" style="color:${isVerified ? "var(--gold)" : "var(--text3)"}">
          ${isVerified ? p.teamSize || 0 : "-"}
        </div>
        <div class="metric-label">Active players</div>
        <div class="metric-sub" style="color:var(--text2)">${isVerified ? "In your squad" : "Verify squad to unlock"}</div>
      </div>
      <div class="metric-card">
        <div class="metric-val" style="color:var(--gold)">0</div>
        <div class="metric-label">Messages</div>
        <div class="metric-sub" style="color:var(--text2)">All caught up</div>
      </div>
    </div>

    <div class="quick-actions">
      <button class="quick-action" onclick="${isVerified ? "HF_ROUTER.navTo('squad')" : "HF_UTILS.toast('Verify your squad first.','error')"}">
        <div class="quick-action-icon"><i class="ti ti-users"></i></div>
        <div class="quick-action-label">View squad</div>
        <div class="quick-action-sub">${isVerified ? (p.teamSize || 0) + " players" : "Squad not verified"}</div>
      </button>
      <button class="quick-action" onclick="${isVerified ? "HF_ROUTER.navTo('training')" : "HF_UTILS.toast('Verify your squad first.','error')"}">
        <div class="quick-action-icon"><i class="ti ti-clipboard-list"></i></div>
        <div class="quick-action-label">Today's session</div>
        <div class="quick-action-sub">${isVerified ? "Plan a session" : "Squad not verified"}</div>
      </button>
      <button class="quick-action" onclick="${isVerified ? "HF_ROUTER.navTo('health')" : "HF_UTILS.toast('Verify your squad first.','error')"}">
        <div class="quick-action-icon"><i class="ti ti-stethoscope"></i></div>
        <div class="quick-action-label">Health flags</div>
        <div class="quick-action-sub">${isVerified ? "0 alerts" : "Squad not verified"}</div>
      </button>
    </div>

    <div class="card">
      <div class="card-title"><div class="card-dot"></div>AI agent activity</div>
      ${
        !isVerified
          ? `
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <i class="ti ti-lock" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">Locked until squad is verified</div>
          <div style="font-size:13px">AI agent activity will appear here once your squad is registered and verified.</div>
        </div>`
          : `
        ${activityHTML('<i class="ti ti-robot"></i>', "rgba(201,150,26,.1)", "Performance Agent", "Fatigue detected: Kwame Asante. Sprint load reduced 30% tomorrow.", "2 min ago")}
        ${activityHTML('<i class="ti ti-stethoscope"></i>', "rgba(200,16,46,.08)", "Health Agent", "Emmanuel Ofori: hamstring flag. Physio check 7am. Modified plan activated.", "18 min ago")}
        ${activityHTML('<i class="ti ti-search"></i>', "rgba(26,122,46,.08)", "Scout Agent", "3 new prospects identified in Kumasi region. Profiles ready.", "1 hr ago")}`
      }
    </div>
  `);
    if (newUser) setTimeout(() => HF_UTILS.launchConfetti(), 300);
  };

  // PROFILE
  const profile = (s) => {
    const p = s.profile || {};
    setMain(`
      <div class="profile-hero">
        ${avatarHTML(s.name, "xl", "#C9961A")}
        <div>
          <div class="profile-name">${s.name}</div>
          <div class="profile-meta">${p.spec || "Head coach"} · ${p.club || "-"}</div>
          <div style="margin-top:8px">${badgeHTML("Coach", "gold")}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Coaching details</div>
        <div class="info-grid">
          <div class="info-cell"><div class="info-label">Licence</div><div class="info-val">${p.licence || "-"}</div></div>
          <div class="info-cell"><div class="info-label">Experience</div><div class="info-val">${p.exp || "-"} years</div></div>
          <div class="info-cell"><div class="info-label">Club</div><div class="info-val">${p.club || "-"}</div></div>
          <div class="info-cell"><div class="info-label">Specialisation</div><div class="info-val">${p.spec || "-"}</div></div>
          <div class="info-cell"><div class="info-label">Squad size</div><div class="info-val">${p.teamSize || 22} players</div></div>
          <div class="info-cell"><div class="info-label">${s.contactType === "phone" ? "Phone" : "Email"}</div><div class="info-val">${s.displayContact || s.contact}</div></div>
        </div>
      </div>`);
  };

  // SQUAD
  const squad = async (s) => {
    const p = s.profile || {};
    const squadStatus = s.squadStatus || "unregistered";
    const isVerified = squadStatus === "verified";

    if (!isVerified) {
      setMain(`
      <div class="card">
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <i class="ti ti-lock" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">Squad locked</div>
          <div style="font-size:13px">Verify your squad first to start adding players.</div>
          <button class="btn btn-primary btn-sm" style="margin-top:16px" onclick="HF_AUTH.showScreen('screen-squad-verify')">
            <i class="ti ti-clipboard-check"></i> Register your squad
          </button>
        </div>
      </div>`);
      return;
    }

    setMain(`
    <div class="card">
      <div class="card-title" style="justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">
          <div class="card-dot"></div>Squad roster — ${p.club || "Your club"}
        </div>
        <button class="btn btn-primary btn-sm" onclick="HF_COACH.showInvitePanel()">
          <i class="ti ti-plus"></i> Invite player
        </button>
      </div>

      <div id="invite-panel" style="display:none;margin-bottom:var(--sp-lg);padding:var(--sp-md);background:var(--bg2);border-left:2px solid var(--gold);">
        <div style="font-family:var(--font-head);font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--gold);margin-bottom:8px;">
          Invite a player
        </div>
        <div style="display:flex;gap:8px;">
          <input type="text" id="player-search-input" placeholder="Search by name or email..."
            style="flex:1;padding:8px 12px;background:var(--bg);border:0.5px solid var(--border);color:var(--text);font-size:13px;font-family:var(--font);outline:none;"
            oninput="HF_COACH.searchPlayers(this.value)">
          <button class="btn btn-outline btn-sm" onclick="HF_COACH.showInvitePanel()">
            <i class="ti ti-x"></i>
          </button>
        </div>
        <div id="player-search-results" style="margin-top:8px;"></div>
      </div>

      <div id="squad-roster">
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <i class="ti ti-users" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No players yet</div>
          <div style="font-size:13px">Invite players to your squad using the button above.</div>
        </div>
      </div>
    </div>`);
  };

  // TRAINING
  const training = (s) => {
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Session builder</div>
        <div class="form-row">
          <div class="fg"><label>Session name</label><input type="text" placeholder="e.g. Tuesday technical block"></div>
          <div class="fg"><label>Category</label>
            <select>
              <option>Technical</option><option>Tactical</option><option>Physical</option>
              <option>Recovery</option><option>Match prep</option><option>Faith</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="fg"><label>Intensity</label>
            <select><option>Low</option><option selected>Medium</option><option>High</option></select>
          </div>
          <div class="fg"><label>Duration (min)</label><input type="number" value="90" min="15" max="180"></div>
        </div>
        <div class="fg"><label>Coaching intent</label><input type="text" placeholder="e.g. Focus on press triggers and compact shape"></div>
        <div style="font-size:12px;font-weight:600;margin:12px 0 8px">Add drills</div>
        <div style="text-align:center;padding:20px;background:var(--bg2);border-radius:8px;border:0.5px dashed var(--border);margin-bottom:12px;color:var(--text2);font-size:13px">
          No drills yet. Add drills below or pick from the drill bank.
        </div>
        <div class="fg"><label>Drill name</label><input type="text" id="drill-name" placeholder="e.g. 4v4 rondo: possession under pressure"></div>
        <div class="form-row">
          <div class="fg"><label>Duration (min)</label><input type="number" value="10" id="drill-dur"></div>
          <div class="fg"><label>Type</label>
            <select id="drill-type">
              <option>Warm-up</option><option>Technical drill</option><option>Tactical shape</option>
              <option>Small-sided game</option><option>Conditioning</option><option>Cooldown</option><option>Prayer & devotion</option>
            </select>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="HF_UTILS.toast('Drill added!','success')">+ Add drill</button>
        <div style="margin-top:16px;display:flex;gap:8px">
          <button class="btn btn-primary" onclick="HF_UTILS.toast('Session saved to library ✓','success')">Save session ✓</button>
          <button class="btn btn-outline" onclick="HF_ROUTER.navTo('dashboard')">Cancel</button>
        </div>
      </div>`);
  };

  // TRACKING
  const tracking = (s) => {
    if (SQUAD.length === 0) {
      setMain(`
      <div class="card">
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <i class="ti ti-chart-line" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No players to track</div>
          <div style="font-size:13px">Invite players to your squad to start tracking their performance.</div>
          <button class="btn btn-primary btn-sm" style="margin-top:16px" onclick="HF_ROUTER.navTo('squad')">
            <i class="ti ti-users"></i> Go to squad
          </button>
        </div>
      </div>`);
      return;
    }

    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Log a player session rating</div>
        <div class="form-row">
          <div class="fg"><label>Player</label>
            <select id="tr-player">
              ${SQUAD.map((p) => `<option>${p.name}</option>`).join("")}
            </select>
          </div>
          <div class="fg"><label>Session type</label>
            <select><option>Technical</option><option>Tactical</option><option>Physical</option><option>Recovery</option></select>
          </div>
        </div>
        ${["Speed", "Technical", "Tactical", "Physical"]
          .map(
            (l) => `
          <div class="bar-row">
            <div class="bar-head">
              <span>${l}</span>
              <span id="cv-${l.toLowerCase()}" style="color:var(--gold);font-weight:600">7</span>
            </div>
            <input type="range" min="1" max="10" value="7" style="width:100%;accent-color:var(--gold);margin-top:4px"
              oninput="document.getElementById('cv-${l.toLowerCase()}').textContent=this.value">
          </div>`,
          )
          .join("")}
        <button class="btn btn-primary" style="margin-top:8px" onclick="HF_UTILS.toast('Session rating saved! ✓','success')">Save rating ✓</button>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Squad performance snapshot</div>
        <div class="metrics-grid" style="grid-template-columns:repeat(3,1fr)">
          <div class="metric-card"><div class="metric-val" style="color:var(--gold)">76</div><div class="metric-label">Squad avg rating</div></div>
          <div class="metric-card"><div class="metric-val" style="color:var(--green)">14</div><div class="metric-label">Sessions this month</div></div>
          <div class="metric-card"><div class="metric-val" style="color:var(--red)">2</div><div class="metric-label">Flagged players</div></div>
        </div>
      </div>`);
  };

  // HEALTH
  const health = (s) => {
    setMain(`
      <div class="metrics-grid">
        <div class="metric-card"><div class="metric-val" style="color:var(--green)">16</div><div class="metric-label">Fully fit</div></div>
        <div class="metric-card"><div class="metric-val" style="color:var(--gold)">2</div><div class="metric-label">Monitoring</div></div>
        <div class="metric-card"><div class="metric-val" style="color:var(--red)">0</div><div class="metric-label">Injured</div></div>
        <div class="metric-card"><div class="metric-val" style="color:var(--green)">94%</div><div class="metric-label">Availability</div></div>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Active health alerts</div>
        <div style="padding:12px;background:rgba(200,16,46,.05);border:0.5px solid rgba(200,16,46,.2);border-radius:8px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <strong>Emmanuel Ofori</strong>${badgeHTML("High risk", "red")}
          </div>
          <div style="font-size:12px;color:var(--text2)">Right hamstring tightness. Sprint volume cut 40%. Physio 7am.</div>
        </div>
        <div style="padding:12px;background:rgba(201,150,26,.05);border:0.5px solid rgba(201,150,26,.2);border-radius:8px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <strong>Kwame Asante</strong>${badgeHTML("Monitor", "gold")}
          </div>
          <div style="font-size:12px;color:var(--text2)">High load 3 days running. Active recovery recommended.</div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Log a health check-in</div>
        <div class="fg"><label>Player name</label>
          <select>${SQUAD.map((p) => `<option>${p.name}</option>`).join("")}</select>
        </div>
        <div class="fg"><label>Availability</label>
          <select>
            <option>Full training</option><option>Modified: reduced load</option>
            <option>Rehab only</option><option>Rest: not available</option>
          </select>
        </div>
        <div class="fg"><label>Notes</label><input type="text" placeholder="e.g. Slight limp. Mentioned left knee discomfort."></div>
        <button class="btn btn-primary" onclick="HF_UTILS.toast('Health check-in saved ✓','success')">Save check-in ✓</button>
      </div>`);
  };

  // RECRUITMENT
  const recruitment = (s) => {
    const prospects = [
      {
        name: "Yaw Darko",
        pos: "ST",
        age: 16,
        region: "Kumasi",
        pot: "Elite",
        speed: 91,
        tech: 87,
        gender: "male",
      },
      {
        name: "Adjoa Frempong",
        pos: "CM",
        age: 15,
        region: "Accra",
        pot: "High",
        speed: 84,
        tech: 89,
        gender: "female",
      },
      {
        name: "Nana Amponsah",
        pos: "GK",
        age: 17,
        region: "Tamale",
        pot: "High",
        speed: 76,
        tech: 82,
        gender: "male",
      },
    ];
    const potColors = { Elite: "red", High: "gold", Good: "green" };
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Recruitment prospects</div>
        <div style="font-size:13px;color:var(--text2);margin-bottom:14px">Players flagged as potential recruits by the Scout Agent.</div>
        ${prospects
          .map((pr) => {
            const avg = Math.round((pr.speed + pr.tech) / 2);
            const gc =
              pr.gender === "female"
                ? "rgba(212,83,126,.1)"
                : "rgba(24,95,165,.1)";
            const gcol = pr.gender === "female" ? "#993556" : "#185FA5";
            return `
            <div class="prospect-row" onclick="HF_UTILS.toast('Full profile coming in next version.','success')">
              <div class="avatar avatar-md" style="background:${potColors[pr.pot] === "red" ? "var(--red)" : "var(--gold)"}">${HF_UTILS.initials(pr.name)}</div>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:600">${pr.name}</div>
                <div style="font-size:11px;color:var(--text2)">${pr.pos} · Age ${pr.age} · ${pr.region}</div>
                <span style="font-size:10px;padding:1px 7px;border-radius:8px;background:${gc};color:${gcol};font-weight:600">${pr.gender === "female" ? "Female" : "Male"}</span>
              </div>
              <div style="text-align:right">
                <div style="font-size:16px;font-weight:700;color:var(--gold)">${avg}</div>
                ${badgeHTML(pr.pot, potColors[pr.pot])}
              </div>
            </div>`;
          })
          .join("")}
      </div>`);
  };

  // MESSAGES
  const messages = async (s) => {
    const { data: msgs } = await HF_DB.getMessages(s.userId);
    const { data: archived } = await HF_DB.getArchivedMessages(s.userId);
    const isAwaitingReview = s.squadStatus === "awaiting_coach_approval";

    setMain(`
    ${
      isAwaitingReview
        ? `
      <div style="padding:var(--sp-lg);background:rgba(24,95,165,.06);border-left:3px solid var(--blue);margin-bottom:var(--sp-lg);">
        <div style="font-family:var(--font-head);font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--blue);margin-bottom:6px;">
          Action required
        </div>
        <div style="font-size:13px;color:var(--text2);margin-bottom:12px;">
          An admin has made changes to your squad registration. Review and respond below.
        </div>
        <button class="btn btn-primary btn-sm" onclick="HF_COACH.reviewAdminEdits()">
          <i class="ti ti-eye"></i> Review changes
        </button>
      </div>`
        : ""
    }

    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Messages</div>
      ${
        !msgs || msgs.length === 0
          ? `
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <i class="ti ti-message" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No messages yet</div>
          <div style="font-size:13px">Messages from HappyFeet will appear here.</div>
        </div>`
          : HF_UTILS.messageListHTML(msgs, "coach")
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
          ${archived
            .map(
              (m) => `
            <div class="msg-item">
              <div class="avatar avatar-md" style="background:#0f0f0d;display:flex;align-items:center;justify-content:center;">
                <i class="ti ti-shield" style="font-size:16px;color:var(--text3)"></i>
              </div>
              <div style="flex:1;opacity:0.6">
                <div class="msg-name">${m.subject || "Message"}</div>
                <div class="msg-preview">${m.body}</div>
                <div class="msg-time">${HF_UTILS.timeAgo(m.created_at)}</div>
              </div>
            </div>`,
            )
            .join("")}
        </div>
      </div>`
        : ""
    }`);
  };

  // FAITH
  const faith = (s) => {
    setMain(`
      <div class="faith-hero">
        <div style="font-size:32px;margin-bottom:10px"><i class="ti ti-cross"></i></div>
        <div style="font-size:20px;font-weight:700;margin-bottom:6px">Team Devotion</div>
        <div style="font-size:13px;opacity:.8">Lead your players in faith as well as football.</div>
      </div>
      <div class="faith-verse-card">
        <div class="verse-text">${HF_SCRIPTURE.getToday().verse}</div>
        <div class="verse-ref">${HF_SCRIPTURE.getToday().ref}</div>
      </div>
      <div class="card faith-card">
        <div class="card-title"><div class="card-dot faith"></div>How to run team devotion</div>
        <div style="font-size:12px;color:var(--text2);line-height:2.2">
          1. <strong style="color:var(--text)">Gather the squad</strong> before every session or match for 5–10 minutes.<br>
          2. <strong style="color:var(--text)">Read a verse together</strong>, like Colossians 3:23.<br>
          3. <strong style="color:var(--text)">One player leads prayer</strong> and rotate each session.<br>
          4. <strong style="color:var(--text)">Set an intention</strong>, like what does the squad play for today?<br>
          5. <strong style="color:var(--text)">Hands in, one voice</strong>, close together as a team.
        </div>
      </div>
      <div class="card faith-card">
        <div class="card-title"><div class="card-dot faith"></div>Scripture for coaches</div>
        ${[
          [
            "On patience with players",
            '"Love is patient, love is kind... it keeps no record of wrongs." ~ 1 Corinthians 13:4-5',
          ],
          [
            "On leading well",
            '"Whoever wants to become great among you must be your servant." ~ Matthew 20:26',
          ],
          [
            "On perseverance",
            '"Let us not become weary in doing good, for at the proper time we will reap a harvest." ~ Galatians 6:9',
          ],
        ]
          .map(
            ([title, verse]) => `
          <div class="prayer-card">
            <div class="prayer-title">${title}</div>
            <div class="prayer-text">${verse}</div>
          </div>`,
          )
          .join("")}
      </div>`);
  };

  const findmyteam = (s) => {
    setMain(`
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Find my team</div>
      <div style="text-align:center;padding:32px;color:var(--text2)">
        <i class="ti ti-map-search" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
        <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">Coming soon</div>
        <div style="font-size:13px">Team listings and player discovery coming in the next update.</div>
      </div>
    </div>`);
  };

  const readMessage = async (messageId, el) => {
    await HF_DB.markMessageRead(messageId);
    const badge = el.querySelector(".msg-unread");
    if (badge) badge.remove();

    const session = HF_DB.getSession();
    const { data: msgs } = await HF_DB.getMessages(session.userId);
    const unreadCount = msgs?.filter((m) => !m.read).length || 0;
    HF_ROUTER.refreshSidenavBadge("messages", unreadCount, "var(--red)");
  };

  const showInvitePanel = () => {
    const panel = document.getElementById("invite-panel");
    if (panel)
      panel.style.display = panel.style.display === "none" ? "block" : "none";
  };

  const searchPlayers = async (query) => {
    const results = document.getElementById("player-search-results");
    if (!results) return;
    if (!query || query.length < 2) {
      results.innerHTML = "";
      return;
    }

    const { data } = await HF_DB.searchPlayers(query);
    const session = HF_DB.getSession();

    if (!data || data.length === 0) {
      results.innerHTML = `<div style="font-size:13px;color:var(--text2);padding:8px">No players found.</div>`;
      return;
    }

    results.innerHTML = data
      .map(
        (p) => `
    <div style="display:flex;align-items:center;gap:var(--sp-md);padding:10px;background:var(--bg);border:0.5px solid var(--border);margin-bottom:4px;">
      <div class="avatar avatar-sm" style="background:var(--green)">${HF_UTILS.initials(p.name)}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600;color:var(--text)">${p.name}</div>
        <div style="font-size:11px;color:var(--text2)">${p.profile?.pos || "-"} · ${p.profile?.tier || "-"} · ${p.profile?.hometown || "-"}</div>
        <div style="font-size:11px;color:${p.profile?.status === "unattached" ? "var(--green)" : "var(--text3)"}">
          ${p.profile?.status === "unattached" ? "Unattached — available" : "Already in a squad"}
        </div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="HF_COACH.invitePlayer('${p.id}', '${p.name}')">
        <i class="ti ti-send"></i> Invite
      </button>
    </div>`,
      )
      .join("");
  };

  const invitePlayer = async (playerId, playerName) => {
    const session = HF_DB.getSession();
    const squadName = session.profile?.club || "Unknown squad";

    const result = await HF_DB.sendSquadInvite(
      session.userId,
      playerId,
      squadName,
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    HF_UTILS.toast(`Invite sent to ${playerName}!`, "success");
    document.getElementById("player-search-input").value = "";
    document.getElementById("player-search-results").innerHTML = "";
    showInvitePanel();
  };

  const reviewAdminEdits = async () => {
    const session = HF_DB.getSession();
    const { data } = await HF_DB.getCoachVerification(session.userId);
    if (!data) {
      HF_UTILS.toast("No pending review found.", "error");
      return;
    }

    setMain(`
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Review admin changes</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:var(--sp-lg)">
        An admin has reviewed your squad registration and proposed the following changes. Please review and accept or decline.
      </div>

      ${
        data.admin_notes
          ? `
        <div style="padding:12px;background:rgba(24,95,165,.06);border-left:2px solid var(--blue);margin-bottom:var(--sp-lg);font-size:13px;color:var(--text2);">
          <strong style="color:var(--text)">Admin note:</strong> ${data.admin_notes}
        </div>`
          : ""
      }

      <table class="table" style="margin-bottom:var(--sp-lg);">
        <thead>
          <tr>
            <th>Field</th>
            <th>Your submission</th>
            <th>Admin's version</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight:600">Team name</td>
            <td>${data.team_name}</td>
            <td style="color:${data.edited_team_name && data.edited_team_name !== data.team_name ? "var(--gold)" : "var(--text2)"}">
              ${data.edited_team_name || data.team_name}
              ${data.edited_team_name && data.edited_team_name !== data.team_name ? '<i class="ti ti-edit" style="margin-left:4px"></i>' : ""}
            </td>
          </tr>
          <tr>
            <td style="font-weight:600">League</td>
            <td>${data.league}</td>
            <td style="color:${data.edited_league && data.edited_league !== data.league ? "var(--gold)" : "var(--text2)"}">
              ${data.edited_league || data.league}
              ${data.edited_league && data.edited_league !== data.league ? '<i class="ti ti-edit" style="margin-left:4px"></i>' : ""}
            </td>
          </tr>
          <tr>
            <td style="font-weight:600">Founding year</td>
            <td>${data.founding_year || "-"}</td>
            <td>${data.edited_founding_year || data.founding_year || "-"}</td>
          </tr>
          <tr>
            <td style="font-weight:600">Home ground</td>
            <td>${data.home_ground || "-"}</td>
            <td>${data.edited_home_ground || data.home_ground || "-"}</td>
          </tr>
        </tbody>
      </table>

      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary" onclick="HF_COACH.acceptAdminEdits('${data.id}')">
          <i class="ti ti-circle-check"></i> Accept changes
        </button>
        <button class="btn btn-danger" onclick="HF_COACH.declineAdminEdits('${data.id}')">
          <i class="ti ti-x"></i> Decline & resubmit
        </button>
      </div>
    </div>`);
  };

  const acceptAdminEdits = async (verificationId) => {
    const result = await HF_DB.acceptVerificationEdits(verificationId);
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    const session = HF_DB.getSession();
    session.squadStatus = "verified";
    HF_DB.saveSession(session);

    const overlay = document.getElementById("verification-alert");
    if (overlay) overlay.remove();

    await HF_DB.deleteAdminVerificationMessage(session.userId);

    HF_UTILS.toast("Changes accepted. Your squad is now verified!", "success");

    HF_ROUTER.refreshSidenavBadge("verifications", 0, "var(--gold)");

    HF_ROUTER.launch(session);
  };
  const declineAdminEdits = async (verificationId) => {
    const result = await HF_DB.declineVerificationEdits(verificationId);
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    const session = HF_DB.getSession();
    session.squadStatus = "rejected";
    HF_DB.saveSession(session);

    await HF_DB.deleteAdminVerificationMessage(session.userId);

    const overlay = document.getElementById("verification-alert");
    if (overlay) overlay.remove();

    HF_UTILS.toast(
      "Changes declined. You can resubmit your squad from the dashboard.",
      "success",
    );

    dashboard(session);
    HF_ROUTER.refreshSidenavBadge("verifications", 0, "var(--gold)");
  };

  const resubmitSquad = () => {
    setMain(`
    <div class="auth-card" style="max-width:480px;margin:0 auto;">
      <div class="auth-title">Resubmit squad registration</div>
      <div class="auth-sub">Enter your updated team details for verification</div>
      <div class="error-box" id="resubmit-err"></div>
      <div class="fg">
        <label class="required">Team name</label>
        <input type="text" id="rs-team" placeholder="e.g. Kumasi Academy FC"
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
      </div>
      <div class="fg">
        <label class="required">League / division</label>
        <input type="text" id="rs-league" placeholder="e.g. Ghana Premier League"
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
      </div>
      <div class="form-row">
        <div class="fg">
          <label>Founding year</label>
          <input type="number" id="rs-year" placeholder="e.g. 2005" min="1600"
            style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
        </div>
        <div class="fg">
          <label>Home ground</label>
          <input type="text" id="rs-ground" placeholder="e.g. Baba Yara Stadium"
            style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:var(--sp-md);">
        <button class="btn btn-primary" onclick="HF_COACH.submitResubmission()">
          <i class="ti ti-send"></i> Submit for verification
        </button>
        <button class="btn btn-outline" onclick="HF_ROUTER.navTo('dashboard')">
          Cancel
        </button>
      </div>
    </div>`);

    // prefill team name from session
    const session = HF_DB.getSession();
    const teamInput = document.getElementById("rs-team");
    if (teamInput) teamInput.value = session.profile?.club || "";
  };

  const submitResubmission = async () => {
    const session = HF_DB.getSession();
    const teamName = document.getElementById("rs-team")?.value.trim();
    const league = document.getElementById("rs-league")?.value.trim();
    const year = document.getElementById("rs-year")?.value.trim();
    const ground = document.getElementById("rs-ground")?.value.trim();

    if (!teamName) {
      HF_UTILS.toast("Please enter your team name.", "error");
      return;
    }
    if (!league) {
      HF_UTILS.toast("Please enter your league or division.", "error");
      return;
    }
    if (
      year &&
      (parseInt(year) < 1600 || parseInt(year) > new Date().getFullYear())
    ) {
      HF_UTILS.toast(
        `Founding year must be between 1600 and ${new Date().getFullYear()}.`,
        "error",
      );
      return;
    }

    const result = await HF_DB.submitSquadVerification({
      coachId: session.userId,
      teamName: teamName || session.profile?.club || "",
      league,
      foundingYear: year,
      homeGround: ground,
    });

    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    await HF_DB.updateSquadStatus(session.userId, "pending");
    session.squadStatus = "pending";
    HF_DB.saveSession(session);

    HF_UTILS.toast("Squad resubmitted for verification!", "success");
    HF_ROUTER.navTo("dashboard");
  };

  const archiveMessage = async (messageId, el) => {
    await HF_DB.archiveMessage(messageId);
    const msgItem = document.getElementById(`msg-${messageId}`);
    if (msgItem) msgItem.remove();

    const session = HF_DB.getSession();
    const { data: msgs } = await HF_DB.getMessages(session.userId);
    const unreadCount = msgs?.filter((m) => !m.read).length || 0;
    HF_ROUTER.refreshSidenavBadge("messages", unreadCount, "var(--red)");

    HF_UTILS.toast("Message archived.", "success");
  };

  return {
    render,
    readMessage,
    archiveMessage,
    showInvitePanel,
    searchPlayers,
    invitePlayer,
    reviewAdminEdits,
    acceptAdminEdits,
    declineAdminEdits,
    resubmitSquad,
    submitResubmission,
  };
})();

window.HF_COACH = HF_COACH;
