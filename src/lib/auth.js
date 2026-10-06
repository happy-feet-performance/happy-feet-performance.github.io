// Login, signup, verification and password-reset actions behind the auth
// screens (src/react/auth). Actions that validate input return an error
// message for the screen to show, or undefined on success.
import * as db from "./db/index.js";
import { hashPassword, normalizeContact, validateEmail, validatePhone } from "./utils.js";
import { toast } from "./dom.js";
import { getAppState, setAppState } from "./appStore.js";
import { closeMobileNav, launch, resetSubscriptions, showLogin } from "./router.js";

// Signup data accumulated across the signup screens.
let signup = {};
let security = { question: "", answer: "" };
// Contact and user id carried through the forgot-password steps.
let forgot = { contact: null, userId: null };

// ─── Screens ───────────────────────────────────────────────
export const showScreen = (id) => {
  const update = { authScreen: id };
  if (id === "screen-signup-role") {
    signup = {};
    security = { question: "", answer: "" };
    update.signupRole = "";
  }
  if (id === "screen-forgot") {
    forgot = { contact: null, userId: null };
    update.forgotKey = getAppState().forgotKey + 1;
  }
  if (id === "screen-login" || id === "screen-admin-login") update.forgotFromAdmin = id === "screen-admin-login";
  setAppState(update);
};

// "Forgot password?" goes back to whichever login screen it came from.
export const showForgot = () => showScreen("screen-forgot");
export const backFromForgot = () =>
  showScreen(getAppState().forgotFromAdmin ? "screen-admin-login" : "screen-login");

