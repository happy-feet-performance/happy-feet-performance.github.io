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

    // Check if user already exists
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

  // ─── Public API ────────────────────────────────────────────
  return {
    createUser,
    findUser,
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
  };
})();

window.HF_DB = HF_DB;
