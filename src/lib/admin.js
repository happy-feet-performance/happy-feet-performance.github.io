// Admin dashboard: view routing, data loaders and actions.
//
// Each view component (src/react/components/admin/views.jsx) loads its own
// data with one of the load* functions. Actions return true when something
// changed, so the calling view can reload.
import * as db from "./db/index.js";
import { toast } from "./dom.js";
import { refreshSidenavBadge } from "./router.js";
import { viewSenderProfile } from "./roleUtils.js";
import { showView } from "./views.js";

// ─── Views ─────────────────────────────────────────────────
const VIEWS = {
  dashboard: (s) => showView("AdminDashboard", { session: s }),
  "squad-verifications": (s) => verifications(s, "squad"),
  "agency-verifications": (s) => verifications(s, "agency"),
  users: (s) => showView("AdminUsers", { session: s }),
  messages: (s) => messages(s),
  tickets: (s) => tickets(s),
};

export const render = (view, session) => (VIEWS[view] || VIEWS.dashboard)(session);

export const verifications = (s, type = "squad") => showView("AdminVerifications", { session: s, kind: type });
export const tickets = (s) => showView("AdminTickets", { session: s });
export const messages = (s) => showView("AdminMessages", { session: s });
export const replyTicket = (ticketId, subject) =>
  showView("AdminTicketThread", { ticketId, subject, session: db.getSession() });
export const viewTicketUser = (userId) => viewSenderProfile(userId, "admin", "tickets");

// ─── Loaders ───────────────────────────────────────────────
const countStatus = (list, status) => list?.filter((v) => v.status === status).length || 0;

export const loadDashboard = async () => {
  const [{ data: pending }, { data: agencyPending }, { data: squads }, { data: agencies }, { data: users }] =
    await Promise.all([
      db.getPendingVerifications("squad"),
      db.getPendingVerifications("agency"),
      db.getAllVerifications("squad"),
      db.getAllVerifications("agency"),
      db.getAllUsers(),
    ]);
  const pendingCount = (pending?.length || 0) + (agencyPending?.length || 0);
  refreshSidenavBadge("verifications", pendingCount, "var(--gold)");
  return {
    pending,
    agencyPending,
    pendingCount,
    totalUsers: users?.length || 0,
    verifiedSquadCount: countStatus(squads, "verified"),
    verifiedAgencyCount: countStatus(agencies, "verified"),
  };
};

export const loadVerifications = async (type) => (await db.getAllVerifications(type)).data;

export const loadUsers = async () => (await db.getAllUsers()).data;

export const loadTickets = async (userId) => {
  const { data: all } = await db.getTickets();
  const claimed = all?.filter((t) => t.status === "claimed") || [];
  return {
    open: all?.filter((t) => t.status === "open") || [],
    mine: claimed.filter((t) => t.claimed_by === userId),
    others: claimed.filter((t) => t.claimed_by !== userId),
    resolved: all?.filter((t) => t.status === "resolved") || [],
  };
};

export const loadMessages = async (userId) => {
  const [{ data: msgs }, { data: archived }] = await Promise.all([
    db.getMessages(userId),
    db.getArchivedMessages(userId),
  ]);
  const senderNames = await db.getUserNamesByIds([...(msgs || []), ...(archived || [])].map((m) => m.from_id));
  const withSender = (m) => ({ ...m, senderName: senderNames[m.from_id] || "HappyFeet" });
  return { messages: (msgs || []).map(withSender), archived: (archived || []).map(withSender) };
};

export const loadTicketMessages = async (ticketId) => (await db.getTicketMessages(ticketId)).data;

// ─── Actions ───────────────────────────────────────────────
// Shows a toast for an { error } result; returns true on success.
const ok = (result, message) => {
  if (result?.error) {
    toast(result.error, "error");
    return false;
  }
  if (message) toast(message, "success");
  return true;
};

// Squad / agency verification
const approve = async (type, verificationId, userId, name) => {
  if (!ok(await db.approveVerification(verificationId, userId, name, type), `${name} approved!`)) return false;
  await db.unclaimVerification(verificationId, type);
  return true;
};

const reject = async (type, verificationId, userId, name) => {
  const reason = prompt(`Reason for rejecting ${name}?`);
  if (!reason) return false;
  const result = await db.rejectVerification(verificationId, userId, name, reason, type);
  if (result.error) return ok(result);
  toast(`${name} rejected.`, "error");
  await db.unclaimVerification(verificationId, type);
  return true;
};

export const approveSquad = (id, coachId, teamName) => approve("squad", id, coachId, teamName);
export const approveAgency = (id, scoutId, agencyName) => approve("agency", id, scoutId, agencyName);
export const rejectSquad = (id, coachId, teamName) => reject("squad", id, coachId, teamName);
export const rejectAgency = (id, scoutId, agencyName) => reject("agency", id, scoutId, agencyName);

export const claimAndReview = async (verificationId, type) =>
  ok(await db.claimVerification(verificationId, db.getSession().userId, type));

export const unclaimVerification = async (verificationId, type) =>
  ok(await db.unclaimVerification(verificationId, type), "Verification released.");

export const saveEdits = async (verificationId, coachId, originalName, { teamName, league, year, ground, notes }) => {
  teamName = teamName.trim();
  league = league.trim();
  if (!teamName) return ok({ error: "Team name cannot be empty." });
  if (!league) return ok({ error: "League cannot be empty." });

  const result = await db.saveVerificationEdits(verificationId, coachId, {
    teamName,
    league,
    year: String(year).trim(),
    ground: ground.trim(),
    notes: notes.trim(),
    originalName,
  });
  if (!ok(result)) return false;

  const { data: pending } = await db.getPendingVerifications();
  refreshSidenavBadge("verifications", pending?.length || 0, "var(--gold)");
  toast("Changes saved. Coach will see the update on their next login.", "success");
  return true;
};

// Users
export const kickUser = async (userId, name) => {
  if (!confirm(`Kick ${name}? They will be logged out immediately.`)) return false;
  return ok(await db.kickUser(userId), `${name} has been kicked.`);
};

export const banUser = async (userId, name) => {
  const reason = prompt(`Ban reason for ${name}:`);
  if (!reason) return false;
  return ok(await db.banUser(userId, reason), `${name} has been banned.`);
};

export const unbanUser = async (userId) => ok(await db.unbanUser(userId), "User has been unbanned.");

export const removeUser = async (userId, name) => {
  if (!confirm(`Permanently remove ${name}? This cannot be undone.`)) return false;
  return ok(await db.removeUser(userId), `${name} has been removed.`);
};

// Tickets
export const claimTicket = async (ticketId) =>
  ok(await db.claimTicket(ticketId, db.getSession().userId), "Ticket claimed!");

export const resolveTicket = async (ticketId, fromId, subject) => {
  if (!ok(await db.resolveTicket(ticketId))) return false;
  await db._sendMessage(
    "system",
    fromId,
    `Ticket resolved: ${subject}`,
    `Your support ticket "${subject}" has been resolved by our team. If you need further assistance please submit a new ticket.`,
  );
  toast("Ticket resolved!", "success");
  return true;
};

export const reopenTicket = async (ticketId) => ok(await db.reopenTicket(ticketId), "Ticket reopened.");

export const sendTicketReply = async (ticketId, body) => {
  body = body.trim();
  if (!body) return false;
  return ok(await db.addTicketMessage(ticketId, db.getSession().userId, body, true));
};
