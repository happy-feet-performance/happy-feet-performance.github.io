import "../lib/legacyBridge.js";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { boot } from "../lib/router.js";
import AppShell from "./shell/AppShell.jsx";
import scoutComponents from "./components/scout/index.js";
import playerComponents from "./components/player/index.js";
import coachComponents from "./components/coach/index.js";
import adminComponents from "./components/admin/index.js";
import commonComponents from "./components/common/index.js";

const registry = {
  ...scoutComponents,
  ...playerComponents,
  ...coachComponents,
  ...adminComponents,
  ...commonComponents,
};

// ─── Views ─────────────────────────────────────────────────
// Each view is its own root inside the shell's #main-content, mounted by
// the role dashboards (js/dashboards/*) through window.HF_REACT.
let root = null;

function mount(name, container, props) {
  unmountAll();
  const Component = registry[name];
  if (!Component) {
    console.error(`HF_REACT: unknown component "${name}"`);
    return;
  }
  root = createRoot(container);
  root.render(<Component {...props} />);
}

function unmountAll() {
  if (root) {
    root.unmount();
    root = null;
  }
}

window.HF_REACT = { mount, unmountAll };

// ─── App shell + boot ──────────────────────────────────────
// Module scripts run after the document is parsed, so #app-root exists.
// Render synchronously so #main-content is in the DOM before the router
// launches a dashboard into it.
flushSync(() => createRoot(document.getElementById("app-root")).render(<AppShell />));
boot();
