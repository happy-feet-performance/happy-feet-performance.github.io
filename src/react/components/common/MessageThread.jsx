import { useEffect, useRef, useState } from "react";
import { timeAgo } from "../../../lib/utils.js";
import { launchEmojiConfetti } from "../../../lib/dom.js";
import { isEmojiOnly, sendReply } from "../../../lib/roleUtils.js";

const EMOJIS = [
  "😀", "😂", "😍", "🔥", "👏", "💪", "⚽", "🏆", "🎯", "👊",
  "🙏", "❤️", "😤", "😭", "🤝", "✅", "💯", "🚀", "👋", "😎",
  "🤔", "😅", "🥅", "🎉", "👍", "👎", "❌", "⚡", "🌟", "😴",
];

const EMOJI_SPLIT_RE = /(\p{Emoji_Presentation}|\p{Extended_Pictographic}|❤️|❤)/u;

const pop = (el, scale, ms) => {
  el.style.transform = `scale(${scale})`;
  setTimeout(() => (el.style.transform = "scale(1)"), ms);
};

// Emoji in a message are clickable and burst into confetti.
function MessageBody({ text }) {
  return text.split(EMOJI_SPLIT_RE).map((part, i) =>
    i % 2 === 1 ? (
      <span
        key={i}
        className="emoji-animate"
        style={{ fontSize: "1.3em", cursor: "pointer", display: "inline-block" }}
        onClick={(e) => {
          launchEmojiConfetti(part);
          pop(e.currentTarget, 1.8, 200);
        }}
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export default function MessageThread({ threadId, otherUserId, subject, messages: initial, currentUserId }) {
  const [messages, setMessages] = useState(initial);
  const [reply, setReply] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    const body = reply.trim();
    if (!(await sendReply(otherUserId, subject || "", threadId, body))) return;
    setReply("");
    setMessages((ms) => [
      ...ms,
      { id: `local-${Date.now()}`, from_id: currentUserId, body, created_at: new Date().toISOString() },
    ]);
  };

  const squareBtn = {
    height: 42,
    width: 42,
    minHeight: 42,
    padding: 0,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-md)", marginBottom: "var(--sp-lg)" }}>
        <button className="btn btn-outline btn-sm" onClick={() => window.HF_ROUTER.navTo("messages")}>
          <i className="ti ti-arrow-left"></i> Back
        </button>
        <div
          style={{
            fontFamily: "var(--font-head)",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "var(--text)",
          }}
        >
          {subject || "Conversation"}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          ref={listRef}
          style={{
            padding: "var(--sp-lg)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--sp-md)",
            minHeight: 300,
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          {messages.map((m) => {
            const isMine = m.from_id === currentUserId;
            const emojiOnly = isEmojiOnly(m.body);
            return (
              <div
                key={m.id}
                style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text3)",
                    marginBottom: 3,
                    fontFamily: "var(--font-head)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {isMine ? "You" : m.senderName} · {timeAgo(m.created_at)}
                </div>
                <div
                  style={{
                    maxWidth: "75%",
                    padding: emojiOnly ? 4 : "10px 14px",
                    background: emojiOnly ? "transparent" : isMine ? "var(--gold)" : "var(--bg2)",
                    color: isMine && !emojiOnly ? "#0f0f0d" : "var(--text)",
                    fontSize: emojiOnly ? 32 : 13,
                    lineHeight: 1.5,
                  }}
                >
                  <MessageBody text={m.body} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "var(--sp-md)", borderTop: "0.5px solid var(--border)", background: "var(--bg)" }}>
          {showEmoji && (
            <div
              style={{
                display: "flex",
                padding: "var(--sp-sm)",
                background: "var(--bg2)",
                border: "0.5px solid var(--border)",
                marginBottom: 8,
                flexWrap: "wrap",
                gap: 4,
              }}
            >
              {EMOJIS.map((e) => (
                <span
                  key={e}
                  style={{
                    fontSize: 24,
                    cursor: "pointer",
                    width: 42,
                    height: 42,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.15s ease",
                  }}
                  onMouseOver={(ev) => (ev.currentTarget.style.transform = "scale(1.3)")}
                  onMouseOut={(ev) => (ev.currentTarget.style.transform = "scale(1)")}
                  onClick={(ev) => {
                    setReply((r) => r + e);
                    pop(ev.currentTarget, 1.5, 150);
                  }}
                >
                  {e}
                </span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply..."
              style={{
                flex: 1,
                padding: "0 12px",
                height: 42,
                background: "var(--bg2)",
                border: "0.5px solid var(--border)",
                color: "var(--text)",
                fontSize: 13,
                fontFamily: "var(--font)",
                outline: "none",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button className="btn btn-outline" style={squareBtn} title="Emoji" onClick={() => setShowEmoji((v) => !v)}>
              <i className="ti ti-mood-smile"></i>
            </button>
            <button className="btn btn-primary" style={squareBtn} onClick={send}>
              <i className="ti ti-send"></i>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
