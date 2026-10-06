/**
 * HappyFeet: dashboards/coach.js
 * All views for the Coach role.
 */

const HF_COACH = (() => {
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
      squad,
      training,
      tracking,
      health,
      messages,
      faith,
      findmyteam,
    };
    const fn = views[view] || dashboard;
    fn(session);
  };

  // ── DASHBOARD ───────────────────────────────────────────────
  const dashboard = async (s) => {
    // run all dashboard queries in parallel
    const [{ data: freshStatus }, { data: readiness }, { data: agentConvos }] =
      await Promise.all([
        HF_DB.getUserStatus(s.userId, "squad"),
        HF_DB.getSquadReadiness(s.userId),
        HF_DB.getAgentConversations(s.userId),
      ]);

    if (
      freshStatus?.squad_status &&
      freshStatus.squad_status !== s.squadStatus
    ) {
      s.squadStatus = freshStatus.squad_status;
      HF_DB.saveSession(s);
    }

    const newUser = HF_UTILS.isNewUser(s);

    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("CoachDashboard", mc, {
        session: s,
        readiness,
        agentConvos,
        newUser,
      });
    if (newUser) setTimeout(() => HF_UTILS.launchConfetti(), 300);
  };

  // ── PROFILE ───────────────────────────────────────────────
  const profile = async (s) => {
    const wdl = await HF_DB.getCoachWDL(s.userId);

    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("CoachProfile", mc, {
        session: s,
        wdl,
        onEdit: () => editProfile(),
        onSettings: () => HF_ROUTER.navTo("profile#settings"),
      });
  };

  // ── PROFILE HELPERS ───────────────────────────────────────────────
  const editProfile = () => {
    const session = HF_DB.getSession();

    const mc = document.getElementById("main-content");
    if (mc) window.HF_REACT.mount("CoachEditProfile", mc, { session });
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

    const updatedProfile = { ...p, licence, exp, spec, avatarUrl };
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
    HF_ROUTER.buildSidenav(session);

    HF_UTILS.toast("Profile updated!", "success");
    HF_ROUTER.navTo("profile");
  };

  // ── SQUAD ───────────────────────────────────────────────
  const squad = async (s) => {
    const { data: squadPlayers } = await HF_DB.getSquadPlayers(s.userId);
    const { data: trialRequests } = await HF_DB.getPendingTrialRequests(
      s.userId,
    );
    const { data: trialPlayers } = await HF_DB.getTrialPlayers(s.userId);
    const { data: networkRequests } = await HF_DB.getPendingClubRequests(
      s.userId,
    );
    const isVerified = s.squadStatus === "verified";

    const mc = document.getElementById("main-content");
    if (mc) {
      window.HF_REACT.mount("CoachSquad", mc, {
        session: s,
        squadPlayers,
        trialRequests,
        trialPlayers,
        networkRequests,
      });
      if (isVerified) {
        HF_DB.getCoachWDL(s.userId).then((wdl) => {
          const wdlEl = document.getElementById("squad-wdl");
          if (wdlEl) wdlEl.innerHTML = HF_UTILS.wdlHTML(wdl.W, wdl.D, wdl.L);
        });
      }
    }
  };

  // ── SQUAD VERIFICATION HELPERS ───────────────────────────────────────────────
  const togglePlayerActions = (playerId) => {
    const row = document.getElementById(`actions-${playerId}`);
    const chevron = document.getElementById(`chevron-${playerId}`);
    if (!row) return;
    const isOpen = row.style.display !== "none";
    // close all others first
    document
      .querySelectorAll('[id^="actions-"]')
      .forEach((r) => (r.style.display = "none"));
    document.querySelectorAll('[id^="chevron-"]').forEach((c) => {
      c.className = "ti ti-chevron-down";
      c.style.color = "var(--text3)";
    });
    if (!isOpen) {
      row.style.display = "table-row";
      chevron.className = "ti ti-chevron-up";
      chevron.style.color = "var(--gold)";
    }
  };

  const reviewAdminEdits = async () => {
    const session = HF_DB.getSession();
    const { data } = await HF_DB.getCoachVerification(session.userId);
    if (!data) {
      HF_UTILS.toast("No pending review found.", "error");
      return;
    }

    const mc = document.getElementById("main-content");
    if (mc) window.HF_REACT.mount("CoachReviewAdminEdits", mc, { data });
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

    const mc = document.getElementById("main-content");
    if (mc) window.HF_REACT.mount("CoachResubmitSquad", mc, { session });
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

    await HF_DB.updateVerificationStatus(session.userId, "squad", "pending");
    session.squadStatus = "pending";
    HF_DB.saveSession(session);

    HF_UTILS.toast("Squad resubmitted for verification!", "success");
    HF_ROUTER.navTo("dashboard");
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
    await HF_DB.updateTeamSize(session.userId, -1);
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

  // ── SQUAD TRIAL HELPERS ───────────────────────────────────────
  const saveJerseyNumber = async (playerId, playerName) => {
    const session = HF_DB.getSession();
    const input = document.getElementById(`jersey-input-${playerId}`);
    const value = input?.value;
    const number = value ? parseInt(value) : null;

    if (number !== null && (number < 1 || number > 99)) {
      HF_UTILS.toast("Jersey number must be between 1 and 99.", "error");
      return;
    }

    const result = await HF_DB.setJerseyNumber(
      session.userId,
      playerId,
      number,
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    // notify player
    if (number) {
      await HF_DB._sendMessage(
        "system",
        playerId,
        "Jersey number assigned",
        `${session.name} has assigned you jersey #${number} for ${session.profile?.club || "your squad"}.`,
      );
    }

    HF_UTILS.toast(
      number
        ? `Jersey #${number} assigned to ${playerName}!`
        : "Jersey number cleared.",
      "success",
    );
    squad(session);
  };

  const respondTrialRequest = async (
    requestId,
    playerId,
    playerName,
    accept,
  ) => {
    const session = HF_DB.getSession();
    const status = accept ? "accepted" : "declined";

    const result = await HF_DB.respondToTrialRequest(requestId, status);
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    // notify player
    await HF_DB._sendMessage(
      "system",
      playerId,
      accept ? "Trial request accepted!" : "Trial request declined",
      accept
        ? `Great news! ${session.name} has accepted your trial request for ${session.profile?.club || "their squad"}. They will be in touch with further details. Stay ready!`
        : `${session.name} has declined your trial request at this time. You can send another request after 24 hours.`,
    );

    HF_UTILS.toast(
      accept
        ? `Trial accepted: ${playerName} has been notified!`
        : `Trial declined: ${playerName} has been notified.`,
      accept ? "success" : "error",
    );

    squad(session);
  };

  const acceptTrialRequest = async (requestId, playerId, playerName) => {
    const session = HF_DB.getSession();
    const result = await HF_DB.respondToTrialRequest(requestId, "trial");
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    await HF_DB._sendMessage(
      "system",
      playerId,
      "Trial request accepted!",
      `${session.name} has accepted your trial request for ${session.profile?.club || "their squad"}. You are now on trial! Train hard and make your mark!`,
    );

    HF_UTILS.toast(`${playerName} is now on trial!`, "success");
    squad(session);
  };

  const declineTrialRequest = async (requestId, playerId, playerName) => {
    const session = HF_DB.getSession();
    const result = await HF_DB.respondToTrialRequest(requestId, "declined");
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    await HF_DB._sendMessage(
      "system",
      playerId,
      "Trial request declined",
      `${session.name} has declined your trial request at this time. You can send another request after 24 hours.`,
    );

    HF_UTILS.toast(`${playerName}'s trial request declined.`, "error");
    squad(session);
  };

  const approveTrialPlayer = async (requestId, playerId, playerName) => {
    const session = HF_DB.getSession();

    // mark trial as accepted
    await HF_DB.respondToTrialRequest(requestId, "accepted");

    // send squad invite
    const result = await HF_DB.sendSquadInvite(
      session.userId,
      playerId,
      session.profile?.club || "the squad",
      playerName,
      session.name,
    );

    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    HF_UTILS.toast(`Squad invite sent to ${playerName}`, "success");
    squad(session);
  };

  const removeTrialPlayer = async (requestId, playerId, playerName) => {
    const session = HF_DB.getSession();
    const result = await HF_DB.respondToTrialRequest(requestId, "removed");
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    await HF_DB._sendMessage(
      "system",
      playerId,
      "Trial period ended",
      `${session.name} has ended your trial period with ${session.profile?.club || "their squad"}. Keep working hard, and your opportunity will come!`,
    );

    HF_UTILS.toast(`${playerName} removed from trial.`, "error");
    squad(session);
  };

  const approveNetworkRequest = async (requestId, scoutId, scoutName) => {
    const session = HF_DB.getSession();
    const result = await HF_DB.respondClubRequest(requestId, "approved");
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    await HF_DB._sendMessage(
      "system",
      scoutId,
      "Network request approved",
      `${session.name} has approved your request to add ${session.profile?.club || "their club"} to your scouting network. You can now view full squad details.`,
    );

    HF_UTILS.toast(`${scoutName} added to your network!`, "success");
    squad(session);
  };

  const declineNetworkRequest = async (requestId, scoutId, scoutName) => {
    const session = HF_DB.getSession();
    const result = await HF_DB.respondClubRequest(requestId, "declined");
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    await HF_DB._sendMessage(
      "system",
      scoutId,
      "Network request declined",
      `${session.name} has declined your request to add their club to your scouting network at this time.`,
    );

    HF_UTILS.toast(`${scoutName}'s request declined.`, "error");
    squad(session);
  };

  // ── TRAINING ───────────────────────────────────────────────
  const training = async (s) => {
    // cache squad players — only refetch if explicitly invalidated
    if (
      !window._cachedSquadPlayers ||
      window._cachedSquadPlayersFor !== s.userId
    ) {
      const { data: sp } = await HF_DB.getSquadPlayers(s.userId);
      window._cachedSquadPlayers = sp || [];
      window._cachedSquadPlayersFor = s.userId;
    }
    const squadPlayers = window._cachedSquadPlayers;
    const hasPlayers = squadPlayers?.length > 0;

    if (!hasPlayers) {
      setMain(`
      <div class="card">
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <i class="ti ti-clipboard-list" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No players yet</div>
          <div style="font-size:13px">Invite players to your squad to start building sessions.</div>
          <button class="btn btn-primary btn-sm" style="margin-top:16px" onclick="HF_ROUTER.navTo('squad')">
            <i class="ti ti-users"></i> Go to squad
          </button>
        </div>
      </div>`);
      return;
    }

    const saved = await HF_DB.getTrainingCached(s.userId);
    let schedule = saved?.schedule || {};
    const allSessions = saved?.sessions || [];
    // load pending match requests for this coach (both as requester and opponent)
    if (!window._cachedPendingRequests) {
      const { data: pr } = await HF_DB.getPendingMatchRequests(s.userId);
      window._cachedPendingRequests = pr || [];
    }
    const pendingRequests = window._cachedPendingRequests;

    // client-side deadline fallback (only run once per session, not on every render)
    if (!window._deadlineChecked) {
      window._deadlineChecked = true;
      HF_DB.checkLineupDeadlines(s.userId);
    }

    // one-time migration: clear legacy auto-defaulted Rest values
    const numericKeys = Object.keys(schedule).filter((k) => !isNaN(k));
    const isoKeys = Object.keys(schedule).filter((k) => isNaN(k));
    const allNumericAreRest =
      numericKeys.length === 7 &&
      numericKeys.every((k) => schedule[k] === "Rest");
    if (allNumericAreRest && isoKeys.length === 0) {
      schedule = {};
      await HF_DB.saveTraining(s.userId, { ...saved, schedule });
    }

    const selectedDay = window._coachTrainingSelectedDay ?? new Date().getDay();
    window._coachTrainingSelectedDay = selectedDay;
    const selectedDateISO =
      window._coachTrainingSelectedDate ||
      HF_UTILS.getDateForDayISO(selectedDay);
    window._coachTrainingSelectedDate = selectedDateISO;
    const selectedType = schedule[selectedDateISO] || null;
    const effectiveType = selectedType === "Rest" ? null : selectedType;

    let existingSession =
      allSessions.find(
        (ss) => ss.dayIndex === selectedDay || ss.date === selectedDateISO,
      ) || null;

    // check if this coach is the OPPONENT for a match on the selected day
    if (!window._cachedIncomingMatches) {
      const { data: im } = await HF_DB.getIncomingMatchesForCoach(s.userId);
      window._cachedIncomingMatches = im || [];
    }
    let opponentMatchRequest = null;
    if (!existingSession?.matchId) {
      opponentMatchRequest =
        window._cachedIncomingMatches.find((m) => m.date === selectedDateISO) ||
        null;
    }

    if (effectiveType === "Match" && existingSession?.matchId) {
      if (!window._cachedCoachMatches) {
        const { data: mr } = await HF_DB.getCoachMatches(s.userId);
        window._cachedCoachMatches = mr || [];
      }
      const match = window._cachedCoachMatches.find(
        (m) => m.id === existingSession.matchId,
      );

      if (match) {
        existingSession = {
          ...existingSession,
          result: match.result,
          adminVerified: match.admin_verified,
          opponentApproved: match.opponent_approved !== false,
          matchStatus: match.match_status,
          opponentCoachId: match.opponent_coach_id,
          coachConfirmed: match.coach_confirmed,
          opponentConfirmed: match.opponent_confirmed,
          coachLineupSubmitted: match.coach_lineup_submitted,
          opponentLineupSubmitted: match.opponent_lineup_submitted,
          lineupDeadline: match.lineup_deadline,
          playerStats: match.player_stats || {},
          opponentPlayerStats: match.opponent_player_stats || {},
          opponent: match.opponent,
          location: match.location,
          venueType: existingSession?.venueType || null,
          opponentGround: existingSession?.opponentGround || null,
        };
      }
    }

    // ── MATCH FORM ──
    if (!window._cachedVerifiedTeams) {
      const { data: vt } = await HF_DB.getVerifiedTeams();
      window._cachedVerifiedTeams = vt || [];
    }
    const verifiedTeams = window._cachedVerifiedTeams;

    if (!window._cachedWDL) {
      window._cachedWDL = await HF_DB.getCoachWDL(s.userId);
    }
    const wdl = window._cachedWDL;

    if (existingSession?.opponentGround) {
      window._opponentGround = existingSession.opponentGround;
    }

    // load match stats for this coach's side
    let isHomeCoach = true;
    if (existingSession?.matchId) {
      const cacheKey = `_cachedIsHomeCoach_${existingSession.matchId}`;
      if (window[cacheKey] === undefined) {
        const { data: matchCheck } = await HF_DB.getMatchById(
          existingSession.matchId,
        );
        window[cacheKey] = matchCheck?.coach_id === s.userId;
      }
      isHomeCoach = window[cacheKey];
    }
    const myStats = isHomeCoach
      ? existingSession?.playerStats || {}
      : existingSession?.opponentPlayerStats || {};

    const matchTab = window._matchTab || "details";
    window._matchTab = matchTab;

    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("CoachTraining", mc, {
        session: s,
        pendingRequests,
        schedule,
        allSessions,
        squadPlayers,
        verifiedTeams,
        wdl,
        opponentMatchRequest,
        existingSession,
        myStats,
        incomingMatches: window._cachedIncomingMatches,
      });
  };

  // ── TRAINING HELPERS ──────────────────────────────────────
  const saveMatchSession = async (dayIndex, dateISO) => {
    const session = HF_DB.getSession();
    const select = document.getElementById("match-opponent-select");
    const isOther = select?.value === "__other__";
    const opponent = isOther
      ? document.getElementById("match-opponent-other")?.value.trim()
      : select?.value;
    const venueType = document.getElementById("match-location")?.value;
    const location =
      venueType === "home"
        ? session.profile?.homeGround || session.profile?.club || "Home ground"
        : venueType === "away"
          ? window._opponentGround || "Away"
          : venueType === "neutral"
            ? document.getElementById("match-location-neutral")?.value.trim()
            : "";
    const isNeutralVenue = venueType === "neutral";
    const intent = document.getElementById("session-intent")?.value.trim();

    if (!opponent) {
      HF_UTILS.toast("Please select or enter an opponent.", "error");
      return;
    }

    // collect player stats from inputs
    const playerStats = {};

    const existing = await HF_DB.getTrainingCached(session.userId);
    const sessions = (existing?.sessions || []).filter(
      (ss) => ss.dayIndex !== dayIndex && ss.date !== dateISO,
    );

    let matchId = null;

    // check if match record already exists for this day
    const existingSession = (existing?.sessions || []).find(
      (ss) => ss.dayIndex === dayIndex || ss.date === dateISO,
    );

    if (existingSession?.matchId) {
      matchId = existingSession.matchId;
      // update stats for each player
      for (const pid of Object.keys(playerStats)) {
        await HF_DB.updateMatchPlayerStats(matchId, pid, playerStats[pid]);
      }
    } else {
      // create new match record
      const { data: newMatch } = await HF_DB.createMatch(session.userId, {
        opponent,
        location,
        date: dateISO,
        playerStats,
      });
      matchId = newMatch?.id;
    }

    // check if selected day has a locked match
    const dayMatchLocked =
      (existingSession?.matchId &&
        ["pending", "confirmed"].includes(existingSession?.matchStatus)) ||
      (opponentMatchRequest &&
        ["pending", "confirmed"].includes(opponentMatchRequest.match_status));

    sessions.unshift({
      name: `vs ${opponent}`,
      category: "Match",
      intent,
      dayIndex,
      date: dateISO,
      matchId,
      opponent,
      location,
      venueType,
      opponentGround: window._opponentGround || null,
      isUnverifiedOpponent: isOther,
      createdAt: new Date().toISOString(),
    });

    await HF_DB.saveTraining(session.userId, { ...existing, sessions });

    if (isNeutralVenue && matchId && location) {
      const adminIds = await HF_DB.getAdminIds();
      for (const adminId of adminIds || []) {
        await HF_DB._sendMessage(
          "system",
          adminId,
          "Neutral venue approval needed",
          `${session.name} (${session.profile?.club}) has requested a neutral venue: "${location}" for a match on ${dateISO}.\n\nPlease verify and approve.`,
        );
      }
    }

    if (isOther && matchId) {
      await HF_DB.submitUnverifiedOpponent(
        session.userId,
        matchId,
        opponent,
        dateISO,
      );
      HF_UTILS.toast(
        `Match vs ${opponent} saved: awaiting admin approval for opponent.`,
        "success",
      );
    }

    // update running match stats for all players
    for (const pid of Object.keys(playerStats)) {
      await HF_DB.updateMatchPlayerStats(matchId, pid, playerStats[pid]);
    }

    // if verified opponent, find their coach and send match request
    if (!isOther && matchId) {
      // fetch full coach list (not mapped) to get accurate coach user IDs
      const { data: allCoaches } = await HF_DB.getVerifiedCoachesRaw();
      const opponentCoach = (allCoaches || []).find(
        (c) => (c.profile?.club || c.name) === opponent,
      );
      if (opponentCoach?.id) {
        const reqResult = await HF_DB.sendMatchRequest(
          session.userId,
          matchId,
          opponentCoach.id,
          dateISO,
          opponent,
        );
        if (reqResult.error) {
          HF_UTILS.toast(
            "Match saved but could not notify opponent: " + reqResult.error,
            "error",
          );
        } else {
          HF_UTILS.toast(`Match request sent to ${opponent}!`, "success");
        }
      } else {
        HF_UTILS.toast(
          `Match saved. Could not find coach for ${opponent}.`,
          "error",
        );
      }
    }

    // notify own squad
    const { data: squadPlayers } = await HF_DB.getSquadPlayers(session.userId);
    if (squadPlayers?.length > 0) {
      for (const sp of squadPlayers) {
        await HF_DB._sendMessage(
          "system",
          sp.player_id,
          `Match day: vs ${opponent}`,
          `${session.name} has scheduled a match against ${opponent}${location ? " at " + location : ""} on ${new Date(dateISO + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}.${intent ? "\n\nCoach's note: " + intent : ""}`,
        );
      }
    }

    window._cachedWDL = null;
    window._coachTrainingSelectedDay = dayIndex;
    window._editingMatchDetails = false;
    window._matchSaved = true;
    HF_UTILS.toast(`Match vs ${opponent} saved!`, "success");
    _invalidateTrainingCache();
    training(session);
  };

  const logMatchResult = async (matchId, result, dayIndex, dateISO) => {
    const session = HF_DB.getSession();
    const res = await HF_DB.logMatchResult(matchId, result);
    if (res.error) {
      HF_UTILS.toast(res.error, "error");
      return;
    }

    // notify admin for verification
    const adminIds = await HF_DB.getAdminIds();
    for (const adminId of adminIds || []) {
      await HF_DB._sendMessage(
        "system",
        adminId,
        "Match result logged: needs verification",
        `${session.name} (${session.profile?.club || "Unknown club"}) logged a match result: ${result === "W" ? "Win" : result === "D" ? "Draw" : "Loss"}.\n\nPlease verify in the admin dashboard.`,
      );
    }

    window._coachTrainingSelectedDay = dayIndex;
    HF_UTILS.toast(
      `Result logged: ${result === "W" ? "Win" : result === "D" ? "Draw" : "Loss"}. Sent for admin verification.`,
      "success",
    );
    training(session);
  };

  const approveMatchRequest = async (
    matchId,
    requestingClub,
    isOpponentCoach,
  ) => {
    const session = HF_DB.getSession();
    let result;
    if (isOpponentCoach) {
      result = await HF_DB.respondMatchRequest(matchId, session.userId, true);
    } else {
      result = await HF_DB.confirmMatchAsCoach(matchId);
    }
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }
    if (result.confirmed) {
      HF_UTILS.toast(
        `Match vs ${requestingClub} confirmed! Both coaches approved.`,
        "success",
      );
    } else {
      HF_UTILS.toast(
        `Match approved! Waiting for ${requestingClub} to confirm.`,
        "success",
      );
    }
    window._coachTrainingSelectedDay =
      window._coachTrainingSelectedDay ?? new Date().getDay();
    _invalidateTrainingCache();
    training(session);
  };

  const declineMatchRequest = async (
    matchId,
    requestingCoachId,
    requestingClub,
  ) => {
    const session = HF_DB.getSession();
    const result = await HF_DB.respondMatchRequest(
      matchId,
      session.userId,
      false,
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    // notify requesting coach
    await HF_DB._sendMessage(
      "system",
      requestingCoachId,
      `Match request declined`,
      `${session.profile?.club || session.name} has declined your match request. You can change the session type for that day.`,
    );

    HF_UTILS.toast(`Match request from ${requestingClub} declined.`, "success");
    training(session);
  };

  const saveLineup = async (matchId) => {
    const session = HF_DB.getSession();
    const lineup = {};
    document.querySelectorAll(".lineup-input[data-pid]").forEach((input) => {
      const pid = input.dataset.pid;
      const stat = input.dataset.stat;
      if (!lineup[pid]) lineup[pid] = {};
      lineup[pid][stat] = input.value || null;
    });

    // validate at least one starter
    const hasStarter = Object.values(lineup).some((p) => p.role === "starter");
    if (!hasStarter) {
      HF_UTILS.toast("Please set at least one player as a starter.", "error");
      return;
    }

    const result = await HF_DB.submitLineup(matchId, session.userId, lineup);
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }
    HF_UTILS.toast("Lineup submitted! Opponent has been notified.", "success");
    window._matchTab = "lineup";
    training(session);
  };

  const savePostStats = async (matchId) => {
    const session = HF_DB.getSession();
    const stats = {};
    document.querySelectorAll(".post-stat-input[data-pid]").forEach((input) => {
      const pid = input.dataset.pid;
      const stat = input.dataset.stat;
      if (!stats[pid]) stats[pid] = {};
      stats[pid][stat] = parseInt(input.value) || 0;
    });

    const result = await HF_DB.saveMatchPostStats(
      matchId,
      session.userId,
      stats,
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }
    HF_UTILS.toast("Match stats saved!", "success");
    training(session);
  };

  const notifySquadOfMatch = async (matchId) => {
    const session = HF_DB.getSession();
    const { data: match } = await HF_DB.getMatchById(matchId);
    if (!match) {
      HF_UTILS.toast("Match not found.", "error");
      return;
    }

    const { data: squadPlayers } = await HF_DB.getSquadPlayers(session.userId);
    if (!squadPlayers?.length) {
      HF_UTILS.toast("No players to notify.", "error");
      return;
    }

    const dateLabel = new Date(match.date + "T00:00:00").toLocaleDateString(
      "en-GB",
      { weekday: "long", day: "numeric", month: "long" },
    );
    for (const sp of squadPlayers) {
      await HF_DB._sendMessage(
        "system",
        sp.player_id,
        `Confirmed match: vs ${match.opponent}`,
        `Your coach has confirmed a match against ${match.opponent} on ${dateLabel}.${match.location ? "\n\nVenue: " + match.location : ""}${match.intent ? "\n\nCoach's note: " + match.intent : ""}\n\nBe ready!`,
      );
    }
    HF_UTILS.toast(
      `Squad notified about the match vs ${match.opponent}!`,
      "success",
    );
  };

  const saveOpponentLineup = async (matchId) => {
    const session = HF_DB.getSession();
    const lineup = {};
    document
      .querySelectorAll(".opp-lineup-input[data-pid]")
      .forEach((input) => {
        const pid = input.dataset.pid;
        const stat = input.dataset.stat;
        if (!lineup[pid]) lineup[pid] = {};
        lineup[pid][stat] = input.value || null;
      });

    const hasStarter = Object.values(lineup).some((p) => p.role === "starter");
    if (!hasStarter) {
      HF_UTILS.toast("Please set at least one player as a starter.", "error");
      return;
    }

    const result = await HF_DB.submitLineup(matchId, session.userId, lineup);
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }
    HF_UTILS.toast(
      "Lineup submitted! Requesting coach has been notified.",
      "success",
    );
    window._matchTab = "lineup";
    training(session);
  };

  // ── TRACKING ───────────────────────────────────────────────
  const tracking = async (s) => {
    const { data: squadPlayers } = await HF_DB.getSquadPlayers(s.userId);
    const { data: recentRatings } = await HF_DB.getSquadSessionRatings(
      s.userId,
    );

    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("CoachTracking", mc, { squadPlayers, recentRatings });
  };

  // ── TRACKING HELPERS ───────────────────────────────────────────────
  const trackPlayer = async (playerId, playerName) => {
    const session = HF_DB.getSession();
    const { data: sessions } = await HF_DB.getPlayerSessionRatings(playerId);
    const { data: todayRating } = await HF_DB.getTodaySessionRating(
      session.userId,
      playerId,
    );
    const { data: trainingData } = await HF_DB.getTraining(playerId);

    const todayDayIndex = new Date().getDay();
    const todayDateStr = HF_DB.localDate();
    const playerTodayType =
      trainingData?.schedule?.[todayDateStr] ||
      trainingData?.schedule?.[todayDayIndex] ||
      "";

    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("CoachTrackPlayer", mc, {
        playerId,
        playerName,
        sessions,
        todayRating,
        playerTodayType,
      });
  };

  const logSessionRating = async (playerId = null, playerName = null) => {
    const session = HF_DB.getSession();
    const pid = playerId || document.getElementById("tr-player")?.value;
    const pname =
      playerName ||
      document.getElementById("tr-player")?.selectedOptions[0]?.text ||
      "Player";
    const sessionType = document.getElementById("tr-type")?.value;
    const notes = document.getElementById("tr-notes")?.value.trim() || null;

    if (!pid) {
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

    const { data: existing } = await HF_DB.getTodaySessionRating(
      session.userId,
      pid,
    );
    let result;
    if (existing) {
      const overall = Math.round(
        (ratings.speed +
          ratings.technical +
          ratings.tactical +
          ratings.physical) /
          4,
      );
      const { error } = await HF_DB._updateSessionRating(
        existing.id,
        sessionType,
        ratings,
        overall,
        notes,
      );
      result = error ? { error } : { success: true, overall };
      HF_UTILS.toast(`Session updated! Overall: ${overall}/100`, "success");
    } else {
      result = await HF_DB.saveSessionRating(
        session.userId,
        pid,
        sessionType,
        ratings,
        notes,
      );
      if (!result.error)
        HF_UTILS.toast(
          `Session logged! Overall: ${result.overall}/100`,
          "success",
        );
    }

    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    // if called from trackPlayer, re-render trackPlayer
    if (playerId) {
      trackPlayer(pid, pname);
    } else {
      // called from tracking view
      await checkExistingRating();
      tracking(session);
    }
  };

  const checkExistingRating = async () => {
    const session = HF_DB.getSession();
    const playerId = document.getElementById("tr-player")?.value;
    const btn = document.getElementById("tr-save-btn");
    if (!btn) return;

    if (!playerId) {
      btn.innerHTML = '<i class="ti ti-circle-check"></i> Save rating';
      return;
    }

    const { data: existing } = await HF_DB.getTodaySessionRating(
      session.userId,
      playerId,
    );

    if (existing) {
      btn.innerHTML = '<i class="ti ti-refresh"></i> Update rating';
    } else {
      btn.innerHTML = '<i class="ti ti-circle-check"></i> Save rating';
    }
  };

  const setDayType = async (dayIndex, dateISO, type) => {
    const session = HF_DB.getSession();

    // check if this day has an incoming match request
    const { data: incomingForDay } = await HF_DB.getMatchForOpponentCoach(
      session.userId,
      dateISO,
    );
    if (
      incomingForDay &&
      ["pending", "confirmed"].includes(incomingForDay.match_status)
    ) {
      HF_UTILS.toast(
        "You cannot change this day's session type until you approve or decline the incoming match request.",
        "error",
      );
      return;
    }

    const existing = await HF_DB.getTrainingCached(session.userId);
    const schedule = existing?.schedule || {};
    schedule[dateISO] = type;
    delete schedule[dayIndex];
    _invalidateTrainingCache(); // invalidate before write so next read is fresh
    await HF_DB.saveTraining(session.userId, { ...existing, schedule });
    window._coachTrainingSelectedDay = dayIndex;
    training(session);
  };

  const clearDayType = async (dayIndex, dateISO) => {
    const session = HF_DB.getSession();
    const existing = await HF_DB.getTrainingCached(session.userId);

    // check if there's a saved session for this day
    const daySession = (existing?.sessions || []).find(
      (ss) => ss.dayIndex === dayIndex || ss.date === dateISO,
    );
    const hasSession = !!daySession?.name;
    const hasMatchId = !!daySession?.matchId;

    if (hasMatchId) {
      // match cancel flow already handled separately
    } else if (hasSession) {
      if (
        !confirm(
          `Clear the session plan for ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIndex]}?\n\nThis will remove "${daySession.name}" and notify your squad.`,
        )
      ) {
        return;
      }
    } else {
      if (
        !confirm(
          `Clear the session type for ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIndex]}?`,
        )
      ) {
        return;
      }
    }

    if (daySession?.matchId) {
      const { data: match } = await HF_DB.getMatchById(daySession.matchId);
      if (match && ["pending", "confirmed"].includes(match.match_status)) {
        if (
          !confirm(
            `This day has a ${match.match_status} match vs ${match.opponent}.\n\nCancelling will notify the opponent and remove the match. Continue?`,
          )
        ) {
          return;
        }
        const result = await HF_DB.cancelMatch(
          daySession.matchId,
          session.userId,
        );
        if (result.error) {
          HF_UTILS.toast(result.error, "error");
          return;
        }
        HF_UTILS.toast("Match cancelled and opponent notified.", "success");
      }
    }

    const schedule = existing?.schedule || {};
    delete schedule[dateISO];
    delete schedule[dayIndex];
    const sessions = (existing?.sessions || []).filter(
      (ss) => ss.dayIndex !== dayIndex && ss.date !== dateISO,
    );
    await HF_DB.saveTraining(session.userId, {
      ...existing,
      schedule,
      sessions,
    });

    // notify squad if a named session was cleared
    if (hasSession && !hasMatchId) {
      const { data: squadPlayers } = await HF_DB.getSquadPlayers(
        session.userId,
      );
      if (squadPlayers?.length > 0) {
        const dayLabel = new Date(dateISO + "T00:00:00").toLocaleDateString(
          "en-GB",
          { weekday: "long", day: "numeric", month: "long" },
        );
        for (const sp of squadPlayers) {
          await HF_DB._sendMessage(
            "system",
            sp.player_id,
            `Session cancelled: ${daySession.name}`,
            `${session.name} has cancelled the ${daySession.category || "training"} session planned for ${dayLabel}.`,
          );
        }
      }
    }

    window._coachTrainingSelectedDay = dayIndex;
    window._matchTab = null;
    window._matchSaved = false;
    window._editingMatchDetails = false;
    _invalidateTrainingCache();
    training(session);
  };

  const saveSession = async (dayIndex = null, dateISO = null) => {
    const session = HF_DB.getSession();
    const name = document.getElementById("session-name")?.value.trim();
    const category = document.getElementById("session-category")?.value;
    const intensity = document.getElementById("session-intensity")?.value;
    const duration = document.getElementById("session-duration")?.value;
    const intent = document.getElementById("session-intent")?.value.trim();

    if (!name) {
      HF_UTILS.toast("Please enter a session name.", "error");
      return;
    }

    const drills = window._sessionDrills || [];

    // save to training table
    const existing = await HF_DB.getTrainingCached(session.userId);

    // look up existing session for this day to determine if this is an update
    const existingSession =
      (existing?.sessions || []).find(
        (ss) => ss.dayIndex === dayIndex || ss.date === dateISO,
      ) || null;

    const sessions = (existing?.sessions || []).filter(
      (ss) => ss.dayIndex !== dayIndex && ss.date !== dateISO,
    );
    sessions.unshift({
      name,
      category,
      intensity,
      duration: parseInt(duration),
      intent,
      drills,
      dayIndex,
      date: dateISO || HF_DB.localDate(),
      createdAt: new Date().toISOString(),
    });
    await HF_DB.saveTraining(session.userId, { ...existing, sessions });

    // notify all squad players
    const { data: squadPlayers } = await HF_DB.getSquadPlayers(session.userId);
    const coachName = session.name;
    const clubName = session.profile?.club || "your squad";
    const drillsList =
      drills.length > 0
        ? `\n\nDrills:\n${drills.map((d) => `• ${d.name} (${d.type} · ${d.duration} min)`).join("\n")}`
        : "";

    if (squadPlayers?.length > 0) {
      for (const sp of squadPlayers) {
        await HF_DB._sendMessage(
          "system",
          sp.player_id,
          `Session planned: ${name}`,
          `${coachName} has planned a ${category.toLowerCase()} session for ${clubName}.\n\nSession: ${name}\nCategory: ${category}\nIntensity: ${intensity}\nDuration: ${duration} min${intent ? "\nIntent: " + intent : ""}${drillsList}`,
        );
      }
    }

    // notify all squad players via message
    const isUpdate = !!existingSession?.name;
    if (squadPlayers?.length > 0) {
      const drillsList =
        drills.length > 0
          ? `\n\nDrills:\n${drills.map((d) => `• ${d.name} (${d.type} · ${d.duration} min)`).join("\n")}`
          : "";
      for (const sp of squadPlayers) {
        await HF_DB._sendMessage(
          "system",
          sp.player_id,
          `${isUpdate ? "Updated" : "New"} session: ${name}`,
          `${session.name} has ${isUpdate ? "updated" : "planned"} a ${category.toLowerCase()} session for ${session.profile?.club || "your squad"}.\n\nSession: ${name}\nCategory: ${category}\nIntensity: ${intensity}\nDuration: ${duration} min${intent ? "\nIntent: " + intent : ""}${drillsList}`,
        );
      }
    }

    window._sessionDrills = [];
    window._editingSession = null;
    HF_UTILS.toast(
      `Session ${isUpdate ? "updated" : "saved"} and ${squadPlayers?.length || 0} player${squadPlayers?.length !== 1 ? "s" : ""} notified!`,
      "success",
    );
    _invalidateTrainingCache();
    training(session);
  };

  // ── HEALTH ───────────────────────────────────────────────
  const health = async (s) => {
    const { data: squadPlayers } = await HF_DB.getSquadPlayers(s.userId);

    const mc = document.getElementById("main-content");

    if (!squadPlayers || squadPlayers.length === 0) {
      if (mc) window.HF_REACT.mount("CoachHealth", mc, { playerHealth: [] });
      return;
    }

    // fetch today's health logs for all players
    const playerHealth = await Promise.all(
      squadPlayers.map(async (sp) => {
        const { data: log } = await HF_DB.getTodayHealthLog(sp.player_id);
        const { data: logs } = await HF_DB.getPlayerHealthLogs(sp.player_id, 3);
        return { ...sp, todayLog: log, recentLogs: logs };
      }),
    );

    if (mc) window.HF_REACT.mount("CoachHealth", mc, { playerHealth });
  };

  // ── HEALTH HELPERS ───────────────────────────────────────────
  const viewPlayerHealth = async (playerId, playerName) => {
    const { data: logs } = await HF_DB.getPlayerHealthLogs(playerId, 14);
    const { data: todayLog } = await HF_DB.getTodayHealthLog(playerId);

    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("CoachViewPlayerHealth", mc, { playerName, logs, todayLog });
  };

  // ── MESSAGES ───────────────────────────────────────────────
  const messages = async (s) => {
    const [{ data: msgs }, { data: archived }] = await Promise.all([
      HF_DB.getMessages(s.userId),
      HF_DB.getArchivedMessages(s.userId),
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

    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("CoachMessages", mc, {
        session: s,
        enriched,
        enrichedArchived,
      });
  };

  // ── MESSAGES HELPERS ─────────────────────────────────────
  const messageScout = (scoutId, scoutName) =>
    HF_ROLE_UTILS.messageUser(scoutId, scoutName, "findmyteam", "coach");

  // ── FAITH ───────────────────────────────────────────────
  const faith = async (s) => {
    const todayKey = HF_DB.localDate();
    const storageKey = `hf_faith_checklist_${s.userId}_${todayKey}`;
    const checked = JSON.parse(localStorage.getItem(storageKey) || "[]");

    const mc = document.getElementById("main-content");
    if (mc) window.HF_REACT.mount("CoachFaith", mc, { checked });
  };

  // ── FIND MY TEAM ───────────────────────────────────────────────
  const findmyteam = async (s) => {
    const { data: players } = await HF_DB.getUnattachedPlayers();
    const { data: sentInvites } = await HF_DB.getCoachInvites(s.userId);
    const invitedIds = new Set(
      sentInvites
        ?.filter((i) => i.status === "pending")
        .map((i) => i.player_id) || [],
    );
    const declinedMap = new Map(
      sentInvites
        ?.filter((i) => i.status === "declined")
        .map((i) => [i.player_id, i.declined_at]) || [],
    );
    const { data: prospects } = await HF_DB.getFlaggedProspects();
    const isVerified = s.squadStatus === "verified";
    const isOpenForRecruitment = s.profile?.openForRecruitment || false;

    // analyze current squad positions
    const { data: squadPlayers } = await HF_DB.getSquadPlayers(s.userId);
    const squadPositions = (squadPlayers || [])
      .map((sp) => sp.player?.profile?.pos)
      .filter(Boolean);
    const allPositions = [
      "GK",
      "CB",
      "LB",
      "RB",
      "DM",
      "CM",
      "CAM",
      "LW",
      "RW",
      "ST",
    ];
    const neededPositions = allPositions.filter(
      (pos) => !squadPositions.includes(pos),
    );

    window._fmtAllPlayers = players;
    window._fmtCoachId = s.userId;
    window._fmtIsVerified = isVerified;
    window._fmtIsOpenForRecruitment = isOpenForRecruitment;
    window._fmtInvitedIds = invitedIds;
    window._fmtDeclinedMap = declinedMap;

    const mc = document.getElementById("main-content");
    if (mc) {
      const playersListHTML = (players || [])
        .map((p) => _playerCard(p, s.userId, isVerified, isOpenForRecruitment, invitedIds, declinedMap))
        .join("");
      window.HF_REACT.mount("CoachFindMyTeam", mc, {
        session: s,
        players,
        neededPositions,
        prospects,
        playersListHTML,
      });
    }
  };

  // ── FIND MY TEAM HELPERS ───────────────────────────────────────────────
  const selectNeededPosition = (pos) => {
    const select = document.getElementById("fmt-pos");
    if (!select) return;

    // toggle off if already selected
    const isSame = select.value === pos;
    select.value = isSame ? "" : pos;

    // reset all buttons
    document.querySelectorAll('[id^="pos-btn-"]').forEach((btn) => {
      btn.style.background = "rgba(196,154,10,.1)";
      btn.style.color = "var(--gold)";
    });

    // highlight selected
    if (!isSame) {
      const btn = document.getElementById(`pos-btn-${pos}`);
      if (btn) {
        btn.style.background = "var(--gold)";
        btn.style.color = "#0f0f0d";
      }
    }

    HF_COACH.filterPlayers();
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
          ? `<span style="font-family:var(--font);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:2px 6px;background:rgba(196,154,10,.15);color:var(--gold);">Invite sent</span>`
          : isAccepted
            ? `<span style="font-family:var(--font);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:2px 6px;background:rgba(26,122,46,.15);color:var(--green);">In squad</span>`
            : isCoolingDown
              ? `<span style="font-family:var(--font);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:2px 6px;background:rgba(200,16,46,.15);color:var(--red);">Wait ${hoursLeft}h</span>`
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

    HF_UTILS.toast(`Invite sent to ${playerName}`, "success");
    findmyteam(session);
  };

  const _playerCard = (
    p,
    coachId,
    isVerified,
    isOpenForRecruitment = false,
    invitedIds = new Set(),
    declinedMap = new Map(),
  ) => {
    const isInvited = invitedIds.has(p.id);
    const declinedAt = declinedMap.get(p.id);
    const isDeclined = declinedMap.has(p.id);
    const canReinvite = isDeclined
      ? Date.now() - new Date(declinedAt).getTime() > 24 * 60 * 60 * 1000
      : true;
    const prof = p.profile || {};
    const safeName = p.name.replace(/'/g, "\\'");
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
    <div style="display:flex;align-items:center;gap:var(--sp-md);padding:var(--sp-md);background:var(--bg2);border-left:3px solid ${overall && overall >= 75 ? "var(--gold)" : "var(--border)"};margin-bottom:var(--sp-sm);">
      <div class="avatar avatar-md" style="background:var(--green);flex-shrink:0;">${HF_UTILS.initials(p.name)}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;color:var(--text)">${p.name}</div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:2px;">
          ${prof.pos ? `<span style="font-size:10px;font-weight:700;padding:1px 6px;background:var(--bg);border:0.5px solid var(--border);color:var(--text2);">${prof.pos}</span>` : ""}
          ${prof.tier ? `<span style="font-size:10px;font-weight:700;padding:1px 6px;background:var(--bg);border:0.5px solid var(--border);color:var(--text2);">${prof.tier}</span>` : ""}
          ${prof.hometown ? `<span style="font-size:10px;color:var(--text3);">${prof.hometown}</span>` : ""}
        </div>
        ${
          overall !== null
            ? `
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
            <div style="flex:1;height:3px;background:var(--border);">
              <div style="height:100%;width:${overall}%;background:${overall >= 75 ? "var(--gold)" : overall >= 60 ? "var(--blue)" : "var(--text3)"};"></div>
            </div>
            <span style="font-size:11px;font-weight:700;color:${overall >= 75 ? "var(--gold)" : "var(--text2)"};">${overall}%</span>
          </div>`
            : `
          <div style="font-size:10px;color:var(--text3);margin-top:4px;">Not yet rated</div>`
        }
      </div>
       ${
         isVerified && isOpenForRecruitment
           ? `
            <button class="btn ${isInvited ? "btn-outline" : !canReinvite ? "btn-danger" : "btn-primary"} btn-sm"
              style="flex-shrink:0;width:100px;justify-content:center;white-space:nowrap;${!canReinvite || isInvited ? "cursor:not-allowed;" : ""}"
              ${!canReinvite || isInvited ? "disabled" : `onclick="HF_COACH.invitePlayer('${p.id}', '${safeName}')"`}>
              <i class="ti ti-${isInvited ? "clock" : !canReinvite ? "clock" : "send"}"></i>
              ${isInvited ? "Invited" : !canReinvite ? "24h wait" : "Invite"}
            </button>`
           : ""
       }
    </div>`;
  };

  const filterPlayers = () =>
    HF_ROLE_UTILS.filterPlayers(
      "_fmtAllPlayers",
      (p) =>
        _playerCard(
          p,
          window._fmtCoachId,
          window._fmtIsVerified,
          window._fmtIsOpenForRecruitment,
          window._fmtInvitedIds,
          window._fmtDeclinedMap,
        ),
      "fmt-players-list",
      {
        pos: document.getElementById("fmt-pos")?.value,
        tier: document.getElementById("fmt-tier")?.value,
        search: document.getElementById("fmt-search")?.value,
      },
    );

  const toggleRecruitment = async (value) => {
    const session = HF_DB.getSession();
    const result = await HF_DB.toggleRecruitment(session.userId, value);
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    session.profile = { ...session.profile, openForRecruitment: value };
    HF_DB.saveSession(session);

    // notify squad players if opening for recruitment
    if (value) {
      const { data: squadPlayers } = await HF_DB.getSquadPlayers(
        session.userId,
      );
      if (squadPlayers?.length > 0) {
        for (const sp of squadPlayers) {
          await HF_DB._sendMessage(
            "system",
            sp.player_id,
            "Your squad is now recruiting",
            `Your coach ${session.name} has opened ${session.profile?.club || "your squad"} for recruitment. New players may be joining the squad soon.`,
          );
        }
      }
    }

    HF_UTILS.toast(
      value
        ? "Your squad is now visible to players!"
        : "Your squad is now hidden from players.",
      "success",
    );

    findmyteam(session);
  };

  const onOpponentChange = () => {
    const select = document.getElementById("match-opponent-select");
    const otherWrap = document.getElementById("opponent-other-wrap");
    if (otherWrap)
      otherWrap.style.display = select?.value === "__other__" ? "flex" : "none";

    // cache opponent's home ground for venue dropdown
    const selectedOption = select?.options[select.selectedIndex];
    const ground = selectedOption?.dataset?.ground || null;
    window._opponentGround = ground;

    // update the Away option label
    const venueSelect = document.getElementById("match-location");
    if (venueSelect) {
      const awayOption = venueSelect.querySelector('option[value="away"]');
      if (awayOption) {
        awayOption.textContent = `Away: ${ground || "Opponent's ground"}`;
      }
    }
  };

  const onVenueChange = () => {
    const select = document.getElementById("match-location");
    const neutralWrap = document.getElementById("venue-neutral-wrap");
    if (neutralWrap)
      neutralWrap.style.display =
        select?.value === "neutral" ? "block" : "none";
  };

  const _invalidateTrainingCache = () => {
    window._cachedSquadPlayers = null;
    window._cachedSquadPlayersFor = null;
    window._cachedPendingRequests = null;
    window._cachedCoachMatches = null;
    window._cachedIncomingMatches = null;
    window._cachedTrainingData = null;
    Object.keys(window)
      .filter((k) => k.startsWith("_cachedIsHomeCoach_"))
      .forEach((k) => delete window[k]);
  };

  return {
    render,
    dashboard,
    squad,
    messages,
    profile,
    training,
    tracking,
    health,
    findmyteam,
    showInvitePanel,
    searchPlayers,
    invitePlayer,
    reviewAdminEdits,
    acceptAdminEdits,
    declineAdminEdits,
    resubmitSquad,
    submitResubmission,
    confirmKickPlayer,
    saveProfile,
    saveMatchSession,
    logMatchResult,
    logSessionRating,
    checkExistingRating,
    trackPlayer,
    viewPlayerHealth,
    filterPlayers,
    toggleRecruitment,
    setDayType,
    clearDayType,
    saveSession,
    messageScout,
    saveJerseyNumber,
    respondTrialRequest,
    acceptTrialRequest,
    declineTrialRequest,
    approveMatchRequest,
    declineMatchRequest,
    approveTrialPlayer,
    removeTrialPlayer,
    approveNetworkRequest,
    declineNetworkRequest,
    saveLineup,
    savePostStats,
    selectNeededPosition,
    togglePlayerActions,
    onOpponentChange,
    onVenueChange,
    notifySquadOfMatch,
    saveOpponentLineup,
  };
})();

window.HF_COACH = HF_COACH;
