export const fieldStyle = {
  padding: "10px 14px",
  background: "var(--bg2)",
  border: "0.5px solid var(--border)",
  color: "var(--text)",
  fontSize: 14,
  width: "100%",
  outline: "none",
  fontFamily: "var(--font)",
};

export const sectionLabelStyle = {
  fontFamily: "var(--font)",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: 8,
};

export const ROLE_COLORS = {
  player: "var(--green)",
  coach: "var(--gold)",
  admin: "var(--red)",
  scout: "var(--blue)",
};

export const TICKET_STATUS = {
  open: { label: "Open", color: "var(--red)" },
  claimed: { label: "In progress", color: "var(--gold)" },
  resolved: { label: "Resolved", color: "var(--green)" },
};
