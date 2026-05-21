const HF_ADMIN = (() => {
  const { toast, initials, badgeHTML } = HF_UTILS;

  const setMain = (html) => {
    if (window._stopConfetti) window._stopConfetti();
    document.getElementById("admin-verification-alert")?.remove();
    const mc = document.getElementById("main-content");
    if (mc) mc.innerHTML = html;
  };

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

    setMain(`
      <div style="background:#0f0f0d;padding:var(--sp-2xl);margin-bottom:var(--sp-lg);display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-lg);">
        <div>
          <div style="font-family:var(--font);font-size:22px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Admin Dashboard</div>
          <div style="font-size:13px;color:rgba(255,255,255,.55);margin-top:3px;">HappyFeet Platform Management</div>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
            <div class="metric-val" style="color:var(--gold)">${pendingCount}</div>
            <div class="metric-label">Pending verifications</div>
            <div class="metric-sub" style="color:var(--text2)">Awaiting review</div>
        </div>
        <div class="metric-card">
            <div class="metric-val" style="color:var(--blue)">${totalUsers}</div>
            <div class="metric-label">Total users</div>
            <div class="metric-sub" style="color:var(--text2)">All roles</div>
        </div>
        <div class="metric-card">
            <div class="metric-val" style="color:var(--green)">${allAgencyVerifications?.filter((v) => v.status === "verified").length || 0}</div>
            <div class="metric-label">Verified agencies</div>
            <div class="metric-sub" style="color:var(--text2)">Total approved</div>
        </div>
        <div class="metric-card">
            <div class="metric-val" style="color:var(--green)">${allVerifications?.filter((v) => v.status === "verified").length || 0}</div>
            <div class="metric-label">Verified squads</div>
            <div class="metric-sub" style="color:var(--text2)">Total approved</div>
        </div>
        </div>

      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Pending verifications</div>
        ${
          pendingCount === 0
            ? `
            <div style="text-align:center;padding:32px;color:var(--text2)">
            <i class="ti ti-circle-check" style="font-size:32px;margin-bottom:10px;display:block;color:var(--green)"></i>
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">All caught up</div>
            <div style="font-size:13px">No pending verifications at this time.</div>
            </div>`
            : `
            ${
              pending?.length > 0
                ? `
            <div style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text2);margin-bottom:8px;">
                Squads
            </div>
            ${pending.map((v) => _verificationRow(v, "squad", s)).join("")}`
                : ""
            }
            ${
              agencyPending?.length > 0
                ? `
            <div style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text2);margin:12px 0 8px;">
                Agencies
            </div>
            ${agencyPending.map((v) => _verificationRow(v, "agency", s)).join("")}`
                : ""
            }`
        }
        </div>`);
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
  const _verificationRow = (v, type, s) => {
    const isSquad = type === "squad";
    const name = isSquad ? v.team_name : v.agency_name;
    const subInfo = isSquad
      ? `${v.league || "-"} · ${v.home_ground || "-"} · Founded ${v.founding_year || "-"}`
      : `Regions: ${Array.isArray(v.regions_covered) ? v.regions_covered.join(", ") : "-"}`;
    const color = isSquad ? "var(--gold)" : "var(--blue)";
    const userId = isSquad ? v.coach_id : v.scout_id;
    const safeName = name.replace(/'/g, "\\'");
    const isMine = v.claimed_by === s.userId;
    const isClaimed = v.claimed_by && !isMine;

    return `
    <div style="padding:var(--sp-md);background:var(--bg2);border-left:2px solid ${isMine ? "var(--gold)" : isClaimed ? "var(--border)" : color};margin-bottom:var(--sp-sm);opacity:${isClaimed ? "0.6" : "1"};">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <div>
          <div style="font-size:14px;font-weight:600;color:var(--text)">${name}</div>
          <div style="font-size:12px;color:var(--text2);margin-top:2px">${subInfo}</div>
          ${v.website ? `<div style="font-size:11px;color:var(--blue);margin-top:2px">${v.website}</div>` : ""}
          <div style="font-size:11px;color:var(--text3);margin-top:2px">Submitted ${HF_UTILS.timeAgo(v.submitted_at)}</div>
          ${
            isClaimed
              ? `
            <div style="font-size:11px;color:var(--text3);margin-top:4px;">
              <i class="ti ti-lock" style="margin-right:4px"></i>
              Being reviewed by ${v.claimer?.name || "another admin"}
            </div>`
              : ""
          }
          ${
            isMine
              ? `
            <div style="font-size:11px;color:var(--gold);margin-top:4px;">
              <i class="ti ti-user" style="margin-right:4px"></i>
              Claimed by you
            </div>`
              : ""
          }
        </div>
        ${badgeHTML(isClaimed ? "In review" : "Pending", isClaimed ? "gold" : isSquad ? "gold" : "blue")}
      </div>

      ${
        isMine && isSquad
          ? `
        <div id="edit-form-${v.id}" style="display:none;margin-bottom:12px;padding:12px;background:var(--bg);border:0.5px solid var(--border);">
          <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text2);margin-bottom:8px;">Edit verification details</div>
          <div class="fg">
            <label>Team name</label>
            <input type="text" id="edit-name-${v.id}" value="${v.team_name}" style="padding:8px 12px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:13px;width:100%;outline:none;font-family:var(--font);">
          </div>
          <div class="fg">
            <label>League / division</label>
            <input type="text" id="edit-league-${v.id}" value="${v.league || ""}" style="padding:8px 12px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:13px;width:100%;outline:none;font-family:var(--font);">
          </div>
          <div class="form-row">
            <div class="fg">
              <label>Founding year</label>
              <input type="number" id="edit-year-${v.id}" value="${v.founding_year || ""}" style="padding:8px 12px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:13px;width:100%;outline:none;font-family:var(--font);">
            </div>
            <div class="fg">
              <label>Home ground</label>
              <input type="text" id="edit-ground-${v.id}" value="${v.home_ground || ""}" style="padding:8px 12px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:13px;width:100%;outline:none;font-family:var(--font);">
            </div>
          </div>
          <div class="fg">
            <label>Admin notes to coach</label>
            <input type="text" id="edit-notes-${v.id}" placeholder="e.g. Team name corrected" style="padding:8px 12px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:13px;width:100%;outline:none;font-family:var(--font);">
          </div>
          <div style="display:flex;gap:8px;margin-top:8px;">
            <button class="btn btn-primary btn-sm" onclick="HF_ADMIN.saveEdits('${v.id}','${userId}','${safeName}')">
              <i class="ti ti-circle-check"></i> Save & notify
            </button>
            <button class="btn btn-outline btn-sm" onclick="HF_ADMIN.toggleEditForm('${v.id}')">Cancel</button>
          </div>
        </div>`
          : ""
      }

      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
        ${
          !isClaimed && !isMine
            ? `
          <button class="btn btn-primary btn-sm" onclick="HF_ADMIN.claimAndReview('${v.id}', '${type}')">
            <i class="ti ti-eye"></i> Claim & review
          </button>`
            : ""
        }
        ${
          isMine
            ? `
          <button class="btn btn-primary btn-sm" onclick="HF_ADMIN.approveVerification('${v.id}','${userId}','${safeName}','${type}')">
            <i class="ti ti-circle-check"></i> Approve
          </button>
          ${
            isSquad
              ? `
            <button class="btn btn-outline btn-sm" onclick="HF_ADMIN.toggleEditForm('${v.id}')">
              <i class="ti ti-edit"></i> Edit
            </button>`
              : ""
          }
          <button class="btn btn-danger btn-sm" onclick="HF_ADMIN.rejectVerification('${v.id}','${userId}','${safeName}','${type}')">
            <i class="ti ti-x"></i> Reject
          </button>
          <button class="btn btn-outline btn-sm" onclick="HF_ADMIN.unclaimVerification('${v.id}','${type}')">
            <i class="ti ti-x"></i> Release
          </button>`
            : ""
        }
      </div>
    </div>`;
  };

  const verifications = async (s, type = "squad") => {
    const isSquad = type === "squad";
    const { data: all } = await HF_DB.getAllVerifications(type);

    const pending = all?.filter((v) => v.status === "pending") || [];
    const verified = all?.filter((v) => v.status === "verified") || [];
    const rejected = all?.filter((v) => v.status === "rejected") || [];

    const nameKey = isSquad ? "team_name" : "agency_name";
    const color = isSquad ? "var(--gold)" : "var(--blue)";

    const section = (
      title,
      count,
      sectionColor,
      content,
      startOpen = false,
    ) => `
    <div class="card">
      <div class="card-title" style="cursor:pointer;justify-content:space-between;"
        onclick="const c=this.nextElementSibling;c.style.display=c.style.display==='none'?'block':'none';this.querySelector('i').className='ti '+(c.style.display==='none'?'ti-chevron-down':'ti-chevron-up');">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">
          <div class="card-dot"></div>${title}
          <span style="color:${sectionColor};margin-left:4px">${count}</span>
        </div>
        <i class="ti ${startOpen ? "ti-chevron-up" : "ti-chevron-down"}" style="font-size:14px;color:var(--text3)"></i>
      </div>
      <div style="display:${startOpen ? "block" : "none"}">
        ${
          count === 0
            ? `<div style="text-align:center;padding:24px;color:var(--text2);font-size:13px">Nothing here yet.</div>`
            : content
        }
      </div>
    </div>`;

    const verifiedRow = (v) => `
    <div style="padding:var(--sp-md);background:var(--bg2);border-left:2px solid var(--green);margin-bottom:var(--sp-sm);">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:14px;font-weight:600;color:var(--text)">${v[nameKey]}</div>
          <div style="font-size:11px;color:var(--text2)">Verified ${v.reviewed_at ? HF_UTILS.timeAgo(v.reviewed_at) : "-"}</div>
        </div>
        ${badgeHTML("Verified", "green")}
      </div>
    </div>`;

    const rejectedRow = (v) => `
    <div style="padding:var(--sp-md);background:var(--bg2);border-left:2px solid var(--red);margin-bottom:var(--sp-sm);">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:14px;font-weight:600;color:var(--text)">${v[nameKey]}</div>
          <div style="font-size:11px;color:var(--red)">Reason: ${v.rejection_reason || "-"}</div>
          <div style="font-size:11px;color:var(--text3)">${HF_UTILS.timeAgo(v.submitted_at)}</div>
        </div>
        ${badgeHTML("Rejected", "red")}
      </div>
    </div>`;

    setMain(`
    <div style="font-family:var(--font);font-size:16px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:var(--text);margin-bottom:var(--sp-lg);">
      ${isSquad ? "Squad" : "Agency"} Verifications
    </div>
    ${section("Pending", pending.length, color, pending.map((v) => _verificationRow(v, type, s)).join(""), true)}
    ${section("Verified", verified.length, "var(--green)", verified.map((v) => verifiedRow(v)).join(""))}
    ${section("Rejected", rejected.length, "var(--red)", rejected.map((v) => rejectedRow(v)).join(""))}
  `);
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

    const ticketRow = (t, showClaim = true) => {
      const roleColor =
        t.from?.role === "player"
          ? "var(--green)"
          : t.from?.role === "coach"
            ? "var(--gold)"
            : t.from?.role === "scout"
              ? "var(--blue)"
              : "var(--text3)";

      return `
      <div style="padding:var(--sp-md);background:var(--bg2);border-left:3px solid ${
        t.status === "open"
          ? "var(--red)"
          : t.status === "claimed"
            ? "var(--gold)"
            : "var(--green)"
      };margin-bottom:var(--sp-sm);">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-md);">
          <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span style="font-size:13px;font-weight:600;color:var(--text)">${t.subject}</span>
              <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:1px 6px;background:${roleColor}22;color:${roleColor};">${t.from?.role || "-"}</span>
              <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:1px 6px;background:var(--bg);color:var(--text3);">${t.category?.charAt(0).toUpperCase() + t.category?.slice(1) || "-"}</span>
            </div>
            <div style="font-size:12px;color:var(--text2);margin-bottom:4px;">
              From: ${t.from?.name || "-"} · ${HF_UTILS.timeAgo(t.created_at)}
            </div>
            <div style="font-size:12px;color:var(--text2);line-height:1.5;">
              ${t.body.slice(0, 150)}${t.body.length > 150 ? "..." : ""}
            </div>
            ${
              t.claimed_by
                ? `
              <div style="font-size:11px;color:var(--gold);margin-top:4px;">
                <i class="ti ti-user" style="margin-right:4px"></i>
                Claimed by ${t.claimer?.name || "Admin"} · ${HF_UTILS.timeAgo(t.claimed_at)}
              </div>`
                : ""
            }
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0;">
            ${
              t.status === "open"
                ? `
                <button class="btn btn-primary btn-sm" onclick="HF_ADMIN.claimTicket('${t.id}')">
                <i class="ti ti-hand-stop"></i> Claim
                </button>`
                : ""
            }

            ${
              t.status === "claimed"
                ? `
                <button class="btn btn-primary btn-sm" onclick="HF_ADMIN.replyTicket('${t.id}', '${t.subject.replace(/'/g, "\\'")}')">
                <i class="ti ti-message"></i> ${t.claimed_by === s.userId ? "Reply" : "View thread"}
                </button>
                ${
                  t.claimed_by === s.userId
                    ? `
                <button class="btn btn-outline btn-sm" onclick="HF_ADMIN.resolveTicket('${t.id}', '${t.from_id}', '${t.subject.replace(/'/g, "\\'")}')">
                    <i class="ti ti-circle-check"></i> Resolve
                </button>`
                    : ""
                }`
                : ""
            }

            ${
              t.status === "resolved"
                ? `
                <button class="btn btn-outline btn-sm" onclick="HF_ADMIN.replyTicket('${t.id}', '${t.subject.replace(/'/g, "\\'")}')">
                <i class="ti ti-message"></i> View
                </button>
                <button class="btn btn-outline btn-sm" onclick="HF_ADMIN.reopenTicket('${t.id}')">
                <i class="ti ti-arrow-back-up"></i> Reopen
                </button>`
                : ""
            }

            <button class="btn btn-outline btn-sm" onclick="HF_ADMIN.viewTicketUser('${t.from_id}')">
                <i class="ti ti-user"></i> Profile
            </button>
            </div>
        </div>
      </div>`;
    };

    const section = (title, color, items, defaultOpen = true) => `
    <div class="card" style="margin-bottom:var(--sp-md);">
      <div class="card-title" style="cursor:pointer;justify-content:space-between;"
        onclick="const c=this.nextElementSibling;c.style.display=c.style.display==='none'?'block':'none';this.querySelector('i').className='ti '+(c.style.display==='none'?'ti-chevron-down':'ti-chevron-up');">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">
          <div class="card-dot" style="background:${color}"></div>${title}
          <span style="font-size:11px;color:var(--text3)">${items.length}</span>
        </div>
        <i class="ti ${defaultOpen ? "ti-chevron-up" : "ti-chevron-down"}" style="font-size:14px;color:var(--text3)"></i>
      </div>
      <div style="display:${defaultOpen ? "block" : "none"}">
        ${
          items.length === 0
            ? `<div style="text-align:center;padding:24px;color:var(--text2);font-size:13px">No tickets here.</div>`
            : items.map((t) => ticketRow(t)).join("")
        }
      </div>
    </div>`;

    setMain(`
    <div class="metrics-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="metric-card">
        <div class="metric-val" style="color:var(--red)">${open.length}</div>
        <div class="metric-label">Unclaimed</div>
      </div>
      <div class="metric-card">
        <div class="metric-val" style="color:var(--gold)">${mine.length}</div>
        <div class="metric-label">My tickets</div>
      </div>
      <div class="metric-card">
        <div class="metric-val" style="color:var(--blue)">${others.length}</div>
        <div class="metric-label">Others handling</div>
      </div>
      <div class="metric-card">
        <div class="metric-val" style="color:var(--green)">${resolved.length}</div>
        <div class="metric-label">Resolved</div>
      </div>
    </div>

    ${section("Unclaimed", "var(--red)", open, true)}
    ${section("My tickets", "var(--gold)", mine, true)}
    ${section("Handled by others", "var(--blue)", others, false)}
    ${section("Resolved", "var(--green)", resolved, false)}`);
  };

  // ── USERS ──────────────────────────────────────────────────
  const userRow = (u, showActions = true) => {
    const safeName = u.name.replace(/'/g, "\\'");
    return `
    <div style="display:flex;align-items:center;gap:var(--sp-md);padding:var(--sp-md);background:var(--bg2);margin-bottom:var(--sp-sm);border-left:2px solid ${u.banned ? "var(--red)" : "var(--border)"};">
      <div class="avatar avatar-sm" style="background:${u.role === "player" ? "var(--green)" : u.role === "coach" ? "var(--gold)" : u.role === "admin" ? "var(--red)" : "var(--blue)"}">
        ${HF_UTILS.initials(u.name)}
      </div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600;color:var(--text)">${u.name}</div>
        <div style="font-size:11px;color:var(--text2)">${u.contact}</div>
        ${u.banned ? `<div style="font-size:11px;color:var(--red);margin-top:2px">Banned: ${u.ban_reason || "-"}</div>` : ""}
      </div>
      ${
        showActions
          ? `
        <div style="display:flex;gap:6px;flex-shrink:0;">
        <button class="btn btn-outline btn-sm" onclick="HF_ROLE_UTILS.viewSenderProfile('${u.id}', 'admin', 'users')">
            <i class="ti ti-user"></i> Profile
        </button>
          ${
            u.banned
              ? `
            <button class="btn btn-outline btn-sm" onclick="HF_ADMIN.unbanUser('${u.id}')">
              <i class="ti ti-lock-open"></i> Unban
            </button>`
              : `
            <button class="btn btn-outline btn-sm" onclick="HF_ADMIN.kickUser('${u.id}', '${safeName}')">
              <i class="ti ti-logout"></i> Kick
            </button>
            <button class="btn btn-danger btn-sm" onclick="HF_ADMIN.banUser('${u.id}', '${safeName}')">
              <i class="ti ti-ban"></i> Ban
            </button>`
          }
          <button class="btn btn-danger btn-sm" onclick="HF_ADMIN.removeUser('${u.id}', '${safeName}')">
            <i class="ti ti-trash"></i> Remove
          </button>
        </div>`
          : `
        <div style="font-family:var(--font);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:2px 8px;background:rgba(200,16,46,.1);color:var(--red);">
          Admin
        </div>`
      }
    </div>`;
  };

  const users = async (s) => {
    const { data: allUsers } = await HF_DB.getAllUsers();

    const players = allUsers?.filter((u) => u.role === "player") || [];
    const coaches = allUsers?.filter((u) => u.role === "coach") || [];
    const scouts = allUsers?.filter((u) => u.role === "scout") || [];
    const admins = allUsers?.filter((u) => u.role === "admin") || [];

    const section = (title, color, list, showActions = true) => `
    <div class="card">
      <div class="card-title" style="cursor:pointer;justify-content:space-between;"
        onclick="const c=this.nextElementSibling;c.style.display=c.style.display==='none'?'block':'none';this.querySelector('i').className='ti '+(c.style.display==='none'?'ti-chevron-down':'ti-chevron-up');">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">
          <div class="card-dot"></div>${title}
          <span style="color:${color};margin-left:4px">${list.length}</span>
        </div>
        <i class="ti ti-chevron-down" style="font-size:14px;color:var(--text3)"></i>
      </div>
      <div style="display:none">
        ${
          list.length === 0
            ? `<div style="text-align:center;padding:24px;color:var(--text2);font-size:13px">No ${title.toLowerCase()} yet.</div>`
            : list.map((u) => userRow(u, showActions)).join("")
        }
      </div>
    </div>`;

    setMain(`
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-val" style="color:var(--green)">${players.length}</div>
        <div class="metric-label">Players</div>
      </div>
      <div class="metric-card">
        <div class="metric-val" style="color:var(--gold)">${coaches.length}</div>
        <div class="metric-label">Coaches</div>
      </div>
      <div class="metric-card">
        <div class="metric-val" style="color:var(--blue)">${scouts.length}</div>
        <div class="metric-label">Scouts</div>
      </div>
      <div class="metric-card">
        <div class="metric-val" style="color:var(--red)">${admins.length}</div>
        <div class="metric-label">Admins</div>
      </div>
    </div>

    ${section("Players", "var(--green)", players)}
    ${section("Coaches", "var(--gold)", coaches)}
    ${section("Scouts", "var(--blue)", scouts)}
    ${section("Admins", "var(--red)", admins, false)}
  `);
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

    // enrich messages with sender names
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

    setMain(`
    <div class="card">
      <div class="card-title" style="justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">
            <div class="card-dot"></div>Messages
        </div>
         <div style="display:flex;gap:6px;">
          <button class="btn btn-primary btn-sm" onclick="HF_ROLE_UTILS.composeMessage()">
            <i class="ti ti-edit"></i> New message
          </button>
          </div>
        </div>
      ${
        !msgs || msgs.length === 0
          ? `
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <i class="ti ti-message" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No messages yet</div>
          <div style="font-size:13px">Admin messages will appear here.</div>
        </div>`
          : HF_UTILS.messageListHTML(enriched, "admin")
      }
    </div>

    ${
      archived?.length > 0
        ? `
      <div class="card">
        <div class="card-title" style="cursor:pointer;" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
          <div class="card-dot"></div>Archived
          <span style="margin-left:auto;font-size:11px;color:var(--text3)">
            ${archived.length} · click to expand
          </span>
        </div>
        <div style="display:none">
          ${enrichedArchived
            .map(
              (m) => `
            <div class="msg-item" id="archived-msg-${m.id}" style="cursor:pointer;" 
                onclick="HF_ROLE_UTILS.viewThread('${m.thread_id}', '${m.from_id}', '${(m.subject || "").replace(/'/g, "\\'")}')">
                <div class="avatar avatar-md" style="background:var(--bg2);display:flex;align-items:center;justify-content:center;">
                <i class="ti ti-shield" style="font-size:16px;color:var(--text3)"></i>
                </div>
                <div style="flex:1;opacity:0.6">
                <div style="font-size:11px;font-family:var(--font);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--text3);margin-bottom:2px;">
                    From: ${m.senderName || (m.from_id === "system" ? "HappyFeet System" : "HappyFeet Admin")}
                </div>
                <div class="msg-name">${m.subject || "Message"}</div>
                <div class="msg-preview">${m.body}</div>
                <div class="msg-time">${HF_UTILS.timeAgo(m.created_at)}</div>
                </div>
                <button class="btn btn-outline btn-sm" style="font-size:10px;padding:2px 8px;flex-shrink:0;"
                title="Move back to inbox"
                onclick="event.stopPropagation();HF_ROLE_UTILS.unarchiveMessage('${m.id}')">
                <i class="ti ti-inbox"></i>
                </button>
            </div>`,
            )
            .join("")}
        </div>
      </div>`
        : ""
    }`);
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

    setMain(`
    <div style="display:flex;align-items:center;gap:var(--sp-md);margin-bottom:var(--sp-lg);">
      <button class="btn btn-outline btn-sm" onclick="HF_ROUTER.navTo('tickets')">
        <i class="ti ti-arrow-left"></i> Back
      </button>
      <div style="font-size:14px;font-weight:700;color:var(--text);">${subject}</div>
    </div>

    <div class="card" style="padding:0;overflow:hidden;">
      <div style="padding:var(--sp-lg);display:flex;flex-direction:column;gap:var(--sp-md);min-height:200px;max-height:50vh;overflow-y:auto;" id="ticket-thread">
        ${(msgs || [])
          .map((m) => {
            const isMine = m.from_id === session.userId;
            return `
            <div style="display:flex;flex-direction:column;align-items:${isMine ? "flex-end" : "flex-start"};">
              <div style="font-size:10px;color:var(--text3);margin-bottom:3px;">
                ${m.from_name} · ${HF_UTILS.timeAgo(m.created_at)}
              </div>
              <div style="max-width:75%;padding:10px 14px;background:${isMine ? "var(--gold)" : "var(--bg2)"};color:${isMine ? "#0f0f0d" : "var(--text)"};font-size:13px;line-height:1.5;">
                ${m.body}
              </div>
            </div>`;
          })
          .join("")}
      </div>
      <div style="padding:var(--sp-md);border-top:0.5px solid var(--border);display:flex;gap:8px;align-items:center;">
        <input type="text" id="ticket-reply-input" placeholder="Write a reply..."
          style="flex:1;padding:0 12px;height:42px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:13px;font-family:var(--font);outline:none;"
          onkeydown="if(event.key==='Enter')HF_ADMIN.sendTicketReply('${ticketId}', '${subject.replace(/'/g, "\\'")}')">
        <button class="btn btn-primary" style="height:42px;width:42px;padding:0;display:flex;align-items:center;justify-content:center;"
          onclick="HF_ADMIN.sendTicketReply('${ticketId}', '${subject.replace(/'/g, "\\'")}')">
          <i class="ti ti-send"></i>
        </button>
      </div>
    </div>`);

    setTimeout(() => {
      const el = document.getElementById("ticket-thread");
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
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

  const viewTicketUser = async (userId) => {
    const html = await HF_ROLE_UTILS.viewProfile(
      userId,
      "HF_ROUTER.navTo('tickets')",
    );
    if (!html) return;
    setMain(html);
  };

  // ── ADMIN FUNCTIONS ───────────────────────────────────────
  const composeMessage = () => HF_ROLE_UTILS.composeMessage("admin");
  const searchRecipients = (q) => HF_ROLE_UTILS.searchRecipients(q, "admin");
  const selectRecipient = (id, name, role) =>
    HF_ROLE_UTILS.selectRecipient(id, name, role, "admin");
  const removeRecipient = (id) => HF_ROLE_UTILS.removeRecipient(id);
  const sendComposedMessage = () => HF_ROLE_UTILS.sendComposedMessage("admin");
  const viewThread = (tid, uid, sub) =>
    HF_ROLE_UTILS.viewThread(tid, uid, sub, "admin");
  const sendReply = (tid, sub, thid) =>
    HF_ROLE_UTILS.sendReply(tid, sub, thid, "admin");
  const toggleMsgActions = (mid) => HF_ROLE_UTILS.toggleMsgActions(mid);
  const replyToMessage = (mid, fid, sn, sub, thid) =>
    HF_ROLE_UTILS.replyToMessage(mid, fid, sn, sub, thid, "admin");
  const viewSenderProfile = (uid) =>
    HF_ROLE_UTILS.viewSenderProfile(uid, "admin");
  const reportToAdmin = (fid, sn) =>
    HF_ROLE_UTILS.reportToAdmin(fid, sn, "admin");
  const archiveMessage = (mid, el) =>
    HF_ROLE_UTILS.archiveMessage(mid, el, "admin");
  const unarchiveMessage = (mid) =>
    HF_ROLE_UTILS.unarchiveMessage(mid, "admin");
  const readMessage = (mid, el) => HF_ROLE_UTILS.readMessage(mid, el, "admin");

  return {
    render,
    kickUser,
    banUser,
    unbanUser,
    removeUser,
    toggleEditForm,
    saveEdits,
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
