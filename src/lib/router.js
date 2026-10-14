// URL routing, session start-up, view switching and realtime subscriptions.
//
// Pages by path:
//   /, /about          public home page (src/react/home), signed in or not
//   /login, /signup    auth screens (src/react/auth)
//   /app/<view>        the app shell (src/react/shell) showing a role view
// /app without a session redirects to /login; the auth pages redirect a
// signed-in user to their dashboard.
//
// HF_REACT (src/react/mount.jsx) is a global, looked up at call time.
import * as db from "./db/index.js";
import { toast } from "./dom.js";
import { getAppState, setAppState } from "./appStore.js";
import { logout, showScreen } from "./auth.js";
import { roleModule } from "./roles.js";
import { currentPath, navigate, onPathChange } from "./location.js";
import * as agent from "./agent.js";

const roleHandler = roleModule;

export const currentView = () => getAppState().activeView;

// ─── Sidebar badges ────────────────────────────────────────
export const refreshSidenavBadge = (view, count, color = "var(--gold)") => {
  setAppState(({ badges }) => {
    const next = { ...badges };
    if (count > 0) next[view] = { count, color };
    else delete next[view];
    return { badges: next };
  });
};

// Re-render the sidebar for an updated session (e.g. team size or status
// changed). Pass `unread` to also reset the messages badge.
export const buildSidenav = (session, unread) => {
  // copy: callers mutate the session object in place
  setAppState({ session: { ...session } });
  if (unread !== undefined) refreshSidenavBadge("messages", unread, "var(--red)");
};

// ─── Mobile nav ────────────────────────────────────────────
export const toggleMobileNav = () => setAppState(({ mobileNavOpen }) => ({ mobileNavOpen: !mobileNavOpen }));
export const closeMobileNav = () => setAppState({ mobileNavOpen: false });

// ─── Incoming messages ─────────────────────────────────────
// An open thread view registers here so new messages in that thread are
// appended in place instead of re-rendering the Messages list. A listener
// returns true when it handled the message.
const messageListeners = new Set();
export const onIncomingMessage = (listener) => {
  messageListeners.add(listener);
  return () => messageListeners.delete(listener);
};

// ─── Switching between the auth screens and the app ───────
export const showLogin = (message) => {
  sessionStarted = false;
  setAppState({ shellVisible: false, mobileNavOpen: false, session: null, badges: {} });
  showScreen("screen-login");
  navigate("/login");
  if (message) setTimeout(() => toast(message, "error"), 300);
};

let subscriptionsActive = false;
// set once startSession() has run for the signed-in user
let sessionStarted = false;

export const resetSubscriptions = () => {
  subscriptionsActive = false;
  sessionStarted = false;
  // remove all existing Supabase channels
  db.removeAllChannels();
};

export const _forceLogout = () => {
  db.clearSession();
  db.removeAllChannels();
  agent.hide();
  subscriptionsActive = false;
  showLogin();
  setTimeout(() => toast("Your password was changed. Please log in again.", "error"), 5000);
};

// ─── Routing ───────────────────────────────────────────────
const routeTo = (view, session) => {
  const handler = roleHandler(session.role);
  if (!handler) return toast("Dashboard not found for this role.", "error");
  window.HF_REACT?.unmountAll();
  handler.render(view, session);
};

// Called by AppShell whenever the active view (or viewKey) changes.
export const renderView = (view) => {
  const session = db.getSession();
  if (session) routeTo(view || "dashboard", session);
};

