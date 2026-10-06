// Trial requests and the scout/club network.
import { _client } from "./core.js";

export const requestTrial = async (playerId, coachId) => {
  // check for existing request within 24 hours
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);

  const { data: existing } = await _client
    .from("trial_requests")
    .select("*")
    .eq("player_id", playerId)
    .eq("coach_id", coachId)
    .maybeSingle();

  if (existing) {
    if (existing.status === "pending")
      return { error: "Trial request already pending." };
    if (existing.status === "declined") {
      const declinedAt = new Date(existing.responded_at);
      if (declinedAt > yesterday) {
        const hoursLeft = Math.ceil(
          (declinedAt - yesterday) / (1000 * 60 * 60),
        );
        return {
          error: `You can resend this request in ${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""}.`,
        };
      }
      // 24 hours passed: update to pending again
      const { error } = await _client
        .from("trial_requests")
        .update({
          status: "pending",
          responded_at: null,
          created_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) return { error: error.message };
      return { success: true, requestId: existing.id };
    }
  }

  const { data, error } = await _client
    .from("trial_requests")
    .insert({ player_id: playerId, coach_id: coachId, status: "pending" })
    .select()
    .single();
  if (error) return { error: error.message };
  return { success: true, requestId: data.id };
};

export const respondToTrialRequest = async (requestId, status) => {
  const { error } = await _client
    .from("trial_requests")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) return { error: error.message };
  return { success: true };
};

export const getTrialRequestStatus = async (playerId, coachId) => {
  const { data, error } = await _client
    .from("trial_requests")
    .select("*")
    .eq("player_id", playerId)
    .eq("coach_id", coachId)
    .maybeSingle();
  if (error) return { data: null };
  return { data };
};

export const getPendingTrialRequests = async (coachId) => {
  const { data, error } = await _client
    .from("trial_requests")
    .select(
      "*, player:users!trial_requests_player_id_fkey(id, name, profile)",
    )
    .eq("coach_id", coachId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) return { data: [] };
  return { data };
};

export const getTrialPlayers = async (coachId) => {
  const { data, error } = await _client
    .from("trial_requests")
    .select(
      "*, player:users!trial_requests_player_id_fkey(id, name, profile)",
    )
    .eq("coach_id", coachId)
    .eq("status", "trial")
    .order("responded_at", { ascending: false });
  if (error) return { data: [] };
  return { data };
};

export const requestClubNetwork = async (scoutId, coachId) => {
  const { data: existing } = await _client
    .from("scout_club_requests")
    .select("*")
    .eq("scout_id", scoutId)
    .eq("coach_id", coachId)
    .maybeSingle();

  if (existing) {
    if (existing.status === "pending")
      return { error: "Request already pending." };
    if (existing.status === "approved")
      return { error: "Already in your network." };
  }

  const { error } = await _client.from("scout_club_requests").upsert(
    {
      scout_id: scoutId,
      coach_id: coachId,
      status: "pending",
      responded_at: null,
    },
    { onConflict: "scout_id,coach_id" },
  );
  if (error) return { error: error.message };
  return { success: true };
};

export const respondClubRequest = async (requestId, status) => {
  const { error } = await _client
    .from("scout_club_requests")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) return { error: error.message };
  return { success: true };
};

export const getClubNetworkStatus = async (scoutId, coachId) => {
  const { data, error } = await _client
    .from("scout_club_requests")
    .select("*")
    .eq("scout_id", scoutId)
    .eq("coach_id", coachId)
    .maybeSingle();
  if (error) return { data: null };
  return { data };
};

export const getPendingClubRequests = async (coachId) => {
  const { data, error } = await _client
    .from("scout_club_requests")
    .select(
      "*, scout:users!scout_club_requests_scout_id_fkey(id, name, profile)",
    )
    .eq("coach_id", coachId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) return { data: [] };
  return { data };
};

export const getApprovedClubNetwork = async (scoutId) => {
  const { data, error } = await _client
    .from("scout_club_requests")
    .select(
      "*, coach:users!scout_club_requests_coach_id_fkey(id, name, profile)",
    )
    .eq("scout_id", scoutId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) return { data: [] };
  return { data };
};
