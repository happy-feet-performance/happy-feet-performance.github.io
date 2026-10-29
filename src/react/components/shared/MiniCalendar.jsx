const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const toDateStr = (year, month, d) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

// Current-month calendar with logged days filled in. `colorFn(dateStr)`
// picks the fill colour for a logged day; defaults to blue.
export default function MiniCalendar({ logs, colorFn }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = today.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const todayDate = today.getDate();

  const logDates = new Set(
    (logs || []).map((l) => l.date?.split("T")[0] || l.created_at?.split("T")[0]),
  );

  const blanks = Array.from({ length: firstDay }, (_, i) => <div key={`blank-${i}`}></div>);
  const cells = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const date = new Date(year, month, d);
    const dateStr = toDateStr(year, month, d);
    const hasLog = logDates.has(dateStr);
    const isToday = d === todayDate;
    const isFuture = date > today;
    const color = hasLog ? (colorFn ? colorFn(dateStr) : "var(--blue)") : "transparent";

    return (
      <div
        key={dateStr}
        title={dateStr}
        style={{
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
          fontSize: 12,
          fontWeight: isToday ? 700 : 400,
          color: isFuture ? "var(--text3)" : hasLog ? "#fff" : "var(--text2)",
          background: color,
          opacity: isFuture ? 0.35 : 1,
          position: "relative",
        }}
      >
        {d}
        {isToday && (
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: hasLog ? "#fff" : "var(--gold)",
              position: "absolute",
              bottom: 4,
            }}
          ></div>
        )}
      </div>
    );
  });

  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--text2)",
          marginBottom: "var(--sp-sm)",
        }}
      >
        {monthName}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 9,
              fontWeight: 700,
              color: "var(--text3)",
              fontFamily: "var(--font)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "4px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {blanks}
        {cells}
      </div>
    </div>
  );
}
