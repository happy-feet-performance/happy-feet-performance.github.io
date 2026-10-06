// Realtime subscriptions.
import { _client } from "./core.js";

export const subscribeToMessages = (userId, callback) => {
  return _client
    .channel(`realtime-messages-${userId}-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `to_id=eq.${userId}`,
      },
      (payload) => callback(payload.new),
    )
    .subscribe();
};

export const subscribeToUserStatus = (userId, callback) => {
  return _client
    .channel(`realtime-user-status-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "users",
        filter: `id=eq.${userId}`,
      },
      (payload) => callback(payload.new),
    )
    .subscribe();
};

export const subscribeToVerifications = (type = "squad", callback) => {
  const table =
    type === "squad" ? "squad_verifications" : "agency_verifications";
  return _client
    .channel(
      `realtime-${type}-verifications-${Math.random().toString(36).slice(2)}`,
    )
    .on("postgres_changes", { event: "*", schema: "public", table }, callback)
    .subscribe();
};

export const subscribeToTickets = (callback) => {
  const channel = _client
    .channel(`realtime-tickets-admin`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "tickets" },
      (payload) => {
        callback({ ...payload, eventType: "INSERT" });
      },
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "tickets" },
      (payload) => {
        callback({ ...payload, eventType: "UPDATE" });
      },
    )
    .subscribe();
  return channel;
};

export const subscribeToUserTickets = (userId, callback) => {
  return _client
    .channel(`realtime-user-tickets-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "tickets",
        filter: `from_id=eq.${userId}`,
      },
      callback,
    )
    .subscribe();
};

export const subscribeToMatchRequests = (coachId, callback) => {
  return _client
    .channel(`match-requests-${coachId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "matches",
        filter: `opponent_coach_id=eq.${coachId}`,
      },
      callback,
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "matches",
        filter: `opponent_coach_id=eq.${coachId}`,
      },
      callback,
    )
    .subscribe();
};

export const subscribeToCoachTraining = (coachId, callback) => {
  return _client
    .channel(`training-${coachId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "training",
        filter: `user_id=eq.${coachId}`,
      },
      callback,
    )
    .subscribe();
};

export const removeAllChannels = () => {
  _client.removeAllChannels();
};
