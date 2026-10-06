// Supabase client, local session, generic per-user data rows, date helpers.
//
// supabase-js and HF_CONFIG are still loaded by classic <script> tags, which
// run before any module, so they're available here at import time.
export const _client = window.supabase.createClient(
  window.HF_CONFIG.SUPABASE_URL,
  window.HF_CONFIG.SUPABASE_ANON_KEY,
);

// ─── Local session ─────────────────────────────────────────
export const getSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem("hf_session") || "null");
  } catch {
    return null;
  }
};

export const saveSession = (session) => {
  sessionStorage.setItem("hf_session", JSON.stringify(session));
};

export const clearSession = () => sessionStorage.removeItem("hf_session");

// ─── Generic data table getters and setters ────────────────────────────
export const _getData = async (table, userId) => {
  const { data } = await _client
    .from(table)
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.data || null;
};

export const _saveData = async (table, userId, payload) => {
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
export const _localDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export const _localDateOffset = (days) => {
  const now = new Date();
  now.setDate(now.getDate() + days);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
