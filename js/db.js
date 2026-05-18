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

  const _localDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

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

  const checkContactExists = async (contact) => {
    const normalised = contact.toLowerCase().replace(/\s/g, "");
    const { data } = await _client
      .from("users")
      .select("id")
      .eq("contact", normalised)
      .maybeSingle();
    return { data };
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
        .update({ data: payload, updated_at: _localDate() })
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
      .update({ status: "verified", reviewed_at: _localDate() })
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

    const { data: coach } = await _client
      .from("users")
      .select("name")
      .eq("id", coachId)
      .single();
    const coachName = coach?.name || "The coach";
    await _notifyAdmins(
      "Squad approved",
      `Squad "${teamName}" has been verified. Coach ${coachName} has been notified.`,
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
        reviewed_at: _localDate(),
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

    const { data: coach } = await _client
      .from("users")
      .select("name")
      .eq("id", coachId)
      .single();
    const coachName = coach?.name || "The coach";
    await _notifyAdmins(
      "Squad rejected",
      `Squad "${teamName}" was rejected. Reason: ${reason}. Coach ${coachName} has been notified.`,
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
      from_id: coachId,
      to_id: playerId,
      subject: "Squad invite",
      body: `${coachName} has invited you to join ${squadName}. Go to your messages to accept or decline.`,
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
      .update({
        status,
        responded_at: _localDate(),
        declined_at: !accept ? _localDate() : null,
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
        from_id: playerId,
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
      // notify coach
      await _client.from("messages").insert({
        from_id: playerId,
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
    // get the thread_id for this message first
    const { data: msg } = await _client
      .from("messages")
      .select("thread_id")
      .eq("id", messageId)
      .single();

    if (msg?.thread_id) {
      // archive all messages in the thread
      await _client
        .from("messages")
        .update({ archived: true, read: true })
        .eq("thread_id", msg.thread_id);
    } else {
      // fallback:archive just this message
      await _client
        .from("messages")
        .update({ archived: true, read: true })
        .eq("id", messageId);
    }
  };

  const unarchiveMessage = async (messageId) => {
    // get the thread_id for this message first
    const { data: msg } = await _client
      .from("messages")
      .select("thread_id")
      .eq("id", messageId)
      .single();

    if (msg?.thread_id) {
      // unarchive all messages in the thread
      await _client
        .from("messages")
        .update({ archived: false })
        .eq("thread_id", msg.thread_id);
    } else {
      // fallback: unarchive just this message
      await _client
        .from("messages")
        .update({ archived: false })
        .eq("id", messageId);
    }
  };

  const getMessages = async (userId) => {
    // get all messages where user is recipient
    const { data: received, error: recvError } = await _client
      .from("messages")
      .select("*")
      .eq("to_id", userId)
      .eq("archived", false)
      .order("created_at", { ascending: false });
    if (recvError) return { data: [] };

    // get thread IDs the user has participated in
    const threadIds = [
      ...new Set(received.map((m) => m.thread_id).filter(Boolean)),
    ];

    // get latest message per thread across all participants
    let allThreadMessages = [];
    if (threadIds.length > 0) {
      const { data: threadMsgs } = await _client
        .from("messages")
        .select("*")
        .in("thread_id", threadIds)
        .order("created_at", { ascending: false });
      allThreadMessages = threadMsgs || [];
    }

    // deduplicate by thread_id: keep only the latest per thread
    const seen = new Set();
    const deduped = [];

    // combine and sort by created_at descending
    const combined = [...received];
    for (const tm of allThreadMessages) {
      if (!combined.find((m) => m.id === tm.id)) combined.push(tm);
    }
    combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    for (const m of combined) {
      const key = m.thread_id || m.id;
      if (seen.has(key)) continue;
      seen.add(key);
      // only include if user is a participant
      if (m.to_id === userId || m.from_id === userId) {
        deduped.push(m);
      }
    }

    return { data: deduped };
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
      .update({ status: "verified", reviewed_at: _localDate() })
      .eq("id", verificationId);
    if (verError) return { error: verError.message };

    // fetch verification details to copy to profile
    const { data: ver } = await _client
      .from("agency_verifications")
      .select("*")
      .eq("id", verificationId)
      .single();

    // update scout's profile with regions and leagues
    const { data: scout } = await _client
      .from("users")
      .select("profile")
      .eq("id", scoutId)
      .single();

    const updatedProfile = {
      ...scout.profile,
      regionsCovered: ver.regions_covered || [],
      targetLeagues: ver.target_leagues || [],
      website: ver.website || null,
    };

    const { error: userError } = await _client
      .from("users")
      .update({ agency_status: "verified", profile: updatedProfile })
      .eq("id", scoutId);
    if (userError) return { error: userError.message };

    await _client.from("messages").insert({
      from_id: "admin",
      to_id: scoutId,
      subject: "Agency verified",
      body: `Congratulations! Your agency "${agencyName}" has been verified on HappyFeet. You now have full access to all scouting features.`,
      read: false,
    });

    const scoutName = scout?.name || "The scout";
    await _notifyAdmins(
      "Agency approved",
      `Agency "${agencyName}" has been verified. Scout ${scoutName} has been notified.`,
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
        reviewed_at: _localDate(),
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

    const { data: scout } = await _client
      .from("users")
      .select("name")
      .eq("id", scoutId)
      .single();
    const scoutName = scout?.name || "The scout";
    await _notifyAdmins(
      "Agency rejected",
      `Agency "${agencyName}" was rejected. Reason: ${reason}. Scout ${scoutName} has been notified.`,
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
      .update({ ...updates, updated_at: _localDate() })
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

  const _sendMessage = async (
    fromId,
    toId,
    subject,
    body,
    threadId = null,
    parentId = null,
  ) => {
    const newThreadId = threadId || crypto.randomUUID();
    const { data, error } = await _client
      .from("messages")
      .insert({
        from_id: fromId,
        to_id: toId,
        subject,
        body,
        read: false,
        thread_id: newThreadId,
        parent_id: parentId || null,
      })
      .select()
      .single();
    if (error) return { error: error.message };
    return { success: true, threadId: newThreadId, messageId: data.id };
  };

  const getThread = async (threadId, userId) => {
    const { data, error } = await _client
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .or(`to_id.eq.${userId},from_id.eq.${userId}`)
      .order("created_at", { ascending: true });
    if (error) return { data: [] };
    return { data };
  };

  const getUserNameById = async (userId) => {
    if (!userId) return "HappyFeet";
    if (userId === "system") return "HappyFeet System";
    if (userId === "admin") return "HappyFeet Admin";

    const { data, error } = await _client
      .from("users")
      .select("name, role")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return "HappyFeet";
    return data.name;
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
      .select("player_id, status, declined_at")
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

    const today = _localDate();
    const yesterday = _localDateOffset(-1);
    const lastLogin = data?.last_login;
    const streak = data?.login_streak || 0;

    let newStreak = 1;
    if (lastLogin) {
      if (lastLogin === today) return; // already logged in today
      if (lastLogin === yesterday) newStreak = streak + 1;
    }

    await _client
      .from("users")
      .update({ last_login: today, login_streak: newStreak })
      .eq("id", userId);

    return newStreak;
  };

  const _localDateOffset = (days) => {
    const now = new Date();
    now.setDate(now.getDate() + days);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

  const getLoginStreak = async (userId) => {
    const { data, error } = await _client
      .from("users")
      .select("login_streak, last_login")
      .eq("id", userId)
      .single();
    if (error) return 0;

    const today = _localDate();
    const yesterday = _localDateOffset(-1);

    if (!data.last_login) return 0;
    if (data.last_login === today || data.last_login === yesterday) {
      return data.login_streak || 0;
    }
    return 0;
  };

  const saveSessionRating = async (
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

    return { success: true, overall };
  };

  const getPlayerSessionRatings = async (playerId, limit = 10) => {
    const { data, error } = await _client
      .from("session_ratings")
      .select("*")
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { data: [] };
    return { data };
  };

  const getSquadSessionRatings = async (coachId) => {
    const { data, error } = await _client
      .from("session_ratings")
      .select("*, player:users!session_ratings_player_id_fkey(id, name)")
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return { data: [] };
    return { data };
  };

  const getAllUsersBasic = async () => {
    const { data, error } = await _client
      .from("users")
      .select("id, name, role")
      .order("name", { ascending: true });
    if (error) return { data: [] };
    return { data };
  };

  const searchAllUsers = async (query, excludeId) => {
    const { data, error } = await _client
      .from("users")
      .select("id, name, role, contact")
      .or(`name.ilike.%${query}%,contact.ilike.%${query}%`)
      .neq("id", excludeId)
      .limit(8);
    if (error) return { data: [] };
    return { data };
  };

  const getTodaySessionRating = async (coachId, playerId) => {
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

  const _updateSessionRating = async (
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

  const saveHealthLog = async (playerId, data) => {
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

  const getHealthLogs = async (playerId, limit = 14) => {
    const { data, error } = await _client
      .from("health_logs")
      .select("*")
      .eq("player_id", playerId)
      .order("date", { ascending: false })
      .limit(limit);
    if (error) return { data: [] };
    return { data };
  };

  const getTodayHealthLog = async (playerId) => {
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

  const getPlayerHealthLogs = async (playerId, limit = 7) => {
    const { data, error } = await _client
      .from("health_logs")
      .select("*")
      .eq("player_id", playerId)
      .order("date", { ascending: false })
      .limit(limit);
    if (error) return { data: [] };
    return { data };
  };

  const removeAllChannels = () => {
    try {
      _client.removeAllChannels();
    } catch (e) {
      console.log("channel cleanup:", e.message);
    }
  };

  const saveProspectReport = async (scoutId, playerId, report) => {
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

  const getProspectReport = async (scoutId, playerId) => {
    const { data, error } = await _client
      .from("scout_prospects")
      .select("report, report_generated_at")
      .eq("scout_id", scoutId)
      .eq("player_id", playerId)
      .single();
    if (error) return { data: null };
    return { data };
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
    unarchiveMessage,
    getArchivedMessages,
    markMessageRead,
    getAllVerifications,
    getAllUsers,
    kickUser,
    banUser,
    unbanUser,
    removeUser,
    getAllUsersBasic,
    checkContactExists,
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
    getThread,
    _sendMessage,
    removePlayerFromSquad,
    decrementTeamSize,
    updateLoginStreak,
    getLoginStreak,
    saveSessionRating,
    getTodaySessionRating,
    getPlayerSessionRatings,
    getSquadSessionRatings,
    searchAllUsers,
    _updateSessionRating,
    saveHealthLog,
    getHealthLogs,
    getTodayHealthLog,
    getPlayerHealthLogs,
    removeAllChannels,
    saveProspectReport,
    getProspectReport,
  };
})();

window.HF_DB = HF_DB;
