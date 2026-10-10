// Coach dashboard: view routing, data loading and actions.
//
// Views still follow the original flow: a view function loads the data and
// mounts the component with it, and actions re-run the view function to
// refresh. Training in particular keeps its window._cached* caches.
//
// TODO: several actions still read their inputs back from the rendered
// form by DOM id (marked "reads form by id" below); these move to React
// state in follow-up commits.
import * as db from "./db/index.js";
import { getDateForDayISO, isNewUser } from "./utils.js";
import { launchConfetti, toast } from "./dom.js";
import { buildSidenav, launch, navTo, refreshSidenavBadge } from "./router.js";
import { messageUser } from "./roleUtils.js";
import { showView } from "./views.js";

const fail = (result) => {
  if (result?.error) {
    toast(result.error, "error");
    return true;
  }
  return false;
};

const notifySquad = async (coachId, subject, body) => {
  const { data: squadPlayers } = await db.getSquadPlayers(coachId);
  for (const sp of squadPlayers || []) await db._sendMessage("system", sp.player_id, subject, body);
  return squadPlayers || [];
};

const notifyAdmins = async (subject, body) => {
  for (const adminId of (await db.getAdminIds()) || []) await db._sendMessage("system", adminId, subject, body);
};

const longDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Views ─────────────────────────────────────────────────
export const render = (view, session) => {
  const views = { dashboard, profile, squad, training, tracking, health, messages, faith, findmyteam };
  (views[view] || dashboard)(session);
};

export const dashboard = async (s) => {
  const [{ data: freshStatus }, { data: readiness }, { data: agentConvos }] = await Promise.all([
    db.getUserStatus(s.userId, "squad"),
    db.getSquadReadiness(s.userId),
    db.getAgentConversations(s.userId),
  ]);
  if (freshStatus?.squad_status && freshStatus.squad_status !== s.squadStatus) {
    s.squadStatus = freshStatus.squad_status;
    db.saveSession(s);
  }
  const newUser = isNewUser(s);
  showView("CoachDashboard", { session: s, readiness, agentConvos, newUser });
  if (newUser) setTimeout(() => launchConfetti(), 300);
};

export const profile = async (s) => {
  const wdl = await db.getCoachWDL(s.userId);
  showView("CoachProfile", { session: s, wdl, onEdit: editProfile, onSettings: () => navTo("profile#settings") });
};

export const editProfile = () => showView("CoachEditProfile", { session: db.getSession() });

export const squad = async (s) => {
  const isVerified = s.squadStatus === "verified";
  const [{ data: squadPlayers }, { data: trialRequests }, { data: trialPlayers }, { data: networkRequests }, wdl] =
    await Promise.all([
      db.getSquadPlayers(s.userId),
      db.getPendingTrialRequests(s.userId),
      db.getTrialPlayers(s.userId),
      db.getPendingClubRequests(s.userId),
      isVerified ? db.getCoachWDL(s.userId) : Promise.resolve(null),
    ]);
  showView("CoachSquad", { session: s, squadPlayers, trialRequests, trialPlayers, networkRequests, wdl });
};

export const reviewAdminEdits = async () => {
  const { data } = await db.getCoachVerification(db.getSession().userId);
  if (!data) return toast("No pending review found.", "error");
  showView("CoachReviewAdminEdits", { data });
};

export const resubmitSquad = () => showView("CoachResubmitSquad", { session: db.getSession() });

export const tracking = async (s) => {
  const [{ data: squadPlayers }, { data: recentRatings }] = await Promise.all([
    db.getSquadPlayers(s.userId),
    db.getSquadSessionRatings(s.userId),
  ]);
  showView("CoachTracking", { squadPlayers, recentRatings });
};

export const trackPlayer = async (playerId, playerName) => {
  const session = db.getSession();
  const [{ data: sessions }, { data: todayRating }, { data: trainingData }] = await Promise.all([
    db.getPlayerSessionRatings(playerId),
    db.getTodaySessionRating(session.userId, playerId),
    db.getTraining(playerId),
  ]);
  const playerTodayType =
    trainingData?.schedule?.[db.localDate()] || trainingData?.schedule?.[new Date().getDay()] || "";
  showView("CoachTrackPlayer", { playerId, playerName, sessions, todayRating, playerTodayType });
};

