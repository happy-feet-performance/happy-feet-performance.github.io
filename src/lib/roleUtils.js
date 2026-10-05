// Actions shared by every role: messaging, profiles, support tickets,
// prayers. View functions fetch their data and mount a component from
// src/react/components/common; the rest are plain async actions.
//
// HF_DB, HF_ROUTER, HF_REACT and the role dashboards (HF_PLAYER, ...) are
// still classic-script globals, so they're looked up at call time.
import { toast, launchConfetti, launchEmojiConfetti } from "./dom.js";

const db = () => window.HF_DB;

const showView = (name, props) => {
  const mc = document.getElementById("main-content");
  if (mc) window.HF_REACT.mount(name, mc, props);
};

const roleHandler = (role) =>
  ({
    player: window.HF_PLAYER,
    coach: window.HF_COACH,
    scout: window.HF_SCOUT,
    admin: window.HF_ADMIN,
  })[role];

const refreshUnreadBadge = async (userId) => {
  const { data: msgs } = await db().getMessages(userId);
  const unreadCount = msgs?.filter((m) => !m.read).length || 0;
  window.HF_ROUTER.refreshSidenavBadge("messages", unreadCount, "var(--red)");
  return msgs;
};

const EMOJI_RE = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
export const isEmojiOnly = (text) => text.replace(EMOJI_RE, "").trim().length === 0;

// ── MESSAGING ──────────────────────────────────────────────

export const composeMessage = (role) => showView("ComposeMessage", { role });

// `role` is accepted for call-site compatibility; the view doesn't need it.
export const messageUser = (toId, toName, backView, role) =>
  showView("MessageUser", { toId, toName, backView, role });

export const sendMessage = async (toId, toName, backView, subject, body) => {
  if (!subject) return toast("Please enter a subject.", "error");
  if (!body) return toast("Please enter a message.", "error");

  const session = db().getSession();
  const { error } = await db()._sendMessage(session.userId, toId, subject, body);
  if (error) return toast(error, "error");

  toast(`Message sent to ${toName}!`, "success");
  window.HF_ROUTER.navTo(backView);
};

export const searchRecipients = async (query) => {
  const session = db().getSession();
  const { data } = await db().searchAllUsers(query, session.userId);
  return data || [];
};

export const sendComposedMessage = async (recipients, subject, body) => {
  if (recipients.length === 0)
    return toast("Please select at least one recipient.", "error");
  if (!subject) return toast("Please enter a subject.", "error");
  if (!body) return toast("Please enter a message.", "error");

  const session = db().getSession();
  const threadId = crypto.randomUUID();
  for (const recipient of recipients) {
    await db()._sendMessage(session.userId, recipient.id, subject, body, threadId);
  }
  if (recipients.length > 1) {
    await db()._sendMessage(
      session.userId,
      session.userId,
      subject,
      `[Group message to ${recipients.map((r) => r.name).join(", ")}]\n\n${body}`,
      threadId,
    );
  }

  toast(
    `Message sent to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}!`,
    "success",
  );
  window.HF_ROUTER.navTo("messages");
};

export const viewThread = async (threadId, otherUserId, subject, role) => {
  const session = db().getSession();
  const { data: threadMsgs } = await db().getThread(threadId, session.userId);

  // mark unread messages as read
  const unread =
    threadMsgs?.filter((m) => !m.read && m.to_id === session.userId) || [];
  for (const m of unread) await db().markMessageRead(m.id);
  await refreshUnreadBadge(session.userId);

  const senderIds = [...new Set((threadMsgs || []).map((m) => m.from_id))];
  const senderNames = await db().getUserNamesByIds(senderIds);
  const messages = (threadMsgs || []).map((m) => ({
    ...m,
    senderName: senderNames[m.from_id] || "HappyFeet",
  }));

  showView("MessageThread", {
    threadId,
    otherUserId,
    subject,
    role,
    messages,
    currentUserId: session.userId,
  });
};

// Returns true when the reply was sent, so the thread view can append it.
export const sendReply = async (toId, subject, threadId, body) => {
  if (!body) {
    toast("Please enter a reply.", "error");
    return false;
  }
  if (isEmojiOnly(body)) {
    const firstEmoji = body.match(EMOJI_RE)?.[0];
    if (firstEmoji) launchEmojiConfetti(firstEmoji);
  }

  const session = db().getSession();
  const result = await db()._sendMessage(session.userId, toId, subject, body, threadId);
  if (result?.error) {
    toast(result.error, "error");
    return false;
  }
  return true;
};

