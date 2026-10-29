// Post-session ratings.
import { checkAndUnlockAchievements } from "./achievements.js";
import { _client, _localDate } from "./core.js";

export const saveSessionRating = async (
  coachId,
  playerId,
  sessionType,
  ratings,
  notes = null,
) => {
  const overall = Math.round(
    (ratings.speed +
      ratings.technical +
      ratings.tactical +
      ratings.physical) /
      4,
  );
  const today = _localDate();

  const { error } = await _client.from("session_ratings").upsert(
    {
      player_id: playerId,
      coach_id: coachId,
      session_type: sessionType,
      speed: ratings.speed,
      technical: ratings.technical,
      tactical: ratings.tactical,
      physical: ratings.physical,
      overall,
      date: today,
      notes,
    },
    { onConflict: "coach_id,player_id,date" },
  );

  if (error) return { error: error.message };

  const { data: player } = await _client
    .from("users")
    .select("profile")
    .eq("id", playerId)
    .single();

  if (player) {
    const updatedProfile = {
      ...player.profile,
      ratings: {
        speed: ratings.speed,
        tech: ratings.technical,
        tact: ratings.tactical,
        phys: ratings.physical,
      },
    };
    await _client
      .from("users")
      .update({ profile: updatedProfile })
      .eq("id", playerId);
  }

  await checkAndUnlockAchievements(playerId);
  return { success: true, overall };
};

export const getTodaySessionRating = async (coachId, playerId) => {
  const today = _localDate();
  const { data, error } = await _client
    .from("session_ratings")
    .select("*")
    .eq("coach_id", coachId)
    .eq("player_id", playerId)
    .eq("date", today)
    .maybeSingle();
  if (error) return { data: null };
  return { data };
};

export const _updateSessionRating = async (
  ratingId,
  sessionType,
  ratings,
  overall,
  notes = null,
) => {
  const { error } = await _client
    .from("session_ratings")
    .update({
      session_type: sessionType,
      speed: ratings.speed,
      technical: ratings.technical,
      tactical: ratings.tactical,
      physical: ratings.physical,
      overall,
      notes,
    })
    .eq("id", ratingId);
  return { error };
};

export const getPlayerSessionRatings = async (playerId, limit = 10) => {
  const { data, error } = await _client
    .from("session_ratings")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { data: [] };
  return { data };
};

export const getSquadSessionRatings = async (coachId) => {
  const { data, error } = await _client
    .from("session_ratings")
    .select("*, player:users!session_ratings_player_id_fkey(id, name)")
    .eq("coach_id", coachId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return { data: [] };
  return { data };
};