export const health = async (s) => {
  const { data: squadPlayers } = await db.getSquadPlayers(s.userId);
  if (!squadPlayers?.length) return showView("CoachHealth", { playerHealth: [] });
  const playerHealth = await Promise.all(
    squadPlayers.map(async (sp) => {
      const [{ data: log }, { data: logs }] = await Promise.all([
        db.getTodayHealthLog(sp.player_id),
        db.getPlayerHealthLogs(sp.player_id, 3),
      ]);
      return { ...sp, todayLog: log, recentLogs: logs };
    }),
  );
  showView("CoachHealth", { playerHealth });
};

export const viewPlayerHealth = async (playerId, playerName) => {
  const [{ data: logs }, { data: todayLog }] = await Promise.all([
    db.getPlayerHealthLogs(playerId, 14),
    db.getTodayHealthLog(playerId),
  ]);
  showView("CoachViewPlayerHealth", { playerName, logs, todayLog });
};

export const messages = async (s) => {
  const [{ data: msgs }, { data: archived }] = await Promise.all([
    db.getMessages(s.userId),
    db.getArchivedMessages(s.userId),
  ]);
  const senderNames = await db.getUserNamesByIds([...(msgs || []), ...(archived || [])].map((m) => m.from_id));
  const withSender = (m) => ({ ...m, senderName: senderNames[m.from_id] || "HappyFeet" });
  showView("CoachMessages", {
    session: s,
    enriched: (msgs || []).map(withSender),
    enrichedArchived: (archived || []).map(withSender),
  });
};

export const faith = (s) => {
  const checked = JSON.parse(localStorage.getItem(`hf_faith_checklist_${s.userId}_${db.localDate()}`) || "[]");
  showView("CoachFaith", { checked });
};

const ALL_POSITIONS = ["GK", "CB", "LB", "RB", "DM", "CM", "CAM", "LW", "RW", "ST"];

export const findmyteam = async (s) => {
  const [{ data: players }, { data: sentInvites }, { data: prospects }, { data: squadPlayers }] = await Promise.all([
    db.getUnattachedPlayers(),
    db.getCoachInvites(s.userId),
    db.getFlaggedProspects(),
    db.getSquadPlayers(s.userId),
  ]);
  const squadPositions = (squadPlayers || []).map((sp) => sp.player?.profile?.pos).filter(Boolean);
  showView("CoachFindMyTeam", {
    session: s,
    players,
    prospects,
    neededPositions: ALL_POSITIONS.filter((pos) => !squadPositions.includes(pos)),
    invitedIds: (sentInvites || []).filter((i) => i.status === "pending").map((i) => i.player_id),
    declinedAt: Object.fromEntries((sentInvites || []).filter((i) => i.status === "declined").map((i) => [i.player_id, i.declined_at])),
  });
};

// ─── Profile ───────────────────────────────────────────────
export const saveProfile = async () => {
  const session = db.getSession();
  const p = session.profile || {};
  // reads form by id
  const name = document.getElementById("ep-name")?.value.trim();
  const licence = document.getElementById("ep-licence")?.value;
  const exp = document.getElementById("ep-exp")?.value;
  const spec = document.getElementById("ep-spec")?.value;

  if (!name) return toast("Please enter your full name.", "error");
  if (!licence) return toast("Please select your coaching licence.", "error");
  if (!exp || parseInt(exp) < 0 || parseInt(exp) > 50)
    return toast("Please enter valid years of experience (0-50).", "error");

  // avatar chosen through roleUtils.previewAvatar
  const file = window._pendingAvatarFile || null;
  let avatarUrl = p.avatarUrl || null;
  if (file) {
    toast("Uploading photo...", "success");
    const uploadResult = await db.uploadAvatar(session.userId, file);
    if (fail(uploadResult)) return;
    avatarUrl = uploadResult.url;
    window._pendingAvatarFile = null;
  }

  if (name !== session.name) {
    if (fail(await db.updateUserName(session.userId, name))) return;
    session.name = name;
  }

  const updatedProfile = { ...p, licence, exp, spec, avatarUrl };
  if (fail(await db.updateUserProfile(session.userId, updatedProfile))) return;

  session.profile = updatedProfile;
  db.saveSession(session);
  buildSidenav(session);
  toast("Profile updated!", "success");
  navTo("profile");
};

// ─── Squad verification ────────────────────────────────────
export const acceptAdminEdits = async (verificationId) => {
  if (fail(await db.acceptVerificationEdits(verificationId))) return;
  const session = db.getSession();
  session.squadStatus = "verified";
  db.saveSession(session);
  await db.deleteAdminVerificationMessage(session.userId);
  toast("Changes accepted. Your squad is now verified!", "success");
  refreshSidenavBadge("verifications", 0, "var(--gold)");
  launch(session);
};

