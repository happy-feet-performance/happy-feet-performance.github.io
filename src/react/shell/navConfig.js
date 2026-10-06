// Sidebar items per role. `section` entries are headings.
const NAVS = {
  player: (session) => [
    { section: "My journey" },
    { view: "dashboard", icon: "ti-home", label: "Dashboard" },
    { view: "profile", icon: "ti-user", label: "My profile" },
    { view: "stats", icon: "ti-chart-bar", label: "My stats" },
    ...(session.profile?.club && session.profile?.status !== "unattached"
      ? [{ view: "training", icon: "ti-clipboard-list", label: "Training" }]
      : []),
    { view: "health", icon: "ti-heart-rate-monitor", label: "Health log" },
    { section: "Progress" },
    { view: "achievements", icon: "ti-trophy", label: "Achievements" },
    { view: "highlights", icon: "ti-video", label: "Highlights" },
    { section: "Community" },
    { view: "messages", icon: "ti-message", label: "Messages" },
    { view: "faith", icon: "ti-cross", label: "Faith & purpose", faithNav: true },
    { section: "Discover" },
    { view: "findmyteam", icon: "ti-map-search", label: "Find my team" },
  ],

  coach: (session) => {
    const verified = (session.squadStatus || "unregistered") === "verified";
    const hasPlayers = (session.profile?.teamSize || 0) > 0;
    return [
      { section: "Management" },
      { view: "dashboard", icon: "ti-home", label: "Dashboard" },
      { view: "profile", icon: "ti-user", label: "My profile" },
      ...(verified
        ? [
            { view: "squad", icon: "ti-users", label: "Squad" },
            ...(hasPlayers
              ? [
                  { view: "training", icon: "ti-clipboard-list", label: "Session builder" },
                  { view: "tracking", icon: "ti-chart-line", label: "Player tracking" },
                ]
              : []),
            { section: "Tools" },
            { view: "health", icon: "ti-heart-rate-monitor", label: "Health & wellness" },
          ]
        : []),
      { section: "Community" },
      { view: "messages", icon: "ti-message", label: "Messages" },
      { view: "faith", icon: "ti-cross", label: "Team devotion", faithNav: true },
      { section: "Discover" },
      { view: "findmyteam", icon: "ti-map-search", label: "Find my team" },
    ];
  },

  scout: (session) => {
    const verified = (session.agencyStatus || "unregistered") === "verified";
    return [
      { section: "Scouting" },
      { view: "dashboard", icon: "ti-home", label: "Dashboard" },
      { view: "profile", icon: "ti-user", label: "My profile" },
      ...(verified
        ? [
            { view: "discover", icon: "ti-search", label: "Discover talent" },
            { view: "prospects", icon: "ti-star", label: "Saved prospects" },
            { section: "Reports" },
            { view: "reports", icon: "ti-file-text", label: "Scout reports" },
            { view: "placements", icon: "ti-circle-check", label: "Placements" },
          ]
        : []),
      { section: "Community" },
      { view: "messages", icon: "ti-message", label: "Messages" },
      { section: "Discover" },
      { view: "findmytalent", icon: "ti-map-search", label: "Find my talent" },
    ];
  },

  admin: () => [
    { section: "Management" },
    { view: "dashboard", icon: "ti-home", label: "Dashboard" },
    { view: "squad-verifications", icon: "ti-shield-check", label: "Squad verifications" },
    { view: "agency-verifications", icon: "ti-building", label: "Agency verifications" },
    { view: "users", icon: "ti-users", label: "Users" },
    { section: "Communication" },
    { view: "messages", icon: "ti-message", label: "Messages" },
    { view: "tickets", icon: "ti-ticket", label: "Support tickets" },
  ],
};

export const navItemsFor = (session) => NAVS[session.role]?.(session) || [];
