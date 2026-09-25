// Imperative DOM helpers. React components should prefer state over these,
// but toast/confetti are fire-and-forget overlays that are fine to call
// from event handlers.

// Inject toast animation
const toastStyle = document.createElement("style");
toastStyle.textContent = `@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`;
document.head.appendChild(toastStyle);

export const el = (id) => document.getElementById(id);

export const showError = (id, msg, timeout = 2000) => {
  const e = el(id);
  if (!e) return;
  e.textContent = msg;
  e.style.display = "block";
  e.classList.add("show");
  if (timeout > 0) {
    setTimeout(() => {
      e.style.display = "none";
      e.textContent = "";
      e.classList.remove("show");
    }, timeout);
  }
};

export const hideError = (id) => {
  const e = el(id);
  if (!e) return;
  e.style.display = "none";
  e.textContent = "";
  e.classList.remove("show");
};

// ─── Toast notification ────────────────────────────────────
export const toast = (msg, type = "success") => {
  // clear any existing toast first
  document.getElementById("hf-toast")?.remove();

  const t = document.createElement("div");
  t.id = "hf-toast";
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);

  setTimeout(() => t.classList.add("toast-show"), 10);
  setTimeout(() => {
    t.classList.remove("toast-show");
    setTimeout(() => t.remove(), 300);
  }, 3000);
};

// ─── Confetti ──────────────────────────────────────────────
export const launchConfetti = () => {
  const colors = ["#C49A0A", "#1a7a2e", "#ffffff", "#185FA5", "#0f0f0d"];

  for (let i = 0; i < 120; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.cssText = `
      position:fixed;top:-10px;
      left:${Math.random() * 100}vw;
      width:${Math.random() * 8 + 4}px;
      height:${Math.random() * 8 + 4}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      z-index:9999;pointer-events:none;
      animation:confettiFall ${Math.random() * 2 + 2}s ease-in forwards;
      animation-delay:${Math.random() * 1.5}s;
      transform:rotate(${Math.random() * 360}deg);
    `;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 4000);
  }

  // store cleanup function globally so navTo can call it
  window._stopConfetti = () => {
    document.querySelectorAll(".confetti-piece").forEach((p) => p.remove());
    window._stopConfetti = null;
  };
};

export const launchEmojiConfetti = (emoji) => {
  const count = 12;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.style.cssText = `
      position: fixed;
      font-size: ${Math.random() * 16 + 14}px;
      left: ${Math.random() * 100}vw;
      bottom: 80px;
      z-index: 9999;
      pointer-events: none;
      transform-origin: center;
      animation: emojiBurst ${Math.random() * 0.8 + 0.6}s ease-out forwards;
      animation-delay: ${Math.random() * 0.3}s;
      opacity: 1;
    `;
    piece.textContent = emoji;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 1500);
  }
};

// ─── Legacy training day picker ────────────────────────────
// Only used by the classic-script dashboards; remove with them.
export const showDayPicker = (dayIndex, specificDate = null) => {
  const picker = document.getElementById("day-picker");
  const label = document.getElementById("day-picker-label");
  const options = document.getElementById("day-picker-options");
  if (!picker || !options) return;

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const types = [
    "Rest",
    "Technical",
    "Tactical",
    "Physical",
    "Recovery",
    "Match",
  ];

  if (label)
    label.textContent = specificDate
      ? `Select session type for ${new Date(specificDate + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}`
      : `Select session type for ${days[dayIndex]}`;

  picker.style.display = "block";

  options.innerHTML = types
    .map(
      (t) => `
    <button class="btn btn-outline btn-sm"
      onclick="window['HF_' + HF_DB.getSession().role.toUpperCase()]?.updateTrainingDay(${dayIndex}, '${t}', ${specificDate ? `'${specificDate}'` : "null"});document.getElementById('day-picker').style.display='none'">
      ${t}
    </button>`,
    )
    .join("");
};
