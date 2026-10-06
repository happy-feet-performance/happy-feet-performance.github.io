import { useAppState } from "../../lib/appStore.js";
import { navTo, toggleMobileNav } from "../../lib/router.js";
import { logout } from "../../lib/auth.js";
import { Avatar } from "../components/shared/index.js";
import { navItemsFor } from "./navConfig.js";

const ROLE_AVATAR_COLORS = { player: "var(--green)", coach: "var(--gold)" };

function Topbar({ session }) {
  const role = session?.role || "";
  return (
    <div className="topbar">
      <button className="hamburger" onClick={toggleMobileNav}>
        ☰
      </button>
      <div className="topbar-brand" onClick={() => navTo("dashboard")}>
        <div className="topbar-hex topbar-hex-img">
          <img src="/hf-logo.jpeg" alt="HF" />
        </div>
        <div className="topbar-name">
          <em>Happy</em>Feet
        </div>
      </div>
      <div className="topbar-right">
        <div className="topbar-user-info" onClick={() => navTo("profile")}>
          <div className="topbar-meta">
            Signed in as <span className="topbar-role-pill">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
          </div>
          <div className="topbar-user-name">{session?.name}</div>
        </div>
        <label className="theme-switch" title="Toggle dark mode">
          {/* HF_THEME (js/theme.js) also syncs this checkbox by id */}
          <input
            type="checkbox"
            id="theme-toggle"
            defaultChecked={document.documentElement.getAttribute("data-theme") === "dark"}
            onChange={() => window.HF_THEME.toggle()}
          />
          <span className="theme-slider"></span>
        </label>
        <button
          className="btn topbar-icon-btn"
          onClick={() => navTo("profile#settings")}
          title="Settings"
          aria-label="Open account settings"
        >
          <i className="ti ti-settings" aria-hidden="true"></i>
        </button>
        <button className="btn-logout" onClick={logout}>
          Sign out
        </button>
      </div>
    </div>
  );
}

function Sidenav({ session, activeView, badges, open }) {
  return (
    <nav className={`sidenav${open ? " open" : ""}`} id="sidenav">
      {session && (
        <>
          <div className="sidenav-scroll">
            {navItemsFor(session).map((item) =>
              item.section ? (
                <div key={`section-${item.section}`} className="sidenav-section">
                  {item.section}
                </div>
              ) : (
                <div
                  key={item.view}
                  className={`nav-item${item.faithNav ? " faith-nav" : ""}${activeView === item.view ? " active" : ""}`}
                  data-view={item.view}
                  onClick={() => navTo(item.view)}
                >
                  <i className={`ti ${item.icon}`} aria-hidden="true"></i>
                  <span>{item.label}</span>
                  {badges[item.view] && (
                    <span className="nav-badge" style={{ background: "rgba(0,0,0,.1)", color: badges[item.view].color }}>
                      {badges[item.view].count}
                    </span>
                  )}
                </div>
              ),
            )}
          </div>
          <div className="sidenav-footer" onClick={() => navTo("profile")} style={{ cursor: "pointer" }}>
            <Avatar
              name={session.name}
              src={session.profile?.avatarUrl}
              size="sm"
              color={ROLE_AVATAR_COLORS[session.role] || "var(--blue)"}
            />
            <div>
              <div className="sidenav-footer-name">{session.name}</div>
              <div className="sidenav-footer-role">{session.displayContact || session.contact}</div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

// The logged-in app frame. Always mounted (hidden until launch) so that
// #main-content, where HF_REACT mounts each view, is never replaced.
export default function AppShell() {
  const visible = useAppState((s) => s.shellVisible);
  const session = useAppState((s) => s.session);
  const activeView = useAppState((s) => s.activeView);
  const badges = useAppState((s) => s.badges);
  const mobileNavOpen = useAppState((s) => s.mobileNavOpen);

  return (
    <div id="app-shell" className={`app-shell${visible ? " visible" : ""}${session ? ` role-${session.role}` : ""}`}>
      <Topbar session={session} />
      <div className="layout">
        <Sidenav session={session} activeView={activeView} badges={badges} open={mobileNavOpen} />
        <div className={`sidenav-overlay${mobileNavOpen ? " open" : ""}`} id="nav-overlay" onClick={toggleMobileNav}></div>
        <main className="main" id="main-content"></main>
      </div>
    </div>
  );
}
