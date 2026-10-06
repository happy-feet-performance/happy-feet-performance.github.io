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
