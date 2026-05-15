/**
 * HappyFeet: dashboards/scout.js
 * All views for the Scout role.
 */

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

  const PROSPECTS = [
    {
      name: "Yaw Darko",
      pos: "ST",
      age: 16,
      region: "Kumasi",
      speed: 91,
      tech: 87,
      pot: "Elite",
      status: "flagged",
      gender: "male",
    },
    {
      name: "Adjoa Frempong",
      pos: "CM",
      age: 15,
      region: "Accra",
      speed: 84,
      tech: 89,
      pot: "High",
      status: "watching",
      gender: "female",
    },
    {
      name: "Nana Amponsah",
      pos: "GK",
      age: 17,
      region: "Tamale",
      speed: 76,
      tech: 82,
      pot: "High",
      status: "shared",
      gender: "male",
    },
    {
      name: "Mensah Osei",
      pos: "LB",
      age: 16,
      region: "Takoradi",
      speed: 88,
      tech: 78,
      pot: "Good",
      status: "watching",
      gender: "male",
    },
  ];

  const STATUS_LABEL = {
    watching: "Watching",
    flagged: "Flagged",
    shared: "Report sent",
    trial: "On trial",
    placed: "Placed ✓",
  };
  const STATUS_CLS = {
    watching: "blue",
    flagged: "gold",
    shared: "gold",
    trial: "red",
    placed: "green",
  };
  const POT_CLS = {
    Elite: "red",
    High: "gold",
    Good: "green",
    Prospect: "blue",
  };

  const prospectCard = (pr) => {
    const avg = Math.round((pr.speed + pr.tech) / 2);
    const gc =
      pr.gender === "female" ? "rgba(212,83,126,.1)" : "rgba(24,95,165,.1)";
    const gcol = pr.gender === "female" ? "#993556" : "#185FA5";
    const bg =
      pr.pot === "Elite"
        ? "var(--red)"
        : pr.pot === "High"
          ? "var(--gold)"
          : "var(--green)";
    return `
      <div class="prospect-row" onclick="HF_UTILS.toast('Full profile view coming in next version.','success')">
        <div class="avatar avatar-md" style="background:${bg}">${initials(pr.name)}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600;color:var(--text)">${pr.name}</div>
          <div style="font-size:11px;color:var(--text2)">${pr.pos} · Age ${pr.age} · ${pr.region}</div>
          <div style="display:flex;gap:5px;margin-top:3px;flex-wrap:wrap">
            <span style="font-size:10px;padding:1px 7px;border-radius:8px;background:${gc};color:${gcol};font-weight:600">${pr.gender === "female" ? "Female" : "Male"}</span>
            ${badgeHTML(STATUS_LABEL[pr.status] || pr.status, STATUS_CLS[pr.status] || "blue")}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:17px;font-weight:700;color:${avg >= 85 ? "var(--red)" : avg >= 75 ? "var(--gold)" : "var(--green)"}">${avg}</div>
          ${badgeHTML(pr.pot, POT_CLS[pr.pot] || "gold")}
        </div>
      </div>`;
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

  // DASHBOARD
  const dashboard = (s) => {
    const p = s.profile || {};
    const newUser = HF_UTILS.isNewUser(s);
    setMain(`
      <div class="welcome-banner">
        <div>
          <div style="font-family:var(--font-head);font-size:22px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">${newUser ? "Welcome" : "Welcome back"}, Scout ${s.name.split(" ").pop()}!</div>
          <div class="welcome-sub">${p.org || "HappyFeet Scouting"} · ${p.region || "Ghana"}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:32px;font-weight:700;color:var(--gold)">${p.prospectsTracked || PROSPECTS.length}</div>
          <div style="font-size:11px;color:rgba(255,255,255,.5)">Prospects tracked</div>
        </div>
      </div>
      ${HF_SCRIPTURE.stripHTML()}
      <div class="metrics-grid">
        <div class="metric-card"><div class="metric-val" style="color:var(--gold)">${PROSPECTS.length}</div><div class="metric-label">Tracked</div></div>
        <div class="metric-card"><div class="metric-val" style="color:var(--red)">${PROSPECTS.filter((p) => p.pot === "Elite").length}</div><div class="metric-label">Elite prospects</div></div>
        <div class="metric-card"><div class="metric-val" style="color:var(--green)">${PROSPECTS.filter((p) => p.status === "shared").length}</div><div class="metric-label">Report shared</div></div>
        <div class="metric-card"><div class="metric-val" style="color:var(--purple)">0</div><div class="metric-label">Placed</div><div class="metric-sub" style="color:var(--text2)">No placements yet</div></div>
        </div>
      <div class="quick-actions">
        <button class="quick-action" onclick="HF_ROUTER.navTo('discover')">
          <div class="quick-action-icon"><i class="ti ti-search"></i></div>
          <div class="quick-action-label">Discover talent</div>
          <div class="quick-action-sub">Search prospects</div>
        </button>
        <button class="quick-action" onclick="HF_ROUTER.navTo('prospects')">
          <div class="quick-action-icon"><i class="ti ti-star"></i></div>
          <div class="quick-action-label">Saved prospects</div>
          <div class="quick-action-sub">${PROSPECTS.length} being tracked</div>
        </button>
        <button class="quick-action" onclick="HF_ROUTER.navTo('pipeline')">
          <div class="quick-action-icon"><i class="ti ti-trending-up"></i></div>
          <div class="quick-action-label">Pipeline</div>
          <div class="quick-action-sub">Track progress</div>
        </button>
      </div>
      <div class="card">
      <div class="card-title"><div class="card-dot"></div>Recent scouting activity</div>
        ${activityHTML('<i class="ti ti-star"></i>', "rgba(200,16,46,.08)", "Elite prospect flagged", "Yaw Darko (ST, 16, Kumasi): ready for club report.", "2 hours ago")}
        ${activityHTML('<i class="ti ti-circle-check"></i>', "rgba(26,122,46,.08)", "Report shared", "Nana Amponsah profile sent to FC Nordsjælland.", "1 day ago")}
        ${activityHTML('<i class="ti ti-plus"></i>', "rgba(24,95,165,.08)", "New prospect added", "Adjoa Frempong (CM, 15, Accra): High potential.", "2 days ago")}
      </div>`);
    if (newUser) setTimeout(() => HF_PLAYER._launchConfetti(), 300);
  };

  // PROFILE
  const profile = (s) => {
    const p = s.profile || {};
    setMain(`
      <div class="profile-hero">
        ${avatarHTML(s.name, "xl", "#185FA5")}
        <div>
          <div class="profile-name">${s.name}</div>
          <div class="profile-meta">${p.org || "-"} · ${p.region || "-"}</div>
          <div style="margin-top:8px">${badgeHTML("Scout", "blue")}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Scout details</div>
        <div class="info-grid">
          <div class="info-cell"><div class="info-label">Organisation</div><div class="info-val">${p.org || "-"}</div></div>
          <div class="info-cell"><div class="info-label">Experience</div><div class="info-val">${p.exp || "-"} years</div></div>
          <div class="info-cell"><div class="info-label">Region covered</div><div class="info-val">${p.region || "-"}</div></div>
          <div class="info-cell"><div class="info-label">Target destinations</div><div class="info-val">${p.dest || "-"}</div></div>
          <div class="info-cell"><div class="info-label">Prospects tracked</div><div class="info-val">${p.prospectsTracked || PROSPECTS.length}</div></div>
          <div class="info-cell"><div class="info-label">${s.contactType === "phone" ? "Phone" : "Email"}</div><div class="info-val">${s.displayContact || s.contact}</div></div>
        </div>
      </div>`);
  };

  // DISCOVER / PROSPECTS (shared UI)
  const _prospectList = (title, subtitle) => `
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>${title}</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:12px">${subtitle}</div>
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        <select style="padding:7px 10px;background:var(--bg2);border:0.5px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;font-family:inherit;outline:none">
          <option>All positions</option><option>GK</option><option>CB</option><option>CM</option><option>ST</option><option>LW</option><option>RB</option>
        </select>
        <select style="padding:7px 10px;background:var(--bg2);border:0.5px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;font-family:inherit;outline:none">
          <option>All genders</option><option>Male</option><option>Female</option>
        </select>
        <select style="padding:7px 10px;background:var(--bg2);border:0.5px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;font-family:inherit;outline:none">
          <option>All potential</option><option>Elite</option><option>High</option><option>Good</option>
        </select>
        <input type="text" placeholder="Search name or region..." style="flex:1;min-width:100px;padding:7px 10px;background:var(--bg2);border:0.5px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;font-family:inherit;outline:none">
      </div>
      ${PROSPECTS.map(prospectCard).join("")}
      <div style="margin-top:12px">
        <button class="btn btn-primary btn-sm" onclick="HF_UTILS.toast('Add prospect form: full version in next release.','success')">+ Add prospect</button>
      </div>
    </div>`;

  const discover = (s) =>
    setMain(
      _prospectList(
        "Discover talent",
        "Search and evaluate talent across Ghana and the continent.",
      ),
    );
  const prospects = (s) =>
    setMain(
      _prospectList(
        "Saved prospects",
        "Players you are actively tracking and evaluating.",
      ),
    );

  // PIPELINE
  const pipeline = (s) => {
    const stages = ["watching", "flagged", "shared", "trial", "placed"];
    const stageLabel = {
      watching: "Watching",
      flagged: "Flagged",
      shared: "Report shared",
      trial: "On trial",
      placed: "Placed ✓",
    };
    const stageColor = {
      watching: "#185FA5",
      flagged: "#C9961A",
      shared: "#C9961A",
      trial: "#c8102e",
      placed: "#1a7a2e",
    };
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Active pipeline</div>
        ${stages
          .map((st) => {
            const list = PROSPECTS.filter((p) => p.status === st);
            if (!list.length) return "";
            return `
            <div style="margin-bottom:14px">
              <div style="font-size:11px;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">
                ${stageLabel[st]} (${list.length})
              </div>
              ${list
                .map(
                  (pr) => `
                <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg2);border-radius:8px;margin-bottom:6px;border-left:3px solid ${stageColor[st]}">
                  <div style="width:8px;height:8px;border-radius:50%;background:${stageColor[st]};flex-shrink:0"></div>
                  <div>
                    <div style="font-size:13px;font-weight:600;color:var(--text)">${pr.name}</div>
                    <div style="font-size:11px;color:var(--text2)">${pr.pos} · ${pr.region} · ${pr.pot} potential · ${pr.gender === "female" ? "Female" : "Male"}</div>
                  </div>
                </div>`,
                )
                .join("")}
            </div>`;
          })
          .join("")}
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Pipeline stages explained</div>
        <div style="font-size:12px;color:var(--text2);line-height:2.2">
          1. <strong style="color:var(--text)">Watching</strong>: Added, data collecting. Min 4 weeks of sessions.<br>
          2. <strong style="color:var(--text)">Flagged</strong>: Meets threshold. Ready for scouting report.<br>
          3. <strong style="color:var(--text)">Report shared</strong>: PDF profile sent to partner clubs.<br>
          4. <strong style="color:var(--text)">Trial arranged</strong>: Club interested. Family briefed. Date set.<br>
          5. <strong style="color:var(--text)">Placed ✓</strong>: Signed. Fee logged. Follow-up at 3 months.
        </div>
      </div>`);
  };

  // REPORTS
  const reports = (s) => {
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Scout reports sent</div>
        ${[
          {
            name: "Yaw Darko",
            date: "Today",
            club: "FC Nordsjælland",
            status: "Pending",
          },
          {
            name: "Nana Amponsah",
            date: "2 days ago",
            club: "WAFA SC Academy",
            status: "Reviewed",
          },
        ]
          .map(
            (r) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg2);border-radius:8px;margin-bottom:8px">
            <div>
              <div style="font-size:13px;font-weight:600">${r.name}</div>
              <div style="font-size:11px;color:var(--text2)">Sent to ${r.club} · ${r.date}</div>
            </div>
            ${badgeHTML(r.status, r.status === "Reviewed" ? "green" : "gold")}
          </div>`,
          )
          .join("")}
        <button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="HF_UTILS.toast('PDF report generation coming in next version!','success')">
          Generate PDF report
        </button>
      </div>`);
  };

  // CLUBS
  const clubs = (s) => {
    const CLUBS = [
      {
        name: "WAFA SC Academy",
        country: "Ghana",
        tier: "National",
        needs: "CM, ST, CB",
        color: "#C9961A",
      },
      {
        name: "FC Nordsjælland",
        country: "Denmark",
        tier: "European",
        needs: "All positions U17–U21",
        color: "#185FA5",
      },
      {
        name: "Philadelphia Union II",
        country: "USA",
        tier: "MLS Next Pro",
        needs: "CB, ST",
        color: "#c8102e",
      },
    ];
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Partner club network</div>
        ${CLUBS.map(
          (c) => `
          <div style="padding:12px;background:var(--bg2);border-radius:8px;margin-bottom:8px;border-left:3px solid ${c.color}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
              <div style="font-size:13px;font-weight:600">${c.name}</div>
              ${badgeHTML(c.tier, "gold")}
            </div>
            <div style="font-size:11px;color:var(--text2)">${c.country} · Needs: ${c.needs}</div>
          </div>`,
        ).join("")}
        <button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="HF_UTILS.toast('Add club to network.','success')">+ Add club</button>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>How to build your network</div>
        <div style="font-size:12px;color:var(--text2);line-height:2.1">
          • <strong style="color:var(--text)">Start in Ghana:</strong> WAFA, Dreams FC, Heart of Lions reserve teams.<br>
          • <strong style="color:var(--text)">Your USA connections:</strong> Clubs you played at are direct entry points.<br>
          • <strong style="color:var(--text)">Lower Europe:</strong> Scandinavia, Belgium, Portugal actively scout Africa.<br>
          • <strong style="color:var(--text)">Gulf leagues:</strong> Saudi, UAE, Qatar academies recruit African talent.<br>
          • <strong style="color:var(--text)">Always in writing:</strong> Fee agreement signed before sharing any profile.
        </div>
      </div>`);
  };

  // PLACEMENTS
  const placements = (s) => {
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Log a placement deal</div>
        <div class="form-row">
          <div class="fg"><label>Player name</label><input type="text" placeholder="Player full name"></div>
          <div class="fg"><label>Destination club</label><input type="text" placeholder="e.g. FC Nordsjælland, Denmark"></div>
        </div>
        <div class="form-row">
          <div class="fg"><label>Deal type</label>
            <select><option>International transfer</option><option>Domestic transfer</option><option>Trial arrangement</option><option>Academy signing</option><option>Loan deal</option></select>
          </div>
          <div class="fg"><label>Fee earned (GHS or USD)</label><input type="text" placeholder="e.g. $2,500"></div>
        </div>
        <div class="fg"><label>Notes</label><input type="text" placeholder="e.g. 3-year academy contract. Follow up at 3 months."></div>
        <button class="btn btn-primary" onclick="HF_UTILS.toast('Placement logged ✓','success')">Log placement ✓</button>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Placement record</div>
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <div style="font-size:36px;margin-bottom:10px"><i class="ti ti-circle-check"></i></div>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No placements yet</div>
          <div style="font-size:13px">Your first placement will appear here once confirmed.</div>
        </div>
        <div style="display:flex;gap:24px;padding-top:12px;border-top:0.5px solid var(--border)">
          <div><div style="font-size:18px;font-weight:700;color:var(--purple)">0</div><div style="font-size:10px;color:var(--text2);text-transform:uppercase">Total placements</div></div>
          <div><div style="font-size:18px;font-weight:700;color:var(--gold)">$0</div><div style="font-size:10px;color:var(--text2);text-transform:uppercase">Fees earned</div></div>
        </div>
      </div>`);
  };

  // MESSAGES
  const messages = (s) => {
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Messages</div>
        <div style="text-align:center;padding:32px;color:var(--text2)">
          <div style="font-size:32px;margin-bottom:8px"><i class="ti ti-message"></i></div>
          <div style="font-size:13px">No messages yet. Connect with coaches and clubs to get started.</div>
        </div>
      </div>`);
  };

  const findmyteam = (s) => {
    setMain(`
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Find my team</div>
      <div style="text-align:center;padding:32px;color:var(--text2)">
        <i class="ti ti-map-search" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
        <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">Coming soon</div>
        <div style="font-size:13px">Team listings and player discovery coming in the next update.</div>
      </div>
    </div>`);
  };

  return { render };
})();

window.HF_SCOUT = HF_SCOUT;
