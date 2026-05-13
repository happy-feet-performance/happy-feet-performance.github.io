/**
 * HappyFeet Performance Hub — router.js
 * ────────────────────────────────────────
 * Handles: session validation, role routing, app shell setup,
 * sidenav rendering, view switching, mobile nav.
 * 
 * Route protection: every view switch checks session role.
 * Wrong role = redirected to their own dashboard.
 * No role = sent to login.
 *
 * To add a new role:
 *  1. Add demo in auth.js
 *  2. Add sidenav config below
 *  3. Create /js/dashboards/newrole.js
 *  4. Import it in index.html
 */

const HF_ROUTER = (() => {

  const { el, setHTML, setText, avatarColor, initials, toast } = HF_UTILS;

  // ─── Sidenav configs per role ───────────────────────────────
  const NAVS = {
    player: [
      { section: 'My journey' },
      { view: 'dashboard',     icon: '🏠', label: 'Dashboard' },
      { view: 'profile',       icon: '👤', label: 'My profile' },
      { view: 'stats',         icon: '📊', label: 'My stats' },
      { view: 'training',      icon: '📋', label: 'Training plan' },
      { view: 'health',        icon: '🩺', label: 'Health log' },
      { section: 'Progress' },
      { view: 'achievements',  icon: '🏆', label: 'Achievements' },
      { view: 'highlights',    icon: '🎬', label: 'Highlights' },
      { section: 'Community' },
      { view: 'messages',      icon: '💬', label: 'Messages', badge: '3', badgeColor: 'var(--red)' },
      { view: 'faith',         icon: '✝',  label: 'Faith & purpose', faithNav: true },
    { section: 'Discover' },
    { view: 'findmyteam',    icon: '🗺️', label: 'Find my team' },
    ],
    coach: [
      { section: 'Management' },
      { view: 'dashboard',     icon: '🏠', label: 'Dashboard' },
      { view: 'profile',       icon: '👤', label: 'My profile' },
      { view: 'squad',         icon: '👥', label: 'Squad' },
      { view: 'training',      icon: '📋', label: 'Session builder' },
      { view: 'tracking',      icon: '📊', label: 'Player tracking' },
      { section: 'Tools' },
      { view: 'health',        icon: '🩺', label: 'Health & wellness' },
      { view: 'recruitment',   icon: '🔍', label: 'Recruitment' },
      { view: 'messages',      icon: '💬', label: 'Messages', badge: '5', badgeColor: 'var(--red)' },
      { view: 'faith',         icon: '✝',  label: 'Team devotion', faithNav: true },
    { section: 'Discover' },
    { view: 'findmyteam',    icon: '🗺️', label: 'Find my team' },
    ],
    scout: [
      { section: 'Scouting' },
      { view: 'dashboard',     icon: '🏠', label: 'Dashboard' },
      { view: 'profile',       icon: '👤', label: 'My profile' },
      { view: 'discover',      icon: '🔍', label: 'Discover talent' },
      { view: 'prospects',     icon: '⭐', label: 'Saved prospects', badge: '4', badgeColor: 'var(--gold)' },
      { view: 'pipeline',      icon: '📈', label: 'Pipeline' },
      { section: 'Reports' },
      { view: 'reports',       icon: '📄', label: 'Scout reports' },
      { view: 'clubs',         icon: '🏟️', label: 'Club network' },
      { view: 'placements',    icon: '✅', label: 'Placements' },
      { view: 'messages',      icon: '💬', label: 'Messages' },
    { section: 'Discover' },
    { view: 'findmyteam',    icon: '🗺️', label: 'Find my team' },
    ],
  };

  // ─── Role accent colours ────────────────────────────────────
  const ROLE_COLORS = { player: '#1a7a2e', coach: '#C9961A', scout: '#185FA5' };

  // ─── Launch app after login/signup ─────────────────────────
  const launch = (session) => {
    // Hide auth, show shell
    document.getElementById('auth-screens').style.display = 'none';
    const shell = el('app-shell');
    shell.classList.add('visible');
    shell.className = `app-shell visible role-${session.role}`;

    // Topbar
    const rolePill = el('topbar-role-pill');
   rolePill.textContent = session.role.charAt(0).toUpperCase() + session.role.slice(1);
   
   const nameDisplay = el('topbar-name-display');
   if (nameDisplay) nameDisplay.textContent = session.name;

    // Build sidenav
    _buildSidenav(session);

    // Route to dashboard
    _routeTo('dashboard', session);
  };

  // ─── Build sidenav ─────────────────────────────────────────
  const _buildSidenav = (session) => {
    const nav = el('sidenav');
    const items = NAVS[session.role] || [];
    nav.innerHTML = items.map(item => {
      if (item.section) return `<div class="sidenav-section">${item.section}</div>`;
      const badgeHTML = item.badge
        ? `<span class="nav-badge" style="background:rgba(0,0,0,.1);color:${item.badgeColor||'var(--gold)'};">${item.badge}</span>`
        : '';
      const faithClass = item.faithNav ? ' faith-nav' : '';
      return `<div class="nav-item${faithClass}" data-view="${item.view}" onclick="HF_ROUTER.navTo('${item.view}',this)">
        <div class="nav-icon">${item.icon}</div>
        <span>${item.label}</span>
        ${badgeHTML}
      </div>`;
    }).join('');

    // Footer with user info
    nav.innerHTML += `
      <div class="sidenav-footer">
        <div class="avatar avatar-sm" style="background:${ROLE_COLORS[session.role]||'#C9961A'}">${initials(session.name)}</div>
        <div>
          <div class="sidenav-footer-name">${session.name}</div>
          <div class="sidenav-footer-role">${session.contactType === 'phone' ? '📱' : '📧'} ${session.displayContact || session.contact}</div>
        </div>
      </div>`;
  };

  // ─── Navigate to a view ─────────────────────────────────────
  const navTo = (view, el_) => {
    const session = HF_DB.getSession();
    if (!session) { HF_AUTH.logout(); return; }

    // Update sidenav active state
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if (el_) el_.classList.add('active');
    else {
      const match = document.querySelector(`.nav-item[data-view="${view}"]`);
      if (match) match.classList.add('active');
    }

    // Close mobile nav
    _closeMobileNav();

    // Route to role dashboard renderer
    _routeTo(view, session);
  };

  const _routeTo = (view, session) => {
    const handlers = {
      player: window.HF_PLAYER,
      coach:  window.HF_COACH,
      scout:  window.HF_SCOUT,
    };
    const handler = handlers[session.role];
    if (!handler) { toast('Dashboard not found for this role.', 'error'); return; }
    handler.render(view, session);
  };

  // ─── Mobile nav ─────────────────────────────────────────────
  const toggleMobileNav = () => {
    const nav = el('sidenav');
    const overlay = el('nav-overlay');
    nav.classList.toggle('open');
    overlay.classList.toggle('open');
  };
  const _closeMobileNav = () => {
    el('sidenav')?.classList.remove('open');
    el('nav-overlay')?.classList.remove('open');
  };

  // ─── Boot — check session on page load ─────────────────────
  const boot = () => {
    const session = HF_DB.getSession();
    if (session) {
      document.getElementById('auth-screens').style.display = 'none';
      launch(session);
    } else {
      document.getElementById('auth-screens').style.display = 'flex';
      HF_AUTH.showScreen('screen-login');
    }
  };

  return { launch, navTo, toggleMobileNav, boot };

})();

window.HF_ROUTER = HF_ROUTER;

document.addEventListener('DOMContentLoaded',()=>HF_ROUTER.boot());
