const HF_SCOUT = (() => {
  // HF_UTILS is registered by src/lib/legacyBridge.js after this script loads.
  const toast = (...args) => HF_UTILS.toast(...args);

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
      reports,
      placements,
      messages,
      findmytalent,
    };
    const fn = views[view] || dashboard;
    fn(session);
  };

  // ── DASHBOARD ──────────────────────────────────────────────
  const dashboard = async (s) => {
    const agencyStatus = s.agencyStatus || "unregistered";
    const isVerified = agencyStatus === "verified";
    const newUser = HF_UTILS.isNewUser(s);

    const [{ data: agentConvos }, { data: prospects }] = await Promise.all([
      HF_DB.getAgentConversations(s.userId),
      isVerified
        ? HF_DB.getScoutProspects(s.userId)
        : Promise.resolve({ data: null }),
    ]);

    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("ScoutDashboard", mc, {
        session: s,
        agentConvos,
        prospects,
      });
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
    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("ScoutProfile", mc, {
        session: s,
        onEdit: () => editProfile(),
        onSettings: () => HF_ROUTER.navTo("profile#settings"),
      });
  };

  // ── PROFILE HELPERS ───────────────────────────────────────────
  const editProfile = () => {
    const session = HF_DB.getSession();

    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc) window.HF_REACT.mount("ScoutEditProfile", mc, { session });
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

    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("ScoutDiscover", mc, {
        session: s,
        players,
        savedIds: [...savedIds],
      });
  };

  // ── SAVED PROSPECTS ────────────────────────────────────────
  const prospects = async (s) => {
    const { data: saved } = await HF_DB.getScoutProspects(s.userId);

    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc) window.HF_REACT.mount("ScoutProspects", mc, { session: s, saved });
  };

  // ── SAVED PROSPECTS ACTIONS HELPERS ────────────────────────────────
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
    prospects(HF_DB.getSession());
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
    prospects(HF_DB.getSession());
  };

  // ── REPORTS ────────────────────────────────────────────────
  const reports = async (s) => {
    const { data: saved } = await HF_DB.getScoutProspects(s.userId);
    const shared = saved?.filter((p) => p.report_shared) || [];

    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc) window.HF_REACT.mount("ScoutReports", mc, { session: s, shared });
  };

  // ── PLACEMENTS ─────────────────────────────────────────────
  const placements = async (s) => {
    const { data: saved } = await HF_DB.getScoutProspects(s.userId);
    const placed = saved?.filter((p) => p.placed) || [];

    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("ScoutPlacements", mc, { session: s, placed });
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

    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("ScoutMessages", mc, {
        session: s,
        enriched,
        enrichedArchived,
      });
  };

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

  // ── FIND MY TALENT ───────────────────────────────────────────
  const findmytalent = async (s) => {
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

    if (window._stopConfetti) window._stopConfetti();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("ScoutFindMyTalent", mc, {
        session: s,
        coaches: coachesWithStatus,
      });
  };

  return {
    render,
    dashboard,
    messages,
    prospects,
    profile,
    discover,
    findmytalent,
    resubmitAgency,
    submitAgencyResubmission,
    shareReport,
    arrangeTrial,
    markPlaced,
    editProfile,
    saveProfile,
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
  };
})();

window.HF_SCOUT = HF_SCOUT;
