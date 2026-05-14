const HF_ADMIN = (() => {
  const { toast, initials, badgeHTML } = HF_UTILS;

  const setMain = (html) => {
    const mc = document.getElementById("main-content");
    if (mc) mc.innerHTML = html;
  };

  const render = async (view, session) => {
    const views = { dashboard, verifications, users, messages };
    const fn = views[view] || dashboard;
    fn(session);
  };

  // ── DASHBOARD ──────────────────────────────────────────────
  const dashboard = async (s) => {
    const { data: pending } = await HF_DB.getPendingVerifications();
    const { data: allVerifications } = await HF_DB.getAllVerifications();
    const { data: allUsers } = await HF_DB.getAllUsers();

    const pendingCount = pending?.length || 0;
    const verifiedCount =
      allVerifications?.filter((v) => v.status === "verified").length || 0;
    const totalUsers = allUsers?.length || 0;

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
            <div class="metric-val" style="color:var(--green)">${verifiedCount}</div>
            <div class="metric-label">Verified squads</div>
            <div class="metric-sub" style="color:var(--text2)">Total approved</div>
        </div>
        <div class="metric-card">
            <div class="metric-val" style="color:var(--blue)">${totalUsers}</div>
            <div class="metric-label">Total users</div>
            <div class="metric-sub" style="color:var(--text2)">All roles</div>
        </div>
        <div class="metric-card">
            <div class="metric-val" style="color:var(--red)">${allVerifications?.filter((v) => v.status === "rejected").length || 0}</div>
            <div class="metric-label">Rejected</div>
            <div class="metric-sub" style="color:var(--text2)">Total rejected</div>
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
          ${pending.map((v) => _verificationRow(v)).join("")}`
        }
      </div>`);
  };

  // ── VERIFICATIONS ──────────────────────────────────────────
  const verifications = async (s) => {
    const { data: allVerifications } = await HF_DB.getAllVerifications();
    const pending =
      allVerifications?.filter((v) => v.status === "pending") || [];
    const verified =
      allVerifications?.filter((v) => v.status === "verified") || [];
    const rejected =
      allVerifications?.filter((v) => v.status === "rejected") || [];

    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Pending <span style="color:var(--gold);margin-left:6px">${pending.length}</span></div>
        ${
          pending.length === 0
            ? `
          <div style="text-align:center;padding:24px;color:var(--text2);font-size:13px">No pending verifications.</div>`
            : pending.map((v) => _verificationRow(v)).join("")
        }
      </div>

      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Verified <span style="color:var(--green);margin-left:6px">${verified.length}</span></div>
        ${
          verified.length === 0
            ? `
          <div style="text-align:center;padding:24px;color:var(--text2);font-size:13px">No verified squads yet.</div>`
            : verified
                .map(
                  (v) => `
            <div style="padding:var(--sp-md);background:var(--bg2);border-left:2px solid var(--green);margin-bottom:var(--sp-sm);">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div style="font-size:14px;font-weight:600;color:var(--text)">${v.team_name}</div>
                  <div style="font-size:12px;color:var(--text2);margin-top:2px">${v.league} · ${v.home_ground || "-"} · Founded ${v.founding_year || "-"}</div>
                  <div style="font-size:11px;color:var(--text3);margin-top:2px">
                    Submitted ${new Date(v.submitted_at).toLocaleDateString()} · 
                    Verified ${v.reviewed_at ? new Date(v.reviewed_at).toLocaleDateString() : "-"}
                  </div>
                </div>
                ${badgeHTML("Verified", "green")}
              </div>
            </div>`,
                )
                .join("")
        }
      </div>

      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Rejected <span style="color:var(--red);margin-left:6px">${rejected.length}</span></div>
        ${
          rejected.length === 0
            ? `
          <div style="text-align:center;padding:24px;color:var(--text2);font-size:13px">No rejected verifications.</div>`
            : rejected
                .map(
                  (v) => `
            <div style="padding:var(--sp-md);background:var(--bg2);border-left:2px solid var(--red);margin-bottom:var(--sp-sm);">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div style="font-size:14px;font-weight:600;color:var(--text)">${v.team_name}</div>
                  <div style="font-size:12px;color:var(--text2);margin-top:2px">${v.league} · ${v.home_ground || "-"}</div>
                  <div style="font-size:11px;color:var(--red);margin-top:2px">Reason: ${v.rejection_reason || "-"}</div>
                  <div style="font-size:11px;color:var(--text3);margin-top:2px">
                    Submitted ${new Date(v.submitted_at).toLocaleDateString()} · 
                    Rejected ${v.reviewed_at ? new Date(v.reviewed_at).toLocaleDateString() : "-"}
                  </div>
                </div>
                ${badgeHTML("Rejected", "red")}
              </div>
            </div>`,
                )
                .join("")
        }
      </div>`);
  };

  // ── USERS ──────────────────────────────────────────────────
  const users = async (s) => {
    const { data: allUsers } = await HF_DB.getAllUsers();

    const players = allUsers?.filter((u) => u.role === "player") || [];
    const coaches = allUsers?.filter((u) => u.role === "coach") || [];
    const scouts = allUsers?.filter((u) => u.role === "scout") || [];

    const userRow = (u) => `
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
            <button class="btn btn-outline btn-sm" onclick="HF_ADMIN.kickUser('${u.id}', '${u.name}')">
              <i class="ti ti-logout"></i> Kick
            </button>
            <button class="btn btn-danger btn-sm" onclick="HF_ADMIN.banUser('${u.id}', '${u.name}')">
              <i class="ti ti-ban"></i> Ban
            </button>`
          }
          <button class="btn btn-danger btn-sm" onclick="HF_ADMIN.removeUser('${u.id}', '${u.name}')">
            <i class="ti ti-trash"></i> Remove
          </button>
        </div>
      </div>`;

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
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Admin messages</div>
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <i class="ti ti-message" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No messages yet</div>
          <div style="font-size:13px">Admin messaging coming soon.</div>
        </div>
      </div>`);
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
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn btn-primary btn-sm" onclick="HF_ADMIN.approveSquad('${v.id}','${v.coach_id}','${v.team_name}')">
          <i class="ti ti-circle-check"></i> Approve
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
    toast(`${teamName} has been verified!`, "success");
    dashboard(HF_DB.getSession());
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
    toast(`${teamName} has been rejected.`, "success");
    dashboard(HF_DB.getSession());
  };

  return {
    render,
    approveSquad,
    rejectSquad,
    kickUser,
    banUser,
    unbanUser,
    removeUser,
  };
})();

window.HF_ADMIN = HF_ADMIN;
