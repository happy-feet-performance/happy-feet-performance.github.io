// Exposes src/lib to the classic-script code (js/**) as window.HF_UTILS.
// Module scripts run before DOMContentLoaded, so this is in place before
// HF_ROUTER.boot() renders anything. Classic scripts must therefore only
// touch HF_UTILS inside functions, never at load time.
import * as utils from "./utils.js";
import * as dom from "./dom.js";
import * as legacyHtml from "./legacyHtml.js";

window.HF_UTILS = { ...utils, ...dom, ...legacyHtml };
