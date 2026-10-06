/* ============================================================
   HappyFeet: theme.js
   Light / dark mode toggle

   Deliberately a classic script loaded in <head>: it sets data-theme
   before the first paint so the page never flashes the wrong theme.
   ============================================================ */

const HF_THEME = (() => {
  const STORAGE_KEY = "hf_theme";

  const readSaved = () => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  };

  const syncToggles = (mode) => {
    ["theme-toggle", "theme-toggle-auth"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.checked = mode === "dark";
    });
  };

  const apply = (mode) => {
    document.documentElement.setAttribute("data-theme", mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // storage unavailable (private mode); theme still applies this visit
    }
    syncToggles(mode);
  };

  const toggle = () => {
    const current =
      document.documentElement.getAttribute("data-theme") || "light";
    apply(current === "dark" ? "light" : "dark");
  };

  const boot = () => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    apply(readSaved() || (prefersDark ? "dark" : "light"));
  };

  return { toggle, boot, syncToggles };
})();

window.HF_THEME = HF_THEME;

HF_THEME.boot();
document.addEventListener("DOMContentLoaded", () =>
  HF_THEME.syncToggles(document.documentElement.getAttribute("data-theme")),
);