const makeSession = (user) => ({
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

// ─── Login ─────────────────────────────────────────────────
const lockoutError = (user) => {
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const mins = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
    return `Account locked. Try again in ${mins} minute${mins !== 1 ? "s" : ""}.`;
  }
};

const failedAttemptError = async (userId, wrongMessage) => {
  const { attempts, lockedUntil } = await db.incrementLoginAttempts(userId);
  if (lockedUntil) return "Too many failed attempts. Account locked for 15 minutes.";
  return `${wrongMessage}${5 - attempts === 1 ? " 1 attempt remaining before lockout." : ""}`;
};

export const login = async ({ tab, email, countryCode, phone, password }) => {
  let contact;
  if (tab === "email") {
    if (!validateEmail(email)) return "Please enter a valid email address.";
    contact = normalizeContact(email.trim());
  } else {
    if (!validatePhone(phone)) return "Please enter a valid phone number.";
    contact = normalizeContact((countryCode || "+233") + phone.trim());
  }
  if (!password) return "Please enter your password.";

  const wrong = tab === "phone" ? "Phone number or password incorrect." : "Email or password incorrect.";

  // fetch user first to check lockout before hashing password
  const userCheck = await db.findUserByContact(contact);
  if (!userCheck) return tab === "phone" ? "Phone number or password incorrect. Check your country code." : wrong;

  const locked = lockoutError(userCheck);
  if (locked) return locked;
  if (userCheck.banned)
    return `Your account has been banned. ${userCheck.banReason ? "Reason: " + userCheck.banReason : "Please contact support."}`;
  if (userCheck.kicked && userCheck.kickedUntil && new Date(userCheck.kickedUntil) > new Date())
    return `You have been kicked and cannot sign in until ${new Date(userCheck.kickedUntil).toLocaleTimeString()}.`;

  const user = await db.findUser(contact, await hashPassword(password));
  if (!user) return failedAttemptError(userCheck.id, wrong);

  await db.resetLoginAttempts(user.id);
  const session = makeSession(user);
  db.saveSession(session);
  if (session.role === "player") await db.updateLoginStreak(session.userId);
  launch(session);
};

export const adminLogin = async ({ email, password }) => {
  email = email.trim().toLowerCase();
  if (!email) return "Please enter your email.";
  if (!password) return "Please enter your password.";

  const userCheck = await db.findUserByContact(email);
  if (!userCheck || userCheck.role !== "admin") return "Invalid email or password.";
  const locked = lockoutError(userCheck);
  if (locked) return locked;

  const user = await db.findUser(email, await hashPassword(password));
  if (!user || user.role !== "admin") return failedAttemptError(userCheck.id, "Invalid email or password.");

  await db.resetLoginAttempts(user.id);
  const session = makeSession(user);
  db.saveSession(session);
  await db.updateLoginStreak(session.userId);
  launch(session);
};

// ─── Signup ────────────────────────────────────────────────
export const selectRole = (role) => setAppState({ signupRole: role });

export const goStep2 = () => {
  const { signupRole, signupRoleKey } = getAppState();
  if (!signupRole) return toast("Please choose your role to continue.", "error");
  signup = {};
  security = { question: "", answer: "" };
  setAppState({ signupRoleKey: signupRoleKey + 1 });
  showScreen("screen-signup-info");
};

const isValidExp = (exp) => parseInt(exp) >= 0 && parseInt(exp) <= 50;

// Builds and validates the role-specific part of the profile.
const buildProfile = async (role, f) => {
  if (role === "player") {
    const profile = {
      pos: f.pos || "",
      tier: f.tier || "U21",
      hometown: (f.hometown || "").trim(),
      status: "unattached",
      club: null,
      ratings: { speed: 0, tech: 0, tact: 0, phys: 0 },
      faithStreak: 0,
    };
    if (!profile.pos) return { error: "Please select your position." };
    if (!profile.hometown) return { error: "Please enter your hometown or region." };
    return { profile };
  }
  if (role === "coach") {
    const profile = {
      licence: f.licence || "",
      exp: f.exp ?? "",
      club: (f.club || "").trim(),
      spec: f.spec || "All-round",
      teamSize: 0,
    };
    if (!profile.licence) return { error: "Please select your coaching licence." };
    if (profile.exp === "") return { error: "Please enter your years of experience." };
    if (!isValidExp(profile.exp)) return { error: "Years of experience must be between 0 and 50." };
    if (!profile.club) return { error: "Please enter your current club or academy." };
    const existingTeam = await db.checkTeamExists(profile.club);
    if (existingTeam)
      return {
        error:
          existingTeam.status === "verified"
            ? `"${profile.club}" is already registered on HappyFeet. If you are the coach, please contact support.`
            : `A verification request for "${profile.club}" is already pending. If you are the coach, please contact support.`,
      };
    return { profile };
  }
  const profile = {
    org: (f.org || "").trim(),
    exp: f.exp ?? "",
    region: f.region || "",
    prospectsTracked: 0,
  };
  if (!profile.org) return { error: "Please enter your organisation or agency." };
  if (!profile.exp) return { error: "Please enter your years of experience." };
  if (!isValidExp(profile.exp)) return { error: "Years of experience must be between 0 and 50." };
  if (!profile.region) return { error: "Please select your home region." };
  return { profile };
};

export const goStep3 = async ({ name, tab, email, countryCode, phone, password, roleFields }) => {
  closeMobileNav();
  name = name.trim();
  if (!password) return "Please enter a password.";
  if (password.length < 6) return "Password must be at least 6 characters.";
  if (!name) return "Please enter your full name.";

  let contact, contactType, displayContact, localPhone = "";
  if (tab === "email") {
    const rawEmail = email.trim().toLowerCase();
    if (!validateEmail(rawEmail)) return "Please enter a valid email address.";
    contact = normalizeContact(rawEmail);
    contactType = "email";
    displayContact = rawEmail;
  } else {
    const code = countryCode || "+233";
    if (!validatePhone(phone)) return "Please enter a valid phone number.";
    contact = normalizeContact(code + phone.trim());
    localPhone = phone.trim().replace(/\s/g, "");
    contactType = "phone";
    displayContact = `${code} ${localPhone}`;
  }

  const { data: existing } = await db.checkContactExists(contact);
  if (existing)
    return contactType === "phone"
      ? "This phone number is already registered."
      : "This email address is already registered.";

  const role = getAppState().signupRole;
  const { profile, error } = await buildProfile(role, roleFields);
  if (error) return error;

  signup = {
    name,
    contact,
    localPhone,
    contactType,
    displayContact,
    password: await hashPassword(password),
    role,
    profile,
  };
  setAppState({ signupSummary: { name, role, contactType, displayContact, profile } });
  showScreen("screen-signup-security");
};

export const goToConfirm = ({ question, answer }) => {
  answer = answer.trim();
  if (!question) return "Please select a security question.";
  if (!answer) return "Please enter your answer.";
  security = { question, answer };
  showScreen("screen-signup-confirm");
};

export const completeSignup = async () => {
  if (!signup.contact) {
    toast("Please complete signup details before continuing.", "error");
    return showScreen("screen-signup-info");
  }

  resetSubscriptions();

  const result = await db.createUser(signup);
  if (result.error) {
    toast(result.error, "error");
    return showScreen("screen-signup-info");
  }

  if (result.user && security.question && security.answer) {
    await db.setSecurityQuestion(result.user.id, security.question, security.answer);
  }

  const session = makeSession(result.user);
  db.saveSession(session);
  if (signup.role === "player") await db.updateLoginStreak(session.userId);
  security = { question: "", answer: "" };

  if (signup.role === "coach" || signup.role === "scout") {
    setAppState(({ verifyKey }) => ({
      verifyPrefill: { team: signup.profile.club || "", agency: signup.profile.org || "" },
      verifyKey: verifyKey + 1,
    }));
    showScreen(signup.role === "coach" ? "screen-squad-verify" : "screen-agency-verify");
  } else {
    launch(session);
  }
};

// ─── Squad / agency verification ───────────────────────────
export const submitSquadVerification = async ({ teamName, league, year, ground }) => {
  teamName = teamName.trim();
  league = league.trim();
  year = year.trim();
  if (!teamName) return "Please enter your team name.";
  if (!league) return "Please enter your league or division.";
  if (year && (parseInt(year) < 1600 || parseInt(year) > new Date().getFullYear()))
    return `Founding year must be between 1600 and ${new Date().getFullYear()}.`;

  const existing = await db.checkTeamExists(teamName);
  if (existing)
    return existing.status === "verified"
      ? `"${teamName}" is already registered and verified. If you are the coach, please contact support.`
      : `A verification request for "${teamName}" is already pending.`;

  const session = db.getSession();

  // update coach profile with potentially new team name
  const updatedProfile = { ...session.profile, club: teamName };
  await db.updateUserProfile(session.userId, updatedProfile);
  session.profile = updatedProfile;
  db.saveSession(session);

  const result = await db.submitSquadVerification({
    coachId: session.userId,
    teamName,
    league,
    foundingYear: year,
    homeGround: ground.trim(),
  });
  if (result.error) return result.error;

  await db.updateVerificationStatus(session.userId, "squad", "pending");
  session.squadStatus = "pending";
  db.saveSession(session);
  showScreen("screen-squad-pending");
};

const isValidWebsite = (url) => {
  if (!url) return true;
  const withProtocol = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
  try {
    const { hostname } = new URL(withProtocol);
    return /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/.test(hostname);
  } catch {
    return false;
  }
};

export const submitAgencyVerification = async ({ agencyName, website, regionsCovered, targetLeagues }) => {
  agencyName = agencyName.trim();
  website = website.trim();
  if (!agencyName) return "Please enter your agency name.";
  if (regionsCovered.length === 0) return "Please select at least one region.";
  if (targetLeagues.length === 0) return "Please select at least one target league.";
  if (!website) return "Please enter your agency website.";
  if (!isValidWebsite(website)) return "Please enter a valid website URL.";

  const session = db.getSession();
  const result = await db.submitAgencyVerification({
    scoutId: session.userId,
    agencyName,
    regionsCovered,
    targetLeagues,
    website,
  });
  if (result.error) return result.error;

  await db.updateVerificationStatus(session.userId, "agency", "pending");
  session.agencyStatus = "pending";
  db.saveSession(session);
  showScreen("screen-agency-pending");
};

// "Enter HappyFeet" from the pending screens, or skipping verification.
export const enterApp = () => launch(db.getSession());

// ─── Forgot password ───────────────────────────────────────
// Returns { error } or { question }.
export const forgotLookup = async (rawContact) => {
  const contact = normalizeContact(rawContact.trim());
  if (!contact) return { error: "Please enter your email or phone." };
  const { data } = await db.getUserSecurityQuestion(contact);
  if (!data) return { error: "No account found with that contact." };
  if (!data.security_question) return { error: "No security question set for this account." };
  forgot.contact = contact;
  return { question: data.security_question };
};

export const forgotVerify = async (answer) => {
  answer = answer.trim();
  if (!answer) return "Please enter your answer.";
  const result = await db.verifySecurityAnswer(forgot.contact, answer);
  if (result.error) return result.error;
  forgot.userId = result.userId;
};

export const forgotReset = async (newPass, confirmPass) => {
  if (!newPass || newPass.length < 6) return "Password must be at least 6 characters.";
  if (newPass !== confirmPass) return "Passwords do not match.";
  const result = await db.resetPassword(forgot.userId, await hashPassword(newPass));
  if (result.error) return result.error;
  forgot = { contact: null, userId: null };
  toast("Password reset successfully! Please log in.", "success");
  backFromForgot();
};

// ─── Logout ────────────────────────────────────────────────
export const logout = () => {
  db.clearSession();
  resetSubscriptions();
  window.HF_AGENT.hide();
  window.HF_AGENT.reset();
  window._cachedVerifiedTeams = null;
  window._cachedWDL = null;
  window._deadlineChecked = false;
  window._cachedSquadPlayers = null;
  window._cachedPendingRequests = null;
  window._cachedCoachMatches = null;
  window._cachedIncomingMatches = null;

  // clear every auth form
  setAppState(({ authFormsKey }) => ({ authFormsKey: authFormsKey + 1 }));
  showLogin();
};

// ─── Password strength ─────────────────────────────────────
const STRENGTH_LEVELS = [
  { width: "0%", color: "transparent", label: "" },
  { width: "25%", color: "var(--red)", label: "Weak" },
  { width: "50%", color: "var(--gold)", label: "Fair" },
  { width: "75%", color: "var(--blue)", label: "Good" },
  { width: "100%", color: "var(--green)", label: "Strong" },
];

export const passwordStrength = (password) => {
  if (!password) return { width: "0%", color: "transparent", label: "" };
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return STRENGTH_LEVELS[Math.min(strength, 4)];
};
