// Login attempts/streaks, security questions, password and account changes.
import { hashPassword, normalizeContact } from "../utils.js";
import { _client, _localDate, _localDateOffset } from "./core.js";

export const incrementLoginAttempts = async (userId) => {
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

export const resetLoginAttempts = async (userId) => {
  await _client
    .from("users")
    .update({ login_attempts: 0, locked_until: null })
    .eq("id", userId);
};

export const updateLoginStreak = async (userId) => {
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

export const getLoginStreak = async (userId) => {
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

export const setSecurityQuestion = async (userId, question, answer) => {
  const hashedAnswer = await hashPassword(
    answer.toLowerCase().trim(),
  );
  const { error } = await _client
    .from("users")
    .update({ security_question: question, security_answer: hashedAnswer })
    .eq("id", userId);
  if (error) return { error: error.message };
  return { success: true };
};

export const getUserSecurityQuestion = async (contactRaw) => {
  const contact = normalizeContact(contactRaw);
  const { data, error } = await _client
    .from("users")
    .select("security_question")
    .or(`contact.eq.${contact},local_phone.eq.${contact}`)
    .maybeSingle();
  if (error || !data) return { data: null };
  return { data };
};

export const verifySecurityAnswer = async (contactRaw, answer) => {
  const contact = normalizeContact(contactRaw);
  const { data, error } = await _client
    .from("users")
    .select(
      "id, security_question, security_answer, security_attempts, locked_until",
    )
    .or(`contact.eq.${contact},local_phone.eq.${contact}`)
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

  const hashedAnswer = await hashPassword(
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

export const resetPassword = async (userId, newPassword) => {
  // fetch current password and history
  const { data: user } = await _client
    .from("users")
    .select("password, password_history, password_version")
    .eq("id", userId)
    .single();

  if (!user) return { error: "User not found." };

  // check against last 5 passwords
  const history = user.password_history || [];
  if (history.includes(newPassword)) {
    return { error: "You cannot reuse one of your last 5 passwords." };
  }

  // build new history by adding current password to front, keep last 5
  const newHistory = [user.password, ...history].slice(0, 5);

  const { error } = await _client
    .from("users")
    .update({
      password: newPassword,
      password_history: newHistory,
      password_version: (user.password_version || 1) + 1,
      login_attempts: 0,
      locked_until: null,
    })
    .eq("id", userId);

  if (error) return { error: error.message };
  return { success: true };
};
