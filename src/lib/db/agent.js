// AI agent conversation history.
import { _client } from "./core.js";

export const saveAgentConversation = async (
  userId,
  message,
  response,
  history,
  sessionId,
) => {
  const sid = sessionId || crypto.randomUUID();
  const { error } = await _client.from("agent_conversations").insert({
    user_id: userId,
    message,
    response,
    full_history: history,
    session_id: sid,
  });
  if (error) return { error: error.message };
  return { success: true, sessionId: sid };
};

export const getAgentConversations = async (userId, limit = 5) => {
  const { data, error } = await _client
    .from("agent_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { data: [] };
  return { data };
};

export const getAgentThread = async (sessionId) => {
  const { data, error } = await _client
    .from("agent_conversations")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) return { data: [] };
  return { data };
};
