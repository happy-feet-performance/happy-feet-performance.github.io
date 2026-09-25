export default function CoachResubmitSquad({ session }) {
  const p = session.profile || {};
  const squadStatus = session.squadStatus || "unregistered";
  const isFirstTime = squadStatus === "unregistered";

  return (
    <div className="auth-card" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="auth-title">
        {isFirstTime ? "Register your squad" : "Resubmit squad registration"}
      </div>
      <div className="auth-sub">
        {isFirstTime
          ? "Tell us about your team so we can verify it"
          : "Update your team details for verification"}
      </div>
      <div className="error-box" id="resubmit-err"></div>
      <div className="fg">
        <label className="required">Team name</label>
        <input
          type="text"
          id="rs-team"
          defaultValue={p.club || ""}
          placeholder="e.g. Kumasi Academy FC"
          style={{
            padding: "10px 14px",
            background: "var(--bg2)",
            border: "0.5px solid var(--border)",
            color: "var(--text)",
            fontSize: 14,
            width: "100%",
            outline: "none",
            fontFamily: "var(--font)",
          }}
        />
      </div>
      <div className="fg">
        <label className="required">League / division</label>
        <input
          type="text"
          id="rs-league"
          placeholder="e.g. Ghana Premier League"
          style={{
            padding: "10px 14px",
            background: "var(--bg2)",
            border: "0.5px solid var(--border)",
            color: "var(--text)",
            fontSize: 14,
            width: "100%",
            outline: "none",
            fontFamily: "var(--font)",
          }}
        />
      </div>
      <div className="form-row">
        <div className="fg">
          <label>Founding year</label>
          <input
            type="number"
            id="rs-year"
            placeholder="e.g. 2005"
            min="1600"
            style={{
              padding: "10px 14px",
              background: "var(--bg2)",
              border: "0.5px solid var(--border)",
              color: "var(--text)",
              fontSize: 14,
              width: "100%",
              outline: "none",
              fontFamily: "var(--font)",
            }}
          />
        </div>
        <div className="fg">
          <label>Home ground</label>
          <input
            type="text"
            id="rs-ground"
            placeholder="e.g. Baba Yara Stadium"
            style={{
              padding: "10px 14px",
              background: "var(--bg2)",
              border: "0.5px solid var(--border)",
              color: "var(--text)",
              fontSize: 14,
              width: "100%",
              outline: "none",
              fontFamily: "var(--font)",
            }}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: "var(--sp-md)", alignItems: "center" }}>
        <button className="btn btn-primary btn-sm" onClick={() => window.HF_COACH.submitResubmission()}>
          <i className="ti ti-send"></i> {isFirstTime ? "Submit for verification" : "Resubmit for verification"}
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => window.HF_ROUTER.navTo("dashboard")}>
          Cancel
        </button>
      </div>
    </div>
  );
}
