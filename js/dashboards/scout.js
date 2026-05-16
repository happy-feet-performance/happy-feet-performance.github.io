const HF_SCOUT = (() => {
  const {
    badgeHTML,
    activityHTML,
    avatarHTML,
    toast,
    initials,
    avatarColor,
    ratingColor,
  } = HF_UTILS;

  const setMain = (html) => {
    const mc = document.getElementById("main-content");
    if (mc) mc.innerHTML = html;
  };

  const render = (view, session) => {
    const views = {
      dashboard,
      profile,
      discover,
      prospects,
      pipeline,
      reports,
      clubs,
      placements,
      messages,
      findmyteam,
    };
    const fn = views[view] || dashboard;
    fn(session);
  };

  // ── DASHBOARD ──────────────────────────────────────────────
  const dashboard = async (s) => {
    const p = s.profile || {};
    const agencyStatus = s.agencyStatus || "unregistered";
    const isVerified = agencyStatus === "verified";
    const isPending = agencyStatus === "pending";
    const isUnregistered = agencyStatus === "unregistered";
    const isRejected = agencyStatus === "rejected";
    const newUser = HF_UTILS.isNewUser(s);

    // fetch real counts if verified
    let trackedCount = 0,
      eliteCount = 0,
      sharedCount = 0,
      placedCount = 0;
    if (isVerified) {
      const { data: prospects } = await HF_DB.getScoutProspects(s.userId);
      trackedCount = prospects?.length || 0;
      eliteCount = prospects?.filter((p) => p.flagged).length || 0;
      sharedCount = prospects?.filter((p) => p.report_shared).length || 0;
      placedCount = prospects?.filter((p) => p.placed).length || 0;
    }

    // build regions and leagues display
    const regionsDisplay = Array.isArray(p.regionsCovered)
      ? p.regionsCovered.join(", ")
      : p.region || "-";
    const leaguesDisplay = Array.isArray(p.targetLeagues)
      ? p.targetLeagues.join(", ")
      : p.dest || "-";

    const agencyStatusBadge = isVerified
      ? `<span style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;background:rgba(26,122,46,.15);color:var(--green);">Verified</span>`
      : isPending
        ? `<span style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;background:rgba(196,154,10,.15);color:var(--gold);">Pending</span>`
        : isRejected
          ? `<span style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;background:rgba(200,16,46,.15);color:var(--red);">Rejected</span>`
          : `<span style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;background:var(--bg3);color:var(--text2);">Unregistered</span>`;

    setMain(`
      <div style="background:#0f0f0d;padding:var(--sp-2xl);margin-bottom:var(--sp-lg);display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-lg);">
        <div>
          <div style="font-family:var(--font-head);font-size:22px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">
            ${newUser ? "Welcome" : "Welcome back"}, Scout ${s.name.split(" ").pop()}!
          </div>
          <div style="font-size:13px;color:rgba(255,255,255,.55);margin-top:3px;">${p.org || "-"}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.4);margin-top:2px;">Regions: ${regionsDisplay}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.4);margin-top:2px;">Targets: ${leaguesDisplay}</div>
          <div style="margin-top:8px;display:flex;align-items:center;gap:8px;">
            ${badgeHTML("Scout", "blue")}
            ${agencyStatusBadge}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-family:var(--font-head);font-size:42px;font-weight:700;color:var(--gold);">${isVerified ? trackedCount : "-"}</div>
          <div style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,.4);">Prospects tracked</div>
        </div>
      </div>

      ${HF_SCRIPTURE.stripHTML()}

      ${
        isUnregistered || isPending || isRejected
          ? `
        <div style="padding:var(--sp-lg);background:${isRejected ? "rgba(200,16,46,.06)" : "rgba(196,154,10,.06)"};border-left:3px solid ${isRejected ? "var(--red)" : "var(--gold)"};margin-bottom:var(--sp-lg);">
          <div style="font-family:var(--font-head);font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${isRejected ? "var(--red)" : "var(--gold)"};margin-bottom:6px;">
            ${isRejected ? "Agency verification rejected" : isPending ? "Agency verification pending" : "Agency not registered"}
          </div>
          <div style="font-size:13px;color:var(--text2);margin-bottom:12px;">
            ${
              isRejected
                ? "Your agency verification was rejected. Please review the reason in your messages and resubmit."
                : isPending
                  ? "Your agency is awaiting admin approval. Full scouting features will unlock once verified."
                  : "Register and verify your agency to unlock full scouting features."
            }
          </div>
          ${
            isUnregistered || isRejected
              ? `
            <button class="btn btn-primary btn-sm" onclick="HF_SCOUT.resubmitAgency()">
              <i class="ti ti-clipboard-check"></i> ${isRejected ? "Resubmit agency" : "Register your agency"}
            </button>`
              : ""
          }
          ${
            isRejected
              ? `
            <button class="btn btn-outline btn-sm" style="margin-left:8px" onclick="HF_ROUTER.navTo('messages')">
              <i class="ti ti-message"></i> View messages
            </button>`
              : ""
          }
        </div>`
          : ""
      }

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-val" style="color:var(--gold)">${isVerified ? trackedCount : "-"}</div>
          <div class="metric-label">Tracked</div>
          <div class="metric-sub" style="color:var(--text2)">${isVerified ? "Active prospects" : "Verify agency to unlock"}</div>
        </div>
        <div class="metric-card">
          <div class="metric-val" style="color:var(--red)">${isVerified ? eliteCount : "-"}</div>
          <div class="metric-label">Elite prospects</div>
          <div class="metric-sub" style="color:var(--text2)">${isVerified ? "Flagged" : "Verify agency to unlock"}</div>
        </div>
        <div class="metric-card">
          <div class="metric-val" style="color:var(--green)">${isVerified ? sharedCount : "-"}</div>
          <div class="metric-label">Reports shared</div>
          <div class="metric-sub" style="color:var(--text2)">${isVerified ? "Sent to clubs" : "Verify agency to unlock"}</div>
        </div>
        <div class="metric-card">
          <div class="metric-val" style="color:var(--purple)">${isVerified ? placedCount : "-"}</div>
          <div class="metric-label">Placed</div>
          <div class="metric-sub" style="color:var(--text2)">${isVerified ? "Total placements" : "Verify agency to unlock"}</div>
        </div>
      </div>

      <div class="quick-actions">
        <button class="quick-action" onclick="${isVerified ? "HF_ROUTER.navTo('discover')" : "HF_UTILS.toast('Verify your agency first.','error')"}">
          <div class="quick-action-icon"><i class="ti ti-search"></i></div>
          <div class="quick-action-label">Discover talent</div>
          <div class="quick-action-sub">${isVerified ? "Search players" : "Agency not verified"}</div>
        </button>
        <button class="quick-action" onclick="${isVerified ? "HF_ROUTER.navTo('prospects')" : "HF_UTILS.toast('Verify your agency first.','error')"}">
          <div class="quick-action-icon"><i class="ti ti-star"></i></div>
          <div class="quick-action-label">Saved prospects</div>
          <div class="quick-action-sub">${isVerified ? trackedCount + " being tracked" : "Agency not verified"}</div>
        </button>
        <button class="quick-action" onclick="${isVerified ? "HF_ROUTER.navTo('pipeline')" : "HF_UTILS.toast('Verify your agency first.','error')"}">
          <div class="quick-action-icon"><i class="ti ti-trending-up"></i></div>
          <div class="quick-action-label">Pipeline</div>
          <div class="quick-action-sub">${isVerified ? "Track progress" : "Agency not verified"}</div>
        </button>
      </div>

      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Recent scouting activity</div>
        ${
          !isVerified
            ? `
          <div style="text-align:center;padding:32px;color:var(--text2)">
            <i class="ti ti-lock" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">Locked until agency is verified</div>
            <div style="font-size:13px">Scouting activity will appear here once your agency is verified.</div>
          </div>`
            : trackedCount === 0
              ? `
          <div style="text-align:center;padding:32px;color:var(--text2)">
            <i class="ti ti-activity" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No activity yet</div>
            <div style="font-size:13px">Start discovering and saving players to see activity here.</div>
          </div>`
              : `
          <div style="font-size:13px;color:var(--text2);padding:var(--sp-md)">
            ${trackedCount} prospect${trackedCount > 1 ? "s" : ""} tracked · ${eliteCount} flagged · ${sharedCount} report${sharedCount > 1 ? "s" : ""} shared
          </div>`
        }
      </div>`);

    if (newUser) setTimeout(() => HF_UTILS.launchConfetti(), 300);
  };

  // ── PROFILE ────────────────────────────────────────────────
  const profile = (s) => {
    const p = s.profile || {};
    const regionsDisplay = Array.isArray(p.regionsCovered)
      ? p.regionsCovered.join(", ")
      : p.region || "-";
    const leaguesDisplay = Array.isArray(p.targetLeagues)
      ? p.targetLeagues.join(", ")
      : p.dest || "-";

    setMain(`
      <div style="background:#0f0f0d;padding:var(--sp-2xl);margin-bottom:var(--sp-lg);display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-lg);">
        <div style="display:flex;align-items:center;gap:var(--sp-lg);">
          <div style="width:72px;height:72px;background:#185FA5;display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:26px;font-weight:700;color:#fff;">
            ${HF_UTILS.initials(s.name)}
          </div>
          <div>
            <div style="font-family:var(--font-head);font-size:22px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">${s.name}</div>
            <div style="font-size:13px;color:rgba(255,255,255,.55);margin-top:3px;">${p.org || "-"}</div>
            <div style="margin-top:8px;">${badgeHTML("Scout", "blue")}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title" style="justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:var(--sp-sm);">
            <div class="card-dot"></div>Scout details
          </div>
          <button class="btn btn-outline btn-sm" onclick="HF_SCOUT.editProfile()">
            <i class="ti ti-edit"></i> Edit
          </button>
        </div>
        <div class="info-grid">
          <div class="info-cell"><div class="info-label">Organisation</div><div class="info-val">${p.org || "-"}</div></div>
          <div class="info-cell"><div class="info-label">Experience</div><div class="info-val">${p.exp || "-"} years</div></div>
          <div class="info-cell"><div class="info-label">Regions covered</div><div class="info-val">${regionsDisplay}</div></div>
          <div class="info-cell"><div class="info-label">Target destinations</div><div class="info-val">${leaguesDisplay}</div></div>
          <div class="info-cell"><div class="info-label">${s.contactType === "phone" ? "Phone" : "Email"}</div><div class="info-val">${s.displayContact || s.contact}</div></div>
          <div class="info-cell"><div class="info-label">Agency status</div>
            <div class="info-val" style="color:${s.agencyStatus === "verified" ? "var(--green)" : "var(--text2)"}">
              ${s.agencyStatus === "verified" ? "Verified" : s.agencyStatus || "Unregistered"}
            </div>
          </div>
        </div>
      </div>`);
  };

  // ── DISCOVER ───────────────────────────────────────────────
  const discover = async (s) => {
    const { data: players } = await HF_DB.getAllPlayers();
    const { data: savedProspects } = await HF_DB.getScoutProspects(s.userId);
    const savedIds = new Set(savedProspects?.map((p) => p.player_id) || []);

    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Discover talent</div>
        <div style="display:flex;gap:8px;margin-bottom:var(--sp-lg);flex-wrap:wrap;">
          <select id="filter-pos" onchange="HF_SCOUT.filterPlayers()" style="padding:7px 10px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:12px;font-family:var(--font);outline:none;">
            <option value="">All positions</option>
            <option>GK</option><option>CB</option><option>LB</option><option>RB</option>
            <option>DM</option><option>CM</option><option>CAM</option>
            <option>LW</option><option>RW</option><option>ST</option>
          </select>
          <select id="filter-tier" onchange="HF_SCOUT.filterPlayers()" style="padding:7px 10px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:12px;font-family:var(--font);outline:none;">
            <option value="">All tiers</option>
            <option>U10</option><option>U12</option><option>U14</option><option>U16</option>
            <option>U18</option><option>U21</option><option>Professional</option>
          </select>
          <input type="text" id="filter-search" placeholder="Search by name..."
            oninput="HF_SCOUT.filterPlayers()"
            style="flex:1;min-width:120px;padding:7px 10px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:12px;font-family:var(--font);outline:none;">
        </div>

        <div id="players-list">
          ${
            !players || players.length === 0
              ? `
            <div style="text-align:center;padding:32px;color:var(--text2)">
              <i class="ti ti-users" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
              <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No players yet</div>
              <div style="font-size:13px">Players will appear here as they register on HappyFeet.</div>
            </div>`
              : players
                  .map((p) => _playerRow(p, savedIds.has(p.id), s.userId))
                  .join("")
          }
        </div>
      </div>`);

    // store players for filtering
    window._scoutAllPlayers = players;
    window._scoutSavedIds = savedIds;
    window._scoutUserId = s.userId;
  };

  const _playerRow = (p, isSaved, scoutId) => {
    const prof = p.profile || {};
    const overall = prof.ratings
      ? Math.round(
          (prof.ratings.speed +
            prof.ratings.tech +
            prof.ratings.tact +
            prof.ratings.phys) /
            4,
        )
      : null;

    return `
    <div class="prospect-row" onclick="HF_SCOUT.togglePlayerActions('${p.id}')" style="cursor:pointer;">
      <div class="avatar avatar-md" style="background:var(--green)">${HF_UTILS.initials(p.name)}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600;color:var(--text)">${p.name}</div>
        <div style="font-size:11px;color:var(--text2)">${prof.pos || "-"} · ${prof.tier || "-"} · ${prof.hometown || "-"}</div>
        <div style="font-size:11px;color:${prof.status === "unattached" || !prof.club ? "var(--green)" : "var(--text3)"}">
          ${prof.status === "unattached" || !prof.club ? "Unattached" : prof.club}
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        ${overall !== null ? `<div style="font-size:16px;font-weight:700;color:var(--gold)">${overall}%</div>` : '<div style="font-size:13px;color:var(--text3)">Unrated</div>'}
        ${isSaved ? `<span style="font-family:var(--font-head);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:2px 6px;background:rgba(26,122,46,.15);color:var(--green);">Saved</span>` : ""}
      </div>
    </div>
    <div id="player-actions-${p.id}" style="display:none;padding:var(--sp-md);background:var(--bg2);border-left:2px solid var(--gold);margin-bottom:var(--sp-sm);">
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${
          !isSaved
            ? `
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();HF_SCOUT.savePlayer('${p.id}', '${p.name.replace(/'/g, "\\'")}')">
            <i class="ti ti-star"></i> Save prospect
          </button>`
            : ""
        }
        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();HF_SCOUT.viewPlayerProfile('${p.id}')">
          <i class="ti ti-user"></i> View profile
        </button>
        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();HF_SCOUT.messagePlayer('${p.id}', '${p.name.replace(/'/g, "\\'")}')">
          <i class="ti ti-message"></i> Message
        </button>
      </div>
    </div>`;
  };

  const filterPlayers = () => {
    const pos = document.getElementById("filter-pos")?.value;
    const tier = document.getElementById("filter-tier")?.value;
    const search = document
      .getElementById("filter-search")
      ?.value.toLowerCase();
    const list = document.getElementById("players-list");
    if (!list || !window._scoutAllPlayers) return;

    const filtered = window._scoutAllPlayers.filter((p) => {
      const prof = p.profile || {};
      const matchPos = !pos || prof.pos === pos;
      const matchTier = !tier || prof.tier === tier;
      const matchSearch = !search || p.name.toLowerCase().includes(search);
      return matchPos && matchTier && matchSearch;
    });

    list.innerHTML =
      filtered.length === 0
        ? `<div style="text-align:center;padding:24px;color:var(--text2);font-size:13px">No players match your filters.</div>`
        : filtered
            .map((p) =>
              _playerRow(
                p,
                window._scoutSavedIds?.has(p.id),
                window._scoutUserId,
              ),
            )
            .join("");
  };

  const savePlayer = async (playerId, playerName) => {
    const session = HF_DB.getSession();
    const result = await HF_DB.saveProspect(session.userId, playerId);
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    toast(`${playerName} saved as prospect!`, "success");
    discover(session);
  };

  const viewPlayerProfile = async (playerId) => {
    const { data: player } = await HF_DB.getUserById(playerId);
    if (!player) {
      toast("Player not found.", "error");
      return;
    }
    const p = player.profile || {};
    const overall = p.ratings
      ? Math.round(
          (p.ratings.speed + p.ratings.tech + p.ratings.tact + p.ratings.phys) /
            4,
        )
      : null;

    setMain(`
      <div style="background:#0f0f0d;padding:var(--sp-2xl);margin-bottom:var(--sp-lg);display:flex;align-items:flex-start;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:var(--sp-lg);">
          <div style="width:72px;height:72px;background:var(--green);display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:26px;font-weight:700;color:#fff;">
            ${HF_UTILS.initials(player.name)}
          </div>
          <div>
            <div style="font-family:var(--font-head);font-size:22px;font-weight:700;color:#fff;">${player.name}</div>
            <div style="font-size:13px;color:rgba(255,255,255,.55)">${p.pos || "-"} · ${p.tier || "-"} · ${p.hometown || "-"}</div>
            <div style="margin-top:8px">${badgeHTML("Player", "green")}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:var(--font-head);font-size:42px;font-weight:700;color:${overall ? "var(--gold)" : "var(--text3)"}">
            ${overall !== null ? overall + "%" : "-"}
          </div>
          <div style="font-size:10px;color:rgba(255,255,255,.4);font-family:var(--font-head);text-transform:uppercase;letter-spacing:0.1em">
            ${overall !== null ? "Overall rating" : "Unrated"}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Player details</div>
        <div class="info-grid">
          <div class="info-cell"><div class="info-label">Position</div><div class="info-val">${p.pos || "-"}</div></div>
          <div class="info-cell"><div class="info-label">Age tier</div><div class="info-val">${p.tier || "-"}</div></div>
          <div class="info-cell"><div class="info-label">Hometown</div><div class="info-val">${p.hometown || "-"}</div></div>
          <div class="info-cell"><div class="info-label">Club status</div>
            <div class="info-val" style="color:${!p.club ? "var(--green)" : "var(--text)"}">
              ${p.club || "Unattached"}
            </div>
          </div>
        </div>
      </div>

      ${
        p.ratings
          ? `
        <div class="card">
          <div class="card-title"><div class="card-dot"></div>Ability ratings</div>
          ${HF_UTILS.barHTML("Speed", p.ratings.speed || 0, "#c8102e")}
          ${HF_UTILS.barHTML("Technical", p.ratings.tech || 0, "var(--gold)")}
          ${HF_UTILS.barHTML("Tactical", p.ratings.tact || 0, "var(--blue)")}
          ${HF_UTILS.barHTML("Physical", p.ratings.phys || 0, "var(--green)")}
        </div>`
          : ""
      }

      <button class="btn btn-outline" onclick="HF_ROUTER.navTo('discover')" style="margin-top:8px">
        <i class="ti ti-arrow-left"></i> Back to discover
      </button>`);
  };

  const messagePlayer = async (playerId, playerName) => {
    const session = HF_DB.getSession();
    const safeName = playerName.replace(/'/g, "\\'");
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Message ${playerName}</div>
        <div class="fg">
          <label class="required">Subject</label>
          <input type="text" id="msg-subject" placeholder="e.g. Scouting opportunity"
            style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
        </div>
        <div class="fg">
          <label class="required">Message</label>
          <textarea id="msg-body" rows="4" placeholder="Write your message..."
            style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);resize:vertical;"></textarea>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary" onclick="HF_SCOUT.sendMessage('${playerId}', '${safeName}')">
            <i class="ti ti-send"></i> Send message
          </button>
          <button class="btn btn-outline" onclick="HF_ROUTER.navTo('discover')">Cancel</button>
        </div>
      </div>`);
  };

  const sendMessage = async (playerId, playerName) => {
    const session = HF_DB.getSession();
    const subject = document.getElementById("msg-subject")?.value.trim();
    const body = document.getElementById("msg-body")?.value.trim();

    if (!subject) {
      toast("Please enter a subject.", "error");
      return;
    }
    if (!body) {
      toast("Please enter a message.", "error");
      return;
    }

    const { error } = await HF_DB._sendMessage(
      session.userId,
      playerId,
      subject,
      body,
    );
    if (error) {
      toast(error, "error");
      return;
    }

    toast(`Message sent to ${playerName}!`, "success");
    HF_ROUTER.navTo("discover");
  };

  // ── SAVED PROSPECTS ────────────────────────────────────────
  const prospects = async (s) => {
    const { data: saved } = await HF_DB.getScoutProspects(s.userId);

    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Saved prospects</div>
        ${
          !saved || saved.length === 0
            ? `
          <div style="text-align:center;padding:32px;color:var(--text2)">
            <i class="ti ti-star" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No saved prospects yet</div>
            <div style="font-size:13px">Discover and save players to build your prospect list.</div>
            <button class="btn btn-primary btn-sm" style="margin-top:16px" onclick="HF_ROUTER.navTo('discover')">
              <i class="ti ti-search"></i> Discover talent
            </button>
          </div>`
            : saved.map((sp) => _savedProspectRow(sp, s.userId)).join("")
        }
      </div>`);
  };

  const _savedProspectRow = (sp, scoutId) => {
    const p = sp.player?.profile || {};
    const name = sp.player?.name || "Unknown";
    const safeName = name.replace(/'/g, "\\'");
    const overall = p.ratings
      ? Math.round(
          (p.ratings.speed + p.ratings.tech + p.ratings.tact + p.ratings.phys) /
            4,
        )
      : null;

    const statusColor = sp.flagged
      ? "var(--red)"
      : sp.report_shared
        ? "var(--gold)"
        : "var(--blue)";
    const statusLabel = sp.placed
      ? "Placed"
      : sp.trial_arranged
        ? "On trial"
        : sp.report_shared
          ? "Report shared"
          : sp.flagged
            ? "Flagged"
            : "Watching";

    return `
    <div class="prospect-row" onclick="HF_SCOUT.toggleSavedActions('${sp.id}')" style="cursor:pointer;">
      <div class="avatar avatar-md" style="background:${statusColor}">${HF_UTILS.initials(name)}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600;color:var(--text)">${name}</div>
        <div style="font-size:11px;color:var(--text2)">${p.pos || "-"} · ${p.tier || "-"} · ${p.hometown || "-"}</div>
        <div style="font-size:11px;color:${statusColor};margin-top:2px">${statusLabel}</div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        ${overall !== null ? `<div style="font-size:16px;font-weight:700;color:var(--gold)">${overall}%</div>` : '<div style="font-size:13px;color:var(--text3)">Unrated</div>'}
      </div>
    </div>
    <div id="saved-actions-${sp.id}" style="display:none;padding:var(--sp-md);background:var(--bg2);border-left:2px solid var(--gold);margin-bottom:var(--sp-sm);">
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();HF_SCOUT.viewPlayerProfile('${sp.player_id}')">
          <i class="ti ti-user"></i> View profile
        </button>
        ${
          !sp.flagged
            ? `
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();HF_SCOUT.flagProspect('${scoutId}', '${sp.player_id}', '${safeName}')">
            <i class="ti ti-flag"></i> Flag
          </button>`
            : ""
        }
        ${
          !sp.report_shared
            ? `
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();HF_SCOUT.shareReport('${scoutId}', '${sp.player_id}', '${safeName}')">
            <i class="ti ti-file-text"></i> Share report
          </button>`
            : ""
        }
        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();HF_SCOUT.messagePlayer('${sp.player_id}', '${safeName}')">
          <i class="ti ti-message"></i> Message
        </button>
        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();HF_SCOUT.unsavePlayer('${scoutId}', '${sp.player_id}', '${safeName}')">
          <i class="ti ti-trash"></i> Remove
        </button>
      </div>
    </div>`;
  };

  const unsavePlayer = async (scoutId, playerId, name) => {
    if (!confirm(`Remove ${name} from your prospects?`)) return;
    const result = await HF_DB.unsaveProspect(scoutId, playerId);
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    toast(`${name} removed from prospects.`, "success");
    prospects(HF_DB.getSession());
  };

  const flagProspect = async (scoutId, playerId, name) => {
    const result = await HF_DB.updateProspectStatus(scoutId, playerId, {
      flagged: true,
      status: "flagged",
    });
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    toast(`${name} flagged as elite prospect!`, "success");
    prospects(HF_DB.getSession());
  };

  const shareReport = async (scoutId, playerId, name) => {
    const result = await HF_DB.updateProspectStatus(scoutId, playerId, {
      report_shared: true,
      status: "shared",
    });
    if (result.error) {
      toast(result.error, "error");
      return;
    }

    // send message to player
    const session = HF_DB.getSession();
    await HF_DB._sendMessage(
      session.userId,
      playerId,
      "Scouting report shared",
      `A scout from ${session.profile?.org || "HappyFeet Scouting"} has shared your profile with partner clubs.`,
    );

    toast(`Report shared for ${name}!`, "success");
    prospects(HF_DB.getSession());
  };

  // ── PIPELINE ───────────────────────────────────────────────
  const pipeline = async (s) => {
    const { data: saved } = await HF_DB.getScoutProspects(s.userId);

    const stages = [
      {
        key: "watching",
        label: "Watching",
        color: "var(--blue)",
        filter: (p) =>
          !p.flagged && !p.report_shared && !p.trial_arranged && !p.placed,
      },
      {
        key: "flagged",
        label: "Flagged",
        color: "var(--gold)",
        filter: (p) => p.flagged && !p.report_shared,
      },
      {
        key: "report_shared",
        label: "Report shared",
        color: "var(--faith)",
        filter: (p) => p.report_shared && !p.trial_arranged,
      },
      {
        key: "trial",
        label: "Trial arranged",
        color: "var(--red)",
        filter: (p) => p.trial_arranged && !p.placed,
      },
      {
        key: "placed",
        label: "Placed",
        color: "var(--green)",
        filter: (p) => p.placed,
      },
    ];

    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Active pipeline</div>
        ${
          !saved || saved.length === 0
            ? `
          <div style="text-align:center;padding:32px;color:var(--text2)">
            <i class="ti ti-chart-line" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No prospects in pipeline</div>
            <div style="font-size:13px">Save players as prospects to start building your pipeline.</div>
          </div>`
            : stages
                .map((stage) => {
                  const players = saved.filter(stage.filter);
                  return `
              <div style="margin-bottom:var(--sp-lg);">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                  <div style="width:12px;height:12px;background:${stage.color};flex-shrink:0;"></div>
                  <div style="font-family:var(--font-head);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text2);">
                    ${stage.label} (${players.length})
                  </div>
                </div>
                ${
                  players.length === 0
                    ? `
                  <div style="padding:8px 16px;font-size:12px;color:var(--text3);background:var(--bg2);">No players at this stage</div>`
                    : players
                        .map((sp) => {
                          const p = sp.player?.profile || {};
                          const name = sp.player?.name || "Unknown";
                          return `
                      <div style="display:flex;align-items:center;gap:var(--sp-md);padding:10px 12px;background:var(--bg2);border-left:3px solid ${stage.color};margin-bottom:4px;">
                        <div class="avatar avatar-sm" style="background:${stage.color}">${HF_UTILS.initials(name)}</div>
                        <div>
                          <div style="font-size:13px;font-weight:600;color:var(--text)">${name}</div>
                          <div style="font-size:11px;color:var(--text2)">${p.pos || "-"} · ${p.tier || "-"} · ${p.hometown || "-"}</div>
                        </div>
                        ${
                          stage.key === "flagged"
                            ? `
                          <button class="btn btn-outline btn-sm" style="margin-left:auto" onclick="HF_SCOUT.shareReport('${s.userId}', '${sp.player_id}', '${name}')">
                            <i class="ti ti-file-text"></i> Share report
                          </button>`
                            : ""
                        }
                        ${
                          stage.key === "report_shared"
                            ? `
                          <button class="btn btn-outline btn-sm" style="margin-left:auto" onclick="HF_SCOUT.arrangeTrial('${s.userId}', '${sp.player_id}', '${name}')">
                            <i class="ti ti-calendar"></i> Arrange trial
                          </button>`
                            : ""
                        }
                        ${
                          stage.key === "trial"
                            ? `
                          <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="HF_SCOUT.markPlaced('${s.userId}', '${sp.player_id}', '${name}')">
                            <i class="ti ti-circle-check"></i> Mark placed
                          </button>`
                            : ""
                        }
                      </div>`;
                        })
                        .join("")
                }
              </div>`;
                })
                .join("")
        }
      </div>

      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Pipeline stages</div>
        <div style="font-size:12px;color:var(--text2);line-height:2.2">
          1. <strong style="color:var(--text)">Watching</strong>: Added, data collecting.<br>
          2. <strong style="color:var(--text)">Flagged</strong>: Meets threshold. Ready for report.<br>
          3. <strong style="color:var(--text)">Report shared</strong>: Profile sent to partner clubs.<br>
          4. <strong style="color:var(--text)">Trial arranged</strong>: Club interested. Date set.<br>
          5. <strong style="color:var(--text)">Placed</strong>: Signed. Follow up at 3 months.
        </div>
      </div>`);
  };

  const arrangeTrial = async (scoutId, playerId, name) => {
    const result = await HF_DB.updateProspectStatus(scoutId, playerId, {
      trial_arranged: true,
      status: "trial",
    });
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    toast(`Trial arranged for ${name}!`, "success");
    pipeline(HF_DB.getSession());
  };

  const markPlaced = async (scoutId, playerId, name) => {
    const result = await HF_DB.updateProspectStatus(scoutId, playerId, {
      placed: true,
      status: "placed",
    });
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    toast(`${name} marked as placed!`, "success");
    pipeline(HF_DB.getSession());
  };

  // ── REPORTS ────────────────────────────────────────────────
  const reports = async (s) => {
    const { data: saved } = await HF_DB.getScoutProspects(s.userId);
    const shared = saved?.filter((p) => p.report_shared) || [];

    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Scout reports</div>
        ${
          shared.length === 0
            ? `
          <div style="text-align:center;padding:32px;color:var(--text2)">
            <i class="ti ti-file-text" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No reports yet</div>
            <div style="font-size:13px">Share a prospect's report to see it here.</div>
          </div>`
            : shared
                .map((sp) => {
                  const name = sp.player?.name || "Unknown";
                  return `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg2);margin-bottom:8px;border-left:2px solid var(--gold);">
                <div>
                  <div style="font-size:13px;font-weight:600">${name}</div>
                  <div style="font-size:11px;color:var(--text2)">Shared ${HF_UTILS.timeAgo(sp.updated_at)}</div>
                </div>
                ${badgeHTML("Shared", "gold")}
              </div>`;
                })
                .join("")
        }
        <div style="margin-top:12px;font-size:12px;color:var(--text3)">
          <i class="ti ti-info-circle" style="margin-right:4px"></i>
          PDF report generation coming soon.
        </div>
      </div>`);
  };

  // ── CLUBS ──────────────────────────────────────────────────
  const clubs = async (s) => {
    const { data: myClubs } = await HF_DB.getScoutClubs(s.userId);
    const { data: verifiedClubs } = await HF_DB.getVerifiedClubs();

    // filter out clubs already in network
    const myClubNames = new Set(myClubs?.map((c) => c.club_name) || []);
    const available =
      verifiedClubs?.filter((c) => !myClubNames.has(c.team_name)) || [];

    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>My club network</div>
        ${
          !myClubs || myClubs.length === 0
            ? `
          <div style="text-align:center;padding:24px;color:var(--text2);font-size:13px">
            No clubs in your network yet. Add from verified clubs below.
          </div>`
            : myClubs
                .map(
                  (c) => `
            <div style="padding:12px;background:var(--bg2);border-left:2px solid var(--green);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-size:13px;font-weight:600">${c.club_name}</div>
                <div style="font-size:11px;color:var(--text2)">${c.league || "-"}</div>
              </div>
              ${badgeHTML("Verified", "green")}
            </div>`,
                )
                .join("")
        }
      </div>

      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Add from verified clubs</div>
        ${
          available.length === 0
            ? `
          <div style="text-align:center;padding:24px;color:var(--text2);font-size:13px">
            No verified clubs available to add yet.
          </div>`
            : available
                .map(
                  (c) => `
            <div style="padding:12px;background:var(--bg2);border-left:2px solid var(--border);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-size:13px;font-weight:600">${c.team_name}</div>
                <div style="font-size:11px;color:var(--text2)">${c.league || "-"}</div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="HF_SCOUT.addClub('${s.userId}', '${c.coach_id}', '${c.team_name}', '${c.league || ""}')">
                <i class="ti ti-plus"></i> Add
              </button>
            </div>`,
                )
                .join("")
        }
      </div>`);
  };

  const addClub = async (scoutId, coachId, clubName, league) => {
    const result = await HF_DB.addScoutClub(scoutId, coachId, clubName, league);
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    toast(`${clubName} added to your network!`, "success");
    clubs(HF_DB.getSession());
  };

  // ── PLACEMENTS ─────────────────────────────────────────────
  const placements = async (s) => {
    const { data: saved } = await HF_DB.getScoutProspects(s.userId);
    const placed = saved?.filter((p) => p.placed) || [];

    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Placements</div>
        ${
          placed.length === 0
            ? `
          <div style="text-align:center;padding:32px;color:var(--text2)">
            <i class="ti ti-circle-check" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No placements yet</div>
            <div style="font-size:13px">Players you mark as placed will appear here.</div>
          </div>`
            : placed
                .map((sp) => {
                  const name = sp.player?.name || "Unknown";
                  return `
              <div style="padding:12px;background:var(--bg2);border-left:2px solid var(--green);margin-bottom:8px;">
                <div style="font-size:13px;font-weight:600">${name}</div>
                <div style="font-size:11px;color:var(--text2)">Placed ${HF_UTILS.timeAgo(sp.updated_at)}</div>
              </div>`;
                })
                .join("")
        }
        <div style="display:flex;gap:24px;padding-top:12px;border-top:0.5px solid var(--border);margin-top:12px;">
          <div>
            <div style="font-size:18px;font-weight:700;color:var(--green)">${placed.length}</div>
            <div style="font-size:10px;color:var(--text2);text-transform:uppercase;font-family:var(--font-head);letter-spacing:0.08em">Total placements</div>
          </div>
        </div>
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
            <div style="font-size:13px">Messages from HappyFeet and players will appear here.</div>
          </div>`
            : HF_UTILS.messageListHTML(msgs, "scout")
        }
      </div>

      ${
        archived?.length > 0
          ? `
        <div class="card">
          <div class="card-title" style="cursor:pointer;" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
            <div class="card-dot"></div>Archived
            <span style="margin-left:auto;font-size:11px;color:var(--text3)">${archived.length} · click to expand</span>
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

  // ── FAITH ──────────────────────────────────────────────────
  const faith = (s) => {
    setMain(`
      <div class="faith-hero">
        <i class="ti ti-cross" style="font-size:32px;margin-bottom:10px;display:block;color:var(--faith)"></i>
        <div style="font-size:20px;font-weight:700;margin-bottom:6px">Faith & Purpose</div>
        <div style="font-size:13px;opacity:.8">Your talent is God-given. Your discipline is your worship.</div>
      </div>
      <div class="faith-verse-card">
        <div class="verse-text">${HF_SCRIPTURE.getToday().verse}</div>
        <div class="verse-ref">${HF_SCRIPTURE.getToday().ref}</div>
      </div>`);
  };

  // ── FIND MY TEAM ───────────────────────────────────────────
  const findmyteam = (s) => {
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Find my team</div>
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <i class="ti ti-map-search" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">Coming soon</div>
          <div style="font-size:13px">Team listings coming in the next update.</div>
        </div>
      </div>`);
  };

  // ── EDIT PROFILE ───────────────────────────────────────────
  const editProfile = () => {
    const session = HF_DB.getSession();
    const p = session.profile || {};

    setMain(`
    <div style="background:#0f0f0d;padding:var(--sp-2xl);margin-bottom:var(--sp-lg);display:flex;align-items:flex-start;gap:var(--sp-lg);">
      <div style="position:relative;">
        <div style="width:72px;height:72px;background:#185FA5;display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:26px;font-weight:700;color:#fff;">
          ${HF_UTILS.initials(session.name)}
        </div>
        <button onclick="HF_UTILS.toast('Profile photo upload coming soon!','success')"
          style="position:absolute;bottom:-8px;right:-8px;width:24px;height:24px;background:var(--gold);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#0f0f0d;">
          <i class="ti ti-camera" style="font-size:12px"></i>
        </button>
      </div>
      <div>
        <div style="font-family:var(--font-head);font-size:22px;font-weight:700;color:#fff;">${session.name}</div>
        <div style="font-size:13px;color:rgba(255,255,255,.55);margin-top:3px;">${p.org || "-"}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Edit profile</div>
      <div class="fg">
        <label class="required">Full name</label>
        <input type="text" id="ep-name" value="${session.name || ""}" placeholder="Your full name"
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
      </div>
      <div class="fg">
        <label class="required">Organisation / agency</label>
        <input type="text" id="ep-org" value="${p.org || ""}" placeholder="e.g. HappyFeet Scouting"
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
      </div>
      <div class="fg">
        <label class="required">Years experience</label>
        <input type="number" id="ep-exp" value="${p.exp || ""}" min="0" max="50"
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
      </div>
      <div style="display:flex;gap:8px;margin-top:4px;">
        <button class="btn btn-primary" onclick="HF_SCOUT.saveProfile()">
          <i class="ti ti-circle-check"></i> Save changes
        </button>
        <button class="btn btn-outline" onclick="HF_ROUTER.navTo('profile')">Cancel</button>
      </div>
    </div>`);
  };

  const saveProfile = async () => {
    const session = HF_DB.getSession();
    const p = session.profile || {};
    const name = document.getElementById("ep-name")?.value.trim();
    const org = document.getElementById("ep-org")?.value.trim();
    const exp = document.getElementById("ep-exp")?.value;

    if (!name) {
      HF_UTILS.toast("Please enter your full name.", "error");
      return;
    }
    if (!org) {
      HF_UTILS.toast("Please enter your organisation name.", "error");
      return;
    }
    if (!exp || parseInt(exp) < 0 || parseInt(exp) > 50) {
      HF_UTILS.toast("Please enter valid years of experience (0-50).", "error");
      return;
    }

    if (name !== session.name) {
      const nameResult = await HF_DB.updateUserName(session.userId, name);
      if (nameResult.error) {
        HF_UTILS.toast(nameResult.error, "error");
        return;
      }
      session.name = name;
    }

    const updatedProfile = { ...p, org, exp };
    const result = await HF_DB.updateUserProfile(
      session.userId,
      updatedProfile,
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    session.profile = updatedProfile;
    HF_DB.saveSession(session);

    const nameDisplay = document.getElementById("topbar-name-display");
    if (nameDisplay) nameDisplay.textContent = name;

    HF_UTILS.toast("Profile updated!", "success");
    HF_ROUTER.navTo("profile");
  };

  // ── RESUBMIT AGENCY ────────────────────────────────────────
  const resubmitAgency = () => {
    const session = HF_DB.getSession();
    setMain(`
      <div class="auth-card" style="max-width:480px;margin:0 auto;">
        <div class="auth-title">Resubmit agency registration</div>
        <div class="auth-sub">Update your agency details for verification</div>
        <div class="error-box" id="reagency-err"></div>
        <div class="fg">
          <label class="required">Organisation / agency</label>
          <input type="text" id="rag-name" value="${session.profile?.org || ""}" placeholder="e.g. HappyFeet Scouting"
            style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
        </div>
        <div class="fg">
          <label class="required">Regions you cover</label>
          <div id="rag-regions-container" style="display:flex;flex-wrap:wrap;gap:6px;padding:10px;background:var(--bg2);border:0.5px solid var(--border);min-height:44px;"></div>
          <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">
            <button type="button" class="region-tag" data-value="Ghana" onclick="HF_AUTH.toggleTag(this,'rag-regions-container')" style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">Ghana</button>
            <button type="button" class="region-tag" data-value="Nigeria" onclick="HF_AUTH.toggleTag(this,'rag-regions-container')" style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">Nigeria</button>
            <button type="button" class="region-tag" data-value="Senegal" onclick="HF_AUTH.toggleTag(this,'rag-regions-container')" style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">Senegal</button>
            <button type="button" class="region-tag" data-value="Ivory Coast" onclick="HF_AUTH.toggleTag(this,'rag-regions-container')" style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">Ivory Coast</button>
            <button type="button" class="region-tag" data-value="Cameroon" onclick="HF_AUTH.toggleTag(this,'rag-regions-container')" style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">Cameroon</button>
            <button type="button" class="region-tag" data-value="West Africa" onclick="HF_AUTH.toggleTag(this,'rag-regions-container')" style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">West Africa</button>
            <button type="button" class="region-tag" data-value="All Africa" onclick="HF_AUTH.toggleTag(this,'rag-regions-container')" style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">All Africa</button>
          </div>
        </div>
        <div class="fg">
          <label class="required">Target leagues / destinations</label>
          <div id="rag-leagues-container" style="display:flex;flex-wrap:wrap;gap:6px;padding:10px;background:var(--bg2);border:0.5px solid var(--border);min-height:44px;"></div>
          <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">
            <button type="button" class="league-tag" data-value="Ghana Premier League" onclick="HF_AUTH.toggleTag(this,'rag-leagues-container')" style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">Ghana Premier League</button>
            <button type="button" class="league-tag" data-value="MLS" onclick="HF_AUTH.toggleTag(this,'rag-leagues-container')" style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">MLS</button>
            <button type="button" class="league-tag" data-value="Premier League" onclick="HF_AUTH.toggleTag(this,'rag-leagues-container')" style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">Premier League</button>
            <button type="button" class="league-tag" data-value="Europe" onclick="HF_AUTH.toggleTag(this,'rag-leagues-container')" style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">Europe</button>
            <button type="button" class="league-tag" data-value="Gulf" onclick="HF_AUTH.toggleTag(this,'rag-leagues-container')" style="font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;background:var(--bg3);border:0.5px solid var(--border);color:var(--text2);cursor:pointer;">Gulf</button>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:var(--sp-md);">
          <button class="btn btn-primary" onclick="HF_SCOUT.submitAgencyResubmission()">
            <i class="ti ti-send"></i> Submit for verification
          </button>
          <button class="btn btn-outline" onclick="HF_ROUTER.navTo('dashboard')">Cancel</button>
        </div>
      </div>`);
  };

  const submitAgencyResubmission = async () => {
    const session = HF_DB.getSession();
    const agencyName = document.getElementById("rag-name")?.value.trim();
    const website = document.getElementById("rag-website")?.value?.trim();
    const regionsCovered = HF_AUTH.getSelectedTags("rag-regions-container");
    const targetLeagues = HF_AUTH.getSelectedTags("rag-leagues-container");

    if (!agencyName) {
      HF_UTILS.toast("Please enter your agency name.", "error");
      return;
    }
    if (regionsCovered.length === 0) {
      HF_UTILS.toast("Please select at least one region.", "error");
      return;
    }
    if (targetLeagues.length === 0) {
      HF_UTILS.toast("Please select at least one target league.", "error");
      return;
    }

    const result = await HF_DB.submitAgencyVerification({
      scoutId: session.userId,
      agencyName,
      regionsCovered,
      targetLeagues,
      website: website || null,
    });

    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    await HF_DB.updateAgencyStatus(session.userId, "pending");
    session.agencyStatus = "pending";
    HF_DB.saveSession(session);

    HF_UTILS.toast("Agency resubmitted for verification!", "success");
    HF_ROUTER.navTo("dashboard");
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

  const archiveMessage = async (messageId) => {
    await HF_DB.archiveMessage(messageId);

    const session = HF_DB.getSession();
    const { data: msgs } = await HF_DB.getMessages(session.userId);
    const unreadCount = msgs?.filter((m) => !m.read).length || 0;
    HF_ROUTER.refreshSidenavBadge("messages", unreadCount, "var(--red)");

    HF_UTILS.toast("Message archived.", "success");
    messages(session);
  };

  const togglePlayerActions = (playerId) => {
    const actions = document.getElementById(`player-actions-${playerId}`);
    if (actions)
      actions.style.display =
        actions.style.display === "none" ? "block" : "none";
  };

  const toggleSavedActions = (prospectId) => {
    const actions = document.getElementById(`saved-actions-${prospectId}`);
    if (actions)
      actions.style.display =
        actions.style.display === "none" ? "block" : "none";
  };

  return {
    render,
    resubmitAgency,
    submitAgencyResubmission,
    readMessage,
    archiveMessage,
    filterPlayers,
    savePlayer,
    viewPlayerProfile,
    messagePlayer,
    sendMessage,
    unsavePlayer,
    flagProspect,
    shareReport,
    arrangeTrial,
    markPlaced,
    addClub,
    editProfile,
    saveProfile,
    togglePlayerActions,
    toggleSavedActions,
  };
})();

window.HF_SCOUT = HF_SCOUT;
