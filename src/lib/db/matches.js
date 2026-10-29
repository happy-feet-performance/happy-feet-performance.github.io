// Matches, match requests, lineups and stats.
import { _client } from "./core.js";
import { _sendMessage } from "./messages.js";

export const createMatch = async (
  coachId,
  { opponent, location, date, playerStats },
) => {
  const { data, error } = await _client
    .from("matches")
    .insert({
      coach_id: coachId,
      opponent,
      location,
      date,
      player_stats: playerStats || {},
    })
    .select()
    .single();
  if (error) return { error: error.message };
  return { data };
};

export const getCoachMatches = async (coachId) => {
  const { data, error } = await _client
    .from("matches")
    .select("*")
    .eq("coach_id", coachId)
    .order("date", { ascending: false });
  if (error) return { data: [] };
  return { data };
};

export const getPlayerMatches = async (playerId) => {
  const { data, error } = await _client
    .from("matches")
    .select("*")
    .not("result", "is", null)
    .order("date", { ascending: false });
  if (error) return { data: [] };
  // filter to matches where player has stats
  const filtered = (data || []).filter((m) => m.player_stats?.[playerId]);
  return { data: filtered };
};

export const logMatchResult = async (matchId, result) => {
  const { error } = await _client
    .from("matches")
    .update({ result })
    .eq("id", matchId);
  if (error) return { error: error.message };
  return { success: true };
};

export const updateMatchPlayerStats = async (matchId, playerId, stats) => {
  const { data: match } = await _client
    .from("matches")
    .select("player_stats")
    .eq("id", matchId)
    .single();

  const updatedStats = { ...(match?.player_stats || {}), [playerId]: stats };
  const { error } = await _client
    .from("matches")
    .update({ player_stats: updatedStats })
    .eq("id", matchId);
  if (error) return { error: error.message };

  // update running totals on player's row
  await _recalcPlayerMatchStats(playerId);
  return { success: true };
};

export const _recalcPlayerMatchStats = async (playerId) => {
  const { data: matches } = await getPlayerMatches(playerId);
  const totals = {
    goals: 0,
    assists: 0,
    shots: 0,
    saves: 0,
    yellow_cards: 0,
    red_cards: 0,
    matches_played: 0,
    minutes_played: 0,
  };
  (matches || []).forEach((m) => {
    const s = m.player_stats?.[playerId] || {};
    totals.goals += s.goals || 0;
    totals.assists += s.assists || 0;
    totals.shots += s.shots || 0;
    totals.saves += s.saves || 0;
    totals.yellow_cards += s.yellow_cards || 0;
    totals.red_cards += s.red_cards || 0;
    totals.minutes_played += s.minutes || 0;
    totals.matches_played += 1;
  });
  await _client
    .from("users")
    .update({ match_stats: totals })
    .eq("id", playerId);
};

export const getCoachWDL = async (coachId) => {
  const { data, error } = await _client
    .from("matches")
    .select("result")
    .eq("coach_id", coachId)
    .not("result", "is", null);
  if (error) return { W: 0, D: 0, L: 0, total: 0 };
  const W = data.filter((m) => m.result === "W").length;
  const D = data.filter((m) => m.result === "D").length;
  const L = data.filter((m) => m.result === "L").length;
  return { W, D, L, total: data.length };
};

export const adminVerifyMatch = async (matchId, result, notes) => {
  const { error } = await _client
    .from("matches")
    .update({ result, admin_verified: true, admin_notes: notes || null })
    .eq("id", matchId);
  if (error) return { error: error.message };
  return { success: true };
};

export const getPendingMatchVerifications = async () => {
  const { data, error } = await _client
    .from("matches")
    .select("*, coach:users!matches_coach_id_fkey(id, name, profile)")
    .not("result", "is", null)
    .eq("admin_verified", false)
    .order("created_at", { ascending: false });
  if (error) return { data: [] };
  return { data };
};

