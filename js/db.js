/**
 * HappyFeet Performance Hub: db.js
 * ─────────────────────────────────
 * Database abstraction layer.
 * Currently uses localStorage for offline-first operation.
 *
 * SCHEMA
 * ──────
 * hf_users[]  {
 *   id          : string  (timestamp-based UUID)
 *   name        : string
 *   contact     : string  (email OR full phone e.g. +233244123456)
 *   contactType : 'email' | 'phone'
 *   localPhone  : string  (digits only, no country code)
 *   displayContact: string (formatted for display)
 *   password    : string  (plain for demo; hash in production)
 *   role        : 'player' | 'coach' | 'scout'
 *   profile     : object  (role-specific fields)
 *   created     : ISO date string
 * }
 *
 * hf_session  {
 *   userId       : string
 *   role         : string
 *   name         : string
 *   contact      : string
 *   contactType  : string
 *   displayContact: string
 *   profile      : object
 * }
 *
 * hf_tracker  { [playerName]: { sessions:[], ... } }
 * hf_health   { checkins:{}, injuries:[] }
 * hf_training { sessions:[], schedule:{} }
 * hf_pm       { teams:[], players:[] }
 * hf_scout    { prospects:[], placements:[], clubs:[] }
 */

const HF_DB = (() => {
  // ─── Private helpers ───────────────────────────────────────
  const _get = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  };
  const _set = (key, val) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch {
      return false;
    }
  };

  // ─── Users ─────────────────────────────────────────────────
  const getUsers = () => _get("hf_users") || [];
  const saveUsers = (users) => _set("hf_users", users);

  const createUser = async (data) => {
    const users = getUsers();
    const normalised = data.contact.toLowerCase().replace(/\s/g, "");
    if (
      users.find(
        (u) => u.contact.toLowerCase().replace(/\s/g, "") === normalised,
      )
    ) {
      return {
        error:
          data.contactType === "phone"
            ? "This phone number is already registered."
            : "This email address is already registered.",
      };
    }
    const user = {
      id: `hf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      created: new Date().toISOString(),
      ...data,
      contact: normalised, // store normalised
    };
    users.push(user);
    saveUsers(users);
    return { user };
  };

  const findUser = async (contactRaw, password) => {
    const users = getUsers();
    const contact = contactRaw.toLowerCase().replace(/\s/g, "");
    return (
      users.find((u) => {
        const stored = (u.contact || "").toLowerCase().replace(/\s/g, "");
        const local = (u.localPhone || "").replace(/\s/g, "");
        const contactMatch = stored === contact || local === contact;
        return contactMatch && u.password === password;
      }) || null
    );
  };

  const updateUserProfile = async (userId, profile) => {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return { error: "User not found" };
    users[idx].profile = { ...users[idx].profile, ...profile };
    saveUsers(users);
    return { user: users[idx] };
  };

  // ─── Session ───────────────────────────────────────────────
  const getSession = () => _get("hf_session");
  const saveSession = (session) => _set("hf_session", session);
  const clearSession = () => localStorage.removeItem("hf_session");

  // ─── Tracker data ──────────────────────────────────────────
  const getTracker = () => _get("hf_tracker") || {};
  const saveTracker = (data) => _set("hf_tracker", data);

  // ─── Health data ───────────────────────────────────────────
  const getHealth = () => _get("hf_health") || { checkins: {}, injuries: [] };
  const saveHealth = (data) => _set("hf_health", data);

  // ─── Training data ─────────────────────────────────────────
  const getTraining = () =>
    _get("hf_training") || { sessions: [], schedule: {} };
  const saveTraining = (data) => _set("hf_training", data);

  // ─── Player management data ────────────────────────────────
  const getPM = () => _get("hf_pm") || { teams: [], players: [] };
  const savePM = (data) => _set("hf_pm", data);

  // ─── Scouting data ─────────────────────────────────────────
  const getScout = () =>
    _get("hf_scout") || {
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
          needs: "All positions U17–U21",
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
  const saveScout = (data) => _set("hf_scout", data);

  // ─── Public API ────────────────────────────────────────────
  return {
    // Users
    createUser,
    findUser,
    updateUserProfile,
    // Session (sync)
    getSession,
    saveSession,
    clearSession,
    // Feature data
    getTracker,
    saveTracker,
    getHealth,
    saveHealth,
    getTraining,
    saveTraining,
    getPM,
    savePM,
    getScout,
    saveScout,
  };
})();

// Make available globally
window.HF_DB = HF_DB;
