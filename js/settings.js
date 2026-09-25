const HF_SETTINGS = (() => {
  const { el, show, hide, toast } = HF_UTILS;

  const _confirm = async (message) => {
    return confirm(message);
  };

  const _promptPassword = async (label = "Enter your current password") => {
    return prompt(label);
  };

  const _validateEmail = (value) => {
    return value && value.includes("@") && value.includes(".");
  };

  const _validatePhone = (value) => {
    return value && value.replace(/\s/g, "").length >= 6;
  };

  const _renderSettingsSection = (session) => {
    const canChangeRole = session.role === "admin";
    const changeRoleSection = canChangeRole
      ? `
      <div class="fg">
        <label>Role</label>
        <select id="settings-role">
          <option value="player" ${session.role === "player" ? "selected" : ""}>Player</option>
          <option value="coach" ${session.role === "coach" ? "selected" : ""}>Coach</option>
          <option value="scout" ${session.role === "scout" ? "selected" : ""}>Scout</option>
          <option value="admin" ${session.role === "admin" ? "selected" : ""}>Admin</option>
        </select>
      </div>`
      : "";

    return `
      <div id="settings-section">
        <div class="card-title"><div class="card-dot"></div>Account settings</div>
        <div class="fg">
          <label>Email address</label>
          <input type="email" id="settings-email" value="${session.contactType === "email" ? session.displayContact || session.contact : ""}" placeholder="Enter new email" />
        </div>
        <div class="fg">
          <label>Phone number</label>
          <input type="tel" id="settings-phone" value="${session.contactType === "phone" ? session.displayContact || session.contact : ""}" placeholder="Enter new phone number" />
        </div>
        <div class="fg">
          <label>New password</label>
          <div class="password-wrap">
            <input type="password" id="settings-password" placeholder="Enter new password" />
            <button type="button" class="password-toggle" onclick="HF_AUTH.togglePassword('settings-password', this)">
              <i class="ti ti-eye"></i>
            </button>
          </div>
        </div>
        ${changeRoleSection}
        ${canChangeRole ? "<div class='info-label' style='margin-top:6px;color:var(--text2);font-size:12px;'>Admin-only role changes.</div>" : ""}
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" onclick="HF_SETTINGS.saveSettings()">
            <i class="ti ti-save"></i> Save settings
          </button>
          <button class="btn btn-danger btn-sm" onclick="HF_SETTINGS.deleteAccount()">
            <i class="ti ti-trash"></i> Delete account
          </button>
        </div>
      </div>`;
  };

  const saveSettings = async () => {
    const session = HF_DB.getSession();
    if (!session) return;

    const emailInput = document.getElementById("settings-email")?.value.trim();
    const phoneInput = document.getElementById("settings-phone")?.value.trim();
    const passwordInput = document.getElementById("settings-password")?.value;
    const roleInput = document.getElementById("settings-role")?.value;

    const changes = {};
    let contactChanged = false;
    const targetContactType = emailInput
      ? "email"
      : phoneInput
        ? "phone"
        : session.contactType;

    if (emailInput && emailInput !== session.displayContact) {
      if (!_validateEmail(emailInput)) {
        HF_UTILS.toast("Enter a valid email address.", "error");
        return;
      }
      changes.contact = emailInput.toLowerCase();
      changes.displayContact = emailInput;
      changes.contactType = "email";
      contactChanged = true;
    }

    if (phoneInput && phoneInput !== session.displayContact) {
      if (!_validatePhone(phoneInput)) {
        HF_UTILS.toast("Enter a valid phone number.", "error");
        return;
      }
      if (contactChanged) {
        HF_UTILS.toast(
          "Please update either email or phone, not both at once.",
          "error",
        );
        return;
      }
      changes.contact = phoneInput.replace(/\s/g, "");
      changes.displayContact = phoneInput;
      changes.contactType = "phone";
      contactChanged = true;
    }

    if (changes.contact) {
      const { data: existing } = await HF_DB.checkContactExists(
        changes.contact,
      );
      if (existing && existing.id !== session.userId) {
        HF_UTILS.toast(
          session.contactType === "phone"
            ? "This phone number is already registered."
            : "This email address is already registered.",
          "error",
        );
        return;
      }
    }

    if (passwordInput) {
      if (passwordInput.length < 6) {
        HF_UTILS.toast("Password must be at least 6 characters.", "error");
        return;
      }
      const confirmPassword = _promptPassword(
        "Confirm your current password to change password:",
      );
      if (!confirmPassword) {
        HF_UTILS.toast("Password confirmation required.", "error");
        return;
      }
      const hashedConfirm = await HF_UTILS.hashPassword(confirmPassword);
      const currentUser = await HF_DB.findUser(session.contact, hashedConfirm);
      if (!currentUser || currentUser.id !== session.userId) {
        HF_UTILS.toast("Current password is incorrect.", "error");
        return;
      }
      const newHashed = await HF_UTILS.hashPassword(passwordInput);
      const passwordResult = await HF_DB.resetPassword(
        session.userId,
        newHashed,
      );
      if (passwordResult.error) {
        HF_UTILS.toast(passwordResult.error, "error");
        return;
      }
    }

    if (session.role === "admin" && roleInput && roleInput !== session.role) {
      const confirmRole = await _confirm(
        `Change your account role from ${session.role} to ${roleInput}?`,
      );
      if (!confirmRole) return;
      changes.role = roleInput;
    }

    if (!contactChanged && !passwordInput && !changes.role) {
      HF_UTILS.toast("No changes to save.", "error");
      return;
    }

    if (contactChanged || changes.role) {
      const update = {};
      if (changes.contact) update.contact = changes.contact;
      if (changes.displayContact)
        update.display_contact = changes.displayContact;
      if (changes.contactType) update.contact_type = changes.contactType;
      if (changes.role) update.role = changes.role;
      const result = await HF_DB.updateUserAccount(session.userId, update);
      if (result.error) {
        HF_UTILS.toast(result.error, "error");
        return;
      }
      if (result.user) {
        session.contact = result.user.contact;
        session.displayContact = result.user.displayContact;
        session.contactType = result.user.contactType;
        if (result.user.role) session.role = result.user.role;
      }
    }

    HF_DB.saveSession(session);
    HF_UTILS.toast("Settings updated successfully.", "success");
    HF_ROUTER.navTo("profile#settings");
  };

  const deleteAccount = async () => {
    const session = HF_DB.getSession();
    if (!session) return;

    const confirmed = await _confirm(
      "Delete your account? This action is permanent and cannot be undone.",
    );
    if (!confirmed) return;

    const password = _promptPassword(
      "Enter your current password to confirm deletion:",
    );
    if (!password) {
      HF_UTILS.toast("Password confirmation required.", "error");
      return;
    }
    const hashed = await HF_UTILS.hashPassword(password);
    const currentUser = await HF_DB.findUser(session.contact, hashed);
    if (!currentUser || currentUser.id !== session.userId) {
      HF_UTILS.toast("Current password is incorrect.", "error");
      return;
    }

    const finalConfirm = await _confirm(
      "Once deleted, your account cannot be recovered. Delete now?",
    );
    if (!finalConfirm) return;

    const { error } = await HF_DB.removeUser(session.userId);
    if (error) {
      HF_UTILS.toast(error.message, "error");
      return;
    }

    HF_UTILS.toast("Your account has been deleted.", "success");
    HF_AUTH.logout();
  };

  return {
    renderSettingsSection: _renderSettingsSection,
    saveSettings,
    deleteAccount,
  };
})();

window.HF_SETTINGS = HF_SETTINGS;
