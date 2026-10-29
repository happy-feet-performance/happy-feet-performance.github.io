// Training plans and logs.
import { _client, _getData, _localDate, _saveData } from "./core.js";

export const getTraining = async (userId) =>
  (await _getData("training", userId)) || {
    sessions: [],
    schedule: {},
    currentPlan: null,
  };

export const saveTraining = async (userId, data) =>
  await _saveData("training", userId, data);

export const logTrainingSession = async (
  playerId,
  sessionType,
  notes = null,
  date = null,
  completed = true,
) => {
  const targetDate = date || _localDate();
  const { data: existing } = await _client
    .from("training_logs")
    .select("id, completed")
    .eq("player_id", playerId)
    .eq("date", targetDate)
    .maybeSingle();

  if (existing) {
    const { error } = await _client
      .from("training_logs")
      .update({ session_type: sessionType, completed, notes })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await _client.from("training_logs").insert({
      player_id: playerId,
      date: targetDate,
      session_type: sessionType,
      completed,
      notes,
    });
    if (error) return { error: error.message };
  }
  return { success: true };
};

export const getTrainingLogs = async (playerId, limit = 30) => {
  const { data, error } = await _client
    .from("training_logs")
    .select("*")
    .eq("player_id", playerId)
    .eq("completed", true)
    .order("date", { ascending: false })
    .limit(limit);
  if (error) return { data: [] };
  return { data };
};

export const getTodayTrainingLog = async (playerId) => {
  const today = _localDate();
  const { data, error } = await _client
    .from("training_logs")
    .select("*")
    .eq("player_id", playerId)
    .eq("date", today)
    .maybeSingle();
  if (error) return { data: null };
  return { data };
};

export const getCoachTrainingForPlayer = async (playerId) => {
  try {
    const { data: invite, error: ie } = await _client
      .from("squad_invites")
      .select("coach_id")
      .eq("player_id", playerId)
      .eq("status", "accepted")
      .maybeSingle();

    if (ie || !invite) return { data: null };

    const { data, error } = await _client
      .from("training")
      .select("*")
      .eq("user_id", invite.coach_id)
      .maybeSingle();

    if (error) return { data: null };

    const raw = data?.data || null;
    if (!raw) return { data: null };

    const numericKeys = Object.keys(raw.schedule || {}).filter(
      (k) => !isNaN(k),
    );
    const isoKeys = Object.keys(raw.schedule || {}).filter((k) => isNaN(k));
    const allNumericAreRest =
      numericKeys.length === 7 &&
      numericKeys.every((k) => raw.schedule[k] === "Rest");
    const cleanSchedule =
      allNumericAreRest && isoKeys.length === 0 ? {} : raw.schedule || {};

    return { data: { ...raw, schedule: cleanSchedule } };
  } catch {
    return { data: null };
  }
};

export const getTrainingCached = async (userId) => {
  if (
    window._cachedTrainingData &&
    window._cachedTrainingDataFor === userId
  ) {
    return window._cachedTrainingData;
  }
  const data = await getTraining(userId);
  window._cachedTrainingData = data;
  window._cachedTrainingDataFor = userId;
  return data;
};