export const sendMatchRequest = async (
  coachId,
  matchId,
  opponentCoachId,
  matchDate,
  opponentName,
) => {
  // update match with opponent coach id and pending status atomically
  const { error } = await _client
    .from("matches")
    .update({
      opponent_coach_id: opponentCoachId,
      match_status: "pending",
      coach_confirmed: true,
      opponent_confirmed: null, // not yet responded
    })
    .eq("id", matchId);
  if (error) return { error: error.message };

  // fetch both coaches in parallel
  const [{ data: coach }, { data: opponentCoach }] = await Promise.all([
    _client.from("users").select("name, profile").eq("id", coachId).single(),
    _client
      .from("users")
      .select("name, profile")
      .eq("id", opponentCoachId)
      .single(),
  ]);

  const coachName = coach?.name || "A coach";
  const clubName = coach?.profile?.club || "Unknown club";
  const opponentCoachName = opponentCoach?.name || "Coach";
  const dateLabel = new Date(matchDate + "T00:00:00").toLocaleDateString(
    "en-GB",
    { weekday: "long", day: "numeric", month: "long" },
  );

  // notify opponent coach
  await _sendMessage(
    "system",
    opponentCoachId,
    `Match request: ${clubName} vs ${opponentName}`,
    `${coachName} (${clubName}) has requested a match against ${opponentName} on ${dateLabel}.\n\nGo to your Training page to approve or decline.\n\nYou have 24 hours to respond before the request expires.`,
  );

  // confirm to requesting coach
  await _sendMessage(
    "system",
    coachId,
    `Match request sent to ${opponentName}`,
    `Your match request to ${opponentName} on ${dateLabel} has been sent. ${opponentCoachName} has 24 hours to approve or decline.`,
  );

  return { success: true };
};

export const respondMatchRequest = async (matchId, opponentCoachId, approve) => {
  if (!approve) {
    const { error } = await _client
      .from("matches")
      .update({ match_status: "declined", opponent_confirmed: false })
      .eq("id", matchId);
    if (error) return { error: error.message };
    return { success: true };
  }

  // fetch full match to get date and opponent name
  const { data: match } = await _client
    .from("matches")
    .select("*, coach:users!matches_coach_id_fkey(name, profile)")
    .eq("id", matchId)
    .single();

  if (!match) return { error: "Match not found" };

  // only confirm if requesting coach has also confirmed
  const bothConfirmed = match?.coach_confirmed === true;
  const newStatus = bothConfirmed ? "confirmed" : "pending";

  // guard: if already confirmed or declined don't re-process
  if (
    match?.match_status === "confirmed" ||
    match?.match_status === "declined"
  ) {
    return { success: true, confirmed: match.match_status === "confirmed" };
  }

  const { error } = await _client
    .from("matches")
    .update({
      opponent_confirmed: true,
      match_status: newStatus,
    })
    .eq("id", matchId);
  if (error) return { error: error.message };

  // write match day to opponent coach's training schedule + sessions
  if (opponentCoachId && bothConfirmed) {
    const { data: training } = await _client
      .from("training")
      .select("*")
      .eq("user_id", opponentCoachId)
      .maybeSingle();

    const existingData = training?.data || {};
    const schedule = existingData.schedule || {};
    const sessions = existingData.sessions || [];

    // set Match type on that date
    schedule[match.date] = "Match";

    // add session entry if not already there
    const alreadyExists = sessions.some(
      (ss) => ss.date === match.date || ss.matchId === matchId,
    );
    if (!alreadyExists) {
      sessions.unshift({
        name: `vs ${match.coach?.profile?.club || match.coach?.name || "Opponent"}`,
        category: "Match",
        dayIndex: new Date(match.date + "T00:00:00").getDay(),
        date: match.date,
        matchId: matchId,
        opponent: match.coach?.profile?.club || match.coach?.name,
        location: match.location,
        venueType: match.venue_type || "away",
        createdAt: new Date().toISOString(),
      });
    }

    // upsert training row
    if (training) {
      await _client
        .from("training")
        .update({ data: { ...existingData, schedule, sessions } })
        .eq("user_id", opponentCoachId);
    } else {
      await _client
        .from("training")
        .insert({ user_id: opponentCoachId, data: { schedule, sessions } });
    }
  }

  return { success: true, confirmed: bothConfirmed };
};

