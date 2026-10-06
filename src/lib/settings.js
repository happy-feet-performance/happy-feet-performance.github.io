// Account settings actions: change contact, password or (admins) role, and
// delete the account.
import { hashPassword, normalizeContact, validateEmail, validatePhone } from "./utils.js";
import { toast } from "./dom.js";
import * as db from "./db/index.js";
import { logout } from "./auth.js";

// Re-checks the signed-in user's current password. Returns true if correct.
const confirmCurrentPassword = async (session, label) => {
  const password = prompt(label);
  if (!password) {
    toast("Password confirmation required.", "error");
    return false;
  }
  const currentUser = await db.findUser(session.contact, await hashPassword(password));
  if (!currentUser || currentUser.id !== session.userId) {
    toast("Current password is incorrect.", "error");
    return false;
  }
  return true;
};

export const saveSettings = async ({ email, phone, password, role }) => {
  const session = db.getSession();
  if (!session) return;

  const changes = {};

  if (email && email !== session.displayContact) {
    if (!validateEmail(email)) return toast("Enter a valid email address.", "error");
    changes.contact = normalizeContact(email);
    changes.displayContact = email;
    changes.contactType = "email";
  }

  if (phone && phone !== session.displayContact) {
    if (!validatePhone(phone)) return toast("Enter a valid phone number.", "error");
    if (changes.contact)
      return toast("Please update either email or phone, not both at once.", "error");
    changes.contact = normalizeContact(phone);
    changes.displayContact = phone;
    changes.contactType = "phone";
  }

  if (changes.contact) {
    const { data: existing } = await db.checkContactExists(changes.contact);
    if (existing && existing.id !== session.userId) {
      return toast(
        changes.contactType === "phone"
          ? "This phone number is already registered."
          : "This email address is already registered.",
        "error",
      );
    }
  }

  if (password) {
    if (password.length < 6) return toast("Password must be at least 6 characters.", "error");
    if (!(await confirmCurrentPassword(session, "Confirm your current password to change password:"))) return;
    const result = await db.resetPassword(session.userId, await hashPassword(password));
    if (result.error) return toast(result.error, "error");
  }

  if (session.role === "admin" && role && role !== session.role) {
    if (!confirm(`Change your account role from ${session.role} to ${role}?`)) return;
    changes.role = role;
  }

  if (!changes.contact && !password && !changes.role) return toast("No changes to save.", "error");

  if (changes.contact || changes.role) {
    const update = {};
    if (changes.contact) update.contact = changes.contact;
    if (changes.displayContact) update.display_contact = changes.displayContact;
    if (changes.contactType) update.contact_type = changes.contactType;
    if (changes.role) update.role = changes.role;
    const result = await db.updateUserAccount(session.userId, update);
    if (result.error) return toast(result.error, "error");
    if (result.user) {
      session.contact = result.user.contact;
      session.displayContact = result.user.displayContact;
      session.contactType = result.user.contactType;
      if (result.user.role) session.role = result.user.role;
    }
  }

  db.saveSession(session);
  toast("Settings updated successfully.", "success");
  window.HF_ROUTER.navTo("profile#settings");
};

export const deleteAccount = async () => {
  const session = db.getSession();
  if (!session) return;

  if (!confirm("Delete your account? This action is permanent and cannot be undone.")) return;
  if (!(await confirmCurrentPassword(session, "Enter your current password to confirm deletion:"))) return;
  if (!confirm("Once deleted, your account cannot be recovered. Delete now?")) return;

  const { error } = await db.removeUser(session.userId);
  if (error) return toast(error.message, "error");

  toast("Your account has been deleted.", "success");
  logout();
};
