// DribbleBot, the AI football assistant: conversation state and actions.
// src/react/agent/AgentPanel.jsx renders it; replies come from the Netlify
// function netlify/functions/chat.js.
import { useSyncExternalStore } from "react";
import * as db from "./db/index.js";

const SYSTEM_PROMPT = `You are DribbleBot, a football expert assistant for the HappyFeet Performance Hub — an athletic performance platform focused on African football, particularly Ghana and West Africa.

    You help players, coaches, and scouts with anything and everything football related.

    IMPORTANT — FORMAT YOUR RESPONSES EXACTLY LIKE THIS:
    - Use SECTION: to start a new section (e.g. "THE BASICS:")
    - Use • for bullet points
    - Keep sentences short and clear
    - End with a FOLLOW UP: section containing one question for the user
    - Never use markdown like ** or # or _
    - Never use emoji except ⚽ at the very end of your response

    Example format:
    Opening sentence about the topic.

    SECTION NAME:
    - Point one
    - Point two

    ANOTHER SECTION:
    - Point one
    - Point two

    FOLLOW UP:
    What aspect interests you most?

    Keep responses concise, practical, and encouraging. You understand African football deeply.`;

const GREETING =
  "Hello! I'm HappyFeet AI ⚽ Ask me anything about football (tactics, training, positions, African leagues, player development, or anything else football related)!";

// ─── State ─────────────────────────────────────────────────
// messages: [{ role: "user" | "agent", text }]
let state = { visible: false, open: false, loading: false, messages: [] };
// what's sent to the model, and the conversation id it's saved under
let history = [];
let sessionId = null;

const listeners = new Set();
const set = (update) => {
  state = { ...state, ...update };
  listeners.forEach((l) => l());
};
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const useAgent = (selector) => useSyncExternalStore(subscribe, () => selector(state));

const addMessage = (role, text) => set({ messages: [...state.messages, { role, text }] });

// greet once per user per day
const greetKey = (userId) => `hf_agent_greeted_${userId}_${new Date().toISOString().split("T")[0]}`;

// ─── Reply formatting ──────────────────────────────────────
const stripMarkdown = (text) =>
  text
    .replace(/\*\*(.*?)\*\*/g, "$1") // remove bold markers
    .replace(/\*(.*?)\*/g, "$1") // remove italic markers
    .replace(/#{1,6}\s+(.*)/g, "$1:") // convert # Header to Header:
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1") // remove code markers
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // remove links
    .replace(/^[-*+]\s/gm, "• ") // convert - item to • item
    .replace(/^\d+\.\s/gm, "• ") // convert 1. item to • item
    .trim();

const formatAgentResponse = (text) =>
  text
    .replace(/[\u{1F1E0}-\u{1F1FF}]{2}/gu, "") // remove flags
    .replace(/\*\*(.*?)\*\*/g, "$1") // remove bold
    .replace(/\*(.*?)\*/g, "$1") // remove italic
    .replace(/#{1,6}\s/g, "") // remove headers
    .replace(/\s*•\s*/g, "\n• ") // normalize bullets
    .replace(/\n{3,}/g, "\n\n")
    .trim();

// Splits a reply into blocks for display:
//   { kind: "gap" | "heading" | "text", text, muted }
//   { kind: "list", items: [text] }
//   { kind: "followUp", items: [block] }   (the FOLLOW UP: section)
export const parseReply = (text) => {
  const blocks = [];
  let list = null;
  let followUp = null;
  const out = () => (followUp ? followUp.items : blocks);

  for (const raw of formatAgentResponse(text).split("\n")) {
    const line = raw.trim();
    if (!line) {
      list = null;
      out().push({ kind: "gap" });
    } else if (line === "FOLLOW UP:") {
      list = null;
      followUp = { kind: "followUp", items: [] };
      blocks.push(followUp);
    } else if (/^[A-Z][A-Z\s]{2,}:$/.test(line)) {
      list = null;
      followUp = null;
      blocks.push({ kind: "heading", text: line.slice(0, -1) });
    } else if (line.startsWith("•")) {
      const item = line.slice(1).trim();
      if (followUp) followUp.items.push({ kind: "bullet", text: item });
      else {
        if (!list) blocks.push((list = { kind: "list", items: [] }));
        list.items.push(item);
      }
    } else {
      list = null;
      out().push({ kind: "text", text: line, muted: !!followUp });
    }
  }
  return blocks;
};

// ─── Actions ───────────────────────────────────────────────
export const toggle = () => {
  const open = !state.open;
  set({ open });
  if (open && history.length === 0) {
    const session = db.getSession();
    const key = greetKey(session?.userId);
    if (!localStorage.getItem(key)) {
      addMessage("agent", GREETING);
      localStorage.setItem(key, "1");
    }
    // start a new conversation
    sessionId = crypto.randomUUID();
  }
};

export const send = async (text) => {
  if (state.loading || !text) return;
  addMessage("user", text);
  history.push({ role: "user", content: text });
  set({ loading: true });

  try {
    const { hostname, protocol } = window.location;
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || protocol === "file:";

    let reply;
    if (isLocal) {
      await new Promise((r) => setTimeout(r, 800));
      reply = "AI agent is only available on the live site. Push to main to test the full AI experience.";
    } else {
      const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: SYSTEM_PROMPT, messages: history }),
      });
      const data = await response.json();
      reply = stripMarkdown(data.content?.map((c) => c.text || "").join("") || "Sorry I could not process that.");
    }

    set({ loading: false });
    addMessage("agent", reply);
    history.push({ role: "assistant", content: reply });

    // save with full history and conversation id
    const session = db.getSession();
    if (session?.userId) {
      const result = await db.saveAgentConversation(session.userId, text, reply, history, sessionId);
      // the first save may assign the id
      if (result.sessionId) sessionId = result.sessionId;
    }

    if (history.length > 20) history = history.slice(-20);
  } catch {
    set({ loading: false });
    addMessage("agent", "Sorry, I had trouble connecting. Please try again.");
  }
};

// Reopen a past conversation (from the dashboard's recent conversations).
export const openConversation = async (id, lastMessage, lastResponse) => {
  set({ open: true, messages: [] });
  sessionId = id;

  const { data: thread } = await db.getAgentThread(id);
  if (thread?.length) {
    // restore the full history from the last exchange
    history = thread[thread.length - 1].full_history || [
      { role: "user", content: lastMessage },
      { role: "assistant", content: lastResponse },
    ];
    set({ messages: thread.flatMap((e) => [{ role: "user", text: e.message }, { role: "agent", text: e.response }]) });
  } else {
    // fall back to the single exchange
    history = [
      { role: "user", content: lastMessage },
      { role: "assistant", content: lastResponse },
    ];
    set({
      messages: [
        { role: "user", text: lastMessage },
        { role: "agent", text: lastResponse },
      ],
    });
  }
};

// Forget the conversation (on logout) so the next user starts fresh.
export const reset = () => {
  const session = db.getSession();
  if (session?.userId) localStorage.removeItem(greetKey(session.userId));
  history = [];
  sessionId = null;
  set({ open: false, loading: false, messages: [] });
};

export const show = () => set({ visible: true });
export const hide = () => set({ visible: false, open: false });