export const confirmMatchAsCoach = async (matchId) => {
  const { data: match } = await _client
    .from("matches")
    .select("opponent_confirmed")
    .eq("id", matchId)
    .single();

  const bothConfirmed = match?.opponent_confirmed === true;
  const { error } = await _client
    .from("matches")
    .update({
      coach_confirmed: true,
      match_status: bothConfirmed ? "confirmed" : "pending",
    })
    .eq("id", matchId);
  if (error) return { error: error.message };
  return { success: true, confirmed: bothConfirmed };
};

export const getPendingMatchRequests = async (coachId) => {
  // matches where this coach is the opponent and hasn't responded
  const { data, error } = await _client
    .from("matches")
    .select("*, coach:users!matches_coach_id_fkey(id, name, profile)")
    .eq("opponent_coach_id", coachId)
    .eq("match_status", "pending")
    .is("opponent_confirmed", null)
    .order("date", { ascending: true });
  if (error) return { data: [] };
  return { data };
};

export const getOpponentSquad = async (matchId, forCoachId) => {
  // get match to determine which side this coach is on
  const { data: match } = await _client
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (!match || match.match_status !== "confirmed") return { data: null };

  // determine opponent coach id from this coach's perspective
  const opponentCoachId =
    match.coach_id === forCoachId ? match.opponent_coach_id : match.coach_id;

  if (!opponentCoachId) return { data: null };

  const { data: players } = await _client
    .from("squad_invites")
    .select(
      "player_id, player:users!squad_invites_player_id_fkey(id, name, profile, match_stats)",
    )
    .eq("coach_id", opponentCoachId)
    .eq("status", "accepted");

  // only return starting XI, or players with minutes > 0 in this match
  const stats =
    match.coach_id === forCoachId
      ? match.opponent_player_stats
      : match.player_stats;

  const starters = (players || []).filter((p) => {
    const s = stats?.[p.player_id];
    return !s || (s.minutes ?? 90) > 0;
  });

  return { data: starters };
};

// fix teamSize to always count from squad_invites not profile JSONB
export const getAccurateTeamSize = async (coachId) => {
  const { count, error } = await _client
    .from("squad_invites")
    .select("*", { count: "exact", head: true })
    .eq("coach_id", coachId)
    .eq("status", "accepted");
  if (error) return 0;
  return count || 0;
};

export const saveMatchLineup = async (matchId, coachId, lineup) => {
  // lineup = { player_id: { role: "starter"|"sub", sub_off_min: null } }
  const { data: match } = await _client
    .from("matches")
    .select("coach_id, player_stats, opponent_player_stats")
    .eq("id", matchId)
    .single();
  if (!match) return { error: "Match not found" };

  const isHomeCoach = match.coach_id === coachId;
  const field = isHomeCoach ? "player_stats" : "opponent_player_stats";

  // merge lineup into existing stats preserving post-match metrics
  const existing = match[field] || {};
  const merged = {};
  Object.entries(lineup).forEach(([pid, data]) => {
    merged[pid] = { ...(existing[pid] || {}), ...data };
  });

  const { error } = await _client
    .from("matches")
    .update({ [field]: merged })
    .eq("id", matchId);
  if (error) return { error: error.message };
  return { success: true };
};

