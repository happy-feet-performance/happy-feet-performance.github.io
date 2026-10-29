// Achievements.
import { _client } from "./core.js";

export const getAchievements = async (userId) => {
  const { data, error } = await _client
    .from("users")
    .select("achievements")
    .eq("id", userId)
    .single();
  if (error) return { data: [] };
  return { data: data.achievements || [] };
};

export const unlockAchievement = async (userId, achievementId) => {
  const { data: user } = await _client
    .from("users")
    .select("achievements")
    .eq("id", userId)
    .single();

  const current = user?.achievements || [];
  if (current.find((a) => a.id === achievementId))
    return { alreadyUnlocked: true };

  const updated = [
    ...current,
    { id: achievementId, unlockedAt: new Date().toISOString() },
  ];
  const { error } = await _client
    .from("users")
    .update({ achievements: updated })
    .eq("id", userId);

  if (error) return { error: error.message };
  return { success: true };
};

export const checkAndUnlockAchievements = async (userId) => {
  const [
    { data: unlockedRaw },
    { data: sessions },
    { data: healthLogs },
    { data: trainingLogs },
    { data: user },
    { data: prospects },
  ] = await Promise.all([
    _client
      .from("users")
      .select("achievements, profile, login_streak")
      .eq("id", userId)
      .single()
      .then((r) => ({ data: r.data })),
    _client
      .from("session_ratings")
      .select("overall")
      .eq("player_id", userId)
      .then((r) => ({ data: r.data || [] })),
    _client
      .from("health_logs")
      .select("id, energy, mood, sleep, soreness, hydration")
      .eq("player_id", userId)
      .then((r) => ({ data: r.data || [] })),
    _client
      .from("training_logs")
      .select("id")
      .eq("player_id", userId)
      .eq("completed", true)
      .then((r) => ({ data: r.data || [] })),
    _client
      .from("squad_invites")
      .select("status")
      .eq("player_id", userId)
      .eq("status", "accepted")
      .then((r) => ({ data: r.data || [] })),
    _client
      .from("scout_prospects")
      .select("flagged, placed, report_shared")
      .eq("player_id", userId)
      .then((r) => ({ data: r.data || [] })),
  ]);

  const unlocked = unlockedRaw?.achievements || [];
  const profile = unlockedRaw?.profile || {};
  const streak = unlockedRaw?.login_streak || 0;
  const unlockedIds = new Set(unlocked.map((a) => a.id));
  const newlyUnlocked = [];

  const check = async (id, condition) => {
    if (condition && !unlockedIds.has(id)) {
      await unlockAchievement(userId, id);
      newlyUnlocked.push(id);
    }
  };

  const avgOverall = sessions.length
    ? Math.round(
        sessions.reduce((sum, s) => sum + s.overall, 0) / sessions.length,
      )
    : 0;
  const maxWellness = healthLogs.some(
    (l) =>
      l.energy >= 8 &&
      l.mood >= 8 &&
      l.sleep >= 8 &&
      l.soreness <= 3 &&
      l.hydration >= 8,
  );
  const inSquad = (user?.length || 0) > 0;
  const flagged = prospects?.some((p) => p.flagged);
  const placed = prospects?.some((p) => p.placed);
  const reportShared = prospects?.some((p) => p.report_shared);

  // Performance
  await check("first_session", sessions.length >= 1);
  await check("sessions_5", sessions.length >= 5);
  await check("sessions_25", sessions.length >= 25);
  await check("rating_60", avgOverall >= 60);
  await check("rating_75", avgOverall >= 75);
  await check("rating_90", avgOverall >= 90);

  // Consistency
  await check("streak_3", streak >= 3);
  await check("streak_7", streak >= 7);
  await check("streak_30", streak >= 30);
  await check("training_5", trainingLogs.length >= 5);
  await check("training_20", trainingLogs.length >= 20);

  // Wellness
  await check("first_checkin", healthLogs.length >= 1);
  await check("checkins_7", healthLogs.length >= 7);
  await check("checkins_30", healthLogs.length >= 30);
  await check("wellness_perfect", maxWellness);

  // Faith
  await check("first_prayer", (profile.faithStreak || 0) >= 1);
  await check("faith_7", (profile.faithStreak || 0) >= 7);
  await check("faith_30", (profile.faithStreak || 0) >= 30);

  // Community
  await check("join_squad", inSquad);
  await check("scout_flagged", flagged);
  await check("scout_placed", placed);
  await check("report_shared", reportShared);

  return { newlyUnlocked };
};
