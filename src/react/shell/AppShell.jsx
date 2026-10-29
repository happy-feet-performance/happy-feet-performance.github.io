import { useEffect } from "react";
import { useAppState } from "../../lib/appStore.js";
import { navTo, renderView, toggleMobileNav } from "../../lib/router.js";
import { navigate } from "../../lib/location.js";
import { navItemsFor } from "./navConfig.js";
import UserMenu from "./UserMenu.jsx";
import logo from "../../../hf-logo.jpeg";

function Topbar({ session }) {
  return (
    <div className="topbar">
      <button className="hamburger" onClick={toggleMobileNav}>
        ☰
      </button>
      <div className="topbar-brand" onClick={() => navigate("/")}>
        <div className="topbar-hex topbar-hex-img">
          <img src={logo} alt="HF" />
        </div>
        <div className="topbar-name">
          <em>Happy</em>Feet
        </div>
      </div>
      <div className="topbar-right">
        <label className="theme-switch" title="Toggle dark mode">
          {/* HF_THEME (public/js/theme.js) also syncs this checkbox by id */}
          <input
            type="checkbox"
            id="theme-toggle"
            defaultChecked={document.documentElement.getAttribute("data-theme") === "dark"}
            onChange={() => window.HF_THEME.toggle()}
          />
          <span className="theme-slider"></span>
        </label>
        {session && <UserMenu session={session} />}
      </div>
    </div>
  );
}

function Sidenav({ session, activeView, badges, open }) {
  return (
    <nav className={`sidenav${open ? " open" : ""}`} id="sidenav">
      {session && (
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
      )}
    </nav>
  );
}

// The signed-in app frame, shown on /app/<view>. Each role view is its own
// React root inside #main-content (see src/react/mount.jsx); this renders
// the view named in the URL, and again whenever viewKey is bumped.
export default function AppShell() {
  const visible = useAppState((s) => s.shellVisible);
  const session = useAppState((s) => s.session);
  const activeView = useAppState((s) => s.activeView);
  const viewKey = useAppState((s) => s.viewKey);
  const badges = useAppState((s) => s.badges);
  const mobileNavOpen = useAppState((s) => s.mobileNavOpen);

  // The view is a separate root, so (un)mount it after this commit finishes:
  // React can't unmount one root while it's still rendering another.
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => cancelled || renderView(activeView));
    return () => {
      cancelled = true;
    };
  }, [activeView, viewKey]);

  // leaving the app (e.g. to the home page) unmounts the current view
  useEffect(() => () => queueMicrotask(() => window.HF_REACT?.unmountAll()), []);

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
