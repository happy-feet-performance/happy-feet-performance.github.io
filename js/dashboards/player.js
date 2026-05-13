/**
 * HappyFeet — dashboards/player.js
 * All views for the Player role.
 * Render is called by router.js with (view, session).
 */

const HF_PLAYER = (() => {

  const { barHTML, miniChartHTML, activityHTML, avatarHTML, badgeHTML, toast, today, ratingColor } = HF_UTILS;

  const setMain = (html) => {
    const mc = document.getElementById('main-content');
    if (mc) mc.innerHTML = html;
  };

  // ── Overall rating calc ─────────────────────────────────────
  const calcRating = (r = {}) => {
    const vals = [r.speed||60, r.tech||60, r.tact||55, r.phys||60];
    return Math.round(vals.reduce((a,b) => a+b, 0) / vals.length);
  };

  // ── RENDER DISPATCHER ───────────────────────────────────────
  const render = (view, session) => {
    const views = { dashboard, profile, stats, training, health, achievements, highlights, messages, faith, findmyteam };
    const fn = views[view] || dashboard;
    fn(session);
  };

  const findmyteam = (s) => {
    document.getElementById('main-content').innerHTML = `<div id="fmt-container"></div>`;
    HF_FINDTEAM.render('fmt-container', s);
  };

  // ── DASHBOARD ───────────────────────────────────────────────
  const dashboard = (s) => {
    const p = s.profile || {};
    const r = p.ratings || {};
    const overall = calcRating(r);
    setMain(`
      <div class="welcome-banner">
        <div>
          <div class="welcome-title">Welcome back, ${s.name.split(' ')[0]} 👋</div>
          <div class="welcome-sub">${p.pos || 'Player'} · ${p.tier || 'U21'} · ${p.club || '—'}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:32px;font-weight:700;color:var(--gold)">${overall}%</div>
          <div style="font-size:11px;color:rgba(255,255,255,.5)">Overall rating</div>
        </div>
      </div>

      <div class="scripture-strip">
        <span style="color:var(--faith);font-size:18px">✝</span>
        <span>"I can do all things through Christ who strengthens me." — Philippians 4:13</span>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-val" style="color:var(--gold)">${overall}%</div>
          <div class="metric-label">Overall rating</div>
          <div class="metric-sub" style="color:var(--green)">↑ +4% this week</div>
        </div>
        <div class="metric-card">
          <div class="metric-val" style="color:var(--green)">14</div>
          <div class="metric-label">Sessions logged</div>
          <div class="metric-sub">This month</div>
        </div>
        <div class="metric-card">
          <div class="metric-val" style="color:var(--faith)">${p.faithStreak || 0}</div>
          <div class="metric-label">Faith streak</div>
          <div class="metric-sub">Days in a row</div>
        </div>
        <div class="metric-card">
          <div class="metric-val" style="color:var(--blue)">3</div>
          <div class="metric-label">Messages</div>
          <div class="metric-sub" style="color:var(--red)">Unread</div>
        </div>
      </div>

      <div class="quick-actions">
        <button class="quick-action" onclick="HF_ROUTER.navTo('stats')">
          <div class="quick-action-icon">📊</div>
          <div class="quick-action-label">View my stats</div>
          <div class="quick-action-sub">Performance data</div>
        </button>
        <button class="quick-action" onclick="HF_ROUTER.navTo('health')">
          <div class="quick-action-icon">🩺</div>
          <div class="quick-action-label">Log wellness</div>
          <div class="quick-action-sub">How are you today?</div>
        </button>
        <button class="quick-action" onclick="HF_ROUTER.navTo('faith')">
          <div class="quick-action-icon">🙏</div>
          <div class="quick-action-label">Morning devotion</div>
          <div class="quick-action-sub">Prayer & scripture</div>
        </button>
      </div>

      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Recent activity</div>
        ${activityHTML('📊','rgba(201,150,26,.1)','Session rated by coach','Technical — 78/100. Strong first touch. Work on weak foot.','2 hours ago')}
        ${activityHTML('🏆','rgba(26,122,46,.1)', 'Achievement unlocked', '"5-day faith streak" — Keep going!', 'Yesterday')}
        ${activityHTML('✝', 'rgba(123,63,160,.1)','Devotion completed',    'Day 5 — Discipline is worship', 'Yesterday')}
      </div>`);
  };

  // ── PROFILE ─────────────────────────────────────────────────
  const profile = (s) => {
    const p = s.profile || {};
    const r = p.ratings || {};
    setMain(`
      <div class="profile-hero">
        ${avatarHTML(s.name, 'xl', '#1a7a2e')}
        <div>
          <div class="profile-name">${s.name}</div>
          <div class="profile-meta">${p.pos || '—'} · ${p.tier || '—'} · ${p.club || '—'}</div>
          <div style="margin-top:8px">
            ${badgeHTML('Player', 'green')}
            <span style="font-size:12px;color:rgba(255,255,255,.5);margin-left:8px">${p.hometown || 'Ghana'}</span>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Player details</div>
        <div class="info-grid">
          <div class="info-cell"><div class="info-label">Position</div><div class="info-val">${p.pos || '—'}</div></div>
          <div class="info-cell"><div class="info-label">Age tier</div><div class="info-val">${p.tier || '—'}</div></div>
          <div class="info-cell"><div class="info-label">Club</div><div class="info-val">${p.club || '—'}</div></div>
          <div class="info-cell"><div class="info-label">Hometown</div><div class="info-val">${p.hometown || '—'}</div></div>
          <div class="info-cell"><div class="info-label">${s.contactType === 'phone' ? 'Phone' : 'Email'}</div><div class="info-val">${s.displayContact || s.contact}</div></div>
          <div class="info-cell"><div class="info-label">Faith streak</div><div class="info-val" style="color:var(--faith)">${p.faithStreak || 0} days ✝</div></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Ability ratings</div>
        ${barHTML('Speed', r.speed || 60, '#c8102e')}
        ${barHTML('Technical', r.tech || 60, 'var(--gold)')}
        ${barHTML('Tactical', r.tact || 55, 'var(--blue)')}
        ${barHTML('Physical', r.phys || 60, 'var(--green)')}
      </div>`);
  };

  // ── STATS ────────────────────────────────────────────────────
  const stats = (s) => {
    const r = s.profile?.ratings || {};
    const overall = calcRating(r);
    const history = [62,68,65,72,74,71,76,78];
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Performance overview</div>
        <div class="metrics-grid" style="grid-template-columns:repeat(3,1fr)">
          <div class="metric-card"><div class="metric-val" style="color:var(--gold)">${overall}%</div><div class="metric-label">Overall</div></div>
          <div class="metric-card"><div class="metric-val" style="color:var(--green)">14</div><div class="metric-label">Sessions</div></div>
          <div class="metric-card"><div class="metric-val" style="color:var(--blue)">78</div><div class="metric-label">Last rating</div></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Rating trend — last 8 sessions</div>
        ${miniChartHTML(history)}
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text2);margin-top:6px">
          <span>8 sessions ago</span><span>Latest</span>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Session history</div>
        <table class="table">
          <thead><tr><th>Date</th><th>Type</th><th>Rating</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Today</td><td>Technical</td><td style="font-weight:700;color:var(--green)">78</td><td>${badgeHTML('Good','green')}</td></tr>
            <tr><td>Yesterday</td><td>Tactical</td><td style="font-weight:700;color:var(--gold)">71</td><td>${badgeHTML('Developing','gold')}</td></tr>
            <tr><td>2 days ago</td><td>Physical</td><td style="font-weight:700;color:var(--green)">76</td><td>${badgeHTML('Good','green')}</td></tr>
            <tr><td>3 days ago</td><td>Recovery</td><td style="font-weight:700;color:var(--gold)">74</td><td>${badgeHTML('Monitor','gold')}</td></tr>
          </tbody>
        </table>
      </div>`);
  };

  // ── TRAINING ─────────────────────────────────────────────────
  const training = (s) => {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const types = ['Rest','Technical','Tactical','Recovery','Match prep','Match','Analysis'];
    const colors = ['#1a7a2e','#c8102e','#C9961A','#1a7a2e','#C9961A','#c8102e','#185FA5'];
    const sessions = [
      ['Warm-up & activation','20 min','low'],
      ['Technical rondos 5v2','25 min','high'],
      ['1v1 duels & pressing','20 min','high'],
      ['Tactical shape work','20 min','med'],
      ['✝ Team prayer & devotion','10 min','low'],
      ['Cooldown & stretch','15 min','low'],
    ];
    const badgeCls = { high:'red', med:'gold', low:'green' };
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>This week's schedule</div>
        <div class="devotion-grid">
          ${days.map((d,i) => `
            <div class="devotion-day ${i===1?'today':i===0?'done':''}">
              <div style="font-size:9px;color:var(--text2)">${d}</div>
              <div style="font-size:9px;font-weight:700;color:${i===1?'var(--gold)':colors[i]};margin-top:2px">${types[i]}</div>
            </div>`).join('')}
        </div>
        <div style="font-size:13px;font-weight:600;margin-bottom:10px">Today — Technical development</div>
        ${sessions.map(([title,dur,int]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg2);border-radius:var(--rm,8px);margin-bottom:6px">
            <span style="font-size:13px">${title}</span>
            <div style="display:flex;gap:8px;align-items:center">
              <span style="font-size:11px;color:var(--text2)">${dur}</span>
              ${badgeHTML(int, badgeCls[int])}
            </div>
          </div>`).join('')}
      </div>`);
  };

  // ── HEALTH ───────────────────────────────────────────────────
  const health = (s) => {
    const sliders = [
      ['sleep',  'Sleep quality last night'],
      ['energy', 'Energy level today'],
      ['sore',   'Muscle soreness (10 = none)'],
      ['focus',  'Mental focus & mood'],
      ['hydrate','Hydration level'],
    ];
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Daily wellness check-in</div>
        <div style="font-size:13px;color:var(--text2);margin-bottom:14px">How are you feeling today, ${s.name.split(' ')[0]}?</div>
        ${sliders.map(([id,label]) => `
          <div class="bar-row">
            <div class="bar-head">
              <span>${label}</span>
              <span id="hv-${id}" style="color:var(--gold);font-weight:600">7</span>
            </div>
            <input type="range" min="1" max="10" value="7" style="width:100%;accent-color:var(--gold);margin-top:4px"
              oninput="document.getElementById('hv-${id}').textContent=this.value">
          </div>`).join('')}
        <button class="btn btn-primary btn-full" style="margin-top:12px"
          onclick="HF_UTILS.toast('Wellness logged! Great job checking in. ✓','success')">
          Log check-in ✓
        </button>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Today's health status</div>
        <div style="padding:12px;background:rgba(26,122,46,.05);border:0.5px solid rgba(26,122,46,.2);border-radius:8px">
          <div style="font-size:12px;font-weight:600;color:var(--green);margin-bottom:4px">All clear ✓</div>
          <div style="font-size:12px;color:var(--text2)">No injury flags. Cleared for full training.</div>
        </div>
      </div>`);
  };

  // ── ACHIEVEMENTS ─────────────────────────────────────────────
  const achievements = (s) => {
    const list = [
      ['🌟','First session logged',   'You started your HappyFeet journey',        'Day 1'],
      ['✝', '5-day faith streak',     'Completed 5 consecutive devotions',          'This week'],
      ['📈','First rating improvement','Rating jumped +8 in one session',            'Last week'],
      ['🏃','10 sessions completed',  'Double-digit dedication',                     'This month'],
      ['⚽','First clean sheet',      'Recorded a 90-min shutout',                  'Last match'],
    ];
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Your achievements</div>
        ${list.map(([icon,title,sub,date]) => `
          <div class="achievement">
            <div class="achievement-icon">${icon}</div>
            <div>
              <div class="achievement-title">${title}</div>
              <div class="achievement-sub">${sub}</div>
            </div>
            <div class="achievement-date">${date}</div>
          </div>`).join('')}
        <div style="padding:14px;background:var(--bg2);border-radius:8px;text-align:center;margin-top:8px">
          <div style="font-size:13px;color:var(--text2)">
            Next: <strong style="color:var(--gold)">Reach 80+ overall rating</strong> — You're at ${calcRating(s.profile?.ratings||{})}%. Almost!
          </div>
        </div>
      </div>`);
  };

  // ── HIGHLIGHTS ───────────────────────────────────────────────
  const highlights = (s) => {
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>My highlights</div>
        <div style="text-align:center;padding:40px 20px;color:var(--text2)">
          <div style="font-size:48px;margin-bottom:12px">🎬</div>
          <div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:6px">Upload your highlights</div>
          <div style="font-size:13px;margin-bottom:20px;line-height:1.6">Share clips of your best moments.<br>Coaches and scouts can see your game.</div>
          <button class="btn btn-primary" onclick="HF_UTILS.toast('Video upload coming in the next version!','success')">
            📹 Upload video clip
          </button>
        </div>
      </div>`);
  };

  // ── MESSAGES ─────────────────────────────────────────────────
  const messages = (s) => {
    const threads = [
      { name:'Coach Darko',        msg:'Great session today. Keep pushing on that left foot.', time:'2h',  color:'#C9961A', unread:1 },
      { name:'HappyFeet Scout',    msg:'Trial opportunity — check this out when you can.',     time:'1d',  color:'#185FA5', unread:1 },
      { name:'Abena Sarpong',      msg:'Coming to practice tomorrow?',                         time:'2d',  color:'#1a7a2e', unread:1 },
    ];
    const { initials } = HF_UTILS;
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>Messages</div>
        ${threads.map(t => `
          <div class="msg-item" onclick="HF_UTILS.toast('Messaging coming soon!','success')">
            <div class="avatar avatar-md" style="background:${t.color}">${initials(t.name)}</div>
            <div style="flex:1">
              <div class="msg-name">${t.name}</div>
              <div class="msg-preview">${t.msg}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
              <div class="msg-time">${t.time}</div>
              ${t.unread ? `<div class="msg-unread">${t.unread}</div>` : ''}
            </div>
          </div>`).join('')}
      </div>`);
  };

  // ── FAITH ────────────────────────────────────────────────────
  const faith = (s) => {
    setMain(`
      <div class="faith-hero">
        <div style="font-size:32px;margin-bottom:10px">✝</div>
        <div style="font-size:20px;font-weight:700;margin-bottom:6px">Faith & Purpose</div>
        <div style="font-size:13px;opacity:.8;line-height:1.6">Your talent is God-given.<br>Your discipline is your worship.</div>
      </div>
      <div class="faith-verse-card">
        <div class="verse-text">"But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary."</div>
        <div class="verse-ref">Isaiah 40:31</div>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot faith"></div>Daily prayers for athletes</div>
        <div class="prayer-card">
          <div class="prayer-title">Morning prayer — before training</div>
          <div class="prayer-text">Lord, I come before You this morning with gratitude for the gift of health and the ability to compete. Strengthen my body, sharpen my mind, and guard me from injury today. Let every drop of sweat be an act of worship. Amen.</div>
        </div>
        <div class="prayer-card">
          <div class="prayer-title">Pre-match prayer</div>
          <div class="prayer-text">Father, as I step onto this pitch I surrender the outcome to You. Give me courage, clarity, and the strength to give everything I have. Let me play with joy, compete with integrity, and reflect Your grace. Thank You for this moment. Amen.</div>
        </div>
        <div class="prayer-card">
          <div class="prayer-title">When you're struggling</div>
          <div class="prayer-text">God, I don't understand this season. Injuries, setbacks, doubts — I bring them all to You. Your word says You work all things for good. Help me trust that. Renew my strength. I believe my breakthrough is coming. Amen.</div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-dot faith"></div>Scripture for every moment</div>
        ${[
          ['When you doubt yourself', '"For I know the plans I have for you," declares the LORD, "plans to prosper you and not to harm you." — Jeremiah 29:11'],
          ['Before a big match',     '"Have I not commanded you? Be strong and courageous. Do not be afraid." — Joshua 1:9'],
          ['On hard work',           '"Whatever you do, work at it with all your heart, as working for the Lord." — Colossians 3:23'],
          ['When injured',           '"He gives strength to the weary and increases the power of the weak." — Isaiah 40:29'],
        ].map(([title,verse]) => `
          <div style="padding:12px;background:var(--faith-lt);border-radius:8px;border-left:3px solid var(--faith);margin-bottom:8px">
            <div style="font-size:11px;font-weight:700;color:var(--faith);margin-bottom:4px">${title}</div>
            <div style="font-size:12px;color:var(--text2);font-style:italic;line-height:1.6">${verse}</div>
          </div>`).join('')}
      </div>`);
  };

  return { render };

})();

window.HF_PLAYER = HF_PLAYER;
