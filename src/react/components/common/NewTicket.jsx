import { useState } from "react";
import { myTickets, sendTicket } from "../../../lib/roleUtils.js";
import { fieldStyle } from "./styles.js";

const CATEGORIES = [
  ["general", "General inquiry"],
  ["verification", "Verification issue"],
  ["account", "Account issue"],
  ["technical", "Technical problem"],
  ["report", "Report a user"],
  ["other", "Other"],
];

export default function NewTicket({ fromMessages, role }) {
  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const back = () => myTickets(window.HF_DB.getSession(), fromMessages, role);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-md)", marginBottom: "var(--sp-lg)" }}>
        <button className="btn btn-outline btn-sm" onClick={back}>
          <i className="ti ti-arrow-left"></i> My tickets
        </button>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>New support ticket</div>
      </div>
      <div className="card">
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: "var(--sp-lg)" }}>
          Submit a support ticket and an admin will respond shortly.
        </div>
        <div className="fg">
          <label className="required">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={fieldStyle}>
            {CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="fg">
          <label className="required">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief description of your issue"
            style={fieldStyle}
          />
        </div>
        <div className="fg">
          <label className="required">Message</label>
          <textarea
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe your issue in detail..."
            style={{ ...fieldStyle, resize: "vertical" }}
          ></textarea>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-primary"
            onClick={() => sendTicket(fromMessages, role, { category, subject: subject.trim(), body: body.trim() })}
          >
            <i className="ti ti-send"></i> Submit ticket
          </button>
          <button className="btn btn-outline" onClick={back}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
