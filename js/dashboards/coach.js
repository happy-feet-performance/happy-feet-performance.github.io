/**
 * HappyFeet: dashboards/coach.js
 * All views for the Coach role.
 */

const HF_COACH = (() => {
  const {
    barHTML,
    activityHTML,
    avatarHTML,
    badgeHTML,
    miniChartHTML,
    toast,
    initials,
    avatarColor,
    ratingColor,
  } = HF_UTILS;

  const setMain = (html) => {
    const mc = document.getElementById("main-content");
    if (mc) mc.innerHTML = html;
  };

  const SQUAD = [
    {
      name: "Kwame Asante",
      pos: "CAM",
      age: 19,
      rating: 78,
      status: "fit",
      gender: "male",
    },
    {
      name: "Emmanuel Ofori",
      pos: "CB",
      age: 21,
      rating: 72,
      status: "alert",
      gender: "male",
    },
    {
      name: "Ama Boateng",
      pos: "LW",
      age: 18,
      rating: 85,
      status: "fit",
      gender: "female",
    },
    {
      name: "Kofi Mensah",
      pos: "DM",
      age: 22,
      rating: 80,
      status: "fit",
      gender: "male",
    },
    {
      name: "Abena Sarpong",
      pos: "ST",
      age: 20,
      rating: 74,
      status: "monitor",
      gender: "female",
    },
    {
      name: "Prince Adjei",
      pos: "RB",
      age: 17,
      rating: 70,
      status: "fit",
      gender: "male",
    },
  ];

  const statusBadge = (st) => {
    const map = { fit: "green", monitor: "gold", alert: "red" };
    const lbl = { fit: "Fit", monitor: "Monitor", alert: "Alert" };
    return badgeHTML(lbl[st] || st, map[st] || "gold");
  };

  const render = (view, session) => {
    const views = {
      dashboard,
      profile,
      squad,
      training,
      tracking,
      health,
      recruitment,
      messages,
      faith,
      findmyteam,
    };
    const fn = views[view] || dashboard;
    fn(session);
  };

  // DASHBOARD
  const dashboard = (s) => {
    const p = s.profile || {};
    setMain(`
      <div class="welcome-banner">
        <div>
          <div class="welcome-title">Coach ${s.name.split(" ").pop()}</div>
          <div class="welcome-sub">${p.spec || "Head coach"} · ${p.club || "-"} · ${p.licence || "-"} licence</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:32px;font-weight:700;color:var(--gold)">${p.teamSize || 22}</div>
          <div style="font-size:11px;color:rgba(255,255,255,.5)">Squad size</div>
        </div>
      </div>
      <div class="scripture-strip" style="margin-bottom:var(--sp-xl);padding:var(--sp-lg)">
        <i class="ti ti-cross" style="color:var(--faith);font-size:18px;flex-shrink:0"></i>
        <span>"Whatever you do, work at it with all your heart, as working for the Lord." ~ Colossians 3:23</span>
      </div>
      <div class="metrics-grid">
        <div class="metric-card"><div class="metric-val" style="color:var(--green)">87%</div><div class="metric-label">Squad readiness</div><div class="metric-sub" style="color:var(--green)">+4% this week</div></div>
        <div class="metric-card"><div class="metric-val" style="color:var(--red)">2</div><div class="metric-label">Risk alerts</div><div class="metric-sub">Review today</div></div>
        <div class="metric-card"><div class="metric-val" style="color:var(--gold)">${p.teamSize || 22}</div><div class="metric-label">Active players</div><div class="metric-sub">2 monitoring</div></div>
        <div class="metric-card"><div class="metric-val" style="color:var(--red)">5</div><div class="metric-label">Messages</div><div class="metric-sub" style="color:var(--text2)">Unread</div></div>
      </div>
      <div class="quick-actions">
        <button class="quick-action" onclick="HF_ROUTER.navTo('squad')">
          <div class="quick-action-icon"><i class="ti ti-users"></i></div>
          <div class="quick-action-label">View squad</div>
          <div class="quick-action-sub">${p.teamSize || 22} players</div>
        </button>
        <button class="quick-action" onclick="HF_ROUTER.navTo('training')">
          <div class="quick-action-icon"><i class="ti ti-clipboard-list"></i></div>
          <div class="quick-action-label">Today's session</div>
          <div class="quick-action-sub">Technical: high</div>
        </button>
        <button class="quick-action" onclick="HF_ROUTER.navTo('health')">
          <div class="quick-action-icon"><i class="ti ti-stethoscope"></i></div>
          <div class="quick-action-label">Health flags</div>
          <div class="quick-action-sub">2 alerts pending</div>
        </button>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>AI agent activity</div>
        ${activityHTML('<i class="ti ti-robot"></i>', "rgba(201,150,26,.1)", "Performance Agent", "Fatigue detected: Kwame Asante. Sprint load reduced 30% tomorrow.", "2 min ago")}
        ${activityHTML('<i class="ti ti-stethoscope"></i>', "rgba(200,16,46,.08)", "Health Agent", "Emmanuel Ofori: hamstring flag. Physio check 7am. Modified plan activated.", "18 min ago")}
        ${activityHTML('<i class="ti ti-search"></i>', "rgba(26,122,46,.08)", "Scout Agent", "3 new prospects identified in Kumasi region. Profiles ready.", "1 hr ago")}
      </div>`);
  };

  // PROFILE
  const profile = (s) => {
    const p = s.profile || {};
    setMain(`
      <div class="profile-hero">
        ${avatarHTML(s.name, "xl", "#C9961A")}
        <div>
          <div class="profile-name">${s.name}</div>
          <div class="profile-meta">${p.spec || "Head coach"} · ${p.club || "—"}</div>
          <div style="margin-top:8px">${badgeHTML("Coach", "gold")}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Coaching details</div>
        <div class="info-grid">
          <div class="info-cell"><div class="info-label">Licence</div><div class="info-val">${p.licence || "—"}</div></div>
          <div class="info-cell"><div class="info-label">Experience</div><div class="info-val">${p.exp || "—"} years</div></div>
          <div class="info-cell"><div class="info-label">Club</div><div class="info-val">${p.club || "—"}</div></div>
          <div class="info-cell"><div class="info-label">Specialisation</div><div class="info-val">${p.spec || "—"}</div></div>
          <div class="info-cell"><div class="info-label">Squad size</div><div class="info-val">${p.teamSize || 22} players</div></div>
          <div class="info-cell"><div class="info-label">${s.contactType === "phone" ? "Phone" : "Email"}</div><div class="info-val">${s.displayContact || s.contact}</div></div>
        </div>
      </div>`);
  };

  // SQUAD
  const squad = (s) => {
    const p = s.profile || {};
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Squad roster: ${p.club || "Your club"}</div>
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick="HF_UTILS.toast('Add player: Connect to Players Module.','success')">+ Add player</button>
          <button class="btn btn-outline btn-sm" onclick="HF_UTILS.toast('Filter by position.','success')">Filter</button>
        </div>
        <table class="table">
          <thead><tr><th>Player</th><th>Pos</th><th>Age</th><th>Gender</th><th>Rating</th><th>Status</th></tr></thead>
          <tbody>
            ${SQUAD.map(
              (pl) => `
              <tr>
                <td style="font-weight:600">${pl.name}</td>
                <td>${pl.pos}</td>
                <td>${pl.age}</td>
                <td>
                  <span style="font-size:10px;padding:1px 7px;border-radius:8px;font-weight:600;
                    background:${pl.gender === "female" ? "rgba(212,83,126,.1)" : "rgba(24,95,165,.1)"};
                    color:${pl.gender === "female" ? "#993556" : "#185FA5"}">
                    ${pl.gender === "female" ? "Female" : "Male"}
                  </span>
                </td>
                <td style="font-weight:700;color:${ratingColor(pl.rating)}">${pl.rating}</td>
                <td>${statusBadge(pl.status)}</td>
              </tr>`,
            ).join("")}
          </tbody>
        </table>
      </div>`);
  };

  // TRAINING
  const training = (s) => {
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Session builder</div>
        <div class="form-row">
          <div class="fg"><label>Session name</label><input type="text" placeholder="e.g. Tuesday technical block"></div>
          <div class="fg"><label>Category</label>
            <select>
              <option>Technical</option><option>Tactical</option><option>Physical</option>
              <option>Recovery</option><option>Match prep</option><option>Faith</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="fg"><label>Intensity</label>
            <select><option>Low</option><option selected>Medium</option><option>High</option></select>
          </div>
          <div class="fg"><label>Duration (min)</label><input type="number" value="90" min="15" max="180"></div>
        </div>
        <div class="fg"><label>Coaching intent</label><input type="text" placeholder="e.g. Focus on press triggers and compact shape"></div>
        <div style="font-size:12px;font-weight:600;margin:12px 0 8px">Add drills</div>
        <div style="text-align:center;padding:20px;background:var(--bg2);border-radius:8px;border:0.5px dashed var(--border);margin-bottom:12px;color:var(--text2);font-size:13px">
          No drills yet. Add drills below or pick from the drill bank.
        </div>
        <div class="fg"><label>Drill name</label><input type="text" id="drill-name" placeholder="e.g. 4v4 rondo: possession under pressure"></div>
        <div class="form-row">
          <div class="fg"><label>Duration (min)</label><input type="number" value="10" id="drill-dur"></div>
          <div class="fg"><label>Type</label>
            <select id="drill-type">
              <option>Warm-up</option><option>Technical drill</option><option>Tactical shape</option>
              <option>Small-sided game</option><option>Conditioning</option><option>Cooldown</option><option>Prayer & devotion</option>
            </select>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="HF_UTILS.toast('Drill added!','success')">+ Add drill</button>
        <div style="margin-top:16px;display:flex;gap:8px">
          <button class="btn btn-primary" onclick="HF_UTILS.toast('Session saved to library ✓','success')">Save session ✓</button>
          <button class="btn btn-outline" onclick="HF_ROUTER.navTo('dashboard')">Cancel</button>
        </div>
      </div>`);
  };

  // TRACKING
  const tracking = (s) => {
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Log a player session rating</div>
        <div class="form-row">
          <div class="fg"><label>Player</label>
            <select id="tr-player">
              ${SQUAD.map((p) => `<option>${p.name}</option>`).join("")}
            </select>
          </div>
          <div class="fg"><label>Session type</label>
            <select><option>Technical</option><option>Tactical</option><option>Physical</option><option>Recovery</option></select>
          </div>
        </div>
        ${["Speed", "Technical", "Tactical", "Physical"]
          .map(
            (l) => `
          <div class="bar-row">
            <div class="bar-head">
              <span>${l}</span>
              <span id="cv-${l.toLowerCase()}" style="color:var(--gold);font-weight:600">7</span>
            </div>
            <input type="range" min="1" max="10" value="7" style="width:100%;accent-color:var(--gold);margin-top:4px"
              oninput="document.getElementById('cv-${l.toLowerCase()}').textContent=this.value">
          </div>`,
          )
          .join("")}
        <button class="btn btn-primary" style="margin-top:8px" onclick="HF_UTILS.toast('Session rating saved! ✓','success')">Save rating ✓</button>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Squad performance snapshot</div>
        <div class="metrics-grid" style="grid-template-columns:repeat(3,1fr)">
          <div class="metric-card"><div class="metric-val" style="color:var(--gold)">76</div><div class="metric-label">Squad avg rating</div></div>
          <div class="metric-card"><div class="metric-val" style="color:var(--green)">14</div><div class="metric-label">Sessions this month</div></div>
          <div class="metric-card"><div class="metric-val" style="color:var(--red)">2</div><div class="metric-label">Flagged players</div></div>
        </div>
      </div>`);
  };

  // HEALTH
  const health = (s) => {
    setMain(`
      <div class="metrics-grid">
        <div class="metric-card"><div class="metric-val" style="color:var(--green)">16</div><div class="metric-label">Fully fit</div></div>
        <div class="metric-card"><div class="metric-val" style="color:var(--gold)">2</div><div class="metric-label">Monitoring</div></div>
        <div class="metric-card"><div class="metric-val" style="color:var(--red)">0</div><div class="metric-label">Injured</div></div>
        <div class="metric-card"><div class="metric-val" style="color:var(--green)">94%</div><div class="metric-label">Availability</div></div>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Active health alerts</div>
        <div style="padding:12px;background:rgba(200,16,46,.05);border:0.5px solid rgba(200,16,46,.2);border-radius:8px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <strong>Emmanuel Ofori</strong>${badgeHTML("High risk", "red")}
          </div>
          <div style="font-size:12px;color:var(--text2)">Right hamstring tightness. Sprint volume cut 40%. Physio 7am.</div>
        </div>
        <div style="padding:12px;background:rgba(201,150,26,.05);border:0.5px solid rgba(201,150,26,.2);border-radius:8px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <strong>Kwame Asante</strong>${badgeHTML("Monitor", "gold")}
          </div>
          <div style="font-size:12px;color:var(--text2)">High load 3 days running. Active recovery recommended.</div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Log a health check-in</div>
        <div class="fg"><label>Player name</label>
          <select>${SQUAD.map((p) => `<option>${p.name}</option>`).join("")}</select>
        </div>
        <div class="fg"><label>Availability</label>
          <select>
            <option>Full training</option><option>Modified: reduced load</option>
            <option>Rehab only</option><option>Rest: not available</option>
          </select>
        </div>
        <div class="fg"><label>Notes</label><input type="text" placeholder="e.g. Slight limp. Mentioned left knee discomfort."></div>
        <button class="btn btn-primary" onclick="HF_UTILS.toast('Health check-in saved ✓','success')">Save check-in ✓</button>
      </div>`);
  };

  // RECRUITMENT
  const recruitment = (s) => {
    const prospects = [
      {
        name: "Yaw Darko",
        pos: "ST",
        age: 16,
        region: "Kumasi",
        pot: "Elite",
        speed: 91,
        tech: 87,
        gender: "male",
      },
      {
        name: "Adjoa Frempong",
        pos: "CM",
        age: 15,
        region: "Accra",
        pot: "High",
        speed: 84,
        tech: 89,
        gender: "female",
      },
      {
        name: "Nana Amponsah",
        pos: "GK",
        age: 17,
        region: "Tamale",
        pot: "High",
        speed: 76,
        tech: 82,
        gender: "male",
      },
    ];
    const potColors = { Elite: "red", High: "gold", Good: "green" };
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Recruitment prospects</div>
        <div style="font-size:13px;color:var(--text2);margin-bottom:14px">Players flagged as potential recruits by the Scout Agent.</div>
        ${prospects
          .map((pr) => {
            const avg = Math.round((pr.speed + pr.tech) / 2);
            const gc =
              pr.gender === "female"
                ? "rgba(212,83,126,.1)"
                : "rgba(24,95,165,.1)";
            const gcol = pr.gender === "female" ? "#993556" : "#185FA5";
            return `
            <div class="prospect-row" onclick="HF_UTILS.toast('Full profile coming in next version.','success')">
              <div class="avatar avatar-md" style="background:${potColors[pr.pot] === "red" ? "var(--red)" : "var(--gold)"}">${HF_UTILS.initials(pr.name)}</div>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:600">${pr.name}</div>
                <div style="font-size:11px;color:var(--text2)">${pr.pos} · Age ${pr.age} · ${pr.region}</div>
                <span style="font-size:10px;padding:1px 7px;border-radius:8px;background:${gc};color:${gcol};font-weight:600">${pr.gender === "female" ? "Female" : "Male"}</span>
              </div>
              <div style="text-align:right">
                <div style="font-size:16px;font-weight:700;color:var(--gold)">${avg}</div>
                ${badgeHTML(pr.pot, potColors[pr.pot])}
              </div>
            </div>`;
          })
          .join("")}
      </div>`);
  };

  // MESSAGES
  const messages = (s) => {
    const threads = [
      {
        name: "Kwame Asante",
        msg: "Coach, my hamstring felt tight today.",
        time: "1h",
        color: "#1a7a2e",
        unread: 1,
      },
      {
        name: "Ama Boateng",
        msg: "Can we review the crossing drill tomorrow?",
        time: "3h",
        color: "#C9961A",
        unread: 1,
      },
      {
        name: "Kofi Mensah",
        msg: "Ready for match day, coach!",
        time: "5h",
        color: "#185FA5",
        unread: 0,
      },
    ];
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Messages from players</div>
        ${threads
          .map(
            (t) => `
          <div class="msg-item" onclick="HF_UTILS.toast('Full messaging coming soon!','success')">
            <div class="avatar avatar-md" style="background:${t.color}">${HF_UTILS.initials(t.name)}</div>
            <div style="flex:1">
              <div class="msg-name">${t.name}</div>
              <div class="msg-preview">${t.msg}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
              <div class="msg-time">${t.time}</div>
              ${t.unread ? `<div class="msg-unread">${t.unread}</div>` : ""}
            </div>
          </div>`,
          )
          .join("")}
      </div>`);
  };

  // FAITH
  const faith = (s) => {
    setMain(`
      <div class="faith-hero">
        <div style="font-size:32px;margin-bottom:10px"><i class="ti ti-cross"></i></div>
        <div style="font-size:20px;font-weight:700;margin-bottom:6px">Team Devotion</div>
        <div style="font-size:13px;opacity:.8">Lead your players in faith as well as football.</div>
      </div>
      <div class="faith-verse-card">
        <div class="verse-text">"Whatever you do, work at it with all your heart, as working for the Lord, not for human masters."</div>
        <div class="verse-ref">Colossians 3:23</div>
      </div>
      <div class="card faith-card">
        <div class="card-title"><div class="card-dot faith"></div>How to run team devotion</div>
        <div style="font-size:12px;color:var(--text2);line-height:2.2">
          1. <strong style="color:var(--text)">Gather the squad</strong> before every session or match for 5–10 minutes.<br>
          2. <strong style="color:var(--text)">Read a verse together</strong>, like Colossians 3:23.<br>
          3. <strong style="color:var(--text)">One player leads prayer</strong> and rotate each session.<br>
          4. <strong style="color:var(--text)">Set an intention</strong>, like what does the squad play for today?<br>
          5. <strong style="color:var(--text)">Hands in, one voice</strong>, close together as a team.
        </div>
      </div>
      <div class="card faith-card">
        <div class="card-title"><div class="card-dot faith"></div>Scripture for coaches</div>
        ${[
          [
            "On patience with players",
            '"Love is patient, love is kind... it keeps no record of wrongs." ~ 1 Corinthians 13:4-5',
          ],
          [
            "On leading well",
            '"Whoever wants to become great among you must be your servant." ~ Matthew 20:26',
          ],
          [
            "On perseverance",
            '"Let us not become weary in doing good, for at the proper time we will reap a harvest." ~ Galatians 6:9',
          ],
        ]
          .map(
            ([title, verse]) => `
          <div class="prayer-card">
            <div class="prayer-title">${title}</div>
            <div class="prayer-text">${verse}</div>
          </div>`,
          )
          .join("")}
      </div>`);
  };

  const findmyteam = (s) => {
    document.getElementById("main-content").innerHTML =
      '<div id="fmt-container"></div>';
    HF_FINDTEAM.render("fmt-container", s);
  };

  return { render };
})();

window.HF_COACH = HF_COACH;
