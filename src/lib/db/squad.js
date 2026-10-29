// Squads, invites and verified teams.
import { _client, _localDate } from "./core.js";
import { getAccurateTeamSize } from "./matches.js";
import { _sendMessage } from "./messages.js";
import { getAdminIds } from "./users.js";

export const getSquadPlayers = async (coachId) => {
  const { data, error } = await _client
    .from("squad_invites")
    .select("*, player:users!squad_invites_player_id_fkey(id, name, profile)")
    .eq("coach_id", coachId)
    .eq("status", "accepted")
    .order("jersey_number", { ascending: true, nullsFirst: false });
  if (error) return { data: [] };
  return { data };
};

export const getCoachSquadDetails = async (coachId) => {
  const { data: squadPlayers, error } = await _client
    .from("squad_invites")
    .select(
      "player_id, player:users!squad_invites_player_id_fkey(id, name, profile)",
    )
    .eq("coach_id", coachId)
    .eq("status", "accepted");
  if (error) return { data: [] };
  return { data: squadPlayers || [] };
};

export const getSquadReadiness = async (coachId) => {
  const { data: squadPlayers } = await _client
    .from("squad_invites")
    .select(
      "player_id, player:users!squad_invites_player_id_fkey(id, name, profile)",
    )
    .eq("coach_id", coachId)
    .eq("status", "accepted");

  if (!squadPlayers || squadPlayers.length === 0)
    return {
      data: {
        score: 0,
        total: 0,
        avgRating: 0,
        wellnessRate: 0,
        readyRate: 0,
        checkedInCount: 0,
        readyCount: 0,
        ratedCount: 0,
      },
    };

  const today = _localDate();
  let totalRating = 0,
    ratedCount = 0;
  let checkedInCount = 0,
    readyCount = 0,
    alertCount = 0;

  for (const sp of squadPlayers) {
    // get latest session rating
    const { data: rating } = await _client
      .from("session_ratings")
      .select("overall")
      .eq("player_id", sp.player_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rating) {
      totalRating += rating.overall;
      ratedCount++;
    }

    // get today's health log
    const { data: health } = await _client
      .from("health_logs")
      .select("energy, mood, sleep, soreness, hydration")
      .eq("player_id", sp.player_id)
      .eq("date", today)
      .maybeSingle();

    if (health) {
      checkedInCount++;
      const avg = Math.round(
        (health.energy +
          health.mood +
          health.sleep +
          (10 - health.soreness) +
          health.hydration) /
          5,
      );
      if (avg >= 8) readyCount++;
      else if (avg < 6) alertCount++;
    }
  }

  const total = squadPlayers.length;
  const avgRating = ratedCount ? Math.round(totalRating / ratedCount) : 0;
  const wellnessRate = total ? Math.round((checkedInCount / total) * 100) : 0;
  const readyRate = checkedInCount
    ? Math.round((readyCount / checkedInCount) * 100)
    : 0;

  // weighted score: 40% performance, 30% wellness participation, 30% readiness
  const score = Math.round(
    avgRating * 0.4 + wellnessRate * 0.3 + readyRate * 0.3,
  );

  return {
    data: {
      score,
      total,
      avgRating,
      wellnessRate,
      readyRate,
      checkedInCount,
      readyCount,
      ratedCount,
      alertCount,
    },
  };
};

export const removePlayerFromSquad = async (coachId, playerId, reason) => {
  // update invite status to removed
  const { error: inviteError } = await _client
    .from("squad_invites")
    .update({ status: "removed" })
    .eq("coach_id", coachId)
    .eq("player_id", playerId);
  if (inviteError) return { error: inviteError.message };

  // reset player club and status
  const { data: player } = await _client
    .from("users")
    .select("profile")
    .eq("id", playerId)
    .single();

  if (player) {
    const updatedProfile = {
      ...player.profile,
      club: null,
      status: "unattached",
    };
    await _client
      .from("users")
      .update({ profile: updatedProfile })
      .eq("id", playerId);
  }

  // notify player
  await _client.from("messages").insert({
    from_id: coachId,
    to_id: playerId,
    subject: "Removed from squad",
    body: `You have been removed from the squad. Reason: ${reason}.`,
    read: false,
  });

  return { success: true };
};

