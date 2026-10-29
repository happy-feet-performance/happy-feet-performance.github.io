import { useEffect, useRef, useState } from "react";
import { navTo } from "../../lib/router.js";
import { logout } from "../../lib/auth.js";
import { Avatar } from "../components/shared/index.js";

const ROLE_AVATAR_COLORS = { player: "var(--green)", coach: "var(--gold)" };

// Profile picture in the app and home page headers; opens a menu with the
// user's name, role, profile/settings shortcuts and sign out. Admins have no
// profile view.
export default function UserMenu({ session }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const role = session.role || "";
  const hasProfile = role !== "admin";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => ref.current?.contains(e.target) || setOpen(false);
    const onKeyDown = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (action) => () => {
    setOpen(false);
    action();
  };

  return (
    <div className="user-menu" ref={ref}>
      <button
        className="user-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <Avatar
          name={session.name}
          src={session.profile?.avatarUrl}
          size="sm"
          color={ROLE_AVATAR_COLORS[role] || "var(--blue)"}
        />
      </button>
      {open && (
        <div className="user-menu-dropdown" role="menu">
          <div className="user-menu-header">
            <div className="user-menu-name">{session.name}</div>
            <div className="user-menu-role">
              Signed in as <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
            </div>
          </div>
          {hasProfile && (
            <>
              <button className="user-menu-item" role="menuitem" onClick={choose(() => navTo("profile"))}>
                <i className="ti ti-user" aria-hidden="true"></i> Profile
              </button>
              <button className="user-menu-item" role="menuitem" onClick={choose(() => navTo("settings"))}>
                <i className="ti ti-settings" aria-hidden="true"></i> Settings
              </button>
            </>
          )}
          <button className="user-menu-item user-menu-signout" role="menuitem" onClick={choose(logout)}>
            <i className="ti ti-logout" aria-hidden="true"></i> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