export const navTo = (view, _el, anchor) => {
  if (window._stopConfetti) window._stopConfetti();
  const [routeView, routeAnchor] = (view || "").split("#");
  const session = db.getSession();
  if (!session) {
    logout();
    return;
  }

  // check user status on every navigation
  if (session.role !== "admin") {
    db.getUserStatus(session.userId).then((status) => {
      if (!status) {
        db.clearSession();
        return showLogin("Your account has been removed by an admin.");
      }
      if (status.banned) {
        db.clearSession();
        return showLogin("Your account has been banned. Reason: " + (status.ban_reason || "Contact support."));
      }
      if (status.kicked) {
        db.clearSession();
        return showLogin("You have been kicked for 1 hour by an admin. Please try again later.");
      }
    });
  }

  // update message badge
  if (session.role !== "admin" && session.userId) {
    db.getMessages(session.userId).then(({ data: msgs }) => {
      refreshSidenavBadge("messages", msgs?.filter((m) => !m.read).length || 0, "var(--red)");
    });
  }

  const path = `/app/${routeView || "dashboard"}`;
  if (currentPath() === path) {
    // same view: re-render it (e.g. clicking the current sidebar item)
    setAppState(({ viewKey }) => ({ viewKey: viewKey + 1, mobileNavOpen: false }));
  } else {
    navigate(path);
  }
  if (routeAnchor || anchor) {
    setTimeout(() => {
      const target = document.getElementById(routeAnchor || anchor);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }
};

// ─── Launch app after login/signup ─────────────────────────
const countUnclaimed = (list, userId) =>
  list?.filter((v) => !v.claimed_by || v.claimed_by === userId).length || 0;

const unreadTicketReplies = (tickets) =>
  tickets?.filter((t) => {
    const msgs = t.messages || [];
    return msgs[msgs.length - 1]?.is_admin && t.status !== "resolved";
  }).length || 0;

// Sign-in landing: start the session and open the dashboard.
export const launch = async (session) => {
  await startSession(session);
  navigate("/app/dashboard");
};

// Session start-up, once per sign-in (or page load with a saved session):
// sidebar badges, realtime subscriptions and the AI agent.
const startSession = async (session) => {
  sessionStarted = true;
  setAppState({ shellVisible: true, mobileNavOpen: false, session, badges: {} });

  const isAdmin = session.role === "admin";

  if (session.role === "coach" && session.squadStatus === "verified") {
    const { data: squadPlayers } = await db.getSquadPlayers(session.userId);
    session.profile = { ...session.profile, teamSize: squadPlayers?.length || 0 };
    db.saveSession(session);
    buildSidenav(session);
  }

  const [unreadCount, pendingVerifications, openTicketCount, ticketReplies] = await Promise.all([
    // unread messages
    !isAdmin
      ? db.getMessages(session.userId).then(({ data }) => data?.filter((m) => !m.read).length || 0)
      : Promise.resolve(0),

    // pending verifications (admin only)
    isAdmin
      ? Promise.all([db.getPendingVerifications("squad"), db.getPendingVerifications("agency")]).then(
          ([{ data: s }, { data: a }]) => countUnclaimed(s, session.userId) + countUnclaimed(a, session.userId),
        )
      : Promise.resolve(0),

    // open tickets (admin only)
    isAdmin
      ? db.getTickets("open").then(({ data }) => data?.filter((t) => !t.claimed_by).length || 0)
      : Promise.resolve(0),

    // unread ticket replies (non-admin)
    !isAdmin ? db.getUserTickets(session.userId).then(({ data }) => unreadTicketReplies(data)) : Promise.resolve(0),
  ]);

  refreshSidenavBadge("messages", unreadCount + ticketReplies, "var(--red)");
  refreshSidenavBadge("verifications", pendingVerifications, "var(--gold)");
  refreshSidenavBadge("tickets", openTicketCount, "var(--red)");

  // ── Ticket subscription (admin, immediate) ───────────────────
  if (isAdmin) {
    db.subscribeToTickets(async (payload) => {
      const { data: openTickets } = await db.getTickets("open");
      // unclaimed = no claimed_by set
      refreshSidenavBadge("tickets", openTickets?.filter((t) => !t.claimed_by).length || 0, "var(--red)");
      if (payload.eventType === "INSERT") toast("New support ticket received!", "success");

      const view = currentView();
      if (view === "tickets") roleModule("admin").tickets?.(db.getSession());
      if (view === "dashboard") roleModule("admin").render?.("dashboard", db.getSession());
    });
  }

  agent.show();

  // ── Realtime subscriptions (after 1s) ───────────────────────
  setTimeout(() => {
    if (subscriptionsActive) return;
    subscriptionsActive = true;
    startRealtime(session);
  }, 1000);
};

const startRealtime = (session) => {
  const isAdmin = session.role === "admin";

  const onNewMessage = async (newMessage) => {
    const { data: msgs } = await db.getMessages(session.userId);
    const count = msgs?.filter((m) => !m.read).length || 0;
    refreshSidenavBadge("messages", count, "var(--red)");
    toast(`New message: ${newMessage.subject || "You have a new message"}`, "success");

    const view = currentView();
    if (view === "dashboard") {
      const metricEl = document.querySelector('.metric-card[data-type="messages"]');
      if (metricEl) {
        metricEl.querySelector(".metric-val").textContent = count;
        metricEl.querySelector(".metric-sub").textContent = count > 0 ? `${count} unread` : "All caught up";
      }
    } else if (view === "messages") {
      const handled = [...messageListeners].some((listener) => listener(newMessage));
      if (!handled) roleHandler(session.role)?.messages?.(db.getSession());
    }
  };

  db.subscribeToMessages(session.userId, (msg) => {
    // only process messages sent TO this user, not FROM this user
    if (msg.from_id === session.userId) return;
    if (msg.to_id !== session.userId) return;
    onNewMessage(msg);
  });

  if (isAdmin) {
    db.subscribeToVerifications("squad", async () => {
      const [{ data: s }, { data: a }] = await Promise.all([
        db.getPendingVerifications("squad"),
        db.getPendingVerifications("agency"),
      ]);
      // only count unclaimed verifications for badge
      const userId = db.getSession().userId;
      refreshSidenavBadge("squad-verifications", countUnclaimed(s, userId), "var(--gold)");
      refreshSidenavBadge("agency-verifications", countUnclaimed(a, userId), "var(--gold)");

      toast("New squad verification submitted.", "success");
      setTimeout(() => {
        const view = currentView();
        if (view === "dashboard" || view === "squad-verifications") roleModule("admin").render?.(view, db.getSession());
      }, 500);
    });

    db.subscribeToVerifications("agency", async () => {
      const { data: a } = await db.getPendingVerifications("agency");
      refreshSidenavBadge("agency-verifications", a?.length || 0, "var(--gold)");
      toast("New agency verification submitted.", "success");
      setTimeout(() => {
        const view = currentView();
        if (view === "dashboard" || view === "agency-verifications") roleModule("admin").render?.(view, db.getSession());
      }, 500);
    });
  }

  const passwordChanged = (updatedUser) => (updatedUser.password_version || 1) > (session.passwordVersion || 1);

  if (session.role === "player" || session.role === "admin") {
    db.subscribeToUserStatus(session.userId, async (updatedUser) => {
      if (passwordChanged(updatedUser)) _forceLogout();
    });
  }

  if (session.role === "player") {
    // subscribe to coach's training row for real-time plan updates
    db.getPlayerCurrentCoach(session.userId).then(({ data: invite }) => {
      if (!invite?.coach_id) return;
      db.subscribeToCoachTraining(invite.coach_id, () => {
        toast("Your coach updated the training plan.", "success");
        if (currentView() === "training") roleModule("player").training?.(db.getSession());
      });
    });
  }

  if (session.role === "coach") {
    // subscribe to incoming match requests
    db.subscribeToMatchRequests(session.userId, async () => {
      const { data: pending } = await db.getPendingMatchRequests(session.userId);
      if (pending?.length > 0) {
        toast(`New match request from ${pending[0].coach?.profile?.club || "a coach"}!`, "success");
        if (currentView() === "training") roleModule("coach").training?.(db.getSession());
      }
    });

    db.subscribeToUserStatus(session.userId, async (updatedUser) => {
      if (passwordChanged(updatedUser)) return _forceLogout();

      const newStatus = updatedUser.squad_status;
      let changed = false;

      if (newStatus && newStatus !== session.squadStatus) {
        session.squadStatus = newStatus;
        changed = true;
        if (newStatus === "verified") {
          const { data: sp } = await db.getSquadPlayers(session.userId);
          session.profile = { ...session.profile, teamSize: sp?.length || 0 };
          toast("Your squad has been verified! Full access unlocked.", "success");
        } else if (newStatus === "rejected") {
          toast("Your squad verification was rejected. Check your messages.", "error");
        }
      }

      const { data: freshSquad } = await db.getSquadPlayers(session.userId);
      const freshSize = freshSquad?.length ?? session.profile?.teamSize ?? 0;
      if (freshSize !== session.profile?.teamSize) {
        session.profile = { ...session.profile, teamSize: freshSize };
        changed = true;
      }

      if (changed) {
        db.saveSession(session);
        // fetch current unread count before rebuilding sidenav
        const { data: msgs } = await db.getMessages(session.userId);
        buildSidenav(session, msgs?.filter((m) => !m.read).length || 0);
        routeTo(currentView() || "dashboard", session);
      }
    });
  }

  if (session.role === "scout") {
    db.subscribeToUserStatus(session.userId, async (updatedUser) => {
      if (passwordChanged(updatedUser)) return _forceLogout();

      const newStatus = updatedUser.agency_status;
      if (!newStatus || newStatus === session.agencyStatus) return;

      session.agencyStatus = newStatus;
      const { data: freshUser } = await db.getUserById(session.userId);
      if (freshUser) session.profile = freshUser.profile;
      db.saveSession(session);

      const { data: msgs } = await db.getMessages(session.userId);
      buildSidenav(session, msgs?.filter((m) => !m.read).length || 0);

      toast(
        newStatus === "verified"
          ? "Your agency has been verified! Full access unlocked."
          : "Your agency verification was rejected. Check your messages.",
        newStatus === "verified" ? "success" : "error",
      );
      routeTo(currentView() || "dashboard", session);
    });
  }

  if (!isAdmin) {
    db.subscribeToUserTickets(session.userId, async (payload) => {
      const ticket = payload.new;
      const oldTicket = payload.old;
      const msgs = ticket.messages || [];
      const oldMsgs = oldTicket.messages || [];

      if (msgs.length > oldMsgs.length && msgs[msgs.length - 1]?.is_admin)
        toast("An admin replied to your ticket!", "success");
      if (ticket.status === "claimed" && oldTicket.status === "open")
        toast("Your ticket has been claimed by an admin!", "success");
      if (ticket.status === "resolved" && oldTicket.status !== "resolved")
        toast("Your support ticket has been resolved!", "success");

      const { data: userTickets } = await db.getUserTickets(session.userId);
      const { data: msgs2 } = await db.getMessages(session.userId);
      const unreadMsgs = msgs2?.filter((m) => !m.read).length || 0;
      refreshSidenavBadge("messages", unreadMsgs + unreadTicketReplies(userTickets), "var(--red)");
    });
  }
};

// ─── Pages ─────────────────────────────────────────────────
const AUTH_PATHS = { "/login": "screen-login", "/signup": "screen-signup-role" };

const showPath = async (path) => {
  const session = db.getSession();

  if (path === "/" || path === "/about") return setAppState({ page: "home" });

  if (AUTH_PATHS[path]) {
    if (session) return navigate("/app/dashboard", { replace: true });
    showScreen(AUTH_PATHS[path]);
    return setAppState({ page: "auth", authVisible: true });
  }

  if (path === "/app" || path.startsWith("/app/")) {
    if (!session) return navigate("/login", { replace: true });
    const view = path.slice("/app/".length).split("/")[0] || "dashboard";
    if (!sessionStarted) await startSession(session);
    return setAppState({ page: "app", activeView: view, mobileNavOpen: false });
  }

  navigate("/", { replace: true });
};

// ─── Boot: route the page we were opened on ───────────────
export const boot = () => {
  onPathChange(showPath);
  showPath(currentPath());
};
