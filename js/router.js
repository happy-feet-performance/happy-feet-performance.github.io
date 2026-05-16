/**
 * HappyFeet Performance Hub: router.js
 * ────────────────────────────────────────
 * Handles: session validation, role routing, app shell setup,
 * sidenav rendering, view switching, mobile nav.
 *
 * Route protection: every view switch checks session role.
 * Wrong role = redirected to their own dashboard.
 * No role = sent to login.
 *
 */

const HF_ROUTER = (() => {
  const { el, setHTML, setText, avatarColor, initials, toast } = HF_UTILS;

  // ─── Sidenav configs per role ───────────────────────────────
  const NAVS = {
    player: [
      { section: "My journey" },
      { view: "dashboard", icon: "ti-home", label: "Dashboard" },
      { view: "profile", icon: "ti-user", label: "My profile" },
      { view: "stats", icon: "ti-chart-bar", label: "My stats" },
      { view: "training", icon: "ti-clipboard-list", label: "Training plan" },
      { view: "health", icon: "ti-heart-rate-monitor", label: "Health log" },
      { section: "Progress" },
      { view: "achievements", icon: "ti-trophy", label: "Achievements" },
      { view: "highlights", icon: "ti-video", label: "Highlights" },
      { section: "Community" },
      { view: "messages", icon: "ti-message", label: "Messages" },
      {
        view: "faith",
        icon: "ti-cross",
        label: "Faith & purpose",
        faithNav: true,
      },
      { section: "Discover" },
      { view: "findmyteam", icon: "ti-map-search", label: "Find my team" },
    ],
    coach: (squadStatus, teamSize = 0) => {
      const verified = squadStatus === "verified";
      const hasPlayers = teamSize > 0;
      const nav = [
        { section: "Management" },
        { view: "dashboard", icon: "ti-home", label: "Dashboard" },
        { view: "profile", icon: "ti-user", label: "My profile" },
      ];
      if (verified) {
        nav.push({ view: "squad", icon: "ti-users", label: "Squad" });
        if (hasPlayers) {
          nav.push(
            {
              view: "training",
              icon: "ti-clipboard-list",
              label: "Session builder",
            },
            {
              view: "tracking",
              icon: "ti-chart-line",
              label: "Player tracking",
            },
            { section: "Tools" },
            {
              view: "health",
              icon: "ti-heart-rate-monitor",
              label: "Health & wellness",
            },
            { view: "recruitment", icon: "ti-search", label: "Recruitment" },
          );
        }
      }
      nav.push(
        { section: verified ? "Tools" : "Community" },
        { view: "messages", icon: "ti-message", label: "Messages" },
        {
          view: "faith",
          icon: "ti-cross",
          label: "Team devotion",
          faithNav: true,
        },
        { section: "Discover" },
        { view: "findmyteam", icon: "ti-map-search", label: "Find my team" },
      );
      return nav;
    },
    scout: (agencyStatus) => {
      const verified = agencyStatus === "verified";
      const nav = [
        { section: "Scouting" },
        { view: "dashboard", icon: "ti-home", label: "Dashboard" },
        { view: "profile", icon: "ti-user", label: "My profile" },
      ];
      if (verified) {
        nav.push(
          { view: "discover", icon: "ti-search", label: "Discover talent" },
          { view: "prospects", icon: "ti-star", label: "Saved prospects" },
          { view: "pipeline", icon: "ti-chart-line", label: "Pipeline" },
          { section: "Reports" },
          { view: "reports", icon: "ti-file-text", label: "Scout reports" },
          { view: "clubs", icon: "ti-building", label: "Club network" },
          { view: "placements", icon: "ti-circle-check", label: "Placements" },
        );
      }
      nav.push(
        { section: verified ? "Reports" : "Community" },
        { view: "messages", icon: "ti-message", label: "Messages" },
        { section: "Discover" },
        { view: "findmyteam", icon: "ti-map-search", label: "Find my team" },
      );
      return nav;
    },
    admin: [
      { section: "Management" },
      { view: "dashboard", icon: "ti-home", label: "Dashboard" },
      {
        view: "squad-verifications",
        icon: "ti-shield-check",
        label: "Squad verifications",
      },
      {
        view: "agency-verifications",
        icon: "ti-building",
        label: "Agency verifications",
      },
      { view: "users", icon: "ti-users", label: "Users" },
      { section: "Communication" },
      { view: "messages", icon: "ti-message", label: "Messages" },
    ],
  };

  // ─── Alert for if admin made changes ────────────────────────────

  const _showVerificationAlert = (session) => {
    const existing = document.getElementById("verification-alert");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "verification-alert";
    overlay.className = "verification-alert-overlay";
    overlay.innerHTML = `
    <div class="verification-alert-card">
      <i class="ti ti-bell" style="font-size:36px;color:var(--gold);margin-bottom:var(--sp-lg);display:block;"></i>
      <div style="font-family:var(--font-head);font-size:18px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:var(--text);margin-bottom:var(--sp-sm);">
        Squad verification update
      </div>
      <div style="font-size:14px;color:var(--text2);margin-bottom:var(--sp-xl);line-height:1.6;">
        An admin has reviewed your squad registration and has an update. Go to your messages to review and respond.
      </div>
      <div style="display:flex;gap:8px;justify-content:center;">
        <button class="btn btn-primary" onclick="document.getElementById('verification-alert').remove();HF_ROUTER.navTo('messages');">
          <i class="ti ti-message"></i> Go to messages
        </button>
        <button class="btn btn-outline" onclick="document.getElementById('verification-alert').remove();">
          Dismiss
        </button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
  };

  // ─── Role accent colours ────────────────────────────────────
  const ROLE_COLORS = { player: "#1a7a2e", coach: "#C9961A", scout: "#185FA5" };

  // ─── Launch app after login/signup ─────────────────────────

  let _subscriptionsActive = false;

  const launch = async (session) => {
    document.getElementById("auth-screens").style.display = "none";
    const shell = el("app-shell");
    shell.classList.add("visible");
    shell.className = `app-shell visible role-${session.role}`;

    const rolePill = el("topbar-role-pill");
    rolePill.textContent =
      session.role.charAt(0).toUpperCase() + session.role.slice(1);

    const nameDisplay = el("topbar-name-display");
    if (nameDisplay) nameDisplay.textContent = session.name;

    // check unread messages
    let unreadCount = 0;
    if (session.role !== "admin" && session.userId) {
      const { data: msgs } = await HF_DB.getMessages(session.userId);
      unreadCount = msgs?.filter((m) => !m.read).length || 0;
    }

    // check pending verifications for admin
    let pendingVerifications = 0;
    if (session.role === "admin") {
      const { data: pending } = await HF_DB.getPendingVerifications();
      const { data: agencyPending } =
        await HF_DB.getPendingAgencyVerifications();
      pendingVerifications =
        (pending?.length || 0) + (agencyPending?.length || 0);
    }

    _buildSidenav(session, unreadCount, pendingVerifications);
    _routeTo("dashboard", session);

    // show overlays
    if (
      session.role === "coach" &&
      session.squadStatus === "awaiting_coach_approval"
    ) {
      setTimeout(() => _showVerificationAlert(session), 800);
    }
    if (session.role === "admin" && pendingVerifications > 0) {
      setTimeout(() => HF_ADMIN.showPendingAlert(pendingVerifications), 800);
    }

    // start real-time subscriptions after 1 second
    setTimeout(() => {
      if (_subscriptionsActive) return; // prevent duplicate subscriptions
      _subscriptionsActive = true;

      if (session.role !== "admin" && session.userId) {
        HF_DB.subscribeToMessages(session.userId, (newMessage) => {
          HF_DB.getMessages(session.userId).then(({ data: msgs }) => {
            const unreadCount = msgs?.filter((m) => !m.read).length || 0;
            HF_ROUTER.refreshSidenavBadge(
              "messages",
              unreadCount,
              "var(--red)",
            );

            // always re-render messages view if currently on it
            const activeNav = document.querySelector(".nav-item.active");
            if (activeNav?.dataset.view === "messages") {
              const s = HF_DB.getSession();
              const handlers = {
                player: window.HF_PLAYER,
                coach: window.HF_COACH,
                scout: window.HF_SCOUT,
              };
              handlers[s.role]?.messages?.(s);
            }
          });

          HF_UTILS.toast(
            `New message: ${newMessage.subject || "You have a new message"}`,
            "success",
          );
        });
      }

      if (session.role === "admin") {
        HF_DB.subscribeToMessages(session.userId, (newMessage) => {
          HF_DB.getMessages(session.userId).then(({ data: msgs }) => {
            const unreadCount = msgs?.filter((m) => !m.read).length || 0;
            HF_ROUTER.refreshSidenavBadge(
              "messages",
              unreadCount,
              "var(--red)",
            );

            const activeNav = document.querySelector(".nav-item.active");
            if (activeNav?.dataset.view === "messages") {
              window.HF_ADMIN?.messages?.(HF_DB.getSession());
            }
          });

          HF_UTILS.toast(
            `New message: ${newMessage.subject || "You have a new message"}`,
            "success",
          );
        });

        HF_DB.subscribeToPendingVerifications(async (payload) => {
          const { data: pending } = await HF_DB.getPendingVerifications();
          const { data: agencyPending } =
            await HF_DB.getPendingAgencyVerifications();

          HF_ROUTER.refreshSidenavBadge(
            "squad-verifications",
            pending?.length || 0,
            "var(--gold)",
          );
          HF_ROUTER.refreshSidenavBadge(
            "agency-verifications",
            agencyPending?.length || 0,
            "var(--gold)",
          );

          // show toast first
          HF_UTILS.toast("New squad verification submitted.", "success");

          // then re-render after a delay so toast has time to appear
          setTimeout(() => {
            const activeNav = document.querySelector(".nav-item.active");
            const currentView = activeNav?.dataset.view;
            if (
              currentView === "dashboard" ||
              currentView === "squad-verifications"
            ) {
              window.HF_ADMIN?.render?.(currentView, HF_DB.getSession());
            }
          }, 500);
        });

        HF_DB.subscribeToAgencyVerifications(async (payload) => {
          const { data: agencyPending } =
            await HF_DB.getPendingAgencyVerifications();

          HF_ROUTER.refreshSidenavBadge(
            "agency-verifications",
            agencyPending?.length || 0,
            "var(--gold)",
          );

          // show toast first
          HF_UTILS.toast("New agency verification submitted.", "success");

          // then re-render after a delay
          setTimeout(() => {
            const activeNav = document.querySelector(".nav-item.active");
            const currentView = activeNav?.dataset.view;
            if (
              currentView === "dashboard" ||
              currentView === "agency-verifications"
            ) {
              window.HF_ADMIN?.render?.(currentView, HF_DB.getSession());
            }
          }, 500);
        });
      }

      if (session.role === "coach") {
        HF_DB.subscribeToUserStatus(session.userId, (updatedUser) => {
          const newStatus = updatedUser.squad_status;
          if (newStatus && newStatus !== session.squadStatus) {
            session.squadStatus = newStatus;
            HF_DB.saveSession(session);
            _buildSidenav(session);

            if (newStatus === "verified") {
              HF_UTILS.toast(
                "Your squad has been verified! Full access unlocked.",
                "success",
              );
            } else if (newStatus === "awaiting_coach_approval") {
              _showVerificationAlert(session);
            } else if (newStatus === "rejected") {
              HF_UTILS.toast(
                "Your squad verification was rejected. Check your messages.",
                "error",
              );
            }

            // re-render current view with updated session
            const activeNav = document.querySelector(".nav-item.active");
            const currentView = activeNav?.dataset.view || "dashboard";
            _routeTo(currentView, session);
          }
        });
      }

      if (session.role === "scout") {
        HF_DB.subscribeToUserStatus(session.userId, (updatedUser) => {
          const newStatus = updatedUser.agency_status;
          if (newStatus && newStatus !== session.agencyStatus) {
            session.agencyStatus = newStatus;
            HF_DB.saveSession(session);
            _buildSidenav(session);

            if (newStatus === "verified") {
              HF_UTILS.toast(
                "Your agency has been verified! Full access unlocked.",
                "success",
              );
            } else if (newStatus === "rejected") {
              HF_UTILS.toast(
                "Your agency verification was rejected. Check your messages.",
                "error",
              );
            }

            const activeNav = document.querySelector(".nav-item.active");
            const currentView = activeNav?.dataset.view || "dashboard";
            _routeTo(currentView, session);
          }
        });
      }
    }, 1000);
  };

  // ─── Build sidenav ─────────────────────────────────────────

  const _buildSidenav = (
    session,
    unreadCount = 0,
    pendingVerifications = 0,
  ) => {
    const nav = el("sidenav");
    const squadStatus = session.squadStatus || "unregistered";

    let items;
    if (session.role === "coach") {
      items = NAVS.coach(squadStatus, session.profile?.teamSize || 0);
    } else if (session.role === "scout") {
      items = NAVS.scout(session.agencyStatus || "unregistered");
    } else {
      items = NAVS[session.role] || [];
    }

    const navHTML = items
      .map((item) => {
        if (item.section)
          return `<div class="sidenav-section">${item.section}</div>`;

        let badge = item.badge;
        let badgeColor = item.badgeColor;

        // messages badge
        if (item.view === "messages" && unreadCount > 0) {
          badge = String(unreadCount);
          badgeColor = "var(--red)";
        }

        // verifications badge for admin
        if (item.view === "verifications" && pendingVerifications > 0) {
          badge = String(pendingVerifications);
          badgeColor = "var(--gold)";
        }

        const badgeHTML = badge
          ? `<span class="nav-badge" style="background:rgba(0,0,0,.1);color:${badgeColor || "var(--gold)"};">${badge}</span>`
          : "";
        const faithClass = item.faithNav ? " faith-nav" : "";
        return `<div class="nav-item${faithClass}" data-view="${item.view}" onclick="HF_ROUTER.navTo('${item.view}',this)">
      <i class="ti ${item.icon}" aria-hidden="true"></i>
      <span>${item.label}</span>
      ${badgeHTML}
    </div>`;
      })
      .join("");

    nav.innerHTML = `
    <div class="sidenav-scroll">${navHTML}</div>
    <div class="sidenav-footer" onclick="HF_ROUTER.navTo('profile')" style="cursor:pointer;">
      <div class="avatar avatar-sm" style="background:${ROLE_COLORS[session.role] || "#C49A0A"}">${initials(session.name)}</div>
      <div>
        <div class="sidenav-footer-name">${session.name}</div>
        <div class="sidenav-footer-role">${session.displayContact || session.contact}</div>
      </div>
    </div>`;
  };

  // ─── Route to role dashboard renderer ──────────────────────
  const _routeTo = (view, session) => {
    const handlers = {
      player: window.HF_PLAYER,
      coach: window.HF_COACH,
      scout: window.HF_SCOUT,
      admin: window.HF_ADMIN,
    };
    const handler = handlers[session.role];
    if (!handler) {
      toast("Dashboard not found for this role.", "error");
      return;
    }
    handler.render(view, session);
  };

  // ─── Navigate to a view ─────────────────────────────────────
  const navTo = (view, el_) => {
    const session = HF_DB.getSession();
    if (!session) {
      HF_AUTH.logout();
      return;
    }

    // check user status on every navigation
    if (session.role !== "admin") {
      HF_DB.checkUserStatus(session.userId).then((status) => {
        if (!status) {
          HF_DB.clearSession();
          document.getElementById("app-shell").classList.remove("visible");
          document.getElementById("auth-screens").style.display = "flex";
          HF_AUTH.showScreen("screen-login");
          setTimeout(
            () =>
              HF_UTILS.toast(
                "Your account has been removed by an admin.",
                "error",
              ),
            300,
          );
          return;
        }
        if (status.banned) {
          HF_DB.clearSession();
          document.getElementById("app-shell").classList.remove("visible");
          document.getElementById("auth-screens").style.display = "flex";
          HF_AUTH.showScreen("screen-login");
          setTimeout(
            () =>
              HF_UTILS.toast(
                "Your account has been banned. Reason: " +
                  (status.ban_reason || "Contact support."),
                "error",
              ),
            300,
          );
          return;
        }
        if (status.kicked) {
          HF_DB.clearSession();
          document.getElementById("app-shell").classList.remove("visible");
          document.getElementById("auth-screens").style.display = "flex";
          HF_AUTH.showScreen("screen-login");
          setTimeout(
            () =>
              HF_UTILS.toast(
                "You have been kicked for 1 hour by an admin. Please try again later.",
                "error",
              ),
            300,
          );
          return;
        }
      });
    }

    if (session.role === "coach") {
      HF_DB.getLatestSquadStatus(session.userId).then((status) => {
        if (status && status !== session.squadStatus) {
          session.squadStatus = status;
          HF_DB.saveSession(session);
          _buildSidenav(session);
          if (status === "awaiting_coach_approval") {
            const existing = document.getElementById("verification-alert");
            if (existing) existing.remove();
            setTimeout(() => _showVerificationAlert(session), 300);
          } else {
            const existing = document.getElementById("verification-alert");
            if (existing) existing.remove();
          }
        }
      });
    }

    if (session.role !== "admin" && session.userId) {
      HF_DB.getMessages(session.userId).then(({ data: msgs }) => {
        const unreadCount = msgs?.filter((m) => !m.read).length || 0;
        HF_ROUTER.refreshSidenavBadge("messages", unreadCount, "var(--red)");
      });
    }

    if (session.role === "scout") {
      HF_DB.getLatestAgencyStatus(session.userId).then((status) => {
        if (status && status !== session.agencyStatus) {
          session.agencyStatus = status;
          HF_DB.saveSession(session);
          _buildSidenav(session);
        }
      });
    }

    document
      .querySelectorAll(".nav-item")
      .forEach((i) => i.classList.remove("active"));
    if (el_) el_.classList.add("active");
    else {
      const match = document.querySelector(`.nav-item[data-view="${view}"]`);
      if (match) match.classList.add("active");
    }

    _closeMobileNav();
    _routeTo(view, session);
  };

  // ─── Mobile nav ─────────────────────────────────────────────
  const toggleMobileNav = () => {
    const nav = el("sidenav");
    const overlay = el("nav-overlay");
    nav.classList.toggle("open");
    overlay.classList.toggle("open");
  };
  const _closeMobileNav = () => {
    el("sidenav")?.classList.remove("open");
    el("nav-overlay")?.classList.remove("open");
  };

  // ─── Boot: check session on page load ─────────────────────
  const boot = () => {
    const session = HF_DB.getSession();
    if (session) {
      document.getElementById("auth-screens").style.display = "none";
      launch(session);
    } else {
      document.getElementById("auth-screens").style.display = "flex";
      HF_AUTH.showScreen("screen-login");
    }
  };

  const refreshSidenavBadge = (view, count, color = "var(--gold)") => {
    const navItem = document.querySelector(
      `.nav-item[data-view="${view}"] .nav-badge`,
    );
    if (count === 0) {
      if (navItem) navItem.remove();
    } else {
      if (navItem) {
        navItem.textContent = String(count);
        navItem.style.color = color;
      } else {
        const item = document.querySelector(`.nav-item[data-view="${view}"]`);
        if (item) {
          const badge = document.createElement("span");
          badge.className = "nav-badge";
          badge.style.cssText = `background:rgba(0,0,0,.1);color:${color};`;
          badge.textContent = String(count);
          item.appendChild(badge);
        }
      }
    }
  };

  const resetSubscriptions = () => {
    _subscriptionsActive = false;
  };

  return {
    launch,
    navTo,
    toggleMobileNav,
    boot,
    refreshSidenavBadge,
    resetSubscriptions,
  };
})();

window.HF_ROUTER = HF_ROUTER;

document.addEventListener("DOMContentLoaded", () => HF_ROUTER.boot());
