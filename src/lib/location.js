// Minimal history-based routing: the current path, navigate(), and a
// subscription for path changes (pushState from navigate, or back/forward).
import { useSyncExternalStore } from "react";

const listeners = new Set();
const notify = () => listeners.forEach((l) => l(window.location.pathname));

window.addEventListener("popstate", notify);

export const currentPath = () => window.location.pathname;

export const navigate = (to, { replace = false } = {}) => {
  if (to === window.location.pathname + window.location.hash) return;
  window.history[replace ? "replaceState" : "pushState"](null, "", to);
  notify();
};

export const onPathChange = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// React hook: the current path, re-rendering on change.
export const usePath = () => useSyncExternalStore(onPathChange, currentPath);

// Props for an <a> that navigates in-app (keeps the real href for
// middle-click / copy link).
export const linkTo = (to) => ({
  href: to,
  onClick: (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(to);
  },
});
