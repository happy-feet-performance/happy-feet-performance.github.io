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

  const _nameCache = {};

  // ─── Generic data table getters and setters ────────────────────────────
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

  // ── CORE ────────────────────────────────────────────────────
  const _localDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

  const _localDateOffset = (days) => {
    const now = new Date();
    now.setDate(now.getDate() + days);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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

  // ── AUTH & SESSION ──────────────────────────────────────────
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

    // Insert default data rows for new user
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

  const findUserByContact = async (contact) => {
    const { data, error } = await _client
      .from("users")
      .select(
        "id, name, role, banned, ban_reason, kicked, kicked_until, login_attempts, locked_until",
      )
      .eq("contact", contact)
      .maybeSingle();
    if (error || !data) return null;
    return data;
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

  const updateUserName = async (userId, name) => {
    const { error } = await _client
      .from("users")
      .update({ name })
      .eq("id", userId);
    if (error) return { error: error.message };
    return { success: true };
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

  const getUserStatus = async (userId, type = null) => {
    const select =
      type === "squad"
        ? "id, squad_status"
        : type === "agency"
          ? "id, agency_status"
          : "id, squad_status, agency_status, banned, kicked, kicked_until";

    const { data, error } = await _client
      .from("users")
      .select(select)
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return { data: null };
    return { data };
  };

  const uploadAvatar = async (userId, file) => {
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await _client.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error("upload error:", uploadError);
      return { error: uploadError.message };
    }

    const { data } = _client.storage.from("avatars").getPublicUrl(path);

    const { data: user } = await _client
      .from("users")
      .select("profile")
      .eq("id", userId)
      .single();

    const updatedProfile = {
      ...user?.profile,
      avatarUrl: data.publicUrl + "?t=" + Date.now(),
    };

    const { error: updateError } = await _client
      .from("users")
      .update({ profile: updatedProfile })
      .eq("id", userId);

    return { success: true, url: data.publicUrl };
  };

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

  // ── SECURITY ────────────────────────────────────────────────
  const incrementLoginAttempts = async (userId) => {
    const { data: user } = await _client
      .from("users")
      .select("login_attempts")
      .eq("id", userId)
      .single();

    const attempts = (user?.login_attempts || 0) + 1;
    const lockedUntil =
      attempts >= 5
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min lockout
        : null;

    await _client
      .from("users")
      .update({ login_attempts: attempts, locked_until: lockedUntil })
      .eq("id", userId);

    return { attempts, lockedUntil };
  };

  const resetLoginAttempts = async (userId) => {
    await _client
      .from("users")
      .update({ login_attempts: 0, locked_until: null })
      .eq("id", userId);
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

  const setSecurityQuestion = async (userId, question, answer) => {
    const hashedAnswer = await HF_UTILS.hashPassword(
      answer.toLowerCase().trim(),
    );
    const { error } = await _client
      .from("users")
      .update({ security_question: question, security_answer: hashedAnswer })
      .eq("id", userId);
    if (error) return { error: error.message };
    return { success: true };
  };

  const getUserSecurityQuestion = async (contact) => {
    const { data, error } = await _client
      .from("users")
      .select("security_question")
      .eq("contact", contact)
      .maybeSingle();
    if (error || !data) return { data: null };
    return { data };
  };

  const verifySecurityAnswer = async (contact, answer) => {
    const { data, error } = await _client
      .from("users")
      .select(
        "id, security_question, security_answer, security_attempts, locked_until",
      )
      .eq("contact", contact)
      .maybeSingle();

    if (error || !data) return { error: "User not found." };
    if (!data.security_answer) return { error: "No security question set." };

    // check if locked
    if (data.locked_until && new Date(data.locked_until) > new Date()) {
      const mins = Math.ceil(
        (new Date(data.locked_until) - new Date()) / 60000,
      );
      return {
        error: `Too many attempts. Try again in ${mins} minute${mins !== 1 ? "s" : ""}.`,
      };
    }

    const hashedAnswer = await HF_UTILS.hashPassword(
      answer.toLowerCase().trim(),
    );

    if (hashedAnswer !== data.security_answer) {
      const attempts = (data.security_attempts || 0) + 1;
      const lockedUntil =
        attempts >= 4
          ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
          : null;

      await _client
        .from("users")
        .update({ security_attempts: attempts, locked_until: lockedUntil })
        .eq("id", data.id);

      const remaining = 4 - attempts;
      if (lockedUntil)
        return {
          error: "Too many failed attempts. Account locked for 15 minutes.",
        };
      return {
        error: `Incorrect answer.${remaining === 1 ? " 1 attempt remaining before lockout." : ""}`,
      };
    }

    // reset attempts if correct
    await _client
      .from("users")
      .update({ security_attempts: 0 })
      .eq("id", data.id);

    return { success: true, userId: data.id };
  };

  const resetPassword = async (userId, newPassword) => {
    const { error } = await _client
      .from("users")
      .update({ password: newPassword, login_attempts: 0, locked_until: null })
      .eq("id", userId);
    if (error) return { error: error.message };
    return { success: true };
  };

  // ── USERS & ADMIN ───────────────────────────────────────────
  const getAdminIds = async () => {
    const { data, error } = await _client
      .from("users")
      .select("id")
      .eq("role", "admin");
    if (error) return [];
    return data?.map((u) => u.id) || [];
  };

  const getAllUsers = async (basic = false) => {
    const select = basic ? "id, name, role, contact, profile" : "*";

    const { data, error } = await _client
      .from("users")
      .select(select)
      .order("created_at", { ascending: false });

    if (error) return { data: [] };
    return { data };
  };

  const getUserById = async (userId) => {
    const { data, error } = await _client
      .from("users")
      .select("id, name, role, profile, squad_status, agency_status")
      .eq("id", userId)
      .single();
    if (error) return { data: null };
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

  const getAllPlayers = async () => {
    const { data, error } = await _client
      .from("users")
      .select("id, name, profile")
      .eq("role", "player")
      .order("created_at", { ascending: false });
    if (error) return { data: [] };
    return { data };
  };

  const getUnattachedPlayers = async (filters = {}) => {
    let query = _client
      .from("users")
      .select("id, name, profile")
      .eq("role", "player");

    if (filters.pos) query = query.eq("profile->>pos", filters.pos);
    if (filters.tier) query = query.eq("profile->>tier", filters.tier);
    if (filters.search) query = query.ilike("name", `%${filters.search}%`);

    const { data, error } = await query.order("name", { ascending: true });
    if (error) return { data: [] };

    // filter unattached in JS since profile is JSON
    const unattached =
      data?.filter(
        (u) => !u.profile?.club || u.profile?.status === "unattached",
      ) || [];
    return { data: unattached };
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

  // ── VERIFICATIONS ───────────────────────────────────────────

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

  const checkTeamExists = async (teamName) => {
    const { data } = await _client
      .from("squad_verifications")
      .select("id, status")
      .ilike("team_name", teamName)
      .maybeSingle();
    return data || null;
  };

  const getPendingVerifications = async (type = "squad") => {
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

  const claimVerification = async (verificationId, adminId, type = "squad") => {
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

  const unclaimVerification = async (verificationId, type = "squad") => {
    const table =
      type === "squad" ? "squad_verifications" : "agency_verifications";
    const { error } = await _client
      .from(table)
      .update({ claimed_by: null, claimed_at: null })
      .eq("id", verificationId);
    if (error) return { error: error.message };
    return { success: true };
  };

  const getAllVerifications = async (type = "squad") => {
    const table =
      type === "squad" ? "squad_verifications" : "agency_verifications";
    const { data, error } = await _client
      .from(table)
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) return { data: [] };
    return { data };
  };

  const approveVerification = async (verificationId, userId, name, type) => {
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

  const rejectVerification = async (
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

  const deleteAdminVerificationMessage = async (userId) => {
    await _client
      .from("messages")
      .delete()
      .eq("to_id", userId)
      .eq("from_id", "admin")
      .eq("subject", "Squad registration update")
      .limit(1);
  };

  const updateTeamSize = async (coachId, delta) => {
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

  const toggleRecruitment = async (userId, value) => {
    const { error } = await _client
      .from("users")
      .update({ open_for_recruitment: value })
      .eq("id", userId);
    if (error) return { error: error.message };
    return { success: true };
  };

  const updateVerificationStatus = async (userId, type, status) => {
    const field = type === "squad" ? "squad_status" : "agency_status";
    const { error } = await _client
      .from("users")
      .update({ [field]: status })
      .eq("id", userId);
    if (error) return { error: error.message };
    return { success: true };
  };

  // ── SQUAD ───────────────────────────────────────────────────
  const getSquadPlayers = async (coachId) => {
    const { data, error } = await _client
      .from("squad_invites")
      .select("*, player:users!squad_invites_player_id_fkey(id, name, profile)")
      .eq("coach_id", coachId)
      .eq("status", "accepted");
    if (error) return { data: [] };
    return { data };
  };

  const getCoachSquadDetails = async (coachId) => {
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

  const getSquadReadiness = async (coachId) => {
    const { data: squadPlayers } = await _client
      .from("squad_invites")
      .select(
        "player_id, player:users!squad_invites_player_id_fkey(id, name, profile)",
      )
      .eq("coach_id", coachId)
      .eq("status", "accepted");

    if (!squadPlayers || squadPlayers.length === 0)
      return { data: { score: 0, breakdown: {} } };

    const today = _localDate();
    let totalRating = 0,
      ratedCount = 0;
    let checkedInCount = 0,
      readyCount = 0;

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
      },
    };
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
      from_id: "system",
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
      .select("*, coach:users!squad_invites_coach_id_fkey(id, name, profile)")
      .eq("player_id", playerId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) return { data: [] };
    return { data };
  };

  const getCoachInvites = async (coachId) => {
    const { data, error } = await _client
      .from("squad_invites")
      .select("player_id, status, declined_at")
      .eq("coach_id", coachId);
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

  const getVerifiedCoaches = async (openOnly = false) => {
    let query = _client
      .from("users")
      .select("id, name, profile, squad_status")
      .eq("role", "coach")
      .eq("squad_status", "verified")
      .order("name", { ascending: true });

    if (openOnly) query = query.eq("open_for_recruitment", true);

    const { data, error } = await query;
    if (error) return { data: [] };
    return { data };
  };

  const getFlaggedProspects = async () => {
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

  // ── TRIAL & NETWORK ─────────────────────────────────────────
  const requestTrial = async (playerId, coachId) => {
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

  const respondToTrialRequest = async (requestId, status) => {
    const { error } = await _client
      .from("trial_requests")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", requestId);
    if (error) return { error: error.message };
    return { success: true };
  };

  const getTrialRequestStatus = async (playerId, coachId) => {
    const { data, error } = await _client
      .from("trial_requests")
      .select("*")
      .eq("player_id", playerId)
      .eq("coach_id", coachId)
      .maybeSingle();
    if (error) return { data: null };
    return { data };
  };

  const getPendingTrialRequests = async (coachId) => {
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

  const getTrialPlayers = async (coachId) => {
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

  const requestClubNetwork = async (scoutId, coachId) => {
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

  const respondClubRequest = async (requestId, status) => {
    const { error } = await _client
      .from("scout_club_requests")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", requestId);
    if (error) return { error: error.message };
    return { success: true };
  };

  const getClubNetworkStatus = async (scoutId, coachId) => {
    const { data, error } = await _client
      .from("scout_club_requests")
      .select("*")
      .eq("scout_id", scoutId)
      .eq("coach_id", coachId)
      .maybeSingle();
    if (error) return { data: null };
    return { data };
  };

  const getPendingClubRequests = async (coachId) => {
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

  const getApprovedClubNetwork = async (scoutId) => {
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

  // ── MESSAGES ────────────────────────────────────────────────
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

  const getMessages = async (userId) => {
    const { data, error } = await _client
      .from("messages")
      .select("*")
      .or(`to_id.eq.${userId},from_id.eq.${userId}`)
      .eq("archived", false)
      .order("created_at", { ascending: false });

    if (error) return { data: [] };

    // deduplicate by thread_id: keep latest per thread in JS
    const seen = new Set();
    const deduped = [];
    for (const m of data) {
      const key = m.thread_id || m.id;
      if (!seen.has(key)) {
        seen.add(key);
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

  const getThread = async (threadId, userId) => {
    const { data, error } = await _client
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    if (error) return { data: [] };
    return { data };
  };

  const getUnreadCount = async (userId) => {
    const { data, error } = await _client
      .from("messages")
      .select("id")
      .eq("to_id", userId)
      .eq("read", false)
      .eq("archived", false);
    if (error) return 0;
    return data?.length || 0;
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

  const markMessageRead = async (messageId) => {
    await _client.from("messages").update({ read: true }).eq("id", messageId);
  };

  const getUserNameById = async (userId) => {
    if (!userId) return "HappyFeet";
    if (userId === "system") return "HappyFeet System";
    if (userId === "admin") return "HappyFeet Admin";

    // return cached result if available
    if (_nameCache[userId]) return _nameCache[userId];

    const { data, error } = await _client
      .from("users")
      .select("name")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return "HappyFeet";

    // cache the result
    _nameCache[userId] = data.name;
    return data.name;
  };

  const getUserNamesByIds = async (ids) => {
    const uniqueIds = [
      ...new Set(ids.filter((id) => id && id !== "system" && id !== "admin")),
    ];

    // return cached ones immediately
    const result = { system: "HappyFeet System", admin: "HappyFeet Admin" };
    const uncached = uniqueIds.filter((id) => !_nameCache[id]);

    if (uncached.length > 0) {
      const { data } = await _client
        .from("users")
        .select("id, name")
        .in("id", uncached);

      (data || []).forEach((u) => {
        _nameCache[u.id] = u.name;
      });
    }

    uniqueIds.forEach((id) => {
      result[id] = _nameCache[id] || "HappyFeet";
    });

    return result;
  };

  // ── TICKETS ─────────────────────────────────────────────────
  const createTicket = async (fromId, subject, body, category = "general") => {
    const { data: user } = await _client
      .from("users")
      .select("name")
      .eq("id", fromId)
      .single();

    const initialMessage = {
      id: crypto.randomUUID(),
      from_id: fromId,
      from_name: user?.name || "User",
      body,
      created_at: new Date().toISOString(),
      is_admin: false,
    };

    const { data, error } = await _client
      .from("tickets")
      .insert({
        from_id: fromId,
        subject,
        body,
        category,
        messages: [initialMessage],
      })
      .select()
      .single();

    if (error) return { error: error.message };
    return { success: true, ticket: data };
  };

  const getTickets = async (status = null) => {
    let query = _client
      .from("tickets")
      .select(
        `
      *,
      from:users!tickets_from_id_fkey(id, name, role, profile),
      claimer:users!tickets_claimed_by_fkey(id, name)
    `,
      )
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return { data: [] };
    return { data };
  };

  const getUserTickets = async (userId) => {
    const { data, error } = await _client
      .from("tickets")
      .select("*, claimer:users!tickets_claimed_by_fkey(id, name)")
      .eq("from_id", userId)
      .order("created_at", { ascending: false });
    if (error) return { data: [] };
    return { data };
  };

  const claimTicket = async (ticketId, adminId) => {
    const { error } = await _client
      .from("tickets")
      .update({
        claimed_by: adminId,
        claimed_at: new Date().toISOString(),
        status: "claimed",
      })
      .eq("id", ticketId);
    if (error) return { error: error.message };
    return { success: true };
  };

  const resolveTicket = async (ticketId) => {
    const { error } = await _client
      .from("tickets")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", ticketId);
    if (error) return { error: error.message };
    return { success: true };
  };

  const reopenTicket = async (ticketId) => {
    const { error } = await _client
      .from("tickets")
      .update({ status: "open", claimed_by: null, claimed_at: null })
      .eq("id", ticketId);
    if (error) return { error: error.message };
    return { success: true };
  };

  const getMyTickets = async (adminId) => {
    const { data, error } = await _client
      .from("tickets")
      .select("*, from:users!tickets_from_id_fkey(id, name, role, profile)")
      .eq("claimed_by", adminId)
      .neq("status", "resolved")
      .order("created_at", { ascending: false });
    if (error) return { data: [] };
    return { data };
  };

  const addTicketMessage = async (ticketId, fromId, body, isAdmin = false) => {
    const { data: user } = await _client
      .from("users")
      .select("name")
      .eq("id", fromId)
      .single();

    const newMessage = {
      id: crypto.randomUUID(),
      from_id: fromId,
      from_name: user?.name || (isAdmin ? "HappyFeet Support" : "User"),
      body,
      created_at: new Date().toISOString(),
      is_admin: isAdmin,
    };

    // use rpc to atomically append to avoid race conditions
    const { data: ticket, error: fetchError } = await _client
      .from("tickets")
      .select("messages")
      .eq("id", ticketId)
      .single();

    if (fetchError) return { error: fetchError.message };

    const updatedMessages = [...(ticket?.messages || []), newMessage];

    const { error } = await _client
      .from("tickets")
      .update({
        messages: updatedMessages,
        status: isAdmin && ticket.status === "open" ? "claimed" : ticket.status,
      })
      .eq("id", ticketId);

    if (error) return { error: error.message };
    return { success: true };
  };

  const getTicketMessages = async (ticketId) => {
    const { data, error } = await _client
      .from("tickets")
      .select("messages")
      .eq("id", ticketId)
      .single();
    if (error) return { data: [] };
    return { data: data?.messages || [] };
  };

  // ── TRAINING ────────────────────────────────────────────────
  const getTraining = async (userId) =>
    (await _getData("training", userId)) || {
      sessions: [],
      schedule: {},
      currentPlan: null,
    };

  const saveTraining = async (userId, data) =>
    await _saveData("training", userId, data);

  const logTrainingSession = async (
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

  const getTrainingLogs = async (playerId, limit = 30) => {
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

  const getTodayTrainingLog = async (playerId) => {
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

  // ── HEALTH ──────────────────────────────────────────────────
  const getHealth = async (userId) =>
    (await _getData("health", userId)) || { checkins: {}, injuries: [] };

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

  // ── SESSION RATINGS ─────────────────────────────────────────
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

    await checkAndUnlockAchievements(playerId);
    return { success: true, overall };
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

  // ── SCOUTING ────────────────────────────────────────────────
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

  // ── ACHIEVEMENTS ────────────────────────────────────────────
  const getAchievements = async (userId) => {
    const { data, error } = await _client
      .from("users")
      .select("achievements")
      .eq("id", userId)
      .single();
    if (error) return { data: [] };
    return { data: data.achievements || [] };
  };

  const unlockAchievement = async (userId, achievementId) => {
    const { data: user } = await _client
      .from("users")
      .select("achievements")
      .eq("id", userId)
      .single();

    const current = user?.achievements || [];
    if (current.find((a) => a.id === achievementId))
      return { alreadyUnlocked: true };

    const updated = [
      ...current,
      { id: achievementId, unlockedAt: new Date().toISOString() },
    ];
    const { error } = await _client
      .from("users")
      .update({ achievements: updated })
      .eq("id", userId);

    if (error) return { error: error.message };
    return { success: true };
  };

  const checkAndUnlockAchievements = async (userId) => {
    const [
      { data: unlockedRaw },
      { data: sessions },
      { data: healthLogs },
      { data: trainingLogs },
      { data: user },
      { data: prospects },
    ] = await Promise.all([
      _client
        .from("users")
        .select("achievements, profile, login_streak")
        .eq("id", userId)
        .single()
        .then((r) => ({ data: r.data })),
      _client
        .from("session_ratings")
        .select("overall")
        .eq("player_id", userId)
        .then((r) => ({ data: r.data || [] })),
      _client
        .from("health_logs")
        .select("id, energy, mood, sleep, soreness, hydration")
        .eq("player_id", userId)
        .then((r) => ({ data: r.data || [] })),
      _client
        .from("training_logs")
        .select("id")
        .eq("player_id", userId)
        .eq("completed", true)
        .then((r) => ({ data: r.data || [] })),
      _client
        .from("squad_invites")
        .select("status")
        .eq("player_id", userId)
        .eq("status", "accepted")
        .then((r) => ({ data: r.data || [] })),
      _client
        .from("scout_prospects")
        .select("flagged, placed, report_shared")
        .eq("player_id", userId)
        .then((r) => ({ data: r.data || [] })),
    ]);

    const unlocked = unlockedRaw?.achievements || [];
    const profile = unlockedRaw?.profile || {};
    const streak = unlockedRaw?.login_streak || 0;
    const unlockedIds = new Set(unlocked.map((a) => a.id));
    const newlyUnlocked = [];

    const check = async (id, condition) => {
      if (condition && !unlockedIds.has(id)) {
        await unlockAchievement(userId, id);
        newlyUnlocked.push(id);
      }
    };

    const avgOverall = sessions.length
      ? Math.round(
          sessions.reduce((sum, s) => sum + s.overall, 0) / sessions.length,
        )
      : 0;
    const maxWellness = healthLogs.some(
      (l) =>
        l.energy >= 8 &&
        l.mood >= 8 &&
        l.sleep >= 8 &&
        l.soreness <= 3 &&
        l.hydration >= 8,
    );
    const inSquad = (user?.length || 0) > 0;
    const flagged = prospects?.some((p) => p.flagged);
    const placed = prospects?.some((p) => p.placed);
    const reportShared = prospects?.some((p) => p.report_shared);

    // Performance
    await check("first_session", sessions.length >= 1);
    await check("sessions_5", sessions.length >= 5);
    await check("sessions_25", sessions.length >= 25);
    await check("rating_60", avgOverall >= 60);
    await check("rating_75", avgOverall >= 75);
    await check("rating_90", avgOverall >= 90);

    // Consistency
    await check("streak_3", streak >= 3);
    await check("streak_7", streak >= 7);
    await check("streak_30", streak >= 30);
    await check("training_5", trainingLogs.length >= 5);
    await check("training_20", trainingLogs.length >= 20);

    // Wellness
    await check("first_checkin", healthLogs.length >= 1);
    await check("checkins_7", healthLogs.length >= 7);
    await check("checkins_30", healthLogs.length >= 30);
    await check("wellness_perfect", maxWellness);

    // Faith
    await check("first_prayer", (profile.faithStreak || 0) >= 1);
    await check("faith_7", (profile.faithStreak || 0) >= 7);
    await check("faith_30", (profile.faithStreak || 0) >= 30);

    // Community
    await check("join_squad", inSquad);
    await check("scout_flagged", flagged);
    await check("scout_placed", placed);
    await check("report_shared", reportShared);

    return { newlyUnlocked };
  };

  // ── AI AGENT ────────────────────────────────────────────────
  const saveAgentConversation = async (
    userId,
    message,
    response,
    history,
    sessionId,
  ) => {
    const sid = sessionId || crypto.randomUUID();
    const { error } = await _client.from("agent_conversations").insert({
      user_id: userId,
      message,
      response,
      full_history: history,
      session_id: sid,
    });
    if (error) return { error: error.message };
    return { success: true, sessionId: sid };
  };

  const getAgentConversations = async (userId, limit = 5) => {
    const { data, error } = await _client
      .from("agent_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { data: [] };
    return { data };
  };

  const getAgentThread = async (sessionId) => {
    const { data, error } = await _client
      .from("agent_conversations")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (error) return { data: [] };
    return { data };
  };

  // ── TRACKER ─────────────────────────────────────────────────
  const getTracker = async (userId) =>
    (await _getData("tracker", userId)) || {};

  // ── REALTIME ────────────────────────────────────────────────
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

  const subscribeToVerifications = (type = "squad", callback) => {
    const table =
      type === "squad" ? "squad_verifications" : "agency_verifications";
    return _client
      .channel(`realtime-${table}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, callback)
      .subscribe();
  };

  const subscribeToTickets = (callback) => {
    return _client
      .channel(`realtime-tickets-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tickets" },
        (payload) => callback({ ...payload, eventType: "INSERT" }),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tickets" },
        (payload) => callback({ ...payload, eventType: "UPDATE" }),
      )
      .subscribe();
  };

  const subscribeToUserTickets = (userId, callback) => {
    return _client
      .channel(`realtime-user-tickets-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tickets",
          filter: `from_id=eq.${userId}`,
        },
        callback,
      )
      .subscribe();
  };

  const removeAllChannels = () => {
    try {
      _client.removeAllChannels();
    } catch (e) {}
  };

  // ─── Public API ────────────────────────────────────────────
  return {
    // ── CORE ────────────────────────────────────────────────────
    localDate: _localDate,
    localDateOffset: _localDateOffset,

    // ── AUTH & SESSION ──────────────────────────────────────────
    createUser,
    findUser,
    findUserByContact,
    checkContactExists,
    getSession,
    saveSession,
    clearSession,
    updateUserName,
    updateUserProfile,
    getUserStatus,
    uploadAvatar,

    // ── SECURITY ────────────────────────────────────────────────
    incrementLoginAttempts,
    resetLoginAttempts,
    updateLoginStreak,
    getLoginStreak,
    setSecurityQuestion,
    getUserSecurityQuestion,
    verifySecurityAnswer,
    resetPassword,

    // ── USERS & ADMIN ───────────────────────────────────────────
    getAdminIds,
    getAllUsers,
    getUserById,
    searchAllUsers,
    searchPlayers,
    getAllPlayers,
    getUnattachedPlayers,
    kickUser,
    banUser,
    unbanUser,
    removeUser,

    // ── VERIFICATIONS ───────────────────────────────────────────
    submitSquadVerification,
    submitAgencyVerification,
    checkTeamExists,
    getPendingVerifications,
    claimVerification,
    unclaimVerification,
    getAllVerifications,
    approveVerification,
    rejectVerification,
    getCoachVerification,
    acceptVerificationEdits,
    declineVerificationEdits,
    saveVerificationEdits,
    deleteAdminVerificationMessage,
    updateTeamSize,
    toggleRecruitment,
    updateVerificationStatus,

    // ── SQUAD ───────────────────────────────────────────────────
    getSquadPlayers,
    getCoachSquadDetails,
    getSquadReadiness,
    removePlayerFromSquad,
    sendSquadInvite,
    getSquadInvites,
    getCoachInvites,
    respondToInvite,
    getVerifiedCoaches,
    getFlaggedProspects,

    // ── TRIAL & NETWORK ─────────────────────────────────────────
    requestTrial,
    respondToTrialRequest,
    getTrialRequestStatus,
    getPendingTrialRequests,
    getTrialPlayers,
    requestClubNetwork,
    respondClubRequest,
    getClubNetworkStatus,
    getPendingClubRequests,
    getApprovedClubNetwork,

    // ── MESSAGES ────────────────────────────────────────────────
    _sendMessage,
    getMessages,
    getArchivedMessages,
    getThread,
    getUnreadCount,
    archiveMessage,
    unarchiveMessage,
    markMessageRead,
    getUserNameById,
    getUserNamesByIds,

    // ── TICKETS ─────────────────────────────────────────────────
    createTicket,
    getTickets,
    getUserTickets,
    claimTicket,
    resolveTicket,
    reopenTicket,
    getMyTickets,
    addTicketMessage,
    getTicketMessages,

    // ── TRAINING ────────────────────────────────────────────────
    getTraining,
    saveTraining,
    logTrainingSession,
    getTrainingLogs,
    getTodayTrainingLog,

    // ── HEALTH ──────────────────────────────────────────────────
    getHealth,
    saveHealthLog,
    getHealthLogs,
    getTodayHealthLog,
    getPlayerHealthLogs,

    // ── SESSION RATINGS ─────────────────────────────────────────
    saveSessionRating,
    getTodaySessionRating,
    _updateSessionRating,
    getPlayerSessionRatings,
    getSquadSessionRatings,

    // ── SCOUTING ────────────────────────────────────────────────
    getScoutProspects,
    saveProspect,
    unsaveProspect,
    updateProspectStatus,
    saveProspectReport,
    getProspectReport,

    // ── ACHIEVEMENTS ────────────────────────────────────────────
    getAchievements,
    unlockAchievement,
    checkAndUnlockAchievements,

    // ── AI AGENT ────────────────────────────────────────────────
    saveAgentConversation,
    getAgentConversations,
    getAgentThread,

    // ── TRACKER ─────────────────────────────────────────────────
    getTracker,

    // ── REALTIME ────────────────────────────────────────────────
    subscribeToMessages,
    subscribeToUserStatus,
    subscribeToVerifications,
    subscribeToTickets,
    subscribeToUserTickets,
    removeAllChannels,
  };
})();

window.HF_DB = HF_DB;
