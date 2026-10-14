import { useEffect, useRef, useState } from "react";
import * as agent from "../../lib/agent.js";

function Bullet({ text }) {
  return (
    <div className="ai-reply-bullet">
      <span>•</span>
      <span>{text}</span>
    </div>
  );
}

function Block({ block }) {
  switch (block.kind) {
    case "gap":
      return <div className="ai-reply-gap"></div>;
    case "heading":
      return <div className="ai-reply-heading">{block.text}</div>;
    case "bullet":
      return <Bullet text={block.text} />;
    case "list":
      return (
        <div className="ai-reply-list">
          {block.items.map((item, i) => (
            <Bullet key={i} text={item} />
          ))}
        </div>
      );
    case "followUp":
      return (
        <div className="ai-reply-followup">
          {block.items.map((b, i) => (
            <Block key={i} block={b} />
          ))}
        </div>
      );
    default:
      return <div className={`ai-reply-text${block.muted ? " muted" : ""}`}>{block.text}</div>;
  }
}

// An agent reply, laid out from its SECTION:/• /FOLLOW UP: structure.
function AgentReply({ text }) {
  return agent.parseReply(text).map((block, i) => <Block key={i} block={block} />);
}

// DribbleBot: the floating button and chat panel (state in src/lib/agent.js).
export default function AgentPanel() {
  const visible = agent.useAgent((s) => s.visible);
  const open = agent.useAgent((s) => s.open);
  const loading = agent.useAgent((s) => s.loading);
  const messages = agent.useAgent((s) => s.messages);
  const [text, setText] = useState("");
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = () => {
    const t = text.trim();
    if (!t || loading) return;
    setText("");
    agent.send(t);
  };

  return (
    <>
      <button className="ai-agent-btn" style={{ display: visible ? "flex" : "none" }} onClick={agent.toggle}>
        <i className="ti ti-ball-football ai-agent-btn-icon"></i>
      </button>

      <div className="ai-agent-panel" style={{ display: open ? "flex" : "none" }}>
        <div className="ai-agent-header">
          <div className="ai-agent-header-row">
            <div className="ai-agent-avatar">
              <i className="ti ti-ball-football ai-agent-avatar-icon"></i>
            </div>
            <div>
              <div className="ai-agent-header-title">DribbleBot</div>
              <div className="ai-agent-header-subtitle">Ask me anything football</div>
            </div>
          </div>
          <button className="ai-agent-close" onClick={agent.toggle}>
            <i className="ti ti-x"></i>
          </button>
        </div>

        <div className="ai-agent-messages" ref={listRef}>
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="ai-msg-user">
                {m.text}
              </div>
            ) : (
              <div key={i} className="ai-msg-agent">
                <AgentReply text={m.text} />
              </div>
            ),
          )}
          {loading && (
            <div className="ai-msg-agent ai-thinking">
              DribbleBot is thinking
              <span className="ai-msg-typing">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          )}
        </div>

        <div className="ai-agent-input-row">
          <input
            ref={inputRef}
            type="text"
            className="ai-agent-input"
            placeholder="Ask about football..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <button className="ai-agent-send-btn" onClick={submit}>
            <i className="ti ti-send ai-agent-send-icon"></i>
          </button>
        </div>
      </div>
    </>
  );
}
