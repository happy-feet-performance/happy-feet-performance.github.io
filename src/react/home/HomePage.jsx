import { useEffect } from "react";
import { useAppState } from "../../lib/appStore.js";
import { DEFAULT_ROLE } from "../../lib/activeRole.js";
import { linkTo, navigate, usePath } from "../../lib/location.js";
import logo from "../../../hf-logo.jpeg";

// ─── PLACEHOLDER COPY ──────────────────────────────────────
// Draft text written from what's already in the app. Replace with the real
// HappyFeet wording; the layout doesn't depend on the exact length.
const COPY = {
  heroTitle: "Changing the narrative of African football",
  heroSub:
    "HappyFeet connects players, coaches and scouts across Africa: track development, build verified squads and get talent seen.",
  aboutTitle: "About HappyFeet",
  aboutIntro: [
    "HappyFeet is a performance hub built for African football. Players log their training and wellness, coaches plan sessions and rate their squads, and scouts discover verified talent and share reports with clubs.",
    "We believe talent is God-given and discipline is worship, so faith and purpose sit alongside performance data throughout the platform.",
  ],
  roles: [
    {
      icon: "ti-ball-football",
      title: "Players",
      text: "Track your ratings, training and health, earn achievements, and find a team that's recruiting.",
    },
    {
      icon: "ti-clipboard-list",
      title: "Coaches",
      text: "Register a verified squad, build and broadcast session plans, rate players and organise matches.",
    },
    {
      icon: "ti-search",
      title: "Scouts",
      text: "Discover rated players, track prospects, generate scouting reports and share them with coaches.",
    },
  ],
  values: [
    { icon: "ti-shield-check", title: "Verified", text: "Squads and agencies are reviewed by the HappyFeet team." },
    { icon: "ti-chart-line", title: "Data-driven", text: "Coach-rated sessions build every player's development record." },
    { icon: "ti-cross", title: "Faith & purpose", text: "Daily scripture and devotion for players and teams." },
  ],
  ctaTitle: "Ready to get started?",
  ctaSub: "Create a free account as a player, coach or scout.",
};

function Brand() {
  return (
    <a className="home-brand" {...linkTo("/")}>
      <span className="home-brand-hex">
        <img src={logo} alt="" />
      </span>
      <span className="home-brand-name">
        <em>Happy</em>Feet
      </span>
    </a>
  );
}

function ThemeToggle() {
  return (
    <label className="theme-switch" title="Toggle dark mode">
      <input
        type="checkbox"
        defaultChecked={document.documentElement.getAttribute("data-theme") === "dark"}
        onChange={() => window.HF_THEME.toggle()}
      />
      <span className="theme-slider"></span>
    </label>
  );
}

// Log in / Sign up, or the signed-in user's way back into the app.
function AccountActions({ session, large }) {
  const size = large ? "" : " btn-sm";
  if (session) {
    return (
      <>
        <a className={`btn btn-outline${size}`} {...linkTo("/app/profile")}>
          <i className="ti ti-user"></i> My profile
        </a>
        <a className={`btn btn-primary${size}`} {...linkTo("/app/dashboard")}>
          <i className="ti ti-layout-dashboard"></i> My dashboard
        </a>
      </>
    );
  }
  return (
    <>
      <a className={`btn btn-outline${size}`} {...linkTo("/login")}>
        Log in
      </a>
      <a className={`btn btn-primary${size}`} {...linkTo("/signup")}>
        Sign up
      </a>
    </>
  );
}

// Public landing page at / (and /about, scrolled to the About section).
// Guests (DEFAULT_ROLE) get Log in / Sign up; signed-in users see the same
// page with links back into the app.
export default function HomePage() {
  const path = usePath();
  const role = useAppState((s) => s.role);
  const storedSession = useAppState((s) => s.session);
  const session = role === DEFAULT_ROLE ? null : storedSession;

  useEffect(() => {
    if (path === "/about") document.getElementById("about")?.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0 });
  }, [path]);

  return (
    <div className="home">
      <header className="home-header">
        <Brand />
        <nav className="home-nav">
          <a {...linkTo("/")} className={path === "/" ? "active" : ""}>
            Home
          </a>
          <a {...linkTo("/about")} className={path === "/about" ? "active" : ""}>
            About
          </a>
        </nav>
        <div className="home-header-actions">
          {session && (
            <span className="home-signed-in">
              Signed in as <strong>{session.name}</strong>
            </span>
          )}
          <AccountActions session={session} />
          <ThemeToggle />
        </div>
      </header>

      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-hex">
            <img src={logo} alt="HappyFeet" />
          </div>
          <h1>{COPY.heroTitle}</h1>
          <p>{COPY.heroSub}</p>
          <div className="home-hero-actions">
            <AccountActions session={session} large />
          </div>
          <button className="home-scroll" onClick={() => navigate("/about")}>
            About HappyFeet <i className="ti ti-chevron-down"></i>
          </button>
        </div>
      </section>

      <section className="home-about" id="about">
        <div className="home-section-inner">
          <h2>{COPY.aboutTitle}</h2>
          {COPY.aboutIntro.map((p) => (
            <p key={p} className="home-lead">
              {p}
            </p>
          ))}

          <div className="home-roles">
            {COPY.roles.map((r) => (
              <div key={r.title} className="home-role">
                <i className={`ti ${r.icon}`}></i>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </div>
            ))}
          </div>

          <div className="home-values">
            {COPY.values.map((v) => (
              <div key={v.title} className="home-value">
                <i className={`ti ${v.icon}`}></i>
                <div>
                  <h4>{v.title}</h4>
                  <p>{v.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-cta">
        <div className="home-section-inner">
          {session ? (
            <>
              <h2>Welcome back, {session.name.split(" ")[0]}</h2>
              <p>Pick up where you left off.</p>
            </>
          ) : (
            <>
              <h2>{COPY.ctaTitle}</h2>
              <p>{COPY.ctaSub}</p>
            </>
          )}
          <div className="home-hero-actions">
            <AccountActions session={session} large />
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <Brand />
        <span>© {new Date().getFullYear()} HappyFeet Performance</span>
      </footer>
    </div>
  );
}
