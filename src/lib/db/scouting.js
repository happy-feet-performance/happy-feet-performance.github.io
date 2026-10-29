// Scout prospects and reports.
import { _client, _localDate } from "./core.js";

export const getScoutProspects = async (scoutId) => {
  const { data, error } = await _client
    .from("scout_prospects")
    .select(
      "*, player:users!scout_prospects_player_id_fkey(id, name, profile)",
    )
    .eq("scout_id", scoutId)
    .order("created_at", { ascending: false });
  if (error) return { data: [] };
  return { data };
};

export const saveProspect = async (scoutId, playerId) => {
  const { data: existing } = await _client
    .from("scout_prospects")
    .select("id")
    .eq("scout_id", scoutId)
    .eq("player_id", playerId)
    .maybeSingle();
  if (existing) return { error: "Player already saved as prospect." };

  const { error } = await _client
    .from("scout_prospects")
    .insert({ scout_id: scoutId, player_id: playerId, status: "watching" });
  if (error) return { error: error.message };
  return { success: true };
};

export const unsaveProspect = async (scoutId, playerId) => {
  const { error } = await _client
    .from("scout_prospects")
    .delete()
    .eq("scout_id", scoutId)
    .eq("player_id", playerId);
  if (error) return { error: error.message };
  return { success: true };
};

export const updateProspectStatus = async (scoutId, playerId, updates) => {
  const { error } = await _client
    .from("scout_prospects")
    .update({ ...updates, updated_at: _localDate() })
    .eq("scout_id", scoutId)
    .eq("player_id", playerId);
  if (error) return { error: error.message };
  return { success: true };
};

export const saveProspectReport = async (scoutId, playerId, report) => {
  const { error } = await _client
    .from("scout_prospects")
    .update({
      report,
      report_generated_at: new Date().toISOString(),
    })
    .eq("scout_id", scoutId)
    .eq("player_id", playerId);
  if (error) return { error: error.message };
  return { success: true };
};

export const getProspectReport = async (scoutId, playerId) => {
  const { data, error } = await _client
    .from("scout_prospects")
    .select("report, report_generated_at")
    .eq("scout_id", scoutId)
    .eq("player_id", playerId)
    .single();
  if (error) return { data: null };
  return { data };
};