export const sendSquadInvite = async (coachId, playerId, squadName) => {
  // check if invite already exists
  const { data: existing } = await _client
    .from("squad_invites")
    .select("id, status, declined_at")
    .eq("coach_id", coachId)
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    if (existing.status === "pending") {
      return { error: "An invite has already been sent to this player." };
    }
    if (existing.status === "accepted") {
      return { error: "This player is already in your squad." };
    }
    if (existing.status === "declined" && existing.declined_at) {
      const declinedAt = new Date(existing.declined_at);
      const hoursPassed =
        (Date.now() - declinedAt.getTime()) / (1000 * 60 * 60);
      if (hoursPassed < 24) {
        const hoursLeft = Math.ceil(24 - hoursPassed);
        return {
          error: `This player declined your invite. You can send another in ${hoursLeft} hour${hoursLeft > 1 ? "s" : ""}.`,
        };
      }
    }
  }

  const { error } = await _client.from("squad_invites").insert({
    coach_id: coachId,
    player_id: playerId,
    squad_name: squadName,
    status: "pending",
  });
  if (error) return { error: error.message };

  // fetch coach name
  const { data: coach } = await _client
    .from("users")
    .select("name")
    .eq("id", coachId)
    .single();
  const coachName = coach?.name || "A coach";

  await _client.from("messages").insert({
    from_id: "system",
    to_id: playerId,
    subject: "Squad invite",
    body: `${coachName} has invited you to join ${squadName}. Go to your messages to accept or decline.`,
    read: false,
  });

  return { success: true };
};

export const getSquadInvites = async (playerId) => {
  const { data, error } = await _client
    .from("squad_invites")
    .select("*, coach:users!squad_invites_coach_id_fkey(id, name, profile)")
    .eq("player_id", playerId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) return { data: [] };
  return { data };
};

export const getCoachInvites = async (coachId) => {
  const { data, error } = await _client
    .from("squad_invites")
    .select("player_id, status, declined_at")
    .eq("coach_id", coachId);
  if (error) return { data: [] };
  return { data };
};

export const respondToInvite = async (
  inviteId,
  playerId,
  accept,
  squadName,
  coachId,
) => {
  const status = accept ? "accepted" : "declined";

  const { error } = await _client
    .from("squad_invites")
    .update({
      status,
      responded_at: _localDate(),
      declined_at: !accept ? new Date().toISOString() : null,
    })
    .eq("id", inviteId);
  if (error) return { error: error.message };

  // fetch player name
  const { data: player } = await _client
    .from("users")
    .select("name")
    .eq("id", playerId)
    .single();
  const playerName = player?.name || "A player";

  if (accept) {
    const { data: playerProfile } = await _client
      .from("users")
      .select("profile")
      .eq("id", playerId)
      .single();

    const updatedProfile = {
      ...playerProfile.profile,
      club: squadName,
      status: "signed",
    };
    await _client
      .from("users")
      .update({ profile: updatedProfile })
      .eq("id", playerId);

    // notify coach
    await _client.from("messages").insert({
      from_id: "system",
      to_id: coachId,
      subject: "Invite accepted",
      body: `${playerName} has accepted your invite to join ${squadName}.`,
      read: false,
    });

    // confirm to player
    await _client.from("messages").insert({
      from_id: "system",
      to_id: playerId,
      subject: "Welcome to the squad!",
      body: `You have successfully joined ${squadName}. Your coach will be in touch. Good luck!`,
      read: false,
    });
  } else {
    await _client.from("messages").insert({
      from_id: "system",
      to_id: coachId,
      subject: "Invite declined",
      body: `${playerName} has declined your invite to join ${squadName}. You can send another invite after 24 hours.`,
      read: false,
    });

    // confirm to player
    await _client.from("messages").insert({
      from_id: "system",
      to_id: playerId,
      subject: "Invite declined",
      body: `You have declined the invite to join ${squadName}. You can still receive invites from other coaches.`,
      read: false,
    });
  }

  return { success: true };
};

