const HF_ADMIN = (() => {
  // HF_UTILS is registered by src/lib/legacyBridge.js after this script loads.
  const toast = (...args) => HF_UTILS.toast(...args);

  // ── RENDER DISPATCHER ───────────────────────────────────────
  const render = async (view, session) => {
    const views = {
      dashboard,
      "squad-verifications": (s) => verifications(s, "squad"),
      "agency-verifications": (s) => verifications(s, "agency"),
      users,
      messages,
      tickets,
    };
    const fn = views[view] || dashboard;
    fn(session);
  };

  // ── DASHBOARD ──────────────────────────────────────────────
  const dashboard = async (s) => {
    const { data: pending } = await HF_DB.getPendingVerifications("squad");
    const { data: agencyPending } =
      await HF_DB.getPendingVerifications("agency");
    const { data: allVerifications } = await HF_DB.getAllVerifications("squad");
    const { data: allAgencyVerifications } =
      await HF_DB.getAllVerifications("agency");
    const { data: allUsers } = await HF_DB.getAllUsers();

    const pendingCount = (pending?.length || 0) + (agencyPending?.length || 0);
    const verifiedCount =
      (allVerifications?.filter((v) => v.status === "verified").length || 0) +
      (allAgencyVerifications?.filter((v) => v.status === "verified").length ||
        0);
    const totalUsers = allUsers?.length || 0;
    const rejectedCount =
      (allVerifications?.filter((v) => v.status === "rejected").length || 0) +
      (allAgencyVerifications?.filter((v) => v.status === "rejected").length ||
        0);

    HF_ROUTER.refreshSidenavBadge("verifications", pendingCount, "var(--gold)");

    if (window._stopConfetti) window._stopConfetti();
    document.getElementById("admin-verification-alert")?.remove();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("AdminDashboard", mc, {
        session: s,
        pending,
        agencyPending,
        pendingCount,
        totalUsers,
        verifiedAgencyCount:
          allAgencyVerifications?.filter((v) => v.status === "verified")
            .length || 0,
        verifiedSquadCount:
          allVerifications?.filter((v) => v.status === "verified").length || 0,
      });
  };

  // ── SQUAD/AGENCY ACTIONS ──────────────────────────────────────────
  const approveSquad = async (verificationId, coachId, teamName) => {
    const result = await HF_DB.approveVerification(
      verificationId,
      coachId,
      teamName,
      "squad",
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }
    HF_UTILS.toast(`${teamName} approved!`, "success");
    await HF_DB.unclaimVerification(verificationId, "squad");
    verifications(HF_DB.getSession(), "squad");
  };

  const rejectSquad = async (verificationId, coachId, teamName) => {
    const reason = prompt(`Reason for rejecting ${teamName}?`);
    if (!reason) return;
    const result = await HF_DB.rejectVerification(
      verificationId,
      coachId,
      teamName,
      reason,
      "squad",
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }
    HF_UTILS.toast(`${teamName} rejected.`, "error");
    await HF_DB.unclaimVerification(verificationId, "squad");
    verifications(HF_DB.getSession(), "squad");
  };

  const approveAgency = async (verificationId, scoutId, agencyName) => {
    const result = await HF_DB.approveVerification(
      verificationId,
      scoutId,
      agencyName,
      "agency",
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }
    HF_UTILS.toast(`${agencyName} approved!`, "success");
    await HF_DB.unclaimVerification(verificationId, "agency");
    verifications(HF_DB.getSession(), "agency");
  };

  const rejectAgency = async (verificationId, scoutId, agencyName) => {
    const reason = prompt(`Reason for rejecting ${agencyName}?`);
    if (!reason) return;
    const result = await HF_DB.rejectVerification(
      verificationId,
      scoutId,
      agencyName,
      reason,
      "agency",
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }
    HF_UTILS.toast(`${agencyName} rejected.`, "error");
    await HF_DB.unclaimVerification(verificationId, "agency");
    verifications(HF_DB.getSession(), "agency");
  };

  // ── SQUAD/AGENCY VERIFICATIONS ──────────────────────────────────────────
  const verifications = async (s, type = "squad") => {
    const { data: all } = await HF_DB.getAllVerifications(type);

    if (window._stopConfetti) window._stopConfetti();
    document.getElementById("admin-verification-alert")?.remove();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("AdminVerifications", mc, {
        session: s,
        kind: type,
        list: all,
      });
  };

  const claimAndReview = async (verificationId, type) => {
    const session = HF_DB.getSession();
    const result = await HF_DB.claimVerification(
      verificationId,
      session.userId,
      type,
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }
    verifications(session, type);
  };

  const unclaimVerification = async (verificationId, type) => {
    const result = await HF_DB.unclaimVerification(verificationId, type);
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }
    HF_UTILS.toast("Verification released.", "success");
    verifications(HF_DB.getSession(), type);
  };

  // ── TICKETS ─────────────────────────────────────────────────
  const tickets = async (s) => {
    const { data: allTickets } = await HF_DB.getTickets();
    const { data: myTickets } = await HF_DB.getMyTickets(s.userId);

    const open = allTickets?.filter((t) => t.status === "open") || [];
    const mine =
      allTickets?.filter(
        (t) => t.status === "claimed" && t.claimed_by === s.userId,
      ) || [];
    const others =
      allTickets?.filter(
        (t) => t.status === "claimed" && t.claimed_by !== s.userId,
      ) || [];
    const resolved = allTickets?.filter((t) => t.status === "resolved");

    if (window._stopConfetti) window._stopConfetti();
    document.getElementById("admin-verification-alert")?.remove();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("AdminTickets", mc, {
        session: s,
        open,
        mine,
        others,
        resolved,
      });
  };

  // ── USERS ──────────────────────────────────────────────────
  const users = async (s) => {
    const { data: allUsers } = await HF_DB.getAllUsers();

    if (window._stopConfetti) window._stopConfetti();
    document.getElementById("admin-verification-alert")?.remove();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("AdminUsers", mc, { session: s, users: allUsers });
  };

  // ── USER ACTIONS ───────────────────────────────────────────
  const kickUser = async (userId, name) => {
    if (!confirm(`Kick ${name}? They will be logged out immediately.`)) return;
    const result = await HF_DB.kickUser(userId);
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    toast(`${name} has been kicked.`, "success");
    users(HF_DB.getSession());
  };

  const banUser = async (userId, name) => {
    const reason = prompt(`Ban reason for ${name}:`);
    if (!reason) return;
    const result = await HF_DB.banUser(userId, reason);
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    toast(`${name} has been banned.`, "success");
    users(HF_DB.getSession());
  };

  const unbanUser = async (userId) => {
    const result = await HF_DB.unbanUser(userId);
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    toast("User has been unbanned.", "success");
    users(HF_DB.getSession());
  };

  const removeUser = async (userId, name) => {
    if (!confirm(`Permanently remove ${name}? This cannot be undone.`)) return;
    const result = await HF_DB.removeUser(userId);
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    toast(`${name} has been removed.`, "success");
    users(HF_DB.getSession());
  };

  const toggleEditForm = (verificationId) => {
    const form = document.getElementById(`edit-form-${verificationId}`);
    if (form)
      form.style.display = form.style.display === "none" ? "block" : "none";
  };

  const saveEdits = async (verificationId, coachId, originalName) => {
    const teamName = document
      .getElementById(`edit-name-${verificationId}`)
      ?.value.trim();
    const league = document
      .getElementById(`edit-league-${verificationId}`)
      ?.value.trim();
    const year = document
      .getElementById(`edit-year-${verificationId}`)
      ?.value.trim();
    const ground = document
      .getElementById(`edit-ground-${verificationId}`)
      ?.value.trim();
    const notes = document
      .getElementById(`edit-notes-${verificationId}`)
      ?.value.trim();

    if (!teamName) {
      HF_UTILS.toast("Team name cannot be empty.", "error");
      return;
    }
    if (!league) {
      HF_UTILS.toast("League cannot be empty.", "error");
      return;
    }

    const result = await HF_DB.saveVerificationEdits(verificationId, coachId, {
      teamName,
      league,
      year,
      ground,
      notes,
      originalName,
    });

    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    // refresh sidenav badge
    const { data: pending } = await HF_DB.getPendingVerifications();
    const pendingCount = pending?.length || 0;
    HF_ROUTER.refreshSidenavBadge("verifications", pendingCount, "var(--gold)");

    HF_UTILS.toast(
      "Changes saved. Coach will see the update on their next login.",
      "success",
    );
    verifications(HF_DB.getSession());
  };

  const showPendingAlert = (count) => {
    const overlay = document.createElement("div");
    overlay.id = "admin-verification-alert";
    overlay.className = "verification-alert-overlay";
    overlay.innerHTML = `
    <div class="verification-alert-card">
      <i class="ti ti-clipboard-check" style="font-size:36px;color:var(--gold);margin-bottom:var(--sp-lg);display:block;"></i>
      <div style="font-family:var(--font);font-size:18px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:var(--text);margin-bottom:var(--sp-sm);">
        ${count} pending verification${count > 1 ? "s" : ""}
      </div>
      <div style="font-size:14px;color:var(--text2);margin-bottom:var(--sp-xl);line-height:1.6;">
        ${count} squad or agency registration${count > 1 ? "s are" : " is"} awaiting your review.
      </div>
      <div style="display:flex;gap:8px;justify-content:center;">
        <button class="btn btn-primary" onclick="document.getElementById('admin-verification-alert').remove();HF_ROUTER.navTo('verifications');">
          <i class="ti ti-clipboard-check"></i> Review now
        </button>
        <button class="btn btn-outline" onclick="document.getElementById('admin-verification-alert').remove();">
          Dismiss
        </button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
  };

  // ── MESSAGES ───────────────────────────────────────────────
  const messages = async (s) => {
    const [{ data: msgs }, { data: archived }] = await Promise.all([
      HF_DB.getMessages(s.userId),
      HF_DB.getArchivedMessages(s.userId),
    ]);

    const allSenderIds = [
      ...(msgs || []).map((m) => m.from_id),
      ...(archived || []).map((m) => m.from_id),
    ];
    const senderNames = await HF_DB.getUserNamesByIds(allSenderIds);

    const enriched = (msgs || []).map((m) => ({
      ...m,
      senderName: senderNames[m.from_id] || "HappyFeet",
    }));

    const enrichedArchived = (archived || []).map((m) => ({
      ...m,
      senderName: senderNames[m.from_id] || "HappyFeet",
    }));

    if (window._stopConfetti) window._stopConfetti();
    document.getElementById("admin-verification-alert")?.remove();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("AdminMessages", mc, {
        session: s,
        messages: enriched,
        archived: enrichedArchived,
      });
  };

  // ── TICKET HELPERS ───────────────────────────────────────────────
  const claimTicket = async (ticketId) => {
    const session = HF_DB.getSession();
    const result = await HF_DB.claimTicket(ticketId, session.userId);
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }
    HF_UTILS.toast("Ticket claimed!", "success");
    tickets(session);
  };

  const resolveTicket = async (ticketId, fromId, subject) => {
    const session = HF_DB.getSession();
    const result = await HF_DB.resolveTicket(ticketId);
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    await HF_DB._sendMessage(
      "system",
      fromId,
      `Ticket resolved: ${subject}`,
      `Your support ticket "${subject}" has been resolved by our team. If you need further assistance please submit a new ticket.`,
    );

    HF_UTILS.toast("Ticket resolved!", "success");
    tickets(session);
  };

  const reopenTicket = async (ticketId) => {
    const session = HF_DB.getSession();
    const result = await HF_DB.reopenTicket(ticketId);
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }
    HF_UTILS.toast("Ticket reopened.", "success");
    tickets(session);
  };

  const replyTicket = async (ticketId, subject) => {
    const { data: msgs } = await HF_DB.getTicketMessages(ticketId);
    const session = HF_DB.getSession();

    if (window._stopConfetti) window._stopConfetti();
    document.getElementById("admin-verification-alert")?.remove();
    const mc = document.getElementById("main-content");
    if (mc)
      window.HF_REACT.mount("AdminTicketThread", mc, {
        ticketId,
        subject,
        session,
        messages: msgs,
      });
  };

  const sendTicketReply = async (ticketId, subject) => {
    const session = HF_DB.getSession();
    const body = document.getElementById("ticket-reply-input")?.value.trim();
    if (!body) return;

    const result = await HF_DB.addTicketMessage(
      ticketId,
      session.userId,
      body,
      true,
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    document.getElementById("ticket-reply-input").value = "";
    replyTicket(ticketId, subject);
  };

  const viewTicketUser = (userId) => {
    if (window._stopConfetti) window._stopConfetti();
    document.getElementById("admin-verification-alert")?.remove();
    return HF_ROLE_UTILS.viewSenderProfile(userId, "admin", "tickets");
  };

  return {
    render,
    kickUser,
    banUser,
    unbanUser,
    removeUser,
    approveSquad,
    approveAgency,
    rejectSquad,
    rejectAgency,
    toggleEditForm,
    saveEdits,
    messages,
    tickets,
    claimTicket,
    resolveTicket,
    reopenTicket,
    replyTicket,
    sendTicketReply,
    viewTicketUser,
    claimAndReview,
    verifications,
    unclaimVerification,
  };
})();

window.HF_ADMIN = HF_ADMIN;
