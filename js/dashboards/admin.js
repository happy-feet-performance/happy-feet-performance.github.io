const HF_ADMIN = (() => {
  const { toast, initials, badgeHTML } = HF_UTILS;

  const setMain = (html) => {
    const mc = document.getElementById("main-content");
    if (mc) mc.innerHTML = html;
  };

  const render = async (view, session) => {
    const views = {
      dashboard,
      "squad-verifications": squadVerifications,
      "agency-verifications": agencyVerifications,
      users,
      messages,
    };
    const fn = views[view] || dashboard;
    fn(session);
  };

  // ── DASHBOARD ──────────────────────────────────────────────
  const dashboard = async (s) => {
    const { data: pending } = await HF_DB.getPendingVerifications();
    const { data: agencyPending } = await HF_DB.getPendingAgencyVerifications();
    const { data: allVerifications } = await HF_DB.getAllVerifications();
    const { data: allAgencyVerifications } =
      await HF_DB.getAllAgencyVerifications();
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
          <div style="font-family:var(--font-head);font-size:22px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Admin Dashboard</div>
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
            <div style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text2);margin-bottom:8px;">
                Squads
            </div>
            ${pending.map((v) => _verificationRow(v)).join("")}`
                : ""
            }
            ${
              agencyPending?.length > 0
                ? `
            <div style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text2);margin:12px 0 8px;">
                Agencies
            </div>
            ${agencyPending.map((v) => _agencyVerificationRow(v)).join("")}`
                : ""
            }`
        }
        </div>`);
  };

  // ── SQUAD ACTIONS ──────────────────────────────────────────
  const approveSquad = async (verificationId, coachId, teamName) => {
    const result = await HF_DB.approveSquadVerification(
      verificationId,
      coachId,
      teamName,
    );
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    const { data: pending } = await HF_DB.getPendingVerifications();
    const { data: agencyPending } = await HF_DB.getPendingAgencyVerifications();
    HF_ROUTER.refreshSidenavBadge(
      "squad-verifications",
      pending?.length || 0,
      "var(--gold)",
    );
    toast(`${teamName} has been verified!`, "success");
    squadVerifications(HF_DB.getSession());
  };

  const rejectSquad = async (verificationId, coachId, teamName) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    const result = await HF_DB.rejectSquadVerification(
      verificationId,
      coachId,
      teamName,
      reason,
    );
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    const { data: pending } = await HF_DB.getPendingVerifications();
    HF_ROUTER.refreshSidenavBadge(
      "squad-verifications",
      pending?.length || 0,
      "var(--gold)",
    );
    toast(`${teamName} has been rejected.`, "success");
    squadVerifications(HF_DB.getSession());
  };

  const approveAgency = async (verificationId, scoutId, agencyName) => {
    const result = await HF_DB.approveAgencyVerification(
      verificationId,
      scoutId,
      agencyName,
    );
    if (result.error) {
      toast(result.error, "error");
      return;
    }

    const { data: agencyPending } = await HF_DB.getPendingAgencyVerifications();
    HF_ROUTER.refreshSidenavBadge(
      "agency-verifications",
      agencyPending?.length || 0,
      "var(--gold)",
    );

    toast(`${agencyName} has been verified!`, "success");
    agencyVerifications(HF_DB.getSession());
  };

  const rejectAgency = async (verificationId, scoutId, agencyName) => {
    const reason = prompt(`Rejection reason for ${agencyName}:`);
    if (!reason) return;
    const result = await HF_DB.rejectAgencyVerification(
      verificationId,
      scoutId,
      agencyName,
      reason,
    );
    if (result.error) {
      toast(result.error, "error");
      return;
    }

    const { data: agencyPending } = await HF_DB.getPendingAgencyVerifications();
    HF_ROUTER.refreshSidenavBadge(
      "agency-verifications",
      agencyPending?.length || 0,
      "var(--gold)",
    );

    toast(`${agencyName} has been rejected.`, "success");
    agencyVerifications(HF_DB.getSession());
  };

  // ── VERIFICATIONS ──────────────────────────────────────────
  const _agencyVerificationRow = (v) => `
  <div style="padding:var(--sp-md);background:var(--bg2);border-left:2px solid var(--blue);margin-bottom:var(--sp-sm);">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
      <div>
        <div style="font-size:14px;font-weight:600;color:var(--text)">${v.agency_name}</div>
        <div style="font-size:12px;color:var(--text2);margin-top:2px">
          Regions: ${Array.isArray(v.regions_covered) ? v.regions_covered.join(", ") : v.region || "-"}
        </div>
        <div style="font-size:12px;color:var(--text2);margin-top:2px">
          Targets: ${Array.isArray(v.target_leagues) ? v.target_leagues.join(", ") : "-"}
        </div>
        ${v.website ? `<div style="font-size:11px;color:var(--blue);margin-top:2px">${v.website}</div>` : ""}
        <div style="font-size:11px;color:var(--text3);margin-top:2px">
          Submitted ${HF_UTILS.timeAgo(v.submitted_at)}
        </div>
      </div>
      ${badgeHTML("Pending", "blue")}
    </div>
    <div style="display:flex;gap:8px;margin-top:8px;">
      <button class="btn btn-primary btn-sm" onclick="HF_ADMIN.approveAgency('${v.id}','${v.scout_id}','${v.agency_name}')">
        <i class="ti ti-circle-check"></i> Approve
      </button>
      <button class="btn btn-danger btn-sm" onclick="HF_ADMIN.rejectAgency('${v.id}','${v.scout_id}','${v.agency_name}')">
        <i class="ti ti-x"></i> Reject
      </button>
    </div>
  </div>`;

  const squadVerifications = async (s) => {
    const { data: allVerifications } = await HF_DB.getAllVerifications();
    const pending =
      allVerifications?.filter((v) => v.status === "pending") || [];
    const verified =
      allVerifications?.filter((v) => v.status === "verified") || [];
    const rejected =
      allVerifications?.filter((v) => v.status === "rejected") || [];

    const section = (title, count, color, content, startOpen = false) => `
    <div class="card">
      <div class="card-title" style="cursor:pointer;justify-content:space-between;"
        onclick="const c=this.nextElementSibling;c.style.display=c.style.display==='none'?'block':'none';this.querySelector('i').className='ti '+(c.style.display==='none'?'ti-chevron-down':'ti-chevron-up');">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">
          <div class="card-dot"></div>${title}
          <span style="color:${color};margin-left:4px">${count}</span>
        </div>
        <i class="ti ${startOpen ? "ti-chevron-up" : "ti-chevron-down"}" style="font-size:14px;color:var(--text3)"></i>
      </div>
      <div style="display:${startOpen ? "block" : "none"}">
        ${count === 0 ? `<div style="text-align:center;padding:24px;color:var(--text2);font-size:13px">Nothing here yet.</div>` : content}
      </div>
    </div>`;

    setMain(`
    <div style="font-family:var(--font-head);font-size:16px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:var(--text);margin-bottom:var(--sp-lg);">
      Squad Verifications
    </div>

    ${section(
      "Pending",
      pending.length,
      "var(--gold)",
      pending.map((v) => _verificationRow(v)).join(""),
      true,
    )}

    ${section(
      "Verified",
      verified.length,
      "var(--green)",
      verified
        .map(
          (v) => `
        <div style="padding:var(--sp-md);background:var(--bg2);border-left:2px solid var(--green);margin-bottom:var(--sp-sm);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:14px;font-weight:600;color:var(--text)">${v.team_name}</div>
              <div style="font-size:12px;color:var(--text2)">${v.league} · Verified ${v.reviewed_at ? HF_UTILS.timeAgo(v.reviewed_at) : "-"}</div>
            </div>
            ${badgeHTML("Verified", "green")}
          </div>
        </div>`,
        )
        .join(""),
    )}

    ${section(
      "Rejected",
      rejected.length,
      "var(--red)",
      rejected
        .map(
          (v) => `
        <div style="padding:var(--sp-md);background:var(--bg2);border-left:2px solid var(--red);margin-bottom:var(--sp-sm);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:14px;font-weight:600;color:var(--text)">${v.team_name}</div>
              <div style="font-size:11px;color:var(--red)">Reason: ${v.rejection_reason || "-"}</div>
              <div style="font-size:11px;color:var(--text3)">${HF_UTILS.timeAgo(v.submitted_at)}</div>
            </div>
            ${badgeHTML("Rejected", "red")}
          </div>
        </div>`,
        )
        .join(""),
    )}
  `);
  };

  const agencyVerifications = async (s) => {
    const { data: allAgencyVerifications } =
      await HF_DB.getAllAgencyVerifications();
    const pending =
      allAgencyVerifications?.filter((v) => v.status === "pending") || [];
    const verified =
      allAgencyVerifications?.filter((v) => v.status === "verified") || [];
    const rejected =
      allAgencyVerifications?.filter((v) => v.status === "rejected") || [];

    const section = (title, count, color, content, startOpen = false) => `
    <div class="card">
      <div class="card-title" style="cursor:pointer;justify-content:space-between;"
        onclick="const c=this.nextElementSibling;c.style.display=c.style.display==='none'?'block':'none';this.querySelector('i').className='ti '+(c.style.display==='none'?'ti-chevron-down':'ti-chevron-up');">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">
          <div class="card-dot"></div>${title}
          <span style="color:${color};margin-left:4px">${count}</span>
        </div>
        <i class="ti ${startOpen ? "ti-chevron-up" : "ti-chevron-down"}" style="font-size:14px;color:var(--text3)"></i>
      </div>
      <div style="display:${startOpen ? "block" : "none"}">
        ${count === 0 ? `<div style="text-align:center;padding:24px;color:var(--text2);font-size:13px">Nothing here yet.</div>` : content}
      </div>
    </div>`;

    setMain(`
    <div style="font-family:var(--font-head);font-size:16px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:var(--text);margin-bottom:var(--sp-lg);">
      Agency Verifications
    </div>

    ${section(
      "Pending",
      pending.length,
      "var(--gold)",
      pending.map((v) => _agencyVerificationRow(v)).join(""),
      true,
    )}

    ${section(
      "Verified",
      verified.length,
      "var(--green)",
      verified
        .map(
          (v) => `
        <div style="padding:var(--sp-md);background:var(--bg2);border-left:2px solid var(--green);margin-bottom:var(--sp-sm);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:14px;font-weight:600;color:var(--text)">${v.agency_name}</div>
              <div style="font-size:12px;color:var(--text2)">
                Regions: ${Array.isArray(v.regions_covered) ? v.regions_covered.join(", ") : v.region || "-"}
              </div>
              <div style="font-size:11px;color:var(--text2)">Verified ${v.reviewed_at ? HF_UTILS.timeAgo(v.reviewed_at) : "-"}</div>
            </div>
            ${badgeHTML("Verified", "green")}
          </div>
        </div>`,
        )
        .join(""),
    )}

    ${section(
      "Rejected",
      rejected.length,
      "var(--red)",
      rejected
        .map(
          (v) => `
        <div style="padding:var(--sp-md);background:var(--bg2);border-left:2px solid var(--red);margin-bottom:var(--sp-sm);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:14px;font-weight:600;color:var(--text)">${v.agency_name}</div>
              <div style="font-size:11px;color:var(--red)">Reason: ${v.rejection_reason || "-"}</div>
              <div style="font-size:11px;color:var(--text3)">${HF_UTILS.timeAgo(v.submitted_at)}</div>
            </div>
            ${badgeHTML("Rejected", "red")}
          </div>
        </div>`,
        )
        .join(""),
    )}
  `);
  };

  // ── USERS ──────────────────────────────────────────────────
  const users = async (s) => {
    const { data: allUsers } = await HF_DB.getAllUsers();

    const players = allUsers?.filter((u) => u.role === "player") || [];
    const coaches = allUsers?.filter((u) => u.role === "coach") || [];
    const scouts = allUsers?.filter((u) => u.role === "scout") || [];

    const userRow = (u) => {
      const safeName = u.name.replace(/'/g, "\\'");
      return `
        <div style="display:flex;align-items:center;gap:var(--sp-md);padding:var(--sp-md);background:var(--bg2);margin-bottom:var(--sp-sm);border-left:2px solid ${u.banned ? "var(--red)" : "var(--border)"};">
        <div class="avatar avatar-sm" style="background:${u.role === "player" ? "var(--green)" : u.role === "coach" ? "var(--gold)" : "var(--blue)"}">
            ${HF_UTILS.initials(u.name)}
        </div>
        <div style="flex:1">
            <div style="font-size:13px;font-weight:600;color:var(--text)">${u.name}</div>
            <div style="font-size:11px;color:var(--text2)">${u.contact} · ${u.role}</div>
            ${u.banned ? `<div style="font-size:11px;color:var(--red);margin-top:2px">Banned: ${u.ban_reason || "-"}</div>` : ""}
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
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
        </div>
        </div>`;
    };

    setMain(`
      <div class="metrics-grid" style="grid-template-columns:repeat(3,1fr)">
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
      </div>

      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Players <span style="color:var(--green);margin-left:6px">${players.length}</span></div>
        ${players.length === 0 ? '<div style="padding:16px;color:var(--text2);font-size:13px">No players yet.</div>' : players.map(userRow).join("")}
      </div>

      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Coaches <span style="color:var(--gold);margin-left:6px">${coaches.length}</span></div>
        ${coaches.length === 0 ? '<div style="padding:16px;color:var(--text2);font-size:13px">No coaches yet.</div>' : coaches.map(userRow).join("")}
      </div>

      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Scouts <span style="color:var(--blue);margin-left:6px">${scouts.length}</span></div>
        ${scouts.length === 0 ? '<div style="padding:16px;color:var(--text2);font-size:13px">No scouts yet.</div>' : scouts.map(userRow).join("")}
      </div>`);
  };

  // ── MESSAGES ───────────────────────────────────────────────
  const messages = async (s) => {
    const { data: msgs } = await HF_DB.getMessages(s.userId);
    const { data: archived } = await HF_DB.getArchivedMessages(s.userId);

    // enrich messages with sender names
    const enriched = await Promise.all(
      (msgs || []).map(async (m) => ({
        ...m,
        senderName: await HF_DB.getUserNameById(m.from_id),
      })),
    );

    const enrichedArchived = await Promise.all(
      (archived || []).map(async (m) => ({
        ...m,
        senderName: await HF_DB.getUserNameById(m.from_id),
      })),
    );

    setMain(`
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Messages</div>
      ${
        !msgs || msgs.length === 0
          ? `
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <i class="ti ti-message" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No messages yet</div>
          <div style="font-size:13px">Admin messages will appear here.</div>
        </div>`
          : HF_UTILS.messageListHTML(msgs, "admin")
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
                <div class="msg-item">
                    <div class="avatar avatar-md" style="background:#0f0f0d;display:flex;align-items:center;justify-content:center;">
                    <i class="ti ti-shield" style="font-size:16px;color:var(--text3)"></i>
                    </div>
                    <div style="flex:1;opacity:0.6">
                    <div style="font-size:11px;font-family:var(--font-head);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--text3);margin-bottom:2px;">
                        From: ${m.senderName || "HappyFeet Admin"}
                    </div>
                    <div class="msg-name">${m.subject || "Message"}</div>
                    <div class="msg-preview">${m.body}</div>
                    <div class="msg-time">${HF_UTILS.timeAgo(m.created_at)}</div>
                    </div>
                </div>`,
            )
            .join("")}
        </div>
      </div>`
        : ""
    }`);
  };

  // ── VERIFICATION ROW HELPER ────────────────────────────────
  const _verificationRow = (v) => `
    <div style="padding:var(--sp-md);background:var(--bg2);border-left:2px solid var(--gold);margin-bottom:var(--sp-sm);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <div>
            <div style="font-size:14px;font-weight:600;color:var(--text)">${v.team_name}</div>
            <div style="font-size:12px;color:var(--text2);margin-top:2px">
            ${v.league} · ${v.home_ground || "-"} · Founded ${v.founding_year || "-"}
            </div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px">
            Submitted ${new Date(v.submitted_at).toLocaleDateString()}
            </div>
        </div>
        ${badgeHTML("Pending", "gold")}
        </div>

        <div id="edit-form-${v.id}" style="display:none;margin-bottom:12px;padding:12px;background:var(--bg);border:0.5px solid var(--border);">
        <div style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text2);margin-bottom:8px;">
            Edit verification details
        </div>
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
            <input type="text" id="edit-notes-${v.id}" placeholder="e.g. Team name corrected to match league records" style="padding:8px 12px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:13px;width:100%;outline:none;font-family:var(--font);">
        </div>
        <div style="display:flex;gap:8px;margin-top:8px;">
            <button class="btn btn-primary btn-sm" onclick="HF_ADMIN.saveEdits('${v.id}', '${v.coach_id}', '${v.team_name}')">
            <i class="ti ti-circle-check"></i> Save & notify coach
            </button>
            <button class="btn btn-outline btn-sm" onclick="HF_ADMIN.toggleEditForm('${v.id}')">
            Cancel
            </button>
        </div>
        </div>

        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" onclick="HF_ADMIN.approveSquad('${v.id}','${v.coach_id}','${v.team_name}')">
            <i class="ti ti-circle-check"></i> Approve
        </button>
        <button class="btn btn-outline btn-sm" onclick="HF_ADMIN.toggleEditForm('${v.id}')">
            <i class="ti ti-edit"></i> Edit
        </button>
        <button class="btn btn-danger btn-sm" onclick="HF_ADMIN.rejectSquad('${v.id}','${v.coach_id}','${v.team_name}')">
            <i class="ti ti-x"></i> Reject
        </button>
        </div>
    </div>`;

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
    const existing = document.getElementById("admin-verification-alert");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "admin-verification-alert";
    overlay.className = "verification-alert-overlay";
    overlay.innerHTML = `
    <div class="verification-alert-card">
      <i class="ti ti-clipboard-check" style="font-size:36px;color:var(--gold);margin-bottom:var(--sp-lg);display:block;"></i>
      <div style="font-family:var(--font-head);font-size:18px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:var(--text);margin-bottom:var(--sp-sm);">
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

  const archiveMessage = async (messageId) => {
    await HF_DB.archiveMessage(messageId);
    HF_UTILS.toast("Message archived.", "success");
    messages(HF_DB.getSession());
  };

  const readMessage = async (messageId, el) => {
    const badge = document.getElementById(`badge-${messageId}`);
    if (badge) badge.remove();

    await HF_DB.markMessageRead(messageId);

    const session = HF_DB.getSession();
    const { data: msgs } = await HF_DB.getMessages(session.userId);
    const unreadCount = msgs?.filter((m) => !m.read).length || 0;
    HF_ROUTER.refreshSidenavBadge("messages", unreadCount, "var(--red)");

    messages(session);
  };

  return {
    render,
    approveSquad,
    rejectSquad,
    approveAgency,
    rejectAgency,
    kickUser,
    banUser,
    unbanUser,
    removeUser,
    toggleEditForm,
    saveEdits,
    showPendingAlert,
    readMessage,
    archiveMessage,
  };
})();

window.HF_ADMIN = HF_ADMIN;
