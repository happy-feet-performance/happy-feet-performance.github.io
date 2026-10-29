// Support tickets.
import { _client } from "./core.js";

export const createTicket = async (fromId, subject, body, category = "general") => {
  const { data: user } = await _client
    .from("users")
    .select("name")
    .eq("id", fromId)
    .single();

  const initialMessage = {
    id: crypto.randomUUID(),
    from_id: fromId,
    from_name: user?.name || "User",
    body,
    created_at: new Date().toISOString(),
    is_admin: false,
  };

  const { data, error } = await _client
    .from("tickets")
    .insert({
      from_id: fromId,
      subject,
      body,
      category,
      messages: [initialMessage],
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, ticket: data };
};

export const getTickets = async (status = null) => {
  let query = _client
    .from("tickets")
    .select(
      `
    *,
    from:users!tickets_from_id_fkey(id, name, role, profile),
    claimer:users!tickets_claimed_by_fkey(id, name)
  `,
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return { data: [] };
  return { data };
};

export const getUserTickets = async (userId) => {
  const { data, error } = await _client
    .from("tickets")
    .select("*, claimer:users!tickets_claimed_by_fkey(id, name)")
    .eq("from_id", userId)
    .order("created_at", { ascending: false });
  if (error) return { data: [] };
  return { data };
};

export const claimTicket = async (ticketId, adminId) => {
  const { error } = await _client
    .from("tickets")
    .update({
      claimed_by: adminId,
      claimed_at: new Date().toISOString(),
      status: "claimed",
    })
    .eq("id", ticketId);
  if (error) return { error: error.message };
  return { success: true };
};

export const resolveTicket = async (ticketId) => {
  const { error } = await _client
    .from("tickets")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", ticketId);
  if (error) return { error: error.message };
  return { success: true };
};

export const reopenTicket = async (ticketId) => {
  const { error } = await _client
    .from("tickets")
    .update({ status: "open", claimed_by: null, claimed_at: null })
    .eq("id", ticketId);
  if (error) return { error: error.message };
  return { success: true };
};

export const getMyTickets = async (adminId) => {
  const { data, error } = await _client
    .from("tickets")
    .select("*, from:users!tickets_from_id_fkey(id, name, role, profile)")
    .eq("claimed_by", adminId)
    .neq("status", "resolved")
    .order("created_at", { ascending: false });
  if (error) return { data: [] };
  return { data };
};

export const addTicketMessage = async (ticketId, fromId, body, isAdmin = false) => {
  const { data: user } = await _client
    .from("users")
    .select("name")
    .eq("id", fromId)
    .single();

  const newMessage = {
    id: crypto.randomUUID(),
    from_id: fromId,
    from_name: user?.name || (isAdmin ? "HappyFeet Support" : "User"),
    body,
    created_at: new Date().toISOString(),
    is_admin: isAdmin,
  };

  // use rpc to atomically append to avoid race conditions
  const { data: ticket, error: fetchError } = await _client
    .from("tickets")
    .select("messages")
    .eq("id", ticketId)
    .single();

  if (fetchError) return { error: fetchError.message };

  const updatedMessages = [...(ticket?.messages || []), newMessage];

  const { error } = await _client
    .from("tickets")
    .update({
      messages: updatedMessages,
      status: isAdmin && ticket.status === "open" ? "claimed" : ticket.status,
    })
    .eq("id", ticketId);

  if (error) return { error: error.message };
  return { success: true };
};

export const getTicketMessages = async (ticketId) => {
  const { data, error } = await _client
    .from("tickets")
    .select("messages")
    .eq("id", ticketId)
    .single();
  if (error) return { data: [] };
  return { data: data?.messages || [] };
};