export const declineAdminEdits = async (verificationId) => {
  if (fail(await db.declineVerificationEdits(verificationId))) return;
  const session = db.getSession();
  session.squadStatus = "rejected";
  db.saveSession(session);
  await db.deleteAdminVerificationMessage(session.userId);
  toast("Changes declined. You can resubmit your squad from the dashboard.", "success");
  dashboard(session);
  refreshSidenavBadge("verifications", 0, "var(--gold)");
};

export const submitResubmission = async () => {
  const session = db.getSession();
  // reads form by id
  const teamName = document.getElementById("rs-team")?.value.trim();
  const league = document.getElementById("rs-league")?.value.trim();
  const year = document.getElementById("rs-year")?.value.trim();
  const ground = document.getElementById("rs-ground")?.value.trim();

  if (!teamName) return toast("Please enter your team name.", "error");
  if (!league) return toast("Please enter your league or division.", "error");
  if (year && (parseInt(year) < 1600 || parseInt(year) > new Date().getFullYear()))
    return toast(`Founding year must be between 1600 and ${new Date().getFullYear()}.`, "error");

  const result = await db.submitSquadVerification({
    coachId: session.userId,
    teamName,
    league,
    foundingYear: year,
    homeGround: ground,
  });
  if (fail(result)) return;

  await db.updateVerificationStatus(session.userId, "squad", "pending");
  session.squadStatus = "pending";
  db.saveSession(session);
  toast("Squad resubmitted for verification!", "success");
  navTo("dashboard");
};

// ─── Squad members, trials and scout network ──────────────
export const confirmKickPlayer = async (playerId, playerName) => {
  if (
    !confirm(
      `Are you sure you want to remove ${playerName} from your squad?\n\nThis will remove them from all tracking data.`,
    )
  )
    return;
  const reason = prompt(`Please enter a reason for removing ${playerName}.\n\nThis cannot be undone.`);
  if (!reason) return toast("Removal cancelled: reason is required.", "error");
  if (reason.trim().length < 5) return toast("Please provide a more detailed reason.", "error");

  const session = db.getSession();
  if (fail(await db.removePlayerFromSquad(session.userId, playerId, reason))) return;
  await db.updateTeamSize(session.userId, -1);
  session.profile = { ...session.profile, teamSize: Math.max(0, (session.profile?.teamSize || 1) - 1) };
  db.saveSession(session);
  toast(`${playerName} has been removed from your squad.`, "success");
  squad(session);
};

export const saveJerseyNumber = async (playerId, playerName) => {
  const session = db.getSession();
  // reads form by id
  const value = document.getElementById(`jersey-input-${playerId}`)?.value;
  const number = value ? parseInt(value) : null;
  if (number !== null && (number < 1 || number > 99)) return toast("Jersey number must be between 1 and 99.", "error");

  if (fail(await db.setJerseyNumber(session.userId, playerId, number))) return;
  if (number) {
    await db._sendMessage(
      "system",
      playerId,
      "Jersey number assigned",
      `${session.name} has assigned you jersey #${number} for ${session.profile?.club || "your squad"}.`,
    );
  }
  toast(number ? `Jersey #${number} assigned to ${playerName}!` : "Jersey number cleared.", "success");
  squad(session);
};

// Trial request responses: set the request status and tell the player.
const respondToTrial = async (requestId, playerId, status, subject, body, message, type) => {
  const session = db.getSession();
  if (fail(await db.respondToTrialRequest(requestId, status))) return;
  await db._sendMessage("system", playerId, subject, body(session));
  toast(message, type);
  squad(session);
};

const club = (s, fallback) => s.profile?.club || fallback;

export const acceptTrialRequest = (requestId, playerId, playerName) =>
  respondToTrial(
    requestId,
    playerId,
    "trial",
    "Trial request accepted!",
    (s) => `${s.name} has accepted your trial request for ${club(s, "their squad")}. You are now on trial! Train hard and make your mark!`,
    `${playerName} is now on trial!`,
    "success",
  );

export const declineTrialRequest = (requestId, playerId, playerName) =>
  respondToTrial(
    requestId,
    playerId,
    "declined",
    "Trial request declined",
    (s) => `${s.name} has declined your trial request at this time. You can send another request after 24 hours.`,
    `${playerName}'s trial request declined.`,
    "error",
  );