export const saveMatchPostStats = async (matchId, coachId, stats) => {
  // stats = { player_id: { goals, assists, shots, saves, tackles, yellow_cards, red_cards, minutes, sub_on_min, sub_off_min } }
  const { data: match } = await _client
    .from("matches")
    .select("coach_id, player_stats, opponent_player_stats")
    .eq("id", matchId)
    .single();
  if (!match) return { error: "Match not found" };

  const isHomeCoach = match.coach_id === coachId;
  const field = isHomeCoach ? "player_stats" : "opponent_player_stats";

  const existing = match[field] || {};
  const merged = {};
  Object.entries(stats).forEach(([pid, data]) => {
    merged[pid] = { ...(existing[pid] || {}), ...data };
  });

  const { error } = await _client
    .from("matches")
    .update({ [field]: merged })
    .eq("id", matchId);
  if (error) return { error: error.message };

  // update running totals for each player
  for (const pid of Object.keys(stats)) {
    await _recalcPlayerMatchStats(pid);
  }
  return { success: true };
};

export const getMatchById = async (matchId) => {
  const { data, error } = await _client
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();
  if (error) return { data: null };
  return { data };
};

export const submitLineup = async (matchId, coachId, lineup) => {
  const { data: match } = await _client
    .from("matches")
    .select(
      "coach_id, opponent_coach_id, date, opponent, player_stats, opponent_player_stats",
    )
    .eq("id", matchId)
    .single();
  if (!match) return { error: "Match not found" };

  const isHomeCoach = match.coach_id === coachId;
  const field = isHomeCoach ? "player_stats" : "opponent_player_stats";
  const submittedField = isHomeCoach
    ? "coach_lineup_submitted"
    : "opponent_lineup_submitted";

  // merge lineup into existing stats
  const existing = match[field] || {};
  const merged = {};
  Object.entries(lineup).forEach(([pid, data]) => {
    merged[pid] = { ...(existing[pid] || {}), ...data };
  });

  const matchDate = new Date(match.date + "T00:00:00");
  const deadline = new Date(matchDate.getTime() - 24 * 60 * 60 * 1000);

  // only set deadline if not already set AND deadline is in the future
  const shouldSetDeadline = !match.lineup_deadline && deadline > new Date();

  const { error } = await _client
    .from("matches")
    .update({
      [field]: merged,
      [submittedField]: true,
      ...(shouldSetDeadline
        ? { lineup_deadline: deadline.toISOString() }
        : {}),
    })
    .eq("id", matchId);

  if (error) return { error: error.message };

  const notifyId =
    match.match_status === "confirmed"
      ? isHomeCoach
        ? match.opponent_coach_id
        : match.coach_id
      : null;
  if (notifyId) {
    const { data: coach } = await _client
      .from("users")
      .select("name, profile")
      .eq("id", coachId)
      .single();
    const clubName = coach?.profile?.club || coach?.name || "Your opponent";
    await _sendMessage(
      "system",
      notifyId,
      `${clubName} submitted their lineup`,
      `${clubName} has submitted their lineup for the match on ${matchDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}.\n\nRemember to submit your lineup at least 24 hours before the match or your team will forfeit.`,
    );
  }

  return { success: true };
};

export const cancelMatch = async (matchId, cancellingCoachId) => {
  const { data: match } = await _client
    .from("matches")
    .select("coach_id, opponent_coach_id, opponent, date")
    .eq("id", matchId)
    .single();
  if (!match) return { error: "Match not found" };

  const { error } = await _client
    .from("matches")
    .update({ match_status: "declined", result: null })
    .eq("id", matchId);
  if (error) return { error: error.message };

  // notify the other coach
  const { data: cancellingCoach } = await _client
    .from("users")
    .select("name, profile")
    .eq("id", cancellingCoachId)
    .single();
  const clubName =
    cancellingCoach?.profile?.club || cancellingCoach?.name || "A coach";
  const notifyId =
    match.coach_id === cancellingCoachId
      ? match.opponent_coach_id
      : match.coach_id;

  if (notifyId) {
    await _sendMessage(
      "system",
      notifyId,
      `Match cancelled: ${match.opponent}`,
      `${clubName} has cancelled the match scheduled for ${new Date(match.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}.`,
    );
  }

  return { success: true };
};

