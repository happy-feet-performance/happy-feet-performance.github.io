// Exposes src/lib to the classic-script code (js/**) as window.HF_UTILS,
// window.HF_ROLE_UTILS and window.HF_DB. Module scripts run before
// DOMContentLoaded, so this is in place before HF_ROUTER.boot() renders
// anything. Classic scripts must therefore only touch these inside
// functions, never at load time.
import * as utils from "./utils.js";
import * as dom from "./dom.js";
import * as legacyHtml from "./legacyHtml.js";
import * as roleUtils from "./roleUtils.js";
import * as db from "./db/index.js";

window.HF_UTILS = { ...utils, ...dom, ...legacyHtml };
window.HF_ROLE_UTILS = { ...roleUtils };
window.HF_DB = { ...db };
