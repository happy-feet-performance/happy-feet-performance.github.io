/* ============================================================
   HappyFeet — theme.js
   Light / dark mode toggle
   ============================================================ */

const HF_THEME = (() => {
  const STORAGE_KEY = "hf_theme";

  const apply = (mode) => {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem(STORAGE_KEY, mode);
    const toggle = document.getElementById("theme-toggle");
    const toggleAuth = document.getElementById("theme-toggle-auth");
    if (toggle) toggle.checked = mode === "dark";
    if (toggleAuth) toggleAuth.checked = mode === "dark";
  };

  const toggle = () => {
    const current =
      document.documentElement.getAttribute("data-theme") || "light";
    apply(current === "dark" ? "light" : "dark");
  };

  const boot = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    apply(saved || (prefersDark ? "dark" : "light"));
  };

  return { toggle, boot };
})();

window.HF_THEME = HF_THEME;

document.addEventListener("DOMContentLoaded", () => HF_THEME.boot());
