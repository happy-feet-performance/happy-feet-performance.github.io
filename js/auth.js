/**
 * HappyFeet Performance Hub — auth.js
 * ─────────────────────────────────────
 * Handles: login (email OR phone), 3-step signup,
 * role selection, session management, demo logins.
 * Depends on: db.js, utils.js, router.js
 */

const HF_AUTH = (() => {

  const { el, showError, hideError, toast, countryCodeSelect, COUNTRY_CODES } = HF_UTILS;

  // ─── State ─────────────────────────────────────────────────
  let state = {
    loginTab:  'email',   // 'email' | 'phone'
    signupTab: 'email',
    role:      '',
    signup:    {},        // accumulated across steps
  };

  // ─── Screens ───────────────────────────────────────────────
  const showScreen = (id) => {
    document.querySelectorAll('.auth-screen').forEach(s => s.classList.remove('active'));
    const scr = el(id);
    if (scr) scr.classList.add('active');
  };

  // ─── Tab toggle helper ─────────────────────────────────────
  const _applyTab = (tab, emailId, phoneId, tabEmailId, tabPhoneId) => {
    const isEmail = tab === 'email';
    el(emailId).style.display = isEmail ? 'block' : 'none';
    el(phoneId).style.display = isEmail ? 'none'  : 'block';
    [tabEmailId, tabPhoneId].forEach((id, i) => {
      const btn = el(id);
      if (!btn) return;
      const active = (i === 0) === isEmail;
      btn.classList.toggle('active', active);
    });
  };

  const switchLoginTab = (tab) => {
    state.loginTab = tab;
    _applyTab(tab, 'login-email-fields', 'login-phone-fields', 'ltab-email', 'ltab-phone');
  };

  const switchSignupTab = (tab) => {
    state.signupTab = tab;
    _applyTab(tab, 'su-email-fields', 'su-phone-fields', 'stab-email', 'stab-phone');
  };

  // ─── Role selection ────────────────────────────────────────
  const selectRole = (role) => {
    state.role = role;
    document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
    const card = el(`role-${role}`);
    if (card) card.classList.add('selected');
  };

  // ─── Step 1 → Step 2 ───────────────────────────────────────
  const goStep2 = () => {
    if (!state.role) { toast('Please choose your role to continue.', 'error'); return; }
    const titles = { player: 'Player registration', coach: 'Coach registration', scout: 'Scout registration' };
    const subs   = { player: 'Tell us about yourself as a player', coach: 'Tell us about your coaching background', scout: 'Tell us about your scouting experience' };
    el('signup-step2-title').textContent = titles[state.role];
    el('signup-step2-sub').textContent   = subs[state.role];
    _injectRoleFields(state.role);
    showScreen('screen-signup-info');
  };

  const _injectRoleFields = (role) => {
    const rf = el('signup-role-fields');
    if (!rf) return;
    const fields = {
      player: `
        <div class="form-row">
          <div class="fg">
            <label>Position</label>
            <select id="su-pos">
              <option value="">Select position</option>
              <option>GK</option><option>CB</option><option>LB</option><option>RB</option>
              <option>DM</option><option>CM</option><option>CAM</option>
              <option>LW</option><option>RW</option><option>ST</option>
            </select>
          </div>
          <div class="fg">
            <label>Age tier</label>
            <select id="su-tier">
              <option>U10</option><option>U12</option><option>U14</option><option>U16</option>
              <option>U18</option><option selected>U21</option><option>Professional</option>
            </select>
          </div>
        </div>
        <div class="fg"><label>Current club / academy</label><input type="text" id="su-club" placeholder="e.g. Kumasi Wolves FC"></div>
        <div class="fg"><label>Hometown / region</label><input type="text" id="su-hometown" placeholder="e.g. Kumasi, Ashanti"></div>`,

      coach: `
        <div class="form-row">
          <div class="fg">
            <label>Coaching licence</label>
            <select id="su-licence">
              <option>None yet</option><option>CAF D</option><option>CAF C</option>
              <option>CAF B</option><option>CAF A</option><option>UEFA Pro</option>
            </select>
          </div>
          <div class="fg">
            <label>Years experience</label>
            <input type="number" id="su-exp" min="0" placeholder="e.g. 5">
          </div>
        </div>
        <div class="fg"><label>Current club / academy</label><input type="text" id="su-club" placeholder="e.g. Accra Academy FC"></div>
        <div class="fg">
          <label>Specialisation</label>
          <select id="su-spec">
            <option>All-round</option><option>Goalkeeper</option><option>Defending</option>
            <option>Attacking</option><option>Set pieces</option><option>Fitness & conditioning</option>
          </select>
        </div>`,

      scout: `
        <div class="fg"><label>Organisation / agency</label><input type="text" id="su-org" placeholder="e.g. Independent / Agency name"></div>
        <div class="form-row">
          <div class="fg"><label>Region you cover</label><input type="text" id="su-region" placeholder="e.g. Ghana, West Africa"></div>
          <div class="fg"><label>Years experience</label><input type="number" id="su-exp" min="0" placeholder="e.g. 3"></div>
        </div>
        <div class="fg"><label>Target leagues / destinations</label><input type="text" id="su-dest" placeholder="e.g. Europe, USA, Gulf"></div>`,
    };
    rf.innerHTML = fields[role] || '';
  };

  // ─── Step 2 → Step 3 ───────────────────────────────────────
  const goStep3 = async () => {
    const name = el('su-name')?.value.trim();
    const pass = el('su-pass')?.value;
    hideError('signup-err');

    // Validate name
    if (!name) { showError('signup-err', 'Please enter your full name.'); return; }
    if (pass?.length < 6) { showError('signup-err', 'Password must be at least 6 characters.'); return; }

    // Collect contact
    let contact = '', contactType = '', localPhone = '', displayContact = '';
    if (state.signupTab === 'email') {
      contact = el('su-email')?.value.trim().toLowerCase();
      if (!contact || !contact.includes('@')) {
        showError('signup-err', 'Please enter a valid email address.'); return;
      }
      contactType = 'email';
      displayContact = contact;
    } else {
      const code = el('su-country-code')?.value || '+233';
      const num  = el('su-phone')?.value.trim().replace(/\s/g, '');
      if (!num || num.length < 6) {
        showError('signup-err', 'Please enter a valid phone number.'); return;
      }
      contact = code + num;
      localPhone = num;
      contactType = 'phone';
      displayContact = `${code} ${num}`;
    }

    // Collect role profile
    let profile = {};
    if (state.role === 'player') {
      profile = {
        pos: el('su-pos')?.value || '',
        tier: el('su-tier')?.value || 'U21',
        club: el('su-club')?.value.trim() || '',
        hometown: el('su-hometown')?.value.trim() || '',
        ratings: { speed: 60, tech: 60, tact: 55, phys: 60 },
        faithStreak: 0,
      };
    } else if (state.role === 'coach') {
      profile = {
        licence: el('su-licence')?.value || '',
        exp: el('su-exp')?.value || '0',
        club: el('su-club')?.value.trim() || '',
        spec: el('su-spec')?.value || 'All-round',
        teamSize: 0,
      };
    } else {
      profile = {
        org: el('su-org')?.value.trim() || '',
        region: el('su-region')?.value.trim() || '',
        exp: el('su-exp')?.value || '0',
        dest: el('su-dest')?.value.trim() || '',
        prospectsTracked: 0,
      };
    }

    state.signup = { name, contact, localPhone, contactType, displayContact, password: pass, role: state.role, profile };

    // Build confirm screen
    const icons = { player: '⚽', coach: '📋', scout: '🔭' };
    const contactLine = contactType === 'phone'
      ? `<strong>Phone:</strong> ${displayContact}`
      : `<strong>Email:</strong> ${displayContact}`;
    const summaryRows = {
      player: `<strong>Name:</strong> ${name}<br>${contactLine}<br><strong>Role:</strong> Player<br><strong>Position:</strong> ${profile.pos || '—'}<br><strong>Tier:</strong> ${profile.tier}<br><strong>Club:</strong> ${profile.club || '—'}`,
      coach:  `<strong>Name:</strong> ${name}<br>${contactLine}<br><strong>Role:</strong> Coach<br><strong>Licence:</strong> ${profile.licence}<br><strong>Club:</strong> ${profile.club || '—'}`,
      scout:  `<strong>Name:</strong> ${name}<br>${contactLine}<br><strong>Role:</strong> Scout<br><strong>Organisation:</strong> ${profile.org || '—'}<br><strong>Region:</strong> ${profile.region || '—'}`,
    };
    el('confirm-icon').textContent  = icons[state.role];
    el('confirm-title').textContent = `You're set, ${name.split(' ')[0]}!`;
    el('confirm-sub').textContent   = { player: 'Your player account is ready.', coach: 'Your coach account is ready.', scout: 'Your scout account is ready.' }[state.role];
    el('confirm-summary').innerHTML = summaryRows[state.role];
    showScreen('screen-signup-confirm');
  };

  // ─── Complete signup ────────────────────────────────────────
  const completeSignup = async () => {
    const result = await HF_DB.createUser(state.signup);
    if (result.error) { toast(result.error, 'error'); showScreen('screen-signup-info'); return; }
    const session = _makeSession(result.user);
    HF_DB.saveSession(session);
    HF_ROUTER.launch(session);
  };

  // ─── Login ─────────────────────────────────────────────────
  const handleLogin = async () => {
    const pass = el('login-pass')?.value;
    hideError('login-err');
    let contact = '';

    if (state.loginTab === 'email') {
      contact = el('login-email')?.value.trim().toLowerCase();
      if (!contact) { showError('login-err', 'Please enter your email address.'); return; }
    } else {
      const code = el('login-country-code')?.value || '+233';
      const num  = el('login-phone')?.value.trim().replace(/\s/g, '');
      if (!num) { showError('login-err', 'Please enter your phone number.'); return; }
      contact = code + num;
    }

    if (!pass) { showError('login-err', 'Please enter your password.'); return; }

    const user = await HF_DB.findUser(contact, pass);
    if (!user) {
      showError('login-err', state.loginTab === 'phone'
        ? 'Phone number or password incorrect. Check your country code.'
        : 'Email or password incorrect.');
      return;
    }
    hideError('login-err');
    const session = _makeSession(user);
    HF_DB.saveSession(session);
    HF_ROUTER.launch(session);
  };

  // ─── Demo login ────────────────────────────────────────────
  const demoLogin = (role) => {
    const demos = {
      player: { userId: 'demo-player', role: 'player', name: 'Kwame Asante',       contact: 'kwame@happyfeet.com',  contactType: 'email', displayContact: 'kwame@happyfeet.com',  profile: { pos: 'CAM', tier: 'U21', club: 'Accra Lions FC', hometown: 'Accra, Greater Accra', ratings: { speed: 82, tech: 88, tact: 71, phys: 68 }, faithStreak: 5 } },
      coach:  { userId: 'demo-coach',  role: 'coach',  name: 'Coach E. Darko',     contact: 'coach@happyfeet.com', contactType: 'email', displayContact: 'coach@happyfeet.com', profile: { licence: 'CAF B', exp: '8', club: 'Kumasi Academy FC', spec: 'All-round', teamSize: 22 } },
      scout:  { userId: 'demo-scout',  role: 'scout',  name: 'Abena Mensah',       contact: '+233244000123',        contactType: 'phone', displayContact: '+233 244 000 123',   profile: { org: 'HappyFeet Scouting', region: 'Ghana, West Africa', exp: '5', dest: 'Europe, USA', prospectsTracked: 24 } },
    };
    const session = demos[role];
    HF_DB.saveSession(session);
    HF_ROUTER.launch(session);
  };

  // ─── Session helper ────────────────────────────────────────
  const _makeSession = (user) => ({
    userId:       user.id,
    role:         user.role,
    name:         user.name,
    contact:      user.contact,
    contactType:  user.contactType,
    displayContact: user.displayContact || user.contact,
    profile:      user.profile,
  });

  const logout = () => {
    HF_DB.clearSession();
    document.getElementById('app-shell').classList.remove('visible');
    document.getElementById('auth-screens').style.display = 'flex';
    showScreen('screen-login');
  };

  // ─── Expose to window (called from onclick) ─────────────────
  return {
    showScreen, switchLoginTab, switchSignupTab,
    selectRole, goStep2, goStep3, completeSignup,
    handleLogin, demoLogin, logout,
  };

})();

window.HF_AUTH = HF_AUTH;
// Also expose individual methods as globals for onclick= handlers
const { showScreen, selectRole } = HF_AUTH;
