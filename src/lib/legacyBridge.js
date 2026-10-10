// js/agent.js is the last classic script that needs the app's modules: it
// reads the session and stores conversations through window.HF_DB. This
// runs after the classic scripts load but before the router boots (see
// src/react/mount.jsx), so agent.js must only use it inside functions.
import * as db from "./db/index.js";

window.HF_DB = { ...db };
