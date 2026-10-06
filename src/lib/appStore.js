// Minimal global store for app-level UI state (shell visibility, active
// view, sidebar badges). Plain modules write to it with setAppState();
// React components read it with useAppState(selector).
import { useSyncExternalStore } from "react";

let state = {
  shellVisible: false,
  session: null,
  activeView: null,
  // { [view]: { count, color } }
  badges: {},
  mobileNavOpen: false,
};
const listeners = new Set();

export const getAppState = () => state;

export const setAppState = (update) => {
  const next = typeof update === "function" ? update(state) : update;
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useAppState = (selector) => useSyncExternalStore(subscribe, () => selector(state));