export const getPlayerCurrentCoach = async (playerId) => {
  const { data, error } = await _client
    .from("squad_invites")
    .select("coach_id, jersey_number")
    .eq("player_id", playerId)
    .eq("status", "accepted")
    .maybeSingle();
  if (error) return { data: null };
  return { data };
};

export const leaveSquad = async (playerId) => {
  const { error } = await _client
    .from("squad_invites")
    .update({ status: "left" })
    .eq("player_id", playerId)
    .eq("status", "accepted");
  if (error) return { error: error.message };

  // clear club from player profile
  const { data: user } = await _client
    .from("users")
    .select("profile")
    .eq("id", playerId)
    .maybeSingle();

  const updatedProfile = {
    ...(user?.profile || {}),
    club: null,
    status: "unattached",
  };

  const { error: pe } = await _client
    .from("users")
    .update({ profile: updatedProfile })
    .eq("id", playerId);

  if (pe) return { error: pe.message };
  return { success: true };
};

export const getVerifiedCoaches = async (openOnly = false) => {
  let query = _client
    .from("users")
    .select("id, name, profile, squad_status")
    .eq("role", "coach")
    .eq("squad_status", "verified")
    .order("name", { ascending: true });

  if (openOnly) query = query.eq("open_for_recruitment", true);

  const { data, error } = await query;
  if (error) return { data: [] };

  const enriched = await Promise.all(
    (data || []).map(async (coach) => {
      const size = await getAccurateTeamSize(coach.id);
      return { ...coach, profile: { ...coach.profile, teamSize: size } };
    }),
  );

  return { data: enriched };
};

export const getVerifiedCoachesRaw = async () => {
  const { data, error } = await _client
    .from("users")
    .select("id, name, profile, squad_status")
    .eq("role", "coach")
    .eq("squad_status", "verified")
    .order("name", { ascending: true });
  if (error) return { data: [] };
  return { data };
};

export const getVerifiedTeams = async () => {
  const { data, error } = await _client
    .from("users")
    .select("id, name, profile, squad_status")
    .eq("role", "coach")
    .eq("squad_status", "verified")
    .order("name", { ascending: true });
  if (error) return { data: [] };

  // also fetch home grounds from squad_verifications
  const coachIds = (data || []).map((c) => c.id);
  const { data: verifs } = await _client
    .from("squad_verifications")
    .select("coach_id, home_ground")
    .in("coach_id", coachIds)
    .eq("status", "verified");

  const groundMap = {};
  (verifs || []).forEach((v) => {
    groundMap[v.coach_id] = v.home_ground;
  });

  return {
    data: (data || []).map((c) => ({
      id: c.id,
      name: c.profile?.club || c.name,
      homeGround: groundMap[c.id] || null,
    })),
  };
};

export const submitUnverifiedOpponent = async (
  coachId,
  matchId,
  opponent,
  matchDate,
) => {
  // mark match as pending opponent approval
  await _client
    .from("matches")
    .update({ opponent_approved: false })
    .eq("id", matchId);

  const { data: coach } = await _client
    .from("users")
    .select("name, profile")
    .eq("id", coachId)
    .single();
  const coachName = coach?.name || "A coach";
  const clubName = coach?.profile?.club || "Unknown club";

  const adminIds = await getAdminIds();
  for (const adminId of adminIds || []) {
    await _sendMessage(
      "system",
      adminId,
      "Unverified opponent: approval needed",
      `${coachName} (${clubName}) logged a match against an unverified opponent: "${opponent}" on ${matchDate}.\n\nMatch ID: ${matchId}\n\nPlease verify this team exists in the admin dashboard and approve or reject.`,
    );
  }
  return { success: true };
};

export const getFlaggedProspects = async () => {
  const { data, error } = await _client
    .from("scout_prospects")
    .select(
      `
    *,
    player:users!scout_prospects_player_id_fkey(id, name, profile),
    scout:users!scout_prospects_scout_id_fkey(id, name, profile)
  `,
    )
    .eq("flagged", true)
    .order("created_at", { ascending: false });
  if (error) return { data: [] };

  // add scout agency from profile
  const enriched =
    data?.map((sp) => ({
      ...sp,
      scout_agency: sp.scout?.profile?.org || "",
      scout_id: sp.scout_id,
    })) || [];

  return { data: enriched };
};
