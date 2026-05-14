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
    if (!dob) return "—";
    const b = new Date(dob),
      n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--;
    return a;
  };

  const today = () => new Date().toISOString().split("T")[0];

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
    badgeHTML,
    activityHTML,
    toast,
    COUNTRY_CODES,
    countryCodeSelect,
    hashPassword,
  };
})();

// Inject toast animation
const _toastStyle = document.createElement("style");
_toastStyle.textContent = `@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`;
document.head.appendChild(_toastStyle);

window.HF_UTILS = HF_UTILS;
