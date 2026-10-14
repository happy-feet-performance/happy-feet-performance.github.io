// Minimal global store for app-level UI state (shell visibility, active
// view, sidebar badges). Plain modules write to it with setAppState();
// React components read it with useAppState(selector).
import { useSyncExternalStore } from "react";

let state = {
  // which page the URL shows: "home" | "auth" | "app" (null while booting)
  page: null,
  // bumped to re-render the current view without changing the URL
  viewKey: 0,
  shellVisible: false,
  session: null,
  // "guest" while signed out, the user's role while signed in (see roleOf in
  // activeRole.js). Set from the saved session at boot, so it survives reloads.
  role: "guest",
  activeView: null,
  // { [view]: { count, color } }
  badges: {},
  mobileNavOpen: false,

  // ── auth screens ──
  authVisible: false,
  authScreen: "screen-login",
  // bumped to remount (and so clear) all auth forms, e.g. on logout
  authFormsKey: 0,
  // bumped to restart the forgot-password flow
  forgotKey: 0,
  forgotFromAdmin: false,
  signupRole: "",
  // role-specific signup fields are remounted when this changes
  signupRoleKey: 0,
  // shown on the confirm screen: { name, role, contactType, displayContact, profile }
  signupSummary: null,
  // prefill for the squad/agency verification screens after signup
  verifyPrefill: { team: "", agency: "" },
  verifyKey: 0,
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
