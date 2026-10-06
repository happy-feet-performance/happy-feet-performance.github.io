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
import * as admin from "./admin.js";
import * as scout from "./scout.js";
import * as player from "./player.js";

window.HF_UTILS = { ...utils, ...dom, ...legacyHtml };
window.HF_ROLE_UTILS = { ...roleUtils };
window.HF_DB = { ...db };
window.HF_ROUTER = { ...router };
// The admin, scout and player dashboards live in src/lib; the router and roleUtils
// still reach every role dashboard through window.HF_<ROLE>.
window.HF_ADMIN = { ...admin };
window.HF_SCOUT = { ...scout };
window.HF_PLAYER = { ...player };
