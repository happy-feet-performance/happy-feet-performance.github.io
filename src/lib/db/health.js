// Health check-ins.
import { _client, _getData, _localDate } from "./core.js";

export const getHealth = async (userId) =>
  (await _getData("health", userId)) || { checkins: {}, injuries: [] };

export const saveHealthLog = async (playerId, data) => {
  const today = _localDate();
  const { data: existing } = await _client
    .from("health_logs")
    .select("id")
    .eq("player_id", playerId)
    .eq("date", today)
    .maybeSingle();

  if (existing) {
    const { error } = await _client
      .from("health_logs")
      .update({ ...data, date: today })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await _client
      .from("health_logs")
      .insert({ player_id: playerId, date: today, ...data });
    if (error) return { error: error.message };
  }
  return { success: true };
};

export const getHealthLogs = async (playerId, limit = 14) => {
  const { data, error } = await _client
    .from("health_logs")
    .select("*")
    .eq("player_id", playerId)
    .order("date", { ascending: false })
    .limit(limit);
  if (error) return { data: [] };
  return { data };
};

export const getTodayHealthLog = async (playerId) => {
  const today = _localDate();
  const { data, error } = await _client
    .from("health_logs")
    .select("*")
    .eq("player_id", playerId)
    .eq("date", today)
    .maybeSingle();
  if (error) return { data: null };
  return { data };
};

export const getPlayerHealthLogs = async (playerId, limit = 7) => {
  const { data, error } = await _client
    .from("health_logs")
    .select("*")
    .eq("player_id", playerId)
    .order("date", { ascending: false })
    .limit(limit);
  if (error) return { data: [] };
  return { data };
};
