// Exposes src/lib to the classic-script code (js/**) as window.HF_UTILS,
// window.HF_ROLE_UTILS, window.HF_DB and window.HF_ROUTER. This runs after
// every classic script has loaded but before the router boots (see
// src/react/mount.jsx), so classic scripts must only touch these inside
// functions, never at load time.
import * as utils from "./utils.js";
import * as dom from "./dom.js";
import * as legacyHtml from "./legacyHtml.js";
import * as roleUtils from "./roleUtils.js";
import * as db from "./db/index.js";
import * as router from "./router.js";

window.HF_UTILS = { ...utils, ...dom, ...legacyHtml };
window.HF_ROLE_UTILS = { ...roleUtils };
window.HF_DB = { ...db };
window.HF_ROUTER = { ...router };
