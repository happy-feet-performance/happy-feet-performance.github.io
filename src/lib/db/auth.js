// Account creation, lookup, profile and avatar.
import { normalizeContact } from "../utils.js";
import { _client } from "./core.js";

export const createUser = async (data) => {
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

export const findUser = async (contactRaw, password) => {
  const contact = contactRaw.toLowerCase().replace(/\s/g, "");
  const { data: users } = await _client
    .from("users")
    .select(
      "*, squad_status, agency_status, banned, ban_reason, kicked, kicked_until, password_version, created_at",
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

export const findUserByContact = async (contactRaw) => {
  const contact = normalizeContact(contactRaw);
  const { data, error } = await _client
    .from("users")
    .select(
      "id, name, role, contact, contact_type, display_contact, local_phone, banned, ban_reason, kicked, kicked_until, login_attempts, locked_until",
    )
    .or(`contact.eq.${contact},local_phone.eq.${contact}`)
    .maybeSingle();
  if (error || !data) return null;
  return {
    ..._normaliseUser(data),
    banned: data.banned,
    banReason: data.ban_reason,
    kicked: data.kicked,
    kickedUntil: data.kicked_until,
    lockedUntil: data.locked_until,
    loginAttempts: data.login_attempts,
  };
};

export const checkContactExists = async (contactRaw) => {
  const contact = normalizeContact(contactRaw);
  const { data } = await _client
    .from("users")
    .select("id")
    .or(`contact.eq.${contact},local_phone.eq.${contact}`)
    .maybeSingle();
  return { data };
};

export const updateUserName = async (userId, name) => {
  const { error } = await _client
    .from("users")
    .update({ name })
    .eq("id", userId);
  if (error) return { error: error.message };
  return { success: true };
};

export const updateUserProfile = async (userId, profile, name = null) => {
  const update = { profile };
  if (name) update.name = name;

  const { data: user, error } = await _client
    .from("users")
    .update(update)
    .eq("id", userId)
    .select()
    .single();

  if (error) return { error: error.message };
  return { user: _normaliseUser(user) };
};

export const updateUserAccount = async (userId, updates) => {
  const update = { ...updates };
  if (update.contact) {
    update.contact = update.contact.toLowerCase().replace(/\s/g, "");
  }
  const { data: user, error } = await _client
    .from("users")
    .update(update)
    .eq("id", userId)
    .select()
    .single();

  if (error) return { error: error.message };
  return { user: _normaliseUser(user) };
};

export const getUserStatus = async (userId, type = null) => {
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

export const uploadAvatar = async (userId, file) => {
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

export const _normaliseUser = (u) => ({
  id: u.id,
  name: u.name,
  contact: u.contact,
  contactType: u.contact_type,
  displayContact: u.display_contact,
  localPhone: u.local_phone,
  role: u.role,
  profile: u.profile || {},
  squadStatus: u.squad_status,
  agencyStatus: u.agency_status,
  banned: u.banned,
  banReason: u.ban_reason,
  kicked: u.kicked,
  kickedUntil: u.kicked_until,
  lockedUntil: u.locked_until,
  loginAttempts: u.login_attempts,
  passwordVersion: u.password_version || 1,
  createdAt: u.created_at,
});
