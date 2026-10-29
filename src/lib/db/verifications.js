// Squad and agency verification workflow.
import { _client, _localDate } from "./core.js";
import { _notifyAdmins } from "./users.js";

export const submitSquadVerification = async (data) => {
  const { error } = await _client.from("squad_verifications").insert({
    coach_id: data.coachId,
    team_name: data.teamName,
    league: data.league,
    founding_year: data.foundingYear || null,
    home_ground: data.homeGround || null,
    status: "pending",
  });
  if (error) return { error: error.message };

  // fetch coach name
  const { data: coach } = await _client
    .from("users")
    .select("name")
    .eq("id", data.coachId)
    .single();
  const coachName = coach?.name || "A coach";

  await _notifyAdmins(
    "New squad verification submitted",
    `Coach ${coachName} has submitted "${data.teamName}" for squad verification.`,
  );

  return { success: true };
};

export const submitAgencyVerification = async (data) => {
  const { error } = await _client.from("agency_verifications").insert({
    scout_id: data.scoutId,
    agency_name: data.agencyName,
    region: data.regionsCovered[0],
    regions_covered: data.regionsCovered,
    target_leagues: data.targetLeagues,
    website: data.website || null,
    status: "pending",
  });
  if (error) return { error: error.message };

  // fetch scout name
  const { data: scout } = await _client
    .from("users")
    .select("name")
    .eq("id", data.scoutId)
    .single();
  const scoutName = scout?.name || "A scout";

  await _notifyAdmins(
    "New agency verification submitted",
    `Scout ${scoutName} has submitted "${data.agencyName}" for agency verification.`,
  );

  return { success: true };
};

export const checkTeamExists = async (teamName) => {
  const { data } = await _client
    .from("squad_verifications")
    .select("id, status")
    .ilike("team_name", teamName)
    .maybeSingle();
  return data || null;
};

export const getPendingVerifications = async (type = "squad") => {
  const table =
    type === "squad" ? "squad_verifications" : "agency_verifications";
  const fkName =
    type === "squad"
      ? "users!squad_verifications_claimed_by_fkey"
      : "users!agency_verifications_claimed_by_fkey";

  const { data, error } = await _client
    .from(table)
    .select(`*, claimer:${fkName}(id, name)`)
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });

  if (error) return { data: [] };
  return { data };
};

export const claimVerification = async (verificationId, adminId, type = "squad") => {
  const table =
    type === "squad" ? "squad_verifications" : "agency_verifications";

  // check if already claimed by someone else
  const { data: existing } = await _client
    .from(table)
    .select("claimed_by")
    .eq("id", verificationId)
    .single();

  if (existing?.claimed_by && existing.claimed_by !== adminId) {
    return {
      error: "This verification is already being reviewed by another admin.",
    };
  }

  const { error } = await _client
    .from(table)
    .update({ claimed_by: adminId, claimed_at: new Date().toISOString() })
    .eq("id", verificationId);

  if (error) return { error: error.message };
  return { success: true };
};

export const unclaimVerification = async (verificationId, type = "squad") => {
  const table =
    type === "squad" ? "squad_verifications" : "agency_verifications";
  const { error } = await _client
    .from(table)
    .update({ claimed_by: null, claimed_at: null })
    .eq("id", verificationId);
  if (error) return { error: error.message };
  return { success: true };
};

export const getAllVerifications = async (type = "squad") => {
  const table =
    type === "squad" ? "squad_verifications" : "agency_verifications";
  const { data, error } = await _client
    .from(table)
    .select("*")
    .order("submitted_at", { ascending: false });
  if (error) return { data: [] };
  return { data };
};

