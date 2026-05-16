/* ============================================================
   HappyFeet Performance Hub: db.js
   Supabase database layer
   ============================================================ */

const HF_DB = (() => {
  // ─── Init Supabase client ──────────────────────────────────
  const _client = supabase.createClient(
    HF_CONFIG.SUPABASE_URL,
    HF_CONFIG.SUPABASE_ANON_KEY,
  );

  // ─── Local session ─────────────────────────────────────────
  const getSession = () => {
    try {
      return JSON.parse(sessionStorage.getItem("hf_session") || "null");
    } catch {
      return null;
    }
  };

  const saveSession = (session) => {
    sessionStorage.setItem("hf_session", JSON.stringify(session));
  };

  const clearSession = () => sessionStorage.removeItem("hf_session");

  // ─── Users ─────────────────────────────────────────────────
  const createUser = async (data) => {
    const normalised = data.contact.toLowerCase().replace(/\s/g, "");

    const { data: existing } = await _client
      .from("users")
      .select("id")
      .eq("contact", normalised)
      .maybeSingle();

    if (existing) {
      return {
        error:
          data.contactType === "phone"
            ? "This phone number is already registered."
            : "This email address is already registered.",
      };
    }

    const { data: user, error } = await _client
      .from("users")
      .insert({
        name: data.name,
        contact: normalised,
        contact_type: data.contactType,
        local_phone: data.localPhone || "",
        display_contact: data.displayContact || normalised,
        password: data.password,
        role: data.role,
        profile: data.profile || {},
      })
      .select()
      .single();

    if (error) return { error: error.message };

    // ── Insert default data rows for new user ──────────────────
    const userId = user.id;

    await _client.from("tracker").insert({
      user_id: userId,
      data: {
        sessions: [],
        ratings: { speed: 0, tech: 0, tact: 0, phys: 0 },
        overallRating: null,
        sessionsThisMonth: 0,
        dailyStreak: 0,
      },
    });

    await _client.from("health").insert({
      user_id: userId,
      data: {
        checkins: {},
        injuries: [],
        lastCheckin: null,
      },
    });

    await _client.from("training").insert({
      user_id: userId,
      data: {
        sessions: [],
        schedule: {},
        currentPlan: null,
      },
    });

    await _client.from("scout").insert({
      user_id: userId,
      data: {
        prospects: [],
        placements: [],
        clubs: [
          {
            name: "WAFA SC Academy",
            country: "Ghana",
            tier: "National",
            needs: "CM, ST, CB",
            color: "#C9961A",
          },
          {
            name: "FC Nordsjælland",
            country: "Denmark",
            tier: "European",
            needs: "All positions U17-U21",
            color: "#185FA5",
          },
          {
            name: "Philadelphia Union II",
            country: "USA",
            tier: "MLS Next Pro",
            needs: "CB, ST",
            color: "#c8102e",
          },
        ],
      },
    });

    return { user: _normaliseUser(user) };
  };
  const findUser = async (contactRaw, password) => {
    const contact = contactRaw.toLowerCase().replace(/\s/g, "");
    const { data: users } = await _client
      .from("users")
      .select(
        "*, squad_status, agency_status, banned, ban_reason, kicked, kicked_until",
      )
      .eq("password", password);

    if (!users) return null;
    const user = users.find((u) => {
      const stored = (u.contact || "").toLowerCase().replace(/\s/g, "");
      const local = (u.local_phone || "").replace(/\s/g, "");
      return stored === contact || local === contact;
    });
    return user ? _normaliseUser(user) : null;
  };

  const updateUserProfile = async (userId, profile) => {
    const { data: user, error } = await _client
      .from("users")
      .update({ profile })
      .eq("id", userId)
      .select()
      .single();

    if (error) return { error: error.message };
    return { user: _normaliseUser(user) };
  };

  const updateUserName = async (userId, name) => {
    const { error } = await _client
      .from("users")
      .update({ name })
      .eq("id", userId);
    if (error) return { error: error.message };
    return { success: true };
  };

  // ─── Normalise DB row to app format ────────────────────────
  const _normaliseUser = (u) => ({
    id: u.id,
    name: u.name,
    contact: u.contact,
    contactType: u.contact_type,
    localPhone: u.local_phone,
    displayContact: u.display_contact,
    password: u.password,
    role: u.role,
    profile: u.profile || {},
    created: u.created_at,
    squadStatus: u.squad_status || "unregistered",
    agencyStatus: u.agency_status || "unregistered",
    banned: u.banned || false,
    banReason: u.ban_reason || null,
    kicked: u.kicked || false,
    kickedUntil: u.kicked_until || null,
  });

  // ─── Generic data table helpers ────────────────────────────
  const _getData = async (table, userId) => {
    const { data } = await _client
      .from(table)
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();
    return data?.data || null;
  };

  const _saveData = async (table, userId, payload) => {
    const { data: existing } = await _client
      .from(table)
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await _client
        .from(table)
        .update({ data: payload, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    } else {
      await _client.from(table).insert({ user_id: userId, data: payload });
    }
  };

  // ─── Tracker ───────────────────────────────────────────────
  const getTracker = async (userId) =>
    (await _getData("tracker", userId)) || {};
  const saveTracker = async (userId, data) =>
    await _saveData("tracker", userId, data);

  // ─── Health ────────────────────────────────────────────────
  const getHealth = async (userId) =>
    (await _getData("health", userId)) || { checkins: {}, injuries: [] };
  const saveHealth = async (userId, data) =>
    await _saveData("health", userId, data);

  // ─── Training ──────────────────────────────────────────────
  const getTraining = async (userId) =>
    (await _getData("training", userId)) || { sessions: [], schedule: {} };
  const saveTraining = async (userId, data) =>
    await _saveData("training", userId, data);

  // ─── Scout ─────────────────────────────────────────────────
  const getScout = async (userId) =>
    (await _getData("scout", userId)) || {
      prospects: [],
      placements: [],
      clubs: [
        {
          name: "WAFA SC Academy",
          country: "Ghana",
          tier: "National",
          needs: "CM, ST, CB",
          color: "#C9961A",
        },
        {
          name: "FC Nordsjælland",
          country: "Denmark",
          tier: "European",
          needs: "All positions U17-U21",
          color: "#185FA5",
        },
        {
          name: "Philadelphia Union II",
          country: "USA",
          tier: "MLS Next Pro",
          needs: "CB, ST",
          color: "#c8102e",
        },
      ],
    };
  const saveScout = async (userId, data) =>
    await _saveData("scout", userId, data);

  const submitSquadVerification = async (data) => {
    const { error } = await _client.from("squad_verifications").insert({
      coach_id: data.coachId,
      team_name: data.teamName,
      league: data.league,
      founding_year: data.foundingYear || null,
      home_ground: data.homeGround || null,
      status: "pending",
    });
    if (error) return { error: error.message };

    await _notifyAdmins(
      "New squad verification submitted",
      `A coach has submitted "${data.teamName}" for squad verification.`,
    );

    return { success: true };
  };

  const updateSquadStatus = async (userId, status) => {
    const { error } = await _client
      .from("users")
      .update({ squad_status: status })
      .eq("id", userId);
    if (error) return { error: error.message };
    return { success: true };
  };

  const checkTeamExists = async (teamName) => {
    const { data } = await _client
      .from("squad_verifications")
      .select("id, status")
      .ilike("team_name", teamName)
      .maybeSingle();
    return data || null;
  };

  const getPendingVerifications = async () => {
    const { data, error } = await _client
      .from("squad_verifications")
      .select("*")
      .eq("status", "pending")
      .order("submitted_at", { ascending: true });
    if (error) return { error: error.message };
    return { data };
  };

  const approveSquadVerification = async (
    verificationId,
    coachId,
    teamName,
  ) => {
    // update verification status
    const { error: verError } = await _client
      .from("squad_verifications")
      .update({ status: "verified", reviewed_at: new Date().toISOString() })
      .eq("id", verificationId);
    if (verError) return { error: verError.message };

    // update coach squad status
    const { error: userError } = await _client
      .from("users")
      .update({ squad_status: "verified" })
      .eq("id", coachId);
    if (userError) return { error: userError.message };

    // send notification message to coach
    const { error: msgError } = await _client.from("messages").insert({
      from_id: "admin",
      to_id: coachId,
      subject: "Squad verified",
      body: `Congratulations! Your squad "${teamName}" has been verified on HappyFeet. You now have full access to all coaching features.`,
      read: false,
    });
    if (msgError) return { error: msgError.message };

    await _notifyAdmins(
      "Squad approved",
      `Squad "${teamName}" has been verified. Coach has been notified.`,
    );

    return { success: true };
  };

  const rejectSquadVerification = async (
    verificationId,
    coachId,
    teamName,
    reason,
  ) => {
    // update verification status
    const { error: verError } = await _client
      .from("squad_verifications")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq("id", verificationId);
    if (verError) return { error: verError.message };

    // update coach squad status
    const { error: userError } = await _client
      .from("users")
      .update({ squad_status: "rejected" })
      .eq("id", coachId);
    if (userError) return { error: userError.message };

    // send rejection message to coach
    const { error: msgError } = await _client.from("messages").insert({
      from_id: "admin",
      to_id: coachId,
      subject: "Squad verification update",
      body: `Unfortunately your squad "${teamName}" could not be verified at this time. Reason: ${reason}. Please contact support if you have any questions.`,
      read: false,
    });
    if (msgError) return { error: msgError.message };

    await _notifyAdmins(
      "Squad rejected",
      `Squad "${teamName}" was rejected. Reason: ${reason}. Coach has been notified.`,
    );

    return { success: true };
  };

  const markMessageRead = async (messageId) => {
    await _client.from("messages").update({ read: true }).eq("id", messageId);
  };

  const findAdmin = async (email, password) => {
    const hashedPassword = await HF_UTILS.hashPassword(password);
    const { data, error } = await _client
      .from("admins")
      .select("*")
      .eq("email", email)
      .eq("password", hashedPassword)
      .maybeSingle();
    if (error) return { error: error.message };
    return { data };
  };

  const getAllVerifications = async () => {
    const { data, error } = await _client
      .from("squad_verifications")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) return { data: [] };
    return { data };
  };

  const getAllUsers = async () => {
    const { data, error } = await _client
      .from("users")
      .select(
        "id, name, contact, role, banned, ban_reason, squad_status, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) return { data: [] };
    return { data };
  };

  const kickUser = async (userId) => {
    const kickedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { error } = await _client
      .from("users")
      .update({ kicked: true, kicked_until: kickedUntil })
      .eq("id", userId);
    if (error) return { error: error.message };
    return { success: true };
  };

  const banUser = async (userId, reason) => {
    const { error } = await _client
      .from("users")
      .update({ banned: true, ban_reason: reason })
      .eq("id", userId);
    if (error) return { error: error.message };
    return { success: true };
  };

  const unbanUser = async (userId) => {
    const { error } = await _client
      .from("users")
      .update({ banned: false, ban_reason: null })
      .eq("id", userId);
    if (error) return { error: error.message };
    return { success: true };
  };

  const removeUser = async (userId) => {
    const { error } = await _client.from("users").delete().eq("id", userId);
    if (error) return { error: error.message };
    return { success: true };
  };

  const searchPlayers = async (query) => {
    const { data, error } = await _client
      .from("users")
      .select("id, name, contact, profile")
      .eq("role", "player")
      .or(`name.ilike.%${query}%,contact.ilike.%${query}%`)
      .limit(10);
    if (error) return { data: [] };

    // only return unattached players
    const unattached =
      data?.filter((p) => {
        const status = p.profile?.status;
        const club = p.profile?.club;
        return !club || status === "unattached";
      }) || [];

    return { data: unattached };
  };

  const sendSquadInvite = async (coachId, playerId, squadName) => {
    // check if invite already exists
    const { data: existing } = await _client
      .from("squad_invites")
      .select("id, status")
      .eq("coach_id", coachId)
      .eq("player_id", playerId)
      .eq("status", "pending")
      .maybeSingle();

    if (existing)
      return { error: "An invite has already been sent to this player." };

    const { error } = await _client.from("squad_invites").insert({
      coach_id: coachId,
      player_id: playerId,
      squad_name: squadName,
      status: "pending",
    });
    if (error) return { error: error.message };

    // send notification message to player
    await _client.from("messages").insert({
      from_id: coachId,
      to_id: playerId,
      subject: "Squad invite",
      body: `You have been invited to join ${squadName}. Go to your messages to accept or decline.`,
      read: false,
    });

    return { success: true };
  };

  const getSquadInvites = async (playerId) => {
    const { data, error } = await _client
      .from("squad_invites")
      .select("*")
      .eq("player_id", playerId)
      .eq("status", "pending");
    if (error) return { data: [] };
    return { data };
  };

  const respondToInvite = async (
    inviteId,
    playerId,
    accept,
    squadName,
    coachId,
  ) => {
    const status = accept ? "accepted" : "declined";

    const { error } = await _client
      .from("squad_invites")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", inviteId);
    if (error) return { error: error.message };

    if (accept) {
      const { data: player } = await _client
        .from("users")
        .select("profile")
        .eq("id", playerId)
        .single();

      const updatedProfile = {
        ...player.profile,
        club: squadName,
        status: "signed",
      };

      await _client
        .from("users")
        .update({ profile: updatedProfile })
        .eq("id", playerId);

      await _client.from("messages").insert({
        from_id: playerId,
        to_id: coachId,
        subject: "Invite accepted",
        body: `A player has accepted your invite to join ${squadName}.`,
        read: false,
      });
    }

    return { success: true };
  };

  const saveVerificationEdits = async (verificationId, coachId, data) => {
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

  const getCoachVerification = async (coachId) => {
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

  const acceptVerificationEdits = async (verificationId) => {
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
        reviewed_at: new Date().toISOString(),
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
  const declineVerificationEdits = async (verificationId) => {
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
        reviewed_at: new Date().toISOString(),
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

  const getLatestSquadStatus = async (userId) => {
    const { data, error } = await _client
      .from("users")
      .select("squad_status")
      .eq("id", userId)
      .single();
    if (error) return null;
    return data?.squad_status || null;
  };

  const deleteAdminVerificationMessage = async (userId) => {
    await _client
      .from("messages")
      .delete()
      .eq("to_id", userId)
      .eq("from_id", "admin")
      .eq("subject", "Squad registration update")
      .limit(1);
  };

  const checkUserStatus = async (userId) => {
    const { data, error } = await _client
      .from("users")
      .select("id, banned, ban_reason, kicked, kicked_until")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return null;

    if (
      data.kicked &&
      data.kicked_until &&
      new Date(data.kicked_until) < new Date()
    ) {
      await _client
        .from("users")
        .update({ kicked: false, kicked_until: null })
        .eq("id", userId);
      data.kicked = false;
    }

    return data;
  };

  const archiveMessage = async (messageId) => {
    await _client
      .from("messages")
      .update({ archived: true, read: true })
      .eq("id", messageId);
  };

  const getMessages = async (userId) => {
    const { data, error } = await _client
      .from("messages")
      .select("*")
      .eq("to_id", userId)
      .eq("archived", false)
      .order("created_at", { ascending: false });
    if (error) return { data: [] };
    return { data };
  };

  const getArchivedMessages = async (userId) => {
    const { data, error } = await _client
      .from("messages")
      .select("*")
      .eq("to_id", userId)
      .eq("archived", true)
      .order("created_at", { ascending: false });
    if (error) return { data: [] };
    return { data };
  };

  const submitAgencyVerification = async (data) => {
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

    await _notifyAdmins(
      "New agency verification submitted",
      `A scout has submitted "${data.agencyName}" for agency verification.`,
    );

    return { success: true };
  };

  const updateAgencyStatus = async (userId, status) => {
    const { error } = await _client
      .from("users")
      .update({ agency_status: status })
      .eq("id", userId);
    if (error) return { error: error.message };
    return { success: true };
  };

  const getPendingAgencyVerifications = async () => {
    const { data, error } = await _client
      .from("agency_verifications")
      .select("*")
      .eq("status", "pending")
      .order("submitted_at", { ascending: true });
    if (error) return { data: [] };
    return { data };
  };

  const approveAgencyVerification = async (
    verificationId,
    scoutId,
    agencyName,
  ) => {
    const { error: verError } = await _client
      .from("agency_verifications")
      .update({ status: "verified", reviewed_at: new Date().toISOString() })
      .eq("id", verificationId);
    if (verError) return { error: verError.message };

    const { error: userError } = await _client
      .from("users")
      .update({ agency_status: "verified" })
      .eq("id", scoutId);
    if (userError) return { error: userError.message };

    await _client.from("messages").insert({
      from_id: "admin",
      to_id: scoutId,
      subject: "Agency verified",
      body: `Congratulations! Your agency "${agencyName}" has been verified on HappyFeet. You now have full access to all scouting features.`,
      read: false,
    });

    await _notifyAdmins(
      "Agency approved",
      `Agency "${agencyName}" has been verified. Scout has been notified.`,
    );

    return { success: true };
  };

  const rejectAgencyVerification = async (
    verificationId,
    scoutId,
    agencyName,
    reason,
  ) => {
    const { error: verError } = await _client
      .from("agency_verifications")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq("id", verificationId);
    if (verError) {
      return { error: verError.message };
    }

    const { error: userError } = await _client
      .from("users")
      .update({ agency_status: "rejected" })
      .eq("id", scoutId);
    if (userError) return { error: userError.message };

    await _client.from("messages").insert({
      from_id: "admin",
      to_id: scoutId,
      subject: "Agency verification update",
      body: `Unfortunately your agency "${agencyName}" could not be verified. Reason: ${reason}. Please resubmit with updated information.`,
      read: false,
    });

    await _notifyAdmins(
      "Agency rejected",
      `Agency "${agencyName}" was rejected. Reason: ${reason}. Scout has been notified.`,
    );

    return { success: true };
  };

  const getAdminIds = async () => {
    const { data, error } = await _client
      .from("users")
      .select("id")
      .eq("role", "admin");
    if (error) return [];
    return data?.map((u) => u.id) || [];
  };

  const _notifyAdmins = async (subject, body) => {
    const adminIds = await getAdminIds();
    for (const adminId of adminIds) {
      await _client.from("messages").insert({
        from_id: "system",
        to_id: adminId,
        subject,
        body,
        read: false,
      });
    }
  };

  const getLatestAgencyStatus = async (userId) => {
    const { data, error } = await _client
      .from("users")
      .select("agency_status")
      .eq("id", userId)
      .single();
    if (error) return null;
    return data?.agency_status || null;
  };

  const getAllAgencyVerifications = async () => {
    const { data, error } = await _client
      .from("agency_verifications")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) return { data: [] };
    return { data };
  };

  const subscribeToMessages = (userId, onMessage) => {
    return _client
      .channel(`realtime-messages-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `to_id=eq.${userId}`,
        },
        (payload) => {
          onMessage(payload.new);
        },
      )
      .subscribe((status) => {});
  };

  const subscribeToUserStatus = (userId, onStatusChange) => {
    return _client
      .channel(`realtime-user-status-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          onStatusChange(payload.new);
        },
      )
      .subscribe();
  };

  const subscribeToPendingVerifications = (onNewVerification) => {
    return _client
      .channel("realtime-squad-verifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "squad_verifications",
        },
        (payload) => {
          onNewVerification(payload);
        },
      )
      .subscribe();
  };

  const subscribeToAgencyVerifications = (onNewVerification) => {
    return _client
      .channel("realtime-agency-verifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agency_verifications",
        },
        (payload) => {
          onNewVerification(payload);
        },
      )
      .subscribe();
  };

  const getScoutProspects = async (scoutId) => {
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

  const saveProspect = async (scoutId, playerId) => {
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

  const unsaveProspect = async (scoutId, playerId) => {
    const { error } = await _client
      .from("scout_prospects")
      .delete()
      .eq("scout_id", scoutId)
      .eq("player_id", playerId);
    if (error) return { error: error.message };
    return { success: true };
  };

  const updateProspectStatus = async (scoutId, playerId, updates) => {
    const { error } = await _client
      .from("scout_prospects")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("scout_id", scoutId)
      .eq("player_id", playerId);
    if (error) return { error: error.message };
    return { success: true };
  };

  const getVerifiedClubs = async () => {
    const { data, error } = await _client
      .from("squad_verifications")
      .select("team_name, league, coach_id")
      .eq("status", "verified");
    if (error) return { data: [] };
    return { data };
  };

  const getScoutClubs = async (scoutId) => {
    const { data, error } = await _client
      .from("scout_clubs")
      .select("*")
      .eq("scout_id", scoutId);
    if (error) return { data: [] };
    return { data };
  };

  const addScoutClub = async (scoutId, coachId, clubName, league) => {
    const { data: existing } = await _client
      .from("scout_clubs")
      .select("id")
      .eq("scout_id", scoutId)
      .eq("club_name", clubName)
      .maybeSingle();
    if (existing) return { error: "Club already in your network." };

    const { error } = await _client.from("scout_clubs").insert({
      scout_id: scoutId,
      coach_id: coachId,
      club_name: clubName,
      league,
    });
    if (error) return { error: error.message };
    return { success: true };
  };

  const getAllPlayers = async () => {
    const { data, error } = await _client
      .from("users")
      .select("id, name, profile")
      .eq("role", "player")
      .order("created_at", { ascending: false });
    if (error) return { data: [] };
    return { data };
  };

  const getUserById = async (userId) => {
    const { data, error } = await _client
      .from("users")
      .select("id, name, profile")
      .eq("id", userId)
      .single();
    if (error) return { data: null };
    return { data };
  };

  const _sendMessage = async (fromId, toId, subject, body) => {
    const { error } = await _client.from("messages").insert({
      from_id: fromId,
      to_id: toId,
      subject,
      body,
      read: false,
    });
    if (error) return { error: error.message };
    return { success: true };
  };

  const getUserNameById = async (userId) => {
    if (!userId || userId === "admin" || userId === "system")
      return "HappyFeet Admin";
    const { data, error } = await _client
      .from("users")
      .select("name, role")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return "HappyFeet";
    return data.role === "admin" ? `Admin: ${data.name}` : data.name;
  };

  const getSquadPlayers = async (coachId) => {
    const { data, error } = await _client
      .from("squad_invites")
      .select("*, player:users!squad_invites_player_id_fkey(id, name, profile)")
      .eq("coach_id", coachId)
      .eq("status", "accepted");
    if (error) return { data: [] };
    return { data };
  };

  const incrementTeamSize = async (coachId) => {
    const { data: coach } = await _client
      .from("users")
      .select("profile")
      .eq("id", coachId)
      .single();

    if (!coach) return;

    const updatedProfile = {
      ...coach.profile,
      teamSize: (coach.profile?.teamSize || 0) + 1,
    };

    await _client
      .from("users")
      .update({ profile: updatedProfile })
      .eq("id", coachId);
  };

  const getCoachInvites = async (coachId) => {
    const { data, error } = await _client
      .from("squad_invites")
      .select("player_id, status")
      .eq("coach_id", coachId);
    if (error) return { data: [] };
    return { data };
  };

  const removePlayerFromSquad = async (coachId, playerId, reason) => {
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

  const decrementTeamSize = async (coachId) => {
    const { data: coach } = await _client
      .from("users")
      .select("profile")
      .eq("id", coachId)
      .single();
    if (!coach) return;
    const updatedProfile = {
      ...coach.profile,
      teamSize: Math.max(0, (coach.profile?.teamSize || 1) - 1),
    };
    await _client
      .from("users")
      .update({ profile: updatedProfile })
      .eq("id", coachId);
  };

  const updateLoginStreak = async (userId) => {
    const { data, error } = await _client
      .from("users")
      .select("last_login, login_streak")
      .eq("id", userId)
      .single();
    if (error) return;

    const today = new Date().toISOString().split("T")[0];
    const lastLogin = data?.last_login;
    const streak = data?.login_streak || 0;

    // calculate new streak
    let newStreak = 1;
    if (lastLogin) {
      const last = new Date(lastLogin);
      const now = new Date(today);
      const diffDays = Math.round((now - last) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return; // already logged in today, don't update
      if (diffDays === 1) newStreak = streak + 1; // consecutive day
      // if diffDays > 1, streak resets to 1
    }

    await _client
      .from("users")
      .update({ last_login: today, login_streak: newStreak })
      .eq("id", userId);

    return newStreak;
  };

  const getLoginStreak = async (userId) => {
    const { data, error } = await _client
      .from("users")
      .select("login_streak, last_login")
      .eq("id", userId)
      .single();
    if (error) return 0;

    // check if streak is still valid (last login was yesterday or today)
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split("T")[0];

    if (!data.last_login) return 0;
    if (data.last_login === today || data.last_login === yesterdayKey) {
      return data.login_streak || 0;
    }
    return 0; // streak broken
  };

  // ─── Public API ────────────────────────────────────────────
  return {
    createUser,
    findUser,
    updateUserProfile,
    updateUserName,
    getSession,
    saveSession,
    clearSession,
    getTracker,
    saveTracker,
    getHealth,
    saveHealth,
    getTraining,
    saveTraining,
    getScout,
    saveScout,
    getAdminIds,
    submitSquadVerification,
    updateSquadStatus,
    checkTeamExists,
    getPendingVerifications,
    getAllAgencyVerifications,
    approveSquadVerification,
    rejectSquadVerification,
    getCoachVerification,
    acceptVerificationEdits,
    declineVerificationEdits,
    saveVerificationEdits,
    deleteAdminVerificationMessage,
    getMessages,
    getUserNameById,
    getCoachInvites,
    archiveMessage,
    getArchivedMessages,
    markMessageRead,
    getAllVerifications,
    getAllUsers,
    kickUser,
    banUser,
    unbanUser,
    removeUser,
    checkUserStatus,
    searchPlayers,
    sendSquadInvite,
    getSquadInvites,
    getSquadPlayers,
    respondToInvite,
    incrementTeamSize,
    getLatestSquadStatus,
    submitAgencyVerification,
    updateAgencyStatus,
    getPendingAgencyVerifications,
    approveAgencyVerification,
    rejectAgencyVerification,
    getLatestAgencyStatus,
    subscribeToMessages,
    subscribeToUserStatus,
    subscribeToPendingVerifications,
    subscribeToAgencyVerifications,
    getScoutProspects,
    saveProspect,
    unsaveProspect,
    updateProspectStatus,
    getVerifiedClubs,
    getScoutClubs,
    addScoutClub,
    getAllPlayers,
    getUserById,
    _sendMessage,
    removePlayerFromSquad,
    decrementTeamSize,
    updateLoginStreak,
    getLoginStreak,
  };
})();

window.HF_DB = HF_DB;
