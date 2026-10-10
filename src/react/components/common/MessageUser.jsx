import { useState } from "react";
import { sendMessage } from "../../../lib/roleUtils.js";
import { fieldStyle } from "./styles.js";
import { navTo } from "../../../lib/router.js";

export default function MessageUser({ toId, toName, backView }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  return (
    <div className="card">
      <div className="card-title">
        <div className="card-dot"></div>Message {toName}
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
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message..."
          style={{ ...fieldStyle, resize: "vertical" }}
        ></textarea>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn btn-primary"
          onClick={() => sendMessage(toId, toName, backView, subject.trim(), body.trim())}
        >
          <i className="ti ti-send"></i> Send message
        </button>
        <button className="btn btn-outline" onClick={() => navTo(backView)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