export const approveVerification = async (verificationId, userId, name, type) => {
  const table =
    type === "squad" ? "squad_verifications" : "agency_verifications";
  const status = "verified";

  const { error: verError } = await _client
    .from(table)
    .update({ status, reviewed_at: _localDate() })
    .eq("id", verificationId);
  if (verError) return { error: verError.message };

  const { data: ver } = await _client
    .from(table)
    .select("*")
    .eq("id", verificationId)
    .single();

  const { data: user } = await _client
    .from("users")
    .select("profile, name")
    .eq("id", userId)
    .single();

  let updatedProfile = { ...user?.profile };
  let userUpdate = {};

  if (type === "squad") {
    updatedProfile = {
      ...updatedProfile,
      club: ver.team_name || name,
      league: ver.league || null,
      region: ver.region || null,
    };
    userUpdate = { squad_status: "verified", profile: updatedProfile };

    await _client.from("messages").insert({
      from_id: "admin",
      to_id: userId,
      subject: "Squad verified",
      body: `Congratulations! Your squad "${name}" has been verified on HappyFeet. You now have full access to all coaching features.`,
      read: false,
    });

    await _notifyAdmins(
      "Squad approved",
      `Squad "${name}" has been verified. Coach ${user?.name || "The coach"} has been notified.`,
    );
  } else {
    updatedProfile = {
      ...updatedProfile,
      regionsCovered: ver.regions_covered || [],
      targetLeagues: ver.target_leagues || [],
      website: ver.website || null,
    };
    userUpdate = { agency_status: "verified", profile: updatedProfile };

    await _client.from("messages").insert({
      from_id: "admin",
      to_id: userId,
      subject: "Agency verified",
      body: `Congratulations! Your agency "${name}" has been verified on HappyFeet. You now have full access to all scouting features.`,
      read: false,
    });

    await _notifyAdmins(
      "Agency approved",
      `Agency "${name}" has been verified. Scout ${user?.name || "The scout"} has been notified.`,
    );
  }

  const { error: userError } = await _client
    .from("users")
    .update(userUpdate)
    .eq("id", userId);
  if (userError) return { error: userError.message };

  return { success: true };
};

export const rejectVerification = async (
  verificationId,
  userId,
  name,
  reason,
  type,
) => {
  const table =
    type === "squad" ? "squad_verifications" : "agency_verifications";
  const statusField = type === "squad" ? "squad_status" : "agency_status";
  const entityLabel = type === "squad" ? "squad" : "agency";

  const { error: verError } = await _client
    .from(table)
    .update({
      status: "rejected",
      reviewed_at: _localDate(),
      rejection_reason: reason,
    })
    .eq("id", verificationId);
  if (verError) return { error: verError.message };

  const { error: userError } = await _client
    .from("users")
    .update({ [statusField]: "rejected" })
    .eq("id", userId);
  if (userError) return { error: userError.message };

  await _client.from("messages").insert({
    from_id: "admin",
    to_id: userId,
    subject: `${type === "squad" ? "Squad" : "Agency"} verification update`,
    body: `Unfortunately your ${entityLabel} "${name}" could not be verified. Reason: ${reason}. Please resubmit with updated information.`,
    read: false,
  });

  const { data: user } = await _client
    .from("users")
    .select("name")
    .eq("id", userId)
    .single();

  await _notifyAdmins(
    `${type === "squad" ? "Squad" : "Agency"} rejected`,
    `${type === "squad" ? "Squad" : "Agency"} "${name}" was rejected. Reason: ${reason}. ${user?.name || "User"} has been notified.`,
  );

  return { success: true };
};

