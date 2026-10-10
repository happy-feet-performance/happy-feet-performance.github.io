// Each role's dashboard module: render(view, session) plus the per-view
// functions the router and roleUtils call to refresh a view (messages,
// training, faith, tickets).
import * as admin from "./admin.js";
import * as coach from "./coach.js";
import * as player from "./player.js";
import * as scout from "./scout.js";

const ROLES = { admin, coach, player, scout };

export const roleModule = (role) => ROLES[role];
