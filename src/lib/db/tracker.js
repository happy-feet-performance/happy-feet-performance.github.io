// Per-user tracker data.
import { _getData } from "./core.js";

export const getTracker = async (userId) =>
  (await _getData("tracker", userId)) || {};