export const getCoachVerification = async (coachId) => {
  const { data, error } = await _client
    .from("squad_verifications")
    .select("*")
    .eq("coach_id", coachId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { data: null };
  return { data };
};

export const acceptVerificationEdits = async (verificationId) => {
  const { data: ver } = await _client
    .from("squad_verifications")
    .select("*")
    .eq("id", verificationId)
    .single();

  const { error } = await _client
    .from("squad_verifications")
    .update({
      team_name: ver.edited_team_name || ver.team_name,
      league: ver.edited_league || ver.league,
      founding_year: ver.edited_founding_year || ver.founding_year,
      home_ground: ver.edited_home_ground || ver.home_ground,
      status: "verified",
      reviewed_at: _localDate(),
      edited_team_name: null,
      edited_league: null,
      edited_founding_year: null,
      edited_home_ground: null,
      admin_notes: null,
    })
    .eq("id", verificationId);

  if (error) return { error: error.message };

  // update coach squad_status to verified
  const { error: userError } = await _client
    .from("users")
    .update({ squad_status: "verified" })
    .eq("id", ver.coach_id);

  if (userError) return { error: userError.message };

  await _client.from("messages").insert({
    from_id: "admin",
    to_id: ver.coach_id,
    subject: "Squad verified",
    body: `Your squad "${ver.edited_team_name || ver.team_name}" has been verified on HappyFeet. You now have full access to all coaching features.`,
    read: false,
  });

  await _notifyAdmins(
    "Coach accepted edits",
    `The coach has accepted your changes to "${ver.edited_team_name || ver.team_name}". The verification is back to verified.`,
  );

  return { success: true };
};
export const declineVerificationEdits = async (verificationId) => {
  const { data: ver } = await _client
    .from("squad_verifications")
    .select("*")
    .eq("id", verificationId)
    .single();

  const { error } = await _client
    .from("squad_verifications")
    .update({
      status: "rejected",
      rejection_reason: "Coach declined admin changes.",
      edited_team_name: null,
      edited_league: null,
      edited_founding_year: null,
      edited_home_ground: null,
      admin_notes: null,
      reviewed_at: _localDate(),
    })
    .eq("id", verificationId);

  if (error) return { error: error.message };

  // update user squad_status to rejected
  const { error: userError } = await _client
    .from("users")
    .update({ squad_status: "rejected" })
    .eq("id", ver.coach_id);

  if (userError) return { error: userError.message };

  await _notifyAdmins(
    "Coach declined edits",
    `The coach declined your changes to "${ver.team_name}". Reason: Coach declined admin changes.`,
  );

  return { success: true };
};
export const saveVerificationEdits = async (verificationId, coachId, data) => {
  const { error } = await _client
    .from("squad_verifications")
    .update({
      edited_team_name: data.teamName,
      edited_league: data.league,
      edited_founding_year: data.year || null,
      edited_home_ground: data.ground || null,
      admin_notes: data.notes || null,
      status: "awaiting_coach_approval",
    })
    .eq("id", verificationId);

  if (error) return { error: error.message };

  // also update the coach's squad_status in users table
  const { error: userError } = await _client
    .from("users")
    .update({ squad_status: "awaiting_coach_approval" })
    .eq("id", coachId);

  if (userError) return { error: userError.message };

  await _client.from("messages").insert({
    from_id: "admin",
    to_id: coachId,
    subject: "Squad registration update",
    body: `An admin has reviewed your squad registration for "${data.originalName}" and made some changes. ${data.notes ? "Note: " + data.notes + "." : ""} Please check your messages and accept or decline the changes.`,
    read: false,
  });

  // notify all admins
  await _notifyAdmins(
    "Squad verification edited",
    `Admin edited the squad registration for "${data.originalName}". Awaiting coach approval.`,
  );

  return { success: true };
};

export const deleteAdminVerificationMessage = async (userId) => {
  await _client
    .from("messages")
    .delete()
    .eq("to_id", userId)
    .eq("from_id", "admin")
    .eq("subject", "Squad registration update")
    .limit(1);
};

export const updateTeamSize = async (coachId, delta) => {
  const { data: user } = await _client
    .from("users")
    .select("profile")
    .eq("id", coachId)
    .single();

  const currentSize = user?.profile?.teamSize || 0;
  const newSize = Math.max(0, currentSize + delta);
  const updatedProfile = { ...user?.profile, teamSize: newSize };

  const { error } = await _client
    .from("users")
    .update({ profile: updatedProfile })
    .eq("id", coachId);

  if (error) return { error: error.message };
  return { success: true };
};

export const toggleRecruitment = async (userId, value) => {
  const { error } = await _client
    .from("users")
    .update({ open_for_recruitment: value })
    .eq("id", userId);
  if (error) return { error: error.message };
  return { success: true };
};

export const updateVerificationStatus = async (userId, type, status) => {
  const field = type === "squad" ? "squad_status" : "agency_status";
  const { error } = await _client
    .from("users")
    .update({ [field]: status })
    .eq("id", userId);
  if (error) return { error: error.message };
  return { success: true };
};

export const setJerseyNumber = async (coachId, playerId, number) => {
  // check for duplicate number on another player
  if (number) {
    const { data: existing } = await _client
      .from("squad_invites")
      .select("player_id")
      .eq("coach_id", coachId)
      .eq("jersey_number", number)
      .eq("status", "accepted")
      .neq("player_id", playerId)
      .maybeSingle();
    if (existing)
      return {
        error: `Jersey #${number} is already assigned to another player.`,
      };
  }

  const { error } = await _client
    .from("squad_invites")
    .update({ jersey_number: number || null })
    .eq("coach_id", coachId)
    .eq("player_id", playerId)
    .eq("status", "accepted");
  if (error) return { error: error.message };
  return { success: true };
};
