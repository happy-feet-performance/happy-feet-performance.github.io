// The active role: "guest" while signed out, the user's role while signed in.
// Kept free of imports so any module (including the public pages) can use it
// without pulling in the dashboard modules and their import cycle with
// router.js / roleUtils.js.
export const DEFAULT_ROLE = "guest";

export const roleOf = (session) => session?.role || DEFAULT_ROLE;
