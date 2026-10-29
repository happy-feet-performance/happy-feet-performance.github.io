import { useState } from "react";
import VerificationRow from "./VerificationRow.jsx";
import { timeAgo } from "../../../lib/utils.js";
import { Badge } from "../shared/index.js";

function Section({ title, count, color, startOpen = false, children }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <div className="card">
      <div
        className="card-title"
        style={{ cursor: "pointer", justifyContent: "space-between" }}
        onClick={() => setOpen((o) => !o)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
          <div className="card-dot"></div>
          {title}
          <span style={{ color, marginLeft: 4 }}>{count}</span>
        </div>
        <i
          className={`ti ${open ? "ti-chevron-up" : "ti-chevron-down"}`}
          style={{ fontSize: 14, color: "var(--text3)" }}
        ></i>
      </div>
      <div style={{ display: open ? "block" : "none" }}>
        {count === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text2)", fontSize: 13 }}>
            Nothing here yet.
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function VerifiedRow({ v, nameKey }) {
  return (
    <div
      style={{
        padding: "var(--sp-md)",
        background: "var(--bg2)",
        borderLeft: "2px solid var(--green)",
        marginBottom: "var(--sp-sm)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{v[nameKey]}</div>
          <div style={{ fontSize: 11, color: "var(--text2)" }}>
            Verified {v.reviewed_at ? timeAgo(v.reviewed_at) : "-"}
          </div>
        </div>
        <Badge type="green">Verified</Badge>
      </div>
    </div>
  );
}

function RejectedRow({ v, nameKey }) {
  return (
    <div
      style={{
        padding: "var(--sp-md)",
        background: "var(--bg2)",
        borderLeft: "2px solid var(--red)",
        marginBottom: "var(--sp-sm)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{v[nameKey]}</div>
          <div style={{ fontSize: 11, color: "var(--red)" }}>Reason: {v.rejection_reason || "-"}</div>
          <div style={{ fontSize: 11, color: "var(--text3)" }}>
            {timeAgo(v.submitted_at)}
          </div>
        </div>
        <Badge type="red">Rejected</Badge>
      </div>
    </div>
  );
}

// Shared by the "squad-verifications" and "agency-verifications" routes;
// `kind` selects which underlying verification type is being reviewed.
export default function Verifications({ session, kind = "squad", list }) {
  const isSquad = kind === "squad";
  const all = list || [];
  const pending = all.filter((v) => v.status === "pending");
  const verified = all.filter((v) => v.status === "verified");
  const rejected = all.filter((v) => v.status === "rejected");
  const nameKey = isSquad ? "team_name" : "agency_name";
  const color = "var(--gold)";

  return (
    <>
      <div
        style={{
          fontFamily: "var(--font)",
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--text)",
          marginBottom: "var(--sp-lg)",
        }}
      >
        {isSquad ? "Squad" : "Agency"} Verifications
      </div>
      <Section title="Pending" count={pending.length} color={color} startOpen>
        {pending.map((v) => (
          <VerificationRow key={v.id} v={v} type={kind} session={session} />
        ))}
      </Section>
      <Section title="Verified" count={verified.length} color="var(--green)">
        {verified.map((v) => (
          <VerifiedRow key={v.id} v={v} nameKey={nameKey} />
        ))}
      </Section>
      <Section title="Rejected" count={rejected.length} color="var(--red)">
        {rejected.map((v) => (
          <RejectedRow key={v.id} v={v} nameKey={nameKey} />
        ))}
      </Section>
    </>
  );
}
