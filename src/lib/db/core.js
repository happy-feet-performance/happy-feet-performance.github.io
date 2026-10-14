// Supabase client, local session, generic per-user data rows, date helpers.
//
// The project URL and anon key are baked in at build time (see
// vite.config.js): VITE_SUPABASE_* from .env.local locally, or the
// SUPABASE_URL / SUPABASE_ANON_KEY variables on Netlify.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY)
  throw new Error("Supabase isn't configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example).");

export const _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
