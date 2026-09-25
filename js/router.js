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
  // HF_UTILS is registered by src/lib/legacyBridge.js, which runs after this
  // script loads, so look it up at call time.
  const el = (id) => HF_UTILS.el(id);
  const toast = (...args) => HF_UTILS.toast(...args);

  // ─── Sidenav configs per role ───────────────────────────────
  const NAVS = {
    player: (session) => [
      { section: "My journey" },
      { view: "dashboard", icon: "ti-home", label: "Dashboard" },
      { view: "profile", icon: "ti-user", label: "My profile" },
      { view: "stats", icon: "ti-chart-bar", label: "My stats" },
      ...(session.profile?.club && session.profile?.status !== "unattached"
        ? [{ view: "training", icon: "ti-clipboard-list", label: "Training" }]
        : []),
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
          );
        }
        nav.push(
          { section: "Tools" },
          {
            view: "health",
            icon: "ti-heart-rate-monitor",
            label: "Health & wellness",
          },
        );
      }
      nav.push(
        { section: "Community" },
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
          { section: "Reports" },
          { view: "reports", icon: "ti-file-text", label: "Scout reports" },
          { view: "placements", icon: "ti-circle-check", label: "Placements" },
        );
      }
      nav.push(
        { section: "Community" },
        { view: "messages", icon: "ti-message", label: "Messages" },
        { section: "Discover" },
        {
          view: "findmytalent",
          icon: "ti-map-search",
          label: "Find my talent",
        },
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
      {
        view: "tickets",
        label: "Support tickets",
        icon: "ti-ticket",
      },
    ],
  };

  // ─── Role accent colours ────────────────────────────────────
  const ROLE_COLORS = { player: "#1a7a2e", coach: "#C9961A", scout: "#185FA5" };

  // ─── Forced Logout in case it's necessary ───────────────────
  const _forceLogout = () => {
    HF_DB.clearSession();
    HF_DB.removeAllChannels();
    HF_AGENT.hide();
    _subscriptionsActive = false;

    const shell = document.getElementById("app-shell");
    if (shell) shell.classList.remove("visible");
    document.getElementById("auth-screens").style.display = "flex";
    HF_AUTH.showScreen("screen-login");

    setTimeout(() => {
      HF_UTILS.toast(
        "Your password was changed. Please log in again.",
        "error",
      );
    }, 5000);
  };

  // ─── Launch app after login/signup ─────────────────────────
  let _subscriptionsActive = false;

  const launch = async (session) => {
    // ── Shell setup ──────────────────────────────────────────────
    document.getElementById("nav-overlay")?.classList.remove("open");
    document.getElementById("auth-screens").style.display = "none";
    el("sidenav")?.classList.remove("open");

    const shell = el("app-shell");
    shell.className = `app-shell visible role-${session.role}`;
    el("topbar-role-pill").textContent =
      session.role.charAt(0).toUpperCase() + session.role.slice(1);
    el("topbar-name-display").textContent = session.name;

    // ── Pre-launch data ──────────────────────────────────────────
    const isAdmin = session.role === "admin";

    if (session.role === "coach" && session.squadStatus === "verified") {
      const { data: squadPlayers } = await HF_DB.getSquadPlayers(
        session.userId,
      );
      session.profile = {
        ...session.profile,
        teamSize: squadPlayers?.length || 0,
      };
      HF_DB.saveSession(session);
    }

    const [
      unreadCount,
      pendingVerifications,
      openTicketCount,
      unreadTicketReplies,
    ] = await Promise.all([
      // unread messages
      !isAdmin
        ? HF_DB.getMessages(session.userId).then(
            ({ data }) => data?.filter((m) => !m.read).length || 0,
          )
        : Promise.resolve(0),

      // pending verifications (admin only)
      isAdmin
        ? Promise.all([
            HF_DB.getPendingVerifications("squad"),
            HF_DB.getPendingVerifications("agency"),
          ]).then(([{ data: s }, { data: a }]) => {
            const sid = session.userId;
            const unclaimedSquad =
              s?.filter((v) => !v.claimed_by || v.claimed_by === sid).length ||
              0;
            const unclaimedAgency =
              a?.filter((v) => !v.claimed_by || v.claimed_by === sid).length ||
              0;
            return unclaimedSquad + unclaimedAgency;
          })
        : Promise.resolve(0),

      // open tickets (admin only)
      isAdmin
        ? HF_DB.getTickets("open").then(
            ({ data }) => data?.filter((t) => !t.claimed_by).length || 0,
          )
        : Promise.resolve(0),

      // unread ticket replies (non-admin)
      !isAdmin
        ? HF_DB.getUserTickets(session.userId).then(
            ({ data }) =>
              data?.filter((t) => {
                const msgs = t.messages || [];
                const last = msgs[msgs.length - 1];
                return last?.is_admin && t.status !== "resolved";
              }).length || 0,
          )
        : Promise.resolve(0),
    ]);

    window._sidenavCounts = {
      unread: unreadCount + unreadTicketReplies,
      pendingVerifications,
      openTicketCount,
    };
    _buildSidenav(
      session,
      window._sidenavCounts.unread,
      window._sidenavCounts.pendingVerifications,
      null,
      window._sidenavCounts.openTicketCount,
    );

    // ── Ticket subscription (admin, immediate) ───────────────────
    if (isAdmin) {
      HF_DB.subscribeToTickets(async (payload) => {
        const { data: openTickets } = await HF_DB.getTickets("open");
        const session = HF_DB.getSession();
        // unclaimed = no claimed_by set
        const count = openTickets?.filter((t) => !t.claimed_by).length || 0;
        HF_ROUTER.refreshSidenavBadge("tickets", count, "var(--red)");
        if (payload.eventType === "INSERT")
          HF_UTILS.toast("New support ticket received!", "success");

        // always refresh tickets view if open
        const activeNav = document.querySelector(".nav-item.active");
        if (activeNav?.dataset.view === "tickets") {
          window.HF_ADMIN?.tickets?.(HF_DB.getSession());
        }

        // also refresh dashboard metrics if on dashboard
        if (activeNav?.dataset.view === "dashboard") {
          window.HF_ADMIN?.render?.("dashboard", HF_DB.getSession());
        }
      });
    }

    _routeTo("dashboard", session);
    HF_AGENT.show();

    // ── Realtime subscriptions (after 1s) ───────────────────────
    setTimeout(() => {
      if (_subscriptionsActive) return;
      _subscriptionsActive = true;

      const _onNewMessage = async (newMessage, role) => {
        const { data: msgs } = await HF_DB.getMessages(session.userId);
        const count = msgs?.filter((m) => !m.read).length || 0;
        HF_ROUTER.refreshSidenavBadge("messages", count, "var(--red)");
        HF_UTILS.toast(
          `New message: ${newMessage.subject || "You have a new message"}`,
          "success",
        );

        const activeNav = document.querySelector(".nav-item.active");
        const view = activeNav?.dataset.view;
        const handler = {
          player: window.HF_PLAYER,
          coach: window.HF_COACH,
          scout: window.HF_SCOUT,
          admin: window.HF_ADMIN,
        }[role];

        if (view === "dashboard") {
          const metricEl = document.querySelector(
            '.metric-card[data-type="messages"]',
          );
          if (metricEl) {
            metricEl.querySelector(".metric-val").textContent = count;
            metricEl.querySelector(".metric-sub").textContent =
              count > 0 ? `${count} unread` : "All caught up";
          }
        } else if (view === "messages") {
          const threadEl = document.getElementById("thread-messages");
          if (threadEl) {
            const currentThreadId = threadEl.dataset.threadId;
            if (currentThreadId && newMessage.thread_id === currentThreadId) {
              const isMine = newMessage.from_id === session.userId;
              const isEmojiOnly =
                newMessage.body
                  .replace(
                    /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu,
                    "",
                  )
                  .trim().length === 0;
              const renderedBody = newMessage.body.replace(
                /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu,
                `<span style="font-size:1.3em;cursor:pointer;display:inline-block;" onclick="HF_UTILS.launchEmojiConfetti('$1')">$1</span>`,
              );
              const div = document.createElement("div");
              div.style.cssText = `display:flex;flex-direction:column;align-items:${isMine ? "flex-end" : "flex-start"};margin-bottom:var(--sp-md);`;
              div.innerHTML = `
        <div style="font-size:10px;color:var(--text3);margin-bottom:3px;">
          ${isMine ? "You" : "Them"} · just now
        </div>
        <div style="max-width:75%;padding:${isEmojiOnly ? "4px" : "10px 14px"};
          background:${isEmojiOnly ? "transparent" : isMine ? "var(--gold)" : "var(--bg2)"};
          color:${isMine && !isEmojiOnly ? "#0f0f0d" : "var(--text)"};
          font-size:${isEmojiOnly ? "32px" : "13px"};line-height:1.5;">
          ${renderedBody}
        </div>`;
              threadEl.appendChild(div);
              threadEl.scrollTop = threadEl.scrollHeight;
            } else {
              handler?.messages?.(HF_DB.getSession());
            }
          } else {
            handler?.messages?.(HF_DB.getSession());
          }
        }
      };

      HF_DB.subscribeToMessages(session.userId, (msg) => {
        // only process messages sent TO this user, not FROM this user
        if (msg.from_id === session.userId) return;
        if (msg.to_id !== session.userId) return;
        _onNewMessage(msg, session.role);
      });

      if (isAdmin) {
        HF_DB.subscribeToVerifications("squad", async () => {
          const [{ data: s }, { data: a }] = await Promise.all([
            HF_DB.getPendingVerifications("squad"),
            HF_DB.getPendingVerifications("agency"),
          ]);

          // only count unclaimed verifications for badge
          const session = HF_DB.getSession();
          const unclaimedSquad =
            s?.filter((v) => !v.claimed_by || v.claimed_by === session.userId)
              .length || 0;
          const unclaimedAgency =
            a?.filter((v) => !v.claimed_by || v.claimed_by === session.userId)
              .length || 0;

          HF_ROUTER.refreshSidenavBadge(
            "squad-verifications",
            unclaimedSquad,
            "var(--gold)",
          );
          HF_ROUTER.refreshSidenavBadge(
            "agency-verifications",
            unclaimedAgency,
            "var(--gold)",
          );

          HF_UTILS.toast("New squad verification submitted.", "success");
          setTimeout(() => {
            const view =
              document.querySelector(".nav-item.active")?.dataset.view;
            if (view === "dashboard" || view === "squad-verifications")
              window.HF_ADMIN?.render?.(view, HF_DB.getSession());
          }, 500);
        });

        HF_DB.subscribeToVerifications("agency", async () => {
          const { data: a } = await HF_DB.getPendingVerifications("agency");
          HF_ROUTER.refreshSidenavBadge(
            "agency-verifications",
            a?.length || 0,
            "var(--gold)",
          );
          HF_UTILS.toast("New agency verification submitted.", "success");
          setTimeout(() => {
            const view =
              document.querySelector(".nav-item.active")?.dataset.view;
            if (view === "dashboard" || view === "agency-verifications")
              window.HF_ADMIN?.render?.(view, HF_DB.getSession());
          }, 500);
        });
      }

      if (session.role === "player" || session.role === "admin") {
        HF_DB.subscribeToUserStatus(session.userId, async (updatedUser) => {
          if (
            (updatedUser.password_version || 1) > (session.passwordVersion || 1)
          ) {
            _forceLogout();
          }
        });
      }

      if (session.role === "player") {
        // subscribe to coach's training row for real-time plan updates
        HF_DB.getPlayerCurrentCoach(session.userId).then(({ data: invite }) => {
          if (invite?.coach_id) {
            HF_DB.subscribeToCoachTraining(invite.coach_id, () => {
              HF_UTILS.toast(
                "Your coach updated the training plan.",
                "success",
              );
              const view =
                document.querySelector(".nav-item.active")?.dataset.view;
              if (view === "training") {
                window.HF_PLAYER?.training?.(HF_DB.getSession());
              }
            });
          }
        });
      }

      if (session.role === "coach") {
        // subscribe to incoming match requests
        HF_DB.subscribeToMatchRequests(session.userId, async () => {
          const { data: pending } = await HF_DB.getPendingMatchRequests(
            session.userId,
          );
          if (pending?.length > 0) {
            HF_UTILS.toast(
              `New match request from ${pending[0].coach?.profile?.club || "a coach"}!`,
              "success",
            );
            const view =
              document.querySelector(".nav-item.active")?.dataset.view;
            if (view === "training")
              window.HF_COACH?.training?.(HF_DB.getSession());
          }
        });
      }

      if (session.role === "coach") {
        HF_DB.subscribeToUserStatus(session.userId, async (updatedUser) => {
          if (
            (updatedUser.password_version || 1) > (session.passwordVersion || 1)
          ) {
            _forceLogout();
            return;
          }

          const newStatus = updatedUser.squad_status;
          const newProfile = updatedUser.profile;
          let changed = false;

          if (newStatus && newStatus !== session.squadStatus) {
            session.squadStatus = newStatus;
            changed = true;
            if (newStatus === "verified") {
              const { data: sp } = await HF_DB.getSquadPlayers(session.userId);
              session.profile = {
                ...session.profile,
                teamSize: sp?.length || 0,
              };
              HF_UTILS.toast(
                "Your squad has been verified! Full access unlocked.",
                "success",
              );
            } else if (newStatus === "rejected") {
              HF_UTILS.toast(
                "Your squad verification was rejected. Check your messages.",
                "error",
              );
            }
          }

          const { data: freshSquad } = await HF_DB.getSquadPlayers(
            session.userId,
          );
          const freshSize =
            freshSquad?.length ?? session.profile?.teamSize ?? 0;
          if (freshSize !== session.profile?.teamSize) {
            session.profile = {
              ...session.profile,
              teamSize: freshSize,
            };
            changed = true;
          }

          if (changed) {
            HF_DB.saveSession(session);
            // fetch current unread count before rebuilding sidenav
            const { data: msgs } = await HF_DB.getMessages(session.userId);
            const unread = msgs?.filter((m) => !m.read).length || 0;
            _buildSidenav(session, unread, 0);
            const view =
              document.querySelector(".nav-item.active")?.dataset.view ||
              "dashboard";
            _routeTo(view, session);
          }
        });
      }

      if (session.role === "scout") {
        HF_DB.subscribeToUserStatus(session.userId, async (updatedUser) => {
          if (
            (updatedUser.password_version || 1) > (session.passwordVersion || 1)
          ) {
            _forceLogout();
            return;
          }

          const newStatus = updatedUser.agency_status;
          if (newStatus && newStatus !== session.agencyStatus) {
            session.agencyStatus = newStatus;
            const { data: freshUser } = await HF_DB.getUserById(session.userId);
            if (freshUser) session.profile = freshUser.profile;
            HF_DB.saveSession(session);

            const { data: msgs } = await HF_DB.getMessages(session.userId);
            const unread = msgs?.filter((m) => !m.read).length || 0;
            _buildSidenav(session, unread, 0);

            HF_UTILS.toast(
              newStatus === "verified"
                ? "Your agency has been verified! Full access unlocked."
                : "Your agency verification was rejected. Check your messages.",
              newStatus === "verified" ? "success" : "error",
            );

            const view =
              document.querySelector(".nav-item.active")?.dataset.view ||
              "dashboard";
            _routeTo(view, session);
          }
        });
      }

      if (!isAdmin) {
        HF_DB.subscribeToUserTickets(session.userId, async (payload) => {
          const ticket = payload.new;
          const oldTicket = payload.old;
          const msgs = ticket.messages || [];
          const oldMsgs = oldTicket.messages || [];

          if (msgs.length > oldMsgs.length && msgs[msgs.length - 1]?.is_admin)
            HF_UTILS.toast("An admin replied to your ticket!", "success");
          if (ticket.status === "claimed" && oldTicket.status === "open")
            HF_UTILS.toast(
              "Your ticket has been claimed by an admin!",
              "success",
            );
          if (ticket.status === "resolved" && oldTicket.status !== "resolved")
            HF_UTILS.toast("Your support ticket has been resolved!", "success");

          const { data: userTickets } = await HF_DB.getUserTickets(
            session.userId,
          );
          const unreadReplies =
            userTickets?.filter((t) => {
              const m = t.messages || [];
              return m[m.length - 1]?.is_admin && t.status !== "resolved";
            }).length || 0;
          const { data: msgs2 } = await HF_DB.getMessages(session.userId);
          const unreadMsgs = msgs2?.filter((m) => !m.read).length || 0;
          HF_ROUTER.refreshSidenavBadge(
            "messages",
            unreadMsgs + unreadReplies,
            "var(--red)",
          );
        });
      }
    }, 1000);
  };

  // ─── Build sidenav ─────────────────────────────────────────
  const _buildSidenav = (
    session,
    unreadCount = 0,
    pendingVerifications = 0,
    teamSizeOverride = null,
    openTickets = 0,
  ) => {
    const nav = el("sidenav");
    const squadStatus = session.squadStatus || "unregistered";
    const teamSize =
      teamSizeOverride !== null
        ? teamSizeOverride
        : session?.profile?.teamSize || 0;

    let items;
    if (session.role === "coach") {
      items = NAVS.coach(squadStatus, teamSize);
    } else if (session.role === "scout") {
      items = NAVS.scout(session.agencyStatus || "unregistered");
    } else if (session.role === "player") {
      items = NAVS.player(session);
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

        // tickets badge for admin
        if (item.view === "tickets" && openTickets > 0) {
          badge = String(openTickets);
          badgeColor = "var(--red)";
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
      ${HF_UTILS.avatarHTML(
        session.name,
        session.profile?.avatarUrl,
        "sm",
        session.role === "player"
          ? "var(--green)"
          : session.role === "coach"
            ? "var(--gold)"
            : "var(--blue)",
      )}
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
    window.HF_REACT?.unmountAll();
    handler.render(view, session);
  };

  // ─── Navigate to a view ─────────────────────────────────────
  const navTo = (view, el_, anchor) => {
    if (window._stopConfetti) window._stopConfetti();
    const [routeView, routeAnchor] = (view || "").split("#");
    const session = HF_DB.getSession();
    if (!session) {
      HF_AUTH.logout();
      return;
    }

    // check user status on every navigation
    if (session.role !== "admin") {
      HF_DB.getUserStatus(session.userId).then((status) => {
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

    // update message badge
    if (session.role !== "admin" && session.userId) {
      HF_DB.getMessages(session.userId).then(({ data: msgs }) => {
        const unreadCount = msgs?.filter((m) => !m.read).length || 0;
        HF_ROUTER.refreshSidenavBadge("messages", unreadCount, "var(--red)");
      });
    }

    // set active nav item
    document
      .querySelectorAll(".nav-item")
      .forEach((i) => i.classList.remove("active"));
    if (el_) el_.classList.add("active");
    else {
      const match = document.querySelector(
        `.nav-item[data-view="${routeView}"]`,
      );
      if (match) match.classList.add("active");
    }

    _closeMobileNav();
    _routeTo(routeView, session);
    if (routeAnchor || anchor) {
      setTimeout(() => {
        const target = document.getElementById(routeAnchor || anchor);
        if (target)
          target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
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
    // remove all existing Supabase channels
    HF_DB.removeAllChannels();
  };

  return {
    buildSidenav: (session) =>
      _buildSidenav(
        session,
        window._sidenavCounts?.unread || 0,
        window._sidenavCounts?.pendingVerifications || 0,
        null,
        window._sidenavCounts?.openTicketCount || 0,
      ),
    _forceLogout,
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