export const archiveMessage = async (messageId, _el, role) => {
  await db().archiveMessage(messageId);
  toast("Message archived.", "success");
  const session = db().getSession();
  roleHandler(role)?.messages?.(session);
  await refreshUnreadBadge(session.userId);
};

export const unarchiveMessage = async (messageId, role) => {
  await db().unarchiveMessage(messageId);
  toast("Message unarchived.", "success");
  window._archivedSectionOpen = true;
  roleHandler(role)?.messages?.(db().getSession());
};

// System/admin messages open in a modal instead of a thread.
export const readMessage = async (messageId, _el, role) => {
  await db().markMessageRead(messageId);
  const session = db().getSession();
  const msgs = await refreshUnreadBadge(session.userId);

  const msg = msgs?.find((m) => m.id === messageId);
  if (msg) {
    const overlay = document.createElement("div");
    overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:flex;align-items:center;justify-content:center;padding:var(--sp-xl);`;
    const box = document.createElement("div");
    box.style.cssText = `background:var(--bg);border-top:3px solid var(--gold);padding:var(--sp-2xl);max-width:480px;width:100%;`;
    const from = document.createElement("div");
    from.style.cssText = `font-family:var(--font);font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text3);margin-bottom:4px;`;
    from.textContent = `HappyFeet ${msg.from_id === "system" ? "System" : "Admin"}`;
    const subject = document.createElement("div");
    subject.style.cssText = `font-family:var(--font);font-size:16px;font-weight:700;color:var(--text);margin-bottom:var(--sp-md);`;
    subject.textContent = msg.subject || "Message";
    const body = document.createElement("div");
    body.style.cssText = `font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:var(--sp-xl);`;
    body.textContent = msg.body;
    const ok = document.createElement("button");
    ok.className = "btn btn-primary";
    ok.innerHTML = `<i class="ti ti-circle-check"></i> Got it`;
    ok.onclick = () => {
      overlay.remove();
      window.HF_ROUTER.navTo("messages");
    };
    box.append(from, subject, body, ok);
    overlay.append(box);
    document.body.appendChild(overlay);
  }

  roleHandler(role)?.messages?.(session);
};

export const reportToAdmin = async (fromId, senderName) => {
  const session = db().getSession();
  const reason = prompt(`Report ${senderName} to admin?\n\nPlease describe the issue:`);
  if (!reason) return;

  const result = await db().createTicket(
    session.userId,
    `Report: ${senderName}`,
    `${session.name} has reported ${senderName}.\n\nReason: ${reason}`,
    "report",
  );
  if (result.error) return toast(result.error, "error");
  toast(`${senderName} has been reported.`, "success");
};

// ── PROFILES ───────────────────────────────────────────────

export const viewSenderProfile = async (userId, role, backView = "messages") => {
  const { data: user } = await db().getUserById(userId);
  if (!user) return toast("User not found.", "error");
  showView("UserProfile", { user, backView });
};

// ── SUPPORT TICKETS ────────────────────────────────────────

export const myTickets = async (s, fromMessages = false, role) => {
  const { data: tickets } = await db().getUserTickets(s.userId);
  showView("MyTickets", { session: s, tickets: tickets || [], fromMessages, role });
};

export const contactAdmin = (role) => myTickets(db().getSession(), true, role);

export const newTicket = (s, fromMessages = false, role) =>
  showView("NewTicket", { fromMessages, role });

export const sendTicket = async (fromMessages, role, { category, subject, body }) => {
  if (!subject) return toast("Please enter a subject.", "error");
  if (!body) return toast("Please enter a message.", "error");

  const session = db().getSession();
  const result = await db().createTicket(session.userId, subject, body, category);
  if (result.error) return toast(result.error, "error");

  toast("Ticket submitted! An admin will respond shortly.", "success");
  myTickets(session, fromMessages, role);
};

export const viewTicketThread = async (ticketId, subject, fromMessages = false, role) => {
  const s = db().getSession();
  const [{ data: msgs }, { data: tickets }] = await Promise.all([
    db().getTicketMessages(ticketId),
    db().getUserTickets(s.userId),
  ]);
  showView("TicketThread", {
    ticketId,
    subject,
    fromMessages,
    role,
    currentUserId: s.userId,
    ticket: tickets?.find((t) => t.id === ticketId),
    messages: msgs || [],
  });
};

export const sendUserTicketReply = async (ticketId, subject, fromMessages, role, body) => {
  if (!body) return;
  const s = db().getSession();
  const result = await db().addTicketMessage(ticketId, s.userId, body, false);
  if (result.error) return toast(result.error, "error");
  viewTicketThread(ticketId, subject, fromMessages, role);
};

export const markTicketResolved = async (ticketId, subject, fromMessages, role) => {
  const result = await db().resolveTicket(ticketId);
  if (result.error) return toast(result.error, "error");
  toast("Ticket marked as resolved.", "success");
  viewTicketThread(ticketId, subject, fromMessages, role);
};

export const reopenUserTicket = async (ticketId, subject, fromMessages, role) => {
  const result = await db().reopenTicket(ticketId);
  if (result.error) return toast(result.error, "error");
  toast("Ticket reopened.", "success");
  viewTicketThread(ticketId, subject, fromMessages, role);
};

// ── AVATAR ─────────────────────────────────────────────────

// Still swaps the preview's DOM directly; the EditProfile components render
// #avatar-preview / #avatar-banner. Move into an AvatarPicker component
// when those views are reworked.
export const previewAvatar = (input) => {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) return toast("Image must be under 2MB.", "error");
  window._pendingAvatarFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    ["avatar-preview", "avatar-banner"].forEach((id) => {
      const el = document.getElementById(id);
      if (el)
        el.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
    });
  };
  reader.readAsDataURL(file);
};

// ── PRAYERS ────────────────────────────────────────────────

export const togglePrayer = (prayerId, role) => {
  const session = db().getSession();
  const today = db().localDate();
  const key = `hf_faith_checklist_${session.userId}_${today}`;
  const checklist = JSON.parse(localStorage.getItem(key) || "{}");

  checklist[prayerId] = !checklist[prayerId];
  localStorage.setItem(key, JSON.stringify(checklist));

  const morningIds = ["morning", "prematch", "struggle"];
  const allMorningDone = morningIds.every((id) => checklist[id]);
  const allEveningDone = !!checklist["evening"];

  // save streak
  if (allMorningDone) {
    const p = session.profile || {};
    const lastFaith = p.lastFaithDate;
    const yesterday = db().localDateOffset(-1);
    let newStreak = 1;
    if (lastFaith === yesterday) newStreak = (p.faithStreak || 0) + 1;
    else if (lastFaith === today) newStreak = p.faithStreak || 1;
    const updatedProfile = { ...p, faithStreak: newStreak, lastFaithDate: today };
    db().updateUserProfile(session.userId, updatedProfile);
    session.profile = updatedProfile;
    db().saveSession(session);
  }

  // re-render immediately to show checked state
  roleHandler(role)?.faith?.(db().getSession());

  // then confetti on top after render
  if (allMorningDone && allEveningDone) {
    setTimeout(() => {
      toast("Full day devotion complete! 🙏", "success");
      launchConfetti();
    }, 100);
  } else if (allMorningDone) {
    setTimeout(() => toast("Morning devotion complete! 🙏", "success"), 100);
  }
};

// ── FILTERING ──────────────────────────────────────────────

// Legacy: filters coach Find My Team by rewriting the list's DOM. Remove
// once that view keeps its filters in React state.
export const filterPlayers = (allPlayersKey, cardFn, listId, filters) => {
  const list = document.getElementById(listId);
  if (!list || !window[allPlayersKey]) return;

  const { pos, tier, search } = filters;
  const filtered = window[allPlayersKey].filter((p) => {
    const prof = p.profile || {};
    const matchPos = !pos || prof.pos === pos;
    const matchTier = !tier || prof.tier === tier;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchPos && matchTier && matchSearch;
  });

  list.innerHTML =
    filtered.length === 0
      ? `<div style="text-align:center;padding:24px;color:var(--text2);font-size:13px">No players match your filters.</div>`
      : filtered.map((p) => cardFn(p)).join("");
};
