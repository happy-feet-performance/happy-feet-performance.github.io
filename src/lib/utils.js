// ─── String helpers ────────────────────────────────────────
export const initials = (name = "") =>
  name
    .split(" ")
    .map((p) => p[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

export const timeAgo = (isoStr) => {
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} days ago`;
};

// ─── Colour helpers ────────────────────────────────────────
const AVATAR_COLORS = [
  "#1a7a2e",
  "#c8102e",
  "#C9961A",
  "#185FA5",
  "#5E35B1",
  "#0F6E56",
  "#993C1D",
  "#854F0B",
];

export const avatarColor = (name = "") => {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
};

export const ratingColor = (r) =>
  r >= 80 ? "var(--green)" : r >= 65 ? "var(--gold)" : "var(--red)";

// ─── Validation ────────────────────────────────────────────
export const normalizeContact = (value) =>
  value ? value.toLowerCase().replace(/\s/g, "") : "";

export const validateEmail = (email) =>
  !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const validatePhone = (value) => {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 15;
};

export const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// ─── Session helpers ───────────────────────────────────────
export const isNewUser = (session) => {
  // check if account was created less than 1 hour ago
  const createdAt = session.createdAt || session.profile?.createdAt;
  if (!createdAt) return false;
  const hourAgo = Date.now() - 60 * 60 * 1000;
  return new Date(createdAt).getTime() > hourAgo;
};

// ─── Ratings ───────────────────────────────────────────────
export const calcRating = (r, matchStats) => {
  if (!r || (!r.speed && !r.tech && !r.tact && !r.phys)) return null;
  const base = (r.speed + r.tech + r.tact + r.phys) / 4;
  if (!matchStats || matchStats.matches_played === 0) return Math.round(base);

  // match contribution: up to +5 bonus based on goal contributions per game
  const mp = matchStats.matches_played || 1;
  const contributions = (matchStats.goals || 0) + (matchStats.assists || 0);
  const contribRate = Math.min(contributions / mp, 1.5); // cap at 1.5 per game
  const matchBonus = contribRate * 3; // max +4.5

  // discipline penalty: -2 per red, -0.5 per yellow (max -5)
  const disciplinePenalty = Math.min(
    (matchStats.red_cards || 0) * 2 + (matchStats.yellow_cards || 0) * 0.5,
    5,
  );

  return Math.round(
    Math.min(100, Math.max(0, base + matchBonus - disciplinePenalty)),
  );
};

// ─── Dates ─────────────────────────────────────────────────
export const getDateForDayISO = (dayIndex) => {
  const now = new Date();
  const today = now.getDay();
  const diff = dayIndex - today;
  const date = new Date(now);
  date.setDate(now.getDate() + diff);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
