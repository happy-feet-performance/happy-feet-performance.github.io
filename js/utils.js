/**
 * HappyFeet Performance Hub: utils.js
 * Shared helper functions used across all modules.
 */

const HF_UTILS = (() => {
  // ─── String helpers ────────────────────────────────────────
  const initials = (name = "") =>
    name
      .split(" ")
      .map((p) => p[0] || "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";

  const age = (dob) => {
    if (!dob) return "-";
    const b = new Date(dob),
      n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--;
    return a;
  };

  const today = () => HF_DB.localDate();

  const timeAgo = (isoStr) => {
    const diff = Date.now() - new Date(isoStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hr ago`;
    return `${Math.floor(h / 24)} days ago`;
  };

  // ─── Colour helpers ────────────────────────────────────────
  const AVATAR_COLORS = [
    "#1a7a2e",
    "#c8102e",
    "#C9961A",
    "#185FA5",
    "#5E35B1",
    "#0F6E56",
    "#993C1D",
    "#854F0B",
  ];
  const avatarColor = (name = "") => {
    let h = 0;
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
    return AVATAR_COLORS[h];
  };

  const ratingColor = (r) =>
    r >= 80 ? "var(--green)" : r >= 65 ? "var(--gold)" : "var(--red)";

  // ─── DOM helpers ───────────────────────────────────────────
  const el = (id) => document.getElementById(id);
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const show = (id) => {
    const e = el(id);
    if (e) e.style.display = "block";
  };
  const hide = (id) => {
    const e = el(id);
    if (e) e.style.display = "none";
  };

  const showError = (id, msg) => {
    const e = el(id);
    if (!e) return;
    e.textContent = msg;
    e.classList.add("show");
  };
  const hideError = (id) => {
    const e = el(id);
    if (e) e.classList.remove("show");
  };

  const setHTML = (id, html) => {
    const e = el(id);
    if (e) e.innerHTML = html;
  };
  const setText = (id, text) => {
    const e = el(id);
    if (e) e.textContent = text;
  };

  // ─── Avatar HTML ───────────────────────────────────────────
  const avatarHTML = (name, size = "md", color = null) => {
    const bg = color || avatarColor(name);
    return `<div class="avatar avatar-${size}" style="background:${bg}">${initials(name)}</div>`;
  };

  // ─── Bar HTML ──────────────────────────────────────────────
  const barHTML = (label, value, color = "var(--gold)") => `
    <div class="bar-row">
      <div class="bar-head">
        <span>${label}</span>
        <span style="font-weight:600;color:${color}">${value}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${value}%;background:${color}"></div>
      </div>
    </div>`;

  // ─── Mini chart HTML ───────────────────────────────────────
  const miniChartHTML = (values) => {
    const max = Math.max(...values, 1);
    return `<div class="mini-chart">${values
      .map((v) => {
        const h = Math.round((v / max) * 48);
        return `<div class="mini-bar" style="height:${Math.max(h, 4)}px;background:${ratingColor(v)}" title="${v}"></div>`;
      })
      .join("")}</div>`;
  };

  // ─── Badge HTML ────────────────────────────────────────────
  const badgeHTML = (text, type = "gold") =>
    `<span class="badge badge-${type}">${text}</span>`;

  // ─── Activity item HTML ────────────────────────────────────
  const activityHTML = (icon, bgColor, title, text, time) => `
    <div class="activity-item">
      <div class="activity-icon" style="background:${bgColor}">${icon}</div>
      <div>
        <div class="activity-title">${title}</div>
        <div class="activity-text">${text}</div>
        <div class="activity-time">${time}</div>
      </div>
    </div>`;

  // ─── Toast notification ────────────────────────────────────
  const toast = (msg, type = "success") => {
    const existing = document.querySelector(".hf-toast");
    if (existing) existing.remove();
    const t = document.createElement("div");
    t.className = "hf-toast";
    t.style.cssText = `
      position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
      padding:10px 20px;border-radius:0;font-size:13px;font-weight:600;
      z-index:9999;color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.2);
      background:${type === "success" ? "var(--green)" : type === "error" ? "var(--red)" : "var(--gold)"};
      animation:toastIn .2s ease;
    `;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  };

  // ─── Country code options ──────────────────────────────────
  const COUNTRY_CODES = [
    { code: "+233", flag: "🇬🇭", name: "Ghana" },
    { code: "+234", flag: "🇳🇬", name: "Nigeria" },
    { code: "+221", flag: "🇸🇳", name: "Senegal" },
    { code: "+225", flag: "🇨🇮", name: "Côte d'Ivoire" },
    { code: "+256", flag: "🇺🇬", name: "Uganda" },
    { code: "+254", flag: "🇰🇪", name: "Kenya" },
    { code: "+27", flag: "🇿🇦", name: "South Africa" },
    { code: "+237", flag: "🇨🇲", name: "Cameroon" },
    { code: "+20", flag: "🇪🇬", name: "Egypt" },
    { code: "+212", flag: "🇲🇦", name: "Morocco" },
    { code: "+1", flag: "🇺🇸", name: "USA / Canada" },
    { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
    { code: "+49", flag: "🇩🇪", name: "Germany" },
    { code: "+31", flag: "🇳🇱", name: "Netherlands" },
  ];

  const countryCodeSelect = (id) =>
    `<select id="${id}" class="country-select">
      ${COUNTRY_CODES.map(
        (c) => `<option value="${c.code}">${c.flag} ${c.code}</option>`,
      ).join("")}
    </select>`;

  const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const messageListHTML = (msgs, role) => {
    if (!msgs || msgs.length === 0) return "";

    const unread = msgs.filter((m) => !m.read);
    const read = msgs.filter((m) => m.read);

    const getSenderLabel = (m) => {
      if (m.senderName) return m.senderName;
      if (!m.from_id || m.from_id === "admin") return "HappyFeet Admin";
      if (!m.from_id || m.from_id === "system") return "HappyFeet System";
      return "HappyFeet";
    };

    const getSenderColor = (fromId) => {
      if (!fromId || fromId === "admin" || fromId === "system")
        return "var(--gold)";
      return "var(--blue)";
    };

    const msgRow = (m) => `
      <div class="msg-item" id="msg-${m.id}" onclick="${
        m.from_id === "admin" || m.from_id === "system"
          ? `HF_${role.toUpperCase()}.readMessage('${m.id}', document.getElementById('msg-${m.id}'))`
          : `HF_${role.toUpperCase()}.viewThread('${m.thread_id || m.id}', '${m.from_id}', '${(m.subject || "").replace(/'/g, "\\'")}')`
      }">
        <div class="avatar avatar-md" style="background:var(--bg2);display:flex;align-items:center;justify-content:center;">
          <i class="ti ti-shield" style="font-size:16px;color:${!m.read ? "var(--gold)" : "var(--text2)"}"></i>
        </div>
        <div style="flex:1">
          <div style="font-size:11px;font-family:var(--font);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--text3);margin-bottom:2px;">
            From: ${m.senderName || (m.from_id === "system" ? "HappyFeet System" : m.from_id === "admin" ? "HappyFeet Admin" : "HappyFeet")}
          </div>
          <div class="msg-name">${m.subject || "Message"}</div>
          <div class="msg-preview">${m.body}</div>
          <div class="msg-time">${HF_UTILS.timeAgo(m.created_at)}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
          ${!m.read ? `<div class="msg-unread" id="badge-${m.id}">1</div>` : ""}
          <button class="btn btn-outline btn-sm" style="font-size:10px;padding:2px 8px;"
            title="Archive message"
            onclick="event.stopPropagation();HF_${role.toUpperCase()}.archiveMessage('${m.id}', this)">
            <i class="ti ti-archive"></i>
          </button>
          <button class="btn btn-outline btn-sm" style="font-size:10px;padding:2px 8px;"
            title="More options"
            onclick="event.stopPropagation();HF_${role.toUpperCase()}.toggleMsgActions('${m.id}', '${m.from_id}', '${(m.senderName || "HappyFeet").replace(/'/g, "\\'")}')">
            <i class="ti ti-dots-vertical"></i>
          </button>
        </div>
      </div>
      <div id="msg-actions-${m.id}" style="display:none;padding:var(--sp-sm);background:var(--bg2);border-left:2px solid var(--border);margin-bottom:4px;">
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${
            m.from_id && m.from_id !== "admin" && m.from_id !== "system"
              ? `
            <button class="btn btn-outline btn-sm" onclick="HF_${role.toUpperCase()}.viewThread('${m.thread_id || m.id}', '${m.from_id}', '${(m.subject || "").replace(/'/g, "\\'")}')">
              <i class="ti ti-arrow-back-up"></i> Reply
            </button>
            <button class="btn btn-outline btn-sm" onclick="HF_${role.toUpperCase()}.viewSenderProfile('${m.from_id}')">
              <i class="ti ti-user"></i> View profile
            </button>
            <button class="btn btn-danger btn-sm" onclick="HF_${role.toUpperCase()}.reportToAdmin('${m.from_id}', '${(m.senderName || "").replace(/'/g, "\\'")}')">
              <i class="ti ti-flag"></i> Report
            </button>`
              : `
            <div style="font-size:12px;color:var(--text2);padding:4px">
              <i class="ti ti-info-circle" style="margin-right:4px"></i>
              System message: no actions available.
            </div>`
          }
        </div>
      </div>`;

    return `
    ${
      unread.length > 0
        ? `
      <div style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--red);margin-bottom:8px;">
        Unread (${unread.length})
      </div>
      ${unread.map(msgRow).join("")}
      <div style="height:1px;background:var(--border);margin:var(--sp-md) 0;"></div>`
        : ""
    }

    ${
      read.length > 0
        ? `
      <div style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text3);margin-bottom:8px;">
        Read (${read.length})
      </div>
      ${read.map(msgRow).join("")}`
        : ""
    }`;
  };

  const isNewUser = (session) => {
    if (!session?.created) return false;
    const created = new Date(session.created);
    const now = new Date();
    return now - created < 5 * 60 * 1000;
  };

  const replyToMessage = (messageId, fromId, senderName, subject, threadId) => {
    if (!fromId || fromId === "admin" || fromId === "system") {
      HF_UTILS.toast(
        "You cannot reply to system messages directly. Use Contact Admin instead.",
        "error",
      );
      return;
    }
    viewThread(threadId, fromId, subject);
  };

  const launchConfetti = () => {
    const colors = ["#C49A0A", "#1a7a2e", "#ffffff", "#185FA5", "#0f0f0d"];
    const pieces = [];

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
      pieces.push(piece);
      setTimeout(() => piece.remove(), 4000);
    }

    // store cleanup function globally so navTo can call it
    window._stopConfetti = () => {
      document.querySelectorAll(".confetti-piece").forEach((p) => p.remove());
      window._stopConfetti = null;
    };
  };

  const launchEmojiConfetti = (emoji) => {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("div");
      const rotation = Math.random() * 60 - 30;
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

  const miniCalendarHTML = (logs, colorFn) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const monthName = today.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
    const todayDate = today.getDate();
    const todayStr = today.toISOString().split("T")[0];

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + (6 - today.getDay()));

    const logDates = new Set(
      (logs || []).map(
        (l) => l.date?.split("T")[0] || l.created_at?.split("T")[0],
      ),
    );
    const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    let cells = "";
    for (let i = 0; i < firstDay; i++) cells += "<div></div>";

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const hasLog = logDates.has(dateStr);
      const isToday = d === todayDate;
      const isFuture = date > today;
      const isThisWeek = date >= weekStart && date <= weekEnd;
      const color = hasLog
        ? colorFn
          ? colorFn(dateStr)
          : "var(--blue)"
        : "transparent";

      cells += `
      <div title="${dateStr}" style="
        height:32px;
        display:flex;align-items:center;justify-content:center;
        flex-direction:column;gap:2px;
        font-size:12px;
        font-weight:${isToday ? "700" : "400"};
        color:${isFuture ? "var(--text3)" : hasLog ? "#fff" : isThisWeek ? "var(--text)" : "var(--text2)"};
        background:${hasLog ? color : isThisWeek && !isFuture ? "var(--bg2)" : "transparent"};
        opacity:${isFuture ? 0.35 : 1};
        position:relative;
      ">
        ${d}
        ${isToday ? `<div style="width:4px;height:4px;border-radius:50%;background:${hasLog ? "#fff" : "var(--gold)"};position:absolute;bottom:4px;"></div>` : ""}
      </div>`;
    }

    return `
    <div style="font-family:var(--font);font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--text2);margin-bottom:var(--sp-sm);">
      ${monthName}
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px;">
      ${days
        .map(
          (d) => `
        <div style="text-align:center;font-size:9px;font-weight:700;color:var(--text3);font-family:var(--font);letter-spacing:0.06em;text-transform:uppercase;padding:4px 0;">
          ${d}
        </div>`,
        )
        .join("")}
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">
      ${cells}
    </div>`;
  };

  const viewProfile = async (userId, backFn) => {
    const { data: user } = await HF_DB.getUserById(userId);
    if (!user) {
      toast("User not found.", "error");
      return;
    }

    const p = user.profile || {};
    const role = user.role;
    const overall = p.ratings
      ? Math.round(
          (p.ratings.speed + p.ratings.tech + p.ratings.tact + p.ratings.phys) /
            4,
        )
      : null;

    const sections = {
      player: `
      <div class="info-grid">
        ${p.pos ? `<div class="info-cell"><div class="info-label">Position</div><div class="info-val">${p.pos}</div></div>` : ""}
        ${p.tier ? `<div class="info-cell"><div class="info-label">Tier</div><div class="info-val">${p.tier}</div></div>` : ""}
        ${p.hometown ? `<div class="info-cell"><div class="info-label">Hometown</div><div class="info-val">${p.hometown}</div></div>` : ""}
        ${p.club ? `<div class="info-cell"><div class="info-label">Club</div><div class="info-val">${p.club}</div></div>` : ""}
      </div>
      ${
        overall !== null
          ? `
        <div class="card" style="margin-top:var(--sp-md);">
          <div class="card-title"><div class="card-dot"></div>Performance ratings</div>
          <div class="metrics-grid" style="grid-template-columns:repeat(4,1fr)">
            ${["speed", "tech", "tact", "phys"]
              .map(
                (k) => `
              <div class="metric-card">
                <div class="metric-val" style="color:var(--gold)">${p.ratings[k]}</div>
                <div class="metric-label">${{ speed: "Speed", tech: "Technical", tact: "Tactical", phys: "Physical" }[k]}</div>
              </div>`,
              )
              .join("")}
          </div>
        </div>`
          : ""
      }
      <div class="card" style="margin-top:var(--sp-md);">
        <div class="card-title" style="justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:var(--sp-sm);">
            <div class="card-dot"></div>Highlight reel
          </div>
          <span style="font-family:var(--font);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:2px 6px;background:rgba(196,154,10,.15);color:var(--gold);">Coming soon</span>
        </div>
        <div style="text-align:center;padding:32px;background:var(--bg2);border:0.5px dashed var(--border);">
          <i class="ti ti-video" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No highlights yet</div>
          <div style="font-size:13px;color:var(--text2)">This player hasn't uploaded any highlights yet.</div>
        </div>
      </div>`,
      coach: `
      <div class="info-grid">
        ${p.spec ? `<div class="info-cell"><div class="info-label">Specialisation</div><div class="info-val">${p.spec}</div></div>` : ""}
        ${p.licence ? `<div class="info-cell"><div class="info-label">Licence</div><div class="info-val">${p.licence}</div></div>` : ""}
        ${p.club ? `<div class="info-cell"><div class="info-label">Club</div><div class="info-val">${p.club}</div></div>` : ""}
        ${p.exp ? `<div class="info-cell"><div class="info-label">Experience</div><div class="info-val">${p.exp} years</div></div>` : ""}
      </div>`,
      scout: `
      <div class="info-grid">
        ${p.org ? `<div class="info-cell"><div class="info-label">Agency</div><div class="info-val">${p.org}</div></div>` : ""}
        ${p.region ? `<div class="info-cell"><div class="info-label">Home region</div><div class="info-val">${p.region}</div></div>` : ""}
        ${p.regionsCovered ? `<div class="info-cell"><div class="info-label">Regions covered</div><div class="info-val">${Array.isArray(p.regionsCovered) ? p.regionsCovered.join(", ") : p.regionsCovered}</div></div>` : ""}
        ${p.targetLeagues ? `<div class="info-cell"><div class="info-label">Target leagues</div><div class="info-val">${Array.isArray(p.targetLeagues) ? p.targetLeagues.join(", ") : p.targetLeagues}</div></div>` : ""}
        ${p.exp ? `<div class="info-cell"><div class="info-label">Experience</div><div class="info-val">${p.exp} years</div></div>` : ""}
      </div>`,
    };

    return `
    <div style="background:#0f0f0d;padding:var(--sp-2xl);margin-bottom:var(--sp-lg);display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-lg);">
      <div style="display:flex;align-items:center;gap:var(--sp-lg);">
        <div style="width:72px;height:72px;background:${role === "player" ? "var(--green)" : role === "coach" ? "var(--gold)" : role === "admin" ? "var(--red)" : "var(--blue)"};display:flex;align-items:center;justify-content:center;font-family:var(--font);font-size:26px;font-weight:700;color:#fff;">
          ${HF_UTILS.initials(user.name)}
        </div>
        <div>
          <div style="font-family:var(--font);font-size:22px;font-weight:700;color:#fff;">${user.name}</div>
          <div style="font-size:13px;color:rgba(255,255,255,.55);margin-top:2px;">${p.pos || p.spec || p.org || "-"}</div>
          <div style="margin-top:8px;">${badgeHTML(role, role === "player" ? "green" : role === "coach" ? "gold" : "blue")}</div>
        </div>
      </div>
      ${
        overall !== null
          ? `
        <div style="text-align:right;">
          <div style="font-family:var(--font);font-size:42px;font-weight:700;color:var(--gold)">${overall}%</div>
          <div style="font-size:10px;color:rgba(255,255,255,.4);font-family:var(--font);text-transform:uppercase;letter-spacing:0.1em">Overall</div>
        </div>`
          : ""
      }
    </div>
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Profile details</div>
      ${sections[role] || ""}
    </div>
    ${backFn ? `<button class="btn btn-outline" onclick="${backFn}" style="margin-top:8px"><i class="ti ti-arrow-left"></i> Back</button>` : ""}`;
  };

  return {
    initials,
    age,
    today,
    timeAgo,
    avatarColor,
    ratingColor,
    el,
    qs,
    qsa,
    show,
    hide,
    showError,
    hideError,
    setHTML,
    setText,
    avatarHTML,
    barHTML,
    miniChartHTML,
    miniCalendarHTML,
    badgeHTML,
    activityHTML,
    toast,
    COUNTRY_CODES,
    countryCodeSelect,
    hashPassword,
    messageListHTML,
    isNewUser,
    launchConfetti,
    launchEmojiConfetti,
    viewProfile,
  };
})();

// Inject toast animation
const _toastStyle = document.createElement("style");
_toastStyle.textContent = `@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`;
document.head.appendChild(_toastStyle);

window.HF_UTILS = HF_UTILS;
