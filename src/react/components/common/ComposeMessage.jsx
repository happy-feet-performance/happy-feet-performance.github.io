import { useRef, useState } from "react";
import { initials } from "../../../lib/utils.js";
import { searchRecipients, sendComposedMessage } from "../../../lib/roleUtils.js";
import { fieldStyle, ROLE_COLORS } from "./styles.js";
import { navTo } from "../../../lib/router.js";

export default function ComposeMessage() {
  const [recipients, setRecipients] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const searchRef = useRef(null);
  const latestQuery = useRef("");

  const search = async (value) => {
    setQuery(value);
    latestQuery.current = value;
    if (value.length < 2) return setResults([]);
    const data = await searchRecipients(value);
    // ignore responses for queries the user has already typed past
    if (latestQuery.current !== value) return;
    setResults(data);
  };

  const addRecipient = (u) => {
    setRecipients((rs) => (rs.some((r) => r.id === u.id) ? rs : [...rs, { id: u.id, name: u.name, role: u.role }]));
    setQuery("");
    setResults([]);
    searchRef.current?.focus();
  };

  const visibleResults = results.filter((u) => !recipients.some((r) => r.id === u.id));

  return (
    <div className="card">
      <div className="card-title">
        <div className="card-dot"></div>New message
      </div>
      <div className="fg">
        <label className="required">To</label>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            padding: 8,
            background: "var(--bg2)",
            border: "0.5px solid var(--border)",
            minHeight: 44,
            cursor: "text",
          }}
          onClick={() => searchRef.current?.focus()}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {recipients.map((r) => (
              <div
                key={r.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  background: "var(--gold)",
                  color: "#0f0f0d",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "var(--font)",
                }}
              >
                {r.name}
                <span
                  style={{ cursor: "pointer", fontSize: 14, fontWeight: 700 }}
                  onClick={() => setRecipients((rs) => rs.filter((x) => x.id !== r.id))}
                >
                  ×
                </span>
              </div>
            ))}
          </div>
          <input
            ref={searchRef}
            type="text"
            value={query}
            placeholder="Search by name or email..."
            onChange={(e) => search(e.target.value)}
            style={{
              flex: 1,
              minWidth: 150,
              border: "none",
              background: "transparent",
              color: "var(--text)",
              fontSize: 13,
              fontFamily: "var(--font)",
              outline: "none",
              padding: "2px 4px",
            }}
          />
        </div>
        {visibleResults.length > 0 && (
          <div style={{ marginTop: 2, border: "0.5px solid var(--border)", background: "var(--bg)" }}>
            {visibleResults.map((u) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-md)",
                  padding: 10,
                  cursor: "pointer",
                  borderBottom: "0.5px solid var(--border)",
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addRecipient(u);
                }}
              >
                <div className="avatar avatar-sm" style={{ background: ROLE_COLORS[u.role] || "var(--blue)" }}>
                  {initials(u.name)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>{u.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="fg">
        <label className="required">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Message subject"
          style={fieldStyle}
        />
      </div>
      <div className="fg">
        <label className="required">Message</label>
        <textarea
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message..."
          style={{ ...fieldStyle, resize: "vertical" }}
        ></textarea>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" onClick={() => sendComposedMessage(recipients, subject.trim(), body.trim())}>
          <i className="ti ti-send"></i> Send
        </button>
        <button className="btn btn-outline" onClick={() => navTo("messages")}>
          Cancel
        </button>
      </div>
    </div>
  );
}
