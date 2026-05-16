/**
 * HappyFeet Performance Hub: auth.js
 * ─────────────────────────────────────
 * Handles: login (email OR phone), 3-step signup,
 * role selection, session management.
 * Depends on: db.js, utils.js, router.js
 */

const HF_AUTH = (() => {
  const { el, showError, hideError, toast, countryCodeSelect, COUNTRY_CODES } =
    HF_UTILS;

  // ─── State ─────────────────────────────────────────────────
  let state = {
    loginTab: "email", // 'email' | 'phone'
    signupTab: "email",
    role: "",
    signup: {}, // accumulated across steps
  };

  // ─── Screens ───────────────────────────────────────────────
  const showScreen = (id) => {
    document
      .querySelectorAll(".auth-screen")
      .forEach((s) => s.classList.remove("active"));
    const scr = el(id);
    if (scr) scr.classList.add("active");
  };

  // ─── Tab toggle helper ─────────────────────────────────────
  const _applyTab = (tab, emailId, phoneId, tabEmailId, tabPhoneId) => {
    const isEmail = tab === "email";
    el(emailId).style.display = isEmail ? "block" : "none";
    el(phoneId).style.display = isEmail ? "none" : "block";
    [tabEmailId, tabPhoneId].forEach((id, i) => {
      const btn = el(id);
      if (!btn) return;
      const active = (i === 0) === isEmail;
      btn.classList.toggle("active", active);
    });
  };

  const switchLoginTab = (tab) => {
    state.loginTab = tab;
    _applyTab(
      tab,
      "login-email-fields",
      "login-phone-fields",
      "ltab-email",
      "ltab-phone",
    );
  };

  const switchSignupTab = (tab) => {
    state.signupTab = tab;
    _applyTab(
      tab,
      "su-email-fields",
      "su-phone-fields",
      "stab-email",
      "stab-phone",
    );
  };

  // ─── Role selection ────────────────────────────────────────
  const selectRole = (role) => {
    state.role = role;
    document
      .querySelectorAll(".role-card")
      .forEach((c) => c.classList.remove("selected"));
    const card = el(`role-${role}`);
    if (card) card.classList.add("selected");
  };

  // ─── Step 1 → Step 2 ───────────────────────────────────────
  const goStep2 = () => {
    if (!state.role) {
      toast("Please choose your role to continue.", "error");
      return;
    }

    document.querySelectorAll(".step-row").forEach((row) => {
      if (state.role === "coach") {
        if (!row.querySelector(".step:nth-child(4)")) {
          row.innerHTML += '<div class="step"></div>';
        }
      }
    });

    const titles = {
      player: "Player registration",
      coach: "Coach registration",
      scout: "Scout registration",
    };
    const subs = {
      player: "Tell us about yourself as a player",
      coach: "Tell us about your coaching background",
      scout: "Tell us about your scouting experience",
    };
    el("signup-step2-title").textContent = titles[state.role];
    el("signup-step2-sub").textContent = subs[state.role];
    _injectRoleFields(state.role);
    showScreen("screen-signup-info");
  };

  const _injectRoleFields = (role) => {
    const rf = el("signup-role-fields");
    if (!rf) return;
    const fields = {
      player: `
        <div class="form-row">
          <div class="fg">
            <label class="required">Position</label>
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
        <div class="fg">
          <label class="required">Hometown / region</label>
          <input type="text" id="su-hometown" placeholder="e.g. Kumasi, Ashanti">
        </div>`,

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
            <input type="number" id="su-exp" min="0" max="50" placeholder="e.g. 5">
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
        <div class="fg">
          <label class="required">Organisation / agency</label>
          <input type="text" id="su-org" placeholder="e.g. Independent / Agency name">
        </div>
        <div class="form-row">
          <div class="fg">
            <label class="required">Years experience</label>
            <input type="number" id="su-exp" min="0" max="50" placeholder="e.g. 3">
          </div>
        </div>`,
    };
    rf.innerHTML = fields[role] || "";
  };

  // ─── Step 2 → Step 3 ───────────────────────────────────────
  const goStep3 = async () => {
    const name = el("su-name")?.value.trim();
    const pass = el("su-pass")?.value;
    hideError("signup-err");

    if (!name) {
      showError("signup-err", "Please enter your full name.");
      return;
    }

    let contact = "",
      contactType = "",
      localPhone = "",
      displayContact = "";
    if (state.signupTab === "email") {
      contact = el("su-email")?.value.trim().toLowerCase();
      if (!contact || !contact.includes("@") || !contact.includes(".")) {
        showError("signup-err", "Please enter a valid email address.");
        return;
      }
      contactType = "email";
      displayContact = contact;
    } else {
      const code = el("su-country-code")?.value || "+233";
      const num = el("su-phone")?.value.trim().replace(/\s/g, "");
      if (!num || num.length < 6) {
        showError("signup-err", "Please enter a valid phone number.");
        return;
      }
      contact = code + num;
      localPhone = num;
      contactType = "phone";
      displayContact = `${code} ${num}`;
    }

    if (!pass || pass.length < 6) {
      showError("signup-err", "Password must be at least 6 characters.");
      return;
    }

    let profile = {};
    if (state.role === "player") {
      profile = {
        pos: el("su-pos")?.value || "",
        tier: el("su-tier")?.value || "U21",
        hometown: el("su-hometown")?.value.trim() || "",
        status: "unattached",
        club: null,
        ratings: { speed: 0, tech: 0, tact: 0, phys: 0 },
        faithStreak: 0,
      };
      if (!profile.pos) {
        showError("signup-err", "Please select your position.");
        return;
      }
      if (!profile.hometown) {
        showError("signup-err", "Please enter your hometown or region.");
        return;
      }
    } else if (state.role === "coach") {
      profile = {
        licence: el("su-licence")?.value || "",
        exp: el("su-exp")?.value || "",
        club: el("su-club")?.value.trim() || "",
        spec: el("su-spec")?.value || "All-round",
        teamSize: 0,
      };
      if (!profile.licence) {
        showError("signup-err", "Please select your coaching licence.");
        return;
      }
      if (profile.exp === "") {
        showError("signup-err", "Please enter your years of experience.");
        return;
      }
      if (parseInt(profile.exp) < 0 || parseInt(profile.exp) > 50) {
        showError(
          "signup-err",
          "Years of experience must be between 0 and 50.",
        );
        return;
      }
      if (parseInt(profile.exp) < 0 || parseInt(profile.exp) > 50) {
        showError(
          "signup-err",
          "Years of experience must be between 0 and 50.",
        );
        return;
      }
      if (!profile.club) {
        showError("signup-err", "Please enter your current club or academy.");
        return;
      }

      const existingTeam = await HF_DB.checkTeamExists(profile.club);
      if (existingTeam) {
        showError(
          "signup-err",
          existingTeam.status === "verified"
            ? `"${profile.club}" is already registered on HappyFeet. If you are the coach, please contact support.`
            : `A verification request for "${profile.club}" is already pending. If you are the coach, please contact support.`,
        );
        return;
      }
      if (!profile.licence) {
        showError("signup-err", "Please select your coaching licence.");
        return;
      }
      if (!profile.exp) {
        showError("signup-err", "Please enter your years of experience.");
        return;
      }
      if (!profile.club) {
        showError("signup-err", "Please enter your current club or academy.");
        return;
      }
    } else {
      profile = {
        org: el("su-org")?.value.trim() || "",
        exp: el("su-exp")?.value || "",
        prospectsTracked: 0,
      };
      if (!profile.org) {
        showError("signup-err", "Please enter your organisation or agency.");
        return;
      }
      if (!profile.exp) {
        showError("signup-err", "Please enter your years of experience.");
        return;
      }
      if (parseInt(profile.exp) < 0 || parseInt(profile.exp) > 50) {
        showError(
          "signup-err",
          "Years of experience must be between 0 and 50.",
        );
        return;
      }
    }

    const hashedPassword = await HF_UTILS.hashPassword(pass);
    state.signup = {
      name,
      contact,
      localPhone,
      contactType,
      displayContact,
      password: hashedPassword,
      role: state.role,
      profile,
    };

    // Build confirm screen
    const icons = {
      player: '<i class="ti ti-ball-football"></i>',
      coach: '<i class="ti ti-clipboard-list"></i>',
      scout: '<i class="ti ti-search"></i>',
    };
    const contactLine =
      contactType === "phone"
        ? `<strong>Phone:</strong> ${displayContact}`
        : `<strong>Email:</strong> ${displayContact}`;
    const summaryRows = {
      player: `<strong>Name:</strong> ${name}<br>${contactLine}<br><strong>Role:</strong> Player<br><strong>Position:</strong> ${profile.pos || "-"}<br><strong>Tier:</strong> ${profile.tier}<br><strong>Hometown:</strong> ${profile.hometown || "-"}`,
      coach: `<strong>Name:</strong> ${name}<br>${contactLine}<br><strong>Role:</strong> Coach<br><strong>Licence:</strong> ${profile.licence}<br><strong>Club:</strong> ${profile.club || "-"}`,
      scout: `<strong>Name:</strong> ${name}<br>${contactLine}<br><strong>Role:</strong> Scout<br><strong>Organisation:</strong> ${profile.org || "-"}`,
    };
    el("confirm-icon").innerHTML = icons[state.role];
    el("confirm-title").textContent = `You're set, ${name.split(" ")[0]}!`;
    el("confirm-sub").textContent = {
      player: "Your player account is ready.",
      coach: "Your coach account is ready.",
      scout: "Your scout account is ready.",
    }[state.role];
    el("confirm-summary").innerHTML = summaryRows[state.role];
    showScreen("screen-signup-confirm");
  };

  // ─── Complete signup ────────────────────────────────────────
  const completeSignup = async () => {
    const result = await HF_DB.createUser(state.signup);
    if (result.error) {
      toast(result.error, "error");
      showScreen("screen-signup-info");
      return;
    }

    const session = _makeSession(result.user);
    HF_DB.saveSession(session);
    if (state.signup.role === "player") {
      await HF_DB.updateLoginStreak(session.userId);
    }
    state.newUserId = result.user.id;

    if (state.signup.role === "coach") {
      const clubInput = el("sq-team");
      const regionInput = el("sq-region");
      if (clubInput) {
        clubInput.value = state.signup.profile.club || "";
        clubInput.readOnly = true;
        clubInput.style.opacity = "0.6";
        clubInput.style.cursor = "not-allowed";
      }
      showScreen("screen-squad-verify");
    } else if (state.signup.role === "scout") {
      const agencyInput = el("ag-name");
      if (agencyInput) {
        agencyInput.value = state.signup.profile.org || "";
      }
      showScreen("screen-agency-verify");
    } else {
      HF_ROUTER.launch(session);
    }
  };

  // ─── Login ─────────────────────────────────────────────────
  const handleLogin = async () => {
    const pass = el("login-pass")?.value;
    hideError("login-err");
    let contact = "";

    if (state.loginTab === "email") {
      contact = el("login-email")?.value.trim().toLowerCase();
      if (!contact) {
        showError("login-err", "Please enter your email address.");
        return;
      }
    } else {
      const code = el("login-country-code")?.value || "+233";
      const num = el("login-phone")?.value.trim().replace(/\s/g, "");
      if (!num) {
        showError("login-err", "Please enter your phone number.");
        return;
      }
      contact = code + num;
    }

    if (!pass) {
      showError("login-err", "Please enter your password.");
      return;
    }

    const hashedPassword = await HF_UTILS.hashPassword(pass);
    const user = await HF_DB.findUser(contact, hashedPassword);
    if (!user) {
      showError(
        "login-err",
        state.loginTab === "phone"
          ? "Phone number or password incorrect. Check your country code."
          : "Email or password incorrect.",
      );
      return;
    }

    if (user.banned) {
      showError(
        "login-err",
        `Your account has been banned. ${user.banReason ? "Reason: " + user.banReason : "Please contact support."}`,
      );
      return;
    }

    if (
      user.kicked &&
      user.kickedUntil &&
      new Date(user.kickedUntil) > new Date()
    ) {
      const until = new Date(user.kickedUntil).toLocaleTimeString();
      showError(
        "login-err",
        `You have been kicked and cannot sign in until ${until}.`,
      );
      return;
    }

    hideError("login-err");
    const session = _makeSession(user);
    HF_DB.saveSession(session);
    if (session.role === "player") {
      await HF_DB.updateLoginStreak(session.userId);
    }
    HF_ROUTER.launch(session);
  };

  // ─── Session helper ────────────────────────────────────────
  const _makeSession = (user) => ({
    userId: user.id,
    role: user.role,
    name: user.name,
    contact: user.contact,
    contactType: user.contactType,
    displayContact: user.displayContact || user.contact,
    profile: user.profile,
    squadStatus: user.squadStatus || "unregistered",
    agencyStatus: user.agencyStatus || "unregistered",
    created: user.created,
  });

  const logout = () => {
    HF_DB.clearSession();
    HF_ROUTER.resetSubscriptions();
    [
      "login-email",
      "login-pass",
      "login-phone",
      "su-name",
      "su-email",
      "su-pass",
      "su-phone",
      "admin-email",
      "admin-pass",
    ].forEach((id) => {
      const field = document.getElementById(id);
      if (field) field.value = "";
    });

    document.getElementById("app-shell").classList.remove("visible");
    document.getElementById("auth-screens").style.display = "flex";
    showScreen("screen-login");
  };

  const checkPassword = (val) => {
    const fill = document.getElementById("password-strength-fill");
    const label = document.getElementById("password-strength-label");
    if (!fill || !label) return;

    let strength = 0;
    if (val.length >= 6) strength++;
    if (val.length >= 10) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;

    const levels = [
      { width: "0%", color: "transparent", text: "" },
      { width: "25%", color: "var(--red)", text: "Weak" },
      { width: "50%", color: "var(--red)", text: "Fair" },
      { width: "75%", color: "var(--gold)", text: "Good" },
      { width: "90%", color: "var(--green)", text: "Strong" },
      { width: "100%", color: "var(--green)", text: "Very strong" },
    ];

    const level = levels[strength];
    fill.style.width = level.width;
    fill.style.background = level.color;
    label.textContent = level.text;
    label.style.color = level.color;
  };

  const submitSquadVerification = async () => {
    const teamName = el("sq-team")?.value.trim();
    const league = el("sq-league")?.value.trim();
    const year = el("sq-year")?.value.trim();
    const ground = el("sq-ground")?.value.trim();
    hideError("squad-err");

    if (!teamName) {
      showError("squad-err", "Please enter your team name.");
      return;
    }
    if (!league) {
      showError("squad-err", "Please enter your league or division.");
      return;
    }
    if (
      year &&
      (parseInt(year) < 1600 || parseInt(year) > new Date().getFullYear())
    ) {
      showError(
        "squad-err",
        `Founding year must be between 1600 and ${new Date().getFullYear()}.`,
      );
      return;
    }

    // check if team already exists
    const existing = await HF_DB.checkTeamExists(teamName);
    if (existing) {
      showError(
        "squad-err",
        existing.status === "verified"
          ? `"${teamName}" is already registered and verified. If you are the coach, please contact support.`
          : `A verification request for "${teamName}" is already pending.`,
      );
      return;
    }

    const session = HF_DB.getSession();

    // update coach profile with potentially new team name
    const updatedProfile = { ...session.profile, club: teamName };
    await HF_DB.updateUserProfile(session.userId, updatedProfile);
    session.profile = updatedProfile;
    HF_DB.saveSession(session);

    const result = await HF_DB.submitSquadVerification({
      coachId: session.userId,
      teamName,
      league,
      foundingYear: year,
      homeGround: ground,
    });

    if (result.error) {
      showError("squad-err", result.error);
      return;
    }

    await HF_DB.updateSquadStatus(session.userId, "pending");
    session.squadStatus = "pending";
    HF_DB.saveSession(session);

    showScreen("screen-squad-pending");
  };

  const enterWithPendingSquad = () => {
    const session = HF_DB.getSession();
    HF_ROUTER.launch(session);
  };

  const handleAdminLogin = async () => {
    const email = el("admin-email")?.value.trim().toLowerCase();
    const pass = el("admin-pass")?.value;
    hideError("admin-err");

    if (!email) {
      showError("admin-err", "Please enter your email.");
      return;
    }
    if (!pass) {
      showError("admin-err", "Please enter your password.");
      return;
    }

    const hashedPassword = await HF_UTILS.hashPassword(pass);
    const user = await HF_DB.findUser(email, hashedPassword);

    if (!user || user.role !== "admin") {
      showError("admin-err", "Invalid email or password.");
      return;
    }

    const session = _makeSession(user);
    HF_DB.saveSession(session);
    await HF_DB.updateLoginStreak(session.userId);
    HF_ROUTER.launch(session);
  };

  const toggleTag = (btn, containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    btn.classList.toggle("selected");

    if (btn.classList.contains("selected")) {
      btn.style.display = "none";

      const tag = document.createElement("span");
      tag.style.cssText = `font-family:var(--font-head);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:3px 8px;background:var(--gold);color:#0f0f0d;display:inline-flex;align-items:center;gap:4px;`;
      tag.dataset.value = btn.dataset.value;
      tag.innerHTML = `${btn.dataset.value} <span 
      style="cursor:pointer;font-size:12px;font-weight:700;" 
      onclick="
        this.parentElement.remove();
        const b = document.querySelector('[data-value=\\'${btn.dataset.value}\\']');
        if(b){b.classList.remove('selected');b.style.display='';}
      ">×</span>`;
      container.appendChild(tag);
    } else {
      btn.style.display = "";
      const existing = [...container.children].find(
        (t) => t.dataset.value === btn.dataset.value,
      );
      if (existing) existing.remove();
    }
  };

  const getSelectedTags = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return [];
    return [...container.children].map((t) => t.dataset.value).filter(Boolean);
  };

  const isValidWebsite = (url) => {
    if (!url) return true;
    const withProtocol =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;

    try {
      const parsed = new URL(withProtocol);
      const hostname = parsed.hostname;
      const validHostname =
        /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/.test(
          hostname,
        );

      return validHostname;
    } catch {
      return false;
    }
  };

  const submitAgencyVerification = async () => {
    const agencyName = document.getElementById("ag-name")?.value.trim();
    const website = document.getElementById("ag-website")?.value.trim();
    const regionsCovered = getSelectedTags("ag-regions-container");
    const targetLeagues = getSelectedTags("ag-leagues-container");
    hideError("agency-err");

    if (!agencyName) {
      showError("agency-err", "Please enter your agency name.");
      return;
    }
    if (regionsCovered.length === 0) {
      showError("agency-err", "Please select at least one region.");
      return;
    }
    if (targetLeagues.length === 0) {
      showError("agency-err", "Please select at least one target league.");
      return;
    }
    if (!website) {
      showError("agency-err", "Please enter your agency website.");
      return;
    }
    if (!isValidWebsite(website)) {
      showError("agency-err", "Please enter a valid website URL.");
      return;
    }

    const session = HF_DB.getSession();
    const result = await HF_DB.submitAgencyVerification({
      scoutId: session.userId,
      agencyName,
      regionsCovered,
      targetLeagues,
      website,
    });

    if (result.error) {
      showError("agency-err", result.error);
      return;
    }

    await HF_DB.updateAgencyStatus(session.userId, "pending");
    session.agencyStatus = "pending";
    HF_DB.saveSession(session);

    showScreen("screen-agency-pending");
  };

  const enterWithPendingAgency = () => {
    const session = HF_DB.getSession();
    HF_ROUTER.launch(session);
  };

  // ─── Expose to window (called from onclick) ─────────────────
  return {
    showScreen,
    switchLoginTab,
    switchSignupTab,
    selectRole,
    goStep2,
    goStep3,
    completeSignup,
    handleLogin,
    handleAdminLogin,
    logout,
    checkPassword,
    submitSquadVerification,
    enterWithPendingSquad,
    submitAgencyVerification,
    enterWithPendingAgency,
    toggleTag,
    getSelectedTags,
  };
})();

// Allow enter key to trigger main actions
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;

  const activeScreen = document.querySelector(".auth-screen.active");
  if (!activeScreen) return;

  const screenId = activeScreen.id;

  switch (screenId) {
    case "screen-login":
      HF_AUTH.handleLogin();
      break;
    case "screen-admin-login":
      HF_AUTH.handleAdminLogin();
      break;
    case "screen-signup-role":
      HF_AUTH.goStep2();
      break;
    case "screen-signup-info":
      HF_AUTH.goStep3();
      break;
    case "screen-signup-confirm":
      HF_AUTH.completeSignup();
      break;
    case "screen-squad-verify":
      HF_AUTH.submitSquadVerification();
      break;
    case "screen-squad-pending":
      HF_AUTH.enterWithPendingSquad();
      break;
  }
});

window.HF_AUTH = HF_AUTH;
const { showScreen, selectRole } = HF_AUTH;
