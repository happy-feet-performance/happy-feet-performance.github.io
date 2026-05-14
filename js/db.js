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

  // ─── Local session (still uses localStorage for speed) ─────
  const getSession = () => {
    try {
      return JSON.parse(localStorage.getItem("hf_session") || "null");
    } catch {
      return null;
    }
  };
  const saveSession = (session) => {
    localStorage.setItem("hf_session", JSON.stringify(session));
  };
  const clearSession = () => localStorage.removeItem("hf_session");

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
      .select("*")
      .eq("password", password);

    if (!users) return null;

    return users.find((u) => {
      const stored = (u.contact || "").toLowerCase().replace(/\s/g, "");
      const local = (u.local_phone || "").replace(/\s/g, "");
      return stored === contact || local === contact;
    })
      ? _normaliseUser(
          users.find((u) => {
            const stored = (u.contact || "").toLowerCase().replace(/\s/g, "");
            const local = (u.local_phone || "").replace(/\s/g, "");
            return stored === contact || local === contact;
          }),
        )
      : null;
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

    return { success: true };
  };

  const getMessages = async (userId) => {
    const { data, error } = await _client
      .from("messages")
      .select("*")
      .eq("to_id", userId)
      .order("created_at", { ascending: false });
    if (error) return { data: [] };
    return { data };
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
    const { error } = await _client
      .from("users")
      .update({ kicked: true })
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

  // ─── Public API ────────────────────────────────────────────
  return {
    createUser,
    findUser,
    findAdmin,
    updateUserProfile,
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
    submitSquadVerification,
    updateSquadStatus,
    checkTeamExists,
    getPendingVerifications,
    approveSquadVerification,
    rejectSquadVerification,
    getMessages,
    markMessageRead,
    getAllVerifications,
    getAllUsers,
    kickUser,
    banUser,
    unbanUser,
    removeUser,
  };
})();

window.HF_DB = HF_DB;
