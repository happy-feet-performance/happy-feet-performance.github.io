export default function Reports({ shared }) {
  return (
    <div className="card">
      <div className="card-title">
        <div className="card-dot"></div>Scout reports
      </div>
      {!shared || shared.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32, color: "var(--text2)" }}>
          <i
            className="ti ti-file-text"
            style={{ fontSize: 32, marginBottom: 10, display: "block", color: "var(--text3)" }}
          ></i>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>No reports yet</div>
          <div style={{ fontSize: 13 }}>Share a prospect's report to see it here.</div>
        </div>
      ) : (
        shared.map((sp) => {
          const name = sp.player?.name || "Unknown";
          return (
            <div
              key={sp.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 12,
                background: "var(--bg2)",
                marginBottom: 8,
                borderLeft: "2px solid var(--gold)",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>Shared {window.HF_UTILS.timeAgo(sp.updated_at)}</div>
              </div>
              <span dangerouslySetInnerHTML={{ __html: window.HF_UTILS.badgeHTML("Shared", "gold") }} />
            </div>
          );
        })
      )}
    </div>
  );
}
