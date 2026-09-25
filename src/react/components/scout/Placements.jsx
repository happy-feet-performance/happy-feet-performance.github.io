export default function Placements({ placed }) {
  const list = placed || [];
  return (
    <div className="card">
      <div className="card-title">
        <div className="card-dot"></div>Placements
      </div>
      {list.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32, color: "var(--text2)" }}>
          <i
            className="ti ti-circle-check"
            style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--text3)" }}
          ></i>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>No placements yet</div>
          <div style={{ fontSize: 13 }}>Players you mark as placed will appear here.</div>
        </div>
      ) : (
        list.map((sp) => {
          const name = sp.player?.name || "Unknown";
          return (
            <div
              key={sp.id}
              style={{ padding: 12, background: "var(--bg2)", borderLeft: "2px solid var(--green)", marginBottom: 8 }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>Placed {window.HF_UTILS.timeAgo(sp.updated_at)}</div>
            </div>
          );
        })
      )}
      <div style={{ display: "flex", gap: 24, paddingTop: 12, borderTop: "0.5px solid var(--border)", marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--green)" }}>{list.length}</div>
          <div style={{ fontSize: 10, color: "var(--text2)", textTransform: "uppercase", fontFamily: "var(--font)", letterSpacing: "0.08em" }}>
            Total placements
          </div>
        </div>
      </div>
    </div>
  );
}
