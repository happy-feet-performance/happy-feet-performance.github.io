// User lists and admin moderation.
import { _client } from "./core.js";

export const getAdminIds = async () => {
  const { data, error } = await _client
    .from("users")
    .select("id")
    .eq("role", "admin");
  if (error) return [];
  return data?.map((u) => u.id) || [];
};

export const _notifyAdmins = async (subject, body) => {
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

export const getAllUsers = async (basic = false) => {
  const select = basic ? "id, name, role, contact, profile" : "*";

  const { data, error } = await _client
    .from("users")
    .select(select)
    .order("created_at", { ascending: false });

  if (error) return { data: [] };
  return { data };
};

export const getUserById = async (userId) => {
  const { data, error } = await _client
    .from("users")
    .select("id, name, role, profile, squad_status, agency_status")
    .eq("id", userId)
    .single();
  if (error) return { data: null };
  return { data };
};

export const searchAllUsers = async (query, excludeId) => {
  const { data, error } = await _client
    .from("users")
    .select("id, name, role, contact")
    .or(`name.ilike.%${query}%,contact.ilike.%${query}%`)
    .neq("id", excludeId)
    .limit(8);
  if (error) return { data: [] };
  return { data };
};

export const searchPlayers = async (query) => {
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

export const getAllPlayers = async () => {
  const { data, error } = await _client
    .from("users")
    .select("id, name, profile")
    .eq("role", "player")
    .order("created_at", { ascending: false });
  if (error) return { data: [] };
  return { data };
};

export const getUnattachedPlayers = async (filters = {}) => {
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

export const kickUser = async (userId) => {
  const kickedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const { error } = await _client
    .from("users")
    .update({ kicked: true, kicked_until: kickedUntil })
    .eq("id", userId);
  if (error) return { error: error.message };
  return { success: true };
};

export const banUser = async (userId, reason) => {
  const { error } = await _client
    .from("users")
    .update({ banned: true, ban_reason: reason })
    .eq("id", userId);
  if (error) return { error: error.message };
  return { success: true };
};

export const unbanUser = async (userId) => {
  const { error } = await _client
    .from("users")
    .update({ banned: false, ban_reason: null })
    .eq("id", userId);
  if (error) return { error: error.message };
  return { success: true };
};

export const removeUser = async (userId) => {
  const { error } = await _client.from("users").delete().eq("id", userId);
  if (error) return { error: error.message };
  return { success: true };
};
