// Exposes src/lib to the classic-script code (js/**) as window.HF_UTILS
// and window.HF_ROLE_UTILS. Module scripts run before DOMContentLoaded, so
// this is in place before HF_ROUTER.boot() renders anything. Classic
// scripts must therefore only touch these inside functions, never at load
// time.
import * as utils from "./utils.js";
import * as dom from "./dom.js";
import * as legacyHtml from "./legacyHtml.js";
import * as roleUtils from "./roleUtils.js";

window.HF_UTILS = { ...utils, ...dom, ...legacyHtml };
window.HF_ROLE_UTILS = { ...roleUtils };
