// Player dashboard: view routing, data loaders and actions. Each view
// component (src/react/components/player/views.jsx) loads its own data;
// actions return true when something changed so the view can reload.
import * as db from "./db/index.js";
import { calcRating, isNewUser } from "./utils.js";
import { launchConfetti, toast } from "./dom.js";
import { buildSidenav, navTo } from "./router.js";
import { messageUser } from "./roleUtils.js";
import { showView } from "./views.js";

// ─── Views ─────────────────────────────────────────────────
const VIEW_NAMES = {
  dashboard: "PlayerDashboard",
  profile: "PlayerProfile",
  stats: "PlayerStats",
  training: "PlayerTraining",
  health: "PlayerHealth",
  achievements: "PlayerAchievements",
  highlights: "PlayerHighlights",
  messages: "PlayerMessages",
  faith: "PlayerFaith",
  findmyteam: "PlayerFindMyTeam",
};

export const render = (view, session) => showView(VIEW_NAMES[view] || VIEW_NAMES.dashboard, { session });
// Used by the router (training plan updates) and roleUtils (messages,
// prayer check-offs) to refresh the current view.
export const training = (s) => render("training", s);
export const messages = (s) => render("messages", s);
export const faith = (s) => render("faith", s);
export const editProfile = () => showView("PlayerEditProfile", { session: db.getSession() });

// ─── Loaders ───────────────────────────────────────────────
export const loadDashboard = async (s) => {
  const [tracker, loginStreak, { data: agentConvos }, unreadCount] = await Promise.all([
    db.getTracker(s.userId),
    db.getLoginStreak(s.userId),
    db.getAgentConversations(s.userId),
    db.getUnreadCount(s.userId),
  ]);
  return {
    overall: calcRating(s.profile?.ratings || {}),
    newUser: isNewUser(s),
    loginStreak,
    unreadCount,
    sessionsThisMonth: tracker?.sessionsThisMonth || 0,
    agentConvos,
  };
};

// Refreshes the session's profile from the database before showing it.
export const loadProfile = async (s) => {
  const [{ data: freshUser }, { data: invite }] = await Promise.all([
    db.getUserById(s.userId),
    db.getPlayerCurrentCoach(s.userId),
  ]);
  if (freshUser?.profile) {
    s.profile = freshUser.profile;
    db.saveSession(s);
  }
  return { session: s, ms: freshUser?.match_stats || {}, jerseyNumber: invite?.jersey_number || null };
};

export const loadStats = async (s) => {
  const { data: sessions } = await db.getPlayerSessionRatings(s.userId);
  return {
    overall: calcRating(s.profile?.ratings || {}),
    sessions,
    hasStats: sessions?.length > 0,
    trendData: sessions ? [...sessions].reverse().map((r) => r.overall) : [],
  };
};

const hasTeam = (s) => !!s.profile?.club && s.profile?.status !== "unattached";

export const loadTraining = async (s) => {
  // the plan comes from the player's coach, so it needs a team
  if (!hasTeam(s)) return { hasTeam: false };
  const [{ data: coachData }, { data: logs }] = await Promise.all([
    db.getCoachTrainingForPlayer(s.userId),
    db.getTrainingLogs(s.userId),
  ]);
  return {
    hasTeam: true,
    schedule: coachData?.schedule || {},
    logs,
    todayISO: db.localDate(),
    todayDayIndex: new Date().getDay(),
  };
};

export const loadHealth = async (s) => {
  const [{ data: todayLog }, { data: logs }] = await Promise.all([db.getTodayHealthLog(s.userId), db.getHealthLogs(s.userId)]);
  return { todayLog, logs };
};

// Unlocks anything newly earned first, so it shows up straight away.
export const loadAchievements = async (s) => {
  await db.checkAndUnlockAchievements(s.userId);
  const { data: unlocked } = await db.getAchievements(s.userId);
  return (unlocked || []).map((a) => a.id);
};

export const loadMessages = async (s) => {
  const [{ data: msgs }, { data: archived }, { data: invites }] = await Promise.all([
    db.getMessages(s.userId),
    db.getArchivedMessages(s.userId),
    db.getSquadInvites(s.userId),
  ]);
  const senderNames = await db.getUserNamesByIds([...(msgs || []), ...(archived || [])].map((m) => m.from_id));
  const withSender = (m) => ({ ...m, senderName: senderNames[m.from_id] || "HappyFeet" });
  return { invites, enriched: (msgs || []).map(withSender), enrichedArchived: (archived || []).map(withSender) };
};

export const loadFaithChecklist = (s) =>
  JSON.parse(localStorage.getItem(`hf_faith_checklist_${s.userId}_${db.localDate()}`) || "{}");

export const loadFindMyTeam = async (s) => {
  const [{ data: coaches }, { data: currentInvite }] = await Promise.all([
    db.getVerifiedCoaches(true),
    db.getPlayerCurrentCoach(s.userId),
  ]);
  const currentCoachId = currentInvite?.coach_id || null;
  return Promise.all(
    (coaches || [])
      .filter((c) => c.id !== currentCoachId)
      .map(async (c) => ({ ...c, trialRequest: (await db.getTrialRequestStatus(s.userId, c.id)).data })),
  );
};

// ─── Actions ───────────────────────────────────────────────
const celebrateNewAchievements = async (userId) => {
  const { newlyUnlocked } = await db.checkAndUnlockAchievements(userId);
  if (newlyUnlocked?.length > 0) {
    setTimeout(() => {
      launchConfetti();
      toast(`🏆 Achievement unlocked: ${newlyUnlocked.length} new!`, "success");
    }, 500);
  }
};