export const removeTrialPlayer = (requestId, playerId, playerName) =>
  respondToTrial(
    requestId,
    playerId,
    "removed",
    "Trial period ended",
    (s) => `${s.name} has ended your trial period with ${club(s, "their squad")}. Keep working hard, and your opportunity will come!`,
    `${playerName} removed from trial.`,
    "error",
  );

export const approveTrialPlayer = async (requestId, playerId, playerName) => {
  const session = db.getSession();
  await db.respondToTrialRequest(requestId, "accepted");
  const result = await db.sendSquadInvite(session.userId, playerId, club(session, "the squad"), playerName, session.name);
  if (fail(result)) return;
  toast(`Squad invite sent to ${playerName}`, "success");
  squad(session);
};

const respondToNetwork = async (requestId, scoutId, status, subject, body, message, type) => {
  const session = db.getSession();
  if (fail(await db.respondClubRequest(requestId, status))) return;
  await db._sendMessage("system", scoutId, subject, body(session));
  toast(message, type);
  squad(session);
};

export const approveNetworkRequest = (requestId, scoutId, scoutName) =>
  respondToNetwork(
    requestId,
    scoutId,
    "approved",
    "Network request approved",
    (s) =>
      `${s.name} has approved your request to add ${club(s, "their club")} to your scouting network. You can now view full squad details.`,
    `${scoutName} added to your network!`,
    "success",
  );

export const declineNetworkRequest = (requestId, scoutId, scoutName) =>
  respondToNetwork(
    requestId,
    scoutId,
    "declined",
    "Network request declined",
    (s) => `${s.name} has declined your request to add their club to your scouting network at this time.`,
    `${scoutName}'s request declined.`,
    "error",
  );

// ─── Find my team ──────────────────────────────────────────
export const invitePlayer = async (playerId, playerName) => {
  const session = db.getSession();
  if (fail(await db.sendSquadInvite(session.userId, playerId, club(session, "Unknown squad")))) return;
  toast(`Invite sent to ${playerName}`, "success");
  findmyteam(session);
};

export const messageScout = (scoutId, scoutName) => messageUser(scoutId, scoutName, "findmyteam", "coach");

export const toggleRecruitment = async (value) => {
  const session = db.getSession();
  if (fail(await db.toggleRecruitment(session.userId, value))) return;
  session.profile = { ...session.profile, openForRecruitment: value };
  db.saveSession(session);
  if (value) {
    await notifySquad(
      session.userId,
      "Your squad is now recruiting",
      `Your coach ${session.name} has opened ${club(session, "your squad")} for recruitment. New players may be joining the squad soon.`,
    );
  }
  toast(value ? "Your squad is now visible to players!" : "Your squad is now hidden from players.", "success");
  findmyteam(session);
};

