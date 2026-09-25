export default function PlayerHighlights({ session: s }) {
  return (
    <div className="card">
      <div className="card-title">
        <div className="card-dot"></div>My highlights
      </div>
      <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text2)" }}>
        <i
          className="ti ti-video"
          style={{ fontSize: 48, marginBottom: 12, display: "block", color: "var(--text3)" }}
        ></i>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
          Upload your highlights
        </div>
        <div style={{ fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
          Share clips of your best moments.
          <br />
          Coaches and scouts can see your game.
        </div>
        <button
          className="btn btn-primary"
          onClick={() => window.HF_UTILS.toast("Video upload coming in the next version!", "success")}
        >
          <i className="ti ti-upload"></i> Upload video clip
        </button>
      </div>
    </div>
  );
}
