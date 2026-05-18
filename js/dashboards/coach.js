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
    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc) mc.innerHTML = html;
  };

  const squad = async (s) => {
    const squadStatus = s.squadStatus || "unregistered";
    const isVerified = squadStatus === "verified";
    const p = s.profile || {};

    if (!isVerified) {
      setMain(`
    <div class="card">
      <div style="text-align:center;padding:32px;color:var(--text2)">
        <i class="ti ti-lock" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
        <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">Squad locked</div>
        <div style="font-size:13px">Register and verify your squad to start adding players.</div>
        <button class="btn btn-primary btn-sm" style="margin-top:16px" onclick="HF_COACH.resubmitSquad()">
          <i class="ti ti-clipboard-check"></i> Register your squad
        </button>
      </div>
    </div>`);
      return;
    }

    const { data: squadPlayers } = await HF_DB.getSquadPlayers(s.userId);
    const hasPlayers = squadPlayers?.length > 0;

    setMain(`
    <div class="card">
      <div class="card-title" style="justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">
          <div class="card-dot"></div>Squad roster: ${p.club || "Your club"}
          <span style="font-family:var(--font-head);font-size:10px;color:var(--text3);margin-left:4px">${squadPlayers?.length || 0} players</span>
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

      ${
        !hasPlayers
          ? `
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <i class="ti ti-users" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No players yet</div>
          <div style="font-size:13px">Invite players to your squad using the button above.</div>
        </div>`
          : `
        <table class="table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Position</th>
              <th>Tier</th>
              <th>Status</th>
              <th>Rating</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${squadPlayers
              .map((sp) => {
                const p = sp.player?.profile || {};
                const name = sp.player?.name || "Unknown";
                const safeName = name.replace(/'/g, "\\'");
                const overall = p.ratings
                  ? Math.round(
                      (p.ratings.speed +
                        p.ratings.tech +
                        p.ratings.tact +
                        p.ratings.phys) /
                        4,
                    )
                  : null;
                return `
                <tr>
                  <td style="font-weight:600">${name}</td>
                  <td>${p.pos || "-"}</td>
                  <td>${p.tier || "-"}</td>
                  <td>
                    <span style="font-size:10px;padding:1px 7px;font-weight:600;
                      background:${p.status === "signed" ? "rgba(26,122,46,.1)" : "rgba(196,154,10,.1)"};
                      color:${p.status === "signed" ? "var(--green)" : "var(--gold)"}">
                      ${p.status === "signed" ? "Signed" : "Unattached"}
                    </span>
                  </td>
                  <td style="font-weight:700;color:${overall ? "var(--gold)" : "var(--text3)"}">
                    ${overall !== null ? overall + "%" : "-"}
                  </td>
                  <td>
                    <button class="btn btn-danger btn-sm" onclick="HF_COACH.confirmKickPlayer('${sp.player_id}', '${safeName}')">
                      <i class="ti ti-logout"></i> Remove
                    </button>
                  </td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>`
      }
    </div>`);
  };

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
          <button class="btn btn-primary btn-sm" onclick="HF_COACH.resubmitSquad()">
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
    <div style="background:#0f0f0d;padding:var(--sp-2xl);margin-bottom:var(--sp-lg);display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-lg);">
      <div style="display:flex;align-items:center;gap:var(--sp-lg);">
        <div style="width:72px;height:72px;background:#C49A0A;display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:26px;font-weight:700;color:#0f0f0d;">
          ${HF_UTILS.initials(s.name)}
        </div>
        <div>
          <div style="font-family:var(--font-head);font-size:22px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">${s.name}</div>
          <div style="font-size:13px;color:rgba(255,255,255,.55);margin-top:3px;">${p.spec || "Head coach"} · ${p.club || "-"}</div>
          <div style="margin-top:8px;">${badgeHTML("Coach", "gold")}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">
          <div class="card-dot"></div>Coaching details
        </div>
        <button class="btn btn-outline btn-sm" onclick="HF_COACH.editProfile()">
          <i class="ti ti-edit"></i> Edit
        </button>
      </div>
      <div class="info-grid">
        <div class="info-cell"><div class="info-label">Licence</div><div class="info-val">${p.licence || "-"}</div></div>
        <div class="info-cell"><div class="info-label">Experience</div><div class="info-val">${p.exp || "-"} years</div></div>
        <div class="info-cell"><div class="info-label">Club</div><div class="info-val">${p.club || "-"}</div></div>
        <div class="info-cell"><div class="info-label">Specialisation</div><div class="info-val">${p.spec || "-"}</div></div>
        <div class="info-cell"><div class="info-label">Squad size</div><div class="info-val">${p.teamSize || 0} players</div></div>
        <div class="info-cell"><div class="info-label">${s.contactType === "phone" ? "Phone" : "Email"}</div><div class="info-val">${s.displayContact || s.contact}</div></div>
      </div>
    </div>`);
  };

  const editProfile = () => {
    const session = HF_DB.getSession();
    const p = session.profile || {};

    setMain(`
    <div style="background:#0f0f0d;padding:var(--sp-2xl);margin-bottom:var(--sp-lg);display:flex;align-items:flex-start;gap:var(--sp-lg);">
      <div style="position:relative;">
        <div style="width:72px;height:72px;background:#C49A0A;display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:26px;font-weight:700;color:#0f0f0d;">
          ${HF_UTILS.initials(session.name)}
        </div>
        <button onclick="HF_UTILS.toast('Profile photo upload coming soon!','success')"
          style="position:absolute;bottom:-8px;right:-8px;width:24px;height:24px;background:var(--gold);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#0f0f0d;">
          <i class="ti ti-camera" style="font-size:12px"></i>
        </button>
      </div>
      <div>
        <div style="font-family:var(--font-head);font-size:22px;font-weight:700;color:#fff;">${session.name}</div>
        <div style="font-size:13px;color:rgba(255,255,255,.55);margin-top:3px;">${p.spec || "Head coach"}</div>
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
        <div class="fg">
          <label class="required">Coaching licence</label>
          <select id="ep-licence">
            <option value="">Select licence</option>
            <option ${p.licence === "None yet" ? "selected" : ""}>None yet</option>
            <option ${p.licence === "CAF D" ? "selected" : ""}>CAF D</option>
            <option ${p.licence === "CAF C" ? "selected" : ""}>CAF C</option>
            <option ${p.licence === "CAF B" ? "selected" : ""}>CAF B</option>
            <option ${p.licence === "CAF A" ? "selected" : ""}>CAF A</option>
            <option ${p.licence === "UEFA Pro" ? "selected" : ""}>UEFA Pro</option>
          </select>
        </div>
        <div class="fg">
          <label class="required">Years experience</label>
          <input type="number" id="ep-exp" value="${p.exp || ""}" min="0" max="50"
            style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
        </div>
      </div>
      <div class="fg">
        <label>Specialisation</label>
        <select id="ep-spec">
          <option ${p.spec === "All-round" ? "selected" : ""}>All-round</option>
          <option ${p.spec === "Goalkeeper" ? "selected" : ""}>Goalkeeper</option>
          <option ${p.spec === "Defending" ? "selected" : ""}>Defending</option>
          <option ${p.spec === "Attacking" ? "selected" : ""}>Attacking</option>
          <option ${p.spec === "Set pieces" ? "selected" : ""}>Set pieces</option>
          <option ${p.spec === "Fitness & conditioning" ? "selected" : ""}>Fitness & conditioning</option>
        </select>
      </div>
      ${
        session.squadStatus === "verified"
          ? `
        <div style="padding:12px;background:rgba(26,122,46,.05);border-left:2px solid var(--green);font-size:13px;color:var(--text2);margin-bottom:var(--sp-md)">
          <i class="ti ti-circle-check" style="margin-right:6px;color:var(--green)"></i>
          Your squad <strong style="color:var(--green)">${session.profile?.club || ""}</strong> is verified. To change your club name please
          <span onclick="HF_COACH.contactAdmin()" style="color:var(--gold);cursor:pointer;text-decoration:underline;">contact an administrator</span>.
        </div>`
          : `
        <div style="padding:12px;background:var(--bg2);border-left:2px solid var(--border);font-size:13px;color:var(--text2);margin-bottom:var(--sp-md)">
          <i class="ti ti-info-circle" style="margin-right:6px"></i>
          Club name is set during squad verification.
        </div>`
      }
      <div style="display:flex;gap:8px;margin-top:4px;">
        <button class="btn btn-primary" onclick="HF_COACH.saveProfile()">
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
    const licence = document.getElementById("ep-licence")?.value;
    const exp = document.getElementById("ep-exp")?.value;
    const spec = document.getElementById("ep-spec")?.value;

    if (!name) {
      HF_UTILS.toast("Please enter your full name.", "error");
      return;
    }
    if (!licence) {
      HF_UTILS.toast("Please select your coaching licence.", "error");
      return;
    }
    if (!exp || parseInt(exp) < 0 || parseInt(exp) > 50) {
      HF_UTILS.toast("Please enter valid years of experience (0-50).", "error");
      return;
    }

    if (name !== session.name) {
      const nameResult = await HF_DB.updateUserName(session.userId, name);
      if (nameResult.error) {
        HF_UTILS.toast(nameResult.error, "error");
        return;
      }
      session.name = name;
    }

    const updatedProfile = { ...p, licence, exp, spec };
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

    const nameDisplay = document.getElementById("topbar-name-display");
    if (nameDisplay) nameDisplay.textContent = name;

    HF_UTILS.toast("Profile updated!", "success");
    HF_ROUTER.navTo("profile");
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
  const tracking = async (s) => {
    const { data: squadPlayers } = await HF_DB.getSquadPlayers(s.userId);
    const { data: recentRatings } = await HF_DB.getSquadSessionRatings(
      s.userId,
    );

    if (!squadPlayers || squadPlayers.length === 0) {
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
      <div class="card-title"><div class="card-dot"></div>Log a session rating</div>
      <div class="form-row">
        <div class="fg"><label class="required">Player</label>
          <select id="tr-player">
            <option value="">Select player</option>
            ${squadPlayers.map((sp) => `<option value="${sp.player_id}">${sp.player?.name || "Unknown"}</option>`).join("")}
          </select>
        </div>
        <div class="fg"><label class="required">Session type</label>
          <select id="tr-type">
            <option value="">Select type</option>
            <option>Technical</option>
            <option>Tactical</option>
            <option>Physical</option>
            <option>Recovery</option>
            <option>Match</option>
          </select>
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
          <input type="range" min="1" max="10" value="7" step="1"
            style="width:100%;accent-color:var(--gold);margin-top:4px"
            oninput="document.getElementById('cv-${l.toLowerCase()}').textContent=this.value">
        </div>`,
        )
        .join("")}
      <div class="fg" style="margin-top:8px">
        <label>Notes</label>
        <input type="text" id="tr-notes" placeholder="e.g. Strong first touch, work on weak foot"
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
      </div>
      <button class="btn btn-primary" style="margin-top:8px" onclick="HF_COACH.saveSessionRating()">
        <i class="ti ti-circle-check"></i> Save rating
      </button>
    </div>

    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Recent session ratings</div>
      ${
        !recentRatings || recentRatings.length === 0
          ? `
        <div style="text-align:center;padding:24px;color:var(--text2);font-size:13px">
          No ratings logged yet.
        </div>`
          : `<table class="table">
          <thead><tr><th>Player</th><th>Type</th><th>Overall</th><th>Date</th></tr></thead>
          <tbody>
            ${recentRatings
              .map(
                (r) => `
              <tr>
                <td style="font-weight:600">${r.player?.name || "-"}</td>
                <td>${r.session_type}</td>
                <td style="font-weight:700;color:${r.overall >= 8 ? "var(--green)" : r.overall >= 6 ? "var(--gold)" : "var(--red)"}">
                  ${r.overall}/10
                </td>
                <td style="color:var(--text2)">${HF_UTILS.timeAgo(r.created_at)}</td>
              </tr>`,
              )
              .join("")}
          </tbody>
        </table>`
      }
    </div>`);
  };

  // HEALTH
  const health = async (s) => {
    const { data: squadPlayers } = await HF_DB.getSquadPlayers(s.userId);

    if (!squadPlayers || squadPlayers.length === 0) {
      setMain(`
      <div class="card">
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <i class="ti ti-stethoscope" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No players to monitor yet</div>
          <div style="font-size:13px;margin-bottom:16px">Invite players to your squad to start tracking their health and wellness.</div>
          <button class="btn btn-primary btn-sm" onclick="HF_ROUTER.navTo('squad')">
            <i class="ti ti-users"></i> Go to squad
          </button>
        </div>
      </div>`);

      // show popup
      setTimeout(() => {
        HF_UTILS.toast(
          "Invite players to your squad to unlock health tracking.",
          "success",
        );
      }, 300);
      return;
    }

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
          <select>${verifiedSquad.map((p) => `<option>${p.name}</option>`).join("")}</select>
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
    setMain(`
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Recruitment prospects</div>
      <div style="text-align:center;padding:32px;color:var(--text2)">
        <i class="ti ti-search" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
        <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No prospects yet</div>
        <div style="font-size:13px">Players flagged by verified scouts will appear here once scouts share reports.</div>
      </div>
    </div>`);
  };

  // MESSAGES
  const messages = async (s) => {
    const { data: msgs } = await HF_DB.getMessages(s.userId);
    const { data: archived } = await HF_DB.getArchivedMessages(s.userId);
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
      <div class="card-title" style="justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">
          <div class="card-dot"></div>Messages
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-primary btn-sm" onclick="HF_COACH.composeMessage()">
            <i class="ti ti-edit"></i> New message
          </button>
          <button class="btn btn-outline btn-sm" onclick="HF_COACH.contactAdmin()">
            <i class="ti ti-headset"></i> Contact admin
          </button>
        </div>
      </div>
      ${
        !enriched || enriched.length === 0
          ? `
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <i class="ti ti-message" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No messages yet</div>
          <div style="font-size:13px">Messages from HappyFeet will appear here.</div>
        </div>`
          : HF_UTILS.messageListHTML(enriched, "coach")
      }
    </div>

    ${
      enrichedArchived?.length > 0
        ? `
      <div class="card">
        <div class="card-title" style="cursor:pointer;" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
          <div class="card-dot"></div>Archived
          <span style="margin-left:auto;font-size:11px;color:var(--text3)">${enrichedArchived.length} · click to expand</span>
        </div>
        <div style="display:none">
          ${enrichedArchived
            .map(
              (m) => `
          <div class="msg-item" id="archived-msg-${m.id}" style="cursor:pointer;" 
            onclick="HF_COACH.viewThread('${m.thread_id}', '${m.from_id}', '${(m.subject || "").replace(/'/g, "\\'")}')">
            <div class="avatar avatar-md" style="background:var(--bg2);display:flex;align-items:center;justify-content:center;">
              <i class="ti ti-shield" style="font-size:16px;color:var(--text3)"></i>
            </div>
            <div style="flex:1;opacity:0.6">
              <div style="font-size:11px;font-family:var(--font-head);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--text3);margin-bottom:2px;">
                From: ${m.senderName || "HappyFeet Admin"}
              </div>
              <div class="msg-name">${m.subject || "Message"}</div>
              <div class="msg-preview">${m.body}</div>
              <div class="msg-time">${HF_UTILS.timeAgo(m.created_at)}</div>
            </div>
            <button class="btn btn-outline btn-sm" style="font-size:10px;padding:2px 8px;flex-shrink:0;"
              title="Move back to inbox"
              onclick="event.stopPropagation();HF_COACH.unarchiveMessage('${m.id}')">
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

  // FAITH
  const faith = async (s) => {
    const todayKey = new Date().toISOString().split("T")[0];
    const storageKey = `hf_faith_checklist_coach_${s.userId}_${todayKey}`;
    const checked = JSON.parse(localStorage.getItem(storageKey) || "[]");

    const prayers = [
      {
        id: "patience",
        title: "On patience with players",
        desc: '"Love is patient, love is kind." ~ 1 Corinthians 13:4',
      },
      {
        id: "leading",
        title: "On leading well",
        desc: '"Whoever wants to become great must be your servant." ~ Matthew 20:26',
      },
      {
        id: "perseverance",
        title: "On perseverance",
        desc: '"Let us not become weary in doing good." ~ Galatians 6:9',
      },
    ];

    const allChecked = prayers.every((p) => checked.includes(p.id));

    setMain(`
    <div class="faith-hero">
      <i class="ti ti-cross" style="font-size:32px;margin-bottom:10px;display:block;color:var(--faith)"></i>
      <div style="font-size:20px;font-weight:700;margin-bottom:6px">Team Devotion</div>
      <div style="font-size:13px;opacity:.8">Lead your players in faith as well as football.</div>
    </div>

    <div class="faith-verse-card">
      <div class="verse-text">${HF_SCRIPTURE.getToday().verse}</div>
      <div class="verse-ref">${HF_SCRIPTURE.getToday().ref}</div>
    </div>

    <div class="card faith-card">
      <div class="card-title" style="justify-content:space-between;padding-top:var(--sp-md);">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">Daily devotion checklist
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
          <div style="display:flex;align-items:flex-start;gap:var(--sp-md);padding:var(--sp-md);background:var(--bg2);border-left:2px solid ${isChecked ? "var(--green)" : "var(--faith)"};margin-bottom:var(--sp-sm);cursor:pointer;"
            onclick="HF_COACH.togglePrayer('${p.id}', '${todayKey}', '${s.userId}')">
            <div style="width:20px;height:20px;border:2px solid ${isChecked ? "var(--green)" : "var(--faith)"};background:${isChecked ? "var(--green)" : "transparent"};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">
              ${isChecked ? '<i class="ti ti-check" style="font-size:12px;color:#fff;"></i>' : ""}
            </div>
            <div>
              <div style="font-family:var(--font-head);font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${isChecked ? "var(--green)" : "var(--faith)"};margin-bottom:4px;">
                ${p.title}
              </div>
              <div style="font-size:12px;color:var(--text2);font-style:italic;line-height:1.5;${isChecked ? "opacity:0.5;" : ""}">
                ${p.desc}
              </div>
            </div>
          </div>`;
        })
        .join("")}
    </div>

    <div class="card faith-card">
  <div class="card-title" style="padding-top:var(--sp-md);">How to run team devotion</div>
  <div style="display:flex;flex-direction:column;gap:var(--sp-sm);">
    ${[
      [
        "ti-users",
        "Gather the squad",
        "Before every session, 5 to 10 minutes together.",
      ],
      [
        "ti-book",
        "Read a verse together",
        `Today: ${HF_SCRIPTURE.getToday().ref}.`,
      ],
      [
        "ti-microphone",
        "One player leads prayer",
        "Rotate leadership each session.",
      ],
      ["ti-target", "Set an intention", "What does the squad play for today?"],
      ["ti-hand-stop", "Hands in, one voice", "Close together as a team."],
    ]
      .map(
        ([icon, title, desc], i) => `
      <div style="display:flex;align-items:flex-start;gap:var(--sp-md);padding:var(--sp-md);background:var(--bg2);border-left:3px solid var(--faith);">
        <div style="width:32px;height:32px;background:var(--faith);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:15px;">
          <i class="ti ${icon}"></i>
        </div>
        <div>
          <div style="font-family:var(--font);font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px;">
            ${i + 1}. ${title}
          </div>
          <div style="font-size:12px;color:var(--text2);line-height:1.5;">${desc}</div>
        </div>
      </div>`,
      )
      .join("")}
  </div>
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
    const badge = document.getElementById(`badge-${messageId}`);
    if (badge) badge.remove();

    await HF_DB.markMessageRead(messageId);

    const session = HF_DB.getSession();
    const { data: msgs } = await HF_DB.getMessages(session.userId);
    const unreadCount = msgs?.filter((m) => !m.read).length || 0;
    HF_ROUTER.refreshSidenavBadge("messages", unreadCount, "var(--red)");

    messages(session);
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

    const session = HF_DB.getSession();
    const { data } = await HF_DB.searchPlayers(query);

    const { data: existingInvites } = await HF_DB.getCoachInvites(
      session.userId,
    );

    // map player IDs to their invite status and declined_at
    const inviteStatusMap = {};
    existingInvites?.forEach((i) => {
      inviteStatusMap[i.player_id] = {
        status: i.status,
        declined_at: i.declined_at,
      };
    });

    if (!data || data.length === 0) {
      results.innerHTML = `<div style="font-size:13px;color:var(--text2);padding:8px">No available players found.</div>`;
      return;
    }

    results.innerHTML = data
      .map((p) => {
        const invite = inviteStatusMap[p.id];
        const isPending = invite?.status === "pending";
        const isAccepted = invite?.status === "accepted";
        const safeName = p.name.replace(/'/g, "\\'");

        // check 24 hour cooldown
        let isCoolingDown = false;
        let hoursLeft = 0;
        if (invite?.status === "declined" && invite?.declined_at) {
          const hoursPassed =
            (Date.now() - new Date(invite.declined_at).getTime()) /
            (1000 * 60 * 60);
          if (hoursPassed < 24) {
            isCoolingDown = true;
            hoursLeft = Math.ceil(24 - hoursPassed);
          }
        }

        const statusBadge = isPending
          ? `<span style="font-family:var(--font-head);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:2px 6px;background:rgba(196,154,10,.15);color:var(--gold);">Invite sent</span>`
          : isAccepted
            ? `<span style="font-family:var(--font-head);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:2px 6px;background:rgba(26,122,46,.15);color:var(--green);">In squad</span>`
            : isCoolingDown
              ? `<span style="font-family:var(--font-head);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:2px 6px;background:rgba(200,16,46,.15);color:var(--red);">Wait ${hoursLeft}h</span>`
              : "";

        const inviteBtn = isPending
          ? `<button class="btn btn-outline btn-sm" disabled style="opacity:0.4;cursor:not-allowed;">
           <i class="ti ti-clock"></i> Pending
         </button>`
          : isAccepted
            ? `<button class="btn btn-outline btn-sm" disabled style="opacity:0.4;cursor:not-allowed;">
           <i class="ti ti-circle-check"></i> Signed
         </button>`
            : isCoolingDown
              ? `<button class="btn btn-outline btn-sm" disabled style="opacity:0.4;cursor:not-allowed;">
           <i class="ti ti-clock"></i> ${hoursLeft}h cooldown
         </button>`
              : `<button class="btn btn-primary btn-sm" onclick="HF_COACH.invitePlayer('${p.id}', '${safeName}')">
           <i class="ti ti-send"></i> Invite
         </button>`;

        return `
      <div style="display:flex;align-items:center;gap:var(--sp-md);padding:10px;background:var(--bg);border:0.5px solid var(--border);margin-bottom:4px;${isPending || isAccepted || isCoolingDown ? "opacity:0.7;" : ""}">
        <div class="avatar avatar-sm" style="background:var(--green)">${HF_UTILS.initials(p.name)}</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="font-size:13px;font-weight:600;color:var(--text)">${p.name}</div>
            ${statusBadge}
          </div>
          <div style="font-size:11px;color:var(--text2)">${p.profile?.pos || "-"} · ${p.profile?.tier || "-"} · ${p.profile?.hometown || "-"}</div>
          <div style="font-size:11px;color:${!p.profile?.club ? "var(--green)" : "var(--text3)"}">
            ${!p.profile?.club || p.profile?.status === "unattached" ? "Unattached" : p.profile?.club}
          </div>
        </div>
        ${inviteBtn}
      </div>`;
      })
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
    const session = HF_DB.getSession();
    const p = session.profile || {};
    const squadStatus = session.squadStatus || "unregistered";
    const isFirstTime = squadStatus === "unregistered";

    setMain(`
    <div class="auth-card" style="max-width:480px;margin:0 auto;">
      <div class="auth-title">${isFirstTime ? "Register your squad" : "Resubmit squad registration"}</div>
      <div class="auth-sub">${isFirstTime ? "Tell us about your team so we can verify it" : "Update your team details for verification"}</div>
      <div class="error-box" id="resubmit-err"></div>
      <div class="fg">
        <label class="required">Team name</label>
        <input type="text" id="rs-team" value="${p.club || ""}" placeholder="e.g. Kumasi Academy FC"
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
          <i class="ti ti-send"></i> ${isFirstTime ? "Submit for verification" : "Resubmit for verification"}
        </button>
        <button class="btn btn-outline" onclick="HF_ROUTER.navTo('dashboard')">
          Cancel
        </button>
      </div>
    </div>`);

    // prefill team name from session
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

  const confirmKickPlayer = (playerId, playerName) => {
    // first confirmation
    if (
      !confirm(
        `Are you sure you want to remove ${playerName} from your squad?\n\nThis will remove them from all tracking data.`,
      )
    )
      return;

    // second confirmation with reason
    const reason = prompt(
      `Please enter a reason for removing ${playerName}.\n\nThis cannot be undone.`,
    );
    if (!reason) {
      HF_UTILS.toast("Removal cancelled: reason is required.", "error");
      return;
    }
    if (reason.trim().length < 5) {
      HF_UTILS.toast("Please provide a more detailed reason.", "error");
      return;
    }

    kickPlayerFromSquad(playerId, playerName, reason);
  };

  const kickPlayerFromSquad = async (playerId, playerName, reason) => {
    const session = HF_DB.getSession();
    const result = await HF_DB.removePlayerFromSquad(
      session.userId,
      playerId,
      reason,
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    // decrement team size
    await HF_DB.decrementTeamSize(session.userId);
    session.profile = {
      ...session.profile,
      teamSize: Math.max(0, (session.profile?.teamSize || 1) - 1),
    };
    HF_DB.saveSession(session);

    HF_UTILS.toast(
      `${playerName} has been removed from your squad.`,
      "success",
    );
    squad(session);
  };

  const togglePrayer = (prayerId, dateKey, userId) => {
    const storageKey = `hf_faith_checklist_coach_${userId}_${dateKey}`;
    const checked = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const idx = checked.indexOf(prayerId);
    if (idx > -1) checked.splice(idx, 1);
    else checked.push(prayerId);
    localStorage.setItem(storageKey, JSON.stringify(checked));
    faith(HF_DB.getSession());
  };

  const saveSessionRating = async () => {
    const session = HF_DB.getSession();
    const playerId = document.getElementById("tr-player")?.value;
    const sessionType = document.getElementById("tr-type")?.value;

    if (!playerId) {
      HF_UTILS.toast("Please select a player.", "error");
      return;
    }
    if (!sessionType) {
      HF_UTILS.toast("Please select a session type.", "error");
      return;
    }

    const ratings = {
      speed:
        parseInt(document.getElementById("cv-speed")?.textContent || 7) * 10,
      technical:
        parseInt(document.getElementById("cv-technical")?.textContent || 7) *
        10,
      tactical:
        parseInt(document.getElementById("cv-tactical")?.textContent || 7) * 10,
      physical:
        parseInt(document.getElementById("cv-physical")?.textContent || 7) * 10,
    };

    const result = await HF_DB.saveSessionRating(
      session.userId,
      playerId,
      sessionType,
      ratings,
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    HF_UTILS.toast(
      `Session rating saved! Overall: ${result.overall}/100`,
      "success",
    );
    tracking(session);
  };

  const contactAdmin = () => {
    const session = HF_DB.getSession();
    const p = session.profile || {};
    setMain(`
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Contact admin</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:var(--sp-lg)">
        Send a message to the HappyFeet admin team. Common requests include updating your squad name, league, or other verified details.
      </div>
      <div class="fg">
        <label class="required">Subject</label>
        <select id="contact-subject" style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
          <option value="">Select a subject</option>
          <option>Change squad name</option>
          <option>Change league / division</option>
          <option>Update home ground</option>
          <option>Update founding year</option>
          <option>Appeal verification rejection</option>
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
        <textarea id="contact-body" rows="4" placeholder="Describe what you'd like to change and why..."
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);resize:vertical;"></textarea>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary" onclick="HF_COACH.sendAdminMessage()">
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
        `[Coach] ${subject}`,
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

  return {
    render,
    readMessage,
    archiveMessage,
    unarchiveMessage,
    showInvitePanel,
    searchPlayers,
    invitePlayer,
    reviewAdminEdits,
    acceptAdminEdits,
    declineAdminEdits,
    resubmitSquad,
    submitResubmission,
    confirmKickPlayer,
    togglePrayer,
    editProfile,
    saveProfile,
    saveSessionRating,
    contactAdmin,
    sendAdminMessage,
    composeMessage,
    sendComposedMessage,
    toggleCustomSubject,
    searchRecipients,
    selectRecipient,
    removeRecipient,
    toggleMsgActions,
    replyToMessage,
    sendReply,
    viewSenderProfile,
    reportToAdmin,
    viewThread,
  };
})();

window.HF_COACH = HF_COACH;