export const checkLineupDeadlines = async (coachId) => {
  // client-side fallback for pg_cron
  const now = new Date();
  const { data: matches } = await _client
    .from("matches")
    .select("*")
    .eq("match_status", "confirmed")
    .is("result", null)
    .or(`coach_id.eq.${coachId},opponent_coach_id.eq.${coachId}`);

  for (const match of matches || []) {
    if (!match.lineup_deadline) continue;

    const deadline = new Date(match.lineup_deadline);
    const warningTime = new Date(deadline.getTime() - 2 * 60 * 60 * 1000);
    const isHomeCoach = match.coach_id === coachId;
    const mySubmitted = isHomeCoach
      ? match.coach_lineup_submitted
      : match.opponent_lineup_submitted;

    // send 2hr warning only if deadline is still in the future
    if (
      now >= warningTime &&
      now < deadline &&
      !match.forfeit_warning_sent &&
      !mySubmitted
    ) {
      await _sendMessage(
        "system",
        coachId,
        "Lineup deadline warning: 2 hours left",
        `You have 2 hours to submit your lineup for the match against ${match.opponent} on ${new Date(match.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}. If you don't submit, your team will forfeit.`,
      );
      await _client
        .from("matches")
        .update({ forfeit_warning_sent: true })
        .eq("id", match.id);
      continue;
    }

    // apply forfeit only if deadline has genuinely passed
    if (now < deadline) continue;
    if (match.forfeit_notified) continue;

    const coachSubmitted = match.coach_lineup_submitted;
    const opponentSubmitted = match.opponent_lineup_submitted;
    let myResult, reason;

    if (!coachSubmitted && !opponentSubmitted) {
      myResult = "D";
      reason =
        "Both teams failed to submit lineups by the deadline. Match recorded as a draw.";
    } else if (!coachSubmitted) {
      myResult = isHomeCoach ? "L" : "W";
      reason = "Requesting team forfeited by not submitting their lineup.";
    } else {
      myResult = isHomeCoach ? "W" : "L";
      reason = "Opponent forfeited by not submitting their lineup.";
    }

    await _client
      .from("matches")
      .update({
        result: myResult,
        forfeit_notified: true,
        match_status: "completed",
        admin_notes: "Auto-applied forfeit: " + reason,
      })
      .eq("id", match.id);

    await _sendMessage(
      "system",
      coachId,
      "Match result auto-applied",
      reason +
        "\n\nYour result: " +
        (myResult === "W"
          ? "Win"
          : myResult === "D"
            ? "Draw"
            : "Loss (forfeit)"),
    );
  }
};

export const getMatchForOpponentCoach = async (coachId, dateISO) => {
  const { data, error } = await _client
    .from("matches")
    .select("*, coach:users!matches_coach_id_fkey(id, name, profile)")
    .eq("opponent_coach_id", coachId)
    .eq("date", dateISO)
    .in("match_status", ["pending", "confirmed", "completed"])
    .maybeSingle();
  if (error) return { data: null };
  if (!data) {
    // also check by date range in case of timezone offset
    const { data: fallback } = await _client
      .from("matches")
      .select("*, coach:users!matches_coach_id_fkey(id, name, profile)")
      .eq("opponent_coach_id", coachId)
      .gte("date", dateISO)
      .lte("date", dateISO)
      .in("match_status", ["pending", "confirmed", "completed"])
      .maybeSingle();
    return { data: fallback };
  }
  return { data };
};

export const getIncomingMatchesForCoach = async (coachId) => {
  const { data, error } = await _client
    .from("matches")
    .select("*, coach:users!matches_coach_id_fkey(id, name, profile)")
    .eq("opponent_coach_id", coachId)
    .in("match_status", ["pending", "confirmed", "completed"])
    .order("date", { ascending: true });
  if (error) return { data: [] };
  return { data: data || [] };
};
