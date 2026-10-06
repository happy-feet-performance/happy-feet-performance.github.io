import { Fragment } from "react";
import { useAppState } from "../../lib/appStore.js";
import { AdminLoginScreen, ForgotScreen, LoginScreen } from "./LoginScreens.jsx";
import { SignupConfirmScreen, SignupInfoScreen, SignupRoleScreen, SignupSecurityScreen } from "./SignupScreens.jsx";
import { AgencyPendingScreen, AgencyVerifyScreen, SquadPendingScreen, SquadVerifyScreen } from "./VerifyScreens.jsx";

// Login, signup, verification and password reset. Shown when signed out
// (authVisible); src/lib/auth.js switches screens via showScreen().
export default function AuthScreens() {
  const visible = useAppState((s) => s.authVisible);
  const screen = useAppState((s) => s.authScreen);
  const formsKey = useAppState((s) => s.authFormsKey);
  const forgotKey = useAppState((s) => s.forgotKey);
  const verifyKey = useAppState((s) => s.verifyKey);
  // Enter-key shortcuts only apply while the auth screens are showing.
  const is = (id) => visible && screen === id;

  return (
    <div id="auth-screens" className="auth-screens" style={{ display: visible ? "flex" : "none" }}>
      <div id="auth-theme-toggle" className="auth-theme-toggle">
        <label className="theme-switch" title="Toggle dark mode">
          {/* HF_THEME (js/theme.js) also syncs this checkbox by id */}
          <input
            type="checkbox"
            id="theme-toggle-auth"
            defaultChecked={document.documentElement.getAttribute("data-theme") === "dark"}
            onChange={() => window.HF_THEME.toggle()}
          />
          <span className="theme-slider"></span>
        </label>
      </div>

      {/* Logout bumps formsKey, which remounts and so clears every form. */}
      <Fragment key={formsKey}>
        <LoginScreen active={is("screen-login")} />
        <ForgotScreen key={`forgot-${forgotKey}`} active={is("screen-forgot")} />
        <SignupRoleScreen active={is("screen-signup-role")} />
        <SignupInfoScreen active={is("screen-signup-info")} />
        <SignupSecurityScreen active={is("screen-signup-security")} />
        <SignupConfirmScreen active={is("screen-signup-confirm")} />
        <SquadVerifyScreen key={`squad-${verifyKey}`} active={is("screen-squad-verify")} />
        <SquadPendingScreen active={is("screen-squad-pending")} />
        <AgencyVerifyScreen key={`agency-${verifyKey}`} active={is("screen-agency-verify")} />
        <AgencyPendingScreen active={is("screen-agency-pending")} />
        <AdminLoginScreen active={is("screen-admin-login")} />
      </Fragment>
    </div>
  );
}
