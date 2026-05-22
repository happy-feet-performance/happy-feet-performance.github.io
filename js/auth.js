/**
 * HappyFeet Performance Hub: auth.js
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
    document.getElementById(id)?.classList.add("active");

    // reset forgot password flow when navigating to it
    if (id === "screen-forgot") {
      document.getElementById("forgot-step-1").style.display = "block";
      document.getElementById("forgot-step-2").style.display = "none";
      document.getElementById("forgot-step-3").style.display = "none";
      document.getElementById("forgot-contact").value = "";
      document.getElementById("forgot-answer").value = "";
      document.getElementById("forgot-new-pass").value = "";
      document.getElementById("forgot-confirm-pass").value = "";
      hideError("forgot-err");
      hideError("forgot-err-2");
      hideError("forgot-err-3");
      window._forgotContact = null;
      window._forgotUserId = null;
    }
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
          <label class="required">Organisation / Agency</label>
          <input type="text" id="su-org" placeholder="e.g. Independent / Agency name">
        </div>
        <div class="form-row">
          <div class="fg">
            <label class="required">Years experience</label>
            <input type="number" id="su-exp" min="0" max="50" placeholder="e.g. 3">
          </div>
          <div class="fg">
            <label class="required">Home region</label>
            <select id="su-region">
              <option value="">Select region</option>
              <option>Ghana</option>
              <option>Nigeria</option>
              <option>Senegal</option>
              <option>Ivory Coast</option>
              <option>Cameroon</option>
              <option>Kenya</option>
              <option>South Africa</option>
              <option>Egypt</option>
              <option>Morocco</option>
              <option>West Africa</option>
              <option>East Africa</option>
              <option>North Africa</option>
              <option>Other</option>
            </select>
          </div>
        </div>`,
    };
    rf.innerHTML = fields[role] || "";
  };

  // ─── Step 2 → Step 3 ───────────────────────────────────────
  const goStep3 = async () => {
    document.getElementById("nav-overlay")?.classList.remove("open");
    document.getElementById("sidenav")?.classList.remove("open");
    const name = el("su-name")?.value.trim();
    const pass = el("su-pass")?.value;
    if (!pass) {
      showError("signup-err", "Please enter a password.");
      return;
    }
    if (pass.length < 6) {
      showError("signup-err", "Password must be at least 6 characters.");
      return;
    }
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

    const { data: existing } = await HF_DB.checkContactExists(contact);
    if (existing) {
      showError(
        "signup-err",
        contactType === "phone"
          ? "This phone number is already registered."
          : "This email address is already registered.",
      );
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
        region: el("su-region")?.value || "",
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
      if (!profile.region) {
        showError("signup-err", "Please select your home region.");
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
      scout: `<strong>Name:</strong> ${name}<br>${contactLine}<br><strong>Role:</strong> Scout<br><strong>Organisation:</strong> ${profile.org || "-"}<br><strong>Home region:</strong> ${profile.region || "-"}`,
    };
    el("confirm-icon").innerHTML = icons[state.role];
    el("confirm-title").textContent = `You're set, ${name.split(" ")[0]}!`;
    el("confirm-sub").textContent = {
      player: "Your player account is ready.",
      coach: "Your coach account is ready.",
      scout: "Your scout account is ready.",
    }[state.role];
    el("confirm-summary").innerHTML = summaryRows[state.role];
    showScreen("screen-signup-security");
  };

  // ─── Complete signup ────────────────────────────────────────
  const completeSignup = async () => {
    if (window.HF_ROUTER) HF_ROUTER.resetSubscriptions();

    const result = await HF_DB.createUser(state.signup);
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      showScreen("screen-signup-info");
      return;
    }

    // save security question using stored values from goToConfirm
    if (result.user && state.securityQuestion && state.securityAnswer) {
      await HF_DB.setSecurityQuestion(
        result.user.id,
        state.securityQuestion,
        state.securityAnswer,
      );
    }

    const session = _makeSession(result.user);
    HF_DB.saveSession(session);
    if (state.signup.role === "player") {
      await HF_DB.updateLoginStreak(session.userId);
    }
    state.newUserId = result.user.id;

    if (state.signup.role === "coach") {
      const clubInput = el("sq-team");
      if (clubInput) {
        clubInput.value = state.signup.profile.club || "";
        clubInput.style.opacity = "0.6";
        clubInput.style.cursor = "not-allowed";
      }
      showScreen("screen-squad-verify");
    } else if (state.signup.role === "scout") {
      const agencyInput = el("ag-name");
      if (agencyInput) agencyInput.value = state.signup.profile.org || "";
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

    // fetch user first to check lockout before hashing password
    const userCheck = await HF_DB.findUserByContact(contact);
    if (!userCheck) {
      showError(
        "login-err",
        state.loginTab === "phone"
          ? "Phone number or password incorrect. Check your country code."
          : "Email or password incorrect.",
      );
      return;
    }

    // check lockout
    if (
      userCheck.locked_until &&
      new Date(userCheck.locked_until) > new Date()
    ) {
      const mins = Math.ceil(
        (new Date(userCheck.locked_until) - new Date()) / 60000,
      );
      showError(
        "login-err",
        `Account locked. Try again in ${mins} minute${mins !== 1 ? "s" : ""}.`,
      );
      return;
    }

    // check banned
    if (userCheck.banned) {
      showError(
        "login-err",
        `Your account has been banned. ${userCheck.banReason ? "Reason: " + userCheck.banReason : "Please contact support."}`,
      );
      return;
    }

    // check kicked
    if (
      userCheck.kicked &&
      userCheck.kickedUntil &&
      new Date(userCheck.kickedUntil) > new Date()
    ) {
      const until = new Date(userCheck.kickedUntil).toLocaleTimeString();
      showError(
        "login-err",
        `You have been kicked and cannot sign in until ${until}.`,
      );
      return;
    }

    // now hash and verify password
    const hashedPassword = await HF_UTILS.hashPassword(pass);
    const user = await HF_DB.findUser(contact, hashedPassword);

    if (!user) {
      // increment attempts for wrong password
      const { attempts, lockedUntil } = await HF_DB.incrementLoginAttempts(
        userCheck.id,
      );
      const remaining = 5 - attempts;
      if (lockedUntil) {
        showError(
          "login-err",
          "Too many failed attempts. Account locked for 15 minutes.",
        );
      } else {
        showError(
          "login-err",
          `${state.loginTab === "phone" ? "Phone number or password incorrect." : "Email or password incorrect."}${remaining === 1 ? " 1 attempt remaining before lockout." : ""}`,
        );
      }
      return;
    }

    await HF_DB.resetLoginAttempts(user.id);

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
    name: user.name,
    role: user.role,
    contact: user.contact,
    contactType: user.contactType,
    displayContact: user.displayContact,
    localPhone: user.localPhone,
    profile: user.profile || {},
    squadStatus: user.squadStatus,
    agencyStatus: user.agencyStatus,
    passwordVersion: user.passwordVersion || 1,
    createdAt: user.createdAt,
  });

  const logout = () => {
    HF_DB.clearSession();
    HF_ROUTER.resetSubscriptions();
    HF_AGENT.hide();
    HF_AGENT.reset();

    // clear all form fields
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

  const checkPassword = (password) => {
    // find the bar in the currently active screen
    const activeScreen = document.querySelector(".auth-screen.active");
    const fill =
      activeScreen?.querySelector("#password-strength-fill") ||
      document.getElementById("password-strength-fill");
    const label =
      activeScreen?.querySelector("#password-strength-label") ||
      document.getElementById("password-strength-label");
    if (!fill || !label) return;

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = [
      { width: "0%", color: "transparent", label: "" },
      { width: "25%", color: "var(--red)", label: "Weak" },
      { width: "50%", color: "var(--gold)", label: "Fair" },
      { width: "75%", color: "var(--blue)", label: "Good" },
      { width: "100%", color: "var(--green)", label: "Strong" },
    ];

    const level = levels[Math.min(strength, 4)];
    fill.style.width = password.length === 0 ? "0%" : level.width;
    fill.style.background = level.color;
    label.textContent = password.length === 0 ? "" : level.label;
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

    await HF_DB.updateVerificationStatus(session.userId, "squad", "pending");
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

    // fetch user first to check lockout
    const userCheck = await HF_DB.findUserByContact(email);
    if (!userCheck || userCheck.role !== "admin") {
      showError("admin-err", "Invalid email or password.");
      return;
    }

    // check lockout
    if (
      userCheck.locked_until &&
      new Date(userCheck.locked_until) > new Date()
    ) {
      const mins = Math.ceil(
        (new Date(userCheck.locked_until) - new Date()) / 60000,
      );
      showError(
        "admin-err",
        `Account locked. Try again in ${mins} minute${mins !== 1 ? "s" : ""}.`,
      );
      return;
    }

    // hash and verify
    const hashedPassword = await HF_UTILS.hashPassword(pass);
    const user = await HF_DB.findUser(email, hashedPassword);

    if (!user || user.role !== "admin") {
      const { attempts, lockedUntil } = await HF_DB.incrementLoginAttempts(
        userCheck.id,
      );
      const remaining = 5 - attempts;
      if (lockedUntil) {
        showError(
          "admin-err",
          "Too many failed attempts. Account locked for 15 minutes.",
        );
      } else {
        showError(
          "admin-err",
          `Invalid email or password.${remaining === 1 ? " 1 attempt remaining before lockout." : ""}`,
        );
      }
      return;
    }

    await HF_DB.resetLoginAttempts(user.id);

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
      tag.style.cssText = `font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:3px 8px;background:var(--gold);color:#0f0f0d;display:inline-flex;align-items:center;gap:4px;`;
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

    await HF_DB.updateVerificationStatus(session.userId, "agency", "pending");
    session.agencyStatus = "pending";
    HF_DB.saveSession(session);

    showScreen("screen-agency-pending");
  };

  const enterWithPendingAgency = () => {
    const session = HF_DB.getSession();
    HF_ROUTER.launch(session);
  };

  const skipVerification = () => {
    const session = HF_DB.getSession();
    HF_ROUTER.launch(session);
  };

  const togglePassword = (inputId, btn) => {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    btn.innerHTML = isPassword
      ? '<i class="ti ti-eye-off"></i>'
      : '<i class="ti ti-eye"></i>';
  };

  const forgotStep1 = async () => {
    const contact = el("forgot-contact")?.value.trim().toLowerCase();

    if (!contact) {
      showError("forgot-err", "Please enter your email or phone.");
      return;
    }

    const { data } = await HF_DB.getUserSecurityQuestion(contact);

    if (!data) {
      showError("forgot-err", "No account found with that contact.");
      return;
    }

    if (!data.security_question) {
      showError("forgot-err", "No security question set for this account.");
      return;
    }

    window._forgotContact = contact;
    document.getElementById("forgot-question").textContent =
      data.security_question;
    document.getElementById("forgot-step-1").style.display = "none";
    document.getElementById("forgot-step-2").style.display = "block";
  };

  const forgotStep2 = async () => {
    const answer = el("forgot-answer")?.value.trim();

    if (!answer) {
      showError("forgot-err-2", "Please enter your answer.");
      return;
    }

    const result = await HF_DB.verifySecurityAnswer(
      window._forgotContact,
      answer,
    );

    if (result.error) {
      showError("forgot-err-2", result.error);
      return;
    }

    window._forgotUserId = result.userId;
    document.getElementById("forgot-step-2").style.display = "none";
    document.getElementById("forgot-step-3").style.display = "block";
  };

  const forgotStep3 = async () => {
    const newPass = el("forgot-new-pass")?.value;
    const confirmPass = el("forgot-confirm-pass")?.value;

    if (!newPass || newPass.length < 6) {
      showError("forgot-err-3", "Password must be at least 6 characters.");
      return;
    }

    if (newPass !== confirmPass) {
      showError("forgot-err-3", "Passwords do not match.");
      return;
    }

    const hashed = await HF_UTILS.hashPassword(newPass);
    const result = await HF_DB.resetPassword(window._forgotUserId, hashed);

    if (result.error) {
      showError("forgot-err-3", result.error);
      return;
    }

    window._forgotContact = null;
    window._forgotUserId = null;

    HF_UTILS.toast("Password reset successfully! Please log in.", "success");
    showScreen("screen-login");
  };

  const goToConfirm = () => {
    const question = el("su-security-q")?.value;
    const answer = el("su-security-a")?.value.trim();

    if (!question) {
      showError("security-err", "Please select a security question.");
      return;
    }

    if (!answer) {
      showError("security-err", "Please enter your answer.");
      return;
    }

    // store for completeSignup
    state.securityQuestion = question;
    state.securityAnswer = answer;
    showScreen("screen-signup-confirm");
  };

  // ─── Expose to window (called from onclick) ─────────────────
  return {
    showScreen,
    switchLoginTab,
    switchSignupTab,
    selectRole,
    goStep2,
    goStep3,
    goToConfirm,
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
    skipVerification,
    togglePassword,
    forgotStep1,
    forgotStep2,
    forgotStep3,
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
    case "screen-signup-security":
      HF_AUTH.goToConfirm();
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