export const saveProfile = async ({ name, pos, tier, hometown }) => {
  const session = db.getSession();

  // avatar chosen through roleUtils.previewAvatar
  const file = window._pendingAvatarFile || null;
  let avatarUrl = session.profile?.avatarUrl || null;
  if (file) {
    toast("Uploading photo...", "success");
    const uploadResult = await db.uploadAvatar(session.userId, file);
    if (uploadResult.error) return toast(uploadResult.error, "error");
    avatarUrl = uploadResult.url;
    window._pendingAvatarFile = null;
  }

  const updatedProfile = {
    ...session.profile,
    avatarUrl,
    pos: pos || session.profile?.pos,
    tier: tier || session.profile?.tier,
    hometown: hometown.trim() || session.profile?.hometown,
  };
  name = name.trim() || session.name;

  const result = await db.updateUserProfile(session.userId, updatedProfile, name);
  if (result.error) return toast(result.error, "error");

  session.profile = updatedProfile;
  session.name = name;
  db.saveSession(session);
  buildSidenav(session);
  toast("Profile updated!", "success");
  navTo("profile");
};

export const toggleSessionComplete = async (sessionType, date, completed, notes = "") => {
  const session = db.getSession();
  const result = await db.logTrainingSession(session.userId, sessionType, notes.trim() || null, date, completed);
  if (result.error) {
    toast(result.error, "error");
    return false;
  }
  await celebrateNewAchievements(session.userId);
  toast(completed ? "Session marked complete! 💪" : "Session unmarked.", "success");
  return true;
};

// values: { energy, mood, sleep, soreness, nutrition (1-10), hydration (litres), notes }
export const logHealthCheckin = async (values) => {
  const hydration = parseFloat(values.hydration) || 0;
  if (hydration < 0 || hydration > 10) {
    toast("Hydration must be between 0 and 10 litres.", "error");
    return false;
  }
  const session = db.getSession();
  const result = await db.saveHealthLog(session.userId, {
    energy: values.energy,
    mood: values.mood,
    sleep: values.sleep,
    soreness: values.soreness,
    hydration,
    nutrition: values.nutrition,
    notes: values.notes.trim() || null,
  });
  if (result.error) {
    toast(result.error, "error");
    return false;
  }
  await celebrateNewAchievements(session.userId);
  toast("Health check-in logged!", "success");
  return true;
};

export const respondInvite = async (inviteId, playerId, accept, squadName, coachId) => {
  const result = await db.respondToInvite(inviteId, playerId, accept, squadName, coachId);
  if (result.error) {
    toast(result.error, "error");
    return false;
  }
  if (accept) {
    const session = db.getSession();
    session.profile = { ...session.profile, club: squadName, status: "signed" };
    db.saveSession(session);
    await db.updateTeamSize(coachId, 1);
    toast(`Welcome to ${squadName}!`, "success");
    buildSidenav(session);
  } else {
    toast("Invite declined.", "success");
  }
  return true;
};

export const messageCoach = (coachId, coachName) => messageUser(coachId, coachName, "findmyteam", "player");

export const requestTrial = async (coachId, coachName) => {
  const session = db.getSession();
  const result = await db.requestTrial(session.userId, coachId);
  if (result.error) {
    toast(result.error, "error");
    return false;
  }

  const p = session.profile || {};
  await db._sendMessage(
    "system",
    coachId,
    "New trial request",
    `${session.name} (${p.pos || "Player"} · ${p.tier || "-"} · ${p.hometown || "-"}) has requested a trial with your squad.\n\nGo to your squad page to accept or decline.`,
  );
  await db._sendMessage(
    "system",
    session.userId,
    `Trial request sent to ${coachName}`,
    `Your trial request to ${coachName} has been sent. You will be notified when they respond.`,
  );
  toast(`Trial request sent to ${coachName}!`, "success");
  return true;
};

export const leaveTeam = async () => {
  const session = db.getSession();
  const clubName = session.profile?.club || "your team";

  if (!confirm(`Are you sure you want to leave ${clubName}?\n\nThis cannot be undone. Your coach will be notified.`))
    return false;
  const reason = prompt("Please enter a reason for leaving (required):");
  if (!reason || reason.trim().length < 3) {
    toast("A reason is required to leave your team.", "error");
    return false;
  }

  const { data: invite } = await db.getPlayerCurrentCoach(session.userId);
  const result = await db.leaveSquad(session.userId);
  if (result.error) {
    toast(result.error, "error");
    return false;
  }

  if (invite?.coach_id) {
    const [, sizeResult] = await Promise.all([
      db._sendMessage(
        "system",
        invite.coach_id,
        `${session.name} has left the squad`,
        `${session.name} has left ${clubName}.\n\nReason: ${reason.trim()}\n\nTheir slot is now available.`,
      ),
      db.updateTeamSize(invite.coach_id, -1),
    ]);
    if (sizeResult?.error) console.error("Failed to decrement team size:", sizeResult.error);
  } else {
    console.warn("leaveTeam: no coach_id found on invite", invite);
  }

  session.profile = { ...session.profile, club: null, status: "unattached" };
  db.saveSession(session);
  // rebuild the sidebar so the Training item disappears
  buildSidenav(session);
  toast(`You have left ${clubName}.`, "success");
  return true;
};
