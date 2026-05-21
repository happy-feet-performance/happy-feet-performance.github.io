const HF_SCOUT = (() => {
  const { badgeHTML, toast, initials } = HF_UTILS;

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
      discover,
      prospects,
      pipeline,
      reports,
      clubs,
      placements,
      messages,
      findmyteam,
    };
    const fn = views[view] || dashboard;
    fn(session);
  };

  // ── DASHBOARD ──────────────────────────────────────────────
  const dashboard = async (s) => {
    const p = s.profile || {};
    const agencyStatus = s.agencyStatus || "unregistered";
    const isVerified = agencyStatus === "verified";
    const isPending = agencyStatus === "pending";
    const isUnregistered = agencyStatus === "unregistered";
    const isRejected = agencyStatus === "rejected";
    const newUser = HF_UTILS.isNewUser(s);
    const { data: agentConvos } = await HF_DB.getAgentConversations(s.userId);

    let trackedCount = 0,
      eliteCount = 0,
      sharedCount = 0,
      placedCount = 0;
    if (isVerified) {
      const { data: prospects } = await HF_DB.getScoutProspects(s.userId);
      trackedCount = prospects?.length || 0;
      eliteCount = prospects?.filter((p) => p.flagged).length || 0;
      sharedCount = prospects?.filter((p) => p.report_shared).length || 0;
      placedCount = prospects?.filter((p) => p.placed).length || 0;
    }

    const regionsDisplay = Array.isArray(p.regionsCovered)
      ? p.regionsCovered.join(", ")
      : p.region || "-";
    const leaguesDisplay = Array.isArray(p.targetLeagues)
      ? p.targetLeagues.join(", ")
      : p.dest || "-";

    const agencyStatusBadge = isVerified
      ? `<span style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;background:rgba(26,122,46,.15);color:var(--green);">Verified</span>`
      : isPending
        ? `<span style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;background:rgba(196,154,10,.15);color:var(--gold);">Pending</span>`
        : isRejected
          ? `<span style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;background:rgba(200,16,46,.15);color:var(--red);">Rejected</span>`
          : `<span style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;background:var(--bg3);color:var(--text2);">Unregistered</span>`;

    const activityStats = [
      {
        label: "Tracked",
        val: trackedCount,
        icon: "ti-eye",
        color: "var(--gold)",
      },
      { label: "Elite", val: eliteCount, icon: "ti-flag", color: "var(--red)" },
      {
        label: "Reports shared",
        val: sharedCount,
        icon: "ti-file-text",
        color: "var(--blue)",
      },
      {
        label: "Placed",
        val: placedCount,
        icon: "ti-rocket",
        color: "var(--green)",
      },
    ];

    setMain(`
    <div class="welcome-banner">
      <div style="display:flex;align-items:center;gap:var(--sp-xl);">
        <div style="width:72px;height:72px;overflow:hidden;background:var(--blue);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#fff;">
          ${
            p.avatarUrl
              ? `<img src="${p.avatarUrl}?cb=${Date.now()}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`
              : HF_UTILS.initials(s.name)
          }
        </div>
        <div>
          <div class="welcome-title">${newUser ? "Welcome" : "Welcome back"}, Scout ${s.name.split(" ")[0]}!</div>
            <div class="welcome-sub">${p.org || "-"} · ${p.region || "-"}</div>
            <div style="margin-top:8px;display:flex;align-items:center;gap:8px;">
              ${badgeHTML("Scout", "blue")}
              ${agencyStatusBadge}
            </div>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-family:var(--font);font-size:42px;font-weight:700;color:var(--gold);">${isVerified ? trackedCount : "-"}</div>
        <div style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,.4);">Prospects tracked</div>
      </div>
    </div>

    ${HF_SCRIPTURE.stripHTML()}

    ${
      isUnregistered || isPending || isRejected
        ? `
      <div style="padding:var(--sp-lg);background:${isRejected ? "rgba(200,16,46,.06)" : "rgba(196,154,10,.06)"};border-left:3px solid ${isRejected ? "var(--red)" : "var(--gold)"};margin-bottom:var(--sp-lg);">
        <div style="font-family:var(--font);font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${isRejected ? "var(--red)" : "var(--gold)"};margin-bottom:6px;">
          ${isRejected ? "Agency verification rejected" : isPending ? "Agency verification pending" : "Agency not registered"}
        </div>
        <div style="font-size:13px;color:var(--text2);margin-bottom:12px;">
          ${
            isRejected
              ? "Your agency verification was rejected. Please review the reason in your messages and resubmit."
              : isPending
                ? "Your agency is awaiting admin approval. Full scouting features will unlock once verified."
                : "Register and verify your agency to unlock full scouting features."
          }
        </div>
        ${
          isUnregistered || isRejected
            ? `
          <button class="btn btn-primary btn-sm" onclick="HF_SCOUT.resubmitAgency()">
            <i class="ti ti-clipboard-check"></i> ${isRejected ? "Resubmit agency" : "Register your agency"}
          </button>`
            : ""
        }
        ${
          isRejected
            ? `
          <button class="btn btn-outline btn-sm" style="margin-left:8px" onclick="HF_ROUTER.navTo('messages')">
            <i class="ti ti-message"></i> View messages
          </button>`
            : ""
        }
      </div>`
        : ""
    }

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-val" style="color:var(--gold)">${isVerified ? trackedCount : "-"}</div>
        <div class="metric-label">Tracked</div>
        <div class="metric-sub" style="color:var(--text2)">${isVerified ? "Active prospects" : "Verify agency to unlock"}</div>
      </div>
      <div class="metric-card">
        <div class="metric-val" style="color:var(--red)">${isVerified ? eliteCount : "-"}</div>
        <div class="metric-label">Elite prospects</div>
        <div class="metric-sub" style="color:var(--text2)">${isVerified ? "Flagged" : "Verify agency to unlock"}</div>
      </div>
      <div class="metric-card">
        <div class="metric-val" style="color:var(--green)">${isVerified ? sharedCount : "-"}</div>
        <div class="metric-label">Reports shared</div>
        <div class="metric-sub" style="color:var(--text2)">${isVerified ? "Sent to clubs" : "Verify agency to unlock"}</div>
      </div>
      <div class="metric-card">
        <div class="metric-val" style="color:var(--blue)">${isVerified ? placedCount : "-"}</div>
        <div class="metric-label">Placed</div>
        <div class="metric-sub" style="color:var(--text2)">${isVerified ? "Total placements" : "Verify agency to unlock"}</div>
      </div>
    </div>

    <div class="quick-actions">
      <button class="quick-action" onclick="${isVerified ? "HF_ROUTER.navTo('discover')" : "HF_UTILS.toast('Verify your agency first.','error')"}">
        <div class="quick-action-icon"><i class="ti ti-search"></i></div>
        <div class="quick-action-label">Discover talent</div>
        <div class="quick-action-sub">${isVerified ? "Search players" : "Agency not verified"}</div>
      </button>
      <button class="quick-action" onclick="${isVerified ? "HF_ROUTER.navTo('prospects')" : "HF_UTILS.toast('Verify your agency first.','error')"}">
        <div class="quick-action-icon"><i class="ti ti-star"></i></div>
        <div class="quick-action-label">Saved prospects</div>
        <div class="quick-action-sub">${isVerified ? trackedCount + " being tracked" : "Agency not verified"}</div>
      </button>
      <button class="quick-action" onclick="${isVerified ? "HF_ROUTER.navTo('pipeline')" : "HF_UTILS.toast('Verify your agency first.','error')"}">
        <div class="quick-action-icon"><i class="ti ti-trending-up"></i></div>
        <div class="quick-action-label">Pipeline</div>
        <div class="quick-action-sub">${isVerified ? "Track progress" : "Agency not verified"}</div>
      </button>
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

  // ── PROFILE ────────────────────────────────────────────────
  const profile = async (s) => {
    // fetch fresh profile from db
    const { data: freshUser } = await HF_DB.getUserById(s.userId);
    if (freshUser?.profile) {
      s.profile = freshUser.profile;
      HF_DB.saveSession(s);
    }
    const p = s.profile || {};
    const regionsDisplay = Array.isArray(p.regionsCovered)
      ? p.regionsCovered.join(", ")
      : p.region || "-";
    const leaguesDisplay = Array.isArray(p.targetLeagues)
      ? p.targetLeagues.join(", ")
      : p.dest || "-";

    setMain(`
    <div style="background:#0f0f0d;padding:var(--sp-2xl);margin-bottom:var(--sp-lg);display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-lg);">
      <div style="display:flex;align-items:center;gap:var(--sp-lg);">
        <div style="width:72px;height:72px;overflow:hidden;background:#185FA5;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#fff;">
          ${
            p.avatarUrl
              ? `<img src="${p.avatarUrl}?cb=${Date.now()}" style="width:100%;height:100%;object-fit:cover;">`
              : HF_UTILS.initials(s.name)
          }
        </div>
        <div>
          <div style="font-family:var(--font);font-size:22px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">${s.name}</div>
          <div style="font-size:13px;color:rgba(255,255,255,.55);margin-top:3px;">${p.org || "-"}</div>
          <div style="margin-top:8px;">${badgeHTML("Scout", "blue")}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">
          <div class="card-dot"></div>Scout details
        </div>
        <button class="btn btn-outline btn-sm" onclick="HF_SCOUT.editProfile()">
          <i class="ti ti-edit"></i> Edit
        </button>
      </div>
      <div class="info-grid">
        <div class="info-cell"><div class="info-label">Organisation</div><div class="info-val">${p.org || "-"}</div></div>
        <div class="info-cell"><div class="info-label">Experience</div><div class="info-val">${p.exp || "-"} years</div></div>
        <div class="info-cell"><div class="info-label">Regions covered</div><div class="info-val">${regionsDisplay}</div></div>
        <div class="info-cell"><div class="info-label">Target destinations</div><div class="info-val">${leaguesDisplay}</div></div>
        <div class="info-cell"><div class="info-label">${s.contactType === "phone" ? "Phone" : "Email"}</div><div class="info-val">${s.displayContact || s.contact}</div></div>
        <div class="info-cell"><div class="info-label">Agency status</div>
          <div class="info-val" style="color:${s.agencyStatus === "verified" ? "var(--green)" : "var(--text2)"}">
            ${s.agencyStatus === "verified" ? "Verified" : s.agencyStatus || "Unregistered"}
          </div>
        </div>
      </div>
    </div>`);
  };

  // ── PROFILE HELPERS ───────────────────────────────────────────
  const editProfile = () => {
    const session = HF_DB.getSession();
    const p = session.profile || {};

    setMain(`
    <div style="background:#0f0f0d;padding:var(--sp-2xl);margin-bottom:var(--sp-lg);display:flex;align-items:flex-start;gap:var(--sp-lg);">
      <div style="position:relative;">
        <div id="avatar-banner" style="width:72px;height:72px;overflow:hidden;background:#185FA5;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#fff;">
          ${
            p.avatarUrl
              ? `<img src="${p.avatarUrl}?cb=${Date.now()}" style="width:100%;height:100%;object-fit:cover;">`
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
        <div style="font-family:var(--font);font-size:22px;font-weight:700;color:#fff;">${session.name}</div>
        <div style="font-size:13px;color:rgba(255,255,255,.55);margin-top:3px;">${p.org || "-"}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Edit profile</div>
      <div class="fg">
        <label class="required">Full name</label>
        <input type="text" id="ep-name" value="${session.name || ""}" placeholder="Your full name"
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
      </div>
      <div class="fg">
        <label class="required">Organisation / agency</label>
        <input type="text" id="ep-org" value="${p.org || ""}" placeholder="e.g. HappyFeet Scouting"
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
      </div>
      <div class="fg">
        <label class="required">Years experience</label>
        <input type="number" id="ep-exp" value="${p.exp || ""}" min="0" max="50"
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
      </div>
      ${
        session.agencyStatus === "verified"
          ? `
        <div style="padding:12px;background:rgba(26,122,46,.05);border-left:2px solid var(--green);font-size:13px;color:var(--text2);margin-bottom:var(--sp-md)">
          <i class="ti ti-circle-check" style="margin-right:6px;color:var(--green)"></i>
          Your agency <strong style="color:var(--green)">${session.profile?.org || ""}</strong> is verified. To change your agency name please
          <span onclick="HF_ROLE_UTILS.contactAdmin('scout')" style="color:var(--gold);cursor:pointer;text-decoration:underline;">contact an administrator</span>.
        </div>`
          : `
        <div style="padding:12px;background:var(--bg2);border-left:2px solid var(--border);font-size:13px;color:var(--text2);margin-bottom:var(--sp-md)">
          <i class="ti ti-info-circle" style="margin-right:6px"></i>
          Agency name is set during agency verification.
        </div>`
      }
      <div style="display:flex;gap:8px;margin-top:4px;">
        <button class="btn btn-primary" onclick="HF_SCOUT.saveProfile()">
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
    const org = document.getElementById("ep-org")?.value.trim();
    const exp = document.getElementById("ep-exp")?.value;

    if (!name) {
      HF_UTILS.toast("Please enter your full name.", "error");
      return;
    }
    if (!org) {
      HF_UTILS.toast("Please enter your organisation name.", "error");
      return;
    }
    if (!exp || parseInt(exp) < 0 || parseInt(exp) > 50) {
      HF_UTILS.toast("Please enter valid years of experience (0-50).", "error");
      return;
    }

    // handle avatar upload
    const file = window._pendingAvatarFile || null;
    let avatarUrl = p.avatarUrl || null;
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

    if (name !== session.name) {
      const nameResult = await HF_DB.updateUserName(session.userId, name);
      if (nameResult.error) {
        HF_UTILS.toast(nameResult.error, "error");
        return;
      }
      session.name = name;
    }

    const updatedProfile = { ...p, org, exp, avatarUrl };
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

  // ── AGENCY VERIFICATION HELPERS ───────────────────────────────────────────────
  const resubmitAgency = () => {
    const session = HF_DB.getSession();
    setMain(`
      <div class="auth-card" style="max-width:480px;margin:0 auto;">
        <div class="auth-title">Resubmit agency registration</div>
        <div class="auth-sub">Update your agency details for verification</div>
        <div class="error-box" id="reagency-err"></div>
        <div class="fg">
          <label class="required">Organisation / agency</label>
          <input type="text" id="rag-name" value="${session.profile?.org || ""}" placeholder="e.g. HappyFeet Scouting"
            style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
        </div>
        <div class="fg">
          <label class="required">Regions you cover</label>
          <div id="rag-regions-container" style="display:flex;flex-wrap:wrap;gap:6px;padding:10px;background:var(--bg2);border:0.5px solid var(--border);min-height:44px;"></div>
          <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">
            <button type="button" class="region-tag" data-value="Ghana" onclick="HF_AUTH.toggleTag(this,'rag-regions-container')" style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">Ghana</button>
            <button type="button" class="region-tag" data-value="Nigeria" onclick="HF_AUTH.toggleTag(this,'rag-regions-container')" style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">Nigeria</button>
            <button type="button" class="region-tag" data-value="Senegal" onclick="HF_AUTH.toggleTag(this,'rag-regions-container')" style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">Senegal</button>
            <button type="button" class="region-tag" data-value="Ivory Coast" onclick="HF_AUTH.toggleTag(this,'rag-regions-container')" style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">Ivory Coast</button>
            <button type="button" class="region-tag" data-value="Cameroon" onclick="HF_AUTH.toggleTag(this,'rag-regions-container')" style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">Cameroon</button>
            <button type="button" class="region-tag" data-value="West Africa" onclick="HF_AUTH.toggleTag(this,'rag-regions-container')" style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">West Africa</button>
            <button type="button" class="region-tag" data-value="All Africa" onclick="HF_AUTH.toggleTag(this,'rag-regions-container')" style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">All Africa</button>
          </div>
        </div>
        <div class="fg">
          <label class="required">Target leagues / destinations</label>
          <div id="rag-leagues-container" style="display:flex;flex-wrap:wrap;gap:6px;padding:10px;background:var(--bg2);border:0.5px solid var(--border);min-height:44px;"></div>
          <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">
            <button type="button" class="league-tag" data-value="Ghana Premier League" onclick="HF_AUTH.toggleTag(this,'rag-leagues-container')" style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">Ghana Premier League</button>
            <button type="button" class="league-tag" data-value="MLS" onclick="HF_AUTH.toggleTag(this,'rag-leagues-container')" style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">MLS</button>
            <button type="button" class="league-tag" data-value="Premier League" onclick="HF_AUTH.toggleTag(this,'rag-leagues-container')" style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">Premier League</button>
            <button type="button" class="league-tag" data-value="Europe" onclick="HF_AUTH.toggleTag(this,'rag-leagues-container')" style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">Europe</button>
            <button type="button" class="league-tag" data-value="Gulf" onclick="HF_AUTH.toggleTag(this,'rag-leagues-container')" style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">Gulf</button>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:var(--sp-md);">
          <button class="btn btn-primary" onclick="HF_SCOUT.submitAgencyResubmission()">
            <i class="ti ti-send"></i> Submit for verification
          </button>
          <button class="btn btn-outline" onclick="HF_ROUTER.navTo('dashboard')">Cancel</button>
        </div>
      </div>`);
  };

  const submitAgencyResubmission = async () => {
    const session = HF_DB.getSession();
    const agencyName = document.getElementById("rag-name")?.value.trim();
    const website = document.getElementById("rag-website")?.value?.trim();
    const regionsCovered = HF_AUTH.getSelectedTags("rag-regions-container");
    const targetLeagues = HF_AUTH.getSelectedTags("rag-leagues-container");

    if (!agencyName) {
      HF_UTILS.toast("Please enter your agency name.", "error");
      return;
    }
    if (regionsCovered.length === 0) {
      HF_UTILS.toast("Please select at least one region.", "error");
      return;
    }
    if (targetLeagues.length === 0) {
      HF_UTILS.toast("Please select at least one target league.", "error");
      return;
    }

    const result = await HF_DB.submitAgencyVerification({
      scoutId: session.userId,
      agencyName,
      regionsCovered,
      targetLeagues,
      website: website || null,
    });

    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    await HF_DB.updateVerificationStatus(session.userId, "squad", "pending");
    session.agencyStatus = "pending";
    HF_DB.saveSession(session);

    HF_UTILS.toast("Agency resubmitted for verification!", "success");
    HF_ROUTER.navTo("dashboard");
  };

  // ── DISCOVER ───────────────────────────────────────────────
  const discover = async (s) => {
    const { data: players } = await HF_DB.getAllPlayers();
    const { data: savedProspects } = await HF_DB.getScoutProspects(s.userId);
    const savedIds = new Set(savedProspects?.map((p) => p.player_id) || []);

    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Discover talent</div>
        <div style="display:flex;gap:8px;margin-bottom:var(--sp-lg);flex-wrap:wrap;">
          <select id="filter-pos" onchange="HF_SCOUT.filterPlayers()" style="padding:7px 10px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:12px;font-family:var(--font);outline:none;">
            <option value="">All positions</option>
            <option>GK</option><option>CB</option><option>LB</option><option>RB</option>
            <option>DM</option><option>CM</option><option>CAM</option>
            <option>LW</option><option>RW</option><option>ST</option>
          </select>
          <select id="filter-tier" onchange="HF_SCOUT.filterPlayers()" style="padding:7px 10px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:12px;font-family:var(--font);outline:none;">
            <option value="">All tiers</option>
            <option>U10</option><option>U12</option><option>U14</option><option>U16</option>
            <option>U18</option><option>U21</option><option>Professional</option>
          </select>
          <input type="text" id="filter-search" placeholder="Search by name..."
            oninput="HF_SCOUT.filterPlayers()"
            style="flex:1;min-width:120px;padding:7px 10px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:12px;font-family:var(--font);outline:none;">
        </div>

        <div id="players-list">
          ${
            !players || players.length === 0
              ? `
            <div style="text-align:center;padding:32px;color:var(--text2)">
              <i class="ti ti-users" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
              <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No players yet</div>
              <div style="font-size:13px">Players will appear here as they register on HappyFeet.</div>
            </div>`
              : players
                  .map((p) => _playerRow(p, savedIds.has(p.id), s.userId))
                  .join("")
          }
        </div>
      </div>`);

    // store players for filtering
    window._scoutAllPlayers = players;
    window._scoutSavedIds = savedIds;
    window._scoutUserId = s.userId;
  };

  // ── SAVED PROSPECTS ────────────────────────────────────────
  const prospects = async (s) => {
    const { data: saved } = await HF_DB.getScoutProspects(s.userId);

    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Saved prospects</div>
        ${
          !saved || saved.length === 0
            ? `
          <div style="text-align:center;padding:32px;color:var(--text2)">
            <i class="ti ti-star" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No saved prospects yet</div>
            <div style="font-size:13px">Discover and save players to build your prospect list.</div>
            <button class="btn btn-primary btn-sm" style="margin-top:16px" onclick="HF_ROUTER.navTo('discover')">
              <i class="ti ti-search"></i> Discover talent
            </button>
          </div>`
            : saved.map((sp) => _savedProspectRow(sp, s.userId)).join("")
        }
      </div>`);
  };

  // ── SAVED PROSPECTS HELPERS ───────────────────────────────────────
  const _playerRow = (p, isSaved, scoutId) => {
    const prof = p.profile || {};
    const overall = prof.ratings
      ? Math.round(
          (prof.ratings.speed +
            prof.ratings.tech +
            prof.ratings.tact +
            prof.ratings.phys) /
            4,
        )
      : null;

    return `
      <div class="prospect-row" onclick="HF_SCOUT.togglePlayerActions('${p.id}')" style="cursor:pointer;">
        <div class="avatar avatar-md" style="background:var(--green)">${HF_UTILS.initials(p.name)}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600;color:var(--text)">${p.name}</div>
          <div style="font-size:11px;color:var(--text2)">${prof.pos || "-"} · ${prof.tier || "-"} · ${prof.hometown || "-"}</div>
          <div style="font-size:11px;color:${prof.status === "unattached" || !prof.club ? "var(--green)" : "var(--text3)"}">
            ${prof.status === "unattached" || !prof.club ? "Unattached" : prof.club}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          ${overall !== null ? `<div style="font-size:16px;font-weight:700;color:var(--gold)">${overall}%</div>` : '<div style="font-size:13px;color:var(--text3)">Unrated</div>'}
          ${isSaved ? `<span style="font-family:var(--font);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:2px 6px;background:rgba(26,122,46,.15);color:var(--green);">Saved</span>` : ""}
        </div>
      </div>
      <div id="player-actions-${p.id}" style="display:none;padding:var(--sp-md);background:var(--bg2);border-left:2px solid var(--gold);margin-bottom:var(--sp-sm);">
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${
            !isSaved
              ? `
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();HF_SCOUT.savePlayer('${p.id}', '${p.name.replace(/'/g, "\\'")}')">
              <i class="ti ti-star"></i> Save prospect
            </button>`
              : ""
          }
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();HF_ROLE_UTILS.viewPlayerProfile('${p.id}')">
            <i class="ti ti-user"></i> View profile
          </button>
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();HF_SCOUT.messagePlayer('${p.id}', '${p.name.replace(/'/g, "\\'")}')">
            <i class="ti ti-message"></i> Message
          </button>
        </div>
      </div>`;
  };

  const _savedProspectRow = (sp, scoutId) => {
    const p = sp.player?.profile || {};
    const name = sp.player?.name || "Unknown";
    const safeName = name.replace(/'/g, "\\'");
    const overall = p.ratings
      ? Math.round(
          (p.ratings.speed + p.ratings.tech + p.ratings.tact + p.ratings.phys) /
            4,
        )
      : null;

    const statusColor = sp.flagged
      ? "var(--red)"
      : sp.report_shared
        ? "var(--gold)"
        : "var(--blue)";
    const statusLabel = sp.placed
      ? "Placed"
      : sp.trial_arranged
        ? "On trial"
        : sp.report_shared
          ? "Report shared"
          : sp.flagged
            ? "Flagged"
            : "Watching";

    return `
    <div class="prospect-row" onclick="HF_SCOUT.toggleSavedActions('${sp.id}')" style="cursor:pointer;">
      <div class="avatar avatar-md" style="background:${statusColor}">${HF_UTILS.initials(name)}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600;color:var(--text)">${name}</div>
        <div style="font-size:11px;color:var(--text2)">${p.pos || "-"} · ${p.tier || "-"} · ${p.hometown || "-"}</div>
        <div style="font-size:11px;color:${statusColor};margin-top:2px">${statusLabel}</div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        ${overall !== null ? `<div style="font-size:16px;font-weight:700;color:var(--gold)">${overall}%</div>` : '<div style="font-size:13px;color:var(--text3)">Unrated</div>'}
      </div>
    </div>
    <div id="saved-actions-${sp.id}" style="display:none;padding:var(--sp-md);background:var(--bg2);border-left:2px solid var(--gold);margin-bottom:var(--sp-sm);">
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();HF_ROLE_UTILS.viewPlayerProfile('${sp.player_id}')">
          <i class="ti ti-user"></i> View profile
        </button>
        ${
          !sp.report
            ? `
              <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();HF_SCOUT.generateReport('${scoutId}', '${sp.player_id}', '${safeName}')">
                <i class="ti ti-sparkles"></i> Generate report
              </button>`
            : `
              <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();HF_SCOUT.viewReport('${scoutId}', '${sp.player_id}', '${safeName}')">
                <i class="ti ti-file-text"></i> View report
              </button>`
        }
        ${
          sp.flagged
            ? `
              <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();HF_SCOUT.unflagProspect('${scoutId}', '${sp.player_id}', '${safeName}')">
                <i class="ti ti-flag-off"></i> Unflag
              </button>`
            : `
              <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();HF_SCOUT.flagProspect('${scoutId}', '${sp.player_id}', '${safeName}')">
                <i class="ti ti-flag"></i> Flag
              </button>`
        }
        ${
          !sp.report_shared
            ? sp.report
              ? `
                <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();HF_SCOUT.shareReportViaMessage('${scoutId}', '${sp.player_id}', '${safeName}')">
                  <i class="ti ti-file-text"></i> Share report
                </button>`
              : `
                <button class="btn btn-outline btn-sm" style="opacity:0.4;cursor:not-allowed;" disabled title="Generate a report first">
                  <i class="ti ti-file-text"></i> Share report
                </button>`
            : ""
        }
        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();HF_SCOUT.messagePlayer('${sp.player_id}', '${safeName}')">
          <i class="ti ti-message"></i> Message
        </button>
        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();HF_SCOUT.unsavePlayer('${scoutId}', '${sp.player_id}', '${safeName}')">
          <i class="ti ti-trash"></i> Remove
        </button>
      </div>
    </div>`;
  };

  const togglePlayerActions = (playerId) => {
    const actions = document.getElementById(`player-actions-${playerId}`);
    if (actions)
      actions.style.display =
        actions.style.display === "none" ? "block" : "none";
  };

  const toggleSavedActions = (prospectId) => {
    const actions = document.getElementById(`saved-actions-${prospectId}`);
    if (actions)
      actions.style.display =
        actions.style.display === "none" ? "block" : "none";
  };

  const unsavePlayer = async (scoutId, playerId, name) => {
    if (!confirm(`Remove ${name} from your prospects?`)) return;
    const result = await HF_DB.unsaveProspect(scoutId, playerId);
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    toast(`${name} removed from prospects.`, "success");
    prospects(HF_DB.getSession());
  };

  const flagProspect = async (scoutId, playerId, name) => {
    const result = await HF_DB.updateProspectStatus(scoutId, playerId, {
      flagged: true,
      status: "flagged",
    });
    if (result.error) {
      toast(result.error, "error");
      return;
    }

    const session = HF_DB.getSession();
    await HF_DB._sendMessage(
      "system",
      playerId,
      "You have been flagged as an elite prospect",
      `${session.name} from ${session.profile?.org || "HappyFeet Scouting"} has flagged you as an elite prospect. Your profile is being actively considered for placement opportunities.`,
    );

    toast(`${name} flagged as elite prospect!`, "success");
    prospects(HF_DB.getSession());
  };

  const unflagProspect = async (scoutId, playerId, name) => {
    const result = await HF_DB.updateProspectStatus(scoutId, playerId, {
      flagged: false,
      status: "watching",
    });
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    toast(`${name} unflagged.`, "success");
    prospects(HF_DB.getSession());
  };

  const shareReport = async (scoutId, playerId, name) => {
    const result = await HF_DB.updateProspectStatus(scoutId, playerId, {
      report_shared: true,
      status: "shared",
    });
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    const session = HF_DB.getSession();
    const { data } = await HF_DB.getProspectReport(scoutId, playerId);

    await HF_DB._sendMessage(
      "system",
      playerId,
      "Your scouting report has been shared",
      data?.report?.text
        ? `${session.name} from ${session.profile?.org || "HappyFeet Scouting"} has shared your scouting report with partner clubs.\n\n--- YOUR SCOUTING REPORT ---\n\n${data.report.text}`
        : `${session.name} from ${session.profile?.org || "HappyFeet Scouting"} has shared your profile with partner clubs.`,
    );

    HF_UTILS.toast(`Report shared for ${name}!`, "success");
    prospects(HF_DB.getSession());
  };

  // ── PIPELINE ───────────────────────────────────────────────
  const pipeline = async (s) => {
    const { data: saved } = await HF_DB.getScoutProspects(s.userId);

    const stages = [
      {
        key: "watching",
        label: "Watching",
        color: "var(--blue)",
        filter: (p) =>
          !p.flagged && !p.report_shared && !p.trial_arranged && !p.placed,
      },
      {
        key: "flagged",
        label: "Flagged",
        color: "var(--gold)",
        filter: (p) => p.flagged && !p.report_shared,
      },
      {
        key: "report_shared",
        label: "Report shared",
        color: "var(--faith)",
        filter: (p) => p.report_shared && !p.trial_arranged,
      },
      {
        key: "trial",
        label: "Trial arranged",
        color: "var(--red)",
        filter: (p) => p.trial_arranged && !p.placed,
      },
      {
        key: "placed",
        label: "Placed",
        color: "var(--green)",
        filter: (p) => p.placed,
      },
    ];

    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Active pipeline</div>
        ${
          !saved || saved.length === 0
            ? `
          <div style="text-align:center;padding:32px;color:var(--text2)">
            <i class="ti ti-chart-line" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No prospects in pipeline</div>
            <div style="font-size:13px">Save players as prospects to start building your pipeline.</div>
          </div>`
            : stages
                .map((stage) => {
                  const players = saved.filter(stage.filter);
                  return `
              <div style="margin-bottom:var(--sp-lg);">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                  <div style="width:12px;height:12px;background:${stage.color};flex-shrink:0;"></div>
                  <div style="font-family:var(--font);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text2);">
                    ${stage.label} (${players.length})
                  </div>
                </div>
                ${
                  players.length === 0
                    ? `
                  <div style="padding:8px 16px;font-size:12px;color:var(--text3);background:var(--bg2);">No players at this stage</div>`
                    : players
                        .map((sp) => {
                          const p = sp.player?.profile || {};
                          const name = sp.player?.name || "Unknown";
                          return `
                      <div style="display:flex;align-items:center;gap:var(--sp-md);padding:10px 12px;background:var(--bg2);border-left:3px solid ${stage.color};margin-bottom:4px;">
                        <div class="avatar avatar-sm" style="background:${stage.color}">${HF_UTILS.initials(name)}</div>
                        <div>
                          <div style="font-size:13px;font-weight:600;color:var(--text)">${name}</div>
                          <div style="font-size:11px;color:var(--text2)">${p.pos || "-"} · ${p.tier || "-"} · ${p.hometown || "-"}</div>
                        </div>
                        ${
                          sp.report
                            ? `
                          <button class="btn btn-outline btn-sm" style="margin-left:auto" onclick="HF_SCOUT.shareReportViaMessage('${s.userId}', '${sp.player_id}', '${name.replace(/'/g, "\\'")}')">
                            <i class="ti ti-file-text"></i> Share report
                          </button>`
                            : `
                          <button class="btn btn-outline btn-sm" style="margin-left:auto;opacity:0.4;cursor:not-allowed;" disabled title="Generate a report first">
                            <i class="ti ti-file-text"></i> No report yet
                          </button>`
                        }
                        ${
                          stage.key === "report_shared"
                            ? `
                          <button class="btn btn-outline btn-sm" style="margin-left:auto" onclick="HF_SCOUT.arrangeTrial('${s.userId}', '${sp.player_id}', '${name}')">
                            <i class="ti ti-calendar"></i> Arrange trial
                          </button>`
                            : ""
                        }
                        ${
                          stage.key === "trial"
                            ? `
                          <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="HF_SCOUT.markPlaced('${s.userId}', '${sp.player_id}', '${name}')">
                            <i class="ti ti-circle-check"></i> Mark placed
                          </button>`
                            : ""
                        }
                      </div>`;
                        })
                        .join("")
                }
              </div>`;
                })
                .join("")
        }
      </div>

      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Pipeline stages</div>
        <div style="font-size:12px;color:var(--text2);line-height:2.2">
          1. <strong style="color:var(--text)">Watching</strong>: Added, data collecting.<br>
          2. <strong style="color:var(--text)">Flagged</strong>: Meets threshold. Ready for report.<br>
          3. <strong style="color:var(--text)">Report shared</strong>: Profile sent to partner clubs.<br>
          4. <strong style="color:var(--text)">Trial arranged</strong>: Club interested. Date set.<br>
          5. <strong style="color:var(--text)">Placed</strong>: Signed. Follow up at 3 months.
        </div>
      </div>`);
  };

  // ── PIPELINE HELPERS ───────────────────────────────────────
  const arrangeTrial = async (scoutId, playerId, name) => {
    const result = await HF_DB.updateProspectStatus(scoutId, playerId, {
      trial_arranged: true,
      status: "trial",
    });
    if (result.error) {
      toast(result.error, "error");
      return;
    }

    const session = HF_DB.getSession();
    await HF_DB._sendMessage(
      "system",
      playerId,
      "A trial has been arranged for you",
      `Exciting news! ${session.name} from ${session.profile?.org || "HappyFeet Scouting"} has arranged a trial opportunity for you. Check your messages and stay ready. Keep training hard!`,
    );

    toast(`Trial arranged for ${name}!`, "success");
    pipeline(HF_DB.getSession());
  };

  const markPlaced = async (scoutId, playerId, name) => {
    const result = await HF_DB.updateProspectStatus(scoutId, playerId, {
      placed: true,
      status: "placed",
    });
    if (result.error) {
      toast(result.error, "error");
      return;
    }

    const session = HF_DB.getSession();
    await HF_DB._sendMessage(
      "system",
      playerId,
      "Congratulations! You have been placed!",
      `🎉 ${session.name} from ${session.profile?.org || "HappyFeet Scouting"} has marked you as successfully placed. This is a huge milestone in your football journey. Congratulations and God bless your next chapter!`,
    );

    toast(`${name} marked as placed!`, "success");
    pipeline(HF_DB.getSession());
  };

  // ── REPORTS ────────────────────────────────────────────────
  const reports = async (s) => {
    const { data: saved } = await HF_DB.getScoutProspects(s.userId);
    const shared = saved?.filter((p) => p.report_shared) || [];

    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Scout reports</div>
        ${
          shared.length === 0
            ? `
          <div style="text-align:center;padding:32px;color:var(--text2)">
            <i class="ti ti-file-text" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No reports yet</div>
            <div style="font-size:13px">Share a prospect's report to see it here.</div>
          </div>`
            : shared
                .map((sp) => {
                  const name = sp.player?.name || "Unknown";
                  return `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg2);margin-bottom:8px;border-left:2px solid var(--gold);">
                <div>
                  <div style="font-size:13px;font-weight:600">${name}</div>
                  <div style="font-size:11px;color:var(--text2)">Shared ${HF_UTILS.timeAgo(sp.updated_at)}</div>
                </div>
                ${badgeHTML("Shared", "gold")}
              </div>`;
                })
                .join("")
        }
      </div>`);
  };

  // ── PLACEMENTS ─────────────────────────────────────────────
  const placements = async (s) => {
    const { data: saved } = await HF_DB.getScoutProspects(s.userId);
    const placed = saved?.filter((p) => p.placed) || [];

    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Placements</div>
        ${
          placed.length === 0
            ? `
          <div style="text-align:center;padding:32px;color:var(--text2)">
            <i class="ti ti-circle-check" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No placements yet</div>
            <div style="font-size:13px">Players you mark as placed will appear here.</div>
          </div>`
            : placed
                .map((sp) => {
                  const name = sp.player?.name || "Unknown";
                  return `
              <div style="padding:12px;background:var(--bg2);border-left:2px solid var(--green);margin-bottom:8px;">
                <div style="font-size:13px;font-weight:600">${name}</div>
                <div style="font-size:11px;color:var(--text2)">Placed ${HF_UTILS.timeAgo(sp.updated_at)}</div>
              </div>`;
                })
                .join("")
        }
        <div style="display:flex;gap:24px;padding-top:12px;border-top:0.5px solid var(--border);margin-top:12px;">
          <div>
            <div style="font-size:18px;font-weight:700;color:var(--green)">${placed.length}</div>
            <div style="font-size:10px;color:var(--text2);text-transform:uppercase;font-family:var(--font);letter-spacing:0.08em">Total placements</div>
          </div>
        </div>
      </div>`);
  };

  // ── MESSAGES ───────────────────────────────────────────────
  const messages = async (s) => {
    const [{ data: msgs }, { data: archived }] = await Promise.all([
      HF_DB.getMessages(s.userId),
      HF_DB.getArchivedMessages(s.userId),
    ]);

    // enrich messages with sender names
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
            <div style="font-size:13px">Messages from HappyFeet and players will appear here.</div>
          </div>`
            : HF_UTILS.messageListHTML(enriched, "scout")
        }
      </div>

      ${
        archived?.length > 0
          ? `
        <div class="card">
          <div class="card-title" style="cursor:pointer;" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
            <div class="card-dot"></div>Archived
            <span style="margin-left:auto;font-size:11px;color:var(--text3)">${archived.length} · click to expand</span>
          </div>
          <div style="display:none">
            ${enrichedArchived
              .map(
                (m) => `
            <div class="msg-item" id="archived-msg-${m.id}" style="cursor:pointer;" 
              onclick="HF_ROLE_UTILS.viewThread('${m.thread_id}', '${m.from_id}', '${(m.subject || "").replace(/'/g, "\\'")}')">
              <div class="avatar avatar-md" style="background:var(--bg2);display:flex;align-items:center;justify-content:center;">
                <i class="ti ti-shield" style="font-size:16px;color:var(--text3)"></i>
              </div>
              <div style="flex:1;opacity:0.6">
                <div style="font-size:11px;font-family:var(--font);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--text3);margin-bottom:2px;">
                  From: ${m.senderName || (m.from_id === "system" ? "HappyFeet System" : "HappyFeet Admin")}
                </div>
                <div class="msg-name">${m.subject || "Message"}</div>
                <div class="msg-preview">${m.body}</div>
                <div class="msg-time">${HF_UTILS.timeAgo(m.created_at)}</div>
              </div>
              <button class="btn btn-outline btn-sm" style="font-size:10px;padding:2px 8px;flex-shrink:0;"
                title="Move back to inbox"
                onclick="event.stopPropagation();HF_SCOUT.unarchiveMessage('${m.id}')">
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

  // ── MESSAGES HELPERS ───────────────────────────────────────
  const messagePlayer = (playerId, playerName) =>
    HF_ROLE_UTILS.messageUser(playerId, playerName, "discover", "scout");

  const sendMessage = (playerId, playerName) =>
    HF_ROLE_UTILS.sendMessage(playerId, playerName, "discover");

  // ── REPORT ──────────────────────────────────────────────────
  const generateReport = async (scoutId, playerId, playerName) => {
    const { data: player } = await HF_DB.getUserById(playerId);
    const { data: sessions } = await HF_DB.getPlayerSessionRatings(playerId);
    const { data: prospect } = await HF_DB.getProspectReport(scoutId, playerId);
    const session = HF_DB.getSession();
    const p = player?.profile || {};

    const latestSession = sessions?.[0];
    const avgOverall = sessions?.length
      ? Math.round(
          sessions.reduce((sum, s) => sum + s.overall, 0) / sessions.length,
        )
      : null;

    setMain(`
    <div style="display:flex;align-items:center;gap:var(--sp-md);margin-bottom:var(--sp-lg);">
      <button class="btn btn-outline btn-sm" onclick="HF_ROUTER.navTo('prospects')">
        <i class="ti ti-arrow-left"></i> Back
      </button>
      <div style="font-family:var(--font);font-size:14px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:var(--text);">
        Generate scouting report for ${playerName}
      </div>
    </div>

    ${
      prospect?.report
        ? `
      <div style="padding:10px 12px;background:rgba(26,122,46,.06);border-left:2px solid var(--green);font-size:13px;color:var(--text2);margin-bottom:var(--sp-lg);">
        <i class="ti ti-circle-check" style="color:var(--green);margin-right:6px"></i>
        Report already generated ${HF_UTILS.timeAgo(prospect.report_generated_at)}. 
        <span onclick="HF_SCOUT.viewReport('${scoutId}', '${playerId}', '${playerName.replace(/'/g, "\\'")}')" 
          style="color:var(--gold);cursor:pointer;text-decoration:underline;">View existing report</span>
      </div>`
        : ""
    }

    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Player data</div>
      <div class="info-grid">
        <div class="info-cell"><div class="info-label">Name</div><div class="info-val">${playerName}</div></div>
        <div class="info-cell"><div class="info-label">Position</div><div class="info-val">${p.pos || "-"}</div></div>
        <div class="info-cell"><div class="info-label">Age tier</div><div class="info-val">${p.tier || "-"}</div></div>
        <div class="info-cell"><div class="info-label">Hometown</div><div class="info-val">${p.hometown || "-"}</div></div>
        <div class="info-cell"><div class="info-label">Club status</div><div class="info-val">${p.club || "Unattached"}</div></div>
        <div class="info-cell"><div class="info-label">Sessions logged</div><div class="info-val">${sessions?.length || 0}</div></div>
        ${avgOverall ? `<div class="info-cell"><div class="info-label">Avg overall</div><div class="info-val" style="color:var(--gold)">${avgOverall}/100</div></div>` : ""}
        ${
          latestSession
            ? `
          <div class="info-cell"><div class="info-label">Latest speed</div><div class="info-val">${latestSession.speed}/100</div></div>
          <div class="info-cell"><div class="info-label">Latest technical</div><div class="info-val">${latestSession.technical}/100</div></div>
          <div class="info-cell"><div class="info-label">Latest tactical</div><div class="info-val">${latestSession.tactical}/100</div></div>
          <div class="info-cell"><div class="info-label">Latest physical</div><div class="info-val">${latestSession.physical}/100</div></div>`
            : ""
        }
      </div>
    </div>

    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Scout observations</div>
      <div class="fg">
        <label>Key strengths observed</label>
        <textarea id="scout-strengths" rows="3" placeholder="e.g. Exceptional first touch, strong aerial ability, natural leader..."
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);resize:vertical;"></textarea>
      </div>
      <div class="fg">
        <label>Areas needing development</label>
        <textarea id="scout-weaknesses" rows="3" placeholder="e.g. Weak foot needs work, positional awareness in defensive phase..."
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);resize:vertical;"></textarea>
      </div>
      <div class="fg">
        <label>Additional context</label>
        <textarea id="scout-context" rows="2" placeholder="e.g. Observed in 3 matches, plays in Ghana Premier League youth setup..."
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);resize:vertical;"></textarea>
      </div>
      <div class="fg">
        <label>Target clubs / leagues</label>
        <input type="text" id="scout-targets" placeholder="e.g. MLS academies, Bundesliga youth teams..."
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
      </div>
      <button class="btn btn-primary" id="generate-report-btn" onclick="HF_SCOUT.submitGenerateReport('${scoutId}', '${playerId}', '${playerName.replace(/'/g, "\\'")}')">
        <i class="ti ti-sparkles"></i> Generate AI report
      </button>
    </div>`);
  };

  // ── REPORT HELPERS ──────────────────────────────────────────
  const submitGenerateReport = async (scoutId, playerId, playerName) => {
    const btn = document.getElementById("generate-report-btn");
    const strengths = document.getElementById("scout-strengths")?.value.trim();
    const weaknesses = document
      .getElementById("scout-weaknesses")
      ?.value.trim();
    const context = document.getElementById("scout-context")?.value.trim();
    const targets = document.getElementById("scout-targets")?.value.trim();

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="ti ti-loader"></i> Generating...';
    }

    const { data: player } = await HF_DB.getUserById(playerId);
    const { data: sessions } = await HF_DB.getPlayerSessionRatings(playerId);
    const session = HF_DB.getSession();
    const p = player?.profile || {};
    const avgOverall = sessions?.length
      ? Math.round(
          sessions.reduce((sum, s) => sum + s.overall, 0) / sessions.length,
        )
      : null;
    const latestSession = sessions?.[0];

    const prompt = `You are an expert football scout writing a professional scouting report for an African football talent platform called HappyFeet.

    Generate a detailed, professional scouting report for the following player:

    PLAYER DETAILS:
    - Name: ${playerName}
    - Position: ${p.pos || "Unknown"}
    - Age tier: ${p.tier || "Unknown"}
    - Hometown: ${p.hometown || "Unknown"}
    - Club status: ${p.club || "Unattached"}

    PERFORMANCE DATA:
    - Sessions logged: ${sessions?.length || 0}
    - Average overall rating: ${avgOverall ? avgOverall + "/100" : "No data"}
    ${
      latestSession
        ? `- Latest speed: ${latestSession.speed}/100
    - Latest technical: ${latestSession.technical}/100
    - Latest tactical: ${latestSession.tactical}/100
    - Latest physical: ${latestSession.physical}/100`
        : "- No session data available"
    }

    SCOUT OBSERVATIONS:
    - Strengths: ${strengths || "Not provided"}
    - Areas for development: ${weaknesses || "Not provided"}
    - Additional context: ${context || "Not provided"}
    - Target clubs/leagues: ${targets || "Not specified"}

    SCOUT AGENCY: ${session.profile?.org || "HappyFeet Scouting"}

    Write a professional scouting report with the following sections:
    1. PLAYER OVERVIEW
    2. TECHNICAL ANALYSIS
    3. PHYSICAL ANALYSIS  
    4. TACTICAL AWARENESS
    5. KEY STRENGTHS
    6. AREAS FOR IMPROVEMENT
    7. SCOUT RECOMMENDATION
    8. POTENTIAL RATING (score out of 10 with brief justification)

    Be specific, professional, and constructive. Focus on the African football context and potential for development. Format each section clearly.`;

    try {
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.protocol === "file:";

      let reportText;

      if (isLocal) {
        await new Promise((r) => setTimeout(r, 1500));
        reportText = `SCOUTING REPORT FOR ${playerName.toUpperCase()}

        1. PLAYER OVERVIEW
        ${playerName} is a ${p.tier || "youth"} ${p.pos || "field"} player from ${p.hometown || "Ghana"}. Currently ${p.club ? "signed to " + p.club : "unattached and available"}.

        2. TECHNICAL ANALYSIS
        Based on available session data, the player shows ${avgOverall ? (avgOverall >= 75 ? "strong" : avgOverall >= 60 ? "developing" : "early-stage") : "unmeasured"} technical ability${latestSession ? ` with a technical rating of ${latestSession.technical}/100` : ""}.

        3. PHYSICAL ANALYSIS
        ${latestSession ? `Physical rating of ${latestSession.physical}/100 with speed at ${latestSession.speed}/100.` : "Physical data not yet available (further sessions required)."}

        4. TACTICAL AWARENESS
        ${latestSession ? `Tactical rating of ${latestSession.tactical}/100.` : "Tactical assessment pending further observation."}

        5. KEY STRENGTHS
        ${strengths || "To be assessed in further sessions."}

        6. AREAS FOR IMPROVEMENT
        ${weaknesses || "Comprehensive assessment required."}

        7. SCOUT RECOMMENDATION
        ${avgOverall && avgOverall >= 70 ? "RECOMMEND for trial: player shows significant promise." : "MONITOR: continue observation before making placement recommendation."}

        8. POTENTIAL RATING
        ${avgOverall ? Math.round(avgOverall / 10) : 6}/10: ${avgOverall && avgOverall >= 75 ? "High potential with right development pathway." : "Developing talent requiring structured support."}

        Report generated by ${session.profile?.org || "HappyFeet Scouting"}.
        [LOCAL MOCK: Deploy to see real AI report]`;
      } else {
        const response = await fetch("/.netlify/functions/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system:
              "You are an expert football scout writing professional scouting reports for African football talent.",
            messages: [{ role: "user", content: prompt }],
          }),
        });
        const data = await response.json();
        reportText =
          data.content?.map((c) => c.text || "").join("") ||
          "Report generation failed.";
      }

      // save report
      const report = {
        text: reportText,
        playerName,
        position: p.pos,
        tier: p.tier,
        generatedBy: session.profile?.org || "HappyFeet Scouting",
        avgOverall,
      };

      await HF_DB.saveProspectReport(scoutId, playerId, report);
      HF_UTILS.toast("Report generated!", "success");
      viewReport(scoutId, playerId, playerName);
    } catch (err) {
      HF_UTILS.toast("Failed to generate report. Please try again.", "error");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="ti ti-sparkles"></i> Generate AI report';
      }
    }
  };

  const viewReport = async (scoutId, playerId, playerName) => {
    const { data } = await HF_DB.getProspectReport(scoutId, playerId);
    const session = HF_DB.getSession();
    window._currentReport = data.report;

    if (!data?.report) {
      HF_UTILS.toast("No report found. Generate one first.", "error");
      return;
    }

    const report = data.report;

    setMain(`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-lg);flex-wrap:wrap;gap:8px;">
      <div style="display:flex;align-items:center;gap:var(--sp-md);">
        <button class="btn btn-outline btn-sm" onclick="HF_ROUTER.navTo('prospects')">
          <i class="ti ti-arrow-left"></i> Back
        </button>
        <div style="font-family:var(--font);font-size:14px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:var(--text);">
          Scouting report for ${playerName}
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline btn-sm" onclick="HF_SCOUT.generateReport('${scoutId}', '${playerId}', '${playerName.replace(/'/g, "\\'")}')">
          <i class="ti ti-refresh"></i> Regenerate
        </button>
        <button class="btn btn-outline btn-sm" onclick="HF_SCOUT.downloadReport('${playerName.replace(/'/g, "\\'")}')">
          <i class="ti ti-markdown"></i> Download .md
        </button>
        <button class="btn btn-outline btn-sm" onclick="HF_SCOUT.downloadReportPDF('${playerName.replace(/'/g, "\\'")}', window._currentReport)">
          <i class="ti ti-file-type-pdf"></i> Download PDF
        </button>
        <button class="btn btn-primary btn-sm" onclick="HF_SCOUT.shareReportViaMessage('${scoutId}', '${playerId}', '${playerName.replace(/'/g, "\\'")}')">
          <i class="ti ti-send"></i> Share with coach
        </button>
      </div>
    </div>

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-lg);">
        <div>
          <div style="font-family:var(--font);font-size:18px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:var(--text);">
            ${playerName}
          </div>
          <div style="font-size:12px;color:var(--text2);margin-top:2px">
            ${report.position || "-"} · ${report.tier || "-"} · ${report.generatedBy}
          </div>
        </div>
        ${
          report.avgOverall
            ? `
          <div style="text-align:right;">
            <div style="font-family:var(--font);font-size:36px;font-weight:700;color:var(--gold)">${report.avgOverall}</div>
            <div style="font-size:10px;color:var(--text3);font-family:var(--font);text-transform:uppercase;letter-spacing:0.1em">Avg overall</div>
          </div>`
            : ""
        }
      </div>

      <div style="white-space:pre-line;font-size:13px;color:var(--text);line-height:1.8;background:var(--bg2);padding:var(--sp-lg);">
        ${report.text}
      </div>

      <div style="font-size:11px;color:var(--text3);margin-top:var(--sp-md);">
        Generated ${HF_UTILS.timeAgo(data.report_generated_at)}
      </div>
    </div>`);
  };

  const shareReportViaMessage = async (scoutId, playerId, playerName) => {
    const { data } = await HF_DB.getProspectReport(scoutId, playerId);
    const { data: verifiedClubs } = await HF_DB.getVerifiedClubs();
    const session = HF_DB.getSession();

    if (!data?.report) {
      HF_UTILS.toast("No report to share.", "error");
      return;
    }

    setMain(`
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Share report: ${playerName}</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:var(--sp-lg);">
        Send this scouting report to a coach. Select a verified coach from the list or search for any user.
      </div>
      <div class="fg">
        <label class="required">Send to</label>
        <input type="text" id="share-search" placeholder="Search by name or email..."
          oninput="HF_SCOUT.searchReportRecipients(this.value)"
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
        <div id="share-search-results" style="margin-top:4px;"></div>
        <div id="share-selected" style="display:none;margin-top:8px;padding:8px 12px;background:rgba(196,154,10,.08);border-left:2px solid var(--gold);font-size:13px;color:var(--text);align-items:center;justify-content:space-between;">
          <span id="share-selected-name"></span>
          <span onclick="HF_SCOUT.clearReportRecipient()" style="cursor:pointer;color:var(--text3);">
            <i class="ti ti-x"></i>
          </span>
        </div>
        <input type="hidden" id="share-to-id">
      </div>
      <div class="fg">
        <label>Additional message</label>
        <textarea id="share-message" rows="3" placeholder="Add a note to accompany the report..."
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);resize:vertical;"></textarea>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary" onclick="HF_SCOUT.sendReportMessage('${scoutId}', '${playerId}', '${playerName.replace(/'/g, "\\'")}')">
          <i class="ti ti-send"></i> Send report
        </button>
        <button class="btn btn-outline" onclick="HF_SCOUT.viewReport('${scoutId}', '${playerId}', '${playerName.replace(/'/g, "\\'")}')">
          Cancel
        </button>
      </div>
    </div>`);
  };

  const searchReportRecipients = async (query) => {
    const results = document.getElementById("share-search-results");
    if (!results) return;
    if (!query || query.length < 2) {
      results.innerHTML = "";
      return;
    }

    const session = HF_DB.getSession();
    const { data } = await HF_DB.searchAllUsers(query, session.userId);
    const coaches = data?.filter((u) => u.role === "coach") || [];

    if (coaches.length === 0) {
      results.innerHTML = `<div style="font-size:13px;color:var(--text2);padding:8px">No coaches found.</div>`;
      return;
    }

    results.innerHTML = coaches
      .map(
        (u) => `
    <div style="display:flex;align-items:center;gap:var(--sp-md);padding:10px;background:var(--bg);border:0.5px solid var(--border);margin-bottom:4px;cursor:pointer;"
      onmousedown="event.preventDefault();HF_SCOUT.selectReportRecipient('${u.id}', '${u.name.replace(/'/g, "\\'")}')">
      <div class="avatar avatar-sm" style="background:var(--gold)">${HF_UTILS.initials(u.name)}</div>
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--text)">${u.name}</div>
        <div style="font-size:11px;color:var(--text2)">Coach</div>
      </div>
    </div>`,
      )
      .join("");
  };

  const selectReportRecipient = (userId, userName) => {
    document.getElementById("share-to-id").value = userId;
    document.getElementById("share-search").value = "";
    document.getElementById("share-search-results").innerHTML = "";
    document.getElementById("share-selected-name").textContent = userName;
    document.getElementById("share-selected").style.display = "flex";
  };

  const clearReportRecipient = () => {
    document.getElementById("share-to-id").value = "";
    document.getElementById("share-selected").style.display = "none";
    document.getElementById("share-selected-name").textContent = "";
  };

  const sendReportMessage = async (scoutId, playerId, playerName) => {
    const session = HF_DB.getSession();
    const toId = document.getElementById("share-to-id")?.value;
    const note = document.getElementById("share-message")?.value.trim();

    if (!toId) {
      HF_UTILS.toast("Please select a recipient.", "error");
      return;
    }

    const { data } = await HF_DB.getProspectReport(scoutId, playerId);
    if (!data?.report) {
      HF_UTILS.toast("No report to share.", "error");
      return;
    }

    const body = `${note ? note + "\n\n" : ""}--- SCOUTING REPORT: ${playerName} ---\n\n${data.report.text}`;

    await HF_DB._sendMessage(
      session.userId,
      toId,
      `Scouting report: ${playerName}`,
      body,
    );

    await HF_DB._sendMessage(
      "system",
      playerId,
      "Your scouting report has been shared",
      `${session.name} from ${session.profile?.org || "HappyFeet Scouting"} has shared your scouting report with a coach. Your profile is being actively considered for opportunities.`,
    );

    // mark report as shared
    await HF_DB.updateProspectStatus(scoutId, playerId, {
      report_shared: true,
      status: "shared",
    });

    HF_UTILS.toast("Report shared with coach!", "success");
    HF_ROUTER.navTo("prospects");
  };

  const downloadReport = (playerName) => {
    const reportEl = document.querySelector(
      '.card [style*="white-space:pre-line"]',
    );
    if (!reportEl) {
      HF_UTILS.toast("No report to download.", "error");
      return;
    }

    const session = HF_DB.getSession();
    const date = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
    const agencyName = session.profile?.org || "HappyFeet Scouting";

    const mdContent = `# Scouting Report for ${playerName}

    **Generated by:** ${agencyName}  
    **Date:** ${date}  
    **Platform:** HappyFeet Performance Hub

    ---

    ${reportEl.textContent.trim()}

    ---

    *This report was generated by HappyFeet AI and reviewed by ${agencyName}.*
    `;

    const blob = new Blob([mdContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scouting-report-${playerName.toLowerCase().replace(/\s+/g, "-")}-${date.replace(/\//g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    HF_UTILS.toast("Report downloaded!", "success");
  };

  const downloadReportPDF = (playerName, report) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const session = HF_DB.getSession();
    const agency = session.profile?.org || "HappyFeet Scouting";
    const date = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // header bar
    doc.setFillColor(196, 154, 10);
    doc.rect(0, 0, pageWidth, 56, "F");

    // title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(15, 15, 13);
    doc.text("SCOUTING REPORT", margin, 36);

    // agency name right aligned
    doc.setFontSize(10);
    doc.text(agency, pageWidth - margin, 36, { align: "right" });

    y = 80;

    // player name
    doc.setFontSize(22);
    doc.setTextColor(15, 15, 13);
    doc.setFont("helvetica", "bold");
    doc.text(playerName.toUpperCase(), margin, y);
    y += 20;

    // date and position
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated: ${date}  |  ${report.position || "-"}  |  ${report.tier || "-"}`,
      margin,
      y,
    );
    y += 8;

    // divider
    doc.setDrawColor(196, 154, 10);
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);
    y += 20;

    // avg overall if available
    if (report.avgOverall) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("AVERAGE OVERALL RATING", pageWidth - margin - 80, y - 12, {
        align: "right",
      });
      doc.setFontSize(28);
      doc.setTextColor(196, 154, 10);
      doc.setFont("helvetica", "bold");
      doc.text(`${report.avgOverall}/100`, pageWidth - margin, y + 4, {
        align: "right",
      });
      y += 20;
    }

    // report body
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");

    const lines = doc.splitTextToSize(report.text || "", contentWidth);
    const lineHeight = 16;

    lines.forEach((line) => {
      // check if new page needed
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;

        // header on new page
        doc.setFillColor(196, 154, 10);
        doc.rect(0, 0, pageWidth, 8, "F");
        y = 32;
      }

      // style section headers
      if (line.match(/^\d+\.\s+[A-Z\s]+$/) || line.match(/^[A-Z\s]{4,}$/)) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(196, 154, 10);
        doc.text(line, margin, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
      } else {
        doc.text(line, margin, y);
      }

      y += lineHeight;
    });

    // footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `HappyFeet Performance Hub  |  ${agency}  |  Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 24,
        { align: "center" },
      );
    }

    doc.save(
      `scouting-report-${playerName.toLowerCase().replace(/\s+/g, "-")}-${date.replace(/\//g, "-")}.pdf`,
    );
    HF_UTILS.toast("PDF downloaded!", "success");
  };

  // ── FAITH ──────────────────────────────────────────────────
  const faith = (s) => {
    setMain(`
      <div class="faith-hero">
        <i class="ti ti-cross" style="font-size:32px;margin-bottom:10px;display:block;color:var(--faith)"></i>
        <div style="font-size:20px;font-weight:700;margin-bottom:6px">Faith & Purpose</div>
        <div style="font-size:13px;opacity:.8">Your talent is God-given. Your discipline is your worship.</div>
      </div>
      <div class="faith-verse-card">
        <div class="verse-text">${HF_SCRIPTURE.getToday().verse}</div>
        <div class="verse-ref">${HF_SCRIPTURE.getToday().ref}</div>
      </div>`);
  };

  // ── FIND MY TEAM ───────────────────────────────────────────
  const findmyteam = async (s) => {
    const { data: coaches } = await HF_DB.getVerifiedCoaches();
    const { data: approved } = await HF_DB.getApprovedClubNetwork(s.userId);

    const approvedIds = new Set(approved?.map((a) => a.coach_id) || []);

    // fetch network request status for each coach
    const coachesWithStatus = await Promise.all(
      (coaches || []).map(async (c) => {
        const { data: req } = await HF_DB.getClubNetworkStatus(s.userId, c.id);
        return { ...c, networkRequest: req, isApproved: approvedIds.has(c.id) };
      }),
    );

    setMain(`
    <div class="welcome-banner">
      <div>
        <div class="welcome-title">Club network</div>
        <div class="welcome-sub">Browse verified squads and request access to see full details</div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:32px;font-weight:700;color:var(--gold);">${approvedIds.size}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:0.08em;">In network</div>
      </div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:var(--sp-lg);flex-wrap:wrap;">
      <select id="fmt-filter" onchange="HF_SCOUT.filterFMTCoaches()"
        style="padding:7px 10px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:12px;font-family:var(--font);outline:none;">
        <option value="">All clubs</option>
        <option value="approved">In my network</option>
        <option value="pending">Pending</option>
      </select>
      <input type="text" id="fmt-search" placeholder="Search by coach or club name..."
        oninput="HF_SCOUT.filterFMTCoaches()"
        style="flex:1;min-width:150px;padding:7px 10px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:12px;font-family:var(--font);outline:none;">
    </div>

    <div id="fmt-coaches-list">
      ${
        !coachesWithStatus || coachesWithStatus.length === 0
          ? `
        <div class="card">
          <div style="text-align:center;padding:32px;color:var(--text2)">
            <i class="ti ti-building" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No verified clubs yet</div>
            <div style="font-size:13px">Verified clubs will appear here as coaches register.</div>
          </div>
        </div>`
          : coachesWithStatus.map((c) => _scoutClubCard(c, s.userId)).join("")
      }
    </div>

    <div id="club-detail-panel" style="display:none;margin-top:var(--sp-lg);"></div>`);

    window._fmtScoutCoaches = coachesWithStatus;
    window._scoutUserId = s.userId;
  };

  // ── FIND MY TEAM HELPERS ───────────────────────────────────
  const _scoutClubCard = (c, scoutId) => {
    const p = c.profile || {};
    const req = c.networkRequest;
    const isApproved = c.isApproved;
    const isPending = req?.status === "pending";
    const isDeclined = req?.status === "declined";
    const safeName = c.name.replace(/'/g, "\\'");
    const safeClub = (p.club || "").replace(/'/g, "\\'");

    return `
    <div class="card" style="margin-bottom:var(--sp-md);">
      <div style="display:flex;align-items:center;gap:var(--sp-md);">
        <div style="width:52px;height:52px;background:${isApproved ? "var(--green)" : "var(--bg2)"};border:2px solid ${isApproved ? "var(--green)" : "var(--border)"};display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:${isApproved ? "#fff" : "var(--text2)"};flex-shrink:0;">
          ${(p.club || c.name).charAt(0).toUpperCase()}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:15px;font-weight:700;color:var(--text)">${p.club || "-"}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:3px;">
            ${p.league ? `<span style="font-size:10px;font-weight:700;padding:1px 6px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text2);">${p.league}</span>` : ""}
            <span style="font-size:10px;color:var(--text3);">Coach: ${c.name}</span>
            ${p.exp ? `<span style="font-size:10px;color:var(--text3);">${p.exp} yrs exp</span>` : ""}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          ${
            isApproved
              ? `
            <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:2px 8px;background:rgba(26,122,46,.15);color:var(--green);">
              In network
            </span>`
              : isPending
                ? `
            <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:2px 8px;background:rgba(196,154,10,.15);color:var(--gold);">
              Pending
            </span>`
                : isDeclined
                  ? `
            <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:2px 8px;background:rgba(200,16,46,.1);color:var(--red);">
              Declined
            </span>`
                  : ""
          }
        </div>
      </div>

      <div style="margin-top:var(--sp-md);padding-top:var(--sp-md);border-top:0.5px solid var(--border);">
        ${
          isApproved
            ? `
          <div style="display:flex;gap:8px;align-items:center;">
            <button class="btn btn-outline btn-sm" onclick="HF_SCOUT.toggleClubDetail('${c.id}', '${safeClub}', '${p.league || ""}')">
              <i class="ti ti-chart-bar"></i> View squad details
            </button>
            <button class="btn btn-outline btn-sm" onclick="HF_SCOUT.messagePlayer('${c.id}', '${safeName}')">
              <i class="ti ti-message"></i> Message coach
            </button>
          </div>`
            : `
          <div style="display:flex;align-items:center;gap:var(--sp-md);">
            <div style="flex:1;font-size:12px;color:var(--text3);">
              <i class="ti ti-lock" style="margin-right:4px"></i>
              Request access to see squad details, ratings, and wellness data.
            </div>
            ${
              !isPending
                ? `
              <button class="btn btn-primary btn-sm" onclick="HF_SCOUT.requestNetwork('${c.id}', '${safeName}')">
                <i class="ti ti-network"></i> Request access
              </button>`
                : ""
            }
          </div>`
        }
      </div>
    </div>`;
  };

  const filterFMTCoaches = () => {
    const filter = document.getElementById("fmt-filter")?.value;
    const search = document.getElementById("fmt-search")?.value.toLowerCase();
    const list = document.getElementById("fmt-coaches-list");
    if (!list || !window._fmtScoutCoaches) return;

    const filtered = window._fmtScoutCoaches.filter((c) => {
      const p = c.profile || {};
      const matchFilter =
        !filter ||
        (filter === "approved" && c.isApproved) ||
        (filter === "pending" && c.networkRequest?.status === "pending");
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search) ||
        (p.club || "").toLowerCase().includes(search);
      return matchFilter && matchSearch;
    });

    list.innerHTML =
      filtered.length === 0
        ? `<div class="card"><div style="text-align:center;padding:24px;color:var(--text2);font-size:13px">No clubs match your filters.</div></div>`
        : filtered.map((c) => _scoutClubCard(c, window._scoutUserId)).join("");
  };

  const requestNetwork = async (coachId, coachName) => {
    const session = HF_DB.getSession();
    const result = await HF_DB.requestClubNetwork(session.userId, coachId);
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    await HF_DB._sendMessage(
      "system",
      coachId,
      "Scout network request",
      `${session.name} from ${session.profile?.org || "HappyFeet Scouting"} has requested to add your club to their scouting network. You can approve or decline from your squad page.`,
    );

    HF_UTILS.toast(`Network request sent to ${coachName}!`, "success");
    findmyteam(session);
  };

  const filterPlayers = () =>
    HF_ROLE_UTILS.filterPlayers(
      "_discoverAllPlayers",
      (p) => _discoverPlayerCard(p, window._scoutUserId),
      "discover-players-list",
      {
        pos: document.getElementById("disc-pos")?.value,
        tier: document.getElementById("disc-tier")?.value,
        search: document.getElementById("disc-search")?.value,
      },
    );

  const savePlayer = async (playerId, playerName) => {
    const session = HF_DB.getSession();
    const result = await HF_DB.saveProspect(session.userId, playerId);
    if (result.error) {
      toast(result.error, "error");
      return;
    }

    await HF_DB._sendMessage(
      "system",
      playerId,
      "You are being scouted",
      `${session.name} from ${session.profile?.org || "HappyFeet Scouting"} has added you to their prospect list. Your profile is now being actively monitored. Keep up the great work!`,
    );

    toast(`${playerName} saved as prospect!`, "success");
    discover(session);
  };

  const viewClubDetail = async (coachId, clubName, league) => {
    const { data: squadPlayers } = await HF_DB.getCoachSquadDetails(coachId);
    const { data: coachUser } = await HF_DB.getUserById(coachId);
    const { data: readiness } = await HF_DB.getSquadReadiness(coachId);
    const coachProfile = coachUser?.profile || {};

    const panel = document.getElementById("club-detail-panel");
    if (!panel) return;
    panel.style.display = "block";
    panel.scrollIntoView({ behavior: "smooth", block: "start" });

    const readinessColor = !readiness
      ? "var(--text3)"
      : readiness.score >= 75
        ? "var(--green)"
        : readiness.score >= 50
          ? "var(--gold)"
          : "var(--red)";

    panel.innerHTML = `
    <div class="card">
      <div style="background:#0f0f0d;padding:var(--sp-xl);margin:-var(--sp-lg) -var(--sp-lg) var(--sp-lg);display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-lg);">
        <div style="display:flex;align-items:center;gap:var(--sp-lg);">
          <div style="width:56px;height:56px;background:var(--green);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;flex-shrink:0;">
            ${clubName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-size:20px;font-weight:700;color:#fff;">${clubName}</div>
            <div style="font-size:12px;color:rgba(255,255,255,.4);margin-top:2px;">${league || "-"} · ${coachProfile.spec || "Football Club"}</div>
            <div style="margin-top:6px;font-size:11px;color:rgba(255,255,255,.4);">
              Coach: ${coachUser?.name || "-"} · ${coachProfile.licence || "-"} licence
            </div>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:32px;font-weight:700;color:${readinessColor};">${readiness ? readiness.score + "%" : "-"}</div>
          <div style="font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:0.08em;">Squad readiness</div>
        </div>
      </div>

      <div class="metrics-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:var(--sp-lg);">
        <div class="metric-card">
          <div class="metric-val" style="color:var(--gold)">${squadPlayers?.length || 0}</div>
          <div class="metric-label">Players</div>
        </div>
        <div class="metric-card">
          <div class="metric-val" style="color:var(--blue)">${readiness?.avgRating || "-"}</div>
          <div class="metric-label">Avg rating</div>
        </div>
        <div class="metric-card">
          <div class="metric-val" style="color:var(--green)">${readiness?.wellnessRate || "-"}%</div>
          <div class="metric-label">Wellness</div>
        </div>
      </div>

      ${
        squadPlayers && squadPlayers.length > 0
          ? `
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text2);margin-bottom:var(--sp-sm);">
          Squad
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:var(--sp-sm);">
          ${squadPlayers
            .map((sp) => {
              const p = sp.player?.profile || {};
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
              <div style="padding:var(--sp-md);background:var(--bg2);border-top:2px solid var(--border);display:flex;align-items:center;gap:var(--sp-sm);">
                <div class="avatar avatar-sm" style="background:var(--green);flex-shrink:0;">${HF_UTILS.initials(sp.player?.name || "?")}</div>
                <div style="min-width:0;">
                  <div style="font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${sp.player?.name || "-"}</div>
                  <div style="font-size:10px;color:var(--text2);">${p.pos || "-"} · ${overall !== null ? overall + "%" : "Unrated"}</div>
                </div>
              </div>`;
            })
            .join("")}
        </div>`
          : `
        <div style="text-align:center;padding:24px;color:var(--text2);font-size:13px;">
          No players in squad yet.
        </div>`
      }

      <div style="margin-top:var(--sp-lg);display:flex;gap:8px;">
        <button class="btn btn-outline btn-sm" onclick="HF_SCOUT.messagePlayer('${coachId}', '${coachUser?.name?.replace(/'/g, "\\'") || ""}')">
          <i class="ti ti-message"></i> Message coach
        </button>
        <button class="btn btn-outline btn-sm" onclick="document.getElementById('club-detail-panel').style.display='none'">
          <i class="ti ti-x"></i> Close
        </button>
      </div>
    </div>`;
  };

  const toggleClubDetail = async (coachId, clubName, league) => {
    const panel = document.getElementById("club-detail-panel");
    const chevron = document.getElementById(`chevron-${coachId}`);

    // if same club is open, close it
    if (
      panel &&
      panel.dataset.openCoach === coachId &&
      panel.style.display !== "none"
    ) {
      panel.style.display = "none";
      panel.dataset.openCoach = "";
      if (chevron) chevron.style.transform = "rotate(0deg)";
      return;
    }

    document
      .querySelectorAll('[id^="chevron-"]')
      .forEach((el) => (el.style.transform = "rotate(0deg)"));
    if (panel) panel.style.display = "none";

    if (chevron) chevron.style.transform = "rotate(90deg)";

    if (panel) panel.dataset.openCoach = coachId;
    await viewClubDetail(coachId, clubName, league);
  };

  return {
    render,
    resubmitAgency,
    submitAgencyResubmission,
    savePlayer,
    unsavePlayer,
    flagProspect,
    unflagProspect,
    shareReport,
    arrangeTrial,
    markPlaced,
    editProfile,
    saveProfile,
    togglePlayerActions,
    toggleSavedActions,
    generateReport,
    submitGenerateReport,
    viewReport,
    shareReportViaMessage,
    searchReportRecipients,
    selectReportRecipient,
    clearReportRecipient,
    sendReportMessage,
    downloadReport,
    downloadReportPDF,
    filterFMTCoaches,
    viewClubDetail,
    toggleClubDetail,
    requestNetwork,
    filterPlayers,
  };
})();

window.HF_SCOUT = HF_SCOUT;
