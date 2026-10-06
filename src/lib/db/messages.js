// Direct messages and sender-name lookup.
import { _client } from "./core.js";

export const _nameCache = {};

export const _sendMessage = async (
  fromId,
  toId,
  subject,
  body,
  threadId = null,
  parentId = null,
) => {
  const newThreadId = threadId || crypto.randomUUID();
  const { data, error } = await _client
    .from("messages")
    .insert({
      from_id: fromId,
      to_id: toId,
      subject,
      body,
      read: false,
      thread_id: newThreadId,
      parent_id: parentId || null,
    })
    .select()
    .single();
  if (error) return { error: error.message };
  return { success: true, threadId: newThreadId, messageId: data.id };
};

export const getMessages = async (userId) => {
  const { data, error } = await _client
    .from("messages")
    .select("*")
    .or(`to_id.eq.${userId},from_id.eq.${userId}`)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (error) return { data: [] };

  // deduplicate by thread_id: keep latest per thread in JS
  const seen = new Set();
  const deduped = [];
  for (const m of data) {
    const key = m.thread_id || m.id;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(m);
    }
  }

  return { data: deduped };
};

export const getArchivedMessages = async (userId) => {
  const { data, error } = await _client
    .from("messages")
    .select("*")
    .eq("to_id", userId)
    .eq("archived", true)
    .order("created_at", { ascending: false });
  if (error) return { data: [] };
  return { data };
};

export const getThread = async (threadId, userId) => {
  const { data, error } = await _client
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) return { data: [] };
  return { data };
};

export const getUnreadCount = async (userId) => {
  const { data, error } = await _client
    .from("messages")
    .select("id")
    .eq("to_id", userId)
    .eq("read", false)
    .eq("archived", false);
  if (error) return 0;
  return data?.length || 0;
};

export const archiveMessage = async (messageId) => {
  // get the thread_id for this message first
  const { data: msg } = await _client
    .from("messages")
    .select("thread_id")
    .eq("id", messageId)
    .single();

  if (msg?.thread_id) {
    // archive all messages in the thread
    await _client
      .from("messages")
      .update({ archived: true, read: true })
      .eq("thread_id", msg.thread_id);
  } else {
    // fallback:archive just this message
    await _client
      .from("messages")
      .update({ archived: true, read: true })
      .eq("id", messageId);
  }
};

export const unarchiveMessage = async (messageId) => {
  // get the thread_id for this message first
  const { data: msg } = await _client
    .from("messages")
    .select("thread_id")
    .eq("id", messageId)
    .single();

  if (msg?.thread_id) {
    // unarchive all messages in the thread
    await _client
      .from("messages")
      .update({ archived: false })
      .eq("thread_id", msg.thread_id);
  } else {
    // fallback: unarchive just this message
    await _client
      .from("messages")
      .update({ archived: false })
      .eq("id", messageId);
  }
};

export const markMessageRead = async (messageId) => {
  await _client.from("messages").update({ read: true }).eq("id", messageId);
};

export const getUserNameById = async (userId) => {
  if (!userId) return "HappyFeet";
  if (userId === "system") return "HappyFeet System";
  if (userId === "admin") return "HappyFeet Admin";

  // return cached result if available
  if (_nameCache[userId]) return _nameCache[userId];

  const { data, error } = await _client
    .from("users")
    .select("name")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return "HappyFeet";

  // cache the result
  _nameCache[userId] = data.name;
  return data.name;
};

export const getUserNamesByIds = async (ids) => {
  const uniqueIds = [
    ...new Set(ids.filter((id) => id && id !== "system" && id !== "admin")),
  ];

  // return cached ones immediately
  const result = { system: "HappyFeet System", admin: "HappyFeet Admin" };
  const uncached = uniqueIds.filter((id) => !_nameCache[id]);

  if (uncached.length > 0) {
    const { data } = await _client
      .from("users")
      .select("id, name")
      .in("id", uncached);

    (data || []).forEach((u) => {
      _nameCache[u.id] = u.name;
    });
  }

  uniqueIds.forEach((id) => {
    result[id] = _nameCache[id] || "HappyFeet";
  });

  return result;
};
