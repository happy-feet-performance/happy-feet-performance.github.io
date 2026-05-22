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

  const showError = (id, msg, timeout = 2000) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    if (timeout > 0) {
      setTimeout(() => {
        el.style.display = "none";
        el.textContent = "";
      }, timeout);
    }
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
  const avatarHTML = (name, avatarUrl, size = "md", color = "var(--gold)") => {
    const sizes = { sm: "32px", md: "40px", lg: "56px", xl: "72px" };
    const px = sizes[size] || sizes.md;
    const font = { sm: "12px", md: "14px", lg: "20px", xl: "26px" };
    const fs = font[size] || font.md;
    const url = avatarUrl ? `${avatarUrl}?cb=${Date.now()}` : null;

    if (url) {
      return `<div style="width:${px};height:${px};flex-shrink:0;overflow:hidden;">
      <img src="${url}" alt="${name}" 
        style="width:100%;height:100%;object-fit:cover;"
        onerror="this.parentElement.innerHTML='${HF_UTILS.initials(name)}'">
    </div>`;
    }

    return `<div style="width:${px};height:${px};background:${color};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${fs};color:#fff;flex-shrink:0;">
    ${initials(name)}
  </div>`;
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
            ? `HF_ROLE_UTILS.readMessage('${m.id}', document.getElementById('msg-${m.id}'), '${role}')`
            : `HF_ROLE_UTILS.viewThread('${m.thread_id || m.id}', '${m.from_id}', '${(m.subject || "").replace(/'/g, "\\'")}', '${role}')`
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
              onclick="event.stopPropagation();HF_ROLE_UTILS.archiveMessage('${m.id}', this, '${role}')">
              <i class="ti ti-archive"></i>
            </button>
            <button class="btn btn-outline btn-sm" style="font-size:10px;padding:2px 8px;"
              title="More options"
              onclick="event.stopPropagation();HF_ROLE_UTILS.toggleMsgActions('${m.id}')">
              <i class="ti ti-dots-vertical"></i>
            </button>
          </div>
        </div>
        <div id="msg-actions-${m.id}" style="display:none;padding:var(--sp-sm);background:var(--bg2);border-left:2px solid var(--border);margin-bottom:4px;">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${
              m.from_id && m.from_id !== "admin" && m.from_id !== "system"
                ? `
              <button class="btn btn-outline btn-sm" onclick="HF_ROLE_UTILS.viewThread('${m.thread_id || m.id}', '${m.from_id}', '${(m.subject || "").replace(/'/g, "\\'")}', '${role}')">
                <i class="ti ti-arrow-back-up"></i> Reply
              </button>
              <button class="btn btn-outline btn-sm" onclick="HF_ROLE_UTILS.viewSenderProfile('${m.from_id}', '${role}', 'messages')">
                <i class="ti ti-user"></i> View profile
              </button>
              <button class="btn btn-danger btn-sm" onclick="HF_ROLE_UTILS.reportToAdmin('${m.from_id}', '${(m.senderName || "").replace(/'/g, "\\'")}', '${role}')">
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
    // new user if no login streak or streak is 1 and last login is today
    return (
      !session.profile?.lastLoginDate ||
      session.profile?.loginStreak === undefined
    );
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
        color:${isFuture ? "var(--text3)" : hasLog ? "#fff" : "var(--text2)"};
        background:${hasLog ? color : "transparent"};
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

  const calcRating = (r) => {
    if (!r || (!r.speed && !r.tech && !r.tact && !r.phys)) return null;
    return Math.round((r.speed + r.tech + r.tact + r.phys) / 4);
  };

  const getDateForDay = (dayIndex) => {
    const now = new Date();
    const today = now.getDay();
    const diff = dayIndex - today;
    const date = new Date(now);
    date.setDate(now.getDate() + diff);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const getDateForDayISO = (dayIndex) => {
    const now = new Date();
    const today = now.getDay();
    const diff = dayIndex - today;
    const date = new Date(now);
    date.setDate(now.getDate() + diff);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const showDayPicker = (dayIndex, specificDate = null) => {
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

  return {
    initials,
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
    isNewUser,
    toast,
    COUNTRY_CODES,
    countryCodeSelect,
    hashPassword,
    messageListHTML,
    isNewUser,
    launchConfetti,
    launchEmojiConfetti,
    calcRating,
    getDateForDay,
    getDateForDayISO,
    showDayPicker,
  };
})();

// Inject toast animation
const _toastStyle = document.createElement("style");
_toastStyle.textContent = `@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`;
document.head.appendChild(_toastStyle);

window.HF_UTILS = HF_UTILS;