// ─── Training ──────────────────────────────────────────────
const invalidateTrainingCache = () => {
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

export const training = async (s) => {
  // cache squad players; only refetch if explicitly invalidated
  if (!window._cachedSquadPlayers || window._cachedSquadPlayersFor !== s.userId) {
    const { data: sp } = await db.getSquadPlayers(s.userId);
    window._cachedSquadPlayers = sp || [];
    window._cachedSquadPlayersFor = s.userId;
  }
  const squadPlayers = window._cachedSquadPlayers;
  if (!squadPlayers?.length) return showView("CoachTraining", { session: s, squadPlayers: [] });

  const saved = await db.getTrainingCached(s.userId);
  let schedule = saved?.schedule || {};
  const allSessions = saved?.sessions || [];

  // pending match requests for this coach (both as requester and opponent)
  if (!window._cachedPendingRequests) {
    const { data: pr } = await db.getPendingMatchRequests(s.userId);
    window._cachedPendingRequests = pr || [];
  }
  const pendingRequests = window._cachedPendingRequests;

  // client-side lineup deadline fallback, once per session
  if (!window._deadlineChecked) {
    window._deadlineChecked = true;
    db.checkLineupDeadlines(s.userId);
  }

  // one-time migration: clear legacy auto-defaulted Rest values
  const numericKeys = Object.keys(schedule).filter((k) => !isNaN(k));
  const isoKeys = Object.keys(schedule).filter((k) => isNaN(k));
  if (numericKeys.length === 7 && numericKeys.every((k) => schedule[k] === "Rest") && isoKeys.length === 0) {
    schedule = {};
    await db.saveTraining(s.userId, { ...saved, schedule });
  }

  const selectedDay = window._coachTrainingSelectedDay ?? new Date().getDay();
  window._coachTrainingSelectedDay = selectedDay;
  const selectedDateISO = window._coachTrainingSelectedDate || getDateForDayISO(selectedDay);
  window._coachTrainingSelectedDate = selectedDateISO;
  const selectedType = schedule[selectedDateISO] || null;
  const effectiveType = selectedType === "Rest" ? null : selectedType;

  let existingSession = allSessions.find((ss) => ss.dayIndex === selectedDay || ss.date === selectedDateISO) || null;

  // is this coach the OPPONENT for a match on the selected day?
  if (!window._cachedIncomingMatches) {
    const { data: im } = await db.getIncomingMatchesForCoach(s.userId);
    window._cachedIncomingMatches = im || [];
  }
  const opponentMatchRequest = existingSession?.matchId
    ? null
    : window._cachedIncomingMatches.find((m) => m.date === selectedDateISO) || null;

  if (effectiveType === "Match" && existingSession?.matchId) {
    if (!window._cachedCoachMatches) {
      const { data: mr } = await db.getCoachMatches(s.userId);
      window._cachedCoachMatches = mr || [];
    }
    const match = window._cachedCoachMatches.find((m) => m.id === existingSession.matchId);
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

  if (!window._cachedVerifiedTeams) {
    const { data: vt } = await db.getVerifiedTeams();
    window._cachedVerifiedTeams = vt || [];
  }
  if (!window._cachedWDL) window._cachedWDL = await db.getCoachWDL(s.userId);
  if (existingSession?.opponentGround) window._opponentGround = existingSession.opponentGround;

  // this coach's side of the match stats
  let isHomeCoach = true;
  if (existingSession?.matchId) {
    const cacheKey = `_cachedIsHomeCoach_${existingSession.matchId}`;
    if (window[cacheKey] === undefined) {
      const { data: matchCheck } = await db.getMatchById(existingSession.matchId);
      window[cacheKey] = matchCheck?.coach_id === s.userId;
    }
    isHomeCoach = window[cacheKey];
  }
  const myStats = isHomeCoach ? existingSession?.playerStats || {} : existingSession?.opponentPlayerStats || {};

  window._matchTab = window._matchTab || "details";

  showView("CoachTraining", {
    session: s,
    pendingRequests,
    schedule,
    allSessions,
    squadPlayers,
    verifiedTeams: window._cachedVerifiedTeams,
    wdl: window._cachedWDL,
    opponentMatchRequest,
    existingSession,
    myStats,
    incomingMatches: window._cachedIncomingMatches,
  });
};

export const setDayType = async (dayIndex, dateISO, type) => {
  const session = db.getSession();
  const { data: incomingForDay } = await db.getMatchForOpponentCoach(session.userId, dateISO);
  if (incomingForDay && ["pending", "confirmed"].includes(incomingForDay.match_status)) {
    return toast(
      "You cannot change this day's session type until you approve or decline the incoming match request.",
      "error",
    );
  }
  const existing = await db.getTrainingCached(session.userId);
  const schedule = existing?.schedule || {};
  schedule[dateISO] = type;
  delete schedule[dayIndex];
  invalidateTrainingCache(); // before the write so the next read is fresh
  await db.saveTraining(session.userId, { ...existing, schedule });
  window._coachTrainingSelectedDay = dayIndex;
  training(session);
};

export const clearDayType = async (dayIndex, dateISO) => {
  const session = db.getSession();
  const existing = await db.getTrainingCached(session.userId);
  const daySession = (existing?.sessions || []).find((ss) => ss.dayIndex === dayIndex || ss.date === dateISO);
  const hasSession = !!daySession?.name;
  const hasMatchId = !!daySession?.matchId;

  // match days confirm below, when there's a live match to cancel
  if (!hasMatchId) {
    const question = hasSession
      ? `Clear the session plan for ${DAY_NAMES[dayIndex]}?\n\nThis will remove "${daySession.name}" and notify your squad.`
      : `Clear the session type for ${DAY_NAMES[dayIndex]}?`;
    if (!confirm(question)) return;
  }

  if (hasMatchId) {
    const { data: match } = await db.getMatchById(daySession.matchId);
    if (match && ["pending", "confirmed"].includes(match.match_status)) {
      if (
        !confirm(
          `This day has a ${match.match_status} match vs ${match.opponent}.\n\nCancelling will notify the opponent and remove the match. Continue?`,
        )
      )
        return;
      if (fail(await db.cancelMatch(daySession.matchId, session.userId))) return;
      toast("Match cancelled and opponent notified.", "success");
    }
  }

  const schedule = existing?.schedule || {};
  delete schedule[dateISO];
  delete schedule[dayIndex];
  const sessions = (existing?.sessions || []).filter((ss) => ss.dayIndex !== dayIndex && ss.date !== dateISO);
  await db.saveTraining(session.userId, { ...existing, schedule, sessions });

  if (hasSession && !hasMatchId) {
    await notifySquad(
      session.userId,
      `Session cancelled: ${daySession.name}`,
      `${session.name} has cancelled the ${daySession.category || "training"} session planned for ${longDate(dateISO)}.`,
    );
  }

  window._coachTrainingSelectedDay = dayIndex;
  window._matchTab = null;
  window._matchSaved = false;
  window._editingMatchDetails = false;
  invalidateTrainingCache();
  training(session);
};

export const saveSession = async (dayIndex = null, dateISO = null) => {
  const session = db.getSession();
  // reads form by id
  const name = document.getElementById("session-name")?.value.trim();
  const category = document.getElementById("session-category")?.value;
  const intensity = document.getElementById("session-intensity")?.value;
  const duration = document.getElementById("session-duration")?.value;
  const intent = document.getElementById("session-intent")?.value.trim();
  if (!name) return toast("Please enter a session name.", "error");

  // kept in sync by DrillsEditor in Training.jsx
  const drills = window._sessionDrills || [];
  const existing = await db.getTrainingCached(session.userId);
  const isUpdate = !!(existing?.sessions || []).find((ss) => ss.dayIndex === dayIndex || ss.date === dateISO)?.name;

  const sessions = (existing?.sessions || []).filter((ss) => ss.dayIndex !== dayIndex && ss.date !== dateISO);
  sessions.unshift({
    name,
    category,
    intensity,
    duration: parseInt(duration),
    intent,
    drills,
    dayIndex,
    date: dateISO || db.localDate(),
    createdAt: new Date().toISOString(),
  });
  await db.saveTraining(session.userId, { ...existing, sessions });

  const drillsList = drills.length
    ? `\n\nDrills:\n${drills.map((d) => `• ${d.name} (${d.type} · ${d.duration} min)`).join("\n")}`
    : "";
  const squadPlayers = await notifySquad(
    session.userId,
    `${isUpdate ? "Updated" : "New"} session: ${name}`,
    `${session.name} has ${isUpdate ? "updated" : "planned"} a ${category.toLowerCase()} session for ${club(session, "your squad")}.\n\nSession: ${name}\nCategory: ${category}\nIntensity: ${intensity}\nDuration: ${duration} min${intent ? "\nIntent: " + intent : ""}${drillsList}`,
  );

  window._sessionDrills = [];
  window._editingSession = null;
  toast(
    `Session ${isUpdate ? "updated" : "saved"} and ${squadPlayers.length} player${squadPlayers.length !== 1 ? "s" : ""} notified!`,
    "success",
  );
  invalidateTrainingCache();
  training(session);
};

// ─── Matches ───────────────────────────────────────────────
// Match features are still being finished; this is the existing flow.
export const onOpponentChange = () => {
  // reads form by id
  const select = document.getElementById("match-opponent-select");
  const otherWrap = document.getElementById("opponent-other-wrap");
  if (otherWrap) otherWrap.style.display = select?.value === "__other__" ? "flex" : "none";

  // cache the opponent's home ground for the venue dropdown
  const ground = select?.options[select.selectedIndex]?.dataset?.ground || null;
  window._opponentGround = ground;
  const awayOption = document.querySelector('#match-location option[value="away"]');
  if (awayOption) awayOption.textContent = `Away: ${ground || "Opponent's ground"}`;
};

export const onVenueChange = () => {
  const select = document.getElementById("match-location");
  const neutralWrap = document.getElementById("venue-neutral-wrap");
  if (neutralWrap) neutralWrap.style.display = select?.value === "neutral" ? "block" : "none";
};

export const saveMatchSession = async (dayIndex, dateISO) => {
  const session = db.getSession();
  // reads form by id
  const select = document.getElementById("match-opponent-select");
  const isOther = select?.value === "__other__";
  const opponent = isOther ? document.getElementById("match-opponent-other")?.value.trim() : select?.value;
  const venueType = document.getElementById("match-location")?.value;
  const location =
    venueType === "home"
      ? session.profile?.homeGround || session.profile?.club || "Home ground"
      : venueType === "away"
        ? window._opponentGround || "Away"
        : venueType === "neutral"
          ? document.getElementById("match-location-neutral")?.value.trim()
          : "";
  const intent = document.getElementById("session-intent")?.value.trim();
  if (!opponent) return toast("Please select or enter an opponent.", "error");

  const existing = await db.getTrainingCached(session.userId);
  const sessions = (existing?.sessions || []).filter((ss) => ss.dayIndex !== dayIndex && ss.date !== dateISO);
  const existingSession = (existing?.sessions || []).find((ss) => ss.dayIndex === dayIndex || ss.date === dateISO);

  let matchId = existingSession?.matchId || null;
  if (!matchId) {
    const { data: newMatch } = await db.createMatch(session.userId, { opponent, location, date: dateISO, playerStats: {} });
    matchId = newMatch?.id;
  }

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
  await db.saveTraining(session.userId, { ...existing, sessions });

  if (venueType === "neutral" && matchId && location) {
    await notifyAdmins(
      "Neutral venue approval needed",
      `${session.name} (${session.profile?.club}) has requested a neutral venue: "${location}" for a match on ${dateISO}.\n\nPlease verify and approve.`,
    );
  }

  if (isOther && matchId) {
    await db.submitUnverifiedOpponent(session.userId, matchId, opponent, dateISO);
    toast(`Match vs ${opponent} saved: awaiting admin approval for opponent.`, "success");
  }

  // verified opponent: find their coach and send a match request
  if (!isOther && matchId) {
    const { data: allCoaches } = await db.getVerifiedCoachesRaw();
    const opponentCoach = (allCoaches || []).find((c) => (c.profile?.club || c.name) === opponent);
    if (opponentCoach?.id) {
      const reqResult = await db.sendMatchRequest(session.userId, matchId, opponentCoach.id, dateISO, opponent);
      if (reqResult.error) toast("Match saved but could not notify opponent: " + reqResult.error, "error");
      else toast(`Match request sent to ${opponent}!`, "success");
    } else {
      toast(`Match saved. Could not find coach for ${opponent}.`, "error");
    }
  }

  await notifySquad(
    session.userId,
    `Match day: vs ${opponent}`,
    `${session.name} has scheduled a match against ${opponent}${location ? " at " + location : ""} on ${longDate(dateISO)}.${intent ? "\n\nCoach's note: " + intent : ""}`,
  );

  window._cachedWDL = null;
  window._coachTrainingSelectedDay = dayIndex;
  window._editingMatchDetails = false;
  window._matchSaved = true;
  toast(`Match vs ${opponent} saved!`, "success");
  invalidateTrainingCache();
  training(session);
};

const RESULT_LABELS = { W: "Win", D: "Draw", L: "Loss" };

export const logMatchResult = async (matchId, result, dayIndex) => {
  const session = db.getSession();
  if (fail(await db.logMatchResult(matchId, result))) return;
  await notifyAdmins(
    "Match result logged: needs verification",
    `${session.name} (${club(session, "Unknown club")}) logged a match result: ${RESULT_LABELS[result]}.\n\nPlease verify in the admin dashboard.`,
  );
  window._coachTrainingSelectedDay = dayIndex;
  toast(`Result logged: ${RESULT_LABELS[result]}. Sent for admin verification.`, "success");
  training(session);
};

export const approveMatchRequest = async (matchId, requestingClub, isOpponentCoach) => {
  const session = db.getSession();
  const result = isOpponentCoach
    ? await db.respondMatchRequest(matchId, session.userId, true)
    : await db.confirmMatchAsCoach(matchId);
  if (fail(result)) return;
  toast(
    result.confirmed
      ? `Match vs ${requestingClub} confirmed! Both coaches approved.`
      : `Match approved! Waiting for ${requestingClub} to confirm.`,
    "success",
  );
  window._coachTrainingSelectedDay = window._coachTrainingSelectedDay ?? new Date().getDay();
  invalidateTrainingCache();
  training(session);
};

export const declineMatchRequest = async (matchId, requestingCoachId, requestingClub) => {
  const session = db.getSession();
  if (fail(await db.respondMatchRequest(matchId, session.userId, false))) return;
  await db._sendMessage(
    "system",
    requestingCoachId,
    "Match request declined",
    `${session.profile?.club || session.name} has declined your match request. You can change the session type for that day.`,
  );
  toast(`Match request from ${requestingClub} declined.`, "success");
  training(session);
};

// Reads per-player inputs (data-pid / data-stat) from the lineup table.
const readLineup = (selector) => {
  const lineup = {};
  document.querySelectorAll(`${selector}[data-pid]`).forEach((input) => {
    const { pid, stat } = input.dataset;
    (lineup[pid] ||= {})[stat] = input.value || null;
  });
  return lineup;
};

const submitLineupFrom = async (matchId, selector, notified) => {
  const session = db.getSession();
  // reads form by selector
  const lineup = readLineup(selector);
  if (!Object.values(lineup).some((p) => p.role === "starter"))
    return toast("Please set at least one player as a starter.", "error");
  if (fail(await db.submitLineup(matchId, session.userId, lineup))) return;
  toast(`Lineup submitted! ${notified} has been notified.`, "success");
  window._matchTab = "lineup";
  training(session);
};

export const saveLineup = (matchId) => submitLineupFrom(matchId, ".lineup-input", "Opponent");
export const saveOpponentLineup = (matchId) => submitLineupFrom(matchId, ".opp-lineup-input", "Requesting coach");

export const savePostStats = async (matchId) => {
  const session = db.getSession();
  // reads form by selector
  const stats = {};
  document.querySelectorAll(".post-stat-input[data-pid]").forEach((input) => {
    const { pid, stat } = input.dataset;
    (stats[pid] ||= {})[stat] = parseInt(input.value) || 0;
  });
  if (fail(await db.saveMatchPostStats(matchId, session.userId, stats))) return;
  toast("Match stats saved!", "success");
  training(session);
};

export const notifySquadOfMatch = async (matchId) => {
  const session = db.getSession();
  const { data: match } = await db.getMatchById(matchId);
  if (!match) return toast("Match not found.", "error");
  const notified = await notifySquad(
    session.userId,
    `Confirmed match: vs ${match.opponent}`,
    `Your coach has confirmed a match against ${match.opponent} on ${longDate(match.date)}.${match.location ? "\n\nVenue: " + match.location : ""}${match.intent ? "\n\nCoach's note: " + match.intent : ""}\n\nBe ready!`,
  );
  if (!notified.length) return toast("No players to notify.", "error");
  toast(`Squad notified about the match vs ${match.opponent}!`, "success");
};

// ─── Tracking ──────────────────────────────────────────────
export const logSessionRating = async (playerId = null, playerName = null) => {
  const session = db.getSession();
  // reads form by id
  const pid = playerId || document.getElementById("tr-player")?.value;
  const pname = playerName || document.getElementById("tr-player")?.selectedOptions[0]?.text || "Player";
  const sessionType = document.getElementById("tr-type")?.value;
  const notes = document.getElementById("tr-notes")?.value.trim() || null;
  if (!pid) return toast("Please select a player.", "error");
  if (!sessionType) return toast("Please select a session type.", "error");

  const slider = (key) => parseInt(document.getElementById(`cv-${key}`)?.textContent || 7) * 10;
  const ratings = { speed: slider("speed"), technical: slider("technical"), tactical: slider("tactical"), physical: slider("physical") };

  const { data: existing } = await db.getTodaySessionRating(session.userId, pid);
  let result;
  if (existing) {
    const overall = Math.round((ratings.speed + ratings.technical + ratings.tactical + ratings.physical) / 4);
    const { error } = await db._updateSessionRating(existing.id, sessionType, ratings, overall, notes);
    result = error ? { error } : { overall };
    if (!error) toast(`Session updated! Overall: ${overall}/100`, "success");
  } else {
    result = await db.saveSessionRating(session.userId, pid, sessionType, ratings, notes);
    if (!result.error) toast(`Session logged! Overall: ${result.overall}/100`, "success");
  }
  if (fail(result)) return;

  if (playerId) trackPlayer(pid, pname);
  else {
    await checkExistingRating();
    tracking(session);
  }
};

// Switches the tracking form's button between "Save" and "Update".
export const checkExistingRating = async () => {
  const session = db.getSession();
  const playerId = document.getElementById("tr-player")?.value;
  const btn = document.getElementById("tr-save-btn");
  if (!btn) return;
  const existing = playerId ? (await db.getTodaySessionRating(session.userId, playerId)).data : null;
  btn.innerHTML = existing
    ? '<i class="ti ti-refresh"></i> Update rating'
    : '<i class="ti ti-circle-check"></i> Save rating';
};
